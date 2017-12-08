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

Data.prototype.get = function(cookies, cb) {
	var _this = this;

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
				request({
			        "headers": {
			        	"Cookie": encodeURI(cookie)
			        },
			        "url": config.url,
			        "timeout": 3000,
			        "time": true
			    }, function(error, response, body) {
			    	var statusCode = response && response.statusCode;
			    	var tempOb = {}, configName = config.name;

			        if (!response || statusCode !== 200) {
			            console.log("Here is error:");
			            console.dir(error);
			            tempOb[configName] = {};
			        } else {
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

module.exports = function(req, urls, callback) {
	var cookies = req.cookies;
	var dataIns = new Data(urls);

	dataIns.get(cookies, function(err, data) {
		callback(err, data);
	});
}