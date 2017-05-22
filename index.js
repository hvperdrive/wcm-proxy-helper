"use strict";

require("rootpath")();
var proxy = require("http-proxy").createProxyServer({});

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

var simple = function simple(target, apikey, tenant, host) {
     var proxyOptions = {
        target: target,
        changeOrigin: true,
        headers: {
            host: host,
            apikey: apikey,
            tenant: tenant
        }
    };

    return function(req, res) {
        proxy.web(req, res, proxyOptions, fallback(target));
    };
};

var advanced = function advanced(config) {

    if(!checkConfig(config)) {
        return function (req, res, next) {
            fallback();
        };
    }

    return function(req, res) {
        proxy.web(req, res, config, fallback(config.target));
    };
};

module.exports = function () {
    if (arguments.length >4) {
        simple.apply(arguments);
    } else {
        advanced.apply(arguments);
    }
};
