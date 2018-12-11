'use strict';
/**
 * @author: kekobin@163.com
 * @file 异步请求接口数据，并且拼装成一个json形式返回，默认附带上登陆态
 */

var async = require('async');
var requestify = require('requestify');
var request = require("request");

var log = require('log4js').getLogger("apiLog");

function Data(opts) {
	this.opts = opts || [];
}

function getIP (req) {
	return req.headers['http_cdn_src_ip'] ||
      req.headers['http_x_forwarded_for'] ||
      req.headers['x-forwarded-for'] || 
      req.ip ||
      req._remoteAddress ||
      (req.socket &&
        (req.socket.remoteAddress ||
          (req.socket.socket && req.socket.socket.remoteAddress)
        )
      )
}

Data.prototype.get = function(cookies, routeUrl, req, cb) {
	var _this = this;
	var ip = getIP(req);
	var params = req.query || {};

	//重新组合cookies
	var cookie = '';
	for(var key in cookies) {
		cookie += key + '=' + cookies[key] + ';'
	}
	cookie = cookie.substr(0,cookie.length-1);

	function getRequestArr() {
		var ret = [];

		_this.opts.forEach(function(config) {
			var tempFunc = function(callback) {
				// requestify.get(config.url, {
				// 	cookies: cookies
				// }).then(function(response) {
				// 	console.log('------1---------')
					// var tempOb = {};
					// tempOb[config.name] = response.body;
					// callback(null, tempOb);
				// }).fail(function(error) {
				// 	console.log('------2--------')
				// 	callback(null, {});
				// });
				var url = config.url, paramsCfg = config.params;

				//合成页面访问路由里面的参数到请求的接口url中
				if(paramsCfg && paramsCfg.length > 0) {
					for(var i=0;i<paramsCfg.length;i++) {
						var item = paramsCfg[i];
						if(params[item]) {
							url += (url.indexOf('?') > 0 ? '&' : '?') + item + '=' + params[item];
						}
					}
				}

				request({
			        "headers": {
			        	"Cookie": encodeURI(cookie)
			        },
			        "url": url,
			        "timeout": 3000,
			        "time": true
			    }, function(error, response, body) {
			    	var statusCode = response && response.statusCode;
			    	var timings = response && response.timings || {end: 0}
			    	var resTime = (response && response.elapsedTime) || (timings && Math.ceil(timings.end));//接口请求耗时

			    	var tempOb = {}, configName = config.name;

					var logInfo = {
		        		routeUrl: routeUrl,
		        		apiUrl: config.url,
		        		statusCode: statusCode || 500,
		        		ip: ip,
		        		resTime: resTime
		        	};

			        if (!response || statusCode !== 200) {
			        	logInfo.msg = error && error.code || "error"
			        	log.info(logInfo);
			            console.log("Here is error:");
			            console.dir(error);
			            tempOb[configName] = {};
			        } else {
			        	logInfo.msg = 'api responses success';
			        	log.info(logInfo);
						tempOb[configName] = body;
			        }

			        callback(null, tempOb);
			    });
			}
			
			ret.push(tempFunc);
		});

		return ret;
	}

	async.parallel(getRequestArr(),
		function(err, results) {
			var ret = {};

			results.forEach(function(data) {
				for(var key in data) {
					var value = data[key];
					ret[key] = typeof value == 'string' ? JSON.parse(value) : value;
				}
			});

			cb(err, ret);
		});
};

module.exports = function(req, urls, routeUrl, callback) {
	var cookies = req.cookies;
	var dataIns = new Data(urls);

	dataIns.get(cookies, routeUrl, req, function(err, data) {
		callback(err, data);
	});
}