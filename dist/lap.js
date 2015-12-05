(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*!
 * lap.js version 0.6.0
 * HTML5 audio player
 *
 * https://github.com/Lokua/lap.git
 * http://lokua.net
 *
 * Copyright © 2014, 2015 Joshua Kleckner <dev@lokua.net>
 * Licensed under the MIT license.
 * http://opensource.org/licenses/MIT
 */

var Lap = (function (_Bus) {
  _inherits(Lap, _Bus);

  /**
   * Class constructor.
   * @param  {String|HTML Element} element container element
   * @param  {Array|Object|String} lib a Lap "library", which can be an array of
   *                                   album objects, a single album object, or a url to a
   *                                   single audio file
   * @param  {Object} options  settings hash that will be merged with Lap.$$defaultSettings
   */

  function Lap(element, lib, options) {
    var postpone = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

    _classCallCheck(this, Lap);

    // default id to zero-based index incrementer

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Lap).call(this));

    _this.id = options && options.id ? options.id : Lap.$$instances.length;
    Lap.$$instances[_this.id] = _this;

    _this.element = typeof element === 'string' ? document.querySelector(element) : element;

    _this.setLib(lib);

    _this.settings = {};
    if (options) {
      Lap.each(Lap.$$defaultSettings, function (val, key) {
        if (options.hasOwnProperty(key)) _this.settings[key] = options[key];else _this.settings[key] = val;
      });
    } else {
      _this.settings = Lap.$$defaultSettings;
    }

    _this.debug = _this.settings.debug;

    if (_this.debug) {
      _this.on('load', function () {
        return console.info('%cLap(%s) [DEBUG]:%c %o', Lap.$$debugSignature, _this.id, 'color:inherit', _this);
      });
      var echo = function echo(e) {
        _this.on(e, function () {
          return console.info('%cLap(%s) [DEBUG]:%c %s handler called', Lap.$$debugSignature, _this.id, 'color:inherit', e);
        });
      };
      echo('load');
      echo('play');
      echo('pause');
      echo('seek');
      echo('trackChange');
      echo('albumChange');
      echo('volumeChange');
    }

    if (!postpone) _this.initialize();

    return _possibleConstructorReturn(_this, _this);
  }

  /**
   * Get a Lap instance by id. Id is not an element container id; it is the `Lap#settings.id`
   * member, which if not supplied on creation, is zero-based the nth instance number.
   *
   * @param  {number} id Lap#settings.id
   * @return {Lap} the instance
   */

  _createClass(Lap, [{
    key: 'setLib',

    /**
     * Set this player's `lib` member. `lib` is the same as would
     * be passed to the Lap constructor. This method is used internally on first instantiation,
     * yet should only be called manually in the case where you want to completely replace the instances
     * lib. Note that `#update` must be called after `#setLib` for changes to take effect.
     *
     * @param {Array|Object|string} lib
     */
    value: function setLib(lib) {
      var type = typeof lib === 'undefined' ? 'undefined' : _typeof(lib);
      var isArray = lib instanceof Array;
      if (isArray) {
        this.lib = lib;
      } else if (type === 'object') {
        this.lib = [lib];
      } else if (type === 'string' && Lap.$$audioExtensionRegExp.test(lib)) {
        this.lib = [{ files: [lib] }];
      } else {
        throw new Error(lib + ' must be an array, object, or string');
      }
      return this;
    }

    /**
     * This method is basically a secondary constructor and should not really need
     * to be called manually except in the case that you want to prepare a player with its
     * settings while waiting for a lib to come back from an ajax call.
     *
     * @return {Lap} this
     */

  }, {
    key: 'initialize',
    value: function initialize() {
      var _this2 = this;

      // state
      this.seeking = false;
      this.volumeChanging = false;
      this.mouseDownTimer = 0;
      this.playing = false;

      this.update();
      this.$$initAudio();
      this.$$initElements();
      this.$$addAudioListeners();
      this.$$addVolumeListeners();
      this.$$addSeekListeners();
      this.$$addListeners();
      this.$$activatePlugins();

      Lap.each(this.settings.callbacks, function (fn, key) {
        return _this2.on(key, fn.bind(_this2));
      });

      this.trigger('load', this);

      return this;
    }

    /**
     * Configures instance variables relative to the current album.
     * Called on instance initialization and whenever an album is changed.
     * This method is also needed if you manually replace an instance's `lib` member
     * via `#setLib`, in which case you'll need to call `#update` directly after
     *
     * @return {Lap} this
     */

  }, {
    key: 'update',
    value: function update() {
      var _this3 = this;

      this.albumIndex = this.albumIndex || this.settings.startingAlbumIndex || 0;
      this.trackIndex = this.trackIndex || this.settings.startingTrackIndex || 0;
      this.albumCount = this.lib.length;
      this.playlistPopulated = false;

      var currentLibItem = this.lib[this.albumIndex];

      var keys = ['artist', 'album', 'files', 'cover', 'tracklist', 'replacement'];
      keys.forEach(function (key) {
        return _this3[key] = currentLibItem[key];
      });

      this.trackCount = this.files.length;

      // replacement in === [regexp string, replacement string, optional flags]
      // replacement out === [regexp instance, replacement]
      if (this.replacement) {
        var re = this.replacement;

        if (Array.isArray(re) && re[0] instanceof RegExp) {
          this.replacement = re;
        } else {
          if (typeof re === 'string') re = [re];

          // re may contain string-wrapped regexp (from json), convert if so
          re[0] = new RegExp(re[0], re[2] || 'g');
          re[1] = re[1] || '';

          this.replacement = re;
        }
      }

      this.$$formatTracklist();

      return this;
    }

    /**
     * Instantiate every plugin's contructor with this Lap instance
     *
     * @return {Lap} this
     * @private
     */

  }, {
    key: '$$activatePlugins',
    value: function $$activatePlugins() {
      var _this4 = this;

      this.plugins = [];
      this.settings.plugins.forEach(function (plugin, i) {
        return _this4.plugins[i] = new plugin(_this4);
      });
      return this;
    }

    /**
     * @return {Lap} this
     * @private
     */

  }, {
    key: '$$initAudio',
    value: function $$initAudio() {
      this.audio = new Audio();
      this.audio.preload = 'auto';
      var fileType = this.files[this.trackIndex];
      fileType = fileType.slice(fileType.lastIndexOf('.') + 1);
      var canPlay = this.audio.canPlayType('audio/' + fileType);
      if (canPlay === 'probably' || canPlay === 'maybe') {
        this.$$updateSource();
        this.audio.volume = 1;
      } else {
        // TODO: return a flag to signal skipping the rest of the initialization process
        console.warn('This browser does not support ' + fileType + ' playback.');
      }
      return this;
    }

    /**
     * @return {Lap} this
     * @private
     */

  }, {
    key: '$$updateSource',
    value: function $$updateSource() {
      this.audio.src = this.files[this.trackIndex];
      return this;
    }

    /**
     * @return {Lap} this
     * @private
     */

  }, {
    key: '$$initElements',
    value: function $$initElements() {
      var _this5 = this;

      this.els = {};
      this.selectors = { state: {} };
      Lap.each(Lap.$$defaultSelectors, function (selector, key) {
        if (key !== 'state') {

          _this5.selectors[key] = _this5.settings.selectors.hasOwnProperty(key) ? _this5.settings.selectors[key] : selector;

          var el = _this5.element.querySelector('.' + _this5.selectors[key]);
          if (el) _this5.els[key] = el;
        } else {
          var hasCustomState = _this5.settings.selectors.state;

          if (!hasCustomState) return _this5.selectors.state = Lap.$$defaultSelectors.state;

          Lap.each(Lap.$$defaultSelectors.state, function (sel, k) {
            _this5.selectors.state[k] = _this5.settings.selectors.state.hasOwnProperty(k) ? _this5.settings.selectors.state[k] : sel;
          });
        }
      });
    }

    /**
     * A wrapper around this Lap instances `audio.addEventListener` that
     * ensures handlers are cached for later removal via `Lap.destroy(instance)` call
     *
     * @param {string}   event       Audio Event name
     * @param {Function} listener    callback
     * @return {Lap} this
     */

  }, {
    key: 'addAudioListener',
    value: function addAudioListener(event, listener) {
      this.$$audioListeners = this.$$audioListeners || {};
      this.$$audioListeners[event] = this.$$audioListeners[event] || [];

      var bound = listener.bind(this);
      this.$$audioListeners[event].push(bound);
      this.audio.addEventListener(event, bound);
      return this;
    }

    /**
     * @return {Lap} this
     * @private
     */

  }, {
    key: '$$addAudioListeners',
    value: function $$addAudioListeners() {
      var _this6 = this;

      var audio = this.audio;
      var els = this.els;
      var nativeProgress = !!(this.settings.useNativeProgress && els.progress);

      var _addListener = function _addListener(condition, event, listener) {
        if (condition) _this6.addAudioListener(event, listener);
      };

      _addListener(!!(els.buffered || nativeProgress), 'progress', function () {
        var buffered = _this6.$$bufferFormatted();
        if (els.buffered) els.buffered.innerHTML = buffered;
        if (nativeProgress) els.progress.value = buffered;
      });

      _addListener(!!els.currentTime, 'timeupdate', function () {
        return _this6.$$updateCurrentTimeEl();
      });
      _addListener(!!els.duration, 'durationchange', function () {
        return _this6.$$updateDurationEl();
      });

      _addListener(true, 'ended', function () {
        if (_this6.playing) {
          _this6.next();
          audio.play();
        }
      });

      return this;
    }

    /**
     * A wrapper around element.addEventListener which ensures listners
     * are cached for later removal via `Lap.destroy(instance)` call
     *
     * @param {string}   elementName Lap#els elementkey
     * @param {string}   event       DOM Event name
     * @param {Function} listener    callback
     */

  }, {
    key: 'addListener',
    value: function addListener(elementName, event, listener) {
      // bypass non-existent elements
      if (!this.els[elementName]) return this;

      // ie. listeners = { seekRange: { click: [handlers], mousedown: [handlers], ... }, ... }
      this.$$listeners = this.$$listeners || {};
      this.$$listeners[elementName] = this.$$listeners[elementName] || {};
      this.$$listeners[elementName][event] = this.$$listeners[elementName][event] || [];

      var bound = listener.bind(this);
      this.$$listeners[elementName][event].push(bound);
      this.els[elementName].addEventListener(event, bound);
      return this;
    }

    /**
     * @return {Lap} this
     * @private
     */

  }, {
    key: '$$addListeners',
    value: function $$addListeners() {
      var _this7 = this;

      var els = this.els;

      this.addListener('playPause', 'click', this.togglePlay);
      this.addListener('prev', 'click', this.prev);
      this.addListener('next', 'click', this.next);
      this.addListener('prevAlbum', 'click', this.prevAlbum);
      this.addListener('nextAlbum', 'click', this.nextAlbum);
      this.addListener('volumeUp', 'click', this.$$incVolume);
      this.addListener('volumeDown', 'click', this.$$decVolume);

      var _if = function _if(elementName, fn) {
        if (_this7.els[elementName]) {
          if (typeof fn === 'string') {
            _this7[fn]();
          } else {
            // anonymous
            fn();
          }
        }
      };

      this.on('load', function () {
        _if('trackTitle', '$$updateTrackTitleEl');
        _if('trackNumber', '$$updateTrackNumberEl');
        _if('artist', '$$updateArtistEl');
        _if('album', '$$updateAlbumEl');
        _if('cover', '$$updateCover');
        _if('currentTime', '$$updateCurrentTimeEl');
        _if('duration', '$$updateDurationEl');
        _if('playPause', function () {
          var s = _this7.selectors.state;
          var pp = els.playPause;
          Lap.addClass(pp, s.paused);
          _this7.on('play', function () {
            return Lap.removeClass(pp, s.paused).addClass(pp, s.playing);
          });
          _this7.on('pause', function () {
            return Lap.removeClass(pp, s.playing).addClass(pp, s.paused);
          });
        });
      });

      this.on('trackChange', function () {
        _if('trackTitle', '$$updateTrackTitleEl');
        _if('trackNumber', '$$updateTrackNumberEl');
        _if('currentTime', '$$updateCurrentTimeEl');
        _if('duration', '$$updateDurationEl');
      });

      this.on('albumChange', function () {
        _if('trackTitle', '$$updateTrackTitleEl');
        _if('trackNumber', '$$updateTrackNumberEl');
        _if('artist', '$$updateArtistEl');
        _if('album', '$$updateAlbumEl');
        _if('cover', '$$updateCover');
      });
    }

    /**
     * @return {Lap} this
     * @private
     */

  }, {
    key: '$$addSeekListeners',
    value: function $$addSeekListeners() {
      var _this8 = this;

      var els = this.els;
      var seekRange = els.seekRange;
      var audio = this.audio;
      var useNative = !!(this.settings.useNativeSeekRange && seekRange);

      if (useNative) {
        this.addAudioListener('timeupdate', function () {
          if (!_this8.seeking) seekRange.value = Lap.scale(audio.currentTime, 0, audio.duration, 0, 100);
        });
        this.addListener('seekRange', 'mousedown', function () {
          return _this8.seeking = true;
        });
        this.addListener('seekRange', 'mouseup', function () {
          audio.currentTime = Lap.scale(seekRange.value, 0, seekRange.max, 0, audio.duration);
          _this8.trigger('seek');
          _this8.seeking = false;
        });
      }

      var maybeWarn = function maybeWarn() {
        if (_this8.debug && seekRange) {
          var c = 'color:darkgreen;font-family:monospace';
          var r = 'color:inherit';
          console.warn('\n          %cLap(%s) [DEBUG]:\n          %cSimultaneous use of %cLap#els.seekRange%c and\n          %cLap#els.seekForward|seekBackward%c is redundant.\n          Consider choosing one or the other.\n          '.split('\n').map(function (s) {
            return s.trim();
          }).join(' '), Lap.$$debugSignature, _this8.id, r, c, r, c, r);
        }
      };

      if (els.seekForward) {
        maybeWarn();
        this.addListener('seekForward', 'mousedown', function () {
          _this8.seeking = true;
          _this8.$$seekForward();
        });
        this.addListener('seekForward', 'mouseup', function () {
          _this8.seeking = false;
          clearTimeout(_this8.mouseDownTimer);
          _this8.trigger('seek');
        });
      }

      if (els.seekBackward) {
        maybeWarn();
        this.addListener('seekBackward', 'mousedown', function () {
          _this8.seeking = true;
          _this8.$$seekBackward();
        });
        this.addListener('seekBackward', 'mouseup', function () {
          _this8.seeking = false;
          clearTimeout(_this8.mouseDownTimer);
          _this8.trigger('seek');
        });
      }
    }
  }, {
    key: '$$seekBackward',
    value: function $$seekBackward() {
      var _this9 = this;

      if (!this.seeking) return this;
      this.mouseDownTimer = setInterval(function () {
        var x = _this9.audio.currentTime + _this9.settings.seekInterval * -1;
        _this9.audio.currentTime = x < 0 ? 0 : x;
      }, this.settings.seekTime);
      return this;
    }
  }, {
    key: '$$seekForward',
    value: function $$seekForward() {
      var _this10 = this;

      if (!this.seeking) return this;
      this.mouseDownTimer = setInterval(function () {
        var x = _this10.audio.currentTime + _this10.settings.seekInterval;
        _this10.audio.currentTime = x > _this10.audio.duration ? _this10.audio.duration : x;
      }, this.settings.seekTime);
      return this;
    }
  }, {
    key: '$$addVolumeListeners',
    value: function $$addVolumeListeners() {
      var _this11 = this;

      var els = this.els;
      var volumeRange = els.volumeRange;
      var volumeRead = els.volumeRead;
      var volumeUp = els.volumeUp;
      var volumeDown = els.volumeDown;

      if (volumeRead) {
        var fn = function fn() {
          return volumeRead.innerHTML = Math.round(_this11.audio.volume * 100);
        };
        this.on('volumeChange', fn);
        fn();
      }

      if (this.settings.useNativeVolumeRange && volumeRange) {

        var fn = function fn() {
          if (!_this11.volumeChanging) volumeRange.value = Math.round(_this11.audio.volume * 100);
        };
        this.addAudioListener('volumechange', fn);
        this.on('load', fn);

        this.addListener('volumeRange', 'mousedown', function () {
          return _this11.volumeChanging = true;
        });
        this.addListener('volumeRange', 'mouseup', function () {
          _this11.audio.volume = volumeRange.value * 0.01;
          _this11.trigger('volumeChange');
          _this11.volumeChanging = false;
        });
      }

      var maybeWarn = function maybeWarn() {
        if (_this11.debug && volumeRange) {
          var c = 'color:darkgreen;font-family:monospace';
          var r = 'color:inherit';
          console.warn('\n          %cLap(%s) [DEBUG]:\n          %cSimultaneous use of %cLap#els.volumeRange%c and\n          %cLap#els.volumeUp|volumeDown%c is redundant.\n          Consider choosing one or the other.\n          '.split('\n').map(function (s) {
            return s.trim();
          }).join(' '), Lap.$$debugSignature, _this11.id, r, c, r, c, r);
        }
      };

      if (volumeUp) {
        maybeWarn();
        this.addListener('volumeUp', 'click', function () {
          return _this11.$$incVolume();
        });
      }
      if (volumeDown) {
        maybeWarn();
        this.addListener('volumeDown', 'click', function () {
          return _this11.$$decVolume();
        });
      }
    }
  }, {
    key: '$$incVolume',
    value: function $$incVolume() {
      var v = this.audio.volume;
      var i = this.settings.volumeInterval;
      this.audio.volume = v + i > 1 ? 1 : v + i;
      this.trigger('volumeChange');
      return this;
    }
  }, {
    key: '$$decVolume',
    value: function $$decVolume() {
      var v = this.audio.volume;
      var i = this.settings.volumeInterval;
      this.audio.volume = v - i < 0 ? 0 : v - i;
      this.trigger('volumeChange');
      return this;
    }
  }, {
    key: '$$updateCurrentTimeEl',
    value: function $$updateCurrentTimeEl() {
      this.els.currentTime.innerHTML = this.$$currentTimeFormatted();
      return this;
    }
  }, {
    key: '$$updateDurationEl',
    value: function $$updateDurationEl() {
      this.els.duration.innerHTML = this.$$durationFormatted();
      return this;
    }
  }, {
    key: '$$updateTrackTitleEl',
    value: function $$updateTrackTitleEl() {
      this.els.trackTitle.innerHTML = this.tracklist[this.trackIndex];
      return this;
    }
  }, {
    key: '$$updateTrackNumberEl',
    value: function $$updateTrackNumberEl() {
      this.els.trackNumber.innerHTML = +this.trackIndex + 1;
      return this;
    }
  }, {
    key: '$$updateArtistEl',
    value: function $$updateArtistEl() {
      this.els.artist.innerHTML = this.artist;
      return this;
    }
  }, {
    key: '$$updateAlbumEl',
    value: function $$updateAlbumEl() {
      this.els.album.innerHTML = this.album;
      return this;
    }
  }, {
    key: '$$updateCover',
    value: function $$updateCover() {
      this.els.cover.src = this.cover;
      return this;
    }
  }, {
    key: 'togglePlay',
    value: function togglePlay() {
      this.audio.paused ? this.play() : this.pause();
      this.trigger('togglePlay');
      return this;
    }
  }, {
    key: 'play',
    value: function play() {
      if (Lap.exclusiveMode) Lap.each(Lap.$$instances, function (instance) {
        return instance.pause();
      });
      this.audio.play();
      this.playing = true;
      this.trigger('play');
      return this;
    }
  }, {
    key: 'pause',
    value: function pause() {
      this.audio.pause();
      this.playing = false;
      this.trigger('pause');
      return this;
    }
  }, {
    key: 'setTrack',
    value: function setTrack(index) {
      if (index <= 0) {
        this.trackIndex = 0;
      } else if (index >= this.trackCount) {
        this.trackIndex = this.trackCount - 1;
      } else {
        this.trackIndex = index;
      }
      var wasPlaying = !this.audio.paused;
      this.$$updateSource();
      if (wasPlaying) this.audio.play();
      this.trigger('trackChange');
      return this;
    }
  }, {
    key: 'prev',
    value: function prev() {
      var wasPlaying = !this.audio.paused;
      this.trackIndex = this.trackIndex - 1 < 0 ? this.trackCount - 1 : this.trackIndex - 1;
      this.$$updateSource();
      if (wasPlaying) this.audio.play();
      this.trigger('trackChange');
      return this;
    }
  }, {
    key: 'next',
    value: function next() {
      var wasPlaying = !this.audio.paused;
      this.trackIndex = this.trackIndex + 1 >= this.trackCount ? 0 : this.trackIndex + 1;
      this.$$updateSource();
      if (wasPlaying) this.audio.play();
      this.trigger('trackChange');
      return this;
    }
  }, {
    key: 'prevAlbum',
    value: function prevAlbum() {
      var wasPlaying = !this.audio.paused;
      this.albumIndex = this.albumIndex - 1 < 0 ? this.albumCount - 1 : this.albumIndex - 1;
      this.update();
      this.trackIndex = 0;
      this.$$updateSource();
      if (wasPlaying) this.audio.play();
      this.trigger('albumChange');
      return this;
    }
  }, {
    key: 'nextAlbum',
    value: function nextAlbum() {
      var wasPlaying = !this.audio.paused;
      this.albumIndex = this.albumIndex + 1 > this.albumCount - 1 ? 0 : this.albumIndex + 1;
      this.update();
      this.trackIndex = 0;
      this.$$updateSource();
      if (wasPlaying) this.audio.play();
      this.trigger('albumChange');
      return this;
    }
  }, {
    key: 'setAlbum',
    value: function setAlbum(index) {
      if (index <= 0) {
        this.albumIndex = 0;
      } else if (index >= this.albumCount) {
        this.albumIndex = this.albumCount - 1;
      } else {
        this.albumIndex = index;
      }
      this.update();
      this.setTrack(this.lib[this.albumIndex].startingTrackIndex || 0);
      this.trigger('albumChange');
      return this;
    }
  }, {
    key: '$$formatTracklist',
    value: function $$formatTracklist() {
      if (this.tracklist && this.tracklist.length) return this;

      var re = this.replacement;
      var tracklist = [];
      for (var i = 0; i < this.trackCount; i++) {
        var t = this.files[i];
        // strip ext
        t = t.slice(0, t.lastIndexOf('.'));
        // get last path segment
        t = t.slice(t.lastIndexOf('/') + 1);
        if (re) t = t.replace(re[0], re[1]);
        tracklist[i] = t.trim();
      }
      this.tracklist = tracklist;
      return this;
    }
  }, {
    key: '$$bufferFormatted',
    value: function $$bufferFormatted() {
      if (!this.audio) return 0;

      var audio = this.audio;
      var buffered = undefined;

      try {
        buffered = audio.buffered.end(audio.buffered.length - 1);
      } catch (e) {
        return 0;
      }

      var formatted = Math.round(buffered / audio.duration * 100);
      // var formatted = Math.round(_.scale(buffered, 0, audio.duration, 0, 100))
      return isNaN(formatted) ? 0 : formatted;
    }

    /**
     * @return {Lap} this
     * @private
     */

  }, {
    key: '$$getAudioTimeFormatted',
    value: function $$getAudioTimeFormatted(audioProp) {
      if (isNaN(this.audio.duration)) return '00:00';
      var formatted = Lap.formatTime(Math.floor(this.audio[audioProp].toFixed(1)));
      if (this.audio.duration < 3600 || formatted === '00:00:00') {
        formatted = formatted.slice(3); // nn:nn
      }
      return formatted;
    }
  }, {
    key: '$$currentTimeFormatted',
    value: function $$currentTimeFormatted() {
      return this.$$getAudioTimeFormatted('currentTime');
    }
  }, {
    key: '$$durationFormatted',
    value: function $$durationFormatted() {
      return this.$$getAudioTimeFormatted('duration');
    }
  }, {
    key: 'trackNumberFormatted',
    value: function trackNumberFormatted(n) {
      var count = String(this.trackCount).length - String(n).length;
      return '0'.repeat(count) + n + this.settings.trackNumberPostfix;
      // return _.repeat('0', count) + n + this.settings.trackNumberPostfix
    }
  }, {
    key: 'get',
    value: function get(key, index) {
      return this.lib[index === undefined ? this.albumIndex : index][key];
    }
  }], [{
    key: 'getInstance',
    value: function getInstance(id) {
      return Lap.$$instances[id];
    }

    /**
     * Add class `class` to HTML Element `el`
     *
     * @param {HTML Element} el
     * @param {string} _class
     */

  }, {
    key: 'addClass',
    value: function addClass(el, _class) {
      if (!el) return console.warn(el + ' is not defined');
      if (!el.className) {
        return el.className += ' ' + _class;
      }
      var classNames = el.className;
      var newClasses = _class.split(/\s+/).filter(function (n) {
        return classNames.indexOf(n) === -1;
      }).join(' ');
      el.className += ' ' + newClasses;
      return Lap;
    }

    /**
     * Remove class `class` from HTML Element `el`
     *
     * @param {HTML Element} el
     * @param {string} _class
     */

  }, {
    key: 'removeClass',
    value: function removeClass(el, _class) {
      if (!el) return console.warn(el + ' is not defined');
      // uncomment for multiple class removal
      // _class = `(${_class.split(/\s+/).join('|')})`

      // TODO: cache?
      var re = new RegExp('\\s*' + _class + '\\s*(![\\w\\W])?', 'g');
      el.className = el.className.replace(re, ' ').trim();
      return Lap;
    }

    /**
     * Convert milliseconds into hh:mm:ss format
     *
     * @param  {string|number} time milliseconds
     * @return {string} `time` in hh:mm:ss format
     */

  }, {
    key: 'formatTime',
    value: function formatTime(time) {
      var h = Math.floor(time / 3600);
      var m = Math.floor((time - h * 3600) / 60);
      var s = Math.floor(time - h * 3600 - m * 60);
      if (h < 10) h = '0' + h;
      if (m < 10) m = '0' + m;
      if (s < 10) s = '0' + s;
      return h + ':' + m + ':' + s;
    }

    /**
     * Barebones forEach for object
     *
     * @param  {Object}   obj POJO
     * @param  {Function} fn  iterator called val,key,obj
     * @param  {Object}   ctx optional context
     * @return {undefined}
     */

  }, {
    key: 'each',
    value: function each(obj, fn, ctx) {
      var keys = Object.keys(obj);
      var i = 0,
          len = keys.length;
      for (; i < len; i++) {
        fn.call(ctx, obj[keys[i]], keys[i], obj);
      }
    }

    /**
     * Scale a number from one range to another
     *
     * @param  {number} n      the number to scale
     * @param  {number} oldMin
     * @param  {number} oldMax
     * @param  {number} min    the new min [default=0]
     * @param  {number} max    the new max [default=1]
     * @return {number}        the scaled number
     */

  }, {
    key: 'scale',
    value: function scale(n, oldMin, oldMax, min, max) {
      return (n - oldMin) * (max - min) / (oldMax - oldMin) + min;
    }

    /**
     * Removes all dom, audio, and internal event handlers from the given Lap instance,
     * then deletes all properties
     *
     * @param  {Lap} lap the Lap instance
     * @return {null}
     */

  }, {
    key: 'destroy',
    value: function destroy(lap) {

      // remove dom event handlers
      Lap.each(lap.$$listeners, function (events, elementName) {
        return delete lap.$$listeners[elementName];
      });

      // remove audio events
      Lap.each(lap.$$audioListeners, function (listeners, event) {
        return delete lap.$$audioListeners[event];
      });

      // remove all super handlers
      lap.remove();

      // nullify elements
      Lap.each(lap.els, function (element, elName) {
        return delete lap.els[elName];
      });

      // everything else just in case
      Lap.each(lap, function (val, key) {
        return delete lap[key];
      });

      return null;
    }
  }]);

  return Lap;
})(Bus);

