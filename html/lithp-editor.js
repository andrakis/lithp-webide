(function() {
	var oldConsole = console;
	window.fakeConsole = {
		stdout: "",
		stderr: "",
		logStdout: function() {
			fakeConsole.stdout += Array.prototype.join.call(arguments, ' ');
			if(fakeConsole.onStdout) {
				fakeConsole.onStdout(fakeConsole.stdout);
				fakeConsole.stdout = "";
			}
		},
		logStderr: function() {
			fakeConsole.stderr += Array.prototype.join.call(arguments, ' ');
			if(fakeConsole.onStderr) {
				fakeConsole.onStderr(fakeConsole.stderr);
				fakeConsole.stderr = "";
			}
		},
		onStdout: null,
		onStderr: null,
	};
	window.console = {
		log: function() {  oldConsole.log.apply(oldConsole , arguments);
						  fakeConsole.logStdout.apply(fakeConsole, arguments); },
		error: function() { //oldConsole.error.apply(oldConsole , arguments);
							fakeConsole.logStderr.apply(fakeConsole, arguments); },
	};

	var instance = window.lithpInstance;

	window.runCode = function(code) {
		var debugMode = document.getElementById("debugMode").checked;
		var parserDebug=document.getElementById("parserDebugMode").checked;
		var clearOnRun= document.getElementById("clearOnRun").checked;
		if(clearOnRun)
			clearConsole();
		Lithp.set_debug_flag(debugMode);
		global._lithp.set_parser_debug(parserDebug);
		var result = Lithp.Parser(code, {finalize: true, ast: false});
		instance.setupDefinitions(result, "webide");
		// Required on packaged Lithp
		instance.Define(result, "__AST__", Lithp.Types.Atom("true"))
		try {
			var timed = timeCall("Run code", () => instance.run(result));
			console.log("Code run in " + timed[1] + "ms, result: " + timed[0]);
		} catch (e) {
			console.log(e.stack);
		}
	}
})();
