(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

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
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(require,module,exports){
var Vue // late bind
var map = window.__VUE_HOT_MAP__ = Object.create(null)
var installed = false
var isBrowserify = false
var initHookName = 'beforeCreate'

exports.install = function (vue, browserify) {
  if (installed) return
  installed = true

  Vue = vue
  isBrowserify = browserify

  // compat with < 2.0.0-alpha.7
  if (Vue.config._lifecycleHooks.indexOf('init') > -1) {
    initHookName = 'init'
  }

  exports.compatible = Number(Vue.version.split('.')[0]) >= 2
  if (!exports.compatible) {
    console.warn(
      '[HMR] You are using a version of vue-hot-reload-api that is ' +
      'only compatible with Vue.js core ^2.0.0.'
    )
    return
  }
}

/**
 * Create a record for a hot module, which keeps track of its constructor
 * and instances
 *
 * @param {String} id
 * @param {Object} options
 */

exports.createRecord = function (id, options) {
  var Ctor = null
  if (typeof options === 'function') {
    Ctor = options
    options = Ctor.options
  }
  makeOptionsHot(id, options)
  map[id] = {
    Ctor: Vue.extend(options),
    instances: []
  }
}

/**
 * Make a Component options object hot.
 *
 * @param {String} id
 * @param {Object} options
 */

function makeOptionsHot (id, options) {
  injectHook(options, initHookName, function () {
    map[id].instances.push(this)
  })
  injectHook(options, 'beforeDestroy', function () {
    var instances = map[id].instances
    instances.splice(instances.indexOf(this), 1)
  })
}

/**
 * Inject a hook to a hot reloadable component so that
 * we can keep track of it.
 *
 * @param {Object} options
 * @param {String} name
 * @param {Function} hook
 */

function injectHook (options, name, hook) {
  var existing = options[name]
  options[name] = existing
    ? Array.isArray(existing)
      ? existing.concat(hook)
      : [existing, hook]
    : [hook]
}

function tryWrap (fn) {
  return function (id, arg) {
    try { fn(id, arg) } catch (e) {
      console.error(e)
      console.warn('Something went wrong during Vue component hot-reload. Full reload required.')
    }
  }
}

exports.rerender = tryWrap(function (id, fns) {
  var record = map[id]
  record.Ctor.options.render = fns.render
  record.Ctor.options.staticRenderFns = fns.staticRenderFns
  record.instances.slice().forEach(function (instance) {
    instance.$options.render = fns.render
    instance.$options.staticRenderFns = fns.staticRenderFns
    instance._staticTrees = [] // reset static trees
    instance.$forceUpdate()
  })
})

exports.reload = tryWrap(function (id, options) {
  makeOptionsHot(id, options)
  var record = map[id]
  record.Ctor.extendOptions = options
  var newCtor = Vue.extend(options)
  record.Ctor.options = newCtor.options
  record.Ctor.cid = newCtor.cid
  if (newCtor.release) {
    // temporary global mixin strategy used in < 2.0.0-alpha.6
    newCtor.release()
  }
  record.instances.slice().forEach(function (instance) {
    if (instance.$parent) {
      instance.$parent.$forceUpdate()
    } else {
      console.warn('Root or manually mounted instance modified. Full reload required.')
    }
  })
})

},{}],3:[function(require,module,exports){
(function (process,global){
/*!
 * Vue.js v2.1.10
 * (c) 2014-2017 Evan You
 * Released under the MIT License.
 */
'use strict';

/*  */

/**
 * Convert a value to a string that is actually rendered.
 */
function _toString (val) {
  return val == null
    ? ''
    : typeof val === 'object'
      ? JSON.stringify(val, null, 2)
      : String(val)
}

/**
 * Convert a input value to a number for persistence.
 * If the conversion fails, return original string.
 */
function toNumber (val) {
  var n = parseFloat(val);
  return isNaN(n) ? val : n
}

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 */
function makeMap (
  str,
  expectsLowerCase
) {
  var map = Object.create(null);
  var list = str.split(',');
  for (var i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase
    ? function (val) { return map[val.toLowerCase()]; }
    : function (val) { return map[val]; }
}

/**
 * Check if a tag is a built-in tag.
 */
var isBuiltInTag = makeMap('slot,component', true);

/**
 * Remove an item from an array
 */
function remove$1 (arr, item) {
  if (arr.length) {
    var index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

/**
 * Check whether the object has the property.
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

/**
 * Check if value is primitive
 */
function isPrimitive (value) {
  return typeof value === 'string' || typeof value === 'number'
}

/**
 * Create a cached version of a pure function.
 */
function cached (fn) {
  var cache = Object.create(null);
  return (function cachedFn (str) {
    var hit = cache[str];
    return hit || (cache[str] = fn(str))
  })
}

/**
 * Camelize a hyphen-delimited string.
 */
var camelizeRE = /-(\w)/g;
var camelize = cached(function (str) {
  return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
});

/**
 * Capitalize a string.
 */
var capitalize = cached(function (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
});

/**
 * Hyphenate a camelCase string.
 */
var hyphenateRE = /([^-])([A-Z])/g;
var hyphenate = cached(function (str) {
  return str
    .replace(hyphenateRE, '$1-$2')
    .replace(hyphenateRE, '$1-$2')
    .toLowerCase()
});

/**
 * Simple bind, faster than native
 */
function bind$1 (fn, ctx) {
  function boundFn (a) {
    var l = arguments.length;
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }
  // record original fn length
  boundFn._length = fn.length;
  return boundFn
}

/**
 * Convert an Array-like object to a real Array.
 */
function toArray (list, start) {
  start = start || 0;
  var i = list.length - start;
  var ret = new Array(i);
  while (i--) {
    ret[i] = list[i + start];
  }
  return ret
}

/**
 * Mix properties into target object.
 */
function extend (to, _from) {
  for (var key in _from) {
    to[key] = _from[key];
  }
  return to
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 */
function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
var toString = Object.prototype.toString;
var OBJECT_STRING = '[object Object]';
function isPlainObject (obj) {
  return toString.call(obj) === OBJECT_STRING
}

/**
 * Merge an Array of Objects into a single Object.
 */
function toObject (arr) {
  var res = {};
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i]);
    }
  }
  return res
}

/**
 * Perform no operation.
 */
function noop () {}

/**
 * Always return false.
 */
var no = function () { return false; };

/**
 * Return same value
 */
var identity = function (_) { return _; };

/**
 * Generate a static keys string from compiler modules.
 */
function genStaticKeys (modules) {
  return modules.reduce(function (keys, m) {
    return keys.concat(m.staticKeys || [])
  }, []).join(',')
}

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 */
function looseEqual (a, b) {
  var isObjectA = isObject(a);
  var isObjectB = isObject(b);
  if (isObjectA && isObjectB) {
    return JSON.stringify(a) === JSON.stringify(b)
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

function looseIndexOf (arr, val) {
  for (var i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) { return i }
  }
  return -1
}

/*  */

var config = {
  /**
   * Option merge strategies (used in core/util/options)
   */
  optionMergeStrategies: Object.create(null),

  /**
   * Whether to suppress warnings.
   */
  silent: false,

  /**
   * Whether to enable devtools
   */
  devtools: process.env.NODE_ENV !== 'production',

  /**
   * Error handler for watcher errors
   */
  errorHandler: null,

  /**
   * Ignore certain custom elements
   */
  ignoredElements: [],

  /**
   * Custom user key aliases for v-on
   */
  keyCodes: Object.create(null),

  /**
   * Check if a tag is reserved so that it cannot be registered as a
   * component. This is platform-dependent and may be overwritten.
   */
  isReservedTag: no,

  /**
   * Check if a tag is an unknown element.
   * Platform-dependent.
   */
  isUnknownElement: no,

  /**
   * Get the namespace of an element
   */
  getTagNamespace: noop,

  /**
   * Parse the real tag name for the specific platform.
   */
  parsePlatformTagName: identity,

  /**
   * Check if an attribute must be bound using property, e.g. value
   * Platform-dependent.
   */
  mustUseProp: no,

  /**
   * List of asset types that a component can own.
   */
  _assetTypes: [
    'component',
    'directive',
    'filter'
  ],

  /**
   * List of lifecycle hooks.
   */
  _lifecycleHooks: [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    'beforeDestroy',
    'destroyed',
    'activated',
    'deactivated'
  ],

  /**
   * Max circular updates allowed in a scheduler flush cycle.
   */
  _maxUpdateCount: 100
};

/*  */

/**
 * Check if a string starts with $ or _
 */
function isReserved (str) {
  var c = (str + '').charCodeAt(0);
  return c === 0x24 || c === 0x5F
}

/**
 * Define a property.
 */
function def (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

/**
 * Parse simple path.
 */
var bailRE = /[^\w.$]/;
function parsePath (path) {
  if (bailRE.test(path)) {
    return
  } else {
    var segments = path.split('.');
    return function (obj) {
      for (var i = 0; i < segments.length; i++) {
        if (!obj) { return }
        obj = obj[segments[i]];
      }
      return obj
    }
  }
}

/*  */
/* globals MutationObserver */

// can we use __proto__?
var hasProto = '__proto__' in {};

// Browser environment sniffing
var inBrowser = typeof window !== 'undefined';
var UA = inBrowser && window.navigator.userAgent.toLowerCase();
var isIE = UA && /msie|trident/.test(UA);
var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
var isEdge = UA && UA.indexOf('edge/') > 0;
var isAndroid = UA && UA.indexOf('android') > 0;
var isIOS = UA && /iphone|ipad|ipod|ios/.test(UA);

// this needs to be lazy-evaled because vue may be required before
// vue-server-renderer can set VUE_ENV
var _isServer;
var isServerRendering = function () {
  if (_isServer === undefined) {
    /* istanbul ignore if */
    if (!inBrowser && typeof global !== 'undefined') {
      // detect presence of vue-server-renderer and avoid
      // Webpack shimming the process
      _isServer = global['process'].env.VUE_ENV === 'server';
    } else {
      _isServer = false;
    }
  }
  return _isServer
};

// detect devtools
var devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;

/* istanbul ignore next */
function isNative (Ctor) {
  return /native code/.test(Ctor.toString())
}

/**
 * Defer a task to execute it asynchronously.
 */
var nextTick = (function () {
  var callbacks = [];
  var pending = false;
  var timerFunc;

  function nextTickHandler () {
    pending = false;
    var copies = callbacks.slice(0);
    callbacks.length = 0;
    for (var i = 0; i < copies.length; i++) {
      copies[i]();
    }
  }

  // the nextTick behavior leverages the microtask queue, which can be accessed
  // via either native Promise.then or MutationObserver.
  // MutationObserver has wider support, however it is seriously bugged in
  // UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
  // completely stops working after triggering a few times... so, if native
  // Promise is available, we will use it:
  /* istanbul ignore if */
  if (typeof Promise !== 'undefined' && isNative(Promise)) {
    var p = Promise.resolve();
    var logError = function (err) { console.error(err); };
    timerFunc = function () {
      p.then(nextTickHandler).catch(logError);
      // in problematic UIWebViews, Promise.then doesn't completely break, but
      // it can get stuck in a weird state where callbacks are pushed into the
      // microtask queue but the queue isn't being flushed, until the browser
      // needs to do some other work, e.g. handle a timer. Therefore we can
      // "force" the microtask queue to be flushed by adding an empty timer.
      if (isIOS) { setTimeout(noop); }
    };
  } else if (typeof MutationObserver !== 'undefined' && (
    isNative(MutationObserver) ||
    // PhantomJS and iOS 7.x
    MutationObserver.toString() === '[object MutationObserverConstructor]'
  )) {
    // use MutationObserver where native Promise is not available,
    // e.g. PhantomJS IE11, iOS7, Android 4.4
    var counter = 1;
    var observer = new MutationObserver(nextTickHandler);
    var textNode = document.createTextNode(String(counter));
    observer.observe(textNode, {
      characterData: true
    });
    timerFunc = function () {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
    };
  } else {
    // fallback to setTimeout
    /* istanbul ignore next */
    timerFunc = function () {
      setTimeout(nextTickHandler, 0);
    };
  }

  return function queueNextTick (cb, ctx) {
    var _resolve;
    callbacks.push(function () {
      if (cb) { cb.call(ctx); }
      if (_resolve) { _resolve(ctx); }
    });
    if (!pending) {
      pending = true;
      timerFunc();
    }
    if (!cb && typeof Promise !== 'undefined') {
      return new Promise(function (resolve) {
        _resolve = resolve;
      })
    }
  }
})();

var _Set;
/* istanbul ignore if */
if (typeof Set !== 'undefined' && isNative(Set)) {
  // use native Set when available.
  _Set = Set;
} else {
  // a non-standard Set polyfill that only works with primitive keys.
  _Set = (function () {
    function Set () {
      this.set = Object.create(null);
    }
    Set.prototype.has = function has (key) {
      return this.set[key] === true
    };
    Set.prototype.add = function add (key) {
      this.set[key] = true;
    };
    Set.prototype.clear = function clear () {
      this.set = Object.create(null);
    };

    return Set;
  }());
}

var warn = noop;
var formatComponentName;

if (process.env.NODE_ENV !== 'production') {
  var hasConsole = typeof console !== 'undefined';

  warn = function (msg, vm) {
    if (hasConsole && (!config.silent)) {
      console.error("[Vue warn]: " + msg + " " + (
        vm ? formatLocation(formatComponentName(vm)) : ''
      ));
    }
  };

  formatComponentName = function (vm) {
    if (vm.$root === vm) {
      return 'root instance'
    }
    var name = vm._isVue
      ? vm.$options.name || vm.$options._componentTag
      : vm.name;
    return (
      (name ? ("component <" + name + ">") : "anonymous component") +
      (vm._isVue && vm.$options.__file ? (" at " + (vm.$options.__file)) : '')
    )
  };

  var formatLocation = function (str) {
    if (str === 'anonymous component') {
      str += " - use the \"name\" option for better debugging messages.";
    }
    return ("\n(found in " + str + ")")
  };
}

/*  */


var uid$1 = 0;

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
var Dep = function Dep () {
  this.id = uid$1++;
  this.subs = [];
};

Dep.prototype.addSub = function addSub (sub) {
  this.subs.push(sub);
};

Dep.prototype.removeSub = function removeSub (sub) {
  remove$1(this.subs, sub);
};

Dep.prototype.depend = function depend () {
  if (Dep.target) {
    Dep.target.addDep(this);
  }
};

Dep.prototype.notify = function notify () {
  // stablize the subscriber list first
  var subs = this.subs.slice();
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update();
  }
};

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
Dep.target = null;
var targetStack = [];

function pushTarget (_target) {
  if (Dep.target) { targetStack.push(Dep.target); }
  Dep.target = _target;
}

function popTarget () {
  Dep.target = targetStack.pop();
}

/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);[
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
.forEach(function (method) {
  // cache original method
  var original = arrayProto[method];
  def(arrayMethods, method, function mutator () {
    var arguments$1 = arguments;

    // avoid leaking arguments:
    // http://jsperf.com/closure-with-arguments
    var i = arguments.length;
    var args = new Array(i);
    while (i--) {
      args[i] = arguments$1[i];
    }
    var result = original.apply(this, args);
    var ob = this.__ob__;
    var inserted;
    switch (method) {
      case 'push':
        inserted = args;
        break
      case 'unshift':
        inserted = args;
        break
      case 'splice':
        inserted = args.slice(2);
        break
    }
    if (inserted) { ob.observeArray(inserted); }
    // notify change
    ob.dep.notify();
    return result
  });
});

/*  */

var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * By default, when a reactive property is set, the new value is
 * also converted to become reactive. However when passing down props,
 * we don't want to force conversion because the value may be a nested value
 * under a frozen data structure. Converting it would defeat the optimization.
 */
var observerState = {
  shouldConvert: true,
  isSettingProps: false
};

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 */
var Observer = function Observer (value) {
  this.value = value;
  this.dep = new Dep();
  this.vmCount = 0;
  def(value, '__ob__', this);
  if (Array.isArray(value)) {
    var augment = hasProto
      ? protoAugment
      : copyAugment;
    augment(value, arrayMethods, arrayKeys);
    this.observeArray(value);
  } else {
    this.walk(value);
  }
};

/**
 * Walk through each property and convert them into
 * getter/setters. This method should only be called when
 * value type is Object.
 */
Observer.prototype.walk = function walk (obj) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    defineReactive$$1(obj, keys[i], obj[keys[i]]);
  }
};

/**
 * Observe a list of Array items.
 */
Observer.prototype.observeArray = function observeArray (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i]);
  }
};

// helpers

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src) {
  /* eslint-disable no-proto */
  target.__proto__ = src;
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    def(target, key, src[key]);
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
function observe (value, asRootData) {
  if (!isObject(value)) {
    return
  }
  var ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    observerState.shouldConvert &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value);
  }
  if (asRootData && ob) {
    ob.vmCount++;
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
function defineReactive$$1 (
  obj,
  key,
  val,
  customSetter
) {
  var dep = new Dep();

  var property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;
  var setter = property && property.set;

  var childOb = observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
        }
        if (Array.isArray(value)) {
          dependArray(value);
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      var value = getter ? getter.call(obj) : val;
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter();
      }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      childOb = observe(newVal);
      dep.notify();
    }
  });
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
function set$1 (obj, key, val) {
  if (Array.isArray(obj)) {
    obj.length = Math.max(obj.length, key);
    obj.splice(key, 1, val);
    return val
  }
  if (hasOwn(obj, key)) {
    obj[key] = val;
    return
  }
  var ob = obj.__ob__;
  if (obj._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    );
    return
  }
  if (!ob) {
    obj[key] = val;
    return
  }
  defineReactive$$1(ob.value, key, val);
  ob.dep.notify();
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
function del (obj, key) {
  var ob = obj.__ob__;
  if (obj._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    );
    return
  }
  if (!hasOwn(obj, key)) {
    return
  }
  delete obj[key];
  if (!ob) {
    return
  }
  ob.dep.notify();
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value) {
  for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
    e = value[i];
    e && e.__ob__ && e.__ob__.dep.depend();
    if (Array.isArray(e)) {
      dependArray(e);
    }
  }
}

/*  */

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 */
var strats = config.optionMergeStrategies;

/**
 * Options with restrictions
 */
if (process.env.NODE_ENV !== 'production') {
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        "option \"" + key + "\" can only be used during instance " +
        'creation with the `new` keyword.'
      );
    }
    return defaultStrat(parent, child)
  };
}

/**
 * Helper that recursively merges two data objects together.
 */
function mergeData (to, from) {
  if (!from) { return to }
  var key, toVal, fromVal;
  var keys = Object.keys(from);
  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    toVal = to[key];
    fromVal = from[key];
    if (!hasOwn(to, key)) {
      set$1(to, key, fromVal);
    } else if (isPlainObject(toVal) && isPlainObject(fromVal)) {
      mergeData(toVal, fromVal);
    }
  }
  return to
}

/**
 * Data
 */
strats.data = function (
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal
    }
    if (typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      );
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn () {
      return mergeData(
        childVal.call(this),
        parentVal.call(this)
      )
    }
  } else if (parentVal || childVal) {
    return function mergedInstanceDataFn () {
      // instance merge
      var instanceData = typeof childVal === 'function'
        ? childVal.call(vm)
        : childVal;
      var defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm)
        : undefined;
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
};

/**
 * Hooks and param attributes are merged as arrays.
 */
function mergeHook (
  parentVal,
  childVal
) {
  return childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
}

config._lifecycleHooks.forEach(function (hook) {
  strats[hook] = mergeHook;
});

/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 */
function mergeAssets (parentVal, childVal) {
  var res = Object.create(parentVal || null);
  return childVal
    ? extend(res, childVal)
    : res
}

config._assetTypes.forEach(function (type) {
  strats[type + 's'] = mergeAssets;
});

/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */
strats.watch = function (parentVal, childVal) {
  /* istanbul ignore if */
  if (!childVal) { return parentVal }
  if (!parentVal) { return childVal }
  var ret = {};
  extend(ret, parentVal);
  for (var key in childVal) {
    var parent = ret[key];
    var child = childVal[key];
    if (parent && !Array.isArray(parent)) {
      parent = [parent];
    }
    ret[key] = parent
      ? parent.concat(child)
      : [child];
  }
  return ret
};

/**
 * Other object hashes.
 */
strats.props =
strats.methods =
strats.computed = function (parentVal, childVal) {
  if (!childVal) { return parentVal }
  if (!parentVal) { return childVal }
  var ret = Object.create(null);
  extend(ret, parentVal);
  extend(ret, childVal);
  return ret
};

/**
 * Default strategy.
 */
var defaultStrat = function (parentVal, childVal) {
  return childVal === undefined
    ? parentVal
    : childVal
};

/**
 * Validate component names
 */
function checkComponents (options) {
  for (var key in options.components) {
    var lower = key.toLowerCase();
    if (isBuiltInTag(lower) || config.isReservedTag(lower)) {
      warn(
        'Do not use built-in or reserved HTML elements as component ' +
        'id: ' + key
      );
    }
  }
}

/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
function normalizeProps (options) {
  var props = options.props;
  if (!props) { return }
  var res = {};
  var i, val, name;
  if (Array.isArray(props)) {
    i = props.length;
    while (i--) {
      val = props[i];
      if (typeof val === 'string') {
        name = camelize(val);
        res[name] = { type: null };
      } else if (process.env.NODE_ENV !== 'production') {
        warn('props must be strings when using array syntax.');
      }
    }
  } else if (isPlainObject(props)) {
    for (var key in props) {
      val = props[key];
      name = camelize(key);
      res[name] = isPlainObject(val)
        ? val
        : { type: val };
    }
  }
  options.props = res;
}

/**
 * Normalize raw function directives into object format.
 */
function normalizeDirectives (options) {
  var dirs = options.directives;
  if (dirs) {
    for (var key in dirs) {
      var def = dirs[key];
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def };
      }
    }
  }
}

/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
function mergeOptions (
  parent,
  child,
  vm
) {
  if (process.env.NODE_ENV !== 'production') {
    checkComponents(child);
  }
  normalizeProps(child);
  normalizeDirectives(child);
  var extendsFrom = child.extends;
  if (extendsFrom) {
    parent = typeof extendsFrom === 'function'
      ? mergeOptions(parent, extendsFrom.options, vm)
      : mergeOptions(parent, extendsFrom, vm);
  }
  if (child.mixins) {
    for (var i = 0, l = child.mixins.length; i < l; i++) {
      var mixin = child.mixins[i];
      if (mixin.prototype instanceof Vue$2) {
        mixin = mixin.options;
      }
      parent = mergeOptions(parent, mixin, vm);
    }
  }
  var options = {};
  var key;
  for (key in parent) {
    mergeField(key);
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key);
    }
  }
  function mergeField (key) {
    var strat = strats[key] || defaultStrat;
    options[key] = strat(parent[key], child[key], vm, key);
  }
  return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
function resolveAsset (
  options,
  type,
  id,
  warnMissing
) {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return
  }
  var assets = options[type];
  // check local registration variations first
  if (hasOwn(assets, id)) { return assets[id] }
  var camelizedId = camelize(id);
  if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }
  var PascalCaseId = capitalize(camelizedId);
  if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }
  // fallback to prototype chain
  var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
  if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    );
  }
  return res
}

/*  */

function validateProp (
  key,
  propOptions,
  propsData,
  vm
) {
  var prop = propOptions[key];
  var absent = !hasOwn(propsData, key);
  var value = propsData[key];
  // handle boolean props
  if (isType(Boolean, prop.type)) {
    if (absent && !hasOwn(prop, 'default')) {
      value = false;
    } else if (!isType(String, prop.type) && (value === '' || value === hyphenate(key))) {
      value = true;
    }
  }
  // check default value
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop, key);
    // since the default value is a fresh copy,
    // make sure to observe it.
    var prevShouldConvert = observerState.shouldConvert;
    observerState.shouldConvert = true;
    observe(value);
    observerState.shouldConvert = prevShouldConvert;
  }
  if (process.env.NODE_ENV !== 'production') {
    assertProp(prop, key, value, vm, absent);
  }
  return value
}

/**
 * Get the default value of a prop.
 */
function getPropDefaultValue (vm, prop, key) {
  // no default, return undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  var def = prop.default;
  // warn against non-factory defaults for Object & Array
  if (isObject(def)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    );
  }
  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  if (vm && vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&
    vm[key] !== undefined) {
    return vm[key]
  }
  // call factory function for non-Function types
  return typeof def === 'function' && prop.type !== Function
    ? def.call(vm)
    : def
}

/**
 * Assert whether a prop is valid.
 */
function assertProp (
  prop,
  name,
  value,
  vm,
  absent
) {
  if (prop.required && absent) {
    warn(
      'Missing required prop: "' + name + '"',
      vm
    );
    return
  }
  if (value == null && !prop.required) {
    return
  }
  var type = prop.type;
  var valid = !type || type === true;
  var expectedTypes = [];
  if (type) {
    if (!Array.isArray(type)) {
      type = [type];
    }
    for (var i = 0; i < type.length && !valid; i++) {
      var assertedType = assertType(value, type[i]);
      expectedTypes.push(assertedType.expectedType || '');
      valid = assertedType.valid;
    }
  }
  if (!valid) {
    warn(
      'Invalid prop: type check failed for prop "' + name + '".' +
      ' Expected ' + expectedTypes.map(capitalize).join(', ') +
      ', got ' + Object.prototype.toString.call(value).slice(8, -1) + '.',
      vm
    );
    return
  }
  var validator = prop.validator;
  if (validator) {
    if (!validator(value)) {
      warn(
        'Invalid prop: custom validator check failed for prop "' + name + '".',
        vm
      );
    }
  }
}

/**
 * Assert the type of a value
 */
function assertType (value, type) {
  var valid;
  var expectedType = getType(type);
  if (expectedType === 'String') {
    valid = typeof value === (expectedType = 'string');
  } else if (expectedType === 'Number') {
    valid = typeof value === (expectedType = 'number');
  } else if (expectedType === 'Boolean') {
    valid = typeof value === (expectedType = 'boolean');
  } else if (expectedType === 'Function') {
    valid = typeof value === (expectedType = 'function');
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value);
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value);
  } else {
    valid = value instanceof type;
  }
  return {
    valid: valid,
    expectedType: expectedType
  }
}

/**
 * Use function string name to check built-in types,
 * because a simple equality check will fail when running
 * across different vms / iframes.
 */
function getType (fn) {
  var match = fn && fn.toString().match(/^\s*function (\w+)/);
  return match && match[1]
}

function isType (type, fn) {
  if (!Array.isArray(fn)) {
    return getType(fn) === getType(type)
  }
  for (var i = 0, len = fn.length; i < len; i++) {
    if (getType(fn[i]) === getType(type)) {
      return true
    }
  }
  /* istanbul ignore next */
  return false
}



var util = Object.freeze({
	defineReactive: defineReactive$$1,
	_toString: _toString,
	toNumber: toNumber,
	makeMap: makeMap,
	isBuiltInTag: isBuiltInTag,
	remove: remove$1,
	hasOwn: hasOwn,
	isPrimitive: isPrimitive,
	cached: cached,
	camelize: camelize,
	capitalize: capitalize,
	hyphenate: hyphenate,
	bind: bind$1,
	toArray: toArray,
	extend: extend,
	isObject: isObject,
	isPlainObject: isPlainObject,
	toObject: toObject,
	noop: noop,
	no: no,
	identity: identity,
	genStaticKeys: genStaticKeys,
	looseEqual: looseEqual,
	looseIndexOf: looseIndexOf,
	isReserved: isReserved,
	def: def,
	parsePath: parsePath,
	hasProto: hasProto,
	inBrowser: inBrowser,
	UA: UA,
	isIE: isIE,
	isIE9: isIE9,
	isEdge: isEdge,
	isAndroid: isAndroid,
	isIOS: isIOS,
	isServerRendering: isServerRendering,
	devtools: devtools,
	nextTick: nextTick,
	get _Set () { return _Set; },
	mergeOptions: mergeOptions,
	resolveAsset: resolveAsset,
	get warn () { return warn; },
	get formatComponentName () { return formatComponentName; },
	validateProp: validateProp
});

/* not type checking this file because flow doesn't play well with Proxy */

var initProxy;

if (process.env.NODE_ENV !== 'production') {
  var allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
  );

  var warnNonPresent = function (target, key) {
    warn(
      "Property or method \"" + key + "\" is not defined on the instance but " +
      "referenced during render. Make sure to declare reactive data " +
      "properties in the data option.",
      target
    );
  };

  var hasProxy =
    typeof Proxy !== 'undefined' &&
    Proxy.toString().match(/native code/);

  if (hasProxy) {
    var isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta');
    config.keyCodes = new Proxy(config.keyCodes, {
      set: function set (target, key, value) {
        if (isBuiltInModifier(key)) {
          warn(("Avoid overwriting built-in modifier in config.keyCodes: ." + key));
          return false
        } else {
          target[key] = value;
          return true
        }
      }
    });
  }

  var hasHandler = {
    has: function has (target, key) {
      var has = key in target;
      var isAllowed = allowedGlobals(key) || key.charAt(0) === '_';
      if (!has && !isAllowed) {
        warnNonPresent(target, key);
      }
      return has || !isAllowed
    }
  };

  var getHandler = {
    get: function get (target, key) {
      if (typeof key === 'string' && !(key in target)) {
        warnNonPresent(target, key);
      }
      return target[key]
    }
  };

  initProxy = function initProxy (vm) {
    if (hasProxy) {
      // determine which proxy handler to use
      var options = vm.$options;
      var handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler;
      vm._renderProxy = new Proxy(vm, handlers);
    } else {
      vm._renderProxy = vm;
    }
  };
}

/*  */

var VNode = function VNode (
  tag,
  data,
  children,
  text,
  elm,
  context,
  componentOptions
) {
  this.tag = tag;
  this.data = data;
  this.children = children;
  this.text = text;
  this.elm = elm;
  this.ns = undefined;
  this.context = context;
  this.functionalContext = undefined;
  this.key = data && data.key;
  this.componentOptions = componentOptions;
  this.componentInstance = undefined;
  this.parent = undefined;
  this.raw = false;
  this.isStatic = false;
  this.isRootInsert = true;
  this.isComment = false;
  this.isCloned = false;
  this.isOnce = false;
};

var prototypeAccessors = { child: {} };

// DEPRECATED: alias for componentInstance for backwards compat.
/* istanbul ignore next */
prototypeAccessors.child.get = function () {
  return this.componentInstance
};

Object.defineProperties( VNode.prototype, prototypeAccessors );

var createEmptyVNode = function () {
  var node = new VNode();
  node.text = '';
  node.isComment = true;
  return node
};

