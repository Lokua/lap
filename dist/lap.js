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
   * @param  {Object} options  settings hash that will be merged with Lap.$$defaultSettings
   */

  function Lap(element, lib, options) {
    var _ret;

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
        // this.addListener('seekRange', 'mousedown', () => this.seeking = true)
        // this.addListener('seekRange', 'mouseup', () => {
        //   audio.currentTime = Lap.scale(
        //     seekRange.value, 0, seekRange.max, 0, audio.duration)
        //   this.trigger('seek')
        //   this.seeking = false
        // })
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbGFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ1dxQixHQUFHO1lBQUgsR0FBRzs7Ozs7Ozs7Ozs7QUFVdEIsV0FWbUIsR0FBRyxDQVVWLE9BQU8sRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFrQjs7O1FBQWhCLFFBQVEseURBQUMsS0FBSzs7MEJBVjlCLEdBQUc7Ozs7dUVBQUgsR0FBRzs7QUFjcEIsVUFBSyxFQUFFLEdBQUcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxFQUFFLEdBQUcsT0FBTyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQTtBQUNyRSxPQUFHLENBQUMsV0FBVyxDQUFDLE1BQUssRUFBRSxDQUFDLFFBQU8sQ0FBQTs7QUFFL0IsVUFBSyxPQUFPLEdBQUcsT0FBTyxPQUFPLEtBQUssUUFBUSxHQUN0QyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUMvQixPQUFPLENBQUE7O0FBRVgsVUFBSyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7O0FBRWhCLFVBQUssUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNsQixRQUFJLE9BQU8sRUFBRTtBQUNYLFNBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLFVBQUMsR0FBRyxFQUFFLEdBQUcsRUFBSztBQUM1QyxZQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBSyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBLEtBQzdELE1BQUssUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtPQUM5QixDQUFDLENBQUE7S0FDSCxNQUFNO0FBQ0wsWUFBSyxRQUFRLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFBO0tBQ3RDOztB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WUFBVSxFQUFXLGtCQUFrQjtBQUN2QyxhQUFXLEVBQVUsbUJBQW1CO0FBQ3hDLFVBQVEsRUFBYSxnQkFBZ0I7Q0FDdEMsQ0FBQTs7QUFFRCxJQUFJLE1BQU0sRUFBRSxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcbiAqIGxhcC5qcyB2ZXJzaW9uIDAuOC4wXG4gKiBIVE1MNSBhdWRpbyBwbGF5ZXJcbiAqXG4gKiBodHRwczovL2dpdGh1Yi5jb20vTG9rdWEvbGFwLmdpdFxuICogaHR0cDovL2xva3VhLm5ldFxuICpcbiAqIENvcHlyaWdodCDCqSAyMDE0LCAyMDE1IEpvc2h1YSBLbGVja25lciA8ZGV2QGxva3VhLm5ldD5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGFwIGV4dGVuZHMgQnVzIHtcblxuICAvKipcbiAgICogQ2xhc3MgY29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSAge1N0cmluZ3xIVE1MIEVsZW1lbnR9IGVsZW1lbnQgY29udGFpbmVyIGVsZW1lbnRcbiAgICogQHBhcmFtICB7QXJyYXl8T2JqZWN0fFN0cmluZ30gbGliIGEgTGFwIFwibGlicmFyeVwiLCB3aGljaCBjYW4gYmUgYW4gYXJyYXkgb2ZcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsYnVtIG9iamVjdHMsIGEgc2luZ2xlIGFsYnVtIG9iamVjdCwgb3IgYSB1cmwgdG8gYVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlIGF1ZGlvIGZpbGVcbiAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zICBzZXR0aW5ncyBoYXNoIHRoYXQgd2lsbCBiZSBtZXJnZWQgd2l0aCBMYXAuJCRkZWZhdWx0U2V0dGluZ3NcbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIGxpYiwgb3B0aW9ucywgcG9zdHBvbmU9ZmFsc2UpIHtcbiAgICBzdXBlcigpXG5cbiAgICAvLyBkZWZhdWx0IGlkIHRvIHplcm8tYmFzZWQgaW5kZXggaW5jcmVtZW50ZXJcbiAgICB0aGlzLmlkID0gb3B0aW9ucyAmJiBvcHRpb25zLmlkID8gb3B0aW9ucy5pZCA6IExhcC4kJGluc3RhbmNlcy5sZW5ndGhcbiAgICBMYXAuJCRpbnN0YW5jZXNbdGhpcy5pZF0gPSB0aGlzXG5cbiAgICB0aGlzLmVsZW1lbnQgPSB0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZydcbiAgICAgID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtZW50KVxuICAgICAgOiBlbGVtZW50XG5cbiAgICB0aGlzLnNldExpYihsaWIpXG5cbiAgICB0aGlzLnNldHRpbmdzID0ge31cbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgTGFwLmVhY2goTGFwLiQkZGVmYXVsdFNldHRpbmdzLCAodmFsLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoa2V5KSkgdGhpcy5zZXR0aW5nc1trZXldID0gb3B0aW9uc1trZXldXG4gICAgICAgIGVsc2UgdGhpcy5zZXR0aW5nc1trZXldID0gdmFsXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldHRpbmdzID0gTGFwLiQkZGVmYXVsdFNldHRpbmdzXG4gICAgfVxuXG4gICAgdGhpcy5kZWJ1ZyA9IHRoaXMuc2V0dGluZ3MuZGVidWdcblxuXG4gICAgaWYgKHRoaXMuZGVidWcpIHtcbiAgICAgIHRoaXMub24oJ2xvYWQnLCAoKSA9PiBjb25zb2xlLmluZm8oJyVjTGFwKCVzKSBbREVCVUddOiVjICVvJyxcbiAgICAgICAgTGFwLiQkZGVidWdTaWduYXR1cmUsIHRoaXMuaWQsICdjb2xvcjppbmhlcml0JywgdGhpcykpXG4gICAgICBjb25zdCBlY2hvID0gZSA9PiB7XG4gICAgICAgIHRoaXMub24oZSwgKCkgPT4gY29uc29sZS5pbmZvKCclY0xhcCglcykgW0RFQlVHXTolYyAlcyBoYW5kbGVyIGNhbGxlZCcsXG4gICAgICAgICAgTGFwLiQkZGVidWdTaWduYXR1cmUsIHRoaXMuaWQsICdjb2xvcjppbmhlcml0JywgZSkpXG4gICAgICB9XG4gICAgICBlY2hvKCdsb2FkJylcbiAgICAgIGVjaG8oJ3BsYXknKVxuICAgICAgZWNobygncGF1c2UnKVxuICAgICAgZWNobygnc2VlaycpXG4gICAgICBlY2hvKCd0cmFja0NoYW5nZScpXG4gICAgICBlY2hvKCdhbGJ1bUNoYW5nZScpXG4gICAgICBlY2hvKCd2b2x1bWVDaGFuZ2UnKVxuICAgIH1cblxuICAgIGlmICghcG9zdHBvbmUpIHRoaXMuaW5pdGlhbGl6ZSgpXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIExhcCBpbnN0YW5jZSBieSBpZC4gSWQgaXMgbm90IGFuIGVsZW1lbnQgY29udGFpbmVyIGlkOyBpdCBpcyB0aGUgYExhcCNzZXR0aW5ncy5pZGBcbiAgICogbWVtYmVyLCB3aGljaCBpZiBub3Qgc3VwcGxpZWQgb24gY3JlYXRpb24sIGlzIHplcm8tYmFzZWQgdGhlIG50aCBpbnN0YW5jZSBudW1iZXIuXG4gICAqXG4gICAqIEBwYXJhbSAge251bWJlcn0gaWQgTGFwI3NldHRpbmdzLmlkXG4gICAqIEByZXR1cm4ge0xhcH0gdGhlIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZ2V0SW5zdGFuY2UoaWQpIHtcbiAgICByZXR1cm4gTGFwLiQkaW5zdGFuY2VzW2lkXVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBjbGFzcyBgY2xhc3NgIHRvIEhUTUwgRWxlbWVudCBgZWxgXG4gICAqXG4gICAqIEBwYXJhbSB7SFRNTCBFbGVtZW50fSBlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gX2NsYXNzXG4gICAqL1xuICBzdGF0aWMgYWRkQ2xhc3MoZWwsIF9jbGFzcykge1xuICAgIGlmICghZWwpIHJldHVybiBjb25zb2xlLndhcm4oYCR7ZWx9IGlzIG5vdCBkZWZpbmVkYClcbiAgICBpZiAoIWVsLmNsYXNzTmFtZSkge1xuICAgICAgcmV0dXJuIChlbC5jbGFzc05hbWUgKz0gJyAnICsgX2NsYXNzKVxuICAgIH1cbiAgICBjb25zdCBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lXG4gICAgY29uc3QgbmV3Q2xhc3NlcyA9IF9jbGFzc1xuICAgICAgLnNwbGl0KC9cXHMrLylcbiAgICAgIC5maWx0ZXIobiA9PiBjbGFzc05hbWVzLmluZGV4T2YobikgPT09IC0xKVxuICAgICAgLmpvaW4oJyAnKVxuICAgIGVsLmNsYXNzTmFtZSArPSAnICcgKyBuZXdDbGFzc2VzXG4gICAgcmV0dXJuIExhcFxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBjbGFzcyBgY2xhc3NgIGZyb20gSFRNTCBFbGVtZW50IGBlbGBcbiAgICpcbiAgICogQHBhcmFtIHtIVE1MIEVsZW1lbnR9IGVsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBfY2xhc3NcbiAgICovXG4gIHN0YXRpYyByZW1vdmVDbGFzcyhlbCwgX2NsYXNzKSB7XG4gICAgaWYgKCFlbCkgcmV0dXJuIGNvbnNvbGUud2FybihgJHtlbH0gaXMgbm90IGRlZmluZWRgKVxuICAgIC8vIHVuY29tbWVudCBmb3IgbXVsdGlwbGUgY2xhc3MgcmVtb3ZhbFxuICAgIC8vIF9jbGFzcyA9IGAoJHtfY2xhc3Muc3BsaXQoL1xccysvKS5qb2luKCd8Jyl9KWBcblxuICAgIC8vIFRPRE86IGNhY2hlP1xuICAgIGNvbnN0IHJlID0gbmV3IFJlZ0V4cCgnXFxcXHMqJyArIF9jbGFzcyArICdcXFxccyooIVtcXFxcd1xcXFxXXSk/JywgJ2cnKVxuICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKHJlLCAnICcpLnRyaW0oKVxuICAgIHJldHVybiBMYXBcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IG1pbGxpc2Vjb25kcyBpbnRvIGhoOm1tOnNzIGZvcm1hdFxuICAgKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd8bnVtYmVyfSB0aW1lIG1pbGxpc2Vjb25kc1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9IGB0aW1lYCBpbiBoaDptbTpzcyBmb3JtYXRcbiAgICovXG4gIHN0YXRpYyBmb3JtYXRUaW1lKHRpbWUpIHtcbiAgICBsZXQgaCA9IE1hdGguZmxvb3IodGltZSAvIDM2MDApXG4gICAgbGV0IG0gPSBNYXRoLmZsb29yKCh0aW1lIC0gKGggKiAzNjAwKSkgLyA2MClcbiAgICBsZXQgcyA9IE1hdGguZmxvb3IodGltZSAtIChoICogMzYwMCkgLSAobSAqIDYwKSlcbiAgICBpZiAoaCA8IDEwKSBoID0gJzAnICsgaFxuICAgIGlmIChtIDwgMTApIG0gPSAnMCcgKyBtXG4gICAgaWYgKHMgPCAxMCkgcyA9ICcwJyArIHNcbiAgICByZXR1cm4gaCArICc6JyArIG0gKyAnOicgKyBzXG4gIH1cblxuICAvKipcbiAgICogQmFyZWJvbmVzIGZvckVhY2ggZm9yIG9iamVjdFxuICAgKlxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgb2JqIFBPSk9cbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGZuICBpdGVyYXRvciBjYWxsZWQgdmFsLGtleSxvYmpcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgIGN0eCBvcHRpb25hbCBjb250ZXh0XG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICovXG4gIHN0YXRpYyBlYWNoKG9iaiwgZm4sIGN0eCkge1xuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhvYmopXG4gICAgbGV0IGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aFxuICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIGZuLmNhbGwoY3R4LCBvYmpba2V5c1tpXV0sIGtleXNbaV0sIG9iailcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2FsZSBhIG51bWJlciBmcm9tIG9uZSByYW5nZSB0byBhbm90aGVyXG4gICAqXG4gICAqIEBwYXJhbSAge251bWJlcn0gbiAgICAgIHRoZSBudW1iZXIgdG8gc2NhbGVcbiAgICogQHBhcmFtICB7bnVtYmVyfSBvbGRNaW5cbiAgICogQHBhcmFtICB7bnVtYmVyfSBvbGRNYXhcbiAgICogQHBhcmFtICB7bnVtYmVyfSBtaW4gICAgdGhlIG5ldyBtaW4gW2RlZmF1bHQ9MF1cbiAgICogQHBhcmFtICB7bnVtYmVyfSBtYXggICAgdGhlIG5ldyBtYXggW2RlZmF1bHQ9MV1cbiAgICogQHJldHVybiB7bnVtYmVyfSAgICAgICAgdGhlIHNjYWxlZCBudW1iZXJcbiAgICovXG4gIHN0YXRpYyBzY2FsZShuLCBvbGRNaW4sIG9sZE1heCwgbWluLCBtYXgpIHtcbiAgICByZXR1cm4gKCgobi1vbGRNaW4pKihtYXgtbWluKSkgLyAob2xkTWF4LW9sZE1pbikpICsgbWluXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbGwgZG9tLCBhdWRpbywgYW5kIGludGVybmFsIGV2ZW50IGhhbmRsZXJzIGZyb20gdGhlIGdpdmVuIExhcCBpbnN0YW5jZSxcbiAgICogdGhlbiBkZWxldGVzIGFsbCBwcm9wZXJ0aWVzXG4gICAqXG4gICAqIEBwYXJhbSAge0xhcH0gbGFwIHRoZSBMYXAgaW5zdGFuY2VcbiAgICogQHJldHVybiB7bnVsbH1cbiAgICovXG4gIHN0YXRpYyBkZXN0cm95KGxhcCkge1xuXG4gICAgLy8gcmVtb3ZlIGRvbSBldmVudCBoYW5kbGVyc1xuICAgIExhcC5lYWNoKGxhcC4kJGxpc3RlbmVycywgKGV2ZW50cywgZWxlbWVudE5hbWUpID0+IGRlbGV0ZSBsYXAuJCRsaXN0ZW5lcnNbZWxlbWVudE5hbWVdKVxuXG4gICAgLy8gcmVtb3ZlIGF1ZGlvIGV2ZW50c1xuICAgIExhcC5lYWNoKGxhcC4kJGF1ZGlvTGlzdGVuZXJzLCAobGlzdGVuZXJzLCBldmVudCkgPT4gZGVsZXRlIGxhcC4kJGF1ZGlvTGlzdGVuZXJzW2V2ZW50XSlcblxuICAgIC8vIHJlbW92ZSBhbGwgc3VwZXIgaGFuZGxlcnNcbiAgICBsYXAucmVtb3ZlKClcblxuICAgIC8vIG51bGxpZnkgZWxlbWVudHNcbiAgICBMYXAuZWFjaChsYXAuZWxzLCAoZWxlbWVudCwgZWxOYW1lKSA9PiBkZWxldGUgbGFwLmVsc1tlbE5hbWVdKVxuXG4gICAgLy8gZXZlcnl0aGluZyBlbHNlIGp1c3QgaW4gY2FzZVxuICAgIExhcC5lYWNoKGxhcCwgKHZhbCwga2V5KSA9PiBkZWxldGUgbGFwW2tleV0pXG5cbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGlzIHBsYXllcidzIGBsaWJgIG1lbWJlci4gYGxpYmAgaXMgdGhlIHNhbWUgYXMgd291bGRcbiAgICogYmUgcGFzc2VkIHRvIHRoZSBMYXAgY29uc3RydWN0b3IuIFRoaXMgbWV0aG9kIGlzIHVzZWQgaW50ZXJuYWxseSBvbiBmaXJzdCBpbnN0YW50aWF0aW9uLFxuICAgKiB5ZXQgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIG1hbnVhbGx5IGluIHRoZSBjYXNlIHdoZXJlIHlvdSB3YW50IHRvIGNvbXBsZXRlbHkgcmVwbGFjZSB0aGUgaW5zdGFuY2VzXG4gICAqIGxpYi4gTm90ZSB0aGF0IGAjdXBkYXRlYCBtdXN0IGJlIGNhbGxlZCBhZnRlciBgI3NldExpYmAgZm9yIGNoYW5nZXMgdG8gdGFrZSBlZmZlY3QuXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gbGliXG4gICAqL1xuICBzZXRMaWIobGliKSB7XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiBsaWJcbiAgICBjb25zdCBpc0FycmF5ID0gbGliIGluc3RhbmNlb2YgQXJyYXlcbiAgICBpZiAoaXNBcnJheSkge1xuICAgICAgdGhpcy5saWIgPSBsaWJcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICB0aGlzLmxpYiA9IFtsaWJdXG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiBMYXAuJCRhdWRpb0V4dGVuc2lvblJlZ0V4cC50ZXN0KGxpYikpIHtcbiAgICAgIHRoaXMubGliID0gW3sgZmlsZXM6IFtsaWJdIH1dXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtsaWJ9IG11c3QgYmUgYW4gYXJyYXksIG9iamVjdCwgb3Igc3RyaW5nYClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBiYXNpY2FsbHkgYSBzZWNvbmRhcnkgY29uc3RydWN0b3IgYW5kIHNob3VsZCBub3QgcmVhbGx5IG5lZWRcbiAgICogdG8gYmUgY2FsbGVkIG1hbnVhbGx5IGV4Y2VwdCBpbiB0aGUgY2FzZSB0aGF0IHlvdSB3YW50IHRvIHByZXBhcmUgYSBwbGF5ZXIgd2l0aCBpdHNcbiAgICogc2V0dGluZ3Mgd2hpbGUgd2FpdGluZyBmb3IgYSBsaWIgdG8gY29tZSBiYWNrIGZyb20gYW4gYWpheCBjYWxsLlxuICAgKlxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcbiAgICovXG4gIGluaXRpYWxpemUoKSB7XG5cbiAgICAvLyBzdGF0ZVxuICAgIHRoaXMuc2Vla2luZyA9IGZhbHNlXG4gICAgdGhpcy52b2x1bWVDaGFuZ2luZyA9IGZhbHNlXG4gICAgdGhpcy5tb3VzZURvd25UaW1lciA9IDBcbiAgICB0aGlzLnBsYXlpbmcgPSBmYWxzZVxuXG4gICAgdGhpcy51cGRhdGUoKVxuICAgIHRoaXMuJCRpbml0QXVkaW8oKVxuICAgIHRoaXMuJCRpbml0RWxlbWVudHMoKVxuICAgIHRoaXMuJCRhZGRBdWRpb0xpc3RlbmVycygpXG4gICAgdGhpcy4kJGFkZFZvbHVtZUxpc3RlbmVycygpXG4gICAgdGhpcy4kJGFkZFNlZWtMaXN0ZW5lcnMoKVxuICAgIHRoaXMuJCRhZGRMaXN0ZW5lcnMoKVxuICAgIHRoaXMuJCRhY3RpdmF0ZVBsdWdpbnMoKVxuXG4gICAgTGFwLmVhY2godGhpcy5zZXR0aW5ncy5jYWxsYmFja3MsIChmbiwga2V5KSA9PiB0aGlzLm9uKGtleSwgZm4uYmluZCh0aGlzKSkpXG5cbiAgICB0aGlzLnRyaWdnZXIoJ2xvYWQnLCB0aGlzKVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIGluc3RhbmNlIHZhcmlhYmxlcyByZWxhdGl2ZSB0byB0aGUgY3VycmVudCBhbGJ1bS5cbiAgICogQ2FsbGVkIG9uIGluc3RhbmNlIGluaXRpYWxpemF0aW9uIGFuZCB3aGVuZXZlciBhbiBhbGJ1bSBpcyBjaGFuZ2VkLlxuICAgKiBUaGlzIG1ldGhvZCBpcyBhbHNvIG5lZWRlZCBpZiB5b3UgbWFudWFsbHkgcmVwbGFjZSBhbiBpbnN0YW5jZSdzIGBsaWJgIG1lbWJlclxuICAgKiB2aWEgYCNzZXRMaWJgLCBpbiB3aGljaCBjYXNlIHlvdSdsbCBuZWVkIHRvIGNhbGwgYCN1cGRhdGVgIGRpcmVjdGx5IGFmdGVyXG4gICAqXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKi9cbiAgdXBkYXRlKCkge1xuICAgIHRoaXMuYWxidW1JbmRleCA9IHRoaXMuYWxidW1JbmRleCB8fCB0aGlzLnNldHRpbmdzLnN0YXJ0aW5nQWxidW1JbmRleCB8fCAwXG4gICAgdGhpcy50cmFja0luZGV4ID0gdGhpcy50cmFja0luZGV4IHx8IHRoaXMuc2V0dGluZ3Muc3RhcnRpbmdUcmFja0luZGV4IHx8IDBcbiAgICB0aGlzLmFsYnVtQ291bnQgPSB0aGlzLmxpYi5sZW5ndGhcbiAgICB0aGlzLnBsYXlsaXN0UG9wdWxhdGVkID0gZmFsc2VcblxuICAgIGNvbnN0IGN1cnJlbnRMaWJJdGVtID0gdGhpcy5saWJbdGhpcy5hbGJ1bUluZGV4XVxuXG4gICAgY29uc3Qga2V5cyA9IFsnYXJ0aXN0JywgJ2FsYnVtJywgJ2ZpbGVzJywgJ2NvdmVyJywgJ3RyYWNrbGlzdCcsICdyZXBsYWNlbWVudCddXG4gICAga2V5cy5mb3JFYWNoKGtleSA9PiB0aGlzW2tleV0gPSBjdXJyZW50TGliSXRlbVtrZXldKVxuXG5cbiAgICB0aGlzLnRyYWNrQ291bnQgPSB0aGlzLmZpbGVzLmxlbmd0aFxuXG4gICAgLy8gcmVwbGFjZW1lbnQgaW4gPT09IFtyZWdleHAgc3RyaW5nLCByZXBsYWNlbWVudCBzdHJpbmcsIG9wdGlvbmFsIGZsYWdzXVxuICAgIC8vIHJlcGxhY2VtZW50IG91dCA9PT0gW3JlZ2V4cCBpbnN0YW5jZSwgcmVwbGFjZW1lbnRdXG4gICAgaWYgKHRoaXMucmVwbGFjZW1lbnQpIHtcbiAgICAgIGxldCByZSA9IHRoaXMucmVwbGFjZW1lbnRcblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmUpICYmIHJlWzBdIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgIHRoaXMucmVwbGFjZW1lbnQgPSByZVxuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodHlwZW9mIHJlID09PSAnc3RyaW5nJykgcmUgPSBbcmVdXG5cbiAgICAgICAgLy8gcmUgbWF5IGNvbnRhaW4gc3RyaW5nLXdyYXBwZWQgcmVnZXhwIChmcm9tIGpzb24pLCBjb252ZXJ0IGlmIHNvXG4gICAgICAgIHJlWzBdID0gbmV3IFJlZ0V4cChyZVswXSwgcmVbMl0gfHwgJ2cnKVxuICAgICAgICByZVsxXSA9IHJlWzFdIHx8ICcnXG5cbiAgICAgICAgdGhpcy5yZXBsYWNlbWVudCA9IHJlXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy4kJGZvcm1hdFRyYWNrbGlzdCgpXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEluc3RhbnRpYXRlIGV2ZXJ5IHBsdWdpbidzIGNvbnRydWN0b3Igd2l0aCB0aGlzIExhcCBpbnN0YW5jZVxuICAgKlxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcbiAgICogQHByaXZhdGVcbiAgICovXG4gICQkYWN0aXZhdGVQbHVnaW5zKCkge1xuICAgIHRoaXMucGx1Z2lucyA9IFtdXG4gICAgdGhpcy5zZXR0aW5ncy5wbHVnaW5zLmZvckVhY2goKHBsdWdpbiwgaSkgPT4gdGhpcy5wbHVnaW5zW2ldID0gbmV3IHBsdWdpbih0aGlzKSlcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgJCRpbml0QXVkaW8oKSB7XG4gICAgdGhpcy5hdWRpbyA9IG5ldyBBdWRpbygpXG4gICAgdGhpcy5hdWRpby5wcmVsb2FkID0gJ2F1dG8nXG4gICAgbGV0IGZpbGVUeXBlID0gdGhpcy5maWxlc1t0aGlzLnRyYWNrSW5kZXhdXG4gICAgZmlsZVR5cGUgPSBmaWxlVHlwZS5zbGljZShmaWxlVHlwZS5sYXN0SW5kZXhPZignLicpKzEpXG4gICAgY29uc3QgY2FuUGxheSA9IHRoaXMuYXVkaW8uY2FuUGxheVR5cGUoJ2F1ZGlvLycgKyBmaWxlVHlwZSlcbiAgICBpZiAoY2FuUGxheSA9PT0gJ3Byb2JhYmx5JyB8fCBjYW5QbGF5ID09PSAnbWF5YmUnKSB7XG4gICAgICB0aGlzLiQkdXBkYXRlU291cmNlKClcbiAgICAgIHRoaXMuYXVkaW8udm9sdW1lID0gMVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUT0RPOiByZXR1cm4gYSBmbGFnIHRvIHNpZ25hbCBza2lwcGluZyB0aGUgcmVzdCBvZiB0aGUgaW5pdGlhbGl6YXRpb24gcHJvY2Vzc1xuICAgICAgY29uc29sZS53YXJuKGBUaGlzIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCAke2ZpbGVUeXBlfSBwbGF5YmFjay5gKVxuICAgIH1cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgJCR1cGRhdGVTb3VyY2UoKSB7XG4gICAgdGhpcy5hdWRpby5zcmMgPSB0aGlzLmZpbGVzW3RoaXMudHJhY2tJbmRleF1cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgJCRpbml0RWxlbWVudHMoKSB7XG4gICAgdGhpcy5lbHMgPSB7fVxuICAgIHRoaXMuc2VsZWN0b3JzID0geyBzdGF0ZToge30gfVxuICAgIExhcC5lYWNoKExhcC4kJGRlZmF1bHRTZWxlY3RvcnMsIChzZWxlY3Rvciwga2V5KSA9PiB7XG4gICAgICBpZiAoa2V5ICE9PSAnc3RhdGUnKSB7XG5cbiAgICAgICAgdGhpcy5zZWxlY3RvcnNba2V5XSA9IHRoaXMuc2V0dGluZ3Muc2VsZWN0b3JzLmhhc093blByb3BlcnR5KGtleSlcbiAgICAgICAgICA/IHRoaXMuc2V0dGluZ3Muc2VsZWN0b3JzW2tleV1cbiAgICAgICAgICA6IHNlbGVjdG9yXG5cbiAgICAgICAgY29uc3QgZWwgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcihgLiR7dGhpcy5zZWxlY3RvcnNba2V5XX1gKVxuICAgICAgICBpZiAoZWwpIHRoaXMuZWxzW2tleV0gPSBlbFxuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBoYXNDdXN0b21TdGF0ZSA9IHRoaXMuc2V0dGluZ3Muc2VsZWN0b3JzLnN0YXRlXG5cbiAgICAgICAgaWYgKCFoYXNDdXN0b21TdGF0ZSkgcmV0dXJuICh0aGlzLnNlbGVjdG9ycy5zdGF0ZSA9IExhcC4kJGRlZmF1bHRTZWxlY3RvcnMuc3RhdGUpXG5cbiAgICAgICAgTGFwLmVhY2goTGFwLiQkZGVmYXVsdFNlbGVjdG9ycy5zdGF0ZSwgKHNlbCwgaykgPT4ge1xuICAgICAgICAgIHRoaXMuc2VsZWN0b3JzLnN0YXRlW2tdID0gdGhpcy5zZXR0aW5ncy5zZWxlY3RvcnMuc3RhdGUuaGFzT3duUHJvcGVydHkoaylcbiAgICAgICAgICAgID8gdGhpcy5zZXR0aW5ncy5zZWxlY3RvcnMuc3RhdGVba11cbiAgICAgICAgICAgIDogc2VsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHdyYXBwZXIgYXJvdW5kIHRoaXMgTGFwIGluc3RhbmNlcyBgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcmAgdGhhdFxuICAgKiBlbnN1cmVzIGhhbmRsZXJzIGFyZSBjYWNoZWQgZm9yIGxhdGVyIHJlbW92YWwgdmlhIGBMYXAuZGVzdHJveShpbnN0YW5jZSlgIGNhbGxcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgZXZlbnQgICAgICAgQXVkaW8gRXZlbnQgbmFtZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciAgICBjYWxsYmFja1xuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcbiAgICovXG4gIGFkZEF1ZGlvTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgdGhpcy4kJGF1ZGlvTGlzdGVuZXJzID0gdGhpcy4kJGF1ZGlvTGlzdGVuZXJzIHx8IHt9XG4gICAgdGhpcy4kJGF1ZGlvTGlzdGVuZXJzW2V2ZW50XSA9IHRoaXMuJCRhdWRpb0xpc3RlbmVyc1tldmVudF0gfHwgW11cblxuICAgIGNvbnN0IGJvdW5kID0gbGlzdGVuZXIuYmluZCh0aGlzKVxuICAgIHRoaXMuJCRhdWRpb0xpc3RlbmVyc1tldmVudF0ucHVzaChib3VuZClcbiAgICB0aGlzLmF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGJvdW5kKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICAkJGFkZEF1ZGlvTGlzdGVuZXJzKCkge1xuICAgIGNvbnN0IGF1ZGlvID0gdGhpcy5hdWRpb1xuICAgIGNvbnN0IGVscyA9IHRoaXMuZWxzXG4gICAgY29uc3QgbmF0aXZlUHJvZ3Jlc3MgPSAhISh0aGlzLnNldHRpbmdzLnVzZU5hdGl2ZVByb2dyZXNzICYmIGVscy5wcm9ncmVzcylcblxuICAgIGNvbnN0IF9hZGRMaXN0ZW5lciA9IChjb25kaXRpb24sIGV2ZW50LCBsaXN0ZW5lcikgPT4ge1xuICAgICAgaWYgKGNvbmRpdGlvbikgdGhpcy5hZGRBdWRpb0xpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcbiAgICB9XG5cbiAgICBfYWRkTGlzdGVuZXIoISEoZWxzLmJ1ZmZlcmVkIHx8IG5hdGl2ZVByb2dyZXNzKSwgJ3Byb2dyZXNzJywgKCkgPT4ge1xuICAgICAgdmFyIGJ1ZmZlcmVkID0gdGhpcy4kJGJ1ZmZlckZvcm1hdHRlZCgpXG4gICAgICBpZiAoZWxzLmJ1ZmZlcmVkKSBlbHMuYnVmZmVyZWQuaW5uZXJIVE1MID0gYnVmZmVyZWRcbiAgICAgIGlmIChuYXRpdmVQcm9ncmVzcykgZWxzLnByb2dyZXNzLnZhbHVlID0gYnVmZmVyZWRcbiAgICB9KVxuXG4gICAgX2FkZExpc3RlbmVyKCEhZWxzLmN1cnJlbnRUaW1lLCAndGltZXVwZGF0ZScsICgpID0+IHRoaXMuJCR1cGRhdGVDdXJyZW50VGltZUVsKCkpXG4gICAgX2FkZExpc3RlbmVyKCEhZWxzLmR1cmF0aW9uLCAnZHVyYXRpb25jaGFuZ2UnLCAoKSA9PiB0aGlzLiQkdXBkYXRlRHVyYXRpb25FbCgpKVxuXG4gICAgX2FkZExpc3RlbmVyKHRydWUsICdlbmRlZCcsICgpID0+IHtcbiAgICAgIGlmICh0aGlzLnBsYXlpbmcpIHtcbiAgICAgICAgdGhpcy5uZXh0KClcbiAgICAgICAgYXVkaW8ucGxheSgpXG4gICAgICB9XG4gICAgfSlcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQSB3cmFwcGVyIGFyb3VuZCBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgd2hpY2ggZW5zdXJlcyBsaXN0bmVyc1xuICAgKiBhcmUgY2FjaGVkIGZvciBsYXRlciByZW1vdmFsIHZpYSBgTGFwLmRlc3Ryb3koaW5zdGFuY2UpYCBjYWxsXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIGVsZW1lbnROYW1lIExhcCNlbHMgZWxlbWVudGtleVxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBldmVudCAgICAgICBET00gRXZlbnQgbmFtZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciAgICBjYWxsYmFja1xuICAgKi9cbiAgYWRkTGlzdGVuZXIoZWxlbWVudE5hbWUsIGV2ZW50LCBsaXN0ZW5lcikge1xuICAgIC8vIGJ5cGFzcyBub24tZXhpc3RlbnQgZWxlbWVudHNcbiAgICBpZiAoIXRoaXMuZWxzW2VsZW1lbnROYW1lXSkgcmV0dXJuIHRoaXNcblxuICAgIC8vIGllLiBsaXN0ZW5lcnMgPSB7IHNlZWtSYW5nZTogeyBjbGljazogW2hhbmRsZXJzXSwgbW91c2Vkb3duOiBbaGFuZGxlcnNdLCAuLi4gfSwgLi4uIH1cbiAgICB0aGlzLiQkbGlzdGVuZXJzID0gdGhpcy4kJGxpc3RlbmVycyB8fCB7fVxuICAgIHRoaXMuJCRsaXN0ZW5lcnNbZWxlbWVudE5hbWVdID0gdGhpcy4kJGxpc3RlbmVyc1tlbGVtZW50TmFtZV0gfHwge31cbiAgICB0aGlzLiQkbGlzdGVuZXJzW2VsZW1lbnROYW1lXVtldmVudF0gPSB0aGlzLiQkbGlzdGVuZXJzW2VsZW1lbnROYW1lXVtldmVudF0gfHwgW11cblxuICAgIGNvbnN0IGJvdW5kID0gbGlzdGVuZXIuYmluZCh0aGlzKVxuICAgIHRoaXMuJCRsaXN0ZW5lcnNbZWxlbWVudE5hbWVdW2V2ZW50XS5wdXNoKGJvdW5kKVxuICAgIHRoaXMuZWxzW2VsZW1lbnROYW1lXS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBib3VuZClcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgJCRhZGRMaXN0ZW5lcnMoKSB7XG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcblxuICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3BsYXlQYXVzZScsICdjbGljaycsIHRoaXMudG9nZ2xlUGxheSlcbiAgICB0aGlzLmFkZExpc3RlbmVyKCdwcmV2JywgJ2NsaWNrJywgdGhpcy5wcmV2KVxuICAgIHRoaXMuYWRkTGlzdGVuZXIoJ25leHQnLCAnY2xpY2snLCB0aGlzLm5leHQpXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigncHJldkFsYnVtJywgJ2NsaWNrJywgdGhpcy5wcmV2QWxidW0pXG4gICAgdGhpcy5hZGRMaXN0ZW5lcignbmV4dEFsYnVtJywgJ2NsaWNrJywgdGhpcy5uZXh0QWxidW0pXG4gICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lVXAnLCAnY2xpY2snLCB0aGlzLiQkaW5jVm9sdW1lKVxuICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3ZvbHVtZURvd24nLCAnY2xpY2snLCB0aGlzLiQkZGVjVm9sdW1lKVxuXG4gICAgY29uc3QgX2lmID0gKGVsZW1lbnROYW1lLCBmbikgPT4ge1xuICAgICAgaWYgKHRoaXMuZWxzW2VsZW1lbnROYW1lXSkge1xuICAgICAgICBpZiAodHlwZW9mIGZuID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRoaXNbZm5dKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBhbm9ueW1vdXNcbiAgICAgICAgICBmbigpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm9uKCdsb2FkJywgKCkgPT4ge1xuICAgICAgX2lmKCd0cmFja1RpdGxlJywgJyQkdXBkYXRlVHJhY2tUaXRsZUVsJylcbiAgICAgIF9pZigndHJhY2tOdW1iZXInLCAnJCR1cGRhdGVUcmFja051bWJlckVsJylcbiAgICAgIF9pZignYXJ0aXN0JywgJyQkdXBkYXRlQXJ0aXN0RWwnKVxuICAgICAgX2lmKCdhbGJ1bScsICckJHVwZGF0ZUFsYnVtRWwnKVxuICAgICAgX2lmKCdjb3ZlcicsICckJHVwZGF0ZUNvdmVyJylcbiAgICAgIF9pZignY3VycmVudFRpbWUnLCAnJCR1cGRhdGVDdXJyZW50VGltZUVsJylcbiAgICAgIF9pZignZHVyYXRpb24nLCAnJCR1cGRhdGVEdXJhdGlvbkVsJylcbiAgICAgIF9pZigncGxheVBhdXNlJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBzID0gdGhpcy5zZWxlY3RvcnMuc3RhdGVcbiAgICAgICAgY29uc3QgcHAgPSBlbHMucGxheVBhdXNlXG4gICAgICAgIExhcC5hZGRDbGFzcyhwcCwgcy5wYXVzZWQpXG4gICAgICAgIHRoaXMub24oJ3BsYXknLCAoKSA9PiBMYXAucmVtb3ZlQ2xhc3MocHAsIHMucGF1c2VkKS5hZGRDbGFzcyhwcCwgcy5wbGF5aW5nKSlcbiAgICAgICAgdGhpcy5vbigncGF1c2UnLCAoKSA9PiBMYXAucmVtb3ZlQ2xhc3MocHAsIHMucGxheWluZykuYWRkQ2xhc3MocHAsIHMucGF1c2VkKSlcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIHRoaXMub24oJ3RyYWNrQ2hhbmdlJywgKCkgPT4ge1xuICAgICAgX2lmKCd0cmFja1RpdGxlJywgJyQkdXBkYXRlVHJhY2tUaXRsZUVsJylcbiAgICAgIF9pZigndHJhY2tOdW1iZXInLCAnJCR1cGRhdGVUcmFja051bWJlckVsJylcbiAgICAgIF9pZignY3VycmVudFRpbWUnLCAnJCR1cGRhdGVDdXJyZW50VGltZUVsJylcbiAgICAgIF9pZignZHVyYXRpb24nLCAnJCR1cGRhdGVEdXJhdGlvbkVsJylcbiAgICB9KVxuXG4gICAgdGhpcy5vbignYWxidW1DaGFuZ2UnLCAoKSA9PiB7XG4gICAgICBfaWYoJ3RyYWNrVGl0bGUnLCAnJCR1cGRhdGVUcmFja1RpdGxlRWwnKVxuICAgICAgX2lmKCd0cmFja051bWJlcicsICckJHVwZGF0ZVRyYWNrTnVtYmVyRWwnKVxuICAgICAgX2lmKCdhcnRpc3QnLCAnJCR1cGRhdGVBcnRpc3RFbCcpXG4gICAgICBfaWYoJ2FsYnVtJywgJyQkdXBkYXRlQWxidW1FbCcpXG4gICAgICBfaWYoJ2NvdmVyJywgJyQkdXBkYXRlQ292ZXInKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICAkJGFkZFNlZWtMaXN0ZW5lcnMoKSB7XG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcbiAgICBjb25zdCBzZWVrUmFuZ2UgPSBlbHMuc2Vla1JhbmdlXG4gICAgY29uc3QgYXVkaW8gPSB0aGlzLmF1ZGlvXG4gICAgY29uc3QgdXNlTmF0aXZlID0gISEodGhpcy5zZXR0aW5ncy51c2VOYXRpdmVTZWVrUmFuZ2UgJiYgc2Vla1JhbmdlKVxuXG4gICAgaWYgKHVzZU5hdGl2ZSkge1xuICAgICAgdGhpcy5hZGRBdWRpb0xpc3RlbmVyKCd0aW1ldXBkYXRlJywgKCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuc2Vla2luZykge1xuICAgICAgICAgIHNlZWtSYW5nZS52YWx1ZSA9IExhcC5zY2FsZShcbiAgICAgICAgICAgIGF1ZGlvLmN1cnJlbnRUaW1lLCAwLCBhdWRpby5kdXJhdGlvbiwgMCwgMTAwKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcignc2Vla1JhbmdlJywgJ2lucHV0JywgKCkgPT4ge1xuICAgICAgICB0aGlzLnNlZWtpbmcgPSB0cnVlXG4gICAgICAgIGF1ZGlvLmN1cnJlbnRUaW1lID0gTGFwLnNjYWxlKFxuICAgICAgICAgIHNlZWtSYW5nZS52YWx1ZSwgMCwgc2Vla1JhbmdlLm1heCwgMCwgYXVkaW8uZHVyYXRpb24pXG4gICAgICAgIHRoaXMudHJpZ2dlcignc2VlaycpXG4gICAgICAgIHRoaXMuc2Vla2luZyA9IGZhbHNlXG4gICAgICB9KVxuICAgICAgLy8gdGhpcy5hZGRMaXN0ZW5lcignc2Vla1JhbmdlJywgJ21vdXNlZG93bicsICgpID0+IHRoaXMuc2Vla2luZyA9IHRydWUpXG4gICAgICAvLyB0aGlzLmFkZExpc3RlbmVyKCdzZWVrUmFuZ2UnLCAnbW91c2V1cCcsICgpID0+IHtcbiAgICAgIC8vICAgYXVkaW8uY3VycmVudFRpbWUgPSBMYXAuc2NhbGUoXG4gICAgICAvLyAgICAgc2Vla1JhbmdlLnZhbHVlLCAwLCBzZWVrUmFuZ2UubWF4LCAwLCBhdWRpby5kdXJhdGlvbilcbiAgICAgIC8vICAgdGhpcy50cmlnZ2VyKCdzZWVrJylcbiAgICAgIC8vICAgdGhpcy5zZWVraW5nID0gZmFsc2VcbiAgICAgIC8vIH0pXG4gICAgfVxuXG4gICAgY29uc3QgbWF5YmVXYXJuID0gKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZGVidWcgJiYgc2Vla1JhbmdlKSB7XG4gICAgICAgIGNvbnN0IGMgPSAnY29sb3I6ZGFya2dyZWVuO2ZvbnQtZmFtaWx5Om1vbm9zcGFjZSdcbiAgICAgICAgY29uc3QgciA9ICdjb2xvcjppbmhlcml0J1xuICAgICAgICBjb25zb2xlLndhcm4oYFxuICAgICAgICAgICVjTGFwKCVzKSBbREVCVUddOlxuICAgICAgICAgICVjU2ltdWx0YW5lb3VzIHVzZSBvZiAlY0xhcCNlbHMuc2Vla1JhbmdlJWMgYW5kXG4gICAgICAgICAgJWNMYXAjZWxzLnNlZWtGb3J3YXJkfHNlZWtCYWNrd2FyZCVjIGlzIHJlZHVuZGFudC5cbiAgICAgICAgICBDb25zaWRlciBjaG9vc2luZyBvbmUgb3IgdGhlIG90aGVyLlxuICAgICAgICAgIGAuc3BsaXQoJ1xcbicpLm1hcChzID0+IHMudHJpbSgpKS5qb2luKCcgJyksXG4gICAgICAgICAgTGFwLiQkZGVidWdTaWduYXR1cmUsIHRoaXMuaWQsIHIsIGMsIHIsIGMsIHJcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbHMuc2Vla0ZvcndhcmQpIHtcbiAgICAgIG1heWJlV2FybigpXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCdzZWVrRm9yd2FyZCcsICdtb3VzZWRvd24nLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2Vla2luZyA9IHRydWVcbiAgICAgICAgdGhpcy4kJHNlZWtGb3J3YXJkKClcbiAgICAgIH0pXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCdzZWVrRm9yd2FyZCcsICdtb3VzZXVwJywgKCkgPT4ge1xuICAgICAgICB0aGlzLnNlZWtpbmcgPSBmYWxzZVxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5tb3VzZURvd25UaW1lcilcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdzZWVrJylcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKGVscy5zZWVrQmFja3dhcmQpIHtcbiAgICAgIG1heWJlV2FybigpXG4gICAgICB0aGlzLmFkZExpc3RlbmVyKCdzZWVrQmFja3dhcmQnLCAnbW91c2Vkb3duJywgKCkgPT4ge1xuICAgICAgICB0aGlzLnNlZWtpbmcgPSB0cnVlXG4gICAgICAgIHRoaXMuJCRzZWVrQmFja3dhcmQoKVxuICAgICAgfSlcbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3NlZWtCYWNrd2FyZCcsICdtb3VzZXVwJywgKCkgPT4ge1xuICAgICAgICB0aGlzLnNlZWtpbmcgPSBmYWxzZVxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5tb3VzZURvd25UaW1lcilcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdzZWVrJylcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgJCRzZWVrQmFja3dhcmQoKSB7XG4gICAgaWYgKCF0aGlzLnNlZWtpbmcpIHJldHVybiB0aGlzXG4gICAgdGhpcy5tb3VzZURvd25UaW1lciA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGNvbnN0IHggPSB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lICsgKHRoaXMuc2V0dGluZ3Muc2Vla0ludGVydmFsICogLTEpXG4gICAgICB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lID0geCA8IDAgPyAwIDogeFxuICAgIH0sIHRoaXMuc2V0dGluZ3Muc2Vla1RpbWUpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gICQkc2Vla0ZvcndhcmQoKSB7XG4gICAgaWYgKCF0aGlzLnNlZWtpbmcpIHJldHVybiB0aGlzXG4gICAgdGhpcy5tb3VzZURvd25UaW1lciA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGNvbnN0IHggPSB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lICsgdGhpcy5zZXR0aW5ncy5zZWVrSW50ZXJ2YWxcbiAgICAgIHRoaXMuYXVkaW8uY3VycmVudFRpbWUgPSB4ID4gdGhpcy5hdWRpby5kdXJhdGlvbiA/IHRoaXMuYXVkaW8uZHVyYXRpb24gOiB4XG4gICAgfSwgdGhpcy5zZXR0aW5ncy5zZWVrVGltZSlcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgJCRhZGRWb2x1bWVMaXN0ZW5lcnMoKSB7XG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcbiAgICBjb25zdCB2b2x1bWVSYW5nZSA9IGVscy52b2x1bWVSYW5nZVxuICAgIGNvbnN0IHZvbHVtZVJlYWQgPSBlbHMudm9sdW1lUmVhZFxuICAgIGNvbnN0IHZvbHVtZVVwID0gZWxzLnZvbHVtZVVwXG4gICAgY29uc3Qgdm9sdW1lRG93biA9IGVscy52b2x1bWVEb3duXG5cbiAgICBpZiAodm9sdW1lUmVhZCkge1xuICAgICAgY29uc3QgZm4gPSAoKSA9PiB2b2x1bWVSZWFkLmlubmVySFRNTCA9IE1hdGgucm91bmQodGhpcy5hdWRpby52b2x1bWUqMTAwKVxuICAgICAgdGhpcy5vbigndm9sdW1lQ2hhbmdlJywgZm4pXG4gICAgICBmbigpXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MudXNlTmF0aXZlVm9sdW1lUmFuZ2UgJiYgdm9sdW1lUmFuZ2UpIHtcblxuICAgICAgY29uc3QgZm4gPSAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy52b2x1bWVDaGFuZ2luZykgdm9sdW1lUmFuZ2UudmFsdWUgPSBNYXRoLnJvdW5kKHRoaXMuYXVkaW8udm9sdW1lKjEwMClcbiAgICAgIH1cbiAgICAgIHRoaXMuYWRkQXVkaW9MaXN0ZW5lcigndm9sdW1lY2hhbmdlJywgZm4pXG4gICAgICB0aGlzLm9uKCdsb2FkJywgZm4pXG5cbiAgICAgIHRoaXMuYWRkTGlzdGVuZXIoJ3ZvbHVtZVJhbmdlJywgJ21vdXNlZG93bicsICgpID0+IHRoaXMudm9sdW1lQ2hhbmdpbmcgPSB0cnVlKVxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lUmFuZ2UnLCAnbW91c2V1cCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5hdWRpby52b2x1bWUgPSB2b2x1bWVSYW5nZS52YWx1ZSAqIDAuMDFcbiAgICAgICAgdGhpcy50cmlnZ2VyKCd2b2x1bWVDaGFuZ2UnKVxuICAgICAgICB0aGlzLnZvbHVtZUNoYW5naW5nID0gZmFsc2VcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3QgbWF5YmVXYXJuID0gKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZGVidWcgJiYgdm9sdW1lUmFuZ2UpIHtcbiAgICAgICAgY29uc3QgYyA9ICdjb2xvcjpkYXJrZ3JlZW47Zm9udC1mYW1pbHk6bW9ub3NwYWNlJ1xuICAgICAgICBjb25zdCByID0gJ2NvbG9yOmluaGVyaXQnXG4gICAgICAgIGNvbnNvbGUud2FybihgXG4gICAgICAgICAgJWNMYXAoJXMpIFtERUJVR106XG4gICAgICAgICAgJWNTaW11bHRhbmVvdXMgdXNlIG9mICVjTGFwI2Vscy52b2x1bWVSYW5nZSVjIGFuZFxuICAgICAgICAgICVjTGFwI2Vscy52b2x1bWVVcHx2b2x1bWVEb3duJWMgaXMgcmVkdW5kYW50LlxuICAgICAgICAgIENvbnNpZGVyIGNob29zaW5nIG9uZSBvciB0aGUgb3RoZXIuXG4gICAgICAgICAgYC5zcGxpdCgnXFxuJykubWFwKHMgPT4gcy50cmltKCkpLmpvaW4oJyAnKSxcbiAgICAgICAgICBMYXAuJCRkZWJ1Z1NpZ25hdHVyZSwgdGhpcy5pZCwgciwgYywgciwgYywgclxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHZvbHVtZVVwKSB7XG4gICAgICBtYXliZVdhcm4oKVxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lVXAnLCAnY2xpY2snLCAoKSA9PiB0aGlzLiQkaW5jVm9sdW1lKCkpXG4gICAgfVxuICAgIGlmICh2b2x1bWVEb3duKSB7XG4gICAgICBtYXliZVdhcm4oKVxuICAgICAgdGhpcy5hZGRMaXN0ZW5lcigndm9sdW1lRG93bicsICdjbGljaycsICgpID0+IHRoaXMuJCRkZWNWb2x1bWUoKSlcbiAgICB9XG4gIH1cblxuICAkJGluY1ZvbHVtZSgpIHtcbiAgICBjb25zdCB2ID0gdGhpcy5hdWRpby52b2x1bWVcbiAgICBjb25zdCBpID0gdGhpcy5zZXR0aW5ncy52b2x1bWVJbnRlcnZhbFxuICAgIHRoaXMuYXVkaW8udm9sdW1lID0gditpID4gMSA/IDEgOiB2K2lcbiAgICB0aGlzLnRyaWdnZXIoJ3ZvbHVtZUNoYW5nZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gICQkZGVjVm9sdW1lKCkge1xuICAgIGNvbnN0IHYgPSB0aGlzLmF1ZGlvLnZvbHVtZVxuICAgIGNvbnN0IGkgPSB0aGlzLnNldHRpbmdzLnZvbHVtZUludGVydmFsXG4gICAgdGhpcy5hdWRpby52b2x1bWUgPSB2LWkgPCAwID8gMCA6IHYtaVxuICAgIHRoaXMudHJpZ2dlcigndm9sdW1lQ2hhbmdlJylcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgJCR1cGRhdGVDdXJyZW50VGltZUVsKCkge1xuICAgIHRoaXMuZWxzLmN1cnJlbnRUaW1lLmlubmVySFRNTCA9IHRoaXMuJCRjdXJyZW50VGltZUZvcm1hdHRlZCgpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gICQkdXBkYXRlRHVyYXRpb25FbCgpIHtcbiAgICB0aGlzLmVscy5kdXJhdGlvbi5pbm5lckhUTUwgPSB0aGlzLiQkZHVyYXRpb25Gb3JtYXR0ZWQoKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAkJHVwZGF0ZVRyYWNrVGl0bGVFbCgpIHtcbiAgICB0aGlzLmVscy50cmFja1RpdGxlLmlubmVySFRNTCA9IHRoaXMudHJhY2tsaXN0W3RoaXMudHJhY2tJbmRleF1cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgJCR1cGRhdGVUcmFja051bWJlckVsKCkge1xuICAgIHRoaXMuZWxzLnRyYWNrTnVtYmVyLmlubmVySFRNTCA9ICt0aGlzLnRyYWNrSW5kZXgrMVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAkJHVwZGF0ZUFydGlzdEVsKCkge1xuICAgIHRoaXMuZWxzLmFydGlzdC5pbm5lckhUTUwgPSB0aGlzLmFydGlzdFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAkJHVwZGF0ZUFsYnVtRWwoKSB7XG4gICAgdGhpcy5lbHMuYWxidW0uaW5uZXJIVE1MID0gdGhpcy5hbGJ1bVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAkJHVwZGF0ZUNvdmVyKCkge1xuICAgIHRoaXMuZWxzLmNvdmVyLnNyYyA9IHRoaXMuY292ZXJcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgdG9nZ2xlUGxheSgpIHtcbiAgICB0aGlzLmF1ZGlvLnBhdXNlZCA/IHRoaXMucGxheSgpIDogdGhpcy5wYXVzZSgpXG4gICAgdGhpcy50cmlnZ2VyKCd0b2dnbGVQbGF5JylcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgcGxheSgpIHtcbiAgICBpZiAoTGFwLmV4Y2x1c2l2ZU1vZGUpIExhcC5lYWNoKExhcC4kJGluc3RhbmNlcywgaW5zdGFuY2UgPT4gaW5zdGFuY2UucGF1c2UoKSlcbiAgICB0aGlzLmF1ZGlvLnBsYXkoKVxuICAgIHRoaXMucGxheWluZyA9IHRydWVcbiAgICB0aGlzLnRyaWdnZXIoJ3BsYXknKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBwYXVzZSgpIHtcbiAgICB0aGlzLmF1ZGlvLnBhdXNlKClcbiAgICB0aGlzLnBsYXlpbmcgPSBmYWxzZVxuICAgIHRoaXMudHJpZ2dlcigncGF1c2UnKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBzZXRUcmFjayhpbmRleCkge1xuICAgIGlmIChpbmRleCA8PSAwKSB7XG4gICAgICB0aGlzLnRyYWNrSW5kZXggPSAwXG4gICAgfSBlbHNlIGlmIChpbmRleCA+PSB0aGlzLnRyYWNrQ291bnQpIHtcbiAgICAgIHRoaXMudHJhY2tJbmRleCA9IHRoaXMudHJhY2tDb3VudC0xXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudHJhY2tJbmRleCA9IGluZGV4XG4gICAgfVxuICAgIGNvbnN0IHdhc1BsYXlpbmcgPSAhdGhpcy5hdWRpby5wYXVzZWRcbiAgICB0aGlzLiQkdXBkYXRlU291cmNlKClcbiAgICBpZiAod2FzUGxheWluZykgdGhpcy5hdWRpby5wbGF5KClcbiAgICB0aGlzLnRyaWdnZXIoJ3RyYWNrQ2hhbmdlJylcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgcHJldigpIHtcbiAgICBjb25zdCB3YXNQbGF5aW5nID0gIXRoaXMuYXVkaW8ucGF1c2VkXG4gICAgdGhpcy50cmFja0luZGV4ID0gKHRoaXMudHJhY2tJbmRleC0xIDwgMCkgPyB0aGlzLnRyYWNrQ291bnQtMSA6IHRoaXMudHJhY2tJbmRleC0xXG4gICAgdGhpcy4kJHVwZGF0ZVNvdXJjZSgpXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXG4gICAgdGhpcy50cmlnZ2VyKCd0cmFja0NoYW5nZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIG5leHQoKSB7XG4gICAgY29uc3Qgd2FzUGxheWluZyA9ICF0aGlzLmF1ZGlvLnBhdXNlZFxuICAgIHRoaXMudHJhY2tJbmRleCA9ICh0aGlzLnRyYWNrSW5kZXgrMSA+PSB0aGlzLnRyYWNrQ291bnQpID8gMCA6IHRoaXMudHJhY2tJbmRleCsxXG4gICAgdGhpcy4kJHVwZGF0ZVNvdXJjZSgpXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXG4gICAgdGhpcy50cmlnZ2VyKCd0cmFja0NoYW5nZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHByZXZBbGJ1bSgpIHtcbiAgICBjb25zdCB3YXNQbGF5aW5nID0gIXRoaXMuYXVkaW8ucGF1c2VkXG4gICAgdGhpcy5hbGJ1bUluZGV4ID0gKHRoaXMuYWxidW1JbmRleC0xIDwgMCkgPyB0aGlzLmFsYnVtQ291bnQtMSA6IHRoaXMuYWxidW1JbmRleC0xXG4gICAgdGhpcy51cGRhdGUoKVxuICAgIHRoaXMudHJhY2tJbmRleCA9IDBcbiAgICB0aGlzLiQkdXBkYXRlU291cmNlKClcbiAgICBpZiAod2FzUGxheWluZykgdGhpcy5hdWRpby5wbGF5KClcbiAgICB0aGlzLnRyaWdnZXIoJ2FsYnVtQ2hhbmdlJylcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgbmV4dEFsYnVtKCkge1xuICAgIGNvbnN0IHdhc1BsYXlpbmc9ICF0aGlzLmF1ZGlvLnBhdXNlZFxuICAgIHRoaXMuYWxidW1JbmRleCA9ICh0aGlzLmFsYnVtSW5kZXgrMSA+IHRoaXMuYWxidW1Db3VudC0xKSA/IDAgOiB0aGlzLmFsYnVtSW5kZXgrMVxuICAgIHRoaXMudXBkYXRlKClcbiAgICB0aGlzLnRyYWNrSW5kZXggPSAwXG4gICAgdGhpcy4kJHVwZGF0ZVNvdXJjZSgpXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXG4gICAgdGhpcy50cmlnZ2VyKCdhbGJ1bUNoYW5nZScpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHNldEFsYnVtKGluZGV4KSB7XG4gICAgaWYgKGluZGV4IDw9IDApIHtcbiAgICAgIHRoaXMuYWxidW1JbmRleCA9IDBcbiAgICB9IGVsc2UgaWYgKGluZGV4ID49IHRoaXMuYWxidW1Db3VudCkge1xuICAgICAgdGhpcy5hbGJ1bUluZGV4ID0gdGhpcy5hbGJ1bUNvdW50LTFcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hbGJ1bUluZGV4ID0gaW5kZXhcbiAgICB9XG4gICAgdGhpcy51cGRhdGUoKVxuICAgIHRoaXMuc2V0VHJhY2sodGhpcy5saWJbdGhpcy5hbGJ1bUluZGV4XS5zdGFydGluZ1RyYWNrSW5kZXggfHwgMClcbiAgICB0aGlzLnRyaWdnZXIoJ2FsYnVtQ2hhbmdlJylcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgJCRmb3JtYXRUcmFja2xpc3QoKSB7XG4gICAgaWYgKHRoaXMudHJhY2tsaXN0ICYmIHRoaXMudHJhY2tsaXN0Lmxlbmd0aCkgcmV0dXJuIHRoaXNcblxuICAgIGNvbnN0IHJlID0gdGhpcy5yZXBsYWNlbWVudFxuICAgIGNvbnN0IHRyYWNrbGlzdCA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnRyYWNrQ291bnQ7IGkrKykge1xuICAgICAgbGV0IHQgPSB0aGlzLmZpbGVzW2ldXG4gICAgICAvLyBzdHJpcCBleHRcbiAgICAgIHQgPSB0LnNsaWNlKDAsIHQubGFzdEluZGV4T2YoJy4nKSlcbiAgICAgIC8vIGdldCBsYXN0IHBhdGggc2VnbWVudFxuICAgICAgdCA9IHQuc2xpY2UodC5sYXN0SW5kZXhPZignLycpKzEpXG4gICAgICBpZiAocmUpIHQgPSB0LnJlcGxhY2UocmVbMF0sIHJlWzFdKVxuICAgICAgdHJhY2tsaXN0W2ldID0gdC50cmltKClcbiAgICB9XG4gICAgdGhpcy50cmFja2xpc3QgPSB0cmFja2xpc3RcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgJCRidWZmZXJGb3JtYXR0ZWQoKSB7XG4gICAgaWYgKCF0aGlzLmF1ZGlvKSByZXR1cm4gMFxuXG4gICAgY29uc3QgYXVkaW8gPSB0aGlzLmF1ZGlvXG4gICAgbGV0IGJ1ZmZlcmVkXG5cbiAgICB0cnkge1xuICAgICAgYnVmZmVyZWQgPSBhdWRpby5idWZmZXJlZC5lbmQoYXVkaW8uYnVmZmVyZWQubGVuZ3RoLTEpXG4gICAgfSBjYXRjaChlKSB7XG4gICAgICByZXR1cm4gMFxuICAgIH1cblxuICAgIGNvbnN0IGZvcm1hdHRlZCA9IE1hdGgucm91bmQoKGJ1ZmZlcmVkL2F1ZGlvLmR1cmF0aW9uKSoxMDApXG4gICAgLy8gdmFyIGZvcm1hdHRlZCA9IE1hdGgucm91bmQoXy5zY2FsZShidWZmZXJlZCwgMCwgYXVkaW8uZHVyYXRpb24sIDAsIDEwMCkpXG4gICAgcmV0dXJuIGlzTmFOKGZvcm1hdHRlZCkgPyAwIDogZm9ybWF0dGVkXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICAkJGdldEF1ZGlvVGltZUZvcm1hdHRlZChhdWRpb1Byb3ApIHtcbiAgICBpZiAoaXNOYU4odGhpcy5hdWRpby5kdXJhdGlvbikpIHJldHVybiAnMDA6MDAnXG4gICAgbGV0IGZvcm1hdHRlZCA9IExhcC5mb3JtYXRUaW1lKE1hdGguZmxvb3IodGhpcy5hdWRpb1thdWRpb1Byb3BdLnRvRml4ZWQoMSkpKVxuICAgIGlmICh0aGlzLmF1ZGlvLmR1cmF0aW9uIDwgMzYwMCB8fCBmb3JtYXR0ZWQgPT09ICcwMDowMDowMCcpIHtcbiAgICAgIGZvcm1hdHRlZCA9IGZvcm1hdHRlZC5zbGljZSgzKSAvLyBubjpublxuICAgIH1cbiAgICByZXR1cm4gZm9ybWF0dGVkXG4gIH1cblxuICAkJGN1cnJlbnRUaW1lRm9ybWF0dGVkKCkge1xuICAgIHJldHVybiB0aGlzLiQkZ2V0QXVkaW9UaW1lRm9ybWF0dGVkKCdjdXJyZW50VGltZScpXG4gIH1cblxuICAkJGR1cmF0aW9uRm9ybWF0dGVkKCkge1xuICAgIHJldHVybiB0aGlzLiQkZ2V0QXVkaW9UaW1lRm9ybWF0dGVkKCdkdXJhdGlvbicpXG4gIH1cblxuICB0cmFja051bWJlckZvcm1hdHRlZChuKSB7XG4gICAgdmFyIGNvdW50ID0gU3RyaW5nKHRoaXMudHJhY2tDb3VudCkubGVuZ3RoIC0gU3RyaW5nKG4pLmxlbmd0aFxuICAgIHJldHVybiAnMCcucmVwZWF0KGNvdW50KSArIG4gKyB0aGlzLnNldHRpbmdzLnRyYWNrTnVtYmVyUG9zdGZpeFxuICAgIC8vIHJldHVybiBfLnJlcGVhdCgnMCcsIGNvdW50KSArIG4gKyB0aGlzLnNldHRpbmdzLnRyYWNrTnVtYmVyUG9zdGZpeFxuICB9XG5cbiAgZ2V0KGtleSwgaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy5saWJbaW5kZXggPT09IHVuZGVmaW5lZCA/IHRoaXMuYWxidW1JbmRleCA6IGluZGV4XVtrZXldXG4gIH1cbn1cblxuLyoqXG4gKiBJZiBzZXQgdHJ1ZSwgb25seSBvbmUgTGFwIGNhbiBiZSBwbGF5aW5nIGF0IGEgZ2l2ZW4gdGltZVxuICogQHR5cGUge0Jvb2xlYW59XG4gKi9cbkxhcC5leGNsdXNpdmVNb2RlID0gZmFsc2VcblxuLyoqXG4gKiBjb25zb2xlIGZvcm1hdCBwcmVmaXggdXNlZCB3aGVuIExhcCNzZXR0aW5ncy5kZWJ1Z2RlYnVnPXRydWVcbiAqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGUge1N0cmluZ31cbiAqL1xuTGFwLiQkZGVidWdTaWduYXR1cmUgPSAnY29sb3I6dGVhbDtmb250LXdlaWdodDpib2xkJ1xuXG4vKipcbiAqIExhcCBpbnN0YW5jZSBjYWNoZVxuICpcbiAqIEBwcml2YXRlXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5MYXAuJCRpbnN0YW5jZXMgPSB7fVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAdHlwZSB7UmVnRXhwfVxuICovXG5MYXAuJCRhdWRpb0V4dGVuc2lvblJlZ0V4cCA9IC9tcDN8d2F2fG9nZ3xhaWZmL2lcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQHR5cGUge09iamVjdH1cbiAqL1xuTGFwLiQkZGVmYXVsdFNldHRpbmdzID0ge1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBjYWxsYmFja3MgZm9yIGFueSBjdXN0b20gTGFwIGV2ZW50LCB3aGVyZSB0aGUgb2JqZWN0IGtleVxuICAgKiBpcyB0aGUgZXZlbnQgbmFtZSwgYW5kIHRoZSB2YWx1ZSBpcyB0aGUgY2FsbGJhY2suIEN1cnJlbnQgbGlzdCBvZlxuICAgKiBjdXN0b20gZXZlbnRzIHRoYXQgYXJlIGZpcmVkIGluY2x1ZGU6XG4gICAqXG4gICAqICsgbG9hZFxuICAgKiArIHBsYXlcbiAgICogKyBwYXVzZVxuICAgKiArIHRvZ2dsZVBsYXlcbiAgICogKyBzZWVrXG4gICAqICsgdHJhY2tDaGFuZ2VcbiAgICogKyBhbGJ1bUNoYW5nZVxuICAgKiArIHZvbHVtZUNoYW5nZVxuICAgKlxuICAgKiBUaGVzZSBldmVudHMgYXJlIGZpcmVkIGF0IHRoZSBlbmQgb2YgdGhlaXIgcmVzcGVjdGl2ZVxuICAgKiBET00gYW5kIEF1ZGlvIGV2ZW50IGxpZmVjeWNsZXMsIGFzIHdlbGwgYXMgTGFwIGxvZ2ljIGF0dGFjaGVkIHRvIHRob3NlLiBGb3IgZXhhbXBsZSB3aGVuXG4gICAqIExhcCNlbHMucGxheVBhdXNlIGlzIGNsaWNrZWQgd2hlbiBpbml0aWFsbHkgcGF1c2VkLCB0aGUgRE9NIGV2ZW50IGlzIGZpcmVkLCBBdWRpbyB3aWxsIGJlZ2luIHBsYXlpbmcsXG4gICAqIExhcCB3aWxsIHJlbW92ZSB0aGUgbGFwLS1wYXVzZWQgY2xhc3MgYW5kIGFkZCB0aGUgbGFwLS1wbGF5aW5nIGNsYXNzIHRvIHRoZSBlbGVtZW50LCBhbmQgZmluYWxseVxuICAgKiB0aGUgY3VzdG9tICdwbGF5JyBldmVudCBpcyB0cmlnZ2VyZWQuIE5vdGUgYWxzbyB0aGF0IHlvdSBjYW4gc3Vic2NyaWJlIHRvIGFueSBjdXN0b20gZXZlbnRcbiAgICogdmlhIGBMYXAjb24oZXZlbnQsIGNhbGxiYWNrKWBcbiAgICpcbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIGNhbGxiYWNrczoge30sXG5cbiAgLyoqXG4gICAqIFdoZW4gdHJ1ZSwgb3V0cHV0cyBiYXNpYyBpbnNwZWN0aW9uIGluZm8gYW5kIHdhcm5pbmdzXG4gICAqXG4gICAqIEB0eXBlIHtCb29sZWFufVxuICAgKi9cbiAgZGVidWc6IGZhbHNlLFxuXG4gIC8qKlxuICAgKiBTdXBwbHkgYW4gYXJyYXkgb2YgcGx1Z2lucyAoY29uc3RydWN0b3JzKSB3aGljaCB3aWxsXG4gICAqIGJlIGNhbGxlZCB3aXRoIHRoZSBMYXAgaW5zdGFuY2UgYXMgdGhlaXIgc29sZSBhcmd1bWVudC5cbiAgICogVGhlIHBsdWdpbiBpbnN0YW5jZXMgdGhlbXNlbHZlcyB3aWxsIGJlIGF2YWlsYWJsZSBpbiB0aGUgc2FtZSBvcmRlclxuICAgKiB2aWEgYExhcCNwbHVnaW5zYCBhcnJheVxuICAgKlxuICAgKiBAdHlwZSB7QXJyYXl9XG4gICAqL1xuICBwbHVnaW5zOiBbXSxcblxuICBzdGFydGluZ0FsYnVtSW5kZXg6IDAsXG4gIHN0YXJ0aW5nVHJhY2tJbmRleDogMCxcblxuICAvKipcbiAgICogVGhlIGFtb3VudCBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCB3aGlsZSBob2xkaW5nXG4gICAqIGBMYXAjZWxzLnNlZWtCYWNrd2FyZGAgb3IgYExhcCNlbHMuc2Vla0ZvcndhcmRgIGJlZm9yZSBleGVjdXRpbmcgYW5vdGhlclxuICAgKiBzZWVrIGluc3RydWN0aW9uXG4gICAqXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICBzZWVrSW50ZXJ2YWw6IDUsXG5cbiAgLyoqXG4gICAqIEhvdyBmYXIgZm9yd2FyZCBvciBiYWNrIGluIG1pbGxpc2Vjb25kcyB0byBzZWVrIHdoZW5cbiAgICogY2FsbGluZyBzZWVrRm9yd2FyZCBvciBzZWVrQmFja3dhcmRcbiAgICpcbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHNlZWtUaW1lOiAyNTAsXG5cbiAgLyoqXG4gICAqIFByb3ZpZGUgeW91ciBvd24gY3VzdG9tIHNlbGVjdG9ycyBmb3IgZWFjaCBlbGVtZW50XG4gICAqIGluIHRoZSBMYXAjZWxzIGhhc2guIE90aGVyd2lzZSBMYXAuJCRkZWZhdWx0U2VsZWN0b3JzIGFyZSB1c2VkXG4gICAqXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqL1xuICBzZWxlY3RvcnM6IHt9LFxuXG4gIHRyYWNrTnVtYmVyUG9zdGZpeDogJyAtICcsXG5cbiAgLyoqXG4gICAqIFNpZ25hbCB0aGF0IHlvdSB3aWxsIGJlIHVzaW5nIGEgbmF0aXZlIEhUTUw1IGBwcm9ncmVzc2AgZWxlbWVudFxuICAgKiB0byB0cmFjayBhdWRpbyBidWZmZXJlZCBhbW91bnQuIFJlcXVpcmVzIHRoYXQgYSBgbGFwX19wcm9ncmVzc2AgZWxlbWVudFxuICAgKiBpcyBmb3VuZCB1bmRlciB0aGUgYExhcCNlbGVtZW50YFxuICAgKlxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG4gIHVzZU5hdGl2ZVByb2dyZXNzOiBmYWxzZSxcblxuICAvKipcbiAgICogU2lnbmFsIHRoYXQgeW91IHdpbGwgYmUgdXNpbmcgYSBuYXRpdmUgSFRNTDUgYGlucHV0W3R5cGU9cmFuZ2VdYCBlbGVtZW50XG4gICAqIGZvciB0cmFjayBzZWVraW5nIGNvbnRyb2wuIFJlcXVpcmVzIHRoYXQgYSBgbGFwX19zZWVrLXJhbmdlYCBlbGVtZW50XG4gICAqIGlzIGZvdW5kIHVuZGVyIHRoZSBgTGFwI2VsZW1lbnRgXG4gICAqXG4gICAqIEB0eXBlIHtCb29sZWFufVxuICAgKi9cbiAgdXNlTmF0aXZlU2Vla1JhbmdlOiBmYWxzZSxcblxuICAvKipcbiAgICogU2lnbmFsIHRoYXQgeW91IHdpbGwgYmUgdXNpbmcgYSBuYXRpdmUgSFRNTDUgYGlucHV0W3R5cGU9cmFuZ2VdYCBlbGVtZW50XG4gICAqIGZvciB2b2x1bWUgY29udHJvbC4gUmVxdWlyZXMgdGhhdCBhIGBsYXBfX3ZvbHVtZS1yYW5nZWAgZWxlbWVudFxuICAgKiBpcyBmb3VuZCB1bmRlciB0aGUgYExhcCNlbGVtZW50YFxuICAgKlxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG4gIHVzZU5hdGl2ZVZvbHVtZVJhbmdlOiBmYWxzZSxcblxuICAvKipcbiAgICogU2V0IHRoZSBhbW91bnQgb2Ygdm9sdW1lIHRvIGluY3JlbWVudC9kZWNyZW1lbnQgd2hlbmV2ZXJcbiAgICogYSBgbGFwX192b2x1bWUtdXBgIG9yIGBsYXBfX3ZvbHVtZS1kb3duYCBlbGVtZW50IGlzIGNsaWNrZWQuXG4gICAqIE5vdGUgdGhhdCBhdWRpbyB2b2x1bWUgaXMgZmxvYXRpbmcgcG9pbnQgcmFuZ2UgWzAsIDFdXG4gICAqIERvZXMgbm90IGFwcGx5IHRvIGBsYXBfX3ZvbHVtZS1yYW5nZWAuXG4gICAqXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB2b2x1bWVJbnRlcnZhbDogMC4wNVxufVxuXG5MYXAuJCRkZWZhdWx0U2VsZWN0b3JzID0ge1xuICBzdGF0ZToge1xuICAgIHBsYXlsaXN0SXRlbUN1cnJlbnQ6ICAnbGFwX19wbGF5bGlzdF9faXRlbS0tY3VycmVudCcsXG4gICAgcGxheWluZzogICAgICAgICAgICAgICdsYXAtLXBsYXlpbmcnLFxuICAgIHBhdXNlZDogICAgICAgICAgICAgICAnbGFwLS1wYXVzZWQnLFxuICAgIGhpZGRlbjogICAgICAgICAgICAgICAnbGFwLS1oaWRkZW4nXG4gIH0sXG4gIGFsYnVtOiAgICAgICAgICAgICAgICdsYXBfX2FsYnVtJyxcbiAgYXJ0aXN0OiAgICAgICAgICAgICAgJ2xhcF9fYXJ0aXN0JyxcbiAgYnVmZmVyZWQ6ICAgICAgICAgICAgJ2xhcF9fYnVmZmVyZWQnLFxuICBjb3ZlcjogICAgICAgICAgICAgICAnbGFwX19jb3ZlcicsXG4gIGN1cnJlbnRUaW1lOiAgICAgICAgICdsYXBfX2N1cnJlbnQtdGltZScsXG4gIGRpc2NvZzogICAgICAgICAgICAgICdsYXBfX2Rpc2NvZycsXG4gIGRpc2NvZ0l0ZW06ICAgICAgICAgICdsYXBfX2Rpc2NvZ19faXRlbScsXG4gIGRpc2NvZ1BhbmVsOiAgICAgICAgICdsYXBfX2Rpc2NvZ19fcGFuZWwnLFxuICBkdXJhdGlvbjogICAgICAgICAgICAnbGFwX19kdXJhdGlvbicsXG4gIGluZm86ICAgICAgICAgICAgICAgICdsYXBfX2luZm8nLCAvLyBidXR0b25cbiAgaW5mb1BhbmVsOiAgICAgICAgICAgJ2xhcF9faW5mby1wYW5lbCcsXG4gIG5leHQ6ICAgICAgICAgICAgICAgICdsYXBfX25leHQnLFxuICBuZXh0QWxidW06ICAgICAgICAgICAnbGFwX19uZXh0LWFsYnVtJyxcbiAgcGxheVBhdXNlOiAgICAgICAgICAgJ2xhcF9fcGxheS1wYXVzZScsXG4gIHBsYXlsaXN0OiAgICAgICAgICAgICdsYXBfX3BsYXlsaXN0JywgLy8gYnV0dG9uXG4gIHBsYXlsaXN0SXRlbTogICAgICAgICdsYXBfX3BsYXlsaXN0X19pdGVtJywgLy8gbGlzdCBpdGVtXG4gIHBsYXlsaXN0UGFuZWw6ICAgICAgICdsYXBfX3BsYXlsaXN0X19wYW5lbCcsXG4gIHBsYXlsaXN0VHJhY2tOdW1iZXI6ICdsYXBfX3BsYXlsaXN0X190cmFjay1udW1iZXInLFxuICBwbGF5bGlzdFRyYWNrVGl0bGU6ICAnbGFwX19wbGF5bGlzdF9fdHJhY2stdGl0bGUnLFxuICBwcmV2OiAgICAgICAgICAgICAgICAnbGFwX19wcmV2JyxcbiAgcHJldkFsYnVtOiAgICAgICAgICAgJ2xhcF9fcHJldi1hbGJ1bScsXG4gIHByb2dyZXNzOiAgICAgICAgICAgICdsYXBfX3Byb2dyZXNzJyxcbiAgc2Vla0JhY2t3YXJkOiAgICAgICAgJ2xhcF9fc2Vlay1iYWNrd2FyZCcsXG4gIHNlZWtGb3J3YXJkOiAgICAgICAgICdsYXBfX3NlZWstZm9yd2FyZCcsXG4gIHNlZWtSYW5nZTogICAgICAgICAgICdsYXBfX3NlZWstcmFuZ2UnLFxuICB0cmFja051bWJlcjogICAgICAgICAnbGFwX190cmFjay1udW1iZXInLCAvLyB0aGUgY3VycmVudGx5IGN1ZWQgdHJhY2tcbiAgdHJhY2tUaXRsZTogICAgICAgICAgJ2xhcF9fdHJhY2stdGl0bGUnLFxuICB2b2x1bWVCdXR0b246ICAgICAgICAnbGFwX192b2x1bWUtYnV0dG9uJyxcbiAgdm9sdW1lRG93bjogICAgICAgICAgJ2xhcF9fdm9sdW1lLWRvd24nLFxuICB2b2x1bWVSZWFkOiAgICAgICAgICAnbGFwX192b2x1bWUtcmVhZCcsXG4gIHZvbHVtZVJhbmdlOiAgICAgICAgICdsYXBfX3ZvbHVtZS1yYW5nZScsXG4gIHZvbHVtZVVwOiAgICAgICAgICAgICdsYXBfX3ZvbHVtZS11cCdcbn1cblxuaWYgKHdpbmRvdykgd2luZG93LkxhcCA9IExhcFxuIl19
