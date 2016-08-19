#!/usr/bin/env node
/* jshint expr: true */


let aws = require("aws-sdk")
let fs = require("fs")
let argv = require('minimist')(process.argv.slice(2))
let bluebird = require("bluebird");
let path = require('path')
let wildcard = require('wildcard')
let JSZip = require('jszip')

bluebird.promisifyAll(fs)


class CLI {
	constructor() {
		this.config = require(process.cwd() + "/local.cloudhopper.config.json")
	}

	deploy() {
		var ignored = fs.readFileSync('.gitignore').toString().split("\n")
		ignored.push('node_modules')
		ignored = ignored.filter(l => (l !== '' && l.trim().substr(0,1) !== '#'))

		var getAllFiles = (baseDir, Ignore) => fs.readdirAsync(baseDir)
			.then(files => Promise.all(files
				.filter(f => f.substr(0,1) !== ".")
				.filter(f => ignored.reduce((a, b) => !Ignore || (a && !wildcard(b, f)), true))
				.map(f => path.join(baseDir, f))
				.map(f => fs.statAsync(f)
					.then(stat => {
						if(stat.isDirectory())
							return getAllFiles(f)
						else if (stat.isFile())
							return f
					})
				)
			))
			.then(files => [].concat(...files))
		var zip = new JSZip();
		var blacklist = ['md', 'html', 'git', 'gitignore'];
		var includeDependencies = (baseDir, ignore) => {
			return getAllFiles(baseDir, ignore)
				.then(files => {
					return Promise.all(files.map(f => {
						zip.file(f.replace(process.cwd(), ''), fs.readFileSync(f))
					}))}
				)
				.then(() => {
					var b = require(path.join(baseDir, 'package.json')).dependencies
					var a = Object.keys(b || {})
						.map(module => includeDependencies(path.join(process.cwd(), 'node_modules', module), false))
					return Promise.all(a)
				})
		}
		includeDependencies(process.cwd(), true)
			.then(()=> {
				console.log("writing to file ")
				var config = this.config;
				zip
					.generateNodeStream({
						type:'nodebuffer',
						streamFiles:true,
						compression: 'DEFLATE',
						compressionOptions: {
							level: 9
						}
					})
					.pipe(fs.createWriteStream(config.tempFile))
					.on('finish', function () {
						console.log("Zip created uploading... ")
						var lambda= new aws.Lambda({
							region: config.region
						});
						var params = {
						  FunctionName: config.lambdaName,
						  ZipFile: fs.readFileSync(config.tempFile)
						};
						lambda.updateFunctionCode(params).promise()
							.then(data => {
								console.log(data)
							})
							.catch(console.log)
					})
			})
	}



	getSwag() {
		var swag = {
			swagger: 2.0,
			info: {
				title: this.config.apiTitle
			},
			paths: { }
		}
		var defaults = {
			"consumes": [ "application/json" ],
			"produces": [ "application/json" ],
			"parameters": [
				{
				  "name": "p1",
				  "in": "path",
				  "required": true,
				  "type": "string"
				}
			],
			responses: {},
			'x-amazon-apigateway-integration': {
				"requestTemplates": {
					"application/json": "##  See http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html\n#set($paramsMeta = {\"headers\": \"header\", \"query\": \"querystring\", \"params\": \"path\"})\n#set($allParams =  $input.params())\n{\n\"body\" : $input.json('$'),\n\"url\"   :   \"$context.resourcePath\",\n\"path\"   :   \"$context.resourcePath\",\n\"method\": \"$context.httpMethod\",\n\"ip\"    :   \"$context.identity.sourceIp\",\n#foreach($type in $paramsMeta.keySet())\n#set($params = $allParams.get($paramsMeta.get($type)))\n\"$type\" : {\n  #foreach($paramName in $params.keySet())\n  \"$paramName\" : \"$util.escapeJavaScript($params.get($paramName))\"\n  #if($foreach.hasNext),#end\n  #end\n}\n#if($foreach.hasNext),#end\n#end\n,\n\"stage-variables\" : {\n#foreach($key in $stageVariables.keySet())\n\"$key\" : \"$util.escapeJavaScript($stageVariables.get($key))\",\n#end\n  \"stage\" : \"$context.stage\"\n}\n}\n"
				},
				"uri": `arn:aws:apigateway:${this.config.region}:lambda:path/2015-03-31/functions/${this.config.lambdaArn}/invocations`,
				"passthroughBehavior": "never",
				"httpMethod": "POST",
				"type": "aws"
			}
		}

		var headers = ['Server', 'dockerCounter', 'dockerInitTime', 'Location']
		var statusCodes = ["200", "201", "204", "301", "302", "303", "307", "400", "401", "403", "404", "415", "500", "501", "502", "503", "504"]
		var paths = ['/','/{p1}', '/{p1}/{p2}', '/{p1}/{p2}/{p3}']
		var methods = ['get', 'post', 'put', 'delete', 'patch']

		var headersObject = {}
		var responsesObject = {}
		var xamz_responsesObject = {}
		var xamz_headersObject = {}
		var pathObject = {}

		for (var header of headers) {
			headersObject[header] = {type: "string"}
			xamz_headersObject[`method.response.header.${header}`] = `integration.response.body.headers.${header}`
		}

		for (var code of statusCodes) {
			responsesObject[code] = {
				headers: headersObject
			}
			if (code === "200") {
				xamz_responsesObject["default"] = {
					statusCode : code,
					responseParameters: xamz_headersObject,
					responseTemplates : {
						"application/json": "$input.json('$.body')"
					}
				}
			}
			else {
				var regex = `.*\\\"code\\\":${code}.*`
				xamz_responsesObject[regex] = {
					statusCode: code,
					responseParameters: xamz_headersObject,
					responseTemplates : {
						"application/json": "#set ($errorMessageObj = $util.parseJson($input.path('$.errorMessage')))\n{\n#foreach($type in $errorMessageObj.get('body').keySet())\n    \"$type\" : \"$errorMessageObj.get('body').get($type)\"\n    #if($foreach.hasNext),#end\n#end\n}"
					}
				}
			}
		}

		defaults.responses = responsesObject
		defaults['x-amazon-apigateway-integration'].responses = xamz_responsesObject

		for (var method of methods) {
			pathObject[method] = defaults
		}

		for (var path of paths) {
			swag.paths[path] = pathObject
		}
		return swag
	}

	setUpApi() {
		var stageInfo = this.config.stageVariables.production
		var apigateway = new aws.APIGateway({
			region: this.config.region
		});
		apigateway.putRestApi({
			restApiId: this.config.restApiId,
			body : new Buffer(JSON.stringify(this.getSwag())),
			mode: "overwrite",
		}).promise().then(data => {
			console.log(data)
			return
		}).then(() => {
			return apigateway.createDeployment({
				restApiId : this.config.restApiId,
				stageName : this.config.stageName,
				cacheClusterEnabled: false,
				variables: stageInfo.production
			}).promise()
		}).then((data) => {
			console.log(data)
		}).catch(console.log)
	}
}



var c = new CLI()
var f = c[argv._[0]].bind(c);

f || console.error("Invalid command")
f && f()
