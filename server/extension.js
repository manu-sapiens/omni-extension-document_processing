
await(async()=>{let{dirname:e}=await import("path"),{fileURLToPath:i}=await import("url");if(typeof globalThis.__filename>"u"&&(globalThis.__filename=i(import.meta.url)),typeof globalThis.__dirname>"u"&&(globalThis.__dirname=e(globalThis.__filename)),typeof globalThis.require>"u"){let{default:a}=await import("module");globalThis.require=a.createRequire(import.meta.url)}})();

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/base64-js/index.js
var require_base64_js = __commonJS({
  "node_modules/base64-js/index.js"(exports) {
    "use strict";
    exports.byteLength = byteLength;
    exports.toByteArray = toByteArray;
    exports.fromByteArray = fromByteArray;
    var lookup = [];
    var revLookup = [];
    var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
    var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }
    var i;
    var len;
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
    function getLens(b64) {
      var len2 = b64.length;
      if (len2 % 4 > 0) {
        throw new Error("Invalid string. Length must be a multiple of 4");
      }
      var validLen = b64.indexOf("=");
      if (validLen === -1)
        validLen = len2;
      var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
      return [validLen, placeHoldersLen];
    }
    function byteLength(b64) {
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function _byteLength(b64, validLen, placeHoldersLen) {
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function toByteArray(b64) {
      var tmp;
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
      var curByte = 0;
      var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
      var i2;
      for (i2 = 0; i2 < len2; i2 += 4) {
        tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
        arr[curByte++] = tmp >> 16 & 255;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 2) {
        tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 1) {
        tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      return arr;
    }
    function tripletToBase64(num) {
      return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
    }
    function encodeChunk(uint8, start, end) {
      var tmp;
      var output = [];
      for (var i2 = start; i2 < end; i2 += 3) {
        tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
        output.push(tripletToBase64(tmp));
      }
      return output.join("");
    }
    function fromByteArray(uint8) {
      var tmp;
      var len2 = uint8.length;
      var extraBytes = len2 % 3;
      var parts = [];
      var maxChunkLength = 16383;
      for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
        parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
      }
      if (extraBytes === 1) {
        tmp = uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
        );
      } else if (extraBytes === 2) {
        tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
        );
      }
      return parts.join("");
    }
  }
});

// node_modules/retry/lib/retry_operation.js
var require_retry_operation = __commonJS({
  "node_modules/retry/lib/retry_operation.js"(exports, module) {
    function RetryOperation(timeouts, options) {
      if (typeof options === "boolean") {
        options = { forever: options };
      }
      this._originalTimeouts = JSON.parse(JSON.stringify(timeouts));
      this._timeouts = timeouts;
      this._options = options || {};
      this._maxRetryTime = options && options.maxRetryTime || Infinity;
      this._fn = null;
      this._errors = [];
      this._attempts = 1;
      this._operationTimeout = null;
      this._operationTimeoutCb = null;
      this._timeout = null;
      this._operationStart = null;
      this._timer = null;
      if (this._options.forever) {
        this._cachedTimeouts = this._timeouts.slice(0);
      }
    }
    module.exports = RetryOperation;
    RetryOperation.prototype.reset = function() {
      this._attempts = 1;
      this._timeouts = this._originalTimeouts.slice(0);
    };
    RetryOperation.prototype.stop = function() {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      if (this._timer) {
        clearTimeout(this._timer);
      }
      this._timeouts = [];
      this._cachedTimeouts = null;
    };
    RetryOperation.prototype.retry = function(err) {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      if (!err) {
        return false;
      }
      var currentTime = (/* @__PURE__ */ new Date()).getTime();
      if (err && currentTime - this._operationStart >= this._maxRetryTime) {
        this._errors.push(err);
        this._errors.unshift(new Error("RetryOperation timeout occurred"));
        return false;
      }
      this._errors.push(err);
      var timeout = this._timeouts.shift();
      if (timeout === void 0) {
        if (this._cachedTimeouts) {
          this._errors.splice(0, this._errors.length - 1);
          timeout = this._cachedTimeouts.slice(-1);
        } else {
          return false;
        }
      }
      var self = this;
      this._timer = setTimeout(function() {
        self._attempts++;
        if (self._operationTimeoutCb) {
          self._timeout = setTimeout(function() {
            self._operationTimeoutCb(self._attempts);
          }, self._operationTimeout);
          if (self._options.unref) {
            self._timeout.unref();
          }
        }
        self._fn(self._attempts);
      }, timeout);
      if (this._options.unref) {
        this._timer.unref();
      }
      return true;
    };
    RetryOperation.prototype.attempt = function(fn, timeoutOps) {
      this._fn = fn;
      if (timeoutOps) {
        if (timeoutOps.timeout) {
          this._operationTimeout = timeoutOps.timeout;
        }
        if (timeoutOps.cb) {
          this._operationTimeoutCb = timeoutOps.cb;
        }
      }
      var self = this;
      if (this._operationTimeoutCb) {
        this._timeout = setTimeout(function() {
          self._operationTimeoutCb();
        }, self._operationTimeout);
      }
      this._operationStart = (/* @__PURE__ */ new Date()).getTime();
      this._fn(this._attempts);
    };
    RetryOperation.prototype.try = function(fn) {
      console.log("Using RetryOperation.try() is deprecated");
      this.attempt(fn);
    };
    RetryOperation.prototype.start = function(fn) {
      console.log("Using RetryOperation.start() is deprecated");
      this.attempt(fn);
    };
    RetryOperation.prototype.start = RetryOperation.prototype.try;
    RetryOperation.prototype.errors = function() {
      return this._errors;
    };
    RetryOperation.prototype.attempts = function() {
      return this._attempts;
    };
    RetryOperation.prototype.mainError = function() {
      if (this._errors.length === 0) {
        return null;
      }
      var counts = {};
      var mainError = null;
      var mainErrorCount = 0;
      for (var i = 0; i < this._errors.length; i++) {
        var error = this._errors[i];
        var message = error.message;
        var count = (counts[message] || 0) + 1;
        counts[message] = count;
        if (count >= mainErrorCount) {
          mainError = error;
          mainErrorCount = count;
        }
      }
      return mainError;
    };
  }
});

// node_modules/retry/lib/retry.js
var require_retry = __commonJS({
  "node_modules/retry/lib/retry.js"(exports) {
    var RetryOperation = require_retry_operation();
    exports.operation = function(options) {
      var timeouts = exports.timeouts(options);
      return new RetryOperation(timeouts, {
        forever: options && (options.forever || options.retries === Infinity),
        unref: options && options.unref,
        maxRetryTime: options && options.maxRetryTime
      });
    };
    exports.timeouts = function(options) {
      if (options instanceof Array) {
        return [].concat(options);
      }
      var opts = {
        retries: 10,
        factor: 2,
        minTimeout: 1 * 1e3,
        maxTimeout: Infinity,
        randomize: false
      };
      for (var key in options) {
        opts[key] = options[key];
      }
      if (opts.minTimeout > opts.maxTimeout) {
        throw new Error("minTimeout is greater than maxTimeout");
      }
      var timeouts = [];
      for (var i = 0; i < opts.retries; i++) {
        timeouts.push(this.createTimeout(i, opts));
      }
      if (options && options.forever && !timeouts.length) {
        timeouts.push(this.createTimeout(i, opts));
      }
      timeouts.sort(function(a, b) {
        return a - b;
      });
      return timeouts;
    };
    exports.createTimeout = function(attempt, opts) {
      var random = opts.randomize ? Math.random() + 1 : 1;
      var timeout = Math.round(random * Math.max(opts.minTimeout, 1) * Math.pow(opts.factor, attempt));
      timeout = Math.min(timeout, opts.maxTimeout);
      return timeout;
    };
    exports.wrap = function(obj, options, methods) {
      if (options instanceof Array) {
        methods = options;
        options = null;
      }
      if (!methods) {
        methods = [];
        for (var key in obj) {
          if (typeof obj[key] === "function") {
            methods.push(key);
          }
        }
      }
      for (var i = 0; i < methods.length; i++) {
        var method = methods[i];
        var original = obj[method];
        obj[method] = function retryWrapper(original2) {
          var op = exports.operation(options);
          var args = Array.prototype.slice.call(arguments, 1);
          var callback = args.pop();
          args.push(function(err) {
            if (op.retry(err)) {
              return;
            }
            if (err) {
              arguments[0] = op.mainError();
            }
            callback.apply(this, arguments);
          });
          op.attempt(function() {
            original2.apply(obj, args);
          });
        }.bind(obj, original);
        obj[method].options = options;
      }
    };
  }
});

// node_modules/retry/index.js
var require_retry2 = __commonJS({
  "node_modules/retry/index.js"(exports, module) {
    module.exports = require_retry();
  }
});

// node_modules/p-retry/index.js
var require_p_retry = __commonJS({
  "node_modules/p-retry/index.js"(exports, module) {
    "use strict";
    var retry = require_retry2();
    var networkErrorMsgs = [
      "Failed to fetch",
      // Chrome
      "NetworkError when attempting to fetch resource.",
      // Firefox
      "The Internet connection appears to be offline.",
      // Safari
      "Network request failed"
      // `cross-fetch`
    ];
    var AbortError = class extends Error {
      constructor(message) {
        super();
        if (message instanceof Error) {
          this.originalError = message;
          ({ message } = message);
        } else {
          this.originalError = new Error(message);
          this.originalError.stack = this.stack;
        }
        this.name = "AbortError";
        this.message = message;
      }
    };
    var decorateErrorWithCounts = (error, attemptNumber, options) => {
      const retriesLeft = options.retries - (attemptNumber - 1);
      error.attemptNumber = attemptNumber;
      error.retriesLeft = retriesLeft;
      return error;
    };
    var isNetworkError = (errorMessage) => networkErrorMsgs.includes(errorMessage);
    var pRetry3 = (input, options) => new Promise((resolve, reject) => {
      options = {
        onFailedAttempt: () => {
        },
        retries: 10,
        ...options
      };
      const operation = retry.operation(options);
      operation.attempt(async (attemptNumber) => {
        try {
          resolve(await input(attemptNumber));
        } catch (error) {
          if (!(error instanceof Error)) {
            reject(new TypeError(`Non-error was thrown: "${error}". You should only throw errors.`));
            return;
          }
          if (error instanceof AbortError) {
            operation.stop();
            reject(error.originalError);
          } else if (error instanceof TypeError && !isNetworkError(error.message)) {
            operation.stop();
            reject(error);
          } else {
            decorateErrorWithCounts(error, attemptNumber, options);
            try {
              await options.onFailedAttempt(error);
            } catch (error2) {
              reject(error2);
              return;
            }
            if (!operation.retry(error)) {
              reject(operation.mainError());
            }
          }
        }
      });
    });
    module.exports = pRetry3;
    module.exports.default = pRetry3;
    module.exports.AbortError = AbortError;
  }
});

// node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS({
  "node_modules/eventemitter3/index.js"(exports, module) {
    "use strict";
    var has = Object.prototype.hasOwnProperty;
    var prefix = "~";
    function Events() {
    }
    if (Object.create) {
      Events.prototype = /* @__PURE__ */ Object.create(null);
      if (!new Events().__proto__)
        prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
      if (!emitter._events[evt])
        emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn)
        emitter._events[evt].push(listener);
      else
        emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0)
        emitter._events = new Events();
      else
        delete emitter._events[evt];
    }
    function EventEmitter() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter.prototype.eventNames = function eventNames() {
      var names = [], events, name;
      if (this._eventsCount === 0)
        return names;
      for (name in events = this._events) {
        if (has.call(events, name))
          names.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event, handlers = this._events[evt];
      if (!handlers)
        return [];
      if (handlers.fn)
        return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event, listeners = this._events[evt];
      if (!listeners)
        return 0;
      if (listeners.fn)
        return 1;
      return listeners.length;
    };
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt])
        return false;
      var listeners = this._events[evt], len = arguments.length, args, i;
      if (listeners.fn) {
        if (listeners.once)
          this.removeListener(event, listeners.fn, void 0, true);
        switch (len) {
          case 1:
            return listeners.fn.call(listeners.context), true;
          case 2:
            return listeners.fn.call(listeners.context, a1), true;
          case 3:
            return listeners.fn.call(listeners.context, a1, a2), true;
          case 4:
            return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length, j;
        for (i = 0; i < length; i++) {
          if (listeners[i].once)
            this.removeListener(event, listeners[i].fn, void 0, true);
          switch (len) {
            case 1:
              listeners[i].fn.call(listeners[i].context);
              break;
            case 2:
              listeners[i].fn.call(listeners[i].context, a1);
              break;
            case 3:
              listeners[i].fn.call(listeners[i].context, a1, a2);
              break;
            case 4:
              listeners[i].fn.call(listeners[i].context, a1, a2, a3);
              break;
            default:
              if (!args)
                for (j = 1, args = new Array(len - 1); j < len; j++) {
                  args[j - 1] = arguments[j];
                }
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt])
        return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
            events.push(listeners[i]);
          }
        }
        if (events.length)
          this._events[evt] = events.length === 1 ? events[0] : events;
        else
          clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt])
          clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;
    EventEmitter.prefixed = prefix;
    EventEmitter.EventEmitter = EventEmitter;
    if ("undefined" !== typeof module) {
      module.exports = EventEmitter;
    }
  }
});

// node_modules/p-finally/index.js
var require_p_finally = __commonJS({
  "node_modules/p-finally/index.js"(exports, module) {
    "use strict";
    module.exports = (promise, onFinally) => {
      onFinally = onFinally || (() => {
      });
      return promise.then(
        (val) => new Promise((resolve) => {
          resolve(onFinally());
        }).then(() => val),
        (err) => new Promise((resolve) => {
          resolve(onFinally());
        }).then(() => {
          throw err;
        })
      );
    };
  }
});

// node_modules/p-timeout/index.js
var require_p_timeout = __commonJS({
  "node_modules/p-timeout/index.js"(exports, module) {
    "use strict";
    var pFinally = require_p_finally();
    var TimeoutError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "TimeoutError";
      }
    };
    var pTimeout = (promise, milliseconds, fallback) => new Promise((resolve, reject) => {
      if (typeof milliseconds !== "number" || milliseconds < 0) {
        throw new TypeError("Expected `milliseconds` to be a positive number");
      }
      if (milliseconds === Infinity) {
        resolve(promise);
        return;
      }
      const timer = setTimeout(() => {
        if (typeof fallback === "function") {
          try {
            resolve(fallback());
          } catch (error) {
            reject(error);
          }
          return;
        }
        const message = typeof fallback === "string" ? fallback : `Promise timed out after ${milliseconds} milliseconds`;
        const timeoutError = fallback instanceof Error ? fallback : new TimeoutError(message);
        if (typeof promise.cancel === "function") {
          promise.cancel();
        }
        reject(timeoutError);
      }, milliseconds);
      pFinally(
        // eslint-disable-next-line promise/prefer-await-to-then
        promise.then(resolve, reject),
        () => {
          clearTimeout(timer);
        }
      );
    });
    module.exports = pTimeout;
    module.exports.default = pTimeout;
    module.exports.TimeoutError = TimeoutError;
  }
});

// node_modules/p-queue/dist/lower-bound.js
var require_lower_bound = __commonJS({
  "node_modules/p-queue/dist/lower-bound.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function lowerBound(array, value, comparator) {
      let first = 0;
      let count = array.length;
      while (count > 0) {
        const step = count / 2 | 0;
        let it = first + step;
        if (comparator(array[it], value) <= 0) {
          first = ++it;
          count -= step + 1;
        } else {
          count = step;
        }
      }
      return first;
    }
    exports.default = lowerBound;
  }
});

// node_modules/p-queue/dist/priority-queue.js
var require_priority_queue = __commonJS({
  "node_modules/p-queue/dist/priority-queue.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var lower_bound_1 = require_lower_bound();
    var PriorityQueue = class {
      constructor() {
        this._queue = [];
      }
      enqueue(run, options) {
        options = Object.assign({ priority: 0 }, options);
        const element = {
          priority: options.priority,
          run
        };
        if (this.size && this._queue[this.size - 1].priority >= options.priority) {
          this._queue.push(element);
          return;
        }
        const index = lower_bound_1.default(this._queue, element, (a, b) => b.priority - a.priority);
        this._queue.splice(index, 0, element);
      }
      dequeue() {
        const item = this._queue.shift();
        return item === null || item === void 0 ? void 0 : item.run;
      }
      filter(options) {
        return this._queue.filter((element) => element.priority === options.priority).map((element) => element.run);
      }
      get size() {
        return this._queue.length;
      }
    };
    exports.default = PriorityQueue;
  }
});

// node_modules/p-queue/dist/index.js
var require_dist = __commonJS({
  "node_modules/p-queue/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var EventEmitter = require_eventemitter3();
    var p_timeout_1 = require_p_timeout();
    var priority_queue_1 = require_priority_queue();
    var empty = () => {
    };
    var timeoutError = new p_timeout_1.TimeoutError();
    var PQueue = class extends EventEmitter {
      constructor(options) {
        var _a, _b, _c, _d;
        super();
        this._intervalCount = 0;
        this._intervalEnd = 0;
        this._pendingCount = 0;
        this._resolveEmpty = empty;
        this._resolveIdle = empty;
        options = Object.assign({ carryoverConcurrencyCount: false, intervalCap: Infinity, interval: 0, concurrency: Infinity, autoStart: true, queueClass: priority_queue_1.default }, options);
        if (!(typeof options.intervalCap === "number" && options.intervalCap >= 1)) {
          throw new TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${(_b = (_a = options.intervalCap) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : ""}\` (${typeof options.intervalCap})`);
        }
        if (options.interval === void 0 || !(Number.isFinite(options.interval) && options.interval >= 0)) {
          throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${(_d = (_c = options.interval) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""}\` (${typeof options.interval})`);
        }
        this._carryoverConcurrencyCount = options.carryoverConcurrencyCount;
        this._isIntervalIgnored = options.intervalCap === Infinity || options.interval === 0;
        this._intervalCap = options.intervalCap;
        this._interval = options.interval;
        this._queue = new options.queueClass();
        this._queueClass = options.queueClass;
        this.concurrency = options.concurrency;
        this._timeout = options.timeout;
        this._throwOnTimeout = options.throwOnTimeout === true;
        this._isPaused = options.autoStart === false;
      }
      get _doesIntervalAllowAnother() {
        return this._isIntervalIgnored || this._intervalCount < this._intervalCap;
      }
      get _doesConcurrentAllowAnother() {
        return this._pendingCount < this._concurrency;
      }
      _next() {
        this._pendingCount--;
        this._tryToStartAnother();
        this.emit("next");
      }
      _resolvePromises() {
        this._resolveEmpty();
        this._resolveEmpty = empty;
        if (this._pendingCount === 0) {
          this._resolveIdle();
          this._resolveIdle = empty;
          this.emit("idle");
        }
      }
      _onResumeInterval() {
        this._onInterval();
        this._initializeIntervalIfNeeded();
        this._timeoutId = void 0;
      }
      _isIntervalPaused() {
        const now = Date.now();
        if (this._intervalId === void 0) {
          const delay = this._intervalEnd - now;
          if (delay < 0) {
            this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
          } else {
            if (this._timeoutId === void 0) {
              this._timeoutId = setTimeout(() => {
                this._onResumeInterval();
              }, delay);
            }
            return true;
          }
        }
        return false;
      }
      _tryToStartAnother() {
        if (this._queue.size === 0) {
          if (this._intervalId) {
            clearInterval(this._intervalId);
          }
          this._intervalId = void 0;
          this._resolvePromises();
          return false;
        }
        if (!this._isPaused) {
          const canInitializeInterval = !this._isIntervalPaused();
          if (this._doesIntervalAllowAnother && this._doesConcurrentAllowAnother) {
            const job = this._queue.dequeue();
            if (!job) {
              return false;
            }
            this.emit("active");
            job();
            if (canInitializeInterval) {
              this._initializeIntervalIfNeeded();
            }
            return true;
          }
        }
        return false;
      }
      _initializeIntervalIfNeeded() {
        if (this._isIntervalIgnored || this._intervalId !== void 0) {
          return;
        }
        this._intervalId = setInterval(() => {
          this._onInterval();
        }, this._interval);
        this._intervalEnd = Date.now() + this._interval;
      }
      _onInterval() {
        if (this._intervalCount === 0 && this._pendingCount === 0 && this._intervalId) {
          clearInterval(this._intervalId);
          this._intervalId = void 0;
        }
        this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
        this._processQueue();
      }
      /**
      Executes all queued functions until it reaches the limit.
      */
      _processQueue() {
        while (this._tryToStartAnother()) {
        }
      }
      get concurrency() {
        return this._concurrency;
      }
      set concurrency(newConcurrency) {
        if (!(typeof newConcurrency === "number" && newConcurrency >= 1)) {
          throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${newConcurrency}\` (${typeof newConcurrency})`);
        }
        this._concurrency = newConcurrency;
        this._processQueue();
      }
      /**
      Adds a sync or async task to the queue. Always returns a promise.
      */
      async add(fn, options = {}) {
        return new Promise((resolve, reject) => {
          const run = async () => {
            this._pendingCount++;
            this._intervalCount++;
            try {
              const operation = this._timeout === void 0 && options.timeout === void 0 ? fn() : p_timeout_1.default(Promise.resolve(fn()), options.timeout === void 0 ? this._timeout : options.timeout, () => {
                if (options.throwOnTimeout === void 0 ? this._throwOnTimeout : options.throwOnTimeout) {
                  reject(timeoutError);
                }
                return void 0;
              });
              resolve(await operation);
            } catch (error) {
              reject(error);
            }
            this._next();
          };
          this._queue.enqueue(run, options);
          this._tryToStartAnother();
          this.emit("add");
        });
      }
      /**
          Same as `.add()`, but accepts an array of sync or async functions.
      
          @returns A promise that resolves when all functions are resolved.
          */
      async addAll(functions, options) {
        return Promise.all(functions.map(async (function_) => this.add(function_, options)));
      }
      /**
      Start (or resume) executing enqueued tasks within concurrency limit. No need to call this if queue is not paused (via `options.autoStart = false` or by `.pause()` method.)
      */
      start() {
        if (!this._isPaused) {
          return this;
        }
        this._isPaused = false;
        this._processQueue();
        return this;
      }
      /**
      Put queue execution on hold.
      */
      pause() {
        this._isPaused = true;
      }
      /**
      Clear the queue.
      */
      clear() {
        this._queue = new this._queueClass();
      }
      /**
          Can be called multiple times. Useful if you for example add additional items at a later time.
      
          @returns A promise that settles when the queue becomes empty.
          */
      async onEmpty() {
        if (this._queue.size === 0) {
          return;
        }
        return new Promise((resolve) => {
          const existingResolve = this._resolveEmpty;
          this._resolveEmpty = () => {
            existingResolve();
            resolve();
          };
        });
      }
      /**
          The difference with `.onEmpty` is that `.onIdle` guarantees that all work from the queue has finished. `.onEmpty` merely signals that the queue is empty, but it could mean that some promises haven't completed yet.
      
          @returns A promise that settles when the queue becomes empty, and all promises have completed; `queue.size === 0 && queue.pending === 0`.
          */
      async onIdle() {
        if (this._pendingCount === 0 && this._queue.size === 0) {
          return;
        }
        return new Promise((resolve) => {
          const existingResolve = this._resolveIdle;
          this._resolveIdle = () => {
            existingResolve();
            resolve();
          };
        });
      }
      /**
      Size of the queue.
      */
      get size() {
        return this._queue.size;
      }
      /**
          Size of the queue, filtered by the given options.
      
          For example, this can be used to find the number of items remaining in the queue with a specific priority level.
          */
      sizeBy(options) {
        return this._queue.filter(options).length;
      }
      /**
      Number of pending promises.
      */
      get pending() {
        return this._pendingCount;
      }
      /**
      Whether the queue is currently paused.
      */
      get isPaused() {
        return this._isPaused;
      }
      get timeout() {
        return this._timeout;
      }
      /**
      Set the timeout for future operations.
      */
      set timeout(milliseconds) {
        this._timeout = milliseconds;
      }
    };
    exports.default = PQueue;
  }
});

// node_modules/decamelize/index.js
var require_decamelize = __commonJS({
  "node_modules/decamelize/index.js"(exports, module) {
    "use strict";
    module.exports = function(str, sep) {
      if (typeof str !== "string") {
        throw new TypeError("Expected a string");
      }
      sep = typeof sep === "undefined" ? "_" : sep;
      return str.replace(/([a-z\d])([A-Z])/g, "$1" + sep + "$2").replace(/([A-Z]+)([A-Z][a-z\d]+)/g, "$1" + sep + "$2").toLowerCase();
    };
  }
});

// node_modules/camelcase/index.js
var require_camelcase = __commonJS({
  "node_modules/camelcase/index.js"(exports, module) {
    "use strict";
    var UPPERCASE = /[\p{Lu}]/u;
    var LOWERCASE = /[\p{Ll}]/u;
    var LEADING_CAPITAL = /^[\p{Lu}](?![\p{Lu}])/gu;
    var IDENTIFIER = /([\p{Alpha}\p{N}_]|$)/u;
    var SEPARATORS = /[_.\- ]+/;
    var LEADING_SEPARATORS = new RegExp("^" + SEPARATORS.source);
    var SEPARATORS_AND_IDENTIFIER = new RegExp(SEPARATORS.source + IDENTIFIER.source, "gu");
    var NUMBERS_AND_IDENTIFIER = new RegExp("\\d+" + IDENTIFIER.source, "gu");
    var preserveCamelCase = (string, toLowerCase, toUpperCase) => {
      let isLastCharLower = false;
      let isLastCharUpper = false;
      let isLastLastCharUpper = false;
      for (let i = 0; i < string.length; i++) {
        const character = string[i];
        if (isLastCharLower && UPPERCASE.test(character)) {
          string = string.slice(0, i) + "-" + string.slice(i);
          isLastCharLower = false;
          isLastLastCharUpper = isLastCharUpper;
          isLastCharUpper = true;
          i++;
        } else if (isLastCharUpper && isLastLastCharUpper && LOWERCASE.test(character)) {
          string = string.slice(0, i - 1) + "-" + string.slice(i - 1);
          isLastLastCharUpper = isLastCharUpper;
          isLastCharUpper = false;
          isLastCharLower = true;
        } else {
          isLastCharLower = toLowerCase(character) === character && toUpperCase(character) !== character;
          isLastLastCharUpper = isLastCharUpper;
          isLastCharUpper = toUpperCase(character) === character && toLowerCase(character) !== character;
        }
      }
      return string;
    };
    var preserveConsecutiveUppercase = (input, toLowerCase) => {
      LEADING_CAPITAL.lastIndex = 0;
      return input.replace(LEADING_CAPITAL, (m1) => toLowerCase(m1));
    };
    var postProcess = (input, toUpperCase) => {
      SEPARATORS_AND_IDENTIFIER.lastIndex = 0;
      NUMBERS_AND_IDENTIFIER.lastIndex = 0;
      return input.replace(SEPARATORS_AND_IDENTIFIER, (_, identifier) => toUpperCase(identifier)).replace(NUMBERS_AND_IDENTIFIER, (m) => toUpperCase(m));
    };
    var camelCase2 = (input, options) => {
      if (!(typeof input === "string" || Array.isArray(input))) {
        throw new TypeError("Expected the input to be `string | string[]`");
      }
      options = {
        pascalCase: false,
        preserveConsecutiveUppercase: false,
        ...options
      };
      if (Array.isArray(input)) {
        input = input.map((x) => x.trim()).filter((x) => x.length).join("-");
      } else {
        input = input.trim();
      }
      if (input.length === 0) {
        return "";
      }
      const toLowerCase = options.locale === false ? (string) => string.toLowerCase() : (string) => string.toLocaleLowerCase(options.locale);
      const toUpperCase = options.locale === false ? (string) => string.toUpperCase() : (string) => string.toLocaleUpperCase(options.locale);
      if (input.length === 1) {
        return options.pascalCase ? toUpperCase(input) : toLowerCase(input);
      }
      const hasUpperCase = input !== toLowerCase(input);
      if (hasUpperCase) {
        input = preserveCamelCase(input, toLowerCase, toUpperCase);
      }
      input = input.replace(LEADING_SEPARATORS, "");
      if (options.preserveConsecutiveUppercase) {
        input = preserveConsecutiveUppercase(input, toLowerCase);
      } else {
        input = toLowerCase(input);
      }
      if (options.pascalCase) {
        input = toUpperCase(input.charAt(0)) + input.slice(1);
      }
      return postProcess(input, toUpperCase);
    };
    module.exports = camelCase2;
    module.exports.default = camelCase2;
  }
});

