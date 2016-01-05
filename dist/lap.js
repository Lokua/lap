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
 * lap.js version 0.8.0
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

      this.albumIndex = this.albumIndex || this.settings.startingAlbumIndex || 0;
      this.trackIndex = this.trackIndex || this.settings.startingTrackIndex || 0;
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
     * @return {null}
     */

  }, {
    key: 'destroy',
    value: function destroy(lap) {

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbGFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ1dxQixHQUFHO1lBQUgsR0FBRzs7Ozs7Ozs7Ozs7QUFVdEIsV0FWbUIsR0FBRyxDQVVWLE9BQU8sRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFrQjs7O1FBQWhCLFFBQVEseURBQUMsS0FBSzs7MEJBVjlCLEdBQUc7Ozs7dUVBQUgsR0FBRzs7QUFjcEIsVUFBSyxFQUFFLEdBQUcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxFQUFFLEdBQUcsT0FBTyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQTtBQUNwRSxPQUFHLENBQUMsVUFBVSxDQUFDLE1BQUssRUFBRSxDQUFDLFFBQU8sQ0FBQTs7QUFFOUIsVUFBSyxPQUFPLEdBQUcsT0FBTyxPQUFPLEtBQUssUUFBUSxHQUN0QyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUMvQixPQUFPLENBQUE7O0FBRVgsVUFBSyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7O0FBRWhCLFVBQUssUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNsQixRQUFJLE9BQU8sRUFBRTtBQUNYLFNBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLFVBQUMsR0FBRyxFQUFFLEdBQUcsRUFBSztBQUMzQyxZQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBSyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBLEtBQzdELE1BQUssUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtPQUM5QixDQUFDLENBQUE7S0FDSCxNQUFNO0FBQ0wsWUFBSyxRQUFRLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFBO0tBQ3JDOztB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Z0JBQWMsRUFBRSxJQUFJO0NBQ3JCLENBQUE7O0FBRUQsR0FBRyxDQUFDLGlCQUFpQixHQUFHO0FBQ3RCLE9BQUssRUFBRTtBQUNMLFdBQU8sRUFBZSxjQUFjO0FBQ3BDLFVBQU0sRUFBZ0IsYUFBYTtHQUNwQztBQUNELE9BQUssRUFBZ0IsWUFBWTtBQUNqQyxRQUFNLEVBQWUsYUFBYTtBQUNsQyxVQUFRLEVBQWEsZUFBZTtBQUNwQyxPQUFLLEVBQWdCLFlBQVk7QUFDakMsYUFBVyxFQUFVLG1CQUFtQjtBQUN4QyxVQUFRLEVBQWEsZUFBZTtBQUNwQyxNQUFJLEVBQWlCLFdBQVc7QUFDaEMsV0FBUyxFQUFZLGlCQUFpQjtBQUN0QyxXQUFTLEVBQVksaUJBQWlCO0FBQ3RDLE1BQUksRUFBaUIsV0FBVztBQUNoQyxXQUFTLEVBQVksaUJBQWlCO0FBQ3RDLFVBQVEsRUFBYSxlQUFlO0FBQ3BDLGNBQVksRUFBUyxvQkFBb0I7QUFDekMsYUFBVyxFQUFVLG1CQUFtQjtBQUN4QyxXQUFTLEVBQVksaUJBQWlCO0FBQ3RDLGFBQVcsRUFBVSxtQkFBbUI7QUFDeEMsWUFBVSxFQUFXLGtCQUFrQjtBQUN2QyxZQUFVLEVBQVcsa0JBQWtCO0FBQ3ZDLFlBQVUsRUFBVyxrQkFBa0I7QUFDdkMsYUFBVyxFQUFVLG1CQUFtQjtBQUN4QyxVQUFRLEVBQWEsZ0JBQWdCO0NBQ3RDLENBQUE7O0FBRUQsSUFBSSxNQUFNLEVBQUUsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gKiBsYXAuanMgdmVyc2lvbiAwLjguMFxuICogSFRNTDUgYXVkaW8gcGxheWVyXG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL0xva3VhL2xhcC5naXRcbiAqIGh0dHA6Ly9sb2t1YS5uZXRcbiAqXG4gKiBDb3B5cmlnaHQgwqkgMjAxNCwgMjAxNSBKb3NodWEgS2xlY2tuZXIgPGRldkBsb2t1YS5uZXQ+XG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKiBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvTUlUXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExhcCBleHRlbmRzIEJ1cyB7XG5cbiAgLyoqXG4gICAqIENsYXNzIGNvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0gIHtTdHJpbmd8SFRNTCBFbGVtZW50fSBlbGVtZW50IGNvbnRhaW5lciBlbGVtZW50XG4gICAqIEBwYXJhbSAge0FycmF5fE9iamVjdHxTdHJpbmd9IGxpYiBhIExhcCBcImxpYnJhcnlcIiwgd2hpY2ggY2FuIGJlIGFuIGFycmF5IG9mXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGJ1bSBvYmplY3RzLCBhIHNpbmdsZSBhbGJ1bSBvYmplY3QsIG9yIGEgdXJsIHRvIGFcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZSBhdWRpbyBmaWxlXG4gICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAgc2V0dGluZ3MgaGFzaCB0aGF0IHdpbGwgYmUgbWVyZ2VkIHdpdGggTGFwLl9kZWZhdWx0U2V0dGluZ3NcbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIGxpYiwgb3B0aW9ucywgcG9zdHBvbmU9ZmFsc2UpIHtcbiAgICBzdXBlcigpXG5cbiAgICAvLyBkZWZhdWx0IGlkIHRvIHplcm8tYmFzZWQgaW5kZXggaW5jcmVtZW50ZXJcbiAgICB0aGlzLmlkID0gb3B0aW9ucyAmJiBvcHRpb25zLmlkID8gb3B0aW9ucy5pZCA6IExhcC5faW5zdGFuY2VzLmxlbmd0aFxuICAgIExhcC5faW5zdGFuY2VzW3RoaXMuaWRdID0gdGhpc1xuXG4gICAgdGhpcy5lbGVtZW50ID0gdHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnXG4gICAgICA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudClcbiAgICAgIDogZWxlbWVudFxuXG4gICAgdGhpcy5zZXRMaWIobGliKVxuXG4gICAgdGhpcy5zZXR0aW5ncyA9IHt9XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgIExhcC5lYWNoKExhcC5fZGVmYXVsdFNldHRpbmdzLCAodmFsLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoa2V5KSkgdGhpcy5zZXR0aW5nc1trZXldID0gb3B0aW9uc1trZXldXG4gICAgICAgIGVsc2UgdGhpcy5zZXR0aW5nc1trZXldID0gdmFsXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldHRpbmdzID0gTGFwLl9kZWZhdWx0U2V0dGluZ3NcbiAgICB9XG5cbiAgICB0aGlzLmRlYnVnID0gdGhpcy5zZXR0aW5ncy5kZWJ1Z1xuXG5cbiAgICBpZiAodGhpcy5kZWJ1Zykge1xuICAgICAgdGhpcy5vbignbG9hZCcsICgpID0+IGNvbnNvbGUuaW5mbygnJWNMYXAoJXMpIFtERUJVR106JWMgJW8nLFxuICAgICAgICBMYXAuX2RlYnVnU2lnbmF0dXJlLCB0aGlzLmlkLCAnY29sb3I6aW5oZXJpdCcsIHRoaXMpKVxuICAgICAgY29uc3QgZWNobyA9IGUgPT4ge1xuICAgICAgICB0aGlzLm9uKGUsICgpID0+IGNvbnNvbGUuaW5mbygnJWNMYXAoJXMpIFtERUJVR106JWMgJXMgaGFuZGxlciBjYWxsZWQnLFxuICAgICAgICAgIExhcC5fZGVidWdTaWduYXR1cmUsIHRoaXMuaWQsICdjb2xvcjppbmhlcml0JywgZSkpXG4gICAgICB9XG4gICAgICBlY2hvKCdsb2FkJylcbiAgICAgIGVjaG8oJ3BsYXknKVxuICAgICAgZWNobygncGF1c2UnKVxuICAgICAgZWNobygnc2VlaycpXG4gICAgICBlY2hvKCd0cmFja0NoYW5nZScpXG4gICAgICBlY2hvKCdhbGJ1bUNoYW5nZScpXG4gICAgICBlY2hvKCd2b2x1bWVDaGFuZ2UnKVxuICAgIH1cblxuICAgIGlmICghcG9zdHBvbmUpIHRoaXMuaW5pdGlhbGl6ZSgpXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIExhcCBpbnN0YW5jZSBieSBpZC4gSWQgaXMgbm90IGFuIGVsZW1lbnQgY29udGFpbmVyIGlkOyBpdCBpcyB0aGUgYExhcCNzZXR0aW5ncy5pZGBcbiAgICogbWVtYmVyLCB3aGljaCBpZiBub3Qgc3VwcGxpZWQgb24gY3JlYXRpb24sIGlzIHplcm8tYmFzZWQgdGhlIG50aCBpbnN0YW5jZSBudW1iZXIuXG4gICAqXG4gICAqIEBwYXJhbSAge251bWJlcn0gaWQgTGFwI3NldHRpbmdzLmlkXG4gICAqIEByZXR1cm4ge0xhcH0gdGhlIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZ2V0SW5zdGFuY2UoaWQpIHtcbiAgICByZXR1cm4gTGFwLl9pbnN0YW5jZXNbaWRdXG4gIH1cblxuICAvKipcbiAgICogQWRkIGNsYXNzIGBjbGFzc2AgdG8gSFRNTCBFbGVtZW50IGBlbGBcbiAgICpcbiAgICogQHBhcmFtIHtIVE1MIEVsZW1lbnR9IGVsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBfY2xhc3NcbiAgICovXG4gIHN0YXRpYyBhZGRDbGFzcyhlbCwgX2NsYXNzKSB7XG4gICAgaWYgKCFlbCkgcmV0dXJuIGNvbnNvbGUud2FybihgJHtlbH0gaXMgbm90IGRlZmluZWRgKVxuICAgIGlmICghZWwuY2xhc3NOYW1lKSB7XG4gICAgICByZXR1cm4gKGVsLmNsYXNzTmFtZSArPSAnICcgKyBfY2xhc3MpXG4gICAgfVxuICAgIGNvbnN0IGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWVcbiAgICBjb25zdCBuZXdDbGFzc2VzID0gX2NsYXNzXG4gICAgICAuc3BsaXQoL1xccysvKVxuICAgICAgLmZpbHRlcihuID0+IGNsYXNzTmFtZXMuaW5kZXhPZihuKSA9PT0gLTEpXG4gICAgICAuam9pbignICcpXG4gICAgZWwuY2xhc3NOYW1lICs9ICcgJyArIG5ld0NsYXNzZXNcbiAgICByZXR1cm4gTGFwXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGNsYXNzIGBjbGFzc2AgZnJvbSBIVE1MIEVsZW1lbnQgYGVsYFxuICAgKlxuICAgKiBAcGFyYW0ge0hUTUwgRWxlbWVudH0gZWxcbiAgICogQHBhcmFtIHtzdHJpbmd9IF9jbGFzc1xuICAgKi9cbiAgc3RhdGljIHJlbW92ZUNsYXNzKGVsLCBfY2xhc3MpIHtcbiAgICBpZiAoIWVsKSByZXR1cm4gY29uc29sZS53YXJuKGAke2VsfSBpcyBub3QgZGVmaW5lZGApXG4gICAgLy8gdW5jb21tZW50IGZvciBtdWx0aXBsZSBjbGFzcyByZW1vdmFsXG4gICAgLy8gX2NsYXNzID0gYCgke19jbGFzcy5zcGxpdCgvXFxzKy8pLmpvaW4oJ3wnKX0pYFxuXG4gICAgLy8gVE9ETzogY2FjaGU/XG4gICAgY29uc3QgcmUgPSBuZXcgUmVnRXhwKCdcXFxccyonICsgX2NsYXNzICsgJ1xcXFxzKighW1xcXFx3XFxcXFddKT8nLCAnZycpXG4gICAgZWwuY2xhc3NOYW1lID0gZWwuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcgJykudHJpbSgpXG4gICAgcmV0dXJuIExhcFxuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgbWlsbGlzZWNvbmRzIGludG8gaGg6bW06c3MgZm9ybWF0XG4gICAqXG4gICAqIEBwYXJhbSAge3N0cmluZ3xudW1iZXJ9IHRpbWUgbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge3N0cmluZ30gYHRpbWVgIGluIGhoOm1tOnNzIGZvcm1hdFxuICAgKi9cbiAgc3RhdGljIGZvcm1hdFRpbWUodGltZSkge1xuICAgIGxldCBoID0gTWF0aC5mbG9vcih0aW1lIC8gMzYwMClcbiAgICBsZXQgbSA9IE1hdGguZmxvb3IoKHRpbWUgLSAoaCAqIDM2MDApKSAvIDYwKVxuICAgIGxldCBzID0gTWF0aC5mbG9vcih0aW1lIC0gKGggKiAzNjAwKSAtIChtICogNjApKVxuICAgIGlmIChoIDwgMTApIGggPSAnMCcgKyBoXG4gICAgaWYgKG0gPCAxMCkgbSA9ICcwJyArIG1cbiAgICBpZiAocyA8IDEwKSBzID0gJzAnICsgc1xuICAgIHJldHVybiBoICsgJzonICsgbSArICc6JyArIHNcbiAgfVxuXG4gIC8qKlxuICAgKiBCYXJlYm9uZXMgZm9yRWFjaCBmb3Igb2JqZWN0XG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gICBvYmogUE9KT1xuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gIGl0ZXJhdG9yIGNhbGxlZCB2YWwsa2V5LG9ialxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgY3R4IG9wdGlvbmFsIGNvbnRleHRcbiAgICogQHJldHVybiB7dW5kZWZpbmVkfVxuICAgKi9cbiAgc3RhdGljIGVhY2gob2JqLCBmbiwgY3R4KSB7XG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKG9iailcbiAgICBsZXQgaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoXG4gICAgZm9yICg7IGkgPCBsZW47IGkrKykgZm4uY2FsbChjdHgsIG9ialtrZXlzW2ldXSwga2V5c1tpXSwgb2JqKVxuICB9XG5cbiAgLyoqXG4gICAqIFNjYWxlIGEgbnVtYmVyIGZyb20gb25lIHJhbmdlIHRvIGFub3RoZXJcbiAgICpcbiAgICogQHBhcmFtICB7bnVtYmVyfSBuICAgICAgdGhlIG51bWJlciB0byBzY2FsZVxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IG9sZE1pblxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IG9sZE1heFxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IG1pbiAgICB0aGUgbmV3IG1pbiBbZGVmYXVsdD0wXVxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IG1heCAgICB0aGUgbmV3IG1heCBbZGVmYXVsdD0xXVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9ICAgICAgICB0aGUgc2NhbGVkIG51bWJlclxuICAgKi9cbiAgc3RhdGljIHNjYWxlKG4sIG9sZE1pbiwgb2xkTWF4LCBtaW4sIG1heCkge1xuICAgIHJldHVybiAoKChuLW9sZE1pbikqKG1heC1taW4pKSAvIChvbGRNYXgtb2xkTWluKSkgKyBtaW5cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFsbCBkb20sIGF1ZGlvLCBhbmQgaW50ZXJuYWwgZXZlbnQgaGFuZGxlcnMgZnJvbSB0aGUgZ2l2ZW4gTGFwIGluc3RhbmNlLFxuICAgKiB0aGVuIGRlbGV0ZXMgYWxsIHByb3BlcnRpZXNcbiAgICpcbiAgICogQHBhcmFtICB7TGFwfSBsYXAgdGhlIExhcCBpbnN0YW5jZVxuICAgKiBAcmV0dXJuIHtudWxsfVxuICAgKi9cbiAgc3RhdGljIGRlc3Ryb3kobGFwKSB7XG5cbiAgICAvLyByZW1vdmUgZG9tIGV2ZW50IGhhbmRsZXJzXG4gICAgTGFwLmVhY2gobGFwLl9saXN0ZW5lcnMsIChldmVudHMsIGVsZW1lbnROYW1lKSA9PiBkZWxldGUgbGFwLl9saXN0ZW5lcnNbZWxlbWVudE5hbWVdKVxuXG4gICAgLy8gcmVtb3ZlIGF1ZGlvIGV2ZW50c1xuICAgIExhcC5lYWNoKGxhcC5fYXVkaW9MaXN0ZW5lcnMsIChsaXN0ZW5lcnMsIGV2ZW50KSA9PiBkZWxldGUgbGFwLl9hdWRpb0xpc3RlbmVyc1tldmVudF0pXG5cbiAgICAvLyByZW1vdmUgYWxsIHN1cGVyIGhhbmRsZXJzXG4gICAgbGFwLnJlbW92ZSgpXG5cbiAgICAvLyBudWxsaWZ5IGVsZW1lbnRzXG4gICAgTGFwLmVhY2gobGFwLmVscywgKGVsZW1lbnQsIGVsTmFtZSkgPT4gZGVsZXRlIGxhcC5lbHNbZWxOYW1lXSlcblxuICAgIC8vIGV2ZXJ5dGhpbmcgZWxzZSBqdXN0IGluIGNhc2VcbiAgICBMYXAuZWFjaChsYXAsICh2YWwsIGtleSkgPT4gZGVsZXRlIGxhcFtrZXldKVxuXG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhpcyBwbGF5ZXIncyBgbGliYCBtZW1iZXIuIGBsaWJgIGlzIHRoZSBzYW1lIGFzIHdvdWxkXG4gICAqIGJlIHBhc3NlZCB0byB0aGUgTGFwIGNvbnN0cnVjdG9yLiBUaGlzIG1ldGhvZCBpcyB1c2VkIGludGVybmFsbHkgb24gZmlyc3QgaW5zdGFudGlhdGlvbixcbiAgICogeWV0IHNob3VsZCBvbmx5IGJlIGNhbGxlZCBtYW51YWxseSBpbiB0aGUgY2FzZSB3aGVyZSB5b3Ugd2FudCB0byBjb21wbGV0ZWx5IHJlcGxhY2UgdGhlIGluc3RhbmNlc1xuICAgKiBsaWIuIE5vdGUgdGhhdCBgI3VwZGF0ZWAgbXVzdCBiZSBjYWxsZWQgYWZ0ZXIgYCNzZXRMaWJgIGZvciBjaGFuZ2VzIHRvIHRha2UgZWZmZWN0LlxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGxpYlxuICAgKi9cbiAgc2V0TGliKGxpYikge1xuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgbGliXG4gICAgY29uc3QgaXNBcnJheSA9IGxpYiBpbnN0YW5jZW9mIEFycmF5XG4gICAgaWYgKGlzQXJyYXkpIHtcbiAgICAgIHRoaXMubGliID0gbGliXG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgdGhpcy5saWIgPSBbbGliXVxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycgJiYgTGFwLl9hdWRpb0V4dGVuc2lvblJlZ0V4cC50ZXN0KGxpYikpIHtcbiAgICAgIHRoaXMubGliID0gW3sgZmlsZXM6IFtsaWJdIH1dXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtsaWJ9IG11c3QgYmUgYW4gYXJyYXksIG9iamVjdCwgb3Igc3RyaW5nYClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBiYXNpY2FsbHkgYSBzZWNvbmRhcnkgY29uc3RydWN0b3IgYW5kIHNob3VsZCBub3QgcmVhbGx5IG5lZWRcbiAgICogdG8gYmUgY2FsbGVkIG1hbnVhbGx5IGV4Y2VwdCBpbiB0aGUgY2FzZSB0aGF0IHlvdSB3YW50IHRvIHByZXBhcmUgYSBwbGF5ZXIgd2l0aCBpdHNcbiAgICogc2V0dGluZ3Mgd2hpbGUgd2FpdGluZyBmb3IgYSBsaWIgdG8gY29tZSBiYWNrIGZyb20gYW4gYWpheCBjYWxsLlxuICAgKlxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcbiAgICovXG4gIGluaXRpYWxpemUoKSB7XG5cbiAgICAvLyBzdGF0ZVxuICAgIHRoaXMuc2Vla2luZyA9IGZhbHNlXG4gICAgdGhpcy52b2x1bWVDaGFuZ2luZyA9IGZhbHNlXG4gICAgdGhpcy5tb3VzZURvd25UaW1lciA9IDBcbiAgICB0aGlzLnBsYXlpbmcgPSBmYWxzZVxuXG4gICAgdGhpcy51cGRhdGUoKVxuICAgIHRoaXMuX2luaXRBdWRpbygpXG4gICAgdGhpcy5faW5pdEVsZW1lbnRzKClcbiAgICB0aGlzLl9hZGRBdWRpb0xpc3RlbmVycygpXG4gICAgdGhpcy5fYWRkVm9sdW1lTGlzdGVuZXJzKClcbiAgICB0aGlzLl9hZGRTZWVrTGlzdGVuZXJzKClcbiAgICB0aGlzLl9hZGRMaXN0ZW5lcnMoKVxuICAgIHRoaXMuX2FjdGl2YXRlUGx1Z2lucygpXG5cbiAgICBMYXAuZWFjaCh0aGlzLnNldHRpbmdzLmNhbGxiYWNrcywgKGZuLCBrZXkpID0+IHRoaXMub24oa2V5LCBmbi5iaW5kKHRoaXMpKSlcblxuICAgIHRoaXMudHJpZ2dlcignbG9hZCcsIHRoaXMpXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgaW5zdGFuY2UgdmFyaWFibGVzIHJlbGF0aXZlIHRvIHRoZSBjdXJyZW50IGFsYnVtLlxuICAgKiBDYWxsZWQgb24gaW5zdGFuY2UgaW5pdGlhbGl6YXRpb24gYW5kIHdoZW5ldmVyIGFuIGFsYnVtIGlzIGNoYW5nZWQuXG4gICAqIFRoaXMgbWV0aG9kIGlzIGFsc28gbmVlZGVkIGlmIHlvdSBtYW51YWxseSByZXBsYWNlIGFuIGluc3RhbmNlJ3MgYGxpYmAgbWVtYmVyXG4gICAqIHZpYSBgI3NldExpYmAsIGluIHdoaWNoIGNhc2UgeW91J2xsIG5lZWQgdG8gY2FsbCBgI3VwZGF0ZWAgZGlyZWN0bHkgYWZ0ZXJcbiAgICpcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXG4gICAqL1xuICB1cGRhdGUoKSB7XG4gICAgdGhpcy5hbGJ1bUluZGV4ID0gdGhpcy5hbGJ1bUluZGV4IHx8IHRoaXMuc2V0dGluZ3Muc3RhcnRpbmdBbGJ1bUluZGV4IHx8IDBcbiAgICB0aGlzLnRyYWNrSW5kZXggPSB0aGlzLnRyYWNrSW5kZXggfHwgdGhpcy5zZXR0aW5ncy5zdGFydGluZ1RyYWNrSW5kZXggfHwgMFxuICAgIHRoaXMuYWxidW1Db3VudCA9IHRoaXMubGliLmxlbmd0aFxuXG4gICAgY29uc3QgY3VycmVudExpYkl0ZW0gPSB0aGlzLmxpYlt0aGlzLmFsYnVtSW5kZXhdXG5cbiAgICBjb25zdCBrZXlzID0gWydhcnRpc3QnLCAnYWxidW0nLCAnZmlsZXMnLCAnY292ZXInLCAndHJhY2tsaXN0JywgJ3JlcGxhY2VtZW50J11cbiAgICBrZXlzLmZvckVhY2goa2V5ID0+IHRoaXNba2V5XSA9IGN1cnJlbnRMaWJJdGVtW2tleV0pXG5cblxuICAgIHRoaXMudHJhY2tDb3VudCA9IHRoaXMuZmlsZXMubGVuZ3RoXG5cbiAgICAvLyByZXBsYWNlbWVudCBpbiA9PT0gW3JlZ2V4cCBzdHJpbmcsIHJlcGxhY2VtZW50IHN0cmluZywgb3B0aW9uYWwgZmxhZ3NdXG4gICAgLy8gcmVwbGFjZW1lbnQgb3V0ID09PSBbcmVnZXhwIGluc3RhbmNlLCByZXBsYWNlbWVudF1cbiAgICBpZiAodGhpcy5yZXBsYWNlbWVudCkge1xuICAgICAgbGV0IHJlID0gdGhpcy5yZXBsYWNlbWVudFxuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShyZSkgJiYgcmVbMF0gaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgdGhpcy5yZXBsYWNlbWVudCA9IHJlXG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmUgPT09ICdzdHJpbmcnKSByZSA9IFtyZV1cblxuICAgICAgICAvLyByZSBtYXkgY29udGFpbiBzdHJpbmctd3JhcHBlZCByZWdleHAgKGZyb20ganNvbiksIGNvbnZlcnQgaWYgc29cbiAgICAgICAgcmVbMF0gPSBuZXcgUmVnRXhwKHJlWzBdLCByZVsyXSB8fCAnZycpXG4gICAgICAgIHJlWzFdID0gcmVbMV0gfHwgJydcblxuICAgICAgICB0aGlzLnJlcGxhY2VtZW50ID0gcmVcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9mb3JtYXRUcmFja2xpc3QoKVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZSBldmVyeSBwbHVnaW4ncyBjb250cnVjdG9yIHdpdGggdGhpcyBMYXAgaW5zdGFuY2VcbiAgICpcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWN0aXZhdGVQbHVnaW5zKCkge1xuICAgIHRoaXMucGx1Z2lucyA9IFtdXG4gICAgdGhpcy5zZXR0aW5ncy5wbHVnaW5zLmZvckVhY2goKHBsdWdpbiwgaSkgPT4gdGhpcy5wbHVnaW5zW2ldID0gbmV3IHBsdWdpbih0aGlzKSlcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXRBdWRpbygpIHtcbiAgICB0aGlzLmF1ZGlvID0gbmV3IEF1ZGlvKClcbiAgICB0aGlzLmF1ZGlvLnByZWxvYWQgPSAnYXV0bydcbiAgICBsZXQgZmlsZVR5cGUgPSB0aGlzLmZpbGVzW3RoaXMudHJhY2tJbmRleF1cbiAgICBmaWxlVHlwZSA9IGZpbGVUeXBlLnNsaWNlKGZpbGVUeXBlLmxhc3RJbmRleE9mKCcuJykrMSlcbiAgICBjb25zdCBjYW5QbGF5ID0gdGhpcy5hdWRpby5jYW5QbGF5VHlwZSgnYXVkaW8vJyArIGZpbGVUeXBlKVxuICAgIGlmIChjYW5QbGF5ID09PSAncHJvYmFibHknIHx8IGNhblBsYXkgPT09ICdtYXliZScpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZVNvdXJjZSgpXG4gICAgICB0aGlzLmF1ZGlvLnZvbHVtZSA9IDFcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETzogcmV0dXJuIGEgZmxhZyB0byBzaWduYWwgc2tpcHBpbmcgdGhlIHJlc3Qgb2YgdGhlIGluaXRpYWxpemF0aW9uIHByb2Nlc3NcbiAgICAgIGNvbnNvbGUud2FybihgVGhpcyBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgJHtmaWxlVHlwZX0gcGxheWJhY2suYClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF91cGRhdGVTb3VyY2UoKSB7XG4gICAgdGhpcy5hdWRpby5zcmMgPSB0aGlzLmZpbGVzW3RoaXMudHJhY2tJbmRleF1cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXRFbGVtZW50cygpIHtcbiAgICB0aGlzLmVscyA9IHt9XG4gICAgdGhpcy5zZWxlY3RvcnMgPSB7IHN0YXRlOiB7fSB9XG4gICAgTGFwLmVhY2goTGFwLl9kZWZhdWx0U2VsZWN0b3JzLCAoc2VsZWN0b3IsIGtleSkgPT4ge1xuICAgICAgaWYgKGtleSAhPT0gJ3N0YXRlJykge1xuXG4gICAgICAgIHRoaXMuc2VsZWN0b3JzW2tleV0gPSB0aGlzLnNldHRpbmdzLnNlbGVjdG9ycy5oYXNPd25Qcm9wZXJ0eShrZXkpXG4gICAgICAgICAgPyB0aGlzLnNldHRpbmdzLnNlbGVjdG9yc1trZXldXG4gICAgICAgICAgOiBzZWxlY3RvclxuXG4gICAgICAgIGNvbnN0IGVsID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3RoaXMuc2VsZWN0b3JzW2tleV19YClcbiAgICAgICAgaWYgKGVsKSB0aGlzLmVsc1trZXldID0gZWxcblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgaGFzQ3VzdG9tU3RhdGUgPSB0aGlzLnNldHRpbmdzLnNlbGVjdG9ycy5zdGF0ZVxuXG4gICAgICAgIGlmICghaGFzQ3VzdG9tU3RhdGUpIHJldHVybiAodGhpcy5zZWxlY3RvcnMuc3RhdGUgPSBMYXAuX2RlZmF1bHRTZWxlY3RvcnMuc3RhdGUpXG5cbiAgICAgICAgTGFwLmVhY2goTGFwLl9kZWZhdWx0U2VsZWN0b3JzLnN0YXRlLCAoc2VsLCBrKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RvcnMuc3RhdGVba10gPSB0aGlzLnNldHRpbmdzLnNlbGVjdG9ycy5zdGF0ZS5oYXNPd25Qcm9wZXJ0eShrKVxuICAgICAgICAgICAgPyB0aGlzLnNldHRpbmdzLnNlbGVjdG9ycy5zdGF0ZVtrXVxuICAgICAgICAgICAgOiBzZWxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEEgd3JhcHBlciBhcm91bmQgdGhpcyBMYXAgaW5zdGFuY2VzIGBhdWRpby5hZGRFdmVudExpc3RlbmVyYCB0aGF0XG4gICAqIGVuc3VyZXMgaGFuZGxlcnMgYXJlIGNhY2hlZCBmb3IgbGF0ZXIgcmVtb3ZhbCB2aWEgYExhcC5kZXN0cm95KGluc3RhbmNlKWAgY2FsbFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBldmVudCAgICAgICBBdWRpbyBFdmVudCBuYW1lXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyICAgIGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKi9cbiAgYWRkQXVkaW9MaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpIHtcbiAgICB0aGlzLl9hdWRpb0xpc3RlbmVycyA9IHRoaXMuX2F1ZGlvTGlzdGVuZXJzIHx8IHt9XG4gICAgdGhpcy5fYXVkaW9MaXN0ZW5lcnNbZXZlbnRdID0gdGhpcy5fYXVkaW9MaXN0ZW5lcnNbZXZlbnRdIHx8IFtdXG5cbiAgICBjb25zdCBib3VuZCA9IGxpc3RlbmVyLmJpbmQodGhpcylcbiAgICB0aGlzLl9hdWRpb0xpc3RlbmVyc1tldmVudF0ucHVzaChib3VuZClcbiAgICB0aGlzLmF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGJvdW5kKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkQXVkaW9MaXN0ZW5lcnMoKSB7XG4gICAgY29uc3QgYXVkaW8gPSB0aGlzLmF1ZGlvXG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcbiAgICBjb25zdCBuYXRpdmVQcm9ncmVzcyA9ICEhKHRoaXMuc2V0dGluZ3MudXNlTmF0aXZlUHJvZ3Jlc3MgJiYgZWxzLnByb2dyZXNzKVxuXG4gICAgY29uc3QgX2FkZExpc3RlbmVyID0gKGNvbmRpdGlvbiwgZXZlbnQsIGxpc3RlbmVyKSA9PiB7XG4gICAgICBpZiAoY29uZGl0aW9uKSB0aGlzLmFkZEF1ZGlvTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKVxuICAgIH1cblxuICAgIF9hZGRMaXN0ZW5lcighIShlbHMuYnVmZmVyZWQgfHwgbmF0aXZlUHJvZ3Jlc3MpLCAncHJvZ3Jlc3MnLCAoKSA9PiB7XG4gICAgICB2YXIgYnVmZmVyZWQgPSB0aGlzLl9idWZmZXJGb3JtYXR0ZWQoKVxuICAgICAgaWYgKGVscy5idWZmZXJlZCkgZWxzLmJ1ZmZlcmVkLmlubmVySFRNTCA9IGJ1ZmZlcmVkXG4gICAgICBpZiAobmF0aXZlUHJvZ3Jlc3MpIGVscy5wcm9ncmVzcy52YWx1ZSA9IGJ1ZmZlcmVkXG4gICAgfSlcblxuICAgIF9hZGRMaXN0ZW5lcighIWVscy5jdXJyZW50VGltZSwgJ3RpbWV1cGRhdGUnLCAoKSA9PiB0aGlzLl91cGRhdGVDdXJyZW50VGltZUVsKCkpXG4gICAgX2FkZExpc3RlbmVyKCEhZWxzLmR1cmF0aW9uLCAnZHVyYXRpb25jaGFuZ2UnLCAoKSA9PiB0aGlzLl91cGRhdGVEdXJhdGlvbkVsKCkpXG5cbiAgICBfYWRkTGlzdGVuZXIodHJ1ZSwgJ2VuZGVkJywgKCkgPT4ge1xuICAgICAgaWYgKHRoaXMucGxheWluZykge1xuICAgICAgICB0aGlzLm5leHQoKVxuICAgICAgICBhdWRpby5wbGF5KClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHdyYXBwZXIgYXJvdW5kIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciB3aGljaCBlbnN1cmVzIGxpc3RuZXJzXG4gICAqIGFyZSBjYWNoZWQgZm9yIGxhdGVyIHJlbW92YWwgdmlhIGBMYXAuZGVzdHJveShpbnN0YW5jZSlgIGNhbGxcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgZWxlbWVudE5hbWUgTGFwI2VscyBlbGVtZW50a2V5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIGV2ZW50ICAgICAgIERPTSBFdmVudCBuYW1lXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyICAgIGNhbGxiYWNrXG4gICAqL1xuICBhZGRMaXN0ZW5lcihlbGVtZW50TmFtZSwgZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgLy8gYnlwYXNzIG5vbi1leGlzdGVudCBlbGVtZW50c1xuICAgIGlmICghdGhpcy5lbHNbZWxlbWVudE5hbWVdKSByZXR1cm4gdGhpc1xuXG4gICAgLy8gaWUuIGxpc3RlbmVycyA9IHsgc2Vla1JhbmdlOiB7IGNsaWNrOiBbaGFuZGxlcnNdLCBtb3VzZWRvd246IFtoYW5kbGVyc10sIC4uLiB9LCAuLi4gfVxuICAgIHRoaXMuX2xpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycyB8fCB7fVxuICAgIHRoaXMuX2xpc3RlbmVyc1tlbGVtZW50TmFtZV0gPSB0aGlzLl9saXN0ZW5lcnNbZWxlbWVudE5hbWVdIHx8IHt9XG4gICAgdGhpcy5fbGlzdGVuZXJzW2VsZW1lbnROYW1lXVtldmVudF0gPSB0aGlzLl9saXN0ZW5lcnNbZWxlbWVudE5hbWVdW2V2ZW50XSB8fCBbXVxuXG4gICAgY29uc3QgYm91bmQgPSBsaXN0ZW5lci5iaW5kKHRoaXMpXG4gICAgdGhpcy5fbGlzdGVuZXJzW2VsZW1lbnROYW1lXVtldmVudF0ucHVzaChib3VuZClcbiAgICB0aGlzLmVsc1tlbGVtZW50TmFtZV0uYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgYm91bmQpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9hZGRMaXN0ZW5lcnMoKSB7XG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcblxuICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3BsYXlQYXVzZScsICdjbGljaycsIHRoaXMudG9nZ2xlUGxheSlcbiAgICB0aGlzLmFkZExpc3RlbmVyKCdwcmV2JywgJ2NsaWNrJywgdGhpcy5wcmV2KVxuICAgIHRoaXMuYWRkTGlzdGVuZXIoJ25leHQnLCAnY2xpY2snLCB0aGlzLm5leHQpXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigncHJldkFsYnVtJywgJ2NsaWNrJywgdGhpcy5wcmV2QWxidW0pXG4gICAgdGhpcy5hZGRMaXN0ZW5lcignbmV4dEFsYnVtJywgJ2NsaWNrJywgdGhpcy5uZXh0QWxidW0pXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lVXAnLCAnY2xpY2snLCB0aGlzLl9pbmNWb2x1bWUpXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lRG93bicsICdjbGljaycsIHRoaXMuX2RlY1ZvbHVtZSlcblxuICAgIGNvbnN0IF9pZiA9IChlbGVtZW50TmFtZSwgZm4pID0+IHtcbiAgICAgIGlmICh0aGlzLmVsc1tlbGVtZW50TmFtZV0pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aGlzW2ZuXSgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gYW5vbnltb3VzXG4gICAgICAgICAgZm4oKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5vbignbG9hZCcsICgpID0+IHtcbiAgICAgIF9pZigndHJhY2tUaXRsZScsICdfdXBkYXRlVHJhY2tUaXRsZUVsJylcbiAgICAgIF9pZigndHJhY2tOdW1iZXInLCAnX3VwZGF0ZVRyYWNrTnVtYmVyRWwnKVxuICAgICAgX2lmKCdhcnRpc3QnLCAnX3VwZGF0ZUFydGlzdEVsJylcbiAgICAgIF9pZignYWxidW0nLCAnX3VwZGF0ZUFsYnVtRWwnKVxuICAgICAgX2lmKCdjb3ZlcicsICdfdXBkYXRlQ292ZXInKVxuICAgICAgX2lmKCdjdXJyZW50VGltZScsICdfdXBkYXRlQ3VycmVudFRpbWVFbCcpXG4gICAgICBfaWYoJ2R1cmF0aW9uJywgJ191cGRhdGVEdXJhdGlvbkVsJylcbiAgICAgIF9pZigncGxheVBhdXNlJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBzID0gdGhpcy5zZWxlY3RvcnMuc3RhdGVcbiAgICAgICAgY29uc3QgcHAgPSBlbHMucGxheVBhdXNlXG4gICAgICAgIExhcC5hZGRDbGFzcyhwcCwgcy5wYXVzZWQpXG4gICAgICAgIHRoaXMub24oJ3BsYXknLCAoKSA9PiBMYXAucmVtb3ZlQ2xhc3MocHAsIHMucGF1c2VkKS5hZGRDbGFzcyhwcCwgcy5wbGF5aW5nKSlcbiAgICAgICAgdGhpcy5vbigncGF1c2UnLCAoKSA9PiBMYXAucmVtb3ZlQ2xhc3MocHAsIHMucGxheWluZykuYWRkQ2xhc3MocHAsIHMucGF1c2VkKSlcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIHRoaXMub24oJ3RyYWNrQ2hhbmdlJywgKCkgPT4ge1xuICAgICAgX2lmKCd0cmFja1RpdGxlJywgJ191cGRhdGVUcmFja1RpdGxlRWwnKVxuICAgICAgX2lmKCd0cmFja051bWJlcicsICdfdXBkYXRlVHJhY2tOdW1iZXJFbCcpXG4gICAgICBfaWYoJ2N1cnJlbnRUaW1lJywgJ191cGRhdGVDdXJyZW50VGltZUVsJylcbiAgICAgIF9pZignZHVyYXRpb24nLCAnX3VwZGF0ZUR1cmF0aW9uRWwnKVxuICAgIH0pXG5cbiAgICB0aGlzLm9uKCdhbGJ1bUNoYW5nZScsICgpID0+IHtcbiAgICAgIF9pZigndHJhY2tUaXRsZScsICdfdXBkYXRlVHJhY2tUaXRsZUVsJylcbiAgICAgIF9pZigndHJhY2tOdW1iZXInLCAnX3VwZGF0ZVRyYWNrTnVtYmVyRWwnKVxuICAgICAgX2lmKCdhcnRpc3QnLCAnX3VwZGF0ZUFydGlzdEVsJylcbiAgICAgIF9pZignYWxidW0nLCAnX3VwZGF0ZUFsYnVtRWwnKVxuICAgICAgX2lmKCdjb3ZlcicsICdfdXBkYXRlQ292ZXInKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkU2Vla0xpc3RlbmVycygpIHtcbiAgICBjb25zdCBlbHMgPSB0aGlzLmVsc1xuICAgIGNvbnN0IHNlZWtSYW5nZSA9IGVscy5zZWVrUmFuZ2VcbiAgICBjb25zdCBhdWRpbyA9IHRoaXMuYXVkaW9cbiAgICBjb25zdCB1c2VOYXRpdmUgPSAhISh0aGlzLnNldHRpbmdzLnVzZU5hdGl2ZVNlZWtSYW5nZSAmJiBzZWVrUmFuZ2UpXG5cbiAgICBpZiAodXNlTmF0aXZlKSB7XG4gICAgICB0aGlzLmFkZEF1ZGlvTGlzdGVuZXIoJ3RpbWV1cGRhdGUnLCAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5zZWVraW5nKSB7XG4gICAgICAgICAgc2Vla1JhbmdlLnZhbHVlID0gTGFwLnNjYWxlKFxuICAgICAgICAgICAgYXVkaW8uY3VycmVudFRpbWUsIDAsIGF1ZGlvLmR1cmF0aW9uLCAwLCAxMDApXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCdzZWVrUmFuZ2UnLCAnaW5wdXQnLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2Vla2luZyA9IHRydWVcbiAgICAgICAgYXVkaW8uY3VycmVudFRpbWUgPSBMYXAuc2NhbGUoXG4gICAgICAgICAgc2Vla1JhbmdlLnZhbHVlLCAwLCBzZWVrUmFuZ2UubWF4LCAwLCBhdWRpby5kdXJhdGlvbilcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdzZWVrJylcbiAgICAgICAgdGhpcy5zZWVraW5nID0gZmFsc2VcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3QgbWF5YmVXYXJuID0gKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZGVidWcgJiYgc2Vla1JhbmdlKSB7XG4gICAgICAgIGNvbnN0IGMgPSAnY29sb3I6ZGFya2dyZWVuO2ZvbnQtZmFtaWx5Om1vbm9zcGFjZSdcbiAgICAgICAgY29uc3QgciA9ICdjb2xvcjppbmhlcml0J1xuICAgICAgICBjb25zb2xlLndhcm4oYFxuICAgICAgICAgICVjTGFwKCVzKSBbREVCVUddOlxuICAgICAgICAgICVjU2ltdWx0YW5lb3VzIHVzZSBvZiAlY0xhcCNlbHMuc2Vla1JhbmdlJWMgYW5kXG4gICAgICAgICAgJWNMYXAjZWxzLnNlZWtGb3J3YXJkfHNlZWtCYWNrd2FyZCVjIGlzIHJlZHVuZGFudC5cbiAgICAgICAgICBDb25zaWRlciBjaG9vc2luZyBvbmUgb3IgdGhlIG90aGVyLlxuICAgICAgICAgIGAuc3BsaXQoJ1xcbicpLm1hcChzID0+IHMudHJpbSgpKS5qb2luKCcgJyksXG4gICAgICAgICAgTGFwLl9kZWJ1Z1NpZ25hdHVyZSwgdGhpcy5pZCwgciwgYywgciwgYywgclxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGVscy5zZWVrRm9yd2FyZCkge1xuICAgICAgbWF5YmVXYXJuKClcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3NlZWtGb3J3YXJkJywgJ21vdXNlZG93bicsICgpID0+IHtcbiAgICAgICAgdGhpcy5zZWVraW5nID0gdHJ1ZVxuICAgICAgICB0aGlzLl9zZWVrRm9yd2FyZCgpXG4gICAgICB9KVxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcignc2Vla0ZvcndhcmQnLCAnbW91c2V1cCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5zZWVraW5nID0gZmFsc2VcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMubW91c2VEb3duVGltZXIpXG4gICAgICAgIHRoaXMudHJpZ2dlcignc2VlaycpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChlbHMuc2Vla0JhY2t3YXJkKSB7XG4gICAgICBtYXliZVdhcm4oKVxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcignc2Vla0JhY2t3YXJkJywgJ21vdXNlZG93bicsICgpID0+IHtcbiAgICAgICAgdGhpcy5zZWVraW5nID0gdHJ1ZVxuICAgICAgICB0aGlzLl9zZWVrQmFja3dhcmQoKVxuICAgICAgfSlcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3NlZWtCYWNrd2FyZCcsICdtb3VzZXVwJywgKCkgPT4ge1xuICAgICAgICB0aGlzLnNlZWtpbmcgPSBmYWxzZVxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5tb3VzZURvd25UaW1lcilcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdzZWVrJylcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgX3NlZWtCYWNrd2FyZCgpIHtcbiAgICBpZiAoIXRoaXMuc2Vla2luZykgcmV0dXJuIHRoaXNcbiAgICB0aGlzLm1vdXNlRG93blRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgY29uc3QgeCA9IHRoaXMuYXVkaW8uY3VycmVudFRpbWUgKyAodGhpcy5zZXR0aW5ncy5zZWVrSW50ZXJ2YWwgKiAtMSlcbiAgICAgIHRoaXMuYXVkaW8uY3VycmVudFRpbWUgPSB4IDwgMCA/IDAgOiB4XG4gICAgfSwgdGhpcy5zZXR0aW5ncy5zZWVrVGltZSlcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX3NlZWtGb3J3YXJkKCkge1xuICAgIGlmICghdGhpcy5zZWVraW5nKSByZXR1cm4gdGhpc1xuICAgIHRoaXMubW91c2VEb3duVGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBjb25zdCB4ID0gdGhpcy5hdWRpby5jdXJyZW50VGltZSArIHRoaXMuc2V0dGluZ3Muc2Vla0ludGVydmFsXG4gICAgICB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lID0geCA+IHRoaXMuYXVkaW8uZHVyYXRpb24gPyB0aGlzLmF1ZGlvLmR1cmF0aW9uIDogeFxuICAgIH0sIHRoaXMuc2V0dGluZ3Muc2Vla1RpbWUpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIF9hZGRWb2x1bWVMaXN0ZW5lcnMoKSB7XG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcbiAgICBjb25zdCB2b2x1bWVSYW5nZSA9IGVscy52b2x1bWVSYW5nZVxuICAgIGNvbnN0IHZvbHVtZVJlYWQgPSBlbHMudm9sdW1lUmVhZFxuICAgIGNvbnN0IHZvbHVtZVVwID0gZWxzLnZvbHVtZVVwXG4gICAgY29uc3Qgdm9sdW1lRG93biA9IGVscy52b2x1bWVEb3duXG5cbiAgICBpZiAodm9sdW1lUmVhZCkge1xuICAgICAgY29uc3QgZm4gPSAoKSA9PiB2b2x1bWVSZWFkLmlubmVySFRNTCA9IE1hdGgucm91bmQodGhpcy5hdWRpby52b2x1bWUqMTAwKVxuICAgICAgdGhpcy5vbigndm9sdW1lQ2hhbmdlJywgZm4pXG4gICAgICBmbigpXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MudXNlTmF0aXZlVm9sdW1lUmFuZ2UgJiYgdm9sdW1lUmFuZ2UpIHtcblxuICAgICAgY29uc3QgZm4gPSAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy52b2x1bWVDaGFuZ2luZykgdm9sdW1lUmFuZ2UudmFsdWUgPSBNYXRoLnJvdW5kKHRoaXMuYXVkaW8udm9sdW1lKjEwMClcbiAgICAgIH1cbiAgICAgIHRoaXMuYWRkQXVkaW9MaXN0ZW5lcigndm9sdW1lY2hhbmdlJywgZm4pXG4gICAgICB0aGlzLm9uKCdsb2FkJywgZm4pXG5cbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3ZvbHVtZVJhbmdlJywgJ21vdXNlZG93bicsICgpID0+IHRoaXMudm9sdW1lQ2hhbmdpbmcgPSB0cnVlKVxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lUmFuZ2UnLCAnbW91c2V1cCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5hdWRpby52b2x1bWUgPSB2b2x1bWVSYW5nZS52YWx1ZSAqIDAuMDFcbiAgICAgICAgdGhpcy50cmlnZ2VyKCd2b2x1bWVDaGFuZ2UnKVxuICAgICAgICB0aGlzLnZvbHVtZUNoYW5naW5nID0gZmFsc2VcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3QgbWF5YmVXYXJuID0gKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZGVidWcgJiYgdm9sdW1lUmFuZ2UpIHtcbiAgICAgICAgY29uc3QgYyA9ICdjb2xvcjpkYXJrZ3JlZW47Zm9udC1mYW1pbHk6bW9ub3NwYWNlJ1xuICAgICAgICBjb25zdCByID0gJ2NvbG9yOmluaGVyaXQnXG4gICAgICAgIGNvbnNvbGUud2FybihgXG4gICAgICAgICAgJWNMYXAoJXMpIFtERUJVR106XG4gICAgICAgICAgJWNTaW11bHRhbmVvdXMgdXNlIG9mICVjTGFwI2Vscy52b2x1bWVSYW5nZSVjIGFuZFxuICAgICAgICAgICVjTGFwI2Vscy52b2x1bWVVcHx2b2x1bWVEb3duJWMgaXMgcmVkdW5kYW50LlxuICAgICAgICAgIENvbnNpZGVyIGNob29zaW5nIG9uZSBvciB0aGUgb3RoZXIuXG4gICAgICAgICAgYC5zcGxpdCgnXFxuJykubWFwKHMgPT4gcy50cmltKCkpLmpvaW4oJyAnKSxcbiAgICAgICAgICBMYXAuX2RlYnVnU2lnbmF0dXJlLCB0aGlzLmlkLCByLCBjLCByLCBjLCByXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodm9sdW1lVXApIHtcbiAgICAgIG1heWJlV2FybigpXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCd2b2x1bWVVcCcsICdjbGljaycsICgpID0+IHRoaXMuX2luY1ZvbHVtZSgpKVxuICAgIH1cbiAgICBpZiAodm9sdW1lRG93bikge1xuICAgICAgbWF5YmVXYXJuKClcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3ZvbHVtZURvd24nLCAnY2xpY2snLCAoKSA9PiB0aGlzLl9kZWNWb2x1bWUoKSlcbiAgICB9XG4gIH1cblxuICBfaW5jVm9sdW1lKCkge1xuICAgIGNvbnN0IHYgPSB0aGlzLmF1ZGlvLnZvbHVtZVxuICAgIGNvbnN0IGkgPSB0aGlzLnNldHRpbmdzLnZvbHVtZUludGVydmFsXG4gICAgdGhpcy5hdWRpby52b2x1bWUgPSB2K2kgPiAxID8gMSA6IHYraVxuICAgIHRoaXMudHJpZ2dlcigndm9sdW1lQ2hhbmdlJylcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX2RlY1ZvbHVtZSgpIHtcbiAgICBjb25zdCB2ID0gdGhpcy5hdWRpby52b2x1bWVcbiAgICBjb25zdCBpID0gdGhpcy5zZXR0aW5ncy52b2x1bWVJbnRlcnZhbFxuICAgIHRoaXMuYXVkaW8udm9sdW1lID0gdi1pIDwgMCA/IDAgOiB2LWlcbiAgICB0aGlzLnRyaWdnZXIoJ3ZvbHVtZUNoYW5nZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIF91cGRhdGVDdXJyZW50VGltZUVsKCkge1xuICAgIHRoaXMuZWxzLmN1cnJlbnRUaW1lLmlubmVySFRNTCA9IHRoaXMuX2N1cnJlbnRUaW1lRm9ybWF0dGVkKClcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX3VwZGF0ZUR1cmF0aW9uRWwoKSB7XG4gICAgdGhpcy5lbHMuZHVyYXRpb24uaW5uZXJIVE1MID0gdGhpcy5fZHVyYXRpb25Gb3JtYXR0ZWQoKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfdXBkYXRlVHJhY2tUaXRsZUVsKCkge1xuICAgIHRoaXMuZWxzLnRyYWNrVGl0bGUuaW5uZXJIVE1MID0gdGhpcy50cmFja2xpc3RbdGhpcy50cmFja0luZGV4XVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfdXBkYXRlVHJhY2tOdW1iZXJFbCgpIHtcbiAgICB0aGlzLmVscy50cmFja051bWJlci5pbm5lckhUTUwgPSArdGhpcy50cmFja0luZGV4KzFcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX3VwZGF0ZUFydGlzdEVsKCkge1xuICAgIHRoaXMuZWxzLmFydGlzdC5pbm5lckhUTUwgPSB0aGlzLmFydGlzdFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfdXBkYXRlQWxidW1FbCgpIHtcbiAgICB0aGlzLmVscy5hbGJ1bS5pbm5lckhUTUwgPSB0aGlzLmFsYnVtXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIF91cGRhdGVDb3ZlcigpIHtcbiAgICB0aGlzLmVscy5jb3Zlci5zcmMgPSB0aGlzLmNvdmVyXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHRvZ2dsZVBsYXkoKSB7XG4gICAgdGhpcy5hdWRpby5wYXVzZWQgPyB0aGlzLnBsYXkoKSA6IHRoaXMucGF1c2UoKVxuICAgIHRoaXMudHJpZ2dlcigndG9nZ2xlUGxheScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHBsYXkoKSB7XG4gICAgaWYgKExhcC5leGNsdXNpdmVNb2RlKSBMYXAuZWFjaChMYXAuX2luc3RhbmNlcywgaW5zdGFuY2UgPT4gaW5zdGFuY2UucGF1c2UoKSlcbiAgICB0aGlzLmF1ZGlvLnBsYXkoKVxuICAgIHRoaXMucGxheWluZyA9IHRydWVcbiAgICB0aGlzLnRyaWdnZXIoJ3BsYXknKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBwYXVzZSgpIHtcbiAgICB0aGlzLmF1ZGlvLnBhdXNlKClcbiAgICB0aGlzLnBsYXlpbmcgPSBmYWxzZVxuICAgIHRoaXMudHJpZ2dlcigncGF1c2UnKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBzZXRUcmFjayhpbmRleCkge1xuICAgIGlmIChpbmRleCA8PSAwKSB7XG4gICAgICB0aGlzLnRyYWNrSW5kZXggPSAwXG4gICAgfSBlbHNlIGlmIChpbmRleCA+PSB0aGlzLnRyYWNrQ291bnQpIHtcbiAgICAgIHRoaXMudHJhY2tJbmRleCA9IHRoaXMudHJhY2tDb3VudC0xXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudHJhY2tJbmRleCA9IGluZGV4XG4gICAgfVxuICAgIGNvbnN0IHdhc1BsYXlpbmcgPSAhdGhpcy5hdWRpby5wYXVzZWRcbiAgICB0aGlzLl91cGRhdGVTb3VyY2UoKVxuICAgIGlmICh3YXNQbGF5aW5nKSB0aGlzLmF1ZGlvLnBsYXkoKVxuICAgIHRoaXMudHJpZ2dlcigndHJhY2tDaGFuZ2UnKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBwcmV2KCkge1xuICAgIGNvbnN0IHdhc1BsYXlpbmcgPSAhdGhpcy5hdWRpby5wYXVzZWRcbiAgICB0aGlzLnRyYWNrSW5kZXggPSAodGhpcy50cmFja0luZGV4LTEgPCAwKSA/IHRoaXMudHJhY2tDb3VudC0xIDogdGhpcy50cmFja0luZGV4LTFcbiAgICB0aGlzLl91cGRhdGVTb3VyY2UoKVxuICAgIGlmICh3YXNQbGF5aW5nKSB0aGlzLmF1ZGlvLnBsYXkoKVxuICAgIHRoaXMudHJpZ2dlcigndHJhY2tDaGFuZ2UnKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBuZXh0KCkge1xuICAgIGNvbnN0IHdhc1BsYXlpbmcgPSAhdGhpcy5hdWRpby5wYXVzZWRcbiAgICB0aGlzLnRyYWNrSW5kZXggPSAodGhpcy50cmFja0luZGV4KzEgPj0gdGhpcy50cmFja0NvdW50KSA/IDAgOiB0aGlzLnRyYWNrSW5kZXgrMVxuICAgIHRoaXMuX3VwZGF0ZVNvdXJjZSgpXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXG4gICAgdGhpcy50cmlnZ2VyKCd0cmFja0NoYW5nZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHByZXZBbGJ1bSgpIHtcbiAgICBjb25zdCB3YXNQbGF5aW5nID0gIXRoaXMuYXVkaW8ucGF1c2VkXG4gICAgdGhpcy5hbGJ1bUluZGV4ID0gKHRoaXMuYWxidW1JbmRleC0xIDwgMCkgPyB0aGlzLmFsYnVtQ291bnQtMSA6IHRoaXMuYWxidW1JbmRleC0xXG4gICAgdGhpcy51cGRhdGUoKVxuICAgIHRoaXMudHJhY2tJbmRleCA9IDBcbiAgICB0aGlzLl91cGRhdGVTb3VyY2UoKVxuICAgIGlmICh3YXNQbGF5aW5nKSB0aGlzLmF1ZGlvLnBsYXkoKVxuICAgIHRoaXMudHJpZ2dlcignYWxidW1DaGFuZ2UnKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBuZXh0QWxidW0oKSB7XG4gICAgY29uc3Qgd2FzUGxheWluZz0gIXRoaXMuYXVkaW8ucGF1c2VkXG4gICAgdGhpcy5hbGJ1bUluZGV4ID0gKHRoaXMuYWxidW1JbmRleCsxID4gdGhpcy5hbGJ1bUNvdW50LTEpID8gMCA6IHRoaXMuYWxidW1JbmRleCsxXG4gICAgdGhpcy51cGRhdGUoKVxuICAgIHRoaXMudHJhY2tJbmRleCA9IDBcbiAgICB0aGlzLl91cGRhdGVTb3VyY2UoKVxuICAgIGlmICh3YXNQbGF5aW5nKSB0aGlzLmF1ZGlvLnBsYXkoKVxuICAgIHRoaXMudHJpZ2dlcignYWxidW1DaGFuZ2UnKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBzZXRBbGJ1bShpbmRleCkge1xuICAgIGlmIChpbmRleCA8PSAwKSB7XG4gICAgICB0aGlzLmFsYnVtSW5kZXggPSAwXG4gICAgfSBlbHNlIGlmIChpbmRleCA+PSB0aGlzLmFsYnVtQ291bnQpIHtcbiAgICAgIHRoaXMuYWxidW1JbmRleCA9IHRoaXMuYWxidW1Db3VudC0xXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYWxidW1JbmRleCA9IGluZGV4XG4gICAgfVxuICAgIHRoaXMudXBkYXRlKClcbiAgICB0aGlzLnNldFRyYWNrKHRoaXMubGliW3RoaXMuYWxidW1JbmRleF0uc3RhcnRpbmdUcmFja0luZGV4IHx8IDApXG4gICAgdGhpcy50cmlnZ2VyKCdhbGJ1bUNoYW5nZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIF9mb3JtYXRUcmFja2xpc3QoKSB7XG4gICAgaWYgKHRoaXMudHJhY2tsaXN0ICYmIHRoaXMudHJhY2tsaXN0Lmxlbmd0aCkgcmV0dXJuIHRoaXNcblxuICAgIGNvbnN0IHJlID0gdGhpcy5yZXBsYWNlbWVudFxuICAgIGNvbnN0IHRyYWNrbGlzdCA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnRyYWNrQ291bnQ7IGkrKykge1xuICAgICAgbGV0IHQgPSB0aGlzLmZpbGVzW2ldXG4gICAgICAvLyBzdHJpcCBleHRcbiAgICAgIHQgPSB0LnNsaWNlKDAsIHQubGFzdEluZGV4T2YoJy4nKSlcbiAgICAgIC8vIGdldCBsYXN0IHBhdGggc2VnbWVudFxuICAgICAgdCA9IHQuc2xpY2UodC5sYXN0SW5kZXhPZignLycpKzEpXG4gICAgICBpZiAocmUpIHQgPSB0LnJlcGxhY2UocmVbMF0sIHJlWzFdKVxuICAgICAgdHJhY2tsaXN0W2ldID0gdC50cmltKClcbiAgICB9XG4gICAgdGhpcy50cmFja2xpc3QgPSB0cmFja2xpc3RcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX2J1ZmZlckZvcm1hdHRlZCgpIHtcbiAgICBpZiAoIXRoaXMuYXVkaW8pIHJldHVybiAwXG5cbiAgICBjb25zdCBhdWRpbyA9IHRoaXMuYXVkaW9cbiAgICBsZXQgYnVmZmVyZWRcblxuICAgIHRyeSB7XG4gICAgICBidWZmZXJlZCA9IGF1ZGlvLmJ1ZmZlcmVkLmVuZChhdWRpby5idWZmZXJlZC5sZW5ndGgtMSlcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIHJldHVybiAwXG4gICAgfVxuXG4gICAgY29uc3QgZm9ybWF0dGVkID0gTWF0aC5yb3VuZCgoYnVmZmVyZWQvYXVkaW8uZHVyYXRpb24pKjEwMClcbiAgICAvLyB2YXIgZm9ybWF0dGVkID0gTWF0aC5yb3VuZChfLnNjYWxlKGJ1ZmZlcmVkLCAwLCBhdWRpby5kdXJhdGlvbiwgMCwgMTAwKSlcbiAgICByZXR1cm4gaXNOYU4oZm9ybWF0dGVkKSA/IDAgOiBmb3JtYXR0ZWRcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9nZXRBdWRpb1RpbWVGb3JtYXR0ZWQoYXVkaW9Qcm9wKSB7XG4gICAgaWYgKGlzTmFOKHRoaXMuYXVkaW8uZHVyYXRpb24pKSByZXR1cm4gJzAwOjAwJ1xuICAgIGxldCBmb3JtYXR0ZWQgPSBMYXAuZm9ybWF0VGltZShNYXRoLmZsb29yKHRoaXMuYXVkaW9bYXVkaW9Qcm9wXS50b0ZpeGVkKDEpKSlcbiAgICBpZiAodGhpcy5hdWRpby5kdXJhdGlvbiA8IDM2MDAgfHwgZm9ybWF0dGVkID09PSAnMDA6MDA6MDAnKSB7XG4gICAgICBmb3JtYXR0ZWQgPSBmb3JtYXR0ZWQuc2xpY2UoMykgLy8gbm46bm5cbiAgICB9XG4gICAgcmV0dXJuIGZvcm1hdHRlZFxuICB9XG5cbiAgX2N1cnJlbnRUaW1lRm9ybWF0dGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9nZXRBdWRpb1RpbWVGb3JtYXR0ZWQoJ2N1cnJlbnRUaW1lJylcbiAgfVxuXG4gIF9kdXJhdGlvbkZvcm1hdHRlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0QXVkaW9UaW1lRm9ybWF0dGVkKCdkdXJhdGlvbicpXG4gIH1cblxuICB0cmFja051bWJlckZvcm1hdHRlZChuKSB7XG4gICAgdmFyIGNvdW50ID0gU3RyaW5nKHRoaXMudHJhY2tDb3VudCkubGVuZ3RoIC0gU3RyaW5nKG4pLmxlbmd0aFxuICAgIHJldHVybiAnMCcucmVwZWF0KGNvdW50KSArIG4gKyB0aGlzLnNldHRpbmdzLnRyYWNrTnVtYmVyUG9zdGZpeFxuICB9XG5cbiAgZ2V0KGtleSwgaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy5saWJbaW5kZXggPT09IHVuZGVmaW5lZCA/IHRoaXMuYWxidW1JbmRleCA6IGluZGV4XVtrZXldXG4gIH1cbn1cblxuLyoqXG4gKiBJZiBzZXQgdHJ1ZSwgb25seSBvbmUgTGFwIGNhbiBiZSBwbGF5aW5nIGF0IGEgZ2l2ZW4gdGltZVxuICogQHR5cGUge0Jvb2xlYW59XG4gKi9cbkxhcC5leGNsdXNpdmVNb2RlID0gZmFsc2VcblxuLyoqXG4gKiBjb25zb2xlIGZvcm1hdCBwcmVmaXggdXNlZCB3aGVuIExhcCNzZXR0aW5ncy5kZWJ1Z2RlYnVnPXRydWVcbiAqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGUge1N0cmluZ31cbiAqL1xuTGFwLl9kZWJ1Z1NpZ25hdHVyZSA9ICdjb2xvcjp0ZWFsO2ZvbnQtd2VpZ2h0OmJvbGQnXG5cbi8qKlxuICogTGFwIGluc3RhbmNlIGNhY2hlXG4gKlxuICogQHByaXZhdGVcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbkxhcC5faW5zdGFuY2VzID0ge31cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGUge1JlZ0V4cH1cbiAqL1xuTGFwLl9hdWRpb0V4dGVuc2lvblJlZ0V4cCA9IC9tcDN8d2F2fG9nZ3xhaWZmL2lcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGUge09iamVjdH1cbiAqL1xuTGFwLl9kZWZhdWx0U2V0dGluZ3MgPSB7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGNhbGxiYWNrcyBmb3IgYW55IGN1c3RvbSBMYXAgZXZlbnQsIHdoZXJlIHRoZSBvYmplY3Qga2V5XG4gICAqIGlzIHRoZSBldmVudCBuYW1lLCBhbmQgdGhlIHZhbHVlIGlzIHRoZSBjYWxsYmFjay4gQ3VycmVudCBsaXN0IG9mXG4gICAqIGN1c3RvbSBldmVudHMgdGhhdCBhcmUgZmlyZWQgaW5jbHVkZTpcbiAgICpcbiAgICogKyBsb2FkXG4gICAqICsgcGxheVxuICAgKiArIHBhdXNlXG4gICAqICsgdG9nZ2xlUGxheVxuICAgKiArIHNlZWtcbiAgICogKyB0cmFja0NoYW5nZVxuICAgKiArIGFsYnVtQ2hhbmdlXG4gICAqICsgdm9sdW1lQ2hhbmdlXG4gICAqXG4gICAqIFRoZXNlIGV2ZW50cyBhcmUgZmlyZWQgYXQgdGhlIGVuZCBvZiB0aGVpciByZXNwZWN0aXZlXG4gICAqIERPTSBhbmQgQXVkaW8gZXZlbnQgbGlmZWN5Y2xlcywgYXMgd2VsbCBhcyBMYXAgbG9naWMgYXR0YWNoZWQgdG8gdGhvc2UuIEZvciBleGFtcGxlIHdoZW5cbiAgICogTGFwI2Vscy5wbGF5UGF1c2UgaXMgY2xpY2tlZCB3aGVuIGluaXRpYWxseSBwYXVzZWQsIHRoZSBET00gZXZlbnQgaXMgZmlyZWQsIEF1ZGlvIHdpbGwgYmVnaW4gcGxheWluZyxcbiAgICogTGFwIHdpbGwgcmVtb3ZlIHRoZSBsYXAtLXBhdXNlZCBjbGFzcyBhbmQgYWRkIHRoZSBsYXAtLXBsYXlpbmcgY2xhc3MgdG8gdGhlIGVsZW1lbnQsIGFuZCBmaW5hbGx5XG4gICAqIHRoZSBjdXN0b20gJ3BsYXknIGV2ZW50IGlzIHRyaWdnZXJlZC4gTm90ZSBhbHNvIHRoYXQgeW91IGNhbiBzdWJzY3JpYmUgdG8gYW55IGN1c3RvbSBldmVudFxuICAgKiB2aWEgYExhcCNvbihldmVudCwgY2FsbGJhY2spYFxuICAgKlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgY2FsbGJhY2tzOiB7fSxcblxuICAvKipcbiAgICogV2hlbiB0cnVlLCBvdXRwdXRzIGJhc2ljIGluc3BlY3Rpb24gaW5mbyBhbmQgd2FybmluZ3NcbiAgICpcbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuICBkZWJ1ZzogZmFsc2UsXG5cbiAgLyoqXG4gICAqIFN1cHBseSBhbiBhcnJheSBvZiBwbHVnaW5zIChjb25zdHJ1Y3RvcnMpIHdoaWNoIHdpbGxcbiAgICogYmUgY2FsbGVkIHdpdGggdGhlIExhcCBpbnN0YW5jZSBhcyB0aGVpciBzb2xlIGFyZ3VtZW50LlxuICAgKiBUaGUgcGx1Z2luIGluc3RhbmNlcyB0aGVtc2VsdmVzIHdpbGwgYmUgYXZhaWxhYmxlIGluIHRoZSBzYW1lIG9yZGVyXG4gICAqIHZpYSBgTGFwI3BsdWdpbnNgIGFycmF5XG4gICAqXG4gICAqIEB0eXBlIHtBcnJheX1cbiAgICovXG4gIHBsdWdpbnM6IFtdLFxuXG4gIHN0YXJ0aW5nQWxidW1JbmRleDogMCxcbiAgc3RhcnRpbmdUcmFja0luZGV4OiAwLFxuXG4gIC8qKlxuICAgKiBUaGUgYW1vdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IHdoaWxlIGhvbGRpbmdcbiAgICogYExhcCNlbHMuc2Vla0JhY2t3YXJkYCBvciBgTGFwI2Vscy5zZWVrRm9yd2FyZGAgYmVmb3JlIGV4ZWN1dGluZyBhbm90aGVyXG4gICAqIHNlZWsgaW5zdHJ1Y3Rpb25cbiAgICpcbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHNlZWtJbnRlcnZhbDogNSxcblxuICAvKipcbiAgICogSG93IGZhciBmb3J3YXJkIG9yIGJhY2sgaW4gbWlsbGlzZWNvbmRzIHRvIHNlZWsgd2hlblxuICAgKiBjYWxsaW5nIHNlZWtGb3J3YXJkIG9yIHNlZWtCYWNrd2FyZFxuICAgKlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgc2Vla1RpbWU6IDI1MCxcblxuICAvKipcbiAgICogUHJvdmlkZSB5b3VyIG93biBjdXN0b20gc2VsZWN0b3JzIGZvciBlYWNoIGVsZW1lbnRcbiAgICogaW4gdGhlIExhcCNlbHMgaGFzaC4gT3RoZXJ3aXNlIExhcC5fZGVmYXVsdFNlbGVjdG9ycyBhcmUgdXNlZFxuICAgKlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc2VsZWN0b3JzOiB7fSxcblxuICB0cmFja051bWJlclBvc3RmaXg6ICcgLSAnLFxuXG4gIC8qKlxuICAgKiBTaWduYWwgdGhhdCB5b3Ugd2lsbCBiZSB1c2luZyBhIG5hdGl2ZSBIVE1MNSBgcHJvZ3Jlc3NgIGVsZW1lbnRcbiAgICogdG8gdHJhY2sgYXVkaW8gYnVmZmVyZWQgYW1vdW50LiBSZXF1aXJlcyB0aGF0IGEgYGxhcF9fcHJvZ3Jlc3NgIGVsZW1lbnRcbiAgICogaXMgZm91bmQgdW5kZXIgdGhlIGBMYXAjZWxlbWVudGBcbiAgICpcbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuICB1c2VOYXRpdmVQcm9ncmVzczogZmFsc2UsXG5cbiAgLyoqXG4gICAqIFNpZ25hbCB0aGF0IHlvdSB3aWxsIGJlIHVzaW5nIGEgbmF0aXZlIEhUTUw1IGBpbnB1dFt0eXBlPXJhbmdlXWAgZWxlbWVudFxuICAgKiBmb3IgdHJhY2sgc2Vla2luZyBjb250cm9sLiBSZXF1aXJlcyB0aGF0IGEgYGxhcF9fc2Vlay1yYW5nZWAgZWxlbWVudFxuICAgKiBpcyBmb3VuZCB1bmRlciB0aGUgYExhcCNlbGVtZW50YFxuICAgKlxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG4gIHVzZU5hdGl2ZVNlZWtSYW5nZTogZmFsc2UsXG5cbiAgLyoqXG4gICAqIFNpZ25hbCB0aGF0IHlvdSB3aWxsIGJlIHVzaW5nIGEgbmF0aXZlIEhUTUw1IGBpbnB1dFt0eXBlPXJhbmdlXWAgZWxlbWVudFxuICAgKiBmb3Igdm9sdW1lIGNvbnRyb2wuIFJlcXVpcmVzIHRoYXQgYSBgbGFwX192b2x1bWUtcmFuZ2VgIGVsZW1lbnRcbiAgICogaXMgZm91bmQgdW5kZXIgdGhlIGBMYXAjZWxlbWVudGBcbiAgICpcbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuICB1c2VOYXRpdmVWb2x1bWVSYW5nZTogZmFsc2UsXG5cbiAgLyoqXG4gICAqIFNldCB0aGUgYW1vdW50IG9mIHZvbHVtZSB0byBpbmNyZW1lbnQvZGVjcmVtZW50IHdoZW5ldmVyXG4gICAqIGEgYGxhcF9fdm9sdW1lLXVwYCBvciBgbGFwX192b2x1bWUtZG93bmAgZWxlbWVudCBpcyBjbGlja2VkLlxuICAgKiBOb3RlIHRoYXQgYXVkaW8gdm9sdW1lIGlzIGZsb2F0aW5nIHBvaW50IHJhbmdlIFswLCAxXVxuICAgKiBEb2VzIG5vdCBhcHBseSB0byBgbGFwX192b2x1bWUtcmFuZ2VgLlxuICAgKlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdm9sdW1lSW50ZXJ2YWw6IDAuMDVcbn1cblxuTGFwLl9kZWZhdWx0U2VsZWN0b3JzID0ge1xuICBzdGF0ZToge1xuICAgIHBsYXlpbmc6ICAgICAgICAgICAgICAnbGFwLS1wbGF5aW5nJyxcbiAgICBwYXVzZWQ6ICAgICAgICAgICAgICAgJ2xhcC0tcGF1c2VkJ1xuICB9LFxuICBhbGJ1bTogICAgICAgICAgICAgICAnbGFwX19hbGJ1bScsXG4gIGFydGlzdDogICAgICAgICAgICAgICdsYXBfX2FydGlzdCcsXG4gIGJ1ZmZlcmVkOiAgICAgICAgICAgICdsYXBfX2J1ZmZlcmVkJyxcbiAgY292ZXI6ICAgICAgICAgICAgICAgJ2xhcF9fY292ZXInLFxuICBjdXJyZW50VGltZTogICAgICAgICAnbGFwX19jdXJyZW50LXRpbWUnLFxuICBkdXJhdGlvbjogICAgICAgICAgICAnbGFwX19kdXJhdGlvbicsXG4gIG5leHQ6ICAgICAgICAgICAgICAgICdsYXBfX25leHQnLFxuICBuZXh0QWxidW06ICAgICAgICAgICAnbGFwX19uZXh0LWFsYnVtJyxcbiAgcGxheVBhdXNlOiAgICAgICAgICAgJ2xhcF9fcGxheS1wYXVzZScsXG4gIHByZXY6ICAgICAgICAgICAgICAgICdsYXBfX3ByZXYnLFxuICBwcmV2QWxidW06ICAgICAgICAgICAnbGFwX19wcmV2LWFsYnVtJyxcbiAgcHJvZ3Jlc3M6ICAgICAgICAgICAgJ2xhcF9fcHJvZ3Jlc3MnLFxuICBzZWVrQmFja3dhcmQ6ICAgICAgICAnbGFwX19zZWVrLWJhY2t3YXJkJyxcbiAgc2Vla0ZvcndhcmQ6ICAgICAgICAgJ2xhcF9fc2Vlay1mb3J3YXJkJyxcbiAgc2Vla1JhbmdlOiAgICAgICAgICAgJ2xhcF9fc2Vlay1yYW5nZScsXG4gIHRyYWNrTnVtYmVyOiAgICAgICAgICdsYXBfX3RyYWNrLW51bWJlcicsXG4gIHRyYWNrVGl0bGU6ICAgICAgICAgICdsYXBfX3RyYWNrLXRpdGxlJyxcbiAgdm9sdW1lRG93bjogICAgICAgICAgJ2xhcF9fdm9sdW1lLWRvd24nLFxuICB2b2x1bWVSZWFkOiAgICAgICAgICAnbGFwX192b2x1bWUtcmVhZCcsXG4gIHZvbHVtZVJhbmdlOiAgICAgICAgICdsYXBfX3ZvbHVtZS1yYW5nZScsXG4gIHZvbHVtZVVwOiAgICAgICAgICAgICdsYXBfX3ZvbHVtZS11cCdcbn1cblxuaWYgKHdpbmRvdykgd2luZG93LkxhcCA9IExhcFxuIl19
