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

    /*>>*/
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
    /*<<*/

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
        this.lib = [{ files: lib }];
      } else {
        throw new Error(lib + ' is not an array of album configs, ' + 'a single album config object, or an audio file.');
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
        /* for replacment without value specified, empty string */
        if (typeof re === 'string') re = [re, ''];
        /* re may contain string-wrapped regexp (from json), convert if so */
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
      return f.substr(f.lastIndexOf('.') + 1);
    }
  }, {
    key: 'initElements',
    value: function initElements() {
      var _this5 = this;

      this.els = {};
      this.selectors = {};
      Object.keys(Lap.$$defaultSelectors, function (key) {
        if (_this5.settings.selectors.hasOwnProperty[key]) {
          return _this5.selectors[key] = _this5.settings.selectors[key];
        }
        _this5.selectors[key] = Lap.$$defaultSelectors[key];
      });
      Object.keys(this.selectors, function (key) {
        if (_typeof(_this5.selectors[key]) === 'object') return;
        var el = _this5.element.querySelector('.' + _this5.selectors[key]);
        if (el) _this5.els[key] = el;
      });
    }
  }, {
    key: 'addAudioListeners',
    value: function addAudioListeners() {
      var _this6 = this;

      var audio = this.audio;
      var els = this.els;
      var nativeProgress = !!(this.settings.useNativeProgress && els.progress);

      if (els.buffered || this.settings.useNativeProgress && els.progress) {
        audio.addEventListener('progress', function () {
          // TODO: verify if this really needs to be type cast...
          var buffered = +_this6.bufferFormatted();
          if (els.buffered) els.buffered.html(buffered);
          if (nativeProgress) els.progress[0].value = buffered;
        });
      }
      if (els.currentTime) {
        audio.addEventListener('timeupdate', function () {
          els.currentTime.html(_this6.currentTimeFormatted());
        });
      }
      if (els.duration) {
        audio.addEventListener('durationchange', function () {
          els.duration.html(_this6.durationFormatted());
        });
      }
      if (!IS_MOBILE && els.volumeRead) {
        audio.addEventListener('volumechange', function () {
          els.volumeRead.html(_this6.volumeFormatted());
        });
      }
      audio.addEventListener('ended', function () {
        console.info('ended > this.audio.paused: %o', _this6.audio.paused);
        if (_this6.playing) {
          _this6.next();
          _this6.audio.play();
        }
      });

      return this;
    }
  }, {
    key: 'addListeners',
    value: function addListeners() {
      var _this7 = this;

      var els = this.els;

      if (els.playPause) els.playPause.on('click', function () {
        return _this7.togglePlay();
      });
      if (els.prev) els.prev.on('click', function () {
        return _this7.prev();
      });
      if (els.next) els.next.on('click', function () {
        return _this7.next();
      });
      if (!IS_MOBILE) {
        if (els.volumeUp) els.volumeUp.on('click', function () {
          return _this7.incVolume();
        });
        if (els.volumeDown) els.volumeDown.on('click', function () {
          return _this7.decVolume();
        });
      }
      if (els.prevAlbum) els.prevAlbum.on('click', function () {
        return _this7.prevAlbum();
      });
      if (els.nextAlbum) els.nextAlbum.on('click', function () {
        return _this7.nextAlbum();
      });
      if (els.discog) els.discog.on('click', function () {
        return _this7.trigger('discogClick');
      });
      if (els.playlist) els.playlist.on('click', function () {
        return _this7.trigger('playlistClick');
      });

      this.on('load', function () {
        if (els.trackTitle) _this7.updateTrackTitleEl();
        if (els.trackNumber) _this7.updateTrackNumberEl();
        if (els.artist) _this7.updateArtistEl();
        if (els.album) _this7.updateAlbumEl();
        if (els.cover) _this7.updateCover();
        if (els.playPause) {
          els.playPause.addClass(_this7.selectors.state.paused);
          _this7.on('play', function () {
            els.playPause.removeClass(_this7.selectors.state.paused).addClass(_this7.selectors.state.playing);
          }).on('pause', function () {
            els.playPause.removeClass(_this7.selectors.state.playing).addClass(_this7.selectors.state.paused);
          });
        }
      }).on('trackChange', function () {
        if (els.trackTitle) _this7.updateTrackTitleEl();
        if (els.trackNumber) _this7.updateTrackNumberEl();
        if (els.currentTime) els.currentTime.html(_this7.currentTimeFormatted());
        if (els.duration) els.duration.html(_this7.durationFormatted());
      }).on('albumChange', function () {
        if (els.trackTitle) _this7.updateTrackTitleEl();
        if (els.trackNumber) _this7.updateTrackNumberEl();
        if (els.artist) _this7.updateArtistEl();
        if (els.album) _this7.updateAlbumEl();
        if (els.cover) _this7.updateCover();
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
  }], [{
    key: 'getInstance',
    value: function getInstance(id) {
      return Lap.$$instances[id];
    }
  }]);

  return Lap;
})(Bus);

exports.default = Lap;

Lap.$$instances = [];

Lap.$$audioExtensionRegExp = /mp3|wav|ogg|aiff/i;

