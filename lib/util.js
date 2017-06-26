/**
 * @author kekobin@163.com
 * @file 全局功能函数，提供在模版中使用
 **/
var fs = require('fs');
var path = require('path');

module.exports = function(debug, rootPath) {
	return {
		Template: function(project, file) {
			var filePath = debug ? (rootPath + '/views/template/' + file) : (rootPath + '/views/' + project + 'View/template/' + file);
			var tplStr = fs.readFileSync(filePath);

			return String(tplStr);
		}
	}
}