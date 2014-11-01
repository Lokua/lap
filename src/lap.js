/** @namespace  Lap */

/*>>*/
var logger = new tooly.Logger(0, 'Lap');
/*<<*/

/**
 * @type {Number}
 * @memberOf  Lap
 * @static
 */
var _idGen = (_idGen || 0) + 1;

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

  /**
   * alias tooly.Selector constructor. Handles all jQuery dom selection.
   * TODO: make replacable with whatever selector lib that conforms to the API
   * @type {tooly.Selector}
   */
  var $ = tooly.Frankie.bind(this);

  lap.name = 'Lokua Audio Player';
  lap.version = '0.0.5';
  // lap.doc = 'http://lokua.net/lap/0.0.5/doc/';

  var _selectors = {
    albumTitle:          '.lap-album-title',
    artist:              '.lap-artist',
    buffered:            '.lap-buffered',
    control:             '.lap-control',
    controls:            '.lap-controls',
    cover:               '.lap-cover',
    currentTime:         '.lap-current-time',
    discog:              '.lap-discog',
    duration:            '.lap-duration',
    info:                '.lap-info', // button
    infoPanel:           '.lap-info-panel',
    next:                '.lap-next',
    nextAlbum:           '.lap-next-album',
    playPause:           '.lap-play-pause',
    playlist:            '.lap-playlist', // button
    playlistPanel:       '.lap-playlist-panel',
    playlistTrackNumber: '.lap-playlist-track-number',
    prev:                '.lap-prev',
    prevAlbum:           '.lap-prev-album',
    seekBackward:        '.lap-seek-backward',
    seekForward:         '.lap-seek-forward',
    seekbar:             '.lap-seekbar',
    trackNumber:         '.lap-track-number', // the currently cued track
    trackTitle:          '.lap-track-title',
    volumeButton:        '.lap-volume-button',
    volumeDown:          '.lap-volume-down',
    volumeRead:          '.lap-volume-read',
    volumeSlider:        '.lap-volume-slider',
    volumeUp:            '.lap-volume-up'
  };
  var _defaults = {
    startingTrackIndex: 0,
    startingAlbumIndex: 0,
    volumeInterval: 0.05,
    seekInterval: 5, // seconds
    seekTime: 250, // milliseconds
    prependTrackNumbers: true,
    trackNumberPostfix: ' - ',
    replacementText: void 0,
    // elements: _selectors,
    callbacks: {},
    plugins: {}
  };

  /**
   * Psuedo constructor
   *
   * TODO: move to prototype
   * 
   * @inner
   */
  var init = (function() {

    lap.id = _idGen++;

    lap.settings = tooly.extend(_defaults, options);
    lap.$container = (container.nodeType === 1) ? container : $(container, document).get(0);
    lap.lib = lib;
    lap.libType = tooly.type(lap.lib);
    lap.files = [];
    lap.trackTitles = [];
    lap.$els = lap.settings.elements;
    lap.audio = {};
    lap.trackIndex = lap.settings.startingTrackIndex;
    lap.albumIndex = lap.settings.startingAlbumIndex;
    lap.trackCount;
    lap.albumTitle  = '';
    lap.trackTitle  = '';
    lap.artist      = '';
    lap.cover       = '';
    lap.replacement = '';

    lap.updateCurrent();
    lap.initAudio();
    lap.initElements(_selectors, $);
    lap.addListeners();
    lap.registerCallbacks(lap.settings.callbacks);
    lap.initPlugins();
    lap.load();

    /*>>*/
    logger.info('post init: %o', lap);
    /*<<*/
  })();

  return lap;
}

