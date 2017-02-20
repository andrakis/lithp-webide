var oldConsole = console;
window.fakeConsole = {
	stdout: "",
	stderr: "",
	logStdout: function() {
		var out = Array.prototype.join.call(arguments, ' ');
		if(out.length > 0) {
			if(out.slice(-1) != "\n")
				out += "\n";
			fakeConsole.stdout += out;
		}
		if(fakeConsole.onStdout && fakeConsole.stdout.length > 0) {
			fakeConsole.onStdout(fakeConsole.stdout);
			fakeConsole.stdout = "";
		}
	},
	logStderr: function() {
		var out = Array.prototype.join.call(arguments, ' ');
		if(out.length > 0) {
			out = "STDERR: " + out;
			if(out.slice(-1) != "\n")
				out += "\n";
			fakeConsole.stderr += out;
		}
		if(fakeConsole.onStderr && fakeConsole.stderr.length > 0) {
			fakeConsole.onStderr(fakeConsole.stderr);
			fakeConsole.stderr = "";
		}
	},
	onStdout: null,
	onStderr: null,
	flush: function() {
		window.fakeConsole.logStdout("");
		window.fakeConsole.logStderr("");
	}
};
window.console = {
	oldConsoleStdout: true,
	oldConsoleStderr: true,
	log: function() {
		if(window.console.oldConsoleStdout) {
			oldConsole.log.apply(oldConsole , arguments);
		}
		fakeConsole.logStdout.apply(fakeConsole, arguments);
	},
	error: function() {
		if(window.console.oldConsoleStderr) {
			oldConsole.error.apply(oldConsole , arguments);
		}
		fakeConsole.logStderr.apply(fakeConsole, arguments);
	},
};

