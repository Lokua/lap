/**
 * lap - version 0.0.5 (built: 2014-10-01)
 * html5 audio player
 * https://github.com/Lokua/lap.git
 * Copyright (c) 2014 Joshua Kleckner <dev@lokua.net>
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/MIT
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('Lap', [], function () {
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
}(this, function () {

/**
 * tooly - version 0.0.3 (built: 2014-10-01)
 * js utility functions
 * https://github.com/Lokua/tooly.git
 * Copyright (c) 2014 Joshua Kleckner
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/MIT
 */

/**
 * @namespace  tooly
 * @type {Object}
 */
var tooly = (function() {

  function _type(o, klass) {
    o = ({}).toString.call(o).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    if (klass) {
      return o === klass.toLowerCase();
    }
    return o;
  }
  
  var _ws = /\s+/;

  function _re(str) {
    // return new RegExp('\\s*' + str + '\\s*(?![\\w\\W])', 'g');
    return new RegExp('\\s*' + str + '\\s*(![\\w\\W])?', 'g');
  }

  function _procArgs(el, args, callback) {
    if (_type(args) === 'array') {
      var ret, i = 0, len = el.length;
      for (; i < len; i++) {
        ret = callback(el[i], args);
      }
      return ret;
    }
  }

  function _procEls(el, content, callback) {
    if (_type(el) === 'array') {
      var ret, i = 0, len = el.length;
      for (; i < len; i++) {
        callback(el[i], content);
      }
    }
  }

  function _hasClass(el, klass, re) {
    var classes = el.className.split(_ws),
        i = 0, len = classes.length;
    for (; i < len; i++) {
      if (classes[i].match(re) == klass) {
        return true;
      }
    }
    return false;
  }

  function _prepend(el, content) {
    if (!_node(el)) el = tooly.select(el);
    el.innerHTML = content + el.innerHTML;
  }

  function _append(el, content) {
    if (!_node(el)) el = tooly.select(el);
    el.innerHTML += content;
  }

  function _node(el) {
    return  el && (el.nodeType === 1 || el.nodeType === 9);
  }
  
  return {

//    +------------+
//    | DOM MODULE |
//    +------------+    
    /**
     * check if an element has a css class
     * 
     * @param  {Object|Array<Element>|String} el  the node, array of nodes, or valid css selector
     * @param  {String}   klass   the css class to compare
     * @return {Boolean} true if `el` has `klass`
     *
     * @memberOf  tooly
     * @module  dom
     * @static
     */
    hasClass: function(el, klass) {
      if (_type(el, 'array')) {
        var re = _re(klass), i = 0, len = el.length;
        for (; i < len; i++) {
          var _el = _node(el[i]) ? el[i] : tooly.select(el[i]);
          if (_hasClass(_el, klass, re)) return true;
        }
      } 
      return false;
    },

    /**
     * add a css class to element
     * 
     * @param  {Object|Array<Element>|String} el  the node, array of nodes, or valid css selector
     * @param {String} klass the css class to add
     * @return {Object} `tooly` for chaining
     *
     * @memberOf  tooly
     * @module  dom
     * @static
     */
    addClass: function(el, klass) {
      if (_type(el, 'array')) {
        _procEls(el, klass, tooly.addClass);
      } else if (!_node(el)) {
        el = tooly.select(el);
      } else {
        el.className += ' ' + klass;
      }
      _procArgs(el, klass, tooly.addClass);
      return tooly;
    },

    /**
     * remove a css class from an element
     * 
     * @param  {Object|Array<Element>|String} el  the node, array of nodes, or valid css selector
     * @param  {String} klass   the css class to remove
     * @return {Object} `tooly` for chaining
     *
     * @memberOf  tooly
     * @module  dom
     * @static
     */
    removeClass: function(el, klass) {
      if (_type(el, 'array')) {
        _procEls(el, klass, tooly.removeClass);
      } else if (!_node(el)) {
        el = tooly.select(el);
      } else {
        el.className = el.className.replace(_re(klass), ' ');
      }
      _procArgs(el, klass, tooly.removeClass);
      return tooly;
    },

    /**
     * prepend content to HTML element(s)
     * 
     * @param  {Object}  el         the element(s) to prepend content to
     * @param  {String}  content    the content to prepend
     * @return {Object} `tooly` for chaining
     *
     * @memberOf  tooly
     * @module  dom
     * @static
     */
    prepend: function(el, content) {
      if (_type(el, 'array')) {
        _procEls(el, content, _prepend);
        return tooly
      } 
      _prepend(el, content);
      return tooly;
    },

    /**
     * append content to HTML element(s)
     *
     * @param  {Object}  el         the element(s) to append content to
     * @param  {String}  content    the content to append
     * @return {Object} `tooly` for chaining
     *
     * @memberOf  tooly
     * @module  dom
     * @static
     */
    append: function(el, content) {
      if (_type(el, 'array')) {
        _procEls(el, content, _append);
        return tooly
      } 
      _append(el, content);
      return tooly;
    },

    /**
     * fill DOM element `el` with `content`. Replaces existing content.
     * If called with 1 arg, the first matched element's innerHTML is returned
     * 
     * @param  {String|Object} content
     * @param  {Element} el      
     * @return {String|Object} the first matched el's innerHTML of null when in get mode,
     *                             otherwise `tooly` for chaining
     * @memberOf  tooly
     * @module  dom
     * @static
     */
    html: function(el, content) {
      // get
      if (arguments.length === 1)  {
        if (_type(el) === 'array' && _node(el[0])) {
          return  el[0].innerHTML;
        } else if (_node(el)) {
          return el.innerHTML;
        } else {
          return tooly.select(el).innerHTML;
        }
      }

      if (!_node(el)) {
        if (_type(el) === 'array') {
          var i = 0, len = el.length;
          for (; i < len; i++) {
            if (_node(el[i])) {
              el[i].innerHTML = content;
            } else {
              el[i] = tooly.select(el[i]);
              el[i].innerHTML = content;
            }
          }
          return tooly;
        } else {
          tooly.select(el).innerHTML = content;
          return tooly;
        }
      }

      el.innerHTML = content;
      return tooly;
    },

    /**
     * wrapper for HTML5 `querySelector`
     * 
     * @param  {String}  selector valid css selector string
     * @param  {Element} context  the parent element to start searching from 
     *                            defaults to document if blank 
     * @return {Element|null} the first matched element or null if no match
     * 
     * @alias sel
     * @memberOf  tooly
     * @module  dom
     * @static
     */
    select: function(selector, context) {
      return (context || document).querySelector(selector);
    },

    /*!
     * alias for #select
     */
    sel: function(s, c) {
      return tooly.select(s, c);
    },

    /**
     * wrapper for HTML5 `querySelectorAll`
     * 
     * @param  {String} selector
     * @param  {Object} context       the parent element to start searching from 
     *                                defaults to document if blank 
     * @return {Array<Node>} an array of matched elements or an empty array if no match
     * 
     * @memberOf  tooly
     * @module  dom
     * @static
     */
    selectAll: function(selector, context) {
      var list = (context || document).querySelectorAll(selector),
          els = [], i = 0, len = list.length;
      for (; i < len; i++) {
        els[i] = list[i];
      }
      return els;
    },

    /*!
     * alias for #selectAll
     */
    selAll: function(s, c) {
      return tooly.selectAll(s, c);
    },    

    /**
     * select the parent element of `el`.
     * 
     * @param  {Element|String} el the node element or valid css selector string
     *                             representing the element whose parent will be selected
     * @return {Element|null} the parent element of `selector` or null if no parent is found
     *
     * @memberOf  tooly
     * @module  dom
     * @static
     */
    parent: function(el) {
      if (!_node(el)) el = tooly.select(el);
      return el != null ? el.parentNode : null;
    },

    /**
     * select all first-generation child elements of `el`.
     *     
     * @param  {Element|String} el the element or valid css selector string representing
     *                             the element whose children will be returned 
     * @return {Array<Element>|null} an array of children (converted from HTMLCollection) 
     *                                  or null if `el` has no children
     * @memberOf  tooly
     * @module  dom
     * @static
     */
    children: function(el) {
      if (!_node(el)) el = tooly.select(el);
      return el != null 
        ? (function() {
            var childs = el.children, converted = [], i = 0, len = childs.length;
            for (; i < len; i++) {
              converted.push(childs.item(i));
            }
            return converted;
          })()
        : null;
    },

    /**
     * @example
     * // as key val pair (key must also be a string)
     * var el = tooly.select('#main');
     * tooly.css(el, 'background', 'red');
     * // or as hash (notice that hyphenated keys must be quoted)<br>
     * tooly.css(el, {width: '100px', background: 'red', 'font-size': '24px'});
     *
     * // also can take valid css selector string in place of element
     * // below will match the document's first div
     * tooly.css('div', 'border', '2px solid red');
     * 
     * @param  {Element|String}  el     the dom element or valid selector string
     * @param  {String|Object}  styles  either a single comma separated key value pair of strings,
     *                                  or object hash
     * @return {Object} tooly for chaining
     * 
     * @memberOf  tooly
     * @module  dom
     * @static
     */
    css: function(el, styles) {
      var _keyInStyles = function(el, styles) {
        for (var key in styles) {
          if (styles.hasOwnProperty(key)) {
            el.style[key] = styles[key];
          } 
        }
      };

      if (_type(el, 'array')) {
        if (arguments.length === 3) {
          for (var i = 0, len = el.length; i < len; i++) {
            el[i].style[arguments[1]] = arguments[2];
          }
          return tooly;
        } else {
          for (var i = 0, len = el.length; i < len; i++) {
            _keyInStyles(el[i], styles);
          }
          return tooly;
        }
      } else if (!_node(el)) {
        el = tooly.select(el);
      }

      if (arguments.length === 3) {
        el.style[arguments[1]] = arguments[2];
      } else {
        _keyInStyles(el, styles);
      }
      return tooly;
    },

    /**
     * The Selector class provides a jQuery style wrapper around all 
     * tooly#dom methods except for #select and #selectAll. 
     * Selection instead is done on the Selector constructor, which will keep
     * an internal reference to a selectAll query on the passed `el`. All dom
     * methods that can be called directly from tooly can instead be called
     * from the Selector instance without their first argument, for example:
     * `tooly.css('.myDiv', {color:'red'})` and 
     * `tooly.Selector('.myDiv').css({color:'red'})` are equivalent. It is also
     * important to note that all methods return the instance for easy chainability,
     * expect when either `css()` or `html()` are called without any arguments, which makes
     * them getters. Methods `parent` and `children` will return the instance as well, 
     * instead setting the internal selection reference to the parents or children of the 
     * previous selection, for example, with markup `<div><p></p></div>`, 
     * `tooly.Selector('p').parent().css('background', 'orange');` would change the div's 
     * background orange.
     * 
     * 
     * Another usage example:
     * @example
     * // alias the selector namespace
     * var $ = tooly.Selector;
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
     *   
     * @param {Element} el valid css selector string, can contain multiple 
     *                     selectors separated my commas (see the example)
     * @constructor
     * @class Selector
     * @module  dom
     * @memberOf  tooly
     * @static                    
     */
    Selector: function(el) {
      if (!(this instanceof tooly.Selector)) {
        return new tooly.Selector(el);
      }
      this.el = tooly.selectAll(el);
      return this;
    },


//    +---------------+
//    | OBJECT MODULE |
//    +---------------+
    
    /**
     * @param  {Function} ctor 
     * @param  {Object|Array} args 
     * @return {Object}
     * 
     * @memberOf  tooly
     * @module  object
     * @static      
     */
    construct: function(ctor, args) {
      // the stupid name leads to more revealing output in logs
      function ToolySurrogateConstructor() {
        return (_type(args) === 'array') 
          ? ctor.apply(this, args) 
          : ctor.call(this, args);
      }
      ToolySurrogateConstructor.prototype = ctor.prototype;
      return new ToolySurrogateConstructor();
    },

    /**
     * quick and dirty port of node.extend
     * https://github.com/dreamerslab/node.extend
     * which is in turn a port of jQuery.extend, slightly modified for tooly compatibility.
     * Copyright 2011, John Resig
     * Dual licensed under the MIT or GPL Version 2 licenses.
     * http://jquery.org/license
     * 
     * @see  http://api.jquery.com/jquery.extend/ for usage info
     * 
     * @memberOf  tooly
     * @module  object
     * @static
     */     
    extend: function() {
      var target = arguments[0] || {},
          i = 1,
          length = arguments.length,
          deep = false,
          options, name, src, copy, copy_is_array, clone;

      // Handle a deep copy situation
      if (_type(target) === 'boolean') {
        deep = target;
        target = arguments[1] || {};
        // skip the boolean and the target
        i = 2;
      }

      // Handle case when target is a string or something (possible in deep copy)
      if (_type(target) !== 'object' && _type(target) !== 'function') {
        target = {};
      }

      for (; i < length; i++) {
        // Only deal with non-null/undefined values
        options = arguments[i]
        if (options != null) {
          if (_type(options) === 'string') {
            options = options.split('');
          }
          // Extend the base object
          for (name in options) {
            src = target[name];
            copy = options[name];

            // Prevent never-ending loop
            if (target === copy) {
              continue;
            }

            // Recurse if we're merging plain objects or arrays
            if (deep && copy && 
                (tooly.isHash(copy) || (copy_is_array = _type(copy) === 'array'))) {
              if (copy_is_array) {
                copy_is_array = false;
                clone = src && _type(src) === 'array' ? src : [];
              } else {
                clone = src && tooly.isHash(src) ? src : {};
              }

              // Never move original objects, clone them
              target[name] = tooly.extend(deep, clone, copy);

            // Don't bring in undefined values
            } else if (typeof copy !== 'undefined') {
              target[name] = copy;
            }
          }
        }
      }

      // Return the modified object
      return target;
    },

    /**
     * Object literal assignment results in creating an an object with Object.prototype
     * as the prototype. This allows us to assign a different prototype while keeping 
     * the convenience of literal literation.
     * 
     * @param  {Object} prototype
     * @param  {Object} object    
     * @return {Object}
     * 
     * @author Yehuda Katz (slightly modified)
     * @see http://yehudakatz.com/2011/08/12/understanding-prototypes-in-javascript/
     * 
     * @memberOf  tooly
     * @module  object
     * @static 
     */
    fromPrototype: function(prototype, object) {
      var newObject = tooly.objectCreate(prototype), prop;
      for (prop in object) {
        if (object.hasOwnProperty(prop)) {
          newObject[prop] = object[prop];      
        }
      }
      return newObject;
    },

    /*!
     * alias for #fromPrototype
     */
    fromProto: function(prototype, object) {
      return tooly.fromPrototype(prototype, object);
    },

    /**
     * Helper to perform prototypal inheritance.
     * Note that this method overwrites the child's original prototype.
     * Also note that the child's constructor needs to call `parent.call(this)`
     *
     * @example
     * function Parent() {}
     * Parent.prototype.b = 2;
     * function Child() { Parent.call(this); } // this is a must
     * tooly.inherit(Parent, Child, { a: 1 });
     * var child = new Child();
     * console.log(child.a + child.b); //=> 3
     * // for a more practical example see the tooly.Handler documentation.
     * 
     * @param  {Function} parent
     * @param  {Function} child  
     * @param  {Mixed} extend additional members to the Child's prototype 
     * 
     * @memberOf  tooly
     * @module  object
     * @static
     */
    inherit: function(parent, child, extend) {
      child.prototype = new parent();
      child.prototype.constructor = child;
      for (var prop in extend) {
        if (extend.hasOwnProperty(prop)) {
          child.prototype[prop] = extend[prop];
        }
      }
    },

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
     * @module  object
     * @static
     */
    isHash: function(val) {
      return _type(val) === 'object' && val.constructor === Object && 
        !val.nodeType && !val.setInterval;
    },


    /**
     * function version of ECMA5 Object.create
     * 
     * @param  {Object} o  the object/base prototype
     * @return {Object}    new object based on o prototype
     * 
     * @memberOf  tooly
     * @module  object
     * @static
     */
    objectCreate: function(o) {
      var F = function() {};
      F.prototype = o;
      return new F();
    },
    
    /**
     * Equivalent of Object.keys(obj).length
     * 
     * @param  {Object} obj the object whose ownProperties we are counting
     * @return {number}     the number of "ownProperties" in the object
     * 
     * @memberOf  tooly
     * @module  object
     * @static
     */
    propCount: function(obj) {
      var count = 0, o;
      for (o in obj) {
        if (obj.hasOwnProperty(o)) {
          count++;
        }
      }
      return count;
    },

    /**
     * get an array of an object's "ownProperties"
     * 
     * @param  {Object} obj     the object of interest
     * @return {Array[Object]} the "hasOwnProperties" of obj
     * 
     * @memberOf  tooly
     * @module  object
     * @static
     */
    propsOf: function(obj) {
      var props = [], o;
      for (o in obj) {
        if (obj.hasOwnProperty(o)) {
          props.push(o);
        }
      }
      return props;
    },


//    +------------+
//    | XHR MODULE |
//    +------------+
    /**
     * perform a get xhr request for JSON file
     * 
     * @param  {String}   jsonFile  url
     * @param  {callback} success   function to operate on response data
     *                              if the request is successful. If so, success
     *                              takes a single data parameter (the response).
     * @param {Boolean}   async     defaults to true
     */
    getJSON: function(jsonFile, success, async) {
      tooly.get(jsonFile, 'json', success, async);
    },

    /**
     * perform a get xhr request
     * 
     * @param  {String}   url       url to resource
     * @param  {String}   respType  the request responseType
     * @param  {callback} success   function to operate on response data
     *                              if the request is successful. If so, success
     *                              takes a single data parameter (the response).
     * @param {Boolean}   async     defaults to true
     */
    get: function(url, respType, success, async) {
      var req = new XMLHttpRequest();
      req.open('get', url, (arguments.length === 3) ? true : async);
      req.reponseType = respType;
      req.onload = function() {
        if (req.readyState == 4) { // done
          if (req.status == 200) success(req.response);
        }
      };
      req.send();
    },


//    +-------------+
//    | CORE MODULE |
//    +-------------+
    /**
     * Function version of ECMAScript6 String.prototype.endsWith
     * @param  {String} str    the string to check
     * @param  {String} suffix the "endWith" we are seeking
     * @return {Boolean}       true if str ends with suffix
     * @see <a href="http://stackoverflow.com/a/2548133">stackoverflow thread</a>
     * @memberOf tooly
     */
    endsWith: function(str, suffix) {
      return str.indexOf(suffix, str.length - suffix.length) !== -1;
    },

    /**
     * Function version of String.format / sprintf
     * @see  http://stackoverflow.com/a/4673436/2416000
     * @param  {String} format
     * @return {String} 
     * @memberOf tooly
     */
    format: function(format) {
      var args = Array.prototype.slice.call(arguments, 1);
      return format.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
      });
    },

    /**
     * Utility method to convert milliseconds into human readable time format hh:mm:ss
     * 
     * @param  {Number} time - the time value in milliseconds
     * @return {String}      - human readable time
     * @memberOf tooly
     */
    formatTime: function(time) {
      var h = Math.floor(time / 3600),
          m = Math.floor((time - (h * 3600)) / 60),
          s = Math.floor(time - (h * 3600) - (m * 60));
      if (h < 10) h = '0' + h;
      if (m < 10) m = '0' + m;
      if (s < 10) s = '0' + s;
      return h + ':' + m + ':' + s;
    },

    /**
     * Function version of ECMAScript6 String.prototype.repeat without the silly
     * range error checks etc.
     * 
     * @param  {String} str   the string to repeat
     * @param  {Number} n     the number of times to repeat
     * @return {String}       the string repeated, or an empty string if n is 0
     * @memberOf tooly
     */
    repeat: function(str, n) {
      var s = '', i = 0;
      for (; i < n; i++) {
        s += str;
      }
      return s;
    },

    /**
     * scale a number from one range to another
     * 
     * @param  {Number} n      the number to scale
     * @param  {Number} oldMin 
     * @param  {Number} oldMax 
     * @param  {Number} min    the new min
     * @param  {Number} max    the new max
     * @return {Number}        the scaled number
     * @memberOf tooly
     */
    scale: function(n, oldMin, oldMax, min, max) {
      return (((n-oldMin)*(max-min)) / (oldMax-oldMin)) + min; 
    },

    /**
     * Extracts final relative part of url, optionally keeping forward,
     * backward, or both slashes. By default both front and trailing slashes are removed
     *
     * @param {String}  url           the url or filepath
     * @param {Boolean} preSlash      keeps slash before relative part if true
     * @param {Boolean} trailingSlash keeps last slash after relative part if true.
     *                                note thatsliceRel does not add a trailing slash if it wasn't
     *                                there to begin with
     * @return {String}                               
     * @memberOf tooly
     */
    sliceRel: function(url, preSlash, trailingSlash) {
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
      if (hasTrailing && trailingSlash) { 
        url = url.concat('/'); 
      }
      if (preSlash) { 
        url = '/' + url;
      }
      return url;
    },

    /**
     * get the extension of a file, url, or anything after the last `.` in a string.
     *
     * @param {String} str the string
     * @return {String}
     *
     * @alias ext
     */
    extension: function(str) {
      return str.substring(str.lastIndexOf('.')+1);
    },

    /*!
     * alias for extension
     */
    ext: function(str) {
      return tooly.extension(str);
    },

    /**
     * Get a copy of `str` without file extension, or anything after the last `.`
     * (does not change the original string)
     * 
     * @param  {String} str the string to copy and strip
     * @return {String}     the copied string with file extension removed
     *
     * @alias stripExt
     */
    stripExtension: function(str) {
      return str.substring(0, str.lastIndexOf('.'));
    },

    /*!
     * alias for stripExtension
     */
    stripExt: function(str) {
      return tooly.stripExtension(str);
    },

    /**
     * Inorant error message to ease my frustrations
     * 
     * @param  {String} mess additional error message details to add
     *
     * @memberOf tooly
     * @module core
     * @static
     */
    shit: function(mess) {
      console.error('shitError - something is fucking shit up: ' + mess);
    },

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
     * @alias type, typeof
     * 
     * @author Angus Croll
     * @see  http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator
     * 
     * @memberOf tooly
     * @module core
     * @static
     */
    toType: function(obj, klass) {
      return _type(obj, klass);
    },

    /*! @alias for #toType */
    type:   function(o, k) { return _type(o, k); },

    /*! @alias for #toType */
    typeof: function(o, k) { return _type(o, k); },


//    +----------------+
//    | HANDLER MODULE |
//    +----------------+
    
    /**
     * Constructor.
     * 
     * @class  Handler
     * @constructor
     * @param {Object}  context   (optional) designates the owner of the `handlers` array that holds 
     *                            all callbacks. When blank the Handler instance uses its own internal
     *                            array. If you'd like to keep track of the handlers outside of the
     *                            instance, pass a context such that context.handlers is an array.
     */
    Handler: function(context) {
      if (!(this instanceof tooly.Handler)) {
        return new tooly.Handler(context);
      }
      this.context = context || this;
      this.handlers = this.context.handlers = {};
      return this;
    },
    

//    +-------+
//    | TIMER |
//    +-------+

    Timer: function(name) {
      // enable instantiation without new
      if (!(this instanceof tooly.Timer)) {
        return new tooly.Timer(name);
      }
      this.name = name || 'Timer_instance_' + Date.now();
      return this; 
    },


//    +--------+
//    | LOGGER |
//    +--------+

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
     * @example
     * ```js
     * var logger = new tooly.Logger(2, 'kompakt');
     * logger.trace(logger); // will not run
     * ```
     * 
     * @param {Number} level set the level of this logger. Defaults to 2 (debug) if no
     *                       arguments are passed.
     * @param {String} name  optional name to identify this instance. The name will preceed any
     *                       output message
     *
     * @module Logger
     * @class  Logger
     * @constructor
     * @memberOf  tooly
     * @static
     */
    Logger: function(level, name) {
      // enable instantiation without new
      if (!(this instanceof tooly.Logger)) {
        return new tooly.Logger(level, name);
      }
      this.level = (level !== undefined) ? level : 2;
      if (name) this.name = name;

      // automatically set this false as its only 
      // for emergency "must track anonymous function location" purposes
      this.traceAnonymous = false;
      
      return this;
    },


  };
})();