// node_modules/langchain/node_modules/ansi-styles/index.js
var require_ansi_styles = __commonJS({
  "node_modules/langchain/node_modules/ansi-styles/index.js"(exports, module) {
    "use strict";
    var ANSI_BACKGROUND_OFFSET = 10;
    var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
    var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
    function assembleStyles() {
      const codes = /* @__PURE__ */ new Map();
      const styles2 = {
        modifier: {
          reset: [0, 0],
          // 21 isn't widely supported and 22 does the same thing
          bold: [1, 22],
          dim: [2, 22],
          italic: [3, 23],
          underline: [4, 24],
          overline: [53, 55],
          inverse: [7, 27],
          hidden: [8, 28],
          strikethrough: [9, 29]
        },
        color: {
          black: [30, 39],
          red: [31, 39],
          green: [32, 39],
          yellow: [33, 39],
          blue: [34, 39],
          magenta: [35, 39],
          cyan: [36, 39],
          white: [37, 39],
          // Bright color
          blackBright: [90, 39],
          redBright: [91, 39],
          greenBright: [92, 39],
          yellowBright: [93, 39],
          blueBright: [94, 39],
          magentaBright: [95, 39],
          cyanBright: [96, 39],
          whiteBright: [97, 39]
        },
        bgColor: {
          bgBlack: [40, 49],
          bgRed: [41, 49],
          bgGreen: [42, 49],
          bgYellow: [43, 49],
          bgBlue: [44, 49],
          bgMagenta: [45, 49],
          bgCyan: [46, 49],
          bgWhite: [47, 49],
          // Bright color
          bgBlackBright: [100, 49],
          bgRedBright: [101, 49],
          bgGreenBright: [102, 49],
          bgYellowBright: [103, 49],
          bgBlueBright: [104, 49],
          bgMagentaBright: [105, 49],
          bgCyanBright: [106, 49],
          bgWhiteBright: [107, 49]
        }
      };
      styles2.color.gray = styles2.color.blackBright;
      styles2.bgColor.bgGray = styles2.bgColor.bgBlackBright;
      styles2.color.grey = styles2.color.blackBright;
      styles2.bgColor.bgGrey = styles2.bgColor.bgBlackBright;
      for (const [groupName, group] of Object.entries(styles2)) {
        for (const [styleName, style] of Object.entries(group)) {
          styles2[styleName] = {
            open: `\x1B[${style[0]}m`,
            close: `\x1B[${style[1]}m`
          };
          group[styleName] = styles2[styleName];
          codes.set(style[0], style[1]);
        }
        Object.defineProperty(styles2, groupName, {
          value: group,
          enumerable: false
        });
      }
      Object.defineProperty(styles2, "codes", {
        value: codes,
        enumerable: false
      });
      styles2.color.close = "\x1B[39m";
      styles2.bgColor.close = "\x1B[49m";
      styles2.color.ansi256 = wrapAnsi256();
      styles2.color.ansi16m = wrapAnsi16m();
      styles2.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
      styles2.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
      Object.defineProperties(styles2, {
        rgbToAnsi256: {
          value: (red, green, blue) => {
            if (red === green && green === blue) {
              if (red < 8) {
                return 16;
              }
              if (red > 248) {
                return 231;
              }
              return Math.round((red - 8) / 247 * 24) + 232;
            }
            return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
          },
          enumerable: false
        },
        hexToRgb: {
          value: (hex) => {
            const matches = /(?<colorString>[a-f\d]{6}|[a-f\d]{3})/i.exec(hex.toString(16));
            if (!matches) {
              return [0, 0, 0];
            }
            let { colorString } = matches.groups;
            if (colorString.length === 3) {
              colorString = colorString.split("").map((character) => character + character).join("");
            }
            const integer = Number.parseInt(colorString, 16);
            return [
              integer >> 16 & 255,
              integer >> 8 & 255,
              integer & 255
            ];
          },
          enumerable: false
        },
        hexToAnsi256: {
          value: (hex) => styles2.rgbToAnsi256(...styles2.hexToRgb(hex)),
          enumerable: false
        }
      });
      return styles2;
    }
    Object.defineProperty(module, "exports", {
      enumerable: true,
      get: assembleStyles
    });
  }
});

// node_modules/ml-distance-euclidean/lib/euclidean.js
var require_euclidean = __commonJS({
  "node_modules/ml-distance-euclidean/lib/euclidean.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function squaredEuclidean(p, q) {
      let d = 0;
      for (let i = 0; i < p.length; i++) {
        d += (p[i] - q[i]) * (p[i] - q[i]);
      }
      return d;
    }
    exports.squaredEuclidean = squaredEuclidean;
    function euclidean(p, q) {
      return Math.sqrt(squaredEuclidean(p, q));
    }
    exports.euclidean = euclidean;
  }
});

// node_modules/ml-distance/lib/distances/additiveSymmetric.js
var require_additiveSymmetric = __commonJS({
  "node_modules/ml-distance/lib/distances/additiveSymmetric.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function additiveSymmetric(a, b) {
      let d = 0;
      for (let i = 0; i < a.length; i++) {
        d += (a[i] - b[i]) * (a[i] - b[i]) * (a[i] + b[i]) / (a[i] * b[i]);
      }
      return d;
    }
    exports.default = additiveSymmetric;
  }
});

// node_modules/ml-distance/lib/distances/avg.js
var require_avg = __commonJS({
  "node_modules/ml-distance/lib/distances/avg.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function avg(a, b) {
      let max = 0;
      let ans = 0;
      let aux = 0;
      for (let i = 0; i < a.length; i++) {
        aux = Math.abs(a[i] - b[i]);
        ans += aux;
        if (max < aux) {
          max = aux;
        }
      }
      return (max + ans) / 2;
    }
    exports.default = avg;
  }
});

// node_modules/ml-distance/lib/distances/bhattacharyya.js
var require_bhattacharyya = __commonJS({
  "node_modules/ml-distance/lib/distances/bhattacharyya.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function bhattacharyya(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += Math.sqrt(a[i] * b[i]);
      }
      return -Math.log(ans);
    }
    exports.default = bhattacharyya;
  }
});

// node_modules/ml-distance/lib/distances/canberra.js
var require_canberra = __commonJS({
  "node_modules/ml-distance/lib/distances/canberra.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function canberra(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += Math.abs(a[i] - b[i]) / (a[i] + b[i]);
      }
      return ans;
    }
    exports.default = canberra;
  }
});

// node_modules/ml-distance/lib/distances/chebyshev.js
var require_chebyshev = __commonJS({
  "node_modules/ml-distance/lib/distances/chebyshev.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function chebyshev(a, b) {
      let max = 0;
      let aux = 0;
      for (let i = 0; i < a.length; i++) {
        aux = Math.abs(a[i] - b[i]);
        if (max < aux) {
          max = aux;
        }
      }
      return max;
    }
    exports.default = chebyshev;
  }
});

// node_modules/ml-distance/lib/distances/clark.js
var require_clark = __commonJS({
  "node_modules/ml-distance/lib/distances/clark.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function clark(a, b) {
      let d = 0;
      for (let i = 0; i < a.length; i++) {
        d += (Math.abs(a[i] - b[i]) / (a[i] + b[i])) ** 2;
      }
      return Math.sqrt(d);
    }
    exports.default = clark;
  }
});

// node_modules/ml-distance/lib/similarities/czekanowski.js
var require_czekanowski = __commonJS({
  "node_modules/ml-distance/lib/similarities/czekanowski.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function czekanowskiSimilarity(a, b) {
      let up = 0;
      let down = 0;
      for (let i = 0; i < a.length; i++) {
        up += Math.min(a[i], b[i]);
        down += a[i] + b[i];
      }
      return 2 * up / down;
    }
    exports.default = czekanowskiSimilarity;
  }
});

// node_modules/ml-distance/lib/distances/czekanowski.js
var require_czekanowski2 = __commonJS({
  "node_modules/ml-distance/lib/distances/czekanowski.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var czekanowski_1 = __importDefault(require_czekanowski());
    function czekanowskiDistance(a, b) {
      return 1 - (0, czekanowski_1.default)(a, b);
    }
    exports.default = czekanowskiDistance;
  }
});

// node_modules/ml-distance/lib/distances/dice.js
var require_dice = __commonJS({
  "node_modules/ml-distance/lib/distances/dice.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function dice(a, b) {
      let a2 = 0;
      let b2 = 0;
      let prod2 = 0;
      for (let i = 0; i < a.length; i++) {
        a2 += a[i] * a[i];
        b2 += b[i] * b[i];
        prod2 += (a[i] - b[i]) * (a[i] - b[i]);
      }
      return prod2 / (a2 + b2);
    }
    exports.default = dice;
  }
});

// node_modules/ml-distance/lib/distances/divergence.js
var require_divergence = __commonJS({
  "node_modules/ml-distance/lib/distances/divergence.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function divergence(a, b) {
      let d = 0;
      for (let i = 0; i < a.length; i++) {
        d += (a[i] - b[i]) * (a[i] - b[i]) / ((a[i] + b[i]) * (a[i] + b[i]));
      }
      return 2 * d;
    }
    exports.default = divergence;
  }
});

// node_modules/ml-distance/lib/distances/fidelity.js
var require_fidelity = __commonJS({
  "node_modules/ml-distance/lib/distances/fidelity.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function fidelity(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += Math.sqrt(a[i] * b[i]);
      }
      return ans;
    }
    exports.default = fidelity;
  }
});

// node_modules/ml-distance/lib/distances/gower.js
var require_gower = __commonJS({
  "node_modules/ml-distance/lib/distances/gower.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function gower(a, b) {
      const ii = a.length;
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += Math.abs(a[i] - b[i]);
      }
      return ans / ii;
    }
    exports.default = gower;
  }
});

// node_modules/ml-distance/lib/distances/harmonicMean.js
var require_harmonicMean = __commonJS({
  "node_modules/ml-distance/lib/distances/harmonicMean.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function harmonicMean(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += a[i] * b[i] / (a[i] + b[i]);
      }
      return 2 * ans;
    }
    exports.default = harmonicMean;
  }
});

// node_modules/ml-distance/lib/distances/hellinger.js
var require_hellinger = __commonJS({
  "node_modules/ml-distance/lib/distances/hellinger.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function hellinger(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += Math.sqrt(a[i] * b[i]);
      }
      return 2 * Math.sqrt(1 - ans);
    }
    exports.default = hellinger;
  }
});

// node_modules/ml-distance/lib/distances/innerProduct.js
var require_innerProduct = __commonJS({
  "node_modules/ml-distance/lib/distances/innerProduct.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function innerProduct(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += a[i] * b[i];
      }
      return ans;
    }
    exports.default = innerProduct;
  }
});

// node_modules/ml-distance/lib/distances/intersection.js
var require_intersection = __commonJS({
  "node_modules/ml-distance/lib/distances/intersection.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function intersection(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += Math.min(a[i], b[i]);
      }
      return 1 - ans;
    }
    exports.default = intersection;
  }
});

// node_modules/ml-distance/lib/similarities/kumarHassebrook.js
var require_kumarHassebrook = __commonJS({
  "node_modules/ml-distance/lib/similarities/kumarHassebrook.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function kumarHassebrook(a, b) {
      let p = 0;
      let p2 = 0;
      let q2 = 0;
      for (let i = 0; i < a.length; i++) {
        p += a[i] * b[i];
        p2 += a[i] * a[i];
        q2 += b[i] * b[i];
      }
      return p / (p2 + q2 - p);
    }
    exports.default = kumarHassebrook;
  }
});

// node_modules/ml-distance/lib/distances/jaccard.js
var require_jaccard = __commonJS({
  "node_modules/ml-distance/lib/distances/jaccard.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var kumarHassebrook_1 = __importDefault(require_kumarHassebrook());
    function jaccard(a, b) {
      return 1 - (0, kumarHassebrook_1.default)(a, b);
    }
    exports.default = jaccard;
  }
});

// node_modules/ml-distance/lib/distances/jeffreys.js
var require_jeffreys = __commonJS({
  "node_modules/ml-distance/lib/distances/jeffreys.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function jeffreys(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += (a[i] - b[i]) * Math.log(a[i] / b[i]);
      }
      return ans;
    }
    exports.default = jeffreys;
  }
});

// node_modules/ml-distance/lib/distances/jensenDifference.js
var require_jensenDifference = __commonJS({
  "node_modules/ml-distance/lib/distances/jensenDifference.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function jensenDifference(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += (a[i] * Math.log(a[i]) + b[i] * Math.log(b[i])) / 2 - (a[i] + b[i]) / 2 * Math.log((a[i] + b[i]) / 2);
      }
      return ans;
    }
    exports.default = jensenDifference;
  }
});

// node_modules/ml-distance/lib/distances/jensenShannon.js
var require_jensenShannon = __commonJS({
  "node_modules/ml-distance/lib/distances/jensenShannon.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function jensenShannon(a, b) {
      let p = 0;
      let q = 0;
      for (let i = 0; i < a.length; i++) {
        p += a[i] * Math.log(2 * a[i] / (a[i] + b[i]));
        q += b[i] * Math.log(2 * b[i] / (a[i] + b[i]));
      }
      return (p + q) / 2;
    }
    exports.default = jensenShannon;
  }
});

// node_modules/ml-distance/lib/distances/kdivergence.js
var require_kdivergence = __commonJS({
  "node_modules/ml-distance/lib/distances/kdivergence.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function kdivergence(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += a[i] * Math.log(2 * a[i] / (a[i] + b[i]));
      }
      return ans;
    }
    exports.default = kdivergence;
  }
});

// node_modules/ml-distance/lib/distances/kulczynski.js
var require_kulczynski = __commonJS({
  "node_modules/ml-distance/lib/distances/kulczynski.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function kulczynski(a, b) {
      let up = 0;
      let down = 0;
      for (let i = 0; i < a.length; i++) {
        up += Math.abs(a[i] - b[i]);
        down += Math.min(a[i], b[i]);
      }
      return up / down;
    }
    exports.default = kulczynski;
  }
});

// node_modules/ml-distance/lib/distances/kullbackLeibler.js
var require_kullbackLeibler = __commonJS({
  "node_modules/ml-distance/lib/distances/kullbackLeibler.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function kullbackLeibler(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += a[i] * Math.log(a[i] / b[i]);
      }
      return ans;
    }
    exports.default = kullbackLeibler;
  }
});

// node_modules/ml-distance/lib/distances/kumarJohnson.js
var require_kumarJohnson = __commonJS({
  "node_modules/ml-distance/lib/distances/kumarJohnson.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function kumarJohnson(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += (a[i] * a[i] - b[i] * b[i]) ** 2 / (2 * (a[i] * b[i]) ** 1.5);
      }
      return ans;
    }
    exports.default = kumarJohnson;
  }
});

// node_modules/ml-distance/lib/distances/lorentzian.js
var require_lorentzian = __commonJS({
  "node_modules/ml-distance/lib/distances/lorentzian.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function lorentzian(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += Math.log(Math.abs(a[i] - b[i]) + 1);
      }
      return ans;
    }
    exports.default = lorentzian;
  }
});

// node_modules/ml-distance/lib/distances/manhattan.js
var require_manhattan = __commonJS({
  "node_modules/ml-distance/lib/distances/manhattan.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function manhattan(a, b) {
      let d = 0;
      for (let i = 0; i < a.length; i++) {
        d += Math.abs(a[i] - b[i]);
      }
      return d;
    }
    exports.default = manhattan;
  }
});

// node_modules/ml-distance/lib/distances/matusita.js
var require_matusita = __commonJS({
  "node_modules/ml-distance/lib/distances/matusita.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function matusita(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += Math.sqrt(a[i] * b[i]);
      }
      return Math.sqrt(2 - 2 * ans);
    }
    exports.default = matusita;
  }
});

// node_modules/ml-distance/lib/distances/minkowski.js
var require_minkowski = __commonJS({
  "node_modules/ml-distance/lib/distances/minkowski.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function minkowski(a, b, p) {
      let d = 0;
      for (let i = 0; i < a.length; i++) {
        d += Math.abs(a[i] - b[i]) ** p;
      }
      return d ** (1 / p);
    }
    exports.default = minkowski;
  }
});

// node_modules/ml-distance/lib/distances/motyka.js
var require_motyka = __commonJS({
  "node_modules/ml-distance/lib/distances/motyka.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function motyka(a, b) {
      let up = 0;
      let down = 0;
      for (let i = 0; i < a.length; i++) {
        up += Math.min(a[i], b[i]);
        down += a[i] + b[i];
      }
      return 1 - up / down;
    }
    exports.default = motyka;
  }
});

// node_modules/ml-distance/lib/distances/neyman.js
var require_neyman = __commonJS({
  "node_modules/ml-distance/lib/distances/neyman.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function neyman(a, b) {
      let d = 0;
      for (let i = 0; i < a.length; i++) {
        d += (a[i] - b[i]) * (a[i] - b[i]) / a[i];
      }
      return d;
    }
    exports.default = neyman;
  }
});

// node_modules/ml-distance/lib/distances/pearson.js
var require_pearson = __commonJS({
  "node_modules/ml-distance/lib/distances/pearson.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function pearson(a, b) {
      let d = 0;
      for (let i = 0; i < a.length; i++) {
        d += (a[i] - b[i]) * (a[i] - b[i]) / b[i];
      }
      return d;
    }
    exports.default = pearson;
  }
});

// node_modules/ml-distance/lib/distances/probabilisticSymmetric.js
var require_probabilisticSymmetric = __commonJS({
  "node_modules/ml-distance/lib/distances/probabilisticSymmetric.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function probabilisticSymmetric(a, b) {
      let d = 0;
      for (let i = 0; i < a.length; i++) {
        d += (a[i] - b[i]) * (a[i] - b[i]) / (a[i] + b[i]);
      }
      return 2 * d;
    }
    exports.default = probabilisticSymmetric;
  }
});

// node_modules/ml-distance/lib/distances/ruzicka.js
var require_ruzicka = __commonJS({
  "node_modules/ml-distance/lib/distances/ruzicka.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ruzicka(a, b) {
      let up = 0;
      let down = 0;
      for (let i = 0; i < a.length; i++) {
        up += Math.min(a[i], b[i]);
        down += Math.max(a[i], b[i]);
      }
      return up / down;
    }
    exports.default = ruzicka;
  }
});

// node_modules/ml-distance/lib/distances/soergel.js
var require_soergel = __commonJS({
  "node_modules/ml-distance/lib/distances/soergel.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function soergel(a, b) {
      let up = 0;
      let down = 0;
      for (let i = 0; i < a.length; i++) {
        up += Math.abs(a[i] - b[i]);
        down += Math.max(a[i], b[i]);
      }
      return up / down;
    }
    exports.default = soergel;
  }
});

// node_modules/ml-distance/lib/distances/sorensen.js
var require_sorensen = __commonJS({
  "node_modules/ml-distance/lib/distances/sorensen.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function sorensen(a, b) {
      let up = 0;
      let down = 0;
      for (let i = 0; i < a.length; i++) {
        up += Math.abs(a[i] - b[i]);
        down += a[i] + b[i];
      }
      return up / down;
    }
    exports.default = sorensen;
  }
});

// node_modules/ml-distance/lib/distances/squared.js
var require_squared = __commonJS({
  "node_modules/ml-distance/lib/distances/squared.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function squared(a, b) {
      let d = 0;
      for (let i = 0; i < a.length; i++) {
        d += (a[i] - b[i]) * (a[i] - b[i]) / (a[i] + b[i]);
      }
      return d;
    }
    exports.default = squared;
  }
});

// node_modules/ml-distance/lib/distances/squaredChord.js
var require_squaredChord = __commonJS({
  "node_modules/ml-distance/lib/distances/squaredChord.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function squaredChord(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += (Math.sqrt(a[i]) - Math.sqrt(b[i])) ** 2;
      }
      return ans;
    }
    exports.default = squaredChord;
  }
});

// node_modules/ml-distance/lib/distances/taneja.js
var require_taneja = __commonJS({
  "node_modules/ml-distance/lib/distances/taneja.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function taneja(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += (a[i] + b[i]) / 2 * Math.log((a[i] + b[i]) / (2 * Math.sqrt(a[i] * b[i])));
      }
      return ans;
    }
    exports.default = taneja;
  }
});

// node_modules/ml-distance/lib/similarities/tanimoto.js
var require_tanimoto = __commonJS({
  "node_modules/ml-distance/lib/similarities/tanimoto.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function tanimoto(a, b, bitvector) {
      if (bitvector) {
        let inter = 0;
        let union = 0;
        for (let j = 0; j < a.length; j++) {
          inter += a[j] && b[j];
          union += a[j] || b[j];
        }
        if (union === 0) {
          return 1;
        }
        return inter / union;
      } else {
        let p = 0;
        let q = 0;
        let m = 0;
        for (let i = 0; i < a.length; i++) {
          p += a[i];
          q += b[i];
          m += Math.min(a[i], b[i]);
        }
        return 1 - (p + q - 2 * m) / (p + q - m);
      }
    }
    exports.default = tanimoto;
  }
});

// node_modules/ml-distance/lib/distances/tanimoto.js
var require_tanimoto2 = __commonJS({
  "node_modules/ml-distance/lib/distances/tanimoto.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var tanimoto_1 = __importDefault(require_tanimoto());
    function tanimoto(a, b, bitvector) {
      if (bitvector) {
        return 1 - (0, tanimoto_1.default)(a, b, bitvector);
      } else {
        let p = 0;
        let q = 0;
        let m = 0;
        for (let i = 0; i < a.length; i++) {
          p += a[i];
          q += b[i];
          m += Math.min(a[i], b[i]);
        }
        return (p + q - 2 * m) / (p + q - m);
      }
    }
    exports.default = tanimoto;
  }
});

// node_modules/ml-distance/lib/distances/topsoe.js
var require_topsoe = __commonJS({
  "node_modules/ml-distance/lib/distances/topsoe.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function topsoe(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += a[i] * Math.log(2 * a[i] / (a[i] + b[i])) + b[i] * Math.log(2 * b[i] / (a[i] + b[i]));
      }
      return ans;
    }
    exports.default = topsoe;
  }
});

// node_modules/ml-distance/lib/distances/waveHedges.js
var require_waveHedges = __commonJS({
  "node_modules/ml-distance/lib/distances/waveHedges.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function waveHedges(a, b) {
      let ans = 0;
      for (let i = 0; i < a.length; i++) {
        ans += 1 - Math.min(a[i], b[i]) / Math.max(a[i], b[i]);
      }
      return ans;
    }
    exports.default = waveHedges;
  }
});

// node_modules/ml-distance/lib/distances.js
var require_distances = __commonJS({
  "node_modules/ml-distance/lib/distances.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.waveHedges = exports.topsoe = exports.tanimoto = exports.taneja = exports.squaredChord = exports.squared = exports.sorensen = exports.soergel = exports.ruzicka = exports.probabilisticSymmetric = exports.pearson = exports.neyman = exports.motyka = exports.minkowski = exports.matusita = exports.manhattan = exports.lorentzian = exports.kumarJohnson = exports.kullbackLeibler = exports.kulczynski = exports.kdivergence = exports.jensenShannon = exports.jensenDifference = exports.jeffreys = exports.jaccard = exports.intersection = exports.innerProduct = exports.hellinger = exports.harmonicMean = exports.gower = exports.fidelity = exports.divergence = exports.dice = exports.czekanowski = exports.clark = exports.chebyshev = exports.canberra = exports.bhattacharyya = exports.avg = exports.additiveSymmetric = exports.squaredEuclidean = exports.euclidean = void 0;
    var ml_distance_euclidean_1 = require_euclidean();
    Object.defineProperty(exports, "euclidean", { enumerable: true, get: function() {
      return ml_distance_euclidean_1.euclidean;
    } });
    Object.defineProperty(exports, "squaredEuclidean", { enumerable: true, get: function() {
      return ml_distance_euclidean_1.squaredEuclidean;
    } });
    var additiveSymmetric_1 = require_additiveSymmetric();
    Object.defineProperty(exports, "additiveSymmetric", { enumerable: true, get: function() {
      return __importDefault(additiveSymmetric_1).default;
    } });
    var avg_1 = require_avg();
    Object.defineProperty(exports, "avg", { enumerable: true, get: function() {
      return __importDefault(avg_1).default;
    } });
    var bhattacharyya_1 = require_bhattacharyya();
    Object.defineProperty(exports, "bhattacharyya", { enumerable: true, get: function() {
      return __importDefault(bhattacharyya_1).default;
    } });
    var canberra_1 = require_canberra();
    Object.defineProperty(exports, "canberra", { enumerable: true, get: function() {
      return __importDefault(canberra_1).default;
    } });
    var chebyshev_1 = require_chebyshev();
    Object.defineProperty(exports, "chebyshev", { enumerable: true, get: function() {
      return __importDefault(chebyshev_1).default;
    } });
    var clark_1 = require_clark();
    Object.defineProperty(exports, "clark", { enumerable: true, get: function() {
      return __importDefault(clark_1).default;
    } });
    var czekanowski_1 = require_czekanowski2();
    Object.defineProperty(exports, "czekanowski", { enumerable: true, get: function() {
      return __importDefault(czekanowski_1).default;
    } });
    var dice_1 = require_dice();
    Object.defineProperty(exports, "dice", { enumerable: true, get: function() {
      return __importDefault(dice_1).default;
    } });
    var divergence_1 = require_divergence();
    Object.defineProperty(exports, "divergence", { enumerable: true, get: function() {
      return __importDefault(divergence_1).default;
    } });
    var fidelity_1 = require_fidelity();
    Object.defineProperty(exports, "fidelity", { enumerable: true, get: function() {
      return __importDefault(fidelity_1).default;
    } });
    var gower_1 = require_gower();
    Object.defineProperty(exports, "gower", { enumerable: true, get: function() {
      return __importDefault(gower_1).default;
    } });
    var harmonicMean_1 = require_harmonicMean();
    Object.defineProperty(exports, "harmonicMean", { enumerable: true, get: function() {
      return __importDefault(harmonicMean_1).default;
    } });
    var hellinger_1 = require_hellinger();
    Object.defineProperty(exports, "hellinger", { enumerable: true, get: function() {
      return __importDefault(hellinger_1).default;
    } });
    var innerProduct_1 = require_innerProduct();
    Object.defineProperty(exports, "innerProduct", { enumerable: true, get: function() {
      return __importDefault(innerProduct_1).default;
    } });
    var intersection_1 = require_intersection();
    Object.defineProperty(exports, "intersection", { enumerable: true, get: function() {
      return __importDefault(intersection_1).default;
    } });
    var jaccard_1 = require_jaccard();
    Object.defineProperty(exports, "jaccard", { enumerable: true, get: function() {
      return __importDefault(jaccard_1).default;
    } });
    var jeffreys_1 = require_jeffreys();
    Object.defineProperty(exports, "jeffreys", { enumerable: true, get: function() {
      return __importDefault(jeffreys_1).default;
    } });
    var jensenDifference_1 = require_jensenDifference();
    Object.defineProperty(exports, "jensenDifference", { enumerable: true, get: function() {
      return __importDefault(jensenDifference_1).default;
    } });
    var jensenShannon_1 = require_jensenShannon();
    Object.defineProperty(exports, "jensenShannon", { enumerable: true, get: function() {
      return __importDefault(jensenShannon_1).default;
    } });
    var kdivergence_1 = require_kdivergence();
    Object.defineProperty(exports, "kdivergence", { enumerable: true, get: function() {
      return __importDefault(kdivergence_1).default;
    } });
    var kulczynski_1 = require_kulczynski();
    Object.defineProperty(exports, "kulczynski", { enumerable: true, get: function() {
      return __importDefault(kulczynski_1).default;
    } });
    var kullbackLeibler_1 = require_kullbackLeibler();
    Object.defineProperty(exports, "kullbackLeibler", { enumerable: true, get: function() {
      return __importDefault(kullbackLeibler_1).default;
    } });
    var kumarJohnson_1 = require_kumarJohnson();
    Object.defineProperty(exports, "kumarJohnson", { enumerable: true, get: function() {
      return __importDefault(kumarJohnson_1).default;
    } });
    var lorentzian_1 = require_lorentzian();
    Object.defineProperty(exports, "lorentzian", { enumerable: true, get: function() {
      return __importDefault(lorentzian_1).default;
    } });
    var manhattan_1 = require_manhattan();
    Object.defineProperty(exports, "manhattan", { enumerable: true, get: function() {
      return __importDefault(manhattan_1).default;
    } });
    var matusita_1 = require_matusita();
    Object.defineProperty(exports, "matusita", { enumerable: true, get: function() {
      return __importDefault(matusita_1).default;
    } });
    var minkowski_1 = require_minkowski();
    Object.defineProperty(exports, "minkowski", { enumerable: true, get: function() {
      return __importDefault(minkowski_1).default;
    } });
    var motyka_1 = require_motyka();
    Object.defineProperty(exports, "motyka", { enumerable: true, get: function() {
      return __importDefault(motyka_1).default;
    } });
    var neyman_1 = require_neyman();
    Object.defineProperty(exports, "neyman", { enumerable: true, get: function() {
      return __importDefault(neyman_1).default;
    } });
    var pearson_1 = require_pearson();
    Object.defineProperty(exports, "pearson", { enumerable: true, get: function() {
      return __importDefault(pearson_1).default;
    } });
    var probabilisticSymmetric_1 = require_probabilisticSymmetric();
    Object.defineProperty(exports, "probabilisticSymmetric", { enumerable: true, get: function() {
      return __importDefault(probabilisticSymmetric_1).default;
    } });
    var ruzicka_1 = require_ruzicka();
    Object.defineProperty(exports, "ruzicka", { enumerable: true, get: function() {
      return __importDefault(ruzicka_1).default;
    } });
    var soergel_1 = require_soergel();
    Object.defineProperty(exports, "soergel", { enumerable: true, get: function() {
      return __importDefault(soergel_1).default;
    } });
    var sorensen_1 = require_sorensen();
    Object.defineProperty(exports, "sorensen", { enumerable: true, get: function() {
      return __importDefault(sorensen_1).default;
    } });
    var squared_1 = require_squared();
    Object.defineProperty(exports, "squared", { enumerable: true, get: function() {
      return __importDefault(squared_1).default;
    } });
    var squaredChord_1 = require_squaredChord();
    Object.defineProperty(exports, "squaredChord", { enumerable: true, get: function() {
      return __importDefault(squaredChord_1).default;
    } });
    var taneja_1 = require_taneja();
    Object.defineProperty(exports, "taneja", { enumerable: true, get: function() {
      return __importDefault(taneja_1).default;
    } });
    var tanimoto_1 = require_tanimoto2();
    Object.defineProperty(exports, "tanimoto", { enumerable: true, get: function() {
      return __importDefault(tanimoto_1).default;
    } });
    var topsoe_1 = require_topsoe();
    Object.defineProperty(exports, "topsoe", { enumerable: true, get: function() {
      return __importDefault(topsoe_1).default;
    } });
    var waveHedges_1 = require_waveHedges();
    Object.defineProperty(exports, "waveHedges", { enumerable: true, get: function() {
      return __importDefault(waveHedges_1).default;
    } });
  }
});

