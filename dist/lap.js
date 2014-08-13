
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("lokua-utils/index.js", function(exports, require, module){
'use strict';

/**
 * @namespace  utils
 * @type {Object}
 */
module.exports = { /** @lends utils */

  /**
   * scale a number from one range to another
   * 
   * @param  {Number} n      the number to scale
   * @param  {Number} oldMin 
   * @param  {Number} oldMax 
   * @param  {Number} min    the new min
   * @param  {Number} max    the new max
   * @return {Number}        the scaled number
   * @memberOf utils
   */
  scale: function(n, oldMin, oldMax, min, max) {
    return (((n-oldMin)*(max-min)) / (oldMax-oldMin)) + min; 
  },

  /**
   * Function version of ECMAScript6 String.prototype.repeat without the silly
   * range error checks etc.
   * 
   * @param  {String} str   the string to repeat
   * @param  {Number} n     the number of times to repeat
   * @return {String}       the string repeated, or an empty string if n is 0
   * @memberOf utils
   */
  repeat: function(str, n) {
    var s = '';
    for (var i = 0; i < n; i++) {
      s += str;
    }
    return s;
  },

  /**
   * Function version of ECMAScript6 String.prototype.endsWith
   * @param  {String} str    the string to check
   * @param  {String} suffix the "endWith" we are seeking
   * @return {Boolean}       true if str ends with suffix
   * @see <a href="http://stackoverflow.com/a/2548133">stackoverflow thread</a>
   * @memberOf utils
   */
  endsWith: function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  },

  /**
   * Utility method to convert milliseconds into human readable time format hh:mm:ss
   * 
   * @param  {Number} time - the time value in milliseconds
   * @return {String}      - human readable time
   * @memberOf utils
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
   * Extracts final relative part of url, optionally keeping forward,
   * backward, or both slashes. By default both front and trailing slashes are removed
   *
   * @param {String}  url           the url or filepath
   * @param {Boolean} preSlash      keeps slash before relative part if true
   * @param {Boolean} trailingSlash keeps last slash after relative part if true
   * @example
   * var url = 'http://momentsound.com/nreleases/m01_garo/';
   * u.sliceRel(url);               //=> m01_garo
   * u.sliceRel(url, false, false); //=> m01_garo
   * u.sliceRel(url, false, true);  //=> m01_garo/
   * u.sliceRel(url, true, true);   //=> /m01_garo/
   * u.sliceRel(url, true, false);  //=> /m01_garo
   *
   * // sliceRel does not add a trailing slash if it wasn't
   * // there to begin with
   * url = 'http://momentsound.com/nreleases/m01_garo';
   * u.sliceRel(url, false, true); //=> m01_garo
   * u.sliceRel(url, true, true);  //=> /m01_garo
   * @memberOf utils
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
   * @param  {Object} obj the object
   * @return {String}     the type of object
   * @author Angus Croll
   * @see  <a href=
   * "http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/">
   * related article
   * </a>
   * @memberOf utils
   */
  toType: function(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
  },

  /**
   * Equivalent of Object.keys(obj).length
   * 
   * @param  {Object} obj the object whose ownProperties we are counting
   * @return {number}     the number of "ownProperties" in the object
   * @memberOf utils
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
   * @memberOf utils
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
   * function version of ECMA5 Object.create
   * 
   * @param  {Object} o  the object/base prototype
   * @return {Object}    new object based on o prototype
   */
  objectCreate: function(o) {
    var F = function() {};
    F.prototype = o;
    return new F();
  }
};
});
require.register("lokua-handler/src/handler.js", function(exports, require, module){
'use strict';

module.exports = Handler;

/**
 * Constructor.
 * 
 * @class  Handler
 * @constructor
 * @param {Object} context the value of `this` in handler callbacks
 *                         basically the owner of the function to be called.
 * @param {Array} handlers  reference of handlers, in case Handler is being inherited
 */
function Handler(context, handlers) {
  this.context = context || this;
  this.handlers = handlers || {};
  return this;
}

Handler.prototype = {

  /**
   * Change the context (value of `this`) from which handler methods are called.
   * ie, Handler needs to know who is calling her.
   * 
   * @param  {Object} context   the object that owns the execution method
   * @return {Object} `this` for chaining
   * @memberOf  Handler
   * @instance
   * @method
   */
  setContext: function(context) {
    this.context = context;
    return this;
  },

  /**
   * Register an event handler for a named function.
   * 
   * @param  {String|Function} fn   the function that will call the handler when executed
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
   * Helper function. Add a click event handler to an element only if that element exists.
   * @param  {jQuery|Object}  $el   the element
   * @param  {Function}       cb    the function to be called by the event handler
   * @return {Object} `this` for chaining
   * @memberOf  Handler
   * @instance
   * @method
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
   * Add callbacks to the list of handlers. The callbacks must be an object collection of 
   * key-value pairs where the identifier key is the name of a function that calls the executeHandler
   * method with the same name as the key, while the value is the callback 
   * function itself. This method should not be used if only registering a single callback, 
   * for that use {@link #on}.
   * 
   * @param  {Object} callbacks a (preferrably object literal) collection callback functions
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
  }
};

});
require.register("lap/src/lap.js", function(exports, require, module){
/** @namespace  Lap */
'use strict';

var Handler = require('handler'),
    u = require('utils');

module.exports = Lap;

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

  var lap = this;
  lap.name = 'Lokua Audio Player';
  lap.version = '0.0.5';
  lap.doc = 'http://lokua.net/lap/0.0.5/doc/';
  lap.handler = new Handler(this);
  lap.utils = u;

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
      playlist:       '.lap-playlist',
      playlistPanel:  '.lap-playlist-panel', // button
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
    // lap.debug('debug mode is on');
    /**
     * The upper-most parent element of the player as passed to the constructor.
     * @name $container
     * @memberOf  Lap
     * @instance
     * @type {jQuery}
     */
    lap.$container = container instanceof $ ? container : $(container);
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
    lap.libType = u.toType(lap.lib);
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

    lap.albumTitle  = undefined;
    lap.trackTitle  = undefined;
    lap.artist      = undefined;
    lap.cover       = undefined;
    lap.replacement = undefined;

    lap.updateCurrent();
    lap.initAudio();
    lap.initElements(_defaults.elements);
    lap.addListeners();
    lap.handler.registerCallbacks(lap.settings.callbacks);
    lap.load();
  })();

  return lap;
}