/**
 * If set true, only one Lap can be playing at a given time
 * @type {Boolean}
 */

exports.default = Lap;
Lap.exclusiveMode = false;

/**
 * console format prefix used when Lap#settings.debugdebug=true
 *
 * @private
 * @type {String}
 */
Lap.$$debugSignature = 'color:teal;font-weight:bold';

/**
 * Lap instance cache
 *
 * @private
 * @type {Object}
 */
Lap.$$instances = {};

/**
 * @private
 * @type {RegExp}
 */
Lap.$$audioExtensionRegExp = /mp3|wav|ogg|aiff/i;

/**
 * @private
 * @type {Object}
 */
Lap.$$defaultSettings = {

  /**
   * Register callbacks for any custom Lap event, where the object key
   * is the event name, and the value is the callback. Current list of
   * custom events that are fired include:
   *
   * + load
   * + play
   * + pause
   * + togglePlay
   * + seek
   * + trackChange
   * + albumChange
   * + volumeChange
   *
   * These events are fired at the end of their respective
   * DOM and Audio event lifecycles, as well as Lap logic attached to those. For example when
   * Lap#els.playPause is clicked when initially paused, the DOM event is fired, Audio will begin playing,
   * Lap will remove the lap--paused class and add the lap--playing class to the element, and finally
   * the custom 'play' event is triggered. Note also that you can subscribe to any custom event
   * via `Lap#on(event, callback)`
   *
   * @type {Object}
   */
  callbacks: {},

  /**
   * When true, outputs basic inspection info and warnings
   *
   * @type {Boolean}
   */
  debug: false,

  /**
   * Supply an array of plugins (constructors) which will
   * be called with the Lap instance as their sole argument.
   * The plugin instances themselves will be available in the same order
   * via `Lap#plugins` array
   *
   * @type {Array}
   */
  plugins: [],

  startingAlbumIndex: 0,
  startingTrackIndex: 0,

  /**
   * The amount of milliseconds to wait while holding
   * `Lap#els.seekBackward` or `Lap#els.seekForward` before executing another
   * seek instruction
   *
   * @type {Number}
   */
  seekInterval: 5,

  /**
   * How far forward or back in milliseconds to seek when
   * calling seekForward or seekBackward
   *
   * @type {Number}
   */
  seekTime: 250,

  /**
   * Provide your own custom selectors for each element
   * in the Lap#els hash. Otherwise Lap.$$defaultSelectors are used
   *
   * @type {Object}
   */
  selectors: {},

  trackNumberPostfix: ' - ',

  /**
   * Signal that you will be using a native HTML5 `progress` element
   * to track audio buffered amount. Requires that a `lap__progress` element
   * is found under the `Lap#element`
   *
   * @type {Boolean}
   */
  useNativeProgress: false,

  /**
   * Signal that you will be using a native HTML5 `input[type=range]` element
   * for track seeking control. Requires that a `lap__seek-range` element
   * is found under the `Lap#element`
   *
   * @type {Boolean}
   */
  useNativeSeekRange: false,

  /**
   * Signal that you will be using a native HTML5 `input[type=range]` element
   * for volume control. Requires that a `lap__volume-range` element
   * is found under the `Lap#element`
   *
   * @type {Boolean}
   */
  useNativeVolumeRange: false,

  /**
   * Set the amount of volume to increment/decrement whenever
   * a `lap__volume-up` or `lap__volume-down` element is clicked.
   * Note that audio volume is floating point range [0, 1]
   * Does not apply to `lap__volume-range`.
   *
   * @type {Number}
   */
  volumeInterval: 0.05
};

