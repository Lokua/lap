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
            new RegExp(t.replacement[0], flags) : 
            new RegExp(t.replacement[0], 'g');
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
     * Also applies any regex specified in settings.replacement
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
      this.handler.executeHandler('trackChange');
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