Lap.prototype = (function() {

  var seeking = false,
      mouseDownTimer;

  return {
    
    /**
     * wrapper for handler.* call
     * @see Handler.on
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    on: function(fn, handler) {
      return this.handler.on(fn, handler);
    },
    /**
     * wrapper for handler.* call
     * 
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     * @see Handler.executeHandler
     */
    executeHandler: function(fn) {
      return this.handler.executeHandler();
    },
    /**
     * wrapper for handler.* call
     * 
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     * @see Handler.registerCallbacks
     */
    registerCallbacks: function(callbacks) {
      return this.handler.registerCallbacks(callbacks);
    },
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
     * Turn the registered DOM player control elements into jQuery selections
     * if they arent' already. In the case that $els === 'auto', the default class
     * names for controls will be used (this is most efficient way).
     * 
     * @param  {Array.<String>} defaultEls  the list of default class names
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     */
    initElements: function(defaultEls) {
      var t = this;
      if (u.toType(t.$els) === 'string' && t.$els.toLowerCase() === 'auto')  {
        t.$els = [];
        for (var o in defaultEls) {
          if (defaultEls.hasOwnProperty(o)) {
            t.$els[o] = t.$container.find(defaultEls[o]);
          }
        }
      } else {
        for (var e in t.$els) {
          if (t.$els.hasOwnProperty(e)) {
            t.$els[e] = t.$container.find(t.$els[e]);
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

      if (t.libType === 'string') {

        if (u.endsWith(t.lib.toLowerCase(), '.json')) {
          $.ajax({ url: t.lib, dataType: 'json', async: false,
            success: function(res) {
              t.lib = res;
            }
          });
          // at this point t.lib is a regular js object, and is either a single unnamed object
          // representing a single album, or a named array containing mutliple albums.
          // using "data" for the array name...
          if (t.lib.data !== undefined && u.toType(t.lib.data) === 'array') {
            t.lib = t.lib.data; // no point in hanging on to object-wrapped array
            t.libType = u.toType(t.lib); // reset to correct type
            // call this function again to proceed to the ===array block
            t.updateCurrent();
            return;
          }
          t.libType = u.toType(t.lib);
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
        if (u.toType(t.replacement) === 'string') {
          t.replacement = [t.replacement, ''];
        }

        // replacement may contain string-wrapped regexp (from json), convert if so
        if (u.toType(t.replacement[0]) !== 'regexp') {
          var flags = t.replacement[2];
          t.replacement[0] = (flags !== undefined) ? 
              new RegExp(t.replacement[0], flags) 
            : new RegExp(t.replacement[0], 'g');
        }
      }

      if (u.toType(t.files) === 'string') {
        t.trackCount = 1;
      } else {
        t.trackCount = t.files.length;
      }
      t.matchTrackTitles();
    },

    /**
     * Places relative file names in place of an empty or mismatched trackTitles array.
     * @memberOf  Lap
     */
    matchTrackTitles: function() {
      var t = this, i;
      // if mismatch, ignore trackTitles completely
      if (t.trackTitles === undefined || t.trackCount > t.trackTitles.length) {
        t.trackTitles = [];
        for (i = 0; i < t.trackCount; i++) {
          t.trackTitles[i] = u.sliceRel(t.files[i].replace('.' + t.getFileType(), ''));
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
          $els.currentTime.text(t.currentTimeFormatted());
          t.handler.executeHandler('timeUpdate');
        })
        .on('durationchange', function() {
          $els.duration.text(t.durationFormatted());
        })
        .on('volumechange', function() {
          $els.volumeRead.text(t.volumeFormatted());
        })
        .on('ended', function() {
          t.next();
          if (t.audio.paused) t.audio.play();
        });

      // --- action listeners
      t.handler.registerClick($els.playPause, t.togglePlay);
      t.handler.registerClick($els.prev, t.prev);
      t.handler.registerClick($els.next, t.next);
      t.handler.registerClick($els.volumeUp, t.incVolume);
      t.handler.registerClick($els.prevAlbum, t.prevAlbum);
      t.handler.registerClick($els.nextAlbum, t.nextAlbum);
      t.handler.registerClick($els.seekbar, t.seekFromSeekbar);

      t.$container.on('click', function(e) {
        var $targ = $(e.target);
        if ($targ.is('.lap-playlist-item')) {
          var wasPlaying = !t.audio.paused;
          t.trackIndex = u.int($targ.attr('data-index'));
          t.setSource();
          t.handler.executeHandler('trackChange');
          if (wasPlaying) t.audio.play();
        }
      });
         
      $els.seekForward.add($els.seekBackward)
        .on('mousedown', function(e) {
          seeking = true;
          if ($(this).is($els.seekForward)) {
            t.seekForward();
          } else {
            t.seekBackward();
          }
        })
        .on('mouseup', function(e) {
          seeking = false;
          clearTimeout(mouseDownTimer);
        });

      t.handler
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
      this.handler.executeHandler('load');
      return this;
    },

    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    updateTrackTitleEl: function() {
      this.$els.trackTitle.text(this.trackTitles[this.trackIndex]);
      return this;
    },

    // TODO: adapt updateCurrent for multiple artist arrays
    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    updateArtistEl: function() {
      this.$els.artist.text(this.artist);
      return this;
    },

    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    updateAlbumEl: function() {
      this.$els.albumTitle.text(this.album);
      return this;
    },

    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    updateCover: function() {
      this.$els.cover.find('img').attr('src', this.cover);
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
      t.handler.executeHandler('togglePlay');
      return t;
    },

    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    play: function() {
      this.audio.play();
      this.handler.executeHandler('play');
      return this;
    },


    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    pause: function() {
      this.audio.pause();
      this.handler.executeHandler('pause');
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
     * @memberOf  Lap
     */
    populatePlaylist: function() {
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
     * helper used in populatePlaylist. zero-pads and punctutates the passed track number.
     * 
     * @param  {Number} n the trackNumber to format
     * @return {String}   the formatted trackNumber
     * @memberOf Lap
     */
    trackNumberFormatted: function(n) {
      var padCount = (this.trackCount+'').length - (n+'').length;
      return u.repeat('0', padCount) + n + this.settings.trackNumberPostfix;
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
      // t.handler.executeHandler('nextAlbum');
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
      this.handler.executeHandler('volumeChange');
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
      this.handler.executeHandler('seek');
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
      t.handler.executeHandler('seek');
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
      return file.slice(file.length-3);
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
      var formatted = u.formatTime(Math.floor(this.audio.currentTime.toFixed(1)));
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
      var formatted = u.formatTime(Math.floor(this.audio.duration.toFixed(1)));
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
})();
});




require.alias("lokua-utils/index.js", "lap/deps/utils/index.js");
require.alias("lokua-utils/index.js", "lap/deps/utils/index.js");
require.alias("lokua-utils/index.js", "utils/index.js");
require.alias("lokua-utils/index.js", "lokua-utils/index.js");
require.alias("lokua-handler/src/handler.js", "lap/deps/handler/src/handler.js");
require.alias("lokua-handler/src/handler.js", "lap/deps/handler/index.js");
require.alias("lokua-handler/src/handler.js", "handler/index.js");
require.alias("lokua-handler/src/handler.js", "lokua-handler/index.js");
require.alias("lap/src/lap.js", "lap/index.js");