tooly.Selector.prototype = {

  hasClass: function(klass) {
    tooly.hasClass(this.el, klass);
    return this;
  },

  addClass: function(klass) {
    tooly.addClass(this.el, klass);
    return this;
  },

  removeClass: function(klass) {
    tooly.removeClass(this.el, klass);
    return this;
  },

  prepend: function(content) {
    tooly.prepend(this.el);
    return this;
  },

  append: function(content) {
    tooly.append(this.el);
    return this;
  },

  html: function(content) {
    tooly.html(this.el, content);
    return this;
  },

  parent: function() {
    tooly.parent(this.el);
    return this;
  },

  children: function() {
    tooly.children(this.el);
    return this;
  },
  
  css: function() {
    var args = [this.el];
    Array.prototype.push.apply(args, arguments);
    tooly.css.apply(null, args);
    return this;
  }
};

tooly.Handler.prototype = {

  /**
   * Register an event handler for a named function.
   * 
   * @param  {(String|Function)} fn   the function that will call the handler when executed
   * @param  {callback}   handler the handler that we be called by the named function
   * @return {Object} `this` for chaining
   * 
   * @memberOf  Handler
   * @instance
   * @method
   */
  on: function(fn, handler) {
    if (this.handlers[fn] === undefined) {
      this.handlers[fn] = [];
    }
    this.handlers[fn].push(handler);
    return this;
  },

  /**
   * Remove all handlers. Any subsequent call to #executeHandler will have no effect.
   *
   * @memberOf Handler
   * @module  Handler
   * @instance
   */
  removeAll: function() {
    this.handlers = {};
  },

  /**
   * Remove all handler's attached to `fn`. All subsequent calls to 
   * `executeHandler(fn)` will no longer have an effect.
   * 
   * @param  {Function} fn the named function that executes handler(s)
   * 
   * @memberOf Handler
   * @module  Handler
   * @instance
   * @alias #off
   */
  remove: function(fn) {
    if (this.handlers[fn] !== undefined) {
      this.handlers[fn].length = 0;
    }
  },

  /*!
   * alias for #remove
   */
  off: function(fn) {
    this.remove(fn);
  },

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
   * @memberOf  Handler
   * @instance
   * @method
   * @alias #exec #trigger
   */
  executeHandler: function(fn) {
    var handler = this.handlers[fn] || [],
        i = 0, len = handler.length;
    for (; i < len; i++) {
      handler[i].apply(this.context, []);
    }
    return this;
  },

  /*!
   * alias for #executeHandler
   */
  exec: function(fn) {
    return this.executeHandler(fn);
  },

  /*!
   * alias for #executeHandler
   */
  trigger: function(fn) {
    return this.executeHandler(fn);
  },

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
   * @memberOf  Handler
   * @instance
   * @method
   */
  registerCallbacks: function(callbacks) {
    var t = this, h = {};
    if (callbacks !== undefined) {
      for (h in callbacks) {
        if (callbacks.hasOwnProperty(h)) {
          t.on(h, callbacks[h]);
        }
      }
    }
    return t;
  },

  /**
   * @return {String}
   * @memberOf Handler
   * @module  Handler
   * @instance
   */
  toString: function() { 
    return "[Handler ' " + this + " ']"; 
  }
};


