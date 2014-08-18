/**
 * lap - version 0.0.5 (built: 2014-08-18)
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
 * @namespace  tooly
 * @type {Object}
 */
var tooly = {

  /**
   * append content to HTML element(s)
   *
   * @param  {String}  content    the content to append
   * @param  {Element} el         the element(s) to append content to
   * @return {Object} tooly for chaining
   */
  append: function(content, el) {
    el = el || document;
    if (tooly.toType(el) === 'array') {
      for (var i = 0, len = el.length; i < len; i++) {
        if (el[i].nodeType === 1) {
          el[i].innerHTML = el[i].innerHTML + content;
        }
      }
      return tooly;
    }
    // if node is not ELEMENT_NODE or DOCUMENT_NODE, do nothing
    if (el.nodeType !== 1 && el.nodeType !== 9) {
      return tooly;
    }
    el.innerHTML = el.innerHTML + content;
    return tooly;
  },

  /**
   * fill DOM element `el` with `content`.
   * *note - replaces existing content
   * 
   * @param  {(String|Element)} content
   * @param  {Element} el      
   * @return {Object} tooly for chaining
   */
  html: function(el, content) {
    el = el || document;
    if (tooly.toType(el) === 'array') {
      for (var i = 0, len = el.length; i < len; i++) {
        if (el[i].nodeType === 1) {
          el[i].innerHTML = content;
        }
      }
      return tooly
    }
    // if node is not ELEMENT_NODE or DOCUMENT_NODE, do nothing
    if (el.nodeType !== 1 && el.nodeType !== 9) {
      return tooly
    }
    el.innerHTML = content;
    return tooly
  },

  /**
   * prepend content to HTML element(s)
   *
   * @param  {String}  content    the content to prepend
   * @param  {Element} el         the element(s) to prepend content to
   * @return {Object} tooly for chaining
   */
  prepend: function(content, el) {
    el = el || document;
    if (tooly.toType(el) === 'array') {
      for (var i = 0, len = el.length; i < len; i++) {
        if (el[i].nodeType === 1) {
          el[i].innerHTML = content + el[i].innerHTML;
        }
      }
      return tooly
    }
    // if node is not ELEMENT_NODE or DOCUMENT_NODE, do nothing
    if (el.nodeType !== 1 && el.nodeType !== 9) {
      return tooly
    }
    el.innerHTML = content + el.innerHTML;
    return tooly
  },

  /**
   * wrapper for HTML5 `querySelector`
   * 
   * @param  {String} selector
   * @param  {Object} context,  the parent element to start searching from 
   *                            defaults to document if blank 
   * @return {Element|null}     the first matched element or null if no match
   */
  select: function(selector, context) {
    context = context || document;
    return context.querySelector(selector);
  },

  /**
   * wrapper for HTML5 `querySelectorAll`
   * 
   * @param  {String} selector
   * @param  {Object} context,      the parent element to start searching from 
   *                                defaults to document if blank 
   * @return {Array.<Element>|null} an array of matched elements or an empty array if no match
   */
  selectAll: function(selector, context) {
    var list = (context || document).querySelectorAll(selector),
        els = [],
        i = 0, len = list.length;
    for (i; i < len; i++) {
      els[i] = list[i];
    }
    return els;
  },


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
    var
      h = Math.floor(time / 3600),
      m = Math.floor((time - (h * 3600)) / 60),
      s = Math.floor(time - (h * 3600) - (m * 60));
    if (h < 10) h = '0' + h;
    if (m < 10) m = '0' + m;
    if (s < 10) s = '0' + s;
    return h + ':' + m + ':' + s;
  },

  /**
   * Object literal assignment results in creating an an object with Object.prototype
   * as the prototype. This allows us to assign a different prototype while keeping the convenience
   * of literal literation.
   * 
   * @param  {Object} prototype
   * @param  {Object} object    
   * @return {Object}
   * @author Yehuda Katz (slightly modified)
   * @see http://yehudakatz.com/2011/08/12/understanding-prototypes-in-javascript/ 
   */
  fromPrototype: function(prototype, object) {
    var newObject = tooly.objectCreate(prototype),
        prop;
   
    for (prop in object) {
      if (object.hasOwnProperty(prop)) {
        newObject[prop] = object[prop];      
      }
    }
   
    return newObject;
  },

  /**
   * alias for #fromPrototype
   */
  fromProto: function(prototype, object) {
    return tooly.fromPrototype(prototype, object);
  },


  /**
   * note - overwrites original child.prototype
   * note - the child's constructor needs to call `parent.call(this)`
   * 
   * @param  {Function} parent
   * @param  {Function} child  
   * @param  {Object} extend additional methods to add to prototype
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
   * function version of ECMA5 Object.create
   * 
   * @param  {Object} o  the object/base prototype
   * @return {Object}    new object based on o prototype
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
   * @memberOf tooly
   */
  propCount: function(obj) {
    var count = 0;
    for (var o in obj) {
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
   * @return {Array.<Object>} the "hasOwnProperties" of obj
   * @memberOf tooly
   */
  propsOf: function(obj) {
    var props = [];
    for (var o in obj) {
      if (obj.hasOwnProperty(o)) {
        props.push(o);
      }
    }
    return props;
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
    var s = '';
    for (var i = 0; i < n; i++) {
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
   * a more useful alternative to the typeof operator
   * 
   * @param  {Object} obj the object
   * @return {String}     the type of object
   * @author Angus Croll
   * @see  <a href=
   * "http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/">
   * related article
   * </a>
   * @memberOf tooly
   */
  toType: function(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
  }
};
'use strict';

/**
 * Constructor.
 * 
 * @class  Handler
 * @constructor
 * @param {Object}  context   (optional) designates the owner of the `handlers` array that holds 
 *                            all callbacks. When blank the Handler instance uses its own internal
 *                            array. If you'd like to keep track of the handlers outside of Handler,
 *                            pass the parent owner of @param `handler` as context.
 */
function Handler(context) {
  this.context = context || this;
  this.context.handlers = [];
  this.handlers = this.context.handlers;
  return this;
}

Handler.prototype = {

  /**
   * Register an event handler for a named function.
   * 
   * @param  {(String|Function)} fn   the function that will call the handler when executed
   * @param  {callback}   handler the handler that we be called by the named function
   * @return {Object} `this` for chaining
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
   * executes all handlers attached to the name function.
   * 
   * @param  {(String|Object)} fn the name of the method to execute
   * @return {Object} `this` for chaining
   * @memberOf  Handler
   * @instance
   * @method
   */
  executeHandler: function(fn) {
    var handler = this.handlers[fn] || [],
        len = handler.length,
        i;
    for (i = 0; i < len; i++) {
      handler[i].apply(this.context, []);
    }
    return this;
  },

  /**
   * alias for #executeHandler
   * @see  #executeHandler
   */
  exec: function(fn) {
    return this.executeHandler(fn);
  },

  /**
   * Add callbacks to the list of handlers. The callbacks must be an object collection of 
   * key-value pairs where the identifier key is the name of a function that calls the executeHandler
   * method with the same name as the key, while the value is the callback 
   * function itself. This method should not be used if only registering a single callback, 
   * for that use {@link #on}.
   * 
   * @param  {Object} handlers  collection of callback functions
   * @return {Object} `this` for chaining
   * @memberOf  Handler
   * @instance
   * @method
   */
  registerCallbacks: function(callbacks) {
    var t = this;
    if (callbacks !== undefined) {
      for (var h in callbacks) {
        if (callbacks.hasOwnProperty(h)) {
          t.on(h, callbacks[h]);
        }
      }
    }
    return t;
  },

  toString: function() { 
    return "[Handler ' " + this + " ']"; 
  }
};

'use strict';

/** DEVELOPMENT */

/** @namespace  Lap */

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
 * @param {jQuery} container    the main wrapper div for the player
 * @param {(Object|JSON)} lib   a JSON or plain old object specifying songs, etc.
 *                              see {@link Audio.Player#lib}
 * @param {Object} options      custom options that override this player's defaults
 * @class Lap
 * @constructor
 */
function Lap(container, lib, options) {
  // init parent's instance
  Handler.call(this);

  var lap = this;

  lap.name = 'Lokua Audio Player';
  lap.version = '0.0.5';
  lap.doc = 'http://lokua.net/lap/0.0.5/doc/';

  var _defaults = {
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
      albumTitle:     '.lap-album-title',
      artist:         '.lap-artist',
      control:        '.lap-control',
      controls:       '.lap-controls',
      cover:          '.lap-cover',
      currentTime:    '.lap-current-time',
      discog:         '.lap-discog',
      duration:       '.lap-duration',
      info:           '.lap-info', // button
      infoPanel:      '.lap-info-panel',
      next:           '.lap-next',
      nextAlbum:      '.lap-next-album',
      playPause:      '.lap-play-pause',
      playlist:       '.lap-playlist', // button
      playlistPanel:  '.lap-playlist-panel',
      prev:           '.lap-prev',
      prevAlbum:      '.lap-prev-album',
      seekBackward:   '.lap-seek-backward',
      seekForward:    '.lap-seek-forward',
      seekbar:        '.lap-seekbar',
      trackTitle:     '.lap-track-title',
      volumeButton:   '.lap-volume-button',
      volumeDown:     '.lap-volume-down',
      volumeRead:     '.lap-volume-read',
      volumeSlider:   '.lap-volume-slider',
      volumeUp:       '.lap-volume-up'
    },
    callbacks: {}
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
     * @name settings
     * @memberOf  Lap
     * @instance
     * @type {Object.<Object, ?>}
     */
    lap.settings = $.extend(true, {}, _defaults, options);

    lap.debug('debug mode is on');

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
    lap.load();
  })();

  return lap;
}

tooly.inherit(Handler, Lap, (function() {

  var seeking = false,
      mouseDownTimer;

  return {
    
    /**
     * convenience method
     * 
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     */
    registerClick: function($el, cb) {
      var t = this;
      if (!($el instanceof $)) $el = $($el);
      if (typeof cb === 'function') {
        $el.on('click', function() {
          cb.call(t.context);
        });
      }
      return t;
    },

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
          o, e;
      if (tooly.toType(t.$els) === 'string' && t.$els.toLowerCase() === 'auto')  {
        t.$els = [];
        for (o in defaultEls) {
          if (defaultEls.hasOwnProperty(o)) {
            t.$els[o] = tooly.select(o, t.$container);
          }
        }
      } else {
        for (e in t.$els) {
          if (t.$els.hasOwnProperty(e)) {
            t.$els[e] = tooly.select(t.$els[e], t.$container);
          }
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
      var fileType = this.getFileType();
      var canPlay = this.audio.canPlayType('audio/' + fileType);
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
          $.ajax({ url: t.lib, dataType: 'json', async: false,
            success: function(res) {
              t.lib = res;
            }
          });
          // at this point t.lib is a regular js object, and is either a single unnamed object
          // representing a single album, or a named array containing mutliple albums.
          // using "data" for the array name...
          if (t.lib.data !== 'undefined' && tooly.toType(t.lib.data) === 'array') {
            t.lib = t.lib.data; // no point in hanging on to object-wrapped array
            t.libType = tooly.toType(t.lib); // reset to correct type
            // call this function again to proceed to the ===array block
            t.updateCurrent();
            return;
          }
          t.libType = tooly.toType(t.lib);
          if (t.libType === 'object') {
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


      if (t.replacement !== undefined) {
        // t.replacement may be a single string or regexp for a match without a supplied
        // replacement value, in which case we assume to replace with empty string
        if (tooly.toType(t.replacement) === 'string') {
          t.replacement = [t.replacement, ''];
        }

        // replacement may contain string-wrapped regexp (from json), convert if so
        if (tooly.toType(t.replacement[0]) !== 'regexp') {
          var flags = t.replacement[2];
          t.replacement[0] = (flags !== undefined) ? 
            new RegExp(t.replacement[0], flags) : 
            new RegExp(t.replacement[0], 'g');
        }
      }

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
      this.audio.src = this.files[this.trackIndex];
    },

    /**
     * Initialize the native audio events as well as the various click events on player controls.
     * @memberOf  Lap
     */
    addListeners: function() {
      var t = this, 
          $els = t.$els,
          // audio events do not bubble and are not delegatable;
          // they to be attached to the actual DOM <audio> element
          $audio = $(t.audio);

      // --- audio listeners
      $audio
        .on('timeupdate', function() {
          tooly.html($els.currentTime, t.currentTimeFormatted());
          t.executeHandler('timeUpdate');
        })
        .on('durationchange', function() {
          tooly.html($els.duration, t.durationFormatted());
        })
        .on('volumechange', function() {
          tooly.html($els.volumeRead, t.volumeFormatted());
        })
        .on('ended', function() {
          t.next();
          if (t.audio.paused) t.audio.play();
        });

      // --- action listeners
      t.registerClick($els.playPause, t.togglePlay);
      t.registerClick($els.prev, t.prev);
      t.registerClick($els.next, t.next);
      t.registerClick($els.volumeUp, t.incVolume);
      t.registerClick($els.prevAlbum, t.prevAlbum);
      t.registerClick($els.nextAlbum, t.nextAlbum);
      t.registerClick($els.seekbar, t.seekFromSeekbar);

      t.$container.addEventListener('click', function(e) {
        var $targ = $(e.target);
        if ($targ.is('.lap-playlist-item')) {
          var wasPlaying = !t.audio.paused;
          t.trackIndex = tooly.int($targ.attr('data-index'));
          t.setSource();
          t.executeHandler('trackChange');
          if (wasPlaying) t.audio.play();
        }
      });

      console.log($els);

      function addSeekHandlers(el) {
        if (el === null) return;

        el.addEventListener('mousedown', function(e) {
          seeking = true;
          if ($(this).is($els.seekForward)) {
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
          t.updateArtistEl();
          t.updateAlbumEl();
          t.updateCover();
          t.populatePlaylist();
          $els.playPause.addClass('lap-play');
        })
        .on('play', function() {
          $els.playPause.removeClass('lap-play').addClass('lap-pause');
        })
        .on('pause', function() {
          $els.playPause.removeClass('lap-pause').addClass('lap-play');
        })
        .on('trackChange', function() {
          t.updateTrackTitleEl();
          t.updateCurrentPlaylistItem();
        })
        .on('albumChange', function() {
          t.updateTrackTitleEl();
          t.updateArtistEl();
          t.updateAlbumEl();
          t.updateCover();
          t.populatePlaylist();
        });
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
      this.trackChange();
      return this;
    },

    /**
     * Populates the tracklist with the current album's trackNames
     * 
     * @return {Object} `this` for chaining
     * @deprecated this method is too implementation specific (beyond the core purpose)
     *             use #playlistFormatted instead
     * @memberOf  Lap
     */
    populatePlaylist: function() {
      // temporary fix - TODO remove from addListeners callbacks
      if (true) return;

      var t = this,
          items = [],
          i,
          s; // temp string
      t.$els.playlistPanel.empty();
      for (i = 0; i < t.trackCount; i++) {
        s = t.settings.prependTrackNumbers ? t.trackNumberFormatted(i+1) : '';
        s += t.trackTitles[i];
        items[i] = $('<div class="lap-playlist-item" data-index="'+i+'">').text(s);
        if (i === t.trackIndex) {
          items[i].addClass('lap-current');
        }
      }
      t.$els.playlistPanel.append(items);
    },

    /**
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     */
    playlistFormatted: function() {
      var t = this,
          items = [],
          i;
      for (i = 0; i < t.trackCount; i++) {
        items[i] = t.settings.prependTrackNumbers ? t.trackNumberFormatted(i+1) : '';
        items[i] += t.trackTitles[i];
      }
      return items;
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
     * @memberOf Lap
     */
    updateCurrentPlaylistItem: function() {
      var t = this, 
          items = t.$container.find('.lap-playlist-item');
      items.each(function() {
        var $t = $(this);
        if ($t.attr('data-index') == t.trackIndex) {
          items.removeClass('lap-current');
          $t.addClass('lap-current');
        }
      });
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
      t.trackChange();
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
      t.trackChange();
      return this;
    },

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
      t.albumIndex = (t.albumIndex-1 <= 0) ? 0 : t.albumIndex-1;
      t.updateCurrent();
      if (wasPlaying) t.audio.play();
      t.albumChange();
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
      t.albumIndex = (t.albumIndex+1 >= t.lib.length) ? 0 : t.albumIndex+1;
      t.updateCurrent();
      if (wasPlaying) t.audio.play();
      // t.executeHandler('nextAlbum');
      t.albumChange();
      return this;
    },


    /**
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     */
    albumChange: function() {
      this.executeHandler('albumChange');
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
      // this.debug('setVolume called');
      var vol = this.audio.volume,
        ival = this.settings.volumeInterval;
      // this.debug('vol, ival: ' + vol + ', ' + ival);
      this.audio.volume = up ?
        (vol + ival >= 1) ? 1 : vol + ival
        : (vol - ival <= 0) ? 0 : vol - ival;
      this.volumeChange();
      return this;
    },

    /**
     * called by {@link Lap.setVolume}, thie method handles the DOM reaction.
     * Rather pointless, as we can just listen to the native audio `volumechange` event
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     */
    volumeChange: function() {
      this.executeHandler('volumeChange');
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
          rect = t.$els.seekbar.getBoundingClientRect();
      t.audio.currentTime = ((e.clientX - rect.left) / rect.width) * t.audio.duration;
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

    /**
     * Get the current track's currentTime property in human readable format
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
        return formatted.slice(2);
      }
      return formatted;
    },

    /**
     * Get the current track's duration property in human readable format
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
        return formatted.slice(2);
      }
      return formatted;
    },

    volumeFormatted: function() {
      return Math.round(this.audio.volume * 100);
    },

    /**
     * Proxy to {@link console.log}. Requires {@link Lap#settings}[{@linkcode debug}] to be 
     * true.
     * @param  {(String|Object)} message - the subject we are logging
     * @memberOf  Lap
     * 
     */
    debug: function(message, object) {
      if (this.settings.debug) {
        var mess = 'Lap[id:' + this.id + '] DEBUG\t' + message;
        console.log(mess + (arguments.length === 2 ? ': ' + object : ''));
        if (object instanceof $) {
          console.log(object);
        }
      }
      return this;
    },

    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    debugProps: function(obj, prefix, postfix) {
      for (var o in obj) {
        if (obj.hasOwnProperty(o)) {
          this.debug((prefix ? prefix : '') + o + (postfix ? postfix : ''));
        }
      }
      return this;
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
