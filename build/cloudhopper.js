(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("cloudhopper", [], factory);
	else if(typeof exports === 'object')
		exports["cloudhopper"] = factory();
	else
		root["cloudhopper"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Response = __webpack_require__(1);

	/**
	 * Cloudhopper class
	 */

	var Cloudhopper = function () {
	  /**
	   * hello
	   */
	  function Cloudhopper() {
	    _classCallCheck(this, Cloudhopper);
	  }
	  //


	  /**
	   * set any function to be executed when a new lambda invocation
	   * is created. Use this to run some initilization
	   * @param {function} initFunction
	   */


	  _createClass(Cloudhopper, [{
	    key: 'setInit',
	    value: function setInit(initFunction) {
	      this.dockerInit = initFunction;
	    }
	  }, {
	    key: 'use',


	    /**
	     * Set the router to be used.
	     * Use a non-express router to keep dependencies
	     * to a minimum. `npm i router` works flawless
	     *
	     * @param {Router} router create a new Router() and pass it here
	     */
	    value: function use(router) {
	      this.router = router;
	    }
	  }, {
	    key: 'setFallback',


	    /**
	     * Use this function to handle events not coming from url
	     * @param {funciton} f if no routes match, this is executed
	     */
	    value: function setFallback(f) {
	      this.falBack = f;
	    }
	  }, {
	    key: 'handler',


	    /**
	     * This is the main handler function
	     * Set this with `export.handler = cloudhopper.handler`
	     * Do not worry about the arguments, aws will provide them
	     *
	     * @param {Object} event
	     * @param {Object} context
	     * @param {function} callback
	     */
	    value: function handler(event, context, callback) {
	      if (!event.requestContext && !event.path) {
	        console.log('event.url is not available, hence just executing');
	        if (this.fallBack) {
	          this.fallBack(event, context, callback);
	        }
	        return;
	      }

	      var res = new Response(context, callback);

	      // process request params
	      var req = event;
	      if (event.requestContext) {
	        req = {
	          body: event.body,
	          url: event.path,
	          path: event.path,
	          method: event.httpMethod,
	          ip: event.requestContext.identity.sourceIp,
	          headers: event.headers,
	          protocol: 'https',
	          query: event.queryStringParameters
	        };
	      }
	      if (req.body !== '') {
	        console.log(event.body);
	        req.body = JSON.parse(req.body);
	      }

	      if (!this.dockerInitState) {
	        this.dockerInitState = true;
	        if (this.dockerInit) this.dockerInit();
	      }

	      this.router(req, res, function (err) {
	        if (err) {
	          console.log(err);
	          res.status(500).json({
	            message: 'Application Error: ' + err.message
	          });
	          return;
	        }
	        res.status(404).json({
	          message: 'Not Found'
	        });
	      });
	    }
	  }]);

	  return Cloudhopper;
	}();

	exports.default = Cloudhopper;

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var dockerInitTime = new Date().getTime();
	var dockerCounter = 0;

	/**
	 * a virtual response object to emulate express response class
	 */

	var Response = function () {

		/**
	  * just create an empty but loaded entity
	  * @param {Object} context
	  * @param {function} callback
	  */
		function Response(context, callback) {
			_classCallCheck(this, Response);

			this.initTime = new Date().getTime();
			this.context = context;
			this.callback = callback;
			this.responseBody = '';
			this.headers = {};
			this.statusCode = 200;
			this.isSent = false;
		}

		/**
	  * set a http status code for the response
	  * @param {int} code
	  * @return {Response} gets the modified response object back
	  */


		_createClass(Response, [{
			key: 'status',
			value: function status(code) {
				this.statusCode = parseInt(code);
				return this;
			}

			/**
	   * returns a json with 200 or a previously set code
	   * @param {Object} data which will be serialized into a JSON.stringify
	   */

		}, {
			key: 'json',
			value: function json(data) {
				this.responseBody = JSON.stringify(data);
				this.end();
			}

			/**
	   * returns a 500 error to the client, only the message property will
	   * be sent to the browser. rest should be logged
	   * @param {Object} err object
	   */

		}, {
			key: 'error',
			value: function error(err) {
				this.statusCode = 500;
				this.responseBody = JSON.stringify({
					message: 'Error: ' + err.message
				});
				this.end();
			}

			/**
	   * send a redirect location header to the client
	   * @param {int} code HTTP status to be returned
	   * @param {string} url the value of the location header
	   */

		}, {
			key: 'redirect',
			value: function redirect(code, url) {
				this.statusCode = parseInt(code);
				this.headers.Location = url;
				this.end();
			}

			/**
	   * Ends the client connection and send across the prepared
	   * response.
	   */

		}, {
			key: 'end',
			value: function end() {
				if (this.isSent) {
					return;
				}
				this.isSent = true;
				this.context.callbackWaitsForEmptyEventLoop = false;
				this.headers.dockerInitTime = dockerInitTime;
				this.headers.dockerCounter = ++dockerCounter;
				this.headers.Server = 'CloudHopper 1.0';
				this.headers.requestTime = new Date().getTime() - this.initTime;
				var responseData = {
					statusCode: this.statusCode,
					headers: this.headers,
					body: this.responseBody
				};
				this.callback(null, responseData);
			}
		}]);

		return Response;
	}();

	module.exports = Response;

/***/ }
/******/ ])
});
;