/*!
 * tooly - version 0.0.5 (built: 2014-11-07)
 * js utility functions
 *
 * https://github.com/Lokua/tooly.git
 *
 * Copyright (c) 2014 Joshua Kleckner
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/MIT
 */

;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('tooly', [], function() {
      return (root.returnExportsGlobal = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['tooly'] = factory();
  }
}(this, function() {




var _format_re, // assigned only on first use
    _ws_re = /\s+/,
    _type_re = /\s([a-z]+)/i,
    _arrayProto = Array.prototype,
    _slice = _arrayProto.slice;

/*!
 * @see  tooly#type
 */
function _type(o, klass) {
  o = ({}).toString.call(o).match(_type_re)[1].toLowerCase();
  return klass ? o === klass.toLowerCase() : o;
}

/*!
 * @see  tooly#each
 */
function _each(obj, fn, context) {
  if (obj.forEach && obj.forEach === _arrayProto.forEach) {
    obj.forEach(fn, context);
  } else {
    var keys = Object.keys(obj), i = 0, len = keys.length;
    for (; i < len; i++) fn.call(context, obj[keys[i]], keys[i], obj);
  }
  return obj;
}

function _toArray(obj) {
  return [].map.call(obj, function(el) { return el; });
}

/*!
 * @see  tooly#basicExtend
 */
function _extend(dest, src) {
  for (var p in src) {
    if (src.hasOwnProperty(p)) {
      dest[p] = src[p];
    }
  }
  return dest;
}

// modified from http://stackoverflow.com/a/9229821/2416000
// TODO: this modifies original arr, find unaltering way
function _sortUnique(arr) {
  return arr.sort().filter(function(item, pos) {
    return !pos || item != arr[pos-1];
  });
}




/**
 * @namespace  tooly
 * @type {Object}
 */
var tooly = { version: '0.0.5' };





/**
 * Port of underscore's each. Falls back to native forEach for Arrays when available.
 * The `iterator` argument takes the following signature for Arrays:
 * `iterator(value, index, array)` where the array is the same collection passed
 * as the `obj` argument. For objects the signature is:
 * `iterator(value, key, object)`.
 * @example
 * ```js
 * var obj = {'1': 1, '2': 2, '3': 3, '4': 4};
 * each(obj, function(v, k, o) { o[k] = v*100; });
 * obj; //=> {'1': 100, '2': 200, '3': 300, '4': 400};
 * 
 * var arr = [1, 2, 3, 4];
 * each(arr, function(v, i, a) { a[i] = v*100; });
 * arr; //=> [100, 200, 300, 400];
 * ```
 * @param  {Object|Array} obj      the collection to iterate over
 * @param  {Function} iterator the function called on each element in `obj` 
 * @param  {Object} context  the context, used as `this` in the callback
 * @return {Object|Array}          `obj`
 *
 * @memberOf  tooly
 * @category  Collections
 * @static 
 */
tooly.each = function(obj, iterator, context) {
  return _each(obj, iterator, context);
};




var _sort_re, _sort_dig_re;

/**
 * Alpha-numeric sort arrayof objects by key. 
 * Numbers preceed letters regardless of being instances of  `Number` or `String`.
 * Note that this method does modify the original array.
 *
 * ### Example
 * ```js
 * var data = [
 *   {name: 'a'},{name: 2},{name: 1},
 *   {name: 'b'},{name: 'c'},{name: 'z'}
 * ];
 * var ascending = tooly.sort(data, 'name');
 * //=> [{name: 1},{name: 2},{name: 'a'},{name: 'b'},{name: 'c'},{name: 'z'}]
 * 
 * // pass descending flag third arg
 * var descending = tooly.sort(data, 'name', true);
 * //=> [{name: 'z'},{name: 'c'},{name: 'b'},{name: 'a'},{name: 2},{name: 1}]  
 * ```
 * 
 * @param  {Array} arr the array to sort
 * @param  {String} key the key to sort by
 * @param  {boolean} dsc sorts descending order if true
 * @return {Array}     the original `arr` sorted.
 * 
 * @see http://stackoverflow.com/questions/4373018/sort-array-of-numeric-alphabetical-elements-natural-sort
 * @memberOf tooly
 * @category  Collections
 * @static
 */
tooly.sort = function(arr, key, dsc) {
  var a, b, a1, b1, t;
  if (!_sort_re) {
    _sort_re = /(\d+)|(\D+)/g; 
    _sort_dig_re = /\d+/;
  }
  return arr.sort(function(as, bs) {
    a = String(as[key]).toLowerCase().match(_sort_re);
    b = String(bs[key]).toLowerCase().match(_sort_re);
    if (dsc) { // swap
      t = a; a = b; b = t;
    }
    while (a.length && b.length) {
      a1 = a.shift();
      b1 = b.shift();
      if (_sort_dig_re.test(a1) || _sort_dig_re.test(b1)) {
        if (!_sort_dig_re.test(a1)) return 1;
        if (!_sort_dig_re.test(b1)) return -1;
        if (a1 != b1) return a1-b1;
      } else if (a1 != b1) {
        return a1 > b1? 1: -1;
      }
    }
    return a.length - b.length;
  });
};



function _node(el) {
  return  el && (el.nodeType === 1 || el.nodeType === 9);
}

function _select(selector, context) {
  var parent;
  if (context && _type(context, 'string')) {
    parent = document.querySelector(context);
  }
  return (parent ? parent : document).querySelector(selector);
}

function _selectAll(selector, context) {
  var parent = null;
  if (context) {
    if (_type(context, 'string')) {
      parent = _select(context);
    } else if (_type(context, 'nodelist')) {
      parent = _select(context[0]);
    } else if (_node(context)) {
      parent = context;
    }
  }
  return _toArray( (parent ? parent : document).querySelectorAll(selector) );
}

// save compiled class regexps
var _classes_re_cache = {};

function _classReg(str) {
  if (!_classes_re_cache[str]) {
    _classes_re_cache[str] = new RegExp('\\s*' + str + '\\s*(![\\w\\W])?', 'g');
  }
  return _classes_re_cache[str];
}

// impl for both #append and #prepend
function _pend(append, els, content) {
  if (!_type(content, 'string')) {
    var type = _type(content);
    var html = (_node(content))
      ? content.outerHTML
      : (content instanceof tooly.Frankie)
        ? content.els
        : (type === 'array')
          ? content
          : (type === 'nodelist')
            ? _toArray(content)
            : null;
    if (_type(html, 'array')) {
      html = html.map(function(x) { return x.outerHTML; }).join('');
    } else if (!html) {
      return;
    }
  } else {
    html = content;
  }
  els.forEach(function(el) {
    // http://jsperf.com/insertadjacenthtml-perf/14
    el.insertAdjacentHTML(append ? 'beforeend' : 'afterbegin', html);
  });
}



/**
 * The Frankie class - named after the late, great DJ Frankie Knuckles (one of the greatest)
 * _selectors_ of all time ;). A micro DOM util with a jQuery-like API.
 * Keeps an internal reference to a selectAll query on the passed
 * `el`. Most methods will return the instance for chainability.
 *
 * @example
 * ```js
 * // alias the Frankie namespace
 * var $ = Frankie.bind(this);
 * var $divs = $(divs);
 * $divs.css({color:'green'});
 * // multiple yet separate selectors must be comma separated
 * $('div, p')
 *   .addClass('purple')
 *   .addClass('yellow')
 *   .removeClass('g')
 *   .css({'border-radius':'4px'})
 *   .prepend('<h1>---</h1>')
 *   .append('<h1>+++</h1>')
 *   .html('H T M L');
 * ```
 *
 * @param {String|HTMLElement} el  valid css selector string, can contain multiple
 *        selectors separated my commas (see the example)
 * @param {Mixed} context  a parent context to search for the supplied `el` argument.
 * can be any of the following:
 * + `HTMLElement`
 * + `String`
 * + `Array<HTMLElement>`
 * + `NodeList`
 * + `Frankie` instance
 * @class tooly.Frankie
 * @constructor
 * @category  Frankie
 * @memberOf  tooly
 * @static
 */
tooly.Frankie = function(el, context) {
  if (!(this instanceof tooly.Frankie)) {
    return new tooly.Frankie(el, context);
  }
  this.els = _node(el) ? [el] : _selectAll(el, context);
  return this;
};



/**
 * add a css class to element
 * 
 * @param {String|Array<String>} klass the css class(es) to add
 * @return {tooly.Frankie} `this`
 *
 * @memberOf  tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.addClass = function(klass) {
  this.els.forEach(function(x) { 
    if (!x.className) {
      x.className += ' ' + klass;
      return;
    }
    var names = x.className;
    x.className += ' ' + klass.split(_ws_re).filter(function(n) {
      return names.indexOf(n) === -1;
    }).join(' ');
  });
  return this;
};



/**
 * append `content` to all elements in the set of matched elements.
 * 
 * @param  {mixed}  content  the content to append
 * @return {tooly.Frankie} `this`
 *
 * @memberOf  tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.append = function(content) {
  _pend(true, this.els, content);
  return this;
};



/**
 * get or set a(n) html attribute(s)
 * 
 * @param  {Object|String} attr  the attribute to get/set
 * @param  {String|Number} the value of the attribute `attr` (only if `attr` is a name string)
 * @return {Object} Frankie or the attribute value if only a single string is passed
 *                          for the first argument
 *
 * @memberOf  tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.attr = function(/*mixed*/) {
  var argsLen = arguments.length,
      attr = arguments[0];
  if (argsLen === 1) {
    if (_type(attr, 'object')) {
      // SET (hash)
      _each(attr, function(val, key) {
        this.els.forEach(function(x) { x.setAttribute(key, val); });
      });
    } else {
      // GET
      return this.els[0].getAttribute(attr);
    }
  } else { // SET (single comma sep key-val pair)
    var value = arguments[1];
    this.els.forEach(function(x) { x.setAttribute(attr, value); });
  }
  return this;
};



/**
 * Create a new Frankie instance from all first-generation child elements of 
 * the current set of matched elements;
 *
 * TODO: try with Element.childNodes instead of children so we don't have 
 * to do the array conversion
 * __OR__ probably better to simple instantiate new Frankie
 * TODO: add filter
 *     
 * @return {tooly.Frankie} new Frankie instance
 * 
 * @memberOf  tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.children = function() {
  var frank = new tooly.Frankie();
  this.els.forEach(function(x) { 
    var c = x.children;
    if (_node(c)) {
      frank.els.push(c);
    } else if (_type(c) === 'htmlcollection') {
      [].push.apply(frank.els, [].slice.call(c).map(function(v) { return v; }));
    }
  });
  return frank;
};



/**
 * @example
 * ```js
 * // as key val pair (key must also be a string)
 * var el = tooly.select('#main');
 * $('div').css('background', 'red');
 * 
 * // or as hash (notice that hyphenated keys must be quoted)<br>
 * $('div').css({ width: '100px', background: 'red', 'font-size': '24px' });
 *
 * // also can take valid css selector string in place of element
 * // below will match the document's first div
 * $('div').css('border', '2px solid red');
 * ```
 * 
 * @param  {String|Object}  styles  either a single comma separated key value pair of strings, or object hash
 * @return {tooly.Frankie} `this`
 * 
 * @memberOf  tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.css = function() {
  var styles = {}, argsLen = arguments.length;
  if (argsLen === 2) {
    // SET via single comma sep key-value pair
    styles[arguments[0]] = arguments[1];
  } else {
    var el = this.els[0];
    if (argsLen === 1) {
      _0 = arguments[0];
      // GET by key
      if (_type(_0, 'string')) {
        return el.style[_0] || undefined;
      }
      // SET via hash
      styles = _0;
    } else {
      // GET all
      return el.style || undefined;
    }
  }
  // set
  this.els.forEach(function(x) { 
    _each(styles, function(s, k) { x.style[k] = s; });
  });
  return this;
};



/**
 * remove all child nodes from the set of matched elements.
 * __TODO__: remove listeners?
 * 
 * @return {tooly.Frankie} `this`
 *
 * @memberOf  tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.empty = function() {
  this.els.forEach(function(x) {
    // see http://jsperf.com/innerhtml-vs-removechild/15
    while (x.lastChild) x.removeChild(x.lastChild);
  });
  return this;
};



/**
 * Create a new instance of Frankie with only the element
 * specified by index
 *
 * @param {Number} index the index of the element
 * @return {tooly.Frankie} new Frankie instance
 * 
 * @memberOf tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.eq = function(i) {
  var frank = new tooly.Frankie();
  frank.els = [this.els[i]];
  return frank;
};



/**
 * @param  {Mixed} selector  same as #Frankie constructor
 * @return {Frankie}          new Frankie instance
 */
tooly.Frankie.prototype.find = function(selector) {
  return new tooly.Frankie(selector, this.els);
};


/**
 * Get the element at index `i` from Frankie's selected elements.
 * Unlike `#eq`, `get` returns the actual HTMLElement.
 * 
 * @memberOf tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.get = function(i) {
  return this.els[i];
};



/**
 * @memberOf tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.hasClass = function(klass) {
  var re = _classReg(klass);
  return this.els.some(function(x) { 
    return x.className.split(_ws_re).some(function(c) { 
      return c.match(re) == klass; 
    });
  });
};



/**
 * fill each element in the set of matched elements with `content`. 
 * Replaces existing content.
 * If called with 1 arg, the first matched element's innerHTML is returned.
 * 
 * @param  {Mixed} content
 * @return {String|Object} the first matched el's innerHTML or null when in get mode,
 *                             otherwise `this` for chaining
 * @memberOf  tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.html = function(content) {
  // get
  if (!arguments.length)  {
    if (this.els[0] === undefined) {
      return;
    }
    return this.els[0].innerHTML;
  }
  // set
  this.els.forEach(function(x) { x.innerHTML = content; });
  return this;
};



/**
 * Ultra simplified wrapper for `addEventListener`.
 * Does not currently support jQuery-style data passing
 *
 * @param {String}   event the event to listen to, like 'click'
 * @param {Function} fn    the handler to execute when event is fired 
 * @return {this}
 * 
 * @memberOf  tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.on = function(event, fn) {
  this.els.forEach(function(el) {
    el.addEventListener(event, fn, false);
  });
  return this;
};


/**
 * Create a Frankie instance from all parent elements of the set of matched elements.
 * 
 * @return {tooly.Frankie} a new Frankie instance
 *
 * @memberOf  tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.parent = function() {
  var frank = new tooly.Frankie();
  var seen = {};
  frank.els = this.els.map(function(x) { 
    return x.parentNode; 
  }).filter(function(x) {
    return seen.hasOwnProperty(x) ? false : (seen[x] = true);
  });
  return frank;
};



/**
 * prepend `content` to all elements in the set of matched elements.
 * 
 * @param  {mixed}  content  the content to prepend
 * @return {tooly.Frankie} `this`
 *
 * @memberOf  tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.prepend = function(content) {
  _pend(false, this.els, content);
  return this;
};



/**
 * // TODO
 * 
 * @param  {mixed} element        the element(s) to remove from the instance's array of elements
 *                                as well as the DOM
 * @param  {Boolean} returnRemoved If true, the elements will be returned from the function (within)
 *                                 a new Frankie instance 
 *                                 (which will keep them in memory if yo store them in a reference)
 * @return {this|Frankie}  
 * @memberOf tooly.Frankie
 * @category  Frankie
 * @instance
 * 
 */
tooly.Frankie.prototype.remove = function(element, returnRemoved) {
  var ret = [], i, frank = this, len = frank.els.length, els;
  els = _type(element, 'array') 
    ? element
    : _node(element)
      ? _toArray(element)
      : els instanceof tooly.Frankie 
        ? element.els
        : _type(element, 'string')
          ? new tooly.Frankie(element, frank).els
          : null;
  if (els) {
    els.forEach(function(c) { 
      for (i = 0; i < len; i++) {
        var p = frank.els[i];
        if (c.parentNode === p) {
          returnRemoved ? ret.push(p.removeChild(c)) : p.removeChild(c);
          return; // am i needed???
        }
      }
    });
  }
  if (returnRemoved) {
    var f = new Frankie();
    f.els = ret;
    return f;
  }
  return frank;
};



/**
 * remove a css class from an element
 * 
 * @param  {String} klass   the css class(es) to remove
 * @return {tooly.Frankie} `this` 
 *
 * @memberOf  tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.removeClass = function(klass) {
  // "or-ize" for multiple klasses match in regexp
  var classes = '(' + klass.split(_ws_re).join('|') + ')';
  this.els.forEach(function(x) {
    x.className = x.className.replace(_classReg(classes), ' ').trim();
  });
  return this;
};



/**
 * @param  {String} klass
 * @return {this}
 *
 * @memberOf  tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.toggleClass = function(klass) {
  var i = 0, len = this.els.length, el;
  for (; i < len; i++) {
    el = this.eq(i);
    if (el.hasClass(klass)) {
      el.removeClass(klass);
    } else {
      el.addClass(klass);
    }
  }
  return this;
};



/**
 * @return {String}
 * @memberOf  tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.toString = function() { 
  return JSON.stringify(this);
  // return '[object Frankie]'; 
};



/**
 * @return {Boolean} `true` if this instance's inner elements array is empty.
 * 
 * @memberOf tooly.Frankie
 * @category  Frankie
 * @instance
 */
tooly.Frankie.prototype.zilch = function() {
  return this.els.length === 0;
};



/**
 * Constructor.
 * 
 * @param {Object}  context   (optional) designates the owner of the `handlers` array that holds 
 *                            all callbacks. When blank the Handler instance uses its own internal
 *                            array. If you'd like to keep track of the handlers outside of the
 *                            instance, pass a context such that context.handlers is an array.
 * @class  tooly.Handler
 * @constructor
 * @category  Handler
 * @memberOf  tooly
 * @static
 */
tooly.Handler = function(context) {
  if (!(this instanceof tooly.Handler)) {
    return new tooly.Handler(context);
  }
  this.context = context || this;
  this.handlers = this.context.handlers = {};
  return this;
};
    


/**
 * executes all handlers attached to the named function.
 * @example
 * var value = 0;
 * var handler = new tooly.Handler();
 * 
 * function inc() { 
 *   value += 10; 
 *   handler.executeHandler('inc');
 * }
 * 
 * function jump() {
 *   this.value *= 2;
 * }
 *
 * handler.on('inc', announce);
 * inc();
 * value; //=> 20;
 * 
 * @param  {(String|Object)} fn the name of the method to execute
 * @return {Object} `this` for chaining
 * 
 * @memberOf  tooly.Handler
 * @instance
 * @alias #exec #trigger
 */
tooly.Handler.prototype.executeHandler = function(fn) {
  var handler = this.handlers[fn] || [],
      i = 0, len = handler.length;
  for (; i < len; i++) {
    handler[i].apply(this.context, []);
  }
  return this;
};



/**
 * Register an event handler for a named function.
 * 
 * @param  {(String|Function)} fn   the function that will call the handler when executed
 * @param  {callback}   handler the handler that we be called by the named function
 * @return {Object} `this` for chaining
 * 
 * @memberOf  tooly.Handler
 * @instance
 */
tooly.Handler.prototype.on = function(fn, handler) {
  if (this.handlers[fn] === undefined) {
    this.handlers[fn] = [];
  }
  this.handlers[fn].push(handler);
  return this;
};



/**
 * Add callbacks to the list of handlers. The callbacks must be an object collection of 
 * key-value pairs where the identifier key is the name of a function that calls the 
 * `executeHandler` method with the same name as the key, while the value is the callback 
 * function itself. This method should not be used if only registering a single callback, 
 * for that use {@link #on}.
 * 
 * @param  {Object} handlers  collection of callback functions
 * @return {Object} `this` for chaining
 * 
 * @memberOf  tooly.Handler
 * @instance
 */
tooly.Handler.prototype.registerCallbacks = function(callbacks) {
  var t = this, h = {};
  if (callbacks !== undefined) {
    for (h in callbacks) {
      if (callbacks.hasOwnProperty(h)) {
        t.on(h, callbacks[h]);
      }
    }
  }
  return t;
};



/**
 * Remove all handler's attached to `fn`. All subsequent calls to 
 * `executeHandler(fn)` will no longer have an effect.
 * 
 * @param  {Function} fn the named function that executes handler(s)
 * 
 * @memberOf  tooly.Handler
 * @instance
 * @alias #off
 */
tooly.Handler.prototype.remove = function(fn) {
  if (this.handlers[fn] !== undefined) {
    this.handlers[fn].length = 0;
  }
};



/**
 * Remove all handlers. Any subsequent call to #executeHandler will have no effect.
 *
 * @memberOf  tooly.Handler
 * @instance
 */
tooly.Handler.prototype.removeAll = function() {
  this.handlers = {};
};



/**
 * @return {String}
 * @memberOf  tooly.Handler
 * @instance
 */
tooly.Handler.prototype.toString = function() { 
  return '[object Handler]'; 
};



/**
 * alias for #executeHandler
 * 
 * @ignore
 * @memberOf  tooly.Handler
 * @instance
 */
tooly.Handler.prototype.trigger = function(fn) {
  return this.executeHandler(fn);
};



/**
 * Class constructor. Typical logging functionality that wraps around console.log
 * with css coloring and level control. The Logger level hierarchy is as follows:
 *
 * - -1: off
 * - 0: log (no difference from console.log)
 * - 1: trace
 * - 2: debug
 * - 3: info
 * - 4: warn
 * - 5: error
 *
 * Only calls that are greater or equal to the current Logger.level will be run.
 *
 * ## Format
 * Format strings follow the same usage as node.js or the web interface, depending
 * on what environment you are in.
 * - node
 *   + %s, %j, and %d can be used for 'string', 'json', or 'number'
 * - browser
 *   + %s or %o can be used in place of 'string' or 'object'
 * 
 * ## Example
 * ```js
 * var logger = new tooly.Logger(2, 'TEST_LOGGER');
 * logger.trace(logger); // will not output
 * ```
 * 
 * All active loggers in the current context can be disabled, regardless of level,
 * by setting the static `tooly.Logger.off = true`. Setting back to false will resume
 * logging at each loggers previous level.
 * 
 * @param {Number} level set the level of this logger. Defaults to 2 (debug) if no
 *                       arguments are passed.
 * @param {String} name  optional name to identify this instance. The name will preceed any
 *                       output message
 *
 * @category Logger
 * @class  tooly.Logger
 * @constructor
 * @memberOf  tooly
 * @static
 */
tooly.Logger = function(level, name) {
  var logger = this;
  tooly.Logger.loggers = tooly.Logger.loggers || [];
  // enable instantiation without new
  if (!(logger instanceof tooly.Logger)) {
    logger = new tooly.Logger(level, name);
    tooly.Logger.loggers.push(logger);
  }
  logger.level = (level !== undefined) ? level : 2;
  if (name) logger.name = name;
  // automatically set this false as its only 
  // for emergency "must track anonymous function location" purposes
  logger.traceAnonymous = false;
  return logger;
};
var _cjs = typeof exports === 'object',
    _push = _arrayProto.push,
    _chalk = _cjs ? require('chalk') : null,
    _levels = ['dummy','trace','debug','info','warn','error'],
    _colors = [
      'gray', // dummy
      'gray',
      'green',
      _cjs ? 'cyan' : 'blue',
      _cjs ? 'yellow' : 'darkorange',
      'red',
      'gray' // last gray for time
    ],
    _o_re = /%o/gi,
    _j_re = /%j/gi; 
    
function _log(instance, level, caller, args) {
  if (tooly.Logger.off || instance.level === -1 || level < instance.level || instance.level > 5) {
    return;
  }

  var format = '%s%s', // name, [LEVEL] [HH:mm:ss]
      pargs = []; // final args for console call

  args = _slice.call(args);
  _format_re = _format_re || /\%[ojdifsc]/g;

  if (_cjs) {

    // TODO: replace match with RegExp#test
    if (tooly.type(args[0], 'string') && args[0].match(_format_re)) {
      format += args.shift().replace(_o_re, '%j');
    }
    pargs.unshift(format, _name(instance), _level(level));

  } else { // window
    format = '%c%s%c%s%c%s';
    if (tooly.type(args[0], 'string') && args[0].match(_format_re)) {
      format += args.shift().replace(_j_re, '%o');
    }
    caller = (caller !== undefined && caller.replace(_ws_re, '') === '') ? '' : caller;
    var color = 'color:' + _colors[level] + ';',
        purple = 'color:purple', black = 'color:black';
    pargs = [format, purple, _name(instance), color, _level(level), black, caller];
  }

  _push.apply(pargs, args);

  switch (level) {
    case -1: 
      return;

    case 0: 
      console.log(arguments[3]); 
      break;

    case 2: 
      // there is no console.debug, 
      // so the _levels map (default case) doesn't work there
      console.log.apply(console, pargs); 
      break;

    default: 
      // http://stackoverflow.com/
      // questions/8159233/typeerror-illegal-invocation-on-console-log-apply
      try {
        console[ _levels[level] ].apply(console, pargs);
      } catch(e) {
        console.log('[Logger (recovery mode)] ', pargs);
      }
      break;
  }
}

function _checkCaller(args) {
  if (!this.traceAnonymous) return '';
  var name = ''; 
  try { 
    name = args.callee.caller.name; 
  } catch(ignored) {
  }
  if (!name) {
    return  '<anonymous> ' + args.callee.caller + '\n';
  }
  return '<'+name+'> ';
}

function _name(instance) {
  var name = instance.name || '';
  return (_chalk) ? _chalk.magenta(name) : name;
}

function _level(level) {
  return _chalkify(level, ' ' + _levels[level].toUpperCase() + ' ') +
    _chalkify(6, '[' + _dateFormatted() + '] ');
}

function _dateFormatted() {
  function format(n) { return n < 10 ? '0' + n : n }
  var d = new Date();
  return [
    format(d.getHours()),
    format(d.getMinutes()),
    format(d.getSeconds()),
    d.getMilliseconds()
  ].join(':');
}

function _chalkify(level, str) {
  return (!_chalk) ? str : _chalk[ _colors[level] ](str);
}

tooly.Logger.prototype.log   = function() { _log(this, 0, _checkCaller(arguments), arguments); };
tooly.Logger.prototype.trace = function() { _log(this, 1, _checkCaller(arguments), arguments); };
tooly.Logger.prototype.debug = function() { _log(this, 2, _checkCaller(arguments), arguments); };
tooly.Logger.prototype.info  = function() { _log(this, 3, _checkCaller(arguments), arguments); };
tooly.Logger.prototype.warn  = function() { _log(this, 4, _checkCaller(arguments), arguments); };
tooly.Logger.prototype.error = function() { _log(this, 5, _checkCaller(arguments), arguments); };


/**
 * @return {String}
 * @memberOf  tooly.Logger
 * @instance
 */
tooly.Logger.prototype.toString = function() { 
  return '[object Logger]'; 
};



/**
 * @param  {Function} ctor
 * @param  {Object|Array} args
 * @return {Object}
 *
 * @memberOf  tooly
 * @category  Object
 * @static
 */
tooly.construct = function(ctor, args) {
  function __SurrogateConstructor() {
    return (_type(args) === 'array')
      ? ctor.apply(this, args)
      : ctor.call(this, args);
  }
  __SurrogateConstructor.prototype = ctor.prototype;
  return new __SurrogateConstructor();
};



/**
 * Add the "own properties" of `src` to `dest`.
 * Used throughout the application to add prototype
 * methods to tooly classes without
 * assigning Object as their prototype.
 *
 * @param  {Object} dest the destination object
 * @param  {Object} src  the source object
 * @return {Object}      `dest`
 *
 * @category  Object
 * @memberOf tooly
 * @static
 */
tooly.extend = function(dest, src) {
  return _extend(dest, src);
};



/*! alias for #isFalsy */
tooly.falsy = function(obj) {
  return isFalsy(obj);
};



/**
 * Object literal assignment results in creating an an object with Object.prototype
 * as the prototype. This allows us to assign a different prototype while keeping 
 * the convenience of literal declaration.
 * 
 * @param  {Object} prototype
 * @param  {Object} object    
 * @return {Object}
 * 
 * @author Yehuda Katz
 * @see http://yehudakatz.com/2011/08/12/understanding-prototypes-in-javascript/
 * 
 * @memberOf  tooly
 * @category  Object
 * @static 
 */
tooly.fromPrototype = function(prototype, object) {
  var newObject = Object.create(prototype), 
      prop;
  for (prop in object) {
    if (object.hasOwnProperty(prop)) {
      newObject[prop] = object[prop];
    }
  }
  return newObject;
};



/**
 * Helper to perform prototypal inheritance.
 * Note that this method overwrites the child's original prototype.
 * Also note that the child's constructor needs to call `parent.call(this)`
 *
 * @example
 * ```js
 * function Parent() {}
 * Parent.prototype.b = 2;
 * function Child() { Parent.call(this); } // this is a must
 * tooly.inherit(Parent, Child, { a: 1 });
 * var child = new Child();
 * console.log(child.a + child.b); //=> 3
 * // for a more practical example see the tooly.Handler documentation.
 * ```
 * 
 * @param  {Function} parent
 * @param  {Function} child  
 * @param  {Mixed} extend additional members to the Child's prototype 
 * 
 * @memberOf  tooly
 * @category  Object
 * @static
 */
tooly.inherit = function(parent, child, extend) {
  child.prototype = new parent();
  child.prototype.constructor = child;
  for (var prop in extend) {
    if (extend.hasOwnProperty(prop)) {
      child.prototype[prop] = extend[prop];
    }
  }
};



/**
 * Extensively check if `obj` is "falsy".
 * <br>
 * ### isFalsy returns true for the following:
 * ```js
 * var undefinedValue;
 * var nullValue             = null;
 * var setUndefined          = undefined;
 * var falseValue            = false;
 * var zero                  = 0;
 * var emptyString           = ''; // same for ' \n\t   \n'
 * var falseString           = 'false';
 * var zeroString            = '0';
 * var nullString            = 'null';
 * var undefinedString       = 'undefined';
 * ```
 * Note that in the cases of falsy strings, the check is
 * done after a call to `String.trim`, so surrounding
 * whitespace is ignored:
 * `isFalsy('\n\t false   \n') //=> true`
 *
 * @param  {mixed}  obj the object to check
 * @return {Boolean}     true if `obj` is "falsy"
 *
 * @alias #falsy
 * @see  #isTruthy
 * @memberOf tooly
 * @category Object
 * @static
 */
tooly.isFalsy = function(obj) {
  // no-strict void 0 covers null as well
  if (obj == void 0 || obj == false) return true;
  if (_type(obj, 'string')) {
    var str = obj.trim();
    return str === ''
      || str === 'false'
      || str === 'undefined'
      || str === 'null';
  }
};



/**
 * port of is.hash
 *
 * Test if `value` is a hash - a plain object literal.
 *
 * @param {Mixed} value value to test
 * @return {Boolean} true if `value` is a hash, false otherwise
 *
 * @see https://github.com/enricomarino/is/blob/master/index.js
 * @author Enrico Marino (with minor edits)
 *
 * @memberOf  tooly
 * @category  Object
 * @static
 */
tooly.isHash = function(val) {
  return _type(val, 'object') && val.constructor === Object && 
    !val.nodeType && !val.setInterval;
};



/**
 * Opposite of `isFalsy`.
 * 
 * @param  {mixed}  obj the object to check
 * @return {Boolean}     true if `obj` is "truthy"
 *
 * @alias #truthy
 * @see  #isFalsy
 * @memberOf tooly
 * @category Object
 * @static
 */
tooly.isTruthy = function(obj) {
  return !tooly.isFalsy(obj);
};



/**
 * scale a number from one range to another
 * 
 * @param  {Number} n      the number to scale
 * @param  {Number} oldMin 
 * @param  {Number} oldMax 
 * @param  {Number} min    the new min
 * @param  {Number} max    the new max
 * @return {Number}        the scaled number
 * 
 * @memberOf tooly
 * @category Object
 * @static
 */
tooly.scale = function(n, oldMin, oldMax, min, max) {
  return (((n-oldMin)*(max-min)) / (oldMax-oldMin)) + min; 
};



/**
 * A more useful alternative to the typeof operator.
 * If only the `obj` argument is passed, the class of that object is returned.
 * If the second argument `klass` is passed, a boolean indicating whether `obj`
 * is of class `klass` or not is returned.
 * 
 * @param  {Object} obj     the object
 * @param  {String} klass   object class to compare to
 * @return {String|Boolean} the type of object if only `obj` is passed or 
 *                              true if `obj` is of class `klass`, false otherwise
 *
 * @alias type
 * @author Angus Croll
 * @see  http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator
 * 
 * @memberOf tooly
 * @category Object
 * @static
 */
tooly.toType = function(obj, klass) {
  return _type(obj, klass);
};



/*! alias for #isTruthy */
tooly.truthy = function(obj) {
  return !tooly.isFalsy(obj);
};



/*! @alias for #toType */
tooly.type = function(o, k) { 
  return _type(o, k); 
};



/**
 * minimal Function version of ECMAScript6 `String.prototype.contains`.
 * 
 * @param  {String} source the source string
 * @param  {String} str    the string to find
 * @param  {String} index  [optional] index to start searching from
 * @return {Boolean}       true if `source` contains `str`
 *
 * @memberOf tooly
 * @category String
 * @static
 */
tooly.contains = function(source, str, index) {
  return source.indexOf(str, index || 0) > -1; 
};




/**
 * minimal Function version of ECMAScript6 `String.prototype.endsWith`.
 * 
 * @param  {String} str    the string to check
 * @param  {String} suffix the "endWith" we are seeking
 * @return {Boolean}       true if str ends with suffix
 *
 * @memberOf tooly
 * @category String
 * @static
 */
tooly.endsWith = function(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};



/**
 * get the extension of a file, url, or anything after the last `.` in a string.
 *
 * @param {String} str the string
 * @return {String}
 *
 * @memberOf tooly
 * @category String
 * @static
 */
tooly.extension = function(str) {
  return str.substring(str.lastIndexOf('.')+1);
};



/**
 * Minimal `printf` style string formatting.
 *
 * ### Usage
 * ```js
 * var obj = {website:'lokua.net'};
 * var float = 19.333;
 * tooly.format('object: %o, float: %f', obj, float);
 * //=> "object: {website:'lokua.net'}, float: 19.333"
 * ```
 * 
 * ### Supported specifiers 
 * + `%o` or `%j`: Object (JSON#stringified)
 * + `%d` of `%i`: Integer
 * + `%f`        : Float
 * + `%s`        : String
 *   
 * @param  {String} format the format string
 * @return {String}        the formatted string
 */
tooly.format = function(format) {
  var args = _slice.call(arguments, 1);
  if (!_format_re) _format_re = /\%[ojdifsc]+/gi;
  return format.replace(_format_re, function(m) {
    var x = args.shift();
    if (x !== undefined) {
      switch(m) {
        case '%o': // fallthrough
        case '%j': x = JSON.stringify(x); break;
        case '%d': // fallthrough
        case '%i': x = x | 0; break;
        case '%f': x = parseFloat(x); break;
        case '%s': // fallthrough
        default: break;
      }      
      return x;
    }
    return m;
  });
};



/**
 * Format money.
 * 
 * @example
 * ```js
 * var loot = '$' + tooly.formatMoney(10989.34); 
 * loot //=> "$10,989.00"
 * ```
 * 
 * @param  {Number|String} n a number or numerical string
 * @return {String}   `n` formatted as money (comma separated every three digits)
 * 
 * @see http://stackoverflow.com/a/14428340/2416000 
 * (slightly modified to coerce string-numbers)
 * @memberOf tooly
 * @category String
 * @static
 */
tooly.formatMoney = function(n) {
  var number = _type(n, 'number') ? n : +n;
  return number.toFixed(2).replace(/./g, function(c, i, a) {
    return i && c !== '.' && !((a.length - i) % 3) ? ',' + c : c;
  });
};



var _curly_re = /{(\d+)}/g;

/**
 * Function version of (C# style?) String.format
 * 
 * @example 
 * ```js
 * var formatted = tooly.format('{0}{1}', 'tooly', '.js')); 
 * formatted; //=> 'tooly.js'
 * ```
 *
 * @param  {String} format the format string
 * @return {String}        the formatted string
 *
 * @alias #stringFormat
 * @see  #format
 * @see  http://stackoverflow.com/a/4673436/2416000
 * @memberOf tooly
 * @category String
 * @static
 */
tooly.formatString = function(format) {
  var args = _slice.call(arguments, 1);
  return format.replace(_curly_re, function(match, number) { 
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};



/**
 * Utility method to convert milliseconds into human readable time
 * 
 * @param  {Number} time the time value in milliseconds
 * @return {String}      `time` formatted as hh:mm:ss
 * 
 * @memberOf tooly
 * @category String
 * @static
 */
tooly.formatTime = function(time) {
  var h = Math.floor(time / 3600),
      m = Math.floor((time - (h * 3600)) / 60),
      s = Math.floor(time - (h * 3600) - (m * 60));
  if (h < 10) h = '0' + h;
  if (m < 10) m = '0' + m;
  if (s < 10) s = '0' + s;
  return h + ':' + m + ':' + s;
};



/**
 * left pad
 * 
 * @param  {String} v      the string to pad
 * @param  {Number} len    the length such that len - v = number of padding chars
 * @param  {String} symbol the symbol to use for padding, defaults to single white space
 * @return {String}        the left padded string
 *
 * @see  tooly#rpad
 * @memberOf tooly
 * @category String
 * @static
 */
tooly.lPad = function(v, len, symbol) {
  var n = len - v.length;
  return (n > 0) ? tooly.repeat(symbol || ' ', n) + v : v;
};



/**
 * Function version of ECMAScript6 `String.prototype.repeat`
 * 
 * @param  {String} str   the string to repeat
 * @param  {Number} n     the number of times to repeat
 * @return {String}       the string repeated, or an empty string if n is 0
 * 
 * @memberOf tooly
 * @category String
 * @static
 */
tooly.repeat = function(str, n) {
  var s = '', i = 0;
  for (; i < n; i++) s += str;
  return s;
};



/**
 * right pad
 * 
 * @param  {String} v      the string to pad
 * @param  {Number} len    the length such that len - v = number of padding chars
 * @param  {String} symbol the symbol to use for padding, defaults to single white space
 * @return {String}        the right padded string
 *
 * @see tooly#lpad
 * @memberOf tooly
 * @category String
 * @static
 */
tooly.rPad = function(v, len, symbol) {
  var n = len - v.length;
  return (n > 0) ? v + tooly.repeat(symbol || ' ', n) : v;
};



/**
 * Extracts final relative part of url, optionally keeping forward,
 * backward, or both slashes. By default both front and trailing slashes are removed
 *
 * @param {String}  url           the url or filepath
 * @param {Boolean} preSlash      keeps slash before relative part if true
 * @param {Boolean} trailingSlash keeps last slash after relative part if true,
 *                                though does not add a trailing slash if it wasn't
 *                                there to begin with
 * @return {String}                               
 * 
 * @memberOf tooly
 * @category String
 * @static
 */
tooly.sliceRel = function(url, preSlash, trailingSlash) {
  var hasTrailing = false;
  if (url.slice(-1) === '/') {
    hasTrailing = true;
    // we slice off last '/' either way, to easily
    // use lastIndexOf for last url string
    url = url.slice(0,-1);
  }
  // snatch last part
  url = url.slice(url.lastIndexOf('/') + 1);
  // only if url already had trailing will we add it back
  // when trailingSlash is true.
  if (hasTrailing && trailingSlash) url += '/'; 
  if (preSlash) url = '/' + url;
  return url;
};



/**
 * minimal Function version of ECMAScript6 `String.prototype.startsWith`.
 * 
 * @param  {String} str    the string to check
 * @param  {String} prefix the "startsWith" we are seeking
 * @return {Boolean}       true if str starts with prefix
 *
 * @memberOf tooly
 * @category String
 * @static
 */
tooly.startsWith = function(str, prefix) {
  return str.substring(0, prefix.length) === prefix;
};



/*! alias for #formatString */
tooly.stringFormat = function() {
  return tooly.formatString.apply(null, arguments);
};



/**
 * Get a copy of `str` without file extension, or anything after the last `.`
 * (does not change the original string)
 * 
 * @param  {String} str the string to copy and strip
 * @return {String}     the copied string with file extension removed
 *
 * @memberOf tooly
 * @category String
 * @static
 */
tooly.stripExtension = function(str) {
  return str.substring(0, str.lastIndexOf('.'));
};



var _tag_re, _void_el_re;

/**
 * __Experimental__ - will change in future versions.
 * Wrap a string with html tags, id, classes, and attributes with 
 * very simple syntax. Void elements are accounted for.
 * Warning: has not been tested extensively as of yet.
 *
 * ### Examples
 * ```js
 * tooly.tag('div #my-id .my-class data-mood="perculatory"', 'Hi');
 * //=> "<div id="my-id" class="my-class" data-mood="perculatory">Hi</div>"
 * 
 * // nested:
 * tooly.tag('div', tooly.tag('section', '!'));
 * //=> "<div><section>!</section></div>"
 * ```
 * 
 * @param  {String}  el         String of the format "<tag> [.class[...]] [#id] [attribute[...]]"
 * @param  {String}  content    [optional] content to be place after the opening HTML tag
 * @param  {Boolean} asHTML     output HTML if true, String otherwise
 * @return {String|HTMLElement} HTML tag `el` filled with `content`
 *
 * @memberOf tooly
 * @category String
 * @static
 */
tooly.tag = function(el, content, asHTML) {
  if (!_tag_re) {
    _tag_re = /(^[a-z]+\d{1})|[^\s]+[a-z]+(-\w+)?=(["'])(?:(?!\3)[^\\]|\\.)*\3|[.#-_a-z][-\w]+/gi;
    _void_el_re = /area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr/i; 
  }
  var matches = el.match(_tag_re),
      el = matches.shift(),
      classes = '', id = '', attrs = '',
      closingTag, out; 
  matches.forEach(function(m, i) {
    var c = m.charAt(0);
    if (c === '#') {
      id += m.slice(1) + '"';
    } else if (c === '.') {
      classes += ' ' + m.slice(1) + ' ';
    } else {
      attrs += ' ' + m;
    }
  });
  closingTag = _void_el_re.test(el) ? '' : '</' + el + '>';
  out = [
    '<', el,
    id ? ' id="' + id : '',
    classes? ' class="' + classes.trim() + '" ' : '',
    attrs ? attrs : '',
    '>', content, closingTag
  ].join('');
  if (asHTML) {
    var d = document.createElement('div');
    d.innerHTML = out;
    return d.firstChild;
  }
  return out;
};



/**
 * Timer class constructor. Contains basic `start` and `stop` methods for timing
 * of code execution. Also see #funkyTime, which is a static method to time
 * function executions and is simpler to use than manually controlling a timer instance.
 *  
 * @param {String} name [optional] name
 * 
 * @category Timer
 * @class  tooly.Timer
 * @constructor
 * @memberOf tooly
 * @static
 */
tooly.Timer = function(name) {
  // enable instantiation without new
  if (!(this instanceof tooly.Timer)) {
    return new tooly.Timer(name);
  }
  this.name = name || 'Timer_instance_' + Date.now();
  return this; 
};



/**
 * Stop the timer and log the results to the console.
 * Equivalent of calling #stop then #log
 * 
 * @return {Number} the time elapsed in milliseconds
 *
 * @memberOf  tooly.Timer
 * @instance
 * @category Timer
 */
tooly.Timer.prototype.end = function() {
  this.stop();
  this.log();
  return this.elapsed;
};



/**
 * "funkyTime" - think "Function Execution Time".
 * Get the total, individual, and average execution times of `fn` called `n` times.
 * `fn` will be passed the iteration number as its first argument.
 *
 * @example
 * ```js
 * // setup code
 * var data = [], i = 0, n = 99000;
 * for (; i < n; i++) data.push(Math.random()*(1/3));
 *
 * // run a sort five times
 * var results = funkyTime(function() {
 *   var rndm = data.sort();
 * }, 5);
 *
 * results;
 * // returns something like:
 * // { stack: [ 692, 720, 730, 722, 735 ],
 * //   total: 735,
 * //   average: 147,
 * //   offset: 15.2 }
 * ```
 * 
 * @param  {Function} fn the function that will be timed.
 * @param  {number}   n  the number of times to run the function (defaults to 1)  
 * @return {Object}      a hash of timing results with the following signature:
 * <br>
 * + __stack__ <Array[Number]>: the time of each iteration 
 * + __total__ <Number>: the total of all iterations
 * + __average__ <Number>: the average of all iterations
 * + __offset__ <Number>: the difference between the total time to run 
 * the iteration loop and the sum of all iteration times - basically
 * the loop and Timer overhead.
 * @memberOf  tooly.Timer
 * @static
 * @category Timer
 */
tooly.funkyTime = function(fn, n) {
  var tx = tooly.Timer(),
      ix = tooly.Timer(),
      stack = [],
      i = 0, end, avg;
  n = n || 1;
  tx.start();
  for (; i < n; i++) {
    ix.start();
    fn.call(null, i);
    stack.push(ix.stop());
  }
  end = tx.stop();
  avg = end/n;
  return { 
    stack: stack,
    total: end,
    average: avg,
    offset: (function() {
      var sum = 0;
      stack.forEach(function(x) { sum += x; });
      return parseFloat((end - (sum/n)).toFixed(2));
    })()
  };
};



/**
 * log results to the console
 *
 * @memberOf  tooly.Timer
 * @instance
 * @category Timer
 */
tooly.Timer.prototype.log = function() {
  console.log(this.name + ' ' + this.elapsed);
};



/**
 * Start the timer
 *
 * @memberOf  tooly.Timer
 * @instance
 * @category Timer
 */
tooly.Timer.prototype.start = function() { 
  this.startTime = Date.now(); 
};
  


/**
 * Stop the timer
 * 
 * @return {Number} the time elapsed in milliseconds
 *
 * @memberOf  tooly.Timer
 * @instance
 * @category Timer
 */
tooly.Timer.prototype.stop = function() { 
  this.endTime = Date.now();
  this.elapsed = this.endTime - this.startTime;
  return this.elapsed;
};



/**
 * @return {String}
 * @memberOf  tooly.Timer
 * @instance
 */
tooly.Timer.prototype.toString = function() { 
  return '[object Timer]'; 
};



/**
 * perform a xhr `GET`
 * 
 * @param  {String}   url       url to resource
 * @param  {String}   respType  the request responseType
 * @param  {callback} success   function to operate on response data
 *                              if the request is successful. If so, success
 *                              takes a single data parameter (the response).
 * @param {Boolean}   async     defaults to true
 *
 * @memberOf tooly
 * @category XHR
 * @static
 */
tooly.get = function(url, respType, success, async) {
  var req = new XMLHttpRequest();
  req.open('get', url, (arguments.length === 3) ? true : async);
  req.reponseType = respType;
  req.onload = function() {
    if (req.readyState == 4) { // done
      if (req.status == 200) {
        success(respType === 'json' ? JSON.parse(req.response) : req.response);
      }
    }
  };
  req.send();
};



/**
 * perform a `GET` xhr request for a JSON file and operate on a `JSON.parse`'d response with
 * your supplied `success` callback.
 * 
 * @param  {String}   jsonFile  url
 * @param  {callback} success   function to operate on response data
 *                              if the request is successful. If so, success
 *                              takes a single data parameter (the response).
 * @param {Boolean}   async     defaults to true
 *
 * @memberOf tooly
 * @category XHR
 * @static
 */
tooly.getJSON = function(jsonFile, success, async) {
  tooly.get(jsonFile, 'json', success, async);
};


return tooly;


}));



/*!
 * lap - version 0.0.6 (built: 2014-11-08)
 * HTML5 audio player
 *
 * https://github.com/Lokua/lap.git
 *
 * Copyright © 2014 Joshua Kleckner
 * Licensed under the MIT license.
 * http://lokua.net/license-mit.html
 */

;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('Lap', [], function() {
      return (root.returnExportsGlobal = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['Lap'] = factory();
  }
}(this, function() {

/** @namespace  Lap */

var _idGen = _idGen || 0;
var _pluginIdGen = _pluginIdGen || 0;


// alias tooly.Frankie constructor. Handles all jQuery-like dom selection.
// TODO: make replacable with whatever selector lib that conforms to the API
// @type {tooly.Selector}
var $ = tooly.Frankie.bind(this);
 

/**
 * Instantiate a new Lokua Audio Player. See the {@tutorial settings} and {@tutorial lib}
 * tutorials for configuration instructions.
 *
 * Note about the code: though we are not using jQuery, we are still prepending the $ to
 * variables that represent dom elements to more easily differentiate.
 * 
 * @param {Object} container    the main wrapper div for the player
 * @param {(Object|JSON)} lib   a JSON or plain old object specifying songs, etc.
 *                              see {@link Audio.Player#lib}
 * @param {Object} options      custom options that override this player's defaults
 * @class Lap
 * @constructor
 */
function Lap(container, lib, options, init) {
  var lap = this;
  // init parent's instance
  // provides the `on` and `trigger` callback support
  tooly.Handler.call(lap);

  lap.id = ++_idGen+0;

  /*>>*/
  lap.logger = new tooly.Logger(0, 'Lap['+lap.id+']');
  /*<<*/

  // uninitialized
  lap.container = container;
  lap.lib = lib;

  // extend
  lap.settings = {};
  for (var p in lap.defaultSettings) {
    if (options.hasOwnProperty(p)) {
      lap.settings[p] = options[p];
    } else {
      lap.settings[p] = lap.defaultSettings[p];
    }
  }


  // doc ready
  if (init || arguments.length === 3) {
    var readyStateCheckInterval = setInterval(function() {
      if (document.readyState === 'complete') {
        lap.initialize();
        clearInterval(readyStateCheckInterval);
      }
    }, 10);
  }

  /*>>*/
  function echo(event) { 
    console.log('%cid_%d: %c%s', 
      'color:#999', lap.id, 'color:#555', event + ' handler called'); 
  }
  lap
    .on('load',         function() { echo('load'); })
    .on('play',         function() { echo('play'); })
    .on('paused',       function() { echo('paused'); })
    .on('seek',         function() { echo('seek'); })
    .on('trackChange',  function() { echo('trackChange'); })
    .on('albumChange',  function() { echo('albumChange'); })
    .on('volumeChange', function() { echo('volumeChange'); });
  /*<<*/

  return lap;
}

tooly.inherit(tooly.Handler, Lap, (function() {

  // shouldn't these be instance?
  var _SEEKING = _VOLUME_CHANGING = _PLAYLIST_OPEN = _DISCOG_OPEN = false, 
      _MOUSEDOWN_TIMER;

  return {

    defaultSettings: {
      callbacks: {},
      discogPlaylistExclusive: true,
      plugins: {},
      prependTrackNumbers: true,
      replacementText: void 0,
      startingAlbumIndex: 0,
      startingTrackIndex: 0,
      seekInterval: 5, 
      seekTime: 250,
      selectorPrefix: 'lap',
      trackNumberPostfix: ' - ',
      useNativeProgress: false,
      useNativeSeekRange: false,
      useNativeVolumeRange: false,
      volumeInterval: 0.05
    },    

    selectors: {
      album:               'lap-album',
      artist:              'lap-artist',
      buffered:            'lap-buffered',
      control:             'lap-control',
      controls:            'lap-controls',
      cover:               'lap-cover',
      currentTime:         'lap-current-time',
      discog:              'lap-discog',
      discogItem:          'lap-discog-item',
      discogPanel:         'lap-discog-panel',
      duration:            'lap-duration',
      info:                'lap-info', // button
      infoPanel:           'lap-info-panel',
      next:                'lap-next',
      nextAlbum:           'lap-next-album',
      playPause:           'lap-play-pause',
      playlist:            'lap-playlist', // button
      playlistItem:        'lap-playlist-item', // list item
      playlistPanel:       'lap-playlist-panel',
      playlistTrackNumber: 'lap-playlist-track-number',
      prev:                'lap-prev',
      prevAlbum:           'lap-prev-album',
      progress:            'lap-progress',
      seekBackward:        'lap-seek-backward',
      seekForward:         'lap-seek-forward',
      seekRange:           'lap-seek-range',
      trackNumber:         'lap-track-number', // the currently cued track
      trackTitle:          'lap-track-title',
      volumeButton:        'lap-volume-button',
      volumeDown:          'lap-volume-down',
      volumeRead:          'lap-volume-read',
      volumeRange:         'lap-volume-range',
      volumeUp:            'lap-volume-up'
    },    

    initialize: function() {
      var lap = this;

      if (lap.container.nodeType !== 1) {
        lap.container = $(lap.container, document).get(0);
      }
      lap.libType = tooly.type(lap.lib);
      lap.files = [];
      lap.tracklist = [];
      lap.$els = lap.settings.elements;
      lap.audio = {};
      lap.trackIndex = lap.settings.startingTrackIndex;
      lap.albumIndex = lap.settings.startingAlbumIndex;
      lap.trackCount;
      lap.album       = '';
      lap.trackTitle  = '';
      lap.artist      = '';
      lap.cover       = '';
      lap.replacement = '';

      lap.update();

      lap.initAudio();
      lap.initElements();
      lap.addListeners();
      lap.registerCallbacks(lap.settings.callbacks);
      lap.initPlugins();

      lap.trigger('load');

      /*>>*/
      lap.logger.info('post init: %o', lap);
      /*<<*/      
    },

    /**
     * Creates this player's Audio element ([Lap#audio](Lap#audio)) 
     * and sets its src attribute to the file located at 
     * (Lap#settings.startingTrackIndex)[Lap#settings.startingTrackIndex].
     * Note: you should never have to call this method.
     * 
     * @memberOf  Lap
     * @return {this}
     */
    initAudio: function() {
      this.audio = new Audio();
      this.audio.preload = 'auto';
      var fileType = this.getFileType(),
          canPlay = this.audio.canPlayType('audio/' + fileType);
      if (canPlay === 'probably' || canPlay === 'maybe') {
        this.setSource();
        this.audio.volume = 0.80;
      } else {
        console.log('This browser does not support ' + fileType + ' playback.');
      }
    },

    /**
     * Turn the registered DOM player control elements into selections
     * if they arent' already. In the case that $els === 'auto', the default class
     * names for controls will be used (this is preferred).
     * 
     * @return {this}
     * @memberOf  Lap
     */
    initElements: function() {
      var lap = this;
      lap.$els = {};
      tooly.each(lap.selectors, function(el, key) {
        var $el = $('.'+el, lap.container);
        // only add the Frankie instance if element really exists
        if (!$el.zilch()) lap.$els[key] = $el;
      });
    },


    /**
     * Sets the reference of the current album's files to an array, regardless of whether
     * this player is single, album, or discography based. Used to avoid excessive run-time type
     * identification checks throughout the application.
     * 
     * @memberOf  Lap
     */
    update: function() {
      var lap = this;
      // either something stupid is happening or we are testing
      if (lap.libType === 'null' || lap.libType === 'undefined') return;
      if (lap.libType === 'string') {
        if (tooly.extension(lap.lib.toLowerCase()) === 'json') {
          // TODO: break this function into two parts so
          // we can async
          tooly.getJSON(lap.lib, function(data) {
            // lap.lib = JSON.parse(data);
            lap.lib = data;
          }, false); // sync

          // at this point lap.lib is a regular js object, and is either a single unnamed object
          // representing a single album, or a named array containing mutliple albums.
          // using "data" for the array name...
          if (lap.lib.data !== 'undefined' && tooly.toType(lap.lib.data) === 'array') {
            lap.lib = lap.lib.data; // no point in hanging on to object-wrapped array
            lap.libType = tooly.toType(lap.lib);
            lap.albumCount = lap.lib.length;
            // call this function again to proceed to the ===array block
            lap.update();
            return;
          }
          lap.libType = tooly.toType(lap.lib);
          if (lap.libType === 'object') {
            lap.albumCount = tooly.propCount(lap.lib);
            // call this function again to proceed to the ===object block
            lap.update();
            return;
          }
        }
        // if we end up here, lib is (or should be) just a single file-string
        lap.files = [lap.lib];
        lap.tracklist = [lap.lib]; // TODO: fixme
        // make sure nothing stupid is set
        lap.trackIndex = 0;
        lap.albumIndex = 0;
        lap.startingTrackIndex = 0;
        lap.startingAlbumIndex = 0;

      } else if (lap.libType === 'object' || lap.libType === 'array') {
        var lib = lap.libType === 'array' ? lap.lib[lap.albumIndex] : lap.lib;
        lap.artist = lib.artist;
        lap.album = lib.album;
        lap.files = lib.files;
        lap.cover = lib.cover;
        lap.tracklist = lib.tracklist;
        lap.replacement = lib.replacement;

      } else {
        throw new TypeError(
          'Lap.lib must be of type String (audio or json file), Object, or Array');
      }

      // parse replacement
      if (lap.replacement !== undefined) {
        var re = lap.replacement;
        // for replacment without value specified, empty string
        if (tooly.type(re) === 'string') re = [re, ''];
        // re may contain string-wrapped regexp (from json), convert if so
        if (tooly.type(re[0]) !== 'regexp') {
          var flags = re[2];
          re[0] = (flags !== undefined) ? new RegExp(re[0], flags) : new RegExp(re[0], 'g');
        }
      } 
      if (tooly.type(lap.files) === 'string') {
        lap.trackCount = 1;
      } else {
        lap.trackCount = lap.files.length;
      }
      lap.formatTracklist();
    },

    /**
     * Places relative file names in place of an empty or mismatched tracklist array.
     * Also applies any regex specified in settings.replacement
     * 
     * @memberOf  Lap
     */
    formatTracklist: function() {
      var lap = this;
      // if mismatch, ignore tracklist completely
      if (lap.tracklist === undefined || lap.trackCount > lap.tracklist.length) {
        var re = lap.replacement, tracklist = [], i = 0;
        for (; i < lap.trackCount; i++) {
          tracklist[i] = tooly.sliceRel(tooly.stripExtension(lap.files[i]));
          if (re !== undefined) {
            tracklist[i] = tracklist[i].replace(re[0], re[1]);
          }
        }
        lap.tracklist = tracklist;
      }
    },

    /**
     * Set the {@link Lap#audio} src attribute to the currently cued file trackIndex
     * ({@link Lap#trackIndex})
     * @memberOf  Lap
     */
    setSource: function() {
      var audio = this.audio;
      audio.src = this.files[this.trackIndex];

      // this.audio.load(); // TODO: why not?
       
      // ugly hack, force buffer the entire track (doesn't work anyway)
      // audio.play();
      // setTimeout(audio.pause(), 10);
    },

    /**
     * Initialize the native audio events as well as the various click events on player controls.
     * @memberOf  Lap
     */
    addListeners: function() {
      var lap = this, 
          $els = lap.$els,
          audio = lap.audio;

      var nativeProgress = 
        lap.settings.useNativeProgress && $els.progress && $els.progress.els.length;

      if ($els.buffered || nativeProgress) {
        audio.addEventListener('progress', function() {
          var buffered = +lap.bufferFormatted();
          if ($els.buffered) {
            $els.buffered.html(buffered);
          }
          if (nativeProgress) {
            $els.progress.get(0).value = buffered;
          }
        });
      }

      if ($els.currentTime) {
        audio.addEventListener('timeupdate', function() {
          $els.currentTime.html(lap.currentTimeFormatted());
        });
      }
      if ($els.duration) {
        audio.addEventListener('durationchange', function() {
          $els.duration.html(lap.durationFormatted());        
        });
      }
      if ($els.volumeRead) {
        audio.addEventListener('volumechange', function() {
          $els.volumeRead.html(lap.volumeFormatted());
        });
      }
      audio.addEventListener('ended', function() {
        lap.next();
        if (lap.audio.paused) lap.audio.play();
      });

      // clicks ->
      if ($els.playPause) $els.playPause.on('click', function() { lap.togglePlay(); });
      if ($els.prev) $els.prev.on('click', function() { lap.prev(); });
      if ($els.next) $els.next.on('click', function() { lap.next(); });
      if ($els.volumeUp) $els.volumeUp.on('click', function() { lap.incVolume(); });
      if ($els.volumeDown) $els.volumeDown.on('click', function() { lap.decVolume(); });
      if ($els.prevAlbum) $els.prevAlbum.on('click', function() { lap.prevAlbum(); });
      if ($els.nextAlbum) $els.nextAlbum.on('click', function() { lap.nextAlbum(); });

      var hasPlaylist = $els.playlistPanel && $els.playlist;
      var hasDiscog = $els.discogPanel && $els.discog;

      if (hasPlaylist) {
        $els.playlist.on('click', function() {
          if ($els.playlistPanel.hasClass('lap-hidden')) {
            $els.playlistPanel.removeClass('lap-hidden');
            _PLAYLIST_OPEN = true;
            if (hasDiscog && lap.settings.discogPlaylistExclusive) {
              $els.discogPanel.addClass('lap-hidden');
            }
          } else {
            $els.playlistPanel.addClass('lap-hidden');
            _PLAYLIST_OPEN = false;
            if (hasDiscog && lap.settings.discogPlaylistExclusive && _DISCOG_OPEN) {
              $els.discogPanel.removeClass('lap-hidden');
            }
          }
        });
      }
      if (hasDiscog) {
        $els.discog.on('click', function() {
          if ($els.discogPanel.hasClass('lap-hidden')) {
            $els.discogPanel.removeClass('lap-hidden');
            _DISCOG_OPEN = true;
            if (hasPlaylist && lap.settings.discogPlaylistExclusive) {
              $els.playlistPanel.addClass('lap-hidden');
            }
          } else {
            $els.discogPanel.addClass('lap-hidden');
            _DISCOG_OPEN = false;
            if (hasPlaylist && lap.settings.discogPlaylistExclusive && _PLAYLIST_OPEN) {
              $els.playlistPanel.removeClass('lap-hidden');
            }
          }
        });
      }

      lap.initSeekHandlers();
      lap.initVolumeHandlers();

      lap.on('load', function() {
        if ($els.trackTitle) lap.updateTrackTitleEl();
        if ($els.trackNumber) lap.updateTrackNumberEl();
        if ($els.artist) lap.updateArtistEl();
        if ($els.album) lap.updateAlbumEl();
        if ($els.cover) lap.updateCover();
        if ($els.playlistPanel) lap.populatePlaylist();
        if ($els.playPause) {
          $els.playPause.addClass('lap-paused');
          lap.on('play', function() {
            $els.playPause.removeClass('lap-paused').addClass('lap-playing');
          }).on('pause', function() {
            $els.playPause.removeClass('lap-playing').addClass('lap-paused');
          });
        }
      }).on('trackChange', function() {
        if ($els.trackTitle) lap.updateTrackTitleEl();
        if ($els.trackNumber) lap.updateTrackNumberEl();
        if ($els.playlistPanel) lap.updatePlaylistItem();
        if ($els.currentTime) $els.currentTime.html(lap.currentTimeFormatted());
        if ($els.duration) $els.duration.html(lap.durationFormatted());
      }).on('albumChange', function() {
        if ($els.trackTitle) lap.updateTrackTitleEl();
        if ($els.trackNumber) lap.updateTrackNumberEl();
        if ($els.artist) lap.updateArtistEl();
        if ($els.album) lap.updateAlbumEl();
        if ($els.cover) lap.updateCover();
        if ($els.playlistPanel) lap.populatePlaylist();
      });
    },

    initSeekHandlers: function() {
      var lap = this, 
          $els = lap.$els,
          audio = lap.audio,
          seekRange = $els.seekRange,
          nativeSeek = lap.settings.useNativeSeekRange && seekRange && seekRange.els.length > 0;

      if (nativeSeek) {
        audio.addEventListener('timeupdate', function(e) {
          if (!_SEEKING) {
            seekRange.get(0).value = tooly.scale(audio.currentTime, 0, audio.duration, 0, 100);
          }
        });
        seekRange.on('mousedown', function(e) {
          _SEEKING = true;
        }).on('mouseup', function(e) {
          var el = seekRange.get(0);
          audio.currentTime = tooly.scale(el.value, 0, el.max, 0, audio.duration);
          lap.trigger('seek');
          _SEEKING = false;
        });

      } else { // using buttons
        [$els.seekForward, $els.seekBackward].forEach(function(el) {
          if (!el) return;
          el.on('mousedown', function(e) {
            _SEEKING = true;
            if ($(e.target).hasClass('lap-seek-forward')) {
              lap.seekForward();
            } else {
              lap.seekBackward();
            }
          }).on('mouseup', function(e) {
            _SEEKING = false;
            // TODO: won't this private _MOUSEDOWN_TIMER be universal
            // to all Lap instance's? Should be instance member
            clearTimeout(_MOUSEDOWN_TIMER);
          });
        });
      }
    },

    initVolumeHandlers: function() {
      var lap = this, 
          $els = lap.$els,
          audio = lap.audio,
          vslider = $els.volumeRange,
          nativeVolume = lap.settings.useNativeVolumeRange && vslider && vslider.els.length > 0;

      if (nativeVolume) {
        audio.addEventListener('volumechange', function() {
          if (!_VOLUME_CHANGING) {
            vslider.get(0).value = lap.volumeFormatted();
          }
        });
        vslider.on('mousedown', function() {
          _VOLUME_CHANGING = true;
        }).on('mouseup', function() {
          audio.volume = vslider.get(0).value * 0.01;
          lap.trigger('volumeChange');
          _VOLUME_CHANGING = false;
        });
      }
    },   

    /**
     * Initialize plugins passed to the constructor.
     * Plugins by minimum must contain a constructor attached to the Lap
     * namespace with a first argument referencing a lap instance 
     * and an init function which will be called to instantiate 
     * the plugin when the Lap instance's "load" event is fired.
     *
     * ### Plugin Template
     * ```js
     * // constructor
     * Lap.MyPlugin = function(lap) {
     *   this.lap = lap;
     *   return this;
     * }
     * Lap.MyPlugin.prototype.init = function() {
     *   // do stuff
     * }
     * ```
     * 
     * @return {Object} this
     * @memberOf Lap
     */
    initPlugins: function() {
      if (!this.settings.plugins) return;
      this.plugins = this.plugins || [];
      var lap = this,
          plugins = lap.settings.plugins,
          instance = {},
          args = [],
          name;
      plugins.forEach(function(plugin, i) {
        if (plugin.constructor) {
          instance = (plugin.args) 
            ? tooly.construct(plugin.constructor, args.concat(lap, plugin.args)) 
            : tooly.construct(plugin.constructor, lap);
          lap.plugins[i] = instance;
          lap.on('load', function() { 
            if (lap.plugins[i] && lap.plugins[i].init) {
              lap.plugins[i].init();
            } else {
              throw new Error('Could not initialize ' + lap.plugins[i] +
                '. The plugin has no #init property');
            }
          });
        }
      });
      return this;
    }, 

    /**
     * @memberOf  Lap
     * @return {this}
     */
    updateTrackTitleEl: function() {
      var lap = this;
      lap.$els.trackTitle.html(lap.tracklist[lap.trackIndex]);
      return lap;
    },

    /**
     * @memberOf  Lap
     * @return {this}
     */
    updateTrackNumberEl: function() {
      var lap = this;
      lap.$els.trackNumber.html(lap.trackIndex+1);
      return lap;
    },

    // TODO: adapt update for multiple artist arrays
    /**
     * @memberOf  Lap
     * @return {this}
     */
    updateArtistEl: function() {
      var lap = this;
      lap.$els.artist.html(lap.artist);
      return lap;
    },

    /**
     * @memberOf  Lap
     * @return {this}
     */
    updateAlbumEl: function() {
      var lap = this;
      lap.$els.album.html(lap.album);
      return lap;
    },

    /**
     * @memberOf  Lap
     * @return {this}
     */
    updateCover: function() {
      var lap = this;
      lap.$els.cover.get(0).src = lap.cover;
      return lap;
    },

    /**
     * Toggle the audio element's play state
     * 
     * @memberOf  Lap
     * @return {this}
     */
    togglePlay: function() {
      var t = this;
      if (t.audio.paused) {
        t.play();
      } else {
        t.pause();
      }
      t.trigger('togglePlay');
      return t;
    },

    /**
     * @memberOf  Lap
     * @return {this}
     */
    play: function() {
      this.audio.play();
      this.trigger('play');
      return this;
    },


    /**
     * @memberOf  Lap
     * @return {this}
     */
    pause: function() {
      this.audio.pause();
      this.trigger('pause');
      return this;
    },

    /**
     * Set the current track. Fires the "trackChange" event.
     *
     * @param {number} index  the new index; under/overflow will be clamped
     * @memberOf  Lap
     * @return {this}
     */
    setTrack: function(index) {
      if (index <= 0) {
        this.trackIndex = 0;
      } else if (index >= this.trackCount) {
        this.trackIndex = this.trackCount-1;
      } else {
        this.trackIndex = index;
      }
      this.trigger('trackChange');
      return this;
    },

    /**
     * Move the previous index in the file que.
     * @return {this}
     * @memberOf  Lap
     */
    prev: function() {
      var t = this;
      var wasPlaying = !t.audio.paused;
      t.trackIndex = (t.trackIndex-1 < 0) ? t.trackCount-1 : t.trackIndex-1;
      t.setSource();
      if (wasPlaying) t.audio.play();
      this.trigger('trackChange');
      return this; 
    },

    /**
     * Move to the next index in the file que.
     * @return {this}
     * @memberOf  Lap
     */
    next: function() {
      var lap = this;
      /*>>*/
      // lap.logger.debug(lap.audio);
      // lap.logger.debug(lap.audio.paused);
      /*<<*/
      var wasPlaying = !lap.audio.paused;
      lap.trackIndex = (lap.trackIndex+1 >= lap.trackCount) ? 0 : lap.trackIndex+1;
      lap.setSource();
      if (wasPlaying) lap.audio.play();
      this.trigger('trackChange');
      return this;
    },

    /**
     * Skip to the previous album in the array of albums. Fires the "albumChanged" event.
     * 
     * @return {this}
     * @memberOf  Lap
     */
    prevAlbum: function() {
      var t = this;
      var wasPlaying = !t.audio.paused;
      t.albumIndex = (t.albumIndex-1 < 0) ? t.albumCount-1 : t.albumIndex-1;
      t.update();

      t.trackIndex = 0;
      t.setSource();

      if (wasPlaying) t.audio.play();
      this.trigger('albumChange');
      return this;
    },

    /**
     * Skip to the next album in the array of albums. Fires the "albumChanged" event.
     * 
     * @return {this}
     * @memberOf  Lap
     */
    nextAlbum: function() {
      var t = this;
      var wasPlaying= !t.audio.paused;
      t.albumIndex = (t.albumIndex+1 > t.albumCount-1) ? 0 : t.albumIndex+1;
      t.update();

      t.trackIndex = 0;
      t.setSource();

      if (wasPlaying) t.audio.play();
      this.trigger('albumChange');
      return this;
    },

    /**
     * Increment audio volume by the [`Lap#settings.volumeInterval`](#settings) amount
     * Fires the "volumeChange" event.
     * 
     * @return {this}
     * @see #setVolume
     * @memberOf  Lap
     */
    incVolume: function() {
      this.setVolume(true);
      return this;
    },

    /**
     * Decrement audio volume by the [`Lap#settings.volumeInterval`](#settings) amount
     * Fires the "volumeChange" event.
     * 
     * @return {this}
     * @see #setVolume
     * @memberOf  Lap
     */
    decVolume: function() {
      this.setVolume(false);
      return this;
    },

    /**
     * Increment or decrement audio volume by the [`Lap#settings.volumeInterval`](#settings)
     * amount. Fires the "volumeChange" event.
     * 
     * @param {Boolean}   up - increments volume if true; decrements otherwise
     * @return {this}
     * @memberOf  Lap
     */
    setVolume: function(up) {
      var vol = this.audio.volume,
          interval = this.settings.volumeInterval;
      if (up) {
        this.audio.volume = (vol + interval >= 1) ? 1 : vol + interval;
      } else {
        this.audio.volume = (vol - interval <= 0) ? 0 : vol - interval;
      }
      this.trigger('volumeChange');
      return this;
    },

    /**
     * Seek backwards in the current track. Fires the "seek" event.
     *
     * @return {this}
     * @see #seek
     * @memberOf  Lap
     */
    seekBackward: function() {
      if (!_SEEKING) return;
      var lap = this;
      _MOUSEDOWN_TIMER = setInterval(function() {
        lap.seek(false);
      }, lap.settings.seekTime);
      return this;
    },

    /**
     * Seek forwards in the current track. Fires the "seek" event.
     *
     * @return {this}
     * @see #seek
     * @memberOf  Lap
     */
    seekForward: function() {
      if (!_SEEKING) return;
      var lap = this;
      _MOUSEDOWN_TIMER = setInterval(function() {
        lap.seek(true);
      }, lap.settings.seekTime);
      return this;
    },

    /**
     * Seek forward or backward in the current track. A single call seeks in the 
     * specified direction by amount set in [Lap#settings.seekInterval](Lap#settings.seekInterval).
     * Fires the "seek" event.
     * 
     * @param  {Boolean} forward  if true, seek direction is forward; backward otherwise
     * @return {this}
     * @memberOf  Lap
     */
    seek: function(forward) {
      var lap = this, applied;
      if (forward) {
        applied = lap.audio.currentTime + lap.settings.seekInterval;
        lap.audio.currentTime = (applied >= lap.audio.duration) ? lap.audio.duration : applied;
      } else {
        applied = lap.audio.currentTime + (lap.settings.seekInterval * -1);
        lap.audio.currentTime = (applied <= 0) ? 0 : applied;
      }
      this.trigger('seek');
      return this;
    },    

    /**
     * If #settings.populatePlaylist is true, populates the #$els.playlistPanel with the 
     * following format:
     * ```html
     * <ul>
     *   <li class="lap-playlist-item lap-playlist-current" data-lap-playlist-index="0">
     *     <span class="lap-playlist-track-number">1 - </span>
     *     <span class="lap-playlist-track-title">Hello</span>
     *   </li>
     *   <li class="lap-playlist-item" data-lap-playlist-index="1">
     *     <span class="lap-playlist-track-number">2 - </span>
     *     <span class="lap-playlist-track-title">World</span>
     *   </li>
     * </ul>
     * ```
     * Note the above example uses the default #settings.selectorPrefix, 
     * #settings.prependTrackNumbers, and #settings.trackNumberPostfix values.
     * The current track will be auto-assigned the "lap-playlist-current" class.
     * 
     * @return {this}
     * 
     * @memberOf  Lap
     */
    populatePlaylist: function() {
      var lap = this,
          $panel = lap.$els.playlistPanel,
          prepend = lap.settings.prependTrackNumbers;

      // TODO: test-me -> should remove all pre-existing listeners
      $panel.remove();

      $panel.html(
        tooly.tag('ul', lap.tracklist.map(function(track, i) {

          var tagFormat = 'li .lap-playlist-item ' + 
            ((i === lap.trackIndex) ? '.lap-playlist-current ' : '') +
            'data-lap-playlist-index="' + i + '"';

          return tooly.tag(tagFormat, tooly.stringFormat('{0}{1}',
            // 0
            prepend 
              ? tooly.tag('span .lap-playlist-track-number', lap.trackNumberFormatted(i+1)) 
              : '',
            // 1
            tooly.tag('span .lap-playlist-track-title', lap.tracklist[i].trim()))
          );
        }).join(''))
      );

      $panel.find('li').on('click', function(e) {
        var $li = $(this);
        lap.setTrack($li.attr('data-lap-playlist-index'));
      });
    },

    /**
     * Read only. Get the #tracklist (same as the #lib.files array without path garbage) and 
     * formatting according to The #settings.replacement value (if any)
     * and the #settings.prependTrackNumber flag. Useful if you do not want the formatting
     * provided by #populatePlaylist
     * 
     * @return {Array<String>}
     * @memberOf  Lap
     */
    playlistFormatted: function() {
      var lap = this,
          prepend = lap.settings.prependTrackNumbers;
      return lap.tracklist.map(function(track, i) {
        return (prepend ? lap.trackNumberFormatted(i+1) : '') + track.trim();
      });
    },

    /**
     * Adds `lap-current` class to playlist item that matches `#trackIndex`.
     * Called whenever the "trackChanged" event is fired.
     * 
     * @memberOf Lap
     */
    updatePlaylistItem: function() {
      var lap = this;
      // remove highlight
      $('li', lap.$els.playlistPanel).removeClass('lap-playlist-current')
        // highlight
        .eq(lap.trackIndex).addClass('lap-playlist-current');
      return lap;
    },    

    /**
     * TODO: shouldn't lib already be an array at this point (from #update)?
     * 
     * @return {String} the currently qued file's extension sans `.`
     * @memberOf  Lap
     */
    getFileType: function() {
      var file;
      if (this.libType === 'string') { // lib itself is the file
        file = this.lib;
      } else if (this.libType === 'object') { // full album
        if (this.trackCount === 1) {
          file = this.lib.files;
        } else {
          file = this.lib.files[this.trackIndex];
        }
      } else if (this.libType === 'array') { // array of albums
        if (this.trackCount === 1) {
          file = this.lib[this.albumIndex].files;
        } else {
          file = this.lib[this.albumIndex].files[this.trackIndex];
        }
      }
      return (file === undefined) ? '"unknown filetype"' : tooly.extension(file);
    },

    /**
     * Read only. Get the current audio's total audio buffered
     * 
     * @return {Number} the buffer total scaled between 0-100
     */
    bufferFormatted: function() {
      if (!this.audio) return 0;

      var buffered,
          audio = this.audio;

      try {
        buffered = audio.buffered.end(audio.buffered.length-1);
      } catch(e) {
        return 0;
        // tooly.trace('bufferFormatted', e.name);
      }
      var formatted = Math.round(tooly.scale(buffered, 0, audio.duration, 0, 100));
      // TODO: why are we returning 0?
      return isNaN(formatted) ? 0 : formatted;
    },

    /**
     * Read only. Get the current track's currentTime property in human readable format
     * 
     * ### Example
     * ```js
     * var volume    = lapInstance.audio.currentTime;      //=> 62.310011
     * var formatted = lapInstance.currentTimeFormatted(); //=> 0:01:02
     * ```
     * @return {String} human readable time in hh:mm:ss format
     * @see #formatTime
     * @memberOf  Lap
     * @example
     */
    currentTimeFormatted: function() {
      var formatted = tooly.formatTime(Math.floor(this.audio.currentTime.toFixed(1)));
      if (this.audio.duration < 3600 || formatted === '00:00:00') {
        return formatted.slice(3); // two digits and the colon
      }
      return formatted;
    },

    /**
     * Read only. Get the current track's duration property in human readable format
     *
     * ### Example
     * ```js
     * var duration  = lap.audio.duration;      //=> 151.222857
     * var formatted = lap.durationFormatted(); //=> 0:02:31
     * ```
     * 
     * @return {String} human readable time in hh:mm:ss format
     * @see #formatTime
     * @memberOf  Lap
     */
    durationFormatted: function() {
      var formatted = tooly.formatTime(Math.floor(this.audio.duration.toFixed(1)));
      if (this.audio.duration < 3600) {
        return formatted.slice(3);
      }
      return formatted;
    },

    /**
     * Read only.
     * 
     * @return {Number} #audio volume to 0-100 scale
     */
    volumeFormatted: function() {
      return Math.round(this.audio.volume * 100);
    },

    /**
     * Read only. Helper used in populatePlaylist. 
     * Zero-pads and punctutates the passed track number.
     * 
     * @param  {Number} n the trackNumber to format
     * @return {String}   the formatted trackNumber
     * @memberOf Lap
     */
    trackNumberFormatted: function(n) {
      var count = (''+this.trackCount).length - (''+n).length;
      return tooly.repeat('0', count) + n + this.settings.trackNumberPostfix;
    },

    /**
     * for use with mutli-album library. get an array of the passed key for all
     * objects in the lib, like 'album' or 'artist'.
     *
     * TODO: just like in #getFile, should lib always be an array at this point?
     * 
     * @param  {String} prop    the property key
     * @return {Array<String>|Array<Array>}  an array of all values specified by key
     */
    property: function(key) {
      if (this.libType === 'object') {
        if (this.lib.hasOwnProperty(key)) {
          return this.lib[key];
        }
      }
      if (this.libType === 'array') {
        var list = [], 
            len = this.lib.length,
            i = 0;
        for (; i < len; i++) {
          if (this.lib[i].hasOwnProperty(key)) {
            list[i] = this.lib[i][key];
          }
        }
        return list;
      }
    },

    /**
     * tooly.js in the Lap build may not be global, so here we are.
     * 
     * @return {Object} tooly
     */
    getTooly: function() {
      return tooly;
    },

    /**
     * Equivalent of calling #getTooly().Frankie.bind(this)
     * 
     * @return {Function} The Frankie constructor
     */
    getSelector: function() {
      return $;
    },

    /**
     * Equivalent of calling `JSON.stringify(this)`
     * 
     * @memberOf  Lap
     */
    toString: function() {
      return JSON.stringify(this);
    }
  }; // end return
})()); // end anon }, end wrapper ), call wrapper (), end tooly.inherit );


return Lap;


}));
