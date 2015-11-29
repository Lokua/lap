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
      // merge options defaults
      Object.keys(Lap.$$defaultSettings).forEach(function (key) {
        if (options.hasOwnProperty(key)) return _this.settings[key] = options[key];
        _this.settings[key] = Lap.$$defaultSettings[key];
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

      this.albumIndex = this.settings.startingAlbumIndex || 0;
      this.albumCount = this.lib.length;

      this.update();
      this.initAudio();
      this.initElements();
      this.addAudioListeners();
      if (!IS_MOBILE) this.addVolumeListeners();
      this.addSeekListeners();
      this.addListeners();
      Object.keys(this.settings.callbacks, function (key) {
        return _this2.on(key, _this2.settings.callbacks[key]);
      });
      this.activatePlugins();
      this.trigger('load');
    }

    /**
     * Instantiate every plugin's contructor with this Lap instance
     *
     * @return {Lap} this
     */

  }, {
    key: 'activatePlugins',
    value: function activatePlugins() {
      var _this3 = this;

      this.plugins.forEach(function (plugin, i) {
        return _this3.plugins[i] = new plugin(_this3);
      });
      return this;
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
      var _this4 = this;

      this.trackIndex = this.settings.startingTrackIndex;
      this.playlistPopulated = false;

      var currentLibItem = this.lib[this.albumIndex];

      var keys = ['artist', 'album', 'files', 'cover', 'tracklist', 'replacement'];
      keys.forEach(function (key) {
        return _this4[key] = currentLibItem[key];
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
  }, {
    key: 'initAudio',
    value: function initAudio() {
      this.audio = new Audio();
      this.audio.preload = 'auto';
      var fileType = this.getFileType();
      var canPlay = this.audio.canPlayType('audio/' + fileType);
      if (canPlay === 'probably' || canPlay === 'maybe') {
        this.setSource();
        this.audio.volume = 1;
      } else {
        // TODO: return a flag to signal skipping the rest of the initialization process
        console.warn('This browser does not support ' + fileType + ' playback.');
      }
    }
  }, {
    key: 'setSource',
    value: function setSource() {
      this.audio.src = this.files[this.trackIndex];
      return this;
    }
  }, {
    key: 'getFileType',
    value: function getFileType() {
      var f = this.files[this.trackIndex];
      return f.slice(f.lastIndexOf('.') + 1);
    }
  }, {
    key: 'initElements',
    value: function initElements() {
      var _this5 = this;

      this.els = {};
      this.selectors = { state: {} };
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
  }, {
    key: 'addAudioListeners',
    value: function addAudioListeners() {
      var _this6 = this;

      var audio = this.audio;
      var els = this.els;
      var nativeProgress = !!(this.settings.useNativeProgress && els.progress);

      this.audioListeners = {};

      var _addListener = function _addListener(condition, event, fn) {
        if (condition) {
          // stash handler for ease of removal in #destroy call
          _this6.audioListeners[event] = fn.bind(_this6);
          audio.addEventListener(event, _this6.audioListeners[event]);
        }
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
    key: 'addListeners',
    value: function addListeners() {
      var _this7 = this;

      var els = this.els;
      this.listeners = {};

      var _addListener = function _addListener(elementName, event, fn) {
        if (els[elementName]) {
          // stash event name and handler for ease of removal in #destroy call
          _this7.listeners[elementName] = {
            event: event,
            fn: _this7[fn].bind(_this7)
          };
          els[elementName].addEventListener(event, _this7.listeners[elementName].fn);
        }
        return _this7;
      };

      _addListener('playPause', 'click', 'togglePlay');
      _addListener('prev', 'click', 'prev');
      _addListener('next', 'click', 'next');
      _addListener('volumeUp', 'click', 'incVolume');
      _addListener('prevAlbum', 'click', 'prevAlbum');
      _addListener('nextAlbum', 'click', 'nextAlbum');
      _addListener('discog', 'click', 'discogClick');
      _addListener('playlist', 'click', 'playlistClick');

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
    key: 'addSeekListeners',
    value: function addSeekListeners() {
      var _this8 = this;

      var els = this.els;
      var audio = this.audio;
      var seekRange = els.seekRange;
      var nativeSeek = this.settings.useNativeSeekRange && seekRange && seekRange.els.length;

      if (nativeSeek) {
        audio.addEventListener('timeupdate', function (e) {
          if (!_this8.seeking) {
            seekRange.get(0).value = _.scale(audio.currentTime, 0, audio.duration, 0, 100);
          }
        });
        seekRange.on('mousedown', function (e) {
          _this8.seeking = true;
        }).on('mouseup', function (e) {
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
          el.on('mousedown', function (e) {
            _this8.seeking = true;
            if ($(e.target).hasClass(_this8.selectors.seekForward)) {
              _this8.seekForward();
            } else {
              _this8.seekBackward();
            }
          }).on('mouseup', function (e) {
            _this8.seeking = false;
            clearTimeout(_this8.mouseDownTimer);
          });
        });
      }
    }
  }, {
    key: 'addVolumeListeners',
    value: function addVolumeListeners() {
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

    /**
     * Add a plug-in instance to the plugins hash
     * @param  {String} key    the plugin instance identifier
     * @param  {Object} plugin the plugin instance (not the class)
     * @return {Lap}           this
     */

  }, {
    key: 'registerPlugin',
    value: function registerPlugin(key, plugin) {
      this.plugins[key] = plugin;
    }
  }, {
    key: 'updateTrackTitleEl',
    value: function updateTrackTitleEl() {
      this.els.trackTitle.html(this.tracklist[this.trackIndex]);
      return this;
    }
  }, {
    key: 'updateTrackNumberEl',
    value: function updateTrackNumberEl() {
      this.els.trackNumber.html(+this.trackIndex + 1);
      return this;
    }
  }, {
    key: 'updateArtistEl',
    value: function updateArtistEl() {
      this.els.artist.html(this.artist);
      return this;
    }
  }, {
    key: 'updateAlbumEl',
    value: function updateAlbumEl() {
      this.els.album.html(this.album);
      return this;
    }
  }, {
    key: 'updateCover',
    value: function updateCover() {
      this.els.cover.get(0).src = this.cover;
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
      this.setSource();
      if (wasPlaying) this.audio.play();
      this.trigger('trackChange');
      return this;
    }
  }, {
    key: 'prev',
    value: function prev() {
      var wasPlaying = !this.audio.paused;
      this.trackIndex = this.trackIndex - 1 < 0 ? this.trackCount - 1 : this.trackIndex - 1;
      this.setSource();
      if (wasPlaying) this.audio.play();
      this.trigger('trackChange');
      return this;
    }
  }, {
    key: 'next',
    value: function next() {
      var wasPlaying = !this.audio.paused;
      this.trackIndex = this.trackIndex + 1 >= this.trackCount ? 0 : this.trackIndex + 1;
      this.setSource();
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
      this.setSource();
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
      this.setSource();
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
      var formatted = Math.round(_.scale(buffered, 0, audio.duration, 0, 100));
      return isNaN(formatted) ? 0 : formatted;
    }
  }, {
    key: 'currentTimeFormatted',
    value: function currentTimeFormatted() {
      if (isNaN(this.audio.duration)) {
        return '00:00';
      }
      var formatted = _.formatTime(Math.floor(this.audio.currentTime.toFixed(1)));
      if (this.audio.duration < 3600 || formatted === '00:00:00') {
        return formatted.slice(3); // nn:nn
      }
      return formatted;
    }
  }, {
    key: 'durationFormatted',
    value: function durationFormatted() {
      if (isNaN(this.audio.duration)) {
        return '00:00';
      }
      var formatted = _.formatTime(Math.floor(this.audio.duration.toFixed(1)));
      if (this.audio.duration < 3600 || formatted === '00:00:00') {
        return formatted.slice(3); // nn:nn
      }
      return formatted;
    }
  }, {
    key: 'trackNumberFormatted',
    value: function trackNumberFormatted(n) {
      var count = ('' + this.trackCount).length - ('' + n).length;
      return _.repeat('0', count) + n + this.settings.trackNumberPostfix;
    }

    /**
     * Convenience method to grab a property from the currently cued album. A
     * second argument can be passed to choose a specific album.
     * @method get
     * @param  {String} what the property
     * @return {[type]}      [description]
     */

  }, {
    key: 'get',
    value: function get(key, index) {
      return this.lib[index === undefined ? this.albumIndex : index][key];
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      var _this12 = this;

      // remove dom event handlers
      Object.keys(this.listeners).forEach(function (elementName) {
        var listener = _this12.listeners[elementName];
        _this12.els[elementName].removeEventListener(listener.event, listener.fn);
        listener = null;
        delete _this12.listeners[elementName];
      });
      delete this.listeners;

      // remove audio handlers
      Object.keys(this.audioListeners).forEach(function (event) {
        _this12.audio.removeEventListener(event, _this12.audioListeners[event]);
        delete _this12.audioListeners[event];
      });
      delete this.audioListeners;

      // remove all super handlers
      this.remove();
    }
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
      // const classes = `(${_class.split(/\s+/).join('|')})`
      var re = new RegExp('\\s*' + _class + '\\s*(![\\w\\W])?', 'g');
      el.className = el.className.replace(re, ' ').trim();
      return Lap;
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
  selectors: {}, // see #initElements
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGxhcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNBQSxJQUFNLFNBQVMsR0FBRyxLQUFLLENBQUE7O0lBRUYsR0FBRztZQUFILEdBQUc7O0FBRXRCLFdBRm1CLEdBQUcsQ0FFVixPQUFPLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBa0I7UUFBaEIsUUFBUSx5REFBQyxLQUFLOzswQkFGOUIsR0FBRzs7Ozt1RUFBSCxHQUFHOztBQU1wQixVQUFLLEVBQUUsR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDLEVBQUUsR0FBRyxPQUFPLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFBO0FBQ3JFLE9BQUcsQ0FBQyxXQUFXLENBQUMsTUFBSyxFQUFFLENBQUMsUUFBTyxDQUFBOztBQUUvQixVQUFLLE9BQU8sR0FBRyxPQUFPLE9BQU8sS0FBSyxRQUFRLEdBQ3RDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQy9CLE9BQU8sQ0FBQTs7QUFFWCxVQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTs7QUFFaEIsVUFBSyxRQUFRLEdBQUcsRUFBRSxDQUFBO0FBQ2xCLFFBQUksT0FBTyxFQUFFOztBQUVYLFlBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUEsR0FBRyxFQUFJO0FBQ2hELFlBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFRLE1BQUssUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzRSxjQUFLLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUE7T0FDaEQsQ0FBQyxDQUFBO0tBQ0gsTUFBTTtBQUNM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cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgSVNfTU9CSUxFID0gZmFsc2VcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExhcCBleHRlbmRzIEJ1cyB7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIGxpYiwgb3B0aW9ucywgcG9zdHBvbmU9ZmFsc2UpIHtcclxuICAgIHN1cGVyKClcclxuXHJcbiAgICAvLyBkZWZhdWx0IGlkIHRvIHplcm8tYmFzZWQgaW5kZXggaW5jcmVtZW50ZXJcclxuICAgIHRoaXMuaWQgPSBvcHRpb25zICYmIG9wdGlvbnMuaWQgPyBvcHRpb25zLmlkIDogTGFwLiQkaW5zdGFuY2VzLmxlbmd0aFxyXG4gICAgTGFwLiQkaW5zdGFuY2VzW3RoaXMuaWRdID0gdGhpc1xyXG5cclxuICAgIHRoaXMuZWxlbWVudCA9IHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJ1xyXG4gICAgICA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudClcclxuICAgICAgOiBlbGVtZW50XHJcblxyXG4gICAgdGhpcy5zZXRMaWIobGliKVxyXG5cclxuICAgIHRoaXMuc2V0dGluZ3MgPSB7fVxyXG4gICAgaWYgKG9wdGlvbnMpIHtcclxuICAgICAgLy8gbWVyZ2Ugb3B0aW9ucyBkZWZhdWx0c1xyXG4gICAgICBPYmplY3Qua2V5cyhMYXAuJCRkZWZhdWx0U2V0dGluZ3MpLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrZXkpKSByZXR1cm4gKHRoaXMuc2V0dGluZ3Nba2V5XSA9IG9wdGlvbnNba2V5XSlcclxuICAgICAgICB0aGlzLnNldHRpbmdzW2tleV0gPSBMYXAuJCRkZWZhdWx0U2V0dGluZ3Nba2V5XVxyXG4gICAgICB9KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5zZXR0aW5ncyA9IExhcC4kJGRlZmF1bHRTZXR0aW5nc1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghcG9zdHBvbmUpIHRoaXMuaW5pdGlhbGl6ZSgpXHJcblxyXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuZGVidWcpIHtcclxuICAgICAgY29uc3QgZWNobyA9IGUgPT4ge1xyXG4gICAgICAgIHRoaXMub24oZSwgKCkgPT4gY29uc29sZS5pbmZvKCclYyVzIGhhbmRsZXIgY2FsbGVkJywgJ2NvbG9yOiM4MDAwODAnLCBlKSlcclxuICAgICAgfVxyXG4gICAgICBlY2hvKCdsb2FkJylcclxuICAgICAgZWNobygncGxheScpXHJcbiAgICAgIGVjaG8oJ3BhdXNlJylcclxuICAgICAgZWNobygnc2VlaycpXHJcbiAgICAgIGVjaG8oJ3RyYWNrQ2hhbmdlJylcclxuICAgICAgZWNobygnYWxidW1DaGFuZ2UnKVxyXG4gICAgICBlY2hvKCd2b2x1bWVDaGFuZ2UnKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZ2V0SW5zdGFuY2UoaWQpIHtcclxuICAgIHJldHVybiBMYXAuJCRpbnN0YW5jZXNbaWRdXHJcbiAgfVxyXG5cclxuICBzdGF0aWMgYWRkQ2xhc3MoZWwsIF9jbGFzcykge1xyXG4gICAgaWYgKCFlbCkgcmV0dXJuIGNvbnNvbGUud2FybihgJHtlbH0gaXMgbm90IGRlZmluZWRgKVxyXG4gICAgaWYgKCFlbC5jbGFzc05hbWUpIHtcclxuICAgICAgcmV0dXJuIChlbC5jbGFzc05hbWUgKz0gJyAnICsgX2NsYXNzKVxyXG4gICAgfVxyXG4gICAgY29uc3QgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZVxyXG4gICAgY29uc3QgbmV3Q2xhc3NlcyA9IF9jbGFzc1xyXG4gICAgICAuc3BsaXQoL1xccysvKVxyXG4gICAgICAuZmlsdGVyKG4gPT4gY2xhc3NOYW1lcy5pbmRleE9mKG4pID09PSAtMSlcclxuICAgICAgLmpvaW4oJyAnKVxyXG4gICAgZWwuY2xhc3NOYW1lICs9ICcgJyArIG5ld0NsYXNzZXNcclxuICAgIHJldHVybiBMYXBcclxuICB9XHJcblxyXG4gIHN0YXRpYyByZW1vdmVDbGFzcyhlbCwgX2NsYXNzKSB7XHJcbiAgICBpZiAoIWVsKSByZXR1cm4gY29uc29sZS53YXJuKGAke2VsfSBpcyBub3QgZGVmaW5lZGApXHJcbiAgICAvLyBjb25zdCBjbGFzc2VzID0gYCgke19jbGFzcy5zcGxpdCgvXFxzKy8pLmpvaW4oJ3wnKX0pYFxyXG4gICAgY29uc3QgcmUgPSBuZXcgUmVnRXhwKCdcXFxccyonICsgX2NsYXNzICsgJ1xcXFxzKighW1xcXFx3XFxcXFddKT8nLCAnZycpXHJcbiAgICBlbC5jbGFzc05hbWUgPSBlbC5jbGFzc05hbWUucmVwbGFjZShyZSwgJyAnKS50cmltKClcclxuICAgIHJldHVybiBMYXBcclxuICB9XHJcblxyXG4gIHNldExpYihsaWIpIHtcclxuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgbGliXHJcbiAgICBjb25zdCBpc0FycmF5ID0gbGliIGluc3RhbmNlb2YgQXJyYXlcclxuICAgIGlmIChpc0FycmF5KSB7XHJcbiAgICAgIHRoaXMubGliID0gbGliXHJcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgIHRoaXMubGliID0gW2xpYl1cclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycgJiYgTGFwLiQkYXVkaW9FeHRlbnNpb25SZWdFeHAudGVzdChsaWIpKSB7XHJcbiAgICAgIHRoaXMubGliID0gW3sgZmlsZXM6IFtsaWJdIH1dXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bGlifSBtdXN0IGJlIGFuIGFycmF5LCBvYmplY3QsIG9yIHN0cmluZ2ApXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgaW5pdGlhbGl6ZSgpIHtcclxuXHJcbiAgICAvLyBzdGF0ZVxyXG4gICAgdGhpcy5zZWVraW5nID0gZmFsc2VcclxuICAgIHRoaXMudm9sdW1lQ2hhbmdpbmcgPSBmYWxzZVxyXG4gICAgdGhpcy5tb3VzZURvd25UaW1lciA9IDBcclxuICAgIHRoaXMucGxheWluZyA9IGZhbHNlXHJcblxyXG4gICAgdGhpcy5wbHVnaW5zID0gdGhpcy5zZXR0aW5ncy5wbHVnaW5zXHJcblxyXG4gICAgdGhpcy5hbGJ1bUluZGV4ID0gdGhpcy5zZXR0aW5ncy5zdGFydGluZ0FsYnVtSW5kZXggfHwgMFxyXG4gICAgdGhpcy5hbGJ1bUNvdW50ID0gdGhpcy5saWIubGVuZ3RoXHJcblxyXG4gICAgdGhpcy51cGRhdGUoKVxyXG4gICAgdGhpcy5pbml0QXVkaW8oKVxyXG4gICAgdGhpcy5pbml0RWxlbWVudHMoKVxyXG4gICAgdGhpcy5hZGRBdWRpb0xpc3RlbmVycygpXHJcbiAgICBpZiAoIUlTX01PQklMRSkgdGhpcy5hZGRWb2x1bWVMaXN0ZW5lcnMoKVxyXG4gICAgdGhpcy5hZGRTZWVrTGlzdGVuZXJzKClcclxuICAgIHRoaXMuYWRkTGlzdGVuZXJzKClcclxuICAgIE9iamVjdC5rZXlzKHRoaXMuc2V0dGluZ3MuY2FsbGJhY2tzLCBrZXkgPT4gdGhpcy5vbihrZXksIHRoaXMuc2V0dGluZ3MuY2FsbGJhY2tzW2tleV0pKVxyXG4gICAgdGhpcy5hY3RpdmF0ZVBsdWdpbnMoKVxyXG4gICAgdGhpcy50cmlnZ2VyKCdsb2FkJylcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluc3RhbnRpYXRlIGV2ZXJ5IHBsdWdpbidzIGNvbnRydWN0b3Igd2l0aCB0aGlzIExhcCBpbnN0YW5jZVxyXG4gICAqXHJcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXHJcbiAgICovXHJcbiAgYWN0aXZhdGVQbHVnaW5zKCkge1xyXG4gICAgdGhpcy5wbHVnaW5zLmZvckVhY2goKHBsdWdpbiwgaSkgPT4gdGhpcy5wbHVnaW5zW2ldID0gbmV3IHBsdWdpbih0aGlzKSlcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25maWd1cmVzIGluc3RhbmNlIHZhcmlhYmxlcyByZWxhdGl2ZSB0byB0aGUgY3VycmVudCBhbGJ1bS5cclxuICAgKiBDYWxsZWQgb24gaW5pdGlhbGl6YXRpb24gYW5kIHdoZW5ldmVyIGFuIGFsYnVtIGlzIGNoYW5nZWQuXHJcbiAgICpcclxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcclxuICAgKi9cclxuICB1cGRhdGUoKSB7XHJcbiAgICB0aGlzLnRyYWNrSW5kZXggPSB0aGlzLnNldHRpbmdzLnN0YXJ0aW5nVHJhY2tJbmRleFxyXG4gICAgdGhpcy5wbGF5bGlzdFBvcHVsYXRlZCA9IGZhbHNlXHJcblxyXG4gICAgY29uc3QgY3VycmVudExpYkl0ZW0gPSB0aGlzLmxpYlt0aGlzLmFsYnVtSW5kZXhdXHJcblxyXG4gICAgY29uc3Qga2V5cyA9IFsnYXJ0aXN0JywgJ2FsYnVtJywgJ2ZpbGVzJywgJ2NvdmVyJywgJ3RyYWNrbGlzdCcsICdyZXBsYWNlbWVudCddXHJcbiAgICBrZXlzLmZvckVhY2goa2V5ID0+IHRoaXNba2V5XSA9IGN1cnJlbnRMaWJJdGVtW2tleV0pXHJcblxyXG4gICAgdGhpcy50cmFja0NvdW50ID0gdGhpcy5maWxlcy5sZW5ndGhcclxuXHJcbiAgICAvLyByZXBsYWNlbWVudCA9PT0gW3JlZ2V4cCwgcmVwbGFjZW1lbnQsIG9wdGlvbmFsX2ZsYWdzXVxyXG4gICAgaWYgKHRoaXMucmVwbGFjZW1lbnQpIHtcclxuICAgICAgbGV0IHJlID0gdGhpcy5yZXBsYWNlbWVudFxyXG4gICAgICAvLyBmb3IgcmVwbGFjbWVudCB3aXRob3V0IHZhbHVlIHNwZWNpZmllZCwgZW1wdHkgc3RyaW5nIFxyXG4gICAgICBpZiAodHlwZW9mIHJlID09PSAnc3RyaW5nJykgcmUgPSBbcmUsICcnXVxyXG4gICAgICAvLyByZSBtYXkgY29udGFpbiBzdHJpbmctd3JhcHBlZCByZWdleHAgKGZyb20ganNvbiksIGNvbnZlcnQgaWYgc29cclxuICAgICAgaWYgKHJlIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICBjb25zdCBmbGFncyA9IHJlWzJdXHJcbiAgICAgICAgcmVbMF0gPSBuZXcgUmVnRXhwKHJlWzBdLCBmbGFncyAhPT0gdW5kZWZpbmVkID8gZmxhZ3MgOiAnZycpXHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5yZXBsYWNlbWVudCA9IHJlXHJcbiAgICB9XHJcbiAgICB0aGlzLmZvcm1hdFRyYWNrbGlzdCgpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgaW5pdEF1ZGlvKCkge1xyXG4gICAgdGhpcy5hdWRpbyA9IG5ldyBBdWRpbygpXHJcbiAgICB0aGlzLmF1ZGlvLnByZWxvYWQgPSAnYXV0bydcclxuICAgIGNvbnN0IGZpbGVUeXBlID0gdGhpcy5nZXRGaWxlVHlwZSgpXHJcbiAgICBjb25zdCBjYW5QbGF5ID0gdGhpcy5hdWRpby5jYW5QbGF5VHlwZSgnYXVkaW8vJyArIGZpbGVUeXBlKVxyXG4gICAgaWYgKGNhblBsYXkgPT09ICdwcm9iYWJseScgfHwgY2FuUGxheSA9PT0gJ21heWJlJykge1xyXG4gICAgICB0aGlzLnNldFNvdXJjZSgpXHJcbiAgICAgIHRoaXMuYXVkaW8udm9sdW1lID0gMVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gVE9ETzogcmV0dXJuIGEgZmxhZyB0byBzaWduYWwgc2tpcHBpbmcgdGhlIHJlc3Qgb2YgdGhlIGluaXRpYWxpemF0aW9uIHByb2Nlc3NcclxuICAgICAgY29uc29sZS53YXJuKGBUaGlzIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCAke2ZpbGVUeXBlfSBwbGF5YmFjay5gKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2V0U291cmNlKCkge1xyXG4gICAgdGhpcy5hdWRpby5zcmMgPSB0aGlzLmZpbGVzW3RoaXMudHJhY2tJbmRleF1cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBnZXRGaWxlVHlwZSgpIHtcclxuICAgIGNvbnN0IGYgPSB0aGlzLmZpbGVzW3RoaXMudHJhY2tJbmRleF1cclxuICAgIHJldHVybiBmLnNsaWNlKGYubGFzdEluZGV4T2YoJy4nKSsxKVxyXG4gIH1cclxuXHJcbiAgaW5pdEVsZW1lbnRzKCkge1xyXG4gICAgdGhpcy5lbHMgPSB7fVxyXG4gICAgdGhpcy5zZWxlY3RvcnMgPSB7IHN0YXRlOiB7fSB9XHJcbiAgICBPYmplY3Qua2V5cyhMYXAuJCRkZWZhdWx0U2VsZWN0b3JzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgIGlmIChrZXkgIT09ICdzdGF0ZScpIHtcclxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5zZWxlY3RvcnMuaGFzT3duUHJvcGVydHlba2V5XSkge1xyXG4gICAgICAgICAgdGhpcy5zZWxlY3RvcnNba2V5XSA9IHRoaXMuc2V0dGluZ3Muc2VsZWN0b3JzW2tleV1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5zZWxlY3RvcnNba2V5XSA9IExhcC4kJGRlZmF1bHRTZWxlY3RvcnNba2V5XVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZWwgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcihgLiR7dGhpcy5zZWxlY3RvcnNba2V5XX1gKVxyXG4gICAgICAgIGlmIChlbCkgdGhpcy5lbHNba2V5XSA9IGVsXHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IGhhc1N0YXRlT3ZlcnJpZGVzID0gISF0aGlzLnNldHRpbmdzLnNlbGVjdG9ycy5zdGF0ZVxyXG4gICAgICAgIE9iamVjdC5rZXlzKExhcC4kJGRlZmF1bHRTZWxlY3RvcnMuc3RhdGUpLmZvckVhY2goayA9PiB7XHJcbiAgICAgICAgICBpZiAoaGFzU3RhdGVPdmVycmlkZXMgJiYgdGhpcy5zZXR0aW5ncy5zdGF0ZS5oYXNPd25Qcm9wZXJ0eVtrXSkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdG9ycy5zdGF0ZVtrXSA9IHRoaXMuc2V0dGluZ3Muc3RhdGVba11cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0b3JzLnN0YXRlW2tdID0gTGFwLiQkZGVmYXVsdFNlbGVjdG9ycy5zdGF0ZVtrXVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICBhZGRBdWRpb0xpc3RlbmVycygpIHtcclxuICAgIGNvbnN0IGF1ZGlvID0gdGhpcy5hdWRpb1xyXG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcclxuICAgIGNvbnN0IG5hdGl2ZVByb2dyZXNzID0gISEodGhpcy5zZXR0aW5ncy51c2VOYXRpdmVQcm9ncmVzcyAmJiBlbHMucHJvZ3Jlc3MpXHJcblxyXG4gICAgdGhpcy5hdWRpb0xpc3RlbmVycyA9IHt9XHJcblxyXG4gICAgY29uc3QgX2FkZExpc3RlbmVyID0gKGNvbmRpdGlvbiwgZXZlbnQsIGZuKSA9PiB7XHJcbiAgICAgIGlmIChjb25kaXRpb24pIHtcclxuICAgICAgICAvLyBzdGFzaCBoYW5kbGVyIGZvciBlYXNlIG9mIHJlbW92YWwgaW4gI2Rlc3Ryb3kgY2FsbFxyXG4gICAgICAgIHRoaXMuYXVkaW9MaXN0ZW5lcnNbZXZlbnRdID0gZm4uYmluZCh0aGlzKVxyXG4gICAgICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIHRoaXMuYXVkaW9MaXN0ZW5lcnNbZXZlbnRdKVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2FkZExpc3RlbmVyKCEhKGVscy5idWZmZXJlZCB8fCBuYXRpdmVQcm9ncmVzcyksICdwcm9ncmVzcycsICgpID0+IHtcclxuICAgICAgLy8gVE9ETzogdmVyaWZ5IGlmIHRoaXMgcmVhbGx5IG5lZWRzIHRvIGJlIHR5cGUgY2FzdC4uLlxyXG4gICAgICB2YXIgYnVmZmVyZWQgPSArdGhpcy5idWZmZXJGb3JtYXR0ZWQoKVxyXG4gICAgICBpZiAoZWxzLmJ1ZmZlcmVkKSBlbHMuYnVmZmVyZWQuaW5uZXJIVE1MID0gYnVmZmVyZWRcclxuICAgICAgaWYgKG5hdGl2ZVByb2dyZXNzKSBlbHMucHJvZ3Jlc3MudmFsdWUgPSBidWZmZXJlZFxyXG4gICAgfSlcclxuXHJcbiAgICBfYWRkTGlzdGVuZXIoISFlbHMuY3VycmVudFRpbWUsICd0aW1ldXBkYXRlJywgKCkgPT4ge1xyXG4gICAgICBlbHMuY3VycmVudFRpbWUuaW5uZXJIVE1MID0gdGhpcy5jdXJyZW50VGltZUZvcm1hdHRlZCgpXHJcbiAgICB9KVxyXG5cclxuICAgIF9hZGRMaXN0ZW5lcighIWVscy5kdXJhdGlvbiwgJ2R1cmF0aW9uY2hhbmdlJywgKCkgPT4ge1xyXG4gICAgICBlbHMuZHVyYXRpb24uaW5uZXJIVE1MID0gdGhpcy5kdXJhdGlvbkZvcm1hdHRlZCgpXHJcbiAgICB9KVxyXG5cclxuICAgIF9hZGRMaXN0ZW5lcih0cnVlLCAnZW5kZWQnLCAoKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLnBsYXlpbmcpIHtcclxuICAgICAgICB0aGlzLm5leHQoKVxyXG4gICAgICAgIGF1ZGlvLnBsYXkoKVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBhZGRMaXN0ZW5lcnMoKSB7XHJcbiAgICBjb25zdCBlbHMgPSB0aGlzLmVsc1xyXG4gICAgdGhpcy5saXN0ZW5lcnMgPSB7fVxyXG5cclxuICAgIGNvbnN0IF9hZGRMaXN0ZW5lciA9IChlbGVtZW50TmFtZSwgZXZlbnQsIGZuKSA9PiB7XHJcbiAgICAgIGlmIChlbHNbZWxlbWVudE5hbWVdKSB7XHJcbiAgICAgICAgLy8gc3Rhc2ggZXZlbnQgbmFtZSBhbmQgaGFuZGxlciBmb3IgZWFzZSBvZiByZW1vdmFsIGluICNkZXN0cm95IGNhbGxcclxuICAgICAgICB0aGlzLmxpc3RlbmVyc1tlbGVtZW50TmFtZV0gPSB7XHJcbiAgICAgICAgICBldmVudCxcclxuICAgICAgICAgIGZuOiB0aGlzW2ZuXS5iaW5kKHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc1tlbGVtZW50TmFtZV0uYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgdGhpcy5saXN0ZW5lcnNbZWxlbWVudE5hbWVdLmZuKVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgX2FkZExpc3RlbmVyKCdwbGF5UGF1c2UnLCAnY2xpY2snLCAndG9nZ2xlUGxheScpXHJcbiAgICBfYWRkTGlzdGVuZXIoJ3ByZXYnLCAnY2xpY2snLCAncHJldicpXHJcbiAgICBfYWRkTGlzdGVuZXIoJ25leHQnLCAnY2xpY2snLCAnbmV4dCcpXHJcbiAgICBfYWRkTGlzdGVuZXIoJ3ZvbHVtZVVwJywgJ2NsaWNrJywgJ2luY1ZvbHVtZScpXHJcbiAgICBfYWRkTGlzdGVuZXIoJ3ByZXZBbGJ1bScsICdjbGljaycsICdwcmV2QWxidW0nKVxyXG4gICAgX2FkZExpc3RlbmVyKCduZXh0QWxidW0nLCAnY2xpY2snLCAnbmV4dEFsYnVtJylcclxuICAgIF9hZGRMaXN0ZW5lcignZGlzY29nJywgJ2NsaWNrJywgJ2Rpc2NvZ0NsaWNrJylcclxuICAgIF9hZGRMaXN0ZW5lcigncGxheWxpc3QnLCAnY2xpY2snLCAncGxheWxpc3RDbGljaycpXHJcblxyXG4gICAgY29uc3QgX2lmID0gKGVsZW1lbnROYW1lLCBmbikgPT4ge1xyXG4gICAgICBpZiAodGhpcy5lbHNbZWxlbWVudE5hbWVdKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgIHRoaXNbZm5dKClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gYW5vbnltb3VzXHJcbiAgICAgICAgICBmbigpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5vbignbG9hZCcsICgpID0+IHtcclxuICAgICAgX2lmKCd0cmFja1RpdGxlJywgJ3VwZGF0ZVRyYWNrVGl0bGVFbCcpXHJcbiAgICAgIF9pZigndHJhY2tOdW1iZXInLCAndXBkYXRlVHJhY2tOdW1iZXJFbCcpXHJcbiAgICAgIF9pZignYXJ0aXN0JywgJ3VwZGF0ZUFydGlzdEVsJylcclxuICAgICAgX2lmKCdhbGJ1bScsICd1cGRhdGVBbGJ1bUVsJylcclxuICAgICAgX2lmKCdjb3ZlcicsICd1cGRhdGVDb3ZlcicpXHJcbiAgICAgIF9pZigncGxheVBhdXNlJywgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHMgPSB0aGlzLnNlbGVjdG9ycy5zdGF0ZVxyXG4gICAgICAgIGNvbnN0IHBwID0gZWxzLnBsYXlQYXVzZVxyXG4gICAgICAgIExhcC5hZGRDbGFzcyhwcCwgcy5wYXVzZWQpXHJcbiAgICAgICAgdGhpcy5vbigncGxheScsICgpID0+IExhcC5yZW1vdmVDbGFzcyhwcCwgcy5wYXVzZWQpLmFkZENsYXNzKHBwLCBzLnBsYXlpbmcpKVxyXG4gICAgICAgIHRoaXMub24oJ3BhdXNlJywgKCkgPT4gTGFwLnJlbW92ZUNsYXNzKHBwLCBzLnBsYXlpbmcpLmFkZENsYXNzKHBwLCBzLnBhdXNlZCkpXHJcbiAgICAgIH0pXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMub24oJ3RyYWNrQ2hhbmdlJywgKCkgPT4ge1xyXG4gICAgICBfaWYoJ3RyYWNrVGl0bGUnLCAndXBkYXRlVHJhY2tUaXRsZUVsJylcclxuICAgICAgX2lmKCd0cmFja051bWJlcicsICd1cGRhdGVUcmFja051bWJlckVsJylcclxuICAgICAgX2lmKCdjdXJyZW50VGltZScsICgpID0+IGVscy5jdXJyZW50VGltZS5pbm5lckhUTUwgPSB0aGlzLmN1cnJlbnRUaW1lRm9ybWF0dGVkKCkpXHJcbiAgICAgIF9pZignZHVyYXRpb24nLCAoKSA9PiBlbHMuZHVyYXRpb24uaW5uZXJIVE1MID0gdGhpcy5kdXJhdGlvbkZvcm1hdHRlZCgpKVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLm9uKCdhbGJ1bUNoYW5nZScsICgpID0+IHtcclxuICAgICAgX2lmKCd0cmFja1RpdGxlJywgJ3VwZGF0ZVRyYWNrVGl0bGVFbCcpXHJcbiAgICAgIF9pZigndHJhY2tOdW1iZXInLCAndXBkYXRlVHJhY2tOdW1iZXJFbCcpXHJcbiAgICAgIF9pZignYXJ0aXN0JywgJ3VwZGF0ZUFydGlzdEVsJylcclxuICAgICAgX2lmKCdhbGJ1bScsICd1cGRhdGVBbGJ1bUVsJylcclxuICAgICAgX2lmKCdjb3ZlcicsICd1cGRhdGVDb3ZlcicpXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgYWRkU2Vla0xpc3RlbmVycygpIHtcclxuICAgIGNvbnN0IGVscyA9IHRoaXMuZWxzXHJcbiAgICBjb25zdCBhdWRpbyA9IHRoaXMuYXVkaW9cclxuICAgIGNvbnN0IHNlZWtSYW5nZSA9IGVscy5zZWVrUmFuZ2VcclxuICAgIGNvbnN0IG5hdGl2ZVNlZWsgPSB0aGlzLnNldHRpbmdzLnVzZU5hdGl2ZVNlZWtSYW5nZSAmJiBzZWVrUmFuZ2UgJiYgc2Vla1JhbmdlLmVscy5sZW5ndGhcclxuXHJcbiAgICBpZiAobmF0aXZlU2Vlaykge1xyXG4gICAgICBhdWRpby5hZGRFdmVudExpc3RlbmVyKCd0aW1ldXBkYXRlJywgZSA9PiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnNlZWtpbmcpIHtcclxuICAgICAgICAgIHNlZWtSYW5nZS5nZXQoMCkudmFsdWUgPSBfLnNjYWxlKGF1ZGlvLmN1cnJlbnRUaW1lLCAwLCBhdWRpby5kdXJhdGlvbiwgMCwgMTAwKVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgc2Vla1JhbmdlXHJcbiAgICAgICAgLm9uKCdtb3VzZWRvd24nLCBlID0+IHtcclxuICAgICAgICAgIHRoaXMuc2Vla2luZyA9IHRydWVcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5vbignbW91c2V1cCcsIGUgPT4ge1xyXG4gICAgICAgICAgdmFyIGVsID0gc2Vla1JhbmdlLmdldCgwKVxyXG4gICAgICAgICAgaWYgKCFlbC52YWx1ZSkgdGhpcy5sb2dnZXIuZGVidWcoJ3doYXQgdGhlIGZ1Y2shICcgKyBlbClcclxuICAgICAgICAgIGF1ZGlvLmN1cnJlbnRUaW1lID0gXy5zY2FsZShlbC52YWx1ZSwgMCwgZWwubWF4LCAwLCBhdWRpby5kdXJhdGlvbilcclxuICAgICAgICAgIHRoaXMudHJpZ2dlcignc2VlaycpXHJcbiAgICAgICAgICB0aGlzLnNlZWtpbmcgPSBmYWxzZVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgfSBlbHNlIHsgLy8gdXNpbmcgYnV0dG9uc1xyXG4gICAgICBbZWxzLnNlZWtGb3J3YXJkLCBlbHMuc2Vla0JhY2t3YXJkXS5mb3JFYWNoKGVsID0+IHtcclxuICAgICAgICBpZiAoIWVsKSByZXR1cm5cclxuICAgICAgICBlbFxyXG4gICAgICAgICAgLm9uKCdtb3VzZWRvd24nLCBlID0+IHtcclxuICAgICAgICAgICAgdGhpcy5zZWVraW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICBpZiAoJChlLnRhcmdldCkuaGFzQ2xhc3ModGhpcy5zZWxlY3RvcnMuc2Vla0ZvcndhcmQpKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5zZWVrRm9yd2FyZCgpXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5zZWVrQmFja3dhcmQoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLm9uKCdtb3VzZXVwJywgZSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Vla2luZyA9IGZhbHNlXHJcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLm1vdXNlRG93blRpbWVyKVxyXG4gICAgICAgICAgfSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFkZFZvbHVtZUxpc3RlbmVycygpIHtcclxuICAgIGlmIChJU19NT0JJTEUpIHJldHVybiB0aGlzXHJcblxyXG4gICAgY29uc3QgbGFwID0gdGhpc1xyXG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcclxuICAgIGNvbnN0IGF1ZGlvID0gdGhpcy5hdWRpb1xyXG4gICAgY29uc3QgdnNsaWRlciA9IGVscy52b2x1bWVSYW5nZVxyXG5cclxuICAgIGlmICh0aGlzLnNldHRpbmdzLnVzZU5hdGl2ZVZvbHVtZVJhbmdlICYmIHZzbGlkZXIgJiYgdnNsaWRlci5lbHMubGVuZ3RoKSB7XHJcbiAgICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoJ3ZvbHVtZWNoYW5nZScsICgpID0+IHtcclxuICAgICAgICBpZiAoIXRoaXMudm9sdW1lQ2hhbmdpbmcpIHtcclxuICAgICAgICAgIHZzbGlkZXIuZ2V0KDApLnZhbHVlID0gdGhpcy52b2x1bWVGb3JtYXR0ZWQoKVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgdnNsaWRlclxyXG4gICAgICAgIC5vbignbW91c2Vkb3duJywgKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy52b2x1bWVDaGFuZ2luZyA9IHRydWVcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5vbignbW91c2V1cCcsICgpID0+IHtcclxuICAgICAgICAgIGF1ZGlvLnZvbHVtZSA9IHZzbGlkZXIuZ2V0KDApLnZhbHVlICogMC4wMVxyXG4gICAgICAgICAgdGhpcy50cmlnZ2VyKCd2b2x1bWVDaGFuZ2UnKVxyXG4gICAgICAgICAgdGhpcy52b2x1bWVDaGFuZ2luZyA9IGZhbHNlXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGluY1ZvbHVtZSgpIHtcclxuICAgIGlmIChJU19NT0JJTEUpIHJldHVybiB0aGlzXHJcblxyXG4gICAgdGhpcy5zZXRWb2x1bWUodHJ1ZSlcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBkZWNWb2x1bWUoKSB7XHJcbiAgICBpZiAoSVNfTU9CSUxFKSByZXR1cm4gdGhpc1xyXG5cclxuICAgIHRoaXMuc2V0Vm9sdW1lKGZhbHNlKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHNldFZvbHVtZSh1cCkge1xyXG4gICAgaWYgKElTX01PQklMRSkgcmV0dXJuIHRoaXNcclxuXHJcbiAgICB2YXIgdm9sID0gdGhpcy5hdWRpby52b2x1bWUsXHJcbiAgICAgICAgaW50ZXJ2YWwgPSB0aGlzLnNldHRpbmdzLnZvbHVtZUludGVydmFsXHJcbiAgICBpZiAodXApIHtcclxuICAgICAgdGhpcy5hdWRpby52b2x1bWUgPSAodm9sICsgaW50ZXJ2YWwgPj0gMSkgPyAxIDogdm9sICsgaW50ZXJ2YWxcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuYXVkaW8udm9sdW1lID0gKHZvbCAtIGludGVydmFsIDw9IDApID8gMCA6IHZvbCAtIGludGVydmFsXHJcbiAgICB9XHJcbiAgICB0aGlzLnRyaWdnZXIoJ3ZvbHVtZUNoYW5nZScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgdm9sdW1lRm9ybWF0dGVkKCkge1xyXG4gICAgcmV0dXJuIE1hdGgucm91bmQodGhpcy5hdWRpby52b2x1bWUgKiAxMDApXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGQgYSBwbHVnLWluIGluc3RhbmNlIHRvIHRoZSBwbHVnaW5zIGhhc2hcclxuICAgKiBAcGFyYW0gIHtTdHJpbmd9IGtleSAgICB0aGUgcGx1Z2luIGluc3RhbmNlIGlkZW50aWZpZXJcclxuICAgKiBAcGFyYW0gIHtPYmplY3R9IHBsdWdpbiB0aGUgcGx1Z2luIGluc3RhbmNlIChub3QgdGhlIGNsYXNzKVxyXG4gICAqIEByZXR1cm4ge0xhcH0gICAgICAgICAgIHRoaXNcclxuICAgKi9cclxuICByZWdpc3RlclBsdWdpbihrZXksIHBsdWdpbikge1xyXG4gICAgdGhpcy5wbHVnaW5zW2tleV0gPSBwbHVnaW5cclxuICB9XHJcblxyXG4gIHVwZGF0ZVRyYWNrVGl0bGVFbCgpIHtcclxuICAgIHRoaXMuZWxzLnRyYWNrVGl0bGUuaHRtbCh0aGlzLnRyYWNrbGlzdFt0aGlzLnRyYWNrSW5kZXhdKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHVwZGF0ZVRyYWNrTnVtYmVyRWwoKSB7XHJcbiAgICB0aGlzLmVscy50cmFja051bWJlci5odG1sKCt0aGlzLnRyYWNrSW5kZXgrMSlcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICB1cGRhdGVBcnRpc3RFbCgpIHtcclxuICAgIHRoaXMuZWxzLmFydGlzdC5odG1sKHRoaXMuYXJ0aXN0KVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHVwZGF0ZUFsYnVtRWwoKSB7XHJcbiAgICB0aGlzLmVscy5hbGJ1bS5odG1sKHRoaXMuYWxidW0pXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlQ292ZXIoKSB7XHJcbiAgICB0aGlzLmVscy5jb3Zlci5nZXQoMCkuc3JjID0gdGhpcy5jb3ZlclxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHRvZ2dsZVBsYXkoKSB7XHJcbiAgICB0aGlzLmF1ZGlvLnBhdXNlZCA/IHRoaXMucGxheSgpIDogdGhpcy5wYXVzZSgpXHJcbiAgICB0aGlzLnRyaWdnZXIoJ3RvZ2dsZVBsYXknKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHBsYXkoKSB7XHJcbiAgICB0aGlzLmF1ZGlvLnBsYXkoKVxyXG4gICAgdGhpcy5wbGF5aW5nID0gdHJ1ZVxyXG4gICAgdGhpcy50cmlnZ2VyKCdwbGF5JylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBwYXVzZSgpIHtcclxuICAgIHRoaXMuYXVkaW8ucGF1c2UoKVxyXG4gICAgdGhpcy5wbGF5aW5nID0gZmFsc2VcclxuICAgIHRoaXMudHJpZ2dlcigncGF1c2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHNldFRyYWNrKGluZGV4KSB7XHJcbiAgICBpZiAoaW5kZXggPD0gMCkge1xyXG4gICAgICB0aGlzLnRyYWNrSW5kZXggPSAwXHJcbiAgICB9IGVsc2UgaWYgKGluZGV4ID49IHRoaXMudHJhY2tDb3VudCkge1xyXG4gICAgICB0aGlzLnRyYWNrSW5kZXggPSB0aGlzLnRyYWNrQ291bnQtMVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy50cmFja0luZGV4ID0gaW5kZXhcclxuICAgIH1cclxuICAgIGNvbnN0IHdhc1BsYXlpbmcgPSAhdGhpcy5hdWRpby5wYXVzZWRcclxuICAgIHRoaXMuc2V0U291cmNlKClcclxuICAgIGlmICh3YXNQbGF5aW5nKSB0aGlzLmF1ZGlvLnBsYXkoKVxyXG4gICAgdGhpcy50cmlnZ2VyKCd0cmFja0NoYW5nZScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgcHJldigpIHtcclxuICAgIGNvbnN0IHdhc1BsYXlpbmcgPSAhdGhpcy5hdWRpby5wYXVzZWRcclxuICAgIHRoaXMudHJhY2tJbmRleCA9ICh0aGlzLnRyYWNrSW5kZXgtMSA8IDApID8gdGhpcy50cmFja0NvdW50LTEgOiB0aGlzLnRyYWNrSW5kZXgtMVxyXG4gICAgdGhpcy5zZXRTb3VyY2UoKVxyXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXHJcbiAgICB0aGlzLnRyaWdnZXIoJ3RyYWNrQ2hhbmdlJylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBuZXh0KCkge1xyXG4gICAgY29uc3Qgd2FzUGxheWluZyA9ICF0aGlzLmF1ZGlvLnBhdXNlZFxyXG4gICAgdGhpcy50cmFja0luZGV4ID0gKHRoaXMudHJhY2tJbmRleCsxID49IHRoaXMudHJhY2tDb3VudCkgPyAwIDogdGhpcy50cmFja0luZGV4KzFcclxuICAgIHRoaXMuc2V0U291cmNlKClcclxuICAgIGlmICh3YXNQbGF5aW5nKSB0aGlzLmF1ZGlvLnBsYXkoKVxyXG4gICAgdGhpcy50cmlnZ2VyKCd0cmFja0NoYW5nZScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgcHJldkFsYnVtKCkge1xyXG4gICAgY29uc3Qgd2FzUGxheWluZyA9ICF0aGlzLmF1ZGlvLnBhdXNlZFxyXG4gICAgdGhpcy5hbGJ1bUluZGV4ID0gKHRoaXMuYWxidW1JbmRleC0xIDwgMCkgPyB0aGlzLmFsYnVtQ291bnQtMSA6IHRoaXMuYWxidW1JbmRleC0xXHJcbiAgICB0aGlzLnVwZGF0ZSgpXHJcbiAgICB0aGlzLnRyYWNrSW5kZXggPSAwXHJcbiAgICB0aGlzLnNldFNvdXJjZSgpXHJcbiAgICBpZiAod2FzUGxheWluZykgdGhpcy5hdWRpby5wbGF5KClcclxuICAgIHRoaXMudHJpZ2dlcignYWxidW1DaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgbmV4dEFsYnVtKCkge1xyXG4gICAgY29uc3Qgd2FzUGxheWluZz0gIXRoaXMuYXVkaW8ucGF1c2VkXHJcbiAgICB0aGlzLmFsYnVtSW5kZXggPSAodGhpcy5hbGJ1bUluZGV4KzEgPiB0aGlzLmFsYnVtQ291bnQtMSkgPyAwIDogdGhpcy5hbGJ1bUluZGV4KzFcclxuICAgIHRoaXMudXBkYXRlKClcclxuICAgIHRoaXMudHJhY2tJbmRleCA9IDBcclxuICAgIHRoaXMuc2V0U291cmNlKClcclxuICAgIGlmICh3YXNQbGF5aW5nKSB0aGlzLmF1ZGlvLnBsYXkoKVxyXG4gICAgdGhpcy50cmlnZ2VyKCdhbGJ1bUNoYW5nZScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuICBzZXRBbGJ1bShpbmRleCkge1xyXG4gICAgaWYgKGluZGV4IDw9IDApIHtcclxuICAgICAgdGhpcy5hbGJ1bUluZGV4ID0gMFxyXG4gICAgfSBlbHNlIGlmIChpbmRleCA+PSB0aGlzLmFsYnVtQ291bnQpIHtcclxuICAgICAgdGhpcy5hbGJ1bUluZGV4ID0gdGhpcy5hbGJ1bUNvdW50LTFcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuYWxidW1JbmRleCA9IGluZGV4XHJcbiAgICB9XHJcbiAgICB0aGlzLnVwZGF0ZSgpXHJcbiAgICB0aGlzLnNldFRyYWNrKHRoaXMubGliW3RoaXMuYWxidW1JbmRleF0uc3RhcnRpbmdUcmFja0luZGV4IHx8IDApXHJcbiAgICB0aGlzLnRyaWdnZXIoJ2FsYnVtQ2hhbmdlJylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBzZWVrQmFja3dhcmQoKSB7XHJcbiAgICBpZiAoIXRoaXMuc2Vla2luZykgcmV0dXJuIHRoaXNcclxuICAgIHRoaXMubW91c2VEb3duVGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGFwcGxpZWQgPSB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lICsgKHRoaXMuc2V0dGluZ3Muc2Vla0ludGVydmFsICogLTEpXHJcbiAgICAgIHRoaXMuYXVkaW8uY3VycmVudFRpbWUgPSBhcHBsaWVkIDw9IDAgPyAwIDogYXBwbGllZFxyXG4gICAgfSwgdGhpcy5zZXR0aW5ncy5zZWVrVGltZSlcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBzZWVrRm9yd2FyZCgpIHtcclxuICAgIGlmICghdGhpcy5zZWVraW5nKSByZXR1cm4gdGhpc1xyXG4gICAgdGhpcy5tb3VzZURvd25UaW1lciA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgY29uc3QgYXBwbGllZCA9IHRoaXMuYXVkaW8uY3VycmVudFRpbWUgKyB0aGlzLnNldHRpbmdzLnNlZWtJbnRlcnZhbFxyXG4gICAgICB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lID0gYXBwbGllZCA+PSB0aGlzLmF1ZGlvLmR1cmF0aW9uID8gdGhpcy5hdWRpby5kdXJhdGlvbiA6IGFwcGxpZWRcclxuICAgIH0sIHRoaXMuc2V0dGluZ3Muc2Vla1RpbWUpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgZm9ybWF0VHJhY2tsaXN0KCkge1xyXG4gICAgaWYgKHRoaXMudHJhY2tsaXN0ICYmIHRoaXMudHJhY2tsaXN0Lmxlbmd0aCkge1xyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmUgPSB0aGlzLnJlcGxhY2VtZW50XHJcbiAgICBjb25zdCB0cmFja2xpc3QgPSBbXVxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnRyYWNrQ291bnQ7IGkrKykge1xyXG4gICAgICBsZXQgdCA9IHRoaXMuZmlsZXNbaV1cclxuICAgICAgLy8gc3RyaXAgZXh0XHJcbiAgICAgIHQgPSB0LnNsaWNlKHQubGFzdEluZGV4T2YoJy4nKSsxKVxyXG4gICAgICAvLyBnZXQgbGFzdCBwYXRoIHNlZ21lbnRcclxuICAgICAgdCA9IHQuc2xpY2UodC5sYXN0SW5kZXhPZignLycpKzEpXHJcbiAgICAgIGlmIChyZSkgdCA9IHQucmVwbGFjZShyZVswXSwgcmVbMV0pXHJcbiAgICAgIHRyYWNrbGlzdFtpXSA9IHQudHJpbSgpXHJcbiAgICB9XHJcbiAgICB0aGlzLnRyYWNrbGlzdCA9IHRyYWNrbGlzdFxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIGJ1ZmZlckZvcm1hdHRlZCgpIHtcclxuICAgIGlmICghdGhpcy5hdWRpbykgcmV0dXJuIDBcclxuXHJcbiAgICBjb25zdCBhdWRpbyA9IHRoaXMuYXVkaW9cclxuICAgIGxldCBidWZmZXJlZFxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGJ1ZmZlcmVkID0gYXVkaW8uYnVmZmVyZWQuZW5kKGF1ZGlvLmJ1ZmZlcmVkLmxlbmd0aC0xKVxyXG4gICAgfSBjYXRjaChlKSB7XHJcbiAgICAgIHJldHVybiAwXHJcbiAgICB9XHJcbiAgICB2YXIgZm9ybWF0dGVkID0gTWF0aC5yb3VuZChfLnNjYWxlKGJ1ZmZlcmVkLCAwLCBhdWRpby5kdXJhdGlvbiwgMCwgMTAwKSlcclxuICAgIHJldHVybiBpc05hTihmb3JtYXR0ZWQpID8gMCA6IGZvcm1hdHRlZFxyXG4gIH1cclxuXHJcbiAgY3VycmVudFRpbWVGb3JtYXR0ZWQoKSB7XHJcbiAgICBpZiAoaXNOYU4odGhpcy5hdWRpby5kdXJhdGlvbikpIHtcclxuICAgICAgcmV0dXJuICcwMDowMCdcclxuICAgIH1cclxuICAgIHZhciBmb3JtYXR0ZWQgPSBfLmZvcm1hdFRpbWUoTWF0aC5mbG9vcih0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lLnRvRml4ZWQoMSkpKVxyXG4gICAgaWYgKHRoaXMuYXVkaW8uZHVyYXRpb24gPCAzNjAwIHx8IGZvcm1hdHRlZCA9PT0gJzAwOjAwOjAwJykge1xyXG4gICAgICByZXR1cm4gZm9ybWF0dGVkLnNsaWNlKDMpIC8vIG5uOm5uXHJcbiAgICB9XHJcbiAgICByZXR1cm4gZm9ybWF0dGVkXHJcbiAgfVxyXG5cclxuICBkdXJhdGlvbkZvcm1hdHRlZCgpIHtcclxuICAgIGlmIChpc05hTih0aGlzLmF1ZGlvLmR1cmF0aW9uKSkge1xyXG4gICAgICByZXR1cm4gJzAwOjAwJ1xyXG4gICAgfVxyXG4gICAgdmFyIGZvcm1hdHRlZCA9IF8uZm9ybWF0VGltZShNYXRoLmZsb29yKHRoaXMuYXVkaW8uZHVyYXRpb24udG9GaXhlZCgxKSkpXHJcbiAgICBpZiAodGhpcy5hdWRpby5kdXJhdGlvbiA8IDM2MDAgfHwgZm9ybWF0dGVkID09PSAnMDA6MDA6MDAnKSB7XHJcbiAgICAgIHJldHVybiBmb3JtYXR0ZWQuc2xpY2UoMykgLy8gbm46bm5cclxuICAgIH1cclxuICAgIHJldHVybiBmb3JtYXR0ZWRcclxuICB9XHJcblxyXG4gIHRyYWNrTnVtYmVyRm9ybWF0dGVkKG4pIHtcclxuICAgIHZhciBjb3VudCA9ICgnJyt0aGlzLnRyYWNrQ291bnQpLmxlbmd0aCAtICgnJytuKS5sZW5ndGhcclxuICAgIHJldHVybiBfLnJlcGVhdCgnMCcsIGNvdW50KSArIG4gKyB0aGlzLnNldHRpbmdzLnRyYWNrTnVtYmVyUG9zdGZpeFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIGdyYWIgYSBwcm9wZXJ0eSBmcm9tIHRoZSBjdXJyZW50bHkgY3VlZCBhbGJ1bS4gQVxyXG4gICAqIHNlY29uZCBhcmd1bWVudCBjYW4gYmUgcGFzc2VkIHRvIGNob29zZSBhIHNwZWNpZmljIGFsYnVtLlxyXG4gICAqIEBtZXRob2QgZ2V0XHJcbiAgICogQHBhcmFtICB7U3RyaW5nfSB3aGF0IHRoZSBwcm9wZXJ0eVxyXG4gICAqIEByZXR1cm4ge1t0eXBlXX0gICAgICBbZGVzY3JpcHRpb25dXHJcbiAgICovXHJcbiAgZ2V0KGtleSwgaW5kZXgpIHtcclxuICAgIHJldHVybiB0aGlzLmxpYltpbmRleCA9PT0gdW5kZWZpbmVkID8gdGhpcy5hbGJ1bUluZGV4IDogaW5kZXhdW2tleV1cclxuICB9XHJcblxyXG5cclxuICBkZXN0cm95KCkge1xyXG5cclxuICAgIC8vIHJlbW92ZSBkb20gZXZlbnQgaGFuZGxlcnNcclxuICAgIE9iamVjdC5rZXlzKHRoaXMubGlzdGVuZXJzKS5mb3JFYWNoKGVsZW1lbnROYW1lID0+IHtcclxuICAgICAgbGV0IGxpc3RlbmVyID0gdGhpcy5saXN0ZW5lcnNbZWxlbWVudE5hbWVdXHJcbiAgICAgIHRoaXMuZWxzW2VsZW1lbnROYW1lXS5yZW1vdmVFdmVudExpc3RlbmVyKGxpc3RlbmVyLmV2ZW50LCBsaXN0ZW5lci5mbilcclxuICAgICAgbGlzdGVuZXIgPSBudWxsXHJcbiAgICAgIGRlbGV0ZSB0aGlzLmxpc3RlbmVyc1tlbGVtZW50TmFtZV1cclxuICAgIH0pXHJcbiAgICBkZWxldGUgdGhpcy5saXN0ZW5lcnNcclxuXHJcbiAgICAvLyByZW1vdmUgYXVkaW8gaGFuZGxlcnNcclxuICAgIE9iamVjdC5rZXlzKHRoaXMuYXVkaW9MaXN0ZW5lcnMpLmZvckVhY2goZXZlbnQgPT4ge1xyXG4gICAgICB0aGlzLmF1ZGlvLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIHRoaXMuYXVkaW9MaXN0ZW5lcnNbZXZlbnRdKVxyXG4gICAgICBkZWxldGUgdGhpcy5hdWRpb0xpc3RlbmVyc1tldmVudF1cclxuICAgIH0pXHJcbiAgICBkZWxldGUgdGhpcy5hdWRpb0xpc3RlbmVyc1xyXG5cclxuICAgIC8vIHJlbW92ZSBhbGwgc3VwZXIgaGFuZGxlcnNcclxuICAgIHRoaXMucmVtb3ZlKClcclxuICB9XHJcbn1cclxuXHJcbkxhcC4kJGluc3RhbmNlcyA9IFtdXHJcblxyXG5MYXAuJCRhdWRpb0V4dGVuc2lvblJlZ0V4cCA9IC9tcDN8d2F2fG9nZ3xhaWZmL2lcclxuXHJcbkxhcC4kJGRlZmF1bHRTZXR0aW5ncyA9IHtcclxuICBjYWxsYmFja3M6IHt9LFxyXG4gIGRlYnVnOiBmYWxzZSxcclxuICBkaXNjb2dQbGF5bGlzdEV4Y2x1c2l2ZTogdHJ1ZSxcclxuICBwbHVnaW5zOiBbXSxcclxuICBwcmVwZW5kVHJhY2tOdW1iZXJzOiB0cnVlLFxyXG4gIHJlcGxhY2VtZW50OiBudWxsLFxyXG4gIHN0YXJ0aW5nQWxidW1JbmRleDogMCxcclxuICBzdGFydGluZ1RyYWNrSW5kZXg6IDAsXHJcbiAgc2Vla0ludGVydmFsOiA1LFxyXG4gIHNlZWtUaW1lOiAyNTAsXHJcbiAgc2VsZWN0b3JzOiB7fSwgLy8gc2VlICNpbml0RWxlbWVudHNcclxuICBzZWxlY3RvclByZWZpeDogJ2xhcCcsXHJcbiAgdHJhY2tOdW1iZXJQb3N0Zml4OiAnIC0gJyxcclxuICB1c2VOYXRpdmVQcm9ncmVzczogZmFsc2UsXHJcbiAgdXNlTmF0aXZlU2Vla1JhbmdlOiBmYWxzZSxcclxuICB1c2VOYXRpdmVWb2x1bWVSYW5nZTogZmFsc2UsXHJcbiAgdm9sdW1lSW50ZXJ2YWw6IDAuMDVcclxufVxyXG5cclxuTGFwLiQkZGVmYXVsdFNlbGVjdG9ycyA9IHtcclxuICBzdGF0ZToge1xyXG4gICAgcGxheWxpc3RJdGVtQ3VycmVudDogICdsYXBfX3BsYXlsaXN0X19pdGVtLS1jdXJyZW50JyxcclxuICAgIHBsYXlpbmc6ICAgICAgICAgICAgICAnbGFwLS1wbGF5aW5nJyxcclxuICAgIHBhdXNlZDogICAgICAgICAgICAgICAnbGFwLS1wYXVzZWQnLFxyXG4gICAgaGlkZGVuOiAgICAgICAgICAgICAgICdsYXAtLWhpZGRlbidcclxuICB9LFxyXG4gIGFsYnVtOiAgICAgICAgICAgICAgICdsYXBfX2FsYnVtJyxcclxuICBhcnRpc3Q6ICAgICAgICAgICAgICAnbGFwX19hcnRpc3QnLFxyXG4gIGJ1ZmZlcmVkOiAgICAgICAgICAgICdsYXBfX2J1ZmZlcmVkJyxcclxuICBjb3ZlcjogICAgICAgICAgICAgICAnbGFwX19jb3ZlcicsXHJcbiAgY3VycmVudFRpbWU6ICAgICAgICAgJ2xhcF9fY3VycmVudC10aW1lJyxcclxuICBkaXNjb2c6ICAgICAgICAgICAgICAnbGFwX19kaXNjb2cnLFxyXG4gIGRpc2NvZ0l0ZW06ICAgICAgICAgICdsYXBfX2Rpc2NvZ19faXRlbScsXHJcbiAgZGlzY29nUGFuZWw6ICAgICAgICAgJ2xhcF9fZGlzY29nX19wYW5lbCcsXHJcbiAgZHVyYXRpb246ICAgICAgICAgICAgJ2xhcF9fZHVyYXRpb24nLFxyXG4gIGluZm86ICAgICAgICAgICAgICAgICdsYXBfX2luZm8nLCAvLyBidXR0b25cclxuICBpbmZvUGFuZWw6ICAgICAgICAgICAnbGFwX19pbmZvLXBhbmVsJyxcclxuICBuZXh0OiAgICAgICAgICAgICAgICAnbGFwX19uZXh0JyxcclxuICBuZXh0QWxidW06ICAgICAgICAgICAnbGFwX19uZXh0LWFsYnVtJyxcclxuICBwbGF5UGF1c2U6ICAgICAgICAgICAnbGFwX19wbGF5LXBhdXNlJyxcclxuICBwbGF5bGlzdDogICAgICAgICAgICAnbGFwX19wbGF5bGlzdCcsIC8vIGJ1dHRvblxyXG4gIHBsYXlsaXN0SXRlbTogICAgICAgICdsYXBfX3BsYXlsaXN0X19pdGVtJywgLy8gbGlzdCBpdGVtXHJcbiAgcGxheWxpc3RQYW5lbDogICAgICAgJ2xhcF9fcGxheWxpc3RfX3BhbmVsJyxcclxuICBwbGF5bGlzdFRyYWNrTnVtYmVyOiAnbGFwX19wbGF5bGlzdF9fdHJhY2stbnVtYmVyJyxcclxuICBwbGF5bGlzdFRyYWNrVGl0bGU6ICAnbGFwX19wbGF5bGlzdF9fdHJhY2stdGl0bGUnLFxyXG4gIHByZXY6ICAgICAgICAgICAgICAgICdsYXBfX3ByZXYnLFxyXG4gIHByZXZBbGJ1bTogICAgICAgICAgICdsYXBfX3ByZXYtYWxidW0nLFxyXG4gIHByb2dyZXNzOiAgICAgICAgICAgICdsYXBfX3Byb2dyZXNzJyxcclxuICBzZWVrQmFja3dhcmQ6ICAgICAgICAnbGFwX19zZWVrLWJhY2t3YXJkJyxcclxuICBzZWVrRm9yd2FyZDogICAgICAgICAnbGFwX19zZWVrLWZvcndhcmQnLFxyXG4gIHNlZWtSYW5nZTogICAgICAgICAgICdsYXBfX3NlZWstcmFuZ2UnLFxyXG4gIHRyYWNrTnVtYmVyOiAgICAgICAgICdsYXBfX3RyYWNrLW51bWJlcicsIC8vIHRoZSBjdXJyZW50bHkgY3VlZCB0cmFja1xyXG4gIHRyYWNrVGl0bGU6ICAgICAgICAgICdsYXBfX3RyYWNrLXRpdGxlJyxcclxuICB2b2x1bWVCdXR0b246ICAgICAgICAnbGFwX192b2x1bWUtYnV0dG9uJyxcclxuICB2b2x1bWVEb3duOiAgICAgICAgICAnbGFwX192b2x1bWUtZG93bicsXHJcbiAgdm9sdW1lUmVhZDogICAgICAgICAgJ2xhcF9fdm9sdW1lLXJlYWQnLFxyXG4gIHZvbHVtZVJhbmdlOiAgICAgICAgICdsYXBfX3ZvbHVtZS1yYW5nZScsXHJcbiAgdm9sdW1lVXA6ICAgICAgICAgICAgJ2xhcF9fdm9sdW1lLXVwJ1xyXG59XHJcblxyXG5pZiAod2luZG93KSB3aW5kb3cuTGFwID0gTGFwXHJcbiJdfQ==