function createTextVNode (val) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
function cloneVNode (vnode) {
  var cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children,
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions
  );
  cloned.ns = vnode.ns;
  cloned.isStatic = vnode.isStatic;
  cloned.key = vnode.key;
  cloned.isCloned = true;
  return cloned
}

function cloneVNodes (vnodes) {
  var res = new Array(vnodes.length);
  for (var i = 0; i < vnodes.length; i++) {
    res[i] = cloneVNode(vnodes[i]);
  }
  return res
}

/*  */

var hooks = { init: init, prepatch: prepatch, insert: insert, destroy: destroy$1 };
var hooksToMerge = Object.keys(hooks);

function createComponent (
  Ctor,
  data,
  context,
  children,
  tag
) {
  if (!Ctor) {
    return
  }

  var baseCtor = context.$options._base;
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor);
  }

  if (typeof Ctor !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      warn(("Invalid Component definition: " + (String(Ctor))), context);
    }
    return
  }

  // async component
  if (!Ctor.cid) {
    if (Ctor.resolved) {
      Ctor = Ctor.resolved;
    } else {
      Ctor = resolveAsyncComponent(Ctor, baseCtor, function () {
        // it's ok to queue this on every render because
        // $forceUpdate is buffered by the scheduler.
        context.$forceUpdate();
      });
      if (!Ctor) {
        // return nothing if this is indeed an async component
        // wait for the callback to trigger parent update.
        return
      }
    }
  }

  // resolve constructor options in case global mixins are applied after
  // component constructor creation
  resolveConstructorOptions(Ctor);

  data = data || {};

  // extract props
  var propsData = extractProps(data, Ctor);

  // functional component
  if (Ctor.options.functional) {
    return createFunctionalComponent(Ctor, propsData, data, context, children)
  }

  // extract listeners, since these needs to be treated as
  // child component listeners instead of DOM listeners
  var listeners = data.on;
  // replace with listeners with .native modifier
  data.on = data.nativeOn;

  if (Ctor.options.abstract) {
    // abstract components do not keep anything
    // other than props & listeners
    data = {};
  }

  // merge component management hooks onto the placeholder node
  mergeHooks(data);

  // return a placeholder vnode
  var name = Ctor.options.name || tag;
  var vnode = new VNode(
    ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
    data, undefined, undefined, undefined, context,
    { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children }
  );
  return vnode
}

function createFunctionalComponent (
  Ctor,
  propsData,
  data,
  context,
  children
) {
  var props = {};
  var propOptions = Ctor.options.props;
  if (propOptions) {
    for (var key in propOptions) {
      props[key] = validateProp(key, propOptions, propsData);
    }
  }
  // ensure the createElement function in functional components
  // gets a unique context - this is necessary for correct named slot check
  var _context = Object.create(context);
  var h = function (a, b, c, d) { return createElement(_context, a, b, c, d, true); };
  var vnode = Ctor.options.render.call(null, h, {
    props: props,
    data: data,
    parent: context,
    children: children,
    slots: function () { return resolveSlots(children, context); }
  });
  if (vnode instanceof VNode) {
    vnode.functionalContext = context;
    if (data.slot) {
      (vnode.data || (vnode.data = {})).slot = data.slot;
    }
  }
  return vnode
}

function createComponentInstanceForVnode (
  vnode, // we know it's MountedComponentVNode but flow doesn't
  parent, // activeInstance in lifecycle state
  parentElm,
  refElm
) {
  var vnodeComponentOptions = vnode.componentOptions;
  var options = {
    _isComponent: true,
    parent: parent,
    propsData: vnodeComponentOptions.propsData,
    _componentTag: vnodeComponentOptions.tag,
    _parentVnode: vnode,
    _parentListeners: vnodeComponentOptions.listeners,
    _renderChildren: vnodeComponentOptions.children,
    _parentElm: parentElm || null,
    _refElm: refElm || null
  };
  // check inline-template render functions
  var inlineTemplate = vnode.data.inlineTemplate;
  if (inlineTemplate) {
    options.render = inlineTemplate.render;
    options.staticRenderFns = inlineTemplate.staticRenderFns;
  }
  return new vnodeComponentOptions.Ctor(options)
}

function init (
  vnode,
  hydrating,
  parentElm,
  refElm
) {
  if (!vnode.componentInstance || vnode.componentInstance._isDestroyed) {
    var child = vnode.componentInstance = createComponentInstanceForVnode(
      vnode,
      activeInstance,
      parentElm,
      refElm
    );
    child.$mount(hydrating ? vnode.elm : undefined, hydrating);
  } else if (vnode.data.keepAlive) {
    // kept-alive components, treat as a patch
    var mountedNode = vnode; // work around flow
    prepatch(mountedNode, mountedNode);
  }
}

function prepatch (
  oldVnode,
  vnode
) {
  var options = vnode.componentOptions;
  var child = vnode.componentInstance = oldVnode.componentInstance;
  child._updateFromParent(
    options.propsData, // updated props
    options.listeners, // updated listeners
    vnode, // new parent vnode
    options.children // new children
  );
}

function insert (vnode) {
  if (!vnode.componentInstance._isMounted) {
    vnode.componentInstance._isMounted = true;
    callHook(vnode.componentInstance, 'mounted');
  }
  if (vnode.data.keepAlive) {
    vnode.componentInstance._inactive = false;
    callHook(vnode.componentInstance, 'activated');
  }
}

function destroy$1 (vnode) {
  if (!vnode.componentInstance._isDestroyed) {
    if (!vnode.data.keepAlive) {
      vnode.componentInstance.$destroy();
    } else {
      vnode.componentInstance._inactive = true;
      callHook(vnode.componentInstance, 'deactivated');
    }
  }
}

function resolveAsyncComponent (
  factory,
  baseCtor,
  cb
) {
  if (factory.requested) {
    // pool callbacks
    factory.pendingCallbacks.push(cb);
  } else {
    factory.requested = true;
    var cbs = factory.pendingCallbacks = [cb];
    var sync = true;

    var resolve = function (res) {
      if (isObject(res)) {
        res = baseCtor.extend(res);
      }
      // cache resolved
      factory.resolved = res;
      // invoke callbacks only if this is not a synchronous resolve
      // (async resolves are shimmed as synchronous during SSR)
      if (!sync) {
        for (var i = 0, l = cbs.length; i < l; i++) {
          cbs[i](res);
        }
      }
    };

    var reject = function (reason) {
      process.env.NODE_ENV !== 'production' && warn(
        "Failed to resolve async component: " + (String(factory)) +
        (reason ? ("\nReason: " + reason) : '')
      );
    };

    var res = factory(resolve, reject);

    // handle promise
    if (res && typeof res.then === 'function' && !factory.resolved) {
      res.then(resolve, reject);
    }

    sync = false;
    // return in case resolved synchronously
    return factory.resolved
  }
}

function extractProps (data, Ctor) {
  // we are only extracting raw values here.
  // validation and default values are handled in the child
  // component itself.
  var propOptions = Ctor.options.props;
  if (!propOptions) {
    return
  }
  var res = {};
  var attrs = data.attrs;
  var props = data.props;
  var domProps = data.domProps;
  if (attrs || props || domProps) {
    for (var key in propOptions) {
      var altKey = hyphenate(key);
      checkProp(res, props, key, altKey, true) ||
      checkProp(res, attrs, key, altKey) ||
      checkProp(res, domProps, key, altKey);
    }
  }
  return res
}

function checkProp (
  res,
  hash,
  key,
  altKey,
  preserve
) {
  if (hash) {
    if (hasOwn(hash, key)) {
      res[key] = hash[key];
      if (!preserve) {
        delete hash[key];
      }
      return true
    } else if (hasOwn(hash, altKey)) {
      res[key] = hash[altKey];
      if (!preserve) {
        delete hash[altKey];
      }
      return true
    }
  }
  return false
}

function mergeHooks (data) {
  if (!data.hook) {
    data.hook = {};
  }
  for (var i = 0; i < hooksToMerge.length; i++) {
    var key = hooksToMerge[i];
    var fromParent = data.hook[key];
    var ours = hooks[key];
    data.hook[key] = fromParent ? mergeHook$1(ours, fromParent) : ours;
  }
}

function mergeHook$1 (one, two) {
  return function (a, b, c, d) {
    one(a, b, c, d);
    two(a, b, c, d);
  }
}

/*  */

function mergeVNodeHook (def, hookKey, hook, key) {
  key = key + hookKey;
  var injectedHash = def.__injected || (def.__injected = {});
  if (!injectedHash[key]) {
    injectedHash[key] = true;
    var oldHook = def[hookKey];
    if (oldHook) {
      def[hookKey] = function () {
        oldHook.apply(this, arguments);
        hook.apply(this, arguments);
      };
    } else {
      def[hookKey] = hook;
    }
  }
}

/*  */

var normalizeEvent = cached(function (name) {
  var once = name.charAt(0) === '~'; // Prefixed last, checked first
  name = once ? name.slice(1) : name;
  var capture = name.charAt(0) === '!';
  name = capture ? name.slice(1) : name;
  return {
    name: name,
    once: once,
    capture: capture
  }
});

function createEventHandle (fn) {
  var handle = {
    fn: fn,
    invoker: function () {
      var arguments$1 = arguments;

      var fn = handle.fn;
      if (Array.isArray(fn)) {
        for (var i = 0; i < fn.length; i++) {
          fn[i].apply(null, arguments$1);
        }
      } else {
        fn.apply(null, arguments);
      }
    }
  };
  return handle
}

function updateListeners (
  on,
  oldOn,
  add,
  remove$$1,
  vm
) {
  var name, cur, old, event;
  for (name in on) {
    cur = on[name];
    old = oldOn[name];
    event = normalizeEvent(name);
    if (!cur) {
      process.env.NODE_ENV !== 'production' && warn(
        "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
        vm
      );
    } else if (!old) {
      if (!cur.invoker) {
        cur = on[name] = createEventHandle(cur);
      }
      add(event.name, cur.invoker, event.once, event.capture);
    } else if (cur !== old) {
      old.fn = cur;
      on[name] = old;
    }
  }
  for (name in oldOn) {
    if (!on[name]) {
      event = normalizeEvent(name);
      remove$$1(event.name, oldOn[name].invoker, event.capture);
    }
  }
}

/*  */

// The template compiler attempts to minimize the need for normalization by
// statically analyzing the template at compile time.
//
// For plain HTML markup, normalization can be completely skipped because the
// generated render function is guaranteed to return Array<VNode>. There are
// two cases where extra normalization is needed:

// 1. When the children contains components - because a functional component
// may return an Array instead of a single root. In this case, just a simple
// nomralization is needed - if any child is an Array, we flatten the whole
// thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
// because functional components already normalize their own children.
function simpleNormalizeChildren (children) {
  for (var i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}

// 2. When the children contains constrcuts that always generated nested Arrays,
// e.g. <template>, <slot>, v-for, or when the children is provided by user
// with hand-written render functions / JSX. In such cases a full normalization
// is needed to cater to all possible types of children values.
function normalizeChildren (children) {
  return isPrimitive(children)
    ? [createTextVNode(children)]
    : Array.isArray(children)
      ? normalizeArrayChildren(children)
      : undefined
}

function normalizeArrayChildren (children, nestedIndex) {
  var res = [];
  var i, c, last;
  for (i = 0; i < children.length; i++) {
    c = children[i];
    if (c == null || typeof c === 'boolean') { continue }
    last = res[res.length - 1];
    //  nested
    if (Array.isArray(c)) {
      res.push.apply(res, normalizeArrayChildren(c, ((nestedIndex || '') + "_" + i)));
    } else if (isPrimitive(c)) {
      if (last && last.text) {
        last.text += String(c);
      } else if (c !== '') {
        // convert primitive to vnode
        res.push(createTextVNode(c));
      }
    } else {
      if (c.text && last && last.text) {
        res[res.length - 1] = createTextVNode(last.text + c.text);
      } else {
        // default key for nested array children (likely generated by v-for)
        if (c.tag && c.key == null && nestedIndex != null) {
          c.key = "__vlist" + nestedIndex + "_" + i + "__";
        }
        res.push(c);
      }
    }
  }
  return res
}

/*  */

function getFirstComponentChild (children) {
  return children && children.filter(function (c) { return c && c.componentOptions; })[0]
}

/*  */

var SIMPLE_NORMALIZE = 1;
var ALWAYS_NORMALIZE = 2;

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
function createElement (
  context,
  tag,
  data,
  children,
  normalizationType,
  alwaysNormalize
) {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children;
    children = data;
    data = undefined;
  }
  if (alwaysNormalize) { normalizationType = ALWAYS_NORMALIZE; }
  return _createElement(context, tag, data, children, normalizationType)
}

function _createElement (
  context,
  tag,
  data,
  children,
  normalizationType
) {
  if (data && data.__ob__) {
    process.env.NODE_ENV !== 'production' && warn(
      "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
      'Always create fresh vnode data objects in each render!',
      context
    );
    return createEmptyVNode()
  }
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }
  // support single function children as default scoped slot
  if (Array.isArray(children) &&
      typeof children[0] === 'function') {
    data = data || {};
    data.scopedSlots = { default: children[0] };
    children.length = 0;
  }
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children);
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children);
  }
  var vnode, ns;
  if (typeof tag === 'string') {
    var Ctor;
    ns = config.getTagNamespace(tag);
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      );
    } else if ((Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      vnode = createComponent(Ctor, data, context, children, tag);
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      );
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children);
  }
  if (vnode) {
    if (ns) { applyNS(vnode, ns); }
    return vnode
  } else {
    return createEmptyVNode()
  }
}

function applyNS (vnode, ns) {
  vnode.ns = ns;
  if (vnode.tag === 'foreignObject') {
    // use default namespace inside foreignObject
    return
  }
  if (vnode.children) {
    for (var i = 0, l = vnode.children.length; i < l; i++) {
      var child = vnode.children[i];
      if (child.tag && !child.ns) {
        applyNS(child, ns);
      }
    }
  }
}

/*  */

function initRender (vm) {
  vm.$vnode = null; // the placeholder node in parent tree
  vm._vnode = null; // the root of the child tree
  vm._staticTrees = null;
  var parentVnode = vm.$options._parentVnode;
  var renderContext = parentVnode && parentVnode.context;
  vm.$slots = resolveSlots(vm.$options._renderChildren, renderContext);
  vm.$scopedSlots = {};
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
  // normalization is always applied for the public version, used in
  // user-written render functions.
  vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };
}

function renderMixin (Vue) {
  Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
  };

  Vue.prototype._render = function () {
    var vm = this;
    var ref = vm.$options;
    var render = ref.render;
    var staticRenderFns = ref.staticRenderFns;
    var _parentVnode = ref._parentVnode;

    if (vm._isMounted) {
      // clone slot nodes on re-renders
      for (var key in vm.$slots) {
        vm.$slots[key] = cloneVNodes(vm.$slots[key]);
      }
    }

    if (_parentVnode && _parentVnode.data.scopedSlots) {
      vm.$scopedSlots = _parentVnode.data.scopedSlots;
    }

    if (staticRenderFns && !vm._staticTrees) {
      vm._staticTrees = [];
    }
    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode;
    // render self
    var vnode;
    try {
      vnode = render.call(vm._renderProxy, vm.$createElement);
    } catch (e) {
      /* istanbul ignore else */
      if (config.errorHandler) {
        config.errorHandler.call(null, e, vm);
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn(("Error when rendering " + (formatComponentName(vm)) + ":"));
        }
        throw e
      }
      // return previous vnode to prevent render error causing blank component
      vnode = vm._vnode;
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        );
      }
      vnode = createEmptyVNode();
    }
    // set parent
    vnode.parent = _parentVnode;
    return vnode
  };

  // toString for mustaches
  Vue.prototype._s = _toString;
  // convert text to vnode
  Vue.prototype._v = createTextVNode;
  // number conversion
  Vue.prototype._n = toNumber;
  // empty vnode
  Vue.prototype._e = createEmptyVNode;
  // loose equal
  Vue.prototype._q = looseEqual;
  // loose indexOf
  Vue.prototype._i = looseIndexOf;

  // render static tree by index
  Vue.prototype._m = function renderStatic (
    index,
    isInFor
  ) {
    var tree = this._staticTrees[index];
    // if has already-rendered static tree and not inside v-for,
    // we can reuse the same tree by doing a shallow clone.
    if (tree && !isInFor) {
      return Array.isArray(tree)
        ? cloneVNodes(tree)
        : cloneVNode(tree)
    }
    // otherwise, render a fresh tree.
    tree = this._staticTrees[index] = this.$options.staticRenderFns[index].call(this._renderProxy);
    markStatic(tree, ("__static__" + index), false);
    return tree
  };

  // mark node as static (v-once)
  Vue.prototype._o = function markOnce (
    tree,
    index,
    key
  ) {
    markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
    return tree
  };

  function markStatic (tree, key, isOnce) {
    if (Array.isArray(tree)) {
      for (var i = 0; i < tree.length; i++) {
        if (tree[i] && typeof tree[i] !== 'string') {
          markStaticNode(tree[i], (key + "_" + i), isOnce);
        }
      }
    } else {
      markStaticNode(tree, key, isOnce);
    }
  }

  function markStaticNode (node, key, isOnce) {
    node.isStatic = true;
    node.key = key;
    node.isOnce = isOnce;
  }

  // filter resolution helper
  Vue.prototype._f = function resolveFilter (id) {
    return resolveAsset(this.$options, 'filters', id, true) || identity
  };

  // render v-for
  Vue.prototype._l = function renderList (
    val,
    render
  ) {
    var ret, i, l, keys, key;
    if (Array.isArray(val) || typeof val === 'string') {
      ret = new Array(val.length);
      for (i = 0, l = val.length; i < l; i++) {
        ret[i] = render(val[i], i);
      }
    } else if (typeof val === 'number') {
      ret = new Array(val);
      for (i = 0; i < val; i++) {
        ret[i] = render(i + 1, i);
      }
    } else if (isObject(val)) {
      keys = Object.keys(val);
      ret = new Array(keys.length);
      for (i = 0, l = keys.length; i < l; i++) {
        key = keys[i];
        ret[i] = render(val[key], key, i);
      }
    }
    return ret
  };

  // renderSlot
  Vue.prototype._t = function (
    name,
    fallback,
    props,
    bindObject
  ) {
    var scopedSlotFn = this.$scopedSlots[name];
    if (scopedSlotFn) { // scoped slot
      props = props || {};
      if (bindObject) {
        extend(props, bindObject);
      }
      return scopedSlotFn(props) || fallback
    } else {
      var slotNodes = this.$slots[name];
      // warn duplicate slot usage
      if (slotNodes && process.env.NODE_ENV !== 'production') {
        slotNodes._rendered && warn(
          "Duplicate presence of slot \"" + name + "\" found in the same render tree " +
          "- this will likely cause render errors.",
          this
        );
        slotNodes._rendered = true;
      }
      return slotNodes || fallback
    }
  };

  // apply v-bind object
  Vue.prototype._b = function bindProps (
    data,
    tag,
    value,
    asProp
  ) {
    if (value) {
      if (!isObject(value)) {
        process.env.NODE_ENV !== 'production' && warn(
          'v-bind without argument expects an Object or Array value',
          this
        );
      } else {
        if (Array.isArray(value)) {
          value = toObject(value);
        }
        for (var key in value) {
          if (key === 'class' || key === 'style') {
            data[key] = value[key];
          } else {
            var type = data.attrs && data.attrs.type;
            var hash = asProp || config.mustUseProp(tag, type, key)
              ? data.domProps || (data.domProps = {})
              : data.attrs || (data.attrs = {});
            hash[key] = value[key];
          }
        }
      }
    }
    return data
  };

  // check v-on keyCodes
  Vue.prototype._k = function checkKeyCodes (
    eventKeyCode,
    key,
    builtInAlias
  ) {
    var keyCodes = config.keyCodes[key] || builtInAlias;
    if (Array.isArray(keyCodes)) {
      return keyCodes.indexOf(eventKeyCode) === -1
    } else {
      return keyCodes !== eventKeyCode
    }
  };
}

function resolveSlots (
  children,
  context
) {
  var slots = {};
  if (!children) {
    return slots
  }
  var defaultSlot = [];
  var name, child;
  for (var i = 0, l = children.length; i < l; i++) {
    child = children[i];
    // named slots should only be respected if the vnode was rendered in the
    // same context.
    if ((child.context === context || child.functionalContext === context) &&
        child.data && (name = child.data.slot)) {
      var slot = (slots[name] || (slots[name] = []));
      if (child.tag === 'template') {
        slot.push.apply(slot, child.children);
      } else {
        slot.push(child);
      }
    } else {
      defaultSlot.push(child);
    }
  }
  // ignore single whitespace
  if (defaultSlot.length && !(
    defaultSlot.length === 1 &&
    (defaultSlot[0].text === ' ' || defaultSlot[0].isComment)
  )) {
    slots.default = defaultSlot;
  }
  return slots
}

/*  */

function initEvents (vm) {
  vm._events = Object.create(null);
  vm._hasHookEvent = false;
  // init parent attached events
  var listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners);
  }
}

var target;

function add$1 (event, fn, once) {
  if (once) {
    target.$once(event, fn);
  } else {
    target.$on(event, fn);
  }
}

function remove$2 (event, fn) {
  target.$off(event, fn);
}

function updateComponentListeners (
  vm,
  listeners,
  oldListeners
) {
  target = vm;
  updateListeners(listeners, oldListeners || {}, add$1, remove$2, vm);
}

function eventsMixin (Vue) {
  var hookRE = /^hook:/;
  Vue.prototype.$on = function (event, fn) {
    var vm = this;(vm._events[event] || (vm._events[event] = [])).push(fn);
    // optimize hook:event cost by using a boolean flag marked at registration
    // instead of a hash lookup
    if (hookRE.test(event)) {
      vm._hasHookEvent = true;
    }
    return vm
  };

  Vue.prototype.$once = function (event, fn) {
    var vm = this;
    function on () {
      vm.$off(event, on);
      fn.apply(vm, arguments);
    }
    on.fn = fn;
    vm.$on(event, on);
    return vm
  };

  Vue.prototype.$off = function (event, fn) {
    var vm = this;
    // all
    if (!arguments.length) {
      vm._events = Object.create(null);
      return vm
    }
    // specific event
    var cbs = vm._events[event];
    if (!cbs) {
      return vm
    }
    if (arguments.length === 1) {
      vm._events[event] = null;
      return vm
    }
    // specific handler
    var cb;
    var i = cbs.length;
    while (i--) {
      cb = cbs[i];
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1);
        break
      }
    }
    return vm
  };

  Vue.prototype.$emit = function (event) {
    var vm = this;
    var cbs = vm._events[event];
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs;
      var args = toArray(arguments, 1);
      for (var i = 0, l = cbs.length; i < l; i++) {
        cbs[i].apply(vm, args);
      }
    }
    return vm
  };
}

/*  */

var activeInstance = null;

function initLifecycle (vm) {
  var options = vm.$options;

  // locate first non-abstract parent
  var parent = options.parent;
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent;
    }
    parent.$children.push(vm);
  }

  vm.$parent = parent;
  vm.$root = parent ? parent.$root : vm;

  vm.$children = [];
  vm.$refs = {};

  vm._watcher = null;
  vm._inactive = false;
  vm._isMounted = false;
  vm._isDestroyed = false;
  vm._isBeingDestroyed = false;
}

function lifecycleMixin (Vue) {
  Vue.prototype._mount = function (
    el,
    hydrating
  ) {
    var vm = this;
    vm.$el = el;
    if (!vm.$options.render) {
      vm.$options.render = createEmptyVNode;
      if (process.env.NODE_ENV !== 'production') {
        /* istanbul ignore if */
        if (vm.$options.template && vm.$options.template.charAt(0) !== '#') {
          warn(
            'You are using the runtime-only build of Vue where the template ' +
            'option is not available. Either pre-compile the templates into ' +
            'render functions, or use the compiler-included build.',
            vm
          );
        } else {
          warn(
            'Failed to mount component: template or render function not defined.',
            vm
          );
        }
      }
    }
    callHook(vm, 'beforeMount');
    vm._watcher = new Watcher(vm, function updateComponent () {
      vm._update(vm._render(), hydrating);
    }, noop);
    hydrating = false;
    // manually mounted instance, call mounted on self
    // mounted is called for render-created child components in its inserted hook
    if (vm.$vnode == null) {
      vm._isMounted = true;
      callHook(vm, 'mounted');
    }
    return vm
  };

  Vue.prototype._update = function (vnode, hydrating) {
    var vm = this;
    if (vm._isMounted) {
      callHook(vm, 'beforeUpdate');
    }
    var prevEl = vm.$el;
    var prevVnode = vm._vnode;
    var prevActiveInstance = activeInstance;
    activeInstance = vm;
    vm._vnode = vnode;
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(
        vm.$el, vnode, hydrating, false /* removeOnly */,
        vm.$options._parentElm,
        vm.$options._refElm
      );
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode);
    }
    activeInstance = prevActiveInstance;
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null;
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm;
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el;
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  };

  Vue.prototype._updateFromParent = function (
    propsData,
    listeners,
    parentVnode,
    renderChildren
  ) {
    var vm = this;
    var hasChildren = !!(vm.$options._renderChildren || renderChildren);
    vm.$options._parentVnode = parentVnode;
    vm.$vnode = parentVnode; // update vm's placeholder node without re-render
    if (vm._vnode) { // update child tree's parent
      vm._vnode.parent = parentVnode;
    }
    vm.$options._renderChildren = renderChildren;
    // update props
    if (propsData && vm.$options.props) {
      observerState.shouldConvert = false;
      if (process.env.NODE_ENV !== 'production') {
        observerState.isSettingProps = true;
      }
      var propKeys = vm.$options._propKeys || [];
      for (var i = 0; i < propKeys.length; i++) {
        var key = propKeys[i];
        vm[key] = validateProp(key, vm.$options.props, propsData, vm);
      }
      observerState.shouldConvert = true;
      if (process.env.NODE_ENV !== 'production') {
        observerState.isSettingProps = false;
      }
      vm.$options.propsData = propsData;
    }
    // update listeners
    if (listeners) {
      var oldListeners = vm.$options._parentListeners;
      vm.$options._parentListeners = listeners;
      updateComponentListeners(vm, listeners, oldListeners);
    }
    // resolve slots + force update if has children
    if (hasChildren) {
      vm.$slots = resolveSlots(renderChildren, parentVnode.context);
      vm.$forceUpdate();
    }
  };

  Vue.prototype.$forceUpdate = function () {
    var vm = this;
    if (vm._watcher) {
      vm._watcher.update();
    }
  };

  Vue.prototype.$destroy = function () {
    var vm = this;
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestroy');
    vm._isBeingDestroyed = true;
    // remove self from parent
    var parent = vm.$parent;
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove$1(parent.$children, vm);
    }
    // teardown watchers
    if (vm._watcher) {
      vm._watcher.teardown();
    }
    var i = vm._watchers.length;
    while (i--) {
      vm._watchers[i].teardown();
    }
    // remove reference from data ob
    // frozen object may not have observer.
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--;
    }
    // call the last hook...
    vm._isDestroyed = true;
    callHook(vm, 'destroyed');
    // turn off all instance listeners.
    vm.$off();
    // remove __vue__ reference
    if (vm.$el) {
      vm.$el.__vue__ = null;
    }
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null);
  };
}

function callHook (vm, hook) {
  var handlers = vm.$options[hook];
  if (handlers) {
    for (var i = 0, j = handlers.length; i < j; i++) {
      handlers[i].call(vm);
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook);
  }
}

/*  */


var queue = [];
var has$1 = {};
var circular = {};
var waiting = false;
var flushing = false;
var index = 0;

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
  queue.length = 0;
  has$1 = {};
  if (process.env.NODE_ENV !== 'production') {
    circular = {};
  }
  waiting = flushing = false;
}

/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue () {
  flushing = true;
  var watcher, id, vm;

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  queue.sort(function (a, b) { return a.id - b.id; });

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index];
    id = watcher.id;
    has$1[id] = null;
    watcher.run();
    // in dev build, check and stop circular updates.
    if (process.env.NODE_ENV !== 'production' && has$1[id] != null) {
      circular[id] = (circular[id] || 0) + 1;
      if (circular[id] > config._maxUpdateCount) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? ("in watcher with expression \"" + (watcher.expression) + "\"")
              : "in a component render function."
          ),
          watcher.vm
        );
        break
      }
    }
  }

  // call updated hooks
  index = queue.length;
  while (index--) {
    watcher = queue[index];
    vm = watcher.vm;
    if (vm._watcher === watcher && vm._isMounted) {
      callHook(vm, 'updated');
    }
  }

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush');
  }

  resetSchedulerState();
}

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
function queueWatcher (watcher) {
  var id = watcher.id;
  if (has$1[id] == null) {
    has$1[id] = true;
    if (!flushing) {
      queue.push(watcher);
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      var i = queue.length - 1;
      while (i >= 0 && queue[i].id > watcher.id) {
        i--;
      }
      queue.splice(Math.max(i, index) + 1, 0, watcher);
    }
    // queue the flush
    if (!waiting) {
      waiting = true;
      nextTick(flushSchedulerQueue);
    }
  }
}

/*  */

var uid$2 = 0;

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
var Watcher = function Watcher (
  vm,
  expOrFn,
  cb,
  options
) {
  this.vm = vm;
  vm._watchers.push(this);
  // options
  if (options) {
    this.deep = !!options.deep;
    this.user = !!options.user;
    this.lazy = !!options.lazy;
    this.sync = !!options.sync;
  } else {
    this.deep = this.user = this.lazy = this.sync = false;
  }
  this.cb = cb;
  this.id = ++uid$2; // uid for batching
  this.active = true;
  this.dirty = this.lazy; // for lazy watchers
  this.deps = [];
  this.newDeps = [];
  this.depIds = new _Set();
  this.newDepIds = new _Set();
  this.expression = process.env.NODE_ENV !== 'production'
    ? expOrFn.toString()
    : '';
  // parse expression for getter
  if (typeof expOrFn === 'function') {
    this.getter = expOrFn;
  } else {
    this.getter = parsePath(expOrFn);
    if (!this.getter) {
      this.getter = function () {};
      process.env.NODE_ENV !== 'production' && warn(
        "Failed watching path: \"" + expOrFn + "\" " +
        'Watcher only accepts simple dot-delimited paths. ' +
        'For full control, use a function instead.',
        vm
      );
    }
  }
  this.value = this.lazy
    ? undefined
    : this.get();
};

/**
 * Evaluate the getter, and re-collect dependencies.
 */
Watcher.prototype.get = function get () {
  pushTarget(this);
  var value = this.getter.call(this.vm, this.vm);
  // "touch" every property so they are all tracked as
  // dependencies for deep watching
  if (this.deep) {
    traverse(value);
  }
  popTarget();
  this.cleanupDeps();
  return value
};

