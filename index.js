var proxy = require("./src/proxy");
var modifier = require("./src/modifier");

function main(app, params) {
	proxy.createWCMProxyRoutes(app, params);
}

main.addProxyRoute = proxy.addProxyRoute;
main.responseModifier = modifier;

module.exports = main;
