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

	window.runCode = function(code) {
		var instance = window.lithpInstance;

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
		if(instance.Defined(result, "HTML_TOOLKIT") == Lithp.Types.Atom("true")) {
			try {
				instance.Invoke(result, "onReady/1", [document])
			} catch (e) {
				console.log(e.stack);
			}
		}
		if(instance.Defined(result, "JQUERY_TOOLKIT") == Lithp.Types.Atom("true")) {
			if(window.jQuery) {
				console.log("Invoking jQuery behaviour");
				window.jQuery.noConflict();
				try {
					instance.Invoke(result, "onJQuery/1", [window.jQuery])
				} catch (e) {
					console.log(e.stack);
				}
			}
		}
	}
})();