// node_modules/binary-search/index.js
var require_binary_search = __commonJS({
  "node_modules/binary-search/index.js"(exports, module) {
    module.exports = function(haystack, needle, comparator, low, high) {
      var mid, cmp;
      if (low === void 0)
        low = 0;
      else {
        low = low | 0;
        if (low < 0 || low >= haystack.length)
          throw new RangeError("invalid lower bound");
      }
      if (high === void 0)
        high = haystack.length - 1;
      else {
        high = high | 0;
        if (high < low || high >= haystack.length)
          throw new RangeError("invalid upper bound");
      }
      while (low <= high) {
        mid = low + (high - low >>> 1);
        cmp = +comparator(haystack[mid], needle, mid, haystack);
        if (cmp < 0)
          low = mid + 1;
        else if (cmp > 0)
          high = mid - 1;
        else
          return mid;
      }
      return ~low;
    };
  }
});

// node_modules/num-sort/index.js
var require_num_sort = __commonJS({
  "node_modules/num-sort/index.js"(exports) {
    "use strict";
    function assertNumber(number) {
      if (typeof number !== "number") {
        throw new TypeError("Expected a number");
      }
    }
    exports.ascending = (left, right) => {
      assertNumber(left);
      assertNumber(right);
      if (Number.isNaN(left)) {
        return -1;
      }
      if (Number.isNaN(right)) {
        return 1;
      }
      return left - right;
    };
    exports.descending = (left, right) => {
      assertNumber(left);
      assertNumber(right);
      if (Number.isNaN(left)) {
        return 1;
      }
      if (Number.isNaN(right)) {
        return -1;
      }
      return right - left;
    };
  }
});

// node_modules/ml-tree-similarity/lib/index.js
var require_lib = __commonJS({
  "node_modules/ml-tree-similarity/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function _interopDefault(ex) {
      return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
    }
    var binarySearch = _interopDefault(require_binary_search());
    var numSort = require_num_sort();
    function createTree(spectrum, options = {}) {
      var X = spectrum[0];
      const {
        minWindow = 0.16,
        threshold = 0.01,
        from = X[0],
        to = X[X.length - 1]
      } = options;
      return mainCreateTree(
        spectrum[0],
        spectrum[1],
        from,
        to,
        minWindow,
        threshold
      );
    }
    function mainCreateTree(X, Y, from, to, minWindow, threshold) {
      if (to - from < minWindow) {
        return null;
      }
      var start = binarySearch(X, from, numSort.ascending);
      if (start < 0) {
        start = ~start;
      }
      var sum = 0;
      var center = 0;
      for (var i = start; i < X.length; i++) {
        if (X[i] >= to) {
          break;
        }
        sum += Y[i];
        center += X[i] * Y[i];
      }
      if (sum < threshold) {
        return null;
      }
      center /= sum;
      if (center - from < 1e-6 || to - center < 1e-6) {
        return null;
      }
      if (center - from < minWindow / 4) {
        return mainCreateTree(X, Y, center, to, minWindow, threshold);
      } else {
        if (to - center < minWindow / 4) {
          return mainCreateTree(X, Y, from, center, minWindow, threshold);
        } else {
          return new Tree(
            sum,
            center,
            mainCreateTree(X, Y, from, center, minWindow, threshold),
            mainCreateTree(X, Y, center, to, minWindow, threshold)
          );
        }
      }
    }
    var Tree = class {
      constructor(sum, center, left, right) {
        this.sum = sum;
        this.center = center;
        this.left = left;
        this.right = right;
      }
    };
    function getSimilarity(a, b, options = {}) {
      const { alpha = 0.1, beta = 0.33, gamma = 1e-3 } = options;
      if (a === null || b === null) {
        return 0;
      }
      if (Array.isArray(a)) {
        a = createTree(a);
      }
      if (Array.isArray(b)) {
        b = createTree(b);
      }
      var C = alpha * Math.min(a.sum, b.sum) / Math.max(a.sum, b.sum) + (1 - alpha) * Math.exp(-gamma * Math.abs(a.center - b.center));
      return beta * C + (1 - beta) * (getSimilarity(a.left, b.left, options) + getSimilarity(a.right, b.right, options)) / 2;
    }
    function treeSimilarity(A, B, options = {}) {
      return getSimilarity(A, B, options);
    }
    function getFunction(options = {}) {
      return (A, B) => getSimilarity(A, B, options);
    }
    exports.createTree = createTree;
    exports.getFunction = getFunction;
    exports.treeSimilarity = treeSimilarity;
  }
});

// node_modules/ml-distance/lib/similarities/cosine.js
var require_cosine = __commonJS({
  "node_modules/ml-distance/lib/similarities/cosine.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function cosine(a, b) {
      let p = 0;
      let p2 = 0;
      let q2 = 0;
      for (let i = 0; i < a.length; i++) {
        p += a[i] * b[i];
        p2 += a[i] * a[i];
        q2 += b[i] * b[i];
      }
      return p / (Math.sqrt(p2) * Math.sqrt(q2));
    }
    exports.default = cosine;
  }
});

// node_modules/ml-distance/lib/similarities/dice.js
var require_dice2 = __commonJS({
  "node_modules/ml-distance/lib/similarities/dice.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var dice_1 = __importDefault(require_dice());
    function dice(a, b) {
      return 1 - (0, dice_1.default)(a, b);
    }
    exports.default = dice;
  }
});

// node_modules/ml-distance/lib/similarities/intersection.js
var require_intersection2 = __commonJS({
  "node_modules/ml-distance/lib/similarities/intersection.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var intersection_1 = __importDefault(require_intersection());
    function intersection(a, b) {
      return 1 - (0, intersection_1.default)(a, b);
    }
    exports.default = intersection;
  }
});

// node_modules/ml-distance/lib/similarities/kulczynski.js
var require_kulczynski2 = __commonJS({
  "node_modules/ml-distance/lib/similarities/kulczynski.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var kulczynski_1 = __importDefault(require_kulczynski());
    function kulczynski(a, b) {
      return 1 / (0, kulczynski_1.default)(a, b);
    }
    exports.default = kulczynski;
  }
});

// node_modules/ml-distance/lib/similarities/motyka.js
var require_motyka2 = __commonJS({
  "node_modules/ml-distance/lib/similarities/motyka.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var motyka_1 = __importDefault(require_motyka());
    function motyka(a, b) {
      return 1 - (0, motyka_1.default)(a, b);
    }
    exports.default = motyka;
  }
});

// node_modules/is-any-array/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/is-any-array/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isAnyArray = void 0;
    var toString = Object.prototype.toString;
    function isAnyArray(value) {
      const tag = toString.call(value);
      return tag.endsWith("Array]") && !tag.includes("Big");
    }
    exports.isAnyArray = isAnyArray;
  }
});

// node_modules/ml-array-sum/lib/index.js
var require_lib3 = __commonJS({
  "node_modules/ml-array-sum/lib/index.js"(exports, module) {
    "use strict";
    var isAnyArray = require_lib2();
    function sum(input) {
      if (!isAnyArray.isAnyArray(input)) {
        throw new TypeError("input must be an array");
      }
      if (input.length === 0) {
        throw new TypeError("input must not be empty");
      }
      let sumValue = 0;
      for (let i = 0; i < input.length; i++) {
        sumValue += input[i];
      }
      return sumValue;
    }
    module.exports = sum;
  }
});

// node_modules/ml-array-mean/lib/index.js
var require_lib4 = __commonJS({
  "node_modules/ml-array-mean/lib/index.js"(exports, module) {
    "use strict";
    var sum = require_lib3();
    function _interopDefaultLegacy(e) {
      return e && typeof e === "object" && "default" in e ? e : { "default": e };
    }
    var sum__default = /* @__PURE__ */ _interopDefaultLegacy(sum);
    function mean(input) {
      return sum__default["default"](input) / input.length;
    }
    module.exports = mean;
  }
});

// node_modules/ml-distance/lib/similarities/pearson.js
var require_pearson2 = __commonJS({
  "node_modules/ml-distance/lib/similarities/pearson.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var ml_array_mean_1 = __importDefault(require_lib4());
    var cosine_1 = __importDefault(require_cosine());
    function pearson(a, b) {
      let avgA = (0, ml_array_mean_1.default)(a);
      let avgB = (0, ml_array_mean_1.default)(b);
      let newA = new Array(a.length);
      let newB = new Array(b.length);
      for (let i = 0; i < newA.length; i++) {
        newA[i] = a[i] - avgA;
        newB[i] = b[i] - avgB;
      }
      return (0, cosine_1.default)(newA, newB);
    }
    exports.default = pearson;
  }
});

// node_modules/ml-distance/lib/similarities/squaredChord.js
var require_squaredChord2 = __commonJS({
  "node_modules/ml-distance/lib/similarities/squaredChord.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var squaredChord_1 = __importDefault(require_squaredChord());
    function squaredChord(a, b) {
      return 1 - (0, squaredChord_1.default)(a, b);
    }
    exports.default = squaredChord;
  }
});

// node_modules/ml-distance/lib/similarities.js
var require_similarities = __commonJS({
  "node_modules/ml-distance/lib/similarities.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.kumarHassebrook = exports.tanimoto = exports.squaredChord = exports.pearson = exports.motyka = exports.kulczynski = exports.intersection = exports.dice = exports.czekanowski = exports.cosine = exports.tree = void 0;
    var tree = __importStar(require_lib());
    exports.tree = tree;
    var cosine_1 = require_cosine();
    Object.defineProperty(exports, "cosine", { enumerable: true, get: function() {
      return __importDefault(cosine_1).default;
    } });
    var czekanowski_1 = require_czekanowski();
    Object.defineProperty(exports, "czekanowski", { enumerable: true, get: function() {
      return __importDefault(czekanowski_1).default;
    } });
    var dice_1 = require_dice2();
    Object.defineProperty(exports, "dice", { enumerable: true, get: function() {
      return __importDefault(dice_1).default;
    } });
    var intersection_1 = require_intersection2();
    Object.defineProperty(exports, "intersection", { enumerable: true, get: function() {
      return __importDefault(intersection_1).default;
    } });
    var kulczynski_1 = require_kulczynski2();
    Object.defineProperty(exports, "kulczynski", { enumerable: true, get: function() {
      return __importDefault(kulczynski_1).default;
    } });
    var motyka_1 = require_motyka2();
    Object.defineProperty(exports, "motyka", { enumerable: true, get: function() {
      return __importDefault(motyka_1).default;
    } });
    var pearson_1 = require_pearson2();
    Object.defineProperty(exports, "pearson", { enumerable: true, get: function() {
      return __importDefault(pearson_1).default;
    } });
    var squaredChord_1 = require_squaredChord2();
    Object.defineProperty(exports, "squaredChord", { enumerable: true, get: function() {
      return __importDefault(squaredChord_1).default;
    } });
    var tanimoto_1 = require_tanimoto();
    Object.defineProperty(exports, "tanimoto", { enumerable: true, get: function() {
      return __importDefault(tanimoto_1).default;
    } });
    var kumarHassebrook_1 = require_kumarHassebrook();
    Object.defineProperty(exports, "kumarHassebrook", { enumerable: true, get: function() {
      return __importDefault(kumarHassebrook_1).default;
    } });
  }
});

// node_modules/ml-distance/lib/index.js
var require_lib5 = __commonJS({
  "node_modules/ml-distance/lib/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.similarity = exports.distance = void 0;
    var distance = __importStar(require_distances());
    exports.distance = distance;
    var similarity = __importStar(require_similarities());
    exports.similarity = similarity;
  }
});

// component_IndexDocuments.js
import { createComponent, countTokens as countTokensFunction, downloadTextsFromCdn } from "../../../src/utils/omni-utils.js";

// omnilib-docs/hashers.js
import { console_log, is_valid } from "../../../src/utils/omni-utils.js";

// omnilib-docs/hasher.js
var Hasher = class {
  hash(text) {
    throw new Error("You have to implement the method hash!");
  }
};

// omnilib-docs/hasher_SHA256.js
import { createHash } from "crypto";
var Hasher_SHA256 = class extends Hasher {
  constructor() {
    super();
  }
  hash(text) {
    if (typeof text === "string") {
      const hasher = createHash("sha256");
      hasher.update(text);
      return hasher.digest("hex");
    }
    throw new Error("hash() only accepts a string as input");
  }
  hash_list(texts) {
    if (typeof texts === "string") {
      return this.hash(texts);
    }
    if (Array.isArray(texts)) {
      let sum_of_hashes = "";
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        sum_of_hashes += this.hash(text);
      }
      return this.hash(sum_of_hashes);
    }
    throw new Error("hash_list only accepts a string and a list of strings as input");
  }
};

// omnilib-docs/hashers.js
var HASHER_MODEL_SHA256 = "SHA256";
var DEFAULT_HASHER_MODEL = HASHER_MODEL_SHA256;
function computeChunkId(ctx, text, hasher) {
  const user = ctx.userId;
  const hash = hasher.hash(text);
  const chunk_id = `chunk_${user}_${hash}`;
  console_log(`Computed chunk_id : ${chunk_id} for text length: ${text.length}, hash: ${hash}, user = ${user}, start = ${text.slice(0, 256)}, end = ${text.slice(-256)}`);
  return chunk_id;
}
function computeDocumentId(ctx, texts, hasher, chunk_size, chunk_overlap) {
  if (is_valid(texts) == false)
    throw new Error(`ERROR: texts is invalid`);
  const user = ctx.userId;
  const document_hash = hasher.hash_list(texts);
  const document_id = `doc_${user}_${document_hash}_${chunk_size}_${chunk_overlap}`;
  return document_id;
}
function initialize_hasher(hasher_model = DEFAULT_HASHER_MODEL) {
  let hasher = null;
  if (hasher_model == HASHER_MODEL_SHA256)
    hasher = new Hasher_SHA256();
  else {
    throw new Error(`initialize_hasher: Unknown hasher model: ${hasher_model}`);
  }
  try {
    const validate_text = "this and that";
    const validate_hash1 = hasher.hash(validate_text);
    const validate_hash2 = hasher.hash(validate_text);
    if (validate_hash1 != validate_hash2)
      throw new Error(`hasher: ${hasher_model} is not stable`);
  } catch (e) {
    throw new Error(`get_hasher: Failed to initialize hasher_model ${hasher_model} with error: ${e}`);
  }
  return hasher;
}

// node_modules/langchain/dist/document.js
var Document = class {
  constructor(fields) {
    Object.defineProperty(this, "pageContent", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "metadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.pageContent = fields.pageContent ? fields.pageContent.toString() : this.pageContent;
    this.metadata = fields.metadata ?? {};
  }
};

// node_modules/js-tiktoken/dist/chunk-XXPGZHWZ.js
var __defProp2 = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// node_modules/js-tiktoken/dist/chunk-THGZSONF.js
var import_base64_js = __toESM(require_base64_js(), 1);
function bytePairMerge(piece, ranks) {
  let parts = Array.from(
    { length: piece.length },
    (_, i) => ({ start: i, end: i + 1 })
  );
  while (parts.length > 1) {
    let minRank = null;
    for (let i = 0; i < parts.length - 1; i++) {
      const slice = piece.slice(parts[i].start, parts[i + 1].end);
      const rank = ranks.get(slice.join(","));
      if (rank == null)
        continue;
      if (minRank == null || rank < minRank[0]) {
        minRank = [rank, i];
      }
    }
    if (minRank != null) {
      const i = minRank[1];
      parts[i] = { start: parts[i].start, end: parts[i + 1].end };
      parts.splice(i + 1, 1);
    } else {
      break;
    }
  }
  return parts;
}
function bytePairEncode(piece, ranks) {
  if (piece.length === 1)
    return [ranks.get(piece.join(","))];
  return bytePairMerge(piece, ranks).map((p) => ranks.get(piece.slice(p.start, p.end).join(","))).filter((x) => x != null);
}
function escapeRegex(str) {
  return str.replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");
}
var _Tiktoken = class {
  /** @internal */
  specialTokens;
  /** @internal */
  inverseSpecialTokens;
  /** @internal */
  patStr;
  /** @internal */
  textEncoder = new TextEncoder();
  /** @internal */
  textDecoder = new TextDecoder("utf-8");
  /** @internal */
  rankMap = /* @__PURE__ */ new Map();
  /** @internal */
  textMap = /* @__PURE__ */ new Map();
  constructor(ranks, extendedSpecialTokens) {
    this.patStr = ranks.pat_str;
    const uncompressed = ranks.bpe_ranks.split("\n").filter(Boolean).reduce((memo, x) => {
      const [_, offsetStr, ...tokens] = x.split(" ");
      const offset = Number.parseInt(offsetStr, 10);
      tokens.forEach((token, i) => memo[token] = offset + i);
      return memo;
    }, {});
    for (const [token, rank] of Object.entries(uncompressed)) {
      const bytes = import_base64_js.default.toByteArray(token);
      this.rankMap.set(bytes.join(","), rank);
      this.textMap.set(rank, bytes);
    }
    this.specialTokens = { ...ranks.special_tokens, ...extendedSpecialTokens };
    this.inverseSpecialTokens = Object.entries(this.specialTokens).reduce((memo, [text, rank]) => {
      memo[rank] = this.textEncoder.encode(text);
      return memo;
    }, {});
  }
  encode(text, allowedSpecial = [], disallowedSpecial = "all") {
    const regexes = new RegExp(this.patStr, "ug");
    const specialRegex = _Tiktoken.specialTokenRegex(
      Object.keys(this.specialTokens)
    );
    const ret = [];
    const allowedSpecialSet = new Set(
      allowedSpecial === "all" ? Object.keys(this.specialTokens) : allowedSpecial
    );
    const disallowedSpecialSet = new Set(
      disallowedSpecial === "all" ? Object.keys(this.specialTokens).filter(
        (x) => !allowedSpecialSet.has(x)
      ) : disallowedSpecial
    );
    if (disallowedSpecialSet.size > 0) {
      const disallowedSpecialRegex = _Tiktoken.specialTokenRegex([
        ...disallowedSpecialSet
      ]);
      const specialMatch = text.match(disallowedSpecialRegex);
      if (specialMatch != null) {
        throw new Error(
          `The text contains a special token that is not allowed: ${specialMatch[0]}`
        );
      }
    }
    let start = 0;
    while (true) {
      let nextSpecial = null;
      let startFind = start;
      while (true) {
        specialRegex.lastIndex = startFind;
        nextSpecial = specialRegex.exec(text);
        if (nextSpecial == null || allowedSpecialSet.has(nextSpecial[0]))
          break;
        startFind = nextSpecial.index + 1;
      }
      const end = nextSpecial?.index ?? text.length;
      for (const match of text.substring(start, end).matchAll(regexes)) {
        const piece = this.textEncoder.encode(match[0]);
        const token2 = this.rankMap.get(piece.join(","));
        if (token2 != null) {
          ret.push(token2);
          continue;
        }
        ret.push(...bytePairEncode(piece, this.rankMap));
      }
      if (nextSpecial == null)
        break;
      let token = this.specialTokens[nextSpecial[0]];
      ret.push(token);
      start = nextSpecial.index + nextSpecial[0].length;
    }
    return ret;
  }
  decode(tokens) {
    const res = [];
    let length = 0;
    for (let i2 = 0; i2 < tokens.length; ++i2) {
      const token = tokens[i2];
      const bytes = this.textMap.get(token) ?? this.inverseSpecialTokens[token];
      if (bytes != null) {
        res.push(bytes);
        length += bytes.length;
      }
    }
    const mergedArray = new Uint8Array(length);
    let i = 0;
    for (const bytes of res) {
      mergedArray.set(bytes, i);
      i += bytes.length;
    }
    return this.textDecoder.decode(mergedArray);
  }
};
var Tiktoken = _Tiktoken;
__publicField(Tiktoken, "specialTokenRegex", (tokens) => {
  return new RegExp(tokens.map((i) => escapeRegex(i)).join("|"), "g");
});

// node_modules/langchain/dist/util/async_caller.js
var import_p_retry = __toESM(require_p_retry(), 1);
var import_p_queue = __toESM(require_dist(), 1);
var STATUS_NO_RETRY = [
  400,
  401,
  403,
  404,
  405,
  406,
  407,
  408,
  409
  // Conflict
];
var AsyncCaller = class {
  constructor(params) {
    Object.defineProperty(this, "maxConcurrency", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "maxRetries", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "queue", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.maxConcurrency = params.maxConcurrency ?? Infinity;
    this.maxRetries = params.maxRetries ?? 6;
    const PQueue = "default" in import_p_queue.default ? import_p_queue.default.default : import_p_queue.default;
    this.queue = new PQueue({ concurrency: this.maxConcurrency });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  call(callable, ...args) {
    return this.queue.add(() => (0, import_p_retry.default)(() => callable(...args).catch((error) => {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(error);
      }
    }), {
      onFailedAttempt(error) {
        if (error.message.startsWith("Cancel") || error.message.startsWith("TimeoutError") || error.message.startsWith("AbortError")) {
          throw error;
        }
        if (error?.code === "ECONNABORTED") {
          throw error;
        }
        const status = error?.response?.status;
        if (status && STATUS_NO_RETRY.includes(+status)) {
          throw error;
        }
        const data = error?.response?.data;
        if (data?.error?.code === "insufficient_quota") {
          const error2 = new Error(data?.error?.message);
          error2.name = "InsufficientQuotaError";
          throw error2;
        }
      },
      retries: this.maxRetries,
      randomize: true
      // If needed we can change some of the defaults here,
      // but they're quite sensible.
    }), { throwOnTimeout: true });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callWithOptions(options, callable, ...args) {
    if (options.signal) {
      return Promise.race([
        this.call(callable, ...args),
        new Promise((_, reject) => {
          options.signal?.addEventListener("abort", () => {
            reject(new Error("AbortError"));
          });
        })
      ]);
    }
    return this.call(callable, ...args);
  }
  fetch(...args) {
    return this.call(() => fetch(...args).then((res) => res.ok ? res : Promise.reject(res)));
  }
};

// node_modules/langchain/dist/util/tiktoken.js
var cache = {};
var caller = /* @__PURE__ */ new AsyncCaller({});
async function getEncoding(encoding, options) {
  if (!(encoding in cache)) {
    cache[encoding] = caller.fetch(`https://tiktoken.pages.dev/js/${encoding}.json`, {
      signal: options?.signal
    }).then((res) => res.json()).catch((e) => {
      delete cache[encoding];
      throw e;
    });
  }
  return new Tiktoken(await cache[encoding], options?.extendedSpecialTokens);
}

// node_modules/uuid/dist/esm-node/rng.js
import crypto from "crypto";
var rnds8Pool = new Uint8Array(256);
var poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    crypto.randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

// node_modules/uuid/dist/esm-node/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
}

// node_modules/uuid/dist/esm-node/native.js
import crypto2 from "crypto";
var native_default = {
  randomUUID: crypto2.randomUUID
};

// node_modules/uuid/dist/esm-node/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random || (options.rng || rng)();
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default = v4;

// node_modules/langchain/dist/load/map_keys.js
var import_decamelize = __toESM(require_decamelize(), 1);
var import_camelcase = __toESM(require_camelcase(), 1);
function keyToJson(key, map) {
  return map?.[key] || (0, import_decamelize.default)(key);
}
function mapKeys(fields, mapper, map) {
  const mapped = {};
  for (const key in fields) {
    if (Object.hasOwn(fields, key)) {
      mapped[mapper(key, map)] = fields[key];
    }
  }
  return mapped;
}

// node_modules/langchain/dist/load/serializable.js
function shallowCopy(obj) {
  return Array.isArray(obj) ? [...obj] : { ...obj };
}
function replaceSecrets(root, secretsMap) {
  const result = shallowCopy(root);
  for (const [path, secretId] of Object.entries(secretsMap)) {
    const [last, ...partsReverse] = path.split(".").reverse();
    let current = result;
    for (const part of partsReverse.reverse()) {
      if (current[part] === void 0) {
        break;
      }
      current[part] = shallowCopy(current[part]);
      current = current[part];
    }
    if (current[last] !== void 0) {
      current[last] = {
        lc: 1,
        type: "secret",
        id: [secretId]
      };
    }
  }
  return result;
}
function get_lc_unique_name(serializableClass) {
  const parentClass = Object.getPrototypeOf(serializableClass);
  const lcNameIsSubclassed = typeof serializableClass.lc_name === "function" && (typeof parentClass.lc_name !== "function" || serializableClass.lc_name() !== parentClass.lc_name());
  if (lcNameIsSubclassed) {
    return serializableClass.lc_name();
  } else {
    return serializableClass.name;
  }
}
var Serializable = class _Serializable {
  /**
   * The name of the serializable. Override to provide an alias or
   * to preserve the serialized module name in minified environments.
   *
   * Implemented as a static method to support loading logic.
   */
  static lc_name() {
    return this.name;
  }
  /**
   * The final serialized identifier for the module.
   */
  get lc_id() {
    return [
      ...this.lc_namespace,
      get_lc_unique_name(this.constructor)
    ];
  }
  /**
   * A map of secrets, which will be omitted from serialization.
   * Keys are paths to the secret in constructor args, e.g. "foo.bar.baz".
   * Values are the secret ids, which will be used when deserializing.
   */
  get lc_secrets() {
    return void 0;
  }
  /**
   * A map of additional attributes to merge with constructor args.
   * Keys are the attribute names, e.g. "foo".
   * Values are the attribute values, which will be serialized.
   * These attributes need to be accepted by the constructor as arguments.
   */
  get lc_attributes() {
    return void 0;
  }
  /**
   * A map of aliases for constructor args.
   * Keys are the attribute names, e.g. "foo".
   * Values are the alias that will replace the key in serialization.
   * This is used to eg. make argument names match Python.
   */
  get lc_aliases() {
    return void 0;
  }
  constructor(kwargs, ..._args) {
    Object.defineProperty(this, "lc_serializable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "lc_kwargs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.lc_kwargs = kwargs || {};
  }
  toJSON() {
    if (!this.lc_serializable) {
      return this.toJSONNotImplemented();
    }
    if (
      // eslint-disable-next-line no-instanceof/no-instanceof
      this.lc_kwargs instanceof _Serializable || typeof this.lc_kwargs !== "object" || Array.isArray(this.lc_kwargs)
    ) {
      return this.toJSONNotImplemented();
    }
    const aliases = {};
    const secrets = {};
    const kwargs = Object.keys(this.lc_kwargs).reduce((acc, key) => {
      acc[key] = key in this ? this[key] : this.lc_kwargs[key];
      return acc;
    }, {});
    for (let current = Object.getPrototypeOf(this); current; current = Object.getPrototypeOf(current)) {
      Object.assign(aliases, Reflect.get(current, "lc_aliases", this));
      Object.assign(secrets, Reflect.get(current, "lc_secrets", this));
      Object.assign(kwargs, Reflect.get(current, "lc_attributes", this));
    }
    for (const key in secrets) {
      if (key in this && this[key] !== void 0) {
        kwargs[key] = this[key] || kwargs[key];
      }
    }
    return {
      lc: 1,
      type: "constructor",
      id: this.lc_id,
      kwargs: mapKeys(Object.keys(secrets).length ? replaceSecrets(kwargs, secrets) : kwargs, keyToJson, aliases)
    };
  }
  toJSONNotImplemented() {
    return {
      lc: 1,
      type: "not_implemented",
      id: this.lc_id
    };
  }
};

// node_modules/langchain/dist/callbacks/base.js
var BaseCallbackHandlerMethodsClass = class {
};
var BaseCallbackHandler = class _BaseCallbackHandler extends BaseCallbackHandlerMethodsClass {
  get lc_namespace() {
    return ["langchain", "callbacks", this.name];
  }
  get lc_secrets() {
    return void 0;
  }
  get lc_attributes() {
    return void 0;
  }
  get lc_aliases() {
    return void 0;
  }
  /**
   * The name of the serializable. Override to provide an alias or
   * to preserve the serialized module name in minified environments.
   *
   * Implemented as a static method to support loading logic.
   */
  static lc_name() {
    return this.name;
  }
  /**
   * The final serialized identifier for the module.
   */
  get lc_id() {
    return [
      ...this.lc_namespace,
      get_lc_unique_name(this.constructor)
    ];
  }
  constructor(input) {
    super();
    Object.defineProperty(this, "lc_serializable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "lc_kwargs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "ignoreLLM", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "ignoreChain", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "ignoreAgent", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "ignoreRetriever", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "awaitHandlers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: typeof process !== "undefined" ? (
        // eslint-disable-next-line no-process-env
        process.env?.LANGCHAIN_CALLBACKS_BACKGROUND !== "true"
      ) : true
    });
    this.lc_kwargs = input || {};
    if (input) {
      this.ignoreLLM = input.ignoreLLM ?? this.ignoreLLM;
      this.ignoreChain = input.ignoreChain ?? this.ignoreChain;
      this.ignoreAgent = input.ignoreAgent ?? this.ignoreAgent;
      this.ignoreRetriever = input.ignoreRetriever ?? this.ignoreRetriever;
    }
  }
  copy() {
    return new this.constructor(this);
  }
  toJSON() {
    return Serializable.prototype.toJSON.call(this);
  }
  toJSONNotImplemented() {
    return Serializable.prototype.toJSONNotImplemented.call(this);
  }
  static fromMethods(methods) {
    class Handler extends _BaseCallbackHandler {
      constructor() {
        super();
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: v4_default()
        });
        Object.assign(this, methods);
      }
    }
    return new Handler();
  }
};