/**
 * Add a dependency to this directive.
 */
Watcher.prototype.addDep = function addDep (dep) {
  var id = dep.id;
  if (!this.newDepIds.has(id)) {
    this.newDepIds.add(id);
    this.newDeps.push(dep);
    if (!this.depIds.has(id)) {
      dep.addSub(this);
    }
  }
};

/**
 * Clean up for dependency collection.
 */
Watcher.prototype.cleanupDeps = function cleanupDeps () {
    var this$1 = this;

  var i = this.deps.length;
  while (i--) {
    var dep = this$1.deps[i];
    if (!this$1.newDepIds.has(dep.id)) {
      dep.removeSub(this$1);
    }
  }
  var tmp = this.depIds;
  this.depIds = this.newDepIds;
  this.newDepIds = tmp;
  this.newDepIds.clear();
  tmp = this.deps;
  this.deps = this.newDeps;
  this.newDeps = tmp;
  this.newDeps.length = 0;
};

/**
 * Subscriber interface.
 * Will be called when a dependency changes.
 */
Watcher.prototype.update = function update () {
  /* istanbul ignore else */
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync) {
    this.run();
  } else {
    queueWatcher(this);
  }
};

/**
 * Scheduler job interface.
 * Will be called by the scheduler.
 */
Watcher.prototype.run = function run () {
  if (this.active) {
    var value = this.get();
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated.
      isObject(value) ||
      this.deep
    ) {
      // set new value
      var oldValue = this.value;
      this.value = value;
      if (this.user) {
        try {
          this.cb.call(this.vm, value, oldValue);
        } catch (e) {
          /* istanbul ignore else */
          if (config.errorHandler) {
            config.errorHandler.call(null, e, this.vm);
          } else {
            process.env.NODE_ENV !== 'production' && warn(
              ("Error in watcher \"" + (this.expression) + "\""),
              this.vm
            );
            throw e
          }
        }
      } else {
        this.cb.call(this.vm, value, oldValue);
      }
    }
  }
};

/**
 * Evaluate the value of the watcher.
 * This only gets called for lazy watchers.
 */
Watcher.prototype.evaluate = function evaluate () {
  this.value = this.get();
  this.dirty = false;
};

/**
 * Depend on all deps collected by this watcher.
 */
Watcher.prototype.depend = function depend () {
    var this$1 = this;

  var i = this.deps.length;
  while (i--) {
    this$1.deps[i].depend();
  }
};

/**
 * Remove self from all dependencies' subscriber list.
 */
Watcher.prototype.teardown = function teardown () {
    var this$1 = this;

  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed.
    if (!this.vm._isBeingDestroyed) {
      remove$1(this.vm._watchers, this);
    }
    var i = this.deps.length;
    while (i--) {
      this$1.deps[i].removeSub(this$1);
    }
    this.active = false;
  }
};

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
var seenObjects = new _Set();
function traverse (val) {
  seenObjects.clear();
  _traverse(val, seenObjects);
}

function _traverse (val, seen) {
  var i, keys;
  var isA = Array.isArray(val);
  if ((!isA && !isObject(val)) || !Object.isExtensible(val)) {
    return
  }
  if (val.__ob__) {
    var depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return
    }
    seen.add(depId);
  }
  if (isA) {
    i = val.length;
    while (i--) { _traverse(val[i], seen); }
  } else {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) { _traverse(val[keys[i]], seen); }
  }
}

/*  */

function initState (vm) {
  vm._watchers = [];
  var opts = vm.$options;
  if (opts.props) { initProps(vm, opts.props); }
  if (opts.methods) { initMethods(vm, opts.methods); }
  if (opts.data) {
    initData(vm);
  } else {
    observe(vm._data = {}, true /* asRootData */);
  }
  if (opts.computed) { initComputed(vm, opts.computed); }
  if (opts.watch) { initWatch(vm, opts.watch); }
}

var isReservedProp = { key: 1, ref: 1, slot: 1 };

function initProps (vm, props) {
  var propsData = vm.$options.propsData || {};
  var keys = vm.$options._propKeys = Object.keys(props);
  var isRoot = !vm.$parent;
  // root instance props should be converted
  observerState.shouldConvert = isRoot;
  var loop = function ( i ) {
    var key = keys[i];
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      if (isReservedProp[key]) {
        warn(
          ("\"" + key + "\" is a reserved attribute and cannot be used as component prop."),
          vm
        );
      }
      defineReactive$$1(vm, key, validateProp(key, props, propsData, vm), function () {
        if (vm.$parent && !observerState.isSettingProps) {
          warn(
            "Avoid mutating a prop directly since the value will be " +
            "overwritten whenever the parent component re-renders. " +
            "Instead, use a data or computed property based on the prop's " +
            "value. Prop being mutated: \"" + key + "\"",
            vm
          );
        }
      });
    } else {
      defineReactive$$1(vm, key, validateProp(key, props, propsData, vm));
    }
  };

  for (var i = 0; i < keys.length; i++) loop( i );
  observerState.shouldConvert = true;
}

function initData (vm) {
  var data = vm.$options.data;
  data = vm._data = typeof data === 'function'
    ? data.call(vm)
    : data || {};
  if (!isPlainObject(data)) {
    data = {};
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    );
  }
  // proxy data on instance
  var keys = Object.keys(data);
  var props = vm.$options.props;
  var i = keys.length;
  while (i--) {
    if (props && hasOwn(props, keys[i])) {
      process.env.NODE_ENV !== 'production' && warn(
        "The data property \"" + (keys[i]) + "\" is already declared as a prop. " +
        "Use prop default value instead.",
        vm
      );
    } else {
      proxy(vm, keys[i]);
    }
  }
  // observe data
  observe(data, true /* asRootData */);
}

var computedSharedDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
};

function initComputed (vm, computed) {
  for (var key in computed) {
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && key in vm) {
      warn(
        "existing instance property \"" + key + "\" will be " +
        "overwritten by a computed property with the same name.",
        vm
      );
    }
    var userDef = computed[key];
    if (typeof userDef === 'function') {
      computedSharedDefinition.get = makeComputedGetter(userDef, vm);
      computedSharedDefinition.set = noop;
    } else {
      computedSharedDefinition.get = userDef.get
        ? userDef.cache !== false
          ? makeComputedGetter(userDef.get, vm)
          : bind$1(userDef.get, vm)
        : noop;
      computedSharedDefinition.set = userDef.set
        ? bind$1(userDef.set, vm)
        : noop;
    }
    Object.defineProperty(vm, key, computedSharedDefinition);
  }
}

function makeComputedGetter (getter, owner) {
  var watcher = new Watcher(owner, getter, noop, {
    lazy: true
  });
  return function computedGetter () {
    if (watcher.dirty) {
      watcher.evaluate();
    }
    if (Dep.target) {
      watcher.depend();
    }
    return watcher.value
  }
}

function initMethods (vm, methods) {
  for (var key in methods) {
    vm[key] = methods[key] == null ? noop : bind$1(methods[key], vm);
    if (process.env.NODE_ENV !== 'production' && methods[key] == null) {
      warn(
        "method \"" + key + "\" has an undefined value in the component definition. " +
        "Did you reference the function correctly?",
        vm
      );
    }
  }
}

function initWatch (vm, watch) {
  for (var key in watch) {
    var handler = watch[key];
    if (Array.isArray(handler)) {
      for (var i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher (vm, key, handler) {
  var options;
  if (isPlainObject(handler)) {
    options = handler;
    handler = handler.handler;
  }
  if (typeof handler === 'string') {
    handler = vm[handler];
  }
  vm.$watch(key, handler, options);
}

function stateMixin (Vue) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  var dataDef = {};
  dataDef.get = function () {
    return this._data
  };
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function (newData) {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      );
    };
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef);

  Vue.prototype.$set = set$1;
  Vue.prototype.$delete = del;

  Vue.prototype.$watch = function (
    expOrFn,
    cb,
    options
  ) {
    var vm = this;
    options = options || {};
    options.user = true;
    var watcher = new Watcher(vm, expOrFn, cb, options);
    if (options.immediate) {
      cb.call(vm, watcher.value);
    }
    return function unwatchFn () {
      watcher.teardown();
    }
  };
}

function proxy (vm, key) {
  if (!isReserved(key)) {
    Object.defineProperty(vm, key, {
      configurable: true,
      enumerable: true,
      get: function proxyGetter () {
        return vm._data[key]
      },
      set: function proxySetter (val) {
        vm._data[key] = val;
      }
    });
  }
}

/*  */

var uid = 0;

function initMixin (Vue) {
  Vue.prototype._init = function (options) {
    var vm = this;
    // a uid
    vm._uid = uid++;
    // a flag to avoid this being observed
    vm._isVue = true;
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options);
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm);
    } else {
      vm._renderProxy = vm;
    }
    // expose real self
    vm._self = vm;
    initLifecycle(vm);
    initEvents(vm);
    initRender(vm);
    callHook(vm, 'beforeCreate');
    initState(vm);
    callHook(vm, 'created');
    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}

function initInternalComponent (vm, options) {
  var opts = vm.$options = Object.create(vm.constructor.options);
  // doing this because it's faster than dynamic enumeration.
  opts.parent = options.parent;
  opts.propsData = options.propsData;
  opts._parentVnode = options._parentVnode;
  opts._parentListeners = options._parentListeners;
  opts._renderChildren = options._renderChildren;
  opts._componentTag = options._componentTag;
  opts._parentElm = options._parentElm;
  opts._refElm = options._refElm;
  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}

function resolveConstructorOptions (Ctor) {
  var options = Ctor.options;
  if (Ctor.super) {
    var superOptions = Ctor.super.options;
    var cachedSuperOptions = Ctor.superOptions;
    var extendOptions = Ctor.extendOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option changed
      Ctor.superOptions = superOptions;
      extendOptions.render = options.render;
      extendOptions.staticRenderFns = options.staticRenderFns;
      extendOptions._scopeId = options._scopeId;
      options = Ctor.options = mergeOptions(superOptions, extendOptions);
      if (options.name) {
        options.components[options.name] = Ctor;
      }
    }
  }
  return options
}

function Vue$2 (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue$2)) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }
  this._init(options);
}

initMixin(Vue$2);
stateMixin(Vue$2);
eventsMixin(Vue$2);
lifecycleMixin(Vue$2);
renderMixin(Vue$2);

/*  */

function initUse (Vue) {
  Vue.use = function (plugin) {
    /* istanbul ignore if */
    if (plugin.installed) {
      return
    }
    // additional parameters
    var args = toArray(arguments, 1);
    args.unshift(this);
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args);
    } else {
      plugin.apply(null, args);
    }
    plugin.installed = true;
    return this
  };
}

/*  */

function initMixin$1 (Vue) {
  Vue.mixin = function (mixin) {
    this.options = mergeOptions(this.options, mixin);
  };
}

/*  */

function initExtend (Vue) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0;
  var cid = 1;

  /**
   * Class inheritance
   */
  Vue.extend = function (extendOptions) {
    extendOptions = extendOptions || {};
    var Super = this;
    var SuperId = Super.cid;
    var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }
    var name = extendOptions.name || Super.options.name;
    if (process.env.NODE_ENV !== 'production') {
      if (!/^[a-zA-Z][\w-]*$/.test(name)) {
        warn(
          'Invalid component name: "' + name + '". Component names ' +
          'can only contain alphanumeric characters and the hyphen, ' +
          'and must start with a letter.'
        );
      }
    }
    var Sub = function VueComponent (options) {
      this._init(options);
    };
    Sub.prototype = Object.create(Super.prototype);
    Sub.prototype.constructor = Sub;
    Sub.cid = cid++;
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    );
    Sub['super'] = Super;
    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend;
    Sub.mixin = Super.mixin;
    Sub.use = Super.use;
    // create asset registers, so extended classes
    // can have their private assets too.
    config._assetTypes.forEach(function (type) {
      Sub[type] = Super[type];
    });
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub;
    }
    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options;
    Sub.extendOptions = extendOptions;
    // cache constructor
    cachedCtors[SuperId] = Sub;
    return Sub
  };
}

/*  */

function initAssetRegisters (Vue) {
  /**
   * Create asset registration methods.
   */
  config._assetTypes.forEach(function (type) {
    Vue[type] = function (
      id,
      definition
    ) {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production') {
          if (type === 'component' && config.isReservedTag(id)) {
            warn(
              'Do not use built-in or reserved HTML elements as component ' +
              'id: ' + id
            );
          }
        }
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id;
          definition = this.options._base.extend(definition);
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition };
        }
        this.options[type + 's'][id] = definition;
        return definition
      }
    };
  });
}

/*  */

var patternTypes = [String, RegExp];

function getComponentName (opts) {
  return opts && (opts.Ctor.options.name || opts.tag)
}

function matches (pattern, name) {
  if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else {
    return pattern.test(name)
  }
}

function pruneCache (cache, filter) {
  for (var key in cache) {
    var cachedNode = cache[key];
    if (cachedNode) {
      var name = getComponentName(cachedNode.componentOptions);
      if (name && !filter(name)) {
        pruneCacheEntry(cachedNode);
        cache[key] = null;
      }
    }
  }
}

function pruneCacheEntry (vnode) {
  if (vnode) {
    if (!vnode.componentInstance._inactive) {
      callHook(vnode.componentInstance, 'deactivated');
    }
    vnode.componentInstance.$destroy();
  }
}

var KeepAlive = {
  name: 'keep-alive',
  abstract: true,

  props: {
    include: patternTypes,
    exclude: patternTypes
  },

  created: function created () {
    this.cache = Object.create(null);
  },

  destroyed: function destroyed () {
    var this$1 = this;

    for (var key in this.cache) {
      pruneCacheEntry(this$1.cache[key]);
    }
  },

  watch: {
    include: function include (val) {
      pruneCache(this.cache, function (name) { return matches(val, name); });
    },
    exclude: function exclude (val) {
      pruneCache(this.cache, function (name) { return !matches(val, name); });
    }
  },

  render: function render () {
    var vnode = getFirstComponentChild(this.$slots.default);
    var componentOptions = vnode && vnode.componentOptions;
    if (componentOptions) {
      // check pattern
      var name = getComponentName(componentOptions);
      if (name && (
        (this.include && !matches(this.include, name)) ||
        (this.exclude && matches(this.exclude, name))
      )) {
        return vnode
      }
      var key = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '')
        : vnode.key;
      if (this.cache[key]) {
        vnode.componentInstance = this.cache[key].componentInstance;
      } else {
        this.cache[key] = vnode;
      }
      vnode.data.keepAlive = true;
    }
    return vnode
  }
};

var builtInComponents = {
  KeepAlive: KeepAlive
};

/*  */

function initGlobalAPI (Vue) {
  // config
  var configDef = {};
  configDef.get = function () { return config; };
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = function () {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      );
    };
  }
  Object.defineProperty(Vue, 'config', configDef);
  Vue.util = util;
  Vue.set = set$1;
  Vue.delete = del;
  Vue.nextTick = nextTick;

  Vue.options = Object.create(null);
  config._assetTypes.forEach(function (type) {
    Vue.options[type + 's'] = Object.create(null);
  });

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue;

  extend(Vue.options.components, builtInComponents);

  initUse(Vue);
  initMixin$1(Vue);
  initExtend(Vue);
  initAssetRegisters(Vue);
}

initGlobalAPI(Vue$2);

Object.defineProperty(Vue$2.prototype, '$isServer', {
  get: isServerRendering
});

Vue$2.version = '2.1.10';

/*  */

// attributes that should be using props for binding
var acceptValue = makeMap('input,textarea,option,select');
var mustUseProp = function (tag, type, attr) {
  return (
    (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
    (attr === 'selected' && tag === 'option') ||
    (attr === 'checked' && tag === 'input') ||
    (attr === 'muted' && tag === 'video')
  )
};

var isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck');

var isBooleanAttr = makeMap(
  'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
  'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
  'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
  'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
  'required,reversed,scoped,seamless,selected,sortable,translate,' +
  'truespeed,typemustmatch,visible'
);

var xlinkNS = 'http://www.w3.org/1999/xlink';

var isXlink = function (name) {
  return name.charAt(5) === ':' && name.slice(0, 5) === 'xlink'
};

var getXlinkProp = function (name) {
  return isXlink(name) ? name.slice(6, name.length) : ''
};

var isFalsyAttrValue = function (val) {
  return val == null || val === false
};

/*  */

function genClassForVnode (vnode) {
  var data = vnode.data;
  var parentNode = vnode;
  var childNode = vnode;
  while (childNode.componentInstance) {
    childNode = childNode.componentInstance._vnode;
    if (childNode.data) {
      data = mergeClassData(childNode.data, data);
    }
  }
  while ((parentNode = parentNode.parent)) {
    if (parentNode.data) {
      data = mergeClassData(data, parentNode.data);
    }
  }
  return genClassFromData(data)
}

function mergeClassData (child, parent) {
  return {
    staticClass: concat(child.staticClass, parent.staticClass),
    class: child.class
      ? [child.class, parent.class]
      : parent.class
  }
}

function genClassFromData (data) {
  var dynamicClass = data.class;
  var staticClass = data.staticClass;
  if (staticClass || dynamicClass) {
    return concat(staticClass, stringifyClass(dynamicClass))
  }
  /* istanbul ignore next */
  return ''
}

function concat (a, b) {
  return a ? b ? (a + ' ' + b) : a : (b || '')
}

function stringifyClass (value) {
  var res = '';
  if (!value) {
    return res
  }
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value)) {
    var stringified;
    for (var i = 0, l = value.length; i < l; i++) {
      if (value[i]) {
        if ((stringified = stringifyClass(value[i]))) {
          res += stringified + ' ';
        }
      }
    }
    return res.slice(0, -1)
  }
  if (isObject(value)) {
    for (var key in value) {
      if (value[key]) { res += key + ' '; }
    }
    return res.slice(0, -1)
  }
  /* istanbul ignore next */
  return res
}

/*  */

var namespaceMap = {
  svg: 'http://www.w3.org/2000/svg',
  math: 'http://www.w3.org/1998/Math/MathML'
};

var isHTMLTag = makeMap(
  'html,body,base,head,link,meta,style,title,' +
  'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
  'div,dd,dl,dt,figcaption,figure,hr,img,li,main,ol,p,pre,ul,' +
  'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
  's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
  'embed,object,param,source,canvas,script,noscript,del,ins,' +
  'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
  'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
  'output,progress,select,textarea,' +
  'details,dialog,menu,menuitem,summary,' +
  'content,element,shadow,template'
);

// this map is intentionally selective, only covering SVG elements that may
// contain child elements.
var isSVG = makeMap(
  'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,' +
  'font-face,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
  'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
  true
);



var isReservedTag = function (tag) {
  return isHTMLTag(tag) || isSVG(tag)
};

function getTagNamespace (tag) {
  if (isSVG(tag)) {
    return 'svg'
  }
  // basic support for MathML
  // note it doesn't support other MathML elements being component roots
  if (tag === 'math') {
    return 'math'
  }
}

var unknownElementCache = Object.create(null);
function isUnknownElement (tag) {
  /* istanbul ignore if */
  if (!inBrowser) {
    return true
  }
  if (isReservedTag(tag)) {
    return false
  }
  tag = tag.toLowerCase();
  /* istanbul ignore if */
  if (unknownElementCache[tag] != null) {
    return unknownElementCache[tag]
  }
  var el = document.createElement(tag);
  if (tag.indexOf('-') > -1) {
    // http://stackoverflow.com/a/28210364/1070244
    return (unknownElementCache[tag] = (
      el.constructor === window.HTMLUnknownElement ||
      el.constructor === window.HTMLElement
    ))
  } else {
    return (unknownElementCache[tag] = /HTMLUnknownElement/.test(el.toString()))
  }
}

/*  */

/**
 * Query an element selector if it's not an element already.
 */
function query (el) {
  if (typeof el === 'string') {
    var selector = el;
    el = document.querySelector(el);
    if (!el) {
      process.env.NODE_ENV !== 'production' && warn(
        'Cannot find element: ' + selector
      );
      return document.createElement('div')
    }
  }
  return el
}

/*  */

function createElement$1 (tagName, vnode) {
  var elm = document.createElement(tagName);
  if (tagName !== 'select') {
    return elm
  }
  if (vnode.data && vnode.data.attrs && 'multiple' in vnode.data.attrs) {
    elm.setAttribute('multiple', 'multiple');
  }
  return elm
}

function createElementNS (namespace, tagName) {
  return document.createElementNS(namespaceMap[namespace], tagName)
}

function createTextNode (text) {
  return document.createTextNode(text)
}

function createComment (text) {
  return document.createComment(text)
}

function insertBefore (parentNode, newNode, referenceNode) {
  parentNode.insertBefore(newNode, referenceNode);
}

function removeChild (node, child) {
  node.removeChild(child);
}

function appendChild (node, child) {
  node.appendChild(child);
}

function parentNode (node) {
  return node.parentNode
}

function nextSibling (node) {
  return node.nextSibling
}

function tagName (node) {
  return node.tagName
}

function setTextContent (node, text) {
  node.textContent = text;
}

function setAttribute (node, key, val) {
  node.setAttribute(key, val);
}


var nodeOps = Object.freeze({
	createElement: createElement$1,
	createElementNS: createElementNS,
	createTextNode: createTextNode,
	createComment: createComment,
	insertBefore: insertBefore,
	removeChild: removeChild,
	appendChild: appendChild,
	parentNode: parentNode,
	nextSibling: nextSibling,
	tagName: tagName,
	setTextContent: setTextContent,
	setAttribute: setAttribute
});

/*  */

var ref = {
  create: function create (_, vnode) {
    registerRef(vnode);
  },
  update: function update (oldVnode, vnode) {
    if (oldVnode.data.ref !== vnode.data.ref) {
      registerRef(oldVnode, true);
      registerRef(vnode);
    }
  },
  destroy: function destroy (vnode) {
    registerRef(vnode, true);
  }
};

function registerRef (vnode, isRemoval) {
  var key = vnode.data.ref;
  if (!key) { return }

  var vm = vnode.context;
  var ref = vnode.componentInstance || vnode.elm;
  var refs = vm.$refs;
  if (isRemoval) {
    if (Array.isArray(refs[key])) {
      remove$1(refs[key], ref);
    } else if (refs[key] === ref) {
      refs[key] = undefined;
    }
  } else {
    if (vnode.data.refInFor) {
      if (Array.isArray(refs[key]) && refs[key].indexOf(ref) < 0) {
        refs[key].push(ref);
      } else {
        refs[key] = [ref];
      }
    } else {
      refs[key] = ref;
    }
  }
}

/**
 * Virtual DOM patching algorithm based on Snabbdom by
 * Simon Friis Vindum (@paldepind)
 * Licensed under the MIT License
 * https://github.com/paldepind/snabbdom/blob/master/LICENSE
 *
 * modified by Evan You (@yyx990803)
 *

/*
 * Not type-checking this because this file is perf-critical and the cost
 * of making flow understand it is not worth it.
 */

var emptyNode = new VNode('', {}, []);

var hooks$1 = ['create', 'activate', 'update', 'remove', 'destroy'];

function isUndef (s) {
  return s == null
}

function isDef (s) {
  return s != null
}

function sameVnode (vnode1, vnode2) {
  return (
    vnode1.key === vnode2.key &&
    vnode1.tag === vnode2.tag &&
    vnode1.isComment === vnode2.isComment &&
    !vnode1.data === !vnode2.data
  )
}

function createKeyToOldIdx (children, beginIdx, endIdx) {
  var i, key;
  var map = {};
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key;
    if (isDef(key)) { map[key] = i; }
  }
  return map
}

