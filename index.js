if(typeof window === 'undefined')
	window = {};

if(window.global != global) {
	window.global = window;
	global = window;
}

var lithp = require('lithp');
window.Lithp = lithp;

var util = require('util');
window.util = util; // expose to HTML pages

var files, samples;
try {
	files = require('./files');
	samples = require('./samples');
} catch (e) {
	console.error("Please run genfiles.sh");
	return;
}

//window.Lithp.set_debug_flag(true);

var instance = new lithp.Lithp();
window.lithpInstance = instance;
var code = files["webide/webide.ast"];
if(code === undefined)
	console.log("Error: webide not found");

if(global._lithp === undefined)
	global._lithp = {};
global._lithp.browserify = true;
global._lithp.fileCache = files;
global._lithp.fileSampleCache = samples;

var ideParsed = lithp.Parser(code, {ast: true, finalize: true});
instance.setupDefinitions(ideParsed, "webide.ast")
instance.Define(ideParsed, "__AST__", lithp.Types.Atom('true'));
instance.Define(ideParsed, "RUNTIME", "browser");
global._lithp.host = "browser";
instance.run(ideParsed);

window.onload = function() {
	if(instance.Defined(ideParsed, "HTML_TOOLKIT") == lithp.Types.Atom('true')) {
		console.log("Invoking onReady behaviour");
		try {
			instance.Invoke(ideParsed, "onReady/*", [document, window]);
		} catch (e) {
			console.log(e.stack);
		}
	}
	if(window.jQuery && instance.Defined(ideParsed, "JQUERY_TOOLKIT") == lithp.Types.Atom('true')) {
		console.log("Invoking jQuery behaviour");
		window.jQuery.noConflict();
		try {
			instance.Invoke(ideParsed, "onJQuery/1", [window.jQuery])
		} catch (e) {
			console.log(e.stack);
		}
	}
};
