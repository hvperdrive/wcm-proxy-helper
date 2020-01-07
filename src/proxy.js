var path = require("path");
var urlJoin = require("url-join");
var cloneDeep = require("lodash.clonedeep");
var get = require("lodash.get");
var merge = require("lodash.merge");
var proxy = require("http-proxy").createProxyServer({});

var throwInvalidConfigError = function() {
	throw {
		err: "Config not valid!",
		message: "Please verify if the config passed is valid. Read de docs for more information",
	};
};

// Default proxy fallback
var fallback = function fallback(target) {
	return function(err, req, res) {
		return res.status(500).json({
			err: "Error while proxing to " + target,
		});
	};
};

var checkConfig = function(config) {
	if (!config.target) {
		throwInvalidConfigError();
	}
};

// Generate final config based on received config
var generateConfig = function generateConfig(config, onlyUsePrefix) {
	checkConfig(config);

	var prefix = config.prefix || "/proxy";

	prefix = path.posix.resolve("/", prefix);

	var routes = [{
		target: "",
		route: prefix,
	}];

	if (!onlyUsePrefix) {
		routes.push({
			target: "files/",
			route: [
				"/files",
				"/file",
				prefix + "/files",
				prefix + "/file",
				"/api/1.0.0/files",
				"/api/1.0.0/file",
			],
		});
	}

	// Allow dynamic config headers based on request an response context
	if (typeof config.headers === "function") {
		config.headerFn = config.headers;
		config.headers = {};
	}

	return {
		headerFn: config.headerFn,
		target: urlJoin(config.target || "", "/"),
		changeOrigin: true,
		headers: merge({}, {
			host: config.host ? urlJoin(config.host, "/") : undefined,
			apikey: config.apikey,
			tenant: config.tenant,
		}, config.headers),
		routes: routes,
	};
};

// Convert function params to generalized config
var convertParams = function convertParams(app, target, apikey, tenant, host) {
	if (!target || !apikey || !tenant) {
		throwInvalidConfigError();
	}

	return {
		target: target,
		host: host,
		apikey: apikey,
		tenant: tenant,
	};
};

// Proxy functionality
var proxyMiddleware = function proxyMiddleware(config, route) {
	var headerFn = config.headerFn;
	var proxyConf;

	config.target += get(route, "target", "");

	delete config.routes;
	delete config.headerFn;

	return function(req, res) {
		// Exec header function if there is one
		if (headerFn) {
			proxyConf = merge({}, config, { headers: headerFn(req, res) });
		} else {
			proxyConf = config;
		}

		return proxy.web(req, res, proxyConf, fallback);
	};
};

module.exports.createWCMProxyRoutes = function createWCMProxyRoutes(app, params) {
	// Get function arguments
	var args = [].slice.call(arguments);
	// Convert params to params object if there are more then 2
	var c = args.length > 2 || typeof args[1] === "string" ? convertParams.apply(args[0], args) : params;

	// Generate final config
	var config = generateConfig(c);

	// Setup proxy for every default WCM route.
	for (var i = 0; i < config.routes.length; i++) {
		app.use(config.routes[i].route, proxyMiddleware(cloneDeep(config), config.routes[i]));
	}
};

module.exports.addProxyRoute = function addProxyRoute(app, routes, proxyConfig) {
	if (!app || !routes || !proxyConfig) {
		throwInvalidConfigError();
	}

	app.use(routes, proxyMiddleware(generateConfig(proxyConfig, true)));
};