function createPatchFunction (backend) {
  var i, j;
  var cbs = {};

  var modules = backend.modules;
  var nodeOps = backend.nodeOps;

  for (i = 0; i < hooks$1.length; ++i) {
    cbs[hooks$1[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      if (modules[j][hooks$1[i]] !== undefined) { cbs[hooks$1[i]].push(modules[j][hooks$1[i]]); }
    }
  }

  function emptyNodeAt (elm) {
    return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
  }

  function createRmCb (childElm, listeners) {
    function remove$$1 () {
      if (--remove$$1.listeners === 0) {
        removeNode(childElm);
      }
    }
    remove$$1.listeners = listeners;
    return remove$$1
  }

  function removeNode (el) {
    var parent = nodeOps.parentNode(el);
    // element may have already been removed due to v-html / v-text
    if (parent) {
      nodeOps.removeChild(parent, el);
    }
  }

  var inPre = 0;
  function createElm (vnode, insertedVnodeQueue, parentElm, refElm, nested) {
    vnode.isRootInsert = !nested; // for transition enter check
    if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }

    var data = vnode.data;
    var children = vnode.children;
    var tag = vnode.tag;
    if (isDef(tag)) {
      if (process.env.NODE_ENV !== 'production') {
        if (data && data.pre) {
          inPre++;
        }
        if (
          !inPre &&
          !vnode.ns &&
          !(config.ignoredElements.length && config.ignoredElements.indexOf(tag) > -1) &&
          config.isUnknownElement(tag)
        ) {
          warn(
            'Unknown custom element: <' + tag + '> - did you ' +
            'register the component correctly? For recursive components, ' +
            'make sure to provide the "name" option.',
            vnode.context
          );
        }
      }
      vnode.elm = vnode.ns
        ? nodeOps.createElementNS(vnode.ns, tag)
        : nodeOps.createElement(tag, vnode);
      setScope(vnode);

      /* istanbul ignore if */
      {
        createChildren(vnode, children, insertedVnodeQueue);
        if (isDef(data)) {
          invokeCreateHooks(vnode, insertedVnodeQueue);
        }
        insert(parentElm, vnode.elm, refElm);
      }

      if (process.env.NODE_ENV !== 'production' && data && data.pre) {
        inPre--;
      }
    } else if (vnode.isComment) {
      vnode.elm = nodeOps.createComment(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    } else {
      vnode.elm = nodeOps.createTextNode(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    }
  }

  function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    var i = vnode.data;
    if (isDef(i)) {
      var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
      if (isDef(i = i.hook) && isDef(i = i.init)) {
        i(vnode, false /* hydrating */, parentElm, refElm);
      }
      // after calling the init hook, if the vnode is a child component
      // it should've created a child instance and mounted it. the child
      // component also has set the placeholder vnode's elm.
      // in that case we can just return the element and be done.
      if (isDef(vnode.componentInstance)) {
        initComponent(vnode, insertedVnodeQueue);
        if (isReactivated) {
          reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
        }
        return true
      }
    }
  }

  function initComponent (vnode, insertedVnodeQueue) {
    if (vnode.data.pendingInsert) {
      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert);
    }
    vnode.elm = vnode.componentInstance.$el;
    if (isPatchable(vnode)) {
      invokeCreateHooks(vnode, insertedVnodeQueue);
      setScope(vnode);
    } else {
      // empty component root.
      // skip all element-related modules except for ref (#3455)
      registerRef(vnode);
      // make sure to invoke the insert hook
      insertedVnodeQueue.push(vnode);
    }
  }

  function reactivateComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    var i;
    // hack for #4339: a reactivated component with inner transition
    // does not trigger because the inner node's created hooks are not called
    // again. It's not ideal to involve module-specific logic in here but
    // there doesn't seem to be a better way to do it.
    var innerNode = vnode;
    while (innerNode.componentInstance) {
      innerNode = innerNode.componentInstance._vnode;
      if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
        for (i = 0; i < cbs.activate.length; ++i) {
          cbs.activate[i](emptyNode, innerNode);
        }
        insertedVnodeQueue.push(innerNode);
        break
      }
    }
    // unlike a newly created component,
    // a reactivated keep-alive component doesn't insert itself
    insert(parentElm, vnode.elm, refElm);
  }

  function insert (parent, elm, ref) {
    if (parent) {
      if (ref) {
        nodeOps.insertBefore(parent, elm, ref);
      } else {
        nodeOps.appendChild(parent, elm);
      }
    }
  }

  function createChildren (vnode, children, insertedVnodeQueue) {
    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; ++i) {
        createElm(children[i], insertedVnodeQueue, vnode.elm, null, true);
      }
    } else if (isPrimitive(vnode.text)) {
      nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(vnode.text));
    }
  }

  function isPatchable (vnode) {
    while (vnode.componentInstance) {
      vnode = vnode.componentInstance._vnode;
    }
    return isDef(vnode.tag)
  }

  function invokeCreateHooks (vnode, insertedVnodeQueue) {
    for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
      cbs.create[i$1](emptyNode, vnode);
    }
    i = vnode.data.hook; // Reuse variable
    if (isDef(i)) {
      if (i.create) { i.create(emptyNode, vnode); }
      if (i.insert) { insertedVnodeQueue.push(vnode); }
    }
  }

  // set scope id attribute for scoped CSS.
  // this is implemented as a special case to avoid the overhead
  // of going through the normal attribute patching process.
  function setScope (vnode) {
    var i;
    if (isDef(i = vnode.context) && isDef(i = i.$options._scopeId)) {
      nodeOps.setAttribute(vnode.elm, i, '');
    }
    if (isDef(i = activeInstance) &&
        i !== vnode.context &&
        isDef(i = i.$options._scopeId)) {
      nodeOps.setAttribute(vnode.elm, i, '');
    }
  }

  function addVnodes (parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
    for (; startIdx <= endIdx; ++startIdx) {
      createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm);
    }
  }

  function invokeDestroyHook (vnode) {
    var i, j;
    var data = vnode.data;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.destroy)) { i(vnode); }
      for (i = 0; i < cbs.destroy.length; ++i) { cbs.destroy[i](vnode); }
    }
    if (isDef(i = vnode.children)) {
      for (j = 0; j < vnode.children.length; ++j) {
        invokeDestroyHook(vnode.children[j]);
      }
    }
  }

  function removeVnodes (parentElm, vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      var ch = vnodes[startIdx];
      if (isDef(ch)) {
        if (isDef(ch.tag)) {
          removeAndInvokeRemoveHook(ch);
          invokeDestroyHook(ch);
        } else { // Text node
          removeNode(ch.elm);
        }
      }
    }
  }

  function removeAndInvokeRemoveHook (vnode, rm) {
    if (rm || isDef(vnode.data)) {
      var listeners = cbs.remove.length + 1;
      if (!rm) {
        // directly removing
        rm = createRmCb(vnode.elm, listeners);
      } else {
        // we have a recursively passed down rm callback
        // increase the listeners count
        rm.listeners += listeners;
      }
      // recursively invoke hooks on child component root node
      if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
        removeAndInvokeRemoveHook(i, rm);
      }
      for (i = 0; i < cbs.remove.length; ++i) {
        cbs.remove[i](vnode, rm);
      }
      if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
        i(vnode, rm);
      } else {
        rm();
      }
    } else {
      removeNode(vnode.elm);
    }
  }

  function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
    var oldStartIdx = 0;
    var newStartIdx = 0;
    var oldEndIdx = oldCh.length - 1;
    var oldStartVnode = oldCh[0];
    var oldEndVnode = oldCh[oldEndIdx];
    var newEndIdx = newCh.length - 1;
    var newStartVnode = newCh[0];
    var newEndVnode = newCh[newEndIdx];
    var oldKeyToIdx, idxInOld, elmToMove, refElm;

    // removeOnly is a special flag used only by <transition-group>
    // to ensure removed elements stay in correct relative positions
    // during leaving transitions
    var canMove = !removeOnly;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (isUndef(oldStartVnode)) {
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
      } else if (isUndef(oldEndVnode)) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
        canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
        canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        if (isUndef(oldKeyToIdx)) { oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx); }
        idxInOld = isDef(newStartVnode.key) ? oldKeyToIdx[newStartVnode.key] : null;
        if (isUndef(idxInOld)) { // New element
          createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm);
          newStartVnode = newCh[++newStartIdx];
        } else {
          elmToMove = oldCh[idxInOld];
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !elmToMove) {
            warn(
              'It seems there are duplicate keys that is causing an update error. ' +
              'Make sure each v-for item has a unique key.'
            );
          }
          if (sameVnode(elmToMove, newStartVnode)) {
            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
            oldCh[idxInOld] = undefined;
            canMove && nodeOps.insertBefore(parentElm, newStartVnode.elm, oldStartVnode.elm);
            newStartVnode = newCh[++newStartIdx];
          } else {
            // same key but different element. treat as new element
            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm);
            newStartVnode = newCh[++newStartIdx];
          }
        }
      }
    }
    if (oldStartIdx > oldEndIdx) {
      refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
      addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
    } else if (newStartIdx > newEndIdx) {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }

  function patchVnode (oldVnode, vnode, insertedVnodeQueue, removeOnly) {
    if (oldVnode === vnode) {
      return
    }
    // reuse element for static trees.
    // note we only do this if the vnode is cloned -
    // if the new node is not cloned it means the render functions have been
    // reset by the hot-reload-api and we need to do a proper re-render.
    if (vnode.isStatic &&
        oldVnode.isStatic &&
        vnode.key === oldVnode.key &&
        (vnode.isCloned || vnode.isOnce)) {
      vnode.elm = oldVnode.elm;
      vnode.componentInstance = oldVnode.componentInstance;
      return
    }
    var i;
    var data = vnode.data;
    var hasData = isDef(data);
    if (hasData && isDef(i = data.hook) && isDef(i = i.prepatch)) {
      i(oldVnode, vnode);
    }
    var elm = vnode.elm = oldVnode.elm;
    var oldCh = oldVnode.children;
    var ch = vnode.children;
    if (hasData && isPatchable(vnode)) {
      for (i = 0; i < cbs.update.length; ++i) { cbs.update[i](oldVnode, vnode); }
      if (isDef(i = data.hook) && isDef(i = i.update)) { i(oldVnode, vnode); }
    }
    if (isUndef(vnode.text)) {
      if (isDef(oldCh) && isDef(ch)) {
        if (oldCh !== ch) { updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly); }
      } else if (isDef(ch)) {
        if (isDef(oldVnode.text)) { nodeOps.setTextContent(elm, ''); }
        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
      } else if (isDef(oldCh)) {
        removeVnodes(elm, oldCh, 0, oldCh.length - 1);
      } else if (isDef(oldVnode.text)) {
        nodeOps.setTextContent(elm, '');
      }
    } else if (oldVnode.text !== vnode.text) {
      nodeOps.setTextContent(elm, vnode.text);
    }
    if (hasData) {
      if (isDef(i = data.hook) && isDef(i = i.postpatch)) { i(oldVnode, vnode); }
    }
  }

  function invokeInsertHook (vnode, queue, initial) {
    // delay insert hooks for component root nodes, invoke them after the
    // element is really inserted
    if (initial && vnode.parent) {
      vnode.parent.data.pendingInsert = queue;
    } else {
      for (var i = 0; i < queue.length; ++i) {
        queue[i].data.hook.insert(queue[i]);
      }
    }
  }

  var bailed = false;
  // list of modules that can skip create hook during hydration because they
  // are already rendered on the client or has no need for initialization
  var isRenderedModule = makeMap('attrs,style,class,staticClass,staticStyle,key');

  // Note: this is a browser-only function so we can assume elms are DOM nodes.
  function hydrate (elm, vnode, insertedVnodeQueue) {
    if (process.env.NODE_ENV !== 'production') {
      if (!assertNodeMatch(elm, vnode)) {
        return false
      }
    }
    vnode.elm = elm;
    var tag = vnode.tag;
    var data = vnode.data;
    var children = vnode.children;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.init)) { i(vnode, true /* hydrating */); }
      if (isDef(i = vnode.componentInstance)) {
        // child component. it should have hydrated its own tree.
        initComponent(vnode, insertedVnodeQueue);
        return true
      }
    }
    if (isDef(tag)) {
      if (isDef(children)) {
        // empty element, allow client to pick up and populate children
        if (!elm.hasChildNodes()) {
          createChildren(vnode, children, insertedVnodeQueue);
        } else {
          var childrenMatch = true;
          var childNode = elm.firstChild;
          for (var i$1 = 0; i$1 < children.length; i$1++) {
            if (!childNode || !hydrate(childNode, children[i$1], insertedVnodeQueue)) {
              childrenMatch = false;
              break
            }
            childNode = childNode.nextSibling;
          }
          // if childNode is not null, it means the actual childNodes list is
          // longer than the virtual children list.
          if (!childrenMatch || childNode) {
            if (process.env.NODE_ENV !== 'production' &&
                typeof console !== 'undefined' &&
                !bailed) {
              bailed = true;
              console.warn('Parent: ', elm);
              console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children);
            }
            return false
          }
        }
      }
      if (isDef(data)) {
        for (var key in data) {
          if (!isRenderedModule(key)) {
            invokeCreateHooks(vnode, insertedVnodeQueue);
            break
          }
        }
      }
    } else if (elm.data !== vnode.text) {
      elm.data = vnode.text;
    }
    return true
  }

  function assertNodeMatch (node, vnode) {
    if (vnode.tag) {
      return (
        vnode.tag.indexOf('vue-component') === 0 ||
        vnode.tag.toLowerCase() === (node.tagName && node.tagName.toLowerCase())
      )
    } else {
      return node.nodeType === (vnode.isComment ? 8 : 3)
    }
  }

  return function patch (oldVnode, vnode, hydrating, removeOnly, parentElm, refElm) {
    if (!vnode) {
      if (oldVnode) { invokeDestroyHook(oldVnode); }
      return
    }

    var isInitialPatch = false;
    var insertedVnodeQueue = [];

    if (!oldVnode) {
      // empty mount (likely as component), create new root element
      isInitialPatch = true;
      createElm(vnode, insertedVnodeQueue, parentElm, refElm);
    } else {
      var isRealElement = isDef(oldVnode.nodeType);
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // patch existing root node
        patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly);
      } else {
        if (isRealElement) {
          // mounting to a real element
          // check if this is server-rendered content and if we can perform
          // a successful hydration.
          if (oldVnode.nodeType === 1 && oldVnode.hasAttribute('server-rendered')) {
            oldVnode.removeAttribute('server-rendered');
            hydrating = true;
          }
          if (hydrating) {
            if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
              invokeInsertHook(vnode, insertedVnodeQueue, true);
              return oldVnode
            } else if (process.env.NODE_ENV !== 'production') {
              warn(
                'The client-side rendered virtual DOM tree is not matching ' +
                'server-rendered content. This is likely caused by incorrect ' +
                'HTML markup, for example nesting block-level elements inside ' +
                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                'full client-side render.'
              );
            }
          }
          // either not server-rendered, or hydration failed.
          // create an empty node and replace it
          oldVnode = emptyNodeAt(oldVnode);
        }
        // replacing existing element
        var oldElm = oldVnode.elm;
        var parentElm$1 = nodeOps.parentNode(oldElm);
        createElm(
          vnode,
          insertedVnodeQueue,
          // extremely rare edge case: do not insert if old element is in a
          // leaving transition. Only happens when combining transition +
          // keep-alive + HOCs. (#4590)
          oldElm._leaveCb ? null : parentElm$1,
          nodeOps.nextSibling(oldElm)
        );

        if (vnode.parent) {
          // component root element replaced.
          // update parent placeholder node element, recursively
          var ancestor = vnode.parent;
          while (ancestor) {
            ancestor.elm = vnode.elm;
            ancestor = ancestor.parent;
          }
          if (isPatchable(vnode)) {
            for (var i = 0; i < cbs.create.length; ++i) {
              cbs.create[i](emptyNode, vnode.parent);
            }
          }
        }

        if (parentElm$1 !== null) {
          removeVnodes(parentElm$1, [oldVnode], 0, 0);
        } else if (isDef(oldVnode.tag)) {
          invokeDestroyHook(oldVnode);
        }
      }
    }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
    return vnode.elm
  }
}

/*  */

var directives = {
  create: updateDirectives,
  update: updateDirectives,
  destroy: function unbindDirectives (vnode) {
    updateDirectives(vnode, emptyNode);
  }
};

function updateDirectives (oldVnode, vnode) {
  if (oldVnode.data.directives || vnode.data.directives) {
    _update(oldVnode, vnode);
  }
}

function _update (oldVnode, vnode) {
  var isCreate = oldVnode === emptyNode;
  var isDestroy = vnode === emptyNode;
  var oldDirs = normalizeDirectives$1(oldVnode.data.directives, oldVnode.context);
  var newDirs = normalizeDirectives$1(vnode.data.directives, vnode.context);

  var dirsWithInsert = [];
  var dirsWithPostpatch = [];

  var key, oldDir, dir;
  for (key in newDirs) {
    oldDir = oldDirs[key];
    dir = newDirs[key];
    if (!oldDir) {
      // new directive, bind
      callHook$1(dir, 'bind', vnode, oldVnode);
      if (dir.def && dir.def.inserted) {
        dirsWithInsert.push(dir);
      }
    } else {
      // existing directive, update
      dir.oldValue = oldDir.value;
      callHook$1(dir, 'update', vnode, oldVnode);
      if (dir.def && dir.def.componentUpdated) {
        dirsWithPostpatch.push(dir);
      }
    }
  }

  if (dirsWithInsert.length) {
    var callInsert = function () {
      for (var i = 0; i < dirsWithInsert.length; i++) {
        callHook$1(dirsWithInsert[i], 'inserted', vnode, oldVnode);
      }
    };
    if (isCreate) {
      mergeVNodeHook(vnode.data.hook || (vnode.data.hook = {}), 'insert', callInsert, 'dir-insert');
    } else {
      callInsert();
    }
  }

  if (dirsWithPostpatch.length) {
    mergeVNodeHook(vnode.data.hook || (vnode.data.hook = {}), 'postpatch', function () {
      for (var i = 0; i < dirsWithPostpatch.length; i++) {
        callHook$1(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode);
      }
    }, 'dir-postpatch');
  }

  if (!isCreate) {
    for (key in oldDirs) {
      if (!newDirs[key]) {
        // no longer present, unbind
        callHook$1(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy);
      }
    }
  }
}

var emptyModifiers = Object.create(null);

function normalizeDirectives$1 (
  dirs,
  vm
) {
  var res = Object.create(null);
  if (!dirs) {
    return res
  }
  var i, dir;
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i];
    if (!dir.modifiers) {
      dir.modifiers = emptyModifiers;
    }
    res[getRawDirName(dir)] = dir;
    dir.def = resolveAsset(vm.$options, 'directives', dir.name, true);
  }
  return res
}

function getRawDirName (dir) {
  return dir.rawName || ((dir.name) + "." + (Object.keys(dir.modifiers || {}).join('.')))
}

function callHook$1 (dir, hook, vnode, oldVnode, isDestroy) {
  var fn = dir.def && dir.def[hook];
  if (fn) {
    fn(vnode.elm, dir, vnode, oldVnode, isDestroy);
  }
}

var baseModules = [
  ref,
  directives
];

/*  */

function updateAttrs (oldVnode, vnode) {
  if (!oldVnode.data.attrs && !vnode.data.attrs) {
    return
  }
  var key, cur, old;
  var elm = vnode.elm;
  var oldAttrs = oldVnode.data.attrs || {};
  var attrs = vnode.data.attrs || {};
  // clone observed objects, as the user probably wants to mutate it
  if (attrs.__ob__) {
    attrs = vnode.data.attrs = extend({}, attrs);
  }

  for (key in attrs) {
    cur = attrs[key];
    old = oldAttrs[key];
    if (old !== cur) {
      setAttr(elm, key, cur);
    }
  }
  // #4391: in IE9, setting type can reset value for input[type=radio]
  /* istanbul ignore if */
  if (isIE9 && attrs.value !== oldAttrs.value) {
    setAttr(elm, 'value', attrs.value);
  }
  for (key in oldAttrs) {
    if (attrs[key] == null) {
      if (isXlink(key)) {
        elm.removeAttributeNS(xlinkNS, getXlinkProp(key));
      } else if (!isEnumeratedAttr(key)) {
        elm.removeAttribute(key);
      }
    }
  }
}

function setAttr (el, key, value) {
  if (isBooleanAttr(key)) {
    // set attribute for blank value
    // e.g. <option disabled>Select one</option>
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, key);
    }
  } else if (isEnumeratedAttr(key)) {
    el.setAttribute(key, isFalsyAttrValue(value) || value === 'false' ? 'false' : 'true');
  } else if (isXlink(key)) {
    if (isFalsyAttrValue(value)) {
      el.removeAttributeNS(xlinkNS, getXlinkProp(key));
    } else {
      el.setAttributeNS(xlinkNS, key, value);
    }
  } else {
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
  }
}

var attrs = {
  create: updateAttrs,
  update: updateAttrs
};

/*  */

function updateClass (oldVnode, vnode) {
  var el = vnode.elm;
  var data = vnode.data;
  var oldData = oldVnode.data;
  if (!data.staticClass && !data.class &&
      (!oldData || (!oldData.staticClass && !oldData.class))) {
    return
  }

  var cls = genClassForVnode(vnode);

  // handle transition classes
  var transitionClass = el._transitionClasses;
  if (transitionClass) {
    cls = concat(cls, stringifyClass(transitionClass));
  }

  // set the class
  if (cls !== el._prevClass) {
    el.setAttribute('class', cls);
    el._prevClass = cls;
  }
}

var klass = {
  create: updateClass,
  update: updateClass
};

/*  */

var target$1;

function add$2 (
  event,
  handler,
  once,
  capture
) {
  if (once) {
    var oldHandler = handler;
    var _target = target$1; // save current target element in closure
    handler = function (ev) {
      remove$3(event, handler, capture, _target);
      arguments.length === 1
        ? oldHandler(ev)
        : oldHandler.apply(null, arguments);
    };
  }
  target$1.addEventListener(event, handler, capture);
}

function remove$3 (
  event,
  handler,
  capture,
  _target
) {
  (_target || target$1).removeEventListener(event, handler, capture);
}

function updateDOMListeners (oldVnode, vnode) {
  if (!oldVnode.data.on && !vnode.data.on) {
    return
  }
  var on = vnode.data.on || {};
  var oldOn = oldVnode.data.on || {};
  target$1 = vnode.elm;
  updateListeners(on, oldOn, add$2, remove$3, vnode.context);
}

var events = {
  create: updateDOMListeners,
  update: updateDOMListeners
};

/*  */

function updateDOMProps (oldVnode, vnode) {
  if (!oldVnode.data.domProps && !vnode.data.domProps) {
    return
  }
  var key, cur;
  var elm = vnode.elm;
  var oldProps = oldVnode.data.domProps || {};
  var props = vnode.data.domProps || {};
  // clone observed objects, as the user probably wants to mutate it
  if (props.__ob__) {
    props = vnode.data.domProps = extend({}, props);
  }

  for (key in oldProps) {
    if (props[key] == null) {
      elm[key] = '';
    }
  }
  for (key in props) {
    cur = props[key];
    // ignore children if the node has textContent or innerHTML,
    // as these will throw away existing DOM nodes and cause removal errors
    // on subsequent patches (#3360)
    if (key === 'textContent' || key === 'innerHTML') {
      if (vnode.children) { vnode.children.length = 0; }
      if (cur === oldProps[key]) { continue }
    }

    if (key === 'value') {
      // store value as _value as well since
      // non-string values will be stringified
      elm._value = cur;
      // avoid resetting cursor position when value is the same
      var strCur = cur == null ? '' : String(cur);
      if (shouldUpdateValue(elm, vnode, strCur)) {
        elm.value = strCur;
      }
    } else {
      elm[key] = cur;
    }
  }
}

// check platforms/web/util/attrs.js acceptValue


function shouldUpdateValue (
  elm,
  vnode,
  checkVal
) {
  return (!elm.composing && (
    vnode.tag === 'option' ||
    isDirty(elm, checkVal) ||
    isInputChanged(vnode, checkVal)
  ))
}

function isDirty (elm, checkVal) {
  // return true when textbox (.number and .trim) loses focus and its value is not equal to the updated value
  return document.activeElement !== elm && elm.value !== checkVal
}

function isInputChanged (vnode, newVal) {
  var value = vnode.elm.value;
  var modifiers = vnode.elm._vModifiers; // injected by v-model runtime
  if ((modifiers && modifiers.number) || vnode.elm.type === 'number') {
    return toNumber(value) !== toNumber(newVal)
  }
  if (modifiers && modifiers.trim) {
    return value.trim() !== newVal.trim()
  }
  return value !== newVal
}

var domProps = {
  create: updateDOMProps,
  update: updateDOMProps
};

/*  */

