require("rootpath")();
var _ = require("lodash");
var rewire = require("rewire");
var expect = require("chai").expect;

var proxyHelper = rewire("src/proxy");

describe("WCMProxyHelper -- UNIT -- Proxy |", function() {
	var target = "https://sometarget.com";
	var host = "https://host.com";
	var apikey = "someApikey";
	var tenant = "someTenant";
	var prefix = "prefix";
	var responseMock = {
		status: function() {
			return {
				json: function(data) {
					return data;
				},
			};
		},
	};
	var proxyMock = {
		web: function(req, res, config, fallback) {
			return {
				req: req,
				res: res,
				config: config,
				fallback: fallback,
			};
		},
	};

	proxyHelper.__set__({ proxy: proxyMock });

	describe("Fallback |", function() {

		it("Should return a fallback function", function() {
			var fbCreator = proxyHelper.__get__("fallback");

			expect(fbCreator).to.be.an("function");

			var fb = fbCreator(_.clone(target));

			expect(fb).to.be.an("function");

			var fbCalledResult = fb(null, null, responseMock);

			expect(fbCalledResult).to.be.an("object");
			expect(fbCalledResult.err).to.equal("Error while proxing to " + target);

		});

	});

	describe("GenerateConfig |", function() {
		it("Should return valid config with all wcm routes", function() {
			var generateConfig = proxyHelper.__get__("generateConfig");

			expect(generateConfig).to.be.an("function");

			var result = generateConfig({
				prefix: _.clone(prefix),
				target: _.clone(target),
				host: _.clone(host),
				apikey: _.clone(apikey),
				tenant: _.clone(tenant),
				headers: {
					extraheader: true,
				},
			});


			expect(result).to.be.an("object");
			expect(result.target).to.equal(target + "/");
			expect(result.changeOrigin).to.equal(true);
			expect(result.headers).to.be.an("object");
			expect(result.headers.host).to.equal(host + "/");
			expect(result.headers.apikey).to.equal(apikey);
			expect(result.headers.extraheader).to.equal(true);
			expect(result.routes).to.be.an("array").and.to.have.length(2);
			expect(result.routes[0]).to.be.an("object");
			expect(result.routes[0].target).to.equal("");
			expect(result.routes[0].route).to.equal("/" + prefix);
			expect(result.routes[1]).to.be.an("object");
			expect(result.routes[1].target).to.equal("files/");
			expect(result.routes[1].route).to.be.an("array").and.to.have.length(6);
		});

		it("Should return valid config with only the prefix route", function() {
			var generateConfig = proxyHelper.__get__("generateConfig");

			expect(generateConfig).to.be.an("function");

			var result = generateConfig({
				prefix: _.clone(prefix),
				target: _.clone(target),
				host: _.clone(host),
				apikey: _.clone(apikey),
				tenant: _.clone(tenant),
				headers: {
					extraheader: true,
				},
			}, true);


			expect(result).to.be.an("object");
			expect(result.target).to.equal(target + "/");
			expect(result.changeOrigin).to.equal(true);
			expect(result.headers).to.be.an("object");
			expect(result.headers.host).to.equal(host + "/");
			expect(result.headers.apikey).to.equal(apikey);
			expect(result.headers.extraheader).to.equal(true);
			expect(result.routes).to.be.an("array").and.to.have.length(1);
			expect(result.routes[0]).to.be.an("object");
			expect(result.routes[0].target).to.equal("");
			expect(result.routes[0].route).to.equal("/" + prefix);
		});

		it("should fail when no target is passed", function() {
			var generateConfig = proxyHelper.__get__("generateConfig");

			expect(generateConfig).to.be.an("function");

			var expectation = expect(function() {
				generateConfig({});
			}).throw();

			expectation.with.property("err");
			expectation.with.property("message");
		});
	});

	describe("ConvertParams |", function() {

		it("Should convertParams to an object", function() {
			var convertParams = proxyHelper.__get__("convertParams");

			expect(convertParams).to.be.an("function");

			var result = convertParams({},
				_.clone(target),
				_.clone(apikey),
				_.clone(tenant),
				_.clone(host)
			);

			expect(result).to.be.an("object");
			expect(result.target).to.equal(target);
			expect(result.host).to.equal(host);
			expect(result.apikey).to.equal(apikey);
			expect(result.tenant).to.equal(tenant);
		});

		it("Should error when not enough params passed", function() {
			var convertParams = proxyHelper.__get__("convertParams");

			expect(convertParams).to.be.an("function");

			var funcToError = function() {
				convertParams({},
					_.clone(target),
					_.clone(apikey)
				);
			};

			expect(funcToError).to.throw();
		});

	});

	describe("ProxyMiddleware |", function() {

		it("Should setup a proxy route", function() {
			var proxyMiddleware = proxyHelper.__get__("proxyMiddleware");

			expect(proxyMiddleware).to.be.an("function");

			var proxyFunction = proxyMiddleware(
				{ target: target, routes: [] },
				{ target: "/target-route" }
			);
			var result = proxyFunction("req", "res");

			expect(result).to.be.an("object");
			expect(result.config).to.be.an("object");
			expect(result.config.target).to.equal(target + "/target-route");
			expect(result.req).to.equal("req");
			expect(result.res).to.equal("res");
			expect(result.fallback).to.an("function");
		});

	});

	describe("createWCMProxyRoutes |", function() {
		var main = proxyHelper.createWCMProxyRoutes;
		var appMock = {
			arr: [],
		};

		appMock.use =  function(route, result) {
			appMock.arr.push({
				route: route,
				result: result("req", "res"),
			});
		};

		beforeEach(function() {
			appMock.arr = [];
		});

		it("Should add all routes when correct params are passed", function() {
			main(appMock, _.clone(target), _.clone(apikey), _.clone(tenant), _.clone(host));

			expect(appMock.arr).to.be.an("array").and.to.have.length(2);
			expect(appMock.arr[0]).to.be.an("object");
			expect(appMock.arr[0].route).to.equal("/proxy");
			expect(appMock.arr[0].result)
				.to.be.an("object")
				.and.to.contain.all.keys(["config", "req", "res", "fallback"]);
			expect(appMock.arr[0]).to.be.an("object");
			expect(appMock.arr[0].route).to.have.length(6);
			expect(appMock.arr[0].result)
				.to.be.an("object")
				.and.to.contain.all.keys(["config", "req", "res", "fallback"]);

		});

		it("Should add all routes when second param is an object", function() {
			main(appMock, {
				target: _.clone(target),
				apikey: _.clone(apikey),
				tenant: _.clone(tenant),
				host: _.clone(host),
			});

			expect(appMock.arr).to.be.an("array").and.to.have.length(2);
			expect(appMock.arr[0]).to.be.an("object");
			expect(appMock.arr[0].route).to.equal("/proxy");
			expect(appMock.arr[0].result)
				.to.be.an("object")
				.and.to.contain.all.keys(["config", "req", "res", "fallback"]);
			expect(appMock.arr[1]).to.be.an("object");
			expect(appMock.arr[1].route).to.have.length(6);
			expect(appMock.arr[1].result)
				.to.be.an("object")
				.and.to.contain.all.keys(["config", "req", "res", "fallback"]);

		});

		it("Should fail when not all params are correct", function() {
			var mainToFail = function() {
				main(appMock, _.clone(target), _.clone(apikey));
			};

			expect(mainToFail).to.throw();
		});

		it("Should fail when not config object is not correct", function() {
			var mainToFail = function() {
				main(appMock, {});
			};

			expect(mainToFail).to.throw();
		});
	});

	describe("Add proxy route", function() {
		var main = proxyHelper;
		var appMock = {
			arr: [],
		};

		appMock.use =  function(route, result) {
			appMock.arr.push({
				route: route,
				result: result("req", "res"),
			});
		};

		beforeEach(function() {
			appMock.arr = [];
		});

		it("Should add a custom route", function() {
			main.addProxyRoute(appMock, ["/customroute1", "/customRoute2"], {
				headers: {
					someHeader: true,
				},
				target: target,
			});

			expect(appMock.arr).to.be.an("array").to.have.length(1);
			expect(appMock.arr[0]).to.be.an("object");
			expect(appMock.arr[0].route).to.be.an("array");
			expect(appMock.arr[0].route[0]).to.equal("/customroute1");
			expect(appMock.arr[0].result)
				.to.be.an("object")
				.and.to.contain.all.keys(["config", "req", "res", "fallback"]);
		});

		it("should fail to add a custom route when no target is set", function() {
			var funcToFail = function() {
				main.addProxyRoute(appMock, ["/customroute1", "/customRoute2"], {
					headers: {
						someHeader: true,
					},
				});
			};

			expect(funcToFail).to.throw();
		});

		it("should fail to add a custom route when no route is set", function() {
			var funcToFail = function() {
				main.addProxyRoute(appMock, null, {
					headers: {
						someHeader: true,
					},
				});
			};

			expect(funcToFail).to.throw();
		});

		it("should fail to add a custom route when no app is passed", function() {
			var funcToFail = function() {
				main.addProxyRoute(null, ["/customroute1", "/customRoute2"], {
					headers: {
						someHeader: true,
					},
				});
			};

			expect(funcToFail).to.throw();
		});

		it("should fail to add a custom route when no app is passed", function() {
			var funcToFail = function() {
				main.addProxyRoute(appMock, ["/customroute1", "/customRoute2"], null);
			};

			expect(funcToFail).to.throw();
		});
	});
});

