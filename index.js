if(window.global != global) {
	window.global = window;
	global = window;
}

var lithp = require('lithp');
window.Lithp = lithp;

var util = require('util');
window.util = util; // expose to HTML pages

var files;
try {
	files = require('./files');
} catch (e) {
	console.error("Please run genfiles.sh");
	return;
}

global._lithp.browserify = true;
global._lithp.fileCache = files;

//window.Lithp.set_debug_flag(true);

var instance = new lithp.Lithp();
window.lithpInstance = instance;
var code = files["webide/webide.ast"];
var ideParsed = lithp.Parser(code, {ast: true, finalize: true});
instance.setupDefinitions(ideParsed, "webide.ast")
instance.Define(ideParsed, "__AST__", lithp.Types.Atom('true'));
instance.Define(ideParsed, "RUNTIME", "browser");
instance.run(ideParsed);

window.onload = function() {
	console.log("Invoking onReady behaviour");
	instance.Invoke(ideParsed, "onReady/1", [document]);
	if(window.jQuery) {
		console.log("Invoking jQuery behaviour");
		window.jQuery.noConflict();
		instance.Invoke(ideParsed, "onJQuery/1", [window.jQuery])
	}
};
