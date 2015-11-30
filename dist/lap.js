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

var IS_MOBILE = false;

var Lap = (function (_Bus) {
  _inherits(Lap, _Bus);

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

    if (!postpone) _this.initialize();

    if (_this.settings.debug) {
      var echo = function echo(e) {
        _this.on(e, function () {
          return console.info('%c%s handler called', 'color:#800080', e);
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

    return _possibleConstructorReturn(_this, _this);
  }

  _createClass(Lap, [{
    key: 'setLib',
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
  }, {
    key: 'initialize',
    value: function initialize() {
      var _this2 = this;

      // state
      this.seeking = false;
      this.volumeChanging = false;
      this.mouseDownTimer = 0;
      this.playing = false;

      this.plugins = this.settings.plugins;

      this.update();
      this.$$initAudio();
      this.$$initElements();
      this.$$addAudioListeners();
      if (!IS_MOBILE) this.$$addVolumeListeners();
      this.$$addSeekListeners();
      this.$$addListeners();
      // Lap.each(this.settings.callbacks, (fn, key) => this.on(key, fn))
      Object.keys(this.settings.callbacks).forEach(function (key) {
        return _this2.on(key, _this2.settings.callbacks[key]);
      });
      this.$$activatePlugins();
      this.trigger('load');
    }

    /**
     * Configures instance variables relative to the current album.
     * Called on initialization and whenever an album is changed.
     *
     * @return {Lap} this
     */

  }, {
    key: 'update',
    value: function update() {
      var _this3 = this;

      this.albumIndex = this.settings.startingAlbumIndex || 0;
      this.albumCount = this.lib.length;
      this.trackIndex = this.settings.startingTrackIndex || 0;
      this.playlistPopulated = false;

      var currentLibItem = this.lib[this.albumIndex];

      var keys = ['artist', 'album', 'files', 'cover', 'tracklist', 'replacement'];
      keys.forEach(function (key) {
        return _this3[key] = currentLibItem[key];
      });

      this.trackCount = this.files.length;

      // replacement === [regexp, replacement, optional_flags]
      if (this.replacement) {
        var re = this.replacement;
        // for replacment without value specified, empty string
        if (typeof re === 'string') re = [re, ''];
        // re may contain string-wrapped regexp (from json), convert if so
        if (re instanceof Array) {
          var flags = re[2];
          re[0] = new RegExp(re[0], flags !== undefined ? flags : 'g');
        }
        this.replacement = re;
      }
      this.formatTracklist();
      return this;
    }

    /**
     * Instantiate every plugin's contructor with this Lap instance
     *
     * @return {Lap} this
     */

  }, {
    key: '$$activatePlugins',
    value: function $$activatePlugins() {
      var _this4 = this;

      this.plugins.forEach(function (plugin, i) {
        return _this4.plugins[i] = new plugin(_this4);
      });
      return this;
    }
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
    }
  }, {
    key: '$$updateSource',
    value: function $$updateSource() {
      this.audio.src = this.files[this.trackIndex];
      return this;
    }
  }, {
    key: '$$initElements',
    value: function $$initElements() {
      var _this5 = this;

      this.els = {};
      this.selectors = { state: {} };
      // Lap.each(Lap.$$defaultSelectors, (selector, key) => {
      //   if (key !== 'state') {

      //     this.selectors[key] = this.settings.selectors.hasOwnProperty(key)
      //       ? this.settings.selectors[key]
      //       : selector

      //     const el = this.element.querySelector(`.${this.selectors[key]}`)
      //     if (el) this.els[key] = el

      //   } else {
      //     const hasStateOverrides = !!this.settings.selectors.state
      //     if (!hasStateOverrides) return
      //     Lap.each(Lap.$$defaultSelectors.state, (sel, k) => {
      //       if (this.settings.selectors.hasOwnProperty(k)) {
      //         this.selectors.state[k] = this.settings.state[k]
      //       } else {
      //         this.selectors.state[k] = sel
      //       }
      //     })
      //   }
      // })
      Object.keys(Lap.$$defaultSelectors).forEach(function (key) {
        if (key !== 'state') {
          if (_this5.settings.selectors.hasOwnProperty[key]) {
            _this5.selectors[key] = _this5.settings.selectors[key];
          } else {
            _this5.selectors[key] = Lap.$$defaultSelectors[key];
          }

          var el = _this5.element.querySelector('.' + _this5.selectors[key]);
          if (el) _this5.els[key] = el;
        } else {
          (function () {
            var hasStateOverrides = !!_this5.settings.selectors.state;
            Object.keys(Lap.$$defaultSelectors.state).forEach(function (k) {
              if (hasStateOverrides && _this5.settings.state.hasOwnProperty[k]) {
                _this5.selectors.state[k] = _this5.settings.state[k];
              } else {
                _this5.selectors.state[k] = Lap.$$defaultSelectors.state[k];
              }
            });
          })();
        }
      });
    }

    /**
     * A wrapper around this Lap instances `audio.addEventListener` that 
     * ensures handlers are cached for later removal in the `Lap#destroy` call
     */

  }, {
    key: 'addAudioListener',
    value: function addAudioListener(event, listener) {
      this.audioListeners = this.audioListeners || {};
      this.audioListeners[event] = this.audioListeners[event] || [];

      var bound = listener.bind(this);
      this.audioListeners[event].push(bound);
      this.audio.addEventListener(event, bound);
    }
  }, {
    key: '$$addAudioListeners',
    value: function $$addAudioListeners() {
      var _this6 = this;

      var audio = this.audio;
      var els = this.els;
      var nativeProgress = !!(this.settings.useNativeProgress && els.progress);

      this.audioListeners = {};

      var _addListener = function _addListener(condition, event, listener) {
        if (condition) _this6.addAudioListener(event, listener);
      };

      _addListener(!!(els.buffered || nativeProgress), 'progress', function () {
        // TODO: verify if this really needs to be type cast...
        var buffered = +_this6.bufferFormatted();
        if (els.buffered) els.buffered.innerHTML = buffered;
        if (nativeProgress) els.progress.value = buffered;
      });

      _addListener(!!els.currentTime, 'timeupdate', function () {
        els.currentTime.innerHTML = _this6.currentTimeFormatted();
      });

      _addListener(!!els.duration, 'durationchange', function () {
        els.duration.innerHTML = _this6.durationFormatted();
      });

      _addListener(true, 'ended', function () {
        if (_this6.playing) {
          _this6.next();
          audio.play();
        }
      });

      return this;
    }
  }, {
    key: 'addListener',
    value: function addListener(elementName, event, listener) {
      // ie. listeners = { seekRange: { click: [handlers], mousedown: [handlers], ... }, ... }
      this.listeners = this.listeners || {};
      this.listeners[elementName] = this.listeners[elementName] || {};
      this.listeners[elementName][event] = this.listeners[elementName][event] || [];

      var bound = listener.bind(this);
      this.listeners[elementName][event].push(bound);
      this.els[elementName].addEventListener(event, bound);
    }
  }, {
    key: '$$addListeners',
    value: function $$addListeners() {
      var _this7 = this;

      var els = this.els;
      this.listeners = {};

      // helper. ensure we aren't adding listeners to non-existent elements
      var _addListener = function _addListener(elementName, event, listener) {
        if (els[elementName]) _this7.addListener(elementName, event, _this7[listener]);
      };

      _addListener('playPause', 'click', 'togglePlay');
      _addListener('prev', 'click', 'prev');
      _addListener('next', 'click', 'next');
      _addListener('prevAlbum', 'click', 'prevAlbum');
      _addListener('nextAlbum', 'click', 'nextAlbum');
      _addListener('volumeUp', 'click', 'incVolume');
      _addListener('volumeDown', 'click', 'decVolume');
      // _addListener('discog', 'click', 'discogClick')
      // _addListener('playlist', 'click', 'playlistClick')

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
        _if('trackTitle', 'updateTrackTitleEl');
        _if('trackNumber', 'updateTrackNumberEl');
        _if('artist', 'updateArtistEl');
        _if('album', 'updateAlbumEl');
        _if('cover', 'updateCover');
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
        _if('trackTitle', 'updateTrackTitleEl');
        _if('trackNumber', 'updateTrackNumberEl');
        _if('currentTime', function () {
          return els.currentTime.innerHTML = _this7.currentTimeFormatted();
        });
        _if('duration', function () {
          return els.duration.innerHTML = _this7.durationFormatted();
        });
      });

      this.on('albumChange', function () {
        _if('trackTitle', 'updateTrackTitleEl');
        _if('trackNumber', 'updateTrackNumberEl');
        _if('artist', 'updateArtistEl');
        _if('album', 'updateAlbumEl');
        _if('cover', 'updateCover');
      });
    }
  }, {
    key: '$$addSeekListeners',
    value: function $$addSeekListeners() {
      var _this8 = this;

      var els = this.els;
      var audio = this.audio;
      var seekRange = els.seekRange;
      var nativeSeek = !!(this.settings.useNativeSeekRange && seekRange && seekRange.els.length);

      if (nativeSeek) {
        // TODO: put us in listeners cache...
        audio.addEventListener('timeupdate', function (e) {
          if (!_this8.seeking) {
            seekRange.get(0).value = _.scale(audio.currentTime, 0, audio.duration, 0, 100);
          }
        });
        seekRange.addEventListener('mousedown', function (e) {
          _this8.seeking = true;
        });
        seekRange.addEventListener('mouseup', function (e) {
          var el = seekRange.get(0);
          if (!el.value) _this8.logger.debug('what the fuck! ' + el);
          audio.currentTime = _.scale(el.value, 0, el.max, 0, audio.duration);
          _this8.trigger('seek');
          _this8.seeking = false;
        });
      } else {
        // using buttons
        [els.seekForward, els.seekBackward].forEach(function (el) {
          if (!el) return;
          // TODO: put me in listeners cache...
          el.addEventListener('mousedown', function (e) {
            _this8.seeking = true;
            // if ($(e.target).hasClass(this.selectors.seekForward)) {
            if (e.target.className.indexOf(_this8.selectors.seekForward) > -1) {
              _this8.seekForward();
            } else {
              _this8.seekBackward();
            }
          });
          el.addEventListener('mouseup', function (e) {
            _this8.seeking = false;
            clearTimeout(_this8.mouseDownTimer);
          });
        });
      }
    }
  }, {
    key: '$$addVolumeListeners',
    value: function $$addVolumeListeners() {
      var _this9 = this;

      if (IS_MOBILE) return this;

      var lap = this;
      var els = this.els;
      var audio = this.audio;
      var vslider = els.volumeRange;

      if (this.settings.useNativeVolumeRange && vslider && vslider.els.length) {
        audio.addEventListener('volumechange', function () {
          if (!_this9.volumeChanging) {
            vslider.get(0).value = _this9.volumeFormatted();
          }
        });
        vslider.on('mousedown', function () {
          _this9.volumeChanging = true;
        }).on('mouseup', function () {
          audio.volume = vslider.get(0).value * 0.01;
          _this9.trigger('volumeChange');
          _this9.volumeChanging = false;
        });
      }
    }
  }, {
    key: 'incVolume',
    value: function incVolume() {
      if (IS_MOBILE) return this;

      this.setVolume(true);
      return this;
    }
  }, {
    key: 'decVolume',
    value: function decVolume() {
      if (IS_MOBILE) return this;

      this.setVolume(false);
      return this;
    }
  }, {
    key: 'setVolume',
    value: function setVolume(up) {
      if (IS_MOBILE) return this;

      var vol = this.audio.volume,
          interval = this.settings.volumeInterval;
      if (up) {
        this.audio.volume = vol + interval >= 1 ? 1 : vol + interval;
      } else {
        this.audio.volume = vol - interval <= 0 ? 0 : vol - interval;
      }
      this.trigger('volumeChange');
      return this;
    }
  }, {
    key: 'volumeFormatted',
    value: function volumeFormatted() {
      return Math.round(this.audio.volume * 100);
    }
  }, {
    key: 'updateTrackTitleEl',
    value: function updateTrackTitleEl() {
      this.els.trackTitle.innerHTML = this.tracklist[this.trackIndex];
      return this;
    }
  }, {
    key: 'updateTrackNumberEl',
    value: function updateTrackNumberEl() {
      this.els.trackNumber.innerHTML = +this.trackIndex + 1;
      return this;
    }
  }, {
    key: 'updateArtistEl',
    value: function updateArtistEl() {
      this.els.artist.innerHTML = this.artist;
      return this;
    }
  }, {
    key: 'updateAlbumEl',
    value: function updateAlbumEl() {
      this.els.album.innerHTML = this.album;
      return this;
    }
  }, {
    key: 'updateCover',
    value: function updateCover() {
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
    key: 'seekBackward',
    value: function seekBackward() {
      var _this10 = this;

      if (!this.seeking) return this;
      this.mouseDownTimer = setInterval(function () {
        var applied = _this10.audio.currentTime + _this10.settings.seekInterval * -1;
        _this10.audio.currentTime = applied <= 0 ? 0 : applied;
      }, this.settings.seekTime);
      return this;
    }
  }, {
    key: 'seekForward',
    value: function seekForward() {
      var _this11 = this;

      if (!this.seeking) return this;
      this.mouseDownTimer = setInterval(function () {
        var applied = _this11.audio.currentTime + _this11.settings.seekInterval;
        _this11.audio.currentTime = applied >= _this11.audio.duration ? _this11.audio.duration : applied;
      }, this.settings.seekTime);
      return this;
    }
  }, {
    key: 'formatTracklist',
    value: function formatTracklist() {
      if (this.tracklist && this.tracklist.length) {
        return this;
      }
      var re = this.replacement;
      var tracklist = [];
      for (var i = 0; i < this.trackCount; i++) {
        var t = this.files[i];
        // strip ext
        t = t.slice(t.lastIndexOf('.') + 1);
        // get last path segment
        t = t.slice(t.lastIndexOf('/') + 1);
        if (re) t = t.replace(re[0], re[1]);
        tracklist[i] = t.trim();
      }
      this.tracklist = tracklist;
      return this;
    }
  }, {
    key: 'bufferFormatted',
    value: function bufferFormatted() {
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

    /** internal helper */

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
    key: 'currentTimeFormatted',
    value: function currentTimeFormatted() {
      return this.$$getAudioTimeFormatted('currentTime');
      // if (isNaN(this.audio.duration)) return '00:00'
      // let formatted = Lap.formatTime(Math.floor(this.audio.currentTime.toFixed(1)))
      // if (this.audio.duration < 3600 || formatted === '00:00:00') {
      //   formatted = formatted.slice(3) // nn:nn
      // }
      // return formatted
    }
  }, {
    key: 'durationFormatted',
    value: function durationFormatted() {
      return this.$$getAudioTimeFormatted('duration');
      // if (isNaN(this.audio.duration)) return '00:00'
      // let formatted = Lap.formatTime(Math.floor(this.audio.duration.toFixed(1)))
      // if (this.audio.duration < 3600 || formatted === '00:00:00') {
      //   formatted = formatted.slice(3) // nn:nn
      // }
      // return formatted
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

    /**
     * Removes all dom, audio, and internal event handlers, then deletes all properties
     * @param  {Lap} lap the Lap instance
     */

  }], [{
    key: 'getInstance',
    value: function getInstance(id) {
      return Lap.$$instances[id];
    }
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
  }, {
    key: 'destroy',
    value: function destroy(lap) {

      // remove dom event handlers
      Lap.each(lap.listeners, function (events, elementName) {
        return delete lap.listeners[elementName];
      });

      // remove audio events
      Lap.each(lap.audioListeners, function (listeners, event) {
        return delete lap.audioListeners[event];
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

exports.default = Lap;

Lap.$$instances = [];

Lap.$$audioExtensionRegExp = /mp3|wav|ogg|aiff/i;

Lap.$$defaultSettings = {
  callbacks: {},
  debug: false,
  discogPlaylistExclusive: true,
  plugins: [],
  prependTrackNumbers: true,
  replacement: null,
  startingAlbumIndex: 0,
  startingTrackIndex: 0,
  seekInterval: 5,
  seekTime: 250,
  selectors: {}, // see #$$initElements
  selectorPrefix: 'lap',
  trackNumberPostfix: ' - ',
  useNativeProgress: false,
  useNativeSeekRange: false,
  useNativeVolumeRange: false,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGxhcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNBQSxJQUFNLFNBQVMsR0FBRyxLQUFLLENBQUE7O0lBRUYsR0FBRztZQUFILEdBQUc7O0FBRXRCLFdBRm1CLEdBQUcsQ0FFVixPQUFPLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBa0I7UUFBaEIsUUFBUSx5REFBQyxLQUFLOzswQkFGOUIsR0FBRzs7Ozt1RUFBSCxHQUFHOztBQU1wQixVQUFLLEVBQUUsR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDLEVBQUUsR0FBRyxPQUFPLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFBO0FBQ3JFLE9BQUcsQ0FBQyxXQUFXLENBQUMsTUFBSyxFQUFFLENBQUMsUUFBTyxDQUFBOztBQUUvQixVQUFLLE9BQU8sR0FBRyxPQUFPLE9BQU8sS0FBSyxRQUFRLEdBQ3RDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQy9CLE9BQU8sQ0FBQTs7QUFFWCxVQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTs7QUFFaEIsVUFBSyxRQUFRLEdBQUcsRUFBRSxDQUFBO0FBQ2xCLFFBQUksT0FBTyxFQUFFO0FBQ1gsU0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsVUFBQyxHQUFHLEVBQUUsR0FBRyxFQUFLO0FBQzVDLFlBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFLLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUEsS0FDN0QsTUFBSyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBO09BQzlCLENBQUMsQ0FBQTtLQUNILE1BQU07QUFDTCxZQUFLLFFBQVEsR0FBRyxHQUFHLENBQUMsaUJBQWlCLENBQUE7S0FDdEM7O0FBRUQsUUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFLLFVBQVUsRUFBRSxDQUFBOztBQUVoQyxRQUFJLE1BQUssUUFBUSxDQUFDLEtBQUssRUFBRTtBQUN2QixVQUFNLElBQUksR0FBRyxTQUFQLElBQUksQ0FBRyxDQUFDLEVBQUk7QUFDaEIsY0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFO2lCQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQztTQUFBLENBQUMsQ0FBQTtPQUMxRSxDQUFBO0FBQ0QsVUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ1osVUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ1osVUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0FBQ2IsVUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ1osVUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQ25CLFVBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUNuQixVQUFJLENBQUMsY0FBYyxDQUFDLENBQUE7S0FDckI7O0FBRUQsb0RBQVc7R0FDWjs7ZUF6Q2tCLEdBQUc7OzJCQXdGZixHQUFHLEVBQUU7QUFDVixVQUFNLElBQUksVUFBVSxHQUFHLHlDQUFILEdBQUcsQ0FBQSxDQUFBO0FBQ3ZCLFVBQU0sT0FBTyxHQUFHLEdBQUcsWUFBWSxLQUFLLENBQUE7QUFDcEMsVUFBSSxPQUFPLEVBQUU7QUFDWCxZQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQTtPQUNmLE1BQU0sSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFO0FBQzVCLFlBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtPQUNqQixNQUFNLElBQUksSUFBSSxLQUFLLFFBQVEsSUFBSSxHQUFHLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQ3BFLFlBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtPQUM5QixNQUFNO0FBQ0wsY0FBTSxJQUFJLEtBQUssQ0FBSSxHQUFHLDBDQUF1QyxDQUFBO09BQzlEO0FBQ0QsYUFBTyxJQUFJLENBQUE7S0FDWjs7O2lDQUVZOzs7O0FBR1gsVUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUE7QUFDcEIsVUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUE7QUFDM0IsVUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUE7QUFDdkIsVUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUE7O0FBRXBCLFVBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUE7O0FBRXBDLFVBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtBQUNiLFVBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNsQixVQUFJLENBQUMsY0FBYyxFQUFFLENBQUE7QUFDckIsVUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUE7QUFDMUIsVUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQTtBQUMzQyxVQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTtBQUN6QixVQUFJLENBQUMsY0FBYyxFQUFFOztBQUFBLEFBRXJCLFlBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQSxHQUFHO2VBQUksT0FBSyxFQUFFLENBQUMsR0FBRyxFQUFFLE9BQUssUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUFBLENBQUMsQ0FBQTtBQUMvRixVQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQTtBQUN4QixVQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0tBQ3JCOzs7Ozs7Ozs7Ozs2QkFRUTs7O0FBQ1AsVUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFrQixJQUFJLENBQUMsQ0FBQTtBQUN2RCxVQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFBO0FBQ2pDLFVBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsSUFBSSxDQUFDLENBQUE7QUFDdkQsVUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQTs7QUFFOUIsVUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7O0FBRWhELFVBQU0sSUFBSSxHQUFHLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxhQUFhLENBQUMsQ0FBQTtBQUM5RSxVQUFJLENBQUMsT0FBTyxDQUFDLFVBQUEsR0FBRztlQUFJLE9BQUssR0FBRyxDQUFDLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQztPQUFBLENBQUMsQ0FBQTs7QUFFcEQsVUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU07OztBQUFBLEFBR25DLFVBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtBQUNwQixZQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsV0FBVzs7QUFBQSxBQUV6QixZQUFJLE9BQU8sRUFBRSxLQUFLLFFBQVEsRUFBRSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7O0FBQUEsQUFFekMsWUFBSSxFQUFFLFlBQVksS0FBSyxFQUFFO0FBQ3ZCLGNBQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNuQixZQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssS0FBSyxTQUFTLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFBO1NBQzdEO0FBQ0QsWUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUE7T0FDdEI7QUFDRCxVQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7QUFDdEIsYUFBTyxJQUFJLENBQUE7S0FDWjs7Ozs7Ozs7Ozt3Q0FPbUI7OztBQUNsQixVQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFDLE1BQU0sRUFBRSxDQUFDO2VBQUssT0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxNQUFNLFFBQU07T0FBQSxDQUFDLENBQUE7QUFDdkUsYUFBTyxJQUFJLENBQUE7S0FDWjs7O2tDQUVhO0FBQ1osVUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFBO0FBQ3hCLFVBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQTtBQUMzQixVQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUMxQyxjQUFRLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3RELFVBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsQ0FBQTtBQUMzRCxVQUFJLE9BQU8sS0FBSyxVQUFVLElBQUksT0FBTyxLQUFLLE9BQU8sRUFBRTtBQUNqRCxZQUFJLENBQUMsY0FBYyxFQUFFLENBQUE7QUFDckIsWUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFBO09BQ3RCLE1BQU07O0FBRUwsZUFBTyxDQUFDLElBQUksb0NBQWtDLFFBQVEsZ0JBQWEsQ0FBQTtPQUNwRTtLQUNGOzs7cUNBRWdCO0FBQ2YsVUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7QUFDNUMsYUFBTyxJQUFJLENBQUE7S0FDWjs7O3FDQUVnQjs7O0FBQ2YsVUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUE7QUFDYixVQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxBQXVCOUIsWUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQSxHQUFHLEVBQUk7QUFDakQsWUFBSSxHQUFHLEtBQUssT0FBTyxFQUFFO0FBQ25CLGNBQUksT0FBSyxRQUFRLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUMvQyxtQkFBSyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBSyxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1dBQ25ELE1BQU07QUFDTCxtQkFBSyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFBO1dBQ2xEOztBQUVELGNBQU0sRUFBRSxHQUFHLE9BQUssT0FBTyxDQUFDLGFBQWEsT0FBSyxPQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBRyxDQUFBO0FBQ2hFLGNBQUksRUFBRSxFQUFFLE9BQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtTQUUzQixNQUFNOztBQUNMLGdCQUFNLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxPQUFLLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFBO0FBQ3pELGtCQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQSxDQUFDLEVBQUk7QUFDckQsa0JBQUksaUJBQWlCLElBQUksT0FBSyxRQUFRLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUM5RCx1QkFBSyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQUssUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtlQUNqRCxNQUFNO0FBQ0wsdUJBQUssU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO2VBQzFEO2FBQ0YsQ0FBQyxDQUFBOztTQUNIO09BQ0YsQ0FBQyxDQUFBO0tBQ0g7Ozs7Ozs7OztxQ0FNZ0IsS0FBSyxFQUFFLFFBQVEsRUFBRTtBQUNoQyxVQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLElBQUksRUFBRSxDQUFBO0FBQy9DLFVBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7O0FBRTdELFVBQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDakMsVUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDdEMsVUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUE7S0FDMUM7OzswQ0FFcUI7OztBQUNwQixVQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFBO0FBQ3hCLFVBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUE7QUFDcEIsVUFBTSxjQUFjLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQSxBQUFDLENBQUE7O0FBRTFFLFVBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFBOztBQUV4QixVQUFNLFlBQVksR0FBRyxTQUFmLFlBQVksQ0FBSSxTQUFTLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBSztBQUNuRCxZQUFJLFNBQVMsRUFBRSxPQUFLLGdCQUFnQixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQTtPQUN0RCxDQUFBOztBQUVELGtCQUFZLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLElBQUksY0FBYyxDQUFBLEFBQUMsRUFBRSxVQUFVLEVBQUUsWUFBTTs7QUFFakUsWUFBSSxRQUFRLEdBQUcsQ0FBQyxPQUFLLGVBQWUsRUFBRSxDQUFBO0FBQ3RDLFlBQUksR0FBRyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUE7QUFDbkQsWUFBSSxjQUFjLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFBO09BQ2xELENBQUMsQ0FBQTs7QUFFRixrQkFBWSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxZQUFNO0FBQ2xELFdBQUcsQ0FBQyxXQUFXLENBQUMsU0FBUyxHQUFHLE9BQUssb0JBQW9CLEVBQUUsQ0FBQTtPQUN4RCxDQUFDLENBQUE7O0FBRUYsa0JBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxZQUFNO0FBQ25ELFdBQUcsQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLE9BQUssaUJBQWlCLEVBQUUsQ0FBQTtPQUNsRCxDQUFDLENBQUE7O0FBRUYsa0JBQVksQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFlBQU07QUFDaEMsWUFBSSxPQUFLLE9BQU8sRUFBRTtBQUNoQixpQkFBSyxJQUFJLEVBQUUsQ0FBQTtBQUNYLGVBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQTtTQUNiO09BQ0YsQ0FBQyxDQUFBOztBQUVGLGFBQU8sSUFBSSxDQUFBO0tBQ1o7OztnQ0FFVyxXQUFXLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRTs7QUFFeEMsVUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQTtBQUNyQyxVQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQy9ELFVBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7O0FBRTdFLFVBQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDakMsVUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDOUMsVUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUE7S0FDckQ7OztxQ0FFZ0I7OztBQUNmLFVBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUE7QUFDcEIsVUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFOzs7QUFBQSxBQUduQixVQUFNLFlBQVksR0FBRyxTQUFmLFlBQVksQ0FBSSxXQUFXLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBSztBQUNyRCxZQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxPQUFLLFdBQVcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLE9BQUssUUFBUSxDQUFDLENBQUMsQ0FBQTtPQUMzRSxDQUFBOztBQUVELGtCQUFZLENBQUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQTtBQUNoRCxrQkFBWSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDckMsa0JBQVksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ3JDLGtCQUFZLENBQUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQTtBQUMvQyxrQkFBWSxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUE7QUFDL0Msa0JBQVksQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFBO0FBQzlDLGtCQUFZLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUM7Ozs7QUFBQSxBQUloRCxVQUFNLEdBQUcsR0FBRyxTQUFOLEdBQUcsQ0FBSSxXQUFXLEVBQUUsRUFBRSxFQUFLO0FBQy9CLFlBQUksT0FBSyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUU7QUFDekIsY0FBSSxPQUFPLEVBQUUsS0FBSyxRQUFRLEVBQUU7QUFDMUIsbUJBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQTtXQUNYLE1BQU07O0FBRUwsY0FBRSxFQUFFLENBQUE7V0FDTDtTQUNGO09BQ0YsQ0FBQTs7QUFFRCxVQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxZQUFNO0FBQ3BCLFdBQUcsQ0FBQyxZQUFZLEVBQUUsb0JBQW9CLENBQUMsQ0FBQTtBQUN2QyxXQUFHLENBQUMsYUFBYSxFQUFFLHFCQUFxQixDQUFDLENBQUE7QUFDekMsV0FBRyxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFBO0FBQy9CLFdBQUcsQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDLENBQUE7QUFDN0IsV0FBRyxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQTtBQUMzQixXQUFHLENBQUMsV0FBVyxFQUFFLFlBQU07QUFDckIsY0FBTSxDQUFDLEdBQUcsT0FBSyxTQUFTLENBQUMsS0FBSyxDQUFBO0FBQzlCLGNBQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUE7QUFDeEIsYUFBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQzFCLGlCQUFLLEVBQUUsQ0FBQyxNQUFNLEVBQUU7bUJBQU0sR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQztXQUFBLENBQUMsQ0FBQTtBQUM1RSxpQkFBSyxFQUFFLENBQUMsT0FBTyxFQUFFO21CQUFNLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUM7V0FBQSxDQUFDLENBQUE7U0FDOUUsQ0FBQyxDQUFBO09BQ0gsQ0FBQyxDQUFBOztBQUVGLFVBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLFlBQU07QUFDM0IsV0FBRyxDQUFDLFlBQVksRUFBRSxvQkFBb0IsQ0FBQyxDQUFBO0FBQ3ZDLFdBQUcsQ0FBQyxhQUFhLEVBQUUscUJBQXFCLENBQUMsQ0FBQTtBQUN6QyxXQUFHLENBQUMsYUFBYSxFQUFFO2lCQUFNLEdBQUcsQ0FBQyxXQUFXLENBQUMsU0FBUyxHQUFHLE9BQUssb0JBQW9CLEVBQUU7U0FBQSxDQUFDLENBQUE7QUFDakYsV0FBRyxDQUFDLFVBQVUsRUFBRTtpQkFBTSxHQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxPQUFLLGlCQUFpQixFQUFFO1NBQUEsQ0FBQyxDQUFBO09BQ3pFLENBQUMsQ0FBQTs7QUFFRixVQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxZQUFNO0FBQzNCLFdBQUcsQ0FBQyxZQUFZLEVBQUUsb0JBQW9CLENBQUMsQ0FBQTtBQUN2QyxXQUFHLENBQUMsYUFBYSxFQUFFLHFCQUFxQixDQUFDLENBQUE7QUFDekMsV0FBRyxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFBO0FBQy9CLFdBQUcsQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDLENBQUE7QUFDN0IsV0FBRyxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQTtPQUM1QixDQUFDLENBQUE7S0FDSDs7O3lDQUVvQjs7O0FBQ25CLFVBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUE7QUFDcEIsVUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQTtBQUN4QixVQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFBO0FBQy9CLFVBQU0sVUFBVSxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFrQixJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQSxBQUFDLENBQUE7O0FBRTVGLFVBQUksVUFBVSxFQUFFOztBQUVkLGFBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsVUFBQSxDQUFDLEVBQUk7QUFDeEMsY0FBSSxDQUFDLE9BQUssT0FBTyxFQUFFO0FBQ2pCLHFCQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1dBQy9FO1NBQ0YsQ0FBQyxDQUFBO0FBQ0YsaUJBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsVUFBQSxDQUFDLEVBQUk7QUFDM0MsaUJBQUssT0FBTyxHQUFHLElBQUksQ0FBQTtTQUNwQixDQUFDLENBQUE7QUFDRixpQkFBUyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxVQUFBLENBQUMsRUFBSTtBQUN6QyxjQUFJLEVBQUUsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3pCLGNBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQUssTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLENBQUMsQ0FBQTtBQUN4RCxlQUFLLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQ25FLGlCQUFLLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUNwQixpQkFBSyxPQUFPLEdBQUcsS0FBSyxDQUFBO1NBQ3JCLENBQUMsQ0FBQTtPQUVILE1BQU07O0FBQ0wsU0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQSxFQUFFLEVBQUk7QUFDaEQsY0FBSSxDQUFDLEVBQUUsRUFBRSxPQUFNOztBQUFBLEFBRWYsWUFBRSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxVQUFBLENBQUMsRUFBSTtBQUNwQyxtQkFBSyxPQUFPLEdBQUcsSUFBSTs7QUFBQSxBQUVuQixnQkFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBSyxTQUFTLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7QUFDL0QscUJBQUssV0FBVyxFQUFFLENBQUE7YUFDbkIsTUFBTTtBQUNMLHFCQUFLLFlBQVksRUFBRSxDQUFBO2FBQ3BCO1dBQ0YsQ0FBQyxDQUFBO0FBQ0YsWUFBRSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxVQUFBLENBQUMsRUFBSTtBQUNsQyxtQkFBSyxPQUFPLEdBQUcsS0FBSyxDQUFBO0FBQ3BCLHdCQUFZLENBQUMsT0FBSyxjQUFjLENBQUMsQ0FBQTtXQUNsQyxDQUFDLENBQUE7U0FDSCxDQUFDLENBQUE7T0FDSDtLQUNGOzs7MkNBRXNCOzs7QUFDckIsVUFBSSxTQUFTLEVBQUUsT0FBTyxJQUFJLENBQUE7O0FBRTFCLFVBQU0sR0FBRyxHQUFHLElBQUksQ0FBQTtBQUNoQixVQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFBO0FBQ3BCLFVBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUE7QUFDeEIsVUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQTs7QUFFL0IsVUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLG9CQUFvQixJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRTtBQUN2RSxhQUFLLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxFQUFFLFlBQU07QUFDM0MsY0FBSSxDQUFDLE9BQUssY0FBYyxFQUFFO0FBQ3hCLG1CQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxPQUFLLGVBQWUsRUFBRSxDQUFBO1dBQzlDO1NBQ0YsQ0FBQyxDQUFBO0FBQ0YsZUFBTyxDQUNKLEVBQUUsQ0FBQyxXQUFXLEVBQUUsWUFBTTtBQUNyQixpQkFBSyxjQUFjLEdBQUcsSUFBSSxDQUFBO1NBQzNCLENBQUMsQ0FDRCxFQUFFLENBQUMsU0FBUyxFQUFFLFlBQU07QUFDbkIsZUFBSyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7QUFDMUMsaUJBQUssT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFBO0FBQzVCLGlCQUFLLGNBQWMsR0FBRyxLQUFLLENBQUE7U0FDNUIsQ0FBQyxDQUFBO09BQ0w7S0FDRjs7O2dDQUVXO0FBQ1YsVUFBSSxTQUFTLEVBQUUsT0FBTyxJQUFJLENBQUE7O0FBRTFCLFVBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDcEIsYUFBTyxJQUFJLENBQUE7S0FDWjs7O2dDQUVXO0FBQ1YsVUFBSSxTQUFTLEVBQUUsT0FBTyxJQUFJLENBQUE7O0FBRTFCLFVBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDckIsYUFBTyxJQUFJLENBQUE7S0FDWjs7OzhCQUVTLEVBQUUsRUFBRTtBQUNaLFVBQUksU0FBUyxFQUFFLE9BQU8sSUFBSSxDQUFBOztBQUUxQixVQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU07VUFDdkIsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFBO0FBQzNDLFVBQUksRUFBRSxFQUFFO0FBQ04sWUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQUFBQyxHQUFHLEdBQUcsUUFBUSxJQUFJLENBQUMsR0FBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQTtPQUMvRCxNQUFNO0FBQ0wsWUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQUFBQyxHQUFHLEdBQUcsUUFBUSxJQUFJLENBQUMsR0FBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQTtPQUMvRDtBQUNELFVBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUE7QUFDNUIsYUFBTyxJQUFJLENBQUE7S0FDWjs7O3NDQUVpQjtBQUNoQixhQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUE7S0FDM0M7Ozt5Q0FFb0I7QUFDbkIsVUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBQy9ELGFBQU8sSUFBSSxDQUFBO0tBQ1o7OzswQ0FFcUI7QUFDcEIsVUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBQyxDQUFDLENBQUE7QUFDbkQsYUFBTyxJQUFJLENBQUE7S0FDWjs7O3FDQUVnQjtBQUNmLFVBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFBO0FBQ3ZDLGFBQU8sSUFBSSxDQUFBO0tBQ1o7OztvQ0FFZTtBQUNkLFVBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFBO0FBQ3JDLGFBQU8sSUFBSSxDQUFBO0tBQ1o7OztrQ0FFYTtBQUNaLFVBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFBO0FBQy9CLGFBQU8sSUFBSSxDQUFBO0tBQ1o7OztpQ0FFWTtBQUNYLFVBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUE7QUFDOUMsVUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQTtBQUMxQixhQUFPLElBQUksQ0FBQTtLQUNaOzs7MkJBRU07QUFDTCxVQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ2pCLFVBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFBO0FBQ25CLFVBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7QUFDcEIsYUFBTyxJQUFJLENBQUE7S0FDWjs7OzRCQUVPO0FBQ04sVUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQTtBQUNsQixVQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQTtBQUNwQixVQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0FBQ3JCLGFBQU8sSUFBSSxDQUFBO0tBQ1o7Ozs2QkFFUSxLQUFLLEVBQUU7QUFDZCxVQUFJLEtBQUssSUFBSSxDQUFDLEVBQUU7QUFDZCxZQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQTtPQUNwQixNQUFNLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7QUFDbkMsWUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFDLENBQUMsQ0FBQTtPQUNwQyxNQUFNO0FBQ0wsWUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUE7T0FDeEI7QUFDRCxVQUFNLFVBQVUsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFBO0FBQ3JDLFVBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQTtBQUNyQixVQUFJLFVBQVUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ2pDLFVBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7QUFDM0IsYUFBTyxJQUFJLENBQUE7S0FDWjs7OzJCQUVNO0FBQ0wsVUFBTSxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQTtBQUNyQyxVQUFJLENBQUMsVUFBVSxHQUFHLEFBQUMsSUFBSSxDQUFDLFVBQVUsR0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFJLElBQUksQ0FBQyxVQUFVLEdBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUMsQ0FBQyxDQUFBO0FBQ2pGLFVBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQTtBQUNyQixVQUFJLFVBQVUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ2pDLFVBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7QUFDM0IsYUFBTyxJQUFJLENBQUE7S0FDWjs7OzJCQUVNO0FBQ0wsVUFBTSxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQTtBQUNyQyxVQUFJLENBQUMsVUFBVSxHQUFHLEFBQUMsSUFBSSxDQUFDLFVBQVUsR0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsR0FBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBQyxDQUFDLENBQUE7QUFDaEYsVUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO0FBQ3JCLFVBQUksVUFBVSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7QUFDakMsVUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUMzQixhQUFPLElBQUksQ0FBQTtLQUNaOzs7Z0NBRVc7QUFDVixVQUFNLFVBQVUsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFBO0FBQ3JDLFVBQUksQ0FBQyxVQUFVLEdBQUcsQUFBQyxJQUFJLENBQUMsVUFBVSxHQUFDLENBQUMsR0FBRyxDQUFDLEdBQUksSUFBSSxDQUFDLFVBQVUsR0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBQyxDQUFDLENBQUE7QUFDakYsVUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO0FBQ2IsVUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUE7QUFDbkIsVUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO0FBQ3JCLFVBQUksVUFBVSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7QUFDakMsVUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUMzQixhQUFPLElBQUksQ0FBQTtLQUNaOzs7Z0NBRVc7QUFDVixVQUFNLFVBQVUsR0FBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFBO0FBQ3BDLFVBQUksQ0FBQyxVQUFVLEdBQUcsQUFBQyxJQUFJLENBQUMsVUFBVSxHQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFDLENBQUMsR0FBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBQyxDQUFDLENBQUE7QUFDakYsVUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO0FBQ2IsVUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUE7QUFDbkIsVUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO0FBQ3JCLFVBQUksVUFBVSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7QUFDakMsVUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUMzQixhQUFPLElBQUksQ0FBQTtLQUNaOzs7NkJBRVEsS0FBSyxFQUFFO0FBQ2QsVUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO0FBQ2QsWUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUE7T0FDcEIsTUFBTSxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ25DLFlBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBQyxDQUFDLENBQUE7T0FDcEMsTUFBTTtBQUNMLFlBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFBO09BQ3hCO0FBQ0QsVUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO0FBQ2IsVUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxrQkFBa0IsSUFBSSxDQUFDLENBQUMsQ0FBQTtBQUNoRSxVQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQzNCLGFBQU8sSUFBSSxDQUFBO0tBQ1o7OzttQ0FFYzs7O0FBQ2IsVUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxJQUFJLENBQUE7QUFDOUIsVUFBSSxDQUFDLGNBQWMsR0FBRyxXQUFXLENBQUMsWUFBTTtBQUN0QyxZQUFNLE9BQU8sR0FBRyxRQUFLLEtBQUssQ0FBQyxXQUFXLEdBQUksUUFBSyxRQUFRLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxBQUFDLENBQUE7QUFDMUUsZ0JBQUssS0FBSyxDQUFDLFdBQVcsR0FBRyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUE7T0FDcEQsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQzFCLGFBQU8sSUFBSSxDQUFBO0tBQ1o7OztrQ0FFYTs7O0FBQ1osVUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxJQUFJLENBQUE7QUFDOUIsVUFBSSxDQUFDLGNBQWMsR0FBRyxXQUFXLENBQUMsWUFBTTtBQUN0QyxZQUFNLE9BQU8sR0FBRyxRQUFLLEtBQUssQ0FBQyxXQUFXLEdBQUcsUUFBSyxRQUFRLENBQUMsWUFBWSxDQUFBO0FBQ25FLGdCQUFLLEtBQUssQ0FBQyxXQUFXLEdBQUcsT0FBTyxJQUFJLFFBQUssS0FBSyxDQUFDLFFBQVEsR0FBRyxRQUFLLEtBQUssQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFBO09BQ3hGLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUMxQixhQUFPLElBQUksQ0FBQTtLQUNaOzs7c0NBRWlCO0FBQ2hCLFVBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtBQUMzQyxlQUFPLElBQUksQ0FBQTtPQUNaO0FBQ0QsVUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQTtBQUMzQixVQUFNLFNBQVMsR0FBRyxFQUFFLENBQUE7QUFDcEIsV0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDeEMsWUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7O0FBQUEsQUFFckIsU0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBQyxDQUFDLENBQUM7O0FBQUEsQUFFakMsU0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNqQyxZQUFJLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDbkMsaUJBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7T0FDeEI7QUFDRCxVQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtBQUMxQixhQUFPLElBQUksQ0FBQTtLQUNaOzs7c0NBRWlCO0FBQ2hCLFVBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFBOztBQUV6QixVQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFBO0FBQ3hCLFVBQUksUUFBUSxZQUFBLENBQUE7O0FBRVosVUFBSTtBQUNGLGdCQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLENBQUE7T0FDdkQsQ0FBQyxPQUFNLENBQUMsRUFBRTtBQUNULGVBQU8sQ0FBQyxDQUFBO09BQ1Q7O0FBRUQsVUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxBQUFDLFFBQVEsR0FBQyxLQUFLLENBQUMsUUFBUSxHQUFFLEdBQUcsQ0FBQzs7QUFBQSxBQUUzRCxhQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsU0FBUyxDQUFBO0tBQ3hDOzs7Ozs7NENBR3VCLFNBQVMsRUFBRTtBQUNqQyxVQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sT0FBTyxDQUFBO0FBQzlDLFVBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDNUUsVUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxJQUFJLElBQUksU0FBUyxLQUFLLFVBQVUsRUFBRTtBQUMxRCxpQkFBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQUEsT0FDL0I7QUFDRCxhQUFPLFNBQVMsQ0FBQTtLQUNqQjs7OzJDQUVzQjtBQUNyQixhQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxhQUFhLENBQUM7Ozs7Ozs7QUFBQSxLQU9uRDs7O3dDQUVtQjtBQUNsQixhQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLENBQUM7Ozs7Ozs7QUFBQSxLQU9oRDs7O3lDQUVvQixDQUFDLEVBQUU7QUFDdEIsVUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQTtBQUM3RCxhQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWtCOztBQUFBLEtBRWhFOzs7d0JBRUcsR0FBRyxFQUFFLEtBQUssRUFBRTtBQUNkLGFBQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEtBQUssU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7S0FDcEU7Ozs7Ozs7OztnQ0FubkJrQixFQUFFLEVBQUU7QUFDckIsYUFBTyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0tBQzNCOzs7NkJBRWUsRUFBRSxFQUFFLE1BQU0sRUFBRTtBQUMxQixVQUFJLENBQUMsRUFBRSxFQUFFLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBSSxFQUFFLHFCQUFrQixDQUFBO0FBQ3BELFVBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFO0FBQ2pCLGVBQVEsRUFBRSxDQUFDLFNBQVMsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDO09BQ3RDO0FBQ0QsVUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQTtBQUMvQixVQUFNLFVBQVUsR0FBRyxNQUFNLENBQ3RCLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FDWixNQUFNLENBQUMsVUFBQSxDQUFDO2VBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7T0FBQSxDQUFDLENBQ3pDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNaLFFBQUUsQ0FBQyxTQUFTLElBQUksR0FBRyxHQUFHLFVBQVUsQ0FBQTtBQUNoQyxhQUFPLEdBQUcsQ0FBQTtLQUNYOzs7Z0NBRWtCLEVBQUUsRUFBRSxNQUFNLEVBQUU7QUFDN0IsVUFBSSxDQUFDLEVBQUUsRUFBRSxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUksRUFBRSxxQkFBa0IsQ0FBQTs7Ozs7QUFBQSxBQUtwRCxVQUFNLEVBQUUsR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxHQUFHLGtCQUFrQixFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQ2hFLFFBQUUsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ25ELGFBQU8sR0FBRyxDQUFBO0tBQ1g7OzsrQkFFaUIsSUFBSSxFQUFFO0FBQ3RCLFVBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFBO0FBQy9CLFVBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEdBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFJLEVBQUUsQ0FBQyxDQUFBO0FBQzVDLFVBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFJLENBQUMsR0FBRyxJQUFJLEFBQUMsR0FBSSxDQUFDLEdBQUcsRUFBRSxBQUFDLENBQUMsQ0FBQTtBQUNoRCxVQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUE7QUFDdkIsVUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFBO0FBQ3ZCLFVBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQTtBQUN2QixhQUFPLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUE7S0FDN0I7Ozt5QkFFVyxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRTtBQUN4QixVQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQzdCLFVBQUksQ0FBQyxHQUFHLENBQUM7VUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQTtBQUM1QixhQUFPLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFO0FBQUUsVUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtPQUFBO0tBQzlEOzs7NEJBOGtCYyxHQUFHLEVBQUU7OztBQUdsQixTQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsVUFBQyxNQUFNLEVBQUUsV0FBVztlQUFLLE9BQU8sR0FBRyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUM7T0FBQSxDQUFDOzs7QUFBQSxBQUduRixTQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsVUFBQyxTQUFTLEVBQUUsS0FBSztlQUFLLE9BQU8sR0FBRyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7T0FBQSxDQUFDOzs7QUFBQSxBQUdwRixTQUFHLENBQUMsTUFBTSxFQUFFOzs7QUFBQSxBQUdaLFNBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxVQUFDLE9BQU8sRUFBRSxNQUFNO2VBQUssT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztPQUFBLENBQUM7OztBQUFBLEFBRzlELFNBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQUMsR0FBRyxFQUFFLEdBQUc7ZUFBSyxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUM7T0FBQSxDQUFDLENBQUE7O0FBRTVDLGFBQU8sSUFBSSxDQUFBO0tBQ1o7OztTQXRyQmtCLEdBQUc7R0FBUyxHQUFHOztrQkFBZixHQUFHOztBQXlyQnhCLEdBQUcsQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFBOztBQUVwQixHQUFHLENBQUMsc0JBQXNCLEdBQUcsbUJBQW1CLENBQUE7O0FBRWhELEdBQUcsQ0FBQyxpQkFBaUIsR0FBRztBQUN0QixXQUFTLEVBQUUsRUFBRTtBQUNiLE9BQUssRUFBRSxLQUFLO0FBQ1oseUJBQXVCLEVBQUUsSUFBSTtBQUM3QixTQUFPLEVBQUUsRUFBRTtBQUNYLHFCQUFtQixFQUFFLElBQUk7QUFDekIsYUFBVyxFQUFFLElBQUk7QUFDakIsb0JBQWtCLEVBQUUsQ0FBQztBQUNyQixvQkFBa0IsRUFBRSxDQUFDO0FBQ3JCLGNBQVksRUFBRSxDQUFDO0FBQ2YsVUFBUSxFQUFFLEdBQUc7QUFDYixXQUFTLEVBQUUsRUFBRTtBQUNiLGdCQUFjLEVBQUUsS0FBSztBQUNyQixvQkFBa0IsRUFBRSxLQUFLO0FBQ3pCLG1CQUFpQixFQUFFLEtBQUs7QUFDeEIsb0JBQWtCLEVBQUUsS0FBSztBQUN6QixzQkFBb0IsRUFBRSxLQUFLO0FBQzNCLGdCQUFjLEVBQUUsSUFBSTtDQUNyQixDQUFBOztBQUVELEdBQUcsQ0FBQyxrQkFBa0IsR0FBRztBQUN2QixPQUFLLEVBQUU7QUFDTCx1QkFBbUIsRUFBRyw4QkFBOEI7QUFDcEQsV0FBTyxFQUFlLGNBQWM7QUFDcEMsVUFBTSxFQUFnQixhQUFhO0FBQ25DLFVBQU0sRUFBZ0IsYUFBYTtHQUNwQztBQUNELE9BQUssRUFBZ0IsWUFBWTtBQUNqQyxRQUFNLEVBQWUsYUFBYTtBQUNsQyxVQUFRLEVBQWEsZUFBZTtBQUNwQyxPQUFLLEVBQWdCLFlBQVk7QUFDakMsYUFBVyxFQUFVLG1CQUFtQjtBQUN4QyxRQUFNLEVBQWUsYUFBYTtBQUNsQyxZQUFVLEVBQVcsbUJBQW1CO0FBQ3hDLGFBQVcsRUFBVSxvQkFBb0I7QUFDekMsVUFBUSxFQUFhLGVBQWU7QUFDcEMsTUFBSSxFQUFpQixXQUFXO0FBQ2hDLFdBQVMsRUFBWSxpQkFBaUI7QUFDdEMsTUFBSSxFQUFpQixXQUFXO0FBQ2hDLFdBQVMsRUFBWSxpQkFBaUI7QUFDdEMsV0FBUyxFQUFZLGlCQUFpQjtBQUN0QyxVQUFRLEVBQWEsZUFBZTtBQUNwQyxjQUFZLEVBQVMscUJBQXFCO0FBQzFDLGVBQWEsRUFBUSxzQkFBc0I7QUFDM0MscUJBQW1CLEVBQUUsNkJBQTZCO0FBQ2xELG9CQUFrQixFQUFHLDRCQUE0QjtBQUNqRCxNQUFJLEVBQWlCLFdBQVc7QUFDaEMsV0FBUyxFQUFZLGlCQUFpQjtBQUN0QyxVQUFRLEVBQWEsZUFBZTtBQUNwQyxjQUFZLEVBQVMsb0JBQW9CO0FBQ3pDLGFBQVcsRUFBVSxtQkFBbUI7QUFDeEMsV0FBUyxFQUFZLGlCQUFpQjtBQUN0QyxhQUFXLEVBQVUsbUJBQW1CO0FBQ3hDLFlBQVUsRUFBVyxrQkFBa0I7QUFDdkMsY0FBWSxFQUFTLG9CQUFvQjtBQUN6QyxZQUFVLEVBQVcsa0JBQWtCO0FBQ3ZDLFlBQVUsRUFBVyxrQkFBa0I7QUFDdkMsYUFBVyxFQUFVLG1CQUFtQjtBQUN4QyxVQUFRLEVBQWEsZ0JBQWdCO0NBQ3RDLENBQUE7O0FBRUQsSUFBSSxNQUFNLEVBQUUsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgSVNfTU9CSUxFID0gZmFsc2VcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExhcCBleHRlbmRzIEJ1cyB7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIGxpYiwgb3B0aW9ucywgcG9zdHBvbmU9ZmFsc2UpIHtcclxuICAgIHN1cGVyKClcclxuXHJcbiAgICAvLyBkZWZhdWx0IGlkIHRvIHplcm8tYmFzZWQgaW5kZXggaW5jcmVtZW50ZXJcclxuICAgIHRoaXMuaWQgPSBvcHRpb25zICYmIG9wdGlvbnMuaWQgPyBvcHRpb25zLmlkIDogTGFwLiQkaW5zdGFuY2VzLmxlbmd0aFxyXG4gICAgTGFwLiQkaW5zdGFuY2VzW3RoaXMuaWRdID0gdGhpc1xyXG5cclxuICAgIHRoaXMuZWxlbWVudCA9IHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJ1xyXG4gICAgICA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudClcclxuICAgICAgOiBlbGVtZW50XHJcblxyXG4gICAgdGhpcy5zZXRMaWIobGliKVxyXG5cclxuICAgIHRoaXMuc2V0dGluZ3MgPSB7fVxyXG4gICAgaWYgKG9wdGlvbnMpIHtcclxuICAgICAgTGFwLmVhY2goTGFwLiQkZGVmYXVsdFNldHRpbmdzLCAodmFsLCBrZXkpID0+IHtcclxuICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB0aGlzLnNldHRpbmdzW2tleV0gPSBvcHRpb25zW2tleV1cclxuICAgICAgICBlbHNlIHRoaXMuc2V0dGluZ3Nba2V5XSA9IHZhbFxyXG4gICAgICB9KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5zZXR0aW5ncyA9IExhcC4kJGRlZmF1bHRTZXR0aW5nc1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghcG9zdHBvbmUpIHRoaXMuaW5pdGlhbGl6ZSgpXHJcblxyXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuZGVidWcpIHtcclxuICAgICAgY29uc3QgZWNobyA9IGUgPT4ge1xyXG4gICAgICAgIHRoaXMub24oZSwgKCkgPT4gY29uc29sZS5pbmZvKCclYyVzIGhhbmRsZXIgY2FsbGVkJywgJ2NvbG9yOiM4MDAwODAnLCBlKSlcclxuICAgICAgfVxyXG4gICAgICBlY2hvKCdsb2FkJylcclxuICAgICAgZWNobygncGxheScpXHJcbiAgICAgIGVjaG8oJ3BhdXNlJylcclxuICAgICAgZWNobygnc2VlaycpXHJcbiAgICAgIGVjaG8oJ3RyYWNrQ2hhbmdlJylcclxuICAgICAgZWNobygnYWxidW1DaGFuZ2UnKVxyXG4gICAgICBlY2hvKCd2b2x1bWVDaGFuZ2UnKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZ2V0SW5zdGFuY2UoaWQpIHtcclxuICAgIHJldHVybiBMYXAuJCRpbnN0YW5jZXNbaWRdXHJcbiAgfVxyXG5cclxuICBzdGF0aWMgYWRkQ2xhc3MoZWwsIF9jbGFzcykge1xyXG4gICAgaWYgKCFlbCkgcmV0dXJuIGNvbnNvbGUud2FybihgJHtlbH0gaXMgbm90IGRlZmluZWRgKVxyXG4gICAgaWYgKCFlbC5jbGFzc05hbWUpIHtcclxuICAgICAgcmV0dXJuIChlbC5jbGFzc05hbWUgKz0gJyAnICsgX2NsYXNzKVxyXG4gICAgfVxyXG4gICAgY29uc3QgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZVxyXG4gICAgY29uc3QgbmV3Q2xhc3NlcyA9IF9jbGFzc1xyXG4gICAgICAuc3BsaXQoL1xccysvKVxyXG4gICAgICAuZmlsdGVyKG4gPT4gY2xhc3NOYW1lcy5pbmRleE9mKG4pID09PSAtMSlcclxuICAgICAgLmpvaW4oJyAnKVxyXG4gICAgZWwuY2xhc3NOYW1lICs9ICcgJyArIG5ld0NsYXNzZXNcclxuICAgIHJldHVybiBMYXBcclxuICB9XHJcblxyXG4gIHN0YXRpYyByZW1vdmVDbGFzcyhlbCwgX2NsYXNzKSB7XHJcbiAgICBpZiAoIWVsKSByZXR1cm4gY29uc29sZS53YXJuKGAke2VsfSBpcyBub3QgZGVmaW5lZGApXHJcbiAgICAvLyB1bmNvbW1lbnQgZm9yIG11bHRpcGxlIGNsYXNzIHJlbW92YWxcclxuICAgIC8vIF9jbGFzcyA9IGAoJHtfY2xhc3Muc3BsaXQoL1xccysvKS5qb2luKCd8Jyl9KWBcclxuICAgIFxyXG4gICAgLy8gVE9ETzogY2FjaGU/XHJcbiAgICBjb25zdCByZSA9IG5ldyBSZWdFeHAoJ1xcXFxzKicgKyBfY2xhc3MgKyAnXFxcXHMqKCFbXFxcXHdcXFxcV10pPycsICdnJylcclxuICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKHJlLCAnICcpLnRyaW0oKVxyXG4gICAgcmV0dXJuIExhcFxyXG4gIH1cclxuXHJcbiAgc3RhdGljIGZvcm1hdFRpbWUodGltZSkge1xyXG4gICAgbGV0IGggPSBNYXRoLmZsb29yKHRpbWUgLyAzNjAwKVxyXG4gICAgbGV0IG0gPSBNYXRoLmZsb29yKCh0aW1lIC0gKGggKiAzNjAwKSkgLyA2MClcclxuICAgIGxldCBzID0gTWF0aC5mbG9vcih0aW1lIC0gKGggKiAzNjAwKSAtIChtICogNjApKVxyXG4gICAgaWYgKGggPCAxMCkgaCA9ICcwJyArIGhcclxuICAgIGlmIChtIDwgMTApIG0gPSAnMCcgKyBtXHJcbiAgICBpZiAocyA8IDEwKSBzID0gJzAnICsgc1xyXG4gICAgcmV0dXJuIGggKyAnOicgKyBtICsgJzonICsgc1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGVhY2gob2JqLCBmbiwgY3R4KSB7XHJcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMob2JqKVxyXG4gICAgbGV0IGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aFxyXG4gICAgZm9yICg7IGkgPCBsZW47IGkrKykgZm4uY2FsbChjdHgsIG9ialtrZXlzW2ldXSwga2V5c1tpXSwgb2JqKVxyXG4gIH1cclxuXHJcbiAgc2V0TGliKGxpYikge1xyXG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiBsaWJcclxuICAgIGNvbnN0IGlzQXJyYXkgPSBsaWIgaW5zdGFuY2VvZiBBcnJheVxyXG4gICAgaWYgKGlzQXJyYXkpIHtcclxuICAgICAgdGhpcy5saWIgPSBsaWJcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgdGhpcy5saWIgPSBbbGliXVxyXG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiBMYXAuJCRhdWRpb0V4dGVuc2lvblJlZ0V4cC50ZXN0KGxpYikpIHtcclxuICAgICAgdGhpcy5saWIgPSBbeyBmaWxlczogW2xpYl0gfV1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtsaWJ9IG11c3QgYmUgYW4gYXJyYXksIG9iamVjdCwgb3Igc3RyaW5nYClcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBpbml0aWFsaXplKCkge1xyXG5cclxuICAgIC8vIHN0YXRlXHJcbiAgICB0aGlzLnNlZWtpbmcgPSBmYWxzZVxyXG4gICAgdGhpcy52b2x1bWVDaGFuZ2luZyA9IGZhbHNlXHJcbiAgICB0aGlzLm1vdXNlRG93blRpbWVyID0gMFxyXG4gICAgdGhpcy5wbGF5aW5nID0gZmFsc2VcclxuXHJcbiAgICB0aGlzLnBsdWdpbnMgPSB0aGlzLnNldHRpbmdzLnBsdWdpbnNcclxuXHJcbiAgICB0aGlzLnVwZGF0ZSgpXHJcbiAgICB0aGlzLiQkaW5pdEF1ZGlvKClcclxuICAgIHRoaXMuJCRpbml0RWxlbWVudHMoKVxyXG4gICAgdGhpcy4kJGFkZEF1ZGlvTGlzdGVuZXJzKClcclxuICAgIGlmICghSVNfTU9CSUxFKSB0aGlzLiQkYWRkVm9sdW1lTGlzdGVuZXJzKClcclxuICAgIHRoaXMuJCRhZGRTZWVrTGlzdGVuZXJzKClcclxuICAgIHRoaXMuJCRhZGRMaXN0ZW5lcnMoKVxyXG4gICAgLy8gTGFwLmVhY2godGhpcy5zZXR0aW5ncy5jYWxsYmFja3MsIChmbiwga2V5KSA9PiB0aGlzLm9uKGtleSwgZm4pKVxyXG4gICAgT2JqZWN0LmtleXModGhpcy5zZXR0aW5ncy5jYWxsYmFja3MpLmZvckVhY2goa2V5ID0+IHRoaXMub24oa2V5LCB0aGlzLnNldHRpbmdzLmNhbGxiYWNrc1trZXldKSlcclxuICAgIHRoaXMuJCRhY3RpdmF0ZVBsdWdpbnMoKVxyXG4gICAgdGhpcy50cmlnZ2VyKCdsb2FkJylcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbmZpZ3VyZXMgaW5zdGFuY2UgdmFyaWFibGVzIHJlbGF0aXZlIHRvIHRoZSBjdXJyZW50IGFsYnVtLlxyXG4gICAqIENhbGxlZCBvbiBpbml0aWFsaXphdGlvbiBhbmQgd2hlbmV2ZXIgYW4gYWxidW0gaXMgY2hhbmdlZC5cclxuICAgKlxyXG4gICAqIEByZXR1cm4ge0xhcH0gdGhpc1xyXG4gICAqL1xyXG4gIHVwZGF0ZSgpIHtcclxuICAgIHRoaXMuYWxidW1JbmRleCA9IHRoaXMuc2V0dGluZ3Muc3RhcnRpbmdBbGJ1bUluZGV4IHx8IDBcclxuICAgIHRoaXMuYWxidW1Db3VudCA9IHRoaXMubGliLmxlbmd0aFxyXG4gICAgdGhpcy50cmFja0luZGV4ID0gdGhpcy5zZXR0aW5ncy5zdGFydGluZ1RyYWNrSW5kZXggfHwgMFxyXG4gICAgdGhpcy5wbGF5bGlzdFBvcHVsYXRlZCA9IGZhbHNlXHJcblxyXG4gICAgY29uc3QgY3VycmVudExpYkl0ZW0gPSB0aGlzLmxpYlt0aGlzLmFsYnVtSW5kZXhdXHJcblxyXG4gICAgY29uc3Qga2V5cyA9IFsnYXJ0aXN0JywgJ2FsYnVtJywgJ2ZpbGVzJywgJ2NvdmVyJywgJ3RyYWNrbGlzdCcsICdyZXBsYWNlbWVudCddXHJcbiAgICBrZXlzLmZvckVhY2goa2V5ID0+IHRoaXNba2V5XSA9IGN1cnJlbnRMaWJJdGVtW2tleV0pXHJcblxyXG4gICAgdGhpcy50cmFja0NvdW50ID0gdGhpcy5maWxlcy5sZW5ndGhcclxuXHJcbiAgICAvLyByZXBsYWNlbWVudCA9PT0gW3JlZ2V4cCwgcmVwbGFjZW1lbnQsIG9wdGlvbmFsX2ZsYWdzXVxyXG4gICAgaWYgKHRoaXMucmVwbGFjZW1lbnQpIHtcclxuICAgICAgbGV0IHJlID0gdGhpcy5yZXBsYWNlbWVudFxyXG4gICAgICAvLyBmb3IgcmVwbGFjbWVudCB3aXRob3V0IHZhbHVlIHNwZWNpZmllZCwgZW1wdHkgc3RyaW5nIFxyXG4gICAgICBpZiAodHlwZW9mIHJlID09PSAnc3RyaW5nJykgcmUgPSBbcmUsICcnXVxyXG4gICAgICAvLyByZSBtYXkgY29udGFpbiBzdHJpbmctd3JhcHBlZCByZWdleHAgKGZyb20ganNvbiksIGNvbnZlcnQgaWYgc29cclxuICAgICAgaWYgKHJlIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICBjb25zdCBmbGFncyA9IHJlWzJdXHJcbiAgICAgICAgcmVbMF0gPSBuZXcgUmVnRXhwKHJlWzBdLCBmbGFncyAhPT0gdW5kZWZpbmVkID8gZmxhZ3MgOiAnZycpXHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5yZXBsYWNlbWVudCA9IHJlXHJcbiAgICB9XHJcbiAgICB0aGlzLmZvcm1hdFRyYWNrbGlzdCgpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5zdGFudGlhdGUgZXZlcnkgcGx1Z2luJ3MgY29udHJ1Y3RvciB3aXRoIHRoaXMgTGFwIGluc3RhbmNlXHJcbiAgICpcclxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcclxuICAgKi9cclxuICAkJGFjdGl2YXRlUGx1Z2lucygpIHtcclxuICAgIHRoaXMucGx1Z2lucy5mb3JFYWNoKChwbHVnaW4sIGkpID0+IHRoaXMucGx1Z2luc1tpXSA9IG5ldyBwbHVnaW4odGhpcykpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgJCRpbml0QXVkaW8oKSB7XHJcbiAgICB0aGlzLmF1ZGlvID0gbmV3IEF1ZGlvKClcclxuICAgIHRoaXMuYXVkaW8ucHJlbG9hZCA9ICdhdXRvJ1xyXG4gICAgbGV0IGZpbGVUeXBlID0gdGhpcy5maWxlc1t0aGlzLnRyYWNrSW5kZXhdXHJcbiAgICBmaWxlVHlwZSA9IGZpbGVUeXBlLnNsaWNlKGZpbGVUeXBlLmxhc3RJbmRleE9mKCcuJykrMSlcclxuICAgIGNvbnN0IGNhblBsYXkgPSB0aGlzLmF1ZGlvLmNhblBsYXlUeXBlKCdhdWRpby8nICsgZmlsZVR5cGUpXHJcbiAgICBpZiAoY2FuUGxheSA9PT0gJ3Byb2JhYmx5JyB8fCBjYW5QbGF5ID09PSAnbWF5YmUnKSB7XHJcbiAgICAgIHRoaXMuJCR1cGRhdGVTb3VyY2UoKVxyXG4gICAgICB0aGlzLmF1ZGlvLnZvbHVtZSA9IDFcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIFRPRE86IHJldHVybiBhIGZsYWcgdG8gc2lnbmFsIHNraXBwaW5nIHRoZSByZXN0IG9mIHRoZSBpbml0aWFsaXphdGlvbiBwcm9jZXNzXHJcbiAgICAgIGNvbnNvbGUud2FybihgVGhpcyBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgJHtmaWxlVHlwZX0gcGxheWJhY2suYClcclxuICAgIH1cclxuICB9XHJcblxyXG4gICQkdXBkYXRlU291cmNlKCkge1xyXG4gICAgdGhpcy5hdWRpby5zcmMgPSB0aGlzLmZpbGVzW3RoaXMudHJhY2tJbmRleF1cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAkJGluaXRFbGVtZW50cygpIHtcclxuICAgIHRoaXMuZWxzID0ge31cclxuICAgIHRoaXMuc2VsZWN0b3JzID0geyBzdGF0ZToge30gfVxyXG4gICAgLy8gTGFwLmVhY2goTGFwLiQkZGVmYXVsdFNlbGVjdG9ycywgKHNlbGVjdG9yLCBrZXkpID0+IHtcclxuICAgIC8vICAgaWYgKGtleSAhPT0gJ3N0YXRlJykge1xyXG5cclxuICAgIC8vICAgICB0aGlzLnNlbGVjdG9yc1trZXldID0gdGhpcy5zZXR0aW5ncy5zZWxlY3RvcnMuaGFzT3duUHJvcGVydHkoa2V5KVxyXG4gICAgLy8gICAgICAgPyB0aGlzLnNldHRpbmdzLnNlbGVjdG9yc1trZXldXHJcbiAgICAvLyAgICAgICA6IHNlbGVjdG9yXHJcblxyXG4gICAgLy8gICAgIGNvbnN0IGVsID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3RoaXMuc2VsZWN0b3JzW2tleV19YClcclxuICAgIC8vICAgICBpZiAoZWwpIHRoaXMuZWxzW2tleV0gPSBlbFxyXG5cclxuICAgIC8vICAgfSBlbHNlIHtcclxuICAgIC8vICAgICBjb25zdCBoYXNTdGF0ZU92ZXJyaWRlcyA9ICEhdGhpcy5zZXR0aW5ncy5zZWxlY3RvcnMuc3RhdGVcclxuICAgIC8vICAgICBpZiAoIWhhc1N0YXRlT3ZlcnJpZGVzKSByZXR1cm5cclxuICAgIC8vICAgICBMYXAuZWFjaChMYXAuJCRkZWZhdWx0U2VsZWN0b3JzLnN0YXRlLCAoc2VsLCBrKSA9PiB7XHJcbiAgICAvLyAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5zZWxlY3RvcnMuaGFzT3duUHJvcGVydHkoaykpIHtcclxuICAgIC8vICAgICAgICAgdGhpcy5zZWxlY3RvcnMuc3RhdGVba10gPSB0aGlzLnNldHRpbmdzLnN0YXRlW2tdXHJcbiAgICAvLyAgICAgICB9IGVsc2Uge1xyXG4gICAgLy8gICAgICAgICB0aGlzLnNlbGVjdG9ycy5zdGF0ZVtrXSA9IHNlbFxyXG4gICAgLy8gICAgICAgfVxyXG4gICAgLy8gICAgIH0pXHJcbiAgICAvLyAgIH1cclxuICAgIC8vIH0pXHJcbiAgICBPYmplY3Qua2V5cyhMYXAuJCRkZWZhdWx0U2VsZWN0b3JzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgIGlmIChrZXkgIT09ICdzdGF0ZScpIHtcclxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5zZWxlY3RvcnMuaGFzT3duUHJvcGVydHlba2V5XSkge1xyXG4gICAgICAgICAgdGhpcy5zZWxlY3RvcnNba2V5XSA9IHRoaXMuc2V0dGluZ3Muc2VsZWN0b3JzW2tleV1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5zZWxlY3RvcnNba2V5XSA9IExhcC4kJGRlZmF1bHRTZWxlY3RvcnNba2V5XVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZWwgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcihgLiR7dGhpcy5zZWxlY3RvcnNba2V5XX1gKVxyXG4gICAgICAgIGlmIChlbCkgdGhpcy5lbHNba2V5XSA9IGVsXHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IGhhc1N0YXRlT3ZlcnJpZGVzID0gISF0aGlzLnNldHRpbmdzLnNlbGVjdG9ycy5zdGF0ZVxyXG4gICAgICAgIE9iamVjdC5rZXlzKExhcC4kJGRlZmF1bHRTZWxlY3RvcnMuc3RhdGUpLmZvckVhY2goayA9PiB7XHJcbiAgICAgICAgICBpZiAoaGFzU3RhdGVPdmVycmlkZXMgJiYgdGhpcy5zZXR0aW5ncy5zdGF0ZS5oYXNPd25Qcm9wZXJ0eVtrXSkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdG9ycy5zdGF0ZVtrXSA9IHRoaXMuc2V0dGluZ3Muc3RhdGVba11cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0b3JzLnN0YXRlW2tdID0gTGFwLiQkZGVmYXVsdFNlbGVjdG9ycy5zdGF0ZVtrXVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIHdyYXBwZXIgYXJvdW5kIHRoaXMgTGFwIGluc3RhbmNlcyBgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcmAgdGhhdCBcclxuICAgKiBlbnN1cmVzIGhhbmRsZXJzIGFyZSBjYWNoZWQgZm9yIGxhdGVyIHJlbW92YWwgaW4gdGhlIGBMYXAjZGVzdHJveWAgY2FsbFxyXG4gICAqL1xyXG4gIGFkZEF1ZGlvTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKSB7XHJcbiAgICB0aGlzLmF1ZGlvTGlzdGVuZXJzID0gdGhpcy5hdWRpb0xpc3RlbmVycyB8fCB7fVxyXG4gICAgdGhpcy5hdWRpb0xpc3RlbmVyc1tldmVudF0gPSB0aGlzLmF1ZGlvTGlzdGVuZXJzW2V2ZW50XSB8fCBbXVxyXG5cclxuICAgIGNvbnN0IGJvdW5kID0gbGlzdGVuZXIuYmluZCh0aGlzKVxyXG4gICAgdGhpcy5hdWRpb0xpc3RlbmVyc1tldmVudF0ucHVzaChib3VuZClcclxuICAgIHRoaXMuYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgYm91bmQpXHJcbiAgfVxyXG5cclxuICAkJGFkZEF1ZGlvTGlzdGVuZXJzKCkge1xyXG4gICAgY29uc3QgYXVkaW8gPSB0aGlzLmF1ZGlvXHJcbiAgICBjb25zdCBlbHMgPSB0aGlzLmVsc1xyXG4gICAgY29uc3QgbmF0aXZlUHJvZ3Jlc3MgPSAhISh0aGlzLnNldHRpbmdzLnVzZU5hdGl2ZVByb2dyZXNzICYmIGVscy5wcm9ncmVzcylcclxuXHJcbiAgICB0aGlzLmF1ZGlvTGlzdGVuZXJzID0ge31cclxuXHJcbiAgICBjb25zdCBfYWRkTGlzdGVuZXIgPSAoY29uZGl0aW9uLCBldmVudCwgbGlzdGVuZXIpID0+IHtcclxuICAgICAgaWYgKGNvbmRpdGlvbikgdGhpcy5hZGRBdWRpb0xpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcclxuICAgIH1cclxuXHJcbiAgICBfYWRkTGlzdGVuZXIoISEoZWxzLmJ1ZmZlcmVkIHx8IG5hdGl2ZVByb2dyZXNzKSwgJ3Byb2dyZXNzJywgKCkgPT4ge1xyXG4gICAgICAvLyBUT0RPOiB2ZXJpZnkgaWYgdGhpcyByZWFsbHkgbmVlZHMgdG8gYmUgdHlwZSBjYXN0Li4uXHJcbiAgICAgIHZhciBidWZmZXJlZCA9ICt0aGlzLmJ1ZmZlckZvcm1hdHRlZCgpXHJcbiAgICAgIGlmIChlbHMuYnVmZmVyZWQpIGVscy5idWZmZXJlZC5pbm5lckhUTUwgPSBidWZmZXJlZFxyXG4gICAgICBpZiAobmF0aXZlUHJvZ3Jlc3MpIGVscy5wcm9ncmVzcy52YWx1ZSA9IGJ1ZmZlcmVkXHJcbiAgICB9KVxyXG5cclxuICAgIF9hZGRMaXN0ZW5lcighIWVscy5jdXJyZW50VGltZSwgJ3RpbWV1cGRhdGUnLCAoKSA9PiB7XHJcbiAgICAgIGVscy5jdXJyZW50VGltZS5pbm5lckhUTUwgPSB0aGlzLmN1cnJlbnRUaW1lRm9ybWF0dGVkKClcclxuICAgIH0pXHJcblxyXG4gICAgX2FkZExpc3RlbmVyKCEhZWxzLmR1cmF0aW9uLCAnZHVyYXRpb25jaGFuZ2UnLCAoKSA9PiB7XHJcbiAgICAgIGVscy5kdXJhdGlvbi5pbm5lckhUTUwgPSB0aGlzLmR1cmF0aW9uRm9ybWF0dGVkKClcclxuICAgIH0pXHJcblxyXG4gICAgX2FkZExpc3RlbmVyKHRydWUsICdlbmRlZCcsICgpID0+IHtcclxuICAgICAgaWYgKHRoaXMucGxheWluZykge1xyXG4gICAgICAgIHRoaXMubmV4dCgpXHJcbiAgICAgICAgYXVkaW8ucGxheSgpXHJcbiAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIGFkZExpc3RlbmVyKGVsZW1lbnROYW1lLCBldmVudCwgbGlzdGVuZXIpIHtcclxuICAgIC8vIGllLiBsaXN0ZW5lcnMgPSB7IHNlZWtSYW5nZTogeyBjbGljazogW2hhbmRsZXJzXSwgbW91c2Vkb3duOiBbaGFuZGxlcnNdLCAuLi4gfSwgLi4uIH1cclxuICAgIHRoaXMubGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnMgfHwge31cclxuICAgIHRoaXMubGlzdGVuZXJzW2VsZW1lbnROYW1lXSA9IHRoaXMubGlzdGVuZXJzW2VsZW1lbnROYW1lXSB8fCB7fVxyXG4gICAgdGhpcy5saXN0ZW5lcnNbZWxlbWVudE5hbWVdW2V2ZW50XSA9IHRoaXMubGlzdGVuZXJzW2VsZW1lbnROYW1lXVtldmVudF0gfHwgW11cclxuXHJcbiAgICBjb25zdCBib3VuZCA9IGxpc3RlbmVyLmJpbmQodGhpcylcclxuICAgIHRoaXMubGlzdGVuZXJzW2VsZW1lbnROYW1lXVtldmVudF0ucHVzaChib3VuZClcclxuICAgIHRoaXMuZWxzW2VsZW1lbnROYW1lXS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBib3VuZClcclxuICB9XHJcblxyXG4gICQkYWRkTGlzdGVuZXJzKCkge1xyXG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcclxuICAgIHRoaXMubGlzdGVuZXJzID0ge31cclxuXHJcbiAgICAvLyBoZWxwZXIuIGVuc3VyZSB3ZSBhcmVuJ3QgYWRkaW5nIGxpc3RlbmVycyB0byBub24tZXhpc3RlbnQgZWxlbWVudHNcclxuICAgIGNvbnN0IF9hZGRMaXN0ZW5lciA9IChlbGVtZW50TmFtZSwgZXZlbnQsIGxpc3RlbmVyKSA9PiB7XHJcbiAgICAgIGlmIChlbHNbZWxlbWVudE5hbWVdKSB0aGlzLmFkZExpc3RlbmVyKGVsZW1lbnROYW1lLCBldmVudCwgdGhpc1tsaXN0ZW5lcl0pXHJcbiAgICB9XHJcblxyXG4gICAgX2FkZExpc3RlbmVyKCdwbGF5UGF1c2UnLCAnY2xpY2snLCAndG9nZ2xlUGxheScpXHJcbiAgICBfYWRkTGlzdGVuZXIoJ3ByZXYnLCAnY2xpY2snLCAncHJldicpXHJcbiAgICBfYWRkTGlzdGVuZXIoJ25leHQnLCAnY2xpY2snLCAnbmV4dCcpXHJcbiAgICBfYWRkTGlzdGVuZXIoJ3ByZXZBbGJ1bScsICdjbGljaycsICdwcmV2QWxidW0nKVxyXG4gICAgX2FkZExpc3RlbmVyKCduZXh0QWxidW0nLCAnY2xpY2snLCAnbmV4dEFsYnVtJylcclxuICAgIF9hZGRMaXN0ZW5lcigndm9sdW1lVXAnLCAnY2xpY2snLCAnaW5jVm9sdW1lJylcclxuICAgIF9hZGRMaXN0ZW5lcigndm9sdW1lRG93bicsICdjbGljaycsICdkZWNWb2x1bWUnKVxyXG4gICAgLy8gX2FkZExpc3RlbmVyKCdkaXNjb2cnLCAnY2xpY2snLCAnZGlzY29nQ2xpY2snKVxyXG4gICAgLy8gX2FkZExpc3RlbmVyKCdwbGF5bGlzdCcsICdjbGljaycsICdwbGF5bGlzdENsaWNrJylcclxuXHJcbiAgICBjb25zdCBfaWYgPSAoZWxlbWVudE5hbWUsIGZuKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmVsc1tlbGVtZW50TmFtZV0pIHtcclxuICAgICAgICBpZiAodHlwZW9mIGZuID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgdGhpc1tmbl0oKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBhbm9ueW1vdXNcclxuICAgICAgICAgIGZuKClcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm9uKCdsb2FkJywgKCkgPT4ge1xyXG4gICAgICBfaWYoJ3RyYWNrVGl0bGUnLCAndXBkYXRlVHJhY2tUaXRsZUVsJylcclxuICAgICAgX2lmKCd0cmFja051bWJlcicsICd1cGRhdGVUcmFja051bWJlckVsJylcclxuICAgICAgX2lmKCdhcnRpc3QnLCAndXBkYXRlQXJ0aXN0RWwnKVxyXG4gICAgICBfaWYoJ2FsYnVtJywgJ3VwZGF0ZUFsYnVtRWwnKVxyXG4gICAgICBfaWYoJ2NvdmVyJywgJ3VwZGF0ZUNvdmVyJylcclxuICAgICAgX2lmKCdwbGF5UGF1c2UnLCAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgcyA9IHRoaXMuc2VsZWN0b3JzLnN0YXRlXHJcbiAgICAgICAgY29uc3QgcHAgPSBlbHMucGxheVBhdXNlXHJcbiAgICAgICAgTGFwLmFkZENsYXNzKHBwLCBzLnBhdXNlZClcclxuICAgICAgICB0aGlzLm9uKCdwbGF5JywgKCkgPT4gTGFwLnJlbW92ZUNsYXNzKHBwLCBzLnBhdXNlZCkuYWRkQ2xhc3MocHAsIHMucGxheWluZykpXHJcbiAgICAgICAgdGhpcy5vbigncGF1c2UnLCAoKSA9PiBMYXAucmVtb3ZlQ2xhc3MocHAsIHMucGxheWluZykuYWRkQ2xhc3MocHAsIHMucGF1c2VkKSlcclxuICAgICAgfSlcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5vbigndHJhY2tDaGFuZ2UnLCAoKSA9PiB7XHJcbiAgICAgIF9pZigndHJhY2tUaXRsZScsICd1cGRhdGVUcmFja1RpdGxlRWwnKVxyXG4gICAgICBfaWYoJ3RyYWNrTnVtYmVyJywgJ3VwZGF0ZVRyYWNrTnVtYmVyRWwnKVxyXG4gICAgICBfaWYoJ2N1cnJlbnRUaW1lJywgKCkgPT4gZWxzLmN1cnJlbnRUaW1lLmlubmVySFRNTCA9IHRoaXMuY3VycmVudFRpbWVGb3JtYXR0ZWQoKSlcclxuICAgICAgX2lmKCdkdXJhdGlvbicsICgpID0+IGVscy5kdXJhdGlvbi5pbm5lckhUTUwgPSB0aGlzLmR1cmF0aW9uRm9ybWF0dGVkKCkpXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMub24oJ2FsYnVtQ2hhbmdlJywgKCkgPT4ge1xyXG4gICAgICBfaWYoJ3RyYWNrVGl0bGUnLCAndXBkYXRlVHJhY2tUaXRsZUVsJylcclxuICAgICAgX2lmKCd0cmFja051bWJlcicsICd1cGRhdGVUcmFja051bWJlckVsJylcclxuICAgICAgX2lmKCdhcnRpc3QnLCAndXBkYXRlQXJ0aXN0RWwnKVxyXG4gICAgICBfaWYoJ2FsYnVtJywgJ3VwZGF0ZUFsYnVtRWwnKVxyXG4gICAgICBfaWYoJ2NvdmVyJywgJ3VwZGF0ZUNvdmVyJylcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICAkJGFkZFNlZWtMaXN0ZW5lcnMoKSB7XHJcbiAgICBjb25zdCBlbHMgPSB0aGlzLmVsc1xyXG4gICAgY29uc3QgYXVkaW8gPSB0aGlzLmF1ZGlvXHJcbiAgICBjb25zdCBzZWVrUmFuZ2UgPSBlbHMuc2Vla1JhbmdlXHJcbiAgICBjb25zdCBuYXRpdmVTZWVrID0gISEodGhpcy5zZXR0aW5ncy51c2VOYXRpdmVTZWVrUmFuZ2UgJiYgc2Vla1JhbmdlICYmIHNlZWtSYW5nZS5lbHMubGVuZ3RoKVxyXG5cclxuICAgIGlmIChuYXRpdmVTZWVrKSB7XHJcbiAgICAgIC8vIFRPRE86IHB1dCB1cyBpbiBsaXN0ZW5lcnMgY2FjaGUuLi5cclxuICAgICAgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcigndGltZXVwZGF0ZScsIGUgPT4ge1xyXG4gICAgICAgIGlmICghdGhpcy5zZWVraW5nKSB7XHJcbiAgICAgICAgICBzZWVrUmFuZ2UuZ2V0KDApLnZhbHVlID0gXy5zY2FsZShhdWRpby5jdXJyZW50VGltZSwgMCwgYXVkaW8uZHVyYXRpb24sIDAsIDEwMClcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIHNlZWtSYW5nZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBlID0+IHtcclxuICAgICAgICB0aGlzLnNlZWtpbmcgPSB0cnVlXHJcbiAgICAgIH0pXHJcbiAgICAgIHNlZWtSYW5nZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZSA9PiB7XHJcbiAgICAgICAgdmFyIGVsID0gc2Vla1JhbmdlLmdldCgwKVxyXG4gICAgICAgIGlmICghZWwudmFsdWUpIHRoaXMubG9nZ2VyLmRlYnVnKCd3aGF0IHRoZSBmdWNrISAnICsgZWwpXHJcbiAgICAgICAgYXVkaW8uY3VycmVudFRpbWUgPSBfLnNjYWxlKGVsLnZhbHVlLCAwLCBlbC5tYXgsIDAsIGF1ZGlvLmR1cmF0aW9uKVxyXG4gICAgICAgIHRoaXMudHJpZ2dlcignc2VlaycpXHJcbiAgICAgICAgdGhpcy5zZWVraW5nID0gZmFsc2VcclxuICAgICAgfSlcclxuXHJcbiAgICB9IGVsc2UgeyAvLyB1c2luZyBidXR0b25zXHJcbiAgICAgIFtlbHMuc2Vla0ZvcndhcmQsIGVscy5zZWVrQmFja3dhcmRdLmZvckVhY2goZWwgPT4ge1xyXG4gICAgICAgIGlmICghZWwpIHJldHVyblxyXG4gICAgICAgIC8vIFRPRE86IHB1dCBtZSBpbiBsaXN0ZW5lcnMgY2FjaGUuLi5cclxuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBlID0+IHtcclxuICAgICAgICAgIHRoaXMuc2Vla2luZyA9IHRydWVcclxuICAgICAgICAgIC8vIGlmICgkKGUudGFyZ2V0KS5oYXNDbGFzcyh0aGlzLnNlbGVjdG9ycy5zZWVrRm9yd2FyZCkpIHtcclxuICAgICAgICAgIGlmIChlLnRhcmdldC5jbGFzc05hbWUuaW5kZXhPZih0aGlzLnNlbGVjdG9ycy5zZWVrRm9yd2FyZCkgPiAtMSkge1xyXG4gICAgICAgICAgICB0aGlzLnNlZWtGb3J3YXJkKClcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Vla0JhY2t3YXJkKClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBlID0+IHtcclxuICAgICAgICAgIHRoaXMuc2Vla2luZyA9IGZhbHNlXHJcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5tb3VzZURvd25UaW1lcilcclxuICAgICAgICB9KVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgJCRhZGRWb2x1bWVMaXN0ZW5lcnMoKSB7XHJcbiAgICBpZiAoSVNfTU9CSUxFKSByZXR1cm4gdGhpc1xyXG5cclxuICAgIGNvbnN0IGxhcCA9IHRoaXNcclxuICAgIGNvbnN0IGVscyA9IHRoaXMuZWxzXHJcbiAgICBjb25zdCBhdWRpbyA9IHRoaXMuYXVkaW9cclxuICAgIGNvbnN0IHZzbGlkZXIgPSBlbHMudm9sdW1lUmFuZ2VcclxuXHJcbiAgICBpZiAodGhpcy5zZXR0aW5ncy51c2VOYXRpdmVWb2x1bWVSYW5nZSAmJiB2c2xpZGVyICYmIHZzbGlkZXIuZWxzLmxlbmd0aCkge1xyXG4gICAgICBhdWRpby5hZGRFdmVudExpc3RlbmVyKCd2b2x1bWVjaGFuZ2UnLCAoKSA9PiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnZvbHVtZUNoYW5naW5nKSB7XHJcbiAgICAgICAgICB2c2xpZGVyLmdldCgwKS52YWx1ZSA9IHRoaXMudm9sdW1lRm9ybWF0dGVkKClcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIHZzbGlkZXJcclxuICAgICAgICAub24oJ21vdXNlZG93bicsICgpID0+IHtcclxuICAgICAgICAgIHRoaXMudm9sdW1lQ2hhbmdpbmcgPSB0cnVlXHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ21vdXNldXAnLCAoKSA9PiB7XHJcbiAgICAgICAgICBhdWRpby52b2x1bWUgPSB2c2xpZGVyLmdldCgwKS52YWx1ZSAqIDAuMDFcclxuICAgICAgICAgIHRoaXMudHJpZ2dlcigndm9sdW1lQ2hhbmdlJylcclxuICAgICAgICAgIHRoaXMudm9sdW1lQ2hhbmdpbmcgPSBmYWxzZVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpbmNWb2x1bWUoKSB7XHJcbiAgICBpZiAoSVNfTU9CSUxFKSByZXR1cm4gdGhpc1xyXG5cclxuICAgIHRoaXMuc2V0Vm9sdW1lKHRydWUpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgZGVjVm9sdW1lKCkge1xyXG4gICAgaWYgKElTX01PQklMRSkgcmV0dXJuIHRoaXNcclxuXHJcbiAgICB0aGlzLnNldFZvbHVtZShmYWxzZSlcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBzZXRWb2x1bWUodXApIHtcclxuICAgIGlmIChJU19NT0JJTEUpIHJldHVybiB0aGlzXHJcblxyXG4gICAgdmFyIHZvbCA9IHRoaXMuYXVkaW8udm9sdW1lLFxyXG4gICAgICAgIGludGVydmFsID0gdGhpcy5zZXR0aW5ncy52b2x1bWVJbnRlcnZhbFxyXG4gICAgaWYgKHVwKSB7XHJcbiAgICAgIHRoaXMuYXVkaW8udm9sdW1lID0gKHZvbCArIGludGVydmFsID49IDEpID8gMSA6IHZvbCArIGludGVydmFsXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmF1ZGlvLnZvbHVtZSA9ICh2b2wgLSBpbnRlcnZhbCA8PSAwKSA/IDAgOiB2b2wgLSBpbnRlcnZhbFxyXG4gICAgfVxyXG4gICAgdGhpcy50cmlnZ2VyKCd2b2x1bWVDaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHZvbHVtZUZvcm1hdHRlZCgpIHtcclxuICAgIHJldHVybiBNYXRoLnJvdW5kKHRoaXMuYXVkaW8udm9sdW1lICogMTAwKVxyXG4gIH1cclxuXHJcbiAgdXBkYXRlVHJhY2tUaXRsZUVsKCkge1xyXG4gICAgdGhpcy5lbHMudHJhY2tUaXRsZS5pbm5lckhUTUwgPSB0aGlzLnRyYWNrbGlzdFt0aGlzLnRyYWNrSW5kZXhdXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlVHJhY2tOdW1iZXJFbCgpIHtcclxuICAgIHRoaXMuZWxzLnRyYWNrTnVtYmVyLmlubmVySFRNTCA9ICt0aGlzLnRyYWNrSW5kZXgrMVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHVwZGF0ZUFydGlzdEVsKCkge1xyXG4gICAgdGhpcy5lbHMuYXJ0aXN0LmlubmVySFRNTCA9IHRoaXMuYXJ0aXN0XHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlQWxidW1FbCgpIHtcclxuICAgIHRoaXMuZWxzLmFsYnVtLmlubmVySFRNTCA9IHRoaXMuYWxidW1cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICB1cGRhdGVDb3ZlcigpIHtcclxuICAgIHRoaXMuZWxzLmNvdmVyLnNyYyA9IHRoaXMuY292ZXJcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICB0b2dnbGVQbGF5KCkge1xyXG4gICAgdGhpcy5hdWRpby5wYXVzZWQgPyB0aGlzLnBsYXkoKSA6IHRoaXMucGF1c2UoKVxyXG4gICAgdGhpcy50cmlnZ2VyKCd0b2dnbGVQbGF5JylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBwbGF5KCkge1xyXG4gICAgdGhpcy5hdWRpby5wbGF5KClcclxuICAgIHRoaXMucGxheWluZyA9IHRydWVcclxuICAgIHRoaXMudHJpZ2dlcigncGxheScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgcGF1c2UoKSB7XHJcbiAgICB0aGlzLmF1ZGlvLnBhdXNlKClcclxuICAgIHRoaXMucGxheWluZyA9IGZhbHNlXHJcbiAgICB0aGlzLnRyaWdnZXIoJ3BhdXNlJylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBzZXRUcmFjayhpbmRleCkge1xyXG4gICAgaWYgKGluZGV4IDw9IDApIHtcclxuICAgICAgdGhpcy50cmFja0luZGV4ID0gMFxyXG4gICAgfSBlbHNlIGlmIChpbmRleCA+PSB0aGlzLnRyYWNrQ291bnQpIHtcclxuICAgICAgdGhpcy50cmFja0luZGV4ID0gdGhpcy50cmFja0NvdW50LTFcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMudHJhY2tJbmRleCA9IGluZGV4XHJcbiAgICB9XHJcbiAgICBjb25zdCB3YXNQbGF5aW5nID0gIXRoaXMuYXVkaW8ucGF1c2VkXHJcbiAgICB0aGlzLiQkdXBkYXRlU291cmNlKClcclxuICAgIGlmICh3YXNQbGF5aW5nKSB0aGlzLmF1ZGlvLnBsYXkoKVxyXG4gICAgdGhpcy50cmlnZ2VyKCd0cmFja0NoYW5nZScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgcHJldigpIHtcclxuICAgIGNvbnN0IHdhc1BsYXlpbmcgPSAhdGhpcy5hdWRpby5wYXVzZWRcclxuICAgIHRoaXMudHJhY2tJbmRleCA9ICh0aGlzLnRyYWNrSW5kZXgtMSA8IDApID8gdGhpcy50cmFja0NvdW50LTEgOiB0aGlzLnRyYWNrSW5kZXgtMVxyXG4gICAgdGhpcy4kJHVwZGF0ZVNvdXJjZSgpXHJcbiAgICBpZiAod2FzUGxheWluZykgdGhpcy5hdWRpby5wbGF5KClcclxuICAgIHRoaXMudHJpZ2dlcigndHJhY2tDaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIG5leHQoKSB7XHJcbiAgICBjb25zdCB3YXNQbGF5aW5nID0gIXRoaXMuYXVkaW8ucGF1c2VkXHJcbiAgICB0aGlzLnRyYWNrSW5kZXggPSAodGhpcy50cmFja0luZGV4KzEgPj0gdGhpcy50cmFja0NvdW50KSA/IDAgOiB0aGlzLnRyYWNrSW5kZXgrMVxyXG4gICAgdGhpcy4kJHVwZGF0ZVNvdXJjZSgpXHJcbiAgICBpZiAod2FzUGxheWluZykgdGhpcy5hdWRpby5wbGF5KClcclxuICAgIHRoaXMudHJpZ2dlcigndHJhY2tDaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHByZXZBbGJ1bSgpIHtcclxuICAgIGNvbnN0IHdhc1BsYXlpbmcgPSAhdGhpcy5hdWRpby5wYXVzZWRcclxuICAgIHRoaXMuYWxidW1JbmRleCA9ICh0aGlzLmFsYnVtSW5kZXgtMSA8IDApID8gdGhpcy5hbGJ1bUNvdW50LTEgOiB0aGlzLmFsYnVtSW5kZXgtMVxyXG4gICAgdGhpcy51cGRhdGUoKVxyXG4gICAgdGhpcy50cmFja0luZGV4ID0gMFxyXG4gICAgdGhpcy4kJHVwZGF0ZVNvdXJjZSgpXHJcbiAgICBpZiAod2FzUGxheWluZykgdGhpcy5hdWRpby5wbGF5KClcclxuICAgIHRoaXMudHJpZ2dlcignYWxidW1DaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIG5leHRBbGJ1bSgpIHtcclxuICAgIGNvbnN0IHdhc1BsYXlpbmc9ICF0aGlzLmF1ZGlvLnBhdXNlZFxyXG4gICAgdGhpcy5hbGJ1bUluZGV4ID0gKHRoaXMuYWxidW1JbmRleCsxID4gdGhpcy5hbGJ1bUNvdW50LTEpID8gMCA6IHRoaXMuYWxidW1JbmRleCsxXHJcbiAgICB0aGlzLnVwZGF0ZSgpXHJcbiAgICB0aGlzLnRyYWNrSW5kZXggPSAwXHJcbiAgICB0aGlzLiQkdXBkYXRlU291cmNlKClcclxuICAgIGlmICh3YXNQbGF5aW5nKSB0aGlzLmF1ZGlvLnBsYXkoKVxyXG4gICAgdGhpcy50cmlnZ2VyKCdhbGJ1bUNoYW5nZScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgc2V0QWxidW0oaW5kZXgpIHtcclxuICAgIGlmIChpbmRleCA8PSAwKSB7XHJcbiAgICAgIHRoaXMuYWxidW1JbmRleCA9IDBcclxuICAgIH0gZWxzZSBpZiAoaW5kZXggPj0gdGhpcy5hbGJ1bUNvdW50KSB7XHJcbiAgICAgIHRoaXMuYWxidW1JbmRleCA9IHRoaXMuYWxidW1Db3VudC0xXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmFsYnVtSW5kZXggPSBpbmRleFxyXG4gICAgfVxyXG4gICAgdGhpcy51cGRhdGUoKVxyXG4gICAgdGhpcy5zZXRUcmFjayh0aGlzLmxpYlt0aGlzLmFsYnVtSW5kZXhdLnN0YXJ0aW5nVHJhY2tJbmRleCB8fCAwKVxyXG4gICAgdGhpcy50cmlnZ2VyKCdhbGJ1bUNoYW5nZScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgc2Vla0JhY2t3YXJkKCkge1xyXG4gICAgaWYgKCF0aGlzLnNlZWtpbmcpIHJldHVybiB0aGlzXHJcbiAgICB0aGlzLm1vdXNlRG93blRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICBjb25zdCBhcHBsaWVkID0gdGhpcy5hdWRpby5jdXJyZW50VGltZSArICh0aGlzLnNldHRpbmdzLnNlZWtJbnRlcnZhbCAqIC0xKVxyXG4gICAgICB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lID0gYXBwbGllZCA8PSAwID8gMCA6IGFwcGxpZWRcclxuICAgIH0sIHRoaXMuc2V0dGluZ3Muc2Vla1RpbWUpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgc2Vla0ZvcndhcmQoKSB7XHJcbiAgICBpZiAoIXRoaXMuc2Vla2luZykgcmV0dXJuIHRoaXNcclxuICAgIHRoaXMubW91c2VEb3duVGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGFwcGxpZWQgPSB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lICsgdGhpcy5zZXR0aW5ncy5zZWVrSW50ZXJ2YWxcclxuICAgICAgdGhpcy5hdWRpby5jdXJyZW50VGltZSA9IGFwcGxpZWQgPj0gdGhpcy5hdWRpby5kdXJhdGlvbiA/IHRoaXMuYXVkaW8uZHVyYXRpb24gOiBhcHBsaWVkXHJcbiAgICB9LCB0aGlzLnNldHRpbmdzLnNlZWtUaW1lKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIGZvcm1hdFRyYWNrbGlzdCgpIHtcclxuICAgIGlmICh0aGlzLnRyYWNrbGlzdCAmJiB0aGlzLnRyYWNrbGlzdC5sZW5ndGgpIHtcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIGNvbnN0IHJlID0gdGhpcy5yZXBsYWNlbWVudFxyXG4gICAgY29uc3QgdHJhY2tsaXN0ID0gW11cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50cmFja0NvdW50OyBpKyspIHtcclxuICAgICAgbGV0IHQgPSB0aGlzLmZpbGVzW2ldXHJcbiAgICAgIC8vIHN0cmlwIGV4dFxyXG4gICAgICB0ID0gdC5zbGljZSh0Lmxhc3RJbmRleE9mKCcuJykrMSlcclxuICAgICAgLy8gZ2V0IGxhc3QgcGF0aCBzZWdtZW50XHJcbiAgICAgIHQgPSB0LnNsaWNlKHQubGFzdEluZGV4T2YoJy8nKSsxKVxyXG4gICAgICBpZiAocmUpIHQgPSB0LnJlcGxhY2UocmVbMF0sIHJlWzFdKVxyXG4gICAgICB0cmFja2xpc3RbaV0gPSB0LnRyaW0oKVxyXG4gICAgfVxyXG4gICAgdGhpcy50cmFja2xpc3QgPSB0cmFja2xpc3RcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBidWZmZXJGb3JtYXR0ZWQoKSB7XHJcbiAgICBpZiAoIXRoaXMuYXVkaW8pIHJldHVybiAwXHJcblxyXG4gICAgY29uc3QgYXVkaW8gPSB0aGlzLmF1ZGlvXHJcbiAgICBsZXQgYnVmZmVyZWRcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBidWZmZXJlZCA9IGF1ZGlvLmJ1ZmZlcmVkLmVuZChhdWRpby5idWZmZXJlZC5sZW5ndGgtMSlcclxuICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICByZXR1cm4gMFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZvcm1hdHRlZCA9IE1hdGgucm91bmQoKGJ1ZmZlcmVkL2F1ZGlvLmR1cmF0aW9uKSoxMDApXHJcbiAgICAvLyB2YXIgZm9ybWF0dGVkID0gTWF0aC5yb3VuZChfLnNjYWxlKGJ1ZmZlcmVkLCAwLCBhdWRpby5kdXJhdGlvbiwgMCwgMTAwKSlcclxuICAgIHJldHVybiBpc05hTihmb3JtYXR0ZWQpID8gMCA6IGZvcm1hdHRlZFxyXG4gIH1cclxuXHJcbiAgLyoqIGludGVybmFsIGhlbHBlciAqL1xyXG4gICQkZ2V0QXVkaW9UaW1lRm9ybWF0dGVkKGF1ZGlvUHJvcCkge1xyXG4gICAgaWYgKGlzTmFOKHRoaXMuYXVkaW8uZHVyYXRpb24pKSByZXR1cm4gJzAwOjAwJ1xyXG4gICAgbGV0IGZvcm1hdHRlZCA9IExhcC5mb3JtYXRUaW1lKE1hdGguZmxvb3IodGhpcy5hdWRpb1thdWRpb1Byb3BdLnRvRml4ZWQoMSkpKVxyXG4gICAgaWYgKHRoaXMuYXVkaW8uZHVyYXRpb24gPCAzNjAwIHx8IGZvcm1hdHRlZCA9PT0gJzAwOjAwOjAwJykge1xyXG4gICAgICBmb3JtYXR0ZWQgPSBmb3JtYXR0ZWQuc2xpY2UoMykgLy8gbm46bm5cclxuICAgIH1cclxuICAgIHJldHVybiBmb3JtYXR0ZWRcclxuICB9XHJcblxyXG4gIGN1cnJlbnRUaW1lRm9ybWF0dGVkKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuJCRnZXRBdWRpb1RpbWVGb3JtYXR0ZWQoJ2N1cnJlbnRUaW1lJylcclxuICAgIC8vIGlmIChpc05hTih0aGlzLmF1ZGlvLmR1cmF0aW9uKSkgcmV0dXJuICcwMDowMCdcclxuICAgIC8vIGxldCBmb3JtYXR0ZWQgPSBMYXAuZm9ybWF0VGltZShNYXRoLmZsb29yKHRoaXMuYXVkaW8uY3VycmVudFRpbWUudG9GaXhlZCgxKSkpXHJcbiAgICAvLyBpZiAodGhpcy5hdWRpby5kdXJhdGlvbiA8IDM2MDAgfHwgZm9ybWF0dGVkID09PSAnMDA6MDA6MDAnKSB7XHJcbiAgICAvLyAgIGZvcm1hdHRlZCA9IGZvcm1hdHRlZC5zbGljZSgzKSAvLyBubjpublxyXG4gICAgLy8gfVxyXG4gICAgLy8gcmV0dXJuIGZvcm1hdHRlZFxyXG4gIH1cclxuXHJcbiAgZHVyYXRpb25Gb3JtYXR0ZWQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy4kJGdldEF1ZGlvVGltZUZvcm1hdHRlZCgnZHVyYXRpb24nKVxyXG4gICAgLy8gaWYgKGlzTmFOKHRoaXMuYXVkaW8uZHVyYXRpb24pKSByZXR1cm4gJzAwOjAwJ1xyXG4gICAgLy8gbGV0IGZvcm1hdHRlZCA9IExhcC5mb3JtYXRUaW1lKE1hdGguZmxvb3IodGhpcy5hdWRpby5kdXJhdGlvbi50b0ZpeGVkKDEpKSlcclxuICAgIC8vIGlmICh0aGlzLmF1ZGlvLmR1cmF0aW9uIDwgMzYwMCB8fCBmb3JtYXR0ZWQgPT09ICcwMDowMDowMCcpIHtcclxuICAgIC8vICAgZm9ybWF0dGVkID0gZm9ybWF0dGVkLnNsaWNlKDMpIC8vIG5uOm5uXHJcbiAgICAvLyB9XHJcbiAgICAvLyByZXR1cm4gZm9ybWF0dGVkXHJcbiAgfVxyXG5cclxuICB0cmFja051bWJlckZvcm1hdHRlZChuKSB7XHJcbiAgICB2YXIgY291bnQgPSBTdHJpbmcodGhpcy50cmFja0NvdW50KS5sZW5ndGggLSBTdHJpbmcobikubGVuZ3RoXHJcbiAgICByZXR1cm4gJzAnLnJlcGVhdChjb3VudCkgKyBuICsgdGhpcy5zZXR0aW5ncy50cmFja051bWJlclBvc3RmaXhcclxuICAgIC8vIHJldHVybiBfLnJlcGVhdCgnMCcsIGNvdW50KSArIG4gKyB0aGlzLnNldHRpbmdzLnRyYWNrTnVtYmVyUG9zdGZpeFxyXG4gIH1cclxuXHJcbiAgZ2V0KGtleSwgaW5kZXgpIHtcclxuICAgIHJldHVybiB0aGlzLmxpYltpbmRleCA9PT0gdW5kZWZpbmVkID8gdGhpcy5hbGJ1bUluZGV4IDogaW5kZXhdW2tleV1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgYWxsIGRvbSwgYXVkaW8sIGFuZCBpbnRlcm5hbCBldmVudCBoYW5kbGVycywgdGhlbiBkZWxldGVzIGFsbCBwcm9wZXJ0aWVzXHJcbiAgICogQHBhcmFtICB7TGFwfSBsYXAgdGhlIExhcCBpbnN0YW5jZVxyXG4gICAqL1xyXG4gIHN0YXRpYyBkZXN0cm95KGxhcCkge1xyXG5cclxuICAgIC8vIHJlbW92ZSBkb20gZXZlbnQgaGFuZGxlcnNcclxuICAgIExhcC5lYWNoKGxhcC5saXN0ZW5lcnMsIChldmVudHMsIGVsZW1lbnROYW1lKSA9PiBkZWxldGUgbGFwLmxpc3RlbmVyc1tlbGVtZW50TmFtZV0pXHJcblxyXG4gICAgLy8gcmVtb3ZlIGF1ZGlvIGV2ZW50c1xyXG4gICAgTGFwLmVhY2gobGFwLmF1ZGlvTGlzdGVuZXJzLCAobGlzdGVuZXJzLCBldmVudCkgPT4gZGVsZXRlIGxhcC5hdWRpb0xpc3RlbmVyc1tldmVudF0pXHJcblxyXG4gICAgLy8gcmVtb3ZlIGFsbCBzdXBlciBoYW5kbGVyc1xyXG4gICAgbGFwLnJlbW92ZSgpXHJcblxyXG4gICAgLy8gbnVsbGlmeSBlbGVtZW50c1xyXG4gICAgTGFwLmVhY2gobGFwLmVscywgKGVsZW1lbnQsIGVsTmFtZSkgPT4gZGVsZXRlIGxhcC5lbHNbZWxOYW1lXSlcclxuXHJcbiAgICAvLyBldmVyeXRoaW5nIGVsc2UganVzdCBpbiBjYXNlXHJcbiAgICBMYXAuZWFjaChsYXAsICh2YWwsIGtleSkgPT4gZGVsZXRlIGxhcFtrZXldKVxyXG5cclxuICAgIHJldHVybiBudWxsXHJcbiAgfVxyXG59XHJcblxyXG5MYXAuJCRpbnN0YW5jZXMgPSBbXVxyXG5cclxuTGFwLiQkYXVkaW9FeHRlbnNpb25SZWdFeHAgPSAvbXAzfHdhdnxvZ2d8YWlmZi9pXHJcblxyXG5MYXAuJCRkZWZhdWx0U2V0dGluZ3MgPSB7XHJcbiAgY2FsbGJhY2tzOiB7fSxcclxuICBkZWJ1ZzogZmFsc2UsXHJcbiAgZGlzY29nUGxheWxpc3RFeGNsdXNpdmU6IHRydWUsXHJcbiAgcGx1Z2luczogW10sXHJcbiAgcHJlcGVuZFRyYWNrTnVtYmVyczogdHJ1ZSxcclxuICByZXBsYWNlbWVudDogbnVsbCxcclxuICBzdGFydGluZ0FsYnVtSW5kZXg6IDAsXHJcbiAgc3RhcnRpbmdUcmFja0luZGV4OiAwLFxyXG4gIHNlZWtJbnRlcnZhbDogNSxcclxuICBzZWVrVGltZTogMjUwLFxyXG4gIHNlbGVjdG9yczoge30sIC8vIHNlZSAjJCRpbml0RWxlbWVudHNcclxuICBzZWxlY3RvclByZWZpeDogJ2xhcCcsXHJcbiAgdHJhY2tOdW1iZXJQb3N0Zml4OiAnIC0gJyxcclxuICB1c2VOYXRpdmVQcm9ncmVzczogZmFsc2UsXHJcbiAgdXNlTmF0aXZlU2Vla1JhbmdlOiBmYWxzZSxcclxuICB1c2VOYXRpdmVWb2x1bWVSYW5nZTogZmFsc2UsXHJcbiAgdm9sdW1lSW50ZXJ2YWw6IDAuMDVcclxufVxyXG5cclxuTGFwLiQkZGVmYXVsdFNlbGVjdG9ycyA9IHtcclxuICBzdGF0ZToge1xyXG4gICAgcGxheWxpc3RJdGVtQ3VycmVudDogICdsYXBfX3BsYXlsaXN0X19pdGVtLS1jdXJyZW50JyxcclxuICAgIHBsYXlpbmc6ICAgICAgICAgICAgICAnbGFwLS1wbGF5aW5nJyxcclxuICAgIHBhdXNlZDogICAgICAgICAgICAgICAnbGFwLS1wYXVzZWQnLFxyXG4gICAgaGlkZGVuOiAgICAgICAgICAgICAgICdsYXAtLWhpZGRlbidcclxuICB9LFxyXG4gIGFsYnVtOiAgICAgICAgICAgICAgICdsYXBfX2FsYnVtJyxcclxuICBhcnRpc3Q6ICAgICAgICAgICAgICAnbGFwX19hcnRpc3QnLFxyXG4gIGJ1ZmZlcmVkOiAgICAgICAgICAgICdsYXBfX2J1ZmZlcmVkJyxcclxuICBjb3ZlcjogICAgICAgICAgICAgICAnbGFwX19jb3ZlcicsXHJcbiAgY3VycmVudFRpbWU6ICAgICAgICAgJ2xhcF9fY3VycmVudC10aW1lJyxcclxuICBkaXNjb2c6ICAgICAgICAgICAgICAnbGFwX19kaXNjb2cnLFxyXG4gIGRpc2NvZ0l0ZW06ICAgICAgICAgICdsYXBfX2Rpc2NvZ19faXRlbScsXHJcbiAgZGlzY29nUGFuZWw6ICAgICAgICAgJ2xhcF9fZGlzY29nX19wYW5lbCcsXHJcbiAgZHVyYXRpb246ICAgICAgICAgICAgJ2xhcF9fZHVyYXRpb24nLFxyXG4gIGluZm86ICAgICAgICAgICAgICAgICdsYXBfX2luZm8nLCAvLyBidXR0b25cclxuICBpbmZvUGFuZWw6ICAgICAgICAgICAnbGFwX19pbmZvLXBhbmVsJyxcclxuICBuZXh0OiAgICAgICAgICAgICAgICAnbGFwX19uZXh0JyxcclxuICBuZXh0QWxidW06ICAgICAgICAgICAnbGFwX19uZXh0LWFsYnVtJyxcclxuICBwbGF5UGF1c2U6ICAgICAgICAgICAnbGFwX19wbGF5LXBhdXNlJyxcclxuICBwbGF5bGlzdDogICAgICAgICAgICAnbGFwX19wbGF5bGlzdCcsIC8vIGJ1dHRvblxyXG4gIHBsYXlsaXN0SXRlbTogICAgICAgICdsYXBfX3BsYXlsaXN0X19pdGVtJywgLy8gbGlzdCBpdGVtXHJcbiAgcGxheWxpc3RQYW5lbDogICAgICAgJ2xhcF9fcGxheWxpc3RfX3BhbmVsJyxcclxuICBwbGF5bGlzdFRyYWNrTnVtYmVyOiAnbGFwX19wbGF5bGlzdF9fdHJhY2stbnVtYmVyJyxcclxuICBwbGF5bGlzdFRyYWNrVGl0bGU6ICAnbGFwX19wbGF5bGlzdF9fdHJhY2stdGl0bGUnLFxyXG4gIHByZXY6ICAgICAgICAgICAgICAgICdsYXBfX3ByZXYnLFxyXG4gIHByZXZBbGJ1bTogICAgICAgICAgICdsYXBfX3ByZXYtYWxidW0nLFxyXG4gIHByb2dyZXNzOiAgICAgICAgICAgICdsYXBfX3Byb2dyZXNzJyxcclxuICBzZWVrQmFja3dhcmQ6ICAgICAgICAnbGFwX19zZWVrLWJhY2t3YXJkJyxcclxuICBzZWVrRm9yd2FyZDogICAgICAgICAnbGFwX19zZWVrLWZvcndhcmQnLFxyXG4gIHNlZWtSYW5nZTogICAgICAgICAgICdsYXBfX3NlZWstcmFuZ2UnLFxyXG4gIHRyYWNrTnVtYmVyOiAgICAgICAgICdsYXBfX3RyYWNrLW51bWJlcicsIC8vIHRoZSBjdXJyZW50bHkgY3VlZCB0cmFja1xyXG4gIHRyYWNrVGl0bGU6ICAgICAgICAgICdsYXBfX3RyYWNrLXRpdGxlJyxcclxuICB2b2x1bWVCdXR0b246ICAgICAgICAnbGFwX192b2x1bWUtYnV0dG9uJyxcclxuICB2b2x1bWVEb3duOiAgICAgICAgICAnbGFwX192b2x1bWUtZG93bicsXHJcbiAgdm9sdW1lUmVhZDogICAgICAgICAgJ2xhcF9fdm9sdW1lLXJlYWQnLFxyXG4gIHZvbHVtZVJhbmdlOiAgICAgICAgICdsYXBfX3ZvbHVtZS1yYW5nZScsXHJcbiAgdm9sdW1lVXA6ICAgICAgICAgICAgJ2xhcF9fdm9sdW1lLXVwJ1xyXG59XHJcblxyXG5pZiAod2luZG93KSB3aW5kb3cuTGFwID0gTGFwXHJcbiJdfQ==
