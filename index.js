'use strict';

let Response = require('./lib/response');

/**
 * Cloudhopper class
 */
class Cloudhopper {
  /**
   * hello
   */
  constructor() {
    //
  }

  /**
   * set any function to be executed when a new lambda invocation
   * is created. Use this to run some initilization
   * @param {function} initFunction
   */
  setInit(initFunction) {
    this.dockerInit = initFunction;
  };

  /**
   * Set the router to be used.
   * Use a non-express router to keep dependencies
   * to a minimum. `npm i router` works flawless
   *
   * @param {Router} router create a new Router() and pass it here
   */
  use(router) {
    this.router = router;
  };

  /**
   * Use this function to handle events not coming from url
   * @param {funciton} f if no routes match, this is executed
   */
  setFallback(f) {
    this.fallBack = f;
  };

  /**
   * This is the main handler function
   * Set this with `export.handler = cloudhopper.handler`
   * Do not worry about the arguments, aws will provide them
   *
   * @param {Object} event
   * @param {Object} context
   * @param {function} callback
   */
  handler(event, context, callback) {
    if (!event.requestContext && !event.path) {
      console.log('event.url is not available, hence just executing');
      if (this.fallBack) {
        this.fallBack(event, context, callback);
      } else {
        console.log('fallback not available');
      }
      return;
    }

    // process request params
    let req = event;
    if (event.requestContext) {
      req = {
        body: event.body,
        url: event.path,
        path: event.path,
        method: event.httpMethod,
        ip: event.requestContext.identity.sourceIp,
        headers: event.headers,
        protocol: 'https',
        query: event.queryStringParameters,
      };
    }
    let res = new Response(context, callback, req);

    if (req.body !== '' && typeof(req.body) !== 'object' ) {
      req.body = JSON.parse(req.body);
    }

    if (!this.dockerInitState) {
      this.dockerInitState = true;
      if (this.dockerInit) this.dockerInit();
    }

    this.router(req, res, function(err) {
      if (err) {
        console.error('router error handle ', err.mesage, err.stack);
        res.status(500).json({
          message: `Application Error: ${err.message}`,
        });
        return;
      }
      res.status(404).json({
        message: 'Not Found',
      });
    });
  };
}

export {Cloudhopper, Response};
