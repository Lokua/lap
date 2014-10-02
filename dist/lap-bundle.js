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
    toType: function() {
      return _type(arguments);
    },

    /*! @alias for #toType */
    type:   function () { return _type(arguments); },

    /*! @alias for #toType */
    typeof: function () { return _type(arguments); },


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



Lap.RaphaelControls = function(lap, options, init) {

  this.tooly = window.tooly || Lap.prototype.getTooly();
  this.lap = lap;

  var _defSize = 24, 
      _defBarSize = _defSize*4,
      // dual settings for seekbar and volume sloder
      _defBar = { 
        width: _defBarSize,
        height: _defSize/4,
        trackFill: '#eee',
        trackStroke: 'none',
        levelFill: '#888',
        levelStroke: 'none',
        knobFill: '#fff',
        knobStroke: '#ddd',
        knobWidth: 6,
        knobShape: 'circle', // circle or rect
      },
      
      _defaults = {
        padding: 2,
        width: _defSize, 
        height: _defSize,
        background: '#fff',
        fill: '#000',
        stroke: '#000',
        strokeWidth: 1,
        scale: true,
        scaleAmount: 0.95,
        seekStyle: 'buttons', // either 'bar' or 'buttons'
        seekbar: _defBar,
        volumeStyle: 'slider', // either 'slider' or 'buttons'
        volumeSlider: _defBar
      };

  this.settings = this.tooly.extend(true, {}, _defaults, options);

  if (init) this.init();

  return this;
}

Lap.RaphaelControls.prototype = (function() {

  return {

    init: function() {

      var t = this,
          lap = t.lap,
          settings = t.settings;

      t.id  = 'lap-rc-';   // id prefix for objs not effected by css changes
      t.idf = 'lap-rcf-';  // id prefix for css hover fill change
      t.ids = 'lap-rcs-';  // id prefix for css hover stroke change
      t.sliding = false;
      t.attrs = {
        fill: settings.fill,
        stroke: settings.stroke,
        strokeWidth: settings.strokeWidth
      };

      t.draw('playPause');
      t.draw('seekbar');
      if (settings.seekStyle === 'bar') {
        // TODO implement
      } else {
        t.draw('seekBackward');
        t.draw('seekForward');
      }
      t.draw('prev');
      t.draw('next');
      t.draw('info');
      t.draw('playlist');
      t.draw('discog');
      if (settings.volumeStyle === 'slider') {
        t.draw('volumeButton');
        t.draw('volumeSlider');
      } else {
        t.draw('volumeUp');
        t.draw('volumeDown');
      }
      t.draw('download');

      this.pause.hide();

      lap.registerCallbacks({
        togglePlay: function() { 
          if (lap.audio.paused) {
            t.pause.hide();
            t.play.show();
          } else {
            t.play.hide();
            t.pause.show();
          }
        }
      });

      return t;
    },

    draw: function(elem) {

      try {
        this.$el = this.lap.$els[elem];
        if (!this.$el) return this;
      } catch(e) {
        console.info('%o%s%o', e.name, '\n\telem:', elem);
      }

      this.paper = Raphael(this.$el, this.settings.width, this.settings.height);

      switch(elem) {
        case 'playPause': this.play = new Play(this); this.pause = new Pause(this); break;
        case 'seekbar': this.seekbar = new Seekbar(this); break;
        case 'seekBackward': this.seekBackward = new Seek(this, false); break;
        case 'seekForward': this.seekForward = new Seek(this, true); break;
        case 'prev': this.prev = new Skip(this, false); break;
        case 'next': this.next = new Skip(this, true); break;
        case 'volumeUp': this.volumeUp = new Volume(this, true); break;
        case 'volumeDown': this.volumeDown = new Volume(this, false); break;
        case 'volumeButton': this.volumeButton = new VolumeButton(this); break;
        case 'volumeSlider': this.volumeSlider = new VolumeSlider(this); break;
        case 'info': this.info = new Info(this); break;
        case 'playlist': this.playlist = new Playlist(this); break;
        case 'discog': this.discog = new Discog(this); break;
      }

      return this;
    }
  };
})();

function Discog(rc) {

  var settings = rc.settings,
      w = settings.width,
      h = settings.height,
      cx = w/2,
      cy = h/2,
      paper = rc.paper;

  var discog = paper.set();

  var u = cx+cx/2,
      box1 = paper.rect(0, 0, u, u),
      box2 = paper.rect(cx-cx/2, cy-cy/2, u, u);

  box1.node.id = rc.idf + 'discog-box1-' + rc.lap.id;
  box2.node.id = rc.idf + 'discog-box2-' + rc.lap.id;

  discog.push(box1, box2);

  discog.attr({ fill: settings.fill, stroke: settings.background, strokeWidth: 2 });

  return discog;  
}