// node_modules/langchain/dist/callbacks/handlers/console.js
var import_ansi_styles = __toESM(require_ansi_styles(), 1);

// node_modules/langchain/dist/callbacks/handlers/tracer.js
function _coerceToDict(value, defaultKey) {
  return value && !Array.isArray(value) && typeof value === "object" ? value : { [defaultKey]: value };
}
var BaseTracer = class extends BaseCallbackHandler {
  constructor(_fields) {
    super(...arguments);
    Object.defineProperty(this, "runMap", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
  }
  copy() {
    return this;
  }
  _addChildRun(parentRun, childRun) {
    parentRun.child_runs.push(childRun);
  }
  _startTrace(run) {
    if (run.parent_run_id !== void 0) {
      const parentRun = this.runMap.get(run.parent_run_id);
      if (parentRun) {
        this._addChildRun(parentRun, run);
        parentRun.child_execution_order = Math.max(parentRun.child_execution_order, run.child_execution_order);
      }
    }
    this.runMap.set(run.id, run);
  }
  async _endTrace(run) {
    const parentRun = run.parent_run_id !== void 0 && this.runMap.get(run.parent_run_id);
    if (parentRun) {
      parentRun.child_execution_order = Math.max(parentRun.child_execution_order, run.child_execution_order);
    } else {
      await this.persistRun(run);
    }
    this.runMap.delete(run.id);
  }
  _getExecutionOrder(parentRunId) {
    const parentRun = parentRunId !== void 0 && this.runMap.get(parentRunId);
    if (!parentRun) {
      return 1;
    }
    return parentRun.child_execution_order + 1;
  }
  async handleLLMStart(llm, prompts, runId, parentRunId, extraParams, tags, metadata) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const finalExtraParams = metadata ? { ...extraParams, metadata } : extraParams;
    const run = {
      id: runId,
      name: llm.id[llm.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: llm,
      events: [
        {
          name: "start",
          time: new Date(start_time).toISOString()
        }
      ],
      inputs: { prompts },
      execution_order,
      child_runs: [],
      child_execution_order: execution_order,
      run_type: "llm",
      extra: finalExtraParams ?? {},
      tags: tags || []
    };
    this._startTrace(run);
    await this.onLLMStart?.(run);
  }
  async handleChatModelStart(llm, messages, runId, parentRunId, extraParams, tags, metadata) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const finalExtraParams = metadata ? { ...extraParams, metadata } : extraParams;
    const run = {
      id: runId,
      name: llm.id[llm.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: llm,
      events: [
        {
          name: "start",
          time: new Date(start_time).toISOString()
        }
      ],
      inputs: { messages },
      execution_order,
      child_runs: [],
      child_execution_order: execution_order,
      run_type: "llm",
      extra: finalExtraParams ?? {},
      tags: tags || []
    };
    this._startTrace(run);
    await this.onLLMStart?.(run);
  }
  async handleLLMEnd(output, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "llm") {
      throw new Error("No LLM run to end.");
    }
    run.end_time = Date.now();
    run.outputs = output;
    run.events.push({
      name: "end",
      time: new Date(run.end_time).toISOString()
    });
    await this.onLLMEnd?.(run);
    await this._endTrace(run);
  }
  async handleLLMError(error, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "llm") {
      throw new Error("No LLM run to end.");
    }
    run.end_time = Date.now();
    run.error = error.message;
    run.events.push({
      name: "error",
      time: new Date(run.end_time).toISOString()
    });
    await this.onLLMError?.(run);
    await this._endTrace(run);
  }
  async handleChainStart(chain, inputs3, runId, parentRunId, tags, metadata, runType) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const run = {
      id: runId,
      name: chain.id[chain.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: chain,
      events: [
        {
          name: "start",
          time: new Date(start_time).toISOString()
        }
      ],
      inputs: inputs3,
      execution_order,
      child_execution_order: execution_order,
      run_type: runType ?? "chain",
      child_runs: [],
      extra: metadata ? { metadata } : {},
      tags: tags || []
    };
    this._startTrace(run);
    await this.onChainStart?.(run);
  }
  async handleChainEnd(outputs3, runId, _parentRunId, _tags, kwargs) {
    const run = this.runMap.get(runId);
    if (!run) {
      throw new Error("No chain run to end.");
    }
    run.end_time = Date.now();
    run.outputs = _coerceToDict(outputs3, "output");
    run.events.push({
      name: "end",
      time: new Date(run.end_time).toISOString()
    });
    if (kwargs?.inputs !== void 0) {
      run.inputs = _coerceToDict(kwargs.inputs, "input");
    }
    await this.onChainEnd?.(run);
    await this._endTrace(run);
  }
  async handleChainError(error, runId, _parentRunId, _tags, kwargs) {
    const run = this.runMap.get(runId);
    if (!run) {
      throw new Error("No chain run to end.");
    }
    run.end_time = Date.now();
    run.error = error.message;
    run.events.push({
      name: "error",
      time: new Date(run.end_time).toISOString()
    });
    if (kwargs?.inputs !== void 0) {
      run.inputs = _coerceToDict(kwargs.inputs, "input");
    }
    await this.onChainError?.(run);
    await this._endTrace(run);
  }
  async handleToolStart(tool, input, runId, parentRunId, tags, metadata) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const run = {
      id: runId,
      name: tool.id[tool.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: tool,
      events: [
        {
          name: "start",
          time: new Date(start_time).toISOString()
        }
      ],
      inputs: { input },
      execution_order,
      child_execution_order: execution_order,
      run_type: "tool",
      child_runs: [],
      extra: metadata ? { metadata } : {},
      tags: tags || []
    };
    this._startTrace(run);
    await this.onToolStart?.(run);
  }
  async handleToolEnd(output, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "tool") {
      throw new Error("No tool run to end");
    }
    run.end_time = Date.now();
    run.outputs = { output };
    run.events.push({
      name: "end",
      time: new Date(run.end_time).toISOString()
    });
    await this.onToolEnd?.(run);
    await this._endTrace(run);
  }
  async handleToolError(error, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "tool") {
      throw new Error("No tool run to end");
    }
    run.end_time = Date.now();
    run.error = error.message;
    run.events.push({
      name: "error",
      time: new Date(run.end_time).toISOString()
    });
    await this.onToolError?.(run);
    await this._endTrace(run);
  }
  async handleAgentAction(action, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "chain") {
      return;
    }
    const agentRun = run;
    agentRun.actions = agentRun.actions || [];
    agentRun.actions.push(action);
    agentRun.events.push({
      name: "agent_action",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      kwargs: { action }
    });
    await this.onAgentAction?.(run);
  }
  async handleAgentEnd(action, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "chain") {
      return;
    }
    run.events.push({
      name: "agent_end",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      kwargs: { action }
    });
    await this.onAgentEnd?.(run);
  }
  async handleRetrieverStart(retriever, query, runId, parentRunId, tags, metadata) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const run = {
      id: runId,
      name: retriever.id[retriever.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: retriever,
      events: [
        {
          name: "start",
          time: new Date(start_time).toISOString()
        }
      ],
      inputs: { query },
      execution_order,
      child_execution_order: execution_order,
      run_type: "retriever",
      child_runs: [],
      extra: metadata ? { metadata } : {},
      tags: tags || []
    };
    this._startTrace(run);
    await this.onRetrieverStart?.(run);
  }
  async handleRetrieverEnd(documents, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "retriever") {
      throw new Error("No retriever run to end");
    }
    run.end_time = Date.now();
    run.outputs = { documents };
    run.events.push({
      name: "end",
      time: new Date(run.end_time).toISOString()
    });
    await this.onRetrieverEnd?.(run);
    await this._endTrace(run);
  }
  async handleRetrieverError(error, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "retriever") {
      throw new Error("No retriever run to end");
    }
    run.end_time = Date.now();
    run.error = error.message;
    run.events.push({
      name: "error",
      time: new Date(run.end_time).toISOString()
    });
    await this.onRetrieverError?.(run);
    await this._endTrace(run);
  }
  async handleText(text, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "chain") {
      return;
    }
    run.events.push({
      name: "text",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      kwargs: { text }
    });
    await this.onText?.(run);
  }
  async handleLLMNewToken(token, idx, runId, _parentRunId, _tags, fields) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "llm") {
      return;
    }
    run.events.push({
      name: "new_token",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      kwargs: { token, idx, chunk: fields?.chunk }
    });
    await this.onLLMNewToken?.(run);
  }
};

// node_modules/langchain/dist/callbacks/handlers/console.js
function wrap(style, text) {
  return `${style.open}${text}${style.close}`;
}
function tryJsonStringify(obj, fallback) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (err) {
    return fallback;
  }
}
function elapsed(run) {
  if (!run.end_time)
    return "";
  const elapsed2 = run.end_time - run.start_time;
  if (elapsed2 < 1e3) {
    return `${elapsed2}ms`;
  }
  return `${(elapsed2 / 1e3).toFixed(2)}s`;
}
var { color } = import_ansi_styles.default;
var ConsoleCallbackHandler = class extends BaseTracer {
  constructor() {
    super(...arguments);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "console_callback_handler"
    });
  }
  /**
   * Method used to persist the run. In this case, it simply returns a
   * resolved promise as there's no persistence logic.
   * @param _run The run to persist.
   * @returns A resolved promise.
   */
  persistRun(_run) {
    return Promise.resolve();
  }
  // utility methods
  /**
   * Method used to get all the parent runs of a given run.
   * @param run The run whose parents are to be retrieved.
   * @returns An array of parent runs.
   */
  getParents(run) {
    const parents = [];
    let currentRun = run;
    while (currentRun.parent_run_id) {
      const parent = this.runMap.get(currentRun.parent_run_id);
      if (parent) {
        parents.push(parent);
        currentRun = parent;
      } else {
        break;
      }
    }
    return parents;
  }
  /**
   * Method used to get a string representation of the run's lineage, which
   * is used in logging.
   * @param run The run whose lineage is to be retrieved.
   * @returns A string representation of the run's lineage.
   */
  getBreadcrumbs(run) {
    const parents = this.getParents(run).reverse();
    const string = [...parents, run].map((parent, i, arr) => {
      const name = `${parent.execution_order}:${parent.run_type}:${parent.name}`;
      return i === arr.length - 1 ? wrap(import_ansi_styles.default.bold, name) : name;
    }).join(" > ");
    return wrap(color.grey, string);
  }
  // logging methods
  /**
   * Method used to log the start of a chain run.
   * @param run The chain run that has started.
   * @returns void
   */
  onChainStart(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.green, "[chain/start]")} [${crumbs}] Entering Chain run with input: ${tryJsonStringify(run.inputs, "[inputs]")}`);
  }
  /**
   * Method used to log the end of a chain run.
   * @param run The chain run that has ended.
   * @returns void
   */
  onChainEnd(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.cyan, "[chain/end]")} [${crumbs}] [${elapsed(run)}] Exiting Chain run with output: ${tryJsonStringify(run.outputs, "[outputs]")}`);
  }
  /**
   * Method used to log any errors of a chain run.
   * @param run The chain run that has errored.
   * @returns void
   */
  onChainError(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.red, "[chain/error]")} [${crumbs}] [${elapsed(run)}] Chain run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
  }
  /**
   * Method used to log the start of an LLM run.
   * @param run The LLM run that has started.
   * @returns void
   */
  onLLMStart(run) {
    const crumbs = this.getBreadcrumbs(run);
    const inputs3 = "prompts" in run.inputs ? { prompts: run.inputs.prompts.map((p) => p.trim()) } : run.inputs;
    console.log(`${wrap(color.green, "[llm/start]")} [${crumbs}] Entering LLM run with input: ${tryJsonStringify(inputs3, "[inputs]")}`);
  }
  /**
   * Method used to log the end of an LLM run.
   * @param run The LLM run that has ended.
   * @returns void
   */
  onLLMEnd(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.cyan, "[llm/end]")} [${crumbs}] [${elapsed(run)}] Exiting LLM run with output: ${tryJsonStringify(run.outputs, "[response]")}`);
  }
  /**
   * Method used to log any errors of an LLM run.
   * @param run The LLM run that has errored.
   * @returns void
   */
  onLLMError(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.red, "[llm/error]")} [${crumbs}] [${elapsed(run)}] LLM run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
  }
  /**
   * Method used to log the start of a tool run.
   * @param run The tool run that has started.
   * @returns void
   */
  onToolStart(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.green, "[tool/start]")} [${crumbs}] Entering Tool run with input: "${run.inputs.input?.trim()}"`);
  }
  /**
   * Method used to log the end of a tool run.
   * @param run The tool run that has ended.
   * @returns void
   */
  onToolEnd(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.cyan, "[tool/end]")} [${crumbs}] [${elapsed(run)}] Exiting Tool run with output: "${run.outputs?.output?.trim()}"`);
  }
  /**
   * Method used to log any errors of a tool run.
   * @param run The tool run that has errored.
   * @returns void
   */
  onToolError(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.red, "[tool/error]")} [${crumbs}] [${elapsed(run)}] Tool run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
  }
  /**
   * Method used to log the start of a retriever run.
   * @param run The retriever run that has started.
   * @returns void
   */
  onRetrieverStart(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.green, "[retriever/start]")} [${crumbs}] Entering Retriever run with input: ${tryJsonStringify(run.inputs, "[inputs]")}`);
  }
  /**
   * Method used to log the end of a retriever run.
   * @param run The retriever run that has ended.
   * @returns void
   */
  onRetrieverEnd(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.cyan, "[retriever/end]")} [${crumbs}] [${elapsed(run)}] Exiting Retriever run with output: ${tryJsonStringify(run.outputs, "[outputs]")}`);
  }
  /**
   * Method used to log any errors of a retriever run.
   * @param run The retriever run that has errored.
   * @returns void
   */
  onRetrieverError(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.red, "[retriever/error]")} [${crumbs}] [${elapsed(run)}] Retriever run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
  }
  /**
   * Method used to log the action selected by the agent.
   * @param run The run in which the agent action occurred.
   * @returns void
   */
  onAgentAction(run) {
    const agentRun = run;
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.blue, "[agent/action]")} [${crumbs}] Agent selected action: ${tryJsonStringify(agentRun.actions[agentRun.actions.length - 1], "[action]")}`);
  }
};