var parseStyleText = cached(function (cssText) {
  var res = {};
  var listDelimiter = /;(?![^(]*\))/g;
  var propertyDelimiter = /:(.+)/;
  cssText.split(listDelimiter).forEach(function (item) {
    if (item) {
      var tmp = item.split(propertyDelimiter);
      tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return res
});

// merge static and dynamic style data on the same vnode
function normalizeStyleData (data) {
  var style = normalizeStyleBinding(data.style);
  // static style is pre-processed into an object during compilation
  // and is always a fresh object, so it's safe to merge into it
  return data.staticStyle
    ? extend(data.staticStyle, style)
    : style
}

// normalize possible array / string values into Object
function normalizeStyleBinding (bindingStyle) {
  if (Array.isArray(bindingStyle)) {
    return toObject(bindingStyle)
  }
  if (typeof bindingStyle === 'string') {
    return parseStyleText(bindingStyle)
  }
  return bindingStyle
}

/**
 * parent component style should be after child's
 * so that parent component's style could override it
 */
function getStyle (vnode, checkChild) {
  var res = {};
  var styleData;

  if (checkChild) {
    var childNode = vnode;
    while (childNode.componentInstance) {
      childNode = childNode.componentInstance._vnode;
      if (childNode.data && (styleData = normalizeStyleData(childNode.data))) {
        extend(res, styleData);
      }
    }
  }

  if ((styleData = normalizeStyleData(vnode.data))) {
    extend(res, styleData);
  }

  var parentNode = vnode;
  while ((parentNode = parentNode.parent)) {
    if (parentNode.data && (styleData = normalizeStyleData(parentNode.data))) {
      extend(res, styleData);
    }
  }
  return res
}

/*  */

var cssVarRE = /^--/;
var importantRE = /\s*!important$/;
var setProp = function (el, name, val) {
  /* istanbul ignore if */
  if (cssVarRE.test(name)) {
    el.style.setProperty(name, val);
  } else if (importantRE.test(val)) {
    el.style.setProperty(name, val.replace(importantRE, ''), 'important');
  } else {
    el.style[normalize(name)] = val;
  }
};

var prefixes = ['Webkit', 'Moz', 'ms'];

var testEl;
var normalize = cached(function (prop) {
  testEl = testEl || document.createElement('div');
  prop = camelize(prop);
  if (prop !== 'filter' && (prop in testEl.style)) {
    return prop
  }
  var upper = prop.charAt(0).toUpperCase() + prop.slice(1);
  for (var i = 0; i < prefixes.length; i++) {
    var prefixed = prefixes[i] + upper;
    if (prefixed in testEl.style) {
      return prefixed
    }
  }
});

function updateStyle (oldVnode, vnode) {
  var data = vnode.data;
  var oldData = oldVnode.data;

  if (!data.staticStyle && !data.style &&
      !oldData.staticStyle && !oldData.style) {
    return
  }

  var cur, name;
  var el = vnode.elm;
  var oldStaticStyle = oldVnode.data.staticStyle;
  var oldStyleBinding = oldVnode.data.style || {};

  // if static style exists, stylebinding already merged into it when doing normalizeStyleData
  var oldStyle = oldStaticStyle || oldStyleBinding;

  var style = normalizeStyleBinding(vnode.data.style) || {};

  vnode.data.style = style.__ob__ ? extend({}, style) : style;

  var newStyle = getStyle(vnode, true);

  for (name in oldStyle) {
    if (newStyle[name] == null) {
      setProp(el, name, '');
    }
  }
  for (name in newStyle) {
    cur = newStyle[name];
    if (cur !== oldStyle[name]) {
      // ie9 setting to null has no effect, must use empty string
      setProp(el, name, cur == null ? '' : cur);
    }
  }
}

var style = {
  create: updateStyle,
  update: updateStyle
};

/*  */

/**
 * Add class with compatibility for SVG since classList is not supported on
 * SVG elements in IE
 */
function addClass (el, cls) {
  /* istanbul ignore if */
  if (!cls || !cls.trim()) {
    return
  }

  /* istanbul ignore else */
  if (el.classList) {
    if (cls.indexOf(' ') > -1) {
      cls.split(/\s+/).forEach(function (c) { return el.classList.add(c); });
    } else {
      el.classList.add(cls);
    }
  } else {
    var cur = ' ' + el.getAttribute('class') + ' ';
    if (cur.indexOf(' ' + cls + ' ') < 0) {
      el.setAttribute('class', (cur + cls).trim());
    }
  }
}

/**
 * Remove class with compatibility for SVG since classList is not supported on
 * SVG elements in IE
 */
function removeClass (el, cls) {
  /* istanbul ignore if */
  if (!cls || !cls.trim()) {
    return
  }

  /* istanbul ignore else */
  if (el.classList) {
    if (cls.indexOf(' ') > -1) {
      cls.split(/\s+/).forEach(function (c) { return el.classList.remove(c); });
    } else {
      el.classList.remove(cls);
    }
  } else {
    var cur = ' ' + el.getAttribute('class') + ' ';
    var tar = ' ' + cls + ' ';
    while (cur.indexOf(tar) >= 0) {
      cur = cur.replace(tar, ' ');
    }
    el.setAttribute('class', cur.trim());
  }
}

/*  */

var hasTransition = inBrowser && !isIE9;
var TRANSITION = 'transition';
var ANIMATION = 'animation';

// Transition property/event sniffing
var transitionProp = 'transition';
var transitionEndEvent = 'transitionend';
var animationProp = 'animation';
var animationEndEvent = 'animationend';
if (hasTransition) {
  /* istanbul ignore if */
  if (window.ontransitionend === undefined &&
    window.onwebkittransitionend !== undefined) {
    transitionProp = 'WebkitTransition';
    transitionEndEvent = 'webkitTransitionEnd';
  }
  if (window.onanimationend === undefined &&
    window.onwebkitanimationend !== undefined) {
    animationProp = 'WebkitAnimation';
    animationEndEvent = 'webkitAnimationEnd';
  }
}

// binding to window is necessary to make hot reload work in IE in strict mode
var raf = inBrowser && window.requestAnimationFrame
  ? window.requestAnimationFrame.bind(window)
  : setTimeout;

function nextFrame (fn) {
  raf(function () {
    raf(fn);
  });
}

function addTransitionClass (el, cls) {
  (el._transitionClasses || (el._transitionClasses = [])).push(cls);
  addClass(el, cls);
}

function removeTransitionClass (el, cls) {
  if (el._transitionClasses) {
    remove$1(el._transitionClasses, cls);
  }
  removeClass(el, cls);
}

function whenTransitionEnds (
  el,
  expectedType,
  cb
) {
  var ref = getTransitionInfo(el, expectedType);
  var type = ref.type;
  var timeout = ref.timeout;
  var propCount = ref.propCount;
  if (!type) { return cb() }
  var event = type === TRANSITION ? transitionEndEvent : animationEndEvent;
  var ended = 0;
  var end = function () {
    el.removeEventListener(event, onEnd);
    cb();
  };
  var onEnd = function (e) {
    if (e.target === el) {
      if (++ended >= propCount) {
        end();
      }
    }
  };
  setTimeout(function () {
    if (ended < propCount) {
      end();
    }
  }, timeout + 1);
  el.addEventListener(event, onEnd);
}

var transformRE = /\b(transform|all)(,|$)/;

function getTransitionInfo (el, expectedType) {
  var styles = window.getComputedStyle(el);
  var transitioneDelays = styles[transitionProp + 'Delay'].split(', ');
  var transitionDurations = styles[transitionProp + 'Duration'].split(', ');
  var transitionTimeout = getTimeout(transitioneDelays, transitionDurations);
  var animationDelays = styles[animationProp + 'Delay'].split(', ');
  var animationDurations = styles[animationProp + 'Duration'].split(', ');
  var animationTimeout = getTimeout(animationDelays, animationDurations);

  var type;
  var timeout = 0;
  var propCount = 0;
  /* istanbul ignore if */
  if (expectedType === TRANSITION) {
    if (transitionTimeout > 0) {
      type = TRANSITION;
      timeout = transitionTimeout;
      propCount = transitionDurations.length;
    }
  } else if (expectedType === ANIMATION) {
    if (animationTimeout > 0) {
      type = ANIMATION;
      timeout = animationTimeout;
      propCount = animationDurations.length;
    }
  } else {
    timeout = Math.max(transitionTimeout, animationTimeout);
    type = timeout > 0
      ? transitionTimeout > animationTimeout
        ? TRANSITION
        : ANIMATION
      : null;
    propCount = type
      ? type === TRANSITION
        ? transitionDurations.length
        : animationDurations.length
      : 0;
  }
  var hasTransform =
    type === TRANSITION &&
    transformRE.test(styles[transitionProp + 'Property']);
  return {
    type: type,
    timeout: timeout,
    propCount: propCount,
    hasTransform: hasTransform
  }
}

function getTimeout (delays, durations) {
  /* istanbul ignore next */
  while (delays.length < durations.length) {
    delays = delays.concat(delays);
  }

  return Math.max.apply(null, durations.map(function (d, i) {
    return toMs(d) + toMs(delays[i])
  }))
}

function toMs (s) {
  return Number(s.slice(0, -1)) * 1000
}

/*  */

function enter (vnode, toggleDisplay) {
  var el = vnode.elm;

  // call leave callback now
  if (el._leaveCb) {
    el._leaveCb.cancelled = true;
    el._leaveCb();
  }

  var data = resolveTransition(vnode.data.transition);
  if (!data) {
    return
  }

  /* istanbul ignore if */
  if (el._enterCb || el.nodeType !== 1) {
    return
  }

  var css = data.css;
  var type = data.type;
  var enterClass = data.enterClass;
  var enterToClass = data.enterToClass;
  var enterActiveClass = data.enterActiveClass;
  var appearClass = data.appearClass;
  var appearToClass = data.appearToClass;
  var appearActiveClass = data.appearActiveClass;
  var beforeEnter = data.beforeEnter;
  var enter = data.enter;
  var afterEnter = data.afterEnter;
  var enterCancelled = data.enterCancelled;
  var beforeAppear = data.beforeAppear;
  var appear = data.appear;
  var afterAppear = data.afterAppear;
  var appearCancelled = data.appearCancelled;

  // activeInstance will always be the <transition> component managing this
  // transition. One edge case to check is when the <transition> is placed
  // as the root node of a child component. In that case we need to check
  // <transition>'s parent for appear check.
  var context = activeInstance;
  var transitionNode = activeInstance.$vnode;
  while (transitionNode && transitionNode.parent) {
    transitionNode = transitionNode.parent;
    context = transitionNode.context;
  }

  var isAppear = !context._isMounted || !vnode.isRootInsert;

  if (isAppear && !appear && appear !== '') {
    return
  }

  var startClass = isAppear ? appearClass : enterClass;
  var activeClass = isAppear ? appearActiveClass : enterActiveClass;
  var toClass = isAppear ? appearToClass : enterToClass;
  var beforeEnterHook = isAppear ? (beforeAppear || beforeEnter) : beforeEnter;
  var enterHook = isAppear ? (typeof appear === 'function' ? appear : enter) : enter;
  var afterEnterHook = isAppear ? (afterAppear || afterEnter) : afterEnter;
  var enterCancelledHook = isAppear ? (appearCancelled || enterCancelled) : enterCancelled;

  var expectsCSS = css !== false && !isIE9;
  var userWantsControl =
    enterHook &&
    // enterHook may be a bound method which exposes
    // the length of original fn as _length
    (enterHook._length || enterHook.length) > 1;

  var cb = el._enterCb = once(function () {
    if (expectsCSS) {
      removeTransitionClass(el, toClass);
      removeTransitionClass(el, activeClass);
    }
    if (cb.cancelled) {
      if (expectsCSS) {
        removeTransitionClass(el, startClass);
      }
      enterCancelledHook && enterCancelledHook(el);
    } else {
      afterEnterHook && afterEnterHook(el);
    }
    el._enterCb = null;
  });

  if (!vnode.data.show) {
    // remove pending leave element on enter by injecting an insert hook
    mergeVNodeHook(vnode.data.hook || (vnode.data.hook = {}), 'insert', function () {
      var parent = el.parentNode;
      var pendingNode = parent && parent._pending && parent._pending[vnode.key];
      if (pendingNode &&
          pendingNode.tag === vnode.tag &&
          pendingNode.elm._leaveCb) {
        pendingNode.elm._leaveCb();
      }
      enterHook && enterHook(el, cb);
    }, 'transition-insert');
  }

  // start enter transition
  beforeEnterHook && beforeEnterHook(el);
  if (expectsCSS) {
    addTransitionClass(el, startClass);
    addTransitionClass(el, activeClass);
    nextFrame(function () {
      addTransitionClass(el, toClass);
      removeTransitionClass(el, startClass);
      if (!cb.cancelled && !userWantsControl) {
        whenTransitionEnds(el, type, cb);
      }
    });
  }

  if (vnode.data.show) {
    toggleDisplay && toggleDisplay();
    enterHook && enterHook(el, cb);
  }

  if (!expectsCSS && !userWantsControl) {
    cb();
  }
}

function leave (vnode, rm) {
  var el = vnode.elm;

  // call enter callback now
  if (el._enterCb) {
    el._enterCb.cancelled = true;
    el._enterCb();
  }

  var data = resolveTransition(vnode.data.transition);
  if (!data) {
    return rm()
  }

  /* istanbul ignore if */
  if (el._leaveCb || el.nodeType !== 1) {
    return
  }

  var css = data.css;
  var type = data.type;
  var leaveClass = data.leaveClass;
  var leaveToClass = data.leaveToClass;
  var leaveActiveClass = data.leaveActiveClass;
  var beforeLeave = data.beforeLeave;
  var leave = data.leave;
  var afterLeave = data.afterLeave;
  var leaveCancelled = data.leaveCancelled;
  var delayLeave = data.delayLeave;

  var expectsCSS = css !== false && !isIE9;
  var userWantsControl =
    leave &&
    // leave hook may be a bound method which exposes
    // the length of original fn as _length
    (leave._length || leave.length) > 1;

  var cb = el._leaveCb = once(function () {
    if (el.parentNode && el.parentNode._pending) {
      el.parentNode._pending[vnode.key] = null;
    }
    if (expectsCSS) {
      removeTransitionClass(el, leaveToClass);
      removeTransitionClass(el, leaveActiveClass);
    }
    if (cb.cancelled) {
      if (expectsCSS) {
        removeTransitionClass(el, leaveClass);
      }
      leaveCancelled && leaveCancelled(el);
    } else {
      rm();
      afterLeave && afterLeave(el);
    }
    el._leaveCb = null;
  });

  if (delayLeave) {
    delayLeave(performLeave);
  } else {
    performLeave();
  }

  function performLeave () {
    // the delayed leave may have already been cancelled
    if (cb.cancelled) {
      return
    }
    // record leaving element
    if (!vnode.data.show) {
      (el.parentNode._pending || (el.parentNode._pending = {}))[vnode.key] = vnode;
    }
    beforeLeave && beforeLeave(el);
    if (expectsCSS) {
      addTransitionClass(el, leaveClass);
      addTransitionClass(el, leaveActiveClass);
      nextFrame(function () {
        addTransitionClass(el, leaveToClass);
        removeTransitionClass(el, leaveClass);
        if (!cb.cancelled && !userWantsControl) {
          whenTransitionEnds(el, type, cb);
        }
      });
    }
    leave && leave(el, cb);
    if (!expectsCSS && !userWantsControl) {
      cb();
    }
  }
}

function resolveTransition (def$$1) {
  if (!def$$1) {
    return
  }
  /* istanbul ignore else */
  if (typeof def$$1 === 'object') {
    var res = {};
    if (def$$1.css !== false) {
      extend(res, autoCssTransition(def$$1.name || 'v'));
    }
    extend(res, def$$1);
    return res
  } else if (typeof def$$1 === 'string') {
    return autoCssTransition(def$$1)
  }
}

var autoCssTransition = cached(function (name) {
  return {
    enterClass: (name + "-enter"),
    leaveClass: (name + "-leave"),
    appearClass: (name + "-enter"),
    enterToClass: (name + "-enter-to"),
    leaveToClass: (name + "-leave-to"),
    appearToClass: (name + "-enter-to"),
    enterActiveClass: (name + "-enter-active"),
    leaveActiveClass: (name + "-leave-active"),
    appearActiveClass: (name + "-enter-active")
  }
});

function once (fn) {
  var called = false;
  return function () {
    if (!called) {
      called = true;
      fn();
    }
  }
}

function _enter (_, vnode) {
  if (!vnode.data.show) {
    enter(vnode);
  }
}

var transition = inBrowser ? {
  create: _enter,
  activate: _enter,
  remove: function remove (vnode, rm) {
    /* istanbul ignore else */
    if (!vnode.data.show) {
      leave(vnode, rm);
    } else {
      rm();
    }
  }
} : {};

var platformModules = [
  attrs,
  klass,
  events,
  domProps,
  style,
  transition
];

/*  */

// the directive module should be applied last, after all
// built-in modules have been applied.
var modules = platformModules.concat(baseModules);

var patch$1 = createPatchFunction({ nodeOps: nodeOps, modules: modules });

/**
 * Not type checking this file because flow doesn't like attaching
 * properties to Elements.
 */

var modelableTagRE = /^input|select|textarea|vue-component-[0-9]+(-[0-9a-zA-Z_-]*)?$/;

/* istanbul ignore if */
if (isIE9) {
  // http://www.matts411.com/post/internet-explorer-9-oninput/
  document.addEventListener('selectionchange', function () {
    var el = document.activeElement;
    if (el && el.vmodel) {
      trigger(el, 'input');
    }
  });
}

var model = {
  inserted: function inserted (el, binding, vnode) {
    if (process.env.NODE_ENV !== 'production') {
      if (!modelableTagRE.test(vnode.tag)) {
        warn(
          "v-model is not supported on element type: <" + (vnode.tag) + ">. " +
          'If you are working with contenteditable, it\'s recommended to ' +
          'wrap a library dedicated for that purpose inside a custom component.',
          vnode.context
        );
      }
    }
    if (vnode.tag === 'select') {
      var cb = function () {
        setSelected(el, binding, vnode.context);
      };
      cb();
      /* istanbul ignore if */
      if (isIE || isEdge) {
        setTimeout(cb, 0);
      }
    } else if (vnode.tag === 'textarea' || el.type === 'text') {
      el._vModifiers = binding.modifiers;
      if (!binding.modifiers.lazy) {
        if (!isAndroid) {
          el.addEventListener('compositionstart', onCompositionStart);
          el.addEventListener('compositionend', onCompositionEnd);
        }
        /* istanbul ignore if */
        if (isIE9) {
          el.vmodel = true;
        }
      }
    }
  },
  componentUpdated: function componentUpdated (el, binding, vnode) {
    if (vnode.tag === 'select') {
      setSelected(el, binding, vnode.context);
      // in case the options rendered by v-for have changed,
      // it's possible that the value is out-of-sync with the rendered options.
      // detect such cases and filter out values that no longer has a matching
      // option in the DOM.
      var needReset = el.multiple
        ? binding.value.some(function (v) { return hasNoMatchingOption(v, el.options); })
        : binding.value !== binding.oldValue && hasNoMatchingOption(binding.value, el.options);
      if (needReset) {
        trigger(el, 'change');
      }
    }
  }
};

function setSelected (el, binding, vm) {
  var value = binding.value;
  var isMultiple = el.multiple;
  if (isMultiple && !Array.isArray(value)) {
    process.env.NODE_ENV !== 'production' && warn(
      "<select multiple v-model=\"" + (binding.expression) + "\"> " +
      "expects an Array value for its binding, but got " + (Object.prototype.toString.call(value).slice(8, -1)),
      vm
    );
    return
  }
  var selected, option;
  for (var i = 0, l = el.options.length; i < l; i++) {
    option = el.options[i];
    if (isMultiple) {
      selected = looseIndexOf(value, getValue(option)) > -1;
      if (option.selected !== selected) {
        option.selected = selected;
      }
    } else {
      if (looseEqual(getValue(option), value)) {
        if (el.selectedIndex !== i) {
          el.selectedIndex = i;
        }
        return
      }
    }
  }
  if (!isMultiple) {
    el.selectedIndex = -1;
  }
}

function hasNoMatchingOption (value, options) {
  for (var i = 0, l = options.length; i < l; i++) {
    if (looseEqual(getValue(options[i]), value)) {
      return false
    }
  }
  return true
}

function getValue (option) {
  return '_value' in option
    ? option._value
    : option.value
}

function onCompositionStart (e) {
  e.target.composing = true;
}

function onCompositionEnd (e) {
  e.target.composing = false;
  trigger(e.target, 'input');
}

function trigger (el, type) {
  var e = document.createEvent('HTMLEvents');
  e.initEvent(type, true, true);
  el.dispatchEvent(e);
}

/*  */

// recursively search for possible transition defined inside the component root
function locateNode (vnode) {
  return vnode.componentInstance && (!vnode.data || !vnode.data.transition)
    ? locateNode(vnode.componentInstance._vnode)
    : vnode
}

var show = {
  bind: function bind (el, ref, vnode) {
    var value = ref.value;

    vnode = locateNode(vnode);
    var transition = vnode.data && vnode.data.transition;
    var originalDisplay = el.__vOriginalDisplay =
      el.style.display === 'none' ? '' : el.style.display;
    if (value && transition && !isIE9) {
      vnode.data.show = true;
      enter(vnode, function () {
        el.style.display = originalDisplay;
      });
    } else {
      el.style.display = value ? originalDisplay : 'none';
    }
  },

  update: function update (el, ref, vnode) {
    var value = ref.value;
    var oldValue = ref.oldValue;

    /* istanbul ignore if */
    if (value === oldValue) { return }
    vnode = locateNode(vnode);
    var transition = vnode.data && vnode.data.transition;
    if (transition && !isIE9) {
      vnode.data.show = true;
      if (value) {
        enter(vnode, function () {
          el.style.display = el.__vOriginalDisplay;
        });
      } else {
        leave(vnode, function () {
          el.style.display = 'none';
        });
      }
    } else {
      el.style.display = value ? el.__vOriginalDisplay : 'none';
    }
  },

  unbind: function unbind (
    el,
    binding,
    vnode,
    oldVnode,
    isDestroy
  ) {
    if (!isDestroy) {
      el.style.display = el.__vOriginalDisplay;
    }
  }
};

var platformDirectives = {
  model: model,
  show: show
};

/*  */

// Provides transition support for a single element/component.
// supports transition mode (out-in / in-out)

var transitionProps = {
  name: String,
  appear: Boolean,
  css: Boolean,
  mode: String,
  type: String,
  enterClass: String,
  leaveClass: String,
  enterToClass: String,
  leaveToClass: String,
  enterActiveClass: String,
  leaveActiveClass: String,
  appearClass: String,
  appearActiveClass: String,
  appearToClass: String
};

// in case the child is also an abstract component, e.g. <keep-alive>
// we want to recursively retrieve the real component to be rendered
function getRealChild (vnode) {
  var compOptions = vnode && vnode.componentOptions;
  if (compOptions && compOptions.Ctor.options.abstract) {
    return getRealChild(getFirstComponentChild(compOptions.children))
  } else {
    return vnode
  }
}

function extractTransitionData (comp) {
  var data = {};
  var options = comp.$options;
  // props
  for (var key in options.propsData) {
    data[key] = comp[key];
  }
  // events.
  // extract listeners and pass them directly to the transition methods
  var listeners = options._parentListeners;
  for (var key$1 in listeners) {
    data[camelize(key$1)] = listeners[key$1].fn;
  }
  return data
}

function placeholder (h, rawChild) {
  return /\d-keep-alive$/.test(rawChild.tag)
    ? h('keep-alive')
    : null
}

function hasParentTransition (vnode) {
  while ((vnode = vnode.parent)) {
    if (vnode.data.transition) {
      return true
    }
  }
}

function isSameChild (child, oldChild) {
  return oldChild.key === child.key && oldChild.tag === child.tag
}

var Transition = {
  name: 'transition',
  props: transitionProps,
  abstract: true,

  render: function render (h) {
    var this$1 = this;

    var children = this.$slots.default;
    if (!children) {
      return
    }

    // filter out text nodes (possible whitespaces)
    children = children.filter(function (c) { return c.tag; });
    /* istanbul ignore if */
    if (!children.length) {
      return
    }

    // warn multiple elements
    if (process.env.NODE_ENV !== 'production' && children.length > 1) {
      warn(
        '<transition> can only be used on a single element. Use ' +
        '<transition-group> for lists.',
        this.$parent
      );
    }

    var mode = this.mode;

    // warn invalid mode
    if (process.env.NODE_ENV !== 'production' &&
        mode && mode !== 'in-out' && mode !== 'out-in') {
      warn(
        'invalid <transition> mode: ' + mode,
        this.$parent
      );
    }

    var rawChild = children[0];

    // if this is a component root node and the component's
    // parent container node also has transition, skip.
    if (hasParentTransition(this.$vnode)) {
      return rawChild
    }

    // apply transition data to child
    // use getRealChild() to ignore abstract components e.g. keep-alive
    var child = getRealChild(rawChild);
    /* istanbul ignore if */
    if (!child) {
      return rawChild
    }

    if (this._leaving) {
      return placeholder(h, rawChild)
    }

    // ensure a key that is unique to the vnode type and to this transition
    // component instance. This key will be used to remove pending leaving nodes
    // during entering.
    var id = "__transition-" + (this._uid) + "-";
    var key = child.key = child.key == null
      ? id + child.tag
      : isPrimitive(child.key)
        ? (String(child.key).indexOf(id) === 0 ? child.key : id + child.key)
        : child.key;
    var data = (child.data || (child.data = {})).transition = extractTransitionData(this);
    var oldRawChild = this._vnode;
    var oldChild = getRealChild(oldRawChild);

    // mark v-show
    // so that the transition module can hand over the control to the directive
    if (child.data.directives && child.data.directives.some(function (d) { return d.name === 'show'; })) {
      child.data.show = true;
    }

    if (oldChild && oldChild.data && !isSameChild(child, oldChild)) {
      // replace old child transition data with fresh one
      // important for dynamic transitions!
      var oldData = oldChild && (oldChild.data.transition = extend({}, data));
      // handle transition mode
      if (mode === 'out-in') {
        // return placeholder node and queue update when leave finishes
        this._leaving = true;
        mergeVNodeHook(oldData, 'afterLeave', function () {
          this$1._leaving = false;
          this$1.$forceUpdate();
        }, key);
        return placeholder(h, rawChild)
      } else if (mode === 'in-out') {
        var delayedLeave;
        var performLeave = function () { delayedLeave(); };
        mergeVNodeHook(data, 'afterEnter', performLeave, key);
        mergeVNodeHook(data, 'enterCancelled', performLeave, key);
        mergeVNodeHook(oldData, 'delayLeave', function (leave) {
          delayedLeave = leave;
        }, key);
      }
    }

    return rawChild
  }
};

/*  */

// Provides transition support for list items.
// supports move transitions using the FLIP technique.

// Because the vdom's children update algorithm is "unstable" - i.e.
// it doesn't guarantee the relative positioning of removed elements,
// we force transition-group to update its children into two passes:
// in the first pass, we remove all nodes that need to be removed,
// triggering their leaving transition; in the second pass, we insert/move
// into the final disired state. This way in the second pass removed
// nodes will remain where they should be.

var props = extend({
  tag: String,
  moveClass: String
}, transitionProps);

delete props.mode;

var TransitionGroup = {
  props: props,

  render: function render (h) {
    var tag = this.tag || this.$vnode.data.tag || 'span';
    var map = Object.create(null);
    var prevChildren = this.prevChildren = this.children;
    var rawChildren = this.$slots.default || [];
    var children = this.children = [];
    var transitionData = extractTransitionData(this);

    for (var i = 0; i < rawChildren.length; i++) {
      var c = rawChildren[i];
      if (c.tag) {
        if (c.key != null && String(c.key).indexOf('__vlist') !== 0) {
          children.push(c);
          map[c.key] = c
          ;(c.data || (c.data = {})).transition = transitionData;
        } else if (process.env.NODE_ENV !== 'production') {
          var opts = c.componentOptions;
          var name = opts
            ? (opts.Ctor.options.name || opts.tag)
            : c.tag;
          warn(("<transition-group> children must be keyed: <" + name + ">"));
        }
      }
    }

    if (prevChildren) {
      var kept = [];
      var removed = [];
      for (var i$1 = 0; i$1 < prevChildren.length; i$1++) {
        var c$1 = prevChildren[i$1];
        c$1.data.transition = transitionData;
        c$1.data.pos = c$1.elm.getBoundingClientRect();
        if (map[c$1.key]) {
          kept.push(c$1);
        } else {
          removed.push(c$1);
        }
      }
      this.kept = h(tag, null, kept);
      this.removed = removed;
    }

    return h(tag, null, children)
  },

  beforeUpdate: function beforeUpdate () {
    // force removing pass
    this.__patch__(
      this._vnode,
      this.kept,
      false, // hydrating
      true // removeOnly (!important, avoids unnecessary moves)
    );
    this._vnode = this.kept;
  },

  updated: function updated () {
    var children = this.prevChildren;
    var moveClass = this.moveClass || ((this.name || 'v') + '-move');
    if (!children.length || !this.hasMove(children[0].elm, moveClass)) {
      return
    }

    // we divide the work into three loops to avoid mixing DOM reads and writes
    // in each iteration - which helps prevent layout thrashing.
    children.forEach(callPendingCbs);
    children.forEach(recordPosition);
    children.forEach(applyTranslation);

    // force reflow to put everything in position
    var f = document.body.offsetHeight; // eslint-disable-line

    children.forEach(function (c) {
      if (c.data.moved) {
        var el = c.elm;
        var s = el.style;
        addTransitionClass(el, moveClass);
        s.transform = s.WebkitTransform = s.transitionDuration = '';
        el.addEventListener(transitionEndEvent, el._moveCb = function cb (e) {
          if (!e || /transform$/.test(e.propertyName)) {
            el.removeEventListener(transitionEndEvent, cb);
            el._moveCb = null;
            removeTransitionClass(el, moveClass);
          }
        });
      }
    });
  },

  methods: {
    hasMove: function hasMove (el, moveClass) {
      /* istanbul ignore if */
      if (!hasTransition) {
        return false
      }
      if (this._hasMove != null) {
        return this._hasMove
      }
      addTransitionClass(el, moveClass);
      var info = getTransitionInfo(el);
      removeTransitionClass(el, moveClass);
      return (this._hasMove = info.hasTransform)
    }
  }
};

function callPendingCbs (c) {
  /* istanbul ignore if */
  if (c.elm._moveCb) {
    c.elm._moveCb();
  }
  /* istanbul ignore if */
  if (c.elm._enterCb) {
    c.elm._enterCb();
  }
}

function recordPosition (c) {
  c.data.newPos = c.elm.getBoundingClientRect();
}

function applyTranslation (c) {
  var oldPos = c.data.pos;
  var newPos = c.data.newPos;
  var dx = oldPos.left - newPos.left;
  var dy = oldPos.top - newPos.top;
  if (dx || dy) {
    c.data.moved = true;
    var s = c.elm.style;
    s.transform = s.WebkitTransform = "translate(" + dx + "px," + dy + "px)";
    s.transitionDuration = '0s';
  }
}

var platformComponents = {
  Transition: Transition,
  TransitionGroup: TransitionGroup
};

/*  */

// install platform specific utils
Vue$2.config.isUnknownElement = isUnknownElement;
Vue$2.config.isReservedTag = isReservedTag;
Vue$2.config.getTagNamespace = getTagNamespace;
Vue$2.config.mustUseProp = mustUseProp;

// install platform runtime directives & components
extend(Vue$2.options.directives, platformDirectives);
extend(Vue$2.options.components, platformComponents);

// install platform patch function
Vue$2.prototype.__patch__ = inBrowser ? patch$1 : noop;

// wrap mount
Vue$2.prototype.$mount = function (
  el,
  hydrating
) {
  el = el && inBrowser ? query(el) : undefined;
  return this._mount(el, hydrating)
};

if (process.env.NODE_ENV !== 'production' &&
    inBrowser && typeof console !== 'undefined') {
  console[console.info ? 'info' : 'log'](
    "You are running Vue in development mode.\n" +
    "Make sure to turn on production mode when deploying for production.\n" +
    "See more tips at https://vuejs.org/guide/deployment.html"
  );
}

// devtools global hook
/* istanbul ignore next */
setTimeout(function () {
  if (config.devtools) {
    if (devtools) {
      devtools.emit('init', Vue$2);
    } else if (
      process.env.NODE_ENV !== 'production' &&
      inBrowser && !isEdge && /Chrome\/\d+/.test(window.navigator.userAgent)
    ) {
      console[console.info ? 'info' : 'log'](
        'Download the Vue Devtools extension for a better development experience:\n' +
        'https://github.com/vuejs/vue-devtools'
      );
    }
  }
}, 0);

module.exports = Vue$2;

}).call(this,require("b55mWE"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"b55mWE":1}],4:[function(require,module,exports){
var inserted = exports.cache = {}

function noop () {}

exports.insert = function (css) {
  if (inserted[css]) return noop
  inserted[css] = true

  var elem = document.createElement('style')
  elem.setAttribute('type', 'text/css')

  if ('textContent' in elem) {
    elem.textContent = css
  } else {
    elem.styleSheet.cssText = css
  }

  document.getElementsByTagName('head')[0].appendChild(elem)
  return function () {
    document.getElementsByTagName('head')[0].removeChild(elem)
    inserted[css] = false
  }
}

},{}],5:[function(require,module,exports){
'use strict';

require('./vue/vue.js');

},{"./vue/vue.js":10}],6:[function(require,module,exports){
var __vueify_style_dispose__ = require("vueify/lib/insert-css").insert("ul[data-v-08bc2bcf] {\n  list-style: none;\n  padding: 0;\n  margin-top: 10px;\n}\nul li p[data-v-08bc2bcf] {\n  margin: 0;\n}\nul li > div[data-v-08bc2bcf] {\n  margin-top: 5px;\n}\nul li .progression[data-v-08bc2bcf] {\n  height: 10px;\n  background-color: #00cc00;\n  border-top-right-radius: 4px;\n  -webkit-border-top-right-radius: 4px;\n  -moz-border-top-right-radius: 4px;\n  -o-border-top-right-radius: 4px;\n  border-bottom-right-radius: 4px;\n  -webkit-border-bottom-right-radius: 4px;\n  -moz-border-bottom-right-radius: 4px;\n  -o-border-bottom-right-radius: 4px;\n  width: 0%;\n  -webkit-animation-duration: 1s;\n  animation-duration: 1s;\n  -webkit-animation-fill-mode: forwards;\n  animation-fill-mode: forwards;\n  -webkit-animation-iteration-count: 1;\n  animation-iteration-count: 1;\n}\nul.open .one[data-v-08bc2bcf] {\n  -webkit-animation-name: skillOne;\n  animation-name: skillOne;\n}\nul.open .two[data-v-08bc2bcf] {\n  -webkit-animation-name: skillTwo;\n  animation-name: skillTwo;\n}\nul.open .three[data-v-08bc2bcf] {\n  -webkit-animation-name: skillThree;\n  animation-name: skillThree;\n}\nul.open .four[data-v-08bc2bcf] {\n  -webkit-animation-name: skillFour;\n  animation-name: skillFour;\n}\nul.open .five[data-v-08bc2bcf] {\n  -webkit-animation-name: skillFive;\n  animation-name: skillFive;\n}\n@keyframes skillOne {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 20%;\n  }\n}\n@-webkit-keyframes skillOne {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 20%;\n  }\n}\n@-moz-keyframes skillOne {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 20%;\n  }\n}\n@-o-keyframes skillOne {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 20%;\n  }\n}\n@keyframes skillTwo {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 40%;\n  }\n}\n@-webkit-keyframes skillTwo {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 40%;\n  }\n}\n@-moz-keyframes skillTwo {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 40%;\n  }\n}\n@-o-keyframes skillTwo {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 40%;\n  }\n}\n@keyframes skillThree {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 60%;\n  }\n}\n@-webkit-keyframes skillThree {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 60%;\n  }\n}\n@-moz-keyframes skillThree {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 60%;\n  }\n}\n@-o-keyframes skillThree {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 60%;\n  }\n}\n@keyframes skillThree {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 60%;\n  }\n}\n@-webkit-keyframes skillThree {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 60%;\n  }\n}\n@-moz-keyframes skillThree {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 60%;\n  }\n}\n@-o-keyframes skillThree {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 60%;\n  }\n}\n@keyframes skillFour {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 80%;\n  }\n}\n@-webkit-keyframes skillFour {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 80%;\n  }\n}\n@-moz-keyframes skillFour {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 80%;\n  }\n}\n@-o-keyframes skillFour {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 80%;\n  }\n}\n@keyframes skillFive {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 100%;\n  }\n}\n@-webkit-keyframes skillFive {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 100%;\n  }\n}\n@-moz-keyframes skillFive {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 100%;\n  }\n}\n@-o-keyframes skillFive {\n  from {\n    width: 0%;\n  }\n  to {\n    width: 100%;\n  }\n}")
;(function(){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  props: ['skills']
};
})()
if (module.exports.__esModule) module.exports = module.exports.default
var __vue__options__ = (typeof module.exports === "function"? module.exports.options: module.exports)
if (__vue__options__.functional) {console.error("[vueify] functional components are not supported and should be defined in plain js files using render functions.")}
__vue__options__.render = function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._c;return _c('ul',{staticClass:"row"},[_vm._m(0),_vm._v(" "),_vm._l((_vm.skills),function(item){return _c('li',{staticClass:"col-xs-12"},[_c('p',{staticClass:"col-xs-3"},[_vm._v(_vm._s(item.type))]),_vm._v(" "),_c('div',{staticClass:"col-xs-9"},[_c('div',{staticClass:"progression",class:item.value})])])})],2)}
__vue__options__.staticRenderFns = [function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._c;return _c('li',{staticClass:"col-xs-12"},[_c('strong',{staticClass:"col-xs-3"},[_vm._v("Tecnologie utilizzate")]),_c('strong',{staticClass:"col-xs-9"},[_vm._v("Impatto")])])}]
__vue__options__._scopeId = "data-v-08bc2bcf"
if (module.hot) {(function () {  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), true)
  if (!hotAPI.compatible) return
  module.hot.accept()
  module.hot.dispose(__vueify_style_dispose__)
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-08bc2bcf", __vue__options__)
  } else {
    hotAPI.reload("data-v-08bc2bcf", __vue__options__)
  }
})()}

},{"vue":3,"vue-hot-reload-api":2,"vueify/lib/insert-css":4}],7:[function(require,module,exports){
var __vueify_style_dispose__ = require("vueify/lib/insert-css").insert(".header[data-v-0cc31af2] {\n  position: fixed;\n  top: 0;\n  padding: 0px 20px;\n  height: 55px;\n  left: 0;\n  z-index: 2;\n  background-color: #fff;\n  right: 0;\n  border-bottom: 1px solid grey;\n  display: flex;\n  display: -webkit-flex;\n  justify-content: space-between;\n  -webkit-justify-content: space-between;\n}\n.header-hamburger[data-v-0cc31af2] {\n  width: 35px;\n  z-index: 3;\n  height: 35px;\n  margin-top: 15px;\n  -webkit-transform: rotate(0deg);\n  -moz-transform: rotate(0deg);\n  -o-transform: rotate(0deg);\n  transform: rotate(0deg);\n  -webkit-transition: 0.5s ease-in-out;\n  -moz-transition: 0.5s ease-in-out;\n  -o-transition: 0.5s ease-in-out;\n  transition: 0.5s ease-in-out;\n  cursor: pointer;\n}\n.header-hamburger span[data-v-0cc31af2] {\n  display: block;\n  position: absolute;\n  height: 5px;\n  width: 50%;\n  background: #505050;\n  opacity: 1;\n  -webkit-transform: rotate(0deg);\n  -moz-transform: rotate(0deg);\n  -o-transform: rotate(0deg);\n  transform: rotate(0deg);\n  -webkit-transition: 0.25s ease-in-out;\n  -moz-transition: 0.25s ease-in-out;\n  -o-transition: 0.25s ease-in-out;\n  transition: 0.25s ease-in-out;\n}\n.header-hamburger span[data-v-0cc31af2]:nth-child(even) {\n  left: 50%;\n  border-radius: 0 9px 9px 0;\n  -webkit-border-radius: 0 9px 9px 0;\n  -moz-border-radius: 0 9px 9px 0;\n  -o-border-radius: 0 9px 9px 0;\n}\n.header-hamburger span[data-v-0cc31af2]:nth-child(odd) {\n  left: 0px;\n  border-radius: 9px 0 0 9px;\n  -webkit-border-radius: 9px 0 0 9px;\n  -moz-border-radius: 9px 0 0 9px;\n  -o-border-radius: 9px 0 0 9px;\n}\n.header-hamburger span[data-v-0cc31af2]:nth-child(1),\n.header-hamburger span[data-v-0cc31af2]:nth-child(2) {\n  top: 0px;\n}\n.header-hamburger span[data-v-0cc31af2]:nth-child(3),\n.header-hamburger span[data-v-0cc31af2]:nth-child(4) {\n  top: 10px;\n}\n.header-hamburger span[data-v-0cc31af2]:nth-child(5),\n.header-hamburger span[data-v-0cc31af2]:nth-child(6) {\n  top: 20px;\n}\n.header-hamburger.open span[data-v-0cc31af2]:nth-child(1),\n.header-hamburger.open span[data-v-0cc31af2]:nth-child(6) {\n  -webkit-transform: rotate(45deg);\n  -moz-transform: rotate(45deg);\n  -o-transform: rotate(45deg);\n  transform: rotate(45deg);\n}\n.header-hamburger.open span[data-v-0cc31af2]:nth-child(2),\n.header-hamburger.open span[data-v-0cc31af2]:nth-child(5) {\n  -webkit-transform: rotate(-45deg);\n  -moz-transform: rotate(-45deg);\n  -o-transform: rotate(-45deg);\n  transform: rotate(-45deg);\n}\n.header-hamburger.open span[data-v-0cc31af2]:nth-child(1) {\n  left: 5px;\n  top: 5px;\n}\n.header-hamburger.open span[data-v-0cc31af2]:nth-child(2) {\n  left: calc(45%);\n  top: 5px;\n}\n.header-hamburger.open span[data-v-0cc31af2]:nth-child(3) {\n  left: -50%;\n  opacity: 0;\n}\n.header-hamburger.open span[data-v-0cc31af2]:nth-child(4) {\n  left: 100%;\n  opacity: 0;\n}\n.header-hamburger.open span[data-v-0cc31af2]:nth-child(5) {\n  left: 5px;\n  top: 15px;\n}\n.header-hamburger.open span[data-v-0cc31af2]:nth-child(6) {\n  left: calc(45%);\n  top: 15px;\n}\n.header-overlay[data-v-0cc31af2] {\n  position: fixed;\n  width: 100vw;\n  height: 100vh;\n  left: 0;\n  top: 0;\n  background-color: #fff;\n  display: none;\n}\n.header-overlay.open[data-v-0cc31af2] {\n  display: -webkit-flex;\n  display: flex;\n  justify-content: center;\n  webkit-justify-content: center;\n  align-items: center;\n  webkit-align-items: center;\n}\n.header-overlay.open ul[data-v-0cc31af2] {\n  list-style: none;\n  padding: 0;\n  position: relative;\n}\n.header-overlay.open ul li[data-v-0cc31af2] {\n  font-size: 5rem;\n  font-weight: 600;\n  margin-bottom: 10px;\n  border-bottom: 1px solid grey;\n  transform: translate(-100vw, 0);\n  -webkit-transform: translate(-100vw, 0);\n  -moz-transform: translate(-100vw, 0);\n  opacity: 0;\n  position: relative;\n  animation-name: insertLi;\n  animation-iteration-count: 1;\n  animation-fill-mode: forwards;\n  animation-duration: .25s;\n  -webkit-animation-name: insertLi;\n  -webkit-animation-iteration-count: 1;\n  -webkit-animation-fill-mode: forwards;\n  -webkit-animation-duration: .25s;\n  -o-animation-name: insertLi;\n  -o-animation-iteration-count: 1;\n  -o-animation-fill-mode: forwards;\n  -o-animation-duration: .25s;\n  -moz-animation-name: insertLi;\n  -moz-animation-iteration-count: 1;\n  -moz-animation-fill-mode: forwards;\n  -moz-animation-duration: .25s;\n}\n.header-overlay.open ul li a[data-v-0cc31af2]:hover {\n  text-decoration: none;\n}\n.header-overlay.open ul li[data-v-0cc31af2]:hover {\n  border-bottom: 1px solid green;\n  cursor: pointer;\n}\n.header-overlay.open ul li[data-v-0cc31af2]:nth-of-type(1) {\n  animation-delay: 0s;\n  -webkit-animation-delay: 0s;\n  -moz-animation-delay: 0s;\n  -o-animation-delay: 0s;\n}\n.header-overlay.open ul li[data-v-0cc31af2]:nth-of-type(2) {\n  animation-delay: .25s;\n  -webkit-animation-delay: .25s;\n  -moz-animation-delay: .25s;\n  -o-animation-delay: .25s;\n}\n.header-overlay.open ul li[data-v-0cc31af2]:nth-of-type(3) {\n  animation-delay: .5s;\n  -webkit-animation-delay: .5s;\n  -moz-animation-delay: .5s;\n  -o-animation-delay: .5s;\n}\n.header-overlay.open ul .social[data-v-0cc31af2] {\n  margin-top: 10px;\n}\n.header-overlay.open ul .social a[data-v-0cc31af2]:nth-of-type(1) {\n  -moz-animation-delay: 1s;\n  -webkit-animation-delay: 1s;\n  -o-animation-delay: 1s;\n  animation-delay: 1s;\n}\n.header-overlay.open ul .social a[data-v-0cc31af2]:nth-of-type(2) {\n  -moz-animation-delay: 1.5s;\n  -webkit-animation-delay: 1.5s;\n  -o-animation-delay: 1.5s;\n  animation-delay: 1.5s;\n}\n.header-overlay.open ul .social a[data-v-0cc31af2]:nth-of-type(3) {\n  -moz-animation-delay: 2s;\n  -webkit-animation-delay: 2s;\n  -o-animation-delay: 2s;\n  animation-delay: 2s;\n}\n.header-overlay.open ul .social a[data-v-0cc31af2] {\n  opacity: 0;\n  display: block;\n  animation-name: insertSocial;\n  animation-iteration-count: 1;\n  animation-fill-mode: forwards;\n  animation-duration: .5s;\n  -webkit-animation-name: insertSocial;\n  -webkit-animation-iteration-count: 1;\n  -webkit-animation-fill-mode: forwards;\n  -webkit-animation-duration: .5s;\n  -o-animation-name: insertSocial;\n  -o-animation-iteration-count: 1;\n  -o-animation-fill-mode: forwards;\n  -o-animation-duration: .5s;\n  -moz-animation-name: insertSocial;\n  -moz-animation-iteration-count: 1;\n  -moz-animation-fill-mode: forwards;\n  -moz-animation-duration: .5s;\n}\n@keyframes insertLi {\n  from {\n    transform: translate(-100vw, 0);\n    opacity: 0;\n  }\n  to {\n    transform: translate(0, 0);\n    opacity: 1;\n  }\n}\n@-webkit-keyframes insertLi {\n  from {\n    -webkit-transform: translate(-100vw, 0);\n    opacity: 0;\n  }\n  to {\n    -webkit-transform: translate(0, 0);\n    opacity: 1;\n  }\n}\n@-moz-keyframes insertLi {\n  from {\n    -moz-transform: translate(-100vw, 0);\n    opacity: 0;\n  }\n  to {\n    -moz-transform: translate(0, 0);\n    opacity: 1;\n  }\n}\n@-o-keyframes insertLi {\n  from {\n    -o-transform: translate(-100vw, 0);\n    opacity: 0;\n  }\n  to {\n    -o-transform: translate(0, 0);\n    opacity: 1;\n  }\n}\n@keyframes insertSocial {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n@-webkit-keyframes insertSocial {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n@-moz-keyframes insertSocial {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n@-o-keyframes insertSocial {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n.header-logo[data-v-0cc31af2] {\n  width: 60px;\n}\n.header-logo[data-v-0cc31af2]:hover {\n  cursor: pointer;\n}\n.header-logo img[data-v-0cc31af2] {\n  width: 100%;\n}")
;(function(){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  data: function data() {
    return {
      items: [{ text: 'About', link: '/project.io/page/about.html' }, { text: 'Skills', link: '/project.io/page/skills.html' }, { text: 'Works', link: '/project.io/page/works.html' }]
    };
  },


  methods: {
    toggle: function toggle() {
      $(".jsHamburger, .jsOverlay").toggleClass("open");
    }
  }

};
})()
if (module.exports.__esModule) module.exports = module.exports.default
var __vue__options__ = (typeof module.exports === "function"? module.exports.options: module.exports)
if (__vue__options__.functional) {console.error("[vueify] functional components are not supported and should be defined in plain js files using render functions.")}
__vue__options__.render = function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._c;return _c('div',{staticClass:"header"},[_c('div',{staticClass:"[ jsHamburger ] header-hamburger",on:{"click":_vm.toggle}},_vm._l((6),function(n){return _c('span')})),_vm._v(" "),_c('div',{staticClass:"[ jsOverlay ] header-overlay"},[_c('ul',{staticClass:"text-center"},[_vm._l((_vm.items),function(item){return _c('li',[_c('a',{attrs:{"href":item.link}},[_vm._v(_vm._s(item.text))])])}),_vm._v(" "),_vm._m(0),_vm._v(" "),_c('ul')],2)]),_vm._v(" "),_vm._m(1)])}
__vue__options__.staticRenderFns = [function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._c;return _c('div',{staticClass:"col-xs-12 social"},[_c('a',{staticClass:"col-xs-4",attrs:{"href":"https://github.com/Lincerossa"}},[_c('img',{attrs:{"src":"/project.io/static/img/GitHub-Mark-64px.png"}})]),_vm._v(" "),_c('a',{staticClass:"col-xs-4",attrs:{"href":"https://github.com/Lincerossa"}},[_c('img',{attrs:{"src":"/project.io/static/img/GitHub-Mark-64px.png"}})]),_vm._v(" "),_c('a',{staticClass:"col-xs-4",attrs:{"hhref":"https://github.com/Lincerossa"}},[_c('img',{attrs:{"src":"/project.io/static/img/GitHub-Mark-64px.png"}})])])},function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._c;return _c('a',{staticClass:"header-logo",attrs:{"href":"/project.io/"}},[_c('img',{attrs:{"src":"/project.io/static/img/logo.svg"}})])}]
__vue__options__._scopeId = "data-v-0cc31af2"
if (module.hot) {(function () {  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), true)
  if (!hotAPI.compatible) return
  module.hot.accept()
  module.hot.dispose(__vueify_style_dispose__)
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-0cc31af2", __vue__options__)
  } else {
    hotAPI.reload("data-v-0cc31af2", __vue__options__)
  }
})()}

},{"vue":3,"vue-hot-reload-api":2,"vueify/lib/insert-css":4}],8:[function(require,module,exports){
var __vue__options__ = (typeof module.exports === "function"? module.exports.options: module.exports)
if (module.hot) {(function () {  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), true)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-69494179", __vue__options__)
  } else {
    hotAPI.reload("data-v-69494179", __vue__options__)
  }
})()}
},{"vue":3,"vue-hot-reload-api":2}],9:[function(require,module,exports){
var __vueify_style_dispose__ = require("vueify/lib/insert-css").insert("/*!\n *  Font Awesome 4.7.0 by @davegandy - http://fontawesome.io - @fontawesome\n *  License - http://fontawesome.io/license (Font: SIL OFL 1.1, CSS: MIT License)\n */\n/* FONT PATH\n * -------------------------- */\n@font-face {\n  font-family: 'FontAwesome';\n  src: url('/project.io/src/less/library/font-awesome-4.7.0/fonts/fontawesome-webfont.eot');\n  src: url('/project.io/src/less/library/font-awesome-4.7.0/fonts/fontawesome-webfont.eot}') format('embedded-opentype'), url('/project.io/src/less/library/font-awesome-4.7.0/fonts/fontawesome-webfont.woff2') format('woff2'), url('/project.io/src/less/library/font-awesome-4.7.0/fonts/fontawesome-webfont.woff') format('woff'), url('/project.io/src/less/library/font-awesome-4.7.0/fonts/fontawesome-webfont.ttf') format('truetype'), url('/project.io/src/less/library/font-awesome-4.7.0/fonts/fontawesome-webfont.svg') format('svg');\n  font-weight: normal;\n  font-style: normal;\n}\n.fa[data-v-491347ae] {\n  display: inline-block;\n  font: normal normal normal 14px/1 FontAwesome;\n  font-size: inherit;\n  text-rendering: auto;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n/* makes the font 33% larger relative to the icon container */\n.fa-lg[data-v-491347ae] {\n  font-size: 1.33333333em;\n  line-height: 0.75em;\n  vertical-align: -15%;\n}\n.fa-2x[data-v-491347ae] {\n  font-size: 2em;\n}\n.fa-3x[data-v-491347ae] {\n  font-size: 3em;\n}\n.fa-4x[data-v-491347ae] {\n  font-size: 4em;\n}\n.fa-5x[data-v-491347ae] {\n  font-size: 5em;\n}\n.fa-fw[data-v-491347ae] {\n  width: 1.28571429em;\n  text-align: center;\n}\n.fa-ul[data-v-491347ae] {\n  padding-left: 0;\n  margin-left: 2.14285714em;\n  list-style-type: none;\n}\n.fa-ul > li[data-v-491347ae] {\n  position: relative;\n}\n.fa-li[data-v-491347ae] {\n  position: absolute;\n  left: -2.14285714em;\n  width: 2.14285714em;\n  top: 0.14285714em;\n  text-align: center;\n}\n.fa-li.fa-lg[data-v-491347ae] {\n  left: -1.85714286em;\n}\n.fa-border[data-v-491347ae] {\n  padding: .2em .25em .15em;\n  border: solid 0.08em #eee;\n  border-radius: .1em;\n}\n.fa-pull-left[data-v-491347ae] {\n  float: left;\n}\n.fa-pull-right[data-v-491347ae] {\n  float: right;\n}\n.fa.fa-pull-left[data-v-491347ae] {\n  margin-right: .3em;\n}\n.fa.fa-pull-right[data-v-491347ae] {\n  margin-left: .3em;\n}\n/* Deprecated as of 4.4.0 */\n.pull-right[data-v-491347ae] {\n  float: right;\n}\n.pull-left[data-v-491347ae] {\n  float: left;\n}\n.fa.pull-left[data-v-491347ae] {\n  margin-right: .3em;\n}\n.fa.pull-right[data-v-491347ae] {\n  margin-left: .3em;\n}\n.fa-spin[data-v-491347ae] {\n  -webkit-animation: fa-spin 2s infinite linear;\n  animation: fa-spin 2s infinite linear;\n}\n.fa-pulse[data-v-491347ae] {\n  -webkit-animation: fa-spin 1s infinite steps(8);\n  animation: fa-spin 1s infinite steps(8);\n}\n@-webkit-keyframes fa-spin {\n  0% {\n    -webkit-transform: rotate(0deg);\n    transform: rotate(0deg);\n  }\n  100% {\n    -webkit-transform: rotate(359deg);\n    transform: rotate(359deg);\n  }\n}\n@keyframes fa-spin {\n  0% {\n    -webkit-transform: rotate(0deg);\n    transform: rotate(0deg);\n  }\n  100% {\n    -webkit-transform: rotate(359deg);\n    transform: rotate(359deg);\n  }\n}\n.fa-rotate-90[data-v-491347ae] {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=1)\";\n  -webkit-transform: rotate(90deg);\n  -ms-transform: rotate(90deg);\n  transform: rotate(90deg);\n}\n.fa-rotate-180[data-v-491347ae] {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=2)\";\n  -webkit-transform: rotate(180deg);\n  -ms-transform: rotate(180deg);\n  transform: rotate(180deg);\n}\n.fa-rotate-270[data-v-491347ae] {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=3)\";\n  -webkit-transform: rotate(270deg);\n  -ms-transform: rotate(270deg);\n  transform: rotate(270deg);\n}\n.fa-flip-horizontal[data-v-491347ae] {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=0, mirror=1)\";\n  -webkit-transform: scale(-1, 1);\n  -ms-transform: scale(-1, 1);\n  transform: scale(-1, 1);\n}\n.fa-flip-vertical[data-v-491347ae] {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)\";\n  -webkit-transform: scale(1, -1);\n  -ms-transform: scale(1, -1);\n  transform: scale(1, -1);\n}\n:root .fa-rotate-90[data-v-491347ae],\n:root .fa-rotate-180[data-v-491347ae],\n:root .fa-rotate-270[data-v-491347ae],\n:root .fa-flip-horizontal[data-v-491347ae],\n:root .fa-flip-vertical[data-v-491347ae] {\n  filter: none;\n}\n.fa-stack[data-v-491347ae] {\n  position: relative;\n  display: inline-block;\n  width: 2em;\n  height: 2em;\n  line-height: 2em;\n  vertical-align: middle;\n}\n.fa-stack-1x[data-v-491347ae],\n.fa-stack-2x[data-v-491347ae] {\n  position: absolute;\n  left: 0;\n  width: 100%;\n  text-align: center;\n}\n.fa-stack-1x[data-v-491347ae] {\n  line-height: inherit;\n}\n.fa-stack-2x[data-v-491347ae] {\n  font-size: 2em;\n}\n.fa-inverse[data-v-491347ae] {\n  color: #fff;\n}\n/* Font Awesome uses the Unicode Private Use Area (PUA) to ensure screen\n   readers do not read off random characters that represent icons */\n.fa-glass[data-v-491347ae]:before {\n  content: \"\\f000\";\n}\n.fa-music[data-v-491347ae]:before {\n  content: \"\\f001\";\n}\n.fa-search[data-v-491347ae]:before {\n  content: \"\\f002\";\n}\n.fa-envelope-o[data-v-491347ae]:before {\n  content: \"\\f003\";\n}\n.fa-heart[data-v-491347ae]:before {\n  content: \"\\f004\";\n}\n.fa-star[data-v-491347ae]:before {\n  content: \"\\f005\";\n}\n.fa-star-o[data-v-491347ae]:before {\n  content: \"\\f006\";\n}\n.fa-user[data-v-491347ae]:before {\n  content: \"\\f007\";\n}\n.fa-film[data-v-491347ae]:before {\n  content: \"\\f008\";\n}\n.fa-th-large[data-v-491347ae]:before {\n  content: \"\\f009\";\n}\n.fa-th[data-v-491347ae]:before {\n  content: \"\\f00a\";\n}\n.fa-th-list[data-v-491347ae]:before {\n  content: \"\\f00b\";\n}\n.fa-check[data-v-491347ae]:before {\n  content: \"\\f00c\";\n}\n.fa-remove[data-v-491347ae]:before,\n.fa-close[data-v-491347ae]:before,\n.fa-times[data-v-491347ae]:before {\n  content: \"\\f00d\";\n}\n.fa-search-plus[data-v-491347ae]:before {\n  content: \"\\f00e\";\n}\n.fa-search-minus[data-v-491347ae]:before {\n  content: \"\\f010\";\n}\n.fa-power-off[data-v-491347ae]:before {\n  content: \"\\f011\";\n}\n.fa-signal[data-v-491347ae]:before {\n  content: \"\\f012\";\n}\n.fa-gear[data-v-491347ae]:before,\n.fa-cog[data-v-491347ae]:before {\n  content: \"\\f013\";\n}\n.fa-trash-o[data-v-491347ae]:before {\n  content: \"\\f014\";\n}\n.fa-home[data-v-491347ae]:before {\n  content: \"\\f015\";\n}\n.fa-file-o[data-v-491347ae]:before {\n  content: \"\\f016\";\n}\n.fa-clock-o[data-v-491347ae]:before {\n  content: \"\\f017\";\n}\n.fa-road[data-v-491347ae]:before {\n  content: \"\\f018\";\n}\n.fa-download[data-v-491347ae]:before {\n  content: \"\\f019\";\n}\n.fa-arrow-circle-o-down[data-v-491347ae]:before {\n  content: \"\\f01a\";\n}\n.fa-arrow-circle-o-up[data-v-491347ae]:before {\n  content: \"\\f01b\";\n}\n.fa-inbox[data-v-491347ae]:before {\n  content: \"\\f01c\";\n}\n.fa-play-circle-o[data-v-491347ae]:before {\n  content: \"\\f01d\";\n}\n.fa-rotate-right[data-v-491347ae]:before,\n.fa-repeat[data-v-491347ae]:before {\n  content: \"\\f01e\";\n}\n.fa-refresh[data-v-491347ae]:before {\n  content: \"\\f021\";\n}\n.fa-list-alt[data-v-491347ae]:before {\n  content: \"\\f022\";\n}\n.fa-lock[data-v-491347ae]:before {\n  content: \"\\f023\";\n}\n.fa-flag[data-v-491347ae]:before {\n  content: \"\\f024\";\n}\n.fa-headphones[data-v-491347ae]:before {\n  content: \"\\f025\";\n}\n.fa-volume-off[data-v-491347ae]:before {\n  content: \"\\f026\";\n}\n.fa-volume-down[data-v-491347ae]:before {\n  content: \"\\f027\";\n}\n.fa-volume-up[data-v-491347ae]:before {\n  content: \"\\f028\";\n}\n.fa-qrcode[data-v-491347ae]:before {\n  content: \"\\f029\";\n}\n.fa-barcode[data-v-491347ae]:before {\n  content: \"\\f02a\";\n}\n.fa-tag[data-v-491347ae]:before {\n  content: \"\\f02b\";\n}\n.fa-tags[data-v-491347ae]:before {\n  content: \"\\f02c\";\n}\n.fa-book[data-v-491347ae]:before {\n  content: \"\\f02d\";\n}\n.fa-bookmark[data-v-491347ae]:before {\n  content: \"\\f02e\";\n}\n.fa-print[data-v-491347ae]:before {\n  content: \"\\f02f\";\n}\n.fa-camera[data-v-491347ae]:before {\n  content: \"\\f030\";\n}\n.fa-font[data-v-491347ae]:before {\n  content: \"\\f031\";\n}\n.fa-bold[data-v-491347ae]:before {\n  content: \"\\f032\";\n}\n.fa-italic[data-v-491347ae]:before {\n  content: \"\\f033\";\n}\n.fa-text-height[data-v-491347ae]:before {\n  content: \"\\f034\";\n}\n.fa-text-width[data-v-491347ae]:before {\n  content: \"\\f035\";\n}\n.fa-align-left[data-v-491347ae]:before {\n  content: \"\\f036\";\n}\n.fa-align-center[data-v-491347ae]:before {\n  content: \"\\f037\";\n}\n.fa-align-right[data-v-491347ae]:before {\n  content: \"\\f038\";\n}\n.fa-align-justify[data-v-491347ae]:before {\n  content: \"\\f039\";\n}\n.fa-list[data-v-491347ae]:before {\n  content: \"\\f03a\";\n}\n.fa-dedent[data-v-491347ae]:before,\n.fa-outdent[data-v-491347ae]:before {\n  content: \"\\f03b\";\n}\n.fa-indent[data-v-491347ae]:before {\n  content: \"\\f03c\";\n}\n.fa-video-camera[data-v-491347ae]:before {\n  content: \"\\f03d\";\n}\n.fa-photo[data-v-491347ae]:before,\n.fa-image[data-v-491347ae]:before,\n.fa-picture-o[data-v-491347ae]:before {\n  content: \"\\f03e\";\n}\n.fa-pencil[data-v-491347ae]:before {\n  content: \"\\f040\";\n}\n.fa-map-marker[data-v-491347ae]:before {\n  content: \"\\f041\";\n}\n.fa-adjust[data-v-491347ae]:before {\n  content: \"\\f042\";\n}\n.fa-tint[data-v-491347ae]:before {\n  content: \"\\f043\";\n}\n.fa-edit[data-v-491347ae]:before,\n.fa-pencil-square-o[data-v-491347ae]:before {\n  content: \"\\f044\";\n}\n.fa-share-square-o[data-v-491347ae]:before {\n  content: \"\\f045\";\n}\n.fa-check-square-o[data-v-491347ae]:before {\n  content: \"\\f046\";\n}\n.fa-arrows[data-v-491347ae]:before {\n  content: \"\\f047\";\n}\n.fa-step-backward[data-v-491347ae]:before {\n  content: \"\\f048\";\n}\n.fa-fast-backward[data-v-491347ae]:before {\n  content: \"\\f049\";\n}\n.fa-backward[data-v-491347ae]:before {\n  content: \"\\f04a\";\n}\n.fa-play[data-v-491347ae]:before {\n  content: \"\\f04b\";\n}\n.fa-pause[data-v-491347ae]:before {\n  content: \"\\f04c\";\n}\n.fa-stop[data-v-491347ae]:before {\n  content: \"\\f04d\";\n}\n.fa-forward[data-v-491347ae]:before {\n  content: \"\\f04e\";\n}\n.fa-fast-forward[data-v-491347ae]:before {\n  content: \"\\f050\";\n}\n.fa-step-forward[data-v-491347ae]:before {\n  content: \"\\f051\";\n}\n.fa-eject[data-v-491347ae]:before {\n  content: \"\\f052\";\n}\n.fa-chevron-left[data-v-491347ae]:before {\n  content: \"\\f053\";\n}\n.fa-chevron-right[data-v-491347ae]:before {\n  content: \"\\f054\";\n}\n.fa-plus-circle[data-v-491347ae]:before {\n  content: \"\\f055\";\n}\n.fa-minus-circle[data-v-491347ae]:before {\n  content: \"\\f056\";\n}\n.fa-times-circle[data-v-491347ae]:before {\n  content: \"\\f057\";\n}\n.fa-check-circle[data-v-491347ae]:before {\n  content: \"\\f058\";\n}\n.fa-question-circle[data-v-491347ae]:before {\n  content: \"\\f059\";\n}\n.fa-info-circle[data-v-491347ae]:before {\n  content: \"\\f05a\";\n}\n.fa-crosshairs[data-v-491347ae]:before {\n  content: \"\\f05b\";\n}\n.fa-times-circle-o[data-v-491347ae]:before {\n  content: \"\\f05c\";\n}\n.fa-check-circle-o[data-v-491347ae]:before {\n  content: \"\\f05d\";\n}\n.fa-ban[data-v-491347ae]:before {\n  content: \"\\f05e\";\n}\n.fa-arrow-left[data-v-491347ae]:before {\n  content: \"\\f060\";\n}\n.fa-arrow-right[data-v-491347ae]:before {\n  content: \"\\f061\";\n}\n.fa-arrow-up[data-v-491347ae]:before {\n  content: \"\\f062\";\n}\n.fa-arrow-down[data-v-491347ae]:before {\n  content: \"\\f063\";\n}\n.fa-mail-forward[data-v-491347ae]:before,\n.fa-share[data-v-491347ae]:before {\n  content: \"\\f064\";\n}\n.fa-expand[data-v-491347ae]:before {\n  content: \"\\f065\";\n}\n.fa-compress[data-v-491347ae]:before {\n  content: \"\\f066\";\n}\n.fa-plus[data-v-491347ae]:before {\n  content: \"\\f067\";\n}\n.fa-minus[data-v-491347ae]:before {\n  content: \"\\f068\";\n}\n.fa-asterisk[data-v-491347ae]:before {\n  content: \"\\f069\";\n}\n.fa-exclamation-circle[data-v-491347ae]:before {\n  content: \"\\f06a\";\n}\n.fa-gift[data-v-491347ae]:before {\n  content: \"\\f06b\";\n}\n.fa-leaf[data-v-491347ae]:before {\n  content: \"\\f06c\";\n}\n.fa-fire[data-v-491347ae]:before {\n  content: \"\\f06d\";\n}\n.fa-eye[data-v-491347ae]:before {\n  content: \"\\f06e\";\n}\n.fa-eye-slash[data-v-491347ae]:before {\n  content: \"\\f070\";\n}\n.fa-warning[data-v-491347ae]:before,\n.fa-exclamation-triangle[data-v-491347ae]:before {\n  content: \"\\f071\";\n}\n.fa-plane[data-v-491347ae]:before {\n  content: \"\\f072\";\n}\n.fa-calendar[data-v-491347ae]:before {\n  content: \"\\f073\";\n}\n.fa-random[data-v-491347ae]:before {\n  content: \"\\f074\";\n}\n.fa-comment[data-v-491347ae]:before {\n  content: \"\\f075\";\n}\n.fa-magnet[data-v-491347ae]:before {\n  content: \"\\f076\";\n}\n.fa-chevron-up[data-v-491347ae]:before {\n  content: \"\\f077\";\n}\n.fa-chevron-down[data-v-491347ae]:before {\n  content: \"\\f078\";\n}\n.fa-retweet[data-v-491347ae]:before {\n  content: \"\\f079\";\n}\n.fa-shopping-cart[data-v-491347ae]:before {\n  content: \"\\f07a\";\n}\n.fa-folder[data-v-491347ae]:before {\n  content: \"\\f07b\";\n}\n.fa-folder-open[data-v-491347ae]:before {\n  content: \"\\f07c\";\n}\n.fa-arrows-v[data-v-491347ae]:before {\n  content: \"\\f07d\";\n}\n.fa-arrows-h[data-v-491347ae]:before {\n  content: \"\\f07e\";\n}\n.fa-bar-chart-o[data-v-491347ae]:before,\n.fa-bar-chart[data-v-491347ae]:before {\n  content: \"\\f080\";\n}\n.fa-twitter-square[data-v-491347ae]:before {\n  content: \"\\f081\";\n}\n.fa-facebook-square[data-v-491347ae]:before {\n  content: \"\\f082\";\n}\n.fa-camera-retro[data-v-491347ae]:before {\n  content: \"\\f083\";\n}\n.fa-key[data-v-491347ae]:before {\n  content: \"\\f084\";\n}\n.fa-gears[data-v-491347ae]:before,\n.fa-cogs[data-v-491347ae]:before {\n  content: \"\\f085\";\n}\n.fa-comments[data-v-491347ae]:before {\n  content: \"\\f086\";\n}\n.fa-thumbs-o-up[data-v-491347ae]:before {\n  content: \"\\f087\";\n}\n.fa-thumbs-o-down[data-v-491347ae]:before {\n  content: \"\\f088\";\n}\n.fa-star-half[data-v-491347ae]:before {\n  content: \"\\f089\";\n}\n.fa-heart-o[data-v-491347ae]:before {\n  content: \"\\f08a\";\n}\n.fa-sign-out[data-v-491347ae]:before {\n  content: \"\\f08b\";\n}\n.fa-linkedin-square[data-v-491347ae]:before {\n  content: \"\\f08c\";\n}\n.fa-thumb-tack[data-v-491347ae]:before {\n  content: \"\\f08d\";\n}\n.fa-external-link[data-v-491347ae]:before {\n  content: \"\\f08e\";\n}\n.fa-sign-in[data-v-491347ae]:before {\n  content: \"\\f090\";\n}\n.fa-trophy[data-v-491347ae]:before {\n  content: \"\\f091\";\n}\n.fa-github-square[data-v-491347ae]:before {\n  content: \"\\f092\";\n}\n.fa-upload[data-v-491347ae]:before {\n  content: \"\\f093\";\n}\n.fa-lemon-o[data-v-491347ae]:before {\n  content: \"\\f094\";\n}\n.fa-phone[data-v-491347ae]:before {\n  content: \"\\f095\";\n}\n.fa-square-o[data-v-491347ae]:before {\n  content: \"\\f096\";\n}\n.fa-bookmark-o[data-v-491347ae]:before {\n  content: \"\\f097\";\n}\n.fa-phone-square[data-v-491347ae]:before {\n  content: \"\\f098\";\n}\n.fa-twitter[data-v-491347ae]:before {\n  content: \"\\f099\";\n}\n.fa-facebook-f[data-v-491347ae]:before,\n.fa-facebook[data-v-491347ae]:before {\n  content: \"\\f09a\";\n}\n.fa-github[data-v-491347ae]:before {\n  content: \"\\f09b\";\n}\n.fa-unlock[data-v-491347ae]:before {\n  content: \"\\f09c\";\n}\n.fa-credit-card[data-v-491347ae]:before {\n  content: \"\\f09d\";\n}\n.fa-feed[data-v-491347ae]:before,\n.fa-rss[data-v-491347ae]:before {\n  content: \"\\f09e\";\n}\n.fa-hdd-o[data-v-491347ae]:before {\n  content: \"\\f0a0\";\n}\n.fa-bullhorn[data-v-491347ae]:before {\n  content: \"\\f0a1\";\n}\n.fa-bell[data-v-491347ae]:before {\n  content: \"\\f0f3\";\n}\n.fa-certificate[data-v-491347ae]:before {\n  content: \"\\f0a3\";\n}\n.fa-hand-o-right[data-v-491347ae]:before {\n  content: \"\\f0a4\";\n}\n.fa-hand-o-left[data-v-491347ae]:before {\n  content: \"\\f0a5\";\n}\n.fa-hand-o-up[data-v-491347ae]:before {\n  content: \"\\f0a6\";\n}\n.fa-hand-o-down[data-v-491347ae]:before {\n  content: \"\\f0a7\";\n}\n.fa-arrow-circle-left[data-v-491347ae]:before {\n  content: \"\\f0a8\";\n}\n.fa-arrow-circle-right[data-v-491347ae]:before {\n  content: \"\\f0a9\";\n}\n.fa-arrow-circle-up[data-v-491347ae]:before {\n  content: \"\\f0aa\";\n}\n.fa-arrow-circle-down[data-v-491347ae]:before {\n  content: \"\\f0ab\";\n}\n.fa-globe[data-v-491347ae]:before {\n  content: \"\\f0ac\";\n}\n.fa-wrench[data-v-491347ae]:before {\n  content: \"\\f0ad\";\n}\n.fa-tasks[data-v-491347ae]:before {\n  content: \"\\f0ae\";\n}\n.fa-filter[data-v-491347ae]:before {\n  content: \"\\f0b0\";\n}\n.fa-briefcase[data-v-491347ae]:before {\n  content: \"\\f0b1\";\n}\n.fa-arrows-alt[data-v-491347ae]:before {\n  content: \"\\f0b2\";\n}\n.fa-group[data-v-491347ae]:before,\n.fa-users[data-v-491347ae]:before {\n  content: \"\\f0c0\";\n}\n.fa-chain[data-v-491347ae]:before,\n.fa-link[data-v-491347ae]:before {\n  content: \"\\f0c1\";\n}\n.fa-cloud[data-v-491347ae]:before {\n  content: \"\\f0c2\";\n}\n.fa-flask[data-v-491347ae]:before {\n  content: \"\\f0c3\";\n}\n.fa-cut[data-v-491347ae]:before,\n.fa-scissors[data-v-491347ae]:before {\n  content: \"\\f0c4\";\n}\n.fa-copy[data-v-491347ae]:before,\n.fa-files-o[data-v-491347ae]:before {\n  content: \"\\f0c5\";\n}\n.fa-paperclip[data-v-491347ae]:before {\n  content: \"\\f0c6\";\n}\n.fa-save[data-v-491347ae]:before,\n.fa-floppy-o[data-v-491347ae]:before {\n  content: \"\\f0c7\";\n}\n.fa-square[data-v-491347ae]:before {\n  content: \"\\f0c8\";\n}\n.fa-navicon[data-v-491347ae]:before,\n.fa-reorder[data-v-491347ae]:before,\n.fa-bars[data-v-491347ae]:before {\n  content: \"\\f0c9\";\n}\n.fa-list-ul[data-v-491347ae]:before {\n  content: \"\\f0ca\";\n}\n.fa-list-ol[data-v-491347ae]:before {\n  content: \"\\f0cb\";\n}\n.fa-strikethrough[data-v-491347ae]:before {\n  content: \"\\f0cc\";\n}\n.fa-underline[data-v-491347ae]:before {\n  content: \"\\f0cd\";\n}\n.fa-table[data-v-491347ae]:before {\n  content: \"\\f0ce\";\n}\n.fa-magic[data-v-491347ae]:before {\n  content: \"\\f0d0\";\n}\n.fa-truck[data-v-491347ae]:before {\n  content: \"\\f0d1\";\n}\n.fa-pinterest[data-v-491347ae]:before {\n  content: \"\\f0d2\";\n}\n.fa-pinterest-square[data-v-491347ae]:before {\n  content: \"\\f0d3\";\n}\n.fa-google-plus-square[data-v-491347ae]:before {\n  content: \"\\f0d4\";\n}\n.fa-google-plus[data-v-491347ae]:before {\n  content: \"\\f0d5\";\n}\n.fa-money[data-v-491347ae]:before {\n  content: \"\\f0d6\";\n}\n.fa-caret-down[data-v-491347ae]:before {\n  content: \"\\f0d7\";\n}\n.fa-caret-up[data-v-491347ae]:before {\n  content: \"\\f0d8\";\n}\n.fa-caret-left[data-v-491347ae]:before {\n  content: \"\\f0d9\";\n}\n.fa-caret-right[data-v-491347ae]:before {\n  content: \"\\f0da\";\n}\n.fa-columns[data-v-491347ae]:before {\n  content: \"\\f0db\";\n}\n.fa-unsorted[data-v-491347ae]:before,\n.fa-sort[data-v-491347ae]:before {\n  content: \"\\f0dc\";\n}\n.fa-sort-down[data-v-491347ae]:before,\n.fa-sort-desc[data-v-491347ae]:before {\n  content: \"\\f0dd\";\n}\n.fa-sort-up[data-v-491347ae]:before,\n.fa-sort-asc[data-v-491347ae]:before {\n  content: \"\\f0de\";\n}\n.fa-envelope[data-v-491347ae]:before {\n  content: \"\\f0e0\";\n}\n.fa-linkedin[data-v-491347ae]:before {\n  content: \"\\f0e1\";\n}\n.fa-rotate-left[data-v-491347ae]:before,\n.fa-undo[data-v-491347ae]:before {\n  content: \"\\f0e2\";\n}\n.fa-legal[data-v-491347ae]:before,\n.fa-gavel[data-v-491347ae]:before {\n  content: \"\\f0e3\";\n}\n.fa-dashboard[data-v-491347ae]:before,\n.fa-tachometer[data-v-491347ae]:before {\n  content: \"\\f0e4\";\n}\n.fa-comment-o[data-v-491347ae]:before {\n  content: \"\\f0e5\";\n}\n.fa-comments-o[data-v-491347ae]:before {\n  content: \"\\f0e6\";\n}\n.fa-flash[data-v-491347ae]:before,\n.fa-bolt[data-v-491347ae]:before {\n  content: \"\\f0e7\";\n}\n.fa-sitemap[data-v-491347ae]:before {\n  content: \"\\f0e8\";\n}\n.fa-umbrella[data-v-491347ae]:before {\n  content: \"\\f0e9\";\n}\n.fa-paste[data-v-491347ae]:before,\n.fa-clipboard[data-v-491347ae]:before {\n  content: \"\\f0ea\";\n}\n.fa-lightbulb-o[data-v-491347ae]:before {\n  content: \"\\f0eb\";\n}\n.fa-exchange[data-v-491347ae]:before {\n  content: \"\\f0ec\";\n}\n.fa-cloud-download[data-v-491347ae]:before {\n  content: \"\\f0ed\";\n}\n.fa-cloud-upload[data-v-491347ae]:before {\n  content: \"\\f0ee\";\n}\n.fa-user-md[data-v-491347ae]:before {\n  content: \"\\f0f0\";\n}\n.fa-stethoscope[data-v-491347ae]:before {\n  content: \"\\f0f1\";\n}\n.fa-suitcase[data-v-491347ae]:before {\n  content: \"\\f0f2\";\n}\n.fa-bell-o[data-v-491347ae]:before {\n  content: \"\\f0a2\";\n}\n.fa-coffee[data-v-491347ae]:before {\n  content: \"\\f0f4\";\n}\n.fa-cutlery[data-v-491347ae]:before {\n  content: \"\\f0f5\";\n}\n.fa-file-text-o[data-v-491347ae]:before {\n  content: \"\\f0f6\";\n}\n.fa-building-o[data-v-491347ae]:before {\n  content: \"\\f0f7\";\n}\n.fa-hospital-o[data-v-491347ae]:before {\n  content: \"\\f0f8\";\n}\n.fa-ambulance[data-v-491347ae]:before {\n  content: \"\\f0f9\";\n}\n.fa-medkit[data-v-491347ae]:before {\n  content: \"\\f0fa\";\n}\n.fa-fighter-jet[data-v-491347ae]:before {\n  content: \"\\f0fb\";\n}\n.fa-beer[data-v-491347ae]:before {\n  content: \"\\f0fc\";\n}\n.fa-h-square[data-v-491347ae]:before {\n  content: \"\\f0fd\";\n}\n.fa-plus-square[data-v-491347ae]:before {\n  content: \"\\f0fe\";\n}\n.fa-angle-double-left[data-v-491347ae]:before {\n  content: \"\\f100\";\n}\n.fa-angle-double-right[data-v-491347ae]:before {\n  content: \"\\f101\";\n}\n.fa-angle-double-up[data-v-491347ae]:before {\n  content: \"\\f102\";\n}\n.fa-angle-double-down[data-v-491347ae]:before {\n  content: \"\\f103\";\n}\n.fa-angle-left[data-v-491347ae]:before {\n  content: \"\\f104\";\n}\n.fa-angle-right[data-v-491347ae]:before {\n  content: \"\\f105\";\n}\n.fa-angle-up[data-v-491347ae]:before {\n  content: \"\\f106\";\n}\n.fa-angle-down[data-v-491347ae]:before {\n  content: \"\\f107\";\n}\n.fa-desktop[data-v-491347ae]:before {\n  content: \"\\f108\";\n}\n.fa-laptop[data-v-491347ae]:before {\n  content: \"\\f109\";\n}\n.fa-tablet[data-v-491347ae]:before {\n  content: \"\\f10a\";\n}\n.fa-mobile-phone[data-v-491347ae]:before,\n.fa-mobile[data-v-491347ae]:before {\n  content: \"\\f10b\";\n}\n.fa-circle-o[data-v-491347ae]:before {\n  content: \"\\f10c\";\n}\n.fa-quote-left[data-v-491347ae]:before {\n  content: \"\\f10d\";\n}\n.fa-quote-right[data-v-491347ae]:before {\n  content: \"\\f10e\";\n}\n.fa-spinner[data-v-491347ae]:before {\n  content: \"\\f110\";\n}\n.fa-circle[data-v-491347ae]:before {\n  content: \"\\f111\";\n}\n.fa-mail-reply[data-v-491347ae]:before,\n.fa-reply[data-v-491347ae]:before {\n  content: \"\\f112\";\n}\n.fa-github-alt[data-v-491347ae]:before {\n  content: \"\\f113\";\n}\n.fa-folder-o[data-v-491347ae]:before {\n  content: \"\\f114\";\n}\n.fa-folder-open-o[data-v-491347ae]:before {\n  content: \"\\f115\";\n}\n.fa-smile-o[data-v-491347ae]:before {\n  content: \"\\f118\";\n}\n.fa-frown-o[data-v-491347ae]:before {\n  content: \"\\f119\";\n}\n.fa-meh-o[data-v-491347ae]:before {\n  content: \"\\f11a\";\n}\n.fa-gamepad[data-v-491347ae]:before {\n  content: \"\\f11b\";\n}\n.fa-keyboard-o[data-v-491347ae]:before {\n  content: \"\\f11c\";\n}\n.fa-flag-o[data-v-491347ae]:before {\n  content: \"\\f11d\";\n}\n.fa-flag-checkered[data-v-491347ae]:before {\n  content: \"\\f11e\";\n}\n.fa-terminal[data-v-491347ae]:before {\n  content: \"\\f120\";\n}\n.fa-code[data-v-491347ae]:before {\n  content: \"\\f121\";\n}\n.fa-mail-reply-all[data-v-491347ae]:before,\n.fa-reply-all[data-v-491347ae]:before {\n  content: \"\\f122\";\n}\n.fa-star-half-empty[data-v-491347ae]:before,\n.fa-star-half-full[data-v-491347ae]:before,\n.fa-star-half-o[data-v-491347ae]:before {\n  content: \"\\f123\";\n}\n.fa-location-arrow[data-v-491347ae]:before {\n  content: \"\\f124\";\n}\n.fa-crop[data-v-491347ae]:before {\n  content: \"\\f125\";\n}\n.fa-code-fork[data-v-491347ae]:before {\n  content: \"\\f126\";\n}\n.fa-unlink[data-v-491347ae]:before,\n.fa-chain-broken[data-v-491347ae]:before {\n  content: \"\\f127\";\n}\n.fa-question[data-v-491347ae]:before {\n  content: \"\\f128\";\n}\n.fa-info[data-v-491347ae]:before {\n  content: \"\\f129\";\n}\n.fa-exclamation[data-v-491347ae]:before {\n  content: \"\\f12a\";\n}\n.fa-superscript[data-v-491347ae]:before {\n  content: \"\\f12b\";\n}\n.fa-subscript[data-v-491347ae]:before {\n  content: \"\\f12c\";\n}\n.fa-eraser[data-v-491347ae]:before {\n  content: \"\\f12d\";\n}\n.fa-puzzle-piece[data-v-491347ae]:before {\n  content: \"\\f12e\";\n}\n.fa-microphone[data-v-491347ae]:before {\n  content: \"\\f130\";\n}\n.fa-microphone-slash[data-v-491347ae]:before {\n  content: \"\\f131\";\n}\n.fa-shield[data-v-491347ae]:before {\n  content: \"\\f132\";\n}\n.fa-calendar-o[data-v-491347ae]:before {\n  content: \"\\f133\";\n}\n.fa-fire-extinguisher[data-v-491347ae]:before {\n  content: \"\\f134\";\n}\n.fa-rocket[data-v-491347ae]:before {\n  content: \"\\f135\";\n}\n.fa-maxcdn[data-v-491347ae]:before {\n  content: \"\\f136\";\n}\n.fa-chevron-circle-left[data-v-491347ae]:before {\n  content: \"\\f137\";\n}\n.fa-chevron-circle-right[data-v-491347ae]:before {\n  content: \"\\f138\";\n}\n.fa-chevron-circle-up[data-v-491347ae]:before {\n  content: \"\\f139\";\n}\n.fa-chevron-circle-down[data-v-491347ae]:before {\n  content: \"\\f13a\";\n}\n.fa-html5[data-v-491347ae]:before {\n  content: \"\\f13b\";\n}\n.fa-css3[data-v-491347ae]:before {\n  content: \"\\f13c\";\n}\n.fa-anchor[data-v-491347ae]:before {\n  content: \"\\f13d\";\n}\n.fa-unlock-alt[data-v-491347ae]:before {\n  content: \"\\f13e\";\n}\n.fa-bullseye[data-v-491347ae]:before {\n  content: \"\\f140\";\n}\n.fa-ellipsis-h[data-v-491347ae]:before {\n  content: \"\\f141\";\n}\n.fa-ellipsis-v[data-v-491347ae]:before {\n  content: \"\\f142\";\n}\n.fa-rss-square[data-v-491347ae]:before {\n  content: \"\\f143\";\n}\n.fa-play-circle[data-v-491347ae]:before {\n  content: \"\\f144\";\n}\n.fa-ticket[data-v-491347ae]:before {\n  content: \"\\f145\";\n}\n.fa-minus-square[data-v-491347ae]:before {\n  content: \"\\f146\";\n}\n.fa-minus-square-o[data-v-491347ae]:before {\n  content: \"\\f147\";\n}\n.fa-level-up[data-v-491347ae]:before {\n  content: \"\\f148\";\n}\n.fa-level-down[data-v-491347ae]:before {\n  content: \"\\f149\";\n}\n.fa-check-square[data-v-491347ae]:before {\n  content: \"\\f14a\";\n}\n.fa-pencil-square[data-v-491347ae]:before {\n  content: \"\\f14b\";\n}\n.fa-external-link-square[data-v-491347ae]:before {\n  content: \"\\f14c\";\n}\n.fa-share-square[data-v-491347ae]:before {\n  content: \"\\f14d\";\n}\n.fa-compass[data-v-491347ae]:before {\n  content: \"\\f14e\";\n}\n.fa-toggle-down[data-v-491347ae]:before,\n.fa-caret-square-o-down[data-v-491347ae]:before {\n  content: \"\\f150\";\n}\n.fa-toggle-up[data-v-491347ae]:before,\n.fa-caret-square-o-up[data-v-491347ae]:before {\n  content: \"\\f151\";\n}\n.fa-toggle-right[data-v-491347ae]:before,\n.fa-caret-square-o-right[data-v-491347ae]:before {\n  content: \"\\f152\";\n}\n.fa-euro[data-v-491347ae]:before,\n.fa-eur[data-v-491347ae]:before {\n  content: \"\\f153\";\n}\n.fa-gbp[data-v-491347ae]:before {\n  content: \"\\f154\";\n}\n.fa-dollar[data-v-491347ae]:before,\n.fa-usd[data-v-491347ae]:before {\n  content: \"\\f155\";\n}\n.fa-rupee[data-v-491347ae]:before,\n.fa-inr[data-v-491347ae]:before {\n  content: \"\\f156\";\n}\n.fa-cny[data-v-491347ae]:before,\n.fa-rmb[data-v-491347ae]:before,\n.fa-yen[data-v-491347ae]:before,\n.fa-jpy[data-v-491347ae]:before {\n  content: \"\\f157\";\n}\n.fa-ruble[data-v-491347ae]:before,\n.fa-rouble[data-v-491347ae]:before,\n.fa-rub[data-v-491347ae]:before {\n  content: \"\\f158\";\n}\n.fa-won[data-v-491347ae]:before,\n.fa-krw[data-v-491347ae]:before {\n  content: \"\\f159\";\n}\n.fa-bitcoin[data-v-491347ae]:before,\n.fa-btc[data-v-491347ae]:before {\n  content: \"\\f15a\";\n}\n.fa-file[data-v-491347ae]:before {\n  content: \"\\f15b\";\n}\n.fa-file-text[data-v-491347ae]:before {\n  content: \"\\f15c\";\n}\n.fa-sort-alpha-asc[data-v-491347ae]:before {\n  content: \"\\f15d\";\n}\n.fa-sort-alpha-desc[data-v-491347ae]:before {\n  content: \"\\f15e\";\n}\n.fa-sort-amount-asc[data-v-491347ae]:before {\n  content: \"\\f160\";\n}\n.fa-sort-amount-desc[data-v-491347ae]:before {\n  content: \"\\f161\";\n}\n.fa-sort-numeric-asc[data-v-491347ae]:before {\n  content: \"\\f162\";\n}\n.fa-sort-numeric-desc[data-v-491347ae]:before {\n  content: \"\\f163\";\n}\n.fa-thumbs-up[data-v-491347ae]:before {\n  content: \"\\f164\";\n}\n.fa-thumbs-down[data-v-491347ae]:before {\n  content: \"\\f165\";\n}\n.fa-youtube-square[data-v-491347ae]:before {\n  content: \"\\f166\";\n}\n.fa-youtube[data-v-491347ae]:before {\n  content: \"\\f167\";\n}\n.fa-xing[data-v-491347ae]:before {\n  content: \"\\f168\";\n}\n.fa-xing-square[data-v-491347ae]:before {\n  content: \"\\f169\";\n}\n.fa-youtube-play[data-v-491347ae]:before {\n  content: \"\\f16a\";\n}\n.fa-dropbox[data-v-491347ae]:before {\n  content: \"\\f16b\";\n}\n.fa-stack-overflow[data-v-491347ae]:before {\n  content: \"\\f16c\";\n}\n.fa-instagram[data-v-491347ae]:before {\n  content: \"\\f16d\";\n}\n.fa-flickr[data-v-491347ae]:before {\n  content: \"\\f16e\";\n}\n.fa-adn[data-v-491347ae]:before {\n  content: \"\\f170\";\n}\n.fa-bitbucket[data-v-491347ae]:before {\n  content: \"\\f171\";\n}\n.fa-bitbucket-square[data-v-491347ae]:before {\n  content: \"\\f172\";\n}\n.fa-tumblr[data-v-491347ae]:before {\n  content: \"\\f173\";\n}\n.fa-tumblr-square[data-v-491347ae]:before {\n  content: \"\\f174\";\n}\n.fa-long-arrow-down[data-v-491347ae]:before {\n  content: \"\\f175\";\n}\n.fa-long-arrow-up[data-v-491347ae]:before {\n  content: \"\\f176\";\n}\n.fa-long-arrow-left[data-v-491347ae]:before {\n  content: \"\\f177\";\n}\n.fa-long-arrow-right[data-v-491347ae]:before {\n  content: \"\\f178\";\n}\n.fa-apple[data-v-491347ae]:before {\n  content: \"\\f179\";\n}\n.fa-windows[data-v-491347ae]:before {\n  content: \"\\f17a\";\n}\n.fa-android[data-v-491347ae]:before {\n  content: \"\\f17b\";\n}\n.fa-linux[data-v-491347ae]:before {\n  content: \"\\f17c\";\n}\n.fa-dribbble[data-v-491347ae]:before {\n  content: \"\\f17d\";\n}\n.fa-skype[data-v-491347ae]:before {\n  content: \"\\f17e\";\n}\n.fa-foursquare[data-v-491347ae]:before {\n  content: \"\\f180\";\n}\n.fa-trello[data-v-491347ae]:before {\n  content: \"\\f181\";\n}\n.fa-female[data-v-491347ae]:before {\n  content: \"\\f182\";\n}\n.fa-male[data-v-491347ae]:before {\n  content: \"\\f183\";\n}\n.fa-gittip[data-v-491347ae]:before,\n.fa-gratipay[data-v-491347ae]:before {\n  content: \"\\f184\";\n}\n.fa-sun-o[data-v-491347ae]:before {\n  content: \"\\f185\";\n}\n.fa-moon-o[data-v-491347ae]:before {\n  content: \"\\f186\";\n}\n.fa-archive[data-v-491347ae]:before {\n  content: \"\\f187\";\n}\n.fa-bug[data-v-491347ae]:before {\n  content: \"\\f188\";\n}\n.fa-vk[data-v-491347ae]:before {\n  content: \"\\f189\";\n}\n.fa-weibo[data-v-491347ae]:before {\n  content: \"\\f18a\";\n}\n.fa-renren[data-v-491347ae]:before {\n  content: \"\\f18b\";\n}\n.fa-pagelines[data-v-491347ae]:before {\n  content: \"\\f18c\";\n}\n.fa-stack-exchange[data-v-491347ae]:before {\n  content: \"\\f18d\";\n}\n.fa-arrow-circle-o-right[data-v-491347ae]:before {\n  content: \"\\f18e\";\n}\n.fa-arrow-circle-o-left[data-v-491347ae]:before {\n  content: \"\\f190\";\n}\n.fa-toggle-left[data-v-491347ae]:before,\n.fa-caret-square-o-left[data-v-491347ae]:before {\n  content: \"\\f191\";\n}\n.fa-dot-circle-o[data-v-491347ae]:before {\n  content: \"\\f192\";\n}\n.fa-wheelchair[data-v-491347ae]:before {\n  content: \"\\f193\";\n}\n.fa-vimeo-square[data-v-491347ae]:before {\n  content: \"\\f194\";\n}\n.fa-turkish-lira[data-v-491347ae]:before,\n.fa-try[data-v-491347ae]:before {\n  content: \"\\f195\";\n}\n.fa-plus-square-o[data-v-491347ae]:before {\n  content: \"\\f196\";\n}\n.fa-space-shuttle[data-v-491347ae]:before {\n  content: \"\\f197\";\n}\n.fa-slack[data-v-491347ae]:before {\n  content: \"\\f198\";\n}\n.fa-envelope-square[data-v-491347ae]:before {\n  content: \"\\f199\";\n}\n.fa-wordpress[data-v-491347ae]:before {\n  content: \"\\f19a\";\n}\n.fa-openid[data-v-491347ae]:before {\n  content: \"\\f19b\";\n}\n.fa-institution[data-v-491347ae]:before,\n.fa-bank[data-v-491347ae]:before,\n.fa-university[data-v-491347ae]:before {\n  content: \"\\f19c\";\n}\n.fa-mortar-board[data-v-491347ae]:before,\n.fa-graduation-cap[data-v-491347ae]:before {\n  content: \"\\f19d\";\n}\n.fa-yahoo[data-v-491347ae]:before {\n  content: \"\\f19e\";\n}\n.fa-google[data-v-491347ae]:before {\n  content: \"\\f1a0\";\n}\n.fa-reddit[data-v-491347ae]:before {\n  content: \"\\f1a1\";\n}\n.fa-reddit-square[data-v-491347ae]:before {\n  content: \"\\f1a2\";\n}\n.fa-stumbleupon-circle[data-v-491347ae]:before {\n  content: \"\\f1a3\";\n}\n.fa-stumbleupon[data-v-491347ae]:before {\n  content: \"\\f1a4\";\n}\n.fa-delicious[data-v-491347ae]:before {\n  content: \"\\f1a5\";\n}\n.fa-digg[data-v-491347ae]:before {\n  content: \"\\f1a6\";\n}\n.fa-pied-piper-pp[data-v-491347ae]:before {\n  content: \"\\f1a7\";\n}\n.fa-pied-piper-alt[data-v-491347ae]:before {\n  content: \"\\f1a8\";\n}\n.fa-drupal[data-v-491347ae]:before {\n  content: \"\\f1a9\";\n}\n.fa-joomla[data-v-491347ae]:before {\n  content: \"\\f1aa\";\n}\n.fa-language[data-v-491347ae]:before {\n  content: \"\\f1ab\";\n}\n.fa-fax[data-v-491347ae]:before {\n  content: \"\\f1ac\";\n}\n.fa-building[data-v-491347ae]:before {\n  content: \"\\f1ad\";\n}\n.fa-child[data-v-491347ae]:before {\n  content: \"\\f1ae\";\n}\n.fa-paw[data-v-491347ae]:before {\n  content: \"\\f1b0\";\n}\n.fa-spoon[data-v-491347ae]:before {\n  content: \"\\f1b1\";\n}\n.fa-cube[data-v-491347ae]:before {\n  content: \"\\f1b2\";\n}\n.fa-cubes[data-v-491347ae]:before {\n  content: \"\\f1b3\";\n}\n.fa-behance[data-v-491347ae]:before {\n  content: \"\\f1b4\";\n}\n.fa-behance-square[data-v-491347ae]:before {\n  content: \"\\f1b5\";\n}\n.fa-steam[data-v-491347ae]:before {\n  content: \"\\f1b6\";\n}\n.fa-steam-square[data-v-491347ae]:before {\n  content: \"\\f1b7\";\n}\n.fa-recycle[data-v-491347ae]:before {\n  content: \"\\f1b8\";\n}\n.fa-automobile[data-v-491347ae]:before,\n.fa-car[data-v-491347ae]:before {\n  content: \"\\f1b9\";\n}\n.fa-cab[data-v-491347ae]:before,\n.fa-taxi[data-v-491347ae]:before {\n  content: \"\\f1ba\";\n}\n.fa-tree[data-v-491347ae]:before {\n  content: \"\\f1bb\";\n}\n.fa-spotify[data-v-491347ae]:before {\n  content: \"\\f1bc\";\n}\n.fa-deviantart[data-v-491347ae]:before {\n  content: \"\\f1bd\";\n}\n.fa-soundcloud[data-v-491347ae]:before {\n  content: \"\\f1be\";\n}\n.fa-database[data-v-491347ae]:before {\n  content: \"\\f1c0\";\n}\n.fa-file-pdf-o[data-v-491347ae]:before {\n  content: \"\\f1c1\";\n}\n.fa-file-word-o[data-v-491347ae]:before {\n  content: \"\\f1c2\";\n}\n.fa-file-excel-o[data-v-491347ae]:before {\n  content: \"\\f1c3\";\n}\n.fa-file-powerpoint-o[data-v-491347ae]:before {\n  content: \"\\f1c4\";\n}\n.fa-file-photo-o[data-v-491347ae]:before,\n.fa-file-picture-o[data-v-491347ae]:before,\n.fa-file-image-o[data-v-491347ae]:before {\n  content: \"\\f1c5\";\n}\n.fa-file-zip-o[data-v-491347ae]:before,\n.fa-file-archive-o[data-v-491347ae]:before {\n  content: \"\\f1c6\";\n}\n.fa-file-sound-o[data-v-491347ae]:before,\n.fa-file-audio-o[data-v-491347ae]:before {\n  content: \"\\f1c7\";\n}\n.fa-file-movie-o[data-v-491347ae]:before,\n.fa-file-video-o[data-v-491347ae]:before {\n  content: \"\\f1c8\";\n}\n.fa-file-code-o[data-v-491347ae]:before {\n  content: \"\\f1c9\";\n}\n.fa-vine[data-v-491347ae]:before {\n  content: \"\\f1ca\";\n}\n.fa-codepen[data-v-491347ae]:before {\n  content: \"\\f1cb\";\n}\n.fa-jsfiddle[data-v-491347ae]:before {\n  content: \"\\f1cc\";\n}\n.fa-life-bouy[data-v-491347ae]:before,\n.fa-life-buoy[data-v-491347ae]:before,\n.fa-life-saver[data-v-491347ae]:before,\n.fa-support[data-v-491347ae]:before,\n.fa-life-ring[data-v-491347ae]:before {\n  content: \"\\f1cd\";\n}\n.fa-circle-o-notch[data-v-491347ae]:before {\n  content: \"\\f1ce\";\n}\n.fa-ra[data-v-491347ae]:before,\n.fa-resistance[data-v-491347ae]:before,\n.fa-rebel[data-v-491347ae]:before {\n  content: \"\\f1d0\";\n}\n.fa-ge[data-v-491347ae]:before,\n.fa-empire[data-v-491347ae]:before {\n  content: \"\\f1d1\";\n}\n.fa-git-square[data-v-491347ae]:before {\n  content: \"\\f1d2\";\n}\n.fa-git[data-v-491347ae]:before {\n  content: \"\\f1d3\";\n}\n.fa-y-combinator-square[data-v-491347ae]:before,\n.fa-yc-square[data-v-491347ae]:before,\n.fa-hacker-news[data-v-491347ae]:before {\n  content: \"\\f1d4\";\n}\n.fa-tencent-weibo[data-v-491347ae]:before {\n  content: \"\\f1d5\";\n}\n.fa-qq[data-v-491347ae]:before {\n  content: \"\\f1d6\";\n}\n.fa-wechat[data-v-491347ae]:before,\n.fa-weixin[data-v-491347ae]:before {\n  content: \"\\f1d7\";\n}\n.fa-send[data-v-491347ae]:before,\n.fa-paper-plane[data-v-491347ae]:before {\n  content: \"\\f1d8\";\n}\n.fa-send-o[data-v-491347ae]:before,\n.fa-paper-plane-o[data-v-491347ae]:before {\n  content: \"\\f1d9\";\n}\n.fa-history[data-v-491347ae]:before {\n  content: \"\\f1da\";\n}\n.fa-circle-thin[data-v-491347ae]:before {\n  content: \"\\f1db\";\n}\n.fa-header[data-v-491347ae]:before {\n  content: \"\\f1dc\";\n}\n.fa-paragraph[data-v-491347ae]:before {\n  content: \"\\f1dd\";\n}\n.fa-sliders[data-v-491347ae]:before {\n  content: \"\\f1de\";\n}\n.fa-share-alt[data-v-491347ae]:before {\n  content: \"\\f1e0\";\n}\n.fa-share-alt-square[data-v-491347ae]:before {\n  content: \"\\f1e1\";\n}\n.fa-bomb[data-v-491347ae]:before {\n  content: \"\\f1e2\";\n}\n.fa-soccer-ball-o[data-v-491347ae]:before,\n.fa-futbol-o[data-v-491347ae]:before {\n  content: \"\\f1e3\";\n}\n.fa-tty[data-v-491347ae]:before {\n  content: \"\\f1e4\";\n}\n.fa-binoculars[data-v-491347ae]:before {\n  content: \"\\f1e5\";\n}\n.fa-plug[data-v-491347ae]:before {\n  content: \"\\f1e6\";\n}\n.fa-slideshare[data-v-491347ae]:before {\n  content: \"\\f1e7\";\n}\n.fa-twitch[data-v-491347ae]:before {\n  content: \"\\f1e8\";\n}\n.fa-yelp[data-v-491347ae]:before {\n  content: \"\\f1e9\";\n}\n.fa-newspaper-o[data-v-491347ae]:before {\n  content: \"\\f1ea\";\n}\n.fa-wifi[data-v-491347ae]:before {\n  content: \"\\f1eb\";\n}\n.fa-calculator[data-v-491347ae]:before {\n  content: \"\\f1ec\";\n}\n.fa-paypal[data-v-491347ae]:before {\n  content: \"\\f1ed\";\n}\n.fa-google-wallet[data-v-491347ae]:before {\n  content: \"\\f1ee\";\n}\n.fa-cc-visa[data-v-491347ae]:before {\n  content: \"\\f1f0\";\n}\n.fa-cc-mastercard[data-v-491347ae]:before {\n  content: \"\\f1f1\";\n}\n.fa-cc-discover[data-v-491347ae]:before {\n  content: \"\\f1f2\";\n}\n.fa-cc-amex[data-v-491347ae]:before {\n  content: \"\\f1f3\";\n}\n.fa-cc-paypal[data-v-491347ae]:before {\n  content: \"\\f1f4\";\n}\n.fa-cc-stripe[data-v-491347ae]:before {\n  content: \"\\f1f5\";\n}\n.fa-bell-slash[data-v-491347ae]:before {\n  content: \"\\f1f6\";\n}\n.fa-bell-slash-o[data-v-491347ae]:before {\n  content: \"\\f1f7\";\n}\n.fa-trash[data-v-491347ae]:before {\n  content: \"\\f1f8\";\n}\n.fa-copyright[data-v-491347ae]:before {\n  content: \"\\f1f9\";\n}\n.fa-at[data-v-491347ae]:before {\n  content: \"\\f1fa\";\n}\n.fa-eyedropper[data-v-491347ae]:before {\n  content: \"\\f1fb\";\n}\n.fa-paint-brush[data-v-491347ae]:before {\n  content: \"\\f1fc\";\n}\n.fa-birthday-cake[data-v-491347ae]:before {\n  content: \"\\f1fd\";\n}\n.fa-area-chart[data-v-491347ae]:before {\n  content: \"\\f1fe\";\n}\n.fa-pie-chart[data-v-491347ae]:before {\n  content: \"\\f200\";\n}\n.fa-line-chart[data-v-491347ae]:before {\n  content: \"\\f201\";\n}\n.fa-lastfm[data-v-491347ae]:before {\n  content: \"\\f202\";\n}\n.fa-lastfm-square[data-v-491347ae]:before {\n  content: \"\\f203\";\n}\n.fa-toggle-off[data-v-491347ae]:before {\n  content: \"\\f204\";\n}\n.fa-toggle-on[data-v-491347ae]:before {\n  content: \"\\f205\";\n}\n.fa-bicycle[data-v-491347ae]:before {\n  content: \"\\f206\";\n}\n.fa-bus[data-v-491347ae]:before {\n  content: \"\\f207\";\n}\n.fa-ioxhost[data-v-491347ae]:before {\n  content: \"\\f208\";\n}\n.fa-angellist[data-v-491347ae]:before {\n  content: \"\\f209\";\n}\n.fa-cc[data-v-491347ae]:before {\n  content: \"\\f20a\";\n}\n.fa-shekel[data-v-491347ae]:before,\n.fa-sheqel[data-v-491347ae]:before,\n.fa-ils[data-v-491347ae]:before {\n  content: \"\\f20b\";\n}\n.fa-meanpath[data-v-491347ae]:before {\n  content: \"\\f20c\";\n}\n.fa-buysellads[data-v-491347ae]:before {\n  content: \"\\f20d\";\n}\n.fa-connectdevelop[data-v-491347ae]:before {\n  content: \"\\f20e\";\n}\n.fa-dashcube[data-v-491347ae]:before {\n  content: \"\\f210\";\n}\n.fa-forumbee[data-v-491347ae]:before {\n  content: \"\\f211\";\n}\n.fa-leanpub[data-v-491347ae]:before {\n  content: \"\\f212\";\n}\n.fa-sellsy[data-v-491347ae]:before {\n  content: \"\\f213\";\n}\n.fa-shirtsinbulk[data-v-491347ae]:before {\n  content: \"\\f214\";\n}\n.fa-simplybuilt[data-v-491347ae]:before {\n  content: \"\\f215\";\n}\n.fa-skyatlas[data-v-491347ae]:before {\n  content: \"\\f216\";\n}\n.fa-cart-plus[data-v-491347ae]:before {\n  content: \"\\f217\";\n}\n.fa-cart-arrow-down[data-v-491347ae]:before {\n  content: \"\\f218\";\n}\n.fa-diamond[data-v-491347ae]:before {\n  content: \"\\f219\";\n}\n.fa-ship[data-v-491347ae]:before {\n  content: \"\\f21a\";\n}\n.fa-user-secret[data-v-491347ae]:before {\n  content: \"\\f21b\";\n}\n.fa-motorcycle[data-v-491347ae]:before {\n  content: \"\\f21c\";\n}\n.fa-street-view[data-v-491347ae]:before {\n  content: \"\\f21d\";\n}\n.fa-heartbeat[data-v-491347ae]:before {\n  content: \"\\f21e\";\n}\n.fa-venus[data-v-491347ae]:before {\n  content: \"\\f221\";\n}\n.fa-mars[data-v-491347ae]:before {\n  content: \"\\f222\";\n}\n.fa-mercury[data-v-491347ae]:before {\n  content: \"\\f223\";\n}\n.fa-intersex[data-v-491347ae]:before,\n.fa-transgender[data-v-491347ae]:before {\n  content: \"\\f224\";\n}\n.fa-transgender-alt[data-v-491347ae]:before {\n  content: \"\\f225\";\n}\n.fa-venus-double[data-v-491347ae]:before {\n  content: \"\\f226\";\n}\n.fa-mars-double[data-v-491347ae]:before {\n  content: \"\\f227\";\n}\n.fa-venus-mars[data-v-491347ae]:before {\n  content: \"\\f228\";\n}\n.fa-mars-stroke[data-v-491347ae]:before {\n  content: \"\\f229\";\n}\n.fa-mars-stroke-v[data-v-491347ae]:before {\n  content: \"\\f22a\";\n}\n.fa-mars-stroke-h[data-v-491347ae]:before {\n  content: \"\\f22b\";\n}\n.fa-neuter[data-v-491347ae]:before {\n  content: \"\\f22c\";\n}\n.fa-genderless[data-v-491347ae]:before {\n  content: \"\\f22d\";\n}\n.fa-facebook-official[data-v-491347ae]:before {\n  content: \"\\f230\";\n}\n.fa-pinterest-p[data-v-491347ae]:before {\n  content: \"\\f231\";\n}\n.fa-whatsapp[data-v-491347ae]:before {\n  content: \"\\f232\";\n}\n.fa-server[data-v-491347ae]:before {\n  content: \"\\f233\";\n}\n.fa-user-plus[data-v-491347ae]:before {\n  content: \"\\f234\";\n}\n.fa-user-times[data-v-491347ae]:before {\n  content: \"\\f235\";\n}\n.fa-hotel[data-v-491347ae]:before,\n.fa-bed[data-v-491347ae]:before {\n  content: \"\\f236\";\n}\n.fa-viacoin[data-v-491347ae]:before {\n  content: \"\\f237\";\n}\n.fa-train[data-v-491347ae]:before {\n  content: \"\\f238\";\n}\n.fa-subway[data-v-491347ae]:before {\n  content: \"\\f239\";\n}\n.fa-medium[data-v-491347ae]:before {\n  content: \"\\f23a\";\n}\n.fa-yc[data-v-491347ae]:before,\n.fa-y-combinator[data-v-491347ae]:before {\n  content: \"\\f23b\";\n}\n.fa-optin-monster[data-v-491347ae]:before {\n  content: \"\\f23c\";\n}\n.fa-opencart[data-v-491347ae]:before {\n  content: \"\\f23d\";\n}\n.fa-expeditedssl[data-v-491347ae]:before {\n  content: \"\\f23e\";\n}\n.fa-battery-4[data-v-491347ae]:before,\n.fa-battery[data-v-491347ae]:before,\n.fa-battery-full[data-v-491347ae]:before {\n  content: \"\\f240\";\n}\n.fa-battery-3[data-v-491347ae]:before,\n.fa-battery-three-quarters[data-v-491347ae]:before {\n  content: \"\\f241\";\n}\n.fa-battery-2[data-v-491347ae]:before,\n.fa-battery-half[data-v-491347ae]:before {\n  content: \"\\f242\";\n}\n.fa-battery-1[data-v-491347ae]:before,\n.fa-battery-quarter[data-v-491347ae]:before {\n  content: \"\\f243\";\n}\n.fa-battery-0[data-v-491347ae]:before,\n.fa-battery-empty[data-v-491347ae]:before {\n  content: \"\\f244\";\n}\n.fa-mouse-pointer[data-v-491347ae]:before {\n  content: \"\\f245\";\n}\n.fa-i-cursor[data-v-491347ae]:before {\n  content: \"\\f246\";\n}\n.fa-object-group[data-v-491347ae]:before {\n  content: \"\\f247\";\n}\n.fa-object-ungroup[data-v-491347ae]:before {\n  content: \"\\f248\";\n}\n.fa-sticky-note[data-v-491347ae]:before {\n  content: \"\\f249\";\n}\n.fa-sticky-note-o[data-v-491347ae]:before {\n  content: \"\\f24a\";\n}\n.fa-cc-jcb[data-v-491347ae]:before {\n  content: \"\\f24b\";\n}\n.fa-cc-diners-club[data-v-491347ae]:before {\n  content: \"\\f24c\";\n}\n.fa-clone[data-v-491347ae]:before {\n  content: \"\\f24d\";\n}\n.fa-balance-scale[data-v-491347ae]:before {\n  content: \"\\f24e\";\n}\n.fa-hourglass-o[data-v-491347ae]:before {\n  content: \"\\f250\";\n}\n.fa-hourglass-1[data-v-491347ae]:before,\n.fa-hourglass-start[data-v-491347ae]:before {\n  content: \"\\f251\";\n}\n.fa-hourglass-2[data-v-491347ae]:before,\n.fa-hourglass-half[data-v-491347ae]:before {\n  content: \"\\f252\";\n}\n.fa-hourglass-3[data-v-491347ae]:before,\n.fa-hourglass-end[data-v-491347ae]:before {\n  content: \"\\f253\";\n}\n.fa-hourglass[data-v-491347ae]:before {\n  content: \"\\f254\";\n}\n.fa-hand-grab-o[data-v-491347ae]:before,\n.fa-hand-rock-o[data-v-491347ae]:before {\n  content: \"\\f255\";\n}\n.fa-hand-stop-o[data-v-491347ae]:before,\n.fa-hand-paper-o[data-v-491347ae]:before {\n  content: \"\\f256\";\n}\n.fa-hand-scissors-o[data-v-491347ae]:before {\n  content: \"\\f257\";\n}\n.fa-hand-lizard-o[data-v-491347ae]:before {\n  content: \"\\f258\";\n}\n.fa-hand-spock-o[data-v-491347ae]:before {\n  content: \"\\f259\";\n}\n.fa-hand-pointer-o[data-v-491347ae]:before {\n  content: \"\\f25a\";\n}\n.fa-hand-peace-o[data-v-491347ae]:before {\n  content: \"\\f25b\";\n}\n.fa-trademark[data-v-491347ae]:before {\n  content: \"\\f25c\";\n}\n.fa-registered[data-v-491347ae]:before {\n  content: \"\\f25d\";\n}\n.fa-creative-commons[data-v-491347ae]:before {\n  content: \"\\f25e\";\n}\n.fa-gg[data-v-491347ae]:before {\n  content: \"\\f260\";\n}\n.fa-gg-circle[data-v-491347ae]:before {\n  content: \"\\f261\";\n}\n.fa-tripadvisor[data-v-491347ae]:before {\n  content: \"\\f262\";\n}\n.fa-odnoklassniki[data-v-491347ae]:before {\n  content: \"\\f263\";\n}\n.fa-odnoklassniki-square[data-v-491347ae]:before {\n  content: \"\\f264\";\n}\n.fa-get-pocket[data-v-491347ae]:before {\n  content: \"\\f265\";\n}\n.fa-wikipedia-w[data-v-491347ae]:before {\n  content: \"\\f266\";\n}\n.fa-safari[data-v-491347ae]:before {\n  content: \"\\f267\";\n}\n.fa-chrome[data-v-491347ae]:before {\n  content: \"\\f268\";\n}\n.fa-firefox[data-v-491347ae]:before {\n  content: \"\\f269\";\n}\n.fa-opera[data-v-491347ae]:before {\n  content: \"\\f26a\";\n}\n.fa-internet-explorer[data-v-491347ae]:before {\n  content: \"\\f26b\";\n}\n.fa-tv[data-v-491347ae]:before,\n.fa-television[data-v-491347ae]:before {\n  content: \"\\f26c\";\n}\n.fa-contao[data-v-491347ae]:before {\n  content: \"\\f26d\";\n}\n.fa-500px[data-v-491347ae]:before {\n  content: \"\\f26e\";\n}\n.fa-amazon[data-v-491347ae]:before {\n  content: \"\\f270\";\n}\n.fa-calendar-plus-o[data-v-491347ae]:before {\n  content: \"\\f271\";\n}\n.fa-calendar-minus-o[data-v-491347ae]:before {\n  content: \"\\f272\";\n}\n.fa-calendar-times-o[data-v-491347ae]:before {\n  content: \"\\f273\";\n}\n.fa-calendar-check-o[data-v-491347ae]:before {\n  content: \"\\f274\";\n}\n.fa-industry[data-v-491347ae]:before {\n  content: \"\\f275\";\n}\n.fa-map-pin[data-v-491347ae]:before {\n  content: \"\\f276\";\n}\n.fa-map-signs[data-v-491347ae]:before {\n  content: \"\\f277\";\n}\n.fa-map-o[data-v-491347ae]:before {\n  content: \"\\f278\";\n}\n.fa-map[data-v-491347ae]:before {\n  content: \"\\f279\";\n}\n.fa-commenting[data-v-491347ae]:before {\n  content: \"\\f27a\";\n}\n.fa-commenting-o[data-v-491347ae]:before {\n  content: \"\\f27b\";\n}\n.fa-houzz[data-v-491347ae]:before {\n  content: \"\\f27c\";\n}\n.fa-vimeo[data-v-491347ae]:before {\n  content: \"\\f27d\";\n}\n.fa-black-tie[data-v-491347ae]:before {\n  content: \"\\f27e\";\n}\n.fa-fonticons[data-v-491347ae]:before {\n  content: \"\\f280\";\n}\n.fa-reddit-alien[data-v-491347ae]:before {\n  content: \"\\f281\";\n}\n.fa-edge[data-v-491347ae]:before {\n  content: \"\\f282\";\n}\n.fa-credit-card-alt[data-v-491347ae]:before {\n  content: \"\\f283\";\n}\n.fa-codiepie[data-v-491347ae]:before {\n  content: \"\\f284\";\n}\n.fa-modx[data-v-491347ae]:before {\n  content: \"\\f285\";\n}\n.fa-fort-awesome[data-v-491347ae]:before {\n  content: \"\\f286\";\n}\n.fa-usb[data-v-491347ae]:before {\n  content: \"\\f287\";\n}\n.fa-product-hunt[data-v-491347ae]:before {\n  content: \"\\f288\";\n}\n.fa-mixcloud[data-v-491347ae]:before {\n  content: \"\\f289\";\n}\n.fa-scribd[data-v-491347ae]:before {\n  content: \"\\f28a\";\n}\n.fa-pause-circle[data-v-491347ae]:before {\n  content: \"\\f28b\";\n}\n.fa-pause-circle-o[data-v-491347ae]:before {\n  content: \"\\f28c\";\n}\n.fa-stop-circle[data-v-491347ae]:before {\n  content: \"\\f28d\";\n}\n.fa-stop-circle-o[data-v-491347ae]:before {\n  content: \"\\f28e\";\n}\n.fa-shopping-bag[data-v-491347ae]:before {\n  content: \"\\f290\";\n}\n.fa-shopping-basket[data-v-491347ae]:before {\n  content: \"\\f291\";\n}\n.fa-hashtag[data-v-491347ae]:before {\n  content: \"\\f292\";\n}\n.fa-bluetooth[data-v-491347ae]:before {\n  content: \"\\f293\";\n}\n.fa-bluetooth-b[data-v-491347ae]:before {\n  content: \"\\f294\";\n}\n.fa-percent[data-v-491347ae]:before {\n  content: \"\\f295\";\n}\n.fa-gitlab[data-v-491347ae]:before {\n  content: \"\\f296\";\n}\n.fa-wpbeginner[data-v-491347ae]:before {\n  content: \"\\f297\";\n}\n.fa-wpforms[data-v-491347ae]:before {\n  content: \"\\f298\";\n}\n.fa-envira[data-v-491347ae]:before {\n  content: \"\\f299\";\n}\n.fa-universal-access[data-v-491347ae]:before {\n  content: \"\\f29a\";\n}\n.fa-wheelchair-alt[data-v-491347ae]:before {\n  content: \"\\f29b\";\n}\n.fa-question-circle-o[data-v-491347ae]:before {\n  content: \"\\f29c\";\n}\n.fa-blind[data-v-491347ae]:before {\n  content: \"\\f29d\";\n}\n.fa-audio-description[data-v-491347ae]:before {\n  content: \"\\f29e\";\n}\n.fa-volume-control-phone[data-v-491347ae]:before {\n  content: \"\\f2a0\";\n}\n.fa-braille[data-v-491347ae]:before {\n  content: \"\\f2a1\";\n}\n.fa-assistive-listening-systems[data-v-491347ae]:before {\n  content: \"\\f2a2\";\n}\n.fa-asl-interpreting[data-v-491347ae]:before,\n.fa-american-sign-language-interpreting[data-v-491347ae]:before {\n  content: \"\\f2a3\";\n}\n.fa-deafness[data-v-491347ae]:before,\n.fa-hard-of-hearing[data-v-491347ae]:before,\n.fa-deaf[data-v-491347ae]:before {\n  content: \"\\f2a4\";\n}\n.fa-glide[data-v-491347ae]:before {\n  content: \"\\f2a5\";\n}\n.fa-glide-g[data-v-491347ae]:before {\n  content: \"\\f2a6\";\n}\n.fa-signing[data-v-491347ae]:before,\n.fa-sign-language[data-v-491347ae]:before {\n  content: \"\\f2a7\";\n}\n.fa-low-vision[data-v-491347ae]:before {\n  content: \"\\f2a8\";\n}\n.fa-viadeo[data-v-491347ae]:before {\n  content: \"\\f2a9\";\n}\n.fa-viadeo-square[data-v-491347ae]:before {\n  content: \"\\f2aa\";\n}\n.fa-snapchat[data-v-491347ae]:before {\n  content: \"\\f2ab\";\n}\n.fa-snapchat-ghost[data-v-491347ae]:before {\n  content: \"\\f2ac\";\n}\n.fa-snapchat-square[data-v-491347ae]:before {\n  content: \"\\f2ad\";\n}\n.fa-pied-piper[data-v-491347ae]:before {\n  content: \"\\f2ae\";\n}\n.fa-first-order[data-v-491347ae]:before {\n  content: \"\\f2b0\";\n}\n.fa-yoast[data-v-491347ae]:before {\n  content: \"\\f2b1\";\n}\n.fa-themeisle[data-v-491347ae]:before {\n  content: \"\\f2b2\";\n}\n.fa-google-plus-circle[data-v-491347ae]:before,\n.fa-google-plus-official[data-v-491347ae]:before {\n  content: \"\\f2b3\";\n}\n.fa-fa[data-v-491347ae]:before,\n.fa-font-awesome[data-v-491347ae]:before {\n  content: \"\\f2b4\";\n}\n.fa-handshake-o[data-v-491347ae]:before {\n  content: \"\\f2b5\";\n}\n.fa-envelope-open[data-v-491347ae]:before {\n  content: \"\\f2b6\";\n}\n.fa-envelope-open-o[data-v-491347ae]:before {\n  content: \"\\f2b7\";\n}\n.fa-linode[data-v-491347ae]:before {\n  content: \"\\f2b8\";\n}\n.fa-address-book[data-v-491347ae]:before {\n  content: \"\\f2b9\";\n}\n.fa-address-book-o[data-v-491347ae]:before {\n  content: \"\\f2ba\";\n}\n.fa-vcard[data-v-491347ae]:before,\n.fa-address-card[data-v-491347ae]:before {\n  content: \"\\f2bb\";\n}\n.fa-vcard-o[data-v-491347ae]:before,\n.fa-address-card-o[data-v-491347ae]:before {\n  content: \"\\f2bc\";\n}\n.fa-user-circle[data-v-491347ae]:before {\n  content: \"\\f2bd\";\n}\n.fa-user-circle-o[data-v-491347ae]:before {\n  content: \"\\f2be\";\n}\n.fa-user-o[data-v-491347ae]:before {\n  content: \"\\f2c0\";\n}\n.fa-id-badge[data-v-491347ae]:before {\n  content: \"\\f2c1\";\n}\n.fa-drivers-license[data-v-491347ae]:before,\n.fa-id-card[data-v-491347ae]:before {\n  content: \"\\f2c2\";\n}\n.fa-drivers-license-o[data-v-491347ae]:before,\n.fa-id-card-o[data-v-491347ae]:before {\n  content: \"\\f2c3\";\n}\n.fa-quora[data-v-491347ae]:before {\n  content: \"\\f2c4\";\n}\n.fa-free-code-camp[data-v-491347ae]:before {\n  content: \"\\f2c5\";\n}\n.fa-telegram[data-v-491347ae]:before {\n  content: \"\\f2c6\";\n}\n.fa-thermometer-4[data-v-491347ae]:before,\n.fa-thermometer[data-v-491347ae]:before,\n.fa-thermometer-full[data-v-491347ae]:before {\n  content: \"\\f2c7\";\n}\n.fa-thermometer-3[data-v-491347ae]:before,\n.fa-thermometer-three-quarters[data-v-491347ae]:before {\n  content: \"\\f2c8\";\n}\n.fa-thermometer-2[data-v-491347ae]:before,\n.fa-thermometer-half[data-v-491347ae]:before {\n  content: \"\\f2c9\";\n}\n.fa-thermometer-1[data-v-491347ae]:before,\n.fa-thermometer-quarter[data-v-491347ae]:before {\n  content: \"\\f2ca\";\n}\n.fa-thermometer-0[data-v-491347ae]:before,\n.fa-thermometer-empty[data-v-491347ae]:before {\n  content: \"\\f2cb\";\n}\n.fa-shower[data-v-491347ae]:before {\n  content: \"\\f2cc\";\n}\n.fa-bathtub[data-v-491347ae]:before,\n.fa-s15[data-v-491347ae]:before,\n.fa-bath[data-v-491347ae]:before {\n  content: \"\\f2cd\";\n}\n.fa-podcast[data-v-491347ae]:before {\n  content: \"\\f2ce\";\n}\n.fa-window-maximize[data-v-491347ae]:before {\n  content: \"\\f2d0\";\n}\n.fa-window-minimize[data-v-491347ae]:before {\n  content: \"\\f2d1\";\n}\n.fa-window-restore[data-v-491347ae]:before {\n  content: \"\\f2d2\";\n}\n.fa-times-rectangle[data-v-491347ae]:before,\n.fa-window-close[data-v-491347ae]:before {\n  content: \"\\f2d3\";\n}\n.fa-times-rectangle-o[data-v-491347ae]:before,\n.fa-window-close-o[data-v-491347ae]:before {\n  content: \"\\f2d4\";\n}\n.fa-bandcamp[data-v-491347ae]:before {\n  content: \"\\f2d5\";\n}\n.fa-grav[data-v-491347ae]:before {\n  content: \"\\f2d6\";\n}\n.fa-etsy[data-v-491347ae]:before {\n  content: \"\\f2d7\";\n}\n.fa-imdb[data-v-491347ae]:before {\n  content: \"\\f2d8\";\n}\n.fa-ravelry[data-v-491347ae]:before {\n  content: \"\\f2d9\";\n}\n.fa-eercast[data-v-491347ae]:before {\n  content: \"\\f2da\";\n}\n.fa-microchip[data-v-491347ae]:before {\n  content: \"\\f2db\";\n}\n.fa-snowflake-o[data-v-491347ae]:before {\n  content: \"\\f2dc\";\n}\n.fa-superpowers[data-v-491347ae]:before {\n  content: \"\\f2dd\";\n}\n.fa-wpexplorer[data-v-491347ae]:before {\n  content: \"\\f2de\";\n}\n.fa-meetup[data-v-491347ae]:before {\n  content: \"\\f2e0\";\n}\n.sr-only[data-v-491347ae] {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  border: 0;\n}\n.sr-only-focusable[data-v-491347ae]:active,\n.sr-only-focusable[data-v-491347ae]:focus {\n  position: static;\n  width: auto;\n  height: auto;\n  margin: 0;\n  overflow: visible;\n  clip: auto;\n}\n.page-container[data-v-491347ae] {\n  padding-top: 60px;\n}\n.page-container .content[data-v-491347ae] {\n  border-bottom: 1px solid grey;\n  margin: 0;\n  cursor: pointer;\n  position: relative;\n  overflow: hidden;\n}\n.page-container .content.open .content-header[data-v-491347ae]:after {\n  content: \"\\f068\";\n}\n.page-container .content-header[data-v-491347ae] {\n  margin: 0;\n  font-size: 30px;\n  padding: 10px;\n}\n.page-container .content-header[data-v-491347ae]:after {\n  content: \"\\f067\";\n  font-family: FontAwesome;\n  position: absolute;\n  right: 5px;\n  top: 10px;\n  font-size: 30px;\n}\n.page-container .content-toggle[data-v-491347ae] {\n  display: none;\n  margin: 0;\n  padding: 10px;\n}\n.page-container .content-toggle img[data-v-491347ae] {\n  width: 60px;\n  display: inline-block;\n}\n.page-container .content-toggle p[data-v-491347ae] {\n  margin: 0;\n}")
;(function(){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _PageWorksSkills = require("../components/PageWorksSkills.vue");

var _PageWorksSkills2 = _interopRequireDefault(_PageWorksSkills);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {

  methods: {
    toggle: function toggle(e) {
      $(e.currentTarget).siblings().removeClass("open").find(".content-toggle").slideUp();
      if ($(e.currentTarget).hasClass("open")) {
        $(e.currentTarget).removeClass("open").find(".content-toggle").slideUp();
        $(e.currentTarget).find("ul").removeClass("open");
      } else {
        $(e.currentTarget).addClass("open").find(".content-toggle").slideDown();
        $(e.currentTarget).find("ul").addClass("open");
      }
    }
  },
  components: {
    PageWorksSkills: _PageWorksSkills2.default
  },

  data: function data() {
    return {
      content: [{
        title: "Landing Page Tim",
        date: "16/02/2016",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
        img: true,
        imgLink: '/project.io/static/img/logo.svg',
        skills: [{
          type: "css",
          value: "one"
        }, {
          type: "css",
          value: "two"
        }, {
          type: "css",
          value: "one"
        }, {
          type: "css",
          value: "five"
        }]
      }, {
        title: "due",
        date: "16/02/2016",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
        img: false,
        skills: [{
          type: "css",
          value: "one"
        }, {
          type: "css",
          value: "two"
        }, {
          type: "css",
          value: "one"
        }, {
          type: "css",
          value: "five"
        }]
      }, {
        title: "tre",
        date: "16/02/2016",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
        img: false,
        skills: [{
          type: "css",
          value: "one"
        }, {
          type: "css",
          value: "two"
        }, {
          type: "css",
          value: "one"
        }, {
          type: "css",
          value: "five"
        }]
      }, {
        title: "quattro",
        date: "16/02/2016",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare pulvinar elit. E",
        img: false,
        skills: [{
          type: "css",
          value: "one"
        }, {
          type: "css",
          value: "two"
        }, {
          type: "css",
          value: "one"
        }, {
          type: "css",
          value: "five"
        }]
      }, {
        title: "cique",
        date: "16/02/2016",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent enim ante, dignissim a fermentum ac, interdum sit amet odio. Vivamus a augue ac diam consectetur faucibus. Sed interdum vulputate urna, at pharetra nulla porttitor at. Vestibulum id euismod enim. Curabitur nulla felis, malesuada ut lorem quis, ornare,pulvinar elit. E",
        img: false,
        skills: [{
          type: "css",
          value: "five"
        }, {
          type: "css",
          value: "two"
        }, {
          type: "css",
          value: "one"
        }, {
          type: "css",
          value: "five"
        }]
      }]
    };
  }
};
})()
if (module.exports.__esModule) module.exports = module.exports.default
var __vue__options__ = (typeof module.exports === "function"? module.exports.options: module.exports)
if (__vue__options__.functional) {console.error("[vueify] functional components are not supported and should be defined in plain js files using render functions.")}
__vue__options__.render = function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._c;return _c('div',{staticClass:"container page-container"},_vm._l((_vm.content),function(item){return _c('div',{staticClass:"content",on:{"click":function($event){_vm.toggle($event)}}},[_c('div',{staticClass:"content-header"},[_vm._v(_vm._s(item.title))]),_vm._v(" "),_c('div',{staticClass:"content-toggle"},[(item.img)?_c('img',{attrs:{"src":item.imgLink}}):_vm._e(),_vm._v(" "),_c('strong',[_vm._v(_vm._s(item.date))]),_vm._v(" "),_c('p',[_vm._v(_vm._s(item.description))]),_vm._v(" "),_c('PageWorksSkills',{attrs:{"skills":item.skills}})],1)])}))}
__vue__options__.staticRenderFns = []
__vue__options__._scopeId = "data-v-491347ae"
if (module.hot) {(function () {  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), true)
  if (!hotAPI.compatible) return
  module.hot.accept()
  module.hot.dispose(__vueify_style_dispose__)
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-491347ae", __vue__options__)
  } else {
    hotAPI.reload("data-v-491347ae", __vue__options__)
  }
})()}

},{"../components/PageWorksSkills.vue":6,"vue":3,"vue-hot-reload-api":2,"vueify/lib/insert-css":4}],10:[function(require,module,exports){
'use strict';

var Vue = require('vue');
var Header = require('./containers/Header.vue');

new Vue({
	el: 'header',
	render: function render(createElement) {
		return createElement(Header);
	}
});

if (document.getElementById("page-works")) {
	var PageWorks = require('./containers/PageWorks.vue');
	new Vue({
		el: '#page-works',
		render: function render(createElement) {
			return createElement(PageWorks);
		}
	});
}

if (document.getElementById("page-index")) {
	var PageIndex = require('./containers/PageIndex.vue');
	new Vue({
		el: '#page-index',
		render: function render(createElement) {
			return createElement(PageIndex);
		}
	});
}

},{"./containers/Header.vue":7,"./containers/PageIndex.vue":8,"./containers/PageWorks.vue":9,"vue":3}]},{},[5])