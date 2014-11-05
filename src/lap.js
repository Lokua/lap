/** @namespace  Lap */

/*>>*/
var logger = new tooly.Logger(0, 'Lap');
var COUNT = 0;
/*<<*/

// internal id generator, indexed from one
var _idGen = (_idGen || 0) + 1;
// zero indexed
var _pluginIdGen = _pluginIdGen || 0;

var _selectors = {
  album:               'album',
  artist:              'artist',
  buffered:            'buffered',
  control:             'control',
  controls:            'controls',
  cover:               'cover',
  currentTime:         'current-time',
  discog:              'discog',
  discogItem:          'discog-item',
  discogPanel:         'discog-panel',
  duration:            'duration',
  info:                'info', // button
  infoPanel:           'info-panel',
  next:                'next',
  nextAlbum:           'next-album',
  playPause:           'play-pause',
  playlist:            'playlist', // button
  playlistItem:        'playlist-item', // list item
  playlistPanel:       'playlist-panel',
  playlistTrackNumber: 'playlist-track-number',
  prev:                'prev',
  prevAlbum:           'prev-album',
  progressbar:         'progressbar',
  seekBackward:        'seek-backward',
  seekForward:         'seek-forward',
  seekbar:             'seekbar',
  trackNumber:         'track-number', // the currently cued track
  trackTitle:          'track-title',
  volumeButton:        'volume-button',
  volumeDown:          'volume-down',
  volumeRead:          'volume-read',
  volumeSlider:        'volume-slider',
  volumeUp:            'volume-up'
};

var _defaults = {
  callbacks: {},
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
  useNativeSeekbarRange: false,
  useNativeVolumeRange: false,
  volumeInterval: 0.05
};