// node_modules/langsmith/dist/utils/async_caller.js
var import_p_retry2 = __toESM(require_p_retry(), 1);
var import_p_queue2 = __toESM(require_dist(), 1);
var STATUS_NO_RETRY2 = [
  400,
  401,
  403,
  404,
  405,
  406,
  407,
  408,
  409
  // Conflict
];
var AsyncCaller2 = class {
  constructor(params) {
    Object.defineProperty(this, "maxConcurrency", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "maxRetries", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "queue", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.maxConcurrency = params.maxConcurrency ?? Infinity;
    this.maxRetries = params.maxRetries ?? 6;
    const PQueue = "default" in import_p_queue2.default ? import_p_queue2.default.default : import_p_queue2.default;
    this.queue = new PQueue({ concurrency: this.maxConcurrency });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  call(callable, ...args) {
    return this.queue.add(() => (0, import_p_retry2.default)(() => callable(...args).catch((error) => {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(error);
      }
    }), {
      onFailedAttempt(error) {
        if (error.message.startsWith("Cancel") || error.message.startsWith("TimeoutError") || error.message.startsWith("AbortError")) {
          throw error;
        }
        if (error?.code === "ECONNABORTED") {
          throw error;
        }
        const status = error?.response?.status;
        if (status && STATUS_NO_RETRY2.includes(+status)) {
          throw error;
        }
      },
      retries: this.maxRetries,
      randomize: true
      // If needed we can change some of the defaults here,
      // but they're quite sensible.
    }), { throwOnTimeout: true });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callWithOptions(options, callable, ...args) {
    if (options.signal) {
      return Promise.race([
        this.call(callable, ...args),
        new Promise((_, reject) => {
          options.signal?.addEventListener("abort", () => {
            reject(new Error("AbortError"));
          });
        })
      ]);
    }
    return this.call(callable, ...args);
  }
  fetch(...args) {
    return this.call(() => fetch(...args).then((res) => res.ok ? res : Promise.reject(res)));
  }
};

// node_modules/langsmith/dist/utils/messages.js
function isLangChainMessage(message) {
  return typeof message?._getType === "function";
}
function convertLangChainMessageToExample(message) {
  const converted = {
    type: message._getType(),
    data: { content: message.content }
  };
  if (message?.additional_kwargs && Object.keys(message.additional_kwargs).length > 0) {
    converted.data.additional_kwargs = { ...message.additional_kwargs };
  }
  return converted;
}

// node_modules/langsmith/dist/utils/env.js
var isBrowser = () => typeof window !== "undefined" && typeof window.document !== "undefined";
var isWebWorker = () => typeof globalThis === "object" && globalThis.constructor && globalThis.constructor.name === "DedicatedWorkerGlobalScope";
var isJsDom = () => typeof window !== "undefined" && window.name === "nodejs" || typeof navigator !== "undefined" && (navigator.userAgent.includes("Node.js") || navigator.userAgent.includes("jsdom"));
var isDeno = () => typeof Deno !== "undefined";
var isNode = () => typeof process !== "undefined" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined" && !isDeno();
var getEnv = () => {
  let env;
  if (isBrowser()) {
    env = "browser";
  } else if (isNode()) {
    env = "node";
  } else if (isWebWorker()) {
    env = "webworker";
  } else if (isJsDom()) {
    env = "jsdom";
  } else if (isDeno()) {
    env = "deno";
  } else {
    env = "other";
  }
  return env;
};
var runtimeEnvironment;
async function getRuntimeEnvironment() {
  if (runtimeEnvironment === void 0) {
    const env = getEnv();
    const releaseEnv = getShas();
    runtimeEnvironment = {
      library: "langsmith",
      runtime: env,
      ...releaseEnv
    };
  }
  return runtimeEnvironment;
}
function getEnvironmentVariable(name) {
  try {
    return typeof process !== "undefined" ? (
      // eslint-disable-next-line no-process-env
      process.env?.[name]
    ) : void 0;
  } catch (e) {
    return void 0;
  }
}
var cachedCommitSHAs;
function getShas() {
  if (cachedCommitSHAs !== void 0) {
    return cachedCommitSHAs;
  }
  const common_release_envs = [
    "VERCEL_GIT_COMMIT_SHA",
    "NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA",
    "COMMIT_REF",
    "RENDER_GIT_COMMIT",
    "CI_COMMIT_SHA",
    "CIRCLE_SHA1",
    "CF_PAGES_COMMIT_SHA",
    "REACT_APP_GIT_SHA",
    "SOURCE_VERSION",
    "GITHUB_SHA",
    "TRAVIS_COMMIT",
    "GIT_COMMIT",
    "BUILD_VCS_NUMBER",
    "bamboo_planRepository_revision",
    "Build.SourceVersion",
    "BITBUCKET_COMMIT",
    "DRONE_COMMIT_SHA",
    "SEMAPHORE_GIT_SHA",
    "BUILDKITE_COMMIT"
  ];
  const shas = {};
  for (const env of common_release_envs) {
    const envVar = getEnvironmentVariable(env);
    if (envVar !== void 0) {
      shas[env] = envVar;
    }
  }
  cachedCommitSHAs = shas;
  return shas;
}

// node_modules/langsmith/dist/client.js
var isLocalhost = (url) => {
  const strippedUrl = url.replace("http://", "").replace("https://", "");
  const hostname = strippedUrl.split("/")[0].split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
};
var raiseForStatus = async (response, operation) => {
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to ${operation}: ${response.status} ${response.statusText} ${body}`);
  }
};
async function toArray(iterable) {
  const result = [];
  for await (const item of iterable) {
    result.push(item);
  }
  return result;
}
function trimQuotes(str) {
  if (str === void 0) {
    return void 0;
  }
  return str.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}
function hideInputs(inputs3) {
  if (getEnvironmentVariable("LANGCHAIN_HIDE_INPUTS") === "true") {
    return {};
  }
  return inputs3;
}
function hideOutputs(outputs3) {
  if (getEnvironmentVariable("LANGCHAIN_HIDE_OUTPUTS") === "true") {
    return {};
  }
  return outputs3;
}
var Client = class _Client {
  constructor(config = {}) {
    Object.defineProperty(this, "apiKey", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "apiUrl", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "webUrl", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "caller", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "timeout_ms", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_tenantId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    const defaultConfig = _Client.getDefaultClientConfig();
    this.apiUrl = trimQuotes(config.apiUrl ?? defaultConfig.apiUrl) ?? "";
    this.apiKey = trimQuotes(config.apiKey ?? defaultConfig.apiKey);
    this.webUrl = trimQuotes(config.webUrl ?? defaultConfig.webUrl);
    this.validateApiKeyIfHosted();
    this.timeout_ms = config.timeout_ms ?? 4e3;
    this.caller = new AsyncCaller2(config.callerOptions ?? {});
  }
  static getDefaultClientConfig() {
    const apiKey = getEnvironmentVariable("LANGCHAIN_API_KEY");
    const apiUrl = getEnvironmentVariable("LANGCHAIN_ENDPOINT") ?? (apiKey ? "https://api.smith.langchain.com" : "http://localhost:1984");
    return {
      apiUrl,
      apiKey,
      webUrl: void 0
    };
  }
  validateApiKeyIfHosted() {
    const isLocal = isLocalhost(this.apiUrl);
    if (!isLocal && !this.apiKey) {
      throw new Error("API key must be provided when using hosted LangSmith API");
    }
  }
  getHostUrl() {
    if (this.webUrl) {
      return this.webUrl;
    } else if (isLocalhost(this.apiUrl)) {
      this.webUrl = "http://localhost";
      return "http://localhost";
    } else if (this.apiUrl.split(".", 1)[0].includes("dev")) {
      this.webUrl = "https://dev.smith.langchain.com";
      return "https://dev.smith.langchain.com";
    } else {
      this.webUrl = "https://smith.langchain.com";
      return "https://smith.langchain.com";
    }
  }
  get headers() {
    const headers = {};
    if (this.apiKey) {
      headers["x-api-key"] = `${this.apiKey}`;
    }
    return headers;
  }
  async _get(path, queryParams) {
    const paramsString = queryParams?.toString() ?? "";
    const url = `${this.apiUrl}${path}?${paramsString}`;
    const response = await this.caller.call(fetch, url, {
      method: "GET",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
  async *_getPaginated(path, queryParams = new URLSearchParams()) {
    let offset = Number(queryParams.get("offset")) || 0;
    const limit = Number(queryParams.get("limit")) || 100;
    while (true) {
      queryParams.set("offset", String(offset));
      queryParams.set("limit", String(limit));
      const url = `${this.apiUrl}${path}?${queryParams}`;
      const response = await this.caller.call(fetch, url, {
        method: "GET",
        headers: this.headers,
        signal: AbortSignal.timeout(this.timeout_ms)
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
      }
      const items = await response.json();
      if (items.length === 0) {
        break;
      }
      yield items;
      if (items.length < limit) {
        break;
      }
      offset += items.length;
    }
  }
  async createRun(run) {
    const headers = { ...this.headers, "Content-Type": "application/json" };
    const extra = run.extra ?? {};
    const runtimeEnv = await getRuntimeEnvironment();
    const session_name = run.project_name;
    delete run.project_name;
    const runCreate = {
      session_name,
      ...run,
      extra: {
        ...run.extra,
        runtime: {
          ...runtimeEnv,
          ...extra.runtime
        }
      }
    };
    runCreate.inputs = hideInputs(runCreate.inputs);
    if (runCreate.outputs) {
      runCreate.outputs = hideOutputs(runCreate.outputs);
    }
    const response = await this.caller.call(fetch, `${this.apiUrl}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify(runCreate),
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    await raiseForStatus(response, "create run");
  }
  async updateRun(runId, run) {
    if (run.inputs) {
      run.inputs = hideInputs(run.inputs);
    }
    if (run.outputs) {
      run.outputs = hideOutputs(run.outputs);
    }
    const headers = { ...this.headers, "Content-Type": "application/json" };
    const response = await this.caller.call(fetch, `${this.apiUrl}/runs/${runId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(run),
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    await raiseForStatus(response, "update run");
  }
  async readRun(runId, { loadChildRuns } = { loadChildRuns: false }) {
    let run = await this._get(`/runs/${runId}`);
    if (loadChildRuns && run.child_run_ids) {
      run = await this._loadChildRuns(run);
    }
    return run;
  }
  async getRunUrl({ runId, run, projectOpts }) {
    if (run !== void 0) {
      let sessionId;
      if (run.session_id) {
        sessionId = run.session_id;
      } else if (projectOpts?.projectName) {
        sessionId = (await this.readProject({ projectName: projectOpts?.projectName })).id;
      } else if (projectOpts?.projectId) {
        sessionId = projectOpts?.projectId;
      } else {
        const project = await this.readProject({
          projectName: getEnvironmentVariable("LANGCHAIN_PROJECT") || "default"
        });
        sessionId = project.id;
      }
      const tenantId = await this._getTenantId();
      return `${this.getHostUrl()}/o/${tenantId}/projects/p/${sessionId}/r/${run.id}?poll=true`;
    } else if (runId !== void 0) {
      const run_ = await this.readRun(runId);
      if (!run_.app_path) {
        throw new Error(`Run ${runId} has no app_path`);
      }
      const baseUrl = this.getHostUrl();
      return `${baseUrl}${run_.app_path}`;
    } else {
      throw new Error("Must provide either runId or run");
    }
  }
  async _loadChildRuns(run) {
    const childRuns = await toArray(this.listRuns({ id: run.child_run_ids }));
    const treemap = {};
    const runs = {};
    childRuns.sort((a, b) => (a?.dotted_order ?? "").localeCompare(b?.dotted_order ?? ""));
    for (const childRun of childRuns) {
      if (childRun.parent_run_id === null || childRun.parent_run_id === void 0) {
        throw new Error(`Child run ${childRun.id} has no parent`);
      }
      if (!(childRun.parent_run_id in treemap)) {
        treemap[childRun.parent_run_id] = [];
      }
      treemap[childRun.parent_run_id].push(childRun);
      runs[childRun.id] = childRun;
    }
    run.child_runs = treemap[run.id] || [];
    for (const runId in treemap) {
      if (runId !== run.id) {
        runs[runId].child_runs = treemap[runId];
      }
    }
    return run;
  }
  async *listRuns({ projectId, projectName, parentRunId, referenceExampleId, startTime, executionOrder, runType, error, id, limit, offset, query, filter }) {
    const queryParams = new URLSearchParams();
    let projectId_ = projectId;
    if (projectName) {
      if (projectId) {
        throw new Error("Only one of projectId or projectName may be given");
      }
      projectId_ = (await this.readProject({ projectName })).id;
    }
    if (projectId_) {
      queryParams.append("session", projectId_);
    }
    if (parentRunId) {
      queryParams.append("parent_run", parentRunId);
    }
    if (referenceExampleId) {
      queryParams.append("reference_example", referenceExampleId);
    }
    if (startTime) {
      queryParams.append("start_time", startTime.toISOString());
    }
    if (executionOrder) {
      queryParams.append("execution_order", executionOrder.toString());
    }
    if (runType) {
      queryParams.append("run_type", runType);
    }
    if (error !== void 0) {
      queryParams.append("error", error.toString());
    }
    if (id !== void 0) {
      for (const id_ of id) {
        queryParams.append("id", id_);
      }
    }
    if (limit !== void 0) {
      queryParams.append("limit", limit.toString());
    }
    if (offset !== void 0) {
      queryParams.append("offset", offset.toString());
    }
    if (query !== void 0) {
      queryParams.append("query", query);
    }
    if (filter !== void 0) {
      queryParams.append("filter", filter);
    }
    for await (const runs of this._getPaginated("/runs", queryParams)) {
      yield* runs;
    }
  }
  async shareRun(runId, { shareId } = {}) {
    const data = {
      run_id: runId,
      share_token: shareId || v4_default()
    };
    const response = await this.caller.call(fetch, `${this.apiUrl}/runs/${runId}/share`, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    const result = await response.json();
    if (result === null || !("share_token" in result)) {
      throw new Error("Invalid response from server");
    }
    return `${this.getHostUrl()}/public/${result["share_token"]}/r`;
  }
  async unshareRun(runId) {
    const response = await this.caller.call(fetch, `${this.apiUrl}/runs/${runId}/share`, {
      method: "DELETE",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    await raiseForStatus(response, "unshare run");
  }
  async readRunSharedLink(runId) {
    const response = await this.caller.call(fetch, `${this.apiUrl}/runs/${runId}/share`, {
      method: "GET",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    const result = await response.json();
    if (result === null || !("share_token" in result)) {
      return void 0;
    }
    return `${this.getHostUrl()}/public/${result["share_token"]}/r`;
  }
  async createProject({ projectName, projectExtra, upsert, referenceDatasetId }) {
    const upsert_ = upsert ? `?upsert=true` : "";
    const endpoint = `${this.apiUrl}/sessions${upsert_}`;
    const body = {
      name: projectName
    };
    if (projectExtra !== void 0) {
      body["extra"] = projectExtra;
    }
    if (referenceDatasetId !== void 0) {
      body["reference_dataset_id"] = referenceDatasetId;
    }
    const response = await this.caller.call(fetch, endpoint, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Failed to create session ${projectName}: ${response.status} ${response.statusText}`);
    }
    return result;
  }
  async readProject({ projectId, projectName }) {
    let path = "/sessions";
    const params = new URLSearchParams();
    if (projectId !== void 0 && projectName !== void 0) {
      throw new Error("Must provide either projectName or projectId, not both");
    } else if (projectId !== void 0) {
      path += `/${projectId}`;
    } else if (projectName !== void 0) {
      params.append("name", projectName);
    } else {
      throw new Error("Must provide projectName or projectId");
    }
    const response = await this._get(path, params);
    let result;
    if (Array.isArray(response)) {
      if (response.length === 0) {
        throw new Error(`Project[id=${projectId}, name=${projectName}] not found`);
      }
      result = response[0];
    } else {
      result = response;
    }
    return result;
  }
  async _getTenantId() {
    if (this._tenantId !== null) {
      return this._tenantId;
    }
    const queryParams = new URLSearchParams({ limit: "1" });
    for await (const projects of this._getPaginated("/sessions", queryParams)) {
      this._tenantId = projects[0].tenant_id;
      return projects[0].tenant_id;
    }
    throw new Error("No projects found to resolve tenant.");
  }
  async *listProjects({ projectIds, name, nameContains, referenceDatasetId, referenceDatasetName, referenceFree } = {}) {
    const params = new URLSearchParams();
    if (projectIds !== void 0) {
      for (const projectId of projectIds) {
        params.append("id", projectId);
      }
    }
    if (name !== void 0) {
      params.append("name", name);
    }
    if (nameContains !== void 0) {
      params.append("name_contains", nameContains);
    }
    if (referenceDatasetId !== void 0) {
      params.append("reference_dataset", referenceDatasetId);
    } else if (referenceDatasetName !== void 0) {
      const dataset = await this.readDataset({
        datasetName: referenceDatasetName
      });
      params.append("reference_dataset", dataset.id);
    }
    if (referenceFree !== void 0) {
      params.append("reference_free", referenceFree.toString());
    }
    for await (const projects of this._getPaginated("/sessions", params)) {
      yield* projects;
    }
  }
  async deleteProject({ projectId, projectName }) {
    let projectId_;
    if (projectId === void 0 && projectName === void 0) {
      throw new Error("Must provide projectName or projectId");
    } else if (projectId !== void 0 && projectName !== void 0) {
      throw new Error("Must provide either projectName or projectId, not both");
    } else if (projectId === void 0) {
      projectId_ = (await this.readProject({ projectName })).id;
    } else {
      projectId_ = projectId;
    }
    const response = await this.caller.call(fetch, `${this.apiUrl}/sessions/${projectId_}`, {
      method: "DELETE",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    await raiseForStatus(response, `delete session ${projectId_} (${projectName})`);
  }
  async uploadCsv({ csvFile, fileName, inputKeys, outputKeys, description, dataType, name }) {
    const url = `${this.apiUrl}/datasets/upload`;
    const formData = new FormData();
    formData.append("file", csvFile, fileName);
    inputKeys.forEach((key) => {
      formData.append("input_keys", key);
    });
    outputKeys.forEach((key) => {
      formData.append("output_keys", key);
    });
    if (description) {
      formData.append("description", description);
    }
    if (dataType) {
      formData.append("data_type", dataType);
    }
    if (name) {
      formData.append("name", name);
    }
    const response = await this.caller.call(fetch, url, {
      method: "POST",
      headers: this.headers,
      body: formData,
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    if (!response.ok) {
      const result2 = await response.json();
      if (result2.detail && result2.detail.includes("already exists")) {
        throw new Error(`Dataset ${fileName} already exists`);
      }
      throw new Error(`Failed to upload CSV: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  }
  async createDataset(name, { description, dataType } = {}) {
    const body = {
      name,
      description
    };
    if (dataType) {
      body.data_type = dataType;
    }
    const response = await this.caller.call(fetch, `${this.apiUrl}/datasets`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    if (!response.ok) {
      const result2 = await response.json();
      if (result2.detail && result2.detail.includes("already exists")) {
        throw new Error(`Dataset ${name} already exists`);
      }
      throw new Error(`Failed to create dataset ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  }
  async readDataset({ datasetId, datasetName }) {
    let path = "/datasets";
    const params = new URLSearchParams({ limit: "1" });
    if (datasetId !== void 0 && datasetName !== void 0) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId !== void 0) {
      path += `/${datasetId}`;
    } else if (datasetName !== void 0) {
      params.append("name", datasetName);
    } else {
      throw new Error("Must provide datasetName or datasetId");
    }
    const response = await this._get(path, params);
    let result;
    if (Array.isArray(response)) {
      if (response.length === 0) {
        throw new Error(`Dataset[id=${datasetId}, name=${datasetName}] not found`);
      }
      result = response[0];
    } else {
      result = response;
    }
    return result;
  }
  async *listDatasets({ limit = 100, offset = 0, datasetIds, datasetName, datasetNameContains } = {}) {
    const path = "/datasets";
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    if (datasetIds !== void 0) {
      for (const id_ of datasetIds) {
        params.append("id", id_);
      }
    }
    if (datasetName !== void 0) {
      params.append("name", datasetName);
    }
    if (datasetNameContains !== void 0) {
      params.append("name_contains", datasetNameContains);
    }
    for await (const datasets of this._getPaginated(path, params)) {
      yield* datasets;
    }
  }
  async deleteDataset({ datasetId, datasetName }) {
    let path = "/datasets";
    let datasetId_ = datasetId;
    if (datasetId !== void 0 && datasetName !== void 0) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetName !== void 0) {
      const dataset = await this.readDataset({ datasetName });
      datasetId_ = dataset.id;
    }
    if (datasetId_ !== void 0) {
      path += `/${datasetId_}`;
    } else {
      throw new Error("Must provide datasetName or datasetId");
    }
    const response = await this.caller.call(fetch, this.apiUrl + path, {
      method: "DELETE",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    if (!response.ok) {
      throw new Error(`Failed to delete ${path}: ${response.status} ${response.statusText}`);
    }
    await response.json();
  }
  async createExample(inputs3, outputs3, { datasetId, datasetName, createdAt, exampleId }) {
    let datasetId_ = datasetId;
    if (datasetId_ === void 0 && datasetName === void 0) {
      throw new Error("Must provide either datasetName or datasetId");
    } else if (datasetId_ !== void 0 && datasetName !== void 0) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId_ === void 0) {
      const dataset = await this.readDataset({ datasetName });
      datasetId_ = dataset.id;
    }
    const createdAt_ = createdAt || /* @__PURE__ */ new Date();
    const data = {
      dataset_id: datasetId_,
      inputs: inputs3,
      outputs: outputs3,
      created_at: createdAt_.toISOString(),
      id: exampleId
    };
    const response = await this.caller.call(fetch, `${this.apiUrl}/examples`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    if (!response.ok) {
      throw new Error(`Failed to create example: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  }
  async createLLMExample(input, generation, options) {
    return this.createExample({ input }, { output: generation }, options);
  }
  async createChatExample(input, generations, options) {
    const finalInput = input.map((message) => {
      if (isLangChainMessage(message)) {
        return convertLangChainMessageToExample(message);
      }
      return message;
    });
    const finalOutput = isLangChainMessage(generations) ? convertLangChainMessageToExample(generations) : generations;
    return this.createExample({ input: finalInput }, { output: finalOutput }, options);
  }
  async readExample(exampleId) {
    const path = `/examples/${exampleId}`;
    return await this._get(path);
  }
  async *listExamples({ datasetId, datasetName, exampleIds } = {}) {
    let datasetId_;
    if (datasetId !== void 0 && datasetName !== void 0) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId !== void 0) {
      datasetId_ = datasetId;
    } else if (datasetName !== void 0) {
      const dataset = await this.readDataset({ datasetName });
      datasetId_ = dataset.id;
    } else {
      throw new Error("Must provide a datasetName or datasetId");
    }
    const params = new URLSearchParams({ dataset: datasetId_ });
    if (exampleIds !== void 0) {
      for (const id_ of exampleIds) {
        params.append("id", id_);
      }
    }
    for await (const examples of this._getPaginated("/examples", params)) {
      yield* examples;
    }
  }
  async deleteExample(exampleId) {
    const path = `/examples/${exampleId}`;
    const response = await this.caller.call(fetch, this.apiUrl + path, {
      method: "DELETE",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    if (!response.ok) {
      throw new Error(`Failed to delete ${path}: ${response.status} ${response.statusText}`);
    }
    await response.json();
  }
  async updateExample(exampleId, update) {
    const response = await this.caller.call(fetch, `${this.apiUrl}/examples/${exampleId}`, {
      method: "PATCH",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(update),
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    if (!response.ok) {
      throw new Error(`Failed to update example ${exampleId}: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  }
  async evaluateRun(run, evaluator, { sourceInfo, loadChildRuns } = { loadChildRuns: false }) {
    let run_;
    if (typeof run === "string") {
      run_ = await this.readRun(run, { loadChildRuns });
    } else if (typeof run === "object" && "id" in run) {
      run_ = run;
    } else {
      throw new Error(`Invalid run type: ${typeof run}`);
    }
    let referenceExample = void 0;
    if (run_.reference_example_id !== null && run_.reference_example_id !== void 0) {
      referenceExample = await this.readExample(run_.reference_example_id);
    }
    const feedbackResult = await evaluator.evaluateRun(run_, referenceExample);
    let sourceInfo_ = sourceInfo ?? {};
    if (feedbackResult.evaluatorInfo) {
      sourceInfo_ = { ...sourceInfo_, ...feedbackResult.evaluatorInfo };
    }
    return await this.createFeedback(run_.id, feedbackResult.key, {
      score: feedbackResult.score,
      value: feedbackResult.value,
      comment: feedbackResult.comment,
      correction: feedbackResult.correction,
      sourceInfo: sourceInfo_,
      feedbackSourceType: "model"
    });
  }
  async createFeedback(runId, key, { score, value, correction, comment, sourceInfo, feedbackSourceType = "api", sourceRunId, feedbackId }) {
    const feedback_source = {
      type: feedbackSourceType ?? "api",
      metadata: sourceInfo ?? {}
    };
    if (sourceRunId !== void 0 && feedback_source?.metadata !== void 0 && !feedback_source.metadata["__run"]) {
      feedback_source.metadata["__run"] = { run_id: sourceRunId };
    }
    const feedback = {
      id: feedbackId ?? v4_default(),
      run_id: runId,
      key,
      score,
      value,
      correction,
      comment,
      feedback_source
    };
    const response = await this.caller.call(fetch, `${this.apiUrl}/feedback`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    await raiseForStatus(response, "create feedback");
    return feedback;
  }
  async updateFeedback(feedbackId, { score, value, correction, comment }) {
    const feedbackUpdate = {};
    if (score !== void 0 && score !== null) {
      feedbackUpdate["score"] = score;
    }
    if (value !== void 0 && value !== null) {
      feedbackUpdate["value"] = value;
    }
    if (correction !== void 0 && correction !== null) {
      feedbackUpdate["correction"] = correction;
    }
    if (comment !== void 0 && comment !== null) {
      feedbackUpdate["comment"] = comment;
    }
    const response = await this.caller.call(fetch, `${this.apiUrl}/feedback/${feedbackId}`, {
      method: "PATCH",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(feedbackUpdate),
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    return response.json();
  }
  async readFeedback(feedbackId) {
    const path = `/feedback/${feedbackId}`;
    const response = await this._get(path);
    return response;
  }
  async deleteFeedback(feedbackId) {
    const path = `/feedback/${feedbackId}`;
    const response = await this.caller.call(fetch, this.apiUrl + path, {
      method: "DELETE",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms)
    });
    if (!response.ok) {
      throw new Error(`Failed to delete ${path}: ${response.status} ${response.statusText}`);
    }
    await response.json();
  }
  async *listFeedback({ runIds, feedbackKeys, feedbackSourceTypes } = {}) {
    const queryParams = new URLSearchParams();
    if (runIds) {
      queryParams.append("run", runIds.join(","));
    }
    if (feedbackKeys) {
      for (const key of feedbackKeys) {
        queryParams.append("key", key);
      }
    }
    if (feedbackSourceTypes) {
      for (const type of feedbackSourceTypes) {
        queryParams.append("source", type);
      }
    }
    for await (const feedbacks of this._getPaginated("/feedback", queryParams)) {
      yield* feedbacks;
    }
  }
};

// node_modules/langchain/dist/util/env.js
var isBrowser2 = () => typeof window !== "undefined" && typeof window.document !== "undefined";
var isWebWorker2 = () => typeof globalThis === "object" && globalThis.constructor && globalThis.constructor.name === "DedicatedWorkerGlobalScope";
var isJsDom2 = () => typeof window !== "undefined" && window.name === "nodejs" || typeof navigator !== "undefined" && (navigator.userAgent.includes("Node.js") || navigator.userAgent.includes("jsdom"));
var isDeno2 = () => typeof Deno !== "undefined";
var isNode2 = () => typeof process !== "undefined" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined" && !isDeno2();
var getEnv2 = () => {
  let env;
  if (isBrowser2()) {
    env = "browser";
  } else if (isNode2()) {
    env = "node";
  } else if (isWebWorker2()) {
    env = "webworker";
  } else if (isJsDom2()) {
    env = "jsdom";
  } else if (isDeno2()) {
    env = "deno";
  } else {
    env = "other";
  }
  return env;
};
var runtimeEnvironment2;
async function getRuntimeEnvironment2() {
  if (runtimeEnvironment2 === void 0) {
    const env = getEnv2();
    runtimeEnvironment2 = {
      library: "langchain-js",
      runtime: env
    };
  }
  return runtimeEnvironment2;
}
function getEnvironmentVariable2(name) {
  try {
    return typeof process !== "undefined" ? (
      // eslint-disable-next-line no-process-env
      process.env?.[name]
    ) : void 0;
  } catch (e) {
    return void 0;
  }
}

// node_modules/langchain/dist/callbacks/handlers/tracer_langchain.js
var LangChainTracer = class extends BaseTracer {
  constructor(fields = {}) {
    super(fields);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "langchain_tracer"
    });
    Object.defineProperty(this, "projectName", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "exampleId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "client", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    const { exampleId, projectName, client } = fields;
    this.projectName = projectName ?? getEnvironmentVariable2("LANGCHAIN_PROJECT") ?? getEnvironmentVariable2("LANGCHAIN_SESSION");
    this.exampleId = exampleId;
    this.client = client ?? new Client({});
  }
  async _convertToCreate(run, example_id = void 0) {
    return {
      ...run,
      extra: {
        ...run.extra,
        runtime: await getRuntimeEnvironment2()
      },
      child_runs: void 0,
      session_name: this.projectName,
      reference_example_id: run.parent_run_id ? void 0 : example_id
    };
  }
  async persistRun(_run) {
  }
  async _persistRunSingle(run) {
    const persistedRun = await this._convertToCreate(run, this.exampleId);
    await this.client.createRun(persistedRun);
  }
  async _updateRunSingle(run) {
    const runUpdate = {
      end_time: run.end_time,
      error: run.error,
      outputs: run.outputs,
      events: run.events,
      inputs: run.inputs
    };
    await this.client.updateRun(run.id, runUpdate);
  }
  async onRetrieverStart(run) {
    await this._persistRunSingle(run);
  }
  async onRetrieverEnd(run) {
    await this._updateRunSingle(run);
  }
  async onRetrieverError(run) {
    await this._updateRunSingle(run);
  }
  async onLLMStart(run) {
    await this._persistRunSingle(run);
  }
  async onLLMEnd(run) {
    await this._updateRunSingle(run);
  }
  async onLLMError(run) {
    await this._updateRunSingle(run);
  }
  async onChainStart(run) {
    await this._persistRunSingle(run);
  }
  async onChainEnd(run) {
    await this._updateRunSingle(run);
  }
  async onChainError(run) {
    await this._updateRunSingle(run);
  }
  async onToolStart(run) {
    await this._persistRunSingle(run);
  }
  async onToolEnd(run) {
    await this._updateRunSingle(run);
  }
  async onToolError(run) {
    await this._updateRunSingle(run);
  }
};

// node_modules/langchain/dist/memory/base.js
function getBufferString(messages, humanPrefix = "Human", aiPrefix = "AI") {
  const string_messages = [];
  for (const m of messages) {
    let role;
    if (m._getType() === "human") {
      role = humanPrefix;
    } else if (m._getType() === "ai") {
      role = aiPrefix;
    } else if (m._getType() === "system") {
      role = "System";
    } else if (m._getType() === "function") {
      role = "Function";
    } else if (m._getType() === "generic") {
      role = m.role;
    } else {
      throw new Error(`Got unsupported message type: ${m}`);
    }
    const nameStr = m.name ? `${m.name}, ` : "";
    string_messages.push(`${role}: ${nameStr}${m.content}`);
  }
  return string_messages.join("\n");
}

// node_modules/langchain/dist/callbacks/handlers/tracer_langchain_v1.js
var LangChainTracerV1 = class extends BaseTracer {
  constructor() {
    super();
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "langchain_tracer"
    });
    Object.defineProperty(this, "endpoint", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: getEnvironmentVariable2("LANGCHAIN_ENDPOINT") || "http://localhost:1984"
    });
    Object.defineProperty(this, "headers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: {
        "Content-Type": "application/json"
      }
    });
    Object.defineProperty(this, "session", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    const apiKey = getEnvironmentVariable2("LANGCHAIN_API_KEY");
    if (apiKey) {
      this.headers["x-api-key"] = apiKey;
    }
  }
  async newSession(sessionName) {
    const sessionCreate = {
      start_time: Date.now(),
      name: sessionName
    };
    const session = await this.persistSession(sessionCreate);
    this.session = session;
    return session;
  }
  async loadSession(sessionName) {
    const endpoint = `${this.endpoint}/sessions?name=${sessionName}`;
    return this._handleSessionResponse(endpoint);
  }
  async loadDefaultSession() {
    const endpoint = `${this.endpoint}/sessions?name=default`;
    return this._handleSessionResponse(endpoint);
  }
  async convertV2RunToRun(run) {
    const session = this.session ?? await this.loadDefaultSession();
    const serialized = run.serialized;
    let runResult;
    if (run.run_type === "llm") {
      const prompts = run.inputs.prompts ? run.inputs.prompts : run.inputs.messages.map((x) => getBufferString(x));
      const llmRun = {
        uuid: run.id,
        start_time: run.start_time,
        end_time: run.end_time,
        execution_order: run.execution_order,
        child_execution_order: run.child_execution_order,
        serialized,
        type: run.run_type,
        session_id: session.id,
        prompts,
        response: run.outputs
      };
      runResult = llmRun;
    } else if (run.run_type === "chain") {
      const child_runs = await Promise.all(run.child_runs.map((child_run) => this.convertV2RunToRun(child_run)));
      const chainRun = {
        uuid: run.id,
        start_time: run.start_time,
        end_time: run.end_time,
        execution_order: run.execution_order,
        child_execution_order: run.child_execution_order,
        serialized,
        type: run.run_type,
        session_id: session.id,
        inputs: run.inputs,
        outputs: run.outputs,
        child_llm_runs: child_runs.filter((child_run) => child_run.type === "llm"),
        child_chain_runs: child_runs.filter((child_run) => child_run.type === "chain"),
        child_tool_runs: child_runs.filter((child_run) => child_run.type === "tool")
      };
      runResult = chainRun;
    } else if (run.run_type === "tool") {
      const child_runs = await Promise.all(run.child_runs.map((child_run) => this.convertV2RunToRun(child_run)));
      const toolRun = {
        uuid: run.id,
        start_time: run.start_time,
        end_time: run.end_time,
        execution_order: run.execution_order,
        child_execution_order: run.child_execution_order,
        serialized,
        type: run.run_type,
        session_id: session.id,
        tool_input: run.inputs.input,
        output: run.outputs?.output,
        action: JSON.stringify(serialized),
        child_llm_runs: child_runs.filter((child_run) => child_run.type === "llm"),
        child_chain_runs: child_runs.filter((child_run) => child_run.type === "chain"),
        child_tool_runs: child_runs.filter((child_run) => child_run.type === "tool")
      };
      runResult = toolRun;
    } else {
      throw new Error(`Unknown run type: ${run.run_type}`);
    }
    return runResult;
  }
  async persistRun(run) {
    let endpoint;
    let v1Run;
    if (run.run_type !== void 0) {
      v1Run = await this.convertV2RunToRun(run);
    } else {
      v1Run = run;
    }
    if (v1Run.type === "llm") {
      endpoint = `${this.endpoint}/llm-runs`;
    } else if (v1Run.type === "chain") {
      endpoint = `${this.endpoint}/chain-runs`;
    } else {
      endpoint = `${this.endpoint}/tool-runs`;
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(v1Run)
    });
    if (!response.ok) {
      console.error(`Failed to persist run: ${response.status} ${response.statusText}`);
    }
  }
  async persistSession(sessionCreate) {
    const endpoint = `${this.endpoint}/sessions`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(sessionCreate)
    });
    if (!response.ok) {
      console.error(`Failed to persist session: ${response.status} ${response.statusText}, using default session.`);
      return {
        id: 1,
        ...sessionCreate
      };
    }
    return {
      id: (await response.json()).id,
      ...sessionCreate
    };
  }
  async _handleSessionResponse(endpoint) {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: this.headers
    });
    let tracerSession;
    if (!response.ok) {
      console.error(`Failed to load session: ${response.status} ${response.statusText}`);
      tracerSession = {
        id: 1,
        start_time: Date.now()
      };
      this.session = tracerSession;
      return tracerSession;
    }
    const resp = await response.json();
    if (resp.length === 0) {
      tracerSession = {
        id: 1,
        start_time: Date.now()
      };
      this.session = tracerSession;
      return tracerSession;
    }
    [tracerSession] = resp;
    this.session = tracerSession;
    return tracerSession;
  }
};

// node_modules/langchain/dist/callbacks/handlers/initialize.js
async function getTracingCallbackHandler(session) {
  const tracer = new LangChainTracerV1();
  if (session) {
    await tracer.loadSession(session);
  } else {
    await tracer.loadDefaultSession();
  }
  return tracer;
}
async function getTracingV2CallbackHandler() {
  return new LangChainTracer();
}

// node_modules/langchain/dist/callbacks/promises.js
var import_p_queue3 = __toESM(require_dist(), 1);
var queue;
function createQueue() {
  const PQueue = "default" in import_p_queue3.default ? import_p_queue3.default.default : import_p_queue3.default;
  return new PQueue({
    autoStart: true,
    concurrency: 1
  });
}
async function consumeCallback(promiseFn, wait) {
  if (wait === true) {
    await promiseFn();
  } else {
    if (typeof queue === "undefined") {
      queue = createQueue();
    }
    void queue.add(promiseFn);
  }
}