Lap.$$defaultSelectors = {
  state: {
    playlistItemCurrent: 'lap__playlist__item--current',
    playing: 'lap--playing',
    paused: 'lap--paused',
    hidden: 'lap--hidden'
  },
  album: 'lap__album',
  artist: 'lap__artist',
  buffered: 'lap__buffered',
  cover: 'lap__cover',
  currentTime: 'lap__current-time',
  discog: 'lap__discog',
  discogItem: 'lap__discog__item',
  discogPanel: 'lap__discog__panel',
  duration: 'lap__duration',
  info: 'lap__info', // button
  infoPanel: 'lap__info-panel',
  next: 'lap__next',
  nextAlbum: 'lap__next-album',
  playPause: 'lap__play-pause',
  playlist: 'lap__playlist', // button
  playlistItem: 'lap__playlist__item', // list item
  playlistPanel: 'lap__playlist__panel',
  playlistTrackNumber: 'lap__playlist__track-number',
  playlistTrackTitle: 'lap__playlist__track-title',
  prev: 'lap__prev',
  prevAlbum: 'lap__prev-album',
  progress: 'lap__progress',
  seekBackward: 'lap__seek-backward',
  seekForward: 'lap__seek-forward',
  seekRange: 'lap__seek-range',
  trackNumber: 'lap__track-number', // the currently cued track
  trackTitle: 'lap__track-title',
  volumeButton: 'lap__volume-button',
  volumeDown: 'lap__volume-down',
  volumeRead: 'lap__volume-read',
  volumeRange: 'lap__volume-range',
  volumeUp: 'lap__volume-up'
};

