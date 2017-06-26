'use strict';

/**
 * @author: kekobin@163.com
 * @file Axletree核心初始化及错误处理
 */

var path = require('path');
var express = require('express');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// var swig = require('swig');
var ejs = require('ejs');
var appRouter = require('./lib/router');
var Util = require('./lib/util');

var Axletree = function() {
    this.express = express;
    this.require = null;
    this.app = null;
};

Axletree.prototype.bootstrap = function(options, cb) {
    var rootPath, confPath;

    options = options || {};
    //设置axletree根目录，默认使用启动文件的目录
    rootPath = options.rootPath || path.dirname(require.main.filename);
    //设置app，未设置则直接使用express
    this.app = options.app || express();

    //设置全局require
    this.require = require('./lib/require.js')(rootPath);

    this.ROOT_PATH = rootPath;
    this.DEBUG = (process.env.AXLE_DEBUG === 'true') || false;

    // view engine setup
    // Disables caching in Swig.
    // swig.setDefaults({ cache: false });
    
    // this.app.set('views', path.join(__dirname, '../views'));
    // this.app.engine('html', swig.renderFile);
    // this.app.set('view engine', 'html');

    // view engine setup
    this.app.engine('html', ejs.renderFile);
    this.app.set('view engine', 'html');

    // uncomment after placing your favicon in /public
    this.app.use(favicon(rootPath + '/favicon.ico'));
    this.app.use(logger('dev'));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({
        extended: false
    }));
    this.app.use(cookieParser());
    this.app.use(express.static(rootPath + '/static'));

    //设置路由
    this.app.use(appRouter(this.DEBUG, this.ROOT_PATH));
    //设置全局功能函数
    this.app.locals.Util = Util(this.DEBUG, this.ROOT_PATH);
    //错误处理
    this.errorHandler(this.app);
    
    return this.app;
};

Axletree.prototype.errorHandler = function(app) {
    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render(rootPath + '/views/error', {
            message: err.message,
            error: {}
        });
    });
};

//register global variable
Object.defineProperty(global, 'axletree', {
    enumerable: true,
    writable: true,
    value: new Axletree()
});

module.exports = global.axletree;
