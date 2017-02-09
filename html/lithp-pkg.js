(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":4}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],6:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":5,"_process":4,"inherits":2}],7:[function(require,module,exports){
// files.js, generated from genfiles.sh
var files = {};
files['macro-test.ast'] = require('lithp/macro-test.json');
files['macro.ast'] = require('lithp/macro.json');
files['repl.ast'] = require('lithp/repl.json');
files['samples/inverse.ast'] = require('lithp/samples/inverse.json');
files['samples/recurse.ast'] = require('lithp/samples/recurse.json');
files['samples/magic.ast'] = require('lithp/samples/magic.json');
files['samples/n-circles.ast'] = require('lithp/samples/n-circles.json');
files['samples/cipher.ast'] = require('lithp/samples/cipher.json');
files['samples/shorthand.ast'] = require('lithp/samples/shorthand.json');
files['samples/simple.ast'] = require('lithp/samples/simple.json');
files['samples/wall.ast'] = require('lithp/samples/wall.json');
files['samples/fndefs.ast'] = require('lithp/samples/fndefs.json');
files['samples/readfile.ast'] = require('lithp/samples/readfile.json');
files['samples/calc.ast'] = require('lithp/samples/calc.json');
files['samples/factorial.ast'] = require('lithp/samples/factorial.json');
files['samples/oddword.ast'] = require('lithp/samples/oddword.json');
files['samples/complex.ast'] = require('lithp/samples/complex.json');
files['samples/ext.ast'] = require('lithp/samples/ext.json');
files['samples/pillow.ast'] = require('lithp/samples/pillow.json');
files['samples/pairable.ast'] = require('lithp/samples/pairable.json');
files['samples/one_to_ten.ast'] = require('lithp/samples/one_to_ten.json');
files['samples/eval.ast'] = require('lithp/samples/eval.json');
files['samples/forloop.ast'] = require('lithp/samples/forloop.json');
files['samples/square.ast'] = require('lithp/samples/square.json');
files['samples/while.ast'] = require('lithp/samples/while.json');
files['samples/subchains.ast'] = require('lithp/samples/subchains.json');
files['samples/module.ast'] = require('lithp/samples/module.json');
files['samples/var_args.ast'] = require('lithp/samples/var_args.json');
files['samples/scope.ast'] = require('lithp/samples/scope.json');
files['samples/module_lib.ast'] = require('lithp/samples/module_lib.json');
files['samples/parser-bugs.ast'] = require('lithp/samples/parser-bugs.json');
files['samples/map.ast'] = require('lithp/samples/map.json');
files['samples/bfib.ast'] = require('lithp/samples/bfib.json');
files['samples/aspect.ast'] = require('lithp/samples/aspect.json');
files['samples/md-template.ast'] = require('lithp/samples/md-template.json');
files['samples/pow.ast'] = require('lithp/samples/pow.json');
files['samples/infinite.ast'] = require('lithp/samples/infinite.json');
files['samples/progruzzle-colf.ast'] = require('lithp/samples/progruzzle-colf.json');
files['samples/fib.ast'] = require('lithp/samples/fib.json');
files['samples/interlace-strings.ast'] = require('lithp/samples/interlace-strings.json');
files['samples/bf.ast'] = require('lithp/samples/bf.json');
files['samples/atoms.ast'] = require('lithp/samples/atoms.json');
files['samples/definitions.ast'] = require('lithp/samples/definitions.json');
files['modules/stderr.ast'] = require('lithp/modules/stderr.json');
files['modules/file.ast'] = require('lithp/modules/file.json');
files['modules/random.ast'] = require('lithp/modules/random.json');
files['modules/strings.ast'] = require('lithp/modules/strings.json');
files['modules/symbols.ast'] = require('lithp/modules/symbols.json');
files['modules/buffer.ast'] = require('lithp/modules/buffer.json');
files['modules/bignum.ast'] = require('lithp/modules/bignum.json');
files['modules/pivot.ast'] = require('lithp/modules/pivot.json');
files['modules/lists.ast'] = require('lithp/modules/lists.json');
files['modules/stream.ast'] = require('lithp/modules/stream.json');
files['modules/stdlib.ast'] = require('lithp/modules/stdlib.json');
files['modules/cache.ast'] = require('lithp/modules/cache.json');
files['modules/match.ast'] = require('lithp/modules/match.json');
files['modules/assert.ast'] = require('lithp/modules/assert.json');
files['modules/repl.ast'] = require('lithp/modules/repl.json');
files['modules/switch.ast'] = require('lithp/modules/switch.json');
files['modules/class.ast'] = require('lithp/modules/class.json');
files['modules/readline.ast'] = require('lithp/modules/readline.json');
files['modules/math.ast'] = require('lithp/modules/math.json');
module.exports = files;


},{"lithp/macro-test.json":15,"lithp/macro.json":16,"lithp/modules/assert.json":17,"lithp/modules/bignum.json":18,"lithp/modules/buffer.json":19,"lithp/modules/cache.json":20,"lithp/modules/class.json":21,"lithp/modules/file.json":22,"lithp/modules/lists.json":23,"lithp/modules/match.json":24,"lithp/modules/math.json":25,"lithp/modules/pivot.json":26,"lithp/modules/random.json":27,"lithp/modules/readline.json":28,"lithp/modules/repl.json":29,"lithp/modules/stderr.json":30,"lithp/modules/stdlib.json":31,"lithp/modules/stream.json":32,"lithp/modules/strings.json":33,"lithp/modules/switch.json":34,"lithp/modules/symbols.json":35,"lithp/repl.json":40,"lithp/samples/aspect.json":41,"lithp/samples/atoms.json":42,"lithp/samples/bf.json":43,"lithp/samples/bfib.json":44,"lithp/samples/calc.json":45,"lithp/samples/cipher.json":46,"lithp/samples/complex.json":47,"lithp/samples/definitions.json":48,"lithp/samples/eval.json":49,"lithp/samples/ext.json":50,"lithp/samples/factorial.json":51,"lithp/samples/fib.json":52,"lithp/samples/fndefs.json":53,"lithp/samples/forloop.json":54,"lithp/samples/infinite.json":55,"lithp/samples/interlace-strings.json":56,"lithp/samples/inverse.json":57,"lithp/samples/magic.json":58,"lithp/samples/map.json":59,"lithp/samples/md-template.json":60,"lithp/samples/module.json":61,"lithp/samples/module_lib.json":62,"lithp/samples/n-circles.json":63,"lithp/samples/oddword.json":64,"lithp/samples/one_to_ten.json":65,"lithp/samples/pairable.json":66,"lithp/samples/parser-bugs.json":67,"lithp/samples/pillow.json":68,"lithp/samples/pow.json":69,"lithp/samples/progruzzle-colf.json":70,"lithp/samples/readfile.json":71,"lithp/samples/recurse.json":72,"lithp/samples/scope.json":73,"lithp/samples/shorthand.json":74,"lithp/samples/simple.json":75,"lithp/samples/square.json":76,"lithp/samples/subchains.json":77,"lithp/samples/var_args.json":78,"lithp/samples/wall.json":79,"lithp/samples/while.json":80}],8:[function(require,module,exports){
(function (global){
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

//lithp.set_debug_flag(true);
//global._lithp.set_parser_debug(true);
var instance = new lithp.Lithp();
var code = files["modules/match.ast"];
var replParsed = lithp.Parser(code, {ast: true, finalize: true});
instance.setupDefinitions(replParsed, "match.ast");
instance.Define(replParsed, "__AST__", lithp.Types.Atom('true'));
instance.Define(replParsed, "MATCH_TEST", lithp.Types.Atom('true'));
instance.run(replParsed);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./files":7,"lithp":9,"util":6}],9:[function(require,module,exports){


/**
 * Provides the interface to Lithp to other modules.
 */

var lithp = require('./lib/lithp');
exports.Lithp = lithp.Lithp;
exports.debug = lithp.debug;
exports.get_debug_flag = lithp.get_debug_flag;
exports.set_debug_flag = lithp.set_debug_flag;
exports.Types = require('./lib/types');
exports.Parser = require('./platform/v0/parser').BootstrapParser;

},{"./lib/lithp":12,"./lib/types":13,"./platform/v0/parser":37}],10:[function(require,module,exports){
(function (process,global){
/**
 * Builtin Lithp runtime library.
 *
 * Contains a number of critical utility functions such as control flow,
 * function definition, arithmatic, and some basic IO.
 */

"use strict";

var util = require('util'),
    inspect = util.inspect,
	path = require('path'),
	fs = require('fs');
var types = require('./types'),
	Atom = types.Atom,
	Tuple = types.Tuple,
	OpChain = types.OpChain,
	FunctionCall = types.FunctionCall,
	FunctionDefinition = types.FunctionDefinition,
	FunctionDefinitionNative = types.FunctionDefinitionNative,
	VariableReference = types.VariableReference,
	LiteralValue = types.LiteralValue;

// Note: import/1 currently uses the Bootstrap parser, Platform V0.
var BootstrapParser = require('../platform/v0/parser').BootstrapParser;

var builtins = {};

// Cache these frequently used atoms
var atomTrue   = Atom('true'),
    atomFalse  = Atom('false'),
    atomNil    = Atom('nil'),
    atomMissing= Atom('missing'),
    atomNumber = Atom('number'),
    atomString = Atom('string'),
    atomList   = Atom('list'),
    atomOpChain= Atom('opchain'),
    atomFunction=Atom('function'),
    atomTuple  = Atom('tuple'),
    atomAtom   = Atom('atom'),
    atomDict   = Atom('dict');

function builtin (name, params, body) {
	builtins[name] = {params: params, body: body};
}

builtin('def', ['Name', 'Body'], function(Name, Body, State) {
	//console.log("def/2", arguments);
	if(Name.type != 'Atom')
		throw new Error('Expected atom for function name in def/2, got: ' + inspect(Name.constructor));
	if(Body.constructor !== FunctionDefinition)
		throw new Error('Expected FunctionDefinition in def/2, got: ' + inspect(Body.constructor));

	var realName = Name.name;
	// No arity given, detect it and adjust name
	var arityIndex = realName.indexOf("/");
	if(arityIndex == -1) {
		// Adjust Name to include arity
		realName += '/' + Body.fn_params.length;
	} else {
		// Arity given, update Body arity to given count
		Body.arity = realName.slice(arityIndex + 1);
		//console.log("Setting aritity to given: " + Body.arity);
	}
	//console.log("Setting " + realName + " to ", Body);
	Body.readable_name = Name.name;
	State.closure.set_immediate(realName, Body);
	return Body;
});
builtin('==', ['X', 'Y'], (X, Y) => (X == Y) ? atomTrue : atomFalse);
builtin('!=', ['X', 'Y'], (X, Y) => (X != Y) ? atomTrue : atomFalse);
builtin('>',  ['X', 'Y'], (X, Y) => (X  > Y) ? atomTrue : atomFalse);
builtin('>=', ['X', 'Y'], (X, Y) => (X >= Y) ? atomTrue : atomFalse);
builtin('<',  ['X', 'Y'], (X, Y) => (X  < Y) ? atomTrue : atomFalse);
builtin('<=', ['X', 'Y'], (X, Y) => (X <= Y) ? atomTrue : atomFalse);
builtin('!',  ['X'], (X) => {
	if(X !== undefined) {
		if(X == atomTrue)
			return atomFalse;
		else if(X == atomFalse)
			return atomTrue;
		else
			throw new Error('Unable to evaulate !Atom(' + X.name + ')');
	}
	return !X;
});
builtin('and/*', [], (Args) => {
	var val = true;
	var arg;
	if(Args.length == 0)
		return atomFalse;
	var it = Args.iterator();
	it.rewind();
	while(val == true && (arg = it.next())) {
		val = (arg == atomTrue);
	}
	if(val == true)
		return atomTrue;
	else
		return atomFalse;
});
builtin('or/*', [], (Args) => {
	var val = false;
	var arg;
	if(Args.length == 0)
		return atomFalse;
	var it = Args.iterator();
	it.rewind();
	while((arg = it.next())) {
		val = (arg == atomTrue) || val;
	}
	if(val == true)
		return atomTrue;
	else
		return atomFalse;
});

// Add two or more lists together.
// Throws error if no lists given.
// Returns first given list if length is 1.
builtin('++/*', [], List => {
	if(List.length == 0)
		throw new Error('++/* requires at least one list');
	var it = List.iterator();
	var value = it.next();
	var n;
	while((n = it.next()) !== undefined) {
		value = value.concat(n);
	}
	return value;
});
// Add items together. Uses JavaScript + operator, so supports many different
// types of objects.
builtin('+/*', [], List => {
	if(List.length == 0)
		return 0; // TODO: Not appropriate for strings
	var it = List.iterator();
	var value = it.next();
	var n;
	while((n = it.next()) !== undefined) {
		value += n;
	}
	return value;
});
builtin('-/*', [], List => {
	if(List.length == 0)
		return 0;
	var it = List.iterator();
	var value = it.next();
	var n;
	if(List.length == 1)
		return -value;
	while((n = it.next()) !== undefined) {
		value -= n;
	}
	return value;
});
builtin('*/*', [], List => {
	if(List.length == 0)
		return 0;
	var it = List.iterator();
	var value = it.next();
	var n;
	while((n = it.next()) !== undefined) {
		value *= n;
	}
	return value;
});
builtin('//*', [], List => {
	if(List.length == 0)
		return 0;
	var it = List.iterator();
	var value = it.next();
	var n;
	while((n = it.next()) !== undefined) {
		value /= n;
	}
	return value;
});
// Difference between ?/3 and if/3 is that if/3 will evaluate
// the opchain given as the parameters. ?/3 simply returns the
// values as they are (ie, you cannot use an OpChain, unless you
// simply want to work with it.)
builtin('?', ['Pred', 'X', 'Y'], (Pred, X, Y) => (Pred == atomTrue) ? X : Y);
// Alias to if/3
builtin('if/2', ['Test', 'Action'], (Test, Action, State) =>
	builtins['if/3'].body.call(this, Test, Action, new OpChain(State), State)
);
function getIfResult (value) {
	if(value && value.constructor == OpChain)
		return value.call_immediate();
	else
		return value;
}
builtin('if/3', ['Test', 'Action', 'Else'], (Test, Action, Else) =>
	getIfResult((Test == atomTrue) ? Action : Else)
);
builtin('while/2', ['Test', 'Action'], function (Test, Action, State) {
	Test.parent = State;
	Test.closure.parent = State.closure;
	Action.parent = State;
	Action.closure.parent = State.closure;
	Test.rewind();
	Action.rewind();
	while(this.run(Test) == atomTrue) {
		Test.rewind();
		Action.rewind();
		this.run(Action);
	}
});
// Simply run chain
builtin('else', ['Chain'], (Chain) => Chain.call_immediate());
builtin('set', ['Name', 'Value'], (Name, Value, State) => {
	if(Name.constructor === VariableReference)
		Name = Name.ref;
	//console.log("(set/2: setting " + inspect(Name) + " to ", Value, ")");
	State.closure.set(Name, Value);
	return Value;
});
builtin('get', ['Name'], (Name, State) => {
	if(Name.constructor === VariableReference)
		Name = Name.ref;
	if(Name.type == 'Atom')
		Name = Name.name;
	var value = State.closure.get_or_missing(Name);
	if(value == atomMissing) {
		if(!State.closure.any_defined(Name)) {
			//console.log("ERROR: Available symbols: ", State.closure.closure);
			//console.log("Parent:", State.closure.parent);
			throw new Error('No symbol defined as ' + Name);
		}
	}
	return value;
});

// Set a variable in the local scope
builtin('var', ['Name', 'Value'], (Name, Value, State) => {
	if(Name.constructor === VariableReference)
		Name = Name.ref;
	//console.log("(set/2: setting " + inspect(Name) + " to ", Value, ")");
	State.closure.set_immediate(Name, Value);
	return Value;
});

builtin('print/*', [], function(Args) {
	// Print out all Args after inspecting
	console.log.apply(console, Args.map(O => {
		if(typeof O == "string")
			return O;
		return this.inspect_object([O], undefined, 0);
	}));
	return atomNil;
});

builtin('list/*', [], Args => Args);

builtin('map', ['List', 'Callback'], function(List, Callback, State) {
	return List.map(I => {
		return this.invoke_functioncall(State, Callback, [I]);
	});
});

builtin('slice/1', ['List'], List => List.slice());
builtin('slice/2', ['List', 'Begin'], (List, Begin) => List.slice(Begin));
builtin('slice/3', ['List', 'Begin', 'End'], (List, Begin, End) => List.slice(Begin, End));
builtin('quote/1', ['String'], S => JSON.stringify(S));
builtin('inspect/1', ['Object'], function(O) { return this.inspect_object([O], undefined, 0); });
builtin('inspect/2', ['Object', 'FullDepth'], (O, Full) =>
	inspect(O, Full == atomTrue ? {depth:null} : {}));
builtin('null', [], () => null);
builtin('undefined', [], () => undefined);
builtin('@', ['A', 'B'], (A, B) => A % B);
builtin('&', ['A', 'B'], (A, B) => A & B);
builtin('|', ['A', 'B'], (A, B) => A | B);
builtin('^', ['A', 'B'], (A, B) => A ^ B);
builtin('~', ['A'], A => ~A);
builtin('<<', ['A', 'B'], (A, B) => (A << B) >>> 0);
builtin('<<<', ['A', 'B'], (A, B) => A << B);
builtin('>>', ['A', 'B'], (A, B) => (A >> B) >>> 0);
builtin('>>>', ['A', 'B'], (A, B) => A >> B);
builtin('nl', [], () => String.fromCharCode(10)); // new line

builtin("match", ['String', 'RegexString'], (Str, RegexString) => Str.match(RegexString));
builtin("replace", ['String', 'RegexString', 'ReplaceStringOrFunction'], (Str, RegexString, ReplaceString) =>
	Str.replace(RegexString, ReplaceString)
);
builtin("test", ['Regex', 'String'], (Regex, Str) => Regex.test(Str));

builtin("regex/1", ["Regex"], (Regex) => new RegExp(Regex));
builtin("regex/2", ["Regex", "Flags"], (Regex, Flags) => new RegExp(Regex, Flags));
builtin("split", ['String', 'SplitChars'], (Str, SplitChars) => Str.split(SplitChars));
builtin("repeat", ['String', 'Count'], (Str, Count) => Str.repeat(Count));
builtin("join", ['List', 'JoinChar'], (List, JoinChar) => List.join(JoinChar));

builtin("head", ['List'], List => List.length > 0 ? List[0] : []);
builtin("tail", ['List'], List => List.length > 0 ? List.slice(1) : []);

builtin("ht", ['List'], List =>
	List.length == 0 ? [] : [List[0], List.slice(1)]
);

builtin("index", ['List', 'Index'], (List, Index) => List[Index]);

builtin("length", ['List'], List => List.length);

builtin("rand/0", [], () => Math.random());
builtin("rand/1", ['Start'], Start => Math.random(Start));
builtin("rand/2", ['Start', 'End'], (Start, End) => Math.random(Start, End));

builtin("exit/0", [], () => process.exit());
builtin("exit/1", ['Code'], Code => process.exit(Code));
builtin("env", [], () => process.env);
builtin("argv", [], () => process.argv);
builtin("cwd", [], () => process.cwd);

builtin('is-finite', ['N'], N => isFinite(N));
builtin('is-nan', ['N'], N => isNaN(N));
builtin('nan', [], () => NaN);
builtin('parse-float', ['Str'], Str => parseFloat(Str));
builtin('parse-int', ['Str'], Str => parseInt(Str));
builtin('typeof', ['V'], V => {
	if(V)
		switch(V.constructor) {
			case Number:
				return atomNumber;
			case String:
				return atomString;
			case Array:
				return atomList;
			case OpChain:
				return atomOpChain;
			case FunctionDefinition:
				return atomFunction;
			case LiteralValue:
				return inbuilt({} /* fake context */, 'typeof', [V.value]);
			case Tuple:
				return atomTuple;
			default:
				if(V.type == 'Atom')
					return atomAtom;
				else if(Array.isArray(V))
					return atomList;
				else if(V[LITHP_DICT])
					return atomDict;
				throw new Error("Unknown type:" + inspect(V));
		}
	return Atom(typeof V);
});
builtin('function-arity', ['Function'], function(Fun) {
	if(Fun && Fun.constructor === FunctionDefinition)
		return Fun.arity;
	throw new Error('Given object is not a function definition: ' + inspect(Fun));
});
builtin('trim', ['S'], S => S.trim());
builtin('floor', ['N'], N => Math.floor(N));
builtin('ceil', ['N'], N => Math.ceil(N));

// Non-recursive list flatten
function flatten (List) {
	var result = [];
	var nodes = List.slice();
	var node;

	if(!List.length)
		return result;
	
	node = nodes.pop();

	do {
		if(Array.isArray(node))
			nodes.push.apply(nodes, node);
		else
			result.push(node);
	} while (nodes.length && (node = nodes.pop()) !== undefined);

	result.reverse();

	return result;
}

builtin("flatten/*", [], List => flatten(List));

// Call a function. This can be a JavaScript function, or one of the standard
// Lithp FunctionDefinition or FunctionDefinitionNative classes.
builtin("call/*", [], function(Args, State) {
	// Create a new OpChain with the given function, set the closure
	// variables, and return it with .call_immediate so that it takes
	// effect straight away.
	var Fn = Args.slice(0, 1);
	var Params = Args.slice(1);
	if(Fn.length == 0)
		throw new Error('call/*: Unable to get function from args');
	Fn = Fn[0];

	var val;
	if(typeof Fn == 'function') {
		// TODO: Could also transform this into a FunctionDefinitionNative
		// Pass along (this) to native functoin.
		val = Fn.apply(this, Params);
	} else {
		if (Fn.type == 'Atom')
			Fn = Fn.name;
		if (typeof Fn == 'string') {
			var fndef = State.closure.get_or_missing(Fn);
			if(fndef == atomMissing) {
				fndef = State.closure.get_or_missing(Fn + "/*");
				if(fndef == atomMissing) {
					throw new Error("Failed to find target: " + Fn);
				}
				Fn = fndef;
			}
		}
		val = this.invoke_functioncall(State, Fn, Params);
	}
	//console.log("call/* result:", val);
	return val;
});

builtin("apply/*", [], function(Args, State) {
	var Fn = Args.slice(0, 1)[0];
	var Params = Args.slice(1)[0];
	return builtins["call/*"].body.call(this, [Fn].concat(Params), State);
});

builtin("scope", ['FnDef'], (FnDef, State) => {
	// TODO: This is somewhat ugly and is implemented in the interpreter.
	//       It would be nice if this did not require changes to the
	//       interpreter.
	try {
		var newFnDef = FnDef.clone();
		newFnDef.scoped = State;
		//console.log("Scope, new scope is:", State.closure.getDefined(3));
		return newFnDef;
	} catch (e) {
		console.error("Was given: ", FnDef);
		throw e;
	}
});

builtin('try', ['Call', 'Catch'], function(Call, Catch, State) {
	Call.parent = State;
	Call.closure.parent = State.closure;
	Call.rewind();
	try {
		// this refers to the running Lithp object
		var value = this.run(Call);
		return value;
	} catch (e) {
		// Set Exception in the closure to the exception value e
		return this.invoke_functioncall(State, Catch, [e]);
	}
});
builtin('catch', ['OpChain'], (OpChain) => {
	return OpChain;
});
builtin('throw', ['Message'], (Message) => {
	throw new Error(Message);
});

// String Format
builtin('to-string/*', ['Args'], Args => {
	var S = Args[0];
	return S.toString.apply(S, Args.slice(1));
});

var definitionDict = '__definition_dict';
function getTopLevel (Chain) { return Chain.closure.getTopOwner(); };
function getDefinitionDict (Chain) {
	var toplevel = getTopLevel(Chain);
	var dict;
	if(!toplevel.defined(definitionDict)) {
		dict = {};
		dict[definitionDict] = true;
		dict = toplevel.set_immediate(definitionDict, dict);
	} else {
		// Return value is Tuple {ok, Tuple { value, closure_value_is_in }}
		var result = toplevel.get(definitionDict);
		if(result.constructor === Tuple && result[0] == 'ok') {
			dict = result[1][0];
		} else {
			throw new Error("Runtime error: failed to get definition dictionary.");
		}
	}
	if(!dict[definitionDict])
		throw new Error("Runtime error: definition dict not valid: ", dict);
	return dict;
}

builtin('define', ['Name', 'Value'], function(Name, Value, State) {
	var dict = getDefinitionDict.call(this, State);
	dict[Name] = Value;
	return Value;
});

builtin('undefine', ['Name'], function (Name, State) {
	var dict = getDefinitionDict.call(this, State);
	var old = dict[Name];
	delete dict[Name];
	return old;
});

builtin('defined', ['Name'], function (Name, State) {
	return Name in getDefinitionDict.call(this, State) ? atomTrue : atomFalse;
});

builtin('get-def', ['Name'], function (Name, State) {
	var dict = getDefinitionDict.call(this, State);
	if(!(Name in dict))
		return Atom('false');
	return dict[Name];
});

builtin('definitions', [], function (State) { return getDefinitionDict.call(this, State); });

builtin('platform', ['Name'], function (Name, State) {
	var count;
	if(Name && Name.type == 'Atom')
		Name = Name.name;
	switch(Name.toLowerCase()) {
		case "v1":
			count = (require('../platform/v1/parser-lib')).setup(this);
			this.debug("PlatformV1 library loaded " + count + " symbols");
			// Re-import new functions
			State.importClosure(this.functions);
			break;
		default:
			var fullPath = path.resolve(Name + "/index.js");
			if(fs.existsSync(fullPath)) {
				// Import an extension
				count = (require(fullPath)).setup(this);
				this.debug("Extension library " + Name + " loaded " + count + " symbols");
				State.importClosure(this.functions);
				break;
			}
			throw new Error("Error: Platform " + Name + " not known.");
			break;
	}
});

var export_destinations = [];
builtin('export/*', ['Names'], function (Names, State) {
	if(export_destinations.length == 0) {
		export_destinations = [[this, State]];
	}
	// Get current destination
	var destination = export_destinations[export_destinations.length - 1];
	var dest_lithp = destination[0];
	var dest_chain = destination[1];
	var top_chain  = dest_chain.getTopParent();
	var fndefs = exportFunctions.call(this, Names, State, top_chain);
	this.debug("Exporting: [" + Object.keys(fndefs).join(', ') + "] from Lithp[" + this.id + "] to Lithp[" + dest_lithp.id + "]");
	top_chain.importClosure(fndefs);
});

builtin('export-global/*', ['Names'], function (Names, State) {
	if(export_destinations.length == 0) {
		export_destinations = [[this, State]];
	}
	// Current destination only used in call to exportFunction
	var destination = export_destinations[export_destinations.length - 1];
	var dest_lithp = destination[0];
	var dest_chain = destination[1];
	var top_chain  = dest_chain.getTopParent();
	var fndefs = exportFunctions.call(this, Names, State, top_chain);
	// Export to all other Lithp instances
	var instances = global.get_lithp_instances();
	for(var id in instances) {
		dest_lithp = instances[id];
		dest_chain = instances[id].last_chain;
		top_chain  = dest_chain.getTopParent();
		this.debug("Exporting: [" + Object.keys(fndefs).join(', ') + "] from Lithp[" + this.id + "] to Lithp[" + dest_lithp.id + "]");
		top_chain.importClosure(fndefs);
	}
});

function exportFunctions (Names, State, top_chain) {
	this.debug("Exporting: [" + Names.map(N => N.toString()).join(', ') + ']');
	var dest = {};
	Names.map(Name => {
		var result = State.closure.get(Name.toString());
		if(result.constructor === Tuple && result[0] == 'ok') {
			this.debug("Exporting " + Name + " from OpChain[" + State.id + "] to OpChain[" + top_chain.id + "]");
			var fndef_named_function = result[1][0];
			// Create a new FunctionDefinitionNative that calls this interpreter to
			// run the OpChain.
			// Note that 'this' still refers to the current interpreter.
			var instance = this;
			var fndef_bridge = new FunctionDefinitionNative(
				fndef_named_function.fn_name,
				fndef_named_function.fn_params,
				function() {
					// Remove State from given arguments
					var Params = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
					var val = instance.invoke_functioncall(State, fndef_named_function, Params);
					//instance.debug(" imported function call result: " + val);
					return val;
				}
			);
			dest[Name] = fndef_bridge;
		} else {
			console.log("ERROR: Available symbols: ", State.closure.closure);
			throw new Error("Export: failed to find " + Name.toString() + " to export.");
		}
	});
	return dest;
}

function findModule (name, State) {
	var search_paths = this.Defined(State, "_module_search_path") || [];
	var it = search_paths.iterator();
	var extensions = [''];
	if(this.Defined(State, "__AST__")) {
		extensions.push('.ast');
	}
	extensions.push('.lithp');
	var ext_it = extensions.iterator();

	var search;
	var extension;

	this.debug(" Find module: " + name);

	it.rewind();
	while((search = it.next()) || search !== undefined) {
		ext_it.rewind();
		while((extension = ext_it.next()) || extension !== undefined) {
			var search_name = path.join(search, name + extension);
			this.debug("  Checking " + search_name);
			if(global._lithp.browserify) {
				if(search_name in global._lithp.fileCache)
					return search_name;
			} else {
				if(fs.existsSync(search_name) && fs.lstatSync(search_name).isFile()) {
					this.debug(" Using " + search_name);
					return search_name;
				}
			}
		}
	}

	return name;
}

builtin('import', ['Path'], function (Path, State) {
	var importTable = this.Defined(State, "_modules_imported");
	this.debug("Attempt to import: " + Path);
	Path = findModule.call(this, Path, State);
	if(Path in importTable) {
		this.debug("Skipping already imported module");
		return;
	}

	if(!global._lithp.browserify && !fs.existsSync(Path))
		throw new Error("import: could not find file " + Path);
	
	importTable.push(Path);
	var instance = this;
	var code;
	if(global._lithp.browserify)
		code = global._lithp.fileCache[Path];
	else
		code = fs.readFileSync(Path).toString();
	var opts = {
		finalize: true,
		ast: null != Path.match(/.ast$/)
	}
	var timed = timeCall("Parse code", () => BootstrapParser(code, opts));
	var parsed = timed[0];
	parsed.parent = State;
	parsed.closure.parent = State.closure;
	if(this.Defined(State, "__AST__")) {
		this.Define(parsed, "__AST__", atomTrue);
	}
	this.debug("  module parsed in " + timed[1] + "ms");
	timeCall("Run module", () => {
		export_destinations.push([this, State]);
		instance.run(parsed)
		export_destinations.pop();
	});
	this.debug("  module run and exported to current instance in " + timed[1] + "ms");
	return atomNil;
});

builtin('import-instance', ['Path'], function (Path, State) {
	this.debug("Attempt to import: " + Path);
	Path = findModule.call(this, Path, State);
	if(!fs.existsSync(Path))
		throw new Error("import: could not find file " + Path);
	
	// We use a new instance of Lithp to run the module.
	// This gives it its own completely private set of definitions and functions.
	// When export is called, it will fill the function table with functions that
	// are owned by a different Lithp instance that could be doing its own thing
	// on callbacks.
	var instance = new Lithp();
	var code = fs.readFileSync(Path).toString();
	var timed = timeCall("Parse code", () => BootstrapParser(code, Path));
	var result;
	var parsed = timed[0];
	this.debug("  module parsed in " + timed[1] + "ms");
	timeCall("Run module", () => {
		instance.setupDefinitions(parsed, Path);
		export_destinations.push([this, State]);
		instance.run(parsed)
		export_destinations.pop();
	});
	this.debug("  module run and exported to current instance in " + timed[1] + "ms");
	return result;
});

builtin('eval/1', ['Code'], function(Code, State) {
	return builtins['eval/*'].body.call(this, [Code], State);
});
builtin("eval/*", ['CodeAndParams'], function(Args, State) {
	var code = Args.slice(0, 1)[0];
	var args = Args.slice(1);
	this.debug(" Parse: " + code);
	var compiled = BootstrapParser(code);
	//var instance = new Lithp();
	//this.setupDefinitions(compiled, "[evaluated code]");
	compiled.parent = State;
	compiled.closure.parent = State.closure;
	if(args.length > 0) {
		for(var i = 0; i < args.length; i++) {
			var arg = args[i];
			this.debug(" Defining " + arg[0] + " = ", arg[1]);
			compiled.closure.set_immediate(arg[0], arg[1]);
		}
	}
	return this.run(compiled);
});

builtin('atom', ['Name'], Name => Atom(Name));
// Invoke a JavaScript function using apply.
builtin('invoke/*', [], Args => {
	if(Args.length < 2)
		throw new Error("Invoke requires object and function name at least");
	var Obj = Args[0];
	var FnName = Args[1];
	var Params = Args.slice(2);
	if(!Obj[FnName])
		throw new Error("Invoke attempted, but " + FnName + " does not exist in: " + inspect(Obj));
	if(typeof Obj[FnName] != 'function')
		throw new Error("Invoke attempted, but " + FnName + " does not refer to a function: " + typeof(Obj[FnName]));
	return Obj[FnName].apply(Obj, Params);
});

builtin('abs', ['N'], N => Math.abs(N));
builtin('pi', [], () => Math.PI);
builtin('sqrt', ['N'], N => Math.sqrt(N));

builtin('chr', ['N'], N => String.fromCharCode(N));
builtin('asc', ['Str'], Str => Str.charCodeAt(0));

// Used to instantiate classes when the number of parameters it not
// known. Uses apply to instantiate (which is a little trickier than
// usual.)
function newClass (Cls) {
	// Function.bind.apply's first argument is ignored. Thus, it doesn't
	// matter that it's included in arguments.
	return new (Function.bind.apply(Cls, arguments));
}

builtin("tuple/*", [], function (List) {
	return newClass.apply(this, [Tuple].concat(List));
});

var LITHP_DICT = "__lithp_is_lithp_dict";
/** Members should be a list of tuples:
 *    {atom or string::Key, any::Value}
 */
builtin('dict/*', [], Members => {
	var Dict = {};
	Object.defineProperty(Dict, LITHP_DICT, {
		enumerable: false,
		writable: true
	});
	Dict[LITHP_DICT] = true;
	Object.defineProperty(Dict, LITHP_DICT, {
		writable: false
	});
	Members.forEach(Member => {
		if(Member.constructor === LiteralValue)
			Member = Member.value;
		if(Member.constructor !== Tuple) {
			throw new Error('dict expects a list of tuples, got' + inspect(Member));
		}
		if(Member.length != 2) {
			throw new Error('dict expects a tuple of {atom::Key, any::Value}');
		}
		var key = Member[0];
		var value = Member[1];
		if(key && key.type == 'Atom')
			key = key.name;
		Dict[key] = value;
	});
	return Dict;
});

// These functions can be used on JavaScript objects returned from require/1.
builtin('dict-get', ['Dict', 'Name'], (Dict, Name) => Dict[Name]);
builtin('dict-set', ['Dict', 'Name', 'Value'], (Dict, Name, Value) => {
	Dict[Name] = Value;
	return Dict;
});
builtin('dict-present', ['Dict', 'Name'], (Dict, Name) =>
	(Name in Dict) ? atomTrue : atomFalse
);
builtin('dict-remove', ['Dict', 'Name'], (Dict, Name) => {
	delete Dict[Name];
	return Dict;
});
builtin('dict-keys', ['Dict'], Dict => Object.keys(Dict));

// These are specific to JavaScript. This might matter in the future if the
// interpreter is ever ported, so they are prefixed.
builtin('require', ['Name'], Name => require(Name));
builtin('{}', [], () => {});
builtin('js-apply/3', ['Context', 'Function', 'ArgList'], (Ctx, F, AL) => {
	return F.apply(Ctx, AL);
});
builtin('js-typeof/1', ['Object'], O => typeof(O));
// Bridge to a JavaScript function. This returns a native JavaScript function
// that when called, invokes the given FunctionDefinition with the arguments
// given to the function. This can be used in fs.readFile for example.
builtin('js-bridge/1', ['FunctionDefinition'], function(FnDef, State) {
	return (self =>
		function() {
			var Args = Array.prototype.slice.call(arguments);
			return self.invoke_functioncall(State, FnDef, Args);
		}
	)(this);
});

builtin('true', [], () => true);
builtin('false', [], () => false);

builtin('add-search-path', ['Path'], function(Path, State) {
	var search = this.Defined(State, "_module_search_path");
	search.push(Path);
	return search;
});

builtin('host', [], () => "Node.js");
builtin('host-version', [], () => global._lithp.version);

builtin('stdin', [], () => process.stdin);
builtin('stdout', [], () => process.stdout);
builtin('stderr', [], () => process.stderr);

builtin('set-top-level', ['Bool'], Bool => global._lithp.set_toplevel = (Bool === Atom('true')));

builtin('index-set', ['List', 'Index', 'Value'], (List, Index, Value) => {
	List[Index] = Value;
	return List;
});

builtin('list-fill', ['Length', 'Value'], (Length, Value) => new Array(Length).fill(Value));
builtin('list-rand', ['List'], List => List[Math.floor(Math.random() * List.length)]);

builtin('recurse/*', ['Args'], function(Params, State) {
	// Find current target
	var Target = State.parent;
	while(Target && !Target.function_entry) {
		Target = Target.parent;
	}
	if(Target == null) {
		throw new Error('Failed to find current entry to ' + Fn);
	}
	// Rewind it to the start
	Target.rewind();

	// Get the OpChain function name with arity.
	var Fn = Target.function_entry;
	var FnAndArity = Fn + "/" + Params.length;
	var fndef = Target.closure.get_or_missing(FnAndArity);

	if(fndef == atomMissing) {
		// Check for a function with any arity assigned (*)
		FnAndArity = FnAndArity.replace(/\d+$/, '*');
		fndef = Target.closure.get_or_missing(FnAndArity);
		if(fndef == atomMissing) {
			throw new Error('Error, unknown function: ' + Fn + "/" + Params.length);
		}
	}

	// Set parameters for given function
	fndef.fn_params.forEach((Name, Index) => {
		//lithp_debug("Set '" + Name + "' to params[" + Index + "] (" + params[Index] + ")");
		// This ensures that the closure will immediately find
		// the named variable, instead of going up the stack
		// to find it (which might hold multiple variables of
		// the same name.)
		Target.closure.set_immediate(Name, Params[Index]);
	});

	// We return nothing. It's up to the given function to eventually stop recursion
	// and return a value.
});

function inbuilt (self, name, args, State) {
	return builtins[name].body.apply(self, args);
}

builtin('recurse-from/*', ['Args'], function(Args, State) {
	var From = inbuilt(this, 'head', [Args]);
	var Tail = inbuilt(this, 'tail', [Args]);
	var Fn   = inbuilt(this, 'head', [Tail]);
	var Params = inbuilt(this, 'tail', [Tail]);

	// Find target
	var Target = State.parent;
	while(Target && Target.function_entry != Fn) {
		Target = Target.parent;
	}
	if(Target == null) {
		throw new Error('Failed to find current entry to ' + Fn);
	}
	// Rewind it to the start
	Target.rewind();

	// Get the given function name with arity.
	var FnAndArity = Fn + "/" + Params.length;
	var fndef = Target.closure.get_or_missing(FnAndArity);

	if(fndef == atomMissing) {
		// Check for a function with any arity assigned (*)
		FnAndArity = FnAndArity.replace(/\d+$/, '*');
		fndef = Target.closure.get_or_missing(FnAndArity);
		if(fndef == atomMissing) {
			throw new Error('Error, unknown function: ' + Fn + "/" + Params.length);
		}
	}

	// Set parameters for given function
	fndef.fn_params.forEach((Name, Index) => {
		//lithp_debug("Set '" + Name + "' to params[" + Index + "] (" + params[Index] + ")");
		// This ensures that the closure will immediately find
		// the named variable, instead of going up the stack
		// to find it (which might hold multiple variables of
		// the same name.)
		Target.closure.set_immediate(Name, Params[Index]);
	});

	// We return nothing. It's up to the given function to eventually stop recursion
	// and return a value.
});

builtin('next/*', ['Args'], function(Args, State) {
	var Fn   = inbuilt(this, 'head', [Args]);
	var Params = inbuilt(this, 'tail', [Args]);

	// Find target - last function entry
	var Target = State.parent;
	while(Target && !Target.function_entry) {
		Target = Target.parent;
	}
	if(Target == null) {
		throw new Error('Failed to find last function entry');
	}

	// Get the given function name with arity.
	var FnAndArity = Fn + "/" + Params.length;
	var fndef = Target.closure.get_or_missing(FnAndArity);

	if(fndef == atomMissing) {
		// Check for a function with any arity assigned (*)
		FnAndArity = FnAndArity.replace(/\d+$/, '*');
		fndef = Target.closure.get_or_missing(FnAndArity);
		if(fndef == atomMissing) {
			throw new Error('Error, unknown function: ' + Fn + "/" + Params.length);
		}
	}

	Target.replaceWith(fndef);

	// Set parameters for given function
	fndef.fn_params.forEach((Name, Index) => {
		//lithp_debug("Set '" + Name + "' to params[" + Index + "] (" + params[Index] + ")");
		// This ensures that the closure will immediately find
		// the named variable, instead of going up the stack
		// to find it (which might hold multiple variables of
		// the same name.)
		Target.closure.set_immediate(Name, Params[Index]);
	});

	// We return nothing. It's up to the given function to eventually stop recursion
	// and return a value.
});

var lithp;
builtin('lithp-debug', ['Bool'], Bool =>
	lithp.set_debug_flag(Bool === Atom('true'))
);

// Moved to inbuilt function for speed reasons
builtin('flat-map', ['List', 'Callback'], function(List, Callback, State) {
	return Array.prototype.concat.apply([], List.map(E => this.invoke_functioncall(State, Callback, [E])));
});

builtin('opchain-rewind', ['OpChain'], (Chain) => {
	if(Chain && Chain.constructor == OpChain) {
		Chain.rewind();
		return atomNil;
	}
	throw new Error("Given value is not an opchain: " + Chain.constructor);
});

builtin('run', ['OpChain'], function(Chain) {
	if(Chain && Chain.constructor == OpChain) {
		Chain.rewind();
		return this.run(Chain);
	}
	throw new Error("Given value is not an opchain: " + Chain.constructor);
});

builtin('math-object', [], () => Math);

exports.setup = function(lithp) {
	for(var k in builtins) {
		lithp.builtin(k, builtins[k].params, builtins[k].body);
	}
};

// Lazy load
lithp = require('./..');

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../platform/v0/parser":37,"../platform/v1/parser-lib":39,"./..":9,"./types":13,"_process":4,"fs":1,"path":3,"util":6}],11:[function(require,module,exports){
(function (global){
/**
 * Lithp language interpreter.
 *
 * This is the main interpreter unit, and performs all the basic
 * interpreter functions.
 *
 * It operates only on prepared OpChains, requiring either hand-
 * compilation or a parser (see run.js.)
 *
 * See samples.js for some hand-compiled samples, or samples/ for files
 * that can be run with run.js
 *
 */

"use strict";

var util = require('util'),
	inspect = util.inspect;
var types = require('./types'),
	OpChain = types.OpChain,
	Atom = types.Atom,
	FunctionCall = types.FunctionCall,
	FunctionReentry = types.FunctionReentry,
	FunctionDefinition = types.FunctionDefinition,
	FunctionDefinitionNative = types.FunctionDefinitionNative,
	AnonymousFunction = types.AnonymousFunction,
	LiteralValue = types.LiteralValue,
	VariableReference = types.VariableReference,
	Tuple = types.Tuple;

var atomMissing = Atom('missing');

// This controls the maximum size of output for unknown objects being printed.
var maxDebugLen = 100;

/**
 * Run a function chain and return its value.
 * The is the top level interpreter, responsible for moving through
 * an OpChain and executing instructions, or just getting values
 * from LiteralValue returns.
 * This is the main function for running Lithp code.
 */
Lithp.prototype.run = function(chain) {
	if(this.stopped)
		throw new Error('Error: this instance has been stopped - ' + this.Defined(chain, '__filename'));
	this.last_chain = chain;
	// TODO: use a list for current OpChain to execute so that reduce can
	//       recall its function body
	var value = Atom("nil");
	//lithp_debug(chain);
	//lithp_debug("Resuming chain from pos: " + chain.pos);
	while(chain.next()) {
		var i = chain.get();
		switch(i.constructor) {
			case OpChain:
				//lithp_debug("(run: current closure: ", i.closure.closure);
				//lithp_debug("(      parent closure: ", i.closure.parent);
				value = this.run(new OpChain(chain, i.ops));
				break;
			case FunctionCall:
				//console.log("chain.get got: ", i);
				value = this._do_functioncall(chain, i);
				//lithp_debug("(run: got value from fn call: ", value);
				if(value && value.constructor === OpChain && value.immediate == true) {
					// Invoke this chain immediately
					//lithp_debug("(run: invoking immediately");
					value = this.run(new OpChain(chain, value.ops));
					//lithp_debug("(run: got value from immediate fn call: ", value);
				}
				break;
			case LiteralValue:
				value = i.value;
				break;
			case FunctionDefinition:
			case FunctionDefinitionNative:
				value = i;
				break;
			default:
				debug("ERROR: Unkown operation: " + i.constructor);
				break;
		}
	}
	//lithp_debug("Final value: " + value + " (" + ((value && value.type) ? value.type : typeof value) + ")");
	return value;
};

/**
 * Perform a function call with the given chain closure.
 *
 * This is the main interpreting function, it takes care
 * of creating new closures for a function call, making
 * the call itself, and finding the correct function to
 * call based on arity.
 *
 * For each argument, if it is a function call, this
 * procedure is called recursively, eventually returning
 * the appropriate real value so that the function call
 * can occur.
 */
Lithp.prototype._do_functioncall = function(chain, i) {
	//lithp_debug("FunctionCall " + i.fn_name + "(...)");
	var fn_name = i.fn_name;
	var fndef = chain.closure.get_or_missing(fn_name);
	if(fndef == atomMissing) {
		// Check for a function with any arity assigned (*)
		fn_name = fn_name.replace(/\d+$/, '*');
		fndef = chain.closure.get_or_missing(fn_name);
		if(fndef == atomMissing) {
			throw new Error('Error, unknown function: ' + i.fn_name);
		}
		i.fn_name = fn_name; // Update reference for future
	}
	// Get the real values of all parameters. This may recursively invoke
	// this function to satisfy calls.
	var self = this;
	var params = i.fn_params.map(function (P) {
		return self.get_param_value(chain, P);
	});
	//lithp_debug("Final params: ", inspect(params));
	//lithp_debug("Requesting invoke for: ", i);
	//lithp_debug("Found fndef: ", fndef);
	//lithp_debug("Actual fndef: ", fndef);
	return this.invoke_functioncall(chain, fndef, params);
};

/**
 * Get the real value of a parameter.
 * This converts LiteralValues into actual values, as well
 * as calling function calls or simply returning relevant data.
 */
Lithp.prototype.get_param_value = function (chain, param) {
	if(param === undefined)
		return undefined;
	// Atoms are passed whole
	if(param && param.type == 'Atom')
		return param;
	switch(param.constructor) {
		case FunctionCall: return this._do_functioncall(chain, param);
		case LiteralValue: return param.value;
		// The following just return the param itself.
		case VariableReference:
		case OpChain:
		case FunctionDefinition:
			return param;
		default:
			// debug("WARN: unknown value");
			// TODO: merge into above clause
			return param;
	}
};

// A special content parser for Lithp objects that attempts to have terse
// output. Will not output entire object if size is more than maxDebugLen.
function lithpInspectParser (P, Join, maxDebug) {
	maxDebug = (maxDebug === undefined) ? maxDebugLen : maxDebug;
	// Print strings using double quotes (inspect gives single.)
	// This is to differentiate it from atoms, which use single quotes.
	if(typeof P == typeof "")
		return (maxDebug <= 0 || (maxDebug > 0 && P.length <= maxDebug)) ?
			JSON.stringify(P) : '(string too large to display)';
	if(P)
		switch(P.constructor) {
			case OpChain:
			case VariableReference:
			case FunctionDefinition:
			case FunctionCall:
			case LiteralValue:
			case Tuple:
				return P.toString();
			default:
				if(P.type == 'Atom')
					return "'" + P.name + "'";
				else if(Array.isArray(P))
					return '[' + P.map(function(V) { return lithpInspectParser(V, Join, maxDebug); }).join(Join) + ']';
		}
	var val = inspect(P);
	if(val.length && maxDebug > 0 && val.length > maxDebug && P)
		val = "(" + (P.constructor.name || 'Object') + ": too large to display)";
	return val;
}

/**
 * Return a short string representation of the object.
 */
Lithp.prototype.inspect_object = function(Args, Join, maxDebugLen) {
	Join = Join || ', ';
	return Args.map(function(V) { return lithpInspectParser(V, Join, maxDebugLen); }).join(Join);
};

Lithp.prototype.Invoke = function(chain, fn_name, params) {
	var fndef = chain.closure.get_or_missing(fn_name);

	if(fndef == atomMissing) {
		// Check for a function with any arity assigned (*)
		fn_name = fn_name.replace(/\d+$/, '*');
		fndef = chain.closure.get_or_missing(fn_name);
		if(fndef == atomMissing) {
			throw new Error('Error, unknown function: ' + fn_name);
		}
	}

	return this.invoke_functioncall(chain, fndef, params);
};

/**
 * Invokes the given function with the given parameters. Assumes parameters
 * have all been resolved.
 *
 * This function can be used by builtin functions to call arbritrary functions.
 */
Lithp.prototype.invoke_functioncall = function(chain, fndef, params) {
	var debug_str = "";
	this.functioncalls++;
	if(global.lithp_debug_flag) {
		// Only call this in debug mode, since it involves mapping
		// over all of the parameters, which is just wasted time if
		// debug is not on.
		var lithp_id = global.get_lithp_max_id();
		var padding = (lithp_id.toString().length - this.id.toString().length);
		    padding = " ".repeat(padding);
		var fn_name = fndef.readable_name;
		if(fndef.constructor === FunctionDefinition)
			fn_name += "/" + fndef.arity;
		var indent = "|";
		if(this.depth < 20)
			indent = indent.repeat(this.depth + 1);
		else
			indent = "|             " + this.depth + " | | ";
		debug_str = (lithp_id > 1 ? "[" + padding + this.id + "] " : "") +
			"+ " + indent  + " (" + fndef.readable_name +
			(fndef.instance_id ? ':' + fndef.instance_id : '') +
			(params.length > 0 ? (" " + this.inspect_object(params, ' ')) : "") + ")";
	}
	var arity = fndef.arity;
	var val;
	this.depth++;
	if(fndef.constructor === FunctionDefinitionNative) {
		//lithp_debug("Calling FunctionDefinitionNative");
		// Call native JavaScript function. Passes given arguments
		// and also pass in the current chain as the last argument.
		if(global.lithp_debug_flag) {
			if(fndef.readable_name == 'while' || fndef.readable_name == 'call' ||
			   fndef.readable_name == 'try'   || fndef.readable_name == 'eval' ||
			   fndef.readable_name == 'apply' || fndef.readable_name == 'next' ||
			   fndef.readable_name == 'recurse')
				lithp_debug(debug_str);
		}
		if(arity == '*') {
			// For functions that have an arity of *, pass params as a single
			// argument.
			params = [params];
		}
		val = fndef.fn_body.apply(this, params.concat(chain));
		//lithp_debug("Value returned (native) : ", val);
	} else if (fndef.constructor === FunctionDefinition) {
		// Call a function. Creates a new OpChain from the given
		// function body, and sets the parameters of the closure
		// to the pushed values.
		lithp_debug(debug_str);
		// Set the correct scope. If the function definition has new one, use it.
		// TODO: This parent section is a bit of a hack. It would be nicer if
		//       it were implemented outside of the interpreter.
		var parent = chain;
		if(fndef.scoped)
			parent = fndef.scoped;
		var call_chain = new OpChain(parent, fndef.fn_body);
		if(arity == '*')
			params = [params];
		// Set args in new function closure
		fndef.fn_params.forEach((Name, Index) => {
			//lithp_debug("Set '" + Name + "' to params[" + Index + "] (" + params[Index] + ")");
			// This ensures that the closure will immediately find
			// the named variable, instead of going up the stack
			// to find it (which might hold multiple variables of
			// the same name.)
			call_chain.closure.set_immediate(Name, params[Index]);
		});
		//lithp_debug("Successfully set closure, definitions:", call_chain.closure.closure);
		//lithp_debug("             parent has A            :", call_chain.closure.get("A"));
		//lithp_debug("   Parent                            :", fndef.fn_body.parent);
		//lithp_debug("Invoking FunctionDefinition");
		// Mark it as a function entry
		call_chain.function_entry = fndef.readable_name;
		// Invoke the new chain
		val = this.run(call_chain);
		//lithp_debug("Value returned: ", val);
	} else {
		throw new Error("Don't know what to do with: " + inspect(fndef));
	}
	this.depth--;
	if(global.lithp_debug_flag) {
		debug_str += " :: " + this.inspect_object([val]);
		lithp_debug(debug_str);
	}
	return val;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./types":13,"util":6}],12:[function(require,module,exports){
(function (process,global,__dirname){
/**
 * Lithp, a very small Lisp-like interpreter.
 *
 * This the parent module, and provides the basic interface to Lithp.
 * It includes exit handlers, debug flags, definitions, and basic chain
 * setup (once compiled.)
 */

"use strict";

var pjson = require('../package.json');

global._lithp = {};
global._lithp_start = new Date().getTime();
global._lithp_global_definitions = {};
global._lithp.set_toplevel = false;
global._lithp.version = pjson.version;

global._LithpDefine = function(Name, Value) { global._lithp_global_definitions[Name] = Value; };

var util = require('util'),
	inspect = util.inspect,
	path = require('path');
require('./util');
var types = require('./types'),
	Atom = types.Atom,
	FunctionDefinitionNative = types.FunctionDefinitionNative;

var enable_debug = false;
function debug() {
	if(enable_debug)
		console.error.apply(console, arguments);
}
exports.debug = debug;
exports.get_debug_flag = function() { return enable_debug; };
exports.set_debug_flag = function(V) { return global.lithp_debug_flag = enable_debug = V; };

global.lithp_debug_flag = enable_debug;
global.lithp_get_debug = exports.get_debug_flag;
global.lithp_debug = debug;

var lithp_id = 0;
var lithp_instances = {};

global.get_lithp_instances = function() { return lithp_instances; };
global.get_lithp_max_id = function() { return lithp_id; };

var atexit_list = [];
global.lithp_atexit = function(handler) { atexit_list.push(handler); }

function exitHandler(options, err) {
	var written = false;
	atexit_list.forEach(H => H(options, err));
	//if (err) console.log(err.stack);
	if (options.exit) {
		if(written)
			process.exit();
		process.stderr.once('drain', function() {
			process.exit();
		});
	}
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
//process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

function Lithp () {
	this.functions = {};
	this.depth = 0;
	this.functioncalls = 0;
	this.id = lithp_id++;
	this.stopped = false;
	this.last_chain = null;
	lithp_instances[this.id] = this;
	(require('./builtins')).setup(this);
}
exports.Lithp = Lithp;
global.Lithp = Lithp;

Lithp.prototype.debug = debug;
Lithp.prototype.get_debug_flag = exports.get_debug_flag;

// Stop this instance and remove it from instances table.
Lithp.prototype.stop = function() {
	this.debug("Instance " + this.id + " stopping");
	delete lithp_instances[this.id];
	this.stopped = true;
};

/**
 * Defines a native function (ie, one that runs in the parent language,
 * in this case JavaScript) builtin.
 * These can be called like any other Lithp function.
 */
Lithp.prototype.builtin = function(name, params, body) {
	//debug("builtin, name: " + name + ", params:", params);
	if(name.indexOf("/") == -1) {
		name = name + "/" + params.length;
	}
	if(this.functions[name])
		0;//this.debug('Error: attempt to overwrite ' + name);
	else
		this.functions[name] = new FunctionDefinitionNative(name, params, body);
};

/**
 * Call a builtin library function of the given name (including /arity) and
 * return the value.
 * The arguments must already be resolved when given to this function.
 */
Lithp.prototype.CallBuiltin = function(chain, name, args) {
	if(!this.functions[name]) {
		name = name + "/" + args.length;
	}

	if(!this.functions[name]) {
		//console.log(this.functions);
		throw new Error("Cannot call builtin: " + name + " builtin not present");
	}
	return this.invoke_functioncall(chain, this.functions[name], args);
};

/**
 * Define a symbol in the top level definitions table.
 * This works by calling a an existing builtin function.
 */
Lithp.prototype.Define = function(chain, name, args) {
	this.CallBuiltin(chain, 'define/2', [name, args]);
};

/**
 * Get a defined symbol value.
 */
Lithp.prototype.Defined = function(chain, name) {
	return this.CallBuiltin(chain, 'get-def', [name]);
};

/**
 * Setup some default definitions for giving runtime code information about
 * the current environment.
 * It also brings in the currently defined builtin functions.
 */
Lithp.prototype.setupDefinitions = function(chain, file) {
	var filename = file;
	var dirname = "";
	if(file != "[evaluated code]") {
		filename = path.resolve(filename);
		dirname  = path.resolve(path.dirname(filename));
	}
	this.Define(chain, "__filename", filename);
	this.Define(chain, "__dirname", dirname);
	// Used by builtin import/1
	var base = path.resolve(__dirname + "/..");
	this.Define(chain, "_module_search_path", [
		'', base,
		base + "/modules",
		'.', './modules'
	]);
	this.Define(chain, "_modules_imported", []);
	this.Define(chain, "DEBUG", enable_debug ? Atom('true') : Atom('false'));
	// Pull in global definitions
	for(var Name in global._lithp_global_definitions) {
		var Value = global._lithp_global_definitions[Name];
		this.Define(chain, Name, Value);
	}
	var count = chain.importClosure(this.functions);
	this.debug("Standard library loaded " + count + " symbols");
};

// Pull in interpreter
global.Lithp = Lithp;
require('./interpreter');

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},"/../lithp/lib")
},{"../package.json":36,"./builtins":10,"./interpreter":11,"./types":13,"./util":14,"_process":4,"path":3,"util":6}],13:[function(require,module,exports){
(function (global){
/**
 * Provide the basic Lithp structure types used by the interpreter.
 */

"use strict";
var util = require('util'),
    inspect = util.inspect;

function AtomValue (value, name) {
	this.value = value;
	this.type = 'Atom';
	this.name = name;
}
// This must not be changed, as it becomes the key for function names.
AtomValue.prototype.toString = function() {
	return this.name;
};

var atoms = {};
var atomid = 0;
function Atom (name) {
	if(!atoms[name]) {
		var atom = new AtomValue(++atomid, name);
		atoms[name] = atom;
		atoms[atomid] = atom;
	}
	return atoms[name];
}

exports.Atom = Atom;

var atomMissing = Atom('missing');

exports.GetAtoms = () => atoms;
exports.GetAtomsCount = () => atomid;

function Tuple () {
	this.value = Array.prototype.slice.call(arguments);
	this.length = this.value.length;
	this.type = 'Tuple';
	// Make all tuple items available via [index]
	for(var i = 0; i < this.value.length; i++)
		this[i] = this.value[i];
}
Tuple.prototype.get = function(n) { return this.value[n]; };
Tuple.prototype.length = function() { return this.value.length; };
Tuple.prototype.toString = function() {
	var parts = this.value.map(P => {
		if(!P)
			return inspect(P);
		if(typeof P == typeof "")
			return JSON.stringify(P);
		if(P.type == 'Atom')
			return "'" + P.name + "'";
		return P.toString()
	});
	return '{' + parts.join(', ') + '}';
};
exports.Tuple = Tuple;

var opchainclosure_id = 0;
exports.GetOpChainsCount = () => opchainclosure_id;
function OpChainClosure (owner, parent) {
	this.owner = owner;
	this.id = opchainclosure_id++;
	this.parent = parent;
	if(this.parent && this.parent.constructor == OpChain)
		this.parent = parent.closure;
	this.closure = {};
}
OpChainClosure.prototype.getOwner = function() { return this.owner; };
OpChainClosure.prototype.getTopOwner = function() {
	if(this.parent)
		return this.parent.getTopOwner();
	return this;
};
OpChainClosure.prototype.defined = function(name) {
	return Object.keys(this.closure).indexOf(name) != -1;
};
OpChainClosure.prototype.any_defined = function(name) {
	if(this.defined(name))
		return true;
	if(this.parent)
		return this.parent.any_defined(name);
	return false;
};
OpChainClosure.prototype._do_set = function(name, value) {
	if(value && value.constructor == LiteralValue)
		value = LiteralValue.value;
	//console.log("(Setting locally: " + name + " =", value, ")");
	this.closure[name] = value;
	return value;
};

OpChainClosure.prototype.set = function(name, value) {
	if(this.defined(name)) {
		return this._do_set(name, value);
	}
	if(this.parent) {
	//console.log("(OpChainClosure.set(" + name + ", " + value + ")");
	//console.log("(Parent is:", this.parent, ")");
		if(this.parent.try_set(name, value)) {
			//console.log("(result from parent.try_set: true)");
			return true;
		}
	}
	return this._do_set(name, value);
};
OpChainClosure.prototype.set_immediate = function(name, value) {
	return this._do_set(name, value);
};
OpChainClosure.prototype.try_set = function(name, value) {
	if(this.defined(name)) {
		this._do_set(name, value);
		return true;
	}
	if(this.parent) {
		return this.parent.try_set(name, value);
	} else if(global._lithp.set_toplevel === true) {
		this._do_set(name, value);
		return true;
	}
	return false;
};
OpChainClosure.prototype.get = function(name) {
	if(this.defined(name))
		return new Tuple("ok", new Tuple(this.closure[name], this));
	if(this.parent)
		return this.parent.get(name);
	return new Tuple("error", new Tuple("not found"));
};
OpChainClosure.prototype.get_or_missing = function(name) {
	if(this.defined(name))
		return this.closure[name];
	if(this.parent)
		return this.parent.get_or_missing(name);
	return atomMissing;
};
OpChainClosure.prototype.getDefined = function(depth) {
	if(depth === undefined)
		depth = 1;
	
	var result = {};
	for(var k in this.closure)
		result[k] = this.closure[k];
	if(--depth > 0 && this.parent) {
		var parentDefines = this.parent.getDefined(depth);
		for(var k in parentDefines)
			result[k] = parentDefines[k];
	}

	return result;
};

var opchain_id = 0;
function OpChain (parent, ops) {
	this.parent = parent;
	this.id = opchain_id++;
	if(ops && ops.constructor !== Array)
		ops = [ops];
	this.ops = ops || [];
	this.closure = new OpChainClosure(this, parent);
	this.immediate = false;
	this.pos = -1;
}
OpChain.prototype.getTopParent = function() {
	if(this.parent)
		return this.parent.getTopParent();
	return this;
};
OpChain.prototype.importClosure = function(lib) {
	var count = 0;
	for(var k in lib) {
		//lithp_debug(" importClosure: import function " + k);
		this.closure.set_immediate(k, lib[k]);
		count++;
	}
	return count;
};
OpChain.prototype.push = function(e) {
	this.ops.push(e);
};
OpChain.prototype.rewind = function() {
	this.pos = -1;
};
OpChain.prototype.next = function() {
	//this.current = this.ops.shift();
	this.pos++;
	if(this.pos > this.ops.length)
		return undefined;
	return this.current = this.ops[this.pos];
};
OpChain.prototype.get = function() {
	return this.current;
};
OpChain.prototype.toString = function() {
	var ops = [];
	this.ops.forEach(Op => {
		ops.push(Op.toString());
	});
	return "OpChain [" + ops.join(',') + "]";
};
OpChain.prototype.call = function(variables) {
	var non_imm = new OpChain();
	non_imm.parent = this.parent;
	non_imm.ops = this.ops;
	non_imm.closure = new OpChainClosure(this, this);
	non_imm._set_variables(variables);
	non_imm.non_immediate = false;
	return non_imm;
};
OpChain.prototype.call_immediate = function(variables) {
	var imm = new OpChain();
	imm.parent = this.parent;
	imm.ops = this.ops;
	imm.closure = new OpChainClosure(this, this);
	imm._set_variables(variables);
	imm.immediate = true;
	return imm;
};
OpChain.prototype.replaceWith = function(repl) {
	this.ops = repl.fn_body.ops || [];
	this.rewind();
};

OpChain.prototype._set_variables = function(variables) {
	variables = variables || {};
	for(var name in variables)
		this.closure.set_immediate(name, variables[name]);
};

exports.OpChain = OpChain;

function LiteralValue (value) {
	this.value = value;
	this.type = typeof value;
}
LiteralValue.prototype.toString = function() {
	if(!this.value)
		return inspect(this.value);
	return this.value.toString();
};
exports.LiteralValue = LiteralValue;

function VariableReference (name) {
	this.ref = name;
}
VariableReference.prototype.toString = function() {
	return this.ref;
};
exports.VariableReference = VariableReference;

function FunctionCall (name, params, reentry) {
	// TODO: Later this will allow function reentry, but
	//       for now it just acts as a normal function call.
	//       This does mean head recursive functions can run
	//       out of stack space, but provides a much easier
	//       implementation.
	//this.fn__reentry = false;
	this.fn_args = params.length;
	this.fn_name = name;
	this.fn_params = params;
}
FunctionCall.prototype.toString = function() {
	return "FnCall " + this.fn_name;
};
exports.FunctionCall = FunctionCall;

function FunctionReentry (name, params) {
	return new FunctionCall(name, params, true);
}
exports.FunctionReentry = FunctionReentry;

function FunctionDefinition (parent, name, params, body) {
	// Keeps track of how many times this FunctionDefinition has been cloned.
	// It would most likely be cloned when used in scope/1.
	this.instance_id = 0;
	if(arguments.length > 0) {
		this.fn_name = name;
		this.fn_params = params;
		this.fn_body = new OpChain(parent, body);
		var m = name.match(/^([^A-Z][^\/]*)\/([0-9]+|\*)$/);
		if(!m)
			throw new Error("Could not parse function name for arity: " + inspect(name));
		this.arity = m[2] == '*' ? '*' : parseInt(m[2]);
		this.readable_name = m[1];
	}
	this.function_entry = this.readable_name;
}
FunctionDefinition.prototype.clone = function() {
	var obj = new FunctionDefinition();
	obj.fn_name = this.fn_name;
	obj.fn_params = this.fn_params;
	obj.fn_body = this.fn_body.call();
	obj.arity = this.arity;
	obj.readable_name = this.readable_name;
	obj.instance_id++;
	return obj;
};
FunctionDefinition.prototype.toString = function() {
	return "[FnDef:" + this.fn_name + ":" + this.instance_id + ", " + (this.scoped ? "scoped, " : "") +
		"params: " + this.fn_params.join(', ') +
		", body: " + this.fn_body.ops + "]";
};
exports.FunctionDefinition = FunctionDefinition;

var anonymous_counter = 0;
function AnonymousFunction (parent, params, body) {
	// Anonymous functions cannot have arity *
	var fn_name = "__anonymous" + (++anonymous_counter) + "/" + params.length;
	return new FunctionDefinition(parent, fn_name, params, body);
}
exports.AnonymousFunction = AnonymousFunction;

function FunctionDefinitionNative (name, params, body) {
	this.fn_name = name;
	this.fn_params = params;
	this.fn_body = body;
	var m = name.match(/^([^A-Z][^\/]*)\/([0-9]+|\*)$/);
	if(!m)
		throw new Error("Could not parse function name for arity: " + inspect(name));
	this.arity = m[2] == '*' ? '*' : parseInt(m[2]);
	this.readable_name = m[1];
}
exports.FunctionDefinitionNative = FunctionDefinitionNative;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"util":6}],14:[function(require,module,exports){
(function (global){
/**
 * Provides some additional utility functions.
 */

global.__lithp = {};
global.__lithp_define = function(Name, Value) { return global.__lithp[Name] = Value || 1; };
global.__lithp_defined = function(Name) { return Name in global.__lithp; };

if(!__lithp_defined('util')) {

__lithp_define('util');

// Add non-destructive methods of moving through an Array
Array.prototype.iterator = function() { return new ArrayIterator(this); };

function ArrayIterator (arr) {
	this.array = arr;
	if(arr.length > 0)
		this.refresh(arr);
	else
		this.index = -1;
	this.rewind();
}

ArrayIterator.prototype.rewind = function() { this.index = 0; };
ArrayIterator.prototype.next   = function() {
	if(this.index >= this.array.length)
		return undefined;
	return this.get(this.index++);
};
ArrayIterator.prototype.prev = function() {
	if(this.index == -1)
		throw new Error("Cannot move before first element");
	this.index--;
	return this.get(this.index);
};
ArrayIterator.prototype.get = function(index) {
	if(index === undefined)
		index = this.index;
	return this.array[index];
};
ArrayIterator.prototype.set = function(index, val) {
	if(index === undefined)
		index = this.index;
	this.array[index] = val;
	this.refresh();
};
ArrayIterator.prototype.set_current = function(val) {
	this.set(this.index, val);
};

ArrayIterator.prototype.push = function(val) {
	//console.log("Pushing: ", val);
	this.array.push(val);
	this.refresh(this.array);
	return this.next();
};

ArrayIterator.prototype.pop = function() {
	var val = this.array.pop();
	this.refresh(this.array);
	if(this.index > this.length)
		this.index = this.length;
	return this.get();
};

ArrayIterator.prototype.refresh = function(arr) {
	this.length = this.array.length;
};

Object.clone = function(src) { return Object.assign({}, src); };

/*
	Taken from: http://stackoverflow.com/questions/10539938/override-the-equivalence-comparison-in-javascript

	Object.equals

	Desc:       Compares an object's properties with another's, return true if the objects
	            are identical.
	params:
		obj = Object for comparison
*/
Object.equals = function(a, b)
{
	/*Make sure the object is of the same type as this*/
	if(typeof b != typeof a)
		return false;

	/*Iterate through the properties of a bect looking for a discrepancy between a and b*/
	for(var property in a)
	{

		/*Return false if b doesn't have the property or if its value doesn't match a' value*/
		if(typeof b[property] == "undefined")
			return false;   
		if(b[property] != a[property])
			return false;
	}

	/*Object's properties are equivalent */
	return true;
}

/*
	Taken from: http://stackoverflow.com/questions/5072136/javascript-filter-for-objects

	Object.filter

	Desc:       Filters an object using a function. Modified for better usage.

	params:
		obj       = Object to filter
		predicate = function(Key, Value) => bool (true to keep, false to discard)
*/
Object.filter = function(obj, predicate) {
	var result = {}, key;
	for(key in obj)
		if(obj.hasOwnProperty(key) && predicate(key, obj[key]))
			result[key] = obj[key];
	return result;
};

global.timeCall = function(Title, Callback) {
	var start = new Date().getTime();
	var value = Callback();
	var total = new Date().getTime() - start;
	return [value, total];
};

} // if(!__lithp_defined('util'))

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],15:[function(require,module,exports){
module.exports=[[["import","lists"],["import","match"],["def","fac",{"code":[[["when",["tuple","{==","0","N}","{1}"],["tuple","{true}","{*","N",["fac",["-","N","1"]],"}"]]]],"_fndef":true,"_fnparams":["N"]}],["print",["fac","10"]],["print","[1","2","3","4]"],["def","count-items-inner",{"code":[[["when",["tuple","{is-list","Ele}","{count-items","Ele}"],["tuple","{true}","{1}"]]]],"_fndef":true,"_fnparams":["Ele"]}],["def","count-items",{"code":[[["foldl","List","0",{"code":[[["+","A",["count-items-inner","I"]]]],"_fndef":true,"_fnparams":["I","A"]}]]],"_fndef":true,"_fnparams":["List"]}],["print",["count-items","[1","2","[3","4","[5","6]","7]","8]"]]]]
},{}],16:[function(require,module,exports){
module.exports=[[["import","class"],["import","file"],["import","lists"],["import","stream"],["def","get-basedir",{"code":[[["var","Possibilities",["list","\"\"","\"node_modules/lithp/\"","\"../\"","\"../node_modules/lithp/\""]],["get-basedir",["head","Possibilities"],["tail","Possibilities"],"Dir"]]],"_fndef":true,"_fnparams":["Dir"]}],["def","get-basedir",{"code":[[["var","Actual",["+","Head","Dir"]],["try",[["read-dir","Actual"],["Actual"]],["catch",{"code":[[["if",[">",["length","Tail"],"0"],[["next","get-basedir",["head","Tail"],["tail","Tail"],"Dir"]],["else",[["throw","\"Cannot find macro\""]]]]]],"_fndef":true,"_fnparams":[]}]]]],"_fndef":true,"_fnparams":["Head","Tail","Dir"]}],["var","MacroPreprocessor",["class","'MacroPreprocessorClass'",["tuple",["class-init"],{"code":[[["var","Dir",["get-basedir","BaseDir"]],["var","Files",["filter",["read-dir","Dir"],{"code":[[["!=",["null"],["match","N",["regex","\"\\\\.h$\""]]]]],"_fndef":true,"_fnparams":["N"]}]],["var","Definitions",["list"]],["each","Files",["scope",{"code":[[["set","Definitions",["++","Definitions",["list",["new","Definition","File"]]]]]],"_fndef":true,"_fnparams":["File"]}]],["member-set","Self","definitions","Definitions"]]],"_fndef":true,"_fnparams":["Self","BaseDir"]}],["tuple","parse",{"code":[[["foldl",["member-get","Self","definitions"],"File",{"code":[[["member-call","Def","parse","Acc"]]],"_fndef":true,"_fnparams":["Def","Acc"]}]]],"_fndef":true,"_fnparams":["Self","File"]}]]],["var","Definition",["class","'DefinitionClass'",["tuple",["class-init"],{"code":[[["var","Contents",["read-lines",["+","Dir","\"/\"","File"]]],["var","Definitions",["dict"]],["dict-set","Definitions","'__FILE__'",["resolve","File"]],["member-set","Self","definitions",["member-call","Self","parse-contents","Contents","Definitions"]]]],"_fndef":true,"_fnparams":["Self","File"]}],["tuple","parse-contents",{"code":[[["if",["==","0",["length","Contents"]],[["Definitions"]],["else",[["while",[[">",["length","Contents"],"0"]],[["var","Line",["head","Contents"]],["set","Contents",["tail","Contents"]],["var","Match",["match","Line",["regex","\"^\\\\s*#([a-z]+)(?:\\\\s+([^ ]+))?(?:\\\\s+(.+))?\\\\s*$\""]]],["if",["!=",["null"],"Match"],[["var","Directive",["index","Match","1"]],["var","Name",["index","Match","2"]],["var","Value",["index","Match","3"]],["if",["==","\"define\"","Directive"],[["dict-set","Definitions","Name","Value"]],["else",[["throw",["+","\"Unknown directive: \"","Directive"]]]]]]]]],["Definitions"]]]]]],"_fndef":true,"_fnparams":["Self","Contents","Definitions"]}],["tuple","add-def",{"code":[[["var","Definitions",["member-get","Self","definitions"]],["if",["dict-present","Definitions","Search"],[["throw",["+","\"Attempted redefinition of \"","Search"]]]],["dict-set","Definitions","Search","Replace"],["Self"]]],"_fndef":true,"_fnparams":["Self","Search","Replace"]}],["tuple","get-defs",{"code":[[["member-get","Self","definitions"]]],"_fndef":true,"_fnparams":["Self"]}],["tuple","parse",{"code":[[["var","Definitions",["member-get","Self","definitions"]],["foldl",["dict-keys","Definitions"],"Contents",["scope",{"code":[[["var","Search",["get","Def"]],["var","Replace",["dict-get","Definitions","Def"]],["replace","Result",["regex","Search","g"],"Replace"]]],"_fndef":true,"_fnparams":["Def","Result"]}]]]],"_fndef":true,"_fnparams":["Self","Contents"]}]]],["var","Preprocessor",["new","MacroPreprocessor","\"macro\""]],["if",["get-def","'__MAIN__'"],[["var","TestCode",["readInputStream"]],["print",["member-call","Preprocessor","parse","TestCode"]]]],["def","macro-preprocessor",{"code":[[["member-call","Preprocessor","parse","Contents"]]],"_fndef":true,"_fnparams":["Contents"]}],["export-global","macro-preprocessor/1"]]]
},{}],17:[function(require,module,exports){
module.exports=[[["def","assert",{"code":[[["if",["!","Result"],[["throw",["+","\"Assert failed:\"","Description"]]]],["atom","true"]]],"_fndef":true,"_fnparams":["Result","Description"]}],["def","assert",{"code":[[["if",["!","Result"],[["throw","\"Assert failed\""]]],["atom","true"]]],"_fndef":true,"_fnparams":["Result"]}],["export-global","assert/1","assert/2"],["def","exception-message",{"code":[[["index","E","message"]]],"_fndef":true,"_fnparams":["E"]}],["export-global","exception-message/1"],["if",["get-def","'ASSERT_TEST'"],[["try",[["assert",["==","0","1"],"\"Mismatch check\""]],["catch",{"code":[[["print","\"Mismatch check success\""]]],"_fndef":true,"_fnparams":[]}]],["try",[["assert",["!=","0","0"],"\"Equality check\""],["throw","\"Equality check issue\""]],["catch",{"code":[[["if",["==",["exception-message","E"],"\"Equality check issue\""],[["throw","E"]],["else",[["print","\"Equality check success\""]]]]]],"_fndef":true,"_fnparams":["E"]}]]]]]]
},{}],18:[function(require,module,exports){
module.exports=[[["import","\"lists\""],["var","Bignum",["require","\"bignum\""]],["def","bignum",{"code":[[["call","Bignum","Value"]]],"_fndef":true,"_fnparams":["Value"]}],["def","b+",{"code":[[["invoke","A","add","B"]]],"_fndef":true,"_fnparams":["A","B"]}],["def","b-",{"code":[[["invoke","A","sub","B"]]],"_fndef":true,"_fnparams":["A","B"]}],["def","b*",{"code":[[["invoke","A","mul","B"]]],"_fndef":true,"_fnparams":["A","B"]}],["def","b//2",{"code":[[["invoke","A","div","B"]]],"_fndef":true,"_fnparams":["A","B"]}],["def","babs",{"code":[[["invoke","N","abs"]]],"_fndef":true,"_fnparams":["N"]}],["def","bneg",{"code":[[["invoke","N","neg"]]],"_fndef":true,"_fnparams":["N"]}],["def","b>",{"code":[[["==",["invoke","A","gt","B"],["true"]]]],"_fndef":true,"_fnparams":["A","B"]}],["def","b>=",{"code":[[["==",["invoke","A","ge","B"],["true"]]]],"_fndef":true,"_fnparams":["A","B"]}],["def","b<",{"code":[[["==",["invoke","A","lt","B"],["true"]]]],"_fndef":true,"_fnparams":["A","B"]}],["def","b<=",{"code":[[["==",["invoke","A","le","B"],["true"]]]],"_fndef":true,"_fnparams":["A","B"]}],["def","b==",{"code":[[["==",["invoke","A","eq","B"],["true"]]]],"_fndef":true,"_fnparams":["A","B"]}],["def","bpow",{"code":[[["invoke","A","pow","B"]]],"_fndef":true,"_fnparams":["A","B"]}],["def","bpowm",{"code":[[["invoke","A","powm","N","M"]]],"_fndef":true,"_fnparams":["A","N","M"]}],["def","binvertm",{"code":[[["invoke","A","invertm","M"]]],"_fndef":true,"_fnparams":["N","M"]}],["def","brand",{"code":[[["call","Bignum","rand"]]],"_fndef":true,"_fnparams":[]}],["def","brand",{"code":[[["call","Bignum","rand","U"]]],"_fndef":true,"_fnparams":["U"]}],["def","bsqrt",{"code":[[["invoke","N","sqrt"]]],"_fndef":true,"_fnparams":["N"]}],["def","broot",{"code":[[["invoke","N","root","M"]]],"_fndef":true,"_fnparams":["N","M"]}],["def","b<<",{"code":[[["invoke","N","shiftLeft","S"]]],"_fndef":true,"_fnparams":["N","S"]}],["def","b>>",{"code":[[["invoke","N","shiftRight","S"]]],"_fndef":true,"_fnparams":["N","S"]}],["def","bgcd",{"code":[[["invoke","N","gcd","M"]]],"_fndef":true,"_fnparams":["N","M"]}],["def","bjacobi",{"code":[[["invoke","N","jacobi","M"]]],"_fndef":true,"_fnparams":["N","M"]}],["export-global","bignum/1"],["export-global","b+/2","b-/2","b*/2","b//2"],["export-global","babs/1","bneg/1"],["export-global","b>/2","b>=/2","b</2","b<=/2","b==/2"],["export-global","bpow/2","bpowm/3","binvertm/2"],["export-global","brand/0","brand/1","bsqrt/1","broot/2"],["export-global","b<</2","b>>/2","bgcd/2","bjacobi/2"],["def","bsum",{"code":[[["foldl","L",["bignum","0"],["scope",{"code":[[["b+","N","A"]]],"_fndef":true,"_fnparams":["N","A"]}]]]],"_fndef":true,"_fnparams":["L"]}],["def","bprod",{"code":[[["foldl","L",["bignum","1"],["scope",{"code":[[["b*","A",["bignum","N"]]]],"_fndef":true,"_fnparams":["N","A"]}]]]],"_fndef":true,"_fnparams":["L"]}],["export-global","bsum/1","bprod/1"],["if",["get-def","'TEST'"],[["var","N1",["bignum","\"782910138827292261791972728324982\""]],["var","N2",["bignum","\"612948285478570042376183478471174272694879005539119746287405300324\""]],["print",["to-string",["b+","N1","N2"]]],["print",["to-string",["b-","N1","N2"]]],["print",["to-string",["b*","N1","N2"]]],["print",["to-string",["b/","N2","N1"]]],["print",["b>","N1","N2"]],["print",["b>=","N2","N1"]],["print",["brand"]],["print",["brand","2"]],["print",["bsum",["list","N1","N2"]]]]]]]
},{}],19:[function(require,module,exports){
module.exports=[[["var","Buffer",["index",["require","\"buffer\""],"\"Buffer\""]],["var","DefaultBufferSize","1024"],["def","buffer",{"code":[[["buffer","DefaultBufferSize"]]],"_fndef":true,"_fnparams":[]}],["def","buffer",{"code":[[["call","Buffer","Size"]]],"_fndef":true,"_fnparams":["Size"]}],["export-global","buffer/0","buffer/1"],["if",["get-def","'TEST'"],[["print","\"A buffer: \"",["buffer"]]]]]]
},{}],20:[function(require,module,exports){
module.exports=[[["platform","v1"],["var","Cache",["dict"]],["def","cache-result",["scope",{"code":[[["var","Dict",["dict-get","Cache","Name"]],["if",["==",["null"],"Dict"],[["dict-set","Cache","Name",["dict"]],["set","Dict",["dict-get","Cache","Name"]]]],["if",["dict-present","Dict","Value"],[["dict-get","Dict","Value"]],["else",[["var","R",["call","Function","Value"]],["dict-set","Dict","Value","R"],"R"]]]]],"_fndef":true,"_fnparams":["Value","Name","Function"]}]],["export-global","cache-result/3"],["if",["get-def","'TEST'"],[["def","myf",{"code":[[["if",["<","N","2"],["1"],[["+",["cache-result",["-","N","1"],"myf",["get","\"myf/1\""]],["cache-result",["-","N","2"],"myf",["get","\"myf/1\""]]]]]]],"_fndef":true,"_fnparams":["N"]}],["print","myf","15"],["import","\"lists\""],["each",["seq","1","15"],["scope",{"code":[[["print","\" \"","N","\":\"",["myf","N"]]]],"_fndef":true,"_fnparams":["N"]}]]]]]]
},{}],21:[function(require,module,exports){
module.exports=[[["import","lists"],["def","class-init",{"code":[[["\"__init\""]]],"_fndef":true,"_fnparams":[]}],["def","class-class",{"code":[[["\"__class__\""]]],"_fndef":true,"_fnparams":[]}],["def","class-funcs",{"code":[[["\"__functions__\""]]],"_fndef":true,"_fnparams":[]}],["def","class-instc",{"code":[[["\"__instance__\""]]],"_fndef":true,"_fnparams":[]}],["export-global","class-init/0","class-class/0","class-funcs/0","class-instc/0"],["def","member-set",{"code":[[["dict-set","Instance","Name","Value"]]],"_fndef":true,"_fnparams":["Instance","Name","Value"]}],["def","member-get",{"code":[[["dict-get","Instance","Name"]]],"_fndef":true,"_fnparams":["Instance","Name"]}],["def","member-present",{"code":[[["dict-present","Instance","Name"]]],"_fndef":true,"_fnparams":["Instance","Name"]}],["export-global","member-set/3","member-get/2","member-present/2"],["def","member-call/*",{"code":[[["var","Self",["head","Args"]],["set","Args",["tail","Args"]],["var","Fun",["head","Args"]],["var","Params",["++",["list","Self"],["tail","Args"]]],["var","Instance",["member-get","Self",["class-instc"]]],["var","Funcs",["member-get","Instance",["class-funcs"]]],["var","Dest",["member-get","Funcs","Fun"]],["apply","Dest","Params"]]],"_fndef":true,"_fnparams":["Args"]}],["export-global","member-call/*"],["def","class/*",{"code":[[["var","Name",["head","Args"]],["var","Members",["tail","Args"]],["var","Instance",["dict"]],["dict-set","Instance",["class-class"],"Name"],["dict-set","Instance",["class-funcs"],["dict"]],["foldl","Members","Instance",{"code":[[["member-set",["dict-get","Self",["class-funcs"]],["index","Member","0"],["index","Member","1"]],["Self"]]],"_fndef":true,"_fnparams":["Member","Self"]}]]],"_fndef":true,"_fnparams":["Args"]}],["def","new/*",{"code":[[["var","Class",["head","Args"]],["var","Params",["tail","Args"]],["var","Instance",["dict"]],["member-set",["get","Instance"],["class-instc"],["get","Class"]],["if",["member-present",["member-get","Class",["class-funcs"]],["class-init"]],[["apply","member-call",["++",["list","Instance",["class-init"]],"Params"]]]],["Instance"]]],"_fndef":true,"_fnparams":["Args"]}],["export-global","class/*","new/*"],["if",["get-def","'CLASS_TEST'"],[["var","TestClass",["class","'TestClass'",["tuple",["class-init"],{"code":[[["member-set","Self","base","Base"]]],"_fndef":true,"_fnparams":["Self","Base"]}],["tuple","'add'",{"code":[[["to-string",["+","A","B"],["member-get","Self","base"]]]],"_fndef":true,"_fnparams":["Self","A","B"]}]]],["var","Base10",["new","TestClass","10"]],["var","Base2",["new","TestClass","2"]],["print",["member-call","Base10","add","5","10"]],["print",["member-call","Base2","add","5","10"]]]]]]
},{}],22:[function(require,module,exports){
module.exports=[[["import","\"lists\""],["var","FS",["require","\"fs\""]],["var","Path",["require","\"path\""]],["def","resolve",{"code":[[["invoke","Path","resolve","Filename"]]],"_fndef":true,"_fnparams":["Filename"]}],["export-global","resolve/1"],["def","read-file",{"code":[[["set","Filename",["invoke","Path","resolve","Filename"]],["invoke","FS","readFileSync","Filename"]]],"_fndef":true,"_fnparams":["Filename"]}],["def","read-file",{"code":[[["set","Filename",["invoke","Path","resolve","Filename"]],["invoke","FS","readFile","Filename",["js-bridge","Callback"]]]],"_fndef":true,"_fnparams":["Filename","Callback"]}],["def","file-exists",{"code":[[["==",["true"],["invoke","FS","existsSync","Path"]]]],"_fndef":true,"_fnparams":["Path"]}],["def","is-file",{"code":[[["==",["true"],["invoke",["file-lstat","Path"],"isFile"]]]],"_fndef":true,"_fnparams":["Path"]}],["def","is-directory",{"code":[[["and",["!",["is-file","Path"]],["file-exists","Path"]]]],"_fndef":true,"_fnparams":["Path"]}],["def","file-lstat",{"code":[[["try",[["invoke","FS","lstatSync","Path"]],["catch",{"code":[[["lstat-empty","Path"]]],"_fndef":true,"_fnparams":["E"]}]]]],"_fndef":true,"_fnparams":["Path"]}],["def","read-dir",{"code":[[["invoke","FS","readdirSync","Path"]]],"_fndef":true,"_fnparams":["Path"]}],["export-global","read-dir/1"],["var","LStatMembers",["list","\"dev\"","\"mode\"","\"nlink\"","\"uid\"","\"gid\"","\"rdev\"","\"blksize\"","\"ino\"","\"size\"","\"blocks\"","\"atime\"","\"mtime\"","\"ctime\"","\"birthtime\""]],["def","lstat-empty",{"code":[[["var","Result",["dict"]],["each","LStatMembers",["scope",{"code":[[["dict-set","Result","M","0"]]],"_fndef":true,"_fnparams":["M"]}]],["dict-set","Result","isFile",["js-bridge",{"code":[[["false"]]],"_fndef":true,"_fnparams":[]}]],["get","Result"]]],"_fndef":true,"_fnparams":["Path"]}],["export-global","read-file/1","read-file/2","file-exists/1","is-file/1","is-directory/1","file-lstat/1"],["def","read-lines",{"code":[[["split",["to-string",["read-file","File"]],["regex","\"\\\\r?\\\\n\""]]]],"_fndef":true,"_fnparams":["File"]}],["export-global","read-lines/1"],["if",["==","true",["get-def","'TEST'"]],[["read-file","\"index.js\"",{"code":[[["print","\"Got Err:\"","Err"],["if",["!=",["undefined"],"Data"],[["print","\"Got Data:\"",["to-string","Data"]]]]]],"_fndef":true,"_fnparams":["Err","Data"]}],["print",["file-exists","\"run\""]],["print",["is-file","\"run\""]],["print",["is-file","\"src\""]],["print",["is-directory","\"src\""]],["print",["file-lstat","\"run1\""]],["print",["is-file","\"run1\""]]]]]]
},{}],23:[function(require,module,exports){
module.exports=[[["if",["get-def","'NATIVE'"],[["def","map",{"code":[[["map-inner",["list"],"List","Callback"]]],"_fndef":true,"_fnparams":["List","Callback"]}]]],["def","map-inner",{"code":[[["if",["==","0",["length","List"]],[["Acc"]],["else",[["recurse",["++","Acc",["list",["call","Callback",["head","List"]]]],["tail","List"],"Callback"]]]]]],"_fndef":true,"_fnparams":["Acc","List","Callback"]}],["def","foldl",{"code":[[["if",["==","0",["length","List"]],[["Current"]],["else",[["recurse",["tail","List"],["call","Callback",["head","List"],"Current"],"Callback"]]]]]],"_fndef":true,"_fnparams":["List","Current","Callback"]}],["def","each",{"code":[[["each-inner","0","List","Callback"]]],"_fndef":true,"_fnparams":["List","Callback"]}],["def","each-inner",{"code":[[["if",["==","0",["length","List"]],[["atom","nil"]],["else",[["call","Callback",["head","List"],"Idx"],["recurse",["+","Idx","1"],["tail","List"],"Callback"]]]]]],"_fndef":true,"_fnparams":["Idx","List","Callback"]}],["def","each-idx",{"code":[[["each","List","Callback"]]],"_fndef":true,"_fnparams":["List","Callback"]}],["export-global","each/2","each-idx/2"],["def","seq",{"code":[[["seq","N0","N1",["?",["<","N0","N1"],"1","-1"]]]],"_fndef":true,"_fnparams":["N0","N1"]}],["def","seq",{"code":[[["set","L",["list"]],["var","N",["get","N0"]],["while",[["if",[">=","Inc","1"],[["<=","N","N1"]],[[">=","N","N1"]]]],[["set","L",["++","L",["list","N"]]],["set","N",["+","N","Inc"]]]],"L"]],"_fndef":true,"_fnparams":["N0","N1","Inc"]}],["export-global","map/2","foldl/3","each/2","seq/2","seq/3"],["var","PermutationsPossibilities",["list","0","1","2","6","24","120","720","5040","40320","362880","3628800","39916800","479001600"]],["def","permutations",{"code":[[["var","Length",["length","List"]],["var","Result",["list-fill",["index","PermutationsPossibilities","Length"],"0"]],["var","C",["list-fill","Length","0"]],["var","I","1"],["var","J","1"],["index-set","Result","0",["slice","List"]],["while",[["<","I","Length"]],[["var","CI",["index","C","I"]],["if",["<","CI","I"],[["var","K",["?",["@","I","2"],["get","CI"],"0"]],["var","P",["index","List","I"]],["index-set","List","I",["index","List","K"]],["index-set","List","K","P"],["index-set","C","I",["+","1","CI"]],["set","I","1"],["index-set","Result","J",["slice","List"]],["set","J",["+","1",["get","J"]]]],["else",[["index-set","C","I","0"],["set","I",["+","1",["get","I"]]]]]]]],["get","Result"]]],"_fndef":true,"_fnparams":["List"]}],["export-global","permutations/1"],["def","sum",{"code":[[["foldl","L","0",{"code":[[["+","N","A"]]],"_fndef":true,"_fnparams":["N","A"]}]]],"_fndef":true,"_fnparams":["L"]}],["def","prod",{"code":[[["foldl","L","1",{"code":[[["*","A","N"]]],"_fndef":true,"_fnparams":["N","A"]}]]],"_fndef":true,"_fnparams":["L"]}],["export-global","sum/1","prod/1"],["def","filter",{"code":[[["filter-inner","List","Predicate",["list"]]]],"_fndef":true,"_fnparams":["List","Predicate"]}],["def","filter-inner",{"code":[[["if",["==","0",["length","List"]],[["Acc"]],["else",[["var","Ele",["head","List"]],["if",["call","Predicate","Ele"],[["recurse",["tail","List"],"Predicate",["++","Acc",["list","Ele"]]]],["else",[["recurse",["tail","List"],"Predicate","Acc"]]]]]]]]],"_fndef":true,"_fnparams":["List","Predicate","Acc"]}],["export-global","filter/2"],["def","max/*",{"code":[[["set","List",["flatten","List"]],["foldl",["tail","List"],["head","List"],{"code":[[["?",[">","V","A"],"V","A"]]],"_fndef":true,"_fnparams":["V","A"]}]]],"_fndef":true,"_fnparams":["List"]}],["def","min/*",{"code":[[["set","List",["flatten","List"]],["foldl",["tail","List"],["head","List"],{"code":[[["?",["<","V","A"],"V","A"]]],"_fndef":true,"_fnparams":["V","A"]}]]],"_fndef":true,"_fnparams":["List"]}],["export-global","min/*","max/*"],["if",["get-def","'NATIVE'"],[["def","flat-map",{"code":[[["apply","++",["++",["list"],["map","List","Callback"]]]]],"_fndef":true,"_fnparams":["List","Callback"]}]]],["def","lcomp",{"code":[[["lcomp-inner",["list"],["head","Generators"],"Handler",["tail","Generators"],"Filter"]]],"_fndef":true,"_fnparams":["Handler","Generators","Filter"]}],["def","lcomp",{"code":[[["lcomp","Handler","Generators",{"code":[[["atom","true"]]],"_fndef":true,"_fnparams":[]}]]],"_fndef":true,"_fnparams":["Handler","Generators"]}],["def","lcomp-inner",{"code":[[["flat-map","List",["scope",{"code":[[["var","Current",["++","Base",["list","Ele"]]],["if",[">",["length","Generators"],"0"],[["lcomp-inner","Current",["head","Generators"],"Handler",["tail","Generators"],"Filter"]],["else",[["if",["apply","Filter","Current"],[["list",["apply","Handler","Current"]]],["else",[["list"]]]]]]]]],"_fndef":true,"_fnparams":["Ele"]}]]]],"_fndef":true,"_fnparams":["Base","List","Handler","Generators","Filter"]}],["export-global","lcomp/3","lcomp/2"],["def","reverse",{"code":[[["next","reverse","L",["list"]]]],"_fndef":true,"_fnparams":["L"]}],["def","reverse",{"code":[[["if",["==","0",["length","L"]],[["Acc"]],["else",[["recurse",["tail","L"],["++",["list",["head","L"]],"Acc"]]]]]]],"_fndef":true,"_fnparams":["L","Acc"]}],["export-global","reverse/1"],["def","zip",{"code":[[["zip","A","B",["list"]]]],"_fndef":true,"_fnparams":["A","B"]}],["def","zip",{"code":[[["if",["or",["==","0",["length","A"]],["==","0",["length","B"]]],[["Acc"]],["else",[["recurse",["tail","A"],["tail","B"],["++","Acc",["list",["tuple",["head","A"],["head","B"]]]]]]]]]],"_fndef":true,"_fnparams":["A","B","Acc"]}],["export-global","zip/2"],["if",["==","true",["get-def","'TEST'"]],[["var","SampleList",["list","1","2","4","8","16","32"]],["print","\"Each test: \"",["each","SampleList",{"code":[[["print","N"]]],"_fndef":true,"_fnparams":["N"]}]],["print","\"Each-idx test: \"",["each-idx","SampleList",{"code":[[["print",["++","\"\"","I","\": \"","N"]]]],"_fndef":true,"_fnparams":["N","I"]}]],["print","\"Map test: \"",["map","SampleList",{"code":[[["*","N","2"]]],"_fndef":true,"_fnparams":["N"]}]],["print","\"Foldl test: \"",["foldl","SampleList","0",{"code":[[["+","N","A"]]],"_fndef":true,"_fnparams":["N","A"]}]],["print","\"Foldl test: \"",["foldl","SampleList","0",{"code":[[["<<","N","A"]]],"_fndef":true,"_fnparams":["N","A"]}]],["print","\"Empty map test: \"",["map",["list"],{"code":[[["*","N","2"]]],"_fndef":true,"_fnparams":["N"]}]],["print","\"Empty foldl test:\"",["foldl",["list"],"0",{"code":[[["+","N","A"]]],"_fndef":true,"_fnparams":["N","A"]}]],["each","SampleList",{"code":[[["print","\"N:\"","N"]]],"_fndef":true,"_fnparams":["N"]}],["print","\"Seq test:\"",["seq","1","5"]],["print","\"Reverse seq test:\"",["seq","5","1"]],["print","\"Sum test:\"",["sum","SampleList"]],["print","\"Prod test:\"",["prod","SampleList"]],["print","\"Permutations test: \"",["permutations",["list","1","2","3"]]],["print","\"Max test:\"",["max","10","5","9","4","8","3","6","2","1","0"]],["print","\"Min test:\"",["min","10","5","9","4","8","3","6","2","1","0"]],["print","\"Filter test:\"",["filter",["seq","1","10"],{"code":[["==","0",["@","V","2"]]],"_fndef":true,"_fnparams":["V"]}]],["var","Generators",["list",["seq","1","10"],["seq","1","5"],["seq","1","3"]]],["var","Handler",{"code":[["list",["list","X","Y","Z"]]],"_fndef":true,"_fnparams":["X","Y","Z"]}],["var","Filter",{"code":[[["and",["==","0",["@","X","2"]],["==","0",["@","Y","2"]],["==","0",["@","Z","2"]]]]],"_fndef":true,"_fnparams":["X","Y","Z"]}],["print","\"List comprehension test: \"",["lcomp","Handler","Generators","Filter"]],["print","\"Reverse test: \"",["reverse","SampleList"]],["print","\"Zip test: \"",["zip",["list","a","b","c","d"],["list","1","2","3","4"]]]]]]]
},{}],24:[function(require,module,exports){
module.exports=[[["def","true",{"code":[[["atom","true"]]],"_fndef":true,"_fnparams":[]}],["def","false",{"code":[[["atom","false"]]],"_fndef":true,"_fnparams":[]}],["export-global","true/0","false/0"],["def","is-number",{"code":[[["==","number",["typeof","V"]]]],"_fndef":true,"_fnparams":["V"]}],["def","is-string",{"code":[[["==","string",["typeof","V"]]]],"_fndef":true,"_fnparams":["V"]}],["def","is-function",{"code":[[["==","function",["typeof","V"]]]],"_fndef":true,"_fnparams":["V"]}],["def","is-function",{"code":[[["if",["is-function","V"],[["==","Arity",["function-arity","V"]]],["else",[["atom","false"]]]]]],"_fndef":true,"_fnparams":["V","Arity"]}],["def","is-list",{"code":[[["==","list",["typeof","V"]]]],"_fndef":true,"_fnparams":["V"]}],["def","is-atom",{"code":[[["==","atom",["typeof","V"]]]],"_fndef":true,"_fnparams":["V"]}],["def","is-dict",{"code":[[["==","dict",["typeof","V"]]]],"_fndef":true,"_fnparams":["V"]}],["def","is-tuple",{"code":[[["==","tuple",["typeof","V"]]]],"_fndef":true,"_fnparams":["V"]}],["export-global","is-number/1","is-string/1","is-function/1","is-function/2","is-list/1","is-atom/1","is-dict/1","is-tuple/1"],["def","when/*",{"code":[[["when-inner","Handlers"]]],"_fndef":true,"_fnparams":["Handlers"]}],["def","when-inner",{"code":[[["var","Handler",["head","Handlers"]],["var","Test",["index","Handler","0"]],["var","Success",["index","Handler","1"]],["var","TestResult","false"],["if",["is-atom","Test"],[["set","TestResult",["get","Test"]]],["else",[["if",["is-function","Test"],[["set","TestResult",["call","Test"]]],["else",[["throw","\"Unknown test given in when/*\""]]]]]]],["if",["==","true","TestResult"],[["call","Success"]],["else",[["if",[">",["length","Handlers"],"1"],[["recurse",["tail","Handlers"]]],["else",[["throw","\"No matching clause in when\""]]]]]]]]],"_fndef":true,"_fnparams":["Handlers"]}],["export-global","when/*"],["if",["get-def","'MATCH_TEST'"],[["import","assert"],["assert",["is-number","1"],"\"is-number integer check\""],["assert",["is-number","1.00"],"\"is-number float check\""],["assert",["is-string","\"A\""],"\"is-string check\""],["assert",["is-list",["list"]],"\"is-list check\""],["assert",["is-atom","atom"],"\"is-atom check\""],["assert",["is-function",["scope",{"code":[[["1"]]],"_fndef":true,"_fnparams":[]}]],"\"is-function check\""],["assert",["is-function",["scope",{"code":[[["1"]]],"_fndef":true,"_fnparams":["A","B","C"]}],"3"],"\"is-function #/3 check\""],["assert",["is-dict",["dict"]],"\"is-dict check\""],["assert",["is-tuple",["tuple"]],"\"is-tuple check\""],["def","test",{"code":[[["when",["tuple",["scope",{"code":[[["is-string","What"]]],"_fndef":true,"_fnparams":[]}],["scope",{"code":[[["atom","string"]]],"_fndef":true,"_fnparams":[]}]],["tuple",["scope",{"code":[[["is-function","What"]]],"_fndef":true,"_fnparams":[]}],["scope",{"code":[[["atom","function"]]],"_fndef":true,"_fnparams":[]}]],["tuple",["scope",{"code":[[["is-list","What"]]],"_fndef":true,"_fnparams":[]}],["scope",{"code":[[["atom","list"]]],"_fndef":true,"_fnparams":[]}]],["tuple",["scope",{"code":[[["is-atom","What"]]],"_fndef":true,"_fnparams":[]}],["scope",{"code":[[["atom","atom"]]],"_fndef":true,"_fnparams":[]}]],["tuple",["scope",{"code":[[["is-dict","What"]]],"_fndef":true,"_fnparams":[]}],["scope",{"code":[[["atom","dict"]]],"_fndef":true,"_fnparams":[]}]],["tuple",["scope",{"code":[[["is-number","What"]]],"_fndef":true,"_fnparams":[]}],["scope",{"code":[[["atom","number"]]],"_fndef":true,"_fnparams":[]}]]]]],"_fndef":true,"_fnparams":["What"]}],["assert",["==","number",["test","1"]],"\"when/* test: number\""],["assert",["==","string",["test","\"123\""]],"\"when/* test: string\""],["try",[["test",["tuple","foo"]],["throw","\"Uh oh\""]],{"code":[[["if",["==",["exception-message","E"],"\"No matching clause in when\""],[["atom","true"]],["else",[["throw","E"]]]]]],"_fndef":true,"_fnparams":["E"]}],["def","test-any",{"code":[[["when",["tuple","true",{"code":[[["\"PASS\""]]],"_fndef":true,"_fnparams":[]}]]]],"_fndef":true,"_fnparams":["What"]}],["assert",["==","\"PASS\"",["test-any","any"]],"\"when/* test: success path\""],["print","\"Match tests succeeded\""]]]]]
},{}],25:[function(require,module,exports){
module.exports=[[["import","lists"],["var","ArityFuns",["dict",["tuple","1",["list","abs","acos","acosh","asin","asinh","atan","atanh","cbrt","ceil","clz32","cos","cosh","exp","expm1","floor","fround","log","log1p","log10","log2","round","sign","sin","sinh","sqrt","tan","tanh","trunc"]],["tuple","2",["list","atan2","imul","pow"]],["tuple","*",["list","hypot"]]]],["var","Math",["math-object"]],["each",["dict-keys","ArityFuns"],["scope",{"code":[[["var","Entries",["dict-get","ArityFuns","Arity"]],["each","Entries",["scope",{"code":[[["var","FullName",["atom",["+","Entry","\"/\"","Arity"]]],["if",["==","1","Arity"],[["def","FullName",["scope",{"code":[[["invoke","Math","Entry","A"]]],"_fndef":true,"_fnparams":["A"]}]],["export-global","FullName"]],["else",[["if",["==","2","Arity"],[["def","FullName",["scope",{"code":[[["invoke","Math","Entry","A","B"]]],"_fndef":true,"_fnparams":["A","B"]}]],["export-global","FullName"]],["else",[["if",["==","*","Arity"],[["def","FullName",["scope",{"code":[[["apply",["dict-get","Math","Entry"],"Args"]]],"_fndef":true,"_fnparams":["Args"]}]],["export-global","FullName"]]]]]]]]]]],"_fndef":true,"_fnparams":["Entry"]}]]]],"_fndef":true,"_fnparams":["Arity"]}]]]]
},{}],26:[function(require,module,exports){
module.exports=[[["platform","ext"],["import","lists"],["import","random"],["import","symbols"],["var","AttemptsDefault","50000"],["def","pivot",{"code":[[["var","Current","0"],["var","Result","nil"],["var","AttemptsRemaining",["get","AttemptsDefault"]],["var","LastPrintNum",["get","AttemptsRemaining"]],["var","I","0"],["var","Permutations",["permutations","Ops"]],["var","PermutationsLength",["length",["get","Permutations"]]],["while",[["and",["!=","Current","Desired"],[">","AttemptsRemaining","0"]]],[["var","OpsToTry",["index","Permutations","I"]],["set","I",["+","1",["get","I"]]],["if",[">=","I","PermutationsLength"],[["set","I","0"]]],["var","OpsPadded",["map",["tail","Nums"],["scope",{"code":[[["list-rand","OpsToTry"]]],"_fndef":true,"_fnparams":["N"]}]]],["var","Str","\"\""],["each-idx","Nums",["scope",{"code":[[["var","Op",["+","\"\"",["index","OpsPadded","Idx"]]],["if",["!=","\"\"","Op"],[["set","Str",["+","Str","\"(\"","Op","\" \"","N","\" \""]]],["else",[["set","Str",["+","Str","N","\")\""]]]]]]],"_fndef":true,"_fnparams":["N","Idx"]}]],["set","Str",["+","Str",["repeat","\")\"",["length","Nums"]]]],["set","Current",["eval","Str"]],["if",["==","Current","Desired"],[["set","Result",["get","Str"]]]],["set","AttemptsRemaining",["-","AttemptsRemaining","1"]],["if",[">=",["-","LastPrintNum","AttemptsRemaining"],"100"],[["set","LastPrintNum",["get","AttemptsRemaining"]],["invoke",["stdout"],"write",["+","\"\\r\"","LastPrintNum"]]]]]],["invoke",["stdout"],"write","\"...Success:\\n\""],["get","Result"]]],"_fndef":true,"_fnparams":["Desired","Nums","Ops"]}],["export-global","pivot/3"],["if",["get-def","'PIVOT_TEST'"],[["var","Numbers",["list","1","5","2","2"]],["var","Operators",["list","*","+"]],["var","Desired","20"],["print",["pivot","Desired","Numbers","Operators"]],["set","Numbers",["list","0","1","2","4","8","16","32"]],["set","Operators",["list","+","*","-","/","|","^"]],["print",["pivot","63","Numbers","Operators"]],["print",["pivot","64","Numbers","Operators"]]]]]]
},{}],27:[function(require,module,exports){
module.exports=[[["var","DefaultMin","0"],["var","DefaultMax","1000000"],["def","random",{"code":[[["random","DefaultMin","DefaultMax"]]],"_fndef":true,"_fnparams":[]}],["def","random",{"code":[[["random","0","End"]]],"_fndef":true,"_fnparams":["End"]}],["def","random",{"code":[[["+","Start",["floor",["*",["rand"],["-","End","Start"]]]]]],"_fndef":true,"_fnparams":["Start","End"]}],["export","random/0","random/1","random/2"],["def","random-list-item",{"code":[[["index","List",["random",["length","List"]]]]],"_fndef":true,"_fnparams":["List"]}],["export","random-list-item/1"],["if",["get-def","'TEST'"],[["print",["random"]],["print",["random","10"]],["print",["random","1","10"]],["print",["random","1","100"]],["print",["random-list-item",["list","1","2","3","4","5","6","7"]]]]]]]
},{}],28:[function(require,module,exports){
module.exports=[[["platform","v1"],["try",[["var","Readline",["require","\"readline\""]],["var","RL",["invoke","Readline","\"createInterface\"",["dict",["tuple","input",["stdin"]],["tuple","output",["stdout"]]]]],["invoke","RL","pause"],["def","readline",{"code":[[["invoke","RL","\"question\"","Question",["js-bridge",{"code":[[["invoke","RL","\"pause\""],["call","Callback","Answer"]]],"_fndef":true,"_fnparams":["Answer"]}]]]],"_fndef":true,"_fnparams":["Question","Callback"]}],["export-global","readline/2"]],["catch",{"code":[[["atom","nil"]]],"_fndef":true,"_fnparams":[]}]],["if",["==","true",["get-def","'TEST'"]],[["readline","\"How are you? \"",{"code":[[["print","A"],["readline","\"How are you really? \"",{"code":[[["print","B"]]],"_fndef":true,"_fnparams":["B"]}]]],"_fndef":true,"_fnparams":["A"]}]]]]]
},{}],29:[function(require,module,exports){
module.exports=[[["import","readline"],["import","stderr"],["import","switch"],["var","ContinueLoop","true"],["var","_","nil"],["var","DebugMode","false"],["var","Result","nil"],["def","nil",{"code":[[["atom","\"nil\""]]],"_fndef":true,"_fnparams":[]}],["def","local-eval",["scope",{"code":[[["if","DebugMode",[["lithp-debug","true"]]],["set","E",["eval","Code"]],["if","DebugMode",[["lithp-debug","false"]]],["get","E"]]],"_fndef":true,"_fnparams":["Code"]}]],["var","CaseQuit",["case","\"\\\\q\"",["scope",{"code":[[["set","ContinueLoop","false"],["nil"]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseUnderscore",["case","\"_\"",["scope",{"code":[["get","_"]],"_fndef":true,"_fnparams":[]}]]],["var","CaseDebugMode",["case","\"\\\\d\"",["scope",{"code":[[["set","DebugMode",["!",["get","DebugMode"]]],["print","\"Debug mode now \"",["?","DebugMode","\"ON\"","\"off\""]],["nil"]]],"_fndef":true,"_fnparams":[]}]]],["var","DisplayHelp",{"code":[[["print","\"Type standard Lithp expressions.\""],["print","\"Example: (var Fac #N::((if(== 0 N)((1))((* N(call Fac(- N 1)))))))(print (call Fac 10\""],["print","\"Or for a recursive factorial:\""],["print","\"((def f #N :: ( (def fi #N,A :: ( (if (== 1 N) ((A)) (else ((recurse (- N 1) (* N A)))) ) )) (fi N 1) )) (print (f 10)) )\""],["print","\"\""],["print","\"The following additional commands are available:\""],["print","\"  ?        Print this help\""],["print","\"  \\\\q       Quit the REPL\""],["print","\"  \\\\d       Toggle DEBUG mode\""],["print","\"  _        Print the last value\""],["print","\"\""],["nil"]]],"_fndef":true,"_fnparams":[]}],["var","CaseHelp1",["case","\"?\"","DisplayHelp"]],["var","CaseHelp2",["case","\"help\"","DisplayHelp"]],["var","CaseDefault",["default",["scope",{"code":[[["set-top-level","true"],["try",[["local-eval",["+","\"(\"","Input","\")\""]]],{"code":[[["stderr-write",["+","\"\\nError during eval: \"",["to-string","E"],"\"\\n\""]]]],"_fndef":true,"_fnparams":["E"]}]]],"_fndef":true,"_fnparams":["Input"]}]]],["var","CaseList",["list","CaseQuit","CaseUnderscore","CaseDebugMode","CaseHelp1","CaseHelp2","CaseDefault"]],["def","repl-input",["scope",{"code":[[["var","Tmp",["switch","Input","CaseList"]],["set","Result",["get","Tmp"]],["print","\"Success, result: \"","Result"],["set","\"_\"",["get","Result"]],["set-top-level","false"]]],"_fndef":true,"_fnparams":["Input"]}]],["export-global","repl-input/1"],["var","LoopHandler",["scope",{"code":[[["repl-input","Input"],["repl-loop"]]],"_fndef":true,"_fnparams":["Input"]}]],["def","repl-loop",["scope",{"code":[[["if","ContinueLoop",[["readline","\"> \"","LoopHandler"]]]]],"_fndef":true,"_fnparams":[]}]],["def","set-repl-continue",["scope",{"code":[[["set","ContinueLoop",["get","Bool"]]]],"_fndef":true,"_fnparams":["Bool"]}]],["export-global","repl-loop/0","set-repl-continue/1"]]]
},{}],30:[function(require,module,exports){
module.exports=[[["def","stderr-write",{"code":[[["invoke",["stderr"],"write","V"]]],"_fndef":true,"_fnparams":["V"]}],["export-global","stderr-write/1"]]]
},{}],31:[function(require,module,exports){
module.exports=[[["var","Modules",["list","assert","buffer","cache","class","file","lists","math","random","switch","symbols"]],["def","import-modules",{"code":[[["if",["!=","0",["length","List"]],[["import",["head","List"]],["recurse",["tail","List"]]]]]],"_fndef":true,"_fnparams":["List"]}],["import-modules","Modules"]]]
},{}],32:[function(require,module,exports){
module.exports=[[["import","buffer"],["var","FS",["require","\"fs\""]],["def","isTTY",{"code":[[["?",["==",["true"],["index",["stdin"],"isTTY"]],"true","false"]]],"_fndef":true,"_fnparams":["Stream"]}],["def","readInputStream",{"code":[[["if",["isTTY",["stdin"]],[["\"\""]],["else",[["read-stream-to-buffer",["stdin"]]]]]]],"_fndef":true,"_fnparams":[]}],["var","BufferSize","256"],["def","stream-fd",{"code":[[["index","Stream","fd"]]],"_fndef":true,"_fnparams":["Stream"]}],["def","read-stream-to-buffer",{"code":[[["var","Result","\"\""],["var","BytesRead","1"],["var","Buf",["buffer","BufferSize"]],["while",[[">","BytesRead","0"]],[["set","BytesRead","0"],["try",[["set","BytesRead",["invoke","FS","readSync",["stream-fd","Stream"],"Buf","0","BufferSize"]],["set","Result",["+","Result",["to-string","Buf",["null"],"0","BytesRead"]]]],{"code":[[["atom","nil"]]],"_fndef":true,"_fnparams":["E"]}]]],["get","Result"]]],"_fndef":true,"_fnparams":["Stream"]}],["export-global","isTTY/1","stream-fd/1","read-stream-to-buffer/1","readInputStream/0"]]]
},{}],33:[function(require,module,exports){
module.exports=[[["def","concat/*",{"code":[[["var","Result","\"\""],["map","List",["scope",{"code":[[["set","Result",["+","Result",["+","\" \"","Str"]]]]],"_fndef":true,"_fnparams":["Str"]}]],["get","Result"]]],"_fndef":true,"_fnparams":["List"]}],["export-global","concat/*"]]]
},{}],34:[function(require,module,exports){
module.exports=[[["def","true",{"code":[["atom","true"]],"_fndef":true,"_fnparams":[]}],["def","false",{"code":[["atom","false"]],"_fndef":true,"_fnparams":[]}],["export-global","true/0","false/0"],["def","case",{"code":[[["scope",{"code":[[["if",["==","Given","Value"],[["tuple","ok",["call","Action"]]],["else",[["tuple","false","false"]]]]]],"_fndef":true,"_fnparams":["Given"]}]]],"_fndef":true,"_fnparams":["Value","Action"]}],["def","default",{"code":[[["scope",{"code":[[["tuple","default",["call","Action","Given"]]]],"_fndef":true,"_fnparams":["Given"]}]]],"_fndef":true,"_fnparams":["Action"]}],["def","switch",{"code":[[["var","Result","nil"],["var","ResultSet","false"],["var","DefaultValue","nil"],["while",[["and",["!","ResultSet"],[">",["length","Handlers"],"0"]]],[["var","Head",["head","Handlers"]],["var","Tail",["tail","Handlers"]],["set","Handlers",["get","Tail"]],["var","InnerResult",["call","Head","Value"]],["if",["==","ok",["index","InnerResult","0"]],[["set","Result",["index","InnerResult","1"]],["set","ResultSet","true"]],["else",[["if",["==","default",["index","InnerResult","0"]],[["set","DefaultValue",["index","InnerResult","1"]]]]]]]]],["?","ResultSet","Result","DefaultValue"]]],"_fndef":true,"_fnparams":["Value","Handlers"]}],["def","switch/*",{"code":[[["switch",["head","Args"],["tail","Args"]]]],"_fndef":true,"_fnparams":["Args"]}],["if",["==","true",["get-def","'TEST'"]],[["print","\"Debug is on, running tests\""],["var","Case1",["case","1",{"code":[["\"one\""]],"_fndef":true,"_fnparams":[]}]],["var","Case2",["case","2",{"code":[["\"two\""]],"_fndef":true,"_fnparams":[]}]],["var","Case3",["case","3",{"code":[["\"three\""]],"_fndef":true,"_fnparams":[]}]],["var","Case4",["case","4",{"code":[["\"four\""]],"_fndef":true,"_fnparams":[]}]],["var","Default",["default",{"code":[[["+","\"Other: \"","Given"]]],"_fndef":true,"_fnparams":["Given"]}]],["var","Value","1"],["print",["switch","Value","Case1","Case2","Case3","Case4","Default"]],["print",["switch","Value",["list",["case","1",{"code":[["\"one\""]],"_fndef":true,"_fnparams":[]}],["case","2",{"code":[["\"two\""]],"_fndef":true,"_fnparams":[]}],["case","3",{"code":[["\"three\""]],"_fndef":true,"_fnparams":[]}],["case","4",{"code":[["\"four\""]],"_fndef":true,"_fnparams":[]}],["default",{"code":[[["+","\"Other: \"","N"]]],"_fndef":true,"_fnparams":["N"]}]]]]]],["export-global","case/2","default/1","switch/2","switch/*"]]]
},{}],35:[function(require,module,exports){
module.exports=[[["def","get-fn",{"code":[[["try",[["get",["+","Name","\"/\"","Arity"]]],{"code":[[["get",["+","Name","\"/*\""]]]],"_fndef":true,"_fnparams":["E"]}]]],"_fndef":true,"_fnparams":["Name","Arity"]}],["export-global","get-fn/2"],["def","call-fn",{"code":[[["call",["get-fn","Name","1"],"Arg1"]]],"_fndef":true,"_fnparams":["Name","Arg1"]}],["def","call-fn",{"code":[[["call",["get-fn","Name","2"],"Arg1","Arg2"]]],"_fndef":true,"_fnparams":["Name","Arg1","Arg2"]}],["def","call-fn",{"code":[[["call",["get-fn","Name","3"],"Arg1","Arg2","Arg3"]]],"_fndef":true,"_fnparams":["Name","Arg1","Arg2","Arg3"]}],["def","call-fn",{"code":[[["call",["get-fn","Name","4"],"Arg1","Arg2","Arg3","Arg4"]]],"_fndef":true,"_fnparams":["Name","Arg1","Arg2","Arg3","Arg4"]}],["def","call-fn",{"code":[[["call",["get-fn","Name","5"],"Arg1","Arg2","Arg3","Arg4","Arg5"]]],"_fndef":true,"_fnparams":["Name","Arg1","Arg2","Arg3","Arg4","Arg5"]}],["def","call-fn",{"code":[[["call",["get-fn","Name","6"],"Arg1","Arg2","Arg3","Arg4","Arg5","Arg6"]]],"_fndef":true,"_fnparams":["Name","Arg1","Arg2","Arg3","Arg4","Arg5","Arg6"]}],["def","call-fn",{"code":[[["call",["get-fn","Name","7"],"Arg1","Arg2","Arg3","Arg4","Arg5","Arg6","Arg7"]]],"_fndef":true,"_fnparams":["Name","Arg1","Arg2","Arg3","Arg4","Arg5","Arg6","Arg7"]}],["export-global","call-fn/2","call-fn/3","call-fn/4","call-fn/5","call-fn/6","call-fn/7","call-fn/8"],["if",["get-def","'TEST'"],[["import","lists"],["var","Operators",["list","+","-","/","*"]],["var","A","5"],["var","B","10"],["each","Operators",["scope",{"code":[[["var","Fn",["get-fn","Op","2"]],["print",["+","A","\" \"","Op","\" \"","B","\" = \"",["call","Fn","A","B"]]]]],"_fndef":true,"_fnparams":["Op"]}]],["each","Operators",["scope",{"code":[[["print",["+","A","\" \"","Op","\" \"","B","\" = \"",["call-fn","Op","A","B"]]]]],"_fndef":true,"_fnparams":["Op"]}]]]]]]
},{}],36:[function(require,module,exports){
module.exports={
  "_args": [
    [
      "lithp@git+https://github.com/andrakis/node-lithp.git",
      "/home/daedalus/git/lithp-webide/node_modules/lithp-pkg"
    ]
  ],
  "_from": "git+https://github.com/andrakis/node-lithp.git",
  "_id": "lithp@0.20.2",
  "_inCache": true,
  "_installable": true,
  "_location": "/lithp",
  "_phantomChildren": {},
  "_requested": {
    "hosted": {
      "directUrl": "https://raw.githubusercontent.com/andrakis/node-lithp/master/package.json",
      "gitUrl": "git://github.com/andrakis/node-lithp.git",
      "httpsUrl": "git+https://github.com/andrakis/node-lithp.git",
      "shortcut": "github:andrakis/node-lithp",
      "ssh": "git@github.com:andrakis/node-lithp.git",
      "sshUrl": "git+ssh://git@github.com/andrakis/node-lithp.git",
      "type": "github"
    },
    "name": "lithp",
    "raw": "lithp@git+https://github.com/andrakis/node-lithp.git",
    "rawSpec": "git+https://github.com/andrakis/node-lithp.git",
    "scope": null,
    "spec": "git+https://github.com/andrakis/node-lithp.git",
    "type": "hosted"
  },
  "_requiredBy": [
    "/lithp-pkg"
  ],
  "_resolved": "git+https://github.com/andrakis/node-lithp.git#b3972d932ccf08ab0136b67822239c3f1e6b1166",
  "_shasum": "40b725f297bc55a6c64d5c016648160cdb32e5f8",
  "_shrinkwrap": null,
  "_spec": "lithp@git+https://github.com/andrakis/node-lithp.git",
  "_where": "/home/daedalus/git/lithp-webide/node_modules/lithp-pkg",
  "author": {
    "name": "Julian \"Andrakis\" Thatcher"
  },
  "bin": {
    "lithp": "bin/lithp",
    "lithp-macro": "bin/macro",
    "lithp-repl": "bin/repl"
  },
  "bugs": {
    "url": "https://github.com/andrakis/node-lithp/issues"
  },
  "dependencies": {},
  "description": "A small Lisp-like language with a tiny interpreter",
  "devDependencies": {},
  "gitHead": "b3972d932ccf08ab0136b67822239c3f1e6b1166",
  "homepage": "https://github.com/andrakis/node-lithp#readme",
  "keywords": [
    "lisp",
    "lithp"
  ],
  "license": "GPL-3.0",
  "main": "index.js",
  "name": "lithp",
  "optionalDependencies": {},
  "readme": "Lithp\n=====\n\nA small Lisp-like programming language, with a small interpreter.\n-----------------------------------------------------------------\n\nThis language borrows some ideas from Lisp (functional programming, the\nfunction call syntax itself) but is designed around a small interpreter to\ncarry out the basic execution, and builtin library functions to provide\ncontrol flow, function definitions, and basic arithmatic and similar\noperations.\n\nIt aims to provide a basic framework as powerful as JavaScript. Much of this\nis accomplished through the use of native Lithp [modules](https://github.com/andrakis/node-lithp/tree/master/modules)\nand some powerful builtin functions allowing use of native Node.js modules.\n\nThe [readfile example](https://github.com/andrakis/node-lithp/blob/master/samples/readfile.lithp) demonstrates all of the above features, importing the\nNode.js `fs` module, and calling `fs.readFileSync` and `fs.readFile` using a\ncallback and a Lithp function to print the results.\n\nThe [main interpreter](https://github.com/andrakis/node-lithp/blob/master/lib/interpreter.js) is around 270 lines of sparse code.\nThis size would be even lower without the\ndebug statements and detailed comments.\n\nLanguage Examples\n=================\n\nThe examples are in the [samples](https://github.com/andrakis/node-lithp/tree/master/samples) directory.\n\nSimple test\n-----------\n\nPrint a string.\n\n\t((set Test \"test\")\n\t (print \"Test: \" Test))\n\n\nSimple function\n---------------\n\nDefine a simple function and call it.\n\n\t((def add #A,B :: ((+ A B)))\n\t (print \"Add 5+10: \" (add 5 10)))\n\n\nMultiple functions and logic\n----------------------------\n\nDefine two functions and use comparison logic to print a message\nbased on the input.\n\n\t(\n\t\t(def is_zero#N :: ((== 0 N)))\n\t\t(def test#N :: (\n\t\t\t(if (is_zero N) (\n\t\t\t\t(print \"N is zero\")\n\t\t\t) (else (\n\t\t\t\t(print \"N is not zero, it is: \" N)\n\t\t\t)))\n\t\t))\n\t\t(test 1)\n\t\t(test 0)\n\t)\n\nA recursive function\n--------------------\n\nDefine a recursive function that calculates the factorial of the\ngiven number, and call it.\n\n\t((def fac #N :: (\n\t\t(if (== 0 N) (1)\n\t\t\t(else ((* N (fac (- N 1)))))\n\t\t)\n\t))\n\t(set Test 10)\n\t(print \"factorial of \" Test \": \" (fac Test)))\n\nA tail recursive function\n-------------------------\n\nTail recursion is implemented via the builtin recurse/* function.\n\n\t((def fac-recursive #N :: (\n\t\t(def inner #N,Acc :: (\n\t\t\t(if (== 0 N) (\n\t\t\t\t(Acc)\n\t\t\t) (else (\n\t\t\t\t(recurse (- N 1) (* N Acc))\n\t\t\t)))\n\t\t))\n\t\t(inner N 0)\n\t))\n\t(print (fac-recursive 50)))\n\nList comprehension\n------------------\n\nList comprehension is provided by the `lists` module. Here is an example usage:\n\n\tCode:\n\t\t(import lists)\n\t\t% Supply 3 generators\n\t\t(set Generators (list (seq 1 10) (seq 1 5) (seq 1 3)))\n\t\t% Handler simply returns a list of given numbers\n\t\t(set Handler #X,Y,Z::((list X Y Z)))\n\t\t% Filter checks that X, Y, and Z are divisible by two using modulo (@).\n\t\t(set Filter #X,Y,Z::((and (== 0 (@ X 2)) (== 0 (@ Y 2)) (== 0 (@ Z 2)))))\n\t\t(print \"List comprehension test: \" (lcomp Handler Generators Filter))\n\tOutput:\n\t\tList comprehension test:  [ [ 2, 2, 2 ],\n\t\t  [ 2, 4, 2 ],\n\t\t  [ 4, 2, 2 ],\n\t\t  [ 4, 4, 2 ],\n\t\t  [ 6, 2, 2 ],\n\t\t  [ 6, 4, 2 ],\n\t\t  [ 8, 2, 2 ],\n\t\t  [ 8, 4, 2 ],\n\t\t  [ 10, 2, 2 ],\n\t\t  [ 10, 4, 2 ] ]\n\nRunning some sample code\n========================\n\nYou have three options:\n\n  * The online REPL\n\n     A REPL is [available online](https://andrakis.github.io/lithp/) that will run basic code snippits. This does not yet support running an entire script.\n\n  * The console REPL\n\n     The REPL, or Read Execute Print Loop, is available in the top level directory. To start it invoke:\n\n\t\t./repl          or\n\t\t./repl.lithp\n\n  * Run a script file\n\n     Use the file `run.js` in the top level directory, and specify a path to a Lithp\n     source file. There are [several provided](https://github.com/andrakis/node-lithp/tree/master/samples) that work with the current parser.\n\n    To run the [factorial example](https://github.com/andrakis/node-lithp/blob/master/samples/factorial.lithp):\n\n    ```\n        node run.js samples/factorial.lithp\n    ```\n\n    You can see the internals of what the parser and interpreter are doing by passing\n    the `-d` flag to run.js to enable debug mode. This prints out a tree of function\n    calls, allowing you to follow the interpreters call sequence.\n\nLanguage Status\n===============\n\nVersion: 0.20.2 (STABLE)\n---------------------\n\nCurrently the language can run hand-compiled code or use the Bootstrap Parser\nfor a fairly feature-complete compilation experience. The parser does not\ncurrently supports all the constructs it should - these are being corrected\nas they are found.\n\nModules are supported, and a standard library is starting to be expanded upon.\nFor more information on modules, see the [module](https://github.com/andrakis/node-lithp/blob/master/samples/module.lithp) example for how functions may be defined, exported,\nand imported.\n\nSee `run.js` or the `Running some sample code` section for information on how\nto run existing examples of Lithp code, parsed by the Bootstrap Parser.\n\nThe Bootstrap Parser or Platform V0 Parser is written in JavaScript for\nquick implementation. See the `Longterm goals` section for information about\nthe design of a new parser, implemented in Lithp.\n\nThe Bootstrap Parser is very simple and will not protect you from simple mistakes\nlike too many closing brackets. It also gets tripped up over some slight syntax\nissues, but the basic framework implemented should allow for all of these to be\ncorrected.\n\nImplemented milestones\n----------------------\n\n* Parsing\n\n  * Serialization of compiled OpChains to AST. Allows for other Lithp interpreters to run parsed code. (A C# interpreter is in progress.)\n\n  * AST parsing and compilation has been implemented.\n\n  * This allows faster script startup, and allows packaging the entire project using browserify.\n\n* Modules\n\n  * A list comprehension function, `lcomp`, is available in the [lists module](https://github.com/andrakis/node-lithp/blob/master/modules/lists.lithp)\n\n  * The same module also provides a flat-map function.\n\n  * Lists module has been improved with use of recursive functions.\n\n* REPL\n\n  * An online REPL is [available](https://andrakis.github.io/lithp/)\n\n  * A REPL is available for Node.js. Simply run `./repl` to start it. Type `?` for help.\n\n* Language enhancements\n\n  * Package the REPL using browserify to provide an online interpreter. (see [lithp-pkg](https://github.com/andrakis/lithp-pkg))\n\n  * Implemented `recurse/*`, enabling tail recursion.\n\n  * Implemented `while/2`, enabling non-recursive looping.\n\n  * The lists module has been rewritten to use `while/2`, resulting in much less\n    memory usage and improved runtime speed.\n\n  * Moved many functions from `Platform V1` to standard builtin library.\n\n  * Added many math builtins.\n\n  * Added missing regex test function (`test/2`)\n\n  * Added `env/0`, `argv/0`, `cwd/0` for command line information.\n\n  * Added number parsing: `parse-float/1`, `parse-int/1`\n\n  * Added `eval/1` allowing runtime code evaluation using the Bootstrap Parser.\n    Also adds `eval/*` for providing additional variables.\n\n  * Added `chr/1` and `asc/1` for converting to and from character codes and strings.\n\n* Debugging enhancements\n\n  * User defined functions now have a readable name, resulting in much more readable\n    debug output.\n\n  * The spacing and depth indications have been corrected and are now more consistent.\n\n  * No longer prints known symbol names when a symbol is not found. This was proving to\n    be too useless.\n\n* BootStrap Parser\n\n  * This basic parser, written in JavaScript, is able to convert scripts to the\n    OpChains the interpreter needs.\n\n  * It is designed to be powerful enough to parse enough Lithp code with which\n    to implement a better parser. To this end, there are numerous [examples](https://github.com/andrakis/node-lithp/tree/master/samples)\n    demonstrating the language and what the parser is capable of parsing.\n\n  * It is considered feature complete. Only bugfixes are to be implemented.\n\n  * Future parsing work is to be done on the Platform V1 parser, implemented\n    in Lithp and parsed by this parser. This should make maintenance and enhancements\n    easier to implement.\n\n  * Now recognises a number of builtin functions and saves runtime speed by resolving\n    these to arity star functions during parsing.\n\n  * Floating point numbers now work correctly, as does \\t escape sequence.\n\n  * Issues parsing tabs and newlines corrected.\n\n* Module system\n\n  * Allows scripts to import another module. Imported module is parsed by\n    the BootStrap parser and all functions run in their own instance of Lithp.\n\n  * A small standard library is provided. This is being expanded upon.\n\n  * Modules can define their own functions, call any function they want, and\n    export defined functions.\n\n  * Scripts that import modules add them to their function definition tree.\n\n  * Imported functions run in the new instance, retaining access to all their\n    own functions and variables.\n\n  * Scripts that call imported functions can be passed any Lithp object,\n    including anonymous functions.\n\n  * When passed anonymous functions will, like the imported module functions,\n    run in the instance of the interpreter in which they were defined. This\n    retains their access to all defined functions and variables.\n\n  * Enhanced import/1 to search a set of module paths, allowing for greater\n    flexibility.\n\n  * Several standard modules are now provided\n\n  * Added `import-instance/1` which retains the old behaviour of `import/1`.\n    `import/1` no longer imports modules into a new instance.\n\n* Speed improvements\n\n  * A number of enhancements have been made that improve the runtime speed\n    of the language. These include quicker name lookups, caching of arity\n    star functions once recognised, and strict mode.\n\n  * Strict mode is now implemented across all files.\n\nShort term goals\n----------------\n\n* Implement a Lithp package system with library dependancies.\n\n* Expand the standard module library.\n\n* The language is considered powerful enough and feature complete that\n  personal work has begun on new projects using Lithp as their base language. These are all works in progress.\n\n  * [Livium](https://github.com/andrakis/lithp-livium) - an implementation of Vi in Lithp.\n\n  * [Lithp-pkg](https://github.com/andrakis/lithp-pkg) - package Lithp into a browserified file.\n\n  * [Dungeons of Lithp](https://github.com/andrakis/lithp-dol) - a MUD-style dungeon crawler.\n\nLongterm goals\n--------------\n\nThese features are desired, but may be a long time coming.\n\n* Platform V1: Parser\n\n\tThe new native parser will feature more language features, including the ability\n\tto alter the parser itself at runtime, allowing completely new features to be\n\timplemented at runtime.\n\nDesign\n======\n\nThe basic syntax is very Lisp-like, however it has its own runtime library\nthat uses much different names, design, and implementation. For instance, the\nLithp code is broken down in OpChains, function calls, and literal values, and\nthese are interpreted to run the program. In comparison, Lisp implementations\noften use a low level virtual machine or compiles your code to an executable.\n\nIt also borrows some core ideas from Erlang:\n\n\t* Tuples:                       {val1, val2, ...}\n\t* Atoms:                        lowercase-Start-Is-Atom\n\t* Quoted Atoms:                 'A quoted atom'\n\t* Variables:                    StartWithUpperCase\n\t* Functions include arity:      (def add/2 #A,B :: ((+ A B)))\n\t                                Note that if not provided, this is\n\t                                automatically added according to the\n\t                                number of parameters the function takes.\n\t                                All functions in the definition table\n\t                                have the arity in their name.\n\t* Modules can export functions: (export add/2 divide/2)\n\t* Scripts can import modules:   (import \"lib\")\n\t                                Note that Erlang expects a list of function\n\t                                arity definitions for importing, whereas\n\t                                all exported functions are imported here.\n\n\nHowever, features such as destructive assignment are present, which differs\nfrom Erlang. A number of other useful features such as pattern matching,\nlist comprehension, binary buffers are implemented as modules.\n\nAdditionally, one may define functions with an arity of *, which\npasses all parameters in the first parameter:\n\n\t((def count_params/* #List :: ((print \"You gave me \" (length List) \" parameters\")))\n\t (count_params 1 2 3 atom \"string\" 'quoted atom' #N :: (\"anonymous function\")))\n\nOther features are available in many other languages. The prime one of these\nis the functional programming approach. All functions return the value of the\nlast executed function call, even if there are multiple function calls\npreceding it.\n\nAll Lithp functions are implemented as anonymous functions, which allows you\nto assign them to variables, provide them as function arguments, and call them\nusing the `call` function. The builtin `def` function adds anonymous functions\nto a closure table allowing them to be called at runtime by name. All builtins\nare also added to this table, making them indistuinguisable from user defined\nfunctions.\n\nVariable scoping (closures) is somewhat implemented, but none yet to liking.\nPresently, one needs to call the `scope/1` function. This takes an anonymous\nfunction as its parameter, and returns a callable function which retains\naccess to the scope in which it was defined. Ideally this would be implemented\nas a parser feature.\n\nA standard Lithp script compiles to an OpChain, which contains function calls,\nliteral values, and potentially more OpChains with the same.\n\nA simple program:\n\n\t((print \"Hello, world!\"))\n\nThis is an OpChain consisting of a single function call, with a single literal\nvalue as a parameter. Parameters are separated by spaces, and the function name\nappears as the first token after the opening bracket. Any function currently\ndefined by builtins or using the def/2 function is callable in this way.\n\nOther functions, such as those assigned to variables, must be called with the\ncall/* function.\n\nEach function call may itself have additional function calls for the values of\nthe parameters. These are parsed first, and this process repeats recursively\nuntil all parameters for the current function call have been resolved. This\nusually involves calling intermediate functions, which repeat the same process.\nThis is the meat of the language.\n\n\t ((def add #A,B :: ((+ A B)))\n\t  (print \"Add 5+10: \" (add 5 10)))\n\nThis simple design, consisting of only nested function calls and literal values,\nallows for a very simple interpreter that can implement powerful constructs.\n\nLithp functions are always anonymous, take a certain number of parameters (in\nthe above example, A and B), and assign this anonymous function to an atom in\nthe current closure, allowing it to be called like other inbuilt functions.\n\nWhen functions are set in the closure, they include in their name the arity of\nthe function. This is either a zero-or-positive-number, or * to indicate the\nfunction takes an unlimited number of parameters. In the case of arity * all\narguments are passed in the first parameter of the function.\n\nPrint itself is an arity * builtin runtime function defined in JavaScript.\nMost low level functions are provided in JavaScript, such as basic control\nflow, comparison, assignment and retrieval, and defining new functions in the\nLithp language itself.\n\nThe runtime library is fairly small, aiming for a very basic but usable\nset of functions that can implement most algorithms.\nMore advanced functionality is provided by additional libraries, such as\nwith Platform V1 which has functions for manipulating native Lithp types\n(for creating and filling OpChains.)\n\nSome functions are provided for readability, such as in an if construct:\n\n\t\t(if (== 0 N) (1)\n\t\t\t(else ((* N (fac (- N 1)))))\n\t\t)\n\nIn this case, else is just a function that calls the given function chain.\nIt could be ommitted, but it provides better readability in a language that\nis very terse.\n\nModules\n=======\n\nModules allow functions from one script to be exported to another script.\n\nAn example is provided, consisting of a [module](https://github.com/andrakis/node-lithp/blob/master/samples/module_lib.lithp) and a [script](https://github.com/andrakis/node-lithp/blob/master/samples/module.lithp) to call it.\n\nThe module is a standard Lithp script that contains calls to export/* to\nnote symbols to export:\n\n\t% lib.lithp\n\t((def add #A,B :: ((+ A B)))\n\t (export add/2))\n\nA different Lithp script may then use import/1 to bring all exported\ndefinitions into the running script's closure:\n\n\t% main.lithp\n\t((import \"lib\")\n\t (print \"2+2:\" (add 2 2)))\n\nHowever, a key point is that imported functions run in a different instance\nof the interpreter, allowing them to perform their own runtime logic completely\nindependent of the script that imported it.\n\nSince variables and function calls are resolved prior to calling a function, one\nmay call an imported function and provide it parameters and callbacks native to\nthe a different instance of the Lithp interpreter than the module.\n\nTo put it another way, module functions run in their own instance, but you can pass\nthem any usual value, including callbacks that retain access to defined values.\n\nSyntax Highlighting\n===================\n\nSee the directory `syntax` for Lithp syntax files.\n\nThe following syntax files are provided:\n\n* EditPlus\n\n   Standard EditPlus syntax file. Seems to work correctly.\n\n* VIM\n\n   Based upon the Lisp syntax file. The author's understanding of VIM syntax files\n   is not very good, hence it doesn't do everything correctly.\n",
  "readmeFilename": "README.md",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/andrakis/node-lithp.git"
  },
  "scripts": {
    "postinstall": "if [ ! -e run ]; then ln -s run.js run; fi"
  },
  "version": "0.20.2"
}

},{}],37:[function(require,module,exports){
(function (global){
/**
 * Bootstrap Parser, Platform V0, for Lithp
 *
 * Main parser for the first version of Lithp. A simple parser that can be used
 * to create a better parser later (Platform V1).
 *
 * See 'run.js' (in the top level directory) for a working usage of this parser.
 */

"use strict";

var util = require('util'),
	inspect = util.inspect;
var lithp = require( './../../index'),
	Lithp = lithp.Lithp,
	parser_debug = lithp.parser_debug,
	types = lithp.Types,
	OpChain = types.OpChain,
	Atom = types.Atom,
	FunctionCall = types.FunctionCall,
	FunctionReentry = types.FunctionReentry,
	FunctionDefinition = types.FunctionDefinition,
	FunctionDefinitionNative = types.FunctionDefinitionNative,
	AnonymousFunction = types.AnonymousFunction,
	LiteralValue = types.LiteralValue,
	VariableReference = types.VariableReference,
	Tuple = types.Tuple;

var enable_parser_debug = false;
var parser_debug = function() {
	if(enable_parser_debug)
		console.error.apply(console, arguments);
}
global._lithp.set_parser_debug = function(val) { enable_parser_debug = val; };

var arityBuiltins = {
	print: '*',
	and: '*',
	or: '*',
	'+': '*',
	'++': '*',
	'-': '*',
	'/': '*',
	'*': '*',
	'+': '*',
	'+': '*',
	'+': '*',
	list: '*',
	flatten: '*',
	call: '*',
	'to-string': '*',
	'export': '*',
	'export-global': '*',
	invoke: '*',
	dict: '*',
};

var timespentParsing = 0;
global._lithp.getParserTime = function() { return timespentParsing; };

var EX_LITERAL = 1 << 0,             // Literal (1, 2, "test")
    EX_OPCHAIN = 1 << 1,             // opening OpChain '('
    EX_FUNCTIONCALL = 1 << 2,        // opening FunctionCall '('
    EX_NUMBER  = 1 << 3,             // Collect number (whole or float: [0-9.]+f?$)
    EX_ATOM    = 1 << 4,             // Collect atom
    EX_VARIABLE= 1 << 5,             // Variables
    EX_STRING_CHARACTER  = 1 << 6,   // Collect character
    EX_STRING_SINGLE = 1 << 7,       // Expecting a single quote to end '
    EX_STRING_DOUBLE = 1 << 8,       // Expecting a double quote to end "
    EX_PARAM_SEPARATOR   = 1 << 9,   // Expecting a space
    EX_CALL_END          = 1 << 10,  // Expected a ), end of call
    EX_OPCHAIN_END       = 1 << 11,  // Expect a ), end of opchain
    EX_COMMENT           = 1 << 12,  // Comments
    EX_COMPILED          = 1 << 13,  // Already compiled
    EX_FUNCTION_MARKER   = 1 << 14,  // #     next: Arg1,Arg2 :: (...)
    EX_FUNCTION_PARAM    = 1 << 15,  // #     this: Arg1
    EX_FUNCTION_PARAM_SEP= 1 << 16,  // #Arg1 this: ,
    EX_FUNCTION_BODY     = 1 << 17;  // #Arg1,Arg2  this: ::

var EX_TABLE = {
	EX_LITERAL: EX_LITERAL,
	EX_OPCHAIN: EX_OPCHAIN,
	EX_FUNCTIONCALL: EX_FUNCTIONCALL,
	EX_NUMBER: EX_NUMBER,
	EX_ATOM: EX_ATOM,
	EX_VARIABLE: EX_VARIABLE,
	EX_STRING_CHARACTER: EX_STRING_CHARACTER,
	EX_STRING_SINGLE: EX_STRING_SINGLE,
	EX_STRING_DOUBLE: EX_STRING_DOUBLE,
	EX_PARAM_SEPARATOR: EX_PARAM_SEPARATOR,
	EX_CALL_END: EX_CALL_END,
	EX_OPCHAIN_END: EX_OPCHAIN_END,
	EX_COMMENT: EX_COMMENT,
	EX_COMPILED: EX_COMPILED,
	EX_FUNCTION_MARKER: EX_FUNCTION_MARKER,
	EX_FUNCTION_PARAM: EX_FUNCTION_PARAM,
	EX_FUNCTION_PARAM_SEP: EX_FUNCTION_PARAM_SEP,
	EX_FUNCTION_BODY: EX_FUNCTION_BODY
};

function GET_EX (n) {
	var parts = [];
	for(var k in EX_TABLE)
		if(EX_TABLE[k] & n)
			parts.push(k);
	if(parts.length > 0)
		return parts.join(' | ');
	throw new Error("Expected value not known: " + n);
}

function ParserState (parent) {
	this.ops = [[]];
	this.ops_it = this.ops.iterator();
	this.current_word = '';
	this.expect = EX_OPCHAIN;
	this.depth = 0;
	this.in_variable = false;
	this.in_atom = false;
	this.quote_type = undefined;
	this.line = 1;
	this.character = 1;
	this.lines = [];
}

// Classify the given character(s). It could suit a number of different
// attributes at once.
ParserState.prototype.classify = function(ch) {
	var val = 0;
	if(typeof ch != 'string')
		return EX_COMPILED;
	if(ch.charCodeAt(0) == 9)
		return EX_PARAM_SEPARATOR;
	switch(ch) {
		case '(': val = EX_OPCHAIN | EX_FUNCTIONCALL; break;
		case ')': val = EX_CALL_END | EX_OPCHAIN_END; break;
		case ' ': case "\t": case "\r": case "\n":
			val = EX_PARAM_SEPARATOR; break;
		case "'": val = EX_STRING_SINGLE; break;
		case '"': val = EX_STRING_DOUBLE; break;
		case '%': val = EX_COMMENT; break;
		case '#': val = EX_FUNCTION_MARKER; break;
		case ',': val = EX_FUNCTION_PARAM_SEP; break;
		case ':': val = EX_FUNCTION_BODY; break; // Repeated twice for functions
		default:
			if(ch.match(/^[a-z][a-zA-Z0-9_]*$/))
				val = EX_ATOM;
			else if(ch.match(/^[A-Z][A-Za-z0-9_]*$/))
				val = EX_VARIABLE | EX_FUNCTION_PARAM;
			else if(ch.match(/^-?[0-9][0-9.]*$/))
				val = EX_NUMBER | EX_ATOM;
			else if(ch.length > 1 && ch.match(/^".*"$/))
				val = EX_STRING_DOUBLE;
			else if(ch.length > 1 && ch.match(/^'.*'$/))
				val = EX_STRING_SINGLE;
			else {
				//parser_debug("WARNING: assuming atom for: " + ch);
				val = EX_ATOM;
			}
	}
	// EX_STRING_CHARACTER is implied
	val |= EX_STRING_CHARACTER;
	return val;
};

ParserState.prototype.mapParam = function(P, chain, fnName) {
	var result = this.mapParamInner(P, chain, fnName);
	parser_debug("mapParam(", P, ") :: ", result);
	return result;
};

// Runs a series of replace actions over a string to replace escape sequences.
function parseString (str) {
	return str.replace(/\\(.)/g, function(FullMatch, Escape)  {
		switch(Escape) {
			case 'n': return "\n";
			case 'r': return "\r";
			case 't': return "\t";
			case '\\': return "\\";
			default: throw new Error('Unknown escape sequence: ' + Escape);
		}
	});
}

ParserState.prototype.mapParamInner = function(P, chain, fnName) {
	if(!Array.isArray(P)) {
		var cls = this.classify(P);
		parser_debug("Classified: " + GET_EX(cls));
		if(cls & EX_STRING_DOUBLE || cls & EX_STRING_SINGLE) {
			var parsed = parseString(P.slice(1, P.length - 1)); 
			if(cls & EX_STRING_DOUBLE)
				return new LiteralValue(parsed);
			else if(cls & EX_STRING_SINGLE)
				return Atom(parsed);
		} else if(cls & EX_VARIABLE) {
			if(fnName == 'get' || fnName == 'set' || fnName == 'var')
				return new VariableReference(P);
			return new FunctionCall("get/1", [new VariableReference(P)]);
		} else if(cls & EX_NUMBER)
			return new LiteralValue(Number(P));
		else if(cls & EX_ATOM)
			return Atom(P);
	} else {
		return this.convert(chain, P);
	}
	throw new Error("Unable to map parameter: " + inspect(P));
};

ParserState.prototype.convert = function(chain, curr) {
	var eleFirst = curr[0];
	var clsFirst = this.classify(eleFirst);
	var op;
	parser_debug("  First element: ", eleFirst);
	parser_debug("     Classified: ", GET_EX(clsFirst));
	if(curr.length == 0)
		return undefined;
	if(curr._fndef) {
		parser_debug("FNDEF");
		parser_debug("Params: ", curr._fnparams);
		var params = curr._fnparams;
		curr._fndef = false;
		//var newChain = new OpChain(chain);
		var body = this.convert(chain, curr);
		var anon = AnonymousFunction(chain, params, body);
		parser_debug("Got body for function:", body.toString());
		return anon;
	}
	if(clsFirst & EX_STRING_SINGLE) {
		// Convert to a (call (get 'FnName') Params...)
		parser_debug("STRING_SINGLE, convert to FunctionCall: (call/* (get/1 : " + eleFirst + " ... ");
		eleFirst = eleFirst.slice(1, eleFirst.length - 1);
		clsFirst = this.classify(eleFirst);
		parser_debug("    First element: ", eleFirst);
		parser_debug("    Re-Classified: ", GET_EX(clsFirst));
	}
	if(clsFirst & EX_ATOM) {
		// FunctionCall
		parser_debug(" PARSE TO FUNCTIONCALL: ", curr);
		var params = curr.slice(1);
		params = params.map(P => this.mapParam(P, chain, eleFirst));
		if(params.length == 0 && this.classify(eleFirst) & EX_NUMBER) {
			parser_debug("CONVERT TO LITERAL");
			return this.mapParam(eleFirst, chain, eleFirst);
		} else {
			var plen = params.length;
			if(eleFirst in arityBuiltins)
				plen = arityBuiltins[eleFirst];
			parser_debug("FUNCTIONCALL " + eleFirst + "/" + plen);
			op = new FunctionCall(eleFirst + "/" + plen, params);
			return op;
		}
	} else if(Array.isArray(eleFirst)) {
		// Must be an OpChain
		var newChain = new OpChain(chain);
		for(var i = 0; i < curr.length; i++) {
			parser_debug("Member " + i + " of chain: ", curr[i]);
			newChain.push(this.convert(newChain, curr[i]));
		}
		return newChain;
	} else if(curr.length > 0) {
		// Must be an OpChain
		parser_debug(" PARSE TO OPCHAIN");
		var newChain = new OpChain(chain);
		for(var i = 0; i < curr.length; i++) {
			parser_debug("Member " + i + " of chain: ", curr[i]);
			//process.exit();
			//chain.push(this.convert(newChain, curr[i]));
			newChain.push(this.mapParam(curr[i], newChain, eleFirst));
		}
		return newChain;
	} else {
		throw new Error("Unable to convert: " + inspect(curr));
	}
};

ParserState.prototype.finalize = function() {
	parser_debug("Finalize tree: ", this.ops);
	var chain = new OpChain();
	var it = this.ops.iterator();
	var curr;
	while((curr = it.next())) {
		var c = this.convert(chain, curr);
		parser_debug("Got from convert: ", c);
		if(c)
			chain.push(c);
	}
	return chain;
};

ParserState.prototype.parseBody = function(it, dest) {
	var params = this.current_word.length > 0 ?
		this.current_word.split(',') : [];
	parser_debug(" Body: params count: " + params.length);
	this.current_word = '';
	var d = [];
	d._fndef = true;
	d._fnparams = params;
	var chain = this.parseSection(it, d);
	parser_debug(" Body chain: " + inspect(chain, {depth: null, colors:true}));
	return chain;
};

var characters = 0;
ParserState.prototype.parseSection = function(it, dest) {
	var ch;
	var self = this;

	// Move to the next valid character.
	// Skips newlines, tabs, and also strips comment lines.
	function moveNext () {
		var expect = self.expect;
		var ch = it.next();
		if(ch === undefined)
			return ch;
		function ignore_line () {
			var chCode = ch.charCodeAt(0);
			while(chCode != 10) {
				ch = it.next();
				characters++;
				if(ch === undefined)
					return ch;
				chCode = ch.charCodeAt(0);
				if(chCode == 10) {
					self.character = 1;
					self.line++;
				}
			}
			ch = it.next();
			self.line++;
		}
		if(self.character == 1 && ch == '#') {
			ch = it.next();
			if(ch == '!') {
				ch = it.next();
				// Shebang, ignore line
				ignore_line();
			} else
				it.prev();
		}
		characters++;
		self.character++;
		if(ch === undefined)
			return ch;
		if(ch == '%' && !(self.expect & EX_STRING_CHARACTER)) {
			// Comment and not in speech, ignore this line.
			// Must keep running in a loop, in case there are more
			// comments.
			while(ch == '%') {
				parser_debug("COMMENT");
				ignore_line();
			}
		}
		return ch;
	}

	var depth = 1;

	while( (ch = moveNext()) != undefined) {
		parser_debug("Parse character: " + ch + " " + ch.charCodeAt(0).toString(10));

		// Classify the current character
		var cls = this.classify(ch);
		parser_debug("      Type     : " + GET_EX(cls));
		parser_debug("  expect_current: 0x" + this.expect.toString(16) + " (" + GET_EX(this.expect) + ")");
		parser_debug("     In var    : " + this.in_variable);
		if(this.quote_type !== undefined)
			parser_debug("     Quote Type: " + this.quote_type);

		// Skip spaces we are not expecting. This really only affects extra
		// space characters within a line.
		var expect = this.expect;
		if(cls & EX_PARAM_SEPARATOR &&
			!(expect & EX_PARAM_SEPARATOR) &&
			!(expect & EX_STRING_CHARACTER)) {
			parser_debug("Space when not expecting, ignoring");
			continue;
		}

		if(cls & EX_FUNCTION_BODY &&
		   !(expect & EX_FUNCTION_BODY) &&
		   !(expect & EX_STRING_CHARACTER)) {
			parser_debug("Found the extra :, ignoring");
			continue;
		}

		// When a variable goes from CAPStosmall
		if(cls & EX_ATOM &&
			(expect & EX_VARIABLE || expect & EX_FUNCTION_PARAM) &&
			this.in_variable) {
			parser_debug("Found atom but was expecting variable, supposing it is part of the name");
			this.current_word += ch;
			continue;
		}

		// When an atom goes from smallToCaps
		if(cls & EX_VARIABLE && expect & EX_ATOM && this.in_atom) {
			parser_debug("Found variable but was expecting atom, supposing it is part of the name");
			this.current_word += ch;
			continue;
		}

		// OpChain begin but expecting separator?
		if(cls & EX_OPCHAIN && expect & EX_PARAM_SEPARATOR) {
			// Change character to separator, next loop we will get the EX_OPCHAIN again.
			ch = ' ';
			cls = this.classify(ch);
			it.prev();
		}

		// Has the character been classified as something we are expecting?
		if(!(cls & expect)) {
			console.log("Error on line " + self.line + " at character " + self.character);
			console.log("  " + self.lines[self.line - 1]);
			console.log("  " + (" ".repeat(self.character + 1)) + "^");
			throw new Error("Unexpected character at " + self.line + ":" + self.character + " '" + ch + "' not expected (" + GET_EX(cls) + "), was expecting: " + GET_EX(this.expect));
		}

		if(cls & EX_OPCHAIN && !(expect & EX_STRING_CHARACTER)) {
			// Open an Opchain
			this.expect = EX_OPCHAIN | EX_NUMBER | EX_LITERAL | EX_STRING_DOUBLE | EX_STRING_SINGLE | EX_ATOM | EX_FUNCTION_MARKER | EX_VARIABLE;
			this.current_word = '';
			//dest.push([]);
			dest.push(this.parseSection(it, []));
		} else if(cls & EX_OPCHAIN_END && !(expect & EX_STRING_CHARACTER)) {
			// Close an OpChain
			if(this.current_word.length > 0)
				dest.push(this.current_word);
			this.expect = EX_OPCHAIN | EX_OPCHAIN_END | EX_FUNCTION_MARKER | EX_NUMBER | EX_STRING_SINGLE | EX_STRING_DOUBLE | EX_VARIABLE | EX_ATOM;
			this.current_word = '';
			this.in_variable = false;
			return dest;
		} else if(cls & EX_ATOM && expect & EX_ATOM) {
			// Continue an atom
			this.current_word += ch;
			this.in_atom = true;
			this.expect = EX_ATOM | EX_PARAM_SEPARATOR | EX_FUNCTION_MARKER | EX_OPCHAIN_END | EX_FUNCTIONCALL;
		} else if(cls & EX_PARAM_SEPARATOR && expect & EX_PARAM_SEPARATOR &&
		        !(expect & EX_STRING_CHARACTER) &&
		        !(expect & EX_FUNCTION_PARAM)) {
			// Space not in string, param separator
			parser_debug("SEPARATOR");
			if(this.current_word.length > 0) {
				dest.push(this.current_word);
			}
			this.current_word = '';
			this.expect = EX_OPCHAIN | EX_VARIABLE | EX_NUMBER | EX_LITERAL | EX_ATOM | EX_STRING_DOUBLE | EX_STRING_SINGLE | EX_ATOM | EX_FUNCTION_MARKER | EX_OPCHAIN_END;
			this.in_variable = false;
			this.in_atom = false;
		} else if(cls & EX_STRING_SINGLE && this.quote_type != '"') {
			// Start or end a single quote string, if not already in a double quote string
			if(!(expect & EX_STRING_CHARACTER)) {
				parser_debug("START SINGLE QUOTE STRING");
				this.expect = EX_STRING_CHARACTER | EX_STRING_SINGLE;
				this.current_word = ch;
				this.quote_type = "'";
			} else {
				parser_debug("END SINGLE QUOTE STRING");
				this.current_word += ch;
				if(this.current_word.length > 0)
					dest.push(this.current_word);
				this.expect = EX_PARAM_SEPARATOR | EX_OPCHAIN_END;
				this.current_word = '';
				this.quote_type = undefined;
			}
		} else if(cls & EX_STRING_DOUBLE && this.quote_type != "'") {
			// Start or end a double quote string, if not already in a single quote string
			if(!(expect & EX_STRING_CHARACTER)) {
				parser_debug("START DOUBLE QUOTE STRING");
				this.expect = EX_STRING_CHARACTER | EX_STRING_DOUBLE;
				this.current_word = ch;
				this.quote_type = '"';
			} else {
				parser_debug("END DOUBLE QUOTE STRING");
				this.current_word += ch;
				if(this.current_word.length > 0)
					dest.push(this.current_word);
				this.expect = EX_PARAM_SEPARATOR | EX_OPCHAIN_END;
				this.current_word = '';
				this.quote_type = undefined;
			}
		} else if(cls & EX_STRING_CHARACTER && expect & EX_STRING_CHARACTER) {
			// Continue string character reading
			this.current_word += ch;
		} else if(cls & EX_VARIABLE && expect & EX_VARIABLE) {
			// Start or continue variable
			this.in_variable = true;
			this.current_word += ch;
			this.expect = EX_VARIABLE | EX_PARAM_SEPARATOR | EX_OPCHAIN_END;
		} else if(cls & EX_NUMBER && expect & EX_NUMBER) {
			// Start or continue number
			this.current_word += ch;
			this.expect = EX_NUMBER | EX_PARAM_SEPARATOR | EX_OPCHAIN_END;
		} else if(cls & EX_FUNCTION_MARKER && expect & EX_FUNCTION_MARKER) {
			// Start or begin function
			parser_debug("BEGIN FUNCTION MARKER");
			// Current: #
			// Next: Arg1[,Arg2] :: Ops
			this.expect = EX_FUNCTION_PARAM | EX_FUNCTION_PARAM_SEP | EX_FUNCTION_BODY | EX_PARAM_SEPARATOR;
		} else if((cls & EX_FUNCTION_PARAM || cls & EX_FUNCTION_PARAM_SEP) &&
		           expect & EX_FUNCTION_PARAM) {
			// Continue reading function parameters
			this.current_word += ch;
			this.in_variable = true;
			parser_debug("CONTINUE FUNCTION PARAM: " + this.current_word);
		} else if(cls & EX_PARAM_SEPARATOR && expect & EX_FUNCTION_PARAM_SEP) {
			// Function parameters end, body starts soon
			parser_debug("PARAMS END");
			this.expect = EX_FUNCTION_BODY;
			this.in_variable = false;
		} else if(cls & EX_FUNCTION_BODY && expect & EX_FUNCTION_BODY) {
			parser_debug("FUNCTION BODY STARTS, current word: " + this.current_word);
			this.expect = EX_OPCHAIN;
			this.in_variable = false;
			dest.push(this.parseBody(it, []));
			this.current_word = '';
			return dest;
		} else {
			throw new Error('Unhandled combination');
		}

		parser_debug("State current: ");
		parser_debug("  Ops: ", this.ops);
		parser_debug("  Expect: " + GET_EX(this.expect));
		parser_debug("  Current word: " + this.current_word);
		parser_debug("  Depth: " + this.depth);
	}
	return dest;
}

ParserState.prototype.export = function() {
	var it = this.ops.iterator();
	return this.export_section(it);
};

ParserState.prototype.export_section = function(it) {
	var out = [];
	var curr;
	while((curr = it.next())) {
		if(curr._fndef) {
			curr = {code: this.export_section(curr.iterator()), _fndef: true, _fnparams: curr._fnparams}
			delete curr.code._fndef;
			delete curr.code._fnparams;
			out.push(curr);
		} else if(Array.isArray(curr)) {
			out.push(this.export_section(curr.iterator()));
		} else {
			out.push(curr);
		}
	}
	return out;
};

ParserState.prototype.unexport = function(ast) {
	if(ast && ast['code']) {
		var obj = this.unexport(ast['code']);
		obj._fndef = ast['_fndef'];
		obj._fnparams = ast['_fnparams'];
		return obj;
	} else if(Array.isArray(ast)) {
		return ast.map(E => this.unexport(E));
	}
	return ast;
}

function BootstrapParser (code, opts) {
	opts = (typeof opts == 'object') ? opts : {};
	opts['finalize'] = (opts['finalize'] !== undefined) ? opts['finalize'] : true;
	opts['ast']      = (opts['ast'] !== undefined) ? opts['ast'] : false;

	characters = 0;
	var start = (new Date()).getTime();
	var state = new ParserState();
	if(opts['ast']) {
		var parsed = code;
		if(typeof code == 'string')
			parsed = JSON.parse(code);
		state.ops = [state.unexport(parsed)];
	} else {
		var it = code.split('').iterator();
		state.lines = code.split(/\n\r?/);
		state.ops = state.parseSection(it, []);
	}
	if(opts['finalize']) {
		var fin = state.finalize();
		timespentParsing += (new Date()).getTime() - start;
		return fin;
	} else {
		return state;
	}
}

exports.BootstrapParser = BootstrapParser;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./../../index":9,"util":6}],38:[function(require,module,exports){
/**
 * Parser V1, Platform V0, switch() implementation.
 *
 * Provides:
 *  - switch/*
 *  - case/2
 *  - default/1
 *
 * This is implemented in hand-compiled Lithp, and tries to use as little
 * FunctionDefinitionNative calls as possible. The more that can be
 * implemented in the language itself, the better.
 */


var util = require('util'),
	inspect = util.inspect;
var lithp = require('./../../.'),
	Lithp = lithp.Lithp,
	debug = Lithp.debug,
	types = lithp.Types,
	OpChain = types.OpChain,
	Atom = types.Atom,
	FunctionCall = types.FunctionCall,
	FunctionReentry = types.FunctionReentry,
	FunctionDefinition = types.FunctionDefinition,
	FunctionDefinitionNative = types.FunctionDefinitionNative,
	AnonymousFunction = types.AnonymousFunction,
	LiteralValue = types.LiteralValue,
	VariableReference = types.VariableReference,
	Tuple = types.Tuple;

function lib_case (lithp) {
	/**
	 (
		% For use with switch/*, a case statement that returns a function that
		% is called by switch/*, and if the Value given by switch/* matches,
		% {ok, Result} is returned. Otherwise {false} is returned.
		(def case #Eq,Result :: (
			% Ignore:
			% // Return a function that retains access to the outside closure
			% // variables (Eq and Result) to perform a comparison.
			% // This is a little convoluted because we need to ensure a new
			% // closure is generated that has access to the Eq and Result values.
			%
			% //If we did not do this, we may end up using old values of Eq and Result.
			%
			% TODO: Verify the above logic is correct. Since each call is already in
			%       a new OpChain, it should retain access to the variables.
			(scope #Value :: (
				(if (== Eq Value) ((tuple ok Result))
					(else (tuple false))
				)
			))
		))
	 )
	*/
}

function lib_default (lithp) {
	/**
		% For use with switch/*, a default value if no matching cases are found.
		(def default #Result :: (tuple default Result))
	**/
	var default1 = new OpChain();

	var default1_body = new OpChain(default1,
		new FunctionCall("tuple/*", [
			Atom("default"),
			new FunctionCall("get/1", [new VariableReference("Result")])
		])
	);
	
	/**
	 * (print (default "Foo"))
	 */
	var chain = new OpChain();
	chain.push(
		new FunctionCall("def/2", [
			Atom("default"),
			AnonymousFunction(default1, ['Result'], default1_body)
		])
	);
	chain.push(
		new FunctionCall("print/*", [
			new FunctionCall("default/1", [new LiteralValue("Foo")])
		])
	);
	/**
	 * (print (inspect (default "Foo") true true))
	 */
	chain.push(
		new FunctionCall("print/*", [
			new FunctionCall("inspect/3", [
				new FunctionCall("default/1", [new LiteralValue("Foo")]),
				Atom('true'),
				Atom('true')
			])
		])
	);
	/**
	 * (assert (== (default "Foo") (tuple default "Foo")))
	 */
	chain.push(
		new FunctionCall("assert/1", [
			new FunctionCall("equal/2", [
				new FunctionCall("default/1", [new LiteralValue("Foo")]),
				new FunctionCall("tuple/*", [
					Atom("default"),
					new LiteralValue("Foo")
				])
			])
		])
	);

	chain.importClosure(lithp.functions);
	lithp.run(chain);
}

function lib_switch_inner (chain) {
	/*
		(def _switch_inner #Possibility :: (
			% Use call/* to call the provided function with one parameter.
		// Value comes from chain
			(var Result (call Possibility Value))
			(if (== (tuple-get Result 0) ok) (Result)
				(else (
					(if (== (tuple-get Result 0) default) (
							(set Default (tuple-get Result 1))
						) (else ((tuple false)))
					)
				))
			)
		))
	 */
}

function lib_switch_loop (chain) {
	/**
		(def _switch_loop #List :: (
			(if (== 0 (length List)) (
				(tuple notfound)
			) (else (
				(var Head (head List))
				(var Tail (tail Possibiilties))
				(var Test (call _switch_inner Head))
				(if (== (tuple-get Test 0) ok) (Test)
					(else (
						% Must be tuple false
						% Could skip this check
						(assert (== (tuple-get Test 0) false))
						% Call recursively to check the rest
						(call _switch_loop Tail)
					))
				)
			)))
		))
	*/
}

function lib_switch (lithp) {
	/**
		(def switch/* #Params :: (
			(var Value (head Params))
			(var Possibilities (tail Params))
			% Scope of _switch_inner is this function call
			(var Default nil)
			% Test if the given possibility matches. Also detects the presence
			% of a default clause, and sets Default if found.
(def _switch_inner #Possibility ... from lib_switch_inner.
			% Recursive local function that runs through the list of possibilities,
			% returning {ok, Result} if a match is found, or {notfound}.
(def _switch_loop #List ... from lib_switch_loop
			(var Test (_switch_loop Possibilities))
			(if (== (tuple-get Test 0) notfound) (
				% Not found return Default or nil
				(if (!= Default nil) (Default)
					% Return nil if there is no default tuple found
				    (else (nil))
				)
			) else (
				% Could skip this check
				(assert (== (tuple-get Test 0) ok))
				(tuple-get Test 1)
			))
		)
	*/
}

exports.test = (lithp) => {
	console.log("lib-parser-switch.js");
	lib_default(lithp);
};

exports.functions = {
	"case": lib_case,
	"default": lib_default,
	"switch": lib_switch
};

},{"./../../.":9,"util":6}],39:[function(require,module,exports){
/**
 * Standard library for Parser V1, Platform V0.
 *
 * Contains native and hand-compiled functions.
 * Incorporates additional library functions.
 */

"use strict";

var util = require('util'),
	inspect = util.inspect;
var lithp = require('./../../.'),
	Lithp = lithp.Lithp,
	debug = lithp.debug,
	types = lithp.Types,
	OpChain = types.OpChain,
	Atom = types.Atom,
	GetAtoms = types.GetAtoms,
	FunctionCall = types.FunctionCall,
	FunctionReentry = types.FunctionReentry,
	FunctionDefinition = types.FunctionDefinition,
	FunctionDefinitionNative = types.FunctionDefinitionNative,
	AnonymousFunction = types.AnonymousFunction,
	LiteralValue = types.LiteralValue,
	VariableReference = types.VariableReference,
	Tuple = types.Tuple;
var lib_parser_switch = require('./lib-parser-switch');

var atomTrue = Atom('true'),
    atomFalse = Atom('false');

var builtins = {};
function builtin (name, params, body) {
	builtins[name] = {params: params, body: body};
}

function builtin_def () {
}

exports.test = (lithp) => {
	lib_parser_switch.test(lithp);
};

exports.setup = function(lithp) {
	var count = 0;
	for(var k in builtins) {
		lithp.builtin(k, builtins[k].params, builtins[k].body);
		count++;
	}
	// TODO: import functions from lib_parser_switch
	return count;
};

// Used to instantiate classes when the number of parameters it not
// known. Uses apply to instantiate (which is a little trickier than
// usual.)
function newClass (Cls) {
	// Function.bind.apply's first argument is ignored. Thus, it doesn't
	// matter that it's included in arguments.
	return new (Function.bind.apply(Cls, arguments));
}

function error (message) { throw new Error(message); };

/**
 * Implement all of the native types used by the interpreter so that a
 * parser written in Lithp can construct a parsing tree for the interpreter.
 */

// Perform an Object comparison
builtin("equal", ['A', 'B'], (A, B) =>
	Object.equals(A, B) ? atomTrue : atomFalse
);

builtin("get-opchain-closure-current", [], State => new LiteralValue(State.closure));

builtin("opchain-closure", ['Owner', 'Parent'], (Owner, Parent) =>
	new LiteralValue(new OpChainClosure(Owner, Parent))
);

builtin("opchain-closure-any-defined", ['Opchain', 'Name'], (Opchain, Name) =>
	new LiteralValue(Opchain.any_defined(Name))
);

builtin("opchain-closure-set", ['Opchain', 'Name', 'Value'], (Opchain, Name, Value) => {
	Opchain.set(Name, Value);
	return new LiteralValue(Opchain);
});

builtin("opchain-closure-set-immediate", ['Opchain', 'Name', 'Value'], (Opchain, Name, Value) => {
	Opchain.set_immediate(Name, Value);
	return new LiteralValue(Opchain);
});

builtin("opchain-closure-try-set", ['Opchain', 'Name', 'Value'], (Opchain, Name, Value) =>
	new LiteralValue(Opchain.try_set(Name, Value))
);

builtin("opchain-closure-get", ['Opchain', 'Name'], (Opchain, Name) =>
	new LiteralValue(Opchain.get(Name))
);


builtin("opchain", ['Parent', 'Ops'], (Parent, Ops) =>
	new LiteralValue(new OpChain(Parent, Ops))
);

builtin("opchain-push", ['Opchain', 'Value'], (Opchain, Value) => {
	Opchain.push(Value);
	return new LiteralValue(Opchain);
});

builtin("opchain-get", ['Opchain'], (Opchain) =>
	new LiteralValue(Opchain.get())
);

builtin("opchain-next", ['Opchain'], (Opchain) =>
	new LiteralValue(Opchain.next())
);

builtin("opchain-call-immediate", ['Opchain'], (Opchain) =>
	new LiteralValue(Opchain.call_immediate())
);

function alias (newname, oldname) {
	return builtin(newname, [], function() { return builtins[oldname].apply(this, arguments); });
}

builtin("literal-value", ["Value"], Value => new LiteralValue(Value));
alias('lit', 'literal-value');

builtin("function-call", ['Name', 'Params'], (Name, Params) =>
	new LiteralValue(new FunctionCall(Name, Params))
);

builtin("function-definition", ['Parent', 'Name', 'Params', 'Body'], (Parent, Name, Params, Body) =>
	new LiteralValue(new FunctionDefinition(Parent, Name, Params, Body))
);

builtin("lambda", ['Parent', 'Params', 'Body'], (Parent, Params, Body) =>
	new LiteralValue(new AnonymousFunction(Parent, Params, Body))
);

builtin("function-definition-native", ['Name', 'Params', 'Body'], (Name, Params, Body) =>
	new LiteralValue(new FunctionDefinitionNative(Name, Params, Body))
);

builtin("recurse/*", [], function(Arguments, State) {
	// Call the current function again with the given arguments.
	// We do this by calling call/* with the current State.
	// TODO: should just reset the current opchain, and set parameters
	//       to Arguments. Allows for infinite recursion.
	var args = [State.call(), Arguments, State];
	return builtins["call/*"].apply(this, args);
});

// TODO: Test:
// (def catch #Callback :: ((#Exception :: ((call Callback Exception))))
builtin_def('catch_native', (chain) => {
	var fn_body = new OpChain(chain,
		new FunctionCall('call/2', [
			new FunctionCall('get/1', [new VariableReference('Callback')]),
			new FunctionCall('get/1', [new VariableReference('Exception')])
		])
	);
	return new OpChain(chain, new AnonymousFunction(chain, ['Exception'], fn_body));
});

builtin('atoms', [], () => GetAtoms.map(A => A.name));

function atomBool (A) {
	return A == atomTrue ? true : false;
}

builtin('inspect/2', ['Object', 'Deep'], (O, Deep) => inspect(O, {depth: atomBool(Deep) ? null : undefined}));
builtin('inspect/3', ['Object', 'Deep', 'Color'], (O, Deep, Color) => inspect(O, {depth: atomBool(Deep) ? null : undefined, colors: atomBool(Color)}));

function lib_each (chain) {
	/**
	 (
	 	// TODO: keep track of count, also pass it to callback
	 	(def each #List,Callback :: (
			((if (== (length List) 0) (done)
			     (else (
				 	(var Head (head List))
					(var Tail (tail List))
					(call Callback List)
					(each Tail Tail)
				 ))
			))
		)
	 )
	 */
}

function lib_with (chain) {
	/**
	 (
	 	(def with #Value,Callback :: (
			(call Callback Value)
		))
	 )
	 */
}

},{"./../../.":9,"./lib-parser-switch":38,"util":6}],40:[function(require,module,exports){
module.exports=[[["import","\"modules/repl\""],["print","\"Welcome to Lithp v\"",["host-version"],"\"running on\"",["host"]],["print","\"Type \\\\q exit. Type ? for help.\""],["repl-loop"]]]
},{}],41:[function(require,module,exports){
module.exports=[[["import","\"lists\""],["def","f",{"code":[[["/",["*","A","B","C"],["+","B","C",["-","0","A"]],["+","A","C",["-","0","B"]],["+","A","B",["-","0","C"]]]]],"_fndef":true,"_fnparams":["A","B","C"]}],["print",["f","1","1","1"]],["print",["f","3","4","5"]],["print",["f","42","42","3.14"]],["print",["f","14","6","12"]],["print",["f","6","12","14"]],["print",["f","0.5","0.6","0.7"]]]]
},{}],42:[function(require,module,exports){
module.exports=[[["def","get-fn-by-name",{"code":[[["var","R1",["+","Name","\"/\""]],["var","Ref",["+","R1","Arity"]],["get",["to-string","Ref"]]]],"_fndef":true,"_fnparams":["Name","Arity"]}],["'print'","\"+ is\"",["get-fn-by-name","+","*"]],["call",["get-fn-by-name","\"print\"","*"],"\"Testing\""]]]
},{}],43:[function(require,module,exports){
module.exports=[[["platform","v1"],["platform","ext"],["import","\"file\""],["import","\"switch\""],["invoke",["stdin"],"setRawMode","1"],["def","readkey",{"code":[[["invoke",["stdin"],"resume"],["invoke",["stdin"],"on","data",["js-bridge",{"code":[[["invoke",["stdin"],"pause"],["call","Callback","Data"]]],"_fndef":true,"_fnparams":["Data"]}]]]],"_fndef":true,"_fnparams":["Callback"]}],["def","inc",{"code":[[["+","V","1"]]],"_fndef":true,"_fnparams":["V"]}],["def","dec",{"code":[[["-","V","1"]]],"_fndef":true,"_fnparams":["V"]}],["def","prog",{"code":[[["index","BfProg","X"]]],"_fndef":true,"_fnparams":["X"]}],["def","bracket-open",{"code":[[["var","BracketOpenInner",["scope",{"code":[[["var","Y",["-",["length","BfProg"],"Ip"]],["if",["<","X","Y"],[["var","Ch",["prog",["+","Ip","X"]],["if",["==","Ch","\"]\""],[["call","BracketOpenInner",["dec","OpenBraces"],["inc","X"]]],["else",[["if",["==","Ch","\"]\""],[["call","BracketOpenInner",["inc","OpenBraces"],["inc","X"]]],["else",[["if",["==","0","OpenBrces"],[["if",["==",["stack-peek"],"Ip"],[["stack-pop"]],["else",[["call","BracketOpenInner","OpenBraces",["inc","X"]]]]]]]]]]]]]]]]]],"_fndef":true,"_fnparams":["OpenBraces","X"]}]],["call","BracketOpenInner","1","1"]]],"_fndef":true,"_fnparams":[]}],["def","stack-push",{"code":[[["invoke","Stack","push","N"]]],"_fndef":true,"_fnparams":["N"]}],["def","stack-pop",{"code":[[["invoke","Stack","pop"]]],"_fndef":true,"_fnparams":[]}],["def","stack-peek",{"code":[[["?",[">",["length","Stack"],"0"],["index","Stack",["-",["length","Stack"],"1"]],"nil"]]],"_fndef":true,"_fnparams":[]}],["def","mem",{"code":[[["var","V",["dict-get","Mem","Ptr"]],["?",["==","V",["undefined"]],"0","V"]]],"_fndef":true,"_fnparams":["Ptr"]}],["var","Source","\"+<<---[[<+>->++++>---<<]>++]<<<++.<+++.<..<-.<<++.<-.>>>.<.>>.>-.<<<<+.\""],["var","Stack",["list"]],["var","BfProg",["split","Source","\"\""]],["var","Mem",["dict"]],["var","Ptr","0"],["var","Ip","0"],["var","Len",["length","BfProg"]],["var","CasePtrInc",["case","\">\"",["scope",{"code":[[["set","Ptr",["inc","Ptr"]]]],"_fndef":true,"_fnparams":[]}]]],["var","CasePtrDec",["case","\"<\"",["scope",{"code":[[["set","Ptr",["dec","Ptr"]]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseMemInc",["case","\"+\"",["scope",{"code":[[["var","I",["mem","Ptr"]],["dict-set","Mem","Ptr",["inc","I"]]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseMemDec",["case","\"-\"",["scope",{"code":[[["var","I",["mem","Ptr"]],["dict-set","Mem","Ptr",["dec","I"]]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseWrite",["case","\".\"",["scope",{"code":[[["var","I",["mem","Ptr"]],["print","I"]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseRead",["case","\",\"",["scope",{"code":[[["readkey",["scope",{"code":[[["dict-set","Mem","Ptr",["index","Key","0"]]]],"_fndef":true,"_fnparams":["Key"]}]]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseBracketOpen",["case","\"[\"",["scope",{"code":[[["if",["==","0",["mem","Ptr"]],[["bracket-open"]],["else",[["stack-push","Ip"]]]]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseBracketClose",["case","\"]\"",["scope",{"code":[[["if",["==","0",["mem","Ptr"]],[["stack-pop"]],["else",[["set","Ip",["stack-peek"]]]]]]],"_fndef":true,"_fnparams":[]}]]],["var","SwitchCases",["list","CasePtrInc","CasePtrDec","CaseMemInc","CaseMemDec","CaseWrite","CaseRead","CaseBracketOpen","CaseBracketClose"]],["def","execute-contents",{"code":[[["set","BfProg",["get","FileData"]],["set","Len",["length","BfProg"]],["set","Ip","0"],["set","Ptr","0"],["print","\"Loaded \"","Len","\" bytes\""],["execution-loop"]]],"_fndef":true,"_fnparams":["FileData"]}],["var","ExecutionCond",{"code":[[["<","Ip","Len"]]],"_fndef":true,"_fnparams":[]}],["var","ExecutionAction",{"code":[[[["switch",["prog","Ip"],"SwitchCases"],["set","Ip",["inc","Ip"]]]]],"_fndef":true,"_fnparams":[]}],["def","execution-loop",{"code":[[["while","ExecutionCond","ExecutionAction"]]],"_fndef":true,"_fnparams":[]}],["if",["!=","false",["get-def","'FILE'"]],[["var","File",["+","\"\"",["get-def","'FILE'"]]],["read-file","File",["scope",{"code":[[["if",["==",["null"],"Err"],[["print","File","\" loaded, starting execution\""],["execute-contents","Data"]]]]],"_fndef":true,"_fnparams":["Err","Data"]}]]],["else",[["execution-loop"]]]]]]
},{}],44:[function(require,module,exports){
module.exports=[[["import","\"bignum\""],["import","\"lists\""],["var","FL",["dict"]],["var","Base","16"],["def","b",{"code":[[["bignum","N"]]],"_fndef":true,"_fnparams":["N"]}],["def","s",{"code":[[["to-string","N","Base"]]],"_fndef":true,"_fnparams":["N"]}],["def","fib",{"code":[[["if",["b<=","N",["b","2"]],[["b","1"]],[["+",["fibFL",["b-","N",["b","2"]]],["fibFL",["b-","N",["b","1"]]]]]]]],"_fndef":true,"_fnparams":["N"]}],["def","fibFL",{"code":[[["if",["dict-present","FL",["s","N"]],[["dict-get","FL",["s","N"]]],[["var","I",["fib","N"]],["set","FL",["dict-set","FL",["s","N"],"I"]],["I"]]]]],"_fndef":true,"_fnparams":["N"]}],["def","fib-orial",{"code":[[["bprod",["map",["seq","1","N"],["scope",{"code":[[["fib",["b","I"]]]],"_fndef":true,"_fnparams":["I"]}]]]]],"_fndef":true,"_fnparams":["N"]}],["each",["seq","2","20"],["scope",{"code":[[["print",["s",["fib-orial","N"]]]]],"_fndef":true,"_fnparams":["N"]}]]]]
},{}],45:[function(require,module,exports){
module.exports=[[["import","lists"],["import","math"],["import","readline"],["import","switch"],["import","stderr"],["var","Acc","0"],["def","=",{"code":[["Value"]],"_fndef":true,"_fnparams":["Ignored","Value"]}],["def","v",{"code":[["Acc"]],"_fndef":true,"_fnparams":[]}],["def","p",{"code":[[["print",["format-acc"]],["v"]]],"_fndef":true,"_fnparams":[]}],["def","f",{"code":[[["floor","Acc"]]],"_fndef":true,"_fnparams":[]}],["def","c",{"code":[[["ceil","Acc"]]],"_fndef":true,"_fnparams":[]}],["def","e",{"code":[[["exit"]]],"_fndef":true,"_fnparams":[]}],["def","acc-op",["scope",{"code":[[["var","Code",["+","\"(\"","Op","\" Acc \"","Value","\")\""]],["stderr-write",["+","\"Code: \"","Code","\"\\n\""]],["eval","Code"]]],"_fndef":true,"_fnparams":["Op","Value"]}]],["var","Commands",["dict",["tuple","\"c\"","\"Ceil of Acc\""],["tuple","\"f\"","\"Floor of Acc\""],["tuple","\"h\"","\"Display this help\""],["tuple","\"?\"","\"Display this help\""],["tuple","\"e\"","\"Exit\""],["tuple","\"p\"","\"Print Acc\""],["tuple","\"v\"","\"Current value of Acc\""],["tuple","\"=\"","\"Set Acc to given value\""],["tuple","\"H\"","\"Set hex mode output\""],["tuple","\"D\"","\"Set decimal mode output\""],["tuple","\"B\"","\"Set binary mode output\""]]],["var","AccFormat","\"D\""],["def","format-acc",{"code":[[["format-acc","AccFormat"]]],"_fndef":true,"_fnparams":[]}],["var","FormatAccCaseHex",["case","\"H\"",["scope",{"code":[[["+","\"0x\"",["to-string","Acc","16"]]]],"_fndef":true,"_fnparams":[]}]]],["var","FormatAccCaseDecimal",["case","\"D\"",["scope",{"code":[[["get","Acc"]]],"_fndef":true,"_fnparams":[]}]]],["var","FormatAccCaseBinary",["case","\"B\"",["scope",{"code":[[["+","\"B\"",["to-string","Acc","2"]]]],"_fndef":true,"_fnparams":[]}]]],["var","FormatAccCaseList",["list","FormatAccCaseHex","FormatAccCaseDecimal","FormatAccCaseBinary"]],["def","format-acc",{"code":[[["switch","Format","FormatAccCaseList"]]],"_fndef":true,"_fnparams":["Format"]}],["def","set-acc-format",{"code":[[["set","AccFormat",["get","Format"]],["v"]]],"_fndef":true,"_fnparams":["Format"]}],["var","BuiltinsAvailable",["dict",["tuple","1",["list","abs","acos","acosh","asin","asinh","atan","atanh","cbrt","ceil","clz32","cos","cosh","floor","hypot","log","log10","log1p","log2","sign","sin","sinh","aqrt","tan","tanh"]],["tuple","2",["list","min","max","round","pow","imul","exp","expm1","fround","round"]]]],["def","show-help",{"code":[[["print","\"Available commands:\""],["each",["dict-keys","Commands"],{"code":[[["print","\"    \"","Command","\" -> \"",["index","Commands","Command"]]]],"_fndef":true,"_fnparams":["Command"]}],["print","\"Syntax: op value value value\""],["print","\"    eg: = 1\""],["print","\"      : + 2 2 3 v (sinh (pi))\""],["print","\"      : = 33.548739357257745\""],["print","\"Available builtins:\""],["print",["join",["map",["dict-keys",["dict-get","BuiltinsAvailable","1"]],{"code":[[["+","\"(\"",["dict-get",["dict-get","BuiltinsAvailable","1"],"Name"],"\" N)\""]]],"_fndef":true,"_fnparams":["Name"]}],"\", \""]],["print",["join",["map",["dict-keys",["dict-get","BuiltinsAvailable","2"]],{"code":[[["+","\"(\"",["dict-get",["dict-get","BuiltinsAvailable","2"],"Name"],"\" A B)\""]]],"_fndef":true,"_fnparams":["Name"]}],"\", \""]],["get","Acc"]]],"_fndef":true,"_fnparams":[]}],["var","CasePrint",["case","\"p\"",["scope",{"code":[[["p"]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseQuit",["case","\"q\"",["scope",{"code":[[["e"]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseCurrent",["case","\"v\"",["scope",{"code":[[["v"]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseFloor",["case","\"f\"",["scope",{"code":[[["f"]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseCeil",["case","\"c\"",["scope",{"code":[[["c"]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseHex",["case","\"H\"",["scope",{"code":[[["set-acc-format","\"H\""]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseDecimal",["case","\"D\"",["scope",{"code":[[["set-acc-format","\"D\""]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseBinary",["case","\"B\"",["scope",{"code":[[["set-acc-format","\"B\""]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseHelp1",["case","\"h\"",["scope",{"code":[[["show-help"]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseHelp2",["case","\"?\"",["scope",{"code":[[["show-help"]]],"_fndef":true,"_fnparams":[]}]]],["var","CaseDefault",["default",["scope",{"code":[[["print","\"Unknown command\""],["get","Acc"]]],"_fndef":true,"_fnparams":["Given"]}]]],["var","CaseList",["list","CasePrint","CaseQuit","CaseCurrent","CaseFloor","CaseCeil","CaseHex","CaseDecimal","CaseBinary","CaseHelp1","CaseHelp2","CaseDefault"]],["def","parse",{"code":[[["var","Matches",["match","Entry","\"([-=+*/!@#$%^&<>a-z]+) (.*)$\""]],["if",["==",["null"],"Matches"],[["switch","Entry","CaseList"]],["else",[["var","Tail",["index","Matches","2"]],["set","Tail",["replace","Tail",["regex","\"(?:^|\\\\s)([a-z]+)(?=\\\\s|$)\"","\"g\""],["js-bridge",{"code":[[["+","\"(\"",["trim","Value"],"\") \""]]],"_fndef":true,"_fnparams":["Value"]}]]],["try",[["acc-op",["index","Matches","1"],"Tail"]],{"code":[[["stderr-write",["+","\"Failed to parse: \"",["to-string","E"],"\"\\n\""]],["c"]]],"_fndef":true,"_fnparams":["E"]}]]]]]],"_fndef":true,"_fnparams":["Entry"]}],["def","input-loop",{"code":[[["readline",["+",["format-acc"],"\">\""],["scope",{"code":[[["set","Acc",["parse","Value"]],["input-loop"]]],"_fndef":true,"_fnparams":["Value"]}]]]],"_fndef":true,"_fnparams":[]}],["input-loop"]]]
},{}],46:[function(require,module,exports){
module.exports=[[["import","\"lists\""],["def","c",{"code":[[["def","r",{"code":[[["map",["seq","1","N"],{"code":[["chr",["parse-int",["*",["rand"],"10000"]]]],"_fndef":true,"_fnparams":[]}]]],"_fndef":true,"_fnparams":[]}],["join",["map",["split","S","\"\""],{"code":[[["list","C"]]],"_fndef":true,"_fnparams":["C"]}]]],["print",["c","\"The treasure is here\"","2"]]],"_fndef":true,"_fnparams":["S","N"]}]]]
},{}],47:[function(require,module,exports){
module.exports=[[["var","A","1"],["var","B",["+","A","1"]],["var","C",["+","B","1"]],["print","\"A:\"","A","\"B:\"","B","\"C:\"","C"],["if",["==","A",["-","C","2"]],[["print","\"Well now\""],["if",["==","B",["-","C","1"]],[["print","\"All is well\""]],["else",[["print","\"Oh\""]]]]],["else",[["print","\"Oh, ok\""]]]]]]
},{}],48:[function(require,module,exports){
module.exports=[[["print","\"Definitions:\"",["definitions"]],["define","test","true"],["print","\"Definitions:\"",["definitions"]],["if",["defined","test"],[["print","\"'test' is defined\""]],["else",[["print","\"'test' is not defined!\""]]]],["print","\"Value of 'test':\"",["get-def","test"]],["if",["defined","'DEBUG'"],[["print","\"DEBUG mode is on\""]],["else",[["print","\"DEBUG mode is not on.\""]]]],["var","MySecretValue","\"A secret value\""],["var","Fn",{"code":[["MySecretValue"]],"_fndef":true,"_fnparams":[]}],["print","\"Call one: \"",["call","Fn"]],["define","get-secret-value","Fn"],["print","\"Call two: \"",["call",["get-def","get-secret-value"]]]]]
},{}],49:[function(require,module,exports){
module.exports=[[["def","quote",{"code":[["+",["chr","34"],["get","S"],["chr","34"]]],"_fndef":true,"_fnparams":["S"]}],["var","Str",["+","\"((print \"",["quote","\"Hello world\""],"\"))\""]],["var","Str2",["+","\"((print M) M)\""]],["print","Str"],["eval","Str"],["eval","Str2",["tuple","\"M\"","\"Hello world\""]],["var","S","\"Hello World\""],["eval","\"((print S))\""],["var","Add",["eval",["+","\"((def x #A,B::((+ A B)))(get x/2))\""]]],["print",["call","Add","1","2"]]]]
},{}],50:[function(require,module,exports){
module.exports=[[["platform","ext"],["print","\"Test count: \"",["count-params","1","2","3"]]]]
},{}],51:[function(require,module,exports){
module.exports=[[["def","fac",{"code":[[["if",["==","0","N"],[["1"]],[["else",[["*","N",["fac",["-","N","1"]]]]]]]]],"_fndef":true,"_fnparams":["N"]}],["var","Test","10"],["print","\"factorial of \"","Test","\": \"",["fac","Test"]]]]
},{}],52:[function(require,module,exports){
module.exports=[[["platform","v1"],["import","\"lists\""],["var","FL",["dict"]],["def","fib",{"code":[[["if",["<","N","2"],["1"],[["+",["fibFL",["-","N","2"]],["fibFL",["-","N","1"]]]]]]],"_fndef":true,"_fnparams":["N"]}],["def","fibFL",{"code":[[["if",["dict-present","FL","N"],[["dict-get","FL","N"]],[["var","I",["fib","N"]],["set","FL",["dict-set","FL","N","I"]],["I"]]]]],"_fndef":true,"_fnparams":["N"]}],["def","fib-orial",{"code":[[["prod",["map",["seq","1","N"],["scope",{"code":[[["fib","I"]]],"_fndef":true,"_fnparams":["I"]}]]]]],"_fndef":true,"_fnparams":["N"]}],["each",["seq","2","20"],["scope",{"code":[[["print",["fib-orial","N"]]]],"_fndef":true,"_fnparams":["N"]}]]]]
},{}],53:[function(require,module,exports){
module.exports=[[["import","lists"],["import","symbols"],["var","Operators",["list","+","-","/","*"]],["var","A","5"],["var","B","10"],["each","Operators",["scope",{"code":[[["print",["+","A","\" \"","Op","\" \"","B","\" = \"",["call-fn","Op","A","B"]]]]],"_fndef":true,"_fnparams":["Op"]}]]]]
},{}],54:[function(require,module,exports){
module.exports=[[["def","for",{"code":[[["var","Index","0"],["var","ForInner",["scope",{"code":[[["print","\"Running callback for \"","Index","\" on \"","Head"],["call","Callback","Head","Index"],["set","Index",["+","1","Index"]],["if",["!=","0",["length","Tail"]],[["call","ForInner",["head","Tail"],["tail","Tail"]]]]]],"_fndef":true,"_fnparams":["Head","Tail"]}]],["call","ForInner",["head","List"],["tail","List"]]]],"_fndef":true,"_fnparams":["List","Callback"]}],["for",["list","1","2","3"],{"code":[[["print","\"Element at index \"","Index","\": \"","Element"]]],"_fndef":true,"_fnparams":["Element","Index"]}]]]
},{}],55:[function(require,module,exports){
module.exports=[[["platform","ext"],["invoke",["stdin"],"resume"]]]
},{}],56:[function(require,module,exports){
module.exports=[[["platform","v1"],["def","f",{"code":[[["invoke","P","\"map\"",["js-bridge",{"code":[["replace","W",["regex","\".\"","\"g\""],["js-bridge",{"code":[["index",["index","P",["&",["+","I","J"],"1"]],"J"]],"_fndef":true,"_fnparams":["C","J"]}]]],"_fndef":true,"_fnparams":["W","I"]}]]]],"_fndef":true,"_fnparams":["P"]}],["def","f",{"code":[[["invoke","P","\"map\"",["js-bridge",{"code":[["replace","W",["regex","\".\"","\"g\""],["js-bridge",{"code":[["index",["index","P",["&",["+","I","J"],"1"]],"J"]],"_fndef":true,"_fnparams":["C","J"]}]]],"_fndef":true,"_fnparams":["W","I"]}]]]],"_fndef":true,"_fnparams":["P"]}],["print",["f",["list","\"Hello,\"","\"world!\""]]]]]
},{}],57:[function(require,module,exports){
module.exports=[[["def","i",{"code":[[["replace","S",["regex","\"\\\\d\"","\"g\""],["js-bridge",{"code":[[["^","X","1"]]],"_fndef":true,"_fnparams":["X"]}]]]],"_fndef":true,"_fnparams":["S"]}],["print",["i","\"01010101111000\""]]]]
},{}],58:[function(require,module,exports){
module.exports=[[["def","m",{"code":[[["var","X",["list","16","13","1","11","8","5","1","3","1","3","1","5","8","11","1","13"]],["var","Y",["list","0","1","1","0","1","0","0","1","0","1","0","0","1","0","1","1"]],["var","I","0"],["var","N","0"],["def","n",{"code":[[["if",["!=","0",["length","A"]],[["set","I",["+","I",["*",["-","1",["*","2",["head","B"]]],["head","A"]]]],["set","Z",["list"]],["set","N",["+","N","1"]],["if",["==","4","N"],[["set","Z",["list","\"|\""]],["set","N","0"]]],["++",["list","I"],"Z",["n",["tail","A"],["tail","B"]]]],["else",[["list"]]]]]],"_fndef":true,"_fnparams":["A","B"]}],["n","X","Y"]]],"_fndef":true,"_fnparams":[]}],["def","m",{"code":[[["var","X",["list","16","13","1","11","8","5","1","3","1","3","1","5","8","11","1","13"]],["var","Y",["list","0","1","1","0","1","0","0","1","0","1","0","0","1","0","1","1"]],["var","I","0"],["var","N","0"],["def","n",{"code":[[["if",["!=","0",["length","A"]],[["set","I",["+","I",["*",["-","1",["*","2",["head","B"]]],["head","A"]]]],["set","Z",["list"]],["set","N",["+","N","1"]],["if",["==","4","N"],[["set","Z",["list","\"|\""]],["set","N","0"]]],["++",["list","I"],"Z",["n",["tail","A"],["tail","B"]]]],["else",[["list"]]]]]],"_fndef":true,"_fnparams":["A","B"]}],["n","X","Y"]]],"_fndef":true,"_fnparams":[]}],["print",["m"]]]]
},{}],59:[function(require,module,exports){
module.exports=[[["def","map",{"code":[[["var","Result",["list"]],["var","MapInner",["scope",{"code":[[["set","Result",["++","Result",["call","Callback","Head"]]],["if",["!=","0",["length","Tail"]],[["call","MapInner",["head","Tail"],["tail","Tail"]]]]]],"_fndef":true,"_fnparams":["Head","Tail"]}]],["call","MapInner",["head","List"],["tail","List"]],["Result"]]],"_fndef":true,"_fnparams":["List","Callback"]}],["print",["map",["list","1","2","3"],{"code":[[["+","N","1"]]],"_fndef":true,"_fnparams":["N"]}]],["print",["map",["list","1","2","3"],{"code":[[["*","N","2"]]],"_fndef":true,"_fnparams":["N"]}]]]]
},{}],60:[function(require,module,exports){
module.exports=[[["import","\"file\""],["import","\"lists\""],["import","\"readline\""],["platform","v1"],["var","TabIndentCount","4"],["var","TabIndent",["invoke","\" \"","repeat","TabIndentCount"]],["def","make-template",{"code":[[["var","Header","\"##[Lithp][1],\""],["var","Url","\"  [1]: https://github.com/andrakis/node-lithp\""],["print","Header",["length","Code"],"\"bytes\""],["print"],["var","Test",["match","Code",["regex",["nl"],"\"g\""]]],["if",["<=",["length",["?",["==",["null"],"Test"],"[]","Test"]],"1"],[["print","\"    \"","Code"]],["else",[["each",["list",["tuple","\"\\\\t\"","TabIndent"]],["scope",{"code":[[["set","Code",["replace","Code",["regex",["index","Tuple","0"],"\"g\""],["index","Tuple","1"]]]]],"_fndef":true,"_fnparams":["Tuple"]}]],["var","Lines",["split","Code",["regex","\"\\r?\\n\\r?\""]]],["each","Lines",["scope",{"code":[[["print",["+","TabIndent","Line"]]]],"_fndef":true,"_fnparams":["Line"]}]]]]],["print"],["print","Url"]]],"_fndef":true,"_fnparams":["Code"]}],["if",["==","false",["get-def","\"FILE\""]],[["readline","\"Code: \"",["scope",{"code":[[["make-template","Code"]]],"_fndef":true,"_fnparams":["Code"]}]]],["else",[["var","File",["+","\"\"",["get-def","\"FILE\""]]],["print","\"Opening file\"","File","\"...\""],["read-file","File",["scope",{"code":[[["if",["!=",["null"],"Err"],[["print","\"Got Err:\"","Err"]],["else",[["var","Content",["to-string","Data"]],["make-template","Content"]]]]]],"_fndef":true,"_fnparams":["Err","Data"]}]]]]]]]
},{}],61:[function(require,module,exports){
module.exports=[[["var","Path",["+",["get-def","__dirname"],"\"/module_lib\""]],["print","\"Path to module-lib:\"","Path"],["import","Path"],["print","\"Add 2+2:\"",["add","2","2"]],["var","Add5",["add","5"]],["print","\"Add 5+2:\"",["call","Add5","2"]],["print","\"Module value:\"",["getMyValue"]],["var","MyValue","1"],["print","\"Call with two:\"",["callWith2",{"code":[[["+","MyValue","Two"]]],"_fndef":true,"_fnparams":["Two"]}]]]]
},{}],62:[function(require,module,exports){
module.exports=[[["platform","v1"],["def","add",{"code":[[["scope",{"code":[[["+","A","B"]]],"_fndef":true,"_fnparams":["B"]}]]],"_fndef":true,"_fnparams":["A"]}],["def","add",{"code":[[["+","A","B"]]],"_fndef":true,"_fnparams":["A","B"]}],["export","add/1","add/2"],["var","MyValue","1"],["def","getMyValue",{"code":[["MyValue"]],"_fndef":true,"_fnparams":[]}],["var","Two","2"],["def","callWith2",{"code":[[["call","Fn","Two"]]],"_fndef":true,"_fnparams":["Fn"]}],["export","getMyValue/0","callWith2/1"],["def","private_function",{"code":[[["-","A","B"]]],"_fndef":true,"_fnparams":["A","B"]}]]]
},{}],63:[function(require,module,exports){
module.exports=[[["def","f",{"code":[[["if",["<","N","2"],[["?",["!=","0","N"],["*","2","R"],"1"]],[["/",["*",["*",["*",["*",["f",["-","N","2"],"R"],"2"],["pi"]],"R"],"R"],"N"]]]]],"_fndef":true,"_fnparams":["N","R"]}],["print",["f","1","1"]],["print",["f","2","3"]],["print",["f","3","1"]],["print",["f","3","4.5"]],["print",["f","1","9.379"]],["print",["f","0","48"]]]]
},{}],64:[function(require,module,exports){
module.exports=[[["def","odd",{"code":[[["var","Split",["split","S",["regex","\"[aeiou]\"","\"i\""]]],["if",["==","1",["&","1",["~",["length","Split"]]]],[["\"odd\""]],["else",[["\"even\""]]]]]],"_fndef":true,"_fnparams":["S"]}],["def","test",{"code":[[["print","\"Test \"",["quote","S"],"\": \"",["odd","S"]]]],"_fndef":true,"_fnparams":["S"]}],["test","\"trees\""],["test","\"brush\""],["test","\"CAts\""],["test","\"Savoie\""],["test","\"rhythm\""]]]
},{}],65:[function(require,module,exports){
module.exports=[[["import","\"lists\""],["def","f",{"code":[[["each",["seq","1","10"],{"code":[[["print","N"]]],"_fndef":true,"_fnparams":["N"]}]]],"_fndef":true,"_fnparams":[]}],["def","x",{"code":[[["def","y",{"code":[[["print","N"],["if",["<","N","10"],[["y",["+","N","1"]]]]]],"_fndef":true,"_fnparams":["N"]}],["y","1"]]],"_fndef":true,"_fnparams":[]}],["f"]]]
},{}],66:[function(require,module,exports){
module.exports=[[["def","f",{"code":[[["?",["!=",["null"],["match","S","\"^((.+)\\\\2)+$\""]],"true","false"]]],"_fndef":true,"_fnparams":["S"]}],["print",["f","\"aa\""]],["print",["f","\"aabaaababbbaba\""]],["print",["f","\"aaababbabbabbbababbaabaabaababaaba\""]],["print",["f","\"ba\""]]]]
},{}],67:[function(require,module,exports){
module.exports=[[["platform","v1"],["var","MyDict",["dict",["tuple","a","1"],["tuple","b","2"]]],["print","MyDict"]]]
},{}],68:[function(require,module,exports){
module.exports=[[["def","f",{"code":[[["def","x",{"code":[["invoke","S","repeat","N"]],"_fndef":true,"_fnparams":["S","N"]}],["var","A",["x","\"/\"","5"]],["var","B",["x","\"\\\\\"","5"]],["var","C",["+",["x",["+","A","B"],"6"],["nl"]]],["var","D",["+",["x",["+","B","A"],"6"],["nl"]]],["print",["x",["+",["x","C","4"],["x","D","4"]],"5"]]]],"_fndef":true,"_fnparams":[]}],["f"]]]
},{}],69:[function(require,module,exports){
module.exports=[[["def","pow",{"code":[[["if",["==","Y","1"],["else",[["*","X",["pow","X",["-","Y","1"]]]]]]]],"_fndef":true,"_fnparams":["X","Y"]}],["var","A","5"],["var","B","100"],["print","\"\"","A","\" to the power of \"","B","\":\"",["pow","A","B"]]]]
},{}],70:[function(require,module,exports){
module.exports=[[["def","f",{"code":[[["replace","X",["regex","\"([aeiou]+[^aeiou]*){1,2} [^aeiou]*\""],"\"\""]]],"_fndef":true,"_fnparams":["X"]}],["print",["f","\"brad angelina\""]]]]
},{}],71:[function(require,module,exports){
module.exports=[[["platform","v1"],["var","Fs",["require","\"fs\""]],["var","SampleFile",["+",["get-def","__dirname"],"\"/../index.js\""]],["var","FsReadFileSync",["dict-get","Fs","\"readFileSync\""]],["print","\"readFileSync:\"",["inspect","FsReadFileSync"]],["print","\"Read index.js:\"",["call","FsReadFileSync","SampleFile"]],["var","FsReadFile",["dict-get","Fs","\"readFile\""]],["print","\"readFile:\"",["inspect","FsReadFile"]],["var","Our_callback",["js-bridge",{"code":[[["if",["!=",["null"],"Err"],[["print","\"Failed to read file, err:  \"","Err"]],["else",[["print","\"Data from file:\""],["print",["invoke","Data","\"toString\""]]]]]]],"_fndef":true,"_fnparams":["Err","Data"]}]],["call","FsReadFile","SampleFile","Our_callback"],["call","FsReadFile","\"non-existant\"","Our_callback"]]]
},{}],72:[function(require,module,exports){
module.exports=[[["def","fac-recursive",{"code":[[["def","fac-r-inner",{"code":[[["if",["==","0","N"],[["Acc"]],["else",[["recurse",["-","N","1"],["*","N","Acc"]]]]]]],"_fndef":true,"_fnparams":["N","Acc"]}],["fac-r-inner","N","1"]]],"_fndef":true,"_fnparams":["N"]}],["print",["fac-recursive","100"]]]]
},{}],73:[function(require,module,exports){
module.exports=[[["def","add",{"code":[[["scope",{"code":[[["+","A","B"]]],"_fndef":true,"_fnparams":["B"]}]]],"_fndef":true,"_fnparams":["A"]}],["var","Add5",["add","5"]],["var","Add10",["add","10"]],["var","N","10"],["print","\"Add5 with \"","N","\": \"",["call","Add5","N"]],["print","\"Add10 with \"","N","\": \"",["call","Add10","N"]],["assert",["==","15",["call","Add5","10"]]]]]
},{}],74:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51}],75:[function(require,module,exports){
module.exports=[[["print","\"Hello, world!\""],["print","\"1+1:\"",["+","1","1"],"\" Wow!\""],["print","\"Also a test:\"",["*","5","10"]],["print","\"One last test:\"",["/","10","2"]],["var","A","5"],["var","B","6"],["print","\"A+B:\"",["+","A","B"]]]]
},{}],76:[function(require,module,exports){
module.exports=[[["import","\"lists\""],["def","s",{"code":[[["var","X",["repeat","\"#\"","N"]],["print","X"],["each",["seq","3","N"],["scope",{"code":[[["print",["+","\"#\"",["repeat","\" \"",["-","N","2"]],"\"#\""]]]],"_fndef":true,"_fnparams":["X"]}]],["print","X"]]],"_fndef":true,"_fnparams":["N"]}],["s","10"]]]
},{}],77:[function(require,module,exports){
module.exports=[[["var","A","5"],["var","B","6"],["print","\"A+B:\"",["+","A","B"]],["if",["==","A","B"],[["print","\":)\""],["print","\"The same!\""]],["else",[["print","\":(\""],["print","\"Different\""]]]]]]
},{}],78:[function(require,module,exports){
module.exports=[[["def","count-args/*",{"code":[[["print","\"Args length: \"",["length","Args"]]]],"_fndef":true,"_fnparams":["Args"]}],["count-args","foo","bar","yeah"]]]
},{}],79:[function(require,module,exports){
module.exports=[[["def","x",{"code":[[["print",["replace",["repeat","\"_|__\"","175"],["regex","\"(.{70})\"","\"g\""],"\"$1\\n\""]]]],"_fndef":true,"_fnparams":[]}],["x"]]]
},{}],80:[function(require,module,exports){
module.exports=[[["def","seq2",{"code":[[["var","L",["list"]],["while",[["<","A","B"]],[["set","L",["++","L",["list","A"]]],["set","A",["+","A","1"]]]],"L"]],"_fndef":true,"_fnparams":["A","B"]}],["print",["seq2","1","10"]]]]
},{}]},{},[8]);
