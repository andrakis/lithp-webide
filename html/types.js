var msgFrameReady = 'frameReady';
var msgOutputConsole = 'outputConsole';
var msgRegisterFakeConsole = 'registerFakeConsole';
var msgOutputFakeConsole = 'outputFakeConsole';
var msgRunCode = 'runCode';
var msgGetEditorCode = 'getEditorCode';
var msgGotEditorCode = 'gotEditorCode';
var msgSetEditorCode = 'setEditorCode';

var msgGetToolbarSettings = 'getToolbarSettings';
var msgGotToolbarSettings = 'gotToolbarSettings';

var msgClearConsole = 'clearConsole';
var msgFlushCache = 'flushCache';

var msgStartUpdatePermalink = "startUpdatePermalink";
var msgGotUpdatePermalink = "gotUpdatePermalink";

var msgFileUpdated = "fileUpdated";
var msgFileChanged = "fileChanged";

var msgStartPaletteHandler = "msgStartPaletteHandler";

var msgSetEditorState = "msgSetEditorState";
var msgEditorStateKeybindings = "msgEditorStateKeybindings";

function MsgFrameReady (name) {
	return {'type': msgFrameReady, 'name': name};
}

function MsgOutputConsole (content) {
	return {'type': msgOutputConsole, 'content': content};
}

function MsgRegisterFakeConsole (name) {
	return {'type': msgRegisterFakeConsole, 'from': name};
}

function MsgOutputFakeConsole (stream, content) {
	return {'type': msgOutputFakeConsole, 'stream': stream, 'content': content};
}

function MsgRunCode () {
	return {'type': msgRunCode};
}

function MsgGetEditorCode () {
	return {'type': msgGetEditorCode};
}

function MsgSetEditorCode (code) {
	return {'type': msgSetEditorCode, 'code': code};
}

function MsgGotEditorCode (code) {
	return {'type': msgGotEditorCode, 'code': code};
}

function MsgGetToolbarSettings () {
	return {'type': msgGetToolbarSettings };
}

function MsgGotToolbarSettings (settings) {
	return {'type': msgGotToolbarSettings, 'settings': settings};
}

function MsgClearConsole () {
	return {'type': msgClearConsole};
}

function MsgFlushCache () {
	return {'type': msgFlushCache};
}

function MsgStartUpdatePermalink () {
	return {'type': msgStartUpdatePermalink};
}

function MsgGotUpdatePermalink (link) {
	return {'type': msgGotUpdatePermalink, 'link': link};
}

function MsgFileUpdated(name, content) {
	return {'type': msgFileUpdated, 'name': name, 'content': content};
};

function MsgFileChanged(name, content) {
	return {'type': msgFileChanged, 'name': name, 'content': content};
}

function MsgStartPaletteHandler() {
	return {'type': msgStartPaletteHandler};
}

function MsgSetEditorState(stateName, stateValue) {
	return {'type': msgSetEditorState, 'stateName': stateName, 'stateValue': stateValue};
}
