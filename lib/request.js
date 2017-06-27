'use strict';
/**
 * @author: kekobin@163.com
 * @file 异步请求接口数据，并且拼装成一个json形式返回，默认附带上登陆态
 */

var async = require('async');
var requestify = require('requestify');

function Data(opts) {
	this.opts = opts || [];
}

Data.prototype.get = function(cookies, cb) {
	var _this = this;

	function getRequestArr() {
		var ret = [];

		_this.opts.forEach(function(config) {
			var tempFunc = function(callback) {
				requestify.get(config.url, {
					cookies: cookies
				}).then(function(response) {
					var tempOb = {};
					tempOb[config.name] = response.body;
					callback(null, tempOb);
				}).fail(function(response) {
					callback(null, {});
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

	dataIns.get(cookies, function(err, data) {
		callback(err, data);
	});
}