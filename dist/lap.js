(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*!
 * lap.js version 0.8.2
 * HTML5 audio player
 *
 * https://github.com/Lokua/lap.git
 * http://lokua.net
 *
 * Copyright © 2014, 2015 Joshua Kleckner <dev@lokua.net>
 * Licensed under the MIT license.
 * http://opensource.org/licenses/MIT
 */

var Lap = function (_Bus) {
  _inherits(Lap, _Bus);

  /**
   * Class constructor.
   * @param  {String|HTML Element} element container element
   * @param  {Array|Object|String} lib a Lap "library", which can be an array of
   *                                   album objects, a single album object, or a url to a
   *                                   single audio file
   * @param  {Object} options  settings hash that will be merged with Lap._defaultSettings
   */

  function Lap(element, lib, options) {
    var _ret;

    var postpone = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

    _classCallCheck(this, Lap);

    // default id to zero-based index incrementer

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Lap).call(this));

    _this.id = options && options.id ? options.id : Lap._instances.length;
    Lap._instances[_this.id] = _this;

    _this.element = typeof element === 'string' ? document.querySelector(element) : element;

    _this.setLib(lib);

    _this.settings = {};
    if (options) {
      Lap.each(Lap._defaultSettings, function (val, key) {
        if (options.hasOwnProperty(key)) _this.settings[key] = options[key];else _this.settings[key] = val;
      });
    } else {
      _this.settings = Lap._defaultSettings;
    }

    _this.debug = _this.settings.debug;

    if (_this.debug) {
      _this.on('load', function () {
        return console.info('%cLap(%s) [DEBUG]:%c %o', Lap._debugSignature, _this.id, 'color:inherit', _this);
      });
      var echo = function echo(e) {
        _this.on(e, function () {
          return console.info('%cLap(%s) [DEBUG]:%c %s handler called', Lap._debugSignature, _this.id, 'color:inherit', e);
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

    return _ret = _this, _possibleConstructorReturn(_this, _ret);
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
      } else if (type === 'string' && Lap._audioExtensionRegExp.test(lib)) {
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
      this._initAudio();
      this._initElements();
      this._addAudioListeners();
      this._addVolumeListeners();
      this._addSeekListeners();
      this._addListeners();
      this._activatePlugins();

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

      if (this.albumIndex === undefined) {
        this.albumIndex = this.settings.startingAlbumIndex === undefined ? 0 : this.settings.startingAlbumIndex;
      }
      if (this.trackIndex === undefined) {
        this.trackIndex = this.settings.startingTrackIndex === undefined ? 0 : this.settings.startingAlbumIndex;
      }

      this.albumCount = this.lib.length;

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

      this._formatTracklist();

      return this;
    }

    /**
     * Instantiate every plugin's contructor with this Lap instance
     *
     * @return {Lap} this
     * @private
     */

  }, {
    key: '_activatePlugins',
    value: function _activatePlugins() {
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
    key: '_initAudio',
    value: function _initAudio() {
      this.audio = new Audio();
      this.audio.preload = 'auto';
      var fileType = this.files[this.trackIndex];
      fileType = fileType.slice(fileType.lastIndexOf('.') + 1);
      var canPlay = this.audio.canPlayType('audio/' + fileType);
      if (canPlay === 'probably' || canPlay === 'maybe') {
        this._updateSource();
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
    key: '_updateSource',
    value: function _updateSource() {
      this.audio.src = this.files[this.trackIndex];
      return this;
    }

    /**
     * @return {Lap} this
     * @private
     */

  }, {
    key: '_initElements',
    value: function _initElements() {
      var _this5 = this;

      this.els = {};
      this.selectors = { state: {} };
      Lap.each(Lap._defaultSelectors, function (selector, key) {
        if (key !== 'state') {

          _this5.selectors[key] = _this5.settings.selectors.hasOwnProperty(key) ? _this5.settings.selectors[key] : selector;

          var el = _this5.element.querySelector('.' + _this5.selectors[key]);
          if (el) _this5.els[key] = el;
        } else {
          var hasCustomState = _this5.settings.selectors.state;

          if (!hasCustomState) return _this5.selectors.state = Lap._defaultSelectors.state;

          Lap.each(Lap._defaultSelectors.state, function (sel, k) {
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
      this._audioListeners = this._audioListeners || {};
      this._audioListeners[event] = this._audioListeners[event] || [];

      var bound = listener.bind(this);
      this._audioListeners[event].push(bound);
      this.audio.addEventListener(event, bound);
      return this;
    }

    /**
     * @return {Lap} this
     * @private
     */

  }, {
    key: '_addAudioListeners',
    value: function _addAudioListeners() {
      var _this6 = this;

      var audio = this.audio;
      var els = this.els;
      var nativeProgress = !!(this.settings.useNativeProgress && els.progress);

      var _addListener = function _addListener(condition, event, listener) {
        if (condition) _this6.addAudioListener(event, listener);
      };

      _addListener(!!(els.buffered || nativeProgress), 'progress', function () {
        var buffered = _this6._bufferFormatted();
        if (els.buffered) els.buffered.innerHTML = buffered;
        if (nativeProgress) els.progress.value = buffered;
      });

      _addListener(!!els.currentTime, 'timeupdate', function () {
        return _this6._updateCurrentTimeEl();
      });
      _addListener(!!els.duration, 'durationchange', function () {
        return _this6._updateDurationEl();
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
      this._listeners = this._listeners || {};
      this._listeners[elementName] = this._listeners[elementName] || {};
      this._listeners[elementName][event] = this._listeners[elementName][event] || [];

      var bound = listener.bind(this);
      this._listeners[elementName][event].push(bound);
      this.els[elementName].addEventListener(event, bound);
      return this;
    }

    /**
     * @return {Lap} this
     * @private
     */

  }, {
    key: '_addListeners',
    value: function _addListeners() {
      var _this7 = this;

      var els = this.els;

      this.addListener('playPause', 'click', this.togglePlay);
      this.addListener('prev', 'click', this.prev);
      this.addListener('next', 'click', this.next);
      this.addListener('prevAlbum', 'click', this.prevAlbum);
      this.addListener('nextAlbum', 'click', this.nextAlbum);
      this.addListener('volumeUp', 'click', this._incVolume);
      this.addListener('volumeDown', 'click', this._decVolume);

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
        _if('trackTitle', '_updateTrackTitleEl');
        _if('trackNumber', '_updateTrackNumberEl');
        _if('artist', '_updateArtistEl');
        _if('album', '_updateAlbumEl');
        _if('cover', '_updateCover');
        _if('currentTime', '_updateCurrentTimeEl');
        _if('duration', '_updateDurationEl');
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
        _if('trackTitle', '_updateTrackTitleEl');
        _if('trackNumber', '_updateTrackNumberEl');
        _if('currentTime', '_updateCurrentTimeEl');
        _if('duration', '_updateDurationEl');
      });

      this.on('albumChange', function () {
        _if('trackTitle', '_updateTrackTitleEl');
        _if('trackNumber', '_updateTrackNumberEl');
        _if('artist', '_updateArtistEl');
        _if('album', '_updateAlbumEl');
        _if('cover', '_updateCover');
      });
    }

    /**
     * @return {Lap} this
     * @private
     */

  }, {
    key: '_addSeekListeners',
    value: function _addSeekListeners() {
      var _this8 = this;

      var els = this.els;
      var seekRange = els.seekRange;
      var audio = this.audio;
      var useNative = !!(this.settings.useNativeSeekRange && seekRange);

      if (useNative) {
        this.addAudioListener('timeupdate', function () {
          if (!_this8.seeking) {
            seekRange.value = Lap.scale(audio.currentTime, 0, audio.duration, 0, 100);
          }
        });
        this.addListener('seekRange', 'input', function () {
          _this8.seeking = true;
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
          }).join(' '), Lap._debugSignature, _this8.id, r, c, r, c, r);
        }
      };

      if (els.seekForward) {
        maybeWarn();
        this.addListener('seekForward', 'mousedown', function () {
          _this8.seeking = true;
          _this8._seekForward();
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
          _this8._seekBackward();
        });
        this.addListener('seekBackward', 'mouseup', function () {
          _this8.seeking = false;
          clearTimeout(_this8.mouseDownTimer);
          _this8.trigger('seek');
        });
      }
    }
  }, {
    key: '_seekBackward',
    value: function _seekBackward() {
      var _this9 = this;

      if (!this.seeking) return this;
      this.mouseDownTimer = setInterval(function () {
        var x = _this9.audio.currentTime + _this9.settings.seekInterval * -1;
        _this9.audio.currentTime = x < 0 ? 0 : x;
      }, this.settings.seekTime);
      return this;
    }
  }, {
    key: '_seekForward',
    value: function _seekForward() {
      var _this10 = this;

      if (!this.seeking) return this;
      this.mouseDownTimer = setInterval(function () {
        var x = _this10.audio.currentTime + _this10.settings.seekInterval;
        _this10.audio.currentTime = x > _this10.audio.duration ? _this10.audio.duration : x;
      }, this.settings.seekTime);
      return this;
    }
  }, {
    key: '_addVolumeListeners',
    value: function _addVolumeListeners() {
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
          }).join(' '), Lap._debugSignature, _this11.id, r, c, r, c, r);
        }
      };

      if (volumeUp) {
        maybeWarn();
        this.addListener('volumeUp', 'click', function () {
          return _this11._incVolume();
        });
      }
      if (volumeDown) {
        maybeWarn();
        this.addListener('volumeDown', 'click', function () {
          return _this11._decVolume();
        });
      }
    }
  }, {
    key: '_incVolume',
    value: function _incVolume() {
      var v = this.audio.volume;
      var i = this.settings.volumeInterval;
      this.audio.volume = v + i > 1 ? 1 : v + i;
      this.trigger('volumeChange');
      return this;
    }
  }, {
    key: '_decVolume',
    value: function _decVolume() {
      var v = this.audio.volume;
      var i = this.settings.volumeInterval;
      this.audio.volume = v - i < 0 ? 0 : v - i;
      this.trigger('volumeChange');
      return this;
    }
  }, {
    key: '_updateCurrentTimeEl',
    value: function _updateCurrentTimeEl() {
      this.els.currentTime.innerHTML = this._currentTimeFormatted();
      return this;
    }
  }, {
    key: '_updateDurationEl',
    value: function _updateDurationEl() {
      this.els.duration.innerHTML = this._durationFormatted();
      return this;
    }
  }, {
    key: '_updateTrackTitleEl',
    value: function _updateTrackTitleEl() {
      this.els.trackTitle.innerHTML = this.tracklist[this.trackIndex];
      return this;
    }
  }, {
    key: '_updateTrackNumberEl',
    value: function _updateTrackNumberEl() {
      this.els.trackNumber.innerHTML = +this.trackIndex + 1;
      return this;
    }
  }, {
    key: '_updateArtistEl',
    value: function _updateArtistEl() {
      this.els.artist.innerHTML = this.artist;
      return this;
    }
  }, {
    key: '_updateAlbumEl',
    value: function _updateAlbumEl() {
      this.els.album.innerHTML = this.album;
      return this;
    }
  }, {
    key: '_updateCover',
    value: function _updateCover() {
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
      if (Lap.exclusiveMode) Lap.each(Lap._instances, function (instance) {
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
      this._updateSource();
      if (wasPlaying) this.audio.play();
      this.trigger('trackChange');
      return this;
    }
  }, {
    key: 'prev',
    value: function prev() {
      var wasPlaying = !this.audio.paused;
      this.trackIndex = this.trackIndex - 1 < 0 ? this.trackCount - 1 : this.trackIndex - 1;
      this._updateSource();
      if (wasPlaying) this.audio.play();
      this.trigger('trackChange');
      return this;
    }
  }, {
    key: 'next',
    value: function next() {
      var wasPlaying = !this.audio.paused;
      this.trackIndex = this.trackIndex + 1 >= this.trackCount ? 0 : this.trackIndex + 1;
      this._updateSource();
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
      this._updateSource();
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
      this._updateSource();
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
    key: '_formatTracklist',
    value: function _formatTracklist() {
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
    key: '_bufferFormatted',
    value: function _bufferFormatted() {
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
    key: '_getAudioTimeFormatted',
    value: function _getAudioTimeFormatted(audioProp) {
      if (isNaN(this.audio.duration)) return '00:00';
      var formatted = Lap.formatTime(Math.floor(this.audio[audioProp].toFixed(1)));
      if (this.audio.duration < 3600 || formatted === '00:00:00') {
        formatted = formatted.slice(3); // nn:nn
      }
      return formatted;
    }
  }, {
    key: '_currentTimeFormatted',
    value: function _currentTimeFormatted() {
      return this._getAudioTimeFormatted('currentTime');
    }
  }, {
    key: '_durationFormatted',
    value: function _durationFormatted() {
      return this._getAudioTimeFormatted('duration');
    }
  }, {
    key: 'trackNumberFormatted',
    value: function trackNumberFormatted(n) {
      var count = String(this.trackCount).length - String(n).length;
      return '0'.repeat(count) + n + this.settings.trackNumberPostfix;
    }
  }, {
    key: 'get',
    value: function get(key, index) {
      return this.lib[index === undefined ? this.albumIndex : index][key];
    }
  }], [{
    key: 'getInstance',
    value: function getInstance(id) {
      return Lap._instances[id];
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
     */

  }, {
    key: 'destroy',
    value: function destroy(lap) {

      var id = lap.id;

      // remove dom event handlers
      Lap.each(lap._listeners, function (events, elementName) {
        return delete lap._listeners[elementName];
      });

      // remove audio events
      Lap.each(lap._audioListeners, function (listeners, event) {
        return delete lap._audioListeners[event];
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

      delete Lap._instances[id];
      lap = null;
    }
  }]);

  return Lap;
}(Bus);

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
Lap._debugSignature = 'color:teal;font-weight:bold';

/**
 * Lap instance cache
 *
 * @private
 * @type {Object}
 */
Lap._instances = {};

/**
 * @private
 * @type {RegExp}
 */
Lap._audioExtensionRegExp = /mp3|wav|ogg|aiff/i;

/**
 * @private
 * @type {Object}
 */
Lap._defaultSettings = {

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
   * in the Lap#els hash. Otherwise Lap._defaultSelectors are used
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

Lap._defaultSelectors = {
  state: {
    playing: 'lap--playing',
    paused: 'lap--paused'
  },
  album: 'lap__album',
  artist: 'lap__artist',
  buffered: 'lap__buffered',
  cover: 'lap__cover',
  currentTime: 'lap__current-time',
  duration: 'lap__duration',
  next: 'lap__next',
  nextAlbum: 'lap__next-album',
  playPause: 'lap__play-pause',
  prev: 'lap__prev',
  prevAlbum: 'lap__prev-album',
  progress: 'lap__progress',
  seekBackward: 'lap__seek-backward',
  seekForward: 'lap__seek-forward',
  seekRange: 'lap__seek-range',
  trackNumber: 'lap__track-number',
  trackTitle: 'lap__track-title',
  volumeDown: 'lap__volume-down',
  volumeRead: 'lap__volume-read',
  volumeRange: 'lap__volume-range',
  volumeUp: 'lap__volume-up'
};

if (window) window.Lap = Lap;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbGFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ1dxQixHQUFHO1lBQUgsR0FBRzs7Ozs7Ozs7Ozs7QUFVdEIsV0FWbUIsR0FBRyxDQVVWLE9BQU8sRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFrQjs7O1FBQWhCLFFBQVEseURBQUMsS0FBSzs7MEJBVjlCLEdBQUc7Ozs7dUVBQUgsR0FBRzs7QUFjcEIsVUFBSyxFQUFFLEdBQUcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxFQUFFLEdBQUcsT0FBTyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQTtBQUNwRSxPQUFHLENBQUMsVUFBVSxDQUFDLE1BQUssRUFBRSxDQUFDLFFBQU8sQ0FBQTs7QUFFOUIsVUFBSyxPQUFPLEdBQUcsT0FBTyxPQUFPLEtBQUssUUFBUSxHQUN0QyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUMvQixPQUFPLENBQUE7O0FBRVgsVUFBSyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7O0FBRWhCLFVBQUssUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNsQixRQUFJLE9BQU8sRUFBRTtBQUNYLFNBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLFVBQUMsR0FBRyxFQUFFLEdBQUcsRUFBSztBQUMzQyxZQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBSyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBLEtBQzdELE1BQUssUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtPQUM5QixDQUFDLENBQUE7S0FDSCxNQUFNO0FBQ0wsWUFBSyxRQUFRLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFBO0tBQ3JDOztB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QyxJQUFJLEVBQUUsQ0FBQTtBQUNqQyxVQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQzNCLGFBQU8sSUFBSSxDQUFBO0tBQ1o7OztnQ0FFVztBQUNWLFVBQU0sVUFBVSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUE7QUFDckMsVUFBSSxDQUFDLFVBQVUsR0FBRyxBQUFDLElBQUksQ0FBQyxVQUFVLEdBQUMsQ0FBQyxHQUFHLENBQUMsR0FBSSxJQUFJLENBQUMsVUFBVSxHQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFDLENBQUMsQ0FBQTtBQUNqRixVQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7QUFDYixVQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQTtBQUNuQixVQUFJLENBQUMsYUFBYSxFQUFFLENBQUE7QUFDcEIsVUFBSSxVQUFVLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUNqQyxVQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQzNCLGFBQU8sSUFBSSxDQUFBO0tBQ1o7OztnQ0FFVztBQUNWLFVBQU0sVUFBVSxHQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUE7QUFDcEMsVUFBSSxDQUFDLFVBQVUsR0FBRyxBQUFDLElBQUksQ0FBQyxVQUFVLEdBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUMsQ0FBQyxHQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFDLENBQUMsQ0FBQTtBQUNqRixVQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7QUFDYixVQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQTtBQUNuQixVQUFJLENBQUMsYUFBYSxFQUFFLENBQUE7QUFDcEIsVUFBSSxVQUFVLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUNqQyxVQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQzNCLGFBQU8sSUFB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LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gKiBsYXAuanMgdmVyc2lvbiAwLjguMlxuICogSFRNTDUgYXVkaW8gcGxheWVyXG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL0xva3VhL2xhcC5naXRcbiAqIGh0dHA6Ly9sb2t1YS5uZXRcbiAqXG4gKiBDb3B5cmlnaHQgwqkgMjAxNCwgMjAxNSBKb3NodWEgS2xlY2tuZXIgPGRldkBsb2t1YS5uZXQ+XG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKiBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvTUlUXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExhcCBleHRlbmRzIEJ1cyB7XG5cbiAgLyoqXG4gICAqIENsYXNzIGNvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0gIHtTdHJpbmd8SFRNTCBFbGVtZW50fSBlbGVtZW50IGNvbnRhaW5lciBlbGVtZW50XG4gICAqIEBwYXJhbSAge0FycmF5fE9iamVjdHxTdHJpbmd9IGxpYiBhIExhcCBcImxpYnJhcnlcIiwgd2hpY2ggY2FuIGJlIGFuIGFycmF5IG9mXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGJ1bSBvYmplY3RzLCBhIHNpbmdsZSBhbGJ1bSBvYmplY3QsIG9yIGEgdXJsIHRvIGFcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZSBhdWRpbyBmaWxlXG4gICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAgc2V0dGluZ3MgaGFzaCB0aGF0IHdpbGwgYmUgbWVyZ2VkIHdpdGggTGFwLl9kZWZhdWx0U2V0dGluZ3NcbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIGxpYiwgb3B0aW9ucywgcG9zdHBvbmU9ZmFsc2UpIHtcbiAgICBzdXBlcigpXG5cbiAgICAvLyBkZWZhdWx0IGlkIHRvIHplcm8tYmFzZWQgaW5kZXggaW5jcmVtZW50ZXJcbiAgICB0aGlzLmlkID0gb3B0aW9ucyAmJiBvcHRpb25zLmlkID8gb3B0aW9ucy5pZCA6IExhcC5faW5zdGFuY2VzLmxlbmd0aFxuICAgIExhcC5faW5zdGFuY2VzW3RoaXMuaWRdID0gdGhpc1xuXG4gICAgdGhpcy5lbGVtZW50ID0gdHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnXG4gICAgICA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudClcbiAgICAgIDogZWxlbWVudFxuXG4gICAgdGhpcy5zZXRMaWIobGliKVxuXG4gICAgdGhpcy5zZXR0aW5ncyA9IHt9XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgIExhcC5lYWNoKExhcC5fZGVmYXVsdFNldHRpbmdzLCAodmFsLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoa2V5KSkgdGhpcy5zZXR0aW5nc1trZXldID0gb3B0aW9uc1trZXldXG4gICAgICAgIGVsc2UgdGhpcy5zZXR0aW5nc1trZXldID0gdmFsXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldHRpbmdzID0gTGFwLl9kZWZhdWx0U2V0dGluZ3NcbiAgICB9XG5cbiAgICB0aGlzLmRlYnVnID0gdGhpcy5zZXR0aW5ncy5kZWJ1Z1xuXG5cbiAgICBpZiAodGhpcy5kZWJ1Zykge1xuICAgICAgdGhpcy5vbignbG9hZCcsICgpID0+IGNvbnNvbGUuaW5mbygnJWNMYXAoJXMpIFtERUJVR106JWMgJW8nLFxuICAgICAgICBMYXAuX2RlYnVnU2lnbmF0dXJlLCB0aGlzLmlkLCAnY29sb3I6aW5oZXJpdCcsIHRoaXMpKVxuICAgICAgY29uc3QgZWNobyA9IGUgPT4ge1xuICAgICAgICB0aGlzLm9uKGUsICgpID0+IGNvbnNvbGUuaW5mbygnJWNMYXAoJXMpIFtERUJVR106JWMgJXMgaGFuZGxlciBjYWxsZWQnLFxuICAgICAgICAgIExhcC5fZGVidWdTaWduYXR1cmUsIHRoaXMuaWQsICdjb2xvcjppbmhlcml0JywgZSkpXG4gICAgICB9XG4gICAgICBlY2hvKCdsb2FkJylcbiAgICAgIGVjaG8oJ3BsYXknKVxuICAgICAgZWNobygncGF1c2UnKVxuICAgICAgZWNobygnc2VlaycpXG4gICAgICBlY2hvKCd0cmFja0NoYW5nZScpXG4gICAgICBlY2hvKCdhbGJ1bUNoYW5nZScpXG4gICAgICBlY2hvKCd2b2x1bWVDaGFuZ2UnKVxuICAgIH1cblxuICAgIGlmICghcG9zdHBvbmUpIHRoaXMuaW5pdGlhbGl6ZSgpXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIExhcCBpbnN0YW5jZSBieSBpZC4gSWQgaXMgbm90IGFuIGVsZW1lbnQgY29udGFpbmVyIGlkOyBpdCBpcyB0aGUgYExhcCNzZXR0aW5ncy5pZGBcbiAgICogbWVtYmVyLCB3aGljaCBpZiBub3Qgc3VwcGxpZWQgb24gY3JlYXRpb24sIGlzIHplcm8tYmFzZWQgdGhlIG50aCBpbnN0YW5jZSBudW1iZXIuXG4gICAqXG4gICAqIEBwYXJhbSAge251bWJlcn0gaWQgTGFwI3NldHRpbmdzLmlkXG4gICAqIEByZXR1cm4ge0xhcH0gdGhlIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZ2V0SW5zdGFuY2UoaWQpIHtcbiAgICByZXR1cm4gTGFwLl9pbnN0YW5jZXNbaWRdXG4gIH1cblxuICAvKipcbiAgICogQWRkIGNsYXNzIGBjbGFzc2AgdG8gSFRNTCBFbGVtZW50IGBlbGBcbiAgICpcbiAgICogQHBhcmFtIHtIVE1MIEVsZW1lbnR9IGVsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBfY2xhc3NcbiAgICovXG4gIHN0YXRpYyBhZGRDbGFzcyhlbCwgX2NsYXNzKSB7XG4gICAgaWYgKCFlbCkgcmV0dXJuIGNvbnNvbGUud2FybihgJHtlbH0gaXMgbm90IGRlZmluZWRgKVxuICAgIGlmICghZWwuY2xhc3NOYW1lKSB7XG4gICAgICByZXR1cm4gKGVsLmNsYXNzTmFtZSArPSAnICcgKyBfY2xhc3MpXG4gICAgfVxuICAgIGNvbnN0IGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWVcbiAgICBjb25zdCBuZXdDbGFzc2VzID0gX2NsYXNzXG4gICAgICAuc3BsaXQoL1xccysvKVxuICAgICAgLmZpbHRlcihuID0+IGNsYXNzTmFtZXMuaW5kZXhPZihuKSA9PT0gLTEpXG4gICAgICAuam9pbignICcpXG4gICAgZWwuY2xhc3NOYW1lICs9ICcgJyArIG5ld0NsYXNzZXNcbiAgICByZXR1cm4gTGFwXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGNsYXNzIGBjbGFzc2AgZnJvbSBIVE1MIEVsZW1lbnQgYGVsYFxuICAgKlxuICAgKiBAcGFyYW0ge0hUTUwgRWxlbWVudH0gZWxcbiAgICogQHBhcmFtIHtzdHJpbmd9IF9jbGFzc1xuICAgKi9cbiAgc3RhdGljIHJlbW92ZUNsYXNzKGVsLCBfY2xhc3MpIHtcbiAgICBpZiAoIWVsKSByZXR1cm4gY29uc29sZS53YXJuKGAke2VsfSBpcyBub3QgZGVmaW5lZGApXG4gICAgLy8gdW5jb21tZW50IGZvciBtdWx0aXBsZSBjbGFzcyByZW1vdmFsXG4gICAgLy8gX2NsYXNzID0gYCgke19jbGFzcy5zcGxpdCgvXFxzKy8pLmpvaW4oJ3wnKX0pYFxuXG4gICAgLy8gVE9ETzogY2FjaGU/XG4gICAgY29uc3QgcmUgPSBuZXcgUmVnRXhwKCdcXFxccyonICsgX2NsYXNzICsgJ1xcXFxzKighW1xcXFx3XFxcXFddKT8nLCAnZycpXG4gICAgZWwuY2xhc3NOYW1lID0gZWwuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcgJykudHJpbSgpXG4gICAgcmV0dXJuIExhcFxuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgbWlsbGlzZWNvbmRzIGludG8gaGg6bW06c3MgZm9ybWF0XG4gICAqXG4gICAqIEBwYXJhbSAge3N0cmluZ3xudW1iZXJ9IHRpbWUgbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge3N0cmluZ30gYHRpbWVgIGluIGhoOm1tOnNzIGZvcm1hdFxuICAgKi9cbiAgc3RhdGljIGZvcm1hdFRpbWUodGltZSkge1xuICAgIGxldCBoID0gTWF0aC5mbG9vcih0aW1lIC8gMzYwMClcbiAgICBsZXQgbSA9IE1hdGguZmxvb3IoKHRpbWUgLSAoaCAqIDM2MDApKSAvIDYwKVxuICAgIGxldCBzID0gTWF0aC5mbG9vcih0aW1lIC0gKGggKiAzNjAwKSAtIChtICogNjApKVxuICAgIGlmIChoIDwgMTApIGggPSAnMCcgKyBoXG4gICAgaWYgKG0gPCAxMCkgbSA9ICcwJyArIG1cbiAgICBpZiAocyA8IDEwKSBzID0gJzAnICsgc1xuICAgIHJldHVybiBoICsgJzonICsgbSArICc6JyArIHNcbiAgfVxuXG4gIC8qKlxuICAgKiBCYXJlYm9uZXMgZm9yRWFjaCBmb3Igb2JqZWN0XG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gICBvYmogUE9KT1xuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gIGl0ZXJhdG9yIGNhbGxlZCB2YWwsa2V5LG9ialxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgY3R4IG9wdGlvbmFsIGNvbnRleHRcbiAgICogQHJldHVybiB7dW5kZWZpbmVkfVxuICAgKi9cbiAgc3RhdGljIGVhY2gob2JqLCBmbiwgY3R4KSB7XG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKG9iailcbiAgICBsZXQgaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoXG4gICAgZm9yICg7IGkgPCBsZW47IGkrKykgZm4uY2FsbChjdHgsIG9ialtrZXlzW2ldXSwga2V5c1tpXSwgb2JqKVxuICB9XG5cbiAgLyoqXG4gICAqIFNjYWxlIGEgbnVtYmVyIGZyb20gb25lIHJhbmdlIHRvIGFub3RoZXJcbiAgICpcbiAgICogQHBhcmFtICB7bnVtYmVyfSBuICAgICAgdGhlIG51bWJlciB0byBzY2FsZVxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IG9sZE1pblxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IG9sZE1heFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IG1pbiAgICB0aGUgbmV3IG1pbiBbZGVmYXVsdD0wXVxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IG1heCAgICB0aGUgbmV3IG1heCBbZGVmYXVsdD0xXVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9ICAgICAgICB0aGUgc2NhbGVkIG51bWJlclxuICAgKi9cbiAgc3RhdGljIHNjYWxlKG4sIG9sZE1pbiwgb2xkTWF4LCBtaW4sIG1heCkge1xuICAgIHJldHVybiAoKChuLW9sZE1pbikqKG1heC1taW4pKSAvIChvbGRNYXgtb2xkTWluKSkgKyBtaW5cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFsbCBkb20sIGF1ZGlvLCBhbmQgaW50ZXJuYWwgZXZlbnQgaGFuZGxlcnMgZnJvbSB0aGUgZ2l2ZW4gTGFwIGluc3RhbmNlLFxuICAgKiB0aGVuIGRlbGV0ZXMgYWxsIHByb3BlcnRpZXNcbiAgICpcbiAgICogQHBhcmFtICB7TGFwfSBsYXAgdGhlIExhcCBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGRlc3Ryb3kobGFwKSB7XG5cbiAgICBjb25zdCBpZCA9IGxhcC5pZFxuXG4gICAgLy8gcmVtb3ZlIGRvbSBldmVudCBoYW5kbGVyc1xuICAgIExhcC5lYWNoKGxhcC5fbGlzdGVuZXJzLCAoZXZlbnRzLCBlbGVtZW50TmFtZSkgPT4gZGVsZXRlIGxhcC5fbGlzdGVuZXJzW2VsZW1lbnROYW1lXSlcblxuICAgIC8vIHJlbW92ZSBhdWRpbyBldmVudHNcbiAgICBMYXAuZWFjaChsYXAuX2F1ZGlvTGlzdGVuZXJzLCAobGlzdGVuZXJzLCBldmVudCkgPT4gZGVsZXRlIGxhcC5fYXVkaW9MaXN0ZW5lcnNbZXZlbnRdKVxuXG4gICAgLy8gcmVtb3ZlIGFsbCBzdXBlciBoYW5kbGVyc1xuICAgIGxhcC5yZW1vdmUoKVxuXG4gICAgLy8gbnVsbGlmeSBlbGVtZW50c1xuICAgIExhcC5lYWNoKGxhcC5lbHMsIChlbGVtZW50LCBlbE5hbWUpID0+IGRlbGV0ZSBsYXAuZWxzW2VsTmFtZV0pXG5cbiAgICAvLyBldmVyeXRoaW5nIGVsc2UganVzdCBpbiBjYXNlXG4gICAgTGFwLmVhY2gobGFwLCAodmFsLCBrZXkpID0+IGRlbGV0ZSBsYXBba2V5XSlcblxuICAgIGRlbGV0ZSBMYXAuX2luc3RhbmNlc1tpZF1cbiAgICBsYXAgPSBudWxsXG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoaXMgcGxheWVyJ3MgYGxpYmAgbWVtYmVyLiBgbGliYCBpcyB0aGUgc2FtZSBhcyB3b3VsZFxuICAgKiBiZSBwYXNzZWQgdG8gdGhlIExhcCBjb25zdHJ1Y3Rvci4gVGhpcyBtZXRob2QgaXMgdXNlZCBpbnRlcm5hbGx5IG9uIGZpcnN0IGluc3RhbnRpYXRpb24sXG4gICAqIHlldCBzaG91bGQgb25seSBiZSBjYWxsZWQgbWFudWFsbHkgaW4gdGhlIGNhc2Ugd2hlcmUgeW91IHdhbnQgdG8gY29tcGxldGVseSByZXBsYWNlIHRoZSBpbnN0YW5jZXNcbiAgICogbGliLiBOb3RlIHRoYXQgYCN1cGRhdGVgIG11c3QgYmUgY2FsbGVkIGFmdGVyIGAjc2V0TGliYCBmb3IgY2hhbmdlcyB0byB0YWtlIGVmZmVjdC5cbiAgICpcbiAgICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBsaWJcbiAgICovXG4gIHNldExpYihsaWIpIHtcbiAgICBjb25zdCB0eXBlID0gdHlwZW9mIGxpYlxuICAgIGNvbnN0IGlzQXJyYXkgPSBsaWIgaW5zdGFuY2VvZiBBcnJheVxuICAgIGlmIChpc0FycmF5KSB7XG4gICAgICB0aGlzLmxpYiA9IGxpYlxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHRoaXMubGliID0gW2xpYl1cbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnICYmIExhcC5fYXVkaW9FeHRlbnNpb25SZWdFeHAudGVzdChsaWIpKSB7XG4gICAgICB0aGlzLmxpYiA9IFt7IGZpbGVzOiBbbGliXSB9XVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bGlifSBtdXN0IGJlIGFuIGFycmF5LCBvYmplY3QsIG9yIHN0cmluZ2ApXG4gICAgfVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgaXMgYmFzaWNhbGx5IGEgc2Vjb25kYXJ5IGNvbnN0cnVjdG9yIGFuZCBzaG91bGQgbm90IHJlYWxseSBuZWVkXG4gICAqIHRvIGJlIGNhbGxlZCBtYW51YWxseSBleGNlcHQgaW4gdGhlIGNhc2UgdGhhdCB5b3Ugd2FudCB0byBwcmVwYXJlIGEgcGxheWVyIHdpdGggaXRzXG4gICAqIHNldHRpbmdzIHdoaWxlIHdhaXRpbmcgZm9yIGEgbGliIHRvIGNvbWUgYmFjayBmcm9tIGFuIGFqYXggY2FsbC5cbiAgICpcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXG4gICAqL1xuICBpbml0aWFsaXplKCkge1xuXG4gICAgLy8gc3RhdGVcbiAgICB0aGlzLnNlZWtpbmcgPSBmYWxzZVxuICAgIHRoaXMudm9sdW1lQ2hhbmdpbmcgPSBmYWxzZVxuICAgIHRoaXMubW91c2VEb3duVGltZXIgPSAwXG4gICAgdGhpcy5wbGF5aW5nID0gZmFsc2VcblxuICAgIHRoaXMudXBkYXRlKClcbiAgICB0aGlzLl9pbml0QXVkaW8oKVxuICAgIHRoaXMuX2luaXRFbGVtZW50cygpXG4gICAgdGhpcy5fYWRkQXVkaW9MaXN0ZW5lcnMoKVxuICAgIHRoaXMuX2FkZFZvbHVtZUxpc3RlbmVycygpXG4gICAgdGhpcy5fYWRkU2Vla0xpc3RlbmVycygpXG4gICAgdGhpcy5fYWRkTGlzdGVuZXJzKClcbiAgICB0aGlzLl9hY3RpdmF0ZVBsdWdpbnMoKVxuXG4gICAgTGFwLmVhY2godGhpcy5zZXR0aW5ncy5jYWxsYmFja3MsIChmbiwga2V5KSA9PiB0aGlzLm9uKGtleSwgZm4uYmluZCh0aGlzKSkpXG5cbiAgICB0aGlzLnRyaWdnZXIoJ2xvYWQnLCB0aGlzKVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIGluc3RhbmNlIHZhcmlhYmxlcyByZWxhdGl2ZSB0byB0aGUgY3VycmVudCBhbGJ1bS5cbiAgICogQ2FsbGVkIG9uIGluc3RhbmNlIGluaXRpYWxpemF0aW9uIGFuZCB3aGVuZXZlciBhbiBhbGJ1bSBpcyBjaGFuZ2VkLlxuICAgKiBUaGlzIG1ldGhvZCBpcyBhbHNvIG5lZWRlZCBpZiB5b3UgbWFudWFsbHkgcmVwbGFjZSBhbiBpbnN0YW5jZSdzIGBsaWJgIG1lbWJlclxuICAgKiB2aWEgYCNzZXRMaWJgLCBpbiB3aGljaCBjYXNlIHlvdSdsbCBuZWVkIHRvIGNhbGwgYCN1cGRhdGVgIGRpcmVjdGx5IGFmdGVyXG4gICAqXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKi9cbiAgdXBkYXRlKCkge1xuICAgIGlmICh0aGlzLmFsYnVtSW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5hbGJ1bUluZGV4ID0gdGhpcy5zZXR0aW5ncy5zdGFydGluZ0FsYnVtSW5kZXggPT09IHVuZGVmaW5lZFxuICAgICAgICA/IDBcbiAgICAgICAgOiB0aGlzLnNldHRpbmdzLnN0YXJ0aW5nQWxidW1JbmRleFxuICAgIH1cbiAgICBpZiAodGhpcy50cmFja0luZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMudHJhY2tJbmRleCA9IHRoaXMuc2V0dGluZ3Muc3RhcnRpbmdUcmFja0luZGV4ID09PSB1bmRlZmluZWRcbiAgICAgICAgPyAwXG4gICAgICAgIDogdGhpcy5zZXR0aW5ncy5zdGFydGluZ0FsYnVtSW5kZXhcbiAgICB9XG5cbiAgICB0aGlzLmFsYnVtQ291bnQgPSB0aGlzLmxpYi5sZW5ndGg7XG5cbiAgICBjb25zdCBjdXJyZW50TGliSXRlbSA9IHRoaXMubGliW3RoaXMuYWxidW1JbmRleF1cblxuICAgIGNvbnN0IGtleXMgPSBbJ2FydGlzdCcsICdhbGJ1bScsICdmaWxlcycsICdjb3ZlcicsICd0cmFja2xpc3QnLCAncmVwbGFjZW1lbnQnXVxuICAgIGtleXMuZm9yRWFjaChrZXkgPT4gdGhpc1trZXldID0gY3VycmVudExpYkl0ZW1ba2V5XSlcblxuXG4gICAgdGhpcy50cmFja0NvdW50ID0gdGhpcy5maWxlcy5sZW5ndGhcblxuICAgIC8vIHJlcGxhY2VtZW50IGluID09PSBbcmVnZXhwIHN0cmluZywgcmVwbGFjZW1lbnQgc3RyaW5nLCBvcHRpb25hbCBmbGFnc11cbiAgICAvLyByZXBsYWNlbWVudCBvdXQgPT09IFtyZWdleHAgaW5zdGFuY2UsIHJlcGxhY2VtZW50XVxuICAgIGlmICh0aGlzLnJlcGxhY2VtZW50KSB7XG4gICAgICBsZXQgcmUgPSB0aGlzLnJlcGxhY2VtZW50XG5cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlKSAmJiByZVswXSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICB0aGlzLnJlcGxhY2VtZW50ID0gcmVcblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZSA9PT0gJ3N0cmluZycpIHJlID0gW3JlXVxuXG4gICAgICAgIC8vIHJlIG1heSBjb250YWluIHN0cmluZy13cmFwcGVkIHJlZ2V4cCAoZnJvbSBqc29uKSwgY29udmVydCBpZiBzb1xuICAgICAgICByZVswXSA9IG5ldyBSZWdFeHAocmVbMF0sIHJlWzJdIHx8ICdnJylcbiAgICAgICAgcmVbMV0gPSByZVsxXSB8fCAnJ1xuXG4gICAgICAgIHRoaXMucmVwbGFjZW1lbnQgPSByZVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX2Zvcm1hdFRyYWNrbGlzdCgpXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEluc3RhbnRpYXRlIGV2ZXJ5IHBsdWdpbidzIGNvbnRydWN0b3Igd2l0aCB0aGlzIExhcCBpbnN0YW5jZVxuICAgKlxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9hY3RpdmF0ZVBsdWdpbnMoKSB7XG4gICAgdGhpcy5wbHVnaW5zID0gW11cbiAgICB0aGlzLnNldHRpbmdzLnBsdWdpbnMuZm9yRWFjaCgocGx1Z2luLCBpKSA9PiB0aGlzLnBsdWdpbnNbaV0gPSBuZXcgcGx1Z2luKHRoaXMpKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdEF1ZGlvKCkge1xuICAgIHRoaXMuYXVkaW8gPSBuZXcgQXVkaW8oKVxuICAgIHRoaXMuYXVkaW8ucHJlbG9hZCA9ICdhdXRvJ1xuICAgIGxldCBmaWxlVHlwZSA9IHRoaXMuZmlsZXNbdGhpcy50cmFja0luZGV4XVxuICAgIGZpbGVUeXBlID0gZmlsZVR5cGUuc2xpY2UoZmlsZVR5cGUubGFzdEluZGV4T2YoJy4nKSsxKVxuICAgIGNvbnN0IGNhblBsYXkgPSB0aGlzLmF1ZGlvLmNhblBsYXlUeXBlKCdhdWRpby8nICsgZmlsZVR5cGUpXG4gICAgaWYgKGNhblBsYXkgPT09ICdwcm9iYWJseScgfHwgY2FuUGxheSA9PT0gJ21heWJlJykge1xuICAgICAgdGhpcy5fdXBkYXRlU291cmNlKClcbiAgICAgIHRoaXMuYXVkaW8udm9sdW1lID0gMVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUT0RPOiByZXR1cm4gYSBmbGFnIHRvIHNpZ25hbCBza2lwcGluZyB0aGUgcmVzdCBvZiB0aGUgaW5pdGlhbGl6YXRpb24gcHJvY2Vzc1xuICAgICAgY29uc29sZS53YXJuKGBUaGlzIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCAke2ZpbGVUeXBlfSBwbGF5YmFjay5gKVxuICAgIH1cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3VwZGF0ZVNvdXJjZSgpIHtcbiAgICB0aGlzLmF1ZGlvLnNyYyA9IHRoaXMuZmlsZXNbdGhpcy50cmFja0luZGV4XVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdEVsZW1lbnRzKCkge1xuICAgIHRoaXMuZWxzID0ge31cbiAgICB0aGlzLnNlbGVjdG9ycyA9IHsgc3RhdGU6IHt9IH1cbiAgICBMYXAuZWFjaChMYXAuX2RlZmF1bHRTZWxlY3RvcnMsIChzZWxlY3Rvciwga2V5KSA9PiB7XG4gICAgICBpZiAoa2V5ICE9PSAnc3RhdGUnKSB7XG5cbiAgICAgICAgdGhpcy5zZWxlY3RvcnNba2V5XSA9IHRoaXMuc2V0dGluZ3Muc2VsZWN0b3JzLmhhc093blByb3BlcnR5KGtleSlcbiAgICAgICAgICA/IHRoaXMuc2V0dGluZ3Muc2VsZWN0b3JzW2tleV1cbiAgICAgICAgICA6IHNlbGVjdG9yXG5cbiAgICAgICAgY29uc3QgZWwgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcihgLiR7dGhpcy5zZWxlY3RvcnNba2V5XX1gKVxuICAgICAgICBpZiAoZWwpIHRoaXMuZWxzW2tleV0gPSBlbFxuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBoYXNDdXN0b21TdGF0ZSA9IHRoaXMuc2V0dGluZ3Muc2VsZWN0b3JzLnN0YXRlXG5cbiAgICAgICAgaWYgKCFoYXNDdXN0b21TdGF0ZSkgcmV0dXJuICh0aGlzLnNlbGVjdG9ycy5zdGF0ZSA9IExhcC5fZGVmYXVsdFNlbGVjdG9ycy5zdGF0ZSlcblxuICAgICAgICBMYXAuZWFjaChMYXAuX2RlZmF1bHRTZWxlY3RvcnMuc3RhdGUsIChzZWwsIGspID0+IHtcbiAgICAgICAgICB0aGlzLnNlbGVjdG9ycy5zdGF0ZVtrXSA9IHRoaXMuc2V0dGluZ3Muc2VsZWN0b3JzLnN0YXRlLmhhc093blByb3BlcnR5KGspXG4gICAgICAgICAgICA/IHRoaXMuc2V0dGluZ3Muc2VsZWN0b3JzLnN0YXRlW2tdXG4gICAgICAgICAgICA6IHNlbFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQSB3cmFwcGVyIGFyb3VuZCB0aGlzIExhcCBpbnN0YW5jZXMgYGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXJgIHRoYXRcbiAgICogZW5zdXJlcyBoYW5kbGVycyBhcmUgY2FjaGVkIGZvciBsYXRlciByZW1vdmFsIHZpYSBgTGFwLmRlc3Ryb3koaW5zdGFuY2UpYCBjYWxsXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIGV2ZW50ICAgICAgIEF1ZGlvIEV2ZW50IG5hbWVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgICAgY2FsbGJhY2tcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXG4gICAqL1xuICBhZGRBdWRpb0xpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgIHRoaXMuX2F1ZGlvTGlzdGVuZXJzID0gdGhpcy5fYXVkaW9MaXN0ZW5lcnMgfHwge31cbiAgICB0aGlzLl9hdWRpb0xpc3RlbmVyc1tldmVudF0gPSB0aGlzLl9hdWRpb0xpc3RlbmVyc1tldmVudF0gfHwgW11cblxuICAgIGNvbnN0IGJvdW5kID0gbGlzdGVuZXIuYmluZCh0aGlzKVxuICAgIHRoaXMuX2F1ZGlvTGlzdGVuZXJzW2V2ZW50XS5wdXNoKGJvdW5kKVxuICAgIHRoaXMuYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgYm91bmQpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9hZGRBdWRpb0xpc3RlbmVycygpIHtcbiAgICBjb25zdCBhdWRpbyA9IHRoaXMuYXVkaW9cbiAgICBjb25zdCBlbHMgPSB0aGlzLmVsc1xuICAgIGNvbnN0IG5hdGl2ZVByb2dyZXNzID0gISEodGhpcy5zZXR0aW5ncy51c2VOYXRpdmVQcm9ncmVzcyAmJiBlbHMucHJvZ3Jlc3MpXG5cbiAgICBjb25zdCBfYWRkTGlzdGVuZXIgPSAoY29uZGl0aW9uLCBldmVudCwgbGlzdGVuZXIpID0+IHtcbiAgICAgIGlmIChjb25kaXRpb24pIHRoaXMuYWRkQXVkaW9MaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpXG4gICAgfVxuXG4gICAgX2FkZExpc3RlbmVyKCEhKGVscy5idWZmZXJlZCB8fCBuYXRpdmVQcm9ncmVzcyksICdwcm9ncmVzcycsICgpID0+IHtcbiAgICAgIHZhciBidWZmZXJlZCA9IHRoaXMuX2J1ZmZlckZvcm1hdHRlZCgpXG4gICAgICBpZiAoZWxzLmJ1ZmZlcmVkKSBlbHMuYnVmZmVyZWQuaW5uZXJIVE1MID0gYnVmZmVyZWRcbiAgICAgIGlmIChuYXRpdmVQcm9ncmVzcykgZWxzLnByb2dyZXNzLnZhbHVlID0gYnVmZmVyZWRcbiAgICB9KVxuXG4gICAgX2FkZExpc3RlbmVyKCEhZWxzLmN1cnJlbnRUaW1lLCAndGltZXVwZGF0ZScsICgpID0+IHRoaXMuX3VwZGF0ZUN1cnJlbnRUaW1lRWwoKSlcbiAgICBfYWRkTGlzdGVuZXIoISFlbHMuZHVyYXRpb24sICdkdXJhdGlvbmNoYW5nZScsICgpID0+IHRoaXMuX3VwZGF0ZUR1cmF0aW9uRWwoKSlcblxuICAgIF9hZGRMaXN0ZW5lcih0cnVlLCAnZW5kZWQnLCAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5wbGF5aW5nKSB7XG4gICAgICAgIHRoaXMubmV4dCgpXG4gICAgICAgIGF1ZGlvLnBsYXkoKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEEgd3JhcHBlciBhcm91bmQgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyIHdoaWNoIGVuc3VyZXMgbGlzdG5lcnNcbiAgICogYXJlIGNhY2hlZCBmb3IgbGF0ZXIgcmVtb3ZhbCB2aWEgYExhcC5kZXN0cm95KGluc3RhbmNlKWAgY2FsbFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBlbGVtZW50TmFtZSBMYXAjZWxzIGVsZW1lbnRrZXlcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgZXZlbnQgICAgICAgRE9NIEV2ZW50IG5hbWVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgICAgY2FsbGJhY2tcbiAgICovXG4gIGFkZExpc3RlbmVyKGVsZW1lbnROYW1lLCBldmVudCwgbGlzdGVuZXIpIHtcbiAgICAvLyBieXBhc3Mgbm9uLWV4aXN0ZW50IGVsZW1lbnRzXG4gICAgaWYgKCF0aGlzLmVsc1tlbGVtZW50TmFtZV0pIHJldHVybiB0aGlzXG5cbiAgICAvLyBpZS4gbGlzdGVuZXJzID0geyBzZWVrUmFuZ2U6IHsgY2xpY2s6IFtoYW5kbGVyc10sIG1vdXNlZG93bjogW2hhbmRsZXJzXSwgLi4uIH0sIC4uLiB9XG4gICAgdGhpcy5fbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzIHx8IHt9XG4gICAgdGhpcy5fbGlzdGVuZXJzW2VsZW1lbnROYW1lXSA9IHRoaXMuX2xpc3RlbmVyc1tlbGVtZW50TmFtZV0gfHwge31cbiAgICB0aGlzLl9saXN0ZW5lcnNbZWxlbWVudE5hbWVdW2V2ZW50XSA9IHRoaXMuX2xpc3RlbmVyc1tlbGVtZW50TmFtZV1bZXZlbnRdIHx8IFtdXG5cbiAgICBjb25zdCBib3VuZCA9IGxpc3RlbmVyLmJpbmQodGhpcylcbiAgICB0aGlzLl9saXN0ZW5lcnNbZWxlbWVudE5hbWVdW2V2ZW50XS5wdXNoKGJvdW5kKVxuICAgIHRoaXMuZWxzW2VsZW1lbnROYW1lXS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBib3VuZClcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZExpc3RlbmVycygpIHtcbiAgICBjb25zdCBlbHMgPSB0aGlzLmVsc1xuXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigncGxheVBhdXNlJywgJ2NsaWNrJywgdGhpcy50b2dnbGVQbGF5KVxuICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3ByZXYnLCAnY2xpY2snLCB0aGlzLnByZXYpXG4gICAgdGhpcy5hZGRMaXN0ZW5lcignbmV4dCcsICdjbGljaycsIHRoaXMubmV4dClcbiAgICB0aGlzLmFkZExpc3RlbmVyKCdwcmV2QWxidW0nLCAnY2xpY2snLCB0aGlzLnByZXZBbGJ1bSlcbiAgICB0aGlzLmFkZExpc3RlbmVyKCduZXh0QWxidW0nLCAnY2xpY2snLCB0aGlzLm5leHRBbGJ1bSlcbiAgICB0aGlzLmFkZExpc3RlbmVyKCd2b2x1bWVVcCcsICdjbGljaycsIHRoaXMuX2luY1ZvbHVtZSlcbiAgICB0aGlzLmFkZExpc3RlbmVyKCd2b2x1bWVEb3duJywgJ2NsaWNrJywgdGhpcy5fZGVjVm9sdW1lKVxuXG4gICAgY29uc3QgX2lmID0gKGVsZW1lbnROYW1lLCBmbikgPT4ge1xuICAgICAgaWYgKHRoaXMuZWxzW2VsZW1lbnROYW1lXSkge1xuICAgICAgICBpZiAodHlwZW9mIGZuID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRoaXNbZm5dKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBhbm9ueW1vdXNcbiAgICAgICAgICBmbigpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm9uKCdsb2FkJywgKCkgPT4ge1xuICAgICAgX2lmKCd0cmFja1RpdGxlJywgJ191cGRhdGVUcmFja1RpdGxlRWwnKVxuICAgICAgX2lmKCd0cmFja051bWJlcicsICdfdXBkYXRlVHJhY2tOdW1iZXJFbCcpXG4gICAgICBfaWYoJ2FydGlzdCcsICdfdXBkYXRlQXJ0aXN0RWwnKVxuICAgICAgX2lmKCdhbGJ1bScsICdfdXBkYXRlQWxidW1FbCcpXG4gICAgICBfaWYoJ2NvdmVyJywgJ191cGRhdGVDb3ZlcicpXG4gICAgICBfaWYoJ2N1cnJlbnRUaW1lJywgJ191cGRhdGVDdXJyZW50VGltZUVsJylcbiAgICAgIF9pZignZHVyYXRpb24nLCAnX3VwZGF0ZUR1cmF0aW9uRWwnKVxuICAgICAgX2lmKCdwbGF5UGF1c2UnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHMgPSB0aGlzLnNlbGVjdG9ycy5zdGF0ZVxuICAgICAgICBjb25zdCBwcCA9IGVscy5wbGF5UGF1c2VcbiAgICAgICAgTGFwLmFkZENsYXNzKHBwLCBzLnBhdXNlZClcbiAgICAgICAgdGhpcy5vbigncGxheScsICgpID0+IExhcC5yZW1vdmVDbGFzcyhwcCwgcy5wYXVzZWQpLmFkZENsYXNzKHBwLCBzLnBsYXlpbmcpKVxuICAgICAgICB0aGlzLm9uKCdwYXVzZScsICgpID0+IExhcC5yZW1vdmVDbGFzcyhwcCwgcy5wbGF5aW5nKS5hZGRDbGFzcyhwcCwgcy5wYXVzZWQpKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgdGhpcy5vbigndHJhY2tDaGFuZ2UnLCAoKSA9PiB7XG4gICAgICBfaWYoJ3RyYWNrVGl0bGUnLCAnX3VwZGF0ZVRyYWNrVGl0bGVFbCcpXG4gICAgICBfaWYoJ3RyYWNrTnVtYmVyJywgJ191cGRhdGVUcmFja051bWJlckVsJylcbiAgICAgIF9pZignY3VycmVudFRpbWUnLCAnX3VwZGF0ZUN1cnJlbnRUaW1lRWwnKVxuICAgICAgX2lmKCdkdXJhdGlvbicsICdfdXBkYXRlRHVyYXRpb25FbCcpXG4gICAgfSlcblxuICAgIHRoaXMub24oJ2FsYnVtQ2hhbmdlJywgKCkgPT4ge1xuICAgICAgX2lmKCd0cmFja1RpdGxlJywgJ191cGRhdGVUcmFja1RpdGxlRWwnKVxuICAgICAgX2lmKCd0cmFja051bWJlcicsICdfdXBkYXRlVHJhY2tOdW1iZXJFbCcpXG4gICAgICBfaWYoJ2FydGlzdCcsICdfdXBkYXRlQXJ0aXN0RWwnKVxuICAgICAgX2lmKCdhbGJ1bScsICdfdXBkYXRlQWxidW1FbCcpXG4gICAgICBfaWYoJ2NvdmVyJywgJ191cGRhdGVDb3ZlcicpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9hZGRTZWVrTGlzdGVuZXJzKCkge1xuICAgIGNvbnN0IGVscyA9IHRoaXMuZWxzXG4gICAgY29uc3Qgc2Vla1JhbmdlID0gZWxzLnNlZWtSYW5nZVxuICAgIGNvbnN0IGF1ZGlvID0gdGhpcy5hdWRpb1xuICAgIGNvbnN0IHVzZU5hdGl2ZSA9ICEhKHRoaXMuc2V0dGluZ3MudXNlTmF0aXZlU2Vla1JhbmdlICYmIHNlZWtSYW5nZSlcblxuICAgIGlmICh1c2VOYXRpdmUpIHtcbiAgICAgIHRoaXMuYWRkQXVkaW9MaXN0ZW5lcigndGltZXVwZGF0ZScsICgpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLnNlZWtpbmcpIHtcbiAgICAgICAgICBzZWVrUmFuZ2UudmFsdWUgPSBMYXAuc2NhbGUoXG4gICAgICAgICAgICBhdWRpby5jdXJyZW50VGltZSwgMCwgYXVkaW8uZHVyYXRpb24sIDAsIDEwMClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3NlZWtSYW5nZScsICdpbnB1dCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5zZWVraW5nID0gdHJ1ZVxuICAgICAgICBhdWRpby5jdXJyZW50VGltZSA9IExhcC5zY2FsZShcbiAgICAgICAgICBzZWVrUmFuZ2UudmFsdWUsIDAsIHNlZWtSYW5nZS5tYXgsIDAsIGF1ZGlvLmR1cmF0aW9uKVxuICAgICAgICB0aGlzLnRyaWdnZXIoJ3NlZWsnKVxuICAgICAgICB0aGlzLnNlZWtpbmcgPSBmYWxzZVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb25zdCBtYXliZVdhcm4gPSAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5kZWJ1ZyAmJiBzZWVrUmFuZ2UpIHtcbiAgICAgICAgY29uc3QgYyA9ICdjb2xvcjpkYXJrZ3JlZW47Zm9udC1mYW1pbHk6bW9ub3NwYWNlJ1xuICAgICAgICBjb25zdCByID0gJ2NvbG9yOmluaGVyaXQnXG4gICAgICAgIGNvbnNvbGUud2FybihgXG4gICAgICAgICAgJWNMYXAoJXMpIFtERUJVR106XG4gICAgICAgICAgJWNTaW11bHRhbmVvdXMgdXNlIG9mICVjTGFwI2Vscy5zZWVrUmFuZ2UlYyBhbmRcbiAgICAgICAgICAlY0xhcCNlbHMuc2Vla0ZvcndhcmR8c2Vla0JhY2t3YXJkJWMgaXMgcmVkdW5kYW50LlxuICAgICAgICAgIENvbnNpZGVyIGNob29zaW5nIG9uZSBvciB0aGUgb3RoZXIuXG4gICAgICAgICAgYC5zcGxpdCgnXFxuJykubWFwKHMgPT4gcy50cmltKCkpLmpvaW4oJyAnKSxcbiAgICAgICAgICBMYXAuX2RlYnVnU2lnbmF0dXJlLCB0aGlzLmlkLCByLCBjLCByLCBjLCByXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZWxzLnNlZWtGb3J3YXJkKSB7XG4gICAgICBtYXliZVdhcm4oKVxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcignc2Vla0ZvcndhcmQnLCAnbW91c2Vkb3duJywgKCkgPT4ge1xuICAgICAgICB0aGlzLnNlZWtpbmcgPSB0cnVlXG4gICAgICAgIHRoaXMuX3NlZWtGb3J3YXJkKClcbiAgICAgIH0pXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCdzZWVrRm9yd2FyZCcsICdtb3VzZXVwJywgKCkgPT4ge1xuICAgICAgICB0aGlzLnNlZWtpbmcgPSBmYWxzZVxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5tb3VzZURvd25UaW1lcilcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdzZWVrJylcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKGVscy5zZWVrQmFja3dhcmQpIHtcbiAgICAgIG1heWJlV2FybigpXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCdzZWVrQmFja3dhcmQnLCAnbW91c2Vkb3duJywgKCkgPT4ge1xuICAgICAgICB0aGlzLnNlZWtpbmcgPSB0cnVlXG4gICAgICAgIHRoaXMuX3NlZWtCYWNrd2FyZCgpXG4gICAgICB9KVxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcignc2Vla0JhY2t3YXJkJywgJ21vdXNldXAnLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2Vla2luZyA9IGZhbHNlXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLm1vdXNlRG93blRpbWVyKVxuICAgICAgICB0aGlzLnRyaWdnZXIoJ3NlZWsnKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBfc2Vla0JhY2t3YXJkKCkge1xuICAgIGlmICghdGhpcy5zZWVraW5nKSByZXR1cm4gdGhpc1xuICAgIHRoaXMubW91c2VEb3duVGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBjb25zdCB4ID0gdGhpcy5hdWRpby5jdXJyZW50VGltZSArICh0aGlzLnNldHRpbmdzLnNlZWtJbnRlcnZhbCAqIC0xKVxuICAgICAgdGhpcy5hdWRpby5jdXJyZW50VGltZSA9IHggPCAwID8gMCA6IHhcbiAgICB9LCB0aGlzLnNldHRpbmdzLnNlZWtUaW1lKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfc2Vla0ZvcndhcmQoKSB7XG4gICAgaWYgKCF0aGlzLnNlZWtpbmcpIHJldHVybiB0aGlzXG4gICAgdGhpcy5tb3VzZURvd25UaW1lciA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGNvbnN0IHggPSB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lICsgdGhpcy5zZXR0aW5ncy5zZWVrSW50ZXJ2YWxcbiAgICAgIHRoaXMuYXVkaW8uY3VycmVudFRpbWUgPSB4ID4gdGhpcy5hdWRpby5kdXJhdGlvbiA/IHRoaXMuYXVkaW8uZHVyYXRpb24gOiB4XG4gICAgfSwgdGhpcy5zZXR0aW5ncy5zZWVrVGltZSlcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX2FkZFZvbHVtZUxpc3RlbmVycygpIHtcbiAgICBjb25zdCBlbHMgPSB0aGlzLmVsc1xuICAgIGNvbnN0IHZvbHVtZVJhbmdlID0gZWxzLnZvbHVtZVJhbmdlXG4gICAgY29uc3Qgdm9sdW1lUmVhZCA9IGVscy52b2x1bWVSZWFkXG4gICAgY29uc3Qgdm9sdW1lVXAgPSBlbHMudm9sdW1lVXBcbiAgICBjb25zdCB2b2x1bWVEb3duID0gZWxzLnZvbHVtZURvd25cblxuICAgIGlmICh2b2x1bWVSZWFkKSB7XG4gICAgICBjb25zdCBmbiA9ICgpID0+IHZvbHVtZVJlYWQuaW5uZXJIVE1MID0gTWF0aC5yb3VuZCh0aGlzLmF1ZGlvLnZvbHVtZSoxMDApXG4gICAgICB0aGlzLm9uKCd2b2x1bWVDaGFuZ2UnLCBmbilcbiAgICAgIGZuKClcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy51c2VOYXRpdmVWb2x1bWVSYW5nZSAmJiB2b2x1bWVSYW5nZSkge1xuXG4gICAgICBjb25zdCBmbiA9ICgpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLnZvbHVtZUNoYW5naW5nKSB2b2x1bWVSYW5nZS52YWx1ZSA9IE1hdGgucm91bmQodGhpcy5hdWRpby52b2x1bWUqMTAwKVxuICAgICAgfVxuICAgICAgdGhpcy5hZGRBdWRpb0xpc3RlbmVyKCd2b2x1bWVjaGFuZ2UnLCBmbilcbiAgICAgIHRoaXMub24oJ2xvYWQnLCBmbilcblxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lUmFuZ2UnLCAnbW91c2Vkb3duJywgKCkgPT4gdGhpcy52b2x1bWVDaGFuZ2luZyA9IHRydWUpXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCd2b2x1bWVSYW5nZScsICdtb3VzZXVwJywgKCkgPT4ge1xuICAgICAgICB0aGlzLmF1ZGlvLnZvbHVtZSA9IHZvbHVtZVJhbmdlLnZhbHVlICogMC4wMVxuICAgICAgICB0aGlzLnRyaWdnZXIoJ3ZvbHVtZUNoYW5nZScpXG4gICAgICAgIHRoaXMudm9sdW1lQ2hhbmdpbmcgPSBmYWxzZVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb25zdCBtYXliZVdhcm4gPSAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5kZWJ1ZyAmJiB2b2x1bWVSYW5nZSkge1xuICAgICAgICBjb25zdCBjID0gJ2NvbG9yOmRhcmtncmVlbjtmb250LWZhbWlseTptb25vc3BhY2UnXG4gICAgICAgIGNvbnN0IHIgPSAnY29sb3I6aW5oZXJpdCdcbiAgICAgICAgY29uc29sZS53YXJuKGBcbiAgICAgICAgICAlY0xhcCglcykgW0RFQlVHXTpcbiAgICAgICAgICAlY1NpbXVsdGFuZW91cyB1c2Ugb2YgJWNMYXAjZWxzLnZvbHVtZVJhbmdlJWMgYW5kXG4gICAgICAgICAgJWNMYXAjZWxzLnZvbHVtZVVwfHZvbHVtZURvd24lYyBpcyByZWR1bmRhbnQuXG4gICAgICAgICAgQ29uc2lkZXIgY2hvb3Npbmcgb25lIG9yIHRoZSBvdGhlci5cbiAgICAgICAgICBgLnNwbGl0KCdcXG4nKS5tYXAocyA9PiBzLnRyaW0oKSkuam9pbignICcpLFxuICAgICAgICAgIExhcC5fZGVidWdTaWduYXR1cmUsIHRoaXMuaWQsIHIsIGMsIHIsIGMsIHJcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh2b2x1bWVVcCkge1xuICAgICAgbWF5YmVXYXJuKClcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3ZvbHVtZVVwJywgJ2NsaWNrJywgKCkgPT4gdGhpcy5faW5jVm9sdW1lKCkpXG4gICAgfVxuICAgIGlmICh2b2x1bWVEb3duKSB7XG4gICAgICBtYXliZVdhcm4oKVxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lRG93bicsICdjbGljaycsICgpID0+IHRoaXMuX2RlY1ZvbHVtZSgpKVxuICAgIH1cbiAgfVxuXG4gIF9pbmNWb2x1bWUoKSB7XG4gICAgY29uc3QgdiA9IHRoaXMuYXVkaW8udm9sdW1lXG4gICAgY29uc3QgaSA9IHRoaXMuc2V0dGluZ3Mudm9sdW1lSW50ZXJ2YWxcbiAgICB0aGlzLmF1ZGlvLnZvbHVtZSA9IHYraSA+IDEgPyAxIDogditpXG4gICAgdGhpcy50cmlnZ2VyKCd2b2x1bWVDaGFuZ2UnKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfZGVjVm9sdW1lKCkge1xuICAgIGNvbnN0IHYgPSB0aGlzLmF1ZGlvLnZvbHVtZVxuICAgIGNvbnN0IGkgPSB0aGlzLnNldHRpbmdzLnZvbHVtZUludGVydmFsXG4gICAgdGhpcy5hdWRpby52b2x1bWUgPSB2LWkgPCAwID8gMCA6IHYtaVxuICAgIHRoaXMudHJpZ2dlcigndm9sdW1lQ2hhbmdlJylcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX3VwZGF0ZUN1cnJlbnRUaW1lRWwoKSB7XG4gICAgdGhpcy5lbHMuY3VycmVudFRpbWUuaW5uZXJIVE1MID0gdGhpcy5fY3VycmVudFRpbWVGb3JtYXR0ZWQoKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfdXBkYXRlRHVyYXRpb25FbCgpIHtcbiAgICB0aGlzLmVscy5kdXJhdGlvbi5pbm5lckhUTUwgPSB0aGlzLl9kdXJhdGlvbkZvcm1hdHRlZCgpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIF91cGRhdGVUcmFja1RpdGxlRWwoKSB7XG4gICAgdGhpcy5lbHMudHJhY2tUaXRsZS5pbm5lckhUTUwgPSB0aGlzLnRyYWNrbGlzdFt0aGlzLnRyYWNrSW5kZXhdXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIF91cGRhdGVUcmFja051bWJlckVsKCkge1xuICAgIHRoaXMuZWxzLnRyYWNrTnVtYmVyLmlubmVySFRNTCA9ICt0aGlzLnRyYWNrSW5kZXgrMVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfdXBkYXRlQXJ0aXN0RWwoKSB7XG4gICAgdGhpcy5lbHMuYXJ0aXN0LmlubmVySFRNTCA9IHRoaXMuYXJ0aXN0XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIF91cGRhdGVBbGJ1bUVsKCkge1xuICAgIHRoaXMuZWxzLmFsYnVtLmlubmVySFRNTCA9IHRoaXMuYWxidW1cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX3VwZGF0ZUNvdmVyKCkge1xuICAgIHRoaXMuZWxzLmNvdmVyLnNyYyA9IHRoaXMuY292ZXJcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgdG9nZ2xlUGxheSgpIHtcbiAgICB0aGlzLmF1ZGlvLnBhdXNlZCA/IHRoaXMucGxheSgpIDogdGhpcy5wYXVzZSgpXG4gICAgdGhpcy50cmlnZ2VyKCd0b2dnbGVQbGF5JylcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgcGxheSgpIHtcbiAgICBpZiAoTGFwLmV4Y2x1c2l2ZU1vZGUpIExhcC5lYWNoKExhcC5faW5zdGFuY2VzLCBpbnN0YW5jZSA9PiBpbnN0YW5jZS5wYXVzZSgpKVxuICAgIHRoaXMuYXVkaW8ucGxheSgpXG4gICAgdGhpcy5wbGF5aW5nID0gdHJ1ZVxuICAgIHRoaXMudHJpZ2dlcigncGxheScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHBhdXNlKCkge1xuICAgIHRoaXMuYXVkaW8ucGF1c2UoKVxuICAgIHRoaXMucGxheWluZyA9IGZhbHNlXG4gICAgdGhpcy50cmlnZ2VyKCdwYXVzZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHNldFRyYWNrKGluZGV4KSB7XG4gICAgaWYgKGluZGV4IDw9IDApIHtcbiAgICAgIHRoaXMudHJhY2tJbmRleCA9IDBcbiAgICB9IGVsc2UgaWYgKGluZGV4ID49IHRoaXMudHJhY2tDb3VudCkge1xuICAgICAgdGhpcy50cmFja0luZGV4ID0gdGhpcy50cmFja0NvdW50LTFcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50cmFja0luZGV4ID0gaW5kZXhcbiAgICB9XG4gICAgY29uc3Qgd2FzUGxheWluZyA9ICF0aGlzLmF1ZGlvLnBhdXNlZFxuICAgIHRoaXMuX3VwZGF0ZVNvdXJjZSgpXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXG4gICAgdGhpcy50cmlnZ2VyKCd0cmFja0NoYW5nZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHByZXYoKSB7XG4gICAgY29uc3Qgd2FzUGxheWluZyA9ICF0aGlzLmF1ZGlvLnBhdXNlZFxuICAgIHRoaXMudHJhY2tJbmRleCA9ICh0aGlzLnRyYWNrSW5kZXgtMSA8IDApID8gdGhpcy50cmFja0NvdW50LTEgOiB0aGlzLnRyYWNrSW5kZXgtMVxuICAgIHRoaXMuX3VwZGF0ZVNvdXJjZSgpXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXG4gICAgdGhpcy50cmlnZ2VyKCd0cmFja0NoYW5nZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIG5leHQoKSB7XG4gICAgY29uc3Qgd2FzUGxheWluZyA9ICF0aGlzLmF1ZGlvLnBhdXNlZFxuICAgIHRoaXMudHJhY2tJbmRleCA9ICh0aGlzLnRyYWNrSW5kZXgrMSA+PSB0aGlzLnRyYWNrQ291bnQpID8gMCA6IHRoaXMudHJhY2tJbmRleCsxXG4gICAgdGhpcy5fdXBkYXRlU291cmNlKClcbiAgICBpZiAod2FzUGxheWluZykgdGhpcy5hdWRpby5wbGF5KClcbiAgICB0aGlzLnRyaWdnZXIoJ3RyYWNrQ2hhbmdlJylcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgcHJldkFsYnVtKCkge1xuICAgIGNvbnN0IHdhc1BsYXlpbmcgPSAhdGhpcy5hdWRpby5wYXVzZWRcbiAgICB0aGlzLmFsYnVtSW5kZXggPSAodGhpcy5hbGJ1bUluZGV4LTEgPCAwKSA/IHRoaXMuYWxidW1Db3VudC0xIDogdGhpcy5hbGJ1bUluZGV4LTFcbiAgICB0aGlzLnVwZGF0ZSgpXG4gICAgdGhpcy50cmFja0luZGV4ID0gMFxuICAgIHRoaXMuX3VwZGF0ZVNvdXJjZSgpXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXG4gICAgdGhpcy50cmlnZ2VyKCdhbGJ1bUNoYW5nZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIG5leHRBbGJ1bSgpIHtcbiAgICBjb25zdCB3YXNQbGF5aW5nPSAhdGhpcy5hdWRpby5wYXVzZWRcbiAgICB0aGlzLmFsYnVtSW5kZXggPSAodGhpcy5hbGJ1bUluZGV4KzEgPiB0aGlzLmFsYnVtQ291bnQtMSkgPyAwIDogdGhpcy5hbGJ1bUluZGV4KzFcbiAgICB0aGlzLnVwZGF0ZSgpXG4gICAgdGhpcy50cmFja0luZGV4ID0gMFxuICAgIHRoaXMuX3VwZGF0ZVNvdXJjZSgpXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXG4gICAgdGhpcy50cmlnZ2VyKCdhbGJ1bUNoYW5nZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHNldEFsYnVtKGluZGV4KSB7XG4gICAgaWYgKGluZGV4IDw9IDApIHtcbiAgICAgIHRoaXMuYWxidW1JbmRleCA9IDBcbiAgICB9IGVsc2UgaWYgKGluZGV4ID49IHRoaXMuYWxidW1Db3VudCkge1xuICAgICAgdGhpcy5hbGJ1bUluZGV4ID0gdGhpcy5hbGJ1bUNvdW50LTFcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hbGJ1bUluZGV4ID0gaW5kZXhcbiAgICB9XG4gICAgdGhpcy51cGRhdGUoKVxuICAgIHRoaXMuc2V0VHJhY2sodGhpcy5saWJbdGhpcy5hbGJ1bUluZGV4XS5zdGFydGluZ1RyYWNrSW5kZXggfHwgMClcbiAgICB0aGlzLnRyaWdnZXIoJ2FsYnVtQ2hhbmdlJylcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX2Zvcm1hdFRyYWNrbGlzdCgpIHtcbiAgICBpZiAodGhpcy50cmFja2xpc3QgJiYgdGhpcy50cmFja2xpc3QubGVuZ3RoKSByZXR1cm4gdGhpc1xuXG4gICAgY29uc3QgcmUgPSB0aGlzLnJlcGxhY2VtZW50XG4gICAgY29uc3QgdHJhY2tsaXN0ID0gW11cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudHJhY2tDb3VudDsgaSsrKSB7XG4gICAgICBsZXQgdCA9IHRoaXMuZmlsZXNbaV1cbiAgICAgIC8vIHN0cmlwIGV4dFxuICAgICAgdCA9IHQuc2xpY2UoMCwgdC5sYXN0SW5kZXhPZignLicpKVxuICAgICAgLy8gZ2V0IGxhc3QgcGF0aCBzZWdtZW50XG4gICAgICB0ID0gdC5zbGljZSh0Lmxhc3RJbmRleE9mKCcvJykrMSlcbiAgICAgIGlmIChyZSkgdCA9IHQucmVwbGFjZShyZVswXSwgcmVbMV0pXG4gICAgICB0cmFja2xpc3RbaV0gPSB0LnRyaW0oKVxuICAgIH1cbiAgICB0aGlzLnRyYWNrbGlzdCA9IHRyYWNrbGlzdFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfYnVmZmVyRm9ybWF0dGVkKCkge1xuICAgIGlmICghdGhpcy5hdWRpbykgcmV0dXJuIDBcblxuICAgIGNvbnN0IGF1ZGlvID0gdGhpcy5hdWRpb1xuICAgIGxldCBidWZmZXJlZFxuXG4gICAgdHJ5IHtcbiAgICAgIGJ1ZmZlcmVkID0gYXVkaW8uYnVmZmVyZWQuZW5kKGF1ZGlvLmJ1ZmZlcmVkLmxlbmd0aC0xKVxuICAgIH0gY2F0Y2goZSkge1xuICAgICAgcmV0dXJuIDBcbiAgICB9XG5cbiAgICBjb25zdCBmb3JtYXR0ZWQgPSBNYXRoLnJvdW5kKChidWZmZXJlZC9hdWRpby5kdXJhdGlvbikqMTAwKVxuICAgIC8vIHZhciBmb3JtYXR0ZWQgPSBNYXRoLnJvdW5kKF8uc2NhbGUoYnVmZmVyZWQsIDAsIGF1ZGlvLmR1cmF0aW9uLCAwLCAxMDApKVxuICAgIHJldHVybiBpc05hTihmb3JtYXR0ZWQpID8gMCA6IGZvcm1hdHRlZFxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2dldEF1ZGlvVGltZUZvcm1hdHRlZChhdWRpb1Byb3ApIHtcbiAgICBpZiAoaXNOYU4odGhpcy5hdWRpby5kdXJhdGlvbikpIHJldHVybiAnMDA6MDAnXG4gICAgbGV0IGZvcm1hdHRlZCA9IExhcC5mb3JtYXRUaW1lKE1hdGguZmxvb3IodGhpcy5hdWRpb1thdWRpb1Byb3BdLnRvRml4ZWQoMSkpKVxuICAgIGlmICh0aGlzLmF1ZGlvLmR1cmF0aW9uIDwgMzYwMCB8fCBmb3JtYXR0ZWQgPT09ICcwMDowMDowMCcpIHtcbiAgICAgIGZvcm1hdHRlZCA9IGZvcm1hdHRlZC5zbGljZSgzKSAvLyBubjpublxuICAgIH1cbiAgICByZXR1cm4gZm9ybWF0dGVkXG4gIH1cblxuICBfY3VycmVudFRpbWVGb3JtYXR0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldEF1ZGlvVGltZUZvcm1hdHRlZCgnY3VycmVudFRpbWUnKVxuICB9XG5cbiAgX2R1cmF0aW9uRm9ybWF0dGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9nZXRBdWRpb1RpbWVGb3JtYXR0ZWQoJ2R1cmF0aW9uJylcbiAgfVxuXG4gIHRyYWNrTnVtYmVyRm9ybWF0dGVkKG4pIHtcbiAgICB2YXIgY291bnQgPSBTdHJpbmcodGhpcy50cmFja0NvdW50KS5sZW5ndGggLSBTdHJpbmcobikubGVuZ3RoXG4gICAgcmV0dXJuICcwJy5yZXBlYXQoY291bnQpICsgbiArIHRoaXMuc2V0dGluZ3MudHJhY2tOdW1iZXJQb3N0Zml4XG4gIH1cblxuICBnZXQoa2V5LCBpbmRleCkge1xuICAgIHJldHVybiB0aGlzLmxpYltpbmRleCA9PT0gdW5kZWZpbmVkID8gdGhpcy5hbGJ1bUluZGV4IDogaW5kZXhdW2tleV1cbiAgfVxufVxuXG4vKipcbiAqIElmIHNldCB0cnVlLCBvbmx5IG9uZSBMYXAgY2FuIGJlIHBsYXlpbmcgYXQgYSBnaXZlbiB0aW1lXG4gKiBAdHlwZSB7Qm9vbGVhbn1cbiAqL1xuTGFwLmV4Y2x1c2l2ZU1vZGUgPSBmYWxzZVxuXG4vKipcbiAqIGNvbnNvbGUgZm9ybWF0IHByZWZpeCB1c2VkIHdoZW4gTGFwI3NldHRpbmdzLmRlYnVnZGVidWc9dHJ1ZVxuICpcbiAqIEBwcml2YXRlXG4gKiBAdHlwZSB7U3RyaW5nfVxuICovXG5MYXAuX2RlYnVnU2lnbmF0dXJlID0gJ2NvbG9yOnRlYWw7Zm9udC13ZWlnaHQ6Ym9sZCdcblxuLyoqXG4gKiBMYXAgaW5zdGFuY2UgY2FjaGVcbiAqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGUge09iamVjdH1cbiAqL1xuTGFwLl9pbnN0YW5jZXMgPSB7fVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAdHlwZSB7UmVnRXhwfVxuICovXG5MYXAuX2F1ZGlvRXh0ZW5zaW9uUmVnRXhwID0gL21wM3x3YXZ8b2dnfGFpZmYvaVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5MYXAuX2RlZmF1bHRTZXR0aW5ncyA9IHtcblxuICAvKipcbiAgICogUmVnaXN0ZXIgY2FsbGJhY2tzIGZvciBhbnkgY3VzdG9tIExhcCBldmVudCwgd2hlcmUgdGhlIG9iamVjdCBrZXlcbiAgICogaXMgdGhlIGV2ZW50IG5hbWUsIGFuZCB0aGUgdmFsdWUgaXMgdGhlIGNhbGxiYWNrLiBDdXJyZW50IGxpc3Qgb2ZcbiAgICogY3VzdG9tIGV2ZW50cyB0aGF0IGFyZSBmaXJlZCBpbmNsdWRlOlxuICAgKlxuICAgKiArIGxvYWRcbiAgICogKyBwbGF5XG4gICAqICsgcGF1c2VcbiAgICogKyB0b2dnbGVQbGF5XG4gICAqICsgc2Vla1xuICAgKiArIHRyYWNrQ2hhbmdlXG4gICAqICsgYWxidW1DaGFuZ2VcbiAgICogKyB2b2x1bWVDaGFuZ2VcbiAgICpcbiAgICogVGhlc2UgZXZlbnRzIGFyZSBmaXJlZCBhdCB0aGUgZW5kIG9mIHRoZWlyIHJlc3BlY3RpdmVcbiAgICogRE9NIGFuZCBBdWRpbyBldmVudCBsaWZlY3ljbGVzLCBhcyB3ZWxsIGFzIExhcCBsb2dpYyBhdHRhY2hlZCB0byB0aG9zZS4gRm9yIGV4YW1wbGUgd2hlblxuICAgKiBMYXAjZWxzLnBsYXlQYXVzZSBpcyBjbGlja2VkIHdoZW4gaW5pdGlhbGx5IHBhdXNlZCwgdGhlIERPTSBldmVudCBpcyBmaXJlZCwgQXVkaW8gd2lsbCBiZWdpbiBwbGF5aW5nLFxuICAgKiBMYXAgd2lsbCByZW1vdmUgdGhlIGxhcC0tcGF1c2VkIGNsYXNzIGFuZCBhZGQgdGhlIGxhcC0tcGxheWluZyBjbGFzcyB0byB0aGUgZWxlbWVudCwgYW5kIGZpbmFsbHlcbiAgICogdGhlIGN1c3RvbSAncGxheScgZXZlbnQgaXMgdHJpZ2dlcmVkLiBOb3RlIGFsc28gdGhhdCB5b3UgY2FuIHN1YnNjcmliZSB0byBhbnkgY3VzdG9tIGV2ZW50XG4gICAqIHZpYSBgTGFwI29uKGV2ZW50LCBjYWxsYmFjaylgXG4gICAqXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqL1xuICBjYWxsYmFja3M6IHt9LFxuXG4gIC8qKlxuICAgKiBXaGVuIHRydWUsIG91dHB1dHMgYmFzaWMgaW5zcGVjdGlvbiBpbmZvIGFuZCB3YXJuaW5nc1xuICAgKlxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG4gIGRlYnVnOiBmYWxzZSxcblxuICAvKipcbiAgICogU3VwcGx5IGFuIGFycmF5IG9mIHBsdWdpbnMgKGNvbnN0cnVjdG9ycykgd2hpY2ggd2lsbFxuICAgKiBiZSBjYWxsZWQgd2l0aCB0aGUgTGFwIGluc3RhbmNlIGFzIHRoZWlyIHNvbGUgYXJndW1lbnQuXG4gICAqIFRoZSBwbHVnaW4gaW5zdGFuY2VzIHRoZW1zZWx2ZXMgd2lsbCBiZSBhdmFpbGFibGUgaW4gdGhlIHNhbWUgb3JkZXJcbiAgICogdmlhIGBMYXAjcGx1Z2luc2AgYXJyYXlcbiAgICpcbiAgICogQHR5cGUge0FycmF5fVxuICAgKi9cbiAgcGx1Z2luczogW10sXG5cbiAgc3RhcnRpbmdBbGJ1bUluZGV4OiAwLFxuICBzdGFydGluZ1RyYWNrSW5kZXg6IDAsXG5cbiAgLyoqXG4gICAqIFRoZSBhbW91bnQgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgd2hpbGUgaG9sZGluZ1xuICAgKiBgTGFwI2Vscy5zZWVrQmFja3dhcmRgIG9yIGBMYXAjZWxzLnNlZWtGb3J3YXJkYCBiZWZvcmUgZXhlY3V0aW5nIGFub3RoZXJcbiAgICogc2VlayBpbnN0cnVjdGlvblxuICAgKlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgc2Vla0ludGVydmFsOiA1LFxuXG4gIC8qKlxuICAgKiBIb3cgZmFyIGZvcndhcmQgb3IgYmFjayBpbiBtaWxsaXNlY29uZHMgdG8gc2VlayB3aGVuXG4gICAqIGNhbGxpbmcgc2Vla0ZvcndhcmQgb3Igc2Vla0JhY2t3YXJkXG4gICAqXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICBzZWVrVGltZTogMjUwLFxuXG4gIC8qKlxuICAgKiBQcm92aWRlIHlvdXIgb3duIGN1c3RvbSBzZWxlY3RvcnMgZm9yIGVhY2ggZWxlbWVudFxuICAgKiBpbiB0aGUgTGFwI2VscyBoYXNoLiBPdGhlcndpc2UgTGFwLl9kZWZhdWx0U2VsZWN0b3JzIGFyZSB1c2VkXG4gICAqXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqL1xuICBzZWxlY3RvcnM6IHt9LFxuXG4gIHRyYWNrTnVtYmVyUG9zdGZpeDogJyAtICcsXG5cbiAgLyoqXG4gICAqIFNpZ25hbCB0aGF0IHlvdSB3aWxsIGJlIHVzaW5nIGEgbmF0aXZlIEhUTUw1IGBwcm9ncmVzc2AgZWxlbWVudFxuICAgKiB0byB0cmFjayBhdWRpbyBidWZmZXJlZCBhbW91bnQuIFJlcXVpcmVzIHRoYXQgYSBgbGFwX19wcm9ncmVzc2AgZWxlbWVudFxuICAgKiBpcyBmb3VuZCB1bmRlciB0aGUgYExhcCNlbGVtZW50YFxuICAgKlxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG4gIHVzZU5hdGl2ZVByb2dyZXNzOiBmYWxzZSxcblxuICAvKipcbiAgICogU2lnbmFsIHRoYXQgeW91IHdpbGwgYmUgdXNpbmcgYSBuYXRpdmUgSFRNTDUgYGlucHV0W3R5cGU9cmFuZ2VdYCBlbGVtZW50XG4gICAqIGZvciB0cmFjayBzZWVraW5nIGNvbnRyb2wuIFJlcXVpcmVzIHRoYXQgYSBgbGFwX19zZWVrLXJhbmdlYCBlbGVtZW50XG4gICAqIGlzIGZvdW5kIHVuZGVyIHRoZSBgTGFwI2VsZW1lbnRgXG4gICAqXG4gICAqIEB0eXBlIHtCb29sZWFufVxuICAgKi9cbiAgdXNlTmF0aXZlU2Vla1JhbmdlOiBmYWxzZSxcblxuICAvKipcbiAgICogU2lnbmFsIHRoYXQgeW91IHdpbGwgYmUgdXNpbmcgYSBuYXRpdmUgSFRNTDUgYGlucHV0W3R5cGU9cmFuZ2VdYCBlbGVtZW50XG4gICAqIGZvciB2b2x1bWUgY29udHJvbC4gUmVxdWlyZXMgdGhhdCBhIGBsYXBfX3ZvbHVtZS1yYW5nZWAgZWxlbWVudFxuICAgKiBpcyBmb3VuZCB1bmRlciB0aGUgYExhcCNlbGVtZW50YFxuICAgKlxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG4gIHVzZU5hdGl2ZVZvbHVtZVJhbmdlOiBmYWxzZSxcblxuICAvKipcbiAgICogU2V0IHRoZSBhbW91bnQgb2Ygdm9sdW1lIHRvIGluY3JlbWVudC9kZWNyZW1lbnQgd2hlbmV2ZXJcbiAgICogYSBgbGFwX192b2x1bWUtdXBgIG9yIGBsYXBfX3ZvbHVtZS1kb3duYCBlbGVtZW50IGlzIGNsaWNrZWQuXG4gICAqIE5vdGUgdGhhdCBhdWRpbyB2b2x1bWUgaXMgZmxvYXRpbmcgcG9pbnQgcmFuZ2UgWzAsIDFdXG4gICAqIERvZXMgbm90IGFwcGx5IHRvIGBsYXBfX3ZvbHVtZS1yYW5nZWAuXG4gICAqXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB2b2x1bWVJbnRlcnZhbDogMC4wNVxufVxuXG5MYXAuX2RlZmF1bHRTZWxlY3RvcnMgPSB7XG4gIHN0YXRlOiB7XG4gICAgcGxheWluZzogICAgICAgICAgICAgICdsYXAtLXBsYXlpbmcnLFxuICAgIHBhdXNlZDogICAgICAgICAgICAgICAnbGFwLS1wYXVzZWQnXG4gIH0sXG4gIGFsYnVtOiAgICAgICAgICAgICAgICdsYXBfX2FsYnVtJyxcbiAgYXJ0aXN0OiAgICAgICAgICAgICAgJ2xhcF9fYXJ0aXN0JyxcbiAgYnVmZmVyZWQ6ICAgICAgICAgICAgJ2xhcF9fYnVmZmVyZWQnLFxuICBjb3ZlcjogICAgICAgICAgICAgICAnbGFwX19jb3ZlcicsXG4gIGN1cnJlbnRUaW1lOiAgICAgICAgICdsYXBfX2N1cnJlbnQtdGltZScsXG4gIGR1cmF0aW9uOiAgICAgICAgICAgICdsYXBfX2R1cmF0aW9uJyxcbiAgbmV4dDogICAgICAgICAgICAgICAgJ2xhcF9fbmV4dCcsXG4gIG5leHRBbGJ1bTogICAgICAgICAgICdsYXBfX25leHQtYWxidW0nLFxuICBwbGF5UGF1c2U6ICAgICAgICAgICAnbGFwX19wbGF5LXBhdXNlJyxcbiAgcHJldjogICAgICAgICAgICAgICAgJ2xhcF9fcHJldicsXG4gIHByZXZBbGJ1bTogICAgICAgICAgICdsYXBfX3ByZXYtYWxidW0nLFxuICBwcm9ncmVzczogICAgICAgICAgICAnbGFwX19wcm9ncmVzcycsXG4gIHNlZWtCYWNrd2FyZDogICAgICAgICdsYXBfX3NlZWstYmFja3dhcmQnLFxuICBzZWVrRm9yd2FyZDogICAgICAgICAnbGFwX19zZWVrLWZvcndhcmQnLFxuICBzZWVrUmFuZ2U6ICAgICAgICAgICAnbGFwX19zZWVrLXJhbmdlJyxcbiAgdHJhY2tOdW1iZXI6ICAgICAgICAgJ2xhcF9fdHJhY2stbnVtYmVyJyxcbiAgdHJhY2tUaXRsZTogICAgICAgICAgJ2xhcF9fdHJhY2stdGl0bGUnLFxuICB2b2x1bWVEb3duOiAgICAgICAgICAnbGFwX192b2x1bWUtZG93bicsXG4gIHZvbHVtZVJlYWQ6ICAgICAgICAgICdsYXBfX3ZvbHVtZS1yZWFkJyxcbiAgdm9sdW1lUmFuZ2U6ICAgICAgICAgJ2xhcF9fdm9sdW1lLXJhbmdlJyxcbiAgdm9sdW1lVXA6ICAgICAgICAgICAgJ2xhcF9fdm9sdW1lLXVwJ1xufVxuXG5pZiAod2luZG93KSB3aW5kb3cuTGFwID0gTGFwXG4iXX0=