tooly.inherit(tooly.Handler, Lap, (function() {

  var seeking = false,
      mouseDownTimer,
      $;

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

  return {

    /**
     * Turn the registered DOM player control elements into selections
     * if they arent' already. In the case that $els === 'auto', the default class
     * names for controls will be used (this is preferred).
     * 
     * @param  {Array.<String>} selectors  the list of default class names
     * @return {Object} `this` for chaining
     * @memberOf  Lap
     */
    initElements: function(selectors, _Selector) {
      $ = _Selector;
      var lap = this, elems, el;
      if (tooly.type(lap.$els) === 'string' && lap.$els.toLowerCase() === 'auto') {    
        lap.$els = {};
        elems = selectors;
      } else {
        elems = lap.$els;
      }
      tooly.each(elems, function(el, key) {
        lap.$els[key] = $(el, lap.$container);
      });
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

        if (tooly.extension(t.lib.toLowerCase(), '.json')) {

          // TODO: break this function into two parts so
          // we can async
          tooly.getJSON(t.lib, function(data) {
            // t.lib = JSON.parse(data);
            t.lib = data;
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
      var lap = this, 
          $els = lap.$els,
          audio = lap.audio;

      audio.addEventListener('progress', function() {
        $els.buffered.html(lap.bufferFormatted());
      });
      audio.addEventListener('timeupdate', function() {
        $els.currentTime.html(lap.currentTimeFormatted());
      });
      audio.addEventListener('durationchange', function() {
        $els.duration.html(lap.durationFormatted());        
      });
      audio.addEventListener('volumechange', function() {
        $els.volumeRead.html(lap.volumeFormatted());
      });
      audio.addEventListener('ended', function() {
        lap.next();
        if (lap.audio.paused) lap.audio.play();
      });
      
      lap.registerClick($els.playPause, lap.togglePlay);
      lap.registerClick($els.prev, lap.prev);
      lap.registerClick($els.next, lap.next);
      lap.registerClick($els.volumeUp, lap.incVolume);
      lap.registerClick($els.volumeDown, lap.decVolume);
      lap.registerClick($els.prevAlbum, lap.prevAlbum);
      lap.registerClick($els.nextAlbum, lap.nextAlbum);
      // lap.registerClick($els.seekbar, lap.seekFromSeekbar);

      lap.$container.addEventListener('click', function(e) {
        if ($(e.target).hasClass('lap-playlist-item')) {
        // if (tooly.hasClass('lap-playlist-item', e.target)) {
          var wasPlaying = !lap.audio.paused;
          lap.trackIndex = parseInt(e.target.getAttribute('data-lap-index'));
          lap.setSource();
          lap.trigger('trackChange');
          if (wasPlaying) lap.audio.play();
        }
      });

      function addSeekHandlers(el) {
        if (!el || el.zilch()) return;
        if (el instanceof $) el = el.get(0);
        el.addEventListener('mousedown', function(e) {
          seeking = true;
          if ($(e.target).hasClass('lap-seek-forward')) {
            lap.seekForward();
          } else {
            lap.seekBackward();
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
          lap.updateTrackTitleEl();
          lap.updateTrackNumberEl();
          lap.updateArtistEl();
          lap.updateAlbumEl();
          lap.updateCover();
          lap.populatePlaylist();
          $els.playPause.addClass('lap-paused');
        })
        .on('play', function() {
          $els.playPause.removeClass('lap-paused').addClass('lap-playing');
        })
        .on('pause', function() {
          $els.playPause.removeClass('lap-playing').addClass('lap-paused');
        })
        .on('trackChange', function() {
          lap.updateTrackTitleEl();
          lap.updateTrackNumberEl();
          lap.updateCurrentPlaylistItem();
        })
        .on('albumChange', function() {
          lap.updateTrackTitleEl();
          lap.updateTrackNumberEl();
          lap.updateArtistEl();
          lap.updateAlbumEl();
          lap.updateCover();
          lap.populatePlaylist();
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
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    updateTrackTitleEl: function() {
      this.$els.trackTitle.html(this.trackTitles[this.trackIndex]);
      return this;
    },

    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    updateTrackNumberEl: function() {
      this.$els.trackNumber.html(this.trackIndex+1);
      return this;
    },

    // TODO: adapt updateCurrent for multiple artist arrays
    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    updateArtistEl: function() {
      this.$els.artist.html(this.artist);
      return this;
    },

    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    updateAlbumEl: function() {
      this.$els.albumTitle.html(this.album);
      return this;
    },

    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    updateCover: function() {
      if (this.$els.cover !== null && !this.$els.cover.zilch()) {
        this.$els.cover.get(0).src = this.cover;
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
      t.trigger('togglePlay');
      return t;
    },

    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    play: function() {
      this.audio.play();
      this.trigger('play');
      return this;
    },


    /**
     * @memberOf  Lap
     * @return {Object} `this` for chaining
     */
    pause: function() {
      this.audio.pause();
      this.trigger('pause');
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
      this.trigger('trackChange');
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
      var t = this, 
          items = [], 
          i = 0,
          html = '';

      t.$els.playlistPanel.html('');

      for (i = 0; i < t.trackCount; i++) {

        html += tooly.stringFormat('<div>{0}{1}{2}</div>',
          // 0
          (t.settings.prependTrackNumbers) ? 
            '<span class="lap-playlist-track-number">'+t.trackNumberFormatted(i+1)+'</span>' : '',
          // 1
          '<span class="lap-playlist-item' + ((i === t.trackIndex) ? ' lap-current' : '') + 
            '" data-lap-index="' + i + '">',
          // 2
          t.trackTitles[i].trim() + '</span>'
        );
      }

      t.$els.playlistPanel.append(html);
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
          items = $('.lap-playlist-item', t.$container),
          len = items.length,
          i = 0;
      for (; i < len; i++)  {
        if (items[i].get(0).getAttribute('data-lap-index') == t.trackIndex) {
          items.removeClass('lap-current'); // wastefull, fixme
          $(items.eq(i)).addClass('lap-current');
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
      this.trigger('trackChange');
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
      this.trigger('trackChange');
      return this;
    },

    // TODO: find occurances then delete me
    // trackChange: function() {
    //   this.trigger('trackChange');
    // },

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
      this.trigger('albumChange');
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
      this.trigger('albumChange');
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
      this.trigger('volumeChange');
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
      this.trigger('seek');
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
      t.trigger('seek');
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
