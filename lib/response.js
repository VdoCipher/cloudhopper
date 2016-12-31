'use strict';

let dockerInitTime = (new Date()).getTime();
let dockerCounter = 0;

/**
 * a virtual response object to emulate express response class
 */
class Response {

  /**
   * just create an empty but loaded entity
   * @param {Object} context
   * @param {function} callback
   */
  constructor(context, callback) {
    this.initTime = (new Date()).getTime();
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
  status(code) {
    this.statusCode = parseInt( code );
    return this;
  }

  /**
   * returns a json with 200 or a previously set code
   * @param {Object} data which will be serialized into a JSON.stringify
   */
  json(data) {
    this.responseBody = JSON.stringify( data );
    this.end();
  }

  /**
   * returns a 500 error to the client, only the message property will
   * be sent to the browser. rest should be logged
   * @param {Object} err object
   */
  error(err) {
    this.statusCode = 500;
    this.responseBody = JSON.stringify( {
      message: 'Error: ' + err.message,
    } );
    this.end();
  }

  /**
   * send a redirect location header to the client
   * @param {int} code HTTP status to be returned
   * @param {string} url the value of the location header
   */
  redirect(code, url) {
    this.statusCode = parseInt( code );
    this.headers.Location = url;
    this.end();
  }

  /**
   * Sends the HTTP response.
   * @param {string} body the value of the location header
   */
  send(body) {
    this.responseBody = body;
    this.end();
  }

  /**
   * Ends the client connection and send across the prepared
   * response.
   */
  end() {
    if (this.isSent) {
      return;
    }
    this.isSent = true;
    this.context.callbackWaitsForEmptyEventLoop = false;
    this.headers.dockerInitTime = dockerInitTime;
    this.headers.dockerCounter = ++dockerCounter;
    this.headers.Server = 'CloudHopper 1.0';
    this.headers.requestTime = (new Date()).getTime() - this.initTime;
    let responseData = {
      statusCode: this.statusCode,
      headers: this.headers,
      body: this.responseBody,
    };
    this.callback(null, responseData);
  }
}

module.exports = Response;
