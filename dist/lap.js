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
        this.albumIndex = this.settings.startingAlbumIndex || 0;
      }
      if (this.trackIndex === undefined) {
        this.trackIndex = this.settings.startingTrackIndex || 0;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbGFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ1dxQixHQUFHO1lBQUgsR0FBRzs7Ozs7Ozs7Ozs7QUFVdEIsV0FWbUIsR0FBRyxDQVVWLE9BQU8sRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFrQjs7O1FBQWhCLFFBQVEseURBQUMsS0FBSzs7MEJBVjlCLEdBQUc7Ozs7dUVBQUgsR0FBRzs7QUFjcEIsVUFBSyxFQUFFLEdBQUcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxFQUFFLEdBQUcsT0FBTyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQTtBQUNwRSxPQUFHLENBQUMsVUFBVSxDQUFDLE1BQUssRUFBRSxDQUFDLFFBQU8sQ0FBQTs7QUFFOUIsVUFBSyxPQUFPLEdBQUcsT0FBTyxPQUFPLEtBQUssUUFBUSxHQUN0QyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUMvQixPQUFPLENBQUE7O0FBRVgsVUFBSyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7O0FBRWhCLFVBQUssUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNsQixRQUFJLE9BQU8sRUFBRTtBQUNYLFNBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLFVBQUMsR0FBRyxFQUFFLEdBQUcsRUFBSztBQUMzQyxZQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBSyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBLEtBQzdELE1BQUssUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtPQUM5QixDQUFDLENBQUE7S0FDSCxNQUFNO0FBQ0wsWUFBSyxRQUFRLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFBO0tBQ3JDOztB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QUFTLEVBQUUsRUFBRTs7QUFFYixvQkFBa0IsRUFBRSxLQUFLOzs7Ozs7Ozs7QUFTekIsbUJBQWlCLEVBQUUsS0FBSzs7Ozs7Ozs7O0FBU3hCLG9CQUFrQixFQUFFLEtBQUs7Ozs7Ozs7OztBQVN6QixzQkFBb0IsRUFBRSxLQUFLOzs7Ozs7Ozs7O0FBVTNCLGdCQUFjLEVBQUUsSUFBSTtDQUNyQixDQUFBOztBQUVELEdBQUcsQ0FBQyxpQkFBaUIsR0FBRztBQUN0QixPQUFLLEVBQUU7QUFDTCxXQUFPLEVBQWUsY0FBYztBQUNwQyxVQUFNLEVBQWdCLGFBQWE7R0FDcEM7QUFDRCxPQUFLLEVBQWdCLFlBQVk7QUFDakMsUUFBTSxFQUFlLGFBQWE7QUFDbEMsVUFBUSxFQUFhLGVBQWU7QUFDcEMsT0FBSyxFQUFnQixZQUFZO0FBQ2pDLGFBQVcsRUFBVSxtQkFBbUI7QUFDeEMsVUFBUSxFQUFhLGVBQWU7QUFDcEMsTUFBSSxFQUFpQixXQUFXO0FBQ2hDLFdBQVMsRUFBWSxpQkFBaUI7QUFDdEMsV0FBUyxFQUFZLGlCQUFpQjtBQUN0QyxNQUFJLEVBQWlCLFdBQVc7QUFDaEMsV0FBUyxFQUFZLGlCQUFpQjtBQUN0QyxVQUFRLEVBQWEsZUFBZTtBQUNwQyxjQUFZLEVBQVMsb0JBQW9CO0FBQ3pDLGFBQVcsRUFBVSxtQkFBbUI7QUFDeEMsV0FBUyxFQUFZLGlCQUFpQjtBQUN0QyxhQUFXLEVBQVUsbUJBQW1CO0FBQ3hDLFlBQVUsRUFBVyxrQkFBa0I7QUFDdkMsWUFBVSxFQUFXLGtCQUFrQjtBQUN2QyxZQUFVLEVBQVcsa0JBQWtCO0FBQ3ZDLGFBQVcsRUFBVSxtQkFBbUI7QUFDeEMsVUFBUSxFQUFhLGdCQUFnQjtDQUN0QyxDQUFBOztBQUVELElBQUksTUFBTSxFQUFFLE1BQU0sQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxuICogbGFwLmpzIHZlcnNpb24gMC44LjJcbiAqIEhUTUw1IGF1ZGlvIHBsYXllclxuICpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9Mb2t1YS9sYXAuZ2l0XG4gKiBodHRwOi8vbG9rdWEubmV0XG4gKlxuICogQ29weXJpZ2h0IMKpIDIwMTQsIDIwMTUgSm9zaHVhIEtsZWNrbmVyIDxkZXZAbG9rdWEubmV0PlxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMYXAgZXh0ZW5kcyBCdXMge1xuXG4gIC8qKlxuICAgKiBDbGFzcyBjb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtICB7U3RyaW5nfEhUTUwgRWxlbWVudH0gZWxlbWVudCBjb250YWluZXIgZWxlbWVudFxuICAgKiBAcGFyYW0gIHtBcnJheXxPYmplY3R8U3RyaW5nfSBsaWIgYSBMYXAgXCJsaWJyYXJ5XCIsIHdoaWNoIGNhbiBiZSBhbiBhcnJheSBvZlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxidW0gb2JqZWN0cywgYSBzaW5nbGUgYWxidW0gb2JqZWN0LCBvciBhIHVybCB0byBhXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGUgYXVkaW8gZmlsZVxuICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgIHNldHRpbmdzIGhhc2ggdGhhdCB3aWxsIGJlIG1lcmdlZCB3aXRoIExhcC5fZGVmYXVsdFNldHRpbmdzXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBsaWIsIG9wdGlvbnMsIHBvc3Rwb25lPWZhbHNlKSB7XG4gICAgc3VwZXIoKVxuXG4gICAgLy8gZGVmYXVsdCBpZCB0byB6ZXJvLWJhc2VkIGluZGV4IGluY3JlbWVudGVyXG4gICAgdGhpcy5pZCA9IG9wdGlvbnMgJiYgb3B0aW9ucy5pZCA/IG9wdGlvbnMuaWQgOiBMYXAuX2luc3RhbmNlcy5sZW5ndGhcbiAgICBMYXAuX2luc3RhbmNlc1t0aGlzLmlkXSA9IHRoaXNcblxuICAgIHRoaXMuZWxlbWVudCA9IHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJ1xuICAgICAgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGVsZW1lbnQpXG4gICAgICA6IGVsZW1lbnRcblxuICAgIHRoaXMuc2V0TGliKGxpYilcblxuICAgIHRoaXMuc2V0dGluZ3MgPSB7fVxuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICBMYXAuZWFjaChMYXAuX2RlZmF1bHRTZXR0aW5ncywgKHZhbCwga2V5KSA9PiB7XG4gICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KGtleSkpIHRoaXMuc2V0dGluZ3Nba2V5XSA9IG9wdGlvbnNba2V5XVxuICAgICAgICBlbHNlIHRoaXMuc2V0dGluZ3Nba2V5XSA9IHZhbFxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zZXR0aW5ncyA9IExhcC5fZGVmYXVsdFNldHRpbmdzXG4gICAgfVxuXG4gICAgdGhpcy5kZWJ1ZyA9IHRoaXMuc2V0dGluZ3MuZGVidWdcblxuXG4gICAgaWYgKHRoaXMuZGVidWcpIHtcbiAgICAgIHRoaXMub24oJ2xvYWQnLCAoKSA9PiBjb25zb2xlLmluZm8oJyVjTGFwKCVzKSBbREVCVUddOiVjICVvJyxcbiAgICAgICAgTGFwLl9kZWJ1Z1NpZ25hdHVyZSwgdGhpcy5pZCwgJ2NvbG9yOmluaGVyaXQnLCB0aGlzKSlcbiAgICAgIGNvbnN0IGVjaG8gPSBlID0+IHtcbiAgICAgICAgdGhpcy5vbihlLCAoKSA9PiBjb25zb2xlLmluZm8oJyVjTGFwKCVzKSBbREVCVUddOiVjICVzIGhhbmRsZXIgY2FsbGVkJyxcbiAgICAgICAgICBMYXAuX2RlYnVnU2lnbmF0dXJlLCB0aGlzLmlkLCAnY29sb3I6aW5oZXJpdCcsIGUpKVxuICAgICAgfVxuICAgICAgZWNobygnbG9hZCcpXG4gICAgICBlY2hvKCdwbGF5JylcbiAgICAgIGVjaG8oJ3BhdXNlJylcbiAgICAgIGVjaG8oJ3NlZWsnKVxuICAgICAgZWNobygndHJhY2tDaGFuZ2UnKVxuICAgICAgZWNobygnYWxidW1DaGFuZ2UnKVxuICAgICAgZWNobygndm9sdW1lQ2hhbmdlJylcbiAgICB9XG5cbiAgICBpZiAoIXBvc3Rwb25lKSB0aGlzLmluaXRpYWxpemUoKVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBMYXAgaW5zdGFuY2UgYnkgaWQuIElkIGlzIG5vdCBhbiBlbGVtZW50IGNvbnRhaW5lciBpZDsgaXQgaXMgdGhlIGBMYXAjc2V0dGluZ3MuaWRgXG4gICAqIG1lbWJlciwgd2hpY2ggaWYgbm90IHN1cHBsaWVkIG9uIGNyZWF0aW9uLCBpcyB6ZXJvLWJhc2VkIHRoZSBudGggaW5zdGFuY2UgbnVtYmVyLlxuICAgKlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IGlkIExhcCNzZXR0aW5ncy5pZFxuICAgKiBAcmV0dXJuIHtMYXB9IHRoZSBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGdldEluc3RhbmNlKGlkKSB7XG4gICAgcmV0dXJuIExhcC5faW5zdGFuY2VzW2lkXVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBjbGFzcyBgY2xhc3NgIHRvIEhUTUwgRWxlbWVudCBgZWxgXG4gICAqXG4gICAqIEBwYXJhbSB7SFRNTCBFbGVtZW50fSBlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gX2NsYXNzXG4gICAqL1xuICBzdGF0aWMgYWRkQ2xhc3MoZWwsIF9jbGFzcykge1xuICAgIGlmICghZWwpIHJldHVybiBjb25zb2xlLndhcm4oYCR7ZWx9IGlzIG5vdCBkZWZpbmVkYClcbiAgICBpZiAoIWVsLmNsYXNzTmFtZSkge1xuICAgICAgcmV0dXJuIChlbC5jbGFzc05hbWUgKz0gJyAnICsgX2NsYXNzKVxuICAgIH1cbiAgICBjb25zdCBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lXG4gICAgY29uc3QgbmV3Q2xhc3NlcyA9IF9jbGFzc1xuICAgICAgLnNwbGl0KC9cXHMrLylcbiAgICAgIC5maWx0ZXIobiA9PiBjbGFzc05hbWVzLmluZGV4T2YobikgPT09IC0xKVxuICAgICAgLmpvaW4oJyAnKVxuICAgIGVsLmNsYXNzTmFtZSArPSAnICcgKyBuZXdDbGFzc2VzXG4gICAgcmV0dXJuIExhcFxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBjbGFzcyBgY2xhc3NgIGZyb20gSFRNTCBFbGVtZW50IGBlbGBcbiAgICpcbiAgICogQHBhcmFtIHtIVE1MIEVsZW1lbnR9IGVsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBfY2xhc3NcbiAgICovXG4gIHN0YXRpYyByZW1vdmVDbGFzcyhlbCwgX2NsYXNzKSB7XG4gICAgaWYgKCFlbCkgcmV0dXJuIGNvbnNvbGUud2FybihgJHtlbH0gaXMgbm90IGRlZmluZWRgKVxuICAgIC8vIHVuY29tbWVudCBmb3IgbXVsdGlwbGUgY2xhc3MgcmVtb3ZhbFxuICAgIC8vIF9jbGFzcyA9IGAoJHtfY2xhc3Muc3BsaXQoL1xccysvKS5qb2luKCd8Jyl9KWBcblxuICAgIC8vIFRPRE86IGNhY2hlP1xuICAgIGNvbnN0IHJlID0gbmV3IFJlZ0V4cCgnXFxcXHMqJyArIF9jbGFzcyArICdcXFxccyooIVtcXFxcd1xcXFxXXSk/JywgJ2cnKVxuICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKHJlLCAnICcpLnRyaW0oKVxuICAgIHJldHVybiBMYXBcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IG1pbGxpc2Vjb25kcyBpbnRvIGhoOm1tOnNzIGZvcm1hdFxuICAgKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd8bnVtYmVyfSB0aW1lIG1pbGxpc2Vjb25kc1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9IGB0aW1lYCBpbiBoaDptbTpzcyBmb3JtYXRcbiAgICovXG4gIHN0YXRpYyBmb3JtYXRUaW1lKHRpbWUpIHtcbiAgICBsZXQgaCA9IE1hdGguZmxvb3IodGltZSAvIDM2MDApXG4gICAgbGV0IG0gPSBNYXRoLmZsb29yKCh0aW1lIC0gKGggKiAzNjAwKSkgLyA2MClcbiAgICBsZXQgcyA9IE1hdGguZmxvb3IodGltZSAtIChoICogMzYwMCkgLSAobSAqIDYwKSlcbiAgICBpZiAoaCA8IDEwKSBoID0gJzAnICsgaFxuICAgIGlmIChtIDwgMTApIG0gPSAnMCcgKyBtXG4gICAgaWYgKHMgPCAxMCkgcyA9ICcwJyArIHNcbiAgICByZXR1cm4gaCArICc6JyArIG0gKyAnOicgKyBzXG4gIH1cblxuICAvKipcbiAgICogQmFyZWJvbmVzIGZvckVhY2ggZm9yIG9iamVjdFxuICAgKlxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgb2JqIFBPSk9cbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGZuICBpdGVyYXRvciBjYWxsZWQgdmFsLGtleSxvYmpcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgIGN0eCBvcHRpb25hbCBjb250ZXh0XG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICovXG4gIHN0YXRpYyBlYWNoKG9iaiwgZm4sIGN0eCkge1xuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhvYmopXG4gICAgbGV0IGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aFxuICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIGZuLmNhbGwoY3R4LCBvYmpba2V5c1tpXV0sIGtleXNbaV0sIG9iailcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2FsZSBhIG51bWJlciBmcm9tIG9uZSByYW5nZSB0byBhbm90aGVyXG4gICAqXG4gICAqIEBwYXJhbSAge251bWJlcn0gbiAgICAgIHRoZSBudW1iZXIgdG8gc2NhbGVcbiAgICogQHBhcmFtICB7bnVtYmVyfSBvbGRNaW5cbiAgICogQHBhcmFtICB7bnVtYmVyfSBvbGRNYXhcbiAgICogQHBhcmFtICB7bnVtYmVyfSBtaW4gICAgdGhlIG5ldyBtaW4gW2RlZmF1bHQ9MF1cbiAgICogQHBhcmFtICB7bnVtYmVyfSBtYXggICAgdGhlIG5ldyBtYXggW2RlZmF1bHQ9MV1cbiAgICogQHJldHVybiB7bnVtYmVyfSAgICAgICAgdGhlIHNjYWxlZCBudW1iZXJcbiAgICovXG4gIHN0YXRpYyBzY2FsZShuLCBvbGRNaW4sIG9sZE1heCwgbWluLCBtYXgpIHtcbiAgICByZXR1cm4gKCgobi1vbGRNaW4pKihtYXgtbWluKSkgLyAob2xkTWF4LW9sZE1pbikpICsgbWluXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbGwgZG9tLCBhdWRpbywgYW5kIGludGVybmFsIGV2ZW50IGhhbmRsZXJzIGZyb20gdGhlIGdpdmVuIExhcCBpbnN0YW5jZSxcbiAgICogdGhlbiBkZWxldGVzIGFsbCBwcm9wZXJ0aWVzXG4gICAqXG4gICAqIEBwYXJhbSAge0xhcH0gbGFwIHRoZSBMYXAgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBkZXN0cm95KGxhcCkge1xuXG4gICAgY29uc3QgaWQgPSBsYXAuaWRcblxuICAgIC8vIHJlbW92ZSBkb20gZXZlbnQgaGFuZGxlcnNcbiAgICBMYXAuZWFjaChsYXAuX2xpc3RlbmVycywgKGV2ZW50cywgZWxlbWVudE5hbWUpID0+IGRlbGV0ZSBsYXAuX2xpc3RlbmVyc1tlbGVtZW50TmFtZV0pXG5cbiAgICAvLyByZW1vdmUgYXVkaW8gZXZlbnRzXG4gICAgTGFwLmVhY2gobGFwLl9hdWRpb0xpc3RlbmVycywgKGxpc3RlbmVycywgZXZlbnQpID0+IGRlbGV0ZSBsYXAuX2F1ZGlvTGlzdGVuZXJzW2V2ZW50XSlcblxuICAgIC8vIHJlbW92ZSBhbGwgc3VwZXIgaGFuZGxlcnNcbiAgICBsYXAucmVtb3ZlKClcblxuICAgIC8vIG51bGxpZnkgZWxlbWVudHNcbiAgICBMYXAuZWFjaChsYXAuZWxzLCAoZWxlbWVudCwgZWxOYW1lKSA9PiBkZWxldGUgbGFwLmVsc1tlbE5hbWVdKVxuXG4gICAgLy8gZXZlcnl0aGluZyBlbHNlIGp1c3QgaW4gY2FzZVxuICAgIExhcC5lYWNoKGxhcCwgKHZhbCwga2V5KSA9PiBkZWxldGUgbGFwW2tleV0pXG5cbiAgICBkZWxldGUgTGFwLl9pbnN0YW5jZXNbaWRdXG4gICAgbGFwID0gbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGlzIHBsYXllcidzIGBsaWJgIG1lbWJlci4gYGxpYmAgaXMgdGhlIHNhbWUgYXMgd291bGRcbiAgICogYmUgcGFzc2VkIHRvIHRoZSBMYXAgY29uc3RydWN0b3IuIFRoaXMgbWV0aG9kIGlzIHVzZWQgaW50ZXJuYWxseSBvbiBmaXJzdCBpbnN0YW50aWF0aW9uLFxuICAgKiB5ZXQgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIG1hbnVhbGx5IGluIHRoZSBjYXNlIHdoZXJlIHlvdSB3YW50IHRvIGNvbXBsZXRlbHkgcmVwbGFjZSB0aGUgaW5zdGFuY2VzXG4gICAqIGxpYi4gTm90ZSB0aGF0IGAjdXBkYXRlYCBtdXN0IGJlIGNhbGxlZCBhZnRlciBgI3NldExpYmAgZm9yIGNoYW5nZXMgdG8gdGFrZSBlZmZlY3QuXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gbGliXG4gICAqL1xuICBzZXRMaWIobGliKSB7XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiBsaWJcbiAgICBjb25zdCBpc0FycmF5ID0gbGliIGluc3RhbmNlb2YgQXJyYXlcbiAgICBpZiAoaXNBcnJheSkge1xuICAgICAgdGhpcy5saWIgPSBsaWJcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICB0aGlzLmxpYiA9IFtsaWJdXG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiBMYXAuX2F1ZGlvRXh0ZW5zaW9uUmVnRXhwLnRlc3QobGliKSkge1xuICAgICAgdGhpcy5saWIgPSBbeyBmaWxlczogW2xpYl0gfV1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2xpYn0gbXVzdCBiZSBhbiBhcnJheSwgb2JqZWN0LCBvciBzdHJpbmdgKVxuICAgIH1cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGJhc2ljYWxseSBhIHNlY29uZGFyeSBjb25zdHJ1Y3RvciBhbmQgc2hvdWxkIG5vdCByZWFsbHkgbmVlZFxuICAgKiB0byBiZSBjYWxsZWQgbWFudWFsbHkgZXhjZXB0IGluIHRoZSBjYXNlIHRoYXQgeW91IHdhbnQgdG8gcHJlcGFyZSBhIHBsYXllciB3aXRoIGl0c1xuICAgKiBzZXR0aW5ncyB3aGlsZSB3YWl0aW5nIGZvciBhIGxpYiB0byBjb21lIGJhY2sgZnJvbSBhbiBhamF4IGNhbGwuXG4gICAqXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKi9cbiAgaW5pdGlhbGl6ZSgpIHtcblxuICAgIC8vIHN0YXRlXG4gICAgdGhpcy5zZWVraW5nID0gZmFsc2VcbiAgICB0aGlzLnZvbHVtZUNoYW5naW5nID0gZmFsc2VcbiAgICB0aGlzLm1vdXNlRG93blRpbWVyID0gMFxuICAgIHRoaXMucGxheWluZyA9IGZhbHNlXG5cbiAgICB0aGlzLnVwZGF0ZSgpXG4gICAgdGhpcy5faW5pdEF1ZGlvKClcbiAgICB0aGlzLl9pbml0RWxlbWVudHMoKVxuICAgIHRoaXMuX2FkZEF1ZGlvTGlzdGVuZXJzKClcbiAgICB0aGlzLl9hZGRWb2x1bWVMaXN0ZW5lcnMoKVxuICAgIHRoaXMuX2FkZFNlZWtMaXN0ZW5lcnMoKVxuICAgIHRoaXMuX2FkZExpc3RlbmVycygpXG4gICAgdGhpcy5fYWN0aXZhdGVQbHVnaW5zKClcblxuICAgIExhcC5lYWNoKHRoaXMuc2V0dGluZ3MuY2FsbGJhY2tzLCAoZm4sIGtleSkgPT4gdGhpcy5vbihrZXksIGZuLmJpbmQodGhpcykpKVxuXG4gICAgdGhpcy50cmlnZ2VyKCdsb2FkJywgdGhpcylcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQ29uZmlndXJlcyBpbnN0YW5jZSB2YXJpYWJsZXMgcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgYWxidW0uXG4gICAqIENhbGxlZCBvbiBpbnN0YW5jZSBpbml0aWFsaXphdGlvbiBhbmQgd2hlbmV2ZXIgYW4gYWxidW0gaXMgY2hhbmdlZC5cbiAgICogVGhpcyBtZXRob2QgaXMgYWxzbyBuZWVkZWQgaWYgeW91IG1hbnVhbGx5IHJlcGxhY2UgYW4gaW5zdGFuY2UncyBgbGliYCBtZW1iZXJcbiAgICogdmlhIGAjc2V0TGliYCwgaW4gd2hpY2ggY2FzZSB5b3UnbGwgbmVlZCB0byBjYWxsIGAjdXBkYXRlYCBkaXJlY3RseSBhZnRlclxuICAgKlxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcbiAgICovXG4gIHVwZGF0ZSgpIHtcbiAgICBpZiAodGhpcy5hbGJ1bUluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuYWxidW1JbmRleCA9IHRoaXMuc2V0dGluZ3Muc3RhcnRpbmdBbGJ1bUluZGV4IHx8IDBcbiAgICB9XG4gICAgaWYgKHRoaXMudHJhY2tJbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnRyYWNrSW5kZXggPSB0aGlzLnNldHRpbmdzLnN0YXJ0aW5nVHJhY2tJbmRleCB8fCAwXG4gICAgfVxuXG4gICAgdGhpcy5hbGJ1bUNvdW50ID0gdGhpcy5saWIubGVuZ3RoO1xuXG4gICAgY29uc3QgY3VycmVudExpYkl0ZW0gPSB0aGlzLmxpYlt0aGlzLmFsYnVtSW5kZXhdXG5cbiAgICBjb25zdCBrZXlzID0gWydhcnRpc3QnLCAnYWxidW0nLCAnZmlsZXMnLCAnY292ZXInLCAndHJhY2tsaXN0JywgJ3JlcGxhY2VtZW50J11cbiAgICBrZXlzLmZvckVhY2goa2V5ID0+IHRoaXNba2V5XSA9IGN1cnJlbnRMaWJJdGVtW2tleV0pXG5cblxuICAgIHRoaXMudHJhY2tDb3VudCA9IHRoaXMuZmlsZXMubGVuZ3RoXG5cbiAgICAvLyByZXBsYWNlbWVudCBpbiA9PT0gW3JlZ2V4cCBzdHJpbmcsIHJlcGxhY2VtZW50IHN0cmluZywgb3B0aW9uYWwgZmxhZ3NdXG4gICAgLy8gcmVwbGFjZW1lbnQgb3V0ID09PSBbcmVnZXhwIGluc3RhbmNlLCByZXBsYWNlbWVudF1cbiAgICBpZiAodGhpcy5yZXBsYWNlbWVudCkge1xuICAgICAgbGV0IHJlID0gdGhpcy5yZXBsYWNlbWVudFxuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShyZSkgJiYgcmVbMF0gaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgdGhpcy5yZXBsYWNlbWVudCA9IHJlXG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmUgPT09ICdzdHJpbmcnKSByZSA9IFtyZV1cblxuICAgICAgICAvLyByZSBtYXkgY29udGFpbiBzdHJpbmctd3JhcHBlZCByZWdleHAgKGZyb20ganNvbiksIGNvbnZlcnQgaWYgc29cbiAgICAgICAgcmVbMF0gPSBuZXcgUmVnRXhwKHJlWzBdLCByZVsyXSB8fCAnZycpXG4gICAgICAgIHJlWzFdID0gcmVbMV0gfHwgJydcblxuICAgICAgICB0aGlzLnJlcGxhY2VtZW50ID0gcmVcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9mb3JtYXRUcmFja2xpc3QoKVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZSBldmVyeSBwbHVnaW4ncyBjb250cnVjdG9yIHdpdGggdGhpcyBMYXAgaW5zdGFuY2VcbiAgICpcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWN0aXZhdGVQbHVnaW5zKCkge1xuICAgIHRoaXMucGx1Z2lucyA9IFtdXG4gICAgdGhpcy5zZXR0aW5ncy5wbHVnaW5zLmZvckVhY2goKHBsdWdpbiwgaSkgPT4gdGhpcy5wbHVnaW5zW2ldID0gbmV3IHBsdWdpbih0aGlzKSlcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXRBdWRpbygpIHtcbiAgICB0aGlzLmF1ZGlvID0gbmV3IEF1ZGlvKClcbiAgICB0aGlzLmF1ZGlvLnByZWxvYWQgPSAnYXV0bydcbiAgICBsZXQgZmlsZVR5cGUgPSB0aGlzLmZpbGVzW3RoaXMudHJhY2tJbmRleF1cbiAgICBmaWxlVHlwZSA9IGZpbGVUeXBlLnNsaWNlKGZpbGVUeXBlLmxhc3RJbmRleE9mKCcuJykrMSlcbiAgICBjb25zdCBjYW5QbGF5ID0gdGhpcy5hdWRpby5jYW5QbGF5VHlwZSgnYXVkaW8vJyArIGZpbGVUeXBlKVxuICAgIGlmIChjYW5QbGF5ID09PSAncHJvYmFibHknIHx8IGNhblBsYXkgPT09ICdtYXliZScpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZVNvdXJjZSgpXG4gICAgICB0aGlzLmF1ZGlvLnZvbHVtZSA9IDFcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETzogcmV0dXJuIGEgZmxhZyB0byBzaWduYWwgc2tpcHBpbmcgdGhlIHJlc3Qgb2YgdGhlIGluaXRpYWxpemF0aW9uIHByb2Nlc3NcbiAgICAgIGNvbnNvbGUud2FybihgVGhpcyBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgJHtmaWxlVHlwZX0gcGxheWJhY2suYClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF91cGRhdGVTb3VyY2UoKSB7XG4gICAgdGhpcy5hdWRpby5zcmMgPSB0aGlzLmZpbGVzW3RoaXMudHJhY2tJbmRleF1cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXRFbGVtZW50cygpIHtcbiAgICB0aGlzLmVscyA9IHt9XG4gICAgdGhpcy5zZWxlY3RvcnMgPSB7IHN0YXRlOiB7fSB9XG4gICAgTGFwLmVhY2goTGFwLl9kZWZhdWx0U2VsZWN0b3JzLCAoc2VsZWN0b3IsIGtleSkgPT4ge1xuICAgICAgaWYgKGtleSAhPT0gJ3N0YXRlJykge1xuXG4gICAgICAgIHRoaXMuc2VsZWN0b3JzW2tleV0gPSB0aGlzLnNldHRpbmdzLnNlbGVjdG9ycy5oYXNPd25Qcm9wZXJ0eShrZXkpXG4gICAgICAgICAgPyB0aGlzLnNldHRpbmdzLnNlbGVjdG9yc1trZXldXG4gICAgICAgICAgOiBzZWxlY3RvclxuXG4gICAgICAgIGNvbnN0IGVsID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3RoaXMuc2VsZWN0b3JzW2tleV19YClcbiAgICAgICAgaWYgKGVsKSB0aGlzLmVsc1trZXldID0gZWxcblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgaGFzQ3VzdG9tU3RhdGUgPSB0aGlzLnNldHRpbmdzLnNlbGVjdG9ycy5zdGF0ZVxuXG4gICAgICAgIGlmICghaGFzQ3VzdG9tU3RhdGUpIHJldHVybiAodGhpcy5zZWxlY3RvcnMuc3RhdGUgPSBMYXAuX2RlZmF1bHRTZWxlY3RvcnMuc3RhdGUpXG5cbiAgICAgICAgTGFwLmVhY2goTGFwLl9kZWZhdWx0U2VsZWN0b3JzLnN0YXRlLCAoc2VsLCBrKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RvcnMuc3RhdGVba10gPSB0aGlzLnNldHRpbmdzLnNlbGVjdG9ycy5zdGF0ZS5oYXNPd25Qcm9wZXJ0eShrKVxuICAgICAgICAgICAgPyB0aGlzLnNldHRpbmdzLnNlbGVjdG9ycy5zdGF0ZVtrXVxuICAgICAgICAgICAgOiBzZWxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEEgd3JhcHBlciBhcm91bmQgdGhpcyBMYXAgaW5zdGFuY2VzIGBhdWRpby5hZGRFdmVudExpc3RlbmVyYCB0aGF0XG4gICAqIGVuc3VyZXMgaGFuZGxlcnMgYXJlIGNhY2hlZCBmb3IgbGF0ZXIgcmVtb3ZhbCB2aWEgYExhcC5kZXN0cm95KGluc3RhbmNlKWAgY2FsbFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBldmVudCAgICAgICBBdWRpbyBFdmVudCBuYW1lXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyICAgIGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKi9cbiAgYWRkQXVkaW9MaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpIHtcbiAgICB0aGlzLl9hdWRpb0xpc3RlbmVycyA9IHRoaXMuX2F1ZGlvTGlzdGVuZXJzIHx8IHt9XG4gICAgdGhpcy5fYXVkaW9MaXN0ZW5lcnNbZXZlbnRdID0gdGhpcy5fYXVkaW9MaXN0ZW5lcnNbZXZlbnRdIHx8IFtdXG5cbiAgICBjb25zdCBib3VuZCA9IGxpc3RlbmVyLmJpbmQodGhpcylcbiAgICB0aGlzLl9hdWRpb0xpc3RlbmVyc1tldmVudF0ucHVzaChib3VuZClcbiAgICB0aGlzLmF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGJvdW5kKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkQXVkaW9MaXN0ZW5lcnMoKSB7XG4gICAgY29uc3QgYXVkaW8gPSB0aGlzLmF1ZGlvXG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcbiAgICBjb25zdCBuYXRpdmVQcm9ncmVzcyA9ICEhKHRoaXMuc2V0dGluZ3MudXNlTmF0aXZlUHJvZ3Jlc3MgJiYgZWxzLnByb2dyZXNzKVxuXG4gICAgY29uc3QgX2FkZExpc3RlbmVyID0gKGNvbmRpdGlvbiwgZXZlbnQsIGxpc3RlbmVyKSA9PiB7XG4gICAgICBpZiAoY29uZGl0aW9uKSB0aGlzLmFkZEF1ZGlvTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKVxuICAgIH1cblxuICAgIF9hZGRMaXN0ZW5lcighIShlbHMuYnVmZmVyZWQgfHwgbmF0aXZlUHJvZ3Jlc3MpLCAncHJvZ3Jlc3MnLCAoKSA9PiB7XG4gICAgICB2YXIgYnVmZmVyZWQgPSB0aGlzLl9idWZmZXJGb3JtYXR0ZWQoKVxuICAgICAgaWYgKGVscy5idWZmZXJlZCkgZWxzLmJ1ZmZlcmVkLmlubmVySFRNTCA9IGJ1ZmZlcmVkXG4gICAgICBpZiAobmF0aXZlUHJvZ3Jlc3MpIGVscy5wcm9ncmVzcy52YWx1ZSA9IGJ1ZmZlcmVkXG4gICAgfSlcblxuICAgIF9hZGRMaXN0ZW5lcighIWVscy5jdXJyZW50VGltZSwgJ3RpbWV1cGRhdGUnLCAoKSA9PiB0aGlzLl91cGRhdGVDdXJyZW50VGltZUVsKCkpXG4gICAgX2FkZExpc3RlbmVyKCEhZWxzLmR1cmF0aW9uLCAnZHVyYXRpb25jaGFuZ2UnLCAoKSA9PiB0aGlzLl91cGRhdGVEdXJhdGlvbkVsKCkpXG5cbiAgICBfYWRkTGlzdGVuZXIodHJ1ZSwgJ2VuZGVkJywgKCkgPT4ge1xuICAgICAgaWYgKHRoaXMucGxheWluZykge1xuICAgICAgICB0aGlzLm5leHQoKVxuICAgICAgICBhdWRpby5wbGF5KClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHdyYXBwZXIgYXJvdW5kIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciB3aGljaCBlbnN1cmVzIGxpc3RuZXJzXG4gICAqIGFyZSBjYWNoZWQgZm9yIGxhdGVyIHJlbW92YWwgdmlhIGBMYXAuZGVzdHJveShpbnN0YW5jZSlgIGNhbGxcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgZWxlbWVudE5hbWUgTGFwI2VscyBlbGVtZW50a2V5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIGV2ZW50ICAgICAgIERPTSBFdmVudCBuYW1lXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyICAgIGNhbGxiYWNrXG4gICAqL1xuICBhZGRMaXN0ZW5lcihlbGVtZW50TmFtZSwgZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgLy8gYnlwYXNzIG5vbi1leGlzdGVudCBlbGVtZW50c1xuICAgIGlmICghdGhpcy5lbHNbZWxlbWVudE5hbWVdKSByZXR1cm4gdGhpc1xuXG4gICAgLy8gaWUuIGxpc3RlbmVycyA9IHsgc2Vla1JhbmdlOiB7IGNsaWNrOiBbaGFuZGxlcnNdLCBtb3VzZWRvd246IFtoYW5kbGVyc10sIC4uLiB9LCAuLi4gfVxuICAgIHRoaXMuX2xpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycyB8fCB7fVxuICAgIHRoaXMuX2xpc3RlbmVyc1tlbGVtZW50TmFtZV0gPSB0aGlzLl9saXN0ZW5lcnNbZWxlbWVudE5hbWVdIHx8IHt9XG4gICAgdGhpcy5fbGlzdGVuZXJzW2VsZW1lbnROYW1lXVtldmVudF0gPSB0aGlzLl9saXN0ZW5lcnNbZWxlbWVudE5hbWVdW2V2ZW50XSB8fCBbXVxuXG4gICAgY29uc3QgYm91bmQgPSBsaXN0ZW5lci5iaW5kKHRoaXMpXG4gICAgdGhpcy5fbGlzdGVuZXJzW2VsZW1lbnROYW1lXVtldmVudF0ucHVzaChib3VuZClcbiAgICB0aGlzLmVsc1tlbGVtZW50TmFtZV0uYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgYm91bmQpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9hZGRMaXN0ZW5lcnMoKSB7XG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcblxuICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3BsYXlQYXVzZScsICdjbGljaycsIHRoaXMudG9nZ2xlUGxheSlcbiAgICB0aGlzLmFkZExpc3RlbmVyKCdwcmV2JywgJ2NsaWNrJywgdGhpcy5wcmV2KVxuICAgIHRoaXMuYWRkTGlzdGVuZXIoJ25leHQnLCAnY2xpY2snLCB0aGlzLm5leHQpXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigncHJldkFsYnVtJywgJ2NsaWNrJywgdGhpcy5wcmV2QWxidW0pXG4gICAgdGhpcy5hZGRMaXN0ZW5lcignbmV4dEFsYnVtJywgJ2NsaWNrJywgdGhpcy5uZXh0QWxidW0pXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lVXAnLCAnY2xpY2snLCB0aGlzLl9pbmNWb2x1bWUpXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lRG93bicsICdjbGljaycsIHRoaXMuX2RlY1ZvbHVtZSlcblxuICAgIGNvbnN0IF9pZiA9IChlbGVtZW50TmFtZSwgZm4pID0+IHtcbiAgICAgIGlmICh0aGlzLmVsc1tlbGVtZW50TmFtZV0pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aGlzW2ZuXSgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gYW5vbnltb3VzXG4gICAgICAgICAgZm4oKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5vbignbG9hZCcsICgpID0+IHtcbiAgICAgIF9pZigndHJhY2tUaXRsZScsICdfdXBkYXRlVHJhY2tUaXRsZUVsJylcbiAgICAgIF9pZigndHJhY2tOdW1iZXInLCAnX3VwZGF0ZVRyYWNrTnVtYmVyRWwnKVxuICAgICAgX2lmKCdhcnRpc3QnLCAnX3VwZGF0ZUFydGlzdEVsJylcbiAgICAgIF9pZignYWxidW0nLCAnX3VwZGF0ZUFsYnVtRWwnKVxuICAgICAgX2lmKCdjb3ZlcicsICdfdXBkYXRlQ292ZXInKVxuICAgICAgX2lmKCdjdXJyZW50VGltZScsICdfdXBkYXRlQ3VycmVudFRpbWVFbCcpXG4gICAgICBfaWYoJ2R1cmF0aW9uJywgJ191cGRhdGVEdXJhdGlvbkVsJylcbiAgICAgIF9pZigncGxheVBhdXNlJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBzID0gdGhpcy5zZWxlY3RvcnMuc3RhdGVcbiAgICAgICAgY29uc3QgcHAgPSBlbHMucGxheVBhdXNlXG4gICAgICAgIExhcC5hZGRDbGFzcyhwcCwgcy5wYXVzZWQpXG4gICAgICAgIHRoaXMub24oJ3BsYXknLCAoKSA9PiBMYXAucmVtb3ZlQ2xhc3MocHAsIHMucGF1c2VkKS5hZGRDbGFzcyhwcCwgcy5wbGF5aW5nKSlcbiAgICAgICAgdGhpcy5vbigncGF1c2UnLCAoKSA9PiBMYXAucmVtb3ZlQ2xhc3MocHAsIHMucGxheWluZykuYWRkQ2xhc3MocHAsIHMucGF1c2VkKSlcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIHRoaXMub24oJ3RyYWNrQ2hhbmdlJywgKCkgPT4ge1xuICAgICAgX2lmKCd0cmFja1RpdGxlJywgJ191cGRhdGVUcmFja1RpdGxlRWwnKVxuICAgICAgX2lmKCd0cmFja051bWJlcicsICdfdXBkYXRlVHJhY2tOdW1iZXJFbCcpXG4gICAgICBfaWYoJ2N1cnJlbnRUaW1lJywgJ191cGRhdGVDdXJyZW50VGltZUVsJylcbiAgICAgIF9pZignZHVyYXRpb24nLCAnX3VwZGF0ZUR1cmF0aW9uRWwnKVxuICAgIH0pXG5cbiAgICB0aGlzLm9uKCdhbGJ1bUNoYW5nZScsICgpID0+IHtcbiAgICAgIF9pZigndHJhY2tUaXRsZScsICdfdXBkYXRlVHJhY2tUaXRsZUVsJylcbiAgICAgIF9pZigndHJhY2tOdW1iZXInLCAnX3VwZGF0ZVRyYWNrTnVtYmVyRWwnKVxuICAgICAgX2lmKCdhcnRpc3QnLCAnX3VwZGF0ZUFydGlzdEVsJylcbiAgICAgIF9pZignYWxidW0nLCAnX3VwZGF0ZUFsYnVtRWwnKVxuICAgICAgX2lmKCdjb3ZlcicsICdfdXBkYXRlQ292ZXInKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkU2Vla0xpc3RlbmVycygpIHtcbiAgICBjb25zdCBlbHMgPSB0aGlzLmVsc1xuICAgIGNvbnN0IHNlZWtSYW5nZSA9IGVscy5zZWVrUmFuZ2VcbiAgICBjb25zdCBhdWRpbyA9IHRoaXMuYXVkaW9cbiAgICBjb25zdCB1c2VOYXRpdmUgPSAhISh0aGlzLnNldHRpbmdzLnVzZU5hdGl2ZVNlZWtSYW5nZSAmJiBzZWVrUmFuZ2UpXG5cbiAgICBpZiAodXNlTmF0aXZlKSB7XG4gICAgICB0aGlzLmFkZEF1ZGlvTGlzdGVuZXIoJ3RpbWV1cGRhdGUnLCAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5zZWVraW5nKSB7XG4gICAgICAgICAgc2Vla1JhbmdlLnZhbHVlID0gTGFwLnNjYWxlKFxuICAgICAgICAgICAgYXVkaW8uY3VycmVudFRpbWUsIDAsIGF1ZGlvLmR1cmF0aW9uLCAwLCAxMDApXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCdzZWVrUmFuZ2UnLCAnaW5wdXQnLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2Vla2luZyA9IHRydWVcbiAgICAgICAgYXVkaW8uY3VycmVudFRpbWUgPSBMYXAuc2NhbGUoXG4gICAgICAgICAgc2Vla1JhbmdlLnZhbHVlLCAwLCBzZWVrUmFuZ2UubWF4LCAwLCBhdWRpby5kdXJhdGlvbilcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdzZWVrJylcbiAgICAgICAgdGhpcy5zZWVraW5nID0gZmFsc2VcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3QgbWF5YmVXYXJuID0gKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZGVidWcgJiYgc2Vla1JhbmdlKSB7XG4gICAgICAgIGNvbnN0IGMgPSAnY29sb3I6ZGFya2dyZWVuO2ZvbnQtZmFtaWx5Om1vbm9zcGFjZSdcbiAgICAgICAgY29uc3QgciA9ICdjb2xvcjppbmhlcml0J1xuICAgICAgICBjb25zb2xlLndhcm4oYFxuICAgICAgICAgICVjTGFwKCVzKSBbREVCVUddOlxuICAgICAgICAgICVjU2ltdWx0YW5lb3VzIHVzZSBvZiAlY0xhcCNlbHMuc2Vla1JhbmdlJWMgYW5kXG4gICAgICAgICAgJWNMYXAjZWxzLnNlZWtGb3J3YXJkfHNlZWtCYWNrd2FyZCVjIGlzIHJlZHVuZGFudC5cbiAgICAgICAgICBDb25zaWRlciBjaG9vc2luZyBvbmUgb3IgdGhlIG90aGVyLlxuICAgICAgICAgIGAuc3BsaXQoJ1xcbicpLm1hcChzID0+IHMudHJpbSgpKS5qb2luKCcgJyksXG4gICAgICAgICAgTGFwLl9kZWJ1Z1NpZ25hdHVyZSwgdGhpcy5pZCwgciwgYywgciwgYywgclxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGVscy5zZWVrRm9yd2FyZCkge1xuICAgICAgbWF5YmVXYXJuKClcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3NlZWtGb3J3YXJkJywgJ21vdXNlZG93bicsICgpID0+IHtcbiAgICAgICAgdGhpcy5zZWVraW5nID0gdHJ1ZVxuICAgICAgICB0aGlzLl9zZWVrRm9yd2FyZCgpXG4gICAgICB9KVxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcignc2Vla0ZvcndhcmQnLCAnbW91c2V1cCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5zZWVraW5nID0gZmFsc2VcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMubW91c2VEb3duVGltZXIpXG4gICAgICAgIHRoaXMudHJpZ2dlcignc2VlaycpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChlbHMuc2Vla0JhY2t3YXJkKSB7XG4gICAgICBtYXliZVdhcm4oKVxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcignc2Vla0JhY2t3YXJkJywgJ21vdXNlZG93bicsICgpID0+IHtcbiAgICAgICAgdGhpcy5zZWVraW5nID0gdHJ1ZVxuICAgICAgICB0aGlzLl9zZWVrQmFja3dhcmQoKVxuICAgICAgfSlcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3NlZWtCYWNrd2FyZCcsICdtb3VzZXVwJywgKCkgPT4ge1xuICAgICAgICB0aGlzLnNlZWtpbmcgPSBmYWxzZVxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5tb3VzZURvd25UaW1lcilcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdzZWVrJylcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgX3NlZWtCYWNrd2FyZCgpIHtcbiAgICBpZiAoIXRoaXMuc2Vla2luZykgcmV0dXJuIHRoaXNcbiAgICB0aGlzLm1vdXNlRG93blRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgY29uc3QgeCA9IHRoaXMuYXVkaW8uY3VycmVudFRpbWUgKyAodGhpcy5zZXR0aW5ncy5zZWVrSW50ZXJ2YWwgKiAtMSlcbiAgICAgIHRoaXMuYXVkaW8uY3VycmVudFRpbWUgPSB4IDwgMCA/IDAgOiB4XG4gICAgfSwgdGhpcy5zZXR0aW5ncy5zZWVrVGltZSlcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX3NlZWtGb3J3YXJkKCkge1xuICAgIGlmICghdGhpcy5zZWVraW5nKSByZXR1cm4gdGhpc1xuICAgIHRoaXMubW91c2VEb3duVGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBjb25zdCB4ID0gdGhpcy5hdWRpby5jdXJyZW50VGltZSArIHRoaXMuc2V0dGluZ3Muc2Vla0ludGVydmFsXG4gICAgICB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lID0geCA+IHRoaXMuYXVkaW8uZHVyYXRpb24gPyB0aGlzLmF1ZGlvLmR1cmF0aW9uIDogeFxuICAgIH0sIHRoaXMuc2V0dGluZ3Muc2Vla1RpbWUpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIF9hZGRWb2x1bWVMaXN0ZW5lcnMoKSB7XG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcbiAgICBjb25zdCB2b2x1bWVSYW5nZSA9IGVscy52b2x1bWVSYW5nZVxuICAgIGNvbnN0IHZvbHVtZVJlYWQgPSBlbHMudm9sdW1lUmVhZFxuICAgIGNvbnN0IHZvbHVtZVVwID0gZWxzLnZvbHVtZVVwXG4gICAgY29uc3Qgdm9sdW1lRG93biA9IGVscy52b2x1bWVEb3duXG5cbiAgICBpZiAodm9sdW1lUmVhZCkge1xuICAgICAgY29uc3QgZm4gPSAoKSA9PiB2b2x1bWVSZWFkLmlubmVySFRNTCA9IE1hdGgucm91bmQodGhpcy5hdWRpby52b2x1bWUqMTAwKVxuICAgICAgdGhpcy5vbigndm9sdW1lQ2hhbmdlJywgZm4pXG4gICAgICBmbigpXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MudXNlTmF0aXZlVm9sdW1lUmFuZ2UgJiYgdm9sdW1lUmFuZ2UpIHtcblxuICAgICAgY29uc3QgZm4gPSAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy52b2x1bWVDaGFuZ2luZykgdm9sdW1lUmFuZ2UudmFsdWUgPSBNYXRoLnJvdW5kKHRoaXMuYXVkaW8udm9sdW1lKjEwMClcbiAgICAgIH1cbiAgICAgIHRoaXMuYWRkQXVkaW9MaXN0ZW5lcigndm9sdW1lY2hhbmdlJywgZm4pXG4gICAgICB0aGlzLm9uKCdsb2FkJywgZm4pXG5cbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3ZvbHVtZVJhbmdlJywgJ21vdXNlZG93bicsICgpID0+IHRoaXMudm9sdW1lQ2hhbmdpbmcgPSB0cnVlKVxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lUmFuZ2UnLCAnbW91c2V1cCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5hdWRpby52b2x1bWUgPSB2b2x1bWVSYW5nZS52YWx1ZSAqIDAuMDFcbiAgICAgICAgdGhpcy50cmlnZ2VyKCd2b2x1bWVDaGFuZ2UnKVxuICAgICAgICB0aGlzLnZvbHVtZUNoYW5naW5nID0gZmFsc2VcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3QgbWF5YmVXYXJuID0gKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZGVidWcgJiYgdm9sdW1lUmFuZ2UpIHtcbiAgICAgICAgY29uc3QgYyA9ICdjb2xvcjpkYXJrZ3JlZW47Zm9udC1mYW1pbHk6bW9ub3NwYWNlJ1xuICAgICAgICBjb25zdCByID0gJ2NvbG9yOmluaGVyaXQnXG4gICAgICAgIGNvbnNvbGUud2FybihgXG4gICAgICAgICAgJWNMYXAoJXMpIFtERUJVR106XG4gICAgICAgICAgJWNTaW11bHRhbmVvdXMgdXNlIG9mICVjTGFwI2Vscy52b2x1bWVSYW5nZSVjIGFuZFxuICAgICAgICAgICVjTGFwI2Vscy52b2x1bWVVcHx2b2x1bWVEb3duJWMgaXMgcmVkdW5kYW50LlxuICAgICAgICAgIENvbnNpZGVyIGNob29zaW5nIG9uZSBvciB0aGUgb3RoZXIuXG4gICAgICAgICAgYC5zcGxpdCgnXFxuJykubWFwKHMgPT4gcy50cmltKCkpLmpvaW4oJyAnKSxcbiAgICAgICAgICBMYXAuX2RlYnVnU2lnbmF0dXJlLCB0aGlzLmlkLCByLCBjLCByLCBjLCByXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodm9sdW1lVXApIHtcbiAgICAgIG1heWJlV2FybigpXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCd2b2x1bWVVcCcsICdjbGljaycsICgpID0+IHRoaXMuX2luY1ZvbHVtZSgpKVxuICAgIH1cbiAgICBpZiAodm9sdW1lRG93bikge1xuICAgICAgbWF5YmVXYXJuKClcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3ZvbHVtZURvd24nLCAnY2xpY2snLCAoKSA9PiB0aGlzLl9kZWNWb2x1bWUoKSlcbiAgICB9XG4gIH1cblxuICBfaW5jVm9sdW1lKCkge1xuICAgIGNvbnN0IHYgPSB0aGlzLmF1ZGlvLnZvbHVtZVxuICAgIGNvbnN0IGkgPSB0aGlzLnNldHRpbmdzLnZvbHVtZUludGVydmFsXG4gICAgdGhpcy5hdWRpby52b2x1bWUgPSB2K2kgPiAxID8gMSA6IHYraVxuICAgIHRoaXMudHJpZ2dlcigndm9sdW1lQ2hhbmdlJylcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX2RlY1ZvbHVtZSgpIHtcbiAgICBjb25zdCB2ID0gdGhpcy5hdWRpby52b2x1bWVcbiAgICBjb25zdCBpID0gdGhpcy5zZXR0aW5ncy52b2x1bWVJbnRlcnZhbFxuICAgIHRoaXMuYXVkaW8udm9sdW1lID0gdi1pIDwgMCA/IDAgOiB2LWlcbiAgICB0aGlzLnRyaWdnZXIoJ3ZvbHVtZUNoYW5nZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIF91cGRhdGVDdXJyZW50VGltZUVsKCkge1xuICAgIHRoaXMuZWxzLmN1cnJlbnRUaW1lLmlubmVySFRNTCA9IHRoaXMuX2N1cnJlbnRUaW1lRm9ybWF0dGVkKClcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX3VwZGF0ZUR1cmF0aW9uRWwoKSB7XG4gICAgdGhpcy5lbHMuZHVyYXRpb24uaW5uZXJIVE1MID0gdGhpcy5fZHVyYXRpb25Gb3JtYXR0ZWQoKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfdXBkYXRlVHJhY2tUaXRsZUVsKCkge1xuICAgIHRoaXMuZWxzLnRyYWNrVGl0bGUuaW5uZXJIVE1MID0gdGhpcy50cmFja2xpc3RbdGhpcy50cmFja0luZGV4XVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfdXBkYXRlVHJhY2tOdW1iZXJFbCgpIHtcbiAgICB0aGlzLmVscy50cmFja051bWJlci5pbm5lckhUTUwgPSArdGhpcy50cmFja0luZGV4KzFcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX3VwZGF0ZUFydGlzdEVsKCkge1xuICAgIHRoaXMuZWxzLmFydGlzdC5pbm5lckhUTUwgPSB0aGlzLmFydGlzdFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfdXBkYXRlQWxidW1FbCgpIHtcbiAgICB0aGlzLmVscy5hbGJ1bS5pbm5lckhUTUwgPSB0aGlzLmFsYnVtXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIF91cGRhdGVDb3ZlcigpIHtcbiAgICB0aGlzLmVscy5jb3Zlci5zcmMgPSB0aGlzLmNvdmVyXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHRvZ2dsZVBsYXkoKSB7XG4gICAgdGhpcy5hdWRpby5wYXVzZWQgPyB0aGlzLnBsYXkoKSA6IHRoaXMucGF1c2UoKVxuICAgIHRoaXMudHJpZ2dlcigndG9nZ2xlUGxheScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHBsYXkoKSB7XG4gICAgaWYgKExhcC5leGNsdXNpdmVNb2RlKSBMYXAuZWFjaChMYXAuX2luc3RhbmNlcywgaW5zdGFuY2UgPT4gaW5zdGFuY2UucGF1c2UoKSlcbiAgICB0aGlzLmF1ZGlvLnBsYXkoKVxuICAgIHRoaXMucGxheWluZyA9IHRydWVcbiAgICB0aGlzLnRyaWdnZXIoJ3BsYXknKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBwYXVzZSgpIHtcbiAgICB0aGlzLmF1ZGlvLnBhdXNlKClcbiAgICB0aGlzLnBsYXlpbmcgPSBmYWxzZVxuICAgIHRoaXMudHJpZ2dlcigncGF1c2UnKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBzZXRUcmFjayhpbmRleCkge1xuICAgIGlmIChpbmRleCA8PSAwKSB7XG4gICAgICB0aGlzLnRyYWNrSW5kZXggPSAwXG4gICAgfSBlbHNlIGlmIChpbmRleCA+PSB0aGlzLnRyYWNrQ291bnQpIHtcbiAgICAgIHRoaXMudHJhY2tJbmRleCA9IHRoaXMudHJhY2tDb3VudC0xXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudHJhY2tJbmRleCA9IGluZGV4XG4gICAgfVxuICAgIGNvbnN0IHdhc1BsYXlpbmcgPSAhdGhpcy5hdWRpby5wYXVzZWRcbiAgICB0aGlzLl91cGRhdGVTb3VyY2UoKVxuICAgIGlmICh3YXNQbGF5aW5nKSB0aGlzLmF1ZGlvLnBsYXkoKVxuICAgIHRoaXMudHJpZ2dlcigndHJhY2tDaGFuZ2UnKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBwcmV2KCkge1xuICAgIGNvbnN0IHdhc1BsYXlpbmcgPSAhdGhpcy5hdWRpby5wYXVzZWRcbiAgICB0aGlzLnRyYWNrSW5kZXggPSAodGhpcy50cmFja0luZGV4LTEgPCAwKSA/IHRoaXMudHJhY2tDb3VudC0xIDogdGhpcy50cmFja0luZGV4LTFcbiAgICB0aGlzLl91cGRhdGVTb3VyY2UoKVxuICAgIGlmICh3YXNQbGF5aW5nKSB0aGlzLmF1ZGlvLnBsYXkoKVxuICAgIHRoaXMudHJpZ2dlcigndHJhY2tDaGFuZ2UnKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBuZXh0KCkge1xuICAgIGNvbnN0IHdhc1BsYXlpbmcgPSAhdGhpcy5hdWRpby5wYXVzZWRcbiAgICB0aGlzLnRyYWNrSW5kZXggPSAodGhpcy50cmFja0luZGV4KzEgPj0gdGhpcy50cmFja0NvdW50KSA/IDAgOiB0aGlzLnRyYWNrSW5kZXgrMVxuICAgIHRoaXMuX3VwZGF0ZVNvdXJjZSgpXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXG4gICAgdGhpcy50cmlnZ2VyKCd0cmFja0NoYW5nZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHByZXZBbGJ1bSgpIHtcbiAgICBjb25zdCB3YXNQbGF5aW5nID0gIXRoaXMuYXVkaW8ucGF1c2VkXG4gICAgdGhpcy5hbGJ1bUluZGV4ID0gKHRoaXMuYWxidW1JbmRleC0xIDwgMCkgPyB0aGlzLmFsYnVtQ291bnQtMSA6IHRoaXMuYWxidW1JbmRleC0xXG4gICAgdGhpcy51cGRhdGUoKVxuICAgIHRoaXMudHJhY2tJbmRleCA9IDBcbiAgICB0aGlzLl91cGRhdGVTb3VyY2UoKVxuICAgIGlmICh3YXNQbGF5aW5nKSB0aGlzLmF1ZGlvLnBsYXkoKVxuICAgIHRoaXMudHJpZ2dlcignYWxidW1DaGFuZ2UnKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBuZXh0QWxidW0oKSB7XG4gICAgY29uc3Qgd2FzUGxheWluZz0gIXRoaXMuYXVkaW8ucGF1c2VkXG4gICAgdGhpcy5hbGJ1bUluZGV4ID0gKHRoaXMuYWxidW1JbmRleCsxID4gdGhpcy5hbGJ1bUNvdW50LTEpID8gMCA6IHRoaXMuYWxidW1JbmRleCsxXG4gICAgdGhpcy51cGRhdGUoKVxuICAgIHRoaXMudHJhY2tJbmRleCA9IDBcbiAgICB0aGlzLl91cGRhdGVTb3VyY2UoKVxuICAgIGlmICh3YXNQbGF5aW5nKSB0aGlzLmF1ZGlvLnBsYXkoKVxuICAgIHRoaXMudHJpZ2dlcignYWxidW1DaGFuZ2UnKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBzZXRBbGJ1bShpbmRleCkge1xuICAgIGlmIChpbmRleCA8PSAwKSB7XG4gICAgICB0aGlzLmFsYnVtSW5kZXggPSAwXG4gICAgfSBlbHNlIGlmIChpbmRleCA+PSB0aGlzLmFsYnVtQ291bnQpIHtcbiAgICAgIHRoaXMuYWxidW1JbmRleCA9IHRoaXMuYWxidW1Db3VudC0xXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYWxidW1JbmRleCA9IGluZGV4XG4gICAgfVxuICAgIHRoaXMudXBkYXRlKClcbiAgICB0aGlzLnNldFRyYWNrKHRoaXMubGliW3RoaXMuYWxidW1JbmRleF0uc3RhcnRpbmdUcmFja0luZGV4IHx8IDApXG4gICAgdGhpcy50cmlnZ2VyKCdhbGJ1bUNoYW5nZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIF9mb3JtYXRUcmFja2xpc3QoKSB7XG4gICAgaWYgKHRoaXMudHJhY2tsaXN0ICYmIHRoaXMudHJhY2tsaXN0Lmxlbmd0aCkgcmV0dXJuIHRoaXNcblxuICAgIGNvbnN0IHJlID0gdGhpcy5yZXBsYWNlbWVudFxuICAgIGNvbnN0IHRyYWNrbGlzdCA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnRyYWNrQ291bnQ7IGkrKykge1xuICAgICAgbGV0IHQgPSB0aGlzLmZpbGVzW2ldXG4gICAgICAvLyBzdHJpcCBleHRcbiAgICAgIHQgPSB0LnNsaWNlKDAsIHQubGFzdEluZGV4T2YoJy4nKSlcbiAgICAgIC8vIGdldCBsYXN0IHBhdGggc2VnbWVudFxuICAgICAgdCA9IHQuc2xpY2UodC5sYXN0SW5kZXhPZignLycpKzEpXG4gICAgICBpZiAocmUpIHQgPSB0LnJlcGxhY2UocmVbMF0sIHJlWzFdKVxuICAgICAgdHJhY2tsaXN0W2ldID0gdC50cmltKClcbiAgICB9XG4gICAgdGhpcy50cmFja2xpc3QgPSB0cmFja2xpc3RcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX2J1ZmZlckZvcm1hdHRlZCgpIHtcbiAgICBpZiAoIXRoaXMuYXVkaW8pIHJldHVybiAwXG5cbiAgICBjb25zdCBhdWRpbyA9IHRoaXMuYXVkaW9cbiAgICBsZXQgYnVmZmVyZWRcblxuICAgIHRyeSB7XG4gICAgICBidWZmZXJlZCA9IGF1ZGlvLmJ1ZmZlcmVkLmVuZChhdWRpby5idWZmZXJlZC5sZW5ndGgtMSlcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIHJldHVybiAwXG4gICAgfVxuXG4gICAgY29uc3QgZm9ybWF0dGVkID0gTWF0aC5yb3VuZCgoYnVmZmVyZWQvYXVkaW8uZHVyYXRpb24pKjEwMClcbiAgICAvLyB2YXIgZm9ybWF0dGVkID0gTWF0aC5yb3VuZChfLnNjYWxlKGJ1ZmZlcmVkLCAwLCBhdWRpby5kdXJhdGlvbiwgMCwgMTAwKSlcbiAgICByZXR1cm4gaXNOYU4oZm9ybWF0dGVkKSA/IDAgOiBmb3JtYXR0ZWRcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9nZXRBdWRpb1RpbWVGb3JtYXR0ZWQoYXVkaW9Qcm9wKSB7XG4gICAgaWYgKGlzTmFOKHRoaXMuYXVkaW8uZHVyYXRpb24pKSByZXR1cm4gJzAwOjAwJ1xuICAgIGxldCBmb3JtYXR0ZWQgPSBMYXAuZm9ybWF0VGltZShNYXRoLmZsb29yKHRoaXMuYXVkaW9bYXVkaW9Qcm9wXS50b0ZpeGVkKDEpKSlcbiAgICBpZiAodGhpcy5hdWRpby5kdXJhdGlvbiA8IDM2MDAgfHwgZm9ybWF0dGVkID09PSAnMDA6MDA6MDAnKSB7XG4gICAgICBmb3JtYXR0ZWQgPSBmb3JtYXR0ZWQuc2xpY2UoMykgLy8gbm46bm5cbiAgICB9XG4gICAgcmV0dXJuIGZvcm1hdHRlZFxuICB9XG5cbiAgX2N1cnJlbnRUaW1lRm9ybWF0dGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9nZXRBdWRpb1RpbWVGb3JtYXR0ZWQoJ2N1cnJlbnRUaW1lJylcbiAgfVxuXG4gIF9kdXJhdGlvbkZvcm1hdHRlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0QXVkaW9UaW1lRm9ybWF0dGVkKCdkdXJhdGlvbicpXG4gIH1cblxuICB0cmFja051bWJlckZvcm1hdHRlZChuKSB7XG4gICAgdmFyIGNvdW50ID0gU3RyaW5nKHRoaXMudHJhY2tDb3VudCkubGVuZ3RoIC0gU3RyaW5nKG4pLmxlbmd0aFxuICAgIHJldHVybiAnMCcucmVwZWF0KGNvdW50KSArIG4gKyB0aGlzLnNldHRpbmdzLnRyYWNrTnVtYmVyUG9zdGZpeFxuICB9XG5cbiAgZ2V0KGtleSwgaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy5saWJbaW5kZXggPT09IHVuZGVmaW5lZCA/IHRoaXMuYWxidW1JbmRleCA6IGluZGV4XVtrZXldXG4gIH1cbn1cblxuLyoqXG4gKiBJZiBzZXQgdHJ1ZSwgb25seSBvbmUgTGFwIGNhbiBiZSBwbGF5aW5nIGF0IGEgZ2l2ZW4gdGltZVxuICogQHR5cGUge0Jvb2xlYW59XG4gKi9cbkxhcC5leGNsdXNpdmVNb2RlID0gZmFsc2VcblxuLyoqXG4gKiBjb25zb2xlIGZvcm1hdCBwcmVmaXggdXNlZCB3aGVuIExhcCNzZXR0aW5ncy5kZWJ1Z2RlYnVnPXRydWVcbiAqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGUge1N0cmluZ31cbiAqL1xuTGFwLl9kZWJ1Z1NpZ25hdHVyZSA9ICdjb2xvcjp0ZWFsO2ZvbnQtd2VpZ2h0OmJvbGQnXG5cbi8qKlxuICogTGFwIGluc3RhbmNlIGNhY2hlXG4gKlxuICogQHByaXZhdGVcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbkxhcC5faW5zdGFuY2VzID0ge31cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGUge1JlZ0V4cH1cbiAqL1xuTGFwLl9hdWRpb0V4dGVuc2lvblJlZ0V4cCA9IC9tcDN8d2F2fG9nZ3xhaWZmL2lcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGUge09iamVjdH1cbiAqL1xuTGFwLl9kZWZhdWx0U2V0dGluZ3MgPSB7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGNhbGxiYWNrcyBmb3IgYW55IGN1c3RvbSBMYXAgZXZlbnQsIHdoZXJlIHRoZSBvYmplY3Qga2V5XG4gICAqIGlzIHRoZSBldmVudCBuYW1lLCBhbmQgdGhlIHZhbHVlIGlzIHRoZSBjYWxsYmFjay4gQ3VycmVudCBsaXN0IG9mXG4gICAqIGN1c3RvbSBldmVudHMgdGhhdCBhcmUgZmlyZWQgaW5jbHVkZTpcbiAgICpcbiAgICogKyBsb2FkXG4gICAqICsgcGxheVxuICAgKiArIHBhdXNlXG4gICAqICsgdG9nZ2xlUGxheVxuICAgKiArIHNlZWtcbiAgICogKyB0cmFja0NoYW5nZVxuICAgKiArIGFsYnVtQ2hhbmdlXG4gICAqICsgdm9sdW1lQ2hhbmdlXG4gICAqXG4gICAqIFRoZXNlIGV2ZW50cyBhcmUgZmlyZWQgYXQgdGhlIGVuZCBvZiB0aGVpciByZXNwZWN0aXZlXG4gICAqIERPTSBhbmQgQXVkaW8gZXZlbnQgbGlmZWN5Y2xlcywgYXMgd2VsbCBhcyBMYXAgbG9naWMgYXR0YWNoZWQgdG8gdGhvc2UuIEZvciBleGFtcGxlIHdoZW5cbiAgICogTGFwI2Vscy5wbGF5UGF1c2UgaXMgY2xpY2tlZCB3aGVuIGluaXRpYWxseSBwYXVzZWQsIHRoZSBET00gZXZlbnQgaXMgZmlyZWQsIEF1ZGlvIHdpbGwgYmVnaW4gcGxheWluZyxcbiAgICogTGFwIHdpbGwgcmVtb3ZlIHRoZSBsYXAtLXBhdXNlZCBjbGFzcyBhbmQgYWRkIHRoZSBsYXAtLXBsYXlpbmcgY2xhc3MgdG8gdGhlIGVsZW1lbnQsIGFuZCBmaW5hbGx5XG4gICAqIHRoZSBjdXN0b20gJ3BsYXknIGV2ZW50IGlzIHRyaWdnZXJlZC4gTm90ZSBhbHNvIHRoYXQgeW91IGNhbiBzdWJzY3JpYmUgdG8gYW55IGN1c3RvbSBldmVudFxuICAgKiB2aWEgYExhcCNvbihldmVudCwgY2FsbGJhY2spYFxuICAgKlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgY2FsbGJhY2tzOiB7fSxcblxuICAvKipcbiAgICogV2hlbiB0cnVlLCBvdXRwdXRzIGJhc2ljIGluc3BlY3Rpb24gaW5mbyBhbmQgd2FybmluZ3NcbiAgICpcbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuICBkZWJ1ZzogZmFsc2UsXG5cbiAgLyoqXG4gICAqIFN1cHBseSBhbiBhcnJheSBvZiBwbHVnaW5zIChjb25zdHJ1Y3RvcnMpIHdoaWNoIHdpbGxcbiAgICogYmUgY2FsbGVkIHdpdGggdGhlIExhcCBpbnN0YW5jZSBhcyB0aGVpciBzb2xlIGFyZ3VtZW50LlxuICAgKiBUaGUgcGx1Z2luIGluc3RhbmNlcyB0aGVtc2VsdmVzIHdpbGwgYmUgYXZhaWxhYmxlIGluIHRoZSBzYW1lIG9yZGVyXG4gICAqIHZpYSBgTGFwI3BsdWdpbnNgIGFycmF5XG4gICAqXG4gICAqIEB0eXBlIHtBcnJheX1cbiAgICovXG4gIHBsdWdpbnM6IFtdLFxuXG4gIHN0YXJ0aW5nQWxidW1JbmRleDogMCxcbiAgc3RhcnRpbmdUcmFja0luZGV4OiAwLFxuXG4gIC8qKlxuICAgKiBUaGUgYW1vdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IHdoaWxlIGhvbGRpbmdcbiAgICogYExhcCNlbHMuc2Vla0JhY2t3YXJkYCBvciBgTGFwI2Vscy5zZWVrRm9yd2FyZGAgYmVmb3JlIGV4ZWN1dGluZyBhbm90aGVyXG4gICAqIHNlZWsgaW5zdHJ1Y3Rpb25cbiAgICpcbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHNlZWtJbnRlcnZhbDogNSxcblxuICAvKipcbiAgICogSG93IGZhciBmb3J3YXJkIG9yIGJhY2sgaW4gbWlsbGlzZWNvbmRzIHRvIHNlZWsgd2hlblxuICAgKiBjYWxsaW5nIHNlZWtGb3J3YXJkIG9yIHNlZWtCYWNrd2FyZFxuICAgKlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgc2Vla1RpbWU6IDI1MCxcblxuICAvKipcbiAgICogUHJvdmlkZSB5b3VyIG93biBjdXN0b20gc2VsZWN0b3JzIGZvciBlYWNoIGVsZW1lbnRcbiAgICogaW4gdGhlIExhcCNlbHMgaGFzaC4gT3RoZXJ3aXNlIExhcC5fZGVmYXVsdFNlbGVjdG9ycyBhcmUgdXNlZFxuICAgKlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc2VsZWN0b3JzOiB7fSxcblxuICB0cmFja051bWJlclBvc3RmaXg6ICcgLSAnLFxuXG4gIC8qKlxuICAgKiBTaWduYWwgdGhhdCB5b3Ugd2lsbCBiZSB1c2luZyBhIG5hdGl2ZSBIVE1MNSBgcHJvZ3Jlc3NgIGVsZW1lbnRcbiAgICogdG8gdHJhY2sgYXVkaW8gYnVmZmVyZWQgYW1vdW50LiBSZXF1aXJlcyB0aGF0IGEgYGxhcF9fcHJvZ3Jlc3NgIGVsZW1lbnRcbiAgICogaXMgZm91bmQgdW5kZXIgdGhlIGBMYXAjZWxlbWVudGBcbiAgICpcbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuICB1c2VOYXRpdmVQcm9ncmVzczogZmFsc2UsXG5cbiAgLyoqXG4gICAqIFNpZ25hbCB0aGF0IHlvdSB3aWxsIGJlIHVzaW5nIGEgbmF0aXZlIEhUTUw1IGBpbnB1dFt0eXBlPXJhbmdlXWAgZWxlbWVudFxuICAgKiBmb3IgdHJhY2sgc2Vla2luZyBjb250cm9sLiBSZXF1aXJlcyB0aGF0IGEgYGxhcF9fc2Vlay1yYW5nZWAgZWxlbWVudFxuICAgKiBpcyBmb3VuZCB1bmRlciB0aGUgYExhcCNlbGVtZW50YFxuICAgKlxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG4gIHVzZU5hdGl2ZVNlZWtSYW5nZTogZmFsc2UsXG5cbiAgLyoqXG4gICAqIFNpZ25hbCB0aGF0IHlvdSB3aWxsIGJlIHVzaW5nIGEgbmF0aXZlIEhUTUw1IGBpbnB1dFt0eXBlPXJhbmdlXWAgZWxlbWVudFxuICAgKiBmb3Igdm9sdW1lIGNvbnRyb2wuIFJlcXVpcmVzIHRoYXQgYSBgbGFwX192b2x1bWUtcmFuZ2VgIGVsZW1lbnRcbiAgICogaXMgZm91bmQgdW5kZXIgdGhlIGBMYXAjZWxlbWVudGBcbiAgICpcbiAgICogQHR5cGUge0Jvb2xlYW59XG4gICAqL1xuICB1c2VOYXRpdmVWb2x1bWVSYW5nZTogZmFsc2UsXG5cbiAgLyoqXG4gICAqIFNldCB0aGUgYW1vdW50IG9mIHZvbHVtZSB0byBpbmNyZW1lbnQvZGVjcmVtZW50IHdoZW5ldmVyXG4gICAqIGEgYGxhcF9fdm9sdW1lLXVwYCBvciBgbGFwX192b2x1bWUtZG93bmAgZWxlbWVudCBpcyBjbGlja2VkLlxuICAgKiBOb3RlIHRoYXQgYXVkaW8gdm9sdW1lIGlzIGZsb2F0aW5nIHBvaW50IHJhbmdlIFswLCAxXVxuICAgKiBEb2VzIG5vdCBhcHBseSB0byBgbGFwX192b2x1bWUtcmFuZ2VgLlxuICAgKlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdm9sdW1lSW50ZXJ2YWw6IDAuMDVcbn1cblxuTGFwLl9kZWZhdWx0U2VsZWN0b3JzID0ge1xuICBzdGF0ZToge1xuICAgIHBsYXlpbmc6ICAgICAgICAgICAgICAnbGFwLS1wbGF5aW5nJyxcbiAgICBwYXVzZWQ6ICAgICAgICAgICAgICAgJ2xhcC0tcGF1c2VkJ1xuICB9LFxuICBhbGJ1bTogICAgICAgICAgICAgICAnbGFwX19hbGJ1bScsXG4gIGFydGlzdDogICAgICAgICAgICAgICdsYXBfX2FydGlzdCcsXG4gIGJ1ZmZlcmVkOiAgICAgICAgICAgICdsYXBfX2J1ZmZlcmVkJyxcbiAgY292ZXI6ICAgICAgICAgICAgICAgJ2xhcF9fY292ZXInLFxuICBjdXJyZW50VGltZTogICAgICAgICAnbGFwX19jdXJyZW50LXRpbWUnLFxuICBkdXJhdGlvbjogICAgICAgICAgICAnbGFwX19kdXJhdGlvbicsXG4gIG5leHQ6ICAgICAgICAgICAgICAgICdsYXBfX25leHQnLFxuICBuZXh0QWxidW06ICAgICAgICAgICAnbGFwX19uZXh0LWFsYnVtJyxcbiAgcGxheVBhdXNlOiAgICAgICAgICAgJ2xhcF9fcGxheS1wYXVzZScsXG4gIHByZXY6ICAgICAgICAgICAgICAgICdsYXBfX3ByZXYnLFxuICBwcmV2QWxidW06ICAgICAgICAgICAnbGFwX19wcmV2LWFsYnVtJyxcbiAgcHJvZ3Jlc3M6ICAgICAgICAgICAgJ2xhcF9fcHJvZ3Jlc3MnLFxuICBzZWVrQmFja3dhcmQ6ICAgICAgICAnbGFwX19zZWVrLWJhY2t3YXJkJyxcbiAgc2Vla0ZvcndhcmQ6ICAgICAgICAgJ2xhcF9fc2Vlay1mb3J3YXJkJyxcbiAgc2Vla1JhbmdlOiAgICAgICAgICAgJ2xhcF9fc2Vlay1yYW5nZScsXG4gIHRyYWNrTnVtYmVyOiAgICAgICAgICdsYXBfX3RyYWNrLW51bWJlcicsXG4gIHRyYWNrVGl0bGU6ICAgICAgICAgICdsYXBfX3RyYWNrLXRpdGxlJyxcbiAgdm9sdW1lRG93bjogICAgICAgICAgJ2xhcF9fdm9sdW1lLWRvd24nLFxuICB2b2x1bWVSZWFkOiAgICAgICAgICAnbGFwX192b2x1bWUtcmVhZCcsXG4gIHZvbHVtZVJhbmdlOiAgICAgICAgICdsYXBfX3ZvbHVtZS1yYW5nZScsXG4gIHZvbHVtZVVwOiAgICAgICAgICAgICdsYXBfX3ZvbHVtZS11cCdcbn1cblxuaWYgKHdpbmRvdykgd2luZG93LkxhcCA9IExhcFxuIl19
