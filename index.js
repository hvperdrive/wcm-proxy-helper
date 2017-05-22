"use strict";

require("rootpath")();
var cloneDeep = require("lodash.cloneDeep");
var get = require("lodash.get");
var merge = require("lodash.merge");
var proxy = require("http-proxy").createProxyServer({});

var generateConfig = function generateConfig(config) {
	var suffix = config.suffix || "/proxy";

	return {
		target: config.target,
		changeOrigin: true,
		headers: merge({},
			{
				host: config.host,
				apikey: config.apikey,
				tenant: config.tenant
			},
			config.headers
		),
		routes: [
			{
				target: "",
				route: suffix
			},
			{
				target: "files/",
				route: [
					"/files",
					"/file",
					"/" + suffix + "/files",
					"/" + suffix +"/file",
					"/api/1.0.0/files",
					"/api/1.0.0/file"
				]
			}
		]
	};
};

var checkConfig = function checkConfig(config) {
	return config && config.target instanceof String;
};

var fallback = function fallback(target) {
    return function(err, req, res) {
        return res.status(500).json({
            err: "Error while proxing to " + target
        });
    };
};

var convertParams = function convertParams(app, target, apikey, tenant, host, suffix) {
     return {
        target: target,
		host: host,
		apikey: apikey,
		tenant: tenant
    };
};

var proxyMiddleware = function(config, route) {
	config.target += get(route, "target", "");
	delete config.routes;

	return function(req, res, next) {
		return proxy.web(req, res, config, fallback);
	};
};

var main = function main(app, params) {
	var c;
	var args = [].slice.call(arguments);

    if (args.length >= 4) {
        c = convertParams.apply(args[0], args);
    } else {
		c = params;
	}

	var config = generateConfig(c);

	for (var i = 0; i < config.routes.length; i++) {
		app.use(config.routes[i].route, proxyMiddleware(cloneDeep(config), config.routes[i]));
	}
};

main.addProxyRoute = function(app, routes, proxyConfig) {
	app.use(routes, proxyMiddleware(cloneDeep(generateConfig(proxyConfig))));
};

module.exports = main;