/**
 * renders a typical info icon; a circle with a blocky `i` in the center        
 */
function Info(rc) {
  
  var settings = rc.settings,
      w = settings.width,
      h = settings.height,
      cx = w/2,
      cy = h/2;

  var paper = rc.paper, 
      info = paper.set(),
      circle = paper.circle(cx, cy, cx)
        .attr({ fill: settings.fill, stroke: settings.stroke, strokeWidth: settings.strokeWidth });

  var attrs = { fill: settings.background, stroke: 'none' },
      d = 2.5, // divisor
      // the dot of the i
      dot  = paper.circle(cx, cy/2, cx/d/1.5).attr(attrs),
      // the stem of the i
      rect = paper.rect(cx-cx/(d*2), cy, cx/d, cy-cy/4).attr(attrs);

  // we don't want rec or dot effected by css hover (only circle)
  circle.node.id = rc.idf + 'info-circle-'   + rc.lap.id;
  dot.   node.id =          'lap-info-dot-'  + rc.lap.id;
  rect.  node.id =          'lap-info-rect-' + rc.lap.id;

  info.push(circle, dot, rect);

  return info; 
}

function Pause(rc) {
  
  var settings = rc.settings,
      w = settings.width,
      h = settings.height;

  var paper = rc.paper,
      pause = paper.set();

  var rect0 = paper.rect(0, 0, w/3, h).attr(rc.attrs),
      rect1 = paper.rect(w-w/3, 0, w/3, h).attr(rc.attrs);

  rect0.node.id = rc.idf + 'pause-rect0-' + rc.lap.id;
  rect1.node.id = rc.idf + 'pause-rect1-' + rc.lap.id;

  pause.push(rect0, rect1);

  return pause; 
}

function Play(rc) {

  var settings = rc.settings,
      w = settings.width,
      h = settings.height,
      cx = w/2,
      cy = h/2;

  // var paper = Raphael(rc.$el, w, h),
  var paper = rc.paper,
      play = paper.path(['M',0,0,'L',w,cy,'L',0,h,'z']).attr(rc.attrs);
      
  play.node.id = rc.idf + 'play-' + rc.lap.id;

  return play;
}

/**
 * renders a mobile-menu style playlist icon 
 * (square with three horizontal lines stacked)
 */
function Playlist(rc) {

  var w = rc.settings.width,
      h = rc.settings.height,
      cx = w/2,
      cy = h/2;

  var paper = rc.paper,
      playlist = paper.set(),
      bh = h/3.75, // bar height
      bar1 = paper.rect(0, 0, w, bh),
      bar2 = paper.rect(0, cy-(bh/2), w, bh),
      bar3 = paper.rect(0, h-bh, w, bh);

  bar1.node.id = rc.idf + 'playlist-button-bar1-' + rc.lap.id;
  bar2.node.id = rc.idf + 'playlist-button-bar2-' + rc.lap.id;
  bar3.node.id = rc.idf + 'playlist-button-bar3-' + rc.lap.id;

  playlist.push(bar1, bar2, bar3).attr(rc.attrs);

  return playlist;
}

function Seek(rc, forward) {
  
  var w = rc.settings.width,
      h = rc.settings.height,
      cx = w/2,
      cy = h/2,
      offs = 0.15,
      paper = rc.paper,
      seek;

  var path = [
    'M', 0 , cy,
    'L', cx, h*offs,
    'L', cx, cy,
    'L', w , h*offs,
    'L', w , h*(1-offs),
    'L', cx, cy,
    'L', cx, h*(1-offs),
    'z'
  ];

  if (forward) {
    seek = paper.path(path).transform(['r',180,cx,cy]);
  } else {
    seek = paper.path(path);
  }
  seek.attr(rc.attrs);

  seek.node.id = rc.idf + 'seek-' + (forward ? 'forward-' : 'backward-') + rc.lap.id;

  return seek; 
}

