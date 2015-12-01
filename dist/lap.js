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
   *  album objects, a single album object, or a url to a single audio file
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
      this.els.duration.innerHTML = this.durationFormatted();
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
    key: 'durationFormatted',
    value: function durationFormatted() {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGxhcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNXcUIsR0FBRztZQUFILEdBQUc7Ozs7Ozs7Ozs7QUFTdEIsV0FUbUIsR0FBRyxDQVNWLE9BQU8sRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFrQjtRQUFoQixRQUFRLHlEQUFDLEtBQUs7OzBCQVQ5QixHQUFHOzs7O3VFQUFILEdBQUc7O0FBYXBCLFVBQUssRUFBRSxHQUFHLE9BQU8sSUFBSSxPQUFPLENBQUMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUE7QUFDckUsT0FBRyxDQUFDLFdBQVcsQ0FBQyxNQUFLLEVBQUUsQ0FBQyxRQUFPLENBQUE7O0FBRS9CLFVBQUssT0FBTyxHQUFHLE9BQU8sT0FBTyxLQUFLLFFBQVEsR0FDdEMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FDL0IsT0FBTyxDQUFBOztBQUVYLFVBQUssTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBOztBQUVoQixVQUFLLFFBQVEsR0FBRyxFQUFFLENBQUE7QUFDbEIsUUFBSSxPQUFPLEVBQUU7QUFDWCxTQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxVQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUs7QUFDNUMsWUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQUssUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQSxLQUM3RCxNQUFLLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUE7T0FDOUIsQ0FBQyxDQUFBO0tBQ0gsTUFBTTtBQUNMLFlBQUssUUFBUSxHQUFHLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQTtLQUN0Qzs7QUFF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b0I7QUFDekMsWUFBVSxFQUFXLGtCQUFrQjtBQUN2QyxZQUFVLEVBQVcsa0JBQWtCO0FBQ3ZDLGFBQVcsRUFBVSxtQkFBbUI7QUFDeEMsVUFBUSxFQUFhLGdCQUFnQjtDQUN0QyxDQUFBOztBQUVELElBQUksTUFBTSxFQUFFLE1BQU0sQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxyXG4gKiBsYXAuanMgdmVyc2lvbiAwLjYuMFxyXG4gKiBIVE1MNSBhdWRpbyBwbGF5ZXJcclxuICpcclxuICogaHR0cHM6Ly9naXRodWIuY29tL0xva3VhL2xhcC5naXRcclxuICogaHR0cDovL2xva3VhLm5ldFxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgwqkgMjAxNCwgMjAxNSBKb3NodWEgS2xlY2tuZXIgPGRldkBsb2t1YS5uZXQ+XHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cclxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxyXG4gKi9cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGFwIGV4dGVuZHMgQnVzIHtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgY29uc3RydWN0b3IuXHJcbiAgICogQHBhcmFtICB7U3RyaW5nfEhUTUwgRWxlbWVudH0gZWxlbWVudCBjb250YWluZXIgZWxlbWVudFxyXG4gICAqIEBwYXJhbSAge0FycmF5fE9iamVjdHxTdHJpbmd9IGxpYiBhIExhcCBcImxpYnJhcnlcIiwgd2hpY2ggY2FuIGJlIGFuIGFycmF5IG9mXHJcbiAgICogIGFsYnVtIG9iamVjdHMsIGEgc2luZ2xlIGFsYnVtIG9iamVjdCwgb3IgYSB1cmwgdG8gYSBzaW5nbGUgYXVkaW8gZmlsZVxyXG4gICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAgc2V0dGluZ3MgaGFzaCB0aGF0IHdpbGwgYmUgbWVyZ2VkIHdpdGggTGFwLiQkZGVmYXVsdFNldHRpbmdzXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgbGliLCBvcHRpb25zLCBwb3N0cG9uZT1mYWxzZSkge1xyXG4gICAgc3VwZXIoKVxyXG5cclxuICAgIC8vIGRlZmF1bHQgaWQgdG8gemVyby1iYXNlZCBpbmRleCBpbmNyZW1lbnRlclxyXG4gICAgdGhpcy5pZCA9IG9wdGlvbnMgJiYgb3B0aW9ucy5pZCA/IG9wdGlvbnMuaWQgOiBMYXAuJCRpbnN0YW5jZXMubGVuZ3RoXHJcbiAgICBMYXAuJCRpbnN0YW5jZXNbdGhpcy5pZF0gPSB0aGlzXHJcblxyXG4gICAgdGhpcy5lbGVtZW50ID0gdHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnXHJcbiAgICAgID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtZW50KVxyXG4gICAgICA6IGVsZW1lbnRcclxuXHJcbiAgICB0aGlzLnNldExpYihsaWIpXHJcblxyXG4gICAgdGhpcy5zZXR0aW5ncyA9IHt9XHJcbiAgICBpZiAob3B0aW9ucykge1xyXG4gICAgICBMYXAuZWFjaChMYXAuJCRkZWZhdWx0U2V0dGluZ3MsICh2YWwsIGtleSkgPT4ge1xyXG4gICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KGtleSkpIHRoaXMuc2V0dGluZ3Nba2V5XSA9IG9wdGlvbnNba2V5XVxyXG4gICAgICAgIGVsc2UgdGhpcy5zZXR0aW5nc1trZXldID0gdmFsXHJcbiAgICAgIH0pXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnNldHRpbmdzID0gTGFwLiQkZGVmYXVsdFNldHRpbmdzXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5kZWJ1ZyA9IHRoaXMuc2V0dGluZ3MuZGVidWdcclxuXHJcblxyXG4gICAgaWYgKHRoaXMuZGVidWcpIHtcclxuICAgICAgdGhpcy5vbignbG9hZCcsICgpID0+IGNvbnNvbGUuaW5mbygnJWNMYXAoJXMpIFtERUJVR106JWMgJW8nLFxyXG4gICAgICAgIExhcC4kJGRlYnVnU2lnbmF0dXJlLCB0aGlzLmlkLCAnY29sb3I6aW5oZXJpdCcsIHRoaXMpKVxyXG4gICAgICBjb25zdCBlY2hvID0gZSA9PiB7XHJcbiAgICAgICAgdGhpcy5vbihlLCAoKSA9PiBjb25zb2xlLmluZm8oJyVjTGFwKCVzKSBbREVCVUddOiVjICVzIGhhbmRsZXIgY2FsbGVkJyxcclxuICAgICAgICAgIExhcC4kJGRlYnVnU2lnbmF0dXJlLCB0aGlzLmlkLCAnY29sb3I6aW5oZXJpdCcsIGUpKVxyXG4gICAgICB9XHJcbiAgICAgIGVjaG8oJ2xvYWQnKVxyXG4gICAgICBlY2hvKCdwbGF5JylcclxuICAgICAgZWNobygncGF1c2UnKVxyXG4gICAgICBlY2hvKCdzZWVrJylcclxuICAgICAgZWNobygndHJhY2tDaGFuZ2UnKVxyXG4gICAgICBlY2hvKCdhbGJ1bUNoYW5nZScpXHJcbiAgICAgIGVjaG8oJ3ZvbHVtZUNoYW5nZScpXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFwb3N0cG9uZSkgdGhpcy5pbml0aWFsaXplKClcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGEgTGFwIGluc3RhbmNlIGJ5IGlkLiBJZCBpcyBub3QgYW4gZWxlbWVudCBjb250YWluZXIgaWQ7IGl0IGlzIHRoZSBgTGFwI3NldHRpbmdzLmlkYFxyXG4gICAqIG1lbWJlciwgd2hpY2ggaWYgbm90IHN1cHBsaWVkIG9uIGNyZWF0aW9uLCBpcyB6ZXJvLWJhc2VkIHRoZSBudGggaW5zdGFuY2UgbnVtYmVyLlxyXG4gICAqXHJcbiAgICogQHBhcmFtICB7bnVtYmVyfSBpZCBMYXAjc2V0dGluZ3MuaWRcclxuICAgKiBAcmV0dXJuIHtMYXB9IHRoZSBpbnN0YW5jZVxyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXRJbnN0YW5jZShpZCkge1xyXG4gICAgcmV0dXJuIExhcC4kJGluc3RhbmNlc1tpZF1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZCBjbGFzcyBgY2xhc3NgIHRvIEhUTUwgRWxlbWVudCBgZWxgXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0hUTUwgRWxlbWVudH0gZWxcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gX2NsYXNzXHJcbiAgICovXHJcbiAgc3RhdGljIGFkZENsYXNzKGVsLCBfY2xhc3MpIHtcclxuICAgIGlmICghZWwpIHJldHVybiBjb25zb2xlLndhcm4oYCR7ZWx9IGlzIG5vdCBkZWZpbmVkYClcclxuICAgIGlmICghZWwuY2xhc3NOYW1lKSB7XHJcbiAgICAgIHJldHVybiAoZWwuY2xhc3NOYW1lICs9ICcgJyArIF9jbGFzcylcclxuICAgIH1cclxuICAgIGNvbnN0IGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWVcclxuICAgIGNvbnN0IG5ld0NsYXNzZXMgPSBfY2xhc3NcclxuICAgICAgLnNwbGl0KC9cXHMrLylcclxuICAgICAgLmZpbHRlcihuID0+IGNsYXNzTmFtZXMuaW5kZXhPZihuKSA9PT0gLTEpXHJcbiAgICAgIC5qb2luKCcgJylcclxuICAgIGVsLmNsYXNzTmFtZSArPSAnICcgKyBuZXdDbGFzc2VzXHJcbiAgICByZXR1cm4gTGFwXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmUgY2xhc3MgYGNsYXNzYCBmcm9tIEhUTUwgRWxlbWVudCBgZWxgXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0hUTUwgRWxlbWVudH0gZWxcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gX2NsYXNzXHJcbiAgICovXHJcbiAgc3RhdGljIHJlbW92ZUNsYXNzKGVsLCBfY2xhc3MpIHtcclxuICAgIGlmICghZWwpIHJldHVybiBjb25zb2xlLndhcm4oYCR7ZWx9IGlzIG5vdCBkZWZpbmVkYClcclxuICAgIC8vIHVuY29tbWVudCBmb3IgbXVsdGlwbGUgY2xhc3MgcmVtb3ZhbFxyXG4gICAgLy8gX2NsYXNzID0gYCgke19jbGFzcy5zcGxpdCgvXFxzKy8pLmpvaW4oJ3wnKX0pYFxyXG5cclxuICAgIC8vIFRPRE86IGNhY2hlP1xyXG4gICAgY29uc3QgcmUgPSBuZXcgUmVnRXhwKCdcXFxccyonICsgX2NsYXNzICsgJ1xcXFxzKighW1xcXFx3XFxcXFddKT8nLCAnZycpXHJcbiAgICBlbC5jbGFzc05hbWUgPSBlbC5jbGFzc05hbWUucmVwbGFjZShyZSwgJyAnKS50cmltKClcclxuICAgIHJldHVybiBMYXBcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlcnQgbWlsbGlzZWNvbmRzIGludG8gaGg6bW06c3MgZm9ybWF0XHJcbiAgICpcclxuICAgKiBAcGFyYW0gIHtzdHJpbmd8bnVtYmVyfSB0aW1lIG1pbGxpc2Vjb25kc1xyXG4gICAqIEByZXR1cm4ge3N0cmluZ30gYHRpbWVgIGluIGhoOm1tOnNzIGZvcm1hdFxyXG4gICAqL1xyXG4gIHN0YXRpYyBmb3JtYXRUaW1lKHRpbWUpIHtcclxuICAgIGxldCBoID0gTWF0aC5mbG9vcih0aW1lIC8gMzYwMClcclxuICAgIGxldCBtID0gTWF0aC5mbG9vcigodGltZSAtIChoICogMzYwMCkpIC8gNjApXHJcbiAgICBsZXQgcyA9IE1hdGguZmxvb3IodGltZSAtIChoICogMzYwMCkgLSAobSAqIDYwKSlcclxuICAgIGlmIChoIDwgMTApIGggPSAnMCcgKyBoXHJcbiAgICBpZiAobSA8IDEwKSBtID0gJzAnICsgbVxyXG4gICAgaWYgKHMgPCAxMCkgcyA9ICcwJyArIHNcclxuICAgIHJldHVybiBoICsgJzonICsgbSArICc6JyArIHNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJhcmVib25lcyBmb3JFYWNoIGZvciBvYmplY3RcclxuICAgKlxyXG4gICAqIEBwYXJhbSAge09iamVjdH0gICBvYmogUE9KT1xyXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiAgaXRlcmF0b3IgY2FsbGVkIHZhbCxrZXksb2JqXHJcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgIGN0eCBvcHRpb25hbCBjb250ZXh0XHJcbiAgICogQHJldHVybiB7dW5kZWZpbmVkfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBlYWNoKG9iaiwgZm4sIGN0eCkge1xyXG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKG9iailcclxuICAgIGxldCBpID0gMCwgbGVuID0ga2V5cy5sZW5ndGhcclxuICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIGZuLmNhbGwoY3R4LCBvYmpba2V5c1tpXV0sIGtleXNbaV0sIG9iailcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNjYWxlIGEgbnVtYmVyIGZyb20gb25lIHJhbmdlIHRvIGFub3RoZXJcclxuICAgKlxyXG4gICAqIEBwYXJhbSAge251bWJlcn0gbiAgICAgIHRoZSBudW1iZXIgdG8gc2NhbGVcclxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IG9sZE1pblxyXG4gICAqIEBwYXJhbSAge251bWJlcn0gb2xkTWF4XHJcbiAgICogQHBhcmFtICB7bnVtYmVyfSBtaW4gICAgdGhlIG5ldyBtaW4gW2RlZmF1bHQ9MF1cclxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IG1heCAgICB0aGUgbmV3IG1heCBbZGVmYXVsdD0xXVxyXG4gICAqIEByZXR1cm4ge251bWJlcn0gICAgICAgIHRoZSBzY2FsZWQgbnVtYmVyXHJcbiAgICovXHJcbiAgc3RhdGljIHNjYWxlKG4sIG9sZE1pbiwgb2xkTWF4LCBtaW4sIG1heCkge1xyXG4gICAgcmV0dXJuICgoKG4tb2xkTWluKSoobWF4LW1pbikpIC8gKG9sZE1heC1vbGRNaW4pKSArIG1pblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhbGwgZG9tLCBhdWRpbywgYW5kIGludGVybmFsIGV2ZW50IGhhbmRsZXJzIGZyb20gdGhlIGdpdmVuIExhcCBpbnN0YW5jZSxcclxuICAgKiB0aGVuIGRlbGV0ZXMgYWxsIHByb3BlcnRpZXNcclxuICAgKlxyXG4gICAqIEBwYXJhbSAge0xhcH0gbGFwIHRoZSBMYXAgaW5zdGFuY2VcclxuICAgKiBAcmV0dXJuIHtudWxsfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBkZXN0cm95KGxhcCkge1xyXG5cclxuICAgIC8vIHJlbW92ZSBkb20gZXZlbnQgaGFuZGxlcnNcclxuICAgIExhcC5lYWNoKGxhcC4kJGxpc3RlbmVycywgKGV2ZW50cywgZWxlbWVudE5hbWUpID0+IGRlbGV0ZSBsYXAuJCRsaXN0ZW5lcnNbZWxlbWVudE5hbWVdKVxyXG5cclxuICAgIC8vIHJlbW92ZSBhdWRpbyBldmVudHNcclxuICAgIExhcC5lYWNoKGxhcC4kJGF1ZGlvTGlzdGVuZXJzLCAobGlzdGVuZXJzLCBldmVudCkgPT4gZGVsZXRlIGxhcC4kJGF1ZGlvTGlzdGVuZXJzW2V2ZW50XSlcclxuXHJcbiAgICAvLyByZW1vdmUgYWxsIHN1cGVyIGhhbmRsZXJzXHJcbiAgICBsYXAucmVtb3ZlKClcclxuXHJcbiAgICAvLyBudWxsaWZ5IGVsZW1lbnRzXHJcbiAgICBMYXAuZWFjaChsYXAuZWxzLCAoZWxlbWVudCwgZWxOYW1lKSA9PiBkZWxldGUgbGFwLmVsc1tlbE5hbWVdKVxyXG5cclxuICAgIC8vIGV2ZXJ5dGhpbmcgZWxzZSBqdXN0IGluIGNhc2VcclxuICAgIExhcC5lYWNoKGxhcCwgKHZhbCwga2V5KSA9PiBkZWxldGUgbGFwW2tleV0pXHJcblxyXG4gICAgcmV0dXJuIG51bGxcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGlzIHBsYXllcidzIGBsaWJgIG1lbWJlci4gYGxpYmAgaXMgdGhlIHNhbWUgYXMgd291bGRcclxuICAgKiBiZSBwYXNzZWQgdG8gdGhlIExhcCBjb25zdHJ1Y3Rvci4gVGhpcyBtZXRob2QgaXMgdXNlZCBpbnRlcm5hbGx5IG9uIGZpcnN0IGluc3RhbnRpYXRpb24sXHJcbiAgICogeWV0IHNob3VsZCBvbmx5IGJlIGNhbGxlZCBtYW51YWxseSBpbiB0aGUgY2FzZSB3aGVyZSB5b3Ugd2FudCB0byBjb21wbGV0ZWx5IHJlcGxhY2UgdGhlIGluc3RhbmNlc1xyXG4gICAqIGxpYi4gTm90ZSB0aGF0IGAjdXBkYXRlYCBtdXN0IGJlIGNhbGxlZCBhZnRlciBgI3NldExpYmAgZm9yIGNoYW5nZXMgdG8gdGFrZSBlZmZlY3QuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGxpYlxyXG4gICAqL1xyXG4gIHNldExpYihsaWIpIHtcclxuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgbGliXHJcbiAgICBjb25zdCBpc0FycmF5ID0gbGliIGluc3RhbmNlb2YgQXJyYXlcclxuICAgIGlmIChpc0FycmF5KSB7XHJcbiAgICAgIHRoaXMubGliID0gbGliXHJcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgIHRoaXMubGliID0gW2xpYl1cclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycgJiYgTGFwLiQkYXVkaW9FeHRlbnNpb25SZWdFeHAudGVzdChsaWIpKSB7XHJcbiAgICAgIHRoaXMubGliID0gW3sgZmlsZXM6IFtsaWJdIH1dXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bGlifSBtdXN0IGJlIGFuIGFycmF5LCBvYmplY3QsIG9yIHN0cmluZ2ApXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhpcyBtZXRob2QgaXMgYmFzaWNhbGx5IGEgc2Vjb25kYXJ5IGNvbnN0cnVjdG9yIGFuZCBzaG91bGQgbm90IHJlYWxseSBuZWVkXHJcbiAgICogdG8gYmUgY2FsbGVkIG1hbnVhbGx5IGV4Y2VwdCBpbiB0aGUgY2FzZSB0aGF0IHlvdSB3YW50IHRvIHByZXBhcmUgYSBwbGF5ZXIgd2l0aCBpdHNcclxuICAgKiBzZXR0aW5ncyB3aGlsZSB3YWl0aW5nIGZvciBhIGxpYiB0byBjb21lIGJhY2sgZnJvbSBhbiBhamF4IGNhbGwuXHJcbiAgICpcclxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcclxuICAgKi9cclxuICBpbml0aWFsaXplKCkge1xyXG5cclxuICAgIC8vIHN0YXRlXHJcbiAgICB0aGlzLnNlZWtpbmcgPSBmYWxzZVxyXG4gICAgdGhpcy52b2x1bWVDaGFuZ2luZyA9IGZhbHNlXHJcbiAgICB0aGlzLm1vdXNlRG93blRpbWVyID0gMFxyXG4gICAgdGhpcy5wbGF5aW5nID0gZmFsc2VcclxuXHJcbiAgICB0aGlzLnVwZGF0ZSgpXHJcbiAgICB0aGlzLiQkaW5pdEF1ZGlvKClcclxuICAgIHRoaXMuJCRpbml0RWxlbWVudHMoKVxyXG4gICAgdGhpcy4kJGFkZEF1ZGlvTGlzdGVuZXJzKClcclxuICAgIHRoaXMuJCRhZGRWb2x1bWVMaXN0ZW5lcnMoKVxyXG4gICAgdGhpcy4kJGFkZFNlZWtMaXN0ZW5lcnMoKVxyXG4gICAgdGhpcy4kJGFkZExpc3RlbmVycygpXHJcbiAgICB0aGlzLiQkYWN0aXZhdGVQbHVnaW5zKClcclxuXHJcbiAgICBMYXAuZWFjaCh0aGlzLnNldHRpbmdzLmNhbGxiYWNrcywgKGZuLCBrZXkpID0+IHRoaXMub24oa2V5LCBmbi5iaW5kKHRoaXMpKSlcclxuXHJcbiAgICB0aGlzLnRyaWdnZXIoJ2xvYWQnLCB0aGlzKVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25maWd1cmVzIGluc3RhbmNlIHZhcmlhYmxlcyByZWxhdGl2ZSB0byB0aGUgY3VycmVudCBhbGJ1bS5cclxuICAgKiBDYWxsZWQgb24gaW5zdGFuY2UgaW5pdGlhbGl6YXRpb24gYW5kIHdoZW5ldmVyIGFuIGFsYnVtIGlzIGNoYW5nZWQuXHJcbiAgICogVGhpcyBtZXRob2QgaXMgYWxzbyBuZWVkZWQgaWYgeW91IG1hbnVhbGx5IHJlcGxhY2UgYW4gaW5zdGFuY2UncyBgbGliYCBtZW1iZXJcclxuICAgKiB2aWEgYCNzZXRMaWJgLCBpbiB3aGljaCBjYXNlIHlvdSdsbCBuZWVkIHRvIGNhbGwgYCN1cGRhdGVgIGRpcmVjdGx5IGFmdGVyXHJcbiAgICpcclxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcclxuICAgKi9cclxuICB1cGRhdGUoKSB7XHJcbiAgICB0aGlzLmFsYnVtSW5kZXggPSB0aGlzLmFsYnVtSW5kZXggfHwgdGhpcy5zZXR0aW5ncy5zdGFydGluZ0FsYnVtSW5kZXggfHwgMFxyXG4gICAgdGhpcy50cmFja0luZGV4ID0gdGhpcy50cmFja0luZGV4IHx8IHRoaXMuc2V0dGluZ3Muc3RhcnRpbmdUcmFja0luZGV4IHx8IDBcclxuICAgIHRoaXMuYWxidW1Db3VudCA9IHRoaXMubGliLmxlbmd0aFxyXG4gICAgdGhpcy5wbGF5bGlzdFBvcHVsYXRlZCA9IGZhbHNlXHJcblxyXG4gICAgY29uc3QgY3VycmVudExpYkl0ZW0gPSB0aGlzLmxpYlt0aGlzLmFsYnVtSW5kZXhdXHJcblxyXG4gICAgY29uc3Qga2V5cyA9IFsnYXJ0aXN0JywgJ2FsYnVtJywgJ2ZpbGVzJywgJ2NvdmVyJywgJ3RyYWNrbGlzdCcsICdyZXBsYWNlbWVudCddXHJcbiAgICBrZXlzLmZvckVhY2goa2V5ID0+IHRoaXNba2V5XSA9IGN1cnJlbnRMaWJJdGVtW2tleV0pXHJcblxyXG5cclxuICAgIHRoaXMudHJhY2tDb3VudCA9IHRoaXMuZmlsZXMubGVuZ3RoXHJcblxyXG4gICAgLy8gcmVwbGFjZW1lbnQgaW4gPT09IFtyZWdleHAgc3RyaW5nLCByZXBsYWNlbWVudCBzdHJpbmcsIG9wdGlvbmFsIGZsYWdzXVxyXG4gICAgLy8gcmVwbGFjZW1lbnQgb3V0ID09PSBbcmVnZXhwIGluc3RhbmNlLCByZXBsYWNlbWVudF1cclxuICAgIGlmICh0aGlzLnJlcGxhY2VtZW50KSB7XHJcbiAgICAgIGxldCByZSA9IHRoaXMucmVwbGFjZW1lbnRcclxuXHJcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlKSAmJiByZVswXSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xyXG4gICAgICAgIHRoaXMucmVwbGFjZW1lbnQgPSByZVxyXG5cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAodHlwZW9mIHJlID09PSAnc3RyaW5nJykgcmUgPSBbcmVdXHJcblxyXG4gICAgICAgIC8vIHJlIG1heSBjb250YWluIHN0cmluZy13cmFwcGVkIHJlZ2V4cCAoZnJvbSBqc29uKSwgY29udmVydCBpZiBzb1xyXG4gICAgICAgIHJlWzBdID0gbmV3IFJlZ0V4cChyZVswXSwgcmVbMl0gfHwgJ2cnKVxyXG4gICAgICAgIHJlWzFdID0gcmVbMV0gfHwgJydcclxuXHJcbiAgICAgICAgdGhpcy5yZXBsYWNlbWVudCA9IHJlXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLiQkZm9ybWF0VHJhY2tsaXN0KClcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5zdGFudGlhdGUgZXZlcnkgcGx1Z2luJ3MgY29udHJ1Y3RvciB3aXRoIHRoaXMgTGFwIGluc3RhbmNlXHJcbiAgICpcclxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gICQkYWN0aXZhdGVQbHVnaW5zKCkge1xyXG4gICAgdGhpcy5wbHVnaW5zID0gW11cclxuICAgIHRoaXMuc2V0dGluZ3MucGx1Z2lucy5mb3JFYWNoKChwbHVnaW4sIGkpID0+IHRoaXMucGx1Z2luc1tpXSA9IG5ldyBwbHVnaW4odGhpcykpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICAkJGluaXRBdWRpbygpIHtcclxuICAgIHRoaXMuYXVkaW8gPSBuZXcgQXVkaW8oKVxyXG4gICAgdGhpcy5hdWRpby5wcmVsb2FkID0gJ2F1dG8nXHJcbiAgICBsZXQgZmlsZVR5cGUgPSB0aGlzLmZpbGVzW3RoaXMudHJhY2tJbmRleF1cclxuICAgIGZpbGVUeXBlID0gZmlsZVR5cGUuc2xpY2UoZmlsZVR5cGUubGFzdEluZGV4T2YoJy4nKSsxKVxyXG4gICAgY29uc3QgY2FuUGxheSA9IHRoaXMuYXVkaW8uY2FuUGxheVR5cGUoJ2F1ZGlvLycgKyBmaWxlVHlwZSlcclxuICAgIGlmIChjYW5QbGF5ID09PSAncHJvYmFibHknIHx8IGNhblBsYXkgPT09ICdtYXliZScpIHtcclxuICAgICAgdGhpcy4kJHVwZGF0ZVNvdXJjZSgpXHJcbiAgICAgIHRoaXMuYXVkaW8udm9sdW1lID0gMVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gVE9ETzogcmV0dXJuIGEgZmxhZyB0byBzaWduYWwgc2tpcHBpbmcgdGhlIHJlc3Qgb2YgdGhlIGluaXRpYWxpemF0aW9uIHByb2Nlc3NcclxuICAgICAgY29uc29sZS53YXJuKGBUaGlzIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCAke2ZpbGVUeXBlfSBwbGF5YmFjay5gKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgJCR1cGRhdGVTb3VyY2UoKSB7XHJcbiAgICB0aGlzLmF1ZGlvLnNyYyA9IHRoaXMuZmlsZXNbdGhpcy50cmFja0luZGV4XVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgJCRpbml0RWxlbWVudHMoKSB7XHJcbiAgICB0aGlzLmVscyA9IHt9XHJcbiAgICB0aGlzLnNlbGVjdG9ycyA9IHsgc3RhdGU6IHt9IH1cclxuICAgIExhcC5lYWNoKExhcC4kJGRlZmF1bHRTZWxlY3RvcnMsIChzZWxlY3Rvciwga2V5KSA9PiB7XHJcbiAgICAgIGlmIChrZXkgIT09ICdzdGF0ZScpIHtcclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3RvcnNba2V5XSA9IHRoaXMuc2V0dGluZ3Muc2VsZWN0b3JzLmhhc093blByb3BlcnR5KGtleSlcclxuICAgICAgICAgID8gdGhpcy5zZXR0aW5ncy5zZWxlY3RvcnNba2V5XVxyXG4gICAgICAgICAgOiBzZWxlY3RvclxyXG5cclxuICAgICAgICBjb25zdCBlbCA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKGAuJHt0aGlzLnNlbGVjdG9yc1trZXldfWApXHJcbiAgICAgICAgaWYgKGVsKSB0aGlzLmVsc1trZXldID0gZWxcclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgaGFzQ3VzdG9tU3RhdGUgPSB0aGlzLnNldHRpbmdzLnNlbGVjdG9ycy5zdGF0ZVxyXG5cclxuICAgICAgICBpZiAoIWhhc0N1c3RvbVN0YXRlKSByZXR1cm4gKHRoaXMuc2VsZWN0b3JzLnN0YXRlID0gTGFwLiQkZGVmYXVsdFNlbGVjdG9ycy5zdGF0ZSlcclxuXHJcbiAgICAgICAgTGFwLmVhY2goTGFwLiQkZGVmYXVsdFNlbGVjdG9ycy5zdGF0ZSwgKHNlbCwgaykgPT4ge1xyXG4gICAgICAgICAgdGhpcy5zZWxlY3RvcnMuc3RhdGVba10gPSB0aGlzLnNldHRpbmdzLnNlbGVjdG9ycy5zdGF0ZS5oYXNPd25Qcm9wZXJ0eShrKVxyXG4gICAgICAgICAgICA/IHRoaXMuc2V0dGluZ3Muc2VsZWN0b3JzLnN0YXRlW2tdXHJcbiAgICAgICAgICAgIDogc2VsXHJcbiAgICAgICAgfSlcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgd3JhcHBlciBhcm91bmQgdGhpcyBMYXAgaW5zdGFuY2VzIGBhdWRpby5hZGRFdmVudExpc3RlbmVyYCB0aGF0XHJcbiAgICogZW5zdXJlcyBoYW5kbGVycyBhcmUgY2FjaGVkIGZvciBsYXRlciByZW1vdmFsIHZpYSBgTGFwLmRlc3Ryb3koaW5zdGFuY2UpYCBjYWxsXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBldmVudCAgICAgICBBdWRpbyBFdmVudCBuYW1lXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgICAgY2FsbGJhY2tcclxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcclxuICAgKi9cclxuICBhZGRBdWRpb0xpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcikge1xyXG4gICAgdGhpcy4kJGF1ZGlvTGlzdGVuZXJzID0gdGhpcy4kJGF1ZGlvTGlzdGVuZXJzIHx8IHt9XHJcbiAgICB0aGlzLiQkYXVkaW9MaXN0ZW5lcnNbZXZlbnRdID0gdGhpcy4kJGF1ZGlvTGlzdGVuZXJzW2V2ZW50XSB8fCBbXVxyXG5cclxuICAgIGNvbnN0IGJvdW5kID0gbGlzdGVuZXIuYmluZCh0aGlzKVxyXG4gICAgdGhpcy4kJGF1ZGlvTGlzdGVuZXJzW2V2ZW50XS5wdXNoKGJvdW5kKVxyXG4gICAgdGhpcy5hdWRpby5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBib3VuZClcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gICQkYWRkQXVkaW9MaXN0ZW5lcnMoKSB7XHJcbiAgICBjb25zdCBhdWRpbyA9IHRoaXMuYXVkaW9cclxuICAgIGNvbnN0IGVscyA9IHRoaXMuZWxzXHJcbiAgICBjb25zdCBuYXRpdmVQcm9ncmVzcyA9ICEhKHRoaXMuc2V0dGluZ3MudXNlTmF0aXZlUHJvZ3Jlc3MgJiYgZWxzLnByb2dyZXNzKVxyXG5cclxuICAgIGNvbnN0IF9hZGRMaXN0ZW5lciA9IChjb25kaXRpb24sIGV2ZW50LCBsaXN0ZW5lcikgPT4ge1xyXG4gICAgICBpZiAoY29uZGl0aW9uKSB0aGlzLmFkZEF1ZGlvTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKVxyXG4gICAgfVxyXG5cclxuICAgIF9hZGRMaXN0ZW5lcighIShlbHMuYnVmZmVyZWQgfHwgbmF0aXZlUHJvZ3Jlc3MpLCAncHJvZ3Jlc3MnLCAoKSA9PiB7XHJcbiAgICAgIHZhciBidWZmZXJlZCA9IHRoaXMuJCRidWZmZXJGb3JtYXR0ZWQoKVxyXG4gICAgICBpZiAoZWxzLmJ1ZmZlcmVkKSBlbHMuYnVmZmVyZWQuaW5uZXJIVE1MID0gYnVmZmVyZWRcclxuICAgICAgaWYgKG5hdGl2ZVByb2dyZXNzKSBlbHMucHJvZ3Jlc3MudmFsdWUgPSBidWZmZXJlZFxyXG4gICAgfSlcclxuXHJcbiAgICBfYWRkTGlzdGVuZXIoISFlbHMuY3VycmVudFRpbWUsICd0aW1ldXBkYXRlJywgKCkgPT4gdGhpcy4kJHVwZGF0ZUN1cnJlbnRUaW1lRWwoKSlcclxuICAgIF9hZGRMaXN0ZW5lcighIWVscy5kdXJhdGlvbiwgJ2R1cmF0aW9uY2hhbmdlJywgKCkgPT4gdGhpcy4kJHVwZGF0ZUR1cmF0aW9uRWwoKSlcclxuXHJcbiAgICBfYWRkTGlzdGVuZXIodHJ1ZSwgJ2VuZGVkJywgKCkgPT4ge1xyXG4gICAgICBpZiAodGhpcy5wbGF5aW5nKSB7XHJcbiAgICAgICAgdGhpcy5uZXh0KClcclxuICAgICAgICBhdWRpby5wbGF5KClcclxuICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSB3cmFwcGVyIGFyb3VuZCBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgd2hpY2ggZW5zdXJlcyBsaXN0bmVyc1xyXG4gICAqIGFyZSBjYWNoZWQgZm9yIGxhdGVyIHJlbW92YWwgdmlhIGBMYXAuZGVzdHJveShpbnN0YW5jZSlgIGNhbGxcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIGVsZW1lbnROYW1lIExhcCNlbHMgZWxlbWVudGtleVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIGV2ZW50ICAgICAgIERPTSBFdmVudCBuYW1lXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgICAgY2FsbGJhY2tcclxuICAgKi9cclxuICBhZGRMaXN0ZW5lcihlbGVtZW50TmFtZSwgZXZlbnQsIGxpc3RlbmVyKSB7XHJcbiAgICAvLyBieXBhc3Mgbm9uLWV4aXN0ZW50IGVsZW1lbnRzXHJcbiAgICBpZiAoIXRoaXMuZWxzW2VsZW1lbnROYW1lXSkgcmV0dXJuIHRoaXNcclxuXHJcbiAgICAvLyBpZS4gbGlzdGVuZXJzID0geyBzZWVrUmFuZ2U6IHsgY2xpY2s6IFtoYW5kbGVyc10sIG1vdXNlZG93bjogW2hhbmRsZXJzXSwgLi4uIH0sIC4uLiB9XHJcbiAgICB0aGlzLiQkbGlzdGVuZXJzID0gdGhpcy4kJGxpc3RlbmVycyB8fCB7fVxyXG4gICAgdGhpcy4kJGxpc3RlbmVyc1tlbGVtZW50TmFtZV0gPSB0aGlzLiQkbGlzdGVuZXJzW2VsZW1lbnROYW1lXSB8fCB7fVxyXG4gICAgdGhpcy4kJGxpc3RlbmVyc1tlbGVtZW50TmFtZV1bZXZlbnRdID0gdGhpcy4kJGxpc3RlbmVyc1tlbGVtZW50TmFtZV1bZXZlbnRdIHx8IFtdXHJcblxyXG4gICAgY29uc3QgYm91bmQgPSBsaXN0ZW5lci5iaW5kKHRoaXMpXHJcbiAgICB0aGlzLiQkbGlzdGVuZXJzW2VsZW1lbnROYW1lXVtldmVudF0ucHVzaChib3VuZClcclxuICAgIHRoaXMuZWxzW2VsZW1lbnROYW1lXS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBib3VuZClcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gICQkYWRkTGlzdGVuZXJzKCkge1xyXG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcclxuXHJcbiAgICB0aGlzLmFkZExpc3RlbmVyKCdwbGF5UGF1c2UnLCAnY2xpY2snLCB0aGlzLnRvZ2dsZVBsYXkpXHJcbiAgICB0aGlzLmFkZExpc3RlbmVyKCdwcmV2JywgJ2NsaWNrJywgdGhpcy5wcmV2KVxyXG4gICAgdGhpcy5hZGRMaXN0ZW5lcignbmV4dCcsICdjbGljaycsIHRoaXMubmV4dClcclxuICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3ByZXZBbGJ1bScsICdjbGljaycsIHRoaXMucHJldkFsYnVtKVxyXG4gICAgdGhpcy5hZGRMaXN0ZW5lcignbmV4dEFsYnVtJywgJ2NsaWNrJywgdGhpcy5uZXh0QWxidW0pXHJcbiAgICB0aGlzLmFkZExpc3RlbmVyKCd2b2x1bWVVcCcsICdjbGljaycsIHRoaXMuJCRpbmNWb2x1bWUpXHJcbiAgICB0aGlzLmFkZExpc3RlbmVyKCd2b2x1bWVEb3duJywgJ2NsaWNrJywgdGhpcy4kJGRlY1ZvbHVtZSlcclxuXHJcbiAgICBjb25zdCBfaWYgPSAoZWxlbWVudE5hbWUsIGZuKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmVsc1tlbGVtZW50TmFtZV0pIHtcclxuICAgICAgICBpZiAodHlwZW9mIGZuID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgdGhpc1tmbl0oKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBhbm9ueW1vdXNcclxuICAgICAgICAgIGZuKClcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm9uKCdsb2FkJywgKCkgPT4ge1xyXG4gICAgICBfaWYoJ3RyYWNrVGl0bGUnLCAnJCR1cGRhdGVUcmFja1RpdGxlRWwnKVxyXG4gICAgICBfaWYoJ3RyYWNrTnVtYmVyJywgJyQkdXBkYXRlVHJhY2tOdW1iZXJFbCcpXHJcbiAgICAgIF9pZignYXJ0aXN0JywgJyQkdXBkYXRlQXJ0aXN0RWwnKVxyXG4gICAgICBfaWYoJ2FsYnVtJywgJyQkdXBkYXRlQWxidW1FbCcpXHJcbiAgICAgIF9pZignY292ZXInLCAnJCR1cGRhdGVDb3ZlcicpXHJcbiAgICAgIF9pZignY3VycmVudFRpbWUnLCAnJCR1cGRhdGVDdXJyZW50VGltZUVsJylcclxuICAgICAgX2lmKCdkdXJhdGlvbicsICckJHVwZGF0ZUR1cmF0aW9uRWwnKVxyXG4gICAgICBfaWYoJ3BsYXlQYXVzZScsICgpID0+IHtcclxuICAgICAgICBjb25zdCBzID0gdGhpcy5zZWxlY3RvcnMuc3RhdGVcclxuICAgICAgICBjb25zdCBwcCA9IGVscy5wbGF5UGF1c2VcclxuICAgICAgICBMYXAuYWRkQ2xhc3MocHAsIHMucGF1c2VkKVxyXG4gICAgICAgIHRoaXMub24oJ3BsYXknLCAoKSA9PiBMYXAucmVtb3ZlQ2xhc3MocHAsIHMucGF1c2VkKS5hZGRDbGFzcyhwcCwgcy5wbGF5aW5nKSlcclxuICAgICAgICB0aGlzLm9uKCdwYXVzZScsICgpID0+IExhcC5yZW1vdmVDbGFzcyhwcCwgcy5wbGF5aW5nKS5hZGRDbGFzcyhwcCwgcy5wYXVzZWQpKVxyXG4gICAgICB9KVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLm9uKCd0cmFja0NoYW5nZScsICgpID0+IHtcclxuICAgICAgX2lmKCd0cmFja1RpdGxlJywgJyQkdXBkYXRlVHJhY2tUaXRsZUVsJylcclxuICAgICAgX2lmKCd0cmFja051bWJlcicsICckJHVwZGF0ZVRyYWNrTnVtYmVyRWwnKVxyXG4gICAgICBfaWYoJ2N1cnJlbnRUaW1lJywgJyQkdXBkYXRlQ3VycmVudFRpbWVFbCcpXHJcbiAgICAgIF9pZignZHVyYXRpb24nLCAnJCR1cGRhdGVEdXJhdGlvbkVsJylcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5vbignYWxidW1DaGFuZ2UnLCAoKSA9PiB7XHJcbiAgICAgIF9pZigndHJhY2tUaXRsZScsICckJHVwZGF0ZVRyYWNrVGl0bGVFbCcpXHJcbiAgICAgIF9pZigndHJhY2tOdW1iZXInLCAnJCR1cGRhdGVUcmFja051bWJlckVsJylcclxuICAgICAgX2lmKCdhcnRpc3QnLCAnJCR1cGRhdGVBcnRpc3RFbCcpXHJcbiAgICAgIF9pZignYWxidW0nLCAnJCR1cGRhdGVBbGJ1bUVsJylcclxuICAgICAgX2lmKCdjb3ZlcicsICckJHVwZGF0ZUNvdmVyJylcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gICQkYWRkU2Vla0xpc3RlbmVycygpIHtcclxuICAgIGNvbnN0IGVscyA9IHRoaXMuZWxzXHJcbiAgICBjb25zdCBzZWVrUmFuZ2UgPSBlbHMuc2Vla1JhbmdlXHJcbiAgICBjb25zdCBhdWRpbyA9IHRoaXMuYXVkaW9cclxuICAgIGNvbnN0IHVzZU5hdGl2ZSA9ICEhKHRoaXMuc2V0dGluZ3MudXNlTmF0aXZlU2Vla1JhbmdlICYmIHNlZWtSYW5nZSlcclxuXHJcbiAgICBpZiAodXNlTmF0aXZlKSB7XHJcbiAgICAgIHRoaXMuYWRkQXVkaW9MaXN0ZW5lcigndGltZXVwZGF0ZScsICgpID0+IHtcclxuICAgICAgICBpZiAoIXRoaXMuc2Vla2luZykgc2Vla1JhbmdlLnZhbHVlID0gTGFwLnNjYWxlKGF1ZGlvLmN1cnJlbnRUaW1lLCAwLCBhdWRpby5kdXJhdGlvbiwgMCwgMTAwKVxyXG4gICAgICB9KVxyXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCdzZWVrUmFuZ2UnLCAnbW91c2Vkb3duJywgKCkgPT4gdGhpcy5zZWVraW5nID0gdHJ1ZSlcclxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcignc2Vla1JhbmdlJywgJ21vdXNldXAnLCAoKSA9PiB7XHJcbiAgICAgICAgYXVkaW8uY3VycmVudFRpbWUgPSBMYXAuc2NhbGUoc2Vla1JhbmdlLnZhbHVlLCAwLCBzZWVrUmFuZ2UubWF4LCAwLCBhdWRpby5kdXJhdGlvbilcclxuICAgICAgICB0aGlzLnRyaWdnZXIoJ3NlZWsnKVxyXG4gICAgICAgIHRoaXMuc2Vla2luZyA9IGZhbHNlXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWF5YmVXYXJuID0gKCkgPT4ge1xyXG4gICAgICBpZiAodGhpcy5kZWJ1ZyAmJiBzZWVrUmFuZ2UpIHtcclxuICAgICAgICBjb25zdCBjID0gJ2NvbG9yOmRhcmtncmVlbjtmb250LWZhbWlseTptb25vc3BhY2UnXHJcbiAgICAgICAgY29uc3QgciA9ICdjb2xvcjppbmhlcml0J1xyXG4gICAgICAgIGNvbnNvbGUud2FybihgXHJcbiAgICAgICAgICAlY0xhcCglcykgW0RFQlVHXTpcclxuICAgICAgICAgICVjU2ltdWx0YW5lb3VzIHVzZSBvZiAlY0xhcCNlbHMuc2Vla1JhbmdlJWMgYW5kXHJcbiAgICAgICAgICAlY0xhcCNlbHMuc2Vla0ZvcndhcmR8c2Vla0JhY2t3YXJkJWMgaXMgcmVkdW5kYW50LlxyXG4gICAgICAgICAgQ29uc2lkZXIgY2hvb3Npbmcgb25lIG9yIHRoZSBvdGhlci5cclxuICAgICAgICAgIGAuc3BsaXQoJ1xcbicpLm1hcChzID0+IHMudHJpbSgpKS5qb2luKCcgJyksXHJcbiAgICAgICAgICBMYXAuJCRkZWJ1Z1NpZ25hdHVyZSwgdGhpcy5pZCwgciwgYywgciwgYywgclxyXG4gICAgICAgIClcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChlbHMuc2Vla0ZvcndhcmQpIHtcclxuICAgICAgbWF5YmVXYXJuKClcclxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcignc2Vla0ZvcndhcmQnLCAnbW91c2Vkb3duJywgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuc2Vla2luZyA9IHRydWVcclxuICAgICAgICB0aGlzLiQkc2Vla0ZvcndhcmQoKVxyXG4gICAgICB9KVxyXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCdzZWVrRm9yd2FyZCcsICdtb3VzZXVwJywgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuc2Vla2luZyA9IGZhbHNlXHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMubW91c2VEb3duVGltZXIpXHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdzZWVrJylcclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZWxzLnNlZWtCYWNrd2FyZCkge1xyXG4gICAgICBtYXliZVdhcm4oKVxyXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCdzZWVrQmFja3dhcmQnLCAnbW91c2Vkb3duJywgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuc2Vla2luZyA9IHRydWVcclxuICAgICAgICB0aGlzLiQkc2Vla0JhY2t3YXJkKClcclxuICAgICAgfSlcclxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcignc2Vla0JhY2t3YXJkJywgJ21vdXNldXAnLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5zZWVraW5nID0gZmFsc2VcclxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5tb3VzZURvd25UaW1lcilcclxuICAgICAgICB0aGlzLnRyaWdnZXIoJ3NlZWsnKVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgJCRzZWVrQmFja3dhcmQoKSB7XHJcbiAgICBpZiAoIXRoaXMuc2Vla2luZykgcmV0dXJuIHRoaXNcclxuICAgIHRoaXMubW91c2VEb3duVGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHggPSB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lICsgKHRoaXMuc2V0dGluZ3Muc2Vla0ludGVydmFsICogLTEpXHJcbiAgICAgIHRoaXMuYXVkaW8uY3VycmVudFRpbWUgPSB4IDwgMCA/IDAgOiB4XHJcbiAgICB9LCB0aGlzLnNldHRpbmdzLnNlZWtUaW1lKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gICQkc2Vla0ZvcndhcmQoKSB7XHJcbiAgICBpZiAoIXRoaXMuc2Vla2luZykgcmV0dXJuIHRoaXNcclxuICAgIHRoaXMubW91c2VEb3duVGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHggPSB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lICsgdGhpcy5zZXR0aW5ncy5zZWVrSW50ZXJ2YWxcclxuICAgICAgdGhpcy5hdWRpby5jdXJyZW50VGltZSA9IHggPiB0aGlzLmF1ZGlvLmR1cmF0aW9uID8gdGhpcy5hdWRpby5kdXJhdGlvbiA6IHhcclxuICAgIH0sIHRoaXMuc2V0dGluZ3Muc2Vla1RpbWUpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgJCRhZGRWb2x1bWVMaXN0ZW5lcnMoKSB7XHJcbiAgICBjb25zdCBlbHMgPSB0aGlzLmVsc1xyXG4gICAgY29uc3Qgdm9sdW1lUmFuZ2UgPSBlbHMudm9sdW1lUmFuZ2VcclxuICAgIGNvbnN0IHZvbHVtZVJlYWQgPSBlbHMudm9sdW1lUmVhZFxyXG4gICAgY29uc3Qgdm9sdW1lVXAgPSBlbHMudm9sdW1lVXBcclxuICAgIGNvbnN0IHZvbHVtZURvd24gPSBlbHMudm9sdW1lRG93blxyXG5cclxuICAgIGlmICh2b2x1bWVSZWFkKSB7XHJcbiAgICAgIGNvbnN0IGZuID0gKCkgPT4gdm9sdW1lUmVhZC5pbm5lckhUTUwgPSBNYXRoLnJvdW5kKHRoaXMuYXVkaW8udm9sdW1lKjEwMClcclxuICAgICAgdGhpcy5vbigndm9sdW1lQ2hhbmdlJywgZm4pXHJcbiAgICAgIGZuKClcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5zZXR0aW5ncy51c2VOYXRpdmVWb2x1bWVSYW5nZSAmJiB2b2x1bWVSYW5nZSkge1xyXG5cclxuICAgICAgY29uc3QgZm4gPSAoKSA9PiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnZvbHVtZUNoYW5naW5nKSB2b2x1bWVSYW5nZS52YWx1ZSA9IE1hdGgucm91bmQodGhpcy5hdWRpby52b2x1bWUqMTAwKVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuYWRkQXVkaW9MaXN0ZW5lcigndm9sdW1lY2hhbmdlJywgZm4pXHJcbiAgICAgIHRoaXMub24oJ2xvYWQnLCBmbilcclxuXHJcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3ZvbHVtZVJhbmdlJywgJ21vdXNlZG93bicsICgpID0+IHRoaXMudm9sdW1lQ2hhbmdpbmcgPSB0cnVlKVxyXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCd2b2x1bWVSYW5nZScsICdtb3VzZXVwJywgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYXVkaW8udm9sdW1lID0gdm9sdW1lUmFuZ2UudmFsdWUgKiAwLjAxXHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKCd2b2x1bWVDaGFuZ2UnKVxyXG4gICAgICAgIHRoaXMudm9sdW1lQ2hhbmdpbmcgPSBmYWxzZVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1heWJlV2FybiA9ICgpID0+IHtcclxuICAgICAgaWYgKHRoaXMuZGVidWcgJiYgdm9sdW1lUmFuZ2UpIHtcclxuICAgICAgICBjb25zdCBjID0gJ2NvbG9yOmRhcmtncmVlbjtmb250LWZhbWlseTptb25vc3BhY2UnXHJcbiAgICAgICAgY29uc3QgciA9ICdjb2xvcjppbmhlcml0J1xyXG4gICAgICAgIGNvbnNvbGUud2FybihgXHJcbiAgICAgICAgICAlY0xhcCglcykgW0RFQlVHXTpcclxuICAgICAgICAgICVjU2ltdWx0YW5lb3VzIHVzZSBvZiAlY0xhcCNlbHMudm9sdW1lUmFuZ2UlYyBhbmRcclxuICAgICAgICAgICVjTGFwI2Vscy52b2x1bWVVcHx2b2x1bWVEb3duJWMgaXMgcmVkdW5kYW50LlxyXG4gICAgICAgICAgQ29uc2lkZXIgY2hvb3Npbmcgb25lIG9yIHRoZSBvdGhlci5cclxuICAgICAgICAgIGAuc3BsaXQoJ1xcbicpLm1hcChzID0+IHMudHJpbSgpKS5qb2luKCcgJyksXHJcbiAgICAgICAgICBMYXAuJCRkZWJ1Z1NpZ25hdHVyZSwgdGhpcy5pZCwgciwgYywgciwgYywgclxyXG4gICAgICAgIClcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh2b2x1bWVVcCkge1xyXG4gICAgICBtYXliZVdhcm4oKVxyXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCd2b2x1bWVVcCcsICdjbGljaycsICgpID0+IHRoaXMuJCRpbmNWb2x1bWUoKSlcclxuICAgIH1cclxuICAgIGlmICh2b2x1bWVEb3duKSB7XHJcbiAgICAgIG1heWJlV2FybigpXHJcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3ZvbHVtZURvd24nLCAnY2xpY2snLCAoKSA9PiB0aGlzLiQkZGVjVm9sdW1lKCkpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAkJGluY1ZvbHVtZSgpIHtcclxuICAgIGNvbnN0IHYgPSB0aGlzLmF1ZGlvLnZvbHVtZVxyXG4gICAgY29uc3QgaSA9IHRoaXMuc2V0dGluZ3Mudm9sdW1lSW50ZXJ2YWxcclxuICAgIHRoaXMuYXVkaW8udm9sdW1lID0gditpID4gMSA/IDEgOiB2K2lcclxuICAgIHRoaXMudHJpZ2dlcigndm9sdW1lQ2hhbmdlJylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAkJGRlY1ZvbHVtZSgpIHtcclxuICAgIGNvbnN0IHYgPSB0aGlzLmF1ZGlvLnZvbHVtZVxyXG4gICAgY29uc3QgaSA9IHRoaXMuc2V0dGluZ3Mudm9sdW1lSW50ZXJ2YWxcclxuICAgIHRoaXMuYXVkaW8udm9sdW1lID0gdi1pIDwgMCA/IDAgOiB2LWlcclxuICAgIHRoaXMudHJpZ2dlcigndm9sdW1lQ2hhbmdlJylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAkJHVwZGF0ZUN1cnJlbnRUaW1lRWwoKSB7XHJcbiAgICB0aGlzLmVscy5jdXJyZW50VGltZS5pbm5lckhUTUwgPSB0aGlzLiQkY3VycmVudFRpbWVGb3JtYXR0ZWQoKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gICQkdXBkYXRlRHVyYXRpb25FbCgpIHtcclxuICAgIHRoaXMuZWxzLmR1cmF0aW9uLmlubmVySFRNTCA9IHRoaXMuZHVyYXRpb25Gb3JtYXR0ZWQoKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gICQkdXBkYXRlVHJhY2tUaXRsZUVsKCkge1xyXG4gICAgdGhpcy5lbHMudHJhY2tUaXRsZS5pbm5lckhUTUwgPSB0aGlzLnRyYWNrbGlzdFt0aGlzLnRyYWNrSW5kZXhdXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgJCR1cGRhdGVUcmFja051bWJlckVsKCkge1xyXG4gICAgdGhpcy5lbHMudHJhY2tOdW1iZXIuaW5uZXJIVE1MID0gK3RoaXMudHJhY2tJbmRleCsxXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgJCR1cGRhdGVBcnRpc3RFbCgpIHtcclxuICAgIHRoaXMuZWxzLmFydGlzdC5pbm5lckhUTUwgPSB0aGlzLmFydGlzdFxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gICQkdXBkYXRlQWxidW1FbCgpIHtcclxuICAgIHRoaXMuZWxzLmFsYnVtLmlubmVySFRNTCA9IHRoaXMuYWxidW1cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAkJHVwZGF0ZUNvdmVyKCkge1xyXG4gICAgdGhpcy5lbHMuY292ZXIuc3JjID0gdGhpcy5jb3ZlclxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHRvZ2dsZVBsYXkoKSB7XHJcbiAgICB0aGlzLmF1ZGlvLnBhdXNlZCA/IHRoaXMucGxheSgpIDogdGhpcy5wYXVzZSgpXHJcbiAgICB0aGlzLnRyaWdnZXIoJ3RvZ2dsZVBsYXknKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHBsYXkoKSB7XHJcbiAgICBpZiAoTGFwLmV4Y2x1c2l2ZU1vZGUpIExhcC5lYWNoKExhcC4kJGluc3RhbmNlcywgaW5zdGFuY2UgPT4gaW5zdGFuY2UucGF1c2UoKSlcclxuICAgIHRoaXMuYXVkaW8ucGxheSgpXHJcbiAgICB0aGlzLnBsYXlpbmcgPSB0cnVlXHJcbiAgICB0aGlzLnRyaWdnZXIoJ3BsYXknKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHBhdXNlKCkge1xyXG4gICAgdGhpcy5hdWRpby5wYXVzZSgpXHJcbiAgICB0aGlzLnBsYXlpbmcgPSBmYWxzZVxyXG4gICAgdGhpcy50cmlnZ2VyKCdwYXVzZScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgc2V0VHJhY2soaW5kZXgpIHtcclxuICAgIGlmIChpbmRleCA8PSAwKSB7XHJcbiAgICAgIHRoaXMudHJhY2tJbmRleCA9IDBcclxuICAgIH0gZWxzZSBpZiAoaW5kZXggPj0gdGhpcy50cmFja0NvdW50KSB7XHJcbiAgICAgIHRoaXMudHJhY2tJbmRleCA9IHRoaXMudHJhY2tDb3VudC0xXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnRyYWNrSW5kZXggPSBpbmRleFxyXG4gICAgfVxyXG4gICAgY29uc3Qgd2FzUGxheWluZyA9ICF0aGlzLmF1ZGlvLnBhdXNlZFxyXG4gICAgdGhpcy4kJHVwZGF0ZVNvdXJjZSgpXHJcbiAgICBpZiAod2FzUGxheWluZykgdGhpcy5hdWRpby5wbGF5KClcclxuICAgIHRoaXMudHJpZ2dlcigndHJhY2tDaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHByZXYoKSB7XHJcbiAgICBjb25zdCB3YXNQbGF5aW5nID0gIXRoaXMuYXVkaW8ucGF1c2VkXHJcbiAgICB0aGlzLnRyYWNrSW5kZXggPSAodGhpcy50cmFja0luZGV4LTEgPCAwKSA/IHRoaXMudHJhY2tDb3VudC0xIDogdGhpcy50cmFja0luZGV4LTFcclxuICAgIHRoaXMuJCR1cGRhdGVTb3VyY2UoKVxyXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXHJcbiAgICB0aGlzLnRyaWdnZXIoJ3RyYWNrQ2hhbmdlJylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBuZXh0KCkge1xyXG4gICAgY29uc3Qgd2FzUGxheWluZyA9ICF0aGlzLmF1ZGlvLnBhdXNlZFxyXG4gICAgdGhpcy50cmFja0luZGV4ID0gKHRoaXMudHJhY2tJbmRleCsxID49IHRoaXMudHJhY2tDb3VudCkgPyAwIDogdGhpcy50cmFja0luZGV4KzFcclxuICAgIHRoaXMuJCR1cGRhdGVTb3VyY2UoKVxyXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXHJcbiAgICB0aGlzLnRyaWdnZXIoJ3RyYWNrQ2hhbmdlJylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBwcmV2QWxidW0oKSB7XHJcbiAgICBjb25zdCB3YXNQbGF5aW5nID0gIXRoaXMuYXVkaW8ucGF1c2VkXHJcbiAgICB0aGlzLmFsYnVtSW5kZXggPSAodGhpcy5hbGJ1bUluZGV4LTEgPCAwKSA/IHRoaXMuYWxidW1Db3VudC0xIDogdGhpcy5hbGJ1bUluZGV4LTFcclxuICAgIHRoaXMudXBkYXRlKClcclxuICAgIHRoaXMudHJhY2tJbmRleCA9IDBcclxuICAgIHRoaXMuJCR1cGRhdGVTb3VyY2UoKVxyXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXHJcbiAgICB0aGlzLnRyaWdnZXIoJ2FsYnVtQ2hhbmdlJylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBuZXh0QWxidW0oKSB7XHJcbiAgICBjb25zdCB3YXNQbGF5aW5nPSAhdGhpcy5hdWRpby5wYXVzZWRcclxuICAgIHRoaXMuYWxidW1JbmRleCA9ICh0aGlzLmFsYnVtSW5kZXgrMSA+IHRoaXMuYWxidW1Db3VudC0xKSA/IDAgOiB0aGlzLmFsYnVtSW5kZXgrMVxyXG4gICAgdGhpcy51cGRhdGUoKVxyXG4gICAgdGhpcy50cmFja0luZGV4ID0gMFxyXG4gICAgdGhpcy4kJHVwZGF0ZVNvdXJjZSgpXHJcbiAgICBpZiAod2FzUGxheWluZykgdGhpcy5hdWRpby5wbGF5KClcclxuICAgIHRoaXMudHJpZ2dlcignYWxidW1DaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHNldEFsYnVtKGluZGV4KSB7XHJcbiAgICBpZiAoaW5kZXggPD0gMCkge1xyXG4gICAgICB0aGlzLmFsYnVtSW5kZXggPSAwXHJcbiAgICB9IGVsc2UgaWYgKGluZGV4ID49IHRoaXMuYWxidW1Db3VudCkge1xyXG4gICAgICB0aGlzLmFsYnVtSW5kZXggPSB0aGlzLmFsYnVtQ291bnQtMVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5hbGJ1bUluZGV4ID0gaW5kZXhcclxuICAgIH1cclxuICAgIHRoaXMudXBkYXRlKClcclxuICAgIHRoaXMuc2V0VHJhY2sodGhpcy5saWJbdGhpcy5hbGJ1bUluZGV4XS5zdGFydGluZ1RyYWNrSW5kZXggfHwgMClcclxuICAgIHRoaXMudHJpZ2dlcignYWxidW1DaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gICQkZm9ybWF0VHJhY2tsaXN0KCkge1xyXG4gICAgaWYgKHRoaXMudHJhY2tsaXN0ICYmIHRoaXMudHJhY2tsaXN0Lmxlbmd0aCkgcmV0dXJuIHRoaXNcclxuXHJcbiAgICBjb25zdCByZSA9IHRoaXMucmVwbGFjZW1lbnRcclxuICAgIGNvbnN0IHRyYWNrbGlzdCA9IFtdXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudHJhY2tDb3VudDsgaSsrKSB7XHJcbiAgICAgIGxldCB0ID0gdGhpcy5maWxlc1tpXVxyXG4gICAgICAvLyBzdHJpcCBleHRcclxuICAgICAgdCA9IHQuc2xpY2UoMCwgdC5sYXN0SW5kZXhPZignLicpKVxyXG4gICAgICAvLyBnZXQgbGFzdCBwYXRoIHNlZ21lbnRcclxuICAgICAgdCA9IHQuc2xpY2UodC5sYXN0SW5kZXhPZignLycpKzEpXHJcbiAgICAgIGlmIChyZSkgdCA9IHQucmVwbGFjZShyZVswXSwgcmVbMV0pXHJcbiAgICAgIHRyYWNrbGlzdFtpXSA9IHQudHJpbSgpXHJcbiAgICB9XHJcbiAgICB0aGlzLnRyYWNrbGlzdCA9IHRyYWNrbGlzdFxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gICQkYnVmZmVyRm9ybWF0dGVkKCkge1xyXG4gICAgaWYgKCF0aGlzLmF1ZGlvKSByZXR1cm4gMFxyXG5cclxuICAgIGNvbnN0IGF1ZGlvID0gdGhpcy5hdWRpb1xyXG4gICAgbGV0IGJ1ZmZlcmVkXHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgYnVmZmVyZWQgPSBhdWRpby5idWZmZXJlZC5lbmQoYXVkaW8uYnVmZmVyZWQubGVuZ3RoLTEpXHJcbiAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgcmV0dXJuIDBcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3JtYXR0ZWQgPSBNYXRoLnJvdW5kKChidWZmZXJlZC9hdWRpby5kdXJhdGlvbikqMTAwKVxyXG4gICAgLy8gdmFyIGZvcm1hdHRlZCA9IE1hdGgucm91bmQoXy5zY2FsZShidWZmZXJlZCwgMCwgYXVkaW8uZHVyYXRpb24sIDAsIDEwMCkpXHJcbiAgICByZXR1cm4gaXNOYU4oZm9ybWF0dGVkKSA/IDAgOiBmb3JtYXR0ZWRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgJCRnZXRBdWRpb1RpbWVGb3JtYXR0ZWQoYXVkaW9Qcm9wKSB7XHJcbiAgICBpZiAoaXNOYU4odGhpcy5hdWRpby5kdXJhdGlvbikpIHJldHVybiAnMDA6MDAnXHJcbiAgICBsZXQgZm9ybWF0dGVkID0gTGFwLmZvcm1hdFRpbWUoTWF0aC5mbG9vcih0aGlzLmF1ZGlvW2F1ZGlvUHJvcF0udG9GaXhlZCgxKSkpXHJcbiAgICBpZiAodGhpcy5hdWRpby5kdXJhdGlvbiA8IDM2MDAgfHwgZm9ybWF0dGVkID09PSAnMDA6MDA6MDAnKSB7XHJcbiAgICAgIGZvcm1hdHRlZCA9IGZvcm1hdHRlZC5zbGljZSgzKSAvLyBubjpublxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZvcm1hdHRlZFxyXG4gIH1cclxuXHJcbiAgJCRjdXJyZW50VGltZUZvcm1hdHRlZCgpIHtcclxuICAgIHJldHVybiB0aGlzLiQkZ2V0QXVkaW9UaW1lRm9ybWF0dGVkKCdjdXJyZW50VGltZScpXHJcbiAgfVxyXG5cclxuICBkdXJhdGlvbkZvcm1hdHRlZCgpIHtcclxuICAgIHJldHVybiB0aGlzLiQkZ2V0QXVkaW9UaW1lRm9ybWF0dGVkKCdkdXJhdGlvbicpXHJcbiAgfVxyXG5cclxuICB0cmFja051bWJlckZvcm1hdHRlZChuKSB7XHJcbiAgICB2YXIgY291bnQgPSBTdHJpbmcodGhpcy50cmFja0NvdW50KS5sZW5ndGggLSBTdHJpbmcobikubGVuZ3RoXHJcbiAgICByZXR1cm4gJzAnLnJlcGVhdChjb3VudCkgKyBuICsgdGhpcy5zZXR0aW5ncy50cmFja051bWJlclBvc3RmaXhcclxuICAgIC8vIHJldHVybiBfLnJlcGVhdCgnMCcsIGNvdW50KSArIG4gKyB0aGlzLnNldHRpbmdzLnRyYWNrTnVtYmVyUG9zdGZpeFxyXG4gIH1cclxuXHJcbiAgZ2V0KGtleSwgaW5kZXgpIHtcclxuICAgIHJldHVybiB0aGlzLmxpYltpbmRleCA9PT0gdW5kZWZpbmVkID8gdGhpcy5hbGJ1bUluZGV4IDogaW5kZXhdW2tleV1cclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJZiBzZXQgdHJ1ZSwgb25seSBvbmUgTGFwIGNhbiBiZSBwbGF5aW5nIGF0IGEgZ2l2ZW4gdGltZVxyXG4gKiBAdHlwZSB7Qm9vbGVhbn1cclxuICovXHJcbkxhcC5leGNsdXNpdmVNb2RlID0gZmFsc2VcclxuXHJcbi8qKlxyXG4gKiBjb25zb2xlIGZvcm1hdCBwcmVmaXggdXNlZCB3aGVuIExhcCNzZXR0aW5ncy5kZWJ1Z2RlYnVnPXRydWVcclxuICpcclxuICogQHByaXZhdGVcclxuICogQHR5cGUge1N0cmluZ31cclxuICovXHJcbkxhcC4kJGRlYnVnU2lnbmF0dXJlID0gJ2NvbG9yOnRlYWw7Zm9udC13ZWlnaHQ6Ym9sZCdcclxuXHJcbi8qKlxyXG4gKiBMYXAgaW5zdGFuY2UgY2FjaGVcclxuICpcclxuICogQHByaXZhdGVcclxuICogQHR5cGUge09iamVjdH1cclxuICovXHJcbkxhcC4kJGluc3RhbmNlcyA9IHt9XHJcblxyXG4vKipcclxuICogQHByaXZhdGVcclxuICogQHR5cGUge1JlZ0V4cH1cclxuICovXHJcbkxhcC4kJGF1ZGlvRXh0ZW5zaW9uUmVnRXhwID0gL21wM3x3YXZ8b2dnfGFpZmYvaVxyXG5cclxuLyoqXHJcbiAqIEBwcml2YXRlXHJcbiAqIEB0eXBlIHtPYmplY3R9XHJcbiAqL1xyXG5MYXAuJCRkZWZhdWx0U2V0dGluZ3MgPSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlZ2lzdGVyIGNhbGxiYWNrcyBmb3IgYW55IGN1c3RvbSBMYXAgZXZlbnQsIHdoZXJlIHRoZSBvYmplY3Qga2V5XHJcbiAgICogaXMgdGhlIGV2ZW50IG5hbWUsIGFuZCB0aGUgdmFsdWUgaXMgdGhlIGNhbGxiYWNrLiBDdXJyZW50IGxpc3Qgb2ZcclxuICAgKiBjdXN0b20gZXZlbnRzIHRoYXQgYXJlIGZpcmVkIGluY2x1ZGU6XHJcbiAgICpcclxuICAgKiArIGxvYWRcclxuICAgKiArIHBsYXlcclxuICAgKiArIHBhdXNlXHJcbiAgICogKyB0b2dnbGVQbGF5XHJcbiAgICogKyBzZWVrXHJcbiAgICogKyB0cmFja0NoYW5nZVxyXG4gICAqICsgYWxidW1DaGFuZ2VcclxuICAgKiArIHZvbHVtZUNoYW5nZVxyXG4gICAqXHJcbiAgICogVGhlc2UgZXZlbnRzIGFyZSBmaXJlZCBhdCB0aGUgZW5kIG9mIHRoZWlyIHJlc3BlY3RpdmVcclxuICAgKiBET00gYW5kIEF1ZGlvIGV2ZW50IGxpZmVjeWNsZXMsIGFzIHdlbGwgYXMgTGFwIGxvZ2ljIGF0dGFjaGVkIHRvIHRob3NlLiBGb3IgZXhhbXBsZSB3aGVuXHJcbiAgICogTGFwI2Vscy5wbGF5UGF1c2UgaXMgY2xpY2tlZCB3aGVuIGluaXRpYWxseSBwYXVzZWQsIHRoZSBET00gZXZlbnQgaXMgZmlyZWQsIEF1ZGlvIHdpbGwgYmVnaW4gcGxheWluZyxcclxuICAgKiBMYXAgd2lsbCByZW1vdmUgdGhlIGxhcC0tcGF1c2VkIGNsYXNzIGFuZCBhZGQgdGhlIGxhcC0tcGxheWluZyBjbGFzcyB0byB0aGUgZWxlbWVudCwgYW5kIGZpbmFsbHlcclxuICAgKiB0aGUgY3VzdG9tICdwbGF5JyBldmVudCBpcyB0cmlnZ2VyZWQuIE5vdGUgYWxzbyB0aGF0IHlvdSBjYW4gc3Vic2NyaWJlIHRvIGFueSBjdXN0b20gZXZlbnRcclxuICAgKiB2aWEgYExhcCNvbihldmVudCwgY2FsbGJhY2spYFxyXG4gICAqXHJcbiAgICogQHR5cGUge09iamVjdH1cclxuICAgKi9cclxuICBjYWxsYmFja3M6IHt9LFxyXG5cclxuICAvKipcclxuICAgKiBXaGVuIHRydWUsIG91dHB1dHMgYmFzaWMgaW5zcGVjdGlvbiBpbmZvIGFuZCB3YXJuaW5nc1xyXG4gICAqXHJcbiAgICogQHR5cGUge0Jvb2xlYW59XHJcbiAgICovXHJcbiAgZGVidWc6IGZhbHNlLFxyXG5cclxuICAvKipcclxuICAgKiBTdXBwbHkgYW4gYXJyYXkgb2YgcGx1Z2lucyAoY29uc3RydWN0b3JzKSB3aGljaCB3aWxsXHJcbiAgICogYmUgY2FsbGVkIHdpdGggdGhlIExhcCBpbnN0YW5jZSBhcyB0aGVpciBzb2xlIGFyZ3VtZW50LlxyXG4gICAqIFRoZSBwbHVnaW4gaW5zdGFuY2VzIHRoZW1zZWx2ZXMgd2lsbCBiZSBhdmFpbGFibGUgaW4gdGhlIHNhbWUgb3JkZXJcclxuICAgKiB2aWEgYExhcCNwbHVnaW5zYCBhcnJheVxyXG4gICAqXHJcbiAgICogQHR5cGUge0FycmF5fVxyXG4gICAqL1xyXG4gIHBsdWdpbnM6IFtdLFxyXG5cclxuICBzdGFydGluZ0FsYnVtSW5kZXg6IDAsXHJcbiAgc3RhcnRpbmdUcmFja0luZGV4OiAwLFxyXG5cclxuICAvKipcclxuICAgKiBUaGUgYW1vdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IHdoaWxlIGhvbGRpbmdcclxuICAgKiBgTGFwI2Vscy5zZWVrQmFja3dhcmRgIG9yIGBMYXAjZWxzLnNlZWtGb3J3YXJkYCBiZWZvcmUgZXhlY3V0aW5nIGFub3RoZXJcclxuICAgKiBzZWVrIGluc3RydWN0aW9uXHJcbiAgICpcclxuICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAqL1xyXG4gIHNlZWtJbnRlcnZhbDogNSxcclxuXHJcbiAgLyoqXHJcbiAgICogSG93IGZhciBmb3J3YXJkIG9yIGJhY2sgaW4gbWlsbGlzZWNvbmRzIHRvIHNlZWsgd2hlblxyXG4gICAqIGNhbGxpbmcgc2Vla0ZvcndhcmQgb3Igc2Vla0JhY2t3YXJkXHJcbiAgICpcclxuICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAqL1xyXG4gIHNlZWtUaW1lOiAyNTAsXHJcblxyXG4gIC8qKlxyXG4gICAqIFByb3ZpZGUgeW91ciBvd24gY3VzdG9tIHNlbGVjdG9ycyBmb3IgZWFjaCBlbGVtZW50XHJcbiAgICogaW4gdGhlIExhcCNlbHMgaGFzaC4gT3RoZXJ3aXNlIExhcC4kJGRlZmF1bHRTZWxlY3RvcnMgYXJlIHVzZWRcclxuICAgKlxyXG4gICAqIEB0eXBlIHtPYmplY3R9XHJcbiAgICovXHJcbiAgc2VsZWN0b3JzOiB7fSxcclxuXHJcbiAgdHJhY2tOdW1iZXJQb3N0Zml4OiAnIC0gJyxcclxuXHJcbiAgLyoqXHJcbiAgICogU2lnbmFsIHRoYXQgeW91IHdpbGwgYmUgdXNpbmcgYSBuYXRpdmUgSFRNTDUgYHByb2dyZXNzYCBlbGVtZW50XHJcbiAgICogdG8gdHJhY2sgYXVkaW8gYnVmZmVyZWQgYW1vdW50LiBSZXF1aXJlcyB0aGF0IGEgYGxhcF9fcHJvZ3Jlc3NgIGVsZW1lbnRcclxuICAgKiBpcyBmb3VuZCB1bmRlciB0aGUgYExhcCNlbGVtZW50YFxyXG4gICAqXHJcbiAgICogQHR5cGUge0Jvb2xlYW59XHJcbiAgICovXHJcbiAgdXNlTmF0aXZlUHJvZ3Jlc3M6IGZhbHNlLFxyXG5cclxuICAvKipcclxuICAgKiBTaWduYWwgdGhhdCB5b3Ugd2lsbCBiZSB1c2luZyBhIG5hdGl2ZSBIVE1MNSBgaW5wdXRbdHlwZT1yYW5nZV1gIGVsZW1lbnRcclxuICAgKiBmb3IgdHJhY2sgc2Vla2luZyBjb250cm9sLiBSZXF1aXJlcyB0aGF0IGEgYGxhcF9fc2Vlay1yYW5nZWAgZWxlbWVudFxyXG4gICAqIGlzIGZvdW5kIHVuZGVyIHRoZSBgTGFwI2VsZW1lbnRgXHJcbiAgICpcclxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cclxuICAgKi9cclxuICB1c2VOYXRpdmVTZWVrUmFuZ2U6IGZhbHNlLFxyXG5cclxuICAvKipcclxuICAgKiBTaWduYWwgdGhhdCB5b3Ugd2lsbCBiZSB1c2luZyBhIG5hdGl2ZSBIVE1MNSBgaW5wdXRbdHlwZT1yYW5nZV1gIGVsZW1lbnRcclxuICAgKiBmb3Igdm9sdW1lIGNvbnRyb2wuIFJlcXVpcmVzIHRoYXQgYSBgbGFwX192b2x1bWUtcmFuZ2VgIGVsZW1lbnRcclxuICAgKiBpcyBmb3VuZCB1bmRlciB0aGUgYExhcCNlbGVtZW50YFxyXG4gICAqXHJcbiAgICogQHR5cGUge0Jvb2xlYW59XHJcbiAgICovXHJcbiAgdXNlTmF0aXZlVm9sdW1lUmFuZ2U6IGZhbHNlLFxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhlIGFtb3VudCBvZiB2b2x1bWUgdG8gaW5jcmVtZW50L2RlY3JlbWVudCB3aGVuZXZlclxyXG4gICAqIGEgYGxhcF9fdm9sdW1lLXVwYCBvciBgbGFwX192b2x1bWUtZG93bmAgZWxlbWVudCBpcyBjbGlja2VkLlxyXG4gICAqIE5vdGUgdGhhdCBhdWRpbyB2b2x1bWUgaXMgZmxvYXRpbmcgcG9pbnQgcmFuZ2UgWzAsIDFdXHJcbiAgICogRG9lcyBub3QgYXBwbHkgdG8gYGxhcF9fdm9sdW1lLXJhbmdlYC5cclxuICAgKlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICovXHJcbiAgdm9sdW1lSW50ZXJ2YWw6IDAuMDVcclxufVxyXG5cclxuTGFwLiQkZGVmYXVsdFNlbGVjdG9ycyA9IHtcclxuICBzdGF0ZToge1xyXG4gICAgcGxheWxpc3RJdGVtQ3VycmVudDogICdsYXBfX3BsYXlsaXN0X19pdGVtLS1jdXJyZW50JyxcclxuICAgIHBsYXlpbmc6ICAgICAgICAgICAgICAnbGFwLS1wbGF5aW5nJyxcclxuICAgIHBhdXNlZDogICAgICAgICAgICAgICAnbGFwLS1wYXVzZWQnLFxyXG4gICAgaGlkZGVuOiAgICAgICAgICAgICAgICdsYXAtLWhpZGRlbidcclxuICB9LFxyXG4gIGFsYnVtOiAgICAgICAgICAgICAgICdsYXBfX2FsYnVtJyxcclxuICBhcnRpc3Q6ICAgICAgICAgICAgICAnbGFwX19hcnRpc3QnLFxyXG4gIGJ1ZmZlcmVkOiAgICAgICAgICAgICdsYXBfX2J1ZmZlcmVkJyxcclxuICBjb3ZlcjogICAgICAgICAgICAgICAnbGFwX19jb3ZlcicsXHJcbiAgY3VycmVudFRpbWU6ICAgICAgICAgJ2xhcF9fY3VycmVudC10aW1lJyxcclxuICBkaXNjb2c6ICAgICAgICAgICAgICAnbGFwX19kaXNjb2cnLFxyXG4gIGRpc2NvZ0l0ZW06ICAgICAgICAgICdsYXBfX2Rpc2NvZ19faXRlbScsXHJcbiAgZGlzY29nUGFuZWw6ICAgICAgICAgJ2xhcF9fZGlzY29nX19wYW5lbCcsXHJcbiAgZHVyYXRpb246ICAgICAgICAgICAgJ2xhcF9fZHVyYXRpb24nLFxyXG4gIGluZm86ICAgICAgICAgICAgICAgICdsYXBfX2luZm8nLCAvLyBidXR0b25cclxuICBpbmZvUGFuZWw6ICAgICAgICAgICAnbGFwX19pbmZvLXBhbmVsJyxcclxuICBuZXh0OiAgICAgICAgICAgICAgICAnbGFwX19uZXh0JyxcclxuICBuZXh0QWxidW06ICAgICAgICAgICAnbGFwX19uZXh0LWFsYnVtJyxcclxuICBwbGF5UGF1c2U6ICAgICAgICAgICAnbGFwX19wbGF5LXBhdXNlJyxcclxuICBwbGF5bGlzdDogICAgICAgICAgICAnbGFwX19wbGF5bGlzdCcsIC8vIGJ1dHRvblxyXG4gIHBsYXlsaXN0SXRlbTogICAgICAgICdsYXBfX3BsYXlsaXN0X19pdGVtJywgLy8gbGlzdCBpdGVtXHJcbiAgcGxheWxpc3RQYW5lbDogICAgICAgJ2xhcF9fcGxheWxpc3RfX3BhbmVsJyxcclxuICBwbGF5bGlzdFRyYWNrTnVtYmVyOiAnbGFwX19wbGF5bGlzdF9fdHJhY2stbnVtYmVyJyxcclxuICBwbGF5bGlzdFRyYWNrVGl0bGU6ICAnbGFwX19wbGF5bGlzdF9fdHJhY2stdGl0bGUnLFxyXG4gIHByZXY6ICAgICAgICAgICAgICAgICdsYXBfX3ByZXYnLFxyXG4gIHByZXZBbGJ1bTogICAgICAgICAgICdsYXBfX3ByZXYtYWxidW0nLFxyXG4gIHByb2dyZXNzOiAgICAgICAgICAgICdsYXBfX3Byb2dyZXNzJyxcclxuICBzZWVrQmFja3dhcmQ6ICAgICAgICAnbGFwX19zZWVrLWJhY2t3YXJkJyxcclxuICBzZWVrRm9yd2FyZDogICAgICAgICAnbGFwX19zZWVrLWZvcndhcmQnLFxyXG4gIHNlZWtSYW5nZTogICAgICAgICAgICdsYXBfX3NlZWstcmFuZ2UnLFxyXG4gIHRyYWNrTnVtYmVyOiAgICAgICAgICdsYXBfX3RyYWNrLW51bWJlcicsIC8vIHRoZSBjdXJyZW50bHkgY3VlZCB0cmFja1xyXG4gIHRyYWNrVGl0bGU6ICAgICAgICAgICdsYXBfX3RyYWNrLXRpdGxlJyxcclxuICB2b2x1bWVCdXR0b246ICAgICAgICAnbGFwX192b2x1bWUtYnV0dG9uJyxcclxuICB2b2x1bWVEb3duOiAgICAgICAgICAnbGFwX192b2x1bWUtZG93bicsXHJcbiAgdm9sdW1lUmVhZDogICAgICAgICAgJ2xhcF9fdm9sdW1lLXJlYWQnLFxyXG4gIHZvbHVtZVJhbmdlOiAgICAgICAgICdsYXBfX3ZvbHVtZS1yYW5nZScsXHJcbiAgdm9sdW1lVXA6ICAgICAgICAgICAgJ2xhcF9fdm9sdW1lLXVwJ1xyXG59XHJcblxyXG5pZiAod2luZG93KSB3aW5kb3cuTGFwID0gTGFwXHJcbiJdfQ==
