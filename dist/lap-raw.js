/*!
 * lap - version 0.1.1 (built: 2015-01-10)
 * HTML5 audio player
 *
 * https://github.com/Lokua/lap.git
 *
 * Copyright © 2015 Joshua Kleckner
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

  lap.id = ++_idGen;



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
      plugins: null,
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
      state: {
        playlistItemCurrent: 'lap__playlist__item--current',
        playing            : 'lap--playing',
        paused             : 'lap--paused',
        hidden             : 'lap--hidden'
      },
      album:               'lap__album',
      artist:              'lap__artist',
      buffered:            'lap__buffered',
      // control:             'lap__control',
      // controls:            'lap__controls',
      cover:               'lap__cover',
      currentTime:         'lap__current-time',
      discog:              'lap__discog',
      discogItem:          'lap__discog__item',
      discogPanel:         'lap__discog__panel',
      duration:            'lap__duration',
      info:                'lap__info', // button
      infoPanel:           'lap__info-panel',
      next:                'lap__next',
      nextAlbum:           'lap__next-album',
      playPause:           'lap__play-pause',
      playlist:            'lap__playlist', // button
      playlistItem:        'lap__playlist__item', // list item
      playlistPanel:       'lap__playlist__panel',
      playlistTrackNumber: 'lap__playlist__track-number',
      playlistTrackTitle : 'lap__playlist__track-title',
      prev:                'lap__prev',
      prevAlbum:           'lap__prev-album',
      progress:            'lap__progress',
      seekBackward:        'lap__seek-backward',
      seekForward:         'lap__seek-forward',
      seekRange:           'lap__seek-range',
      trackNumber:         'lap__track-number', // the currently cued track
      trackTitle:          'lap__track-title',
      volumeButton:        'lap__volume-button',
      volumeDown:          'lap__volume-down',
      volumeRead:          'lap__volume-read',
      volumeRange:         'lap__volume-range',
      volumeUp:            'lap__volume-up'
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
        // do not add selectors.state classes
        if (tooly.type(el, 'object')) return;

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
          if (lap.lib.data !== 'undefined' && tooly.type(lap.lib.data) === 'array') {
            lap.lib = lap.lib.data; // no point in hanging on to object-wrapped array
            lap.libType = tooly.type(lap.lib);
            lap.albumCount = lap.lib.length;
            // call this function again to proceed to the ===array block
            lap.update();
            return;
          }
          lap.libType = tooly.type(lap.lib);

          if (lap.libType === 'object') {
            lap.albumCount = Object.keys(lap.lib).length;
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
          re[0] = new RegExp(re[0], flags !== undefined ? flags : 'g');
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
          if ($els.playlistPanel.hasClass(lap.selectors.state.hidden)) {
            $els.playlistPanel.removeClass(lap.selectors.state.hidden);
            _PLAYLIST_OPEN = true;
            if (hasDiscog && lap.settings.discogPlaylistExclusive) {
              $els.discogPanel.addClass(lap.selectors.state.hidden);
            }
          } else {
            $els.playlistPanel.addClass(lap.selectors.state.hidden);
            _PLAYLIST_OPEN = false;
            if (hasDiscog && lap.settings.discogPlaylistExclusive && _DISCOG_OPEN) {
              $els.discogPanel.removeClass(lap.selectors.state.hidden);
            }
          }
        });
      }
      if (hasDiscog) {
        $els.discog.on('click', function() {
          if ($els.discogPanel.hasClass(lap.selectors.state.hidden)) {
            $els.discogPanel.removeClass(lap.selectors.state.hidden);
            _DISCOG_OPEN = true;
            if (hasPlaylist && lap.settings.discogPlaylistExclusive) {
              $els.playlistPanel.addClass(lap.selectors.state.hidden);
            }
          } else {
            $els.discogPanel.addClass(lap.selectors.state.hidden);
            _DISCOG_OPEN = false;
            if (hasPlaylist && lap.settings.discogPlaylistExclusive && _PLAYLIST_OPEN) {
              $els.playlistPanel.removeClass(lap.selectors.state.hidden);
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
          $els.playPause.addClass(lap.selectors.state.paused);
          lap.on('play', function() {
            $els.playPause.removeClass(lap.selectors.state.paused).addClass(lap.selectors.state.playing);
          }).on('pause', function() {
            $els.playPause.removeClass(lap.selectors.state.playing).addClass(lap.selectors.state.paused);
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
            if ($(e.target).hasClass(lap.selectors.seekForward)) {
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
     * Lap.MyPlugin.protype.init = function() {
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
              console.error('Could not initialize ' + lap.plugins[i] +
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
      this.$els.trackTitle.html(this.tracklist[this.trackIndex]);
      return this;
    },

    /**
     * @memberOf  Lap
     * @return {this}
     */
    updateTrackNumberEl: function() {
      this.$els.trackNumber.html(+this.trackIndex+1);
      return this;
    },

    // TODO: adapt update for multiple artist arrays
    /**
     * @memberOf  Lap
     * @return {this}
     */
    updateArtistEl: function() {
      this.$els.artist.html(this.artist);
      return this;
    },

    /**
     * @memberOf  Lap
     * @return {this}
     */
    updateAlbumEl: function() {
      this.$els.album.html(this.album);
      return this;
    },

    /**
     * @memberOf  Lap
     * @return {this}
     */
    updateCover: function() {
      this.$els.cover.get(0).src = this.cover;
      return this;
    },

    /**
     * Toggle the audio element's play state
     * 
     * @memberOf  Lap
     * @return {this}
     */
    togglePlay: function() {
      this.audio.paused ? this.play() : this.pause();
      this.trigger('togglePlay');
      return this;
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
      var wasPlaying = !this.audio.paused;
      this.setSource();
      if (wasPlaying) this.audio.play();
      this.trigger('trackChange');
      return this;
    },

    /**
     * Move to the previous index in the file queue.
     * 
     * @return {this}
     * @memberOf  Lap
     */
    prev: function() {
      var wasPlaying = !this.audio.paused;
      this.trackIndex = (this.trackIndex-1 < 0) ? this.trackCount-1 : this.trackIndex-1;
      this.setSource();
      if (wasPlaying) this.audio.play();
      this.trigger('trackChange');
      return this; 
    },

    /**
     * Move to the next index in the file queue.
     * 
     * @return {this}
     * @memberOf  Lap
     */
    next: function() {
      var wasPlaying = !this.audio.paused;
      this.trackIndex = (this.trackIndex+1 >= this.trackCount) ? 0 : this.trackIndex+1;
      this.setSource();
      if (wasPlaying) this.audio.play();
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
      var wasPlaying = !this.audio.paused;
      this.albumIndex = (this.albumIndex-1 < 0) ? this.albumCount-1 : this.albumIndex-1;
      this.update();

      this.trackIndex = 0;
      this.setSource();

      if (wasPlaying) this.audio.play();
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
      var wasPlaying= !this.audio.paused;
      this.albumIndex = (this.albumIndex+1 > this.albumCount-1) ? 0 : this.albumIndex+1;
      this.update();

      this.trackIndex = 0;
      this.setSource();

      if (wasPlaying) this.audio.play();
      this.trigger('albumChange');
      return this;
    },

    /**
     * Set the current album. Fires the "albumChange" event.
     *
     * @param {number} index  the new index; under/overflow will be clamped
     * @memberOf  Lap
     * @return {this}
     */
    setAlbum: function(index) {
      if (index <= 0) {
        this.albumIndex = 0;
      } else if (index >= this.albumCount) {
        this.albumIndex = this.albumCount-1;
      } else {
        this.albumIndex = index;
      }
      this.update();
      this.setTrack(this.lib[this.albumIndex].startingTrackIndex || 0);
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
      return lap;
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
      return lap;
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
      if (forward) {
        applied = this.audio.currentTime + this.settings.seekInterval;
        this.audio.currentTime = (applied >= this.audio.duration) ? this.audio.duration : applied;
      } else {
        applied = this.audio.currentTime + (this.settings.seekInterval * -1);
        this.audio.currentTime = (applied <= 0) ? 0 : applied;
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

          var tagFormat = 'li .'+lap.selectors.playlistItem+' ' + 
            ((i === lap.trackIndex) ? '.'+lap.selectors.state.playlistItemCurrent+' ' : '') +
            'data-lap-playlist-index="' + i + '"';

          return tooly.tag(tagFormat, tooly.stringFormat('{0}{1}',
            // 0
            prepend 
              ? tooly.tag('span .' + lap.selectors.playlistTrackNumber+ '', lap.trackNumberFormatted(i+1)) 
              : '',
            // 1
            tooly.tag('span .'+lap.selectors.playlistTrackTitle, lap.tracklist[i].trim()))
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
      $('li', lap.$els.playlistPanel)
        .removeClass(lap.selectors.state.playlistItemCurrent)
        .eq(lap.trackIndex)
        .addClass(lap.selectors.state.playlistItemCurrent);
      return lap;
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
        file = this.lib.files[this.trackIndex];
      } else if (this.libType === 'array') { // array of albums
        file = this.lib[this.albumIndex].files[this.trackIndex];
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
        // this.logger.trace('bufferFormatted', e.name);
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
      if (isNaN(this.audio.duration)) {
        return '00:00';
      }      
      var formatted = tooly.formatTime(Math.floor(this.audio.currentTime.toFixed(1)));
      if (this.audio.duration < 3600 || formatted === '00:00:00') {
        return formatted.slice(3); // nn:nn
      }
      return formatted;
    },

    /**
     * Read only. Get the current track's duration property in human readable format
     *
     * ### Example
     * ```js
     * var duration  = lap.audio.duration;      //=> 151.222857
     * var formatted = lap.durationFormatted(); //=> 02:31
     * ```
     * 
     * @return {String} human readable time in hh:mm:ss format
     * @see #formatTime
     * @memberOf  Lap
     */
    durationFormatted: function() {
      if (isNaN(this.audio.duration)) {
        return '00:00';
      }
      var formatted = tooly.formatTime(Math.floor(this.audio.duration.toFixed(1)));
      if (this.audio.duration < 3600 || formatted === '00:00:00') {
        return formatted.slice(3); // nn:nn
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
    }
  }; // end return
})()); // end anon }, end wrapper ), call wrapper (), end tooly.inherit );


return Lap;


}));

