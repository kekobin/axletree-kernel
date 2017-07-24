'use strict';
/**
 ** @author: kekobin@163.com
 ** @file 根据配置动态初始化路由
 **{
 **	"demo": {
 **		"pages": [
 **			{
 **				"page": "index", //页面名称，对应访问的路由和html
 **				"urls": [
 **					{
 **						"name": "", //api名称，在模版中对请求结果的引用
 **						"url":""
 **					}
 **				],
 **				"cache": true//是否缓存(debug模式下无效)
 **			}
 **		]
 **	}
 **}
 **/
var async = require('async');
var path = require('path');
var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');
var fs = require('fs-extra');
var fsSys = require('fs');
var extend = require('extend');
var request = require('./request');
var Cache = require('./cache');
var uploadError = false;

function initApiConf(ROOT_PATH) {
	var config = {};

	var viewsDir = ROOT_PATH + '/views/';
	var fileList = fs.readdirSync(viewsDir);
	var dirList = [];

	// 过滤出目录
	fileList.forEach(function(item) {
		if (fs.statSync(viewsDir + item).isDirectory()) {
			dirList.push(item);
		}
	});

	//找出每个目录下的apiConf.js合成
	dirList.forEach(function(item) {
		var confPath = viewsDir + item + '/apiConf.js';
		extend(true, config, require(confPath));
	});

	return config;
}

function initRouter(debug, ROOT_PATH) {
	var apiConf = debug ? require(ROOT_PATH + '/config/apiConf') : initApiConf(ROOT_PATH);

	async.forEach(Object.keys(apiConf), function (appName, done){ 
	    var appConf = apiConf[appName],
			pages = appConf.pages;
			
		pages.forEach(function(pageItem) {
			var urls = pageItem['urls'],
				page = pageItem['page'],
				persist = pageItem['persist'],
				cacheData = pageItem['cache'],
				urlPrefix = debug || cacheData ? '/' : '/live/',//debug模式下都不缓存
				routeUrl = urlPrefix + appName + '/' + page;

			router.get(routeUrl, function(req, res, next) {
				var proCache = Cache.get(appName),
					proData = proCache.data,
					proDir = debug ? (ROOT_PATH + '/views/') : (ROOT_PATH + '/views/' + appName + 'View/'),
					pagePath = proDir + page,
					persistPath = proDir + 'data.json';//持久化的文件

				//判断当前项目数据是否在有效缓存中,debug模式下都不缓存
				if (!debug && !persist && cacheData && proData && Cache.expires(Date.now() - proCache.expires)) {
					proData.yyuid = req.cookies.yyuid;
					res.render(pagePath, proData);
				} else if(persist && fsSys.existsSync(persistPath)) {
					console.log('[AXLE-LOG] persist data from data.json.')

					var data = fs.readJsonSync(persistPath, { throws: false });
					res.render(pagePath, data);
				} else {
					console.log('[AXLE-LOG] data from real server.')
					request(req, urls, function(err, data) {
						//请求出错或者网络出错等时，使用缓存数据
						if(err || Object.keys(data).length == 0) {
							data = proData || {};
						} else {
							//添加缓存信息到缓存系统
							Cache.set(appName, data);
							//根据这个在页面中判断是否登录
							data.yyuid = req.cookies.yyuid;
						}

						//如果需要持久化数据，则保存数据到本地
						if(persist) {
							fs.writeJsonSync(proDir + '/data.json', data);
						}
						
						res.render(pagePath, data);
					});
				}
			});
		});

	    done(); 
	}, function(err) {
	    console.log('iterating done');
	});
}

module.exports = function(debug, ROOT_PATH) {
	//reload config
	if (debug) {
		router.get('/axletree/upload', function(req, res) {
			res.end(req.protocol + '://' + req.get('host') + '/axletree/upload is ready to work');
		});

		router.post('/axletree/upload', function(req, res, next) {
			console.log('resources upload!')
			if (uploadError) {
				return next(new Error('fs error'));
			}
			var goNext = function(err) {
				return next(err);
			};
			// parse a file upload
			var form = new multiparty.Form();
			form.parse(req, function(err, fields, files) {
				if (err) return goNext(err);
				if (!files.file || !files.file[0]) return goNext(new Error('invalid upload file'));
				res.end('0');
				// record uploading app,注意这里的路径一定需要是绝对路径
				fs.move(
					files.file[0].path, ROOT_PATH + fields.to, {
						clobber: true
					},
					function(err) {
						if (err) {
							uploadError = true;
						}
					}
				);
			});
		});
	}

	initRouter(debug, ROOT_PATH);

	return router;
};