tooly.Timer.prototype = (function() {

  var _start, _end, _elapsed;

  return {

    /**
     * Start the timer
     *
     * @memberOf  Timer
     * @instance
     * @module Timer
     */
    start: function() { 
      _start = Date.now(); 
    },

    /**
     * Stop the timer
     * 
     * @return {Number} the time elapsed in milliseconds
     *
     * @memberOf  Timer
     * @instance
     * @module Timer
     */
    stop: function() { 
      _end = Date.now();
      _elapsed = _end - _start;
      return _elapsed; 
    },

    /**
     * Stop the timer and log the results to the console.
     * Equivalent of calling #stop then #log
     * 
     * @return {Number} the time elapsed in milliseconds
     *
     * @memberOf  Timer
     * @instance
     * @module Timer
     */
    end: function() {
      this.stop();
      this.log();
      return _elapsed;
    },

    /**
     * log results to the console
     *
     * @memberOf  Timer
     * @instance
     * @module Timer
     */
    log: function() {
      console.log(this.name + ' ' + _elapsed);
    }
  }
})();

tooly.Logger.prototype = (function() {

  var _cjs = typeof exports === 'object',
      _slice = Array.prototype.slice,
      _push = Array.prototype.push,
      _chalk = _cjs ? require('chalk') : null
      _levels = ['dummy','trace','debug','info','warn','error'],
      _colors = ['gray', // dummy
        'gray',
        'green',
        _cjs ? 'cyan' : 'blue',
        _cjs ? 'yellow' : 'darkorange',
        'red',
        'gray' // last gray for time
      ]; 
      // _colors = {'800080','008000','0000FF','FFA500','FF0000'};
      
  function _log(instance, level, caller, args) {
    if (instance.level === -1 || level < instance.level || instance.level > 5) return;

    args = _slice.call(args);
    var format = '%s%s', // name, [LEVEL] [HH:mm:ss]
        pargs = []; // final args for console call

    if (_cjs) {
      if (tooly.type(args[0], 'string') && args[0].match(/\%(s|j|d)/g)) {
        format += args.shift();
      }
      pargs.unshift(format, _name(instance), _level(level));

    } else { // window
      // TODO: string output in Chrome is more readable within array,  
      // format %s the same way
      
      format = '%c%s%c%s%c%s';
      if (tooly.type(args[0], 'string') && args[0].match(/\%(c|s|o|O|d|i|f)/g)) {
        format += args.shift();
      }
      caller = (caller.replace(/\s+/, '') === '') ? '' : caller + ' \t';
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
    var name = args.callee.caller.name;
    if (!name && this.traceAnonymous) {
      return  '<anonymous> ' + args.callee.caller + '\n';
    }
    return name;
  }

  // helper
  function _name(instance) {
    var name = instance.name || '';
    return (_chalk) ? _chalk.magenta(name) : name;
  }

  // helper
  function _level(level) {
    return _chalkify(level, ' ' + _levels[level].toUpperCase() + ' ') +
      _chalkify(6, '[' + new Date().toLocaleTimeString() + '] ');
  }

  // use chalk if node.js
  function _chalkify(level, str) {
    return (!_chalk) ? str : _chalk[ _colors[level] ](str);
  }

  // public API
  return {
    log:   function() { _log(this, 0, _checkCaller(arguments), arguments); },
    trace: function() { _log(this, 1, _checkCaller(arguments), arguments); },
    debug: function() { _log(this, 2, _checkCaller(arguments), arguments); },
    info : function() { _log(this, 3, _checkCaller(arguments), arguments); },
    warn : function() { _log(this, 4, _checkCaller(arguments), arguments); },
    error: function() { _log(this, 5, _checkCaller(arguments), arguments); }
  };
})();



/** @namespace  Lap */

/*>>*/
var logger = new tooly.Logger(2, 'Lap');
/*<<*/

/**
 * @type {Number}
 * @memberOf  Lap
 * @static
 */
Lap.idGen = (Lap.idGen || 0) + 1;

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
function Lap(container, lib, options) {
  // init parent's instance
  tooly.Handler.call(this);

  var lap = this;

  lap.name = 'Lokua Audio Player';
  lap.version = '0.0.5';
  lap.doc = 'http://lokua.net/lap/0.0.5/doc/';

  var _defaults = {
    trace: false, // ultra specific logging
    debug: false,
    startingTrackIndex: 0,
    startingAlbumIndex: 0,
    volumeInterval: 0.05,
    seekInterval: 5, // seconds
    seekTime: 250, // milliseconds
    prependTrackNumbers: true,
    trackNumberPostfix: ' - ',
    replacementText: void 0,
    elements: {
      albumTitle:           '.lap-album-title',
      artist:               '.lap-artist',
      buffered:             '.lap-buffered',
      control:              '.lap-control',
      controls:             '.lap-controls',
      cover:                '.lap-cover',
      currentTime:          '.lap-current-time',
      discog:               '.lap-discog',
      duration:             '.lap-duration',
      info:                 '.lap-info', // button
      infoPanel:            '.lap-info-panel',
      next:                 '.lap-next',
      nextAlbum:            '.lap-next-album',
      playPause:            '.lap-play-pause',
      playlist:             '.lap-playlist', // button
      playlistPanel:        '.lap-playlist-panel',
      playlistTrackNumber:  '.lap-playlist-track-number',
      prev:                 '.lap-prev',
      prevAlbum:            '.lap-prev-album',
      seekBackward:         '.lap-seek-backward',
      seekForward:          '.lap-seek-forward',
      seekbar:              '.lap-seekbar',
      trackNumber:          '.lap-track-number', // the currently cued track
      trackTitle:           '.lap-track-title',
      volumeButton:         '.lap-volume-button',
      volumeDown:           '.lap-volume-down',
      volumeRead:           '.lap-volume-read',
      volumeSlider:         '.lap-volume-slider',
      volumeUp:             '.lap-volume-up'
    },
    callbacks: {},
    plugins: {}
  };

  /**
   * Psuedo constructor
   * @inner
   */
  var init = (function() {

    /**
     * the id of this player. note that player id counting starts at 1, and that
     * this id refers to the last time this <code>new Lap(...)</code> was called, regardless
     * of the reference it was assigned to.
     * @example
     * var lap_1 = new Lap() //=> id === 1
     * var lap_2 = new Lap() //=> id === 2
     * lap_1 = new Lap(...)  //=> id === 3! not 1!
     * @name id
     * @memberOf  Lap
     * @instance
     * @type {number}
     */
    lap.id = Lap.idGen++;

    /**
     * Settings are the combination of defaults extended with the options
     * passed into the class constructor. See the {@tutorial settings} example for a complete list.
     * 
     * @name settings
     * @memberOf  Lap
     * @instance
     * @type {Object.<Object, ?>}
     */
    lap.settings = tooly.extend({}, true, _defaults, options);

    /**
     * The upper-most parent element of the player as passed to the constructor.
     * @name $container
     * @memberOf  Lap
     * @instance
     * @type {Object}
     */
    lap.$container = (container.nodeType === 1) ? container : tooly.select(container);

    /**
     * Provides the audio file source(s) and data in a number of different ways.
     * See the {@tutorial lib} example tutorial.
     * @name lib
     * @memberOf  Lap
     * @instance
     * @type {Object}
     * @see  Lap.libType
     */
    lap.lib = lib;
    /**
     * the type of player library we dealing with:<br>
     * <code><b>string</b></code> signifies a single track player<br>
     * <code><b>object</b></code> signifies a single album<br>
     * <code><b>array</b></code> represents a mutliple albums<br>
     * @name libType
     * @memberOf  Lap
     * @instance
     * @type {string}
     * @see  Lap.lib
     */
    lap.libType = tooly.toType(lap.lib);
    /**
     * holds a reference to the currently selected album's files.
     * @name  files
     * @memberOf  Lap
     * @instance
     * @type {Array}
     */
    lap.files = [];
    /**
     * holds a reference to the currently selected album's trackTitles
     * @name  trackTitles
     * @memberOf  Lap
     * @instance
     * @type {Array}
     */
    lap.trackTitles = [];
    /**
     * The physical control and properties visible to the user
     * @name AudioPlayer
     * @memberOf  Lap#$els
     * @instance
     * @type {Object.<Object, jQuery>}
     */
    lap.$els = lap.settings.elements;
    /**
     * @name handlers
     * @memberOf  Lap
     * @instance
     * @type {Object.<string, Array.<callback>>}
     */
    lap.handlers = {};
    /**
     * @name audio
     * @memberOf  Lap
     * @instance
     * @type {Audio}
     */
    lap.audio = {};
    /**
     * "track" and "file" refer to the same thing - 
     * the currently qued song-file
     * @name index
     * @memberOf  Lap
     * @instance
     * @type {number}
     */
    lap.trackIndex = lap.settings.startingTrackIndex;
    /**
     * Only relevant if libType === 'array'
     * @name albumIndex
     * @memberOf  Lap
     * @instance
     * @type {number}
     */
    lap.albumIndex = lap.settings.startingAlbumIndex;
    /**
     * the number of tracks/files {@link AudioPlayer#lib} contains
     * @name trackCount
     * @memberOf  Lap
     * @instance
     * @type {number}
     */
    lap.trackCount = {};

    lap.albumTitle  = '';
    lap.trackTitle  = '';
    lap.artist      = '';
    lap.cover       = '';
    lap.replacement = '';

    lap.updateCurrent();
    lap.initAudio();
    lap.initElements(_defaults.elements);
    lap.addListeners();
    lap.registerCallbacks(lap.settings.callbacks);
    lap.initPlugins();
    lap.load();

    /*>>*/
    logger.debug('post initialize -> <instance>.id: %i, <instance>.*: %o', lap.id, lap);
    /*<<*/
  })();

  return lap;
}

tooly.inherit(tooly.Handler, Lap, (function() {

  var seeking = false,
      mouseDownTimer;

  function _parseReplacement(replacement) {
    if (replacement !== undefined) {
      // replacement may be a single string or regexp.
      // for replacment without value specified, assume to replace with empty string
      if (tooly.toType(replacement) === 'string') {
        replacement = [replacement, ''];
      }
      // replacement may contain string-wrapped regexp (from json), convert if so
      if (tooly.toType(replacement[0]) !== 'regexp') {
        var flags = replacement[2];
        replacement[0] = (flags !== undefined) ? 
          new RegExp(replacement[0], flags) : 
          new RegExp(replacement[0], 'g');
      }
    }      
  }      

  return {

    /**
     * Turn the registered DOM player control elements into selections
     * if they arent' already. In the case that $els === 'auto', the default class
     * names for controls will be used (this is preferred).
     * 
     * @param  {Array.<String>} defaultEls  the list of default class names
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     */
    initElements: function(defaultEls) {
      var t = this, 
          elems, 
          el;
      if (tooly.toType(t.$els) === 'string' && t.$els.toLowerCase() === 'auto')  {
        t.$els = [];
        elems = defaultEls;
      } else {
        elems = t.$els;
      }
      for (el in elems) {
        if (elems.hasOwnProperty(el)) {
          t.$els[el] = tooly.select(elems[el], t.$container);
        }
      }
    },

    /**
     * Creates this player's Audio element ({@link Lap#audio}) 
     * and sets its src attribute to the file located at 
     * {@Link Lap#settings}[{@linkcode startingTrackIndex}]
     * @memberOf  Lap
     * @return {Object} `this` for chaining
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
     * Sets the reference of the current album's files to an array, regardless of whether
     * this player is single, album, or discography based. Used to avoid excessive run-time type
     * identification checks throughout the application.
     * @memberOf  Lap
     */
    updateCurrent: function() {
      var t = this;

      // either something stupid is happening or we are testing
      if (t.libType === 'null' || t.libType === 'undefined') return;

      if (t.libType === 'string') {

        if (tooly.endsWith(t.lib.toLowerCase(), '.json')) {

          tooly.getJSON(t.lib, function(data) {
            t.lib = JSON.parse(data);
          }, false); // sync

          // at this point t.lib is a regular js object, and is either a single unnamed object
          // representing a single album, or a named array containing mutliple albums.
          // using "data" for the array name...
          if (t.lib.data !== 'undefined' && tooly.toType(t.lib.data) === 'array') {
            t.lib = t.lib.data; // no point in hanging on to object-wrapped array
            t.libType = tooly.toType(t.lib);
            t.albumCount = t.lib.length;
            // call this function again to proceed to the ===array block
            t.updateCurrent();
            return;
          }
          t.libType = tooly.toType(t.lib);
          if (t.libType === 'object') {
            t.albumCount = tooly.propCount(t.lib);
            // call this function again to proceed to the ===object block
            t.updateCurrent();
            return;
          }
        }
        // if we end up here, lib is (or should be) just a single file-string
        t.files = [t.lib];
        t.trackTitles = [t.lib]; // TODO: fixme
        // make sure nothing stupid is set
        t.trackIndex = 0;
        t.albumIndex = 0;
        t.startingTrackIndex = 0;
        t.startingAlbumIndex = 0;

      } else if (t.libType === 'object' || t.libType === 'array') {
        var lib = t.libType === 'array' ? t.lib[t.albumIndex] : t.lib;
        t.artist = lib.artist;
        t.album = lib.album;
        t.files = lib.files;
        t.cover = lib.cover;
        t.trackTitles = lib.trackTitles;
        t.replacement = lib.replacement;

      } else {
        throw new TypeError('Lap.lib must be a string, object, or array. See ' + 
          t.doc + 'tutorial-lib.html');
      }

      _parseReplacement(t.replacement);

      if (tooly.toType(t.files) === 'string') {
        t.trackCount = 1;
      } else {
        t.trackCount = t.files.length;
      }
      t.matchTrackTitles();
    },

    /**
     * Places relative file names in place of an empty or mismatched trackTitles array.
     * Also applies any regex specified in settings.replacement
     * @memberOf  Lap
     */
    matchTrackTitles: function() {
      var t = this, i;
      // if mismatch, ignore trackTitles completely
      if (t.trackTitles === undefined || t.trackCount > t.trackTitles.length) {
        t.trackTitles = [];
        for (i = 0; i < t.trackCount; i++) {
          t.trackTitles[i] = tooly.sliceRel(t.files[i].replace('.' + t.getFileType(), ''));
          if (t.replacement !== undefined) {
            t.trackTitles[i] = t.trackTitles[i].replace(t.replacement[0], t.replacement[1]);
          }
        }
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
      var t = this, 
          $els = t.$els,
          audio = this.audio;

      audio.addEventListener('progress', function() {
        tooly.html($els.buffered, t.bufferFormatted());
      });

      audio.addEventListener('timeupdate', function() {
        tooly.html($els.currentTime, t.currentTimeFormatted());
      });

      audio.addEventListener('durationchange', function() {
        tooly.html($els.duration, t.durationFormatted());        
      });

      audio.addEventListener('volumechange', function() {
        tooly.html($els.volumeRead, t.volumeFormatted());
      });

      audio.addEventListener('ended', function() {
        t.next();
        if (t.audio.paused) t.audio.play();
      });
      
      t.registerClick($els.playPause, t.togglePlay);
      t.registerClick($els.prev, t.prev);
      t.registerClick($els.next, t.next);
      t.registerClick($els.volumeUp, t.incVolume);
      t.registerClick($els.volumeDown, t.decVolume);
      t.registerClick($els.prevAlbum, t.prevAlbum);
      t.registerClick($els.nextAlbum, t.nextAlbum);
      // t.registerClick($els.seekbar, t.seekFromSeekbar);

      t.$container.addEventListener('click', function(e) {
        if (tooly.hasClass('lap-playlist-item', e.target)) {
          var wasPlaying = !t.audio.paused;
          t.trackIndex = parseInt(e.target.getAttribute('lap-data-index'));
          t.setSource();
          t.executeHandler('trackChange');
          if (wasPlaying) t.audio.play();
        }
      });

      function addSeekHandlers(el) {
        if (el === null) return;
        el.addEventListener('mousedown', function(e) {
          seeking = true;
          if (tooly.hasClass(e.target, 'lap-seek-forward')) {
            t.seekForward();
          } else {
            t.seekBackward();
          }
        });
        el.addEventListener('mouseup', function(e) {
          seeking = false;
          clearTimeout(mouseDownTimer);
        });
      }
      addSeekHandlers($els.seekForward);
      addSeekHandlers($els.seekBackward);


      this
        .on('load', function() {
          t.updateTrackTitleEl();
          t.updateTrackNumberEl();
          t.updateArtistEl();
          t.updateAlbumEl();
          t.updateCover();
          t.populatePlaylist();
          tooly.addClass($els.playPause, 'lap-paused');
        })
        .on('play', function() {
          tooly.removeClass($els.playPause, 'lap-paused')
            .addClass($els.playPause, 'lap-playing');
        })
        .on('pause', function() {
          tooly.removeClass($els.playPause, 'lap-playing')
            .addClass($els.playPause, 'lap-paused');
        })
        .on('trackChange', function() {
          t.updateTrackTitleEl();
          t.updateTrackNumberEl();
          t.updateCurrentPlaylistItem();
        })
        .on('albumChange', function() {
          t.updateTrackTitleEl();
          t.updateTrackNumberEl();
          t.updateArtistEl();
          t.updateAlbumEl();
          t.updateCover();
          t.populatePlaylist();
        });
    },

    /**
     * Initialize plugins passed to the constructor.
     * Pass plugin constructor that conforms to the following interface:
     * Plugin(lapInstance, args...)
     * 
     * @return {Object} this
     * @memberOf Lap
     */
    initPlugins: function() {
      if (!this.settings.plugins) return;
      this.plugins = this.plugins || {};
      var lap = this,
          plugins = lap.settings.plugins, plugin, name,
          args = [],  
          len = plugins.length, i = 0;
      for (; i < len; i++) {
        plugin = plugins[i];
        if (plugin.ctor) {
          name = plugin.name ? plugin.name : plugin.ctor + '_' + Date.now();
          lap.plugins[name] = (plugin.args) ? 
            tooly.construct(plugin.ctor, args.concat(lap, plugin.args)) :
            tooly.construct(plugin.ctor);
          lap.plugins[name].init();
          
          /*>>*/
          logger.debug('plugin registered -> lap.plugins[%i]: %s', i, name);
          /*<<*/
        }
      }
      return this;
    },

    /**
     * convenience method
     * 
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     */
    registerClick: function($el, cb) {
      var t = this;
      if (!$el) return t;
      $el.addEventListener('click', function() {
        cb.call(t);
      });
      return t;
    },    

    /**
     * @memberOf  Lap
     */
    load: function() {
      this.executeHandler('load');
      return this;
    },

    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    updateTrackTitleEl: function() {
      tooly.html(this.$els.trackTitle, this.trackTitles[this.trackIndex]);
      return this;
    },

    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    updateTrackNumberEl: function() {
      tooly.html(this.$els.trackNumber, this.trackIndex+1);
      return this;
    },

    // TODO: adapt updateCurrent for multiple artist arrays
    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    updateArtistEl: function() {
      tooly.html(this.$els.artist, this.artist);
      return this;
    },

    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    updateAlbumEl: function() {
      tooly.html(this.$els.albumTitle, this.album);
      return this;
    },

    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    updateCover: function() {
      if (this.$els.cover !== null) {
        this.$els.cover.src = this.cover;
      }
      return this;
    },

    /**
     * Toggle the audio element's play state
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    togglePlay: function() {
      var t = this;
      if (t.audio.paused) {
        t.play();
      } else {
        t.pause();
      }
      t.executeHandler('togglePlay');
      return t;
    },

    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    play: function() {
      this.audio.play();
      this.executeHandler('play');
      return this;
    },


    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    pause: function() {
      this.audio.pause();
      this.executeHandler('pause');
      return this;
    },

    /**
     * set the currently qued track/file
     *
     * @deprecated ?? do we ever use this ??
     * @param {number} index the new index; under/overflow will be clamped
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    setTrack: function(index) {
      if (index <= 0) {
        this.trackIndex = 0;
      } else if (index >= this.trackCount) {
        this.trackIndex = this.trackCount-1;
      } else {
        this.trackIndex = index;
      }
      this.executeHandler('trackChange');
      return this;
    },

    /**
     * Populates the tracklist with the current album's trackNames
     * 
     * @return {Object} `this` for chaining
     * @deprecated this method is too implementation specific (beyond the core purpose of Lap)
     *             use #playlistFormatted instead
     * @memberOf  Lap
     */
    populatePlaylist: function() {
      // temporary fix - TODO remove from addListeners callbacks
      // if (true) return;
      var t = this, 
          items = [], 
          i = 0,
          html = '';

      tooly.html(t.$els.playlistPanel, '');

      for (i = 0; i < t.trackCount; i++) {

        html += tooly.format('<div>{0}{1}{2}</div>',
          // 0
          (t.settings.prependTrackNumbers) ? 
            '<span class="lap-playlist-track-number">'+t.trackNumberFormatted(i+1)+'</span>' : '',
          // 1
          '<span class="lap-playlist-item' + ((i === t.trackIndex) ? ' lap-current' : '') + 
            '" lap-data-index="' + i + '">',
          // 2
          t.trackTitles[i].trim() + '</span>'
        );
      }

      tooly.append(t.$els.playlistPanel, html);
    },

    /**
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     */
    playlistFormatted: function() {
      var t = this,
          items = [],
          i = 0;
      for (; i < t.trackCount; i++) {
        items[i] = (t.settings.prependTrackNumbers) ? t.trackNumberFormatted(i+1) : '';
        items[i] += t.trackTitles[i];
      }
      return items;
    },

    /**
     * for use with mutli-album library. get an array of the passed key for all
     * objects in the lib, like 'album' or 'artist'.
     * 
     * @param  {String} prop    the property key
     * @return {Array<String>|Array.<Array>}  an array of all values specified by key
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
     * helper used in populatePlaylist. zero-pads and punctutates the passed track number.
     * 
     * @param  {Number} n the trackNumber to format
     * @return {String}   the formatted trackNumber
     * @memberOf Lap
     */
    trackNumberFormatted: function(n) {
      var padCount = (this.trackCount+'').length - (n+'').length;
      return tooly.repeat('0', padCount) + n + this.settings.trackNumberPostfix;
    },

    /**
     * add 'lap-current' class to playlist item that matches currentIndex.
     * Used as callback by prev, and next methods.
     * 
     * @memberOf Lap
     */
    updateCurrentPlaylistItem: function() {
      var t = this, 
          items = tooly.selectAll('.lap-playlist-item', t.$container),
          len = items.length,
          i = 0;
      for (; i < len; i++)  {
        if (items[i].getAttribute('lap-data-index') == t.trackIndex) {
          tooly.removeClass(items, 'lap-current'); // wastefull, fixme
          tooly.addClass(items[i], 'lap-current');
          return t;
        }
      }
      return t;
    },

    /**
     * Move the previous index in the file que.
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     */
    prev: function() {
      var t = this;
      var wasPlaying = !t.audio.paused;
      t.trackIndex = (t.trackIndex-1 < 0) ? t.trackCount-1 : t.trackIndex-1;
      t.setSource();
      if (wasPlaying) t.audio.play();
      this.executeHandler('trackChange');
      return this; 
    },

    /**
     * Move to the next index in the file que.
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     */
    next: function() {
      var t = this;
      var wasPlaying = !t.audio.paused;
      t.trackIndex = (t.trackIndex+1 >= t.trackCount) ? 0 : t.trackIndex+1;
      t.setSource();
      if (wasPlaying) t.audio.play();
      this.executeHandler('trackChange');
      return this;
    },

    // TODO: find occurances then delete me
    trackChange: function() {
      this.executeHandler('trackChange');
    },

    /**
     * Skip to the previous album in the array of albums.
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     */
    prevAlbum: function() {
      var t = this;
      var wasPlaying = !t.audio.paused;
      t.albumIndex = (t.albumIndex-1 < 0) ? t.albumCount-1 : t.albumIndex-1;
      t.updateCurrent();

      t.trackIndex = 0;
      t.setSource();

      if (wasPlaying) t.audio.play();
      this.executeHandler('albumChange');
      return this;
    },

    /**
     * Skip to the next album in the array of albums.
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     */
    nextAlbum: function() {
      var t = this;
      var wasPlaying= !t.audio.paused;
      t.albumIndex = (t.albumIndex+1 > t.albumCount-1) ? 0 : t.albumIndex+1;
      t.updateCurrent();

      t.trackIndex = 0;
      t.setSource();

      if (wasPlaying) t.audio.play();
      this.executeHandler('albumChange');
      return this;
    },

    /**
     * Increment audio volume by the {@link Lap#settings}[{@linkcode volumeInterval}] amount
     * 
     * @return {Object} `this` for chaining
     * @see #setVolume
     * @memberOf  Lap
     */
    incVolume: function() {
      this.setVolume(true);
      return this;
    },

    /**
     * Decrement audio volume by the {@link Lap#settings}[{@linkcode volumeInterval}] amount
     * 
     * @return {Object} `this` for chaining
     * @see #setVolume
     * @memberOf  Lap
     */
    decVolume: function() {
      this.setVolume(false);
      return this;
    },

    /**
     * increment or decrement audio volume by the 
     * {@link Lap#settings}[{@linkcode volumeInterval}]
     * amount. To register a callback see {@link Lap#volumeChange}.
     * 
     * @param {Boolean}   up - increments volume if true; decrements otherwise
     * @return {Object} `this` for chaining
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
      this.executeHandler('volumeChange');
      // this.volumeChange();
      return this;
    },

    /**
     * Seek backwards in the current track.
     *
     * @return {Object} `this` for chaining
     * @see #seek
     * @memberOf  Lap
     */
    seekBackward: function() {
      if (!seeking) return;
      var t = this;
      mouseDownTimer = setInterval(function() {
        t.seek(false);
      }, t.settings.seekTime);
      return this;
    },

    /**
     * Seek forewards in the current track.
     *
     * @return {Object} `this` for chaining
     * @see #seek
     * @memberOf  Lap
     */
    seekForward: function() {
      if (!seeking) return;
      var t = this;
      mouseDownTimer = setInterval(function() {
        t.seek(true);
      }, t.settings.seekTime);
      return this;
    },

    /**
     * Seek forward or backward in the current track. A single call seeks in the 
     * specified direction by amount set in {@link Lap#settings}[{@linkcode seekInterval}]
     * 
     * @param  {Boolean}   forward if true, seek direction is foreward; backward otherwise
     * @return {Object} `this` for chaining
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
      this.executeHandler('seek');
      return this;
    },

    /**
     * UNDER CONSTRUCTION
     * 
     * @param  {Object} e   event containing mouse parameters
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     */
    seekFromSeekbar: function(e) {
      var t = this,
          seekbar = t.$els.seekbar,
          rect = seekbar.getBoundingClientRect(),
          x = e.clientX - rect.left;
      t.audio.currentTime = (x / rect.width) * t.audio.duration;
      // t.audio.currentTime = tooly.scale(x, 0, seekbar.width, 0, t.audio.duration);
      t.executeHandler('seek');
      return this;
    },

    /**
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
      return (file === undefined) ? '"unknown filetype"' : file.slice(file.length-3);
    },

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
      return isNaN(formatted) ? 0 : formatted;
    },

    /**
     * Get the current track's currentTime property in human readable format
     * 
     * @return {String} human readable time in hh:mm:ss format
     * @see #formatTime
     * @memberOf  Lap
     * @example
     * var volume    = lapInstance.audio.volume; //=> 62.310011
     * var formatted = lapInstance.currentTimeFormatted(); //=> 0:01:02
     */
    currentTimeFormatted: function() {
      var formatted = tooly.formatTime(Math.floor(this.audio.currentTime.toFixed(1)));
      if (this.audio.duration < 3600) {
        return formatted.slice(3); // two digits and the colon
      }
      return formatted;
    },

    /**
     * Get the current track's duration property in human readable format
     * 
     * @return {String} human readable time in hh:mm:ss format
     * @see #formatTime
     * @memberOf  Lap
     * @example 
     * var duration  = lapInstance.audio.duration; //=> 151.222857
     * var formatted = lapInstance.durationFormatted(); //=> 0:02:31
     */
    durationFormatted: function() {
      var formatted = tooly.formatTime(Math.floor(this.audio.duration.toFixed(1)));
      if (this.audio.duration < 3600) {
        return formatted.slice(3);
      }
      return formatted;
    },

    volumeFormatted: function() {
      return Math.round(this.audio.volume * 100);
    },

    /**
     * tooly.js in the Lap build is not global, so here we provide access.
     * 
     * @return {Object} tooly
     */
    getTooly: function() {
      return tooly;
    },

    /**
     * Dump various {@link Lap} and {@link Lap#audio} properties to a string
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    toString: function() {
      return Object.getOwnPropertyNames(this);
    }
  }; // end return
})()); // end anon }, end wrapper ), call wrapper (), end tooly.inherit );


return Lap;


}));
