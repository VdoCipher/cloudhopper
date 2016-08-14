'use strict';

let dockerInitTime = (new Date()).getTime();
let dockerCounter = 0;

class Response {

	constructor(context, callback) {
		this.initTime = (new Date()).getTime()
		this.context = context
		this.callback = callback
		this.responseBody = {}
		this.headers = {}
		this.statusCode = 200
		this.isSent = false
	}

	status(code) {
		this.statusCode = code
		return this
	}

	json(data) {
		this.responseBody = data
		this.end()
	}

	error(err) {
		this.statusCode = 500;
		this.responseBody = {
			message: "Error: " + err.message
		}
		this.end()
	}

	redirect(code, url) {
		this.statusCode = code
		this.headers.Location = url
		this.end()
	}

	end() {
		if (this.isSent) {
			return
		}
		this.isSent = true
		this.context.callbackWaitsForEmptyEventLoop = false;
		this.headers.dockerInitTime = dockerInitTime;
		this.headers.dockerCounter = ++dockerCounter;
		this.headers.requestTime = (new Date()).getTime() - this.initTime;
		let responseData = {
			code: this.statusCode,
			headers: this.headers,
			body: this.responseBody
		}
		if (this.statusCode === 200) {
			this.callback(null, responseData)
		} else {
			this.callback(JSON.stringify(responseData))
		}
	}
}

module.exports = Response
