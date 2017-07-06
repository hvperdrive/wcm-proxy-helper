var proxyResponseTransformer = require("transformer-proxy");
var minimatch = require("minimatch");

var tryCatchOptimizer = function(fn, errorFn, finallyFn) {
	try {
		fn();
	} catch (exception) {
		if (typeof errorFn === "function") {
			errorFn(exception);
		}
	} finally {
		if (typeof finallyFn === "function") {
			finallyFn();
		}
	}
};

var transformer = function transformer(globPattern, modifier, data, req, res) {
	if (!minimatch(req.url, globPattern)) {
		return data;
	}

	if (res.get("Content-Type").indexOf("application/json") === -1) {
		return modifier(data);
	}

	var newData = null;

	tryCatchOptimizer(function fn() {
		newData = JSON.stringify(modifier(JSON.parse(data), req, res));
	});

	return newData || data;
};

module.exports = function(globPattern, modifier) {
	return function responseMiddleware(req, res, next) {
		(
			proxyResponseTransformer(function(data, req, res) {
				return transformer(globPattern, modifier, data, req, res);
			})
		)(req, res, next);
	};
};
