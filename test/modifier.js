require("rootpath")();
// var _ = require("lodash");
var rewire = require("rewire");
var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var expect = chai.expect;

chai.should();
chai.use(sinonChai);

var proxyModifier = rewire("src/modifier");

describe("WCMProxyHelper -- UNIT -- Modifier |", function() {

	describe("tryCatchOptimizer |", function() {
		var tcOptimizer = proxyModifier.__get__("tryCatchOptimizer");
		var finallyFn = sinon.spy();
		var errorFn = sinon.spy();

		it("Should call finally function on success", function() {

			tcOptimizer(function() {
				return "success";
			}, errorFn, finallyFn);

			errorFn.should.not.have.been.called;
			finallyFn.should.have.been.called;
		});

		it("Should call error and finally function on error", function() {

			tcOptimizer(function() {
				throw "some error";
			}, errorFn, finallyFn);

			errorFn.should.have.been.calledWith("some error");
			finallyFn.should.have.been.called;
		});

		it("Should not call error function when none is passed", function() {

			tcOptimizer(function() {
				throw "some error";
			}, null, finallyFn);


			finallyFn.should.have.been.called;
		});

		it("Should not catch errors but handle a situtation where no valid error or finally function is passed", function() {

			tcOptimizer(function() {
				throw "some error";
			}, null, null);
		});
	});

	describe("transformer |", function() {
		var stringModifierFn;
		var jsonModifierFn;
		var errorModifierFn;
		var transformer = proxyModifier.__get__("transformer");
		var mockData = { "test": "some test property value" };
		var requestMockCreator = function(url) {
			return {
				url: url,
			};
		};
		var responseMockCreator = function(getReturn) {
			return {
				get: function() {
					return getReturn;
				},
			};
		};

		beforeEach(function() {
			stringModifierFn = sinon.spy(function(data) {
				return data + "_added";
			});
			jsonModifierFn = sinon.spy(function(data) {
				data.added = true;

				return data;
			});
			errorModifierFn = sinon.spy(function() {
				throw "Error";
			});
		});

		it("Should return original data when not matched", function() {
			var result = transformer(
				"\/nomatch*.",
				stringModifierFn,
				JSON.stringify(mockData),
				requestMockCreator("/some-url/url"),
				{}
			);

			expect(result).to.equal(JSON.stringify(mockData));
			stringModifierFn.should.not.have.been.called;
		});

		it("Should call modifier function with non modified data if content-type is not 'application/json'", function() {
			var stringifiedMockData = JSON.stringify(mockData);
			var request = requestMockCreator("/match/url?hello=somehello");
			var response = responseMockCreator("Some other content-type");
			var result = transformer(
				"\/match*.",
				stringModifierFn,
				JSON.stringify(mockData),
				request,
				response
			);

			expect(result).to.equal(stringifiedMockData + "_added");
			stringModifierFn.should.have.been.calledWithExactly(stringifiedMockData, request, response);
		});

		it("Should call modifier with json parsed data if content-type is 'application/json'", function() {
			var expectedResult = Object.assign({}, mockData, { added: true });
			var request = requestMockCreator("/match/url?hello=somehello");
			var response = responseMockCreator("application/json; utf-8");
			var result = transformer(
				"\/match*.",
				jsonModifierFn,
				JSON.stringify(mockData),
				request,
				response
			);

			expect(result).to.equal(JSON.stringify(expectedResult));
			// Expected result because sinon does not snapshot the params :'(
			jsonModifierFn.should.have.been.calledWithExactly(expectedResult, request, response);
			jsonModifierFn.should.have.returned(expectedResult);
		});

		it("Should call modifier but return original data on modifier error", function() {
			var expectedResult = Object.assign({}, mockData);
			var request = requestMockCreator("/match/url?hello=somehello");
			var response = responseMockCreator("application/json; utf-8");
			var result = transformer(
				"\/match*.",
				errorModifierFn,
				JSON.stringify(mockData),
				request,
				response
			);

			expect(result).to.equal(JSON.stringify(expectedResult));
			errorModifierFn.should.have.thrown("Error");
		});
	});

	describe("Main |", function() {
		var proxyResponseTransformerFn;
		var transformerSpy;
		var originalTransformer;

		before(function() {
			proxyResponseTransformerFn = sinon.spy(function(cb) {
				return cb;
			});
			proxyModifier.__set__("proxyResponseTransformer", proxyResponseTransformerFn);
			originalTransformer = proxyModifier.__get__("transformer");
			transformerSpy = sinon.spy(proxyModifier.__get__("transformer"));
			proxyModifier.__set__("transformer", transformerSpy);
		});

		it("Should return a transformer function", function() {
			var modifier = function(data) {
				return data;
			};
			var resultFn = proxyModifier("/main*.", modifier);
			var middlewareResult = resultFn({ test: "test" }, { req: true, url: "" }, { res:true });

			expect(resultFn).to.be.an("function");
			expect(middlewareResult).to.be.an("object");
			expect(middlewareResult.test).to.eq("test");
			transformerSpy.should.have.been.calledWith(new RegExp("/main*.", "gi"), modifier);
		});

		after(function() {
			proxyModifier.__set__("transformer", originalTransformer);
		});
	});

});