function Seekbar(rc) {

  var settings = rc.settings,
      ss = settings.seekbar,
      w = ss.width,
      h  = ss.height,
      strokeWidth = settings.strokeWidth,
      tooly = rc.tooly,
      lap = rc.lap,
      audio = lap.audio,
      _mousedown = false,
      $container = lap.$container,
      $el = rc.$el,
      $wrapper = tooly.select('.lap-seekbar', $container),
      p = (h < settings.height) ? (settings.height - h)/2 : 0,  // padding
      pad = 6; // horiz padding

  var paper = rc.paper;
  paper.setSize(w+(pad), settings.height);

  var seekbar = paper.set();

  var track = paper.rect(pad, p, w-pad, h)
    .attr({ fill: ss.trackFill, stroke: ss.trackStroke, strokeWidth: strokeWidth });

  var progress = paper.rect(pad, p, tooly.scale(lap.bufferFormatted(), 0, 100, pad, w-pad), h)
    .attr({ fill: ss.levelFill, stroke: ss.levelStroke, strokeWidth: strokeWidth });

  var playhead = (ss.knobShape === 'rect') ? 
    paper.rect(0, p, ss.knobWidth, h) :
    paper.circle(0, settings.height/2, ss.knobWidth);
  playhead.attr({ fill: ss.knobFill, stroke: ss.knobStroke, strokeWidth: strokeWidth });

  seekbar.push(track, progress, playhead);

  track.node.id    = 'lap-rc-seekbar-track'    + rc.lap.id;
  progress.node.id = 'lap-rc-seekbar-progress' + rc.lap.id;
  playhead.node.id = 'lap-rc-seekbar-playhead' + rc.lap.id;

  seekbar
    .mousedown(function(e) { _mousedown = true; })
    .mousemove(function(e) { 
      if (_mousedown) {
        var dest = (e.offsetX <= pad) ? pad : e.offsetX;
        dest = (e.offsetX >= w-pad) ? w-pad : dest;
        playhead.animate(ss.knobShape === 'rect' ? { x: dest } : { cx: dest });
      }
    })
    .mouseup(function(e) {
      if (_mousedown) {
        audio.currentTime = tooly.scale(e.offsetX, 0, w, 0, audio.duration);
        _mousedown = false;
      }
    });

  audio.addEventListener('progress', function(e) {
    progress.animate({ width: tooly.scale(lap.bufferFormatted(), 0, 100, pad, w-pad) });
  });
  audio.addEventListener('timeupdate', function() {
    if (!_mousedown) {
      var val = tooly.scale(audio.currentTime, 0, audio.duration, pad, w-pad);
      playhead.animate(ss.knobShape === 'rect' ? { x: val } : { cx: val });
    }
  });

  return seekbar;
}

function Skip(rc, forward) {
  
  var w = rc.settings.width,
      h = rc.settings.height,
      cx = w/2,
      cy = h/2,
      seek = {};

  var paper = rc.paper,
      skip = paper.set(),
      path = ['M',0,0,'L',w,cy,'L',0,h,'z'];

  var tri  = (forward) ?  paper.path(path) : 
                          paper.path(path).transform(['r',180,cx,cy]);

  var rextX = (forward) ? w-w/4 : 0,                        
      rect = paper.rect(rextX, 0, w/4, h);

  var pre = (forward) ? 'next-': 'prev-';

  tri .node.id = rc.idf + pre + 'tri-'  + rc.lap.id;
  rect.node.id = rc.idf + pre + 'rect-' + rc.lap.id;

  skip.push(tri, rect).attr(rc.attrs);

  return skip;       
}

/**
 * renders a typical right-facing speaker with sound-wave volume-curves icon.
 * meant only to hide or show an actual volume-slider, though could be used as a multi-level
 * toggle.
 */
function VolumeButton(rc) {

  var settings = rc.settings,
      w = settings.width,
      h = settings.height,
      cx = w/2,
      cy = h/2;

  // var paper = Raphael(rc.$el, w, h),
  var paper = rc.paper,
      button = paper.set();

  // draw the speaker-horn
  var horn = paper
    .path(['M',0,cy/2,'H',cx/2,'L',cx+cx/4,0,'V',h,'L',cx/2,cy+cy/2,'H',0,'z'])
    .attr(rc.attrs);

  // draw the sound-waves
  var d1 = 1.5, 
      d2 = 3,
      curve = ['M',w-cx/d2,cy/d2,'C',w,cy/d1,w,h-cy/d1,w-cx/d2,h-cy/d2],
      vattrs = {
        fill: 'none', 
        stroke: settings.fill, 
        strokeWidth: settings.strokeWidth,
        strokeLineCap: 'round'
      },
      curve1 = paper.path(curve).transform(['t',-2.5,0,'s',0.6]).attr(vattrs),
      curve2 = paper.path(curve).attr(vattrs);

  horn  .node.id = 'lap-rcf-volume-horn-'   + rc.lap.id;
  curve1.node.id = 'lap-rcs-volume-curve2-' + rc.lap.id;
  curve2.node.id = 'lap-rcs-volume-curve3-' + rc.lap.id;

  button.push(horn, curve1, curve2);

  return button;
}

