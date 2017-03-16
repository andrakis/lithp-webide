console.log = function() {
	window.parent.postMessage(MsgOutputFakeConsole("stdout", Array.prototype.join.call(arguments, ' ')), "*");
};
console.error = function() {
	window.parent.postMessage(MsgOutputFakeConsole("stderr", Array.prototype.join.call(arguments, ' ')), "*");
};
