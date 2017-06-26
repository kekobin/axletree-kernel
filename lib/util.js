/**
 * @author kekobin@163.com
 * @file 全局功能函数，提供在模版中使用
 **/
var fs = require('fs');
var path = require('path');

exports.Template = function(project, file) {
	//线上环境
	//var filePath = path.join(__dirname, '../views/' + project + 'View/template/' + file);
	//开发环境
	var filePath = path.join(__dirname, '../views/template/' + file);
	var tplStr = fs.readFileSync(filePath);

	return String(tplStr);
};
