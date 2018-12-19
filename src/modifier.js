var proxyResponseTransformer = require("transformer-proxy");

var tryCatchOptimizer = function tryCatchOptimizer(fn, errorFn, finallyFn) {
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

var transformer = function transformer(regex, modifier, data, req, res) {
	if (!req.url.match(regex)) {
		return data;
	}

	if (res.get("Content-Type").indexOf("application/json") === -1) {
		return modifier(data, req, res);
	}

	var newData = null;

	tryCatchOptimizer(
		function fn() {
			newData = JSON.stringify(modifier(JSON.parse(data), req, res));
		},
		function errorFn(exeption) {
			console.error("Failed to execute modifier. Original data returned..."); // eslint-disable-line no-console
			console.error("error: ", exeption); // eslint-disable-line no-console
		}
	);

	return newData || data;
};

module.exports = function(pattern, modifier) {
	return proxyResponseTransformer(function(data, req, res) {
		return transformer(new RegExp(pattern, "gi"), modifier, data, req, res);
	});
};
