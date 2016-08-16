'use strict';

let Response = require('./lib/response')
let dockerInit;
let dockerInitState	= false;
let router;

exports.setInit = (initFunction) => {
	dockerInit = initFunction
}

exports.use = (router_) => {
	router = router_
}

exports.handler = (event, context, callback) => {

	// process request params
	let req = event;
	req.url = req.url.replace(/\{([a-zA-Z0-9]+)\}/g, (match, $1) => req.params[$1]);

	if (!dockerInitState) {
		dockerInitState = true;
		global.stage_vars = req['stage-variables'];
		dockerInit();
	}

	var res = new Response(context, callback)
	router(req, res, function(err){
		if (err) {
			console.log(err)
			res.status(500).json({
				message: `Application Error: ${err.message}`
			})
			return;
		}
		res.status(404).json({
			message: "Not Found"
		})
	});
}