Lap.$$defaultSettings = {
  callbacks: {},
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGxhcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNBQSxJQUFNLFNBQVMsR0FBRyxLQUFLLENBQUE7O0lBRUYsR0FBRztZQUFILEdBQUc7O0FBRXRCLFdBRm1CLEdBQUcsQ0FFVixPQUFPLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBa0I7UUFBaEIsUUFBUSx5REFBQyxLQUFLOzswQkFGOUIsR0FBRzs7Ozt1RUFBSCxHQUFHOztBQU1wQixVQUFLLEVBQUUsR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDLEVBQUUsR0FBRyxPQUFPLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFBO0FBQ3JFLE9BQUcsQ0FBQyxXQUFXLENBQUMsTUFBSyxFQUFFLENBQUMsUUFBTyxDQUFBOztBQUUvQixVQUFLLE9BQU8sR0FBRyxPQUFPLE9BQU8sS0FBSyxRQUFRLEdBQ3RDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQy9CLE9BQU8sQ0FBQTs7QUFFWCxVQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTs7QUFFaEIsVUFBSyxRQUFRLEdBQUcsRUFBRSxDQUFBO0FBQ2xCLFFBQUksT0FBTyxFQUFFOztBQUVYLFlBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUEsR0FBRyxFQUFJO0FBQ2hELFlBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFRLE1BQUssUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzRSxjQUFLLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUE7T0FDaEQsQ0FBQyxDQUFBO0tBQ0gsTUFBTTtBQUNM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QUksTUFBTSxFQUFFLE1BQU0sQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IElTX01PQklMRSA9IGZhbHNlXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMYXAgZXh0ZW5kcyBCdXMge1xyXG5cclxuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBsaWIsIG9wdGlvbnMsIHBvc3Rwb25lPWZhbHNlKSB7XHJcbiAgICBzdXBlcigpXHJcblxyXG4gICAgLy8gZGVmYXVsdCBpZCB0byB6ZXJvLWJhc2VkIGluZGV4IGluY3JlbWVudGVyXHJcbiAgICB0aGlzLmlkID0gb3B0aW9ucyAmJiBvcHRpb25zLmlkID8gb3B0aW9ucy5pZCA6IExhcC4kJGluc3RhbmNlcy5sZW5ndGhcclxuICAgIExhcC4kJGluc3RhbmNlc1t0aGlzLmlkXSA9IHRoaXNcclxuXHJcbiAgICB0aGlzLmVsZW1lbnQgPSB0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZydcclxuICAgICAgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGVsZW1lbnQpXHJcbiAgICAgIDogZWxlbWVudFxyXG5cclxuICAgIHRoaXMuc2V0TGliKGxpYilcclxuXHJcbiAgICB0aGlzLnNldHRpbmdzID0ge31cclxuICAgIGlmIChvcHRpb25zKSB7XHJcbiAgICAgIC8vIG1lcmdlIG9wdGlvbnMgZGVmYXVsdHNcclxuICAgICAgT2JqZWN0LmtleXMoTGFwLiQkZGVmYXVsdFNldHRpbmdzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoa2V5KSkgcmV0dXJuICh0aGlzLnNldHRpbmdzW2tleV0gPSBvcHRpb25zW2tleV0pXHJcbiAgICAgICAgdGhpcy5zZXR0aW5nc1trZXldID0gTGFwLiQkZGVmYXVsdFNldHRpbmdzW2tleV1cclxuICAgICAgfSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBMYXAuJCRkZWZhdWx0U2V0dGluZ3NcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXBvc3Rwb25lKSB0aGlzLmluaXRpYWxpemUoKVxyXG5cclxuICAgIC8qPj4qL1xyXG4gICAgY29uc3QgZWNobyA9IGUgPT4ge1xyXG4gICAgICB0aGlzLm9uKGUsICgpID0+IGNvbnNvbGUuaW5mbygnJWMlcyBoYW5kbGVyIGNhbGxlZCcsICdjb2xvcjojODAwMDgwJywgZSkpXHJcbiAgICB9XHJcbiAgICBlY2hvKCdsb2FkJylcclxuICAgIGVjaG8oJ3BsYXknKVxyXG4gICAgZWNobygncGF1c2UnKVxyXG4gICAgZWNobygnc2VlaycpXHJcbiAgICBlY2hvKCd0cmFja0NoYW5nZScpXHJcbiAgICBlY2hvKCdhbGJ1bUNoYW5nZScpXHJcbiAgICBlY2hvKCd2b2x1bWVDaGFuZ2UnKVxyXG4gICAgLyo8PCovXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHN0YXRpYyBnZXRJbnN0YW5jZShpZCkge1xyXG4gICAgcmV0dXJuIExhcC4kJGluc3RhbmNlc1tpZF1cclxuICB9XHJcblxyXG4gIHNldExpYihsaWIpIHtcclxuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgbGliXHJcbiAgICBjb25zdCBpc0FycmF5ID0gbGliIGluc3RhbmNlb2YgQXJyYXlcclxuICAgIGlmIChpc0FycmF5KSB7XHJcbiAgICAgIHRoaXMubGliID0gbGliXHJcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgIHRoaXMubGliID0gW2xpYl1cclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycgJiYgTGFwLiQkYXVkaW9FeHRlbnNpb25SZWdFeHAudGVzdChsaWIpKSB7XHJcbiAgICAgIHRoaXMubGliID0gW3sgZmlsZXM6IGxpYiB9XVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2xpYn0gaXMgbm90IGFuIGFycmF5IG9mIGFsYnVtIGNvbmZpZ3MsIGAgK1xyXG4gICAgICAgIGBhIHNpbmdsZSBhbGJ1bSBjb25maWcgb2JqZWN0LCBvciBhbiBhdWRpbyBmaWxlLmApXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgaW5pdGlhbGl6ZSgpIHtcclxuXHJcbiAgICAvLyBzdGF0ZVxyXG4gICAgdGhpcy5zZWVraW5nID0gZmFsc2VcclxuICAgIHRoaXMudm9sdW1lQ2hhbmdpbmcgPSBmYWxzZVxyXG4gICAgdGhpcy5tb3VzZURvd25UaW1lciA9IDBcclxuICAgIHRoaXMucGxheWluZyA9IGZhbHNlXHJcblxyXG4gICAgdGhpcy5wbHVnaW5zID0gdGhpcy5zZXR0aW5ncy5wbHVnaW5zXHJcblxyXG4gICAgdGhpcy5hbGJ1bUluZGV4ID0gdGhpcy5zZXR0aW5ncy5zdGFydGluZ0FsYnVtSW5kZXggfHwgMFxyXG4gICAgdGhpcy5hbGJ1bUNvdW50ID0gdGhpcy5saWIubGVuZ3RoXHJcblxyXG4gICAgdGhpcy51cGRhdGUoKVxyXG4gICAgdGhpcy5pbml0QXVkaW8oKVxyXG4gICAgdGhpcy5pbml0RWxlbWVudHMoKVxyXG4gICAgdGhpcy5hZGRBdWRpb0xpc3RlbmVycygpXHJcbiAgICBpZiAoIUlTX01PQklMRSkgdGhpcy5hZGRWb2x1bWVMaXN0ZW5lcnMoKVxyXG4gICAgdGhpcy5hZGRTZWVrTGlzdGVuZXJzKClcclxuICAgIHRoaXMuYWRkTGlzdGVuZXJzKClcclxuICAgIE9iamVjdC5rZXlzKHRoaXMuc2V0dGluZ3MuY2FsbGJhY2tzLCBrZXkgPT4gdGhpcy5vbihrZXksIHRoaXMuc2V0dGluZ3MuY2FsbGJhY2tzW2tleV0pKVxyXG4gICAgdGhpcy5hY3RpdmF0ZVBsdWdpbnMoKVxyXG4gICAgdGhpcy50cmlnZ2VyKCdsb2FkJylcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluc3RhbnRpYXRlIGV2ZXJ5IHBsdWdpbidzIGNvbnRydWN0b3Igd2l0aCB0aGlzIExhcCBpbnN0YW5jZVxyXG4gICAqXHJcbiAgICogQHJldHVybiB7TGFwfSB0aGlzXHJcbiAgICovXHJcbiAgYWN0aXZhdGVQbHVnaW5zKCkge1xyXG4gICAgdGhpcy5wbHVnaW5zLmZvckVhY2goKHBsdWdpbiwgaSkgPT4gdGhpcy5wbHVnaW5zW2ldID0gbmV3IHBsdWdpbih0aGlzKSlcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25maWd1cmVzIGluc3RhbmNlIHZhcmlhYmxlcyByZWxhdGl2ZSB0byB0aGUgY3VycmVudCBhbGJ1bS5cclxuICAgKiBDYWxsZWQgb24gaW5pdGlhbGl6YXRpb24gYW5kIHdoZW5ldmVyIGFuIGFsYnVtIGlzIGNoYW5nZWQuXHJcbiAgICpcclxuICAgKiBAcmV0dXJuIHtMYXB9IHRoaXNcclxuICAgKi9cclxuICB1cGRhdGUoKSB7XHJcbiAgICB0aGlzLnRyYWNrSW5kZXggPSB0aGlzLnNldHRpbmdzLnN0YXJ0aW5nVHJhY2tJbmRleFxyXG4gICAgdGhpcy5wbGF5bGlzdFBvcHVsYXRlZCA9IGZhbHNlXHJcblxyXG4gICAgY29uc3QgY3VycmVudExpYkl0ZW0gPSB0aGlzLmxpYlt0aGlzLmFsYnVtSW5kZXhdXHJcblxyXG4gICAgY29uc3Qga2V5cyA9IFsnYXJ0aXN0JywgJ2FsYnVtJywgJ2ZpbGVzJywgJ2NvdmVyJywgJ3RyYWNrbGlzdCcsICdyZXBsYWNlbWVudCddXHJcbiAgICBrZXlzLmZvckVhY2goa2V5ID0+IHRoaXNba2V5XSA9IGN1cnJlbnRMaWJJdGVtW2tleV0pXHJcblxyXG4gICAgdGhpcy50cmFja0NvdW50ID0gdGhpcy5maWxlcy5sZW5ndGhcclxuXHJcbiAgICAvLyByZXBsYWNlbWVudCA9PT0gW3JlZ2V4cCwgcmVwbGFjZW1lbnQsIG9wdGlvbmFsX2ZsYWdzXVxyXG4gICAgaWYgKHRoaXMucmVwbGFjZW1lbnQpIHtcclxuICAgICAgbGV0IHJlID0gdGhpcy5yZXBsYWNlbWVudFxyXG4gICAgICAvKiBmb3IgcmVwbGFjbWVudCB3aXRob3V0IHZhbHVlIHNwZWNpZmllZCwgZW1wdHkgc3RyaW5nICovXHJcbiAgICAgIGlmICh0eXBlb2YgcmUgPT09ICdzdHJpbmcnKSByZSA9IFtyZSwgJyddXHJcbiAgICAgIC8qIHJlIG1heSBjb250YWluIHN0cmluZy13cmFwcGVkIHJlZ2V4cCAoZnJvbSBqc29uKSwgY29udmVydCBpZiBzbyAqL1xyXG4gICAgICBpZiAocmUgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgIGNvbnN0IGZsYWdzID0gcmVbMl1cclxuICAgICAgICByZVswXSA9IG5ldyBSZWdFeHAocmVbMF0sIGZsYWdzICE9PSB1bmRlZmluZWQgPyBmbGFncyA6ICdnJylcclxuICAgICAgfVxyXG4gICAgICB0aGlzLnJlcGxhY2VtZW50ID0gcmVcclxuICAgIH1cclxuICAgIHRoaXMuZm9ybWF0VHJhY2tsaXN0KClcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBpbml0QXVkaW8oKSB7XHJcbiAgICB0aGlzLmF1ZGlvID0gbmV3IEF1ZGlvKClcclxuICAgIHRoaXMuYXVkaW8ucHJlbG9hZCA9ICdhdXRvJ1xyXG4gICAgY29uc3QgZmlsZVR5cGUgPSB0aGlzLmdldEZpbGVUeXBlKClcclxuICAgIGNvbnN0IGNhblBsYXkgPSB0aGlzLmF1ZGlvLmNhblBsYXlUeXBlKCdhdWRpby8nICsgZmlsZVR5cGUpXHJcbiAgICBpZiAoY2FuUGxheSA9PT0gJ3Byb2JhYmx5JyB8fCBjYW5QbGF5ID09PSAnbWF5YmUnKSB7XHJcbiAgICAgIHRoaXMuc2V0U291cmNlKClcclxuICAgICAgdGhpcy5hdWRpby52b2x1bWUgPSAxXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBUT0RPOiByZXR1cm4gYSBmbGFnIHRvIHNpZ25hbCBza2lwcGluZyB0aGUgcmVzdCBvZiB0aGUgaW5pdGlhbGl6YXRpb24gcHJvY2Vzc1xyXG4gICAgICBjb25zb2xlLndhcm4oYFRoaXMgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0ICR7ZmlsZVR5cGV9IHBsYXliYWNrLmApXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZXRTb3VyY2UoKSB7XHJcbiAgICB0aGlzLmF1ZGlvLnNyYyA9IHRoaXMuZmlsZXNbdGhpcy50cmFja0luZGV4XVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIGdldEZpbGVUeXBlKCkge1xyXG4gICAgY29uc3QgZiA9IHRoaXMuZmlsZXNbdGhpcy50cmFja0luZGV4XVxyXG4gICAgcmV0dXJuIGYuc3Vic3RyKGYubGFzdEluZGV4T2YoJy4nKSsxKVxyXG4gIH1cclxuXHJcbiAgaW5pdEVsZW1lbnRzKCkge1xyXG4gICAgdGhpcy5lbHMgPSB7fVxyXG4gICAgdGhpcy5zZWxlY3RvcnMgPSB7fVxyXG4gICAgT2JqZWN0LmtleXMoTGFwLiQkZGVmYXVsdFNlbGVjdG9ycywga2V5ID0+IHtcclxuICAgICAgaWYgKHRoaXMuc2V0dGluZ3Muc2VsZWN0b3JzLmhhc093blByb3BlcnR5W2tleV0pIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMuc2VsZWN0b3JzW2tleV0gPSB0aGlzLnNldHRpbmdzLnNlbGVjdG9yc1trZXldKVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuc2VsZWN0b3JzW2tleV0gPSBMYXAuJCRkZWZhdWx0U2VsZWN0b3JzW2tleV1cclxuICAgIH0pXHJcbiAgICBPYmplY3Qua2V5cyh0aGlzLnNlbGVjdG9ycywga2V5ID0+IHtcclxuICAgICAgaWYgKHR5cGVvZiB0aGlzLnNlbGVjdG9yc1trZXldID09PSAnb2JqZWN0JykgcmV0dXJuXHJcbiAgICAgIGNvbnN0IGVsID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3RoaXMuc2VsZWN0b3JzW2tleV19YClcclxuICAgICAgaWYgKGVsKSB0aGlzLmVsc1trZXldID0gZWxcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICBhZGRBdWRpb0xpc3RlbmVycygpIHtcclxuICAgIGNvbnN0IGF1ZGlvID0gdGhpcy5hdWRpb1xyXG4gICAgY29uc3QgZWxzID0gdGhpcy5lbHNcclxuICAgIGNvbnN0IG5hdGl2ZVByb2dyZXNzID0gISEodGhpcy5zZXR0aW5ncy51c2VOYXRpdmVQcm9ncmVzcyAmJiBlbHMucHJvZ3Jlc3MpXHJcblxyXG4gICAgaWYgKGVscy5idWZmZXJlZCB8fCAodGhpcy5zZXR0aW5ncy51c2VOYXRpdmVQcm9ncmVzcyAmJiBlbHMucHJvZ3Jlc3MpKSB7XHJcbiAgICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoJ3Byb2dyZXNzJywgKCkgPT4ge1xyXG4gICAgICAgIC8vIFRPRE86IHZlcmlmeSBpZiB0aGlzIHJlYWxseSBuZWVkcyB0byBiZSB0eXBlIGNhc3QuLi5cclxuICAgICAgICB2YXIgYnVmZmVyZWQgPSArdGhpcy5idWZmZXJGb3JtYXR0ZWQoKVxyXG4gICAgICAgIGlmIChlbHMuYnVmZmVyZWQpIGVscy5idWZmZXJlZC5odG1sKGJ1ZmZlcmVkKVxyXG4gICAgICAgIGlmIChuYXRpdmVQcm9ncmVzcykgZWxzLnByb2dyZXNzWzBdLnZhbHVlID0gYnVmZmVyZWRcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIGlmIChlbHMuY3VycmVudFRpbWUpIHtcclxuICAgICAgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcigndGltZXVwZGF0ZScsICgpID0+IHtcclxuICAgICAgICBlbHMuY3VycmVudFRpbWUuaHRtbCh0aGlzLmN1cnJlbnRUaW1lRm9ybWF0dGVkKCkpXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBpZiAoZWxzLmR1cmF0aW9uKSB7XHJcbiAgICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoJ2R1cmF0aW9uY2hhbmdlJywgKCkgPT4ge1xyXG4gICAgICAgIGVscy5kdXJhdGlvbi5odG1sKHRoaXMuZHVyYXRpb25Gb3JtYXR0ZWQoKSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIGlmICghSVNfTU9CSUxFICYmIGVscy52b2x1bWVSZWFkKSB7XHJcbiAgICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoJ3ZvbHVtZWNoYW5nZScsICgpID0+IHtcclxuICAgICAgICBlbHMudm9sdW1lUmVhZC5odG1sKHRoaXMudm9sdW1lRm9ybWF0dGVkKCkpXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBhdWRpby5hZGRFdmVudExpc3RlbmVyKCdlbmRlZCcsICgpID0+IHtcclxuICAgICAgY29uc29sZS5pbmZvKCdlbmRlZCA+IHRoaXMuYXVkaW8ucGF1c2VkOiAlbycsIHRoaXMuYXVkaW8ucGF1c2VkKVxyXG4gICAgICBpZiAodGhpcy5wbGF5aW5nKSB7XHJcbiAgICAgICAgdGhpcy5uZXh0KClcclxuICAgICAgICB0aGlzLmF1ZGlvLnBsYXkoKVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBhZGRMaXN0ZW5lcnMoKSB7XHJcbiAgICBjb25zdCBlbHMgPSB0aGlzLmVsc1xyXG5cclxuICAgIGlmIChlbHMucGxheVBhdXNlKSBlbHMucGxheVBhdXNlLm9uKCdjbGljaycsICgpID0+IHRoaXMudG9nZ2xlUGxheSgpKVxyXG4gICAgaWYgKGVscy5wcmV2KSBlbHMucHJldi5vbignY2xpY2snLCAoKSA9PiB0aGlzLnByZXYoKSlcclxuICAgIGlmIChlbHMubmV4dCkgZWxzLm5leHQub24oJ2NsaWNrJywgKCkgPT4gdGhpcy5uZXh0KCkpXHJcbiAgICBpZiAoIUlTX01PQklMRSkge1xyXG4gICAgICBpZiAoZWxzLnZvbHVtZVVwKSBlbHMudm9sdW1lVXAub24oJ2NsaWNrJywgKCkgPT4gdGhpcy5pbmNWb2x1bWUoKSlcclxuICAgICAgaWYgKGVscy52b2x1bWVEb3duKSBlbHMudm9sdW1lRG93bi5vbignY2xpY2snLCAoKSA9PiB0aGlzLmRlY1ZvbHVtZSgpKVxyXG4gICAgfVxyXG4gICAgaWYgKGVscy5wcmV2QWxidW0pIGVscy5wcmV2QWxidW0ub24oJ2NsaWNrJywgKCkgPT4gdGhpcy5wcmV2QWxidW0oKSlcclxuICAgIGlmIChlbHMubmV4dEFsYnVtKSBlbHMubmV4dEFsYnVtLm9uKCdjbGljaycsICgpID0+IHRoaXMubmV4dEFsYnVtKCkpXHJcbiAgICBpZiAoZWxzLmRpc2NvZykgZWxzLmRpc2NvZy5vbignY2xpY2snLCAoKSA9PiB0aGlzLnRyaWdnZXIoJ2Rpc2NvZ0NsaWNrJykpXHJcbiAgICBpZiAoZWxzLnBsYXlsaXN0KSBlbHMucGxheWxpc3Qub24oJ2NsaWNrJywgKCkgPT4gdGhpcy50cmlnZ2VyKCdwbGF5bGlzdENsaWNrJykpXHJcblxyXG4gICAgdGhpc1xyXG4gICAgICAub24oJ2xvYWQnLCAoKSA9PiB7XHJcbiAgICAgICAgaWYgKGVscy50cmFja1RpdGxlKSB0aGlzLnVwZGF0ZVRyYWNrVGl0bGVFbCgpXHJcbiAgICAgICAgaWYgKGVscy50cmFja051bWJlcikgdGhpcy51cGRhdGVUcmFja051bWJlckVsKClcclxuICAgICAgICBpZiAoZWxzLmFydGlzdCkgdGhpcy51cGRhdGVBcnRpc3RFbCgpXHJcbiAgICAgICAgaWYgKGVscy5hbGJ1bSkgdGhpcy51cGRhdGVBbGJ1bUVsKClcclxuICAgICAgICBpZiAoZWxzLmNvdmVyKSB0aGlzLnVwZGF0ZUNvdmVyKClcclxuICAgICAgICBpZiAoZWxzLnBsYXlQYXVzZSkge1xyXG4gICAgICAgICAgZWxzLnBsYXlQYXVzZS5hZGRDbGFzcyh0aGlzLnNlbGVjdG9ycy5zdGF0ZS5wYXVzZWQpXHJcbiAgICAgICAgICB0aGlzXHJcbiAgICAgICAgICAgIC5vbigncGxheScsICgpID0+IHtcclxuICAgICAgICAgICAgICBlbHMucGxheVBhdXNlXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3ModGhpcy5zZWxlY3RvcnMuc3RhdGUucGF1c2VkKVxyXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKHRoaXMuc2VsZWN0b3JzLnN0YXRlLnBsYXlpbmcpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbigncGF1c2UnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgZWxzLnBsYXlQYXVzZVxyXG4gICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKHRoaXMuc2VsZWN0b3JzLnN0YXRlLnBsYXlpbmcpXHJcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3ModGhpcy5zZWxlY3RvcnMuc3RhdGUucGF1c2VkKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgLm9uKCd0cmFja0NoYW5nZScsICgpID0+IHtcclxuICAgICAgICBpZiAoZWxzLnRyYWNrVGl0bGUpIHRoaXMudXBkYXRlVHJhY2tUaXRsZUVsKClcclxuICAgICAgICBpZiAoZWxzLnRyYWNrTnVtYmVyKSB0aGlzLnVwZGF0ZVRyYWNrTnVtYmVyRWwoKVxyXG4gICAgICAgIGlmIChlbHMuY3VycmVudFRpbWUpIGVscy5jdXJyZW50VGltZS5odG1sKHRoaXMuY3VycmVudFRpbWVGb3JtYXR0ZWQoKSlcclxuICAgICAgICBpZiAoZWxzLmR1cmF0aW9uKSBlbHMuZHVyYXRpb24uaHRtbCh0aGlzLmR1cmF0aW9uRm9ybWF0dGVkKCkpXHJcbiAgICAgIH0pXHJcbiAgICAgIC5vbignYWxidW1DaGFuZ2UnLCAoKSA9PiB7XHJcbiAgICAgICAgaWYgKGVscy50cmFja1RpdGxlKSB0aGlzLnVwZGF0ZVRyYWNrVGl0bGVFbCgpXHJcbiAgICAgICAgaWYgKGVscy50cmFja051bWJlcikgdGhpcy51cGRhdGVUcmFja051bWJlckVsKClcclxuICAgICAgICBpZiAoZWxzLmFydGlzdCkgdGhpcy51cGRhdGVBcnRpc3RFbCgpXHJcbiAgICAgICAgaWYgKGVscy5hbGJ1bSkgdGhpcy51cGRhdGVBbGJ1bUVsKClcclxuICAgICAgICBpZiAoZWxzLmNvdmVyKSB0aGlzLnVwZGF0ZUNvdmVyKClcclxuICAgICAgfSlcclxuICB9XHJcblxyXG4gIGFkZFNlZWtMaXN0ZW5lcnMoKSB7XHJcbiAgICBjb25zdCBlbHMgPSB0aGlzLmVsc1xyXG4gICAgY29uc3QgYXVkaW8gPSB0aGlzLmF1ZGlvXHJcbiAgICBjb25zdCBzZWVrUmFuZ2UgPSBlbHMuc2Vla1JhbmdlXHJcbiAgICBjb25zdCBuYXRpdmVTZWVrID0gdGhpcy5zZXR0aW5ncy51c2VOYXRpdmVTZWVrUmFuZ2UgJiYgc2Vla1JhbmdlICYmIHNlZWtSYW5nZS5lbHMubGVuZ3RoXHJcblxyXG4gICAgaWYgKG5hdGl2ZVNlZWspIHtcclxuICAgICAgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcigndGltZXVwZGF0ZScsIGUgPT4ge1xyXG4gICAgICAgIGlmICghdGhpcy5zZWVraW5nKSB7XHJcbiAgICAgICAgICBzZWVrUmFuZ2UuZ2V0KDApLnZhbHVlID0gXy5zY2FsZShhdWRpby5jdXJyZW50VGltZSwgMCwgYXVkaW8uZHVyYXRpb24sIDAsIDEwMClcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIHNlZWtSYW5nZVxyXG4gICAgICAgIC5vbignbW91c2Vkb3duJywgZSA9PiB7XHJcbiAgICAgICAgICB0aGlzLnNlZWtpbmcgPSB0cnVlXHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ21vdXNldXAnLCBlID0+IHtcclxuICAgICAgICAgIHZhciBlbCA9IHNlZWtSYW5nZS5nZXQoMClcclxuICAgICAgICAgIGlmICghZWwudmFsdWUpIHRoaXMubG9nZ2VyLmRlYnVnKCd3aGF0IHRoZSBmdWNrISAnICsgZWwpXHJcbiAgICAgICAgICBhdWRpby5jdXJyZW50VGltZSA9IF8uc2NhbGUoZWwudmFsdWUsIDAsIGVsLm1heCwgMCwgYXVkaW8uZHVyYXRpb24pXHJcbiAgICAgICAgICB0aGlzLnRyaWdnZXIoJ3NlZWsnKVxyXG4gICAgICAgICAgdGhpcy5zZWVraW5nID0gZmFsc2VcclxuICAgICAgICB9KVxyXG5cclxuICAgIH0gZWxzZSB7IC8vIHVzaW5nIGJ1dHRvbnNcclxuICAgICAgW2Vscy5zZWVrRm9yd2FyZCwgZWxzLnNlZWtCYWNrd2FyZF0uZm9yRWFjaChlbCA9PiB7XHJcbiAgICAgICAgaWYgKCFlbCkgcmV0dXJuXHJcbiAgICAgICAgZWxcclxuICAgICAgICAgIC5vbignbW91c2Vkb3duJywgZSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Vla2luZyA9IHRydWVcclxuICAgICAgICAgICAgaWYgKCQoZS50YXJnZXQpLmhhc0NsYXNzKHRoaXMuc2VsZWN0b3JzLnNlZWtGb3J3YXJkKSkge1xyXG4gICAgICAgICAgICAgIHRoaXMuc2Vla0ZvcndhcmQoKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMuc2Vla0JhY2t3YXJkKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIC5vbignbW91c2V1cCcsIGUgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnNlZWtpbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5tb3VzZURvd25UaW1lcilcclxuICAgICAgICAgIH0pXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhZGRWb2x1bWVMaXN0ZW5lcnMoKSB7XHJcbiAgICBpZiAoSVNfTU9CSUxFKSByZXR1cm4gdGhpc1xyXG5cclxuICAgIGNvbnN0IGxhcCA9IHRoaXNcclxuICAgIGNvbnN0IGVscyA9IHRoaXMuZWxzXHJcbiAgICBjb25zdCBhdWRpbyA9IHRoaXMuYXVkaW9cclxuICAgIGNvbnN0IHZzbGlkZXIgPSBlbHMudm9sdW1lUmFuZ2VcclxuXHJcbiAgICBpZiAodGhpcy5zZXR0aW5ncy51c2VOYXRpdmVWb2x1bWVSYW5nZSAmJiB2c2xpZGVyICYmIHZzbGlkZXIuZWxzLmxlbmd0aCkge1xyXG4gICAgICBhdWRpby5hZGRFdmVudExpc3RlbmVyKCd2b2x1bWVjaGFuZ2UnLCAoKSA9PiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnZvbHVtZUNoYW5naW5nKSB7XHJcbiAgICAgICAgICB2c2xpZGVyLmdldCgwKS52YWx1ZSA9IHRoaXMudm9sdW1lRm9ybWF0dGVkKClcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIHZzbGlkZXJcclxuICAgICAgICAub24oJ21vdXNlZG93bicsICgpID0+IHtcclxuICAgICAgICAgIHRoaXMudm9sdW1lQ2hhbmdpbmcgPSB0cnVlXHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ21vdXNldXAnLCAoKSA9PiB7XHJcbiAgICAgICAgICBhdWRpby52b2x1bWUgPSB2c2xpZGVyLmdldCgwKS52YWx1ZSAqIDAuMDFcclxuICAgICAgICAgIHRoaXMudHJpZ2dlcigndm9sdW1lQ2hhbmdlJylcclxuICAgICAgICAgIHRoaXMudm9sdW1lQ2hhbmdpbmcgPSBmYWxzZVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpbmNWb2x1bWUoKSB7XHJcbiAgICBpZiAoSVNfTU9CSUxFKSByZXR1cm4gdGhpc1xyXG5cclxuICAgIHRoaXMuc2V0Vm9sdW1lKHRydWUpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgZGVjVm9sdW1lKCkge1xyXG4gICAgaWYgKElTX01PQklMRSkgcmV0dXJuIHRoaXNcclxuXHJcbiAgICB0aGlzLnNldFZvbHVtZShmYWxzZSlcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBzZXRWb2x1bWUodXApIHtcclxuICAgIGlmIChJU19NT0JJTEUpIHJldHVybiB0aGlzXHJcblxyXG4gICAgdmFyIHZvbCA9IHRoaXMuYXVkaW8udm9sdW1lLFxyXG4gICAgICAgIGludGVydmFsID0gdGhpcy5zZXR0aW5ncy52b2x1bWVJbnRlcnZhbFxyXG4gICAgaWYgKHVwKSB7XHJcbiAgICAgIHRoaXMuYXVkaW8udm9sdW1lID0gKHZvbCArIGludGVydmFsID49IDEpID8gMSA6IHZvbCArIGludGVydmFsXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmF1ZGlvLnZvbHVtZSA9ICh2b2wgLSBpbnRlcnZhbCA8PSAwKSA/IDAgOiB2b2wgLSBpbnRlcnZhbFxyXG4gICAgfVxyXG4gICAgdGhpcy50cmlnZ2VyKCd2b2x1bWVDaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHZvbHVtZUZvcm1hdHRlZCgpIHtcclxuICAgIHJldHVybiBNYXRoLnJvdW5kKHRoaXMuYXVkaW8udm9sdW1lICogMTAwKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkIGEgcGx1Zy1pbiBpbnN0YW5jZSB0byB0aGUgcGx1Z2lucyBoYXNoXHJcbiAgICogQHBhcmFtICB7U3RyaW5nfSBrZXkgICAgdGhlIHBsdWdpbiBpbnN0YW5jZSBpZGVudGlmaWVyXHJcbiAgICogQHBhcmFtICB7T2JqZWN0fSBwbHVnaW4gdGhlIHBsdWdpbiBpbnN0YW5jZSAobm90IHRoZSBjbGFzcylcclxuICAgKiBAcmV0dXJuIHtMYXB9ICAgICAgICAgICB0aGlzXHJcbiAgICovXHJcbiAgcmVnaXN0ZXJQbHVnaW4oa2V5LCBwbHVnaW4pIHtcclxuICAgIHRoaXMucGx1Z2luc1trZXldID0gcGx1Z2luXHJcbiAgfVxyXG5cclxuICB1cGRhdGVUcmFja1RpdGxlRWwoKSB7XHJcbiAgICB0aGlzLmVscy50cmFja1RpdGxlLmh0bWwodGhpcy50cmFja2xpc3RbdGhpcy50cmFja0luZGV4XSlcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICB1cGRhdGVUcmFja051bWJlckVsKCkge1xyXG4gICAgdGhpcy5lbHMudHJhY2tOdW1iZXIuaHRtbCgrdGhpcy50cmFja0luZGV4KzEpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlQXJ0aXN0RWwoKSB7XHJcbiAgICB0aGlzLmVscy5hcnRpc3QuaHRtbCh0aGlzLmFydGlzdClcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICB1cGRhdGVBbGJ1bUVsKCkge1xyXG4gICAgdGhpcy5lbHMuYWxidW0uaHRtbCh0aGlzLmFsYnVtKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHVwZGF0ZUNvdmVyKCkge1xyXG4gICAgdGhpcy5lbHMuY292ZXIuZ2V0KDApLnNyYyA9IHRoaXMuY292ZXJcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICB0b2dnbGVQbGF5KCkge1xyXG4gICAgdGhpcy5hdWRpby5wYXVzZWQgPyB0aGlzLnBsYXkoKSA6IHRoaXMucGF1c2UoKVxyXG4gICAgdGhpcy50cmlnZ2VyKCd0b2dnbGVQbGF5JylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBwbGF5KCkge1xyXG4gICAgdGhpcy5hdWRpby5wbGF5KClcclxuICAgIHRoaXMucGxheWluZyA9IHRydWVcclxuICAgIHRoaXMudHJpZ2dlcigncGxheScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgcGF1c2UoKSB7XHJcbiAgICB0aGlzLmF1ZGlvLnBhdXNlKClcclxuICAgIHRoaXMucGxheWluZyA9IGZhbHNlXHJcbiAgICB0aGlzLnRyaWdnZXIoJ3BhdXNlJylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBzZXRUcmFjayhpbmRleCkge1xyXG4gICAgaWYgKGluZGV4IDw9IDApIHtcclxuICAgICAgdGhpcy50cmFja0luZGV4ID0gMFxyXG4gICAgfSBlbHNlIGlmIChpbmRleCA+PSB0aGlzLnRyYWNrQ291bnQpIHtcclxuICAgICAgdGhpcy50cmFja0luZGV4ID0gdGhpcy50cmFja0NvdW50LTFcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMudHJhY2tJbmRleCA9IGluZGV4XHJcbiAgICB9XHJcbiAgICBjb25zdCB3YXNQbGF5aW5nID0gIXRoaXMuYXVkaW8ucGF1c2VkXHJcbiAgICB0aGlzLnNldFNvdXJjZSgpXHJcbiAgICBpZiAod2FzUGxheWluZykgdGhpcy5hdWRpby5wbGF5KClcclxuICAgIHRoaXMudHJpZ2dlcigndHJhY2tDaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHByZXYoKSB7XHJcbiAgICBjb25zdCB3YXNQbGF5aW5nID0gIXRoaXMuYXVkaW8ucGF1c2VkXHJcbiAgICB0aGlzLnRyYWNrSW5kZXggPSAodGhpcy50cmFja0luZGV4LTEgPCAwKSA/IHRoaXMudHJhY2tDb3VudC0xIDogdGhpcy50cmFja0luZGV4LTFcclxuICAgIHRoaXMuc2V0U291cmNlKClcclxuICAgIGlmICh3YXNQbGF5aW5nKSB0aGlzLmF1ZGlvLnBsYXkoKVxyXG4gICAgdGhpcy50cmlnZ2VyKCd0cmFja0NoYW5nZScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgbmV4dCgpIHtcclxuICAgIGNvbnN0IHdhc1BsYXlpbmcgPSAhdGhpcy5hdWRpby5wYXVzZWRcclxuICAgIHRoaXMudHJhY2tJbmRleCA9ICh0aGlzLnRyYWNrSW5kZXgrMSA+PSB0aGlzLnRyYWNrQ291bnQpID8gMCA6IHRoaXMudHJhY2tJbmRleCsxXHJcbiAgICB0aGlzLnNldFNvdXJjZSgpXHJcbiAgICBpZiAod2FzUGxheWluZykgdGhpcy5hdWRpby5wbGF5KClcclxuICAgIHRoaXMudHJpZ2dlcigndHJhY2tDaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHByZXZBbGJ1bSgpIHtcclxuICAgIGNvbnN0IHdhc1BsYXlpbmcgPSAhdGhpcy5hdWRpby5wYXVzZWRcclxuICAgIHRoaXMuYWxidW1JbmRleCA9ICh0aGlzLmFsYnVtSW5kZXgtMSA8IDApID8gdGhpcy5hbGJ1bUNvdW50LTEgOiB0aGlzLmFsYnVtSW5kZXgtMVxyXG4gICAgdGhpcy51cGRhdGUoKVxyXG4gICAgdGhpcy50cmFja0luZGV4ID0gMFxyXG4gICAgdGhpcy5zZXRTb3VyY2UoKVxyXG4gICAgaWYgKHdhc1BsYXlpbmcpIHRoaXMuYXVkaW8ucGxheSgpXHJcbiAgICB0aGlzLnRyaWdnZXIoJ2FsYnVtQ2hhbmdlJylcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4gIG5leHRBbGJ1bSgpIHtcclxuICAgIGNvbnN0IHdhc1BsYXlpbmc9ICF0aGlzLmF1ZGlvLnBhdXNlZFxyXG4gICAgdGhpcy5hbGJ1bUluZGV4ID0gKHRoaXMuYWxidW1JbmRleCsxID4gdGhpcy5hbGJ1bUNvdW50LTEpID8gMCA6IHRoaXMuYWxidW1JbmRleCsxXHJcbiAgICB0aGlzLnVwZGF0ZSgpXHJcbiAgICB0aGlzLnRyYWNrSW5kZXggPSAwXHJcbiAgICB0aGlzLnNldFNvdXJjZSgpXHJcbiAgICBpZiAod2FzUGxheWluZykgdGhpcy5hdWRpby5wbGF5KClcclxuICAgIHRoaXMudHJpZ2dlcignYWxidW1DaGFuZ2UnKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgc2V0QWxidW0oaW5kZXgpIHtcclxuICAgIGlmIChpbmRleCA8PSAwKSB7XHJcbiAgICAgIHRoaXMuYWxidW1JbmRleCA9IDBcclxuICAgIH0gZWxzZSBpZiAoaW5kZXggPj0gdGhpcy5hbGJ1bUNvdW50KSB7XHJcbiAgICAgIHRoaXMuYWxidW1JbmRleCA9IHRoaXMuYWxidW1Db3VudC0xXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmFsYnVtSW5kZXggPSBpbmRleFxyXG4gICAgfVxyXG4gICAgdGhpcy51cGRhdGUoKVxyXG4gICAgdGhpcy5zZXRUcmFjayh0aGlzLmxpYlt0aGlzLmFsYnVtSW5kZXhdLnN0YXJ0aW5nVHJhY2tJbmRleCB8fCAwKVxyXG4gICAgdGhpcy50cmlnZ2VyKCdhbGJ1bUNoYW5nZScpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgc2Vla0JhY2t3YXJkKCkge1xyXG4gICAgaWYgKCF0aGlzLnNlZWtpbmcpIHJldHVybiB0aGlzXHJcbiAgICB0aGlzLm1vdXNlRG93blRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICBjb25zdCBhcHBsaWVkID0gdGhpcy5hdWRpby5jdXJyZW50VGltZSArICh0aGlzLnNldHRpbmdzLnNlZWtJbnRlcnZhbCAqIC0xKVxyXG4gICAgICB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lID0gYXBwbGllZCA8PSAwID8gMCA6IGFwcGxpZWRcclxuICAgIH0sIHRoaXMuc2V0dGluZ3Muc2Vla1RpbWUpXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgc2Vla0ZvcndhcmQoKSB7XHJcbiAgICBpZiAoIXRoaXMuc2Vla2luZykgcmV0dXJuIHRoaXNcclxuICAgIHRoaXMubW91c2VEb3duVGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGFwcGxpZWQgPSB0aGlzLmF1ZGlvLmN1cnJlbnRUaW1lICsgdGhpcy5zZXR0aW5ncy5zZWVrSW50ZXJ2YWxcclxuICAgICAgdGhpcy5hdWRpby5jdXJyZW50VGltZSA9IGFwcGxpZWQgPj0gdGhpcy5hdWRpby5kdXJhdGlvbiA/IHRoaXMuYXVkaW8uZHVyYXRpb24gOiBhcHBsaWVkXHJcbiAgICB9LCB0aGlzLnNldHRpbmdzLnNlZWtUaW1lKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIGZvcm1hdFRyYWNrbGlzdCgpIHtcclxuICAgIGlmICh0aGlzLnRyYWNrbGlzdCAmJiB0aGlzLnRyYWNrbGlzdC5sZW5ndGgpIHtcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIGNvbnN0IHJlID0gdGhpcy5yZXBsYWNlbWVudFxyXG4gICAgY29uc3QgdHJhY2tsaXN0ID0gW11cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50cmFja0NvdW50OyBpKyspIHtcclxuICAgICAgbGV0IHQgPSB0aGlzLmZpbGVzW2ldXHJcbiAgICAgIC8vIHN0cmlwIGV4dFxyXG4gICAgICB0ID0gdC5zbGljZSh0Lmxhc3RJbmRleE9mKCcuJykrMSlcclxuICAgICAgLy8gZ2V0IGxhc3QgcGF0aCBzZWdtZW50XHJcbiAgICAgIHQgPSB0LnNsaWNlKHQubGFzdEluZGV4T2YoJy8nKSsxKVxyXG4gICAgICBpZiAocmUpIHQgPSB0LnJlcGxhY2UocmVbMF0sIHJlWzFdKVxyXG4gICAgICB0cmFja2xpc3RbaV0gPSB0LnRyaW0oKVxyXG4gICAgfVxyXG4gICAgdGhpcy50cmFja2xpc3QgPSB0cmFja2xpc3RcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBidWZmZXJGb3JtYXR0ZWQoKSB7XHJcbiAgICBpZiAoIXRoaXMuYXVkaW8pIHJldHVybiAwXHJcblxyXG4gICAgY29uc3QgYXVkaW8gPSB0aGlzLmF1ZGlvXHJcbiAgICBsZXQgYnVmZmVyZWRcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBidWZmZXJlZCA9IGF1ZGlvLmJ1ZmZlcmVkLmVuZChhdWRpby5idWZmZXJlZC5sZW5ndGgtMSlcclxuICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICByZXR1cm4gMFxyXG4gICAgfVxyXG4gICAgdmFyIGZvcm1hdHRlZCA9IE1hdGgucm91bmQoXy5zY2FsZShidWZmZXJlZCwgMCwgYXVkaW8uZHVyYXRpb24sIDAsIDEwMCkpXHJcbiAgICByZXR1cm4gaXNOYU4oZm9ybWF0dGVkKSA/IDAgOiBmb3JtYXR0ZWRcclxuICB9XHJcblxyXG4gIGN1cnJlbnRUaW1lRm9ybWF0dGVkKCkge1xyXG4gICAgaWYgKGlzTmFOKHRoaXMuYXVkaW8uZHVyYXRpb24pKSB7XHJcbiAgICAgIHJldHVybiAnMDA6MDAnXHJcbiAgICB9XHJcbiAgICB2YXIgZm9ybWF0dGVkID0gXy5mb3JtYXRUaW1lKE1hdGguZmxvb3IodGhpcy5hdWRpby5jdXJyZW50VGltZS50b0ZpeGVkKDEpKSlcclxuICAgIGlmICh0aGlzLmF1ZGlvLmR1cmF0aW9uIDwgMzYwMCB8fCBmb3JtYXR0ZWQgPT09ICcwMDowMDowMCcpIHtcclxuICAgICAgcmV0dXJuIGZvcm1hdHRlZC5zbGljZSgzKSAvLyBubjpublxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZvcm1hdHRlZFxyXG4gIH1cclxuXHJcbiAgZHVyYXRpb25Gb3JtYXR0ZWQoKSB7XHJcbiAgICBpZiAoaXNOYU4odGhpcy5hdWRpby5kdXJhdGlvbikpIHtcclxuICAgICAgcmV0dXJuICcwMDowMCdcclxuICAgIH1cclxuICAgIHZhciBmb3JtYXR0ZWQgPSBfLmZvcm1hdFRpbWUoTWF0aC5mbG9vcih0aGlzLmF1ZGlvLmR1cmF0aW9uLnRvRml4ZWQoMSkpKVxyXG4gICAgaWYgKHRoaXMuYXVkaW8uZHVyYXRpb24gPCAzNjAwIHx8IGZvcm1hdHRlZCA9PT0gJzAwOjAwOjAwJykge1xyXG4gICAgICByZXR1cm4gZm9ybWF0dGVkLnNsaWNlKDMpIC8vIG5uOm5uXHJcbiAgICB9XHJcbiAgICByZXR1cm4gZm9ybWF0dGVkXHJcbiAgfVxyXG5cclxuICB0cmFja051bWJlckZvcm1hdHRlZChuKSB7XHJcbiAgICB2YXIgY291bnQgPSAoJycrdGhpcy50cmFja0NvdW50KS5sZW5ndGggLSAoJycrbikubGVuZ3RoXHJcbiAgICByZXR1cm4gXy5yZXBlYXQoJzAnLCBjb3VudCkgKyBuICsgdGhpcy5zZXR0aW5ncy50cmFja051bWJlclBvc3RmaXhcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlbmllbmNlIG1ldGhvZCB0byBncmFiIGEgcHJvcGVydHkgZnJvbSB0aGUgY3VycmVudGx5IGN1ZWQgYWxidW0uIEFcclxuICAgKiBzZWNvbmQgYXJndW1lbnQgY2FuIGJlIHBhc3NlZCB0byBjaG9vc2UgYSBzcGVjaWZpYyBhbGJ1bS5cclxuICAgKiBAbWV0aG9kIGdldFxyXG4gICAqIEBwYXJhbSAge1N0cmluZ30gd2hhdCB0aGUgcHJvcGVydHlcclxuICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgW2Rlc2NyaXB0aW9uXVxyXG4gICAqL1xyXG4gIGdldChrZXksIGluZGV4KSB7XHJcbiAgICByZXR1cm4gdGhpcy5saWJbaW5kZXggPT09IHVuZGVmaW5lZCA/IHRoaXMuYWxidW1JbmRleCA6IGluZGV4XVtrZXldXHJcbiAgfVxyXG5cclxufVxyXG5cclxuTGFwLiQkaW5zdGFuY2VzID0gW11cclxuXHJcbkxhcC4kJGF1ZGlvRXh0ZW5zaW9uUmVnRXhwID0gL21wM3x3YXZ8b2dnfGFpZmYvaVxyXG5cclxuTGFwLiQkZGVmYXVsdFNldHRpbmdzID0ge1xyXG4gIGNhbGxiYWNrczoge30sXHJcbiAgZGlzY29nUGxheWxpc3RFeGNsdXNpdmU6IHRydWUsXHJcbiAgcGx1Z2luczogW10sXHJcbiAgcHJlcGVuZFRyYWNrTnVtYmVyczogdHJ1ZSxcclxuICByZXBsYWNlbWVudDogbnVsbCxcclxuICBzdGFydGluZ0FsYnVtSW5kZXg6IDAsXHJcbiAgc3RhcnRpbmdUcmFja0luZGV4OiAwLFxyXG4gIHNlZWtJbnRlcnZhbDogNSxcclxuICBzZWVrVGltZTogMjUwLFxyXG4gIHNlbGVjdG9yczoge30sIC8vIHNlZSAjaW5pdEVsZW1lbnRzXHJcbiAgc2VsZWN0b3JQcmVmaXg6ICdsYXAnLFxyXG4gIHRyYWNrTnVtYmVyUG9zdGZpeDogJyAtICcsXHJcbiAgdXNlTmF0aXZlUHJvZ3Jlc3M6IGZhbHNlLFxyXG4gIHVzZU5hdGl2ZVNlZWtSYW5nZTogZmFsc2UsXHJcbiAgdXNlTmF0aXZlVm9sdW1lUmFuZ2U6IGZhbHNlLFxyXG4gIHZvbHVtZUludGVydmFsOiAwLjA1XHJcbn1cclxuXHJcbkxhcC4kJGRlZmF1bHRTZWxlY3RvcnMgPSB7XHJcbiAgc3RhdGU6IHtcclxuICAgIHBsYXlsaXN0SXRlbUN1cnJlbnQ6ICAnbGFwX19wbGF5bGlzdF9faXRlbS0tY3VycmVudCcsXHJcbiAgICBwbGF5aW5nOiAgICAgICAgICAgICAgJ2xhcC0tcGxheWluZycsXHJcbiAgICBwYXVzZWQ6ICAgICAgICAgICAgICAgJ2xhcC0tcGF1c2VkJyxcclxuICAgIGhpZGRlbjogICAgICAgICAgICAgICAnbGFwLS1oaWRkZW4nXHJcbiAgfSxcclxuICBhbGJ1bTogICAgICAgICAgICAgICAnbGFwX19hbGJ1bScsXHJcbiAgYXJ0aXN0OiAgICAgICAgICAgICAgJ2xhcF9fYXJ0aXN0JyxcclxuICBidWZmZXJlZDogICAgICAgICAgICAnbGFwX19idWZmZXJlZCcsXHJcbiAgY292ZXI6ICAgICAgICAgICAgICAgJ2xhcF9fY292ZXInLFxyXG4gIGN1cnJlbnRUaW1lOiAgICAgICAgICdsYXBfX2N1cnJlbnQtdGltZScsXHJcbiAgZGlzY29nOiAgICAgICAgICAgICAgJ2xhcF9fZGlzY29nJyxcclxuICBkaXNjb2dJdGVtOiAgICAgICAgICAnbGFwX19kaXNjb2dfX2l0ZW0nLFxyXG4gIGRpc2NvZ1BhbmVsOiAgICAgICAgICdsYXBfX2Rpc2NvZ19fcGFuZWwnLFxyXG4gIGR1cmF0aW9uOiAgICAgICAgICAgICdsYXBfX2R1cmF0aW9uJyxcclxuICBpbmZvOiAgICAgICAgICAgICAgICAnbGFwX19pbmZvJywgLy8gYnV0dG9uXHJcbiAgaW5mb1BhbmVsOiAgICAgICAgICAgJ2xhcF9faW5mby1wYW5lbCcsXHJcbiAgbmV4dDogICAgICAgICAgICAgICAgJ2xhcF9fbmV4dCcsXHJcbiAgbmV4dEFsYnVtOiAgICAgICAgICAgJ2xhcF9fbmV4dC1hbGJ1bScsXHJcbiAgcGxheVBhdXNlOiAgICAgICAgICAgJ2xhcF9fcGxheS1wYXVzZScsXHJcbiAgcGxheWxpc3Q6ICAgICAgICAgICAgJ2xhcF9fcGxheWxpc3QnLCAvLyBidXR0b25cclxuICBwbGF5bGlzdEl0ZW06ICAgICAgICAnbGFwX19wbGF5bGlzdF9faXRlbScsIC8vIGxpc3QgaXRlbVxyXG4gIHBsYXlsaXN0UGFuZWw6ICAgICAgICdsYXBfX3BsYXlsaXN0X19wYW5lbCcsXHJcbiAgcGxheWxpc3RUcmFja051bWJlcjogJ2xhcF9fcGxheWxpc3RfX3RyYWNrLW51bWJlcicsXHJcbiAgcGxheWxpc3RUcmFja1RpdGxlOiAgJ2xhcF9fcGxheWxpc3RfX3RyYWNrLXRpdGxlJyxcclxuICBwcmV2OiAgICAgICAgICAgICAgICAnbGFwX19wcmV2JyxcclxuICBwcmV2QWxidW06ICAgICAgICAgICAnbGFwX19wcmV2LWFsYnVtJyxcclxuICBwcm9ncmVzczogICAgICAgICAgICAnbGFwX19wcm9ncmVzcycsXHJcbiAgc2Vla0JhY2t3YXJkOiAgICAgICAgJ2xhcF9fc2Vlay1iYWNrd2FyZCcsXHJcbiAgc2Vla0ZvcndhcmQ6ICAgICAgICAgJ2xhcF9fc2Vlay1mb3J3YXJkJyxcclxuICBzZWVrUmFuZ2U6ICAgICAgICAgICAnbGFwX19zZWVrLXJhbmdlJyxcclxuICB0cmFja051bWJlcjogICAgICAgICAnbGFwX190cmFjay1udW1iZXInLCAvLyB0aGUgY3VycmVudGx5IGN1ZWQgdHJhY2tcclxuICB0cmFja1RpdGxlOiAgICAgICAgICAnbGFwX190cmFjay10aXRsZScsXHJcbiAgdm9sdW1lQnV0dG9uOiAgICAgICAgJ2xhcF9fdm9sdW1lLWJ1dHRvbicsXHJcbiAgdm9sdW1lRG93bjogICAgICAgICAgJ2xhcF9fdm9sdW1lLWRvd24nLFxyXG4gIHZvbHVtZVJlYWQ6ICAgICAgICAgICdsYXBfX3ZvbHVtZS1yZWFkJyxcclxuICB2b2x1bWVSYW5nZTogICAgICAgICAnbGFwX192b2x1bWUtcmFuZ2UnLFxyXG4gIHZvbHVtZVVwOiAgICAgICAgICAgICdsYXBfX3ZvbHVtZS11cCdcclxufVxyXG5cclxuaWYgKHdpbmRvdykgd2luZG93LkxhcCA9IExhcFxyXG4iXX0=
