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

    if (process.env.NODE_ENV === 'local' && !global.isCommand) {
      if (this.dockerInit) this.dockerInit();
      let express = require('express');
      let app = express();
      let bodyParser = require('body-parser');
      app.use(bodyParser.json());
      app.use('/', router);

      let port = process.env.PORT || 3000;
      app.listen(port, () => {
        console.log(`listening on http://127.0.0.1:${port}`);
      });
    }
  };

  /**
   * Use this function to handle events not coming from url
   * @param {funciton} f if no routes match, this is executed
   */
  setFallback(f) {
    this.falBack = f;
  };

  /**
   * This is the main handler function
   * Set this with `export.handler = cloudhopper.handler`
   * Do not worry about the arguments, aws will provide them
   *
   * @param {Object} event
   * @param {Object} context
   * @param {function} callback
   * @return {function} a function to assign it to
   */
  handler() {
    return this.getFunct(this);
  }

  /**
   * @param {self} self
   * @return {function} function which can handle aws lambda
   */
  getFunct(self) {
    return (event, context, callback) => {
      if (!event.requestContext) {
        console.log('event.url is not available, hence just executing');
        if (self.fallBack) {
          self.fallBack(event, context, callback);
        }
        return;
      }

      // process request params
      let req = {
        body: event.body,
        url: event.path,
        path: event.path,
        method: event.httpMethod,
        ip: event.requestContext.identity.sourceIp,
        headers: event.headers,
        protocol: 'https',
        query: event.queryStringParameters,
      };

      if (!self.dockerInitState) {
        self.dockerInitState = true;
        if (self.dockerInit) self.dockerInit();
      }

      let res = new Response(context, callback);
      self.router(req, res, function(err) {
        if (err) {
          console.log(err);
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
  };
}

export default Cloudhopper;