// node_modules/langchain/dist/callbacks/manager.js
function parseCallbackConfigArg(arg) {
  if (!arg) {
    return {};
  } else if (Array.isArray(arg) || "name" in arg) {
    return { callbacks: arg };
  } else {
    return arg;
  }
}
var BaseCallbackManager = class {
  setHandler(handler) {
    return this.setHandlers([handler]);
  }
};
var BaseRunManager = class {
  constructor(runId, handlers, inheritableHandlers, tags, inheritableTags, metadata, inheritableMetadata, _parentRunId) {
    Object.defineProperty(this, "runId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: runId
    });
    Object.defineProperty(this, "handlers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: handlers
    });
    Object.defineProperty(this, "inheritableHandlers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: inheritableHandlers
    });
    Object.defineProperty(this, "tags", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: tags
    });
    Object.defineProperty(this, "inheritableTags", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: inheritableTags
    });
    Object.defineProperty(this, "metadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: metadata
    });
    Object.defineProperty(this, "inheritableMetadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: inheritableMetadata
    });
    Object.defineProperty(this, "_parentRunId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: _parentRunId
    });
  }
  async handleText(text) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      try {
        await handler.handleText?.(text, this.runId, this._parentRunId, this.tags);
      } catch (err) {
        console.error(`Error in handler ${handler.constructor.name}, handleText: ${err}`);
      }
    }, handler.awaitHandlers)));
  }
};
var CallbackManagerForRetrieverRun = class extends BaseRunManager {
  getChild(tag) {
    const manager = new CallbackManager(this.runId);
    manager.setHandlers(this.inheritableHandlers);
    manager.addTags(this.inheritableTags);
    manager.addMetadata(this.inheritableMetadata);
    if (tag) {
      manager.addTags([tag], false);
    }
    return manager;
  }
  async handleRetrieverEnd(documents) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreRetriever) {
        try {
          await handler.handleRetrieverEnd?.(documents, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleRetriever`);
        }
      }
    }, handler.awaitHandlers)));
  }
  async handleRetrieverError(err) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreRetriever) {
        try {
          await handler.handleRetrieverError?.(err, this.runId, this._parentRunId, this.tags);
        } catch (error) {
          console.error(`Error in handler ${handler.constructor.name}, handleRetrieverError: ${error}`);
        }
      }
    }, handler.awaitHandlers)));
  }
};
var CallbackManagerForLLMRun = class extends BaseRunManager {
  async handleLLMNewToken(token, idx, _runId, _parentRunId, _tags, fields) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreLLM) {
        try {
          await handler.handleLLMNewToken?.(token, idx ?? { prompt: 0, completion: 0 }, this.runId, this._parentRunId, this.tags, fields);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleLLMNewToken: ${err}`);
        }
      }
    }, handler.awaitHandlers)));
  }
  async handleLLMError(err) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreLLM) {
        try {
          await handler.handleLLMError?.(err, this.runId, this._parentRunId, this.tags);
        } catch (err2) {
          console.error(`Error in handler ${handler.constructor.name}, handleLLMError: ${err2}`);
        }
      }
    }, handler.awaitHandlers)));
  }
  async handleLLMEnd(output) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreLLM) {
        try {
          await handler.handleLLMEnd?.(output, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleLLMEnd: ${err}`);
        }
      }
    }, handler.awaitHandlers)));
  }
};
var CallbackManagerForChainRun = class extends BaseRunManager {
  getChild(tag) {
    const manager = new CallbackManager(this.runId);
    manager.setHandlers(this.inheritableHandlers);
    manager.addTags(this.inheritableTags);
    manager.addMetadata(this.inheritableMetadata);
    if (tag) {
      manager.addTags([tag], false);
    }
    return manager;
  }
  async handleChainError(err, _runId, _parentRunId, _tags, kwargs) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreChain) {
        try {
          await handler.handleChainError?.(err, this.runId, this._parentRunId, this.tags, kwargs);
        } catch (err2) {
          console.error(`Error in handler ${handler.constructor.name}, handleChainError: ${err2}`);
        }
      }
    }, handler.awaitHandlers)));
  }
  async handleChainEnd(output, _runId, _parentRunId, _tags, kwargs) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreChain) {
        try {
          await handler.handleChainEnd?.(output, this.runId, this._parentRunId, this.tags, kwargs);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleChainEnd: ${err}`);
        }
      }
    }, handler.awaitHandlers)));
  }
  async handleAgentAction(action) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreAgent) {
        try {
          await handler.handleAgentAction?.(action, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleAgentAction: ${err}`);
        }
      }
    }, handler.awaitHandlers)));
  }
  async handleAgentEnd(action) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreAgent) {
        try {
          await handler.handleAgentEnd?.(action, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleAgentEnd: ${err}`);
        }
      }
    }, handler.awaitHandlers)));
  }
};
var CallbackManagerForToolRun = class extends BaseRunManager {
  getChild(tag) {
    const manager = new CallbackManager(this.runId);
    manager.setHandlers(this.inheritableHandlers);
    manager.addTags(this.inheritableTags);
    manager.addMetadata(this.inheritableMetadata);
    if (tag) {
      manager.addTags([tag], false);
    }
    return manager;
  }
  async handleToolError(err) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreAgent) {
        try {
          await handler.handleToolError?.(err, this.runId, this._parentRunId, this.tags);
        } catch (err2) {
          console.error(`Error in handler ${handler.constructor.name}, handleToolError: ${err2}`);
        }
      }
    }, handler.awaitHandlers)));
  }
  async handleToolEnd(output) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreAgent) {
        try {
          await handler.handleToolEnd?.(output, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleToolEnd: ${err}`);
        }
      }
    }, handler.awaitHandlers)));
  }
};
var CallbackManager = class _CallbackManager extends BaseCallbackManager {
  constructor(parentRunId) {
    super();
    Object.defineProperty(this, "handlers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "inheritableHandlers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "tags", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "inheritableTags", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "metadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: {}
    });
    Object.defineProperty(this, "inheritableMetadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: {}
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "callback_manager"
    });
    Object.defineProperty(this, "_parentRunId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.handlers = [];
    this.inheritableHandlers = [];
    this._parentRunId = parentRunId;
  }
  async handleLLMStart(llm, prompts, _runId = void 0, _parentRunId = void 0, extraParams = void 0) {
    return Promise.all(prompts.map(async (prompt) => {
      const runId = v4_default();
      await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
        if (!handler.ignoreLLM) {
          try {
            await handler.handleLLMStart?.(llm, [prompt], runId, this._parentRunId, extraParams, this.tags, this.metadata);
          } catch (err) {
            console.error(`Error in handler ${handler.constructor.name}, handleLLMStart: ${err}`);
          }
        }
      }, handler.awaitHandlers)));
      return new CallbackManagerForLLMRun(runId, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
    }));
  }
  async handleChatModelStart(llm, messages, _runId = void 0, _parentRunId = void 0, extraParams = void 0) {
    return Promise.all(messages.map(async (messageGroup) => {
      const runId = v4_default();
      await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
        if (!handler.ignoreLLM) {
          try {
            if (handler.handleChatModelStart)
              await handler.handleChatModelStart?.(llm, [messageGroup], runId, this._parentRunId, extraParams, this.tags, this.metadata);
            else if (handler.handleLLMStart) {
              const messageString = getBufferString(messageGroup);
              await handler.handleLLMStart?.(llm, [messageString], runId, this._parentRunId, extraParams, this.tags, this.metadata);
            }
          } catch (err) {
            console.error(`Error in handler ${handler.constructor.name}, handleLLMStart: ${err}`);
          }
        }
      }, handler.awaitHandlers)));
      return new CallbackManagerForLLMRun(runId, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
    }));
  }
  async handleChainStart(chain, inputs3, runId = v4_default(), runType = void 0) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreChain) {
        try {
          await handler.handleChainStart?.(chain, inputs3, runId, this._parentRunId, this.tags, this.metadata, runType);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleChainStart: ${err}`);
        }
      }
    }, handler.awaitHandlers)));
    return new CallbackManagerForChainRun(runId, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
  }
  async handleToolStart(tool, input, runId = v4_default()) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreAgent) {
        try {
          await handler.handleToolStart?.(tool, input, runId, this._parentRunId, this.tags, this.metadata);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleToolStart: ${err}`);
        }
      }
    }, handler.awaitHandlers)));
    return new CallbackManagerForToolRun(runId, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
  }
  async handleRetrieverStart(retriever, query, runId = v4_default(), _parentRunId = void 0) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreRetriever) {
        try {
          await handler.handleRetrieverStart?.(retriever, query, runId, this._parentRunId, this.tags, this.metadata);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleRetrieverStart: ${err}`);
        }
      }
    }, handler.awaitHandlers)));
    return new CallbackManagerForRetrieverRun(runId, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
  }
  addHandler(handler, inherit = true) {
    this.handlers.push(handler);
    if (inherit) {
      this.inheritableHandlers.push(handler);
    }
  }
  removeHandler(handler) {
    this.handlers = this.handlers.filter((_handler) => _handler !== handler);
    this.inheritableHandlers = this.inheritableHandlers.filter((_handler) => _handler !== handler);
  }
  setHandlers(handlers, inherit = true) {
    this.handlers = [];
    this.inheritableHandlers = [];
    for (const handler of handlers) {
      this.addHandler(handler, inherit);
    }
  }
  addTags(tags, inherit = true) {
    this.removeTags(tags);
    this.tags.push(...tags);
    if (inherit) {
      this.inheritableTags.push(...tags);
    }
  }
  removeTags(tags) {
    this.tags = this.tags.filter((tag) => !tags.includes(tag));
    this.inheritableTags = this.inheritableTags.filter((tag) => !tags.includes(tag));
  }
  addMetadata(metadata, inherit = true) {
    this.metadata = { ...this.metadata, ...metadata };
    if (inherit) {
      this.inheritableMetadata = { ...this.inheritableMetadata, ...metadata };
    }
  }
  removeMetadata(metadata) {
    for (const key of Object.keys(metadata)) {
      delete this.metadata[key];
      delete this.inheritableMetadata[key];
    }
  }
  copy(additionalHandlers = [], inherit = true) {
    const manager = new _CallbackManager(this._parentRunId);
    for (const handler of this.handlers) {
      const inheritable = this.inheritableHandlers.includes(handler);
      manager.addHandler(handler, inheritable);
    }
    for (const tag of this.tags) {
      const inheritable = this.inheritableTags.includes(tag);
      manager.addTags([tag], inheritable);
    }
    for (const key of Object.keys(this.metadata)) {
      const inheritable = Object.keys(this.inheritableMetadata).includes(key);
      manager.addMetadata({ [key]: this.metadata[key] }, inheritable);
    }
    for (const handler of additionalHandlers) {
      if (
        // Prevent multiple copies of console_callback_handler
        manager.handlers.filter((h) => h.name === "console_callback_handler").some((h) => h.name === handler.name)
      ) {
        continue;
      }
      manager.addHandler(handler, inherit);
    }
    return manager;
  }
  static fromHandlers(handlers) {
    class Handler extends BaseCallbackHandler {
      constructor() {
        super();
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: v4_default()
        });
        Object.assign(this, handlers);
      }
    }
    const manager = new this();
    manager.addHandler(new Handler());
    return manager;
  }
  static async configure(inheritableHandlers, localHandlers, inheritableTags, localTags, inheritableMetadata, localMetadata, options) {
    let callbackManager;
    if (inheritableHandlers || localHandlers) {
      if (Array.isArray(inheritableHandlers) || !inheritableHandlers) {
        callbackManager = new _CallbackManager();
        callbackManager.setHandlers(inheritableHandlers?.map(ensureHandler) ?? [], true);
      } else {
        callbackManager = inheritableHandlers;
      }
      callbackManager = callbackManager.copy(Array.isArray(localHandlers) ? localHandlers.map(ensureHandler) : localHandlers?.handlers, false);
    }
    const verboseEnabled = getEnvironmentVariable2("LANGCHAIN_VERBOSE") || options?.verbose;
    const tracingV2Enabled = getEnvironmentVariable2("LANGCHAIN_TRACING_V2") === "true";
    const tracingEnabled = tracingV2Enabled || (getEnvironmentVariable2("LANGCHAIN_TRACING") ?? false);
    if (verboseEnabled || tracingEnabled) {
      if (!callbackManager) {
        callbackManager = new _CallbackManager();
      }
      if (verboseEnabled && !callbackManager.handlers.some((handler) => handler.name === ConsoleCallbackHandler.prototype.name)) {
        const consoleHandler = new ConsoleCallbackHandler();
        callbackManager.addHandler(consoleHandler, true);
      }
      if (tracingEnabled && !callbackManager.handlers.some((handler) => handler.name === "langchain_tracer")) {
        if (tracingV2Enabled) {
          callbackManager.addHandler(await getTracingV2CallbackHandler(), true);
        } else {
          const session = getEnvironmentVariable2("LANGCHAIN_PROJECT") && getEnvironmentVariable2("LANGCHAIN_SESSION");
          callbackManager.addHandler(await getTracingCallbackHandler(session), true);
        }
      }
    }
    if (inheritableTags || localTags) {
      if (callbackManager) {
        callbackManager.addTags(inheritableTags ?? []);
        callbackManager.addTags(localTags ?? [], false);
      }
    }
    if (inheritableMetadata || localMetadata) {
      if (callbackManager) {
        callbackManager.addMetadata(inheritableMetadata ?? {});
        callbackManager.addMetadata(localMetadata ?? {}, false);
      }
    }
    return callbackManager;
  }
};
function ensureHandler(handler) {
  if ("name" in handler) {
    return handler;
  }
  return BaseCallbackHandler.fromMethods(handler);
}

// node_modules/langchain/dist/util/stream.js
var IterableReadableStream = class _IterableReadableStream extends ReadableStream {
  constructor() {
    super(...arguments);
    Object.defineProperty(this, "reader", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
  }
  ensureReader() {
    if (!this.reader) {
      this.reader = this.getReader();
    }
  }
  async next() {
    this.ensureReader();
    try {
      const result = await this.reader.read();
      if (result.done)
        this.reader.releaseLock();
      return result;
    } catch (e) {
      this.reader.releaseLock();
      throw e;
    }
  }
  async return() {
    this.ensureReader();
    const cancelPromise = this.reader.cancel();
    this.reader.releaseLock();
    await cancelPromise;
    return { done: true, value: void 0 };
  }
  [Symbol.asyncIterator]() {
    return this;
  }
  static fromReadableStream(stream) {
    const reader = stream.getReader();
    return new _IterableReadableStream({
      start(controller) {
        return pump();
        function pump() {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            return pump();
          });
        }
      }
    });
  }
  static fromAsyncGenerator(generator) {
    return new _IterableReadableStream({
      async pull(controller) {
        const { value, done } = await generator.next();
        if (done) {
          controller.close();
        } else if (value) {
          controller.enqueue(value);
        }
      }
    });
  }
};

