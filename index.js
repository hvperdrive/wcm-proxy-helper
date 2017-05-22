"use strict";

require("rootpath")();
var merge = require("lodash.merge");
var proxy = require("http-proxy").createProxyServer({});

var generateConfig = function generateConfig(config) {
	var suffix = config.suffix || "proxy";

	merge({},
		{
			options: {
				changeOrigin: true
			},
			routes: [
				{
					target: "files/",
					route: "suffix"
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
		},
		config
	);
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

var generateConfig = function generateConfig(app, target, apikey, tenant, host) {
     return {
        target: target,
        changeOrigin: true,
        headers: {
            host: host,
            apikey: apikey,
            tenant: tenant
        }
    };
};

var proxyMiddleware = function(config, route) {
	return function(req, res, next) {
		delete config.routes;

		return proxy.web(req, res, config, fallback);
	};
};

module.exports = function (app, params) {
	var c;

    if (arguments.length >= 4) {
        c = generateConfig.apply(arguments);
    } else {
		c = params;
	}

	var config = generateConfig(c);

	for (var i = 0; i < config.routes.length; i++) {
		app.use(config.routes[i].routes, proxyMiddleware(config, config.routes[i]));
	}
};