if (window) window.Lap = Lap;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGxhcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNXcUIsR0FBRztZQUFILEdBQUc7Ozs7Ozs7Ozs7O0FBVXRCLFdBVm1CLEdBQUcsQ0FVVixPQUFPLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBa0I7UUFBaEIsUUFBUSx5REFBQyxLQUFLOzswQkFWOUIsR0FBRzs7Ozt1RUFBSCxHQUFHOztBQWNwQixVQUFLLEVBQUUsR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDLEVBQUUsR0FBRyxPQUFPLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFBO0FBQ3JFLE9BQUcsQ0FBQyxXQUFXLENBQUMsTUFBSyxFQUFFLENBQUMsUUFBTyxDQUFBOztBQUUvQixVQUFLLE9BQU8sR0FBRyxPQUFPLE9BQU8sS0FBSyxRQUFRLEdBQ3RDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQy9CLE9BQU8sQ0FBQTs7QUFFWCxVQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTs7QUFFaEIsVUFBSyxRQUFRLEdBQUcsRUFBRSxDQUFBO0FBQ2xCLFFBQUksT0FBTyxFQUFFO0FBQ1gsU0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsVUFBQyxHQUFHLEVBQUUsR0FBRyxFQUFLO0FBQzVDLFlBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFLLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUEsS0FDN0QsTUFBSyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBO09BQzlCLENBQUMsQ0FBQTtLQUNILE1BQU07QUFDTCxZQUFLLFFBQVEsR0FBRyxHQUFHLENBQUMsaUJBQWlCLENBQUE7S0FDdEM7O0FB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QW9CO0FBQ3pDLFlBQVUsRUFBVyxrQkFBa0I7QUFDdkMsWUFBVSxFQUFXLGtCQUFrQjtBQUN2QyxhQUFXLEVBQVUsbUJBQW1CO0FBQ3hDLFVBQVEsRUFBYSxnQkFBZ0I7Q0FDdEMsQ0FBQTs7QUFFRCxJQUFJLE1BQU0sRUFBRSxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcclxuICogbGFwLmpzIHZlcnNpb24gMC42LjBcclxuICogSFRNTDUgYXVkaW8gcGxheWVyXHJcbiAqXHJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9Mb2t1YS9sYXAuZ2l0XHJcbiAqIGh0dHA6Ly9sb2t1YS5uZXRcclxuICpcclxuICogQ29weXJpZ2h0IMKpIDIwMTQsIDIwMTUgSm9zaHVhIEtsZWNrbmVyIDxkZXZAbG9rdWEubmV0PlxyXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExhcCBleHRlbmRzIEJ1cyB7XHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIGNvbnN0cnVjdG9yLlxyXG4gICAqIEBwYXJhbSAge1N0cmluZ3xIVE1MIEVsZW1lbnR9IGVsZW1lbnQgY29udGFpbmVyIGVsZW1lbnRcclxuICAgKiBAcGFyYW0gIHtBcnJheXxPYmplY3R8U3RyaW5nfSBsaWIgYSBMYXAgXCJsaWJyYXJ5XCIsIHdoaWNoIGNhbiBiZSBhbiBhcnJheSBvZlxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGJ1bSBvYmplY3RzLCBhIHNpbmdsZSBhbGJ1bSBvYmplY3QsIG9yIGEgdXJsIHRvIGFcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlIGF1ZGlvIGZpbGVcclxuICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgIHNldHRpbmdzIGhhc2ggdGhhdCB3aWxsIGJlIG1lcmdlZCB3aXRoIExhcC4kJGRlZmF1bHRTZXR0aW5nc1xyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIGxpYiwgb3B0aW9ucywgcG9zdHBvbmU9ZmFsc2UpIHtcclxuICAgIHN1cGVyKClcclxuXHJcbiAgICAvLyBkZWZhdWx0IGlkIHRvIHplcm8tYmFzZWQgaW5kZXggaW5jcmVtZW50ZXJcclxuICAgIHRoaXMuaWQgPSBvcHRpb25zICYmIG9wdGlvbnMuaWQgPyBvcHRpb25zLmlkIDogTGFwLiQkaW5zdGFuY2VzLmxlbmd0aFxyXG4gICAgTGFwLiQkaW5zdGFuY2VzW3RoaXMuaWRdID0gdGhpc1xyXG5cclxuICAgIHRoaXMuZWxlbWVudCA9IHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJ1xyXG4gICAgICA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudClcclxuICAgICAgOiBlbGVtZW50XHJcblxyXG4gICAgdGhpcy5zZXRMaWIobGliKVxyXG5cclxuICAgIHRoaXMuc2V0dGluZ3MgPSB7fVxyXG4gICAgaWYgKG9wdGlvbnMpIHtcclxuICAgICAgTGFwLmVhY2goTGFwLiQkZGVmYXVsdFNldHRpbmdzLCAodmFsLCBrZXkpID0+IHtcclxuICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB0aGlzLnNldHRpbmdzW2tleV0gPSBvcHRpb25zW2tleV1cclxuICAgICAgICBlbHNlIHRoaXMuc2V0dGluZ3Nba2V5XSA9IHZhbFxyXG4gICAgICB9KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5zZXR0aW5ncyA9IExhcC4kJGRlZmF1bHRTZXR0aW5nc1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZGVidWcgPSB0aGlzLnNldHRpbmdzLmRlYnVnXHJcblxyXG5cclxuICAgIGlmICh0aGlzLmRlYnVnKSB7XHJcbiAgICAgIHRoaXMub24oJ2xvYWQnLCAoKSA9PiBjb25zb2xlLmluZm8oJyVjTGFwKCVzKSBbREVCVUddOiVjICVvJyxcclxuICAgICAgICBMYXAuJCRkZWJ1Z1NpZ25hdHVyZSwgdGhpcy5pZCwgJ2NvbG9yOmluaGVyaXQnLCB0aGlzKSlcclxuICAgICAgY29uc3QgZWNobyA9IGUgPT4ge1xyXG4gICAgICAgIHRoaXMub24oZSwgKCkgPT4gY29uc29sZS5pbmZvKCclY0xhcCglcykgW0RFQlVHXTolYyAlcyBoYW5kbGVyIGNhbGxlZCcsXHJcbiAgICAgICAgICBMYXAuJCRkZWJ1Z1NpZ25hdHVyZSwgdGhpcy5pZCwgJ2NvbG9yOmluaGVyaXQnLCBlKSlcclxuICAgICAgfVxyXG4gICAgICBlY2hvKCdsb2FkJylcclxuICAgICAgZWNobygncGxheScpXHJcbiAgICAgIGVjaG8oJ3BhdXNlJylcclxuICAgICAgZWNobygnc2VlaycpXHJcbiAgICAgIGVjaG8oJ3RyYWNrQ2hhbmdlJylcclxuICAgICAgZWNobygnYWxidW1DaGFuZ2UnKVxyXG4gICAgICBlY2hvKCd2b2x1bWVDaGFuZ2UnKVxyXG4gICAgfVxyXG5cclxuICAgIGlmICghcG9zdHBvbmUpIHRoaXMuaW5pdGlhbGl6ZSgpXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBhIExhcCBpbnN0YW5jZSBieSBpZC4gSWQgaXMgbm90IGFuIGVsZW1lbnQgY29udGFpbmVyIGlkOyBpdCBpcyB0aGUgYExhcCNzZXR0aW5ncy5pZGBcclxuICAgKiBtZW1iZXIsIHdoaWNoIGlmIG5vdCBzdXBwbGllZCBvbiBjcmVhdGlvbiwgaXMgemVyby1iYXNlZCB0aGUgbnRoIGluc3RhbmNlIG51bWJlci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSAge251bWJlcn0gaWQgTGFwI3NldHRpbmdzLmlkXHJcbiAgICogQHJldHVybiB7TGFwfSB0aGUgaW5zdGFuY2VcclxuICAgKi9cclxuICBzdGF0aWMgZ2V0SW5zdGFuY2UoaWQpIHtcclxuICAgIHJldHVybiBMYXAuJCRpbnN0YW5jZXNbaWRdXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGQgY2xhc3MgYGNsYXNzYCB0byBIVE1MIEVsZW1lbnQgYGVsYFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtIVE1MIEVsZW1lbnR9IGVsXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IF9jbGFzc1xyXG4gICAqL1xyXG4gIHN0YXRpYyBhZGRDbGFzcyhlbCwgX2NsYXNzKSB7XHJcbiAgICBpZiAoIWVsKSByZXR1cm4gY29uc29sZS53YXJuKGAke2VsfSBpcyBub3QgZGVmaW5lZGApXHJcbiAgICBpZiAoIWVsLmNsYXNzTmFtZSkge1xyXG4gICAgICByZXR1cm4gKGVsLmNsYXNzTmFtZSArPSAnICcgKyBfY2xhc3MpXHJcbiAgICB9XHJcbiAgICBjb25zdCBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lXHJcbiAgICBjb25zdCBuZXdDbGFzc2VzID0gX2NsYXNzXHJcbiAgICAgIC5zcGxpdCgvXFxzKy8pXHJcbiAgICAgIC5maWx0ZXIobiA9PiBjbGFzc05hbWVzLmluZGV4T2YobikgPT09IC0xKVxyXG4gICAgICAuam9pbignICcpXHJcbiAgICBlbC5jbGFzc05hbWUgKz0gJyAnICsgbmV3Q2xhc3Nlc1xyXG4gICAgcmV0dXJuIExhcFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIGNsYXNzIGBjbGFzc2AgZnJvbSBIVE1MIEVsZW1lbnQgYGVsYFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtIVE1MIEVsZW1lbnR9IGVsXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IF9jbGFzc1xyXG4gICAqL1xyXG4gIHN0YXRpYyByZW1vdmVDbGFzcyhlbCwgX2NsYXNzKSB7XHJcbiAgICBpZiAoIWVsKSByZXR1cm4gY29uc29sZS53YXJuKGAke2VsfSBpcyBub3QgZGVmaW5lZGApXHJcbiAgICAvLyB1bmNvbW1lbnQgZm9yIG11bHRpcGxlIGNsYXNzIHJlbW92YWxcclxuICAgIC8vIF9jbGFzcyA9IGAoJHtfY2xhc3Muc3BsaXQoL1xccysvKS5qb2luKCd8Jyl9KWBcclxuXHJcbiAgICAvLyBUT0RPOiBjYWNoZT9cclxuICAgIGNvbnN0IHJlID0gbmV3IFJlZ0V4cCgnXFxcXHMqJyArIF9jbGFzcyArICdcXFxccyooIVtcXFxcd1xcXFxXXSk/JywgJ2cnKVxyXG4gICAgZWwuY2xhc3NOYW1lID0gZWwuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcgJykudHJpbSgpXHJcbiAgICByZXR1cm4gTGFwXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0IG1pbGxpc2Vjb25kcyBpbnRvIGhoOm1tOnNzIGZvcm1hdFxyXG4gICAqXHJcbiAgICogQHBhcmFtICB7c3RyaW5nfG51bWJlcn0gdGltZSBtaWxsaXNlY29uZHNcclxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IGB0aW1lYCBpbiBoaDptbTpzcyBmb3JtYXRcclxuICAgKi9cclxuICBzdGF0aWMgZm9ybWF0VGltZSh0aW1lKSB7XHJcbiAgICBsZXQgaCA9IE1hdGguZmxvb3IodGltZSAvIDM2MDApXHJcbiAgICBsZXQgbSA9IE1hdGguZmxvb3IoKHRpbWUgLSAoaCAqIDM2MDApKSAvIDYwKVxyXG4gICAgbGV0IHMgPSBNYXRoLmZsb29yKHRpbWUgLSAoaCAqIDM2MDApIC0gKG0gKiA2MCkpXHJcbiAgICBpZiAoaCA8IDEwKSBoID0gJzAnICsgaFxyXG4gICAgaWYgKG0gPCAxMCkgbSA9ICcwJyArIG1cclxuICAgIGlmIChzIDwgMTApIHMgPSAnMCcgKyBzXHJcbiAgICByZXR1cm4gaCArICc6JyArIG0gKyAnOicgKyBzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBCYXJlYm9uZXMgZm9yRWFjaCBmb3Igb2JqZWN0XHJcbiAgICpcclxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgb2JqIFBPSk9cclxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gIGl0ZXJhdG9yIGNhbGxlZCB2YWwsa2V5LG9ialxyXG4gICAqIEBwYXJhbSAge09iamVjdH0gICBjdHggb3B0aW9uYWwgY29udGV4dFxyXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cclxuICAgKi9cclxuICBzdGF0aWMgZWFjaChvYmosIGZuLCBjdHgpIHtcclxuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhvYmopXHJcbiAgICBsZXQgaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoXHJcbiAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSBmbi5jYWxsKGN0eCwgb2JqW2tleXNbaV1dLCBrZXlzW2ldLCBvYmopXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTY2FsZSBhIG51bWJlciBmcm9tIG9uZSByYW5nZSB0byBhbm90aGVyXHJcbiAgICpcclxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IG4gICAgICB0aGUgbnVtYmVyIHRvIHNjYWxlXHJcbiAgICogQHBhcmFtICB7bnVtYmVyfSBvbGRNaW5cclxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IG9sZE1heFxyXG4gICAqIEBwYXJhbSAge251bWJlcn0gbWluICAgIHRoZSBuZXcgbWluIFtkZWZhdWx0PTBdXHJcbiAgICogQHBhcmFtICB7bnVtYmVyfSBtYXggICAgdGhlIG5ldyBtYXggW2RlZmF1bHQ9MV1cclxuICAgKiBAcmV0dXJuIHtudW1iZXJ9ICAgICAgICB0aGUgc2NhbGVkIG51bWJlclxyXG4gICAqL1xyXG4gIHN0YXRpYyBzY2FsZShuLCBvbGRNaW4sIG9sZE1heCwgbWluLCBtYXgpIHtcclxuICAgIHJldHVybiAoKChuLW9sZE1pbikqKG1heC1taW4pKSAvIChvbGRNYXgtb2xkTWluKSkgKyBtaW5cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgYWxsIGRvbSwgYXVkaW8sIGFuZCBpbnRlcm5hbCBldmVudCBoYW5kbGVycyBmcm9tIHRoZSBnaXZlbiBMYXAgaW5zdGFuY2UsXHJcbiAgICogdGhlbiBkZWxldGVzIGFsbCBwcm9wZXJ0aWVzXHJcbiAgICpcclxuICAgKiBAcGFyYW0gIHtMYXB9IGxhcCB0aGUgTGFwIGluc3RhbmNlXHJcbiAgICogQHJldHVybiB7bnVsbH1cclxuICAgKi9cclxuICBzdGF0aWMgZGVzdHJveShsYXApIHtcclxuXHJcbiAgICAvLyByZW1vdmUgZG9tIGV2ZW50IGhhbmRsZXJzXHJcbiAgICBMYXAuZWFjaChsYXAuJCRsaXN0ZW5lcnMsIChldmVudHMsIGVsZW1lbnROYW1lKSA9PiBkZWxldGUgbGFwLiQkbGlzdGVuZXJzW2VsZW1lbnROYW1lXSlcclxuXHJcbiAgICAvLyByZW1vdmUgYXVkaW8gZXZlbnRzXHJcbiAgICBMYXAuZWFjaChsYXAuJCRhdWRpb0xpc3RlbmVycywgKGxpc3RlbmVycywgZXZlbnQpID0+IGRlbGV0ZSBsYXAuJCRhdWRpb0xpc3RlbmVyc1tldmVudF0pXHJcblxyXG4gICAgLy8gcmVtb3ZlIGFsbCBzdXBlciBoYW5kbGVyc1xyXG4gICAgbGFwLnJlbW92ZSgpXHJcblxyXG4gICAgLy8gbnVsbGlmeSBlbGVtZW50c1xyXG4gICAgTGFwLmVhY2gobGFwLmVscywgKGVsZW1lbnQsIGVsTmFtZSkgPT4gZGVsZXRlIGxhcC5lbHNbZWxOYW1lXSlcclxuXHJcbiAgICAvLyBldmVyeXRoaW5nIGVsc2UganVzdCBpbiBjYXNlXHJcbiAgICBMYXAuZWFjaChsYXAsICh2YWwsIGtleSkgPT4gZGVsZXRlIGxhcFtrZXldKVxyXG5cclxuICAgIHJldHVybiBudWxsXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhpcyBwbGF5ZXIncyBgbGliYCBtZW1iZXIuIGBsaWJgIGlzIHRoZSBzYW1lIGFzIHdvdWxkXHJcbiAgICogYmUgcGFzc2VkIHRvIHRoZSBMYXAgY29uc3RydWN0b3IuIFRoaXMgbWV0aG9kIGlzIHVzZWQgaW50ZXJuYWxseSBvbiBmaXJzdCBpbnN0YW50aWF0aW9uLFxyXG4gICAqIHlldCBzaG91bGQgb25seSBiZSBjYWxsZWQgbWFudWFsbHkgaW4gdGhlIGNhc2Ugd2hlcmUgeW91IHdhbnQgdG8gY29tcGxldGVseSByZXBsYWNlIHRoZSBpbnN0YW5jZXNcclxuICAgKiBsaWIuIE5vdGUgdGhhdCBgI3VwZGF0ZWAgbXVzdCBiZSBjYWxsZWQgYWZ0ZXIgYCNzZXRMaWJgIGZvciBjaGFuZ2VzIHRvIHRha2UgZWZmZWN0LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBsaWJcclxuICAgKi9cclxuICBzZXRMaWIobGliKSB7XHJcbiAgICBjb25zdCB0eXBlID0gdHlwZW9mIGxpYlxyXG4gICAgY29uc3QgaXNBcnJheSA9IGxpYiBpbnN0YW5jZW9mIEFycmF5XHJcbiAgICBpZiAoaXNBcnJheSkge1xyXG4gICAgICB0aGlzLmxpYiA9IGxpYlxyXG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xyXG4gICAgICB0aGlzLmxpYiA9IFtsaWJdXHJcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnICYmIExhcC4kJGF1ZGlvRXh0ZW5zaW9uUmVnRXhwLnRlc3QobGliKSkge1xyXG4gICAgICB0aGlzLmxpYiA9IFt7IGZpbGVzOiBbbGliXSB9XVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2xpYn0gbXVzdCBiZSBhbiBhcnJheSwgb2JqZWN0LCBvciBzdHJpbmdgKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoaXMgbWV0aG9kIGlzIGJhc2ljYWxseSBhIHNlY29uZGFyeSBjb25zdHJ1Y3RvciBhbmQgc2hvdWxkIG5vdCByZWFsbHkgbmVlZFxyXG4gICAqIHRvIGJlIGNhbGxlZCBtYW51YWxseSBleGNlcHQgaW4gdGhlIGNhc2UgdGhhdCB5b3Ugd2FudCB0byBwcmVwYXJlIGEgcGxheWVyIHdpdGggaXRzXHJcbiAgICogc2V0dGluZ3Mgd2hpbGUgd2FpdGluZyBmb3IgYSBsaWIgdG8gY29tZSBiYWNrIGZyb20gYW4gYWpheCBjYWxsLlxyXG4gICAqXHJcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXHJcbiAgICovXHJcbiAgaW5pdGlhbGl6ZSgpIHtcclxuXHJcbiAgICAvLyBzdGF0ZVxyXG4gICAgdGhpcy5zZWVraW5nID0gZmFsc2VcclxuICAgIHRoaXMudm9sdW1lQ2hhbmdpbmcgPSBmYWxzZVxyXG4gICAgdGhpcy5tb3VzZURvd25UaW1lciA9IDBcclxuICAgIHRoaXMucGxheWluZyA9IGZhbHNlXHJcblxyXG4gICAgdGhpcy51cGRhdGUoKVxyXG4gICAgdGhpcy4kJGluaXRBdWRpbygpXHJcbiAgICB0aGlzLiQkaW5pdEVsZW1lbnRzKClcclxuICAgIHRoaXMuJCRhZGRBdWRpb0xpc3RlbmVycygpXHJcbiAgICB0aGlzLiQkYWRkVm9sdW1lTGlzdGVuZXJzKClcclxuICAgIHRoaXMuJCRhZGRTZWVrTGlzdGVuZXJzKClcclxuICAgIHRoaXMuJCRhZGRMaXN0ZW5lcnMoKVxyXG4gICAgdGhpcy4kJGFjdGl2YXRlUGx1Z2lucygpXHJcblxyXG4gICAgTGFwLmVhY2godGhpcy5zZXR0aW5ncy5jYWxsYmFja3MsIChmbiwga2V5KSA9PiB0aGlzLm9uKGtleSwgZm4uYmluZCh0aGlzKSkpXHJcblxyXG4gICAgdGhpcy50cmlnZ2VyKCdsb2FkJywgdGhpcylcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29uZmlndXJlcyBpbnN0YW5jZSB2YXJpYWJsZXMgcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgYWxidW0uXHJcbiAgICogQ2FsbGVkIG9uIGluc3RhbmNlIGluaXRpYWxpemF0aW9uIGFuZCB3aGVuZXZlciBhbiBhbGJ1bSBpcyBjaGFuZ2VkLlxyXG4gICAqIFRoaXMgbWV0aG9kIGlzIGFsc28gbmVlZGVkIGlmIHlvdSBtYW51YWxseSByZXBsYWNlIGFuIGluc3RhbmNlJ3MgYGxpYmAgbWVtYmVyXHJcbiAgICogdmlhIGAjc2V0TGliYCwgaW4gd2hpY2ggY2FzZSB5b3UnbGwgbmVlZCB0byBjYWxsIGAjdXBkYXRlYCBkaXJlY3RseSBhZnRlclxyXG4gICAqXHJcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXHJcbiAgICovXHJcbiAgdXBkYXRlKCkge1xyXG4gICAgdGhpcy5hbGJ1bUluZGV4ID0gdGhpcy5hbGJ1bUluZGV4IHx8IHRoaXMuc2V0dGluZ3Muc3RhcnRpbmdBbGJ1bUluZGV4IHx8IDBcclxuICAgIHRoaXMudHJhY2tJbmRleCA9IHRoaXMudHJhY2tJbmRleCB8fCB0aGlzLnNldHRpbmdzLnN0YXJ0aW5nVHJhY2tJbmRleCB8fCAwXHJcbiAgICB0aGlzLmFsYnVtQ291bnQgPSB0aGlzLmxpYi5sZW5ndGhcclxuICAgIHRoaXMucGxheWxpc3RQb3B1bGF0ZWQgPSBmYWxzZVxyXG5cclxuICAgIGNvbnN0IGN1cnJlbnRMaWJJdGVtID0gdGhpcy5saWJbdGhpcy5hbGJ1bUluZGV4XVxyXG5cclxuICAgIGNvbnN0IGtleXMgPSBbJ2FydGlzdCcsICdhbGJ1bScsICdmaWxlcycsICdjb3ZlcicsICd0cmFja2xpc3QnLCAncmVwbGFjZW1lbnQnXVxyXG4gICAga2V5cy5mb3JFYWNoKGtleSA9PiB0aGlzW2tleV0gPSBjdXJyZW50TGliSXRlbVtrZXldKVxyXG5cclxuXHJcbiAgICB0aGlzLnRyYWNrQ291bnQgPSB0aGlzLmZpbGVzLmxlbmd0aFxyXG5cclxuICAgIC8vIHJlcGxhY2VtZW50IGluID09PSBbcmVnZXhwIHN0cmluZywgcmVwbGFjZW1lbnQgc3RyaW5nLCBvcHRpb25hbCBmbGFnc11cclxuICAgIC8vIHJlcGxhY2VtZW50IG91dCA9PT0gW3JlZ2V4cCBpbnN0YW5jZSwgcmVwbGFjZW1lbnRdXHJcbiAgICBpZiAodGhpcy5yZXBsYWNlbWVudCkge1xyXG4gICAgICBsZXQgcmUgPSB0aGlzLnJlcGxhY2VtZW50XHJcblxyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShyZSkgJiYgcmVbMF0gaW5zdGFuY2VvZiBSZWdFeHApIHtcclxuICAgICAgICB0aGlzLnJlcGxhY2VtZW50ID0gcmVcclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiByZSA9PT0gJ3N0cmluZycpIHJlID0gW3JlXVxyXG5cclxuICAgICAgICAvLyByZSBtYXkgY29udGFpbiBzdHJpbmctd3JhcHBlZCByZWdleHAgKGZyb20ganNvbiksIGNvbnZlcnQgaWYgc29cclxuICAgICAgICByZVswXSA9IG5ldyBSZWdFeHAocmVbMF0sIHJlWzJdIHx8ICdnJylcclxuICAgICAgICByZVsxXSA9IHJlWzFdIHx8ICcnXHJcblxyXG4gICAgICAgIHRoaXMucmVwbGFjZW1lbnQgPSByZVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy4kJGZvcm1hdFRyYWNrbGlzdCgpXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluc3RhbnRpYXRlIGV2ZXJ5IHBsdWdpbidzIGNvbnRydWN0b3Igd2l0aCB0aGlzIExhcCBpbnN0YW5jZVxyXG4gICAqXHJcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICAkJGFjdGl2YXRlUGx1Z2lucygpIHtcclxuICAgIHRoaXMucGx1Z2lucyA9IFtdXHJcbiAgICB0aGlzLnNldHRpbmdzLnBsdWdpbnMuZm9yRWFjaCgocGx1Z2luLCBpKSA9PiB0aGlzLnBsdWdpbnNbaV0gPSBuZXcgcGx1Z2luKHRoaXMpKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgJCRpbml0QXVkaW8oKSB7XHJcbiAgICB0aGlzLmF1ZGlvID0gbmV3IEF1ZGlvKClcclxuICAgIHRoaXMuYXVkaW8ucHJlbG9hZCA9ICdhdXRvJ1xyXG4gICAgbGV0IGZpbGVUeXBlID0gdGhpcy5maWxlc1t0aGlzLnRyYWNrSW5kZXhdXHJcbiAgICBmaWxlVHlwZSA9IGZpbGVUeXBlLnNsaWNlKGZpbGVUeXBlLmxhc3RJbmRleE9mKCcuJykrMSlcclxuICAgIGNvbnN0IGNhblBsYXkgPSB0aGlzLmF1ZGlvLmNhblBsYXlUeXBlKCdhdWRpby8nICsgZmlsZVR5cGUpXHJcbiAgICBpZiAoY2FuUGxheSA9PT0gJ3Byb2JhYmx5JyB8fCBjYW5QbGF5ID09PSAnbWF5YmUnKSB7XHJcbiAgICAgIHRoaXMuJCR1cGRhdGVTb3VyY2UoKVxyXG4gICAgICB0aGlzLmF1ZGlvLnZvbHVtZSA9IDFcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIFRPRE86IHJldHVybiBhIGZsYWcgdG8gc2lnbmFsIHNraXBwaW5nIHRoZSByZXN0IG9mIHRoZSBpbml0aWFsaXphdGlvbiBwcm9jZXNzXHJcbiAgICAgIGNvbnNvbGUud2FybihgVGhpcyBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgJHtmaWxlVHlwZX0gcGxheWJhY2suYClcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gICQkdXBkYXRlU291cmNlKCkge1xyXG4gICAgdGhpcy5hdWRpby5zcmMgPSB0aGlzLmZpbGVzW3RoaXMudHJhY2tJbmRleF1cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gICQkaW5pdEVsZW1lbnRzKCkge1xyXG4gICAgdGhpcy5lbHMgPSB7fVxyXG4gICAgdGhpcy5zZWxlY3RvcnMgPSB7IHN0YXRlOiB7fSB9XHJcbiAgICBMYXAuZWFjaChMYXAuJCRkZWZhdWx0U2VsZWN0b3JzLCAoc2VsZWN0b3IsIGtleSkgPT4ge1xyXG4gICAgICBpZiAoa2V5ICE9PSAnc3RhdGUnKSB7XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0b3JzW2tleV0gPSB0aGlzLnNldHRpbmdzLnNlbGVjdG9ycy5oYXNPd25Qcm9wZXJ0eShrZXkpXHJcbiAgICAgICAgICA/IHRoaXMuc2V0dGluZ3Muc2VsZWN0b3JzW2tleV1cclxuICAgICAgICAgIDogc2VsZWN0b3JcclxuXHJcbiAgICAgICAgY29uc3QgZWwgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcihgLiR7dGhpcy5zZWxlY3RvcnNba2V5XX1gKVxyXG4gICAgICAgIGlmIChlbCkgdGhpcy5lbHNba2V5XSA9IGVsXHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IGhhc0N1c3RvbVN0YXRlID0gdGhpcy5zZXR0aW5ncy5zZWxlY3RvcnMuc3RhdGVcclxuXHJcbiAgICAgICAgaWYgKCFoYXNDdXN0b21TdGF0ZSkgcmV0dXJuICh0aGlzLnNlbGVjdG9ycy5zdGF0ZSA9IExhcC4kJGRlZmF1bHRTZWxlY3RvcnMuc3RhdGUpXHJcblxyXG4gICAgICAgIExhcC5lYWNoKExhcC4kJGRlZmF1bHRTZWxlY3RvcnMuc3RhdGUsIChzZWwsIGspID0+IHtcclxuICAgICAgICAgIHRoaXMuc2VsZWN0b3JzLnN0YXRlW2tdID0gdGhpcy5zZXR0aW5ncy5zZWxlY3RvcnMuc3RhdGUuaGFzT3duUHJvcGVydHkoaylcclxuICAgICAgICAgICAgPyB0aGlzLnNldHRpbmdzLnNlbGVjdG9ycy5zdGF0ZVtrXVxyXG4gICAgICAgICAgICA6IHNlbFxyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIHdyYXBwZXIgYXJvdW5kIHRoaXMgTGFwIGluc3RhbmNlcyBgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcmAgdGhhdFxyXG4gICAqIGVuc3VyZXMgaGFuZGxlcnMgYXJlIGNhY2hlZCBmb3IgbGF0ZXIgcmVtb3ZhbCB2aWEgYExhcC5kZXN0cm95KGluc3RhbmNlKWAgY2FsbFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgZXZlbnQgICAgICAgQXVkaW8gRXZlbnQgbmFtZVxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyICAgIGNhbGxiYWNrXHJcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXHJcbiAgICovXHJcbiAgYWRkQXVkaW9MaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpIHtcclxuICAgIHRoaXMuJCRhdWRpb0xpc3RlbmVycyA9IHRoaXMuJCRhdWRpb0xpc3RlbmVycyB8fCB7fVxyXG4gICAgdGhpcy4kJGF1ZGlvTGlzdGVuZXJzW2V2ZW50XSA9IHRoaXMuJCRhdWRpb0xpc3RlbmVyc1tldmVudF0gfHwgW11cclxuXHJcbiAgICBjb25zdCBib3VuZCA9IGxpc3RlbmVyLmJpbmQodGhpcylcclxuICAgIHRoaXMuJCRhdWRpb0xpc3RlbmVyc1tldmVudF0ucHVzaChib3VuZClcclxuICAgIHRoaXMuYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgYm91bmQpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICAkJGFkZEF1ZGlvTGlzdGVuZXJzKCkge1xyXG4gICAgY29uc3QgYXVkaW8gPSB0aGlzLmF1ZGlvXHJcbiAgICBjb25zdCBlbHMgPSB0aGlzLmVsc1xyXG4gICAgY29uc3QgbmF0aXZlUHJvZ3Jlc3MgPSAhISh0aGlzLnNldHRpbmdzLnVzZU5hdGl2ZVByb2dyZXNzICYmIGVscy5wcm9ncmVzcylcclxuXHJcbiAgICBjb25zdCBfYWRkTGlzdGVuZXIgPSAoY29uZGl0aW9uLCBldmVudCwgbGlzdGVuZXIpID0+IHtcclxuICAgICAgaWYgKGNvbmRpdGlvbikgdGhpcy5hZGRBdWRpb0xpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcclxuICAgIH1cclxuXHJcbiAgICBfYWRkTGlzdGVuZXIoISEoZWxzLmJ1ZmZlcmVkIHx8IG5hdGl2ZVByb2dyZXNzKSwgJ3Byb2dyZXNzJywgKCkgPT4ge1xyXG4gICAgICB2YXIgYnVmZmVyZWQgPSB0aGlzLiQkYnVmZmVyRm9ybWF0dGVkKClcclxuICAgICAgaWYgKGVscy5idWZmZXJlZCkgZWxzLmJ1ZmZlcmVkLmlubmVySFRNTCA9IGJ1ZmZlcmVkXHJcbiAgICAgIGlmIChuYXRpdmVQcm9ncmVzcykgZWxzLnByb2dyZXNzLnZhbHVlID0gYnVmZmVyZWRcclxuICAgIH0pXHJcblxyXG4gICAgX2FkZExpc3RlbmVyKCEhZWxzLmN1cnJlbnRUaW1lLCAndGltZXVwZGF0ZScsICgpID0+IHRoaXMuJCR1cGRhdGVDdXJyZW50VGltZUVsKCkpXHJcbiAgICBfYWRkTGlzdGVuZXIoISFlbHMuZHVyYXRpb24sICdkdXJhdGlvbmNoYW5nZScsICgpID0+IHRoaXMuJCR1cGRhdGVEdXJhdGlvbkVsKCkpXHJcblxyXG4gICAgX2FkZExpc3RlbmVyKHRydWUsICdlbmRlZCcsICgpID0+IHtcclxuICAgICAgaWYgKHRoaXMucGxheWluZykge1xyXG4gICAgICAgIHRoaXMubmV4dCgpXHJcbiAgICAgICAgYXVkaW8ucGxheSgpXHJcbiAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgd3JhcHBlciBhcm91bmQgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyIHdoaWNoIGVuc3VyZXMgbGlzdG5lcnNcclxuICAgKiBhcmUgY2FjaGVkIGZvciBsYXRlciByZW1vdmFsIHZpYSBgTGFwLmRlc3Ryb3koaW5zdGFuY2UpYCBjYWxsXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBlbGVtZW50TmFtZSBMYXAjZWxzIGVsZW1lbnRrZXlcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBldmVudCAgICAgICBET00gRXZlbnQgbmFtZVxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyICAgIGNhbGxiYWNrXHJcbiAgICovXHJcbiAgYWRkTGlzdGVuZXIoZWxlbWVudE5hbWUsIGV2ZW50LCBsaXN0ZW5lcikge1xyXG4gICAgLy8gYnlwYXNzIG5vbi1leGlzdGVudCBlbGVtZW50c1xyXG4gICAgaWYgKCF0aGlzLmVsc1tlbGVtZW50TmFtZV0pIHJldHVybiB0aGlzXHJcblxyXG4gICAgLy8gaWUuIGxpc3RlbmVycyA9IHsgc2Vla1JhbmdlOiB7IGNsaWNrOiBbaGFuZGxlcnNdLCBtb3VzZWRvd246IFtoYW5kbGVyc10sIC4uLiB9LCAuLi4gfVxyXG4gICAgdGhpcy4kJGxpc3RlbmVycyA9IHRoaXMuJCRsaXN0ZW5lcnMgfHwge31cclxuICAgIHRoaXMuJCRsaXN0ZW5lcnNbZWxlbWVudE5hbWVdID0gdGhpcy4kJGxpc3RlbmVyc1tlbGVtZW50TmFtZV0gfHwge31cclxuICAgIHRoaXMuJCRsaXN0ZW5lcnNbZWxlbWVudE5hbWVdW2V2ZW50XSA9IHRoaXMuJCRsaXN0ZW5lcnNbZWxlbWVudE5hbWVdW2V2ZW50XSB8fCBbXVxyXG5cclxuICAgIGNvbnN0IGJvdW5kID0gbGlzdGVuZXIuYmluZCh0aGlzKVxyXG4gICAgdGhpcy4kJGxpc3RlbmVyc1tlbGVtZW50TmFtZV1bZXZlbnRdLnB1c2goYm91bmQpXHJcbiAgICB0aGlzLmVsc1tlbGVtZW50TmFtZV0uYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgYm91bmQpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICAkJGFkZExpc3RlbmVycygpIHtcclxuICAgIGNvbnN0IGVscyA9IHRoaXMuZWxzXHJcblxyXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigncGxheVBhdXNlJywgJ2NsaWNrJywgdGhpcy50b2dnbGVQbGF5KVxyXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigncHJldicsICdjbGljaycsIHRoaXMucHJldilcclxuICAgIHRoaXMuYWRkTGlzdGVuZXIoJ25leHQnLCAnY2xpY2snLCB0aGlzLm5leHQpXHJcbiAgICB0aGlzLmFkZExpc3RlbmVyKCdwcmV2QWxidW0nLCAnY2xpY2snLCB0aGlzLnByZXZBbGJ1bSlcclxuICAgIHRoaXMuYWRkTGlzdGVuZXIoJ25leHRBbGJ1bScsICdjbGljaycsIHRoaXMubmV4dEFsYnVtKVxyXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lVXAnLCAnY2xpY2snLCB0aGlzLiQkaW5jVm9sdW1lKVxyXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lRG93bicsICdjbGljaycsIHRoaXMuJCRkZWNWb2x1bWUpXHJcblxyXG4gICAgY29uc3QgX2lmID0gKGVsZW1lbnROYW1lLCBmbikgPT4ge1xyXG4gICAgICBpZiAodGhpcy5lbHNbZWxlbWVudE5hbWVdKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgIHRoaXNbZm5dKClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gYW5vbnltb3VzXHJcbiAgICAgICAgICBmbigpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5vbignbG9hZCcsICgpID0+IHtcclxuICAgICAgX2lmKCd0cmFja1RpdGxlJywgJyQkdXBkYXRlVHJhY2tUaXRsZUVsJylcclxuICAgICAgX2lmKCd0cmFja051bWJlcicsICckJHVwZGF0ZVRyYWNrTnVtYmVyRWwnKVxyXG4gICAgICBfaWYoJ2FydGlzdCcsICckJHVwZGF0ZUFydGlzdEVsJylcclxuICAgICAgX2lmKCdhbGJ1bScsICckJHVwZGF0ZUFsYnVtRWwnKVxyXG4gICAgICBfaWYoJ2NvdmVyJywgJyQkdXBkYXRlQ292ZXInKVxyXG4gICAgICBfaWYoJ2N1cnJlbnRUaW1lJywgJyQkdXBkYXRlQ3VycmVudFRpbWVFbCcpXHJcbiAgICAgIF9pZignZHVyYXRpb24nLCAnJCR1cGRhdGVEdXJhdGlvbkVsJylcclxuICAgICAgX2lmKCdwbGF5UGF1c2UnLCAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgcyA9IHRoaXMuc2VsZWN0b3JzLnN0YXRlXHJcbiAgICAgICAgY29uc3QgcHAgPSBlbHMucGxheVBhdXNlXHJcbiAgICAgICAgTGFwLmFkZENsYXNzKHBwLCBzLnBhdXNlZClcclxuICAgICAgICB0aGlzLm9uKCdwbGF5JywgKCkgPT4gTGFwLnJlbW92ZUNsYXNzKHBwLCBzLnBhdXNlZCkuYWRkQ2xhc3MocHAsIHMucGxheWluZykpXHJcbiAgICAgICAgdGhpcy5vbigncGF1c2UnLCAoKSA9PiBMYXAucmVtb3ZlQ2xhc3MocHAsIHMucGxheWluZykuYWRkQ2xhc3MocHAsIHMucGF1c2VkKSlcclxuICAgICAgfSlcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5vbigndHJhY2tDaGFuZ2UnLCAoKSA9PiB7XHJcbiAgICAgIF9pZigndHJhY2tUaXRsZScsICckJHVwZGF0ZVRyYWNrVGl0bGVFbCcpXHJcbiAgICAgIF9pZigndHJhY2tOdW1iZXInLCAnJCR1cGRhdGVUcmFja051bWJlckVsJylcclxuICAgICAgX2lmKCdjdXJyZW50VGltZScsICckJHVwZGF0ZUN1cnJlbnRUaW1lRWwnKVxyXG4gICAgICBfaWYoJ2R1cmF0aW9uJywgJyQkdXBkYXRlRHVyYXRpb25FbCcpXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMub24oJ2FsYnVtQ2hhbmdlJywgKCkgPT4ge1xyXG4gICAgICBfaWYoJ3RyYWNrVGl0bGUnLCAnJCR1cGRhdGVUcmFja1RpdGxlRWwnKVxyXG4gICAgICBfaWYoJ3RyYWNrTnVtYmVyJywgJyQkdXBkYXRlVHJhY2tOdW1iZXJFbCcpXHJcbiAgICAgIF9pZignYXJ0aXN0JywgJyQkdXBkYXRlQXJ0aXN0RWwnKVxyXG4gICAgICBfaWYoJ2FsYnVtJywgJyQkdXBkYXRlQWxidW1FbCcpXHJcbiAgICAgIF9pZignY292ZXInLCAnJCR1cGRhdGVDb3ZlcicpXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICAkJGFkZFNlZWtMaXN0ZW5lcnMoKSB7XHJcbiAgICBjb25zdCBlbHMgPSB0aGlzLmVsc1xyXG4gICAgY29uc3Qgc2Vla1JhbmdlID0gZWxzLnNlZWtSYW5nZVxyXG4gICAgY29uc3QgYXVkaW8gPSB0aGlzLmF1ZGlvXHJcbiAgICBjb25zdCB1c2VOYXRpdmUgPSAhISh0aGlzLnNldHRpbmdzLnVzZU5hdGl2ZVNlZWtSYW5nZSAmJiBzZWVrUmFuZ2UpXHJcblxyXG4gICAgaWYgKHVzZU5hdGl2ZSkge1xyXG4gICAgICB0aGlzLmFkZEF1ZGlvTGlzdGVuZXIoJ3RpbWV1cGRhdGUnLCAoKSA9PiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnNlZWtpbmcpIHNlZWtSYW5nZS52YWx1ZSA9IExhcC5zY2FsZShhdWRpby5jdXJyZW50VGltZSwgMCwgYXVkaW8uZHVyYXRpb24sIDAsIDEwMClcclxuICAgICAgfSlcclxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcignc2Vla1JhbmdlJywgJ21vdXNlZG93bicsICgpID0+IHRoaXMuc2Vla2luZyA9IHRydWUpXHJcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3NlZWtSYW5nZScsICdtb3VzZXVwJywgKCkgPT4ge1xyXG4gICAgICAgIGF1ZGlvLmN1cnJlbnRUaW1lID0gTGFwLnNjYWxlKHNlZWtSYW5nZS52YWx1ZSwgMCwgc2Vla1JhbmdlLm1heCwgMCwgYXVkaW8uZHVyYXRpb24pXHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdzZWVrJylcclxuICAgICAgICB0aGlzLnNlZWtpbmcgPSBmYWxzZVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1heWJlV2FybiA9ICgpID0+IHtcclxuICAgICAgaWYgKHRoaXMuZGVidWcgJiYgc2Vla1JhbmdlKSB7XHJcbiAgICAgICAgY29uc3QgYyA9ICdjb2xvcjpkYXJrZ3JlZW47Zm9udC1mYW1pbHk6bW9ub3NwYWNlJ1xyXG4gICAgICAgIGNvbnN0IHIgPSAnY29sb3I6aW5oZXJpdCdcclxuICAgICAgICBjb25zb2xlLndhcm4oYFxyXG4gICAgICAgICAgJWNMYXAoJXMpIFtERUJVR106XHJcbiAgICAgICAgICAlY1NpbXVsdGFuZW91cyB1c2Ugb2YgJWNMYXAjZWxzLnNlZWtSYW5nZSVjIGFuZFxyXG4gICAgICAgICAgJWNMYXAjZWxzLnNlZWtGb3J3YXJkfHNlZWtCYWNrd2FyZCVjIGlzIHJlZHVuZGFudC5cclxuICAgICAgICAgIENvbnNpZGVyIGNob29zaW5nIG9uZSBvciB0aGUgb3RoZXIuXHJcbiAgICAgICAgICBgLnNwbGl0KCdcXG4nKS5tYXAocyA9PiBzLnRyaW0oKSkuam9pbignICcpLFxyXG4gICAgICAgICAgTGFwLiQkZGVidWdTaWduYXR1cmUsIHRoaXMuaWQsIHIsIGMsIHIsIGMsIHJcclxuICAgICAgICApXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoZWxzLnNlZWtGb3J3YXJkKSB7XHJcbiAgICAgIG1heWJlV2FybigpXHJcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3NlZWtGb3J3YXJkJywgJ21vdXNlZG93bicsICgpID0+IHtcclxuICAgICAgICB0aGlzLnNlZWtpbmcgPSB0cnVlXHJcbiAgICAgICAgdGhpcy4kJHNlZWtGb3J3YXJkKClcclxuICAgICAgfSlcclxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcignc2Vla0ZvcndhcmQnLCAnbW91c2V1cCcsICgpID0+IHtcclxuICAgICAgICB0aGlzLnNlZWtpbmcgPSBmYWxzZVxyXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLm1vdXNlRG93blRpbWVyKVxyXG4gICAgICAgIHRoaXMudHJpZ2dlcignc2VlaycpXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGVscy5zZWVrQmFja3dhcmQpIHtcclxuICAgICAgbWF5YmVXYXJuKClcclxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcignc2Vla0JhY2t3YXJkJywgJ21vdXNlZG93bicsICgpID0+IHtcclxuICAgICAgICB0aGlzLnNlZWtpbmcgPSB0cnVlXHJcbiAgICAgICAgdGhpcy4kJHNlZWtCYWNrd2FyZCgpXHJcbiAgICAgIH0pXHJcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3NlZWtCYWNrd2FyZCcsICdtb3VzZXVwJywgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuc2Vla2luZyA9IGZhbHNlXHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMubW91c2VEb3duVGltZXIpXHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdzZWVrJylcclxuICAgICAgfSlcclxuICAgIH1cclxuICB9XHJcblxyXG4gICQkc2Vla0JhY2t3YXJkKCkge1xyXG4gICAgaWYgKCF0aGlzLnNlZWtpbmcpIHJldHVybiB0aGlzXHJcbiAgICB0aGlzLm1vdXNlRG93blRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICBjb25zdCB4ID0gdGhpcy5hdWRpby5jdXJyZW50VGltZSArICh0aGlzLnNldHRpbmdzLnNlZWtJbnRlcnZhbCAqIC0xKVxyXG4gICAgICB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lID0geCA8IDAgPyAwIDogeFxyXG4gICAgfSwgdGhpcy5zZXR0aW5ncy5zZWVrVGltZSlcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAkJHNlZWtGb3J3YXJkKCkge1xyXG4gICAgaWYgKCF0aGlzLnNlZWtpbmcpIHJldHVybiB0aGlzXHJcbiAgICB0aGlzLm1vdXNlRG93blRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICBjb25zdCB4ID0gdGhpcy5hdWRpby5jdXJyZW50VGltZSArIHRoaXMuc2V0dGluZ3Muc2Vla0ludGVydmFsXHJcbiAgICAgIHRoaXMuYXVkaW8uY3VycmVudFRpbWUgPSB4ID4gdGhpcy5hdWRpby5kdXJhdGlvbiA/IHRoaXMuYXVkaW8uZHVyYXRpb24gOiB4XHJcbiAgICB9LCB0aGlzLnNldHRpbmdzLnNlZWtUaW1lKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gICQkYWRkVm9sdW1lTGlzdGVuZXJzKCkge1xyXG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcclxuICAgIGNvbnN0IHZvbHVtZVJhbmdlID0gZWxzLnZvbHVtZVJhbmdlXHJcbiAgICBjb25zdCB2b2x1bWVSZWFkID0gZWxzLnZvbHVtZVJlYWRcclxuICAgIGNvbnN0IHZvbHVtZVVwID0gZWxzLnZvbHVtZVVwXHJcbiAgICBjb25zdCB2b2x1bWVEb3duID0gZWxzLnZvbHVtZURvd25cclxuXHJcbiAgICBpZiAodm9sdW1lUmVhZCkge1xyXG4gICAgICBjb25zdCBmbiA9ICgpID0+IHZvbHVtZVJlYWQuaW5uZXJIVE1MID0gTWF0aC5yb3VuZCh0aGlzLmF1ZGlvLnZvbHVtZSoxMDApXHJcbiAgICAgIHRoaXMub24oJ3ZvbHVtZUNoYW5nZScsIGZuKVxyXG4gICAgICBmbigpXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MudXNlTmF0aXZlVm9sdW1lUmFuZ2UgJiYgdm9sdW1lUmFuZ2UpIHtcclxuXHJcbiAgICAgIGNvbnN0IGZuID0gKCkgPT4ge1xyXG4gICAgICAgIGlmICghdGhpcy52b2x1bWVDaGFuZ2luZykgdm9sdW1lUmFuZ2UudmFsdWUgPSBNYXRoLnJvdW5kKHRoaXMuYXVkaW8udm9sdW1lKjEwMClcclxuICAgICAgfVxyXG4gICAgICB0aGlzLmFkZEF1ZGlvTGlzdGVuZXIoJ3ZvbHVtZWNoYW5nZScsIGZuKVxyXG4gICAgICB0aGlzLm9uKCdsb2FkJywgZm4pXHJcblxyXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCd2b2x1bWVSYW5nZScsICdtb3VzZWRvd24nLCAoKSA9PiB0aGlzLnZvbHVtZUNoYW5naW5nID0gdHJ1ZSlcclxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lUmFuZ2UnLCAnbW91c2V1cCcsICgpID0+IHtcclxuICAgICAgICB0aGlzLmF1ZGlvLnZvbHVtZSA9IHZvbHVtZVJhbmdlLnZhbHVlICogMC4wMVxyXG4gICAgICAgIHRoaXMudHJpZ2dlcigndm9sdW1lQ2hhbmdlJylcclxuICAgICAgICB0aGlzLnZvbHVtZUNoYW5naW5nID0gZmFsc2VcclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXliZVdhcm4gPSAoKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmRlYnVnICYmIHZvbHVtZVJhbmdlKSB7XHJcbiAgICAgICAgY29uc3QgYyA9ICdjb2xvcjpkYXJrZ3JlZW47Zm9udC1mYW1pbHk6bW9ub3NwYWNlJ1xyXG4gICAgICAgIGNvbnN0IHIgPSAnY29sb3I6aW5oZXJpdCdcclxuICAgICAgICBjb25zb2xlLndhcm4oYFxyXG4gICAgICAgICAgJWNMYXAoJXMpIFtERUJVR106XHJcbiAgICAgICAgICAlY1NpbXVsdGFuZW91cyB1c2Ugb2YgJWNMYXAjZWxzLnZvbHVtZVJhbmdlJWMgYW5kXHJcbiAgICAgICAgICAlY0xhcCNlbHMudm9sdW1lVXB8dm9sdW1lRG93biVjIGlzIHJlZHVuZGFudC5cclxuICAgICAgICAgIENvbnNpZGVyIGNob29zaW5nIG9uZSBvciB0aGUgb3RoZXIuXHJcbiAgICAgICAgICBgLnNwbGl0KCdcXG4nKS5tYXAocyA9PiBzLnRyaW0oKSkuam9pbignICcpLFxyXG4gICAgICAgICAgTGFwLiQkZGVidWdTaWduYXR1cmUsIHRoaXMuaWQsIHIsIGMsIHIsIGMsIHJcclxuICAgICAgICApXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodm9sdW1lVXApIHtcclxuICAgICAgbWF5YmVXYXJuKClcclxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lVXAnLCAnY2xpY2snLCAoKSA9PiB0aGlzLiQkaW5jVm9sdW1lKCkpXHJcbiAgICB9XHJcbiAgICBpZiAodm9sdW1lRG93bikge1xyXG4gICAgICBtYXliZVdhcm4oKVxyXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCd2b2x1bWVEb3duJywgJ2NsaWNrJywgKCkgPT4gdGhpcy4kJGRlY1ZvbHVtZSgpKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgJCRpbmNWb2x1bWUoKSB7XHJcbiAgICBjb25zdCB2ID0gdGhpcy5hdWRpby52b2x1bWVcclxuICAgIGNvbnN0IGkgPSB0aGlzLnNldHRpbmdzLnZvbHVtZUludGVydmFsXHJcbiAgICB0aGlzLmF1ZGlvLnZvbHVtZSA9IHYraSA+IDEgPyAxIDogditpXHJcbiAgICB0aGlzLnRyaWdnZXIoJ3ZvbHVtZUNoYW5nZScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgJCRkZWNWb2x1bWUoKSB7XHJcbiAgICBjb25zdCB2ID0gdGhpcy5hdWRpby52b2x1bWVcclxuICAgIGNvbnN0IGkgPSB0aGlzLnNldHRpbmdzLnZvbHVtZUludGVydmFsXHJcbiAgICB0aGlzLmF1ZGlvLnZvbHVtZSA9IHYtaSA8IDAgPyAwIDogdi1pXHJcbiAgICB0aGlzLnRyaWdnZXIoJ3ZvbHVtZUNoYW5nZScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgJCR1cGRhdGVDdXJyZW50VGltZUVsKCkge1xyXG4gICAgdGhpcy5lbHMuY3VycmVudFRpbWUuaW5uZXJIVE1MID0gdGhpcy4kJGN1cnJlbnRUaW1lRm9ybWF0dGVkKClcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAkJHVwZGF0ZUR1cmF0aW9uRWwoKSB7XHJcbiAgICB0aGlzLmVscy5kdXJhdGlvbi5pbm5lckhUTUwgPSB0aGlzLiQkZHVyYXRpb25Gb3JtYXR0ZWQoKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gICQkdXBkYXRlVHJhY2tUaXRsZUVsKCkge1xyXG4gICAgdGhpcy5lbHMudHJhY2tUaXRsZS5pbm5lckhUTUwgPSB0aGlzLnRyYWNrbGlzdFt0aGlzLnRyYWNrSW5kZXhdXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgJCR1cGRhdGVUcmFja051bWJlckVsKCkge1xyXG4gICAgdGhpcy5lbHMudHJhY2tOdW1iZXIuaW5uZXJIVE1MID0gK3RoaXMudHJhY2tJbmRleCsxXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgJCR1cGRhdGVBcnRpc3RFbCgpIHtcclxuICAgIHRoaXMuZWxzLmFydGlzdC5pbm5lckhUTUwgPSB0aGlzLmFydGlzdFxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gICQkdXBkYXRlQWxidW1FbCgpIHtcclxuICAgIHRoaXMuZWxzLmFsYnVtLmlubmVySFRNTCA9IHRoaXMuYWxidW1cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAkJHVwZGF0ZUNvdmVyKCkge1xyXG4gICAgdGhpcy5lbHMuY292ZXIuc3JjID0gdGhpcy5jb3ZlclxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHRvZ2dsZVBsYXkoKSB7XHJcbiAgICB0aGlzLmF1ZGlvLnBhdXNlZCA/IHRoaXMucGxheSgpIDogdGhpcy5wYXVzZSgpXHJcbiAgICB0aGlzLnRyaWdnZXIoJ3RvZ2dsZVBsYXknKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHBsYXkoKSB7XHJcbiAgICBpZiAoTGFwLmV4Y2x1c2l2ZU1vZGUpIExhcC5lYWNoKExhcC4kJGluc3RhbmNlcywgaW5zdGFuY2UgPT4gaW5zdGFuY2UucGF1c2UoKSlcclxuICAgIHRoaXMuYXVkaW8ucGxheSgpXHJcbiAgICB0aGlzLnBsYXlpbmcgPSB0cnVlXHJcbiAgICB0aGlzLnRyaWdnZXIoJ3BsYXknKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHBhdXNlKCkge1xyXG4gICAgdGhpcy5hdWRpby5wYXVzZSgpXHJcbiAgICB0aGlzLnBsYXlpbmcgPSBmYWxzZVxyXG4gICAgdGhpcy50cmlnZ2VyKCdwYXVzZScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgc2V0VHJhY2soaW5kZXgpIHtcclxuICAgIGlmIChpbmRleCA8PSAwKSB7XHJcbiAgICAgIHRoaXMudHJhY2tJbmRleCA9IDBcclxuICAgIH0gZWxzZSBpZiAoaW5kZXggPj0gdGhpcy50cmFja0NvdW50KSB7XHJcbiAgICAgIHRoaXMudHJhY2tJbmRleCA9IHRoaXMudHJhY2tDb3VudC0xXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnRyYWNrSW5kZXggPSBpbmRleFxyXG4gICAgfVxyXG4gICAgY29uc3Qgd2FzUGxheWluZyA9ICF0aGlzLmF1ZGlvLnBhdXNlZFxyXG4gICAgdGhpcy4kJHVwZGF0ZVNvdXJjZSgpXHJcbiAgICBpZiAod2FzUGxheWluZykgdGhpcy5hdWRpby5wbGF5KClcclxuICAgIHRoaXMudHJpZ2dlcigndHJhY2tDaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHByZXYoKSB7XHJcbiAgICBjb25zdCB3YXNQbGF5aW5nID0gIXRoaXMuYXVkaW8ucGF1c2VkXHJcbiAgICB0aGlzLnRyYWNrSW5kZXggPSAodGhpcy50cmFja0luZGV4LTEgPCAwKSA/IHRoaXMudHJhY2tDb3VudC0xIDogdGhpcy50cmFja0luZGV4LTFcclxuICAgIHRoaXMuJCR1cGRhdGVTb3VyY2UoKVxyXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXHJcbiAgICB0aGlzLnRyaWdnZXIoJ3RyYWNrQ2hhbmdlJylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBuZXh0KCkge1xyXG4gICAgY29uc3Qgd2FzUGxheWluZyA9ICF0aGlzLmF1ZGlvLnBhdXNlZFxyXG4gICAgdGhpcy50cmFja0luZGV4ID0gKHRoaXMudHJhY2tJbmRleCsxID49IHRoaXMudHJhY2tDb3VudCkgPyAwIDogdGhpcy50cmFja0luZGV4KzFcclxuICAgIHRoaXMuJCR1cGRhdGVTb3VyY2UoKVxyXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXHJcbiAgICB0aGlzLnRyaWdnZXIoJ3RyYWNrQ2hhbmdlJylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBwcmV2QWxidW0oKSB7XHJcbiAgICBjb25zdCB3YXNQbGF5aW5nID0gIXRoaXMuYXVkaW8ucGF1c2VkXHJcbiAgICB0aGlzLmFsYnVtSW5kZXggPSAodGhpcy5hbGJ1bUluZGV4LTEgPCAwKSA/IHRoaXMuYWxidW1Db3VudC0xIDogdGhpcy5hbGJ1bUluZGV4LTFcclxuICAgIHRoaXMudXBkYXRlKClcclxuICAgIHRoaXMudHJhY2tJbmRleCA9IDBcclxuICAgIHRoaXMuJCR1cGRhdGVTb3VyY2UoKVxyXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXHJcbiAgICB0aGlzLnRyaWdnZXIoJ2FsYnVtQ2hhbmdlJylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBuZXh0QWxidW0oKSB7XHJcbiAgICBjb25zdCB3YXNQbGF5aW5nPSAhdGhpcy5hdWRpby5wYXVzZWRcclxuICAgIHRoaXMuYWxidW1JbmRleCA9ICh0aGlzLmFsYnVtSW5kZXgrMSA+IHRoaXMuYWxidW1Db3VudC0xKSA/IDAgOiB0aGlzLmFsYnVtSW5kZXgrMVxyXG4gICAgdGhpcy51cGRhdGUoKVxyXG4gICAgdGhpcy50cmFja0luZGV4ID0gMFxyXG4gICAgdGhpcy4kJHVwZGF0ZVNvdXJjZSgpXHJcbiAgICBpZiAod2FzUGxheWluZykgdGhpcy5hdWRpby5wbGF5KClcclxuICAgIHRoaXMudHJpZ2dlcignYWxidW1DaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHNldEFsYnVtKGluZGV4KSB7XHJcbiAgICBpZiAoaW5kZXggPD0gMCkge1xyXG4gICAgICB0aGlzLmFsYnVtSW5kZXggPSAwXHJcbiAgICB9IGVsc2UgaWYgKGluZGV4ID49IHRoaXMuYWxidW1Db3VudCkge1xyXG4gICAgICB0aGlzLmFsYnVtSW5kZXggPSB0aGlzLmFsYnVtQ291bnQtMVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5hbGJ1bUluZGV4ID0gaW5kZXhcclxuICAgIH1cclxuICAgIHRoaXMudXBkYXRlKClcclxuICAgIHRoaXMuc2V0VHJhY2sodGhpcy5saWJbdGhpcy5hbGJ1bUluZGV4XS5zdGFydGluZ1RyYWNrSW5kZXggfHwgMClcclxuICAgIHRoaXMudHJpZ2dlcignYWxidW1DaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gICQkZm9ybWF0VHJhY2tsaXN0KCkge1xyXG4gICAgaWYgKHRoaXMudHJhY2tsaXN0ICYmIHRoaXMudHJhY2tsaXN0Lmxlbmd0aCkgcmV0dXJuIHRoaXNcclxuXHJcbiAgICBjb25zdCByZSA9IHRoaXMucmVwbGFjZW1lbnRcclxuICAgIGNvbnN0IHRyYWNrbGlzdCA9IFtdXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudHJhY2tDb3VudDsgaSsrKSB7XHJcbiAgICAgIGxldCB0ID0gdGhpcy5maWxlc1tpXVxyXG4gICAgICAvLyBzdHJpcCBleHRcclxuICAgICAgdCA9IHQuc2xpY2UoMCwgdC5sYXN0SW5kZXhPZignLicpKVxyXG4gICAgICAvLyBnZXQgbGFzdCBwYXRoIHNlZ21lbnRcclxuICAgICAgdCA9IHQuc2xpY2UodC5sYXN0SW5kZXhPZignLycpKzEpXHJcbiAgICAgIGlmIChyZSkgdCA9IHQucmVwbGFjZShyZVswXSwgcmVbMV0pXHJcbiAgICAgIHRyYWNrbGlzdFtpXSA9IHQudHJpbSgpXHJcbiAgICB9XHJcbiAgICB0aGlzLnRyYWNrbGlzdCA9IHRyYWNrbGlzdFxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gICQkYnVmZmVyRm9ybWF0dGVkKCkge1xyXG4gICAgaWYgKCF0aGlzLmF1ZGlvKSByZXR1cm4gMFxyXG5cclxuICAgIGNvbnN0IGF1ZGlvID0gdGhpcy5hdWRpb1xyXG4gICAgbGV0IGJ1ZmZlcmVkXHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgYnVmZmVyZWQgPSBhdWRpby5idWZmZXJlZC5lbmQoYXVkaW8uYnVmZmVyZWQubGVuZ3RoLTEpXHJcbiAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgcmV0dXJuIDBcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtYXR0ZWQgPSBNYXRoLnJvdW5kKChidWZmZXJlZC9hdWRpby5kdXJhdGlvbikqMTAwKVxyXG4gICAgLy8gdmFyIGZvcm1hdHRlZCA9IE1hdGgucm91bmQoXy5zY2FsZShidWZmZXJlZCwgMCwgYXVkaW8uZHVyYXRpb24sIDAsIDEwMCkpXHJcbiAgICByZXR1cm4gaXNOYU4oZm9ybWF0dGVkKSA/IDAgOiBmb3JtYXR0ZWRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgJCRnZXRBdWRpb1RpbWVGb3JtYXR0ZWQoYXVkaW9Qcm9wKSB7XHJcbiAgICBpZiAoaXNOYU4odGhpcy5hdWRpby5kdXJhdGlvbikpIHJldHVybiAnMDA6MDAnXHJcbiAgICBsZXQgZm9ybWF0dGVkID0gTGFwLmZvcm1hdFRpbWUoTWF0aC5mbG9vcih0aGlzLmF1ZGlvW2F1ZGlvUHJvcF0udG9GaXhlZCgxKSkpXHJcbiAgICBpZiAodGhpcy5hdWRpby5kdXJhdGlvbiA8IDM2MDAgfHwgZm9ybWF0dGVkID09PSAnMDA6MDA6MDAnKSB7XHJcbiAgICAgIGZvcm1hdHRlZCA9IGZvcm1hdHRlZC5zbGljZSgzKSAvLyBubjpublxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZvcm1hdHRlZFxyXG4gIH1cclxuXHJcbiAgJCRjdXJyZW50VGltZUZvcm1hdHRlZCgpIHtcclxuICAgIHJldHVybiB0aGlzLiQkZ2V0QXVkaW9UaW1lRm9ybWF0dGVkKCdjdXJyZW50VGltZScpXHJcbiAgfVxyXG5cclxuICAkJGR1cmF0aW9uRm9ybWF0dGVkKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuJCRnZXRBdWRpb1RpbWVGb3JtYXR0ZWQoJ2R1cmF0aW9uJylcclxuICB9XHJcblxyXG4gIHRyYWNrTnVtYmVyRm9ybWF0dGVkKG4pIHtcclxuICAgIHZhciBjb3VudCA9IFN0cmluZyh0aGlzLnRyYWNrQ291bnQpLmxlbmd0aCAtIFN0cmluZyhuKS5sZW5ndGhcclxuICAgIHJldHVybiAnMCcucmVwZWF0KGNvdW50KSArIG4gKyB0aGlzLnNldHRpbmdzLnRyYWNrTnVtYmVyUG9zdGZpeFxyXG4gICAgLy8gcmV0dXJuIF8ucmVwZWF0KCcwJywgY291bnQpICsgbiArIHRoaXMuc2V0dGluZ3MudHJhY2tOdW1iZXJQb3N0Zml4XHJcbiAgfVxyXG5cclxuICBnZXQoa2V5LCBpbmRleCkge1xyXG4gICAgcmV0dXJuIHRoaXMubGliW2luZGV4ID09PSB1bmRlZmluZWQgPyB0aGlzLmFsYnVtSW5kZXggOiBpbmRleF1ba2V5XVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIElmIHNldCB0cnVlLCBvbmx5IG9uZSBMYXAgY2FuIGJlIHBsYXlpbmcgYXQgYSBnaXZlbiB0aW1lXHJcbiAqIEB0eXBlIHtCb29sZWFufVxyXG4gKi9cclxuTGFwLmV4Y2x1c2l2ZU1vZGUgPSBmYWxzZVxyXG5cclxuLyoqXHJcbiAqIGNvbnNvbGUgZm9ybWF0IHByZWZpeCB1c2VkIHdoZW4gTGFwI3NldHRpbmdzLmRlYnVnZGVidWc9dHJ1ZVxyXG4gKlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAdHlwZSB7U3RyaW5nfVxyXG4gKi9cclxuTGFwLiQkZGVidWdTaWduYXR1cmUgPSAnY29sb3I6dGVhbDtmb250LXdlaWdodDpib2xkJ1xyXG5cclxuLyoqXHJcbiAqIExhcCBpbnN0YW5jZSBjYWNoZVxyXG4gKlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAdHlwZSB7T2JqZWN0fVxyXG4gKi9cclxuTGFwLiQkaW5zdGFuY2VzID0ge31cclxuXHJcbi8qKlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAdHlwZSB7UmVnRXhwfVxyXG4gKi9cclxuTGFwLiQkYXVkaW9FeHRlbnNpb25SZWdFeHAgPSAvbXAzfHdhdnxvZ2d8YWlmZi9pXHJcblxyXG4vKipcclxuICogQHByaXZhdGVcclxuICogQHR5cGUge09iamVjdH1cclxuICovXHJcbkxhcC4kJGRlZmF1bHRTZXR0aW5ncyA9IHtcclxuXHJcbiAgLyoqXHJcbiAgICogUmVnaXN0ZXIgY2FsbGJhY2tzIGZvciBhbnkgY3VzdG9tIExhcCBldmVudCwgd2hlcmUgdGhlIG9iamVjdCBrZXlcclxuICAgKiBpcyB0aGUgZXZlbnQgbmFtZSwgYW5kIHRoZSB2YWx1ZSBpcyB0aGUgY2FsbGJhY2suIEN1cnJlbnQgbGlzdCBvZlxyXG4gICAqIGN1c3RvbSBldmVudHMgdGhhdCBhcmUgZmlyZWQgaW5jbHVkZTpcclxuICAgKlxyXG4gICAqICsgbG9hZFxyXG4gICAqICsgcGxheVxyXG4gICAqICsgcGF1c2VcclxuICAgKiArIHRvZ2dsZVBsYXlcclxuICAgKiArIHNlZWtcclxuICAgKiArIHRyYWNrQ2hhbmdlXHJcbiAgICogKyBhbGJ1bUNoYW5nZVxyXG4gICAqICsgdm9sdW1lQ2hhbmdlXHJcbiAgICpcclxuICAgKiBUaGVzZSBldmVudHMgYXJlIGZpcmVkIGF0IHRoZSBlbmQgb2YgdGhlaXIgcmVzcGVjdGl2ZVxyXG4gICAqIERPTSBhbmQgQXVkaW8gZXZlbnQgbGlmZWN5Y2xlcywgYXMgd2VsbCBhcyBMYXAgbG9naWMgYXR0YWNoZWQgdG8gdGhvc2UuIEZvciBleGFtcGxlIHdoZW5cclxuICAgKiBMYXAjZWxzLnBsYXlQYXVzZSBpcyBjbGlja2VkIHdoZW4gaW5pdGlhbGx5IHBhdXNlZCwgdGhlIERPTSBldmVudCBpcyBmaXJlZCwgQXVkaW8gd2lsbCBiZWdpbiBwbGF5aW5nLFxyXG4gICAqIExhcCB3aWxsIHJlbW92ZSB0aGUgbGFwLS1wYXVzZWQgY2xhc3MgYW5kIGFkZCB0aGUgbGFwLS1wbGF5aW5nIGNsYXNzIHRvIHRoZSBlbGVtZW50LCBhbmQgZmluYWxseVxyXG4gICAqIHRoZSBjdXN0b20gJ3BsYXknIGV2ZW50IGlzIHRyaWdnZXJlZC4gTm90ZSBhbHNvIHRoYXQgeW91IGNhbiBzdWJzY3JpYmUgdG8gYW55IGN1c3RvbSBldmVudFxyXG4gICAqIHZpYSBgTGFwI29uKGV2ZW50LCBjYWxsYmFjaylgXHJcbiAgICpcclxuICAgKiBAdHlwZSB7T2JqZWN0fVxyXG4gICAqL1xyXG4gIGNhbGxiYWNrczoge30sXHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZW4gdHJ1ZSwgb3V0cHV0cyBiYXNpYyBpbnNwZWN0aW9uIGluZm8gYW5kIHdhcm5pbmdzXHJcbiAgICpcclxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cclxuICAgKi9cclxuICBkZWJ1ZzogZmFsc2UsXHJcblxyXG4gIC8qKlxyXG4gICAqIFN1cHBseSBhbiBhcnJheSBvZiBwbHVnaW5zIChjb25zdHJ1Y3RvcnMpIHdoaWNoIHdpbGxcclxuICAgKiBiZSBjYWxsZWQgd2l0aCB0aGUgTGFwIGluc3RhbmNlIGFzIHRoZWlyIHNvbGUgYXJndW1lbnQuXHJcbiAgICogVGhlIHBsdWdpbiBpbnN0YW5jZXMgdGhlbXNlbHZlcyB3aWxsIGJlIGF2YWlsYWJsZSBpbiB0aGUgc2FtZSBvcmRlclxyXG4gICAqIHZpYSBgTGFwI3BsdWdpbnNgIGFycmF5XHJcbiAgICpcclxuICAgKiBAdHlwZSB7QXJyYXl9XHJcbiAgICovXHJcbiAgcGx1Z2luczogW10sXHJcblxyXG4gIHN0YXJ0aW5nQWxidW1JbmRleDogMCxcclxuICBzdGFydGluZ1RyYWNrSW5kZXg6IDAsXHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBhbW91bnQgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgd2hpbGUgaG9sZGluZ1xyXG4gICAqIGBMYXAjZWxzLnNlZWtCYWNrd2FyZGAgb3IgYExhcCNlbHMuc2Vla0ZvcndhcmRgIGJlZm9yZSBleGVjdXRpbmcgYW5vdGhlclxyXG4gICAqIHNlZWsgaW5zdHJ1Y3Rpb25cclxuICAgKlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICovXHJcbiAgc2Vla0ludGVydmFsOiA1LFxyXG5cclxuICAvKipcclxuICAgKiBIb3cgZmFyIGZvcndhcmQgb3IgYmFjayBpbiBtaWxsaXNlY29uZHMgdG8gc2VlayB3aGVuXHJcbiAgICogY2FsbGluZyBzZWVrRm9yd2FyZCBvciBzZWVrQmFja3dhcmRcclxuICAgKlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICovXHJcbiAgc2Vla1RpbWU6IDI1MCxcclxuXHJcbiAgLyoqXHJcbiAgICogUHJvdmlkZSB5b3VyIG93biBjdXN0b20gc2VsZWN0b3JzIGZvciBlYWNoIGVsZW1lbnRcclxuICAgKiBpbiB0aGUgTGFwI2VscyBoYXNoLiBPdGhlcndpc2UgTGFwLiQkZGVmYXVsdFNlbGVjdG9ycyBhcmUgdXNlZFxyXG4gICAqXHJcbiAgICogQHR5cGUge09iamVjdH1cclxuICAgKi9cclxuICBzZWxlY3RvcnM6IHt9LFxyXG5cclxuICB0cmFja051bWJlclBvc3RmaXg6ICcgLSAnLFxyXG5cclxuICAvKipcclxuICAgKiBTaWduYWwgdGhhdCB5b3Ugd2lsbCBiZSB1c2luZyBhIG5hdGl2ZSBIVE1MNSBgcHJvZ3Jlc3NgIGVsZW1lbnRcclxuICAgKiB0byB0cmFjayBhdWRpbyBidWZmZXJlZCBhbW91bnQuIFJlcXVpcmVzIHRoYXQgYSBgbGFwX19wcm9ncmVzc2AgZWxlbWVudFxyXG4gICAqIGlzIGZvdW5kIHVuZGVyIHRoZSBgTGFwI2VsZW1lbnRgXHJcbiAgICpcclxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cclxuICAgKi9cclxuICB1c2VOYXRpdmVQcm9ncmVzczogZmFsc2UsXHJcblxyXG4gIC8qKlxyXG4gICAqIFNpZ25hbCB0aGF0IHlvdSB3aWxsIGJlIHVzaW5nIGEgbmF0aXZlIEhUTUw1IGBpbnB1dFt0eXBlPXJhbmdlXWAgZWxlbWVudFxyXG4gICAqIGZvciB0cmFjayBzZWVraW5nIGNvbnRyb2wuIFJlcXVpcmVzIHRoYXQgYSBgbGFwX19zZWVrLXJhbmdlYCBlbGVtZW50XHJcbiAgICogaXMgZm91bmQgdW5kZXIgdGhlIGBMYXAjZWxlbWVudGBcclxuICAgKlxyXG4gICAqIEB0eXBlIHtCb29sZWFufVxyXG4gICAqL1xyXG4gIHVzZU5hdGl2ZVNlZWtSYW5nZTogZmFsc2UsXHJcblxyXG4gIC8qKlxyXG4gICAqIFNpZ25hbCB0aGF0IHlvdSB3aWxsIGJlIHVzaW5nIGEgbmF0aXZlIEhUTUw1IGBpbnB1dFt0eXBlPXJhbmdlXWAgZWxlbWVudFxyXG4gICAqIGZvciB2b2x1bWUgY29udHJvbC4gUmVxdWlyZXMgdGhhdCBhIGBsYXBfX3ZvbHVtZS1yYW5nZWAgZWxlbWVudFxyXG4gICAqIGlzIGZvdW5kIHVuZGVyIHRoZSBgTGFwI2VsZW1lbnRgXHJcbiAgICpcclxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cclxuICAgKi9cclxuICB1c2VOYXRpdmVWb2x1bWVSYW5nZTogZmFsc2UsXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgYW1vdW50IG9mIHZvbHVtZSB0byBpbmNyZW1lbnQvZGVjcmVtZW50IHdoZW5ldmVyXHJcbiAgICogYSBgbGFwX192b2x1bWUtdXBgIG9yIGBsYXBfX3ZvbHVtZS1kb3duYCBlbGVtZW50IGlzIGNsaWNrZWQuXHJcbiAgICogTm90ZSB0aGF0IGF1ZGlvIHZvbHVtZSBpcyBmbG9hdGluZyBwb2ludCByYW5nZSBbMCwgMV1cclxuICAgKiBEb2VzIG5vdCBhcHBseSB0byBgbGFwX192b2x1bWUtcmFuZ2VgLlxyXG4gICAqXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKi9cclxuICB2b2x1bWVJbnRlcnZhbDogMC4wNVxyXG59XHJcblxyXG5MYXAuJCRkZWZhdWx0U2VsZWN0b3JzID0ge1xyXG4gIHN0YXRlOiB7XHJcbiAgICBwbGF5bGlzdEl0ZW1DdXJyZW50OiAgJ2xhcF9fcGxheWxpc3RfX2l0ZW0tLWN1cnJlbnQnLFxyXG4gICAgcGxheWluZzogICAgICAgICAgICAgICdsYXAtLXBsYXlpbmcnLFxyXG4gICAgcGF1c2VkOiAgICAgICAgICAgICAgICdsYXAtLXBhdXNlZCcsXHJcbiAgICBoaWRkZW46ICAgICAgICAgICAgICAgJ2xhcC0taGlkZGVuJ1xyXG4gIH0sXHJcbiAgYWxidW06ICAgICAgICAgICAgICAgJ2xhcF9fYWxidW0nLFxyXG4gIGFydGlzdDogICAgICAgICAgICAgICdsYXBfX2FydGlzdCcsXHJcbiAgYnVmZmVyZWQ6ICAgICAgICAgICAgJ2xhcF9fYnVmZmVyZWQnLFxyXG4gIGNvdmVyOiAgICAgICAgICAgICAgICdsYXBfX2NvdmVyJyxcclxuICBjdXJyZW50VGltZTogICAgICAgICAnbGFwX19jdXJyZW50LXRpbWUnLFxyXG4gIGRpc2NvZzogICAgICAgICAgICAgICdsYXBfX2Rpc2NvZycsXHJcbiAgZGlzY29nSXRlbTogICAgICAgICAgJ2xhcF9fZGlzY29nX19pdGVtJyxcclxuICBkaXNjb2dQYW5lbDogICAgICAgICAnbGFwX19kaXNjb2dfX3BhbmVsJyxcclxuICBkdXJhdGlvbjogICAgICAgICAgICAnbGFwX19kdXJhdGlvbicsXHJcbiAgaW5mbzogICAgICAgICAgICAgICAgJ2xhcF9faW5mbycsIC8vIGJ1dHRvblxyXG4gIGluZm9QYW5lbDogICAgICAgICAgICdsYXBfX2luZm8tcGFuZWwnLFxyXG4gIG5leHQ6ICAgICAgICAgICAgICAgICdsYXBfX25leHQnLFxyXG4gIG5leHRBbGJ1bTogICAgICAgICAgICdsYXBfX25leHQtYWxidW0nLFxyXG4gIHBsYXlQYXVzZTogICAgICAgICAgICdsYXBfX3BsYXktcGF1c2UnLFxyXG4gIHBsYXlsaXN0OiAgICAgICAgICAgICdsYXBfX3BsYXlsaXN0JywgLy8gYnV0dG9uXHJcbiAgcGxheWxpc3RJdGVtOiAgICAgICAgJ2xhcF9fcGxheWxpc3RfX2l0ZW0nLCAvLyBsaXN0IGl0ZW1cclxuICBwbGF5bGlzdFBhbmVsOiAgICAgICAnbGFwX19wbGF5bGlzdF9fcGFuZWwnLFxyXG4gIHBsYXlsaXN0VHJhY2tOdW1iZXI6ICdsYXBfX3BsYXlsaXN0X190cmFjay1udW1iZXInLFxyXG4gIHBsYXlsaXN0VHJhY2tUaXRsZTogICdsYXBfX3BsYXlsaXN0X190cmFjay10aXRsZScsXHJcbiAgcHJldjogICAgICAgICAgICAgICAgJ2xhcF9fcHJldicsXHJcbiAgcHJldkFsYnVtOiAgICAgICAgICAgJ2xhcF9fcHJldi1hbGJ1bScsXHJcbiAgcHJvZ3Jlc3M6ICAgICAgICAgICAgJ2xhcF9fcHJvZ3Jlc3MnLFxyXG4gIHNlZWtCYWNrd2FyZDogICAgICAgICdsYXBfX3NlZWstYmFja3dhcmQnLFxyXG4gIHNlZWtGb3J3YXJkOiAgICAgICAgICdsYXBfX3NlZWstZm9yd2FyZCcsXHJcbiAgc2Vla1JhbmdlOiAgICAgICAgICAgJ2xhcF9fc2Vlay1yYW5nZScsXHJcbiAgdHJhY2tOdW1iZXI6ICAgICAgICAgJ2xhcF9fdHJhY2stbnVtYmVyJywgLy8gdGhlIGN1cnJlbnRseSBjdWVkIHRyYWNrXHJcbiAgdHJhY2tUaXRsZTogICAgICAgICAgJ2xhcF9fdHJhY2stdGl0bGUnLFxyXG4gIHZvbHVtZUJ1dHRvbjogICAgICAgICdsYXBfX3ZvbHVtZS1idXR0b24nLFxyXG4gIHZvbHVtZURvd246ICAgICAgICAgICdsYXBfX3ZvbHVtZS1kb3duJyxcclxuICB2b2x1bWVSZWFkOiAgICAgICAgICAnbGFwX192b2x1bWUtcmVhZCcsXHJcbiAgdm9sdW1lUmFuZ2U6ICAgICAgICAgJ2xhcF9fdm9sdW1lLXJhbmdlJyxcclxuICB2b2x1bWVVcDogICAgICAgICAgICAnbGFwX192b2x1bWUtdXAnXHJcbn1cclxuXHJcbmlmICh3aW5kb3cpIHdpbmRvdy5MYXAgPSBMYXBcclxuIl19