function VolumeSlider(rc) {

  var settings = rc.settings,
      v = settings.volumeSlider,
      w = v.width,
      h  = v.height,
      knobWidth = 6,
      strokeWidth = settings.strokeWidth,
      tooly = rc.tooly,
      $container = rc.lap.$container,
      $el = rc.$el,
      $wrapper = tooly.select('.lap-volume-wrapper', $container),
      paper = rc.paper,
      p = (h < settings.height) ? (settings.height - h)/2 : 0; // padding;

  paper.setSize(w, settings.height);
  var slider = paper.set();

  var track = paper.rect(0, p, w, h)
    // .transform('s1,0.75,0,0')
    .attr({ fill: v.trackFill, stroke: v.trackStroke, strokeWidth: strokeWidth });

  var level = paper.rect(0, p, w * rc.lap.audio.volume, h)
    .attr({ fill: v.levelFill, stroke: v.levelStroke, strokeWidth: strokeWidth });

  var knob = (v.knobShape === 'rect') ? 
      paper.rect((w * rc.lap.audio.volume) - 2, p, knobWidth, h) :
      paper.circle((w * rc.lap.audio.volume) - 2, settings.height/2, knobWidth);
  knob.attr({ fill: v.knobFill,  stroke: v.knobStroke, strokeWidth: strokeWidth });

  track.node.id = 'lap-rc-volume-track' + rc.lap.id;
  level.node.id = 'lap-rc-volume-level' + rc.lap.id;
  knob .node.id = 'lap-rc-volume-knob'  + rc.lap.id;

  slider.push(track, level, knob);

  slider
    .mousedown(function(e) {
      rc.sliding = true;
      level.animate({ width: e.offsetX }, 20);
      knob.animate(v.knobShape === 'rect' ? { x: e.offsetX-2 } : { cx: e.offsetX-2 }, 20);
    })
    .mousemove(function(e) {
      if (rc.sliding) {

        var rect = e.target.getBoundingClientRect(),
            x = (e.clientX - rect.left) / rect.width * this.attrs.width + this.getBBox().x,
            val = tooly.scale(x, 0, w, 0, 1).toFixed(2);

        // happens with circle sometimes.
        if (isNaN(x)) return;

        // bounds check
        x = (x >= w-2) ? w : x;
        x = (val <= 0.05) ? 0 : x;
        val = (val >= 0.99) ? 1 : val;

        level.animate({ width: x }, 20);

        // adjust knob width
        var kx = (x === 0) ? x : x - 2;
        kx = (x === w) ? w-knobWidth : kx;

        try {
          knob.animate(v.knobShape === 'rect' ? { x: kx } : { cx: kx }, 20);
        } catch(e) {
          tooly.debug('knob catch: ', kx, val);
        }

        // hide/show horn waves depending on volume level
        if (val <= 0.666) rc.volumeButton[2].hide();
        if (val >  0.666) rc.volumeButton[2].show();
        if (val <= 0.333) rc.volumeButton[1].hide();
        if (val >  0.333) rc.volumeButton[1].show();

        try {
          rc.lap.audio.volume = val;
        } catch(e) {
          tooly.debug('volume catch: ', kx, val);
        }
      }
    })
    .mouseup(function(e) { rc.sliding = false; });

  // `wrapper` should be container holding both the slider and the volumeButton,
  // in which case hovering over the button will reveal the slider, and leaving the button
  // or slider will again hide the slider.
  $wrapper.addEventListener('mouseenter', function() {
    tooly.removeClass($el, 'lap-hidden');
  });
  $wrapper.addEventListener('mouseleave', function() {
    if (!rc.sliding) tooly.addClass($el, 'lap-hidden');
  });

  return slider;
}

/**
 * render an upward or downward facing arrow icon, depending on the boolean value of up.
 */
function Volume(rc, up) {
  
  var settings = rc.settings,
      w = settings.width,
      h = settings.height,
      cx = w/2,
      cy = h/2;

  var volume = rc.paper
    .path(['M',0,0,'L',w,cy,'L',0,h,'z'])
    .transform(['r', up?-90:90, cx, cy])
    .attr(rc.attrs);

  volume.node.id = rc.idf + 'volume-' + (up?'up-':'down-') + rc.lap.id;
  
  return volume;
}

return Lap;


}));
