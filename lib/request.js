'use strict';
/**
 * @author: kekobin@163.com
 * @file 异步请求接口数据，并且拼装成一个json形式返回，默认附带上登陆态
 */

var async = require('async');
var requestify = require('requestify');
var request = require("request");

function Data(opts) {
	this.opts = opts || [];
}

Data.prototype.get = function(cookies, req, cb) {
	var _this = this;
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
			        "url": url
			    }, function(error, response, body) {
			        if (error) {
			            console.log("Here is error:");
			            console.dir(error);
			            callback(null, {});
			        } else {
			            var tempOb = {};
						tempOb[config.name] = body;
						callback(null, tempOb);
			        }
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
					ret[key] = JSON.parse(data[key]);
				}
			});

			cb(err, ret);
		});
};

module.exports = function(req, urls, callback) {
	var cookies = req.cookies;
	var dataIns = new Data(urls);

	dataIns.get(cookies, req, function(err, data) {
		callback(err, data);
	});
}