!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("cloudhopper",[],t):"object"==typeof exports?exports.cloudhopper=t():e.cloudhopper=t()}(this,function(){return function(e){function t(n){if(o[n])return o[n].exports;var r=o[n]={exports:{},id:n,loaded:!1};return e[n].call(r.exports,r,r.exports,t),r.loaded=!0,r.exports}var o={};return t.m=e,t.c=o,t.p="",t(0)}([function(e,t,o){"use strict";function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},s=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),i=o(1),a=function(){function e(){n(this,e)}return s(e,[{key:"setInit",value:function(e){this.dockerInit=e}},{key:"use",value:function(e){this.router=e}},{key:"setFallback",value:function(e){this.fallBack=e}},{key:"handler",value:function(e,t,o){if(!e.requestContext&&!e.path)return console.log("event.url is not available, hence just executing"),void(this.fallBack?this.fallBack(e,t,o):console.log("fallback not available"));var n=e;e.requestContext&&(n={body:e.body,url:e.path,path:e.path,method:e.httpMethod,ip:e.requestContext.identity.sourceIp,headers:e.headers,protocol:"https",query:e.queryStringParameters});var s=new i(t,o,n);""!==n.body&&"object"!==r(n.body)&&(n.body=JSON.parse(n.body)),this.dockerInitState||(this.dockerInitState=!0,this.dockerInit&&this.dockerInit()),this.router(n,s,function(e){return e?(console.error("router error handle ",e.mesage,e.stack),void s.status(500).json({message:"Application Error: "+e.message})):void s.status(404).json({message:"Not Found"})})}}]),e}();t.Cloudhopper=a,t.Response=i},function(e,t){"use strict";function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var n=function(){function e(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),r=(new Date).getTime(),s=0,i=function(){function e(t,n,r){o(this,e),this.initTime=(new Date).getTime(),this.context=t,this.callback=n,this.request=r,this.responseBody="",this.headers={"content-type":"text/html"},this.statusCode=200,this.isSent=!1}return n(e,[{key:"status",value:function(e){return this.statusCode=parseInt(e),this}},{key:"json",value:function(e){this.responseBody=JSON.stringify(e),this.headers["content-type"]="application/json",this.end()}},{key:"error",value:function(e){this.statusCode=500,this.responseBody=JSON.stringify({message:"Error: "+e.message}),this.end()}},{key:"redirect",value:function(e,t){this.statusCode=parseInt(e),this.headers.Location=t,this.end()}},{key:"send",value:function(e){this.responseBody=e,this.end()}},{key:"end",value:function(){if(!this.isSent){this.isSent=!0,this.context.callbackWaitsForEmptyEventLoop=!1,this.headers.dockerInitTime=r,this.headers.dockerCounter=++s,this.headers.Server="CloudHopper 1.0",this.headers.requestTime=(new Date).getTime()-this.initTime;var e={statusCode:this.statusCode,headers:this.headers,body:this.responseBody};try{var t=this.request;console.log("[HTTPLOG]\t"+t.ip+"\t"+(new Date).toString()+"\t\n          "+t.method+"\t"+t.path+"\t"+this.statusCode+"\t\n          "+this.responseBody.length+"\t\n          "+(t.headers.referrer||"-"))}catch(e){console.error("Error logging request",e)}this.callback(null,e)}}}]),e}();e.exports=i}])});