// node_modules/langchain/dist/schema/runnable.js
function _coerceToDict2(value, defaultKey) {
  return value && !Array.isArray(value) && typeof value === "object" ? value : { [defaultKey]: value };
}
var Runnable = class extends Serializable {
  constructor() {
    super(...arguments);
    Object.defineProperty(this, "lc_runnable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
  }
  /**
   * Bind arguments to a Runnable, returning a new Runnable.
   * @param kwargs
   * @returns A new RunnableBinding that, when invoked, will apply the bound args.
   */
  bind(kwargs) {
    return new RunnableBinding({ bound: this, kwargs });
  }
  /**
   * Create a new runnable from the current one that will try invoking
   * other passed fallback runnables if the initial invocation fails.
   * @param fields.fallbacks Other runnables to call if the runnable errors.
   * @returns A new RunnableWithFallbacks.
   */
  withFallbacks(fields) {
    return new RunnableWithFallbacks({
      runnable: this,
      fallbacks: fields.fallbacks
    });
  }
  _getOptionsList(options, length = 0) {
    if (Array.isArray(options)) {
      if (options.length !== length) {
        throw new Error(`Passed "options" must be an array with the same length as the inputs, but got ${options.length} options for ${length} inputs`);
      }
      return options;
    }
    return Array.from({ length }, () => options);
  }
  /**
   * Default implementation of batch, which calls invoke N times.
   * Subclasses should override this method if they can batch more efficiently.
   * @param inputs Array of inputs to each batch call.
   * @param options Either a single call options object to apply to each batch call or an array for each call.
   * @param batchOptions.maxConcurrency Maximum number of calls to run at once.
   * @returns An array of RunOutputs
   */
  async batch(inputs3, options, batchOptions) {
    const configList = this._getOptionsList(options ?? {}, inputs3.length);
    const batchSize = batchOptions?.maxConcurrency && batchOptions.maxConcurrency > 0 ? batchOptions?.maxConcurrency : inputs3.length;
    const batchResults = [];
    for (let i = 0; i < inputs3.length; i += batchSize) {
      const batchPromises = inputs3.slice(i, i + batchSize).map((input, j) => this.invoke(input, configList[j]));
      const batchResult = await Promise.all(batchPromises);
      batchResults.push(batchResult);
    }
    return batchResults.flat();
  }
  /**
   * Default streaming implementation.
   * Subclasses should override this method if they support streaming output.
   * @param input
   * @param options
   */
  async *_streamIterator(input, options) {
    yield this.invoke(input, options);
  }
  /**
   * Stream output in chunks.
   * @param input
   * @param options
   * @returns A readable stream that is also an iterable.
   */
  async stream(input, options) {
    return IterableReadableStream.fromAsyncGenerator(this._streamIterator(input, options));
  }
  _separateRunnableConfigFromCallOptions(options = {}) {
    const runnableConfig = {
      callbacks: options.callbacks,
      tags: options.tags,
      metadata: options.metadata
    };
    const callOptions = { ...options };
    delete callOptions.callbacks;
    delete callOptions.tags;
    delete callOptions.metadata;
    return [runnableConfig, callOptions];
  }
  async _callWithConfig(func, input, options) {
    const callbackManager_ = await CallbackManager.configure(options?.callbacks, void 0, options?.tags, void 0, options?.metadata);
    const runManager = await callbackManager_?.handleChainStart(this.toJSON(), _coerceToDict2(input, "input"), void 0, options?.runType);
    let output;
    try {
      output = await func.bind(this)(input);
    } catch (e) {
      await runManager?.handleChainError(e);
      throw e;
    }
    await runManager?.handleChainEnd(_coerceToDict2(output, "output"));
    return output;
  }
  /**
   * Helper method to transform an Iterator of Input values into an Iterator of
   * Output values, with callbacks.
   * Use this to implement `stream()` or `transform()` in Runnable subclasses.
   */
  async *_transformStreamWithConfig(inputGenerator, transformer, options) {
    let finalInput;
    let finalInputSupported = true;
    let finalOutput;
    let finalOutputSupported = true;
    const callbackManager_ = await CallbackManager.configure(options?.callbacks, void 0, options?.tags, void 0, options?.metadata);
    let runManager;
    const serializedRepresentation = this.toJSON();
    async function* wrapInputForTracing() {
      for await (const chunk of inputGenerator) {
        if (!runManager) {
          runManager = await callbackManager_?.handleChainStart(serializedRepresentation, { input: "" }, void 0, options?.runType);
        }
        if (finalInputSupported) {
          if (finalInput === void 0) {
            finalInput = chunk;
          } else {
            try {
              finalInput = finalInput.concat(chunk);
            } catch {
              finalInput = void 0;
              finalInputSupported = false;
            }
          }
        }
        yield chunk;
      }
    }
    const wrappedInputGenerator = wrapInputForTracing();
    try {
      const outputIterator = transformer(wrappedInputGenerator, runManager, options);
      for await (const chunk of outputIterator) {
        yield chunk;
        if (finalOutputSupported) {
          if (finalOutput === void 0) {
            finalOutput = chunk;
          } else {
            try {
              finalOutput = finalOutput.concat(chunk);
            } catch {
              finalOutput = void 0;
              finalOutputSupported = false;
            }
          }
        }
      }
    } catch (e) {
      await runManager?.handleChainError(e, void 0, void 0, void 0, {
        inputs: _coerceToDict2(finalInput, "input")
      });
      throw e;
    }
    await runManager?.handleChainEnd(finalOutput ?? {}, void 0, void 0, void 0, { inputs: _coerceToDict2(finalInput, "input") });
  }
  _patchConfig(config = {}, callbackManager = void 0) {
    return { ...config, callbacks: callbackManager };
  }
  /**
   * Create a new runnable sequence that runs each individual runnable in series,
   * piping the output of one runnable into another runnable or runnable-like.
   * @param coerceable A runnable, function, or object whose values are functions or runnables.
   * @returns A new runnable sequence.
   */
  pipe(coerceable) {
    return new RunnableSequence({
      first: this,
      last: _coerceToRunnable(coerceable)
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isRunnable(thing) {
    return thing.lc_runnable;
  }
};
var RunnableSequence = class _RunnableSequence extends Runnable {
  static lc_name() {
    return "RunnableSequence";
  }
  constructor(fields) {
    super(fields);
    Object.defineProperty(this, "first", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "middle", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "last", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "lc_serializable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
    Object.defineProperty(this, "lc_namespace", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ["langchain", "schema", "runnable"]
    });
    this.first = fields.first;
    this.middle = fields.middle ?? this.middle;
    this.last = fields.last;
  }
  get steps() {
    return [this.first, ...this.middle, this.last];
  }
  async invoke(input, options) {
    const callbackManager_ = await CallbackManager.configure(options?.callbacks, void 0, options?.tags, void 0, options?.metadata);
    const runManager = await callbackManager_?.handleChainStart(this.toJSON(), _coerceToDict2(input, "input"));
    let nextStepInput = input;
    let finalOutput;
    try {
      for (const step of [this.first, ...this.middle]) {
        nextStepInput = await step.invoke(nextStepInput, this._patchConfig(options, runManager?.getChild()));
      }
      finalOutput = await this.last.invoke(nextStepInput, this._patchConfig(options, runManager?.getChild()));
    } catch (e) {
      await runManager?.handleChainError(e);
      throw e;
    }
    await runManager?.handleChainEnd(_coerceToDict2(finalOutput, "output"));
    return finalOutput;
  }
  async batch(inputs3, options, batchOptions) {
    const configList = this._getOptionsList(options ?? {}, inputs3.length);
    const callbackManagers = await Promise.all(configList.map((config) => CallbackManager.configure(config?.callbacks, void 0, config?.tags, void 0, config?.metadata)));
    const runManagers = await Promise.all(callbackManagers.map((callbackManager, i) => callbackManager?.handleChainStart(this.toJSON(), _coerceToDict2(inputs3[i], "input"))));
    let nextStepInputs = inputs3;
    let finalOutputs;
    try {
      for (let i = 0; i < [this.first, ...this.middle].length; i += 1) {
        const step = this.steps[i];
        nextStepInputs = await step.batch(nextStepInputs, runManagers.map((runManager, j) => this._patchConfig(configList[j], runManager?.getChild())), batchOptions);
      }
      finalOutputs = await this.last.batch(nextStepInputs, runManagers.map((runManager) => this._patchConfig(configList[this.steps.length - 1], runManager?.getChild())), batchOptions);
    } catch (e) {
      await Promise.all(runManagers.map((runManager) => runManager?.handleChainError(e)));
      throw e;
    }
    await Promise.all(runManagers.map((runManager, i) => runManager?.handleChainEnd(_coerceToDict2(finalOutputs[i], "output"))));
    return finalOutputs;
  }
  async *_streamIterator(input, options) {
    const callbackManager_ = await CallbackManager.configure(options?.callbacks, void 0, options?.tags, void 0, options?.metadata);
    const runManager = await callbackManager_?.handleChainStart(this.toJSON(), _coerceToDict2(input, "input"));
    let nextStepInput = input;
    const steps = [this.first, ...this.middle, this.last];
    const streamingStartStepIndex = steps.length - [...steps].reverse().findIndex((step) => typeof step.transform !== "function") - 1;
    try {
      for (const step of steps.slice(0, streamingStartStepIndex)) {
        nextStepInput = await step.invoke(nextStepInput, this._patchConfig(options, runManager?.getChild()));
      }
    } catch (e) {
      await runManager?.handleChainError(e);
      throw e;
    }
    let concatSupported = true;
    let finalOutput;
    try {
      let finalGenerator = await steps[streamingStartStepIndex]._streamIterator(nextStepInput, this._patchConfig(options, runManager?.getChild()));
      for (const step of steps.slice(streamingStartStepIndex + 1)) {
        finalGenerator = await step.transform(finalGenerator, this._patchConfig(options, runManager?.getChild()));
      }
      for await (const chunk of finalGenerator) {
        yield chunk;
        if (concatSupported) {
          if (finalOutput === void 0) {
            finalOutput = chunk;
          } else {
            try {
              finalOutput = finalOutput.concat(chunk);
            } catch (e) {
              finalOutput = void 0;
              concatSupported = false;
            }
          }
        }
      }
    } catch (e) {
      await runManager?.handleChainError(e);
      throw e;
    }
    await runManager?.handleChainEnd(_coerceToDict2(finalOutput, "output"));
  }
  pipe(coerceable) {
    if (_RunnableSequence.isRunnableSequence(coerceable)) {
      return new _RunnableSequence({
        first: this.first,
        middle: this.middle.concat([
          this.last,
          coerceable.first,
          ...coerceable.middle
        ]),
        last: coerceable.last
      });
    } else {
      return new _RunnableSequence({
        first: this.first,
        middle: [...this.middle, this.last],
        last: _coerceToRunnable(coerceable)
      });
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isRunnableSequence(thing) {
    return Array.isArray(thing.middle) && Runnable.isRunnable(thing);
  }
  static from([first, ...runnables]) {
    return new _RunnableSequence({
      first: _coerceToRunnable(first),
      middle: runnables.slice(0, -1).map(_coerceToRunnable),
      last: _coerceToRunnable(runnables[runnables.length - 1])
    });
  }
};
var RunnableMap = class extends Runnable {
  static lc_name() {
    return "RunnableMap";
  }
  constructor(fields) {
    super(fields);
    Object.defineProperty(this, "lc_namespace", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ["langchain", "schema", "runnable"]
    });
    Object.defineProperty(this, "lc_serializable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
    Object.defineProperty(this, "steps", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.steps = {};
    for (const [key, value] of Object.entries(fields.steps)) {
      this.steps[key] = _coerceToRunnable(value);
    }
  }
  async invoke(input, options) {
    const callbackManager_ = await CallbackManager.configure(options?.callbacks, void 0, options?.tags, void 0, options?.metadata);
    const runManager = await callbackManager_?.handleChainStart(this.toJSON(), {
      input
    });
    const output = {};
    try {
      for (const [key, runnable] of Object.entries(this.steps)) {
        const result = await runnable.invoke(input, this._patchConfig(options, runManager?.getChild()));
        output[key] = result;
      }
    } catch (e) {
      await runManager?.handleChainError(e);
      throw e;
    }
    await runManager?.handleChainEnd(output);
    return output;
  }
};
var RunnableLambda = class extends Runnable {
  static lc_name() {
    return "RunnableLambda";
  }
  constructor(fields) {
    super(fields);
    Object.defineProperty(this, "lc_namespace", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ["langchain", "schema", "runnable"]
    });
    Object.defineProperty(this, "func", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.func = fields.func;
  }
  async invoke(input, options) {
    return this._callWithConfig(async (input2) => this.func(input2), input, options);
  }
};
var RunnableBinding = class _RunnableBinding extends Runnable {
  static lc_name() {
    return "RunnableBinding";
  }
  constructor(fields) {
    super(fields);
    Object.defineProperty(this, "lc_namespace", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ["langchain", "schema", "runnable"]
    });
    Object.defineProperty(this, "lc_serializable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
    Object.defineProperty(this, "bound", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "kwargs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.bound = fields.bound;
    this.kwargs = fields.kwargs;
  }
  bind(kwargs) {
    return new _RunnableBinding({
      bound: this.bound,
      kwargs: { ...this.kwargs, ...kwargs }
    });
  }
  async invoke(input, options) {
    return this.bound.invoke(input, { ...options, ...this.kwargs });
  }
  async batch(inputs3, options, batchOptions) {
    const mergedOptions = Array.isArray(options) ? options.map((individualOption) => ({
      ...individualOption,
      ...this.kwargs
    })) : { ...options, ...this.kwargs };
    return this.bound.batch(inputs3, mergedOptions, batchOptions);
  }
  async stream(input, options) {
    return this.bound.stream(input, { ...options, ...this.kwargs });
  }
};
var RunnableWithFallbacks = class extends Runnable {
  static lc_name() {
    return "RunnableWithFallbacks";
  }
  constructor(fields) {
    super(fields);
    Object.defineProperty(this, "lc_namespace", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ["langchain", "schema", "runnable"]
    });
    Object.defineProperty(this, "lc_serializable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
    Object.defineProperty(this, "runnable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "fallbacks", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.runnable = fields.runnable;
    this.fallbacks = fields.fallbacks;
  }
  *runnables() {
    yield this.runnable;
    for (const fallback of this.fallbacks) {
      yield fallback;
    }
  }
  async invoke(input, options) {
    const callbackManager_ = await CallbackManager.configure(options?.callbacks, void 0, options?.tags, void 0, options?.metadata);
    const runManager = await callbackManager_?.handleChainStart(this.toJSON(), _coerceToDict2(input, "input"));
    let firstError;
    for (const runnable of this.runnables()) {
      try {
        const output = await runnable.invoke(input, this._patchConfig(options, runManager?.getChild()));
        await runManager?.handleChainEnd(_coerceToDict2(output, "output"));
        return output;
      } catch (e) {
        if (firstError === void 0) {
          firstError = e;
        }
      }
    }
    if (firstError === void 0) {
      throw new Error("No error stored at end of fallback.");
    }
    await runManager?.handleChainError(firstError);
    throw firstError;
  }
  async batch(inputs3, options, batchOptions) {
    const configList = this._getOptionsList(options ?? {}, inputs3.length);
    const callbackManagers = await Promise.all(configList.map((config) => CallbackManager.configure(config?.callbacks, void 0, config?.tags, void 0, config?.metadata)));
    const runManagers = await Promise.all(callbackManagers.map((callbackManager, i) => callbackManager?.handleChainStart(this.toJSON(), _coerceToDict2(inputs3[i], "input"))));
    let firstError;
    for (const runnable of this.runnables()) {
      try {
        const outputs3 = await runnable.batch(inputs3, runManagers.map((runManager, j) => this._patchConfig(configList[j], runManager?.getChild())), batchOptions);
        await Promise.all(runManagers.map((runManager, i) => runManager?.handleChainEnd(_coerceToDict2(outputs3[i], "output"))));
        return outputs3;
      } catch (e) {
        if (firstError === void 0) {
          firstError = e;
        }
      }
    }
    if (!firstError) {
      throw new Error("No error stored at end of fallbacks.");
    }
    await Promise.all(runManagers.map((runManager) => runManager?.handleChainError(firstError)));
    throw firstError;
  }
};
function _coerceToRunnable(coerceable) {
  if (typeof coerceable === "function") {
    return new RunnableLambda({ func: coerceable });
  } else if (Runnable.isRunnable(coerceable)) {
    return coerceable;
  } else if (!Array.isArray(coerceable) && typeof coerceable === "object") {
    const runnables = {};
    for (const [key, value] of Object.entries(coerceable)) {
      runnables[key] = _coerceToRunnable(value);
    }
    return new RunnableMap({ steps: runnables });
  } else {
    throw new Error(`Expected a Runnable, function or object.
Instead got an unsupported type.`);
  }
}

// node_modules/langchain/dist/schema/document.js
var BaseDocumentTransformer = class extends Runnable {
  constructor() {
    super(...arguments);
    Object.defineProperty(this, "lc_namespace", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ["langchain", "document_transformers"]
    });
  }
  /**
   * Method to invoke the document transformation. This method calls the
   * transformDocuments method with the provided input.
   * @param input The input documents to be transformed.
   * @param _options Optional configuration object to customize the behavior of callbacks.
   * @returns A Promise that resolves to the transformed documents.
   */
  invoke(input, _options) {
    return this.transformDocuments(input);
  }
};

// node_modules/langchain/dist/text_splitter.js
var TextSplitter = class extends BaseDocumentTransformer {
  constructor(fields) {
    super(fields);
    Object.defineProperty(this, "lc_namespace", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ["langchain", "document_transformers", "text_splitters"]
    });
    Object.defineProperty(this, "chunkSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 1e3
    });
    Object.defineProperty(this, "chunkOverlap", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 200
    });
    Object.defineProperty(this, "keepSeparator", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "lengthFunction", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.chunkSize = fields?.chunkSize ?? this.chunkSize;
    this.chunkOverlap = fields?.chunkOverlap ?? this.chunkOverlap;
    this.keepSeparator = fields?.keepSeparator ?? this.keepSeparator;
    this.lengthFunction = fields?.lengthFunction ?? ((text) => text.length);
    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error("Cannot have chunkOverlap >= chunkSize");
    }
  }
  async transformDocuments(documents, chunkHeaderOptions = {}) {
    return this.splitDocuments(documents, chunkHeaderOptions);
  }
  splitOnSeparator(text, separator) {
    let splits;
    if (separator) {
      if (this.keepSeparator) {
        const regexEscapedSeparator = separator.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
        splits = text.split(new RegExp(`(?=${regexEscapedSeparator})`));
      } else {
        splits = text.split(separator);
      }
    } else {
      splits = text.split("");
    }
    return splits.filter((s) => s !== "");
  }
  async createDocuments(texts, metadatas = [], chunkHeaderOptions = {}) {
    const _metadatas = metadatas.length > 0 ? metadatas : new Array(texts.length).fill({});
    const { chunkHeader = "", chunkOverlapHeader = "(cont'd) ", appendChunkOverlapHeader = false } = chunkHeaderOptions;
    const documents = new Array();
    for (let i = 0; i < texts.length; i += 1) {
      const text = texts[i];
      let lineCounterIndex = 1;
      let prevChunk = null;
      for (const chunk of await this.splitText(text)) {
        let pageContent = chunkHeader;
        let numberOfIntermediateNewLines = 0;
        if (prevChunk) {
          const indexChunk = text.indexOf(chunk);
          const indexEndPrevChunk = text.indexOf(prevChunk) + await this.lengthFunction(prevChunk);
          const removedNewlinesFromSplittingText = text.slice(indexEndPrevChunk, indexChunk);
          numberOfIntermediateNewLines = (removedNewlinesFromSplittingText.match(/\n/g) || []).length;
          if (appendChunkOverlapHeader) {
            pageContent += chunkOverlapHeader;
          }
        }
        lineCounterIndex += numberOfIntermediateNewLines;
        const newLinesCount = (chunk.match(/\n/g) || []).length;
        const loc = _metadatas[i].loc && typeof _metadatas[i].loc === "object" ? { ..._metadatas[i].loc } : {};
        loc.lines = {
          from: lineCounterIndex,
          to: lineCounterIndex + newLinesCount
        };
        const metadataWithLinesNumber = {
          ..._metadatas[i],
          loc
        };
        pageContent += chunk;
        documents.push(new Document({
          pageContent,
          metadata: metadataWithLinesNumber
        }));
        lineCounterIndex += newLinesCount;
        prevChunk = chunk;
      }
    }
    return documents;
  }
  async splitDocuments(documents, chunkHeaderOptions = {}) {
    const selectedDocuments = documents.filter((doc) => doc.pageContent !== void 0);
    const texts = selectedDocuments.map((doc) => doc.pageContent);
    const metadatas = selectedDocuments.map((doc) => doc.metadata);
    return this.createDocuments(texts, metadatas, chunkHeaderOptions);
  }
  joinDocs(docs, separator) {
    const text = docs.join(separator).trim();
    return text === "" ? null : text;
  }
  async mergeSplits(splits, separator) {
    const docs = [];
    const currentDoc = [];
    let total = 0;
    for (const d of splits) {
      const _len = await this.lengthFunction(d);
      if (total + _len + (currentDoc.length > 0 ? separator.length : 0) > this.chunkSize) {
        if (total > this.chunkSize) {
          console.warn(`Created a chunk of size ${total}, +
which is longer than the specified ${this.chunkSize}`);
        }
        if (currentDoc.length > 0) {
          const doc2 = this.joinDocs(currentDoc, separator);
          if (doc2 !== null) {
            docs.push(doc2);
          }
          while (total > this.chunkOverlap || total + _len > this.chunkSize && total > 0) {
            total -= await this.lengthFunction(currentDoc[0]);
            currentDoc.shift();
          }
        }
      }
      currentDoc.push(d);
      total += _len;
    }
    const doc = this.joinDocs(currentDoc, separator);
    if (doc !== null) {
      docs.push(doc);
    }
    return docs;
  }
};
var SupportedTextSplitterLanguages = [
  "cpp",
  "go",
  "java",
  "js",
  "php",
  "proto",
  "python",
  "rst",
  "ruby",
  "rust",
  "scala",
  "swift",
  "markdown",
  "latex",
  "html",
  "sol"
];
var RecursiveCharacterTextSplitter = class _RecursiveCharacterTextSplitter extends TextSplitter {
  static lc_name() {
    return "RecursiveCharacterTextSplitter";
  }
  constructor(fields) {
    super(fields);
    Object.defineProperty(this, "separators", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ["\n\n", "\n", " ", ""]
    });
    this.separators = fields?.separators ?? this.separators;
    this.keepSeparator = fields?.keepSeparator ?? true;
  }
  async _splitText(text, separators) {
    const finalChunks = [];
    let separator = separators[separators.length - 1];
    let newSeparators;
    for (let i = 0; i < separators.length; i += 1) {
      const s = separators[i];
      if (s === "") {
        separator = s;
        break;
      }
      if (text.includes(s)) {
        separator = s;
        newSeparators = separators.slice(i + 1);
        break;
      }
    }
    const splits = this.splitOnSeparator(text, separator);
    let goodSplits = [];
    const _separator = this.keepSeparator ? "" : separator;
    for (const s of splits) {
      if (await this.lengthFunction(s) < this.chunkSize) {
        goodSplits.push(s);
      } else {
        if (goodSplits.length) {
          const mergedText = await this.mergeSplits(goodSplits, _separator);
          finalChunks.push(...mergedText);
          goodSplits = [];
        }
        if (!newSeparators) {
          finalChunks.push(s);
        } else {
          const otherInfo = await this._splitText(s, newSeparators);
          finalChunks.push(...otherInfo);
        }
      }
    }
    if (goodSplits.length) {
      const mergedText = await this.mergeSplits(goodSplits, _separator);
      finalChunks.push(...mergedText);
    }
    return finalChunks;
  }
  async splitText(text) {
    return this._splitText(text, this.separators);
  }
  static fromLanguage(language, options) {
    return new _RecursiveCharacterTextSplitter({
      ...options,
      separators: _RecursiveCharacterTextSplitter.getSeparatorsForLanguage(language)
    });
  }
  static getSeparatorsForLanguage(language) {
    if (language === "cpp") {
      return [
        // Split along class definitions
        "\nclass ",
        // Split along function definitions
        "\nvoid ",
        "\nint ",
        "\nfloat ",
        "\ndouble ",
        // Split along control flow statements
        "\nif ",
        "\nfor ",
        "\nwhile ",
        "\nswitch ",
        "\ncase ",
        // Split by the normal type of lines
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else if (language === "go") {
      return [
        // Split along function definitions
        "\nfunc ",
        "\nvar ",
        "\nconst ",
        "\ntype ",
        // Split along control flow statements
        "\nif ",
        "\nfor ",
        "\nswitch ",
        "\ncase ",
        // Split by the normal type of lines
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else if (language === "java") {
      return [
        // Split along class definitions
        "\nclass ",
        // Split along method definitions
        "\npublic ",
        "\nprotected ",
        "\nprivate ",
        "\nstatic ",
        // Split along control flow statements
        "\nif ",
        "\nfor ",
        "\nwhile ",
        "\nswitch ",
        "\ncase ",
        // Split by the normal type of lines
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else if (language === "js") {
      return [
        // Split along function definitions
        "\nfunction ",
        "\nconst ",
        "\nlet ",
        "\nvar ",
        "\nclass ",
        // Split along control flow statements
        "\nif ",
        "\nfor ",
        "\nwhile ",
        "\nswitch ",
        "\ncase ",
        "\ndefault ",
        // Split by the normal type of lines
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else if (language === "php") {
      return [
        // Split along function definitions
        "\nfunction ",
        // Split along class definitions
        "\nclass ",
        // Split along control flow statements
        "\nif ",
        "\nforeach ",
        "\nwhile ",
        "\ndo ",
        "\nswitch ",
        "\ncase ",
        // Split by the normal type of lines
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else if (language === "proto") {
      return [
        // Split along message definitions
        "\nmessage ",
        // Split along service definitions
        "\nservice ",
        // Split along enum definitions
        "\nenum ",
        // Split along option definitions
        "\noption ",
        // Split along import statements
        "\nimport ",
        // Split along syntax declarations
        "\nsyntax ",
        // Split by the normal type of lines
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else if (language === "python") {
      return [
        // First, try to split along class definitions
        "\nclass ",
        "\ndef ",
        "\n	def ",
        // Now split by the normal type of lines
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else if (language === "rst") {
      return [
        // Split along section titles
        "\n===\n",
        "\n---\n",
        "\n***\n",
        // Split along directive markers
        "\n.. ",
        // Split by the normal type of lines
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else if (language === "ruby") {
      return [
        // Split along method definitions
        "\ndef ",
        "\nclass ",
        // Split along control flow statements
        "\nif ",
        "\nunless ",
        "\nwhile ",
        "\nfor ",
        "\ndo ",
        "\nbegin ",
        "\nrescue ",
        // Split by the normal type of lines
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else if (language === "rust") {
      return [
        // Split along function definitions
        "\nfn ",
        "\nconst ",
        "\nlet ",
        // Split along control flow statements
        "\nif ",
        "\nwhile ",
        "\nfor ",
        "\nloop ",
        "\nmatch ",
        "\nconst ",
        // Split by the normal type of lines
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else if (language === "scala") {
      return [
        // Split along class definitions
        "\nclass ",
        "\nobject ",
        // Split along method definitions
        "\ndef ",
        "\nval ",
        "\nvar ",
        // Split along control flow statements
        "\nif ",
        "\nfor ",
        "\nwhile ",
        "\nmatch ",
        "\ncase ",
        // Split by the normal type of lines
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else if (language === "swift") {
      return [
        // Split along function definitions
        "\nfunc ",
        // Split along class definitions
        "\nclass ",
        "\nstruct ",
        "\nenum ",
        // Split along control flow statements
        "\nif ",
        "\nfor ",
        "\nwhile ",
        "\ndo ",
        "\nswitch ",
        "\ncase ",
        // Split by the normal type of lines
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else if (language === "markdown") {
      return [
        // First, try to split along Markdown headings (starting with level 2)
        "\n## ",
        "\n### ",
        "\n#### ",
        "\n##### ",
        "\n###### ",
        // Note the alternative syntax for headings (below) is not handled here
        // Heading level 2
        // ---------------
        // End of code block
        "```\n\n",
        // Horizontal lines
        "\n\n***\n\n",
        "\n\n---\n\n",
        "\n\n___\n\n",
        // Note that this splitter doesn't handle horizontal lines defined
        // by *three or more* of ***, ---, or ___, but this is not handled
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else if (language === "latex") {
      return [
        // First, try to split along Latex sections
        "\n\\chapter{",
        "\n\\section{",
        "\n\\subsection{",
        "\n\\subsubsection{",
        // Now split by environments
        "\n\\begin{enumerate}",
        "\n\\begin{itemize}",
        "\n\\begin{description}",
        "\n\\begin{list}",
        "\n\\begin{quote}",
        "\n\\begin{quotation}",
        "\n\\begin{verse}",
        "\n\\begin{verbatim}",
        // Now split by math environments
        "\n\\begin{align}",
        "$$",
        "$",
        // Now split by the normal type of lines
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else if (language === "html") {
      return [
        // First, try to split along HTML tags
        "<body>",
        "<div>",
        "<p>",
        "<br>",
        "<li>",
        "<h1>",
        "<h2>",
        "<h3>",
        "<h4>",
        "<h5>",
        "<h6>",
        "<span>",
        "<table>",
        "<tr>",
        "<td>",
        "<th>",
        "<ul>",
        "<ol>",
        "<header>",
        "<footer>",
        "<nav>",
        // Head
        "<head>",
        "<style>",
        "<script>",
        "<meta>",
        "<title>",
        // Normal type of lines
        " ",
        ""
      ];
    } else if (language === "sol") {
      return [
        // Split along compiler informations definitions
        "\npragma ",
        "\nusing ",
        // Split along contract definitions
        "\ncontract ",
        "\ninterface ",
        "\nlibrary ",
        // Split along method definitions
        "\nconstructor ",
        "\ntype ",
        "\nfunction ",
        "\nevent ",
        "\nmodifier ",
        "\nerror ",
        "\nstruct ",
        "\nenum ",
        // Split along control flow statements
        "\nif ",
        "\nfor ",
        "\nwhile ",
        "\ndo while ",
        "\nassembly ",
        // Split by the normal type of lines
        "\n\n",
        "\n",
        " ",
        ""
      ];
    } else {
      throw new Error(`Language ${language} is not supported.`);
    }
  }
};
var TokenTextSplitter = class extends TextSplitter {
  static lc_name() {
    return "TokenTextSplitter";
  }
  constructor(fields) {
    super(fields);
    Object.defineProperty(this, "encodingName", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "allowedSpecial", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "disallowedSpecial", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "tokenizer", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.encodingName = fields?.encodingName ?? "gpt2";
    this.allowedSpecial = fields?.allowedSpecial ?? [];
    this.disallowedSpecial = fields?.disallowedSpecial ?? "all";
  }
  async splitText(text) {
    if (!this.tokenizer) {
      this.tokenizer = await getEncoding(this.encodingName);
    }
    const splits = [];
    const input_ids = this.tokenizer.encode(text, this.allowedSpecial, this.disallowedSpecial);
    let start_idx = 0;
    let cur_idx = Math.min(start_idx + this.chunkSize, input_ids.length);
    let chunk_ids = input_ids.slice(start_idx, cur_idx);
    while (start_idx < input_ids.length) {
      splits.push(this.tokenizer.decode(chunk_ids));
      start_idx += this.chunkSize - this.chunkOverlap;
      cur_idx = Math.min(start_idx + this.chunkSize, input_ids.length);
      chunk_ids = input_ids.slice(start_idx, cur_idx);
    }
    return splits;
  }
};

// omnilib-docs/chunking.js
import { get_cached_cdn, save_chunks_cdn_to_db, save_json_to_cdn_as_buffer, is_valid as is_valid2, console_log as console_log2 } from "../../../src/utils/omni-utils.js";
var DEFAULT_CHUNK_SIZE = 8092;
var DEFAULT_CHUNK_OVERLAP = 4096;
var EMBEDDING_BATCH_SIZE = 10;
function createBatches(arr, size) {
  const batches = [];
  for (let i = 0; i < arr.length; i += size) {
    const start_index = i;
    const end_index = Math.min(i + size, arr.length);
    const batch = arr.slice(start_index, end_index);
    batches.push(batch);
  }
  return batches;
}
async function breakTextIntoBatches(text, splitter) {
  const splitted_texts = await splitter.splitText(text);
  const textBatches = createBatches(splitted_texts, EMBEDDING_BATCH_SIZE);
  return textBatches;
}
function computeTokenToChunkingSizeRatio(chunks, chunk_size, chunk_overlap) {
  let total_token_count = 0;
  let total_chunk_size = 0;
  let index = 0;
  for (const chunk of chunks) {
    if (index != chunks.length - 1) {
      if (chunk && chunk.token_count)
        total_token_count += chunk.token_count;
      total_chunk_size += chunk_size + chunk_overlap;
    }
    index += 1;
  }
  let token_to_chunking_size_ratio = -1;
  if (total_chunk_size != 0)
    token_to_chunking_size_ratio = total_token_count / total_chunk_size;
  return token_to_chunking_size_ratio;
}
async function computeChunks(ctx, document_id, textBatches, hasher, embedder, tokenCounterFunction) {
  const chunks = [];
  let index = 0;
  for (const textBatch of textBatches) {
    const embeddingPromises = textBatch.map(async (chunk_text) => {
      const nb_of_chars = chunk_text.length;
      if (nb_of_chars > 0) {
        const chunk_id = computeChunkId(ctx, chunk_text, hasher);
        await embedder.embedQuery(chunk_text);
        const chunk_token_count = tokenCounterFunction(chunk_text);
        const chunk_json = { source: document_id, index, id: chunk_id, token_count: chunk_token_count, text: chunk_text };
        return chunk_json;
      }
    });
    const batchResults = await Promise.all(embeddingPromises);
    chunks.push(...batchResults);
    index += 1;
  }
  if (is_valid2(chunks) === false) {
    throw new Error(`ERROR could not chunk the documents`);
  }
  return chunks;
}
async function uploadTextWithCaching(ctx, text, hasher, chunk_size, chunk_overlap, overwrite) {
  const text_id = computeDocumentId(ctx, [text], hasher, chunk_size, chunk_overlap);
  let text_cdn = await get_cached_cdn(ctx, text_id, overwrite);
  if (!is_valid2(text_cdn)) {
    const buffer = Buffer.from(text);
    text_cdn = await ctx.app.cdn.putTemp(buffer, { mimeType: "text/plain; charset=utf-8", userId: ctx.userId });
  } else {
    console_log2(`[ingestText] Found text_cdn: ${JSON.stringify(text_cdn)} in the DB under id: ${text_id}. Skipping uploading to CDN...`);
  }
  return text_cdn;
}
async function chunkText(ctx, document_id, document_text, hasher, embedder, splitter, tokenCounterFunction) {
  const text_batches = await breakTextIntoBatches(document_text, splitter);
  const document_chunks = await computeChunks(ctx, document_id, text_batches, hasher, embedder, tokenCounterFunction);
  return document_chunks;
}
async function saveIndexedDocument(ctx, document_id, chunks, chunk_size, chunk_overlap, token_to_chunking_size_ratio, splitter_model) {
  const indexed_document_info = { id: document_id, splitter_model, chunks, chunk_size, chunk_overlap, token_to_chunking_size_ratio };
  const indexed_document_cdn = await save_json_to_cdn_as_buffer(ctx, indexed_document_info);
  if (!indexed_document_cdn)
    throw new Error(`ERROR: could not save document_cdn to cdn`);
  const success = await save_chunks_cdn_to_db(ctx, indexed_document_cdn, document_id);
  if (success == false)
    throw new Error(`ERROR: could not save document_cdn to db`);
  return indexed_document_cdn;
}

// omnilib-docs/splitter.js
var SPLITTER_MODEL_RECURSIVE = "RecursiveCharacterTextSplitter";
var SPLITTER_MODEL_TOKEN = "TokenTextSplitter";
var SPLITTER_MODEL_CODE = "CodeSplitter_";
var DEFAULT_SPLITTER_MODEL = SPLITTER_MODEL_RECURSIVE;
var SPLITTER_TOKEN_ENCODING = "gpt2";
function getSplitterChoices() {
  const splitter_choices = [
    { value: "RecursiveCharacterTextSplitter", title: "RecursiveCharacterTextSplitter" },
    { value: "TokenTextSplitter", title: "TokenTextSplitter" },
    { value: "CodeSplitter_cpp", title: "CodeSplitter_cpp" },
    { value: "CodeSplitter_go", title: "CodeSplitter_go" },
    { value: "CodeSplitter_java", title: "CodeSplitter_java" },
    { value: "CodeSplitter_ruby", title: "CodeSplitter_ruby" },
    { value: "CodeSplitter_js", title: "CodeSplitter_js" },
    { value: "CodeSplitter_php", title: "CodeSplitter_php" },
    { value: "CodeSplitter_proto", title: "CodeSplitter_proto" },
    { value: "CodeSplitter_python", title: "CodeSplitter_python" },
    { value: "CodeSplitter_rst", title: "CodeSplitter_rst" },
    { value: "CodeSplitter_rust", title: "CodeSplitter_rust" },
    { value: "CodeSplitter_scala", title: "CodeSplitter_scala" },
    { value: "CodeSplitter_swift", title: "CodeSplitter_swift" },
    { value: "CodeSplitter_markdown", title: "CodeSplitter_markdown" },
    { value: "CodeSplitter_latex", title: "CodeSplitter_latex" },
    { value: "CodeSplitter_html", title: "CodeSplitter_html" }
  ];
  return splitter_choices;
}
function extractCodeLanguage(str) {
  const pattern = new RegExp("^" + SPLITTER_MODEL_CODE + "(\\w+)$", "i");
  const match = str.match(pattern);
  if (match) {
    const language = match[1].toLowerCase();
    const validLanguages = SupportedTextSplitterLanguages;
    if (validLanguages.includes(language)) {
      return language;
    }
  }
  return null;
}
function initializeSplitter(splitter_model = DEFAULT_SPLITTER_MODEL, chunk_size = DEFAULT_CHUNK_SIZE, chunk_overlap = DEFAULT_CHUNK_OVERLAP) {
  let splitter = null;
  if (splitter_model == SPLITTER_MODEL_RECURSIVE) {
    splitter = new RecursiveCharacterTextSplitter({
      chunkSize: chunk_size,
      // in characters!
      chunkOverlap: chunk_overlap
      // in characters!
    });
  } else if (splitter_model == SPLITTER_MODEL_TOKEN) {
    splitter = new TokenTextSplitter({
      encodingName: SPLITTER_TOKEN_ENCODING,
      chunkSize: chunk_size,
      // in tokens!
      chunkOverlap: chunk_overlap
      // in tokens!
    });
  } else {
    const code_language = extractCodeLanguage(splitter_model);
    if (code_language) {
      splitter = RecursiveCharacterTextSplitter.fromLanguage(code_language, {
        chunkSize: chunk_size,
        // in characters!
        chunkOverlap: chunk_overlap
        // in characters!
      });
    }
  }
  if (splitter == null || splitter == void 0)
    throw new Error(`initializeSplitter: Failed to initialize splitter_model ${splitter_model}`);
  return splitter;
}

// omnilib-docs/embedder.js
import { is_valid as is_valid3, console_log as console_log3, user_db_put, user_db_get, user_db_delete } from "../../../src/utils/omni-utils.js";

// node_modules/langchain/dist/embeddings/base.js
var Embeddings = class {
  constructor(params) {
    Object.defineProperty(this, "caller", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.caller = new AsyncCaller(params ?? {});
  }
};

// omnilib-docs/embedder.js
var Embedder = class extends Embeddings {
  // A db-cached version of the embeddings
  // NOTE: This is a general purpose "cached embeddings" class
  // that can wrap any langchain embeddings model
  constructor(ctx, embedder, hasher_model, embedder_model, overwrite = false, params = null) {
    super(params);
    this.embedder = embedder;
    this.embedder_model = embedder_model;
    this.ctx = ctx;
    this.db = ctx.app.services.get("db");
    this.user = ctx.user;
    this.overwrite = false;
    this.hasher_model = hasher_model;
    const hasher = initialize_hasher(hasher_model);
    this.hasher = hasher;
  }
  async embedDocuments(texts) {
    const embeddings = [];
    if (is_valid3(texts)) {
      for (let i = 0; i < texts.length; i += 1) {
        let text = texts[i];
        const embedding = await this.embedQuery(text);
        embeddings.push(embedding);
      }
    }
    return embeddings;
  }
  async embedQuery(text, save_embedding = true) {
    if (!is_valid3(text)) {
      throw new Error(`[embeddings] passed text is invalid ${text}`);
    }
    console_log3(`[embeddings] embedQuery of: ${text.slice(0, 128)}[...]`);
    const embedding_id = computeChunkId(this.ctx, text, this.hasher);
    let embedding = null;
    if (save_embedding) {
      if (this.overwrite) {
        await user_db_delete(this.ctx, embedding_id);
      } else {
        const db_entry = await user_db_get(this.ctx, embedding_id);
        embedding = db_entry?.embedding;
      }
      if (is_valid3(embedding)) {
        console_log3(`[embeddings]: embedding found in DB - returning it`);
        return embedding;
      }
    }
    console_log3(`[embeddings] Not found in DB. Generating embedding for ${text.slice(0, 128)}[...]`);
    try {
      console_log3(`[embeddings] Using embedded: ${this.embedder}`);
      embedding = await this.embedder.embedQuery(text);
      if (!is_valid3(embedding)) {
        console_log3(`[embeddings]: [WARNING] embedding ${embedding} is invalid - returning null <---------------`);
        return null;
      }
      console_log3(`[embeddings]: computed embedding: ${embedding.slice(0, 128)}[...]`);
      if (save_embedding) {
        const db_value = { embedding, text, id: embedding_id };
        const success = await user_db_put(this.ctx, db_value, embedding_id);
        if (success == false) {
          throw new Error(`[embeddings] Error saving embedding for text chunk: ${text.slice(0, 128)}[...]`);
        }
      }
      return embedding;
    } catch (error) {
      throw new Error(`[embeddings] Error generating embedding: ${error}`);
    }
  }
};

// omnilib-docs/embedding_Openai.js
import { is_valid as is_valid4, console_log as console_log4, runBlock } from "../../../src/utils/omni-utils.js";
var Embedding_Openai = class extends Embeddings {
  constructor(ctx, params = null) {
    super(params);
    this.ctx = ctx;
  }
  async embedDocuments(texts) {
    const embeddings = [];
    if (is_valid4(texts)) {
      for (let i = 0; i < texts.length; i += 1) {
        let text = texts[i];
        const embedding = await this.embedQuery(text);
        embeddings.push(embedding);
      }
    }
    return embeddings;
  }
  async embedQuery(text) {
    console_log4(`[OmniOpenAIEmbeddings] embedQuery: Requested to embed text: ${text.slice(0, 128)}[...]`);
    if (!is_valid4(text)) {
      console_log4(`[OmniOpenAIEmbeddings] WARNING embedQuery: passed text is invalid ${text}`);
      return null;
    }
    console_log4(`[OmniOpenAIEmbeddings] generating embedding for ${text.slice(0, 128)}`);
    try {
      const response = await this.compute_embedding_via_runblock(this.ctx, text);
      console_log4(`[OmniOpenAIEmbeddings] embedQuery: response: ${JSON.stringify(response)}`);
      const embedding = response;
      return embedding;
    } catch (error) {
      console_log4(`[OmniOpenAIEmbeddings] WARNING embedQuery: Error generating embedding via runBlock for ctx=${this.ctx} and text=${text}
Error: ${error}`);
      return null;
    }
  }
  async compute_embedding_via_runblock(ctx, input) {
    let args = {};
    args.user = ctx.userId;
    args.input = input;
    let response = null;
    try {
      response = await runBlock(ctx, "openai.embeddings", args);
    } catch (err) {
      let error_message = `[OmniOpenAIEmbeddings] Error running openai.embeddings: ${err.message}`;
      console.error(error_message);
      throw err;
    }
    if (response == null) {
      throw new Error(`[OmniOpenAIEmbeddings embedding runBlock response is null`);
    }
    ;
    if (response.error) {
      throw new Error(`[OmniOpenAIEmbeddings] embedding runBlock response.error: ${response.error}`);
    }
    let data = response?.data || null;
    if (is_valid4(data) == false) {
      throw new Error(`[OmniOpenAIEmbeddings] embedding runBlock response is invalid: ${JSON.stringify(response)}`);
    }
    ;
    const embedding = response?.data[0]?.embedding || null;
    return embedding;
  }
};

// omnilib-docs/embeddings.js
var EMBEDDER_MODEL_OPENAI = "openai";
var EMBEDDER_MODEL_TENSORFLOW = "tensorflow";
var DEFAULT_EMBEDDER_MODEL = EMBEDDER_MODEL_OPENAI;
async function initializeEmbedder(ctx) {
  const embedder_model = DEFAULT_EMBEDDER_MODEL;
  const hasher_model = DEFAULT_HASHER_MODEL;
  let raw_embedder = null;
  if (embedder_model == EMBEDDER_MODEL_OPENAI) {
    raw_embedder = new Embedding_Openai(ctx);
  } else if (embedder_model == EMBEDDER_MODEL_TENSORFLOW) {
    throw new Error("tensorflow embedding not supported at the moment");
  }
  const embedder = new Embedder(ctx, raw_embedder, hasher_model, embedder_model);
  if (embedder == null || embedder == void 0)
    throw new Error(`get_embedder: Failed to initialize embeddings_model ${embedder_model}`);
  return embedder;
}

// omnilib-docs/vectorstore.js
import { is_valid as is_valid5, user_db_put as user_db_put2, user_db_get as user_db_get2, get_cached_cdn as get_cached_cdn2, get_json_from_cdn } from "../../../src/utils/omni-utils.js";

// node_modules/langchain/dist/vectorstores/memory.js
var import_ml_distance = __toESM(require_lib5(), 1);

// node_modules/langchain/dist/schema/retriever.js
var BaseRetriever = class extends Runnable {
  constructor(fields) {
    super(fields);
    Object.defineProperty(this, "callbacks", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "tags", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "metadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "verbose", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.callbacks = fields?.callbacks;
    this.tags = fields?.tags ?? [];
    this.metadata = fields?.metadata ?? {};
    this.verbose = fields?.verbose ?? false;
  }
  /**
   * TODO: This should be an abstract method, but we'd like to avoid breaking
   * changes to people currently using subclassed custom retrievers.
   * Change it on next major release.
   */
  _getRelevantDocuments(_query, _callbacks) {
    throw new Error("Not implemented!");
  }
  async invoke(input, options) {
    return this.getRelevantDocuments(input, options);
  }
  /**
   * Main method used to retrieve relevant documents. It takes a query
   * string and an optional configuration object, and returns a promise that
   * resolves to an array of `Document` objects. This method handles the
   * retrieval process, including starting and ending callbacks, and error
   * handling.
   * @param query The query string to retrieve relevant documents for.
   * @param config Optional configuration object for the retrieval process.
   * @returns A promise that resolves to an array of `Document` objects.
   */
  async getRelevantDocuments(query, config) {
    const parsedConfig = parseCallbackConfigArg(config);
    const callbackManager_ = await CallbackManager.configure(parsedConfig.callbacks, this.callbacks, parsedConfig.tags, this.tags, parsedConfig.metadata, this.metadata, { verbose: this.verbose });
    const runManager = await callbackManager_?.handleRetrieverStart(this.toJSON(), query);
    try {
      const results = await this._getRelevantDocuments(query, runManager);
      await runManager?.handleRetrieverEnd(results);
      return results;
    } catch (error) {
      await runManager?.handleRetrieverError(error);
      throw error;
    }
  }
};

// node_modules/langchain/dist/vectorstores/base.js
var VectorStoreRetriever = class extends BaseRetriever {
  static lc_name() {
    return "VectorStoreRetriever";
  }
  get lc_namespace() {
    return ["langchain", "retrievers", "base"];
  }
  _vectorstoreType() {
    return this.vectorStore._vectorstoreType();
  }
  constructor(fields) {
    super(fields);
    Object.defineProperty(this, "vectorStore", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "k", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 4
    });
    Object.defineProperty(this, "searchType", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "similarity"
    });
    Object.defineProperty(this, "searchKwargs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "filter", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.vectorStore = fields.vectorStore;
    this.k = fields.k ?? this.k;
    this.searchType = fields.searchType ?? this.searchType;
    this.filter = fields.filter;
    if (fields.searchType === "mmr") {
      this.searchKwargs = fields.searchKwargs;
    }
  }
  async _getRelevantDocuments(query, runManager) {
    if (this.searchType === "mmr") {
      if (typeof this.vectorStore.maxMarginalRelevanceSearch !== "function") {
        throw new Error(`The vector store backing this retriever, ${this._vectorstoreType()} does not support max marginal relevance search.`);
      }
      return this.vectorStore.maxMarginalRelevanceSearch(query, {
        k: this.k,
        filter: this.filter,
        ...this.searchKwargs
      }, runManager?.getChild("vectorstore"));
    }
    return this.vectorStore.similaritySearch(query, this.k, this.filter, runManager?.getChild("vectorstore"));
  }
  async addDocuments(documents, options) {
    return this.vectorStore.addDocuments(documents, options);
  }
};
var VectorStore = class extends Serializable {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(embeddings, dbConfig) {
    super(dbConfig);
    Object.defineProperty(this, "lc_namespace", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ["langchain", "vectorstores", this._vectorstoreType()]
    });
    Object.defineProperty(this, "embeddings", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.embeddings = embeddings;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async delete(_params) {
    throw new Error("Not implemented.");
  }
  async similaritySearch(query, k = 4, filter = void 0, _callbacks = void 0) {
    const results = await this.similaritySearchVectorWithScore(await this.embeddings.embedQuery(query), k, filter);
    return results.map((result) => result[0]);
  }
  async similaritySearchWithScore(query, k = 4, filter = void 0, _callbacks = void 0) {
    return this.similaritySearchVectorWithScore(await this.embeddings.embedQuery(query), k, filter);
  }
  static fromTexts(_texts, _metadatas, _embeddings, _dbConfig) {
    throw new Error("the Langchain vectorstore implementation you are using forgot to override this, please report a bug");
  }
  static fromDocuments(_docs, _embeddings, _dbConfig) {
    throw new Error("the Langchain vectorstore implementation you are using forgot to override this, please report a bug");
  }
  asRetriever(kOrFields, filter, callbacks, tags, metadata, verbose) {
    if (typeof kOrFields === "number") {
      return new VectorStoreRetriever({
        vectorStore: this,
        k: kOrFields,
        filter,
        tags: [...tags ?? [], this._vectorstoreType()],
        metadata,
        verbose,
        callbacks
      });
    } else {
      const params = {
        vectorStore: this,
        k: kOrFields?.k,
        filter: kOrFields?.filter,
        tags: [...kOrFields?.tags ?? [], this._vectorstoreType()],
        metadata: kOrFields?.metadata,
        verbose: kOrFields?.verbose,
        callbacks: kOrFields?.callbacks,
        searchType: kOrFields?.searchType
      };
      if (kOrFields?.searchType === "mmr") {
        return new VectorStoreRetriever({
          ...params,
          searchKwargs: kOrFields.searchKwargs
        });
      }
      return new VectorStoreRetriever({ ...params });
    }
  }
};

// node_modules/langchain/dist/vectorstores/memory.js
var MemoryVectorStore = class _MemoryVectorStore extends VectorStore {
  _vectorstoreType() {
    return "memory";
  }
  constructor(embeddings, { similarity, ...rest } = {}) {
    super(embeddings, rest);
    Object.defineProperty(this, "memoryVectors", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "similarity", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.similarity = similarity ?? import_ml_distance.similarity.cosine;
  }
  /**
   * Method to add documents to the memory vector store. It extracts the
   * text from each document, generates embeddings for them, and adds the
   * resulting vectors to the store.
   * @param documents Array of `Document` instances to be added to the store.
   * @returns Promise that resolves when all documents have been added.
   */
  async addDocuments(documents) {
    const texts = documents.map(({ pageContent }) => pageContent);
    return this.addVectors(await this.embeddings.embedDocuments(texts), documents);
  }
  /**
   * Method to add vectors to the memory vector store. It creates
   * `MemoryVector` instances for each vector and document pair and adds
   * them to the store.
   * @param vectors Array of vectors to be added to the store.
   * @param documents Array of `Document` instances corresponding to the vectors.
   * @returns Promise that resolves when all vectors have been added.
   */
  async addVectors(vectors, documents) {
    const memoryVectors = vectors.map((embedding, idx) => ({
      content: documents[idx].pageContent,
      embedding,
      metadata: documents[idx].metadata
    }));
    this.memoryVectors = this.memoryVectors.concat(memoryVectors);
  }
  /**
   * Method to perform a similarity search in the memory vector store. It
   * calculates the similarity between the query vector and each vector in
   * the store, sorts the results by similarity, and returns the top `k`
   * results along with their scores.
   * @param query Query vector to compare against the vectors in the store.
   * @param k Number of top results to return.
   * @param filter Optional filter function to apply to the vectors before performing the search.
   * @returns Promise that resolves with an array of tuples, each containing a `Document` and its similarity score.
   */
  async similaritySearchVectorWithScore(query, k, filter) {
    const filterFunction = (memoryVector) => {
      if (!filter) {
        return true;
      }
      const doc = new Document({
        metadata: memoryVector.metadata,
        pageContent: memoryVector.content
      });
      return filter(doc);
    };
    const filteredMemoryVectors = this.memoryVectors.filter(filterFunction);
    const searches = filteredMemoryVectors.map((vector, index) => ({
      similarity: this.similarity(query, vector.embedding),
      index
    })).sort((a, b) => a.similarity > b.similarity ? -1 : 0).slice(0, k);
    const result = searches.map((search) => [
      new Document({
        metadata: filteredMemoryVectors[search.index].metadata,
        pageContent: filteredMemoryVectors[search.index].content
      }),
      search.similarity
    ]);
    return result;
  }
  /**
   * Static method to create a `MemoryVectorStore` instance from an array of
   * texts. It creates a `Document` for each text and metadata pair, and
   * adds them to the store.
   * @param texts Array of texts to be added to the store.
   * @param metadatas Array or single object of metadata corresponding to the texts.
   * @param embeddings `Embeddings` instance used to generate embeddings for the texts.
   * @param dbConfig Optional `MemoryVectorStoreArgs` to configure the `MemoryVectorStore` instance.
   * @returns Promise that resolves with a new `MemoryVectorStore` instance.
   */
  static async fromTexts(texts, metadatas, embeddings, dbConfig) {
    const docs = [];
    for (let i = 0; i < texts.length; i += 1) {
      const metadata = Array.isArray(metadatas) ? metadatas[i] : metadatas;
      const newDoc = new Document({
        pageContent: texts[i],
        metadata
      });
      docs.push(newDoc);
    }
    return _MemoryVectorStore.fromDocuments(docs, embeddings, dbConfig);
  }
  /**
   * Static method to create a `MemoryVectorStore` instance from an array of
   * `Document` instances. It adds the documents to the store.
   * @param docs Array of `Document` instances to be added to the store.
   * @param embeddings `Embeddings` instance used to generate embeddings for the documents.
   * @param dbConfig Optional `MemoryVectorStoreArgs` to configure the `MemoryVectorStore` instance.
   * @returns Promise that resolves with a new `MemoryVectorStore` instance.
   */
  static async fromDocuments(docs, embeddings, dbConfig) {
    const instance = new this(embeddings, dbConfig);
    await instance.addDocuments(docs);
    return instance;
  }
  /**
   * Static method to create a `MemoryVectorStore` instance from an existing
   * index. It creates a new `MemoryVectorStore` instance without adding any
   * documents or vectors.
   * @param embeddings `Embeddings` instance used to generate embeddings for the documents.
   * @param dbConfig Optional `MemoryVectorStoreArgs` to configure the `MemoryVectorStore` instance.
   * @returns Promise that resolves with a new `MemoryVectorStore` instance.
   */
  static async fromExistingIndex(embeddings, dbConfig) {
    const instance = new this(embeddings, dbConfig);
    return instance;
  }
};

// omnilib-docs/vectorstore_Memory.js
async function memoryFromTexts(texts, text_ids, embedder) {
  const result = await MemoryVectorStore.fromTexts(texts, text_ids, embedder);
  return result;
}

// omnilib-docs/vectorstore.js
var FAISS_VECTORSTORE = "FAISS";
var MEMORY_VECTORSTORE = "MEMORY";
var LANCEDB_VECTORSTORE = "LANCEDB";
var DEFAULT_VECTORSTORE_TYPE = MEMORY_VECTORSTORE;
async function createVectorstoreFromChunks(chunks, embedder, vectorstore_type = DEFAULT_VECTORSTORE_TYPE) {
  const texts = getChunksTexts(chunks);
  let vectorstore;
  switch (vectorstore_type) {
    case FAISS_VECTORSTORE:
      vectorstore = null;
      break;
    case MEMORY_VECTORSTORE:
      vectorstore = await memoryFromTexts(texts, chunks, embedder);
      break;
    case LANCEDB_VECTORSTORE:
      vectorstore = null;
      break;
    default:
      throw new Error(`Vectorstore type ${vectorstore_type} not recognized`);
  }
  return vectorstore;
}
async function queryVectorstore(vector_store, query, nb_of_results = 1, embedder) {
  const vector_query = await embedder.embedQuery(query, false);
  const results = await vector_store.similaritySearchVectorWithScore(vector_query, nb_of_results);
  return results;
}
function getChunksTexts(chunks) {
  if (is_valid5(chunks) == false)
    throw new Error(`get_texts_and_ids: chunks_list is invalid`);
  let chunk_texts = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunk_text = chunk.text;
    chunk_texts.push(chunk_text);
  }
  return chunk_texts;
}
var INDEXES_LIST = "omni_indexes_list";
async function loadIndexes(ctx) {
  const loadedData = await user_db_get2(ctx, INDEXES_LIST);
  const indexes = loadedData || {};
  return indexes;
}
function addCdnToIndex(indexes, indexed_document_info, index_name) {
  if (index_name in indexes === false || indexes[index_name] === null || indexes[index_name] === void 0 || Array.isArray(indexes[index_name]) === false) {
    indexes[index_name] = [indexed_document_info];
  } else {
    indexes[index_name].push(indexed_document_info);
  }
}
function readCdnsFromIndex(indexes, index_name) {
  if (index_name in indexes === false || indexes[index_name] === null || indexes[index_name] === void 0 || Array.isArray(indexes[index_name]) === false)
    return null;
  const indexed_document_cdns = indexes[index_name];
  return indexed_document_cdns;
}
async function saveIndexes(ctx, indexes) {
  await user_db_put2(ctx, indexes, INDEXES_LIST);
}
async function getDocumentsIndexes(ctx) {
  const loadedData = await user_db_get2(ctx, INDEXES_LIST);
  let indexes = loadedData || null;
  if (!indexes || Object.keys(indexes).length == 0) {
    indexes = {};
    await user_db_put2(ctx, indexes, INDEXES_LIST);
  }
  const relevantIndexes = [];
  for (const key in indexes) {
    if (indexes.hasOwnProperty(key)) {
      const value = indexes[key];
      if (Array.isArray(value) && value.length > 0) {
        relevantIndexes.push({ key, length: value.length });
      }
    }
  }
  return relevantIndexes;
}
async function getIndexedDocumentCdnFromId(ctx, document_id, overwrite = false) {
  const document_cdn = await get_cached_cdn2(ctx, document_id, overwrite);
  return document_cdn;
}
async function getIndexedDocumentInfoFromCdn(ctx, document_cdn) {
  const document_info = await get_json_from_cdn(ctx, document_cdn);
  if (!document_info)
    throw new Error(`ERROR: could not get document_json from cdn`);
  return document_info;
}
async function getChunksFromIndexAndIndexedDocuments(ctx, indexes, index, indexed_documents) {
  let all_chunks = [];
  let indexed_document_cdns = [];
  if (index && index != "")
    indexed_document_cdns = readCdnsFromIndex(indexes, index);
  if (indexed_documents && Array.isArray(indexed_documents) && indexed_documents.length > 0)
    indexed_document_cdns = indexed_document_cdns.concat(indexed_documents);
  if (!indexed_document_cdns || Array.isArray(indexed_document_cdns) == false)
    throw new Error(`Error no documents passed either as an Index or directly.`);
  for (const indexed_document_cdn of indexed_document_cdns) {
    const document_info = await getIndexedDocumentInfoFromCdn(ctx, indexed_document_cdn);
    if (!document_info)
      throw new Error(`ERROR: could not get document_info from cdn ${JSON.stringify(indexed_document_cdn)}`);
    const indexed_document_chunks = document_info.chunks;
    if (!indexed_document_chunks || Array.isArray(indexed_document_chunks) == false || indexed_document_chunks.length == 0)
      continue;
    all_chunks = all_chunks.concat(indexed_document_chunks);
  }
  return all_chunks;
}

// component_IndexDocuments.js
var NAMESPACE = "document_processing";
var OPERATION_ID = "index_documents";
var TITLE = "Index documents";
var DESCRIPTION = "Index document(s), chunking them and computing the embedding for each chunk";
var SUMMARY = "Index document(s), chunking them and computing the embedding for each chunk";
var CATEGORY = "document processing";
var inputs = [
  { name: "documents", title: "Documents to index", type: "array", customSocket: "documentArray", description: "Documents to be indexed", allowMultiple: true },
  { name: "text", type: "string", title: "Text to index", customSocket: "text", description: "And/or some Text to be indexed directly", allowMultiple: true },
  { name: "splitter_model", type: "string", defaultValue: "RecursiveCharacterTextSplitter", title: "Splitter Model", description: "Choosing a splitter model that matches the type of document being indexed will produce the best results", choices: getSplitterChoices() },
  { name: "chunk_size", type: "number", defaultValue: 4096, minimum: 0, maximum: 1e6, step: 1 },
  { name: "chunk_overlap", type: "number", defaultValue: 512, minimum: 0, maximum: 5e5, step: 1 },
  { name: "overwrite", type: "boolean", defaultValue: false, description: "If set to true, will overwrite existing matching documents" },
  { name: "index", type: "string", description: "All indexed documents sharing the same index will be grouped and queried together" }
];
var outputs = [
  { name: "info", type: "string", customSocket: "text", description: "Info on the result of the indexation" },
  { name: "index", type: "string", customSocket: "text", description: "The name of the index that was created or updated" },
  { name: "documents", title: "Indexed Documents", type: "array", customSocket: "documentArray", description: "The indexed version of the documents" }
];
var links = {};
var controls = null;
var IndexDocumentsComponent = createComponent(NAMESPACE, OPERATION_ID, TITLE, CATEGORY, DESCRIPTION, SUMMARY, links, inputs, outputs, controls, indexDocuments_function);
async function indexDocuments_function(payload, ctx) {
  console.time("indexDocuments_function");
  const hasher_model = DEFAULT_HASHER_MODEL;
  let info = "";
  const documents_cdns = payload.documents || [];
  const text = payload.text;
  const overwrite = payload.overwrite || false;
  const splitter_model = payload.splitter_model || DEFAULT_SPLITTER_MODEL;
  const chunk_size = payload.chunk_size || DEFAULT_CHUNK_SIZE;
  const chunk_overlap = payload.chunk_overlap || DEFAULT_CHUNK_OVERLAP;
  const index = payload.index || "";
  const hasher = initialize_hasher(hasher_model);
  const splitter = initializeSplitter(splitter_model, chunk_size, chunk_overlap);
  const embedder = await initializeEmbedder(ctx);
  const all_indexes = await loadIndexes(ctx);
  if (text && text.length > 0) {
    const text_cdn = await uploadTextWithCaching(ctx, text, hasher, chunk_size, chunk_overlap, overwrite);
    if (!text_cdn)
      throw new Error(`ERROR: could not upload Text to CDN`);
    documents_cdns.push(text_cdn);
    info += `Uploaded text to CDN with fid ${text_cdn.fid} 
`;
  }
  if (!documents_cdns || documents_cdns.length == 0)
    throw new Error(`ERROR: no documents passed for ingestion`);
  const documents_texts = await downloadTextsFromCdn(ctx, documents_cdns);
  let all_chunks = [];
  let all_cdns = [];
  let document_number = 0;
  for (const document_text of documents_texts) {
    let indexed_document_chunks = null;
    const document_id = computeDocumentId(ctx, [document_text], hasher, chunk_size, chunk_overlap);
    if (!document_id)
      throw new Error(`ERROR: could not compute document_id for document #${document_number}, id:${document_id}`);
    let indexed_document_cdn = await getIndexedDocumentCdnFromId(ctx, document_id, overwrite);
    if (!indexed_document_cdn) {
      indexed_document_chunks = await chunkText(ctx, document_id, document_text, hasher, embedder, splitter, countTokensFunction);
      if (!indexed_document_chunks)
        throw new Error(`ERROR: could not chunk text in document #${document_number}, id:${document_id}`);
      const token_to_chunking_size_ratio = computeTokenToChunkingSizeRatio(indexed_document_chunks, chunk_size, chunk_overlap);
      indexed_document_cdn = await saveIndexedDocument(ctx, document_id, indexed_document_chunks, chunk_size, chunk_overlap, token_to_chunking_size_ratio, splitter_model);
    } else {
      const document_info = await getIndexedDocumentInfoFromCdn(ctx, indexed_document_cdn);
      if (!document_info)
        throw new Error(`ERROR: could not get document_info from cdn ${JSON.stringify(indexed_document_cdn)}`);
      indexed_document_chunks = document_info.chunks;
      if (!indexed_document_chunks)
        throw new Error(`ERROR: could not get chunks from document_info = ${JSON.stringify(document_info)} from cdn ${JSON.stringify(indexed_document_cdn)}`);
    }
    if (!indexed_document_cdn)
      throw new Error(`ERROR: could not chunk document #${document_number}, id:${document_id}`);
    if (index && index != "") {
      addCdnToIndex(all_indexes, indexed_document_cdn, index);
      info += `Uploaded document #${document_number} to CDN with fid ${indexed_document_cdn.fid} and id: ${document_id}
`;
    }
    all_chunks = all_chunks.concat(indexed_document_chunks);
    all_cdns.push(indexed_document_cdn);
    document_number += 1;
  }
  if (index && index != "") {
    saveIndexes(ctx, all_indexes);
    info += `Saved Indexes to DB
`;
  }
  info += `Indexed ${documents_texts.length} documents in ${all_chunks.length} fragments into Index: ${index} 
`;
  info += `Done`;
  console.timeEnd("indexDocuments_function");
  return { result: { "ok": true }, documents: all_cdns, index, info };
}

// component_QueryIndexBruteforce.js
import { createComponent as createComponent2, is_valid as is_valid6, sanitizeJSON, combineStringsWithoutOverlap, queryLlmByModelId, getLlmChoices, getModelMaxSize, getModelNameAndProviderFromId } from "../../../src/utils/omni-utils.js";
var NAMESPACE2 = "document_processing";
var OPERATION_ID2 = "query_index_bruteforce";
var TITLE2 = "Query Index (Brute Force)";
var DESCRIPTION2 = "Run a LLM on an array of documents, one fragment at a time, and return the results in an array";
var SUMMARY2 = DESCRIPTION2;
var CATEGORY2 = "document processing";
async function async_getQueryIndexBruteforceComponent() {
  const llm_choices = await getLlmChoices();
  const links3 = {};
  const inputs3 = [
    { name: "indexed_documents", type: "array", customSocket: "documentArray", description: "Documents to be processed" },
    { name: "instruction", type: "string", description: "Instruction(s)", defaultValue: "You are a helpful bot answering the user with their question to the best of your abilities", customSocket: "text" },
    { name: "temperature", type: "number", defaultValue: 0 },
    { name: "model_id", title: "model", type: "string", defaultValue: "gpt-3.5-turbo-16k|openai", choices: llm_choices },
    { name: "index", type: "string", description: "All indexed documents sharing the same Index will be grouped and queried together" },
    { name: "chunk_size", type: "number", defaultValue: 0, minimum: 0, maximum: 1e6, step: 1, description: "If set to a positive number, will concatenate document fragments to fit within that size (in tokens). If set to 0, will try to use the maximum size of the model (with some margin)" },
    { name: "llm_args", type: "object", customSocket: "object", description: "Extra arguments provided to the LLM" }
  ];
  const outputs3 = [
    { name: "answer", type: "string", customSocket: "text", description: "The answer to the query or prompt", title: "Answer" },
    { name: "json", type: "object", customSocket: "object", description: "The answer in json format, with possibly extra arguments returned by the LLM", title: "Json" }
  ];
  const controls3 = null;
  const component = createComponent2(NAMESPACE2, OPERATION_ID2, TITLE2, CATEGORY2, DESCRIPTION2, SUMMARY2, links3, inputs3, outputs3, controls3, queryIndexBruteforce);
  return component;
}
async function queryIndexBruteforce(payload, ctx) {
  console.time("queryIndexBruteforce");
  const indexed_documents = payload.indexed_documents;
  const index = payload.index;
  const all_indexes = await loadIndexes(ctx);
  const instruction = payload.instruction;
  const temperature = payload.temperature;
  const model_id = payload.model_id;
  const chunk_size = payload.chunk_size;
  const llm_args = payload.llm_args;
  const splits = getModelNameAndProviderFromId(model_id);
  const model_name = splits.model_name;
  let max_size = chunk_size;
  if (chunk_size == 0) {
    max_size = getModelMaxSize(model_name);
  } else if (chunk_size > 0) {
    max_size = Math.min(chunk_size, getModelMaxSize(model_name));
  }
  const chunks = await getChunksFromIndexAndIndexedDocuments(ctx, all_indexes, index, indexed_documents);
  let chunk_index = 0;
  let total_token_cost = 0;
  let combined_text = "";
  let llm_results = [];
  let answer_text = "";
  for (const chunk of chunks) {
    const text = chunk?.text;
    if (!is_valid6(text))
      continue;
    const token_cost = chunk.token_count;
    const can_fit = total_token_cost + token_cost <= max_size;
    const is_last_index = chunk_index == chunks.length - 1;
    if (can_fit) {
      combined_text = combineStringsWithoutOverlap(combined_text, text);
      total_token_cost += token_cost;
    }
    if (!can_fit || is_last_index) {
      const gpt_results = await queryLlmByModelId(ctx, combined_text, instruction, model_id, temperature, llm_args);
      const sanetized_results = sanitizeJSON(gpt_results);
      const chunk_result = { text: sanetized_results?.answer_text || "", function_arguments_string: sanetized_results?.answer_json?.function_arguments_string, function_arguments: sanetized_results?.answer_json?.function_arguments };
      llm_results.push(chunk_result);
      const answer = chunk_result.text;
      if (answer && answer.length > 0) {
        answer_text += answer + "\n\n";
      }
      combined_text = text;
      total_token_cost = token_cost;
    }
    chunk_index += 1;
  }
  const response = { result: { "ok": true }, answer: answer_text, json: { "answers": llm_results } };
  console.timeEnd("queryIndexBruteforce");
  return response;
}

// component_QueryIndex.js
import { createComponent as createComponent3 } from "../../../src/utils/omni-utils.js";
import { getLlmChoices as getLlmChoices2, DEFAULT_LLM_MODEL_ID } from "../../../src/utils/omni-utils.js";

// smartquery.js
import { queryLlmByModelId as queryLlmByModelId2, getModelMaxSize as getModelMaxSize2, console_log as console_log5, console_warn, is_valid as is_valid7, getModelNameAndProviderFromId as getModelNameAndProviderFromId2 } from "../../../src/utils/omni-utils.js";
async function smartqueryFromVectorstore(ctx, vectorstore, query, embedder, model_id) {
  const splits = getModelNameAndProviderFromId2(model_id);
  const model_name = splits.model_name;
  if (is_valid7(query) == false)
    throw new Error(`ERROR: query is invalid`);
  let vectorstore_responses = await queryVectorstore(vectorstore, query, 10, embedder);
  let total_tokens = 0;
  let max_size = getModelMaxSize2(model_name) * 0.8;
  let combined_text = "";
  let text_json = [];
  const already_used_ids = {};
  for (let i = 0; i < vectorstore_responses.length; i++) {
    const vectorestore_response_array = vectorstore_responses[i];
    const [vectorstore_response, score] = vectorestore_response_array;
    console_log5(`vectorstore_responses[${i}] score = ${score}`);
    const chunk = vectorstore_response?.metadata;
    const chunk_id = chunk?.id;
    if (already_used_ids[chunk_id] == true)
      continue;
    already_used_ids[chunk_id] = true;
    const raw_text = vectorstore_response?.pageContent;
    const chunk_source = chunk?.source;
    const chunk_index = chunk?.index;
    text_json.push({ fragment_text: raw_text, fragment_id: chunk_id });
    const token_cost = chunk?.token_count + 50;
    if (total_tokens + token_cost > max_size)
      break;
    total_tokens += token_cost;
  }
  combined_text = JSON.stringify(text_json);
  console_warn(`combined_text = 
${combined_text}`);
  const instruction = `Based on the provided document fragments, answer the user' question and provide citations to each fragment_id you use in your answer. For example, say 'Alice is married to Bob [fragment_id] and they have one son [fragment_id]`;
  const prompt = `Document Json:
${combined_text}
User's question: ${query}`;
  const response = await queryLlmByModelId2(ctx, prompt, instruction, model_id);
  const answer_text = response?.answer_text || null;
  if (is_valid7(answer_text) == false)
    throw new Error(`ERROR: query_answer is invalid`);
  console_warn(`instruction = 
${instruction}`);
  console_warn(`prompt = 
${prompt}`);
  return answer_text;
}

// component_QueryIndex.js
var NAMESPACE3 = "document_processing";
var OPERATION_ID3 = "query_index";
var TITLE3 = "Query Index";
var DESCRIPTION3 = "Answer the Query using all document in the given Index, using OpenAI embeddings and Langchain";
var SUMMARY3 = "Answer the Query using all document in the given Index, using OpenAI embeddings and Langchain";
var CATEGORY3 = "document processing";
async function async_getQueryIndexComponent() {
  const links3 = {
    "Langchainjs Website": "https://docs.langchain.com/docs/",
    "Documentation": "https://js.langchain.com/docs/",
    "Langchainjs Github": "https://github.com/hwchase17/langchainjs"
  };
  const llm_choices = await getLlmChoices2();
  const inputs3 = [
    { name: "query", type: "string", customSocket: "text" },
    { name: "indexed_documents", title: "Indexed Documents to Query", type: "array", customSocket: "documentArray", description: "Documents to be directly queried instead of being passed as an Index", allowMultiple: true },
    { name: "model_id", type: "string", defaultValue: DEFAULT_LLM_MODEL_ID, choices: llm_choices },
    { name: "index", type: "string", description: "All indexed documents sharing the same Index will be grouped and queried together" }
  ];
  const outputs3 = [
    { name: "answer", type: "string", customSocket: "text", description: "The answer to the query", title: "Answer" }
  ];
  const controls3 = null;
  const component = createComponent3(NAMESPACE3, OPERATION_ID3, TITLE3, CATEGORY3, DESCRIPTION3, SUMMARY3, links3, inputs3, outputs3, controls3, queryIndex);
  return component;
}
async function queryIndex(payload, ctx) {
  console.time("queryIndex");
  const query = payload.query;
  const model_id = payload.model_id;
  const indexed_documents = payload.indexed_documents;
  const index = payload.index || "";
  const embedder = await initializeEmbedder(ctx);
  if (!embedder)
    throw new Error(`Cannot initialize embedded`);
  const all_indexes = await loadIndexes(ctx);
  if (!all_indexes)
    throw new Error(`[query_chunks_component] Error loading indexes`);
  if (!index || index == "") {
    if (!indexed_documents || indexed_documents.length == 0)
      throw new Error(`Without passing an index, you need to pass at least one document to query`);
  } else {
    if (index in all_indexes == false)
      throw new Error(`Index ${index} not found in indexes`);
  }
  const all_chunks = await getChunksFromIndexAndIndexedDocuments(ctx, all_indexes, index, indexed_documents);
  const vectorstore = await createVectorstoreFromChunks(all_chunks, embedder);
  if (!vectorstore)
    throw new Error(`ERROR: could not compute Index ${index} from ${all_chunks.length} fragments`);
  const query_result = await smartqueryFromVectorstore(ctx, vectorstore, query, embedder, model_id);
  console.timeEnd("queryIndex");
  return { result: { "ok": true }, answer: query_result };
}

// component_GetDocumentsIndexes.js
import { createComponent as createComponent4 } from "../../../src/utils/omni-utils.js";
var NAMESPACE4 = "document_processing";
var OPERATION_ID4 = "get_documents_indexes";
var TITLE4 = "Get Documents Indexes";
var DESCRIPTION4 = "Get information about the non-empty Indexes currently present";
var SUMMARY4 = "Get information about the non-empty Indexes currently present";
var CATEGORY4 = "document processing";
var inputs2 = [];
var outputs2 = [
  { name: "indexes", type: "array", description: "An array of all the Index names in the database" },
  { name: "info", type: "string", description: "Info on all the indexes in the database" }
];
var links2 = {};
var controls2 = null;
var DocumentsIndexesComponent = createComponent4(NAMESPACE4, OPERATION_ID4, TITLE4, CATEGORY4, DESCRIPTION4, SUMMARY4, links2, inputs2, outputs2, controls2, getDocumentsIndexes_function);
async function getDocumentsIndexes_function(payload, ctx) {
  console.time("getDocumentsIndexes_function");
  let indexes_info = await getDocumentsIndexes(ctx);
  if (!indexes_info)
    return { result: { "ok": false }, indexes: [] };
  let indexes = [];
  let info = `Indexes in the database: ${indexes_info.length}, 
`;
  for (const index of indexes_info) {
    indexes.push(index.key);
    info += `${index.key} : ${index.length} documents, 
`;
  }
  return { result: { "ok": true }, indexes, info };
}

// extension.js
async function CreateComponents() {
  const LoopGPTComponent = await async_getQueryIndexBruteforceComponent();
  const QueryIndexComponent = await async_getQueryIndexComponent();
  const components = [
    IndexDocumentsComponent,
    LoopGPTComponent,
    QueryIndexComponent,
    DocumentsIndexesComponent
  ];
  return {
    blocks: components,
    patches: []
  };
}
var extension_default = { createComponents: CreateComponents };
export {
  extension_default as default
};