// alias tooly.Frankie constructor. Handles all jQuery dom selection.
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

  // uninitialized
  lap.container = container;
  lap.lib = lib;

  lap.settings = tooly.extend(_defaults, options);

  lap.id = _idGen++;

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
    console.log('%cannoy: %c%s', 'color:#ccc', 'color:#888', event + ' handler called'); 
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

  var _seeking = _volumeChanging = false,
      _mouseDownTimer;

  // helper
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
        replacement[0] = (flags !== undefined) 
          ? new RegExp(replacement[0], flags) 
          : new RegExp(replacement[0], 'g');
      }
    }      
  } 

  // helper
  function _registerClick(lap, $el, callback) {
    if (!$el || $el.zilch()) return lap;
    if ($el instanceof $) $el = $el.get(0);
    $el.addEventListener('click', function() {
      callback.call(lap);
    });
    return lap;
  }

  return {

    initialize: function() {
      var lap = this;

      try {
        if (lap.container.nodeType !== 1){
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
        album:               'album',
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
        lap.load();

        /*>>*/
        logger.debug('load: audio: %o', lap.audio);
        /*<<*/

      } catch(err) {
        throw err;
      }

      /*>>*/
      logger.info('post init: %o', lap);
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
      var lap = this, 
          elems = selectors = {};

      lap.settings.selectorPrefix = lap.settings.selectorPrefix.replace('.', '');
      var pre = lap.settings.selectorPrefix;

      // validate and configure prefix for class selectors
      if (pre) {
        pre = '.' + pre + '-';
        tooly.each(_selectors, function(v, k) { 
          selectors[k] = pre + v; 
        });
      }
      if ((tooly.type(lap.$els) === 'string' && lap.$els.toLowerCase() === 'auto') 
          || lap.$els === undefined) {    
        lap.$els = {};
        elems = selectors;
      } else {
        elems = lap.$els;
      }
      tooly.each(elems, function(el, key) {
        var $el = $(el, lap.container);
        // only add the Frankie instance if element really exists
        if (!$el.zilch()) {
          lap.$els[key] = $(el, lap.container);
        }
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

      _parseReplacement(lap.replacement);

      if (tooly.toType(lap.files) === 'string') {
        lap.trackCount = 1;
      } else {
        lap.trackCount = lap.files.length;
      }
      lap.matchtracklist();
    },

    /**
     * Places relative file names in place of an empty or mismatched tracklist array.
     * Also applies any regex specified in settings.replacement
     * @memberOf  Lap
     */
    matchtracklist: function() {
      var lap = this, i = 0;
      // if mismatch, ignore tracklist completely
      if (lap.tracklist === undefined || lap.trackCount > lap.tracklist.length) {
        lap.tracklist = [];
        for (; i < lap.trackCount; i++) {
          lap.tracklist[i] = tooly.sliceRel(lap.files[i].replace('.' + lap.getFileType(), ''));
          if (lap.replacement !== undefined) {
            lap.tracklist[i] = lap.tracklist[i].replace(lap.replacement[0], lap.replacement[1]);
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

      /*>>*/
      var logger = new tooly.Logger(0, 'ADD_LISTENERS');
      /*<<*/

      var lap = this, 
          $els = lap.$els,
          audio = lap.audio,
          pre = lap.settings.selectorPrefix;

      var nativeProgress = lap.settings.useNativeProgress && $els.progressbar.els.length;

      if ($els.buffered || nativeProgress) {
        audio.addEventListener('progress', function() {
          var buffered = +lap.bufferFormatted();
          if ($els.buffered) {
            $els.buffered.html(buffered);
          }
          if (nativeProgress) {
            $els.progressbar.get(0).value = buffered;
          }
        });
      }

      // helper
      var _checkAddAudioListener = function(audioEvent, prop, fn) {
        if (lap.$els.hasOwnProperty(prop)) {
          audio.addEventListener(audioEvent, function() {
            fn.call(lap.$els[prop]);
          });
        }
      };      
      _checkAddAudioListener('timeupdate', 'currentTime', function() {
        this.html(lap.currentTimeFormatted());
      });
      _checkAddAudioListener('durationchange', 'duration', function() {
        this.html(lap.durationFormatted());        
      });
      _checkAddAudioListener('volumechange', 'volumeRead', function() {
        this.html(lap.volumeFormatted());
      });

      audio.addEventListener('ended', function() {
        lap.next();
        if (lap.audio.paused) lap.audio.play();
      });

      if ($els.playPause) $els.playPause.on('click', function() { lap.togglePlay(); });
      if ($els.prev) $els.prev.on('click', function() { lap.prev(); });
      if ($els.next) $els.next.on('click', function() { lap.next(); });
      if ($els.volumeUp) $els.volumeUp.on('click', function() { lap.incVolume(); });
      if ($els.volumeDown) $els.volumeDown.on('click', function() { lap.decVolume(); });
      if ($els.prevAlbum) $els.prevAlbum.on('click', function() { lap.prevAlbum(); });
      if ($els.nextAlbum) $els.nextAlbum.on('click', function() { lap.nextAlbum(); });

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
          $els.playPause.addClass(pre+'-paused');
          lap.on('play', function() {
            $els.playPause.removeClass(pre+'-paused').addClass(pre+'-playing');
          }).on('pause', function() {
            $els.playPause.removeClass(pre+'-playing').addClass(pre+'-paused');
          });
        }
      }).on('trackChange', function() {
        if ($els.trackTitle) lap.updateTrackTitleEl();
        if ($els.trackNumber) lap.updateTrackNumberEl();
        if ($els.playlistPanel) lap.updatePlaylistItem();
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
          seekbar = $els.seekbar,
          nativeSeek = lap.settings.useNativeSeekbarRange && $els.seekbar.els.length;

      if (nativeSeek) {

        audio.addEventListener('timeupdate', function(e) {
          if (!_seeking) {
            seekbar.get(0).value = tooly.scale(audio.currentTime, 0, audio.duration, 0, 100);
          }
        });

        seekbar.on('mousedown', function(e) {
          _seeking = true;
        }).on('mouseup', function(e) {
          var el = seekbar.get(0);
          audio.currentTime = tooly.scale(el.value, 0, el.max, 0, audio.duration);
          _seeking = false;
        });

      } else { // using buttons
        [$els.seekForward, $els.seekBackward].forEach(function(el) {
          if (!el) return;
          el.on('mousedown', function(e) {
            _seeking = true;
            if ($(e.target).hasClass(lap.settings.selectorPrefix + '-seek-forward')) {
              lap.seekForward();
            } else {
              lap.seekBackward();
            }
          }).on('mouseup', function(e) {
            _seeking = false;
            // TODO: won't this private _mouseDownTimer be universal
            // to all Lap instance's? Should be instance member
            clearTimeout(_mouseDownTimer);
          });
        });
      }
    },

    initVolumeHandlers: function() {
      var lap = this, 
          $els = lap.$els,
          audio = lap.audio,
          vslider = $els.volumeSlider,
          nativeVolume = lap.settings.useNativeVolumeRange && vslider.els.length;

      if (nativeVolume) {

        audio.addEventListener('volumechange', function() {
          if (!_volumeChanging) {
            vslider.get(0).value = lap.volumeFormatted();
          }
        });

        vslider.on('mousedown', function() {
          _volumeChanging = true;
        }).on('mouseup', function() {
          audio.volume = vslider.get(0).value * 0.01;
          _volumeChanging = false;
        });
      }
    },

    /**
     * convenience method
     * 
     * @return {this}
     * @memberOf  Lap
     */
    registerClick: function($el, cb) {
      var t = this;
      if (!$el || $el.zilch()) return t;
      if ($el instanceof tooly.Frankie) $el = $el.get(0);
      try {
        $el.addEventListener('click', function() {
          cb.call(t);
        });
      } catch(e) {
        /*>>*/
        logger.error('%o caught -> $el: %o, cb: %o', e.name, $el, cb);
        /*<<*/
      }
      return t;
    },    

    /**
     * @memberOf  Lap
     */
    load: function() {
      this.trigger('load');
      return this;
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
      this.plugins = this.plugins || {};
      var lap = this,
          plugins = lap.settings.plugins, plugin, name,
          args = [],  
          len = plugins.length, i = 0;
      for (; i < len; i++) {
        plugin = plugins[i];
        if (plugin.constructor) {
          name = (plugin.name || plugin.constructor.prototype.name) 
            ? plugin.name || plugin.constructor.prototype.name
            : 'plugin' + '_' + lap.id + '_' + _pluginIdGen;
          lap.plugins[name] = (plugin.args) 
            ? tooly.construct(plugin.constructor, args.concat(lap, plugin.args)) 
            : tooly.construct(plugin.constructor);
          lap.on('load', function() { lap.plugins[name].init(); });
        }
      }
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
          pre = lap.settings.selectorPrefix + '-playlist-', 
          prepend = lap.settings.prependTrackNumbers;

      // TODO: test-me -> should remove all pre-existing listeners
      $panel.remove();

      $panel.html(
        tooly.tag('ul', lap.tracklist.map(function(track, i) {

          var tagFormat = 'li .'+pre+'item ' + 
            ((i === lap.trackIndex) ? '.'+pre+'current ' : '') +
            'data-'+pre+'index="' + i + '"';

          return tooly.tag(tagFormat, tooly.stringFormat('{0}{1}',
            // 0
            prepend 
              ? tooly.tag('span .'+pre+'track-number', lap.trackNumberFormatted(i+1)) 
              : '',
            // 1
            tooly.tag('span .'+pre+'track-title ', lap.tracklist[i].trim()))
          );
        }).join(''))
      );

      $panel.find('li').on('click', function(e) {
        var $li = $(this);
        lap.setTrack($li.attr('data-'+pre+'index'));
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
      var lap = this,
          pre = lap.settings.selectorPrefix + '-playlist-';
      // remove highlight
      $('li', lap.$els.playlistPanel).removeClass(pre+'current')
        // highlight
        .eq(lap.trackIndex).addClass(pre+'current');
      return lap;
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
     * Read only. Helper used in populatePlaylist. 
     * Zero-pads and punctutates the passed track number.
     * 
     * @param  {Number} n the trackNumber to format
     * @return {String}   the formatted trackNumber
     * @memberOf Lap
     */
    trackNumberFormatted: function(n) {
      var padCount = (''+this.trackCount).length - (''+n).length;
      return tooly.repeat('0', padCount) + n + this.settings.trackNumberPostfix;
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
      // logger.debug(lap.audio);
      // logger.debug(lap.audio.paused);
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
      if (!_seeking) return;
      var lap = this;
      _mouseDownTimer = setInterval(function() {
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
      if (!_seeking) return;
      var lap = this;
      _mouseDownTimer = setInterval(function() {
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
      return (file === undefined) 
        ? '"unknown filetype"' 
        // : file.slice(file.length-3);
        : tooly.extension(file);
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
      if (this.audio.duration < 3600) {
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
