(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define('Lap', ['exports', 'module'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod);
    global.Lap = mod.exports;
  }
})(this, function (exports, module) {
  /*>>*/
  'use strict';

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var logger = new Logger('Lap', {
    level: 0,
    nameStyle: 'color:rgb(10, 102, 85)'
  });
  /*<<*/

  var _ = tooly;
  var $ = _.Frankie;
  var IS_MOBILE = true; // temp fix as we don't give a shit about volume for now...

  var $$instances = Symbol();
  var $$defaultSettings = Symbol();
  var $$defaultSelectors = Symbol();
  var $$audioExtensionRegExp = Symbol();

  var Lap = (function (_Bus) {
    _inherits(Lap, _Bus);

    function Lap(element, lib, options) {
      var _this = this;

      var postpone = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

      _classCallCheck(this, Lap);

      _get(Object.getPrototypeOf(Lap.prototype), 'constructor', this).call(this);
      this.id = options && options.id ? options.id : Lap[$$instances].length;
      this.element = element;
      this.container = document.querySelector(element);
      this.settings = _.extend({}, Lap[$$defaultSettings], options);
      this.lib = lib;
      if (!postpone) this.initialize();

      /*>>*/
      var echo = function echo(e) {
        return _this.on(e, function () {
          return logger.info('%c%s handler called', 'color:#800080', e);
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

      Lap[$$instances].push(this);
      return this;
    }

    _createClass(Lap, [{
      key: 'initialize',
      value: function initialize() {
        var _this2 = this;

        this.SEEKING = false;
        this.VOLUME_CHANGING = false;
        this.MOUSEDOWN_TIMER = 0;
        this.PLAYING = false;

        this.plugins = this.settings.plugins;
        this.playlistPopulated = false;

        this.albumIndex = this.settings.startingAlbumIndex;
        this.albumCount = this.lib.length;

        this.update();
        this.initAudio();
        this.initElements();
        this.addAudioListeners();
        if (!IS_MOBILE) this.addVolumeListeners();
        this.addSeekListeners();
        this.addListeners();

        _.each(this.settings.callbacks, function (fn, key) {
          return _this2.on(key, fn);
        });
        this.activatePlugins();

        /*>>*/logger.debug('initialize >> instance #%o: %o', this.id, this); /*<<*/

        this.trigger('load');
      }
    }, {
      key: 'activatePlugins',
      value: function activatePlugins() {
        var _this3 = this;

        this.plugins.forEach(function (plugin, i) {
          _this3.plugins[i] = new plugin(_this3); /* jshint ignore:line */
        });
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

        ['artist', 'album', 'files', 'cover', 'tracklist', 'replacement'].forEach(function (key) {
          return _this4[key] = currentLibItem[key];
        });

        this.trackCount = this.files.length;

        if (this.replacement !== undefined) {
          var re = this.replacement;
          /* for replacment without value specified, empty string */
          if (_.type(re) === 'string') re = [re, ''];
          /* re may contain string-wrapped regexp (from json), convert if so */
          if (_.type(re[0]) !== 'regexp') {
            var flags = re[2];
            re[0] = new RegExp(re[0], flags !== undefined ? flags : 'g');
          }
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
          console.warn('This browser does not support ' + filetype + ' playback.');
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
        return f.substr(0, f.lastIndexOf('.'));
      }
    }, {
      key: 'initElements',
      value: function initElements() {
        var _this5 = this;

        this.els = {};
        this.selectors = Object.keys(Lap[$$defaultSelectors]).map(function (key) {
          return _this5.settings.selectors[key] || Lap[$$defaultSelectors][key];
        });
        Object.keys(this.selectors).forEach(function (sel, key) {
          if (_.type(sel) === 'object') return;
          var el = document.querySelector('.' + sel, _this5.element);
          if (el) _this5.els[key] = el;
        });
      }
    }, {
      key: 'addAudioListeners',
      value: function addAudioListeners() {
        var _this6 = this;

        var audio = this.audio;
        var els = this.els;

        if (els.buffered || this.settings.useNativeProgress && els.progress) {
          audio.addEventListener('progress', function () {
            // TODO: verify if this really needs to be type cast...
            var buffered = +_this6.bufferFormatted();
            if (els.buffered) els.buffered.outerHTML = buffered;
            if (nativeProgress) els.progress.value = buffered;
          });
        }
        if (els.currentTime) {
          audio.addEventListener('timeupdate', function () {
            els.currentTime.outerHTML = _this6.currentTimeFormatted();
          });
        }
        if (els.duration) {
          audio.addEventListener('durationchange', function () {
            els.duration.outerHTML = _this6.durationFormatted();
          });
        }
        if (!IS_MOBILE && els.volumeRead) {
          audio.addEventListener('volumechange', function () {
            els.volumeRead.outerHTML = _this6.volumeFormatted();
          });
        }
        audio.addEventListener('ended', function () {
          /*>>*/logger.debug('ended > this.audio.paused: %o', _this6.audio.paused); /*<<*/
          if (_this6.PLAYING) {
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

        if (els.playPause) els.playPause.addEventListener('click', function () {
          return _this7.togglePlay();
        });
        if (els.prev) els.prev.addEventListener('click', function () {
          return _this7.prev();
        });
        if (els.next) els.next.addEventListener('click', function () {
          return _this7.next();
        });
        if (!IS_MOBILE) {
          if (els.volumeUp) els.volumeUp.addEventListener('click', function () {
            return _this7.incVolume();
          });
          if (els.volumeDown) els.volumeDown.addEventListener('click', function () {
            return _this7.decVolume();
          });
        }
        if (els.prevAlbum) els.prevAlbum.addEventListener('click', function () {
          return _this7.prevAlbum();
        });
        if (els.nextAlbum) els.nextAlbum.addEventListener('click', function () {
          return _this7.nextAlbum();
        });
        if (els.discog) els.discog.addEventListener('click', function () {
          return _this7.trigger('discogClick');
        });
        if (els.playlist) els.playlist.addEventListener('click', function () {
          return _this7.trigger('playlistClick');
        });

        // this
        //   .on('load', () => {
        //     if (els.trackTitle) this.updateTrackTitleEl();
        //     if (els.trackNumber) this.updateTrackNumberEl();
        //     if (els.artist) this.updateArtistEl();
        //     if (els.album) this.updateAlbumEl();
        //     if (els.cover) this.updateCover();
        //     if (els.playPause) {
        //       els.playPause.addClass(this.selectors.state.paused);
        //       this
        //         .on('play', () => {
        //           els.playPause
        //             .removeClass(this.selectors.state.paused)
        //             .addClass(this.selectors.state.playing);
        //         })
        //         .on('pause', () => {
        //           els.playPause
        //             .removeClass(this.selectors.state.playing)
        //             .addClass(this.selectors.state.paused);
        //         });
        //     }
        //   })
        //   .on('trackChange', () => {
        //     if (els.trackTitle) this.updateTrackTitleEl();
        //     if (els.trackNumber) this.updateTrackNumberEl();
        //     if (els.currentTime) els.currentTime.html(this.currentTimeFormatted());
        //     if (els.duration) els.duration.html(this.durationFormatted());
        //   })
        //   .on('albumChange', () => {
        //     if (els.trackTitle) this.updateTrackTitleEl();
        //     if (els.trackNumber) this.updateTrackNumberEl();
        //     if (els.artist) this.updateArtistEl();
        //     if (els.album) this.updateAlbumEl();
        //     if (els.cover) this.updateCover();
        //   });
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
            if (!_this8.SEEKING) {
              seekRange.get(0).value = _.scale(audio.currentTime, 0, audio.duration, 0, 100);
            }
          });
          seekRange.on('mousedown', function (e) {
            _this8.SEEKING = true;
          }).on('mouseup', function (e) {
            var el = seekRange.get(0);
            if (!el.value) _this8.logger.debug('what the fuck! ' + el);
            audio.currentTime = _.scale(el.value, 0, el.max, 0, audio.duration);
            _this8.trigger('seek');
            _this8.SEEKING = false;
          });
        } else {
          // using buttons
          [els.seekForward, els.seekBackward].forEach(function (el) {
            if (!el) return;
            el.on('mousedown', function (e) {
              _this8.SEEKING = true;
              if ($(e.target).hasClass(_this8.selectors.seekForward)) {
                _this8.seekForward();
              } else {
                _this8.seekBackward();
              }
            }).on('mouseup', function (e) {
              _this8.SEEKING = false;
              clearTimeout(_this8.MOUSEDOWN_TIMER);
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
            if (!_this9.VOLUME_CHANGING) {
              vslider.get(0).value = _this9.volumeFormatted();
            }
          });
          vslider.on('mousedown', function () {
            _this9.VOLUME_CHANGING = true;
          }).on('mouseup', function () {
            audio.volume = vslider.get(0).value * 0.01;
            _this9.trigger('volumeChange');
            _this9.VOLUME_CHANGING = false;
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
        this.els.trackTitle.outerHTML = this.tracklist[this.trackIndex];
        return this;
      }
    }, {
      key: 'updateTrackNumberEl',
      value: function updateTrackNumberEl() {
        this.els.trackNumber.outerHTML = +this.trackIndex + 1;
        return this;
      }
    }, {
      key: 'updateArtistEl',
      value: function updateArtistEl() {
        this.els.artist.outerHTML = this.artist;
        return this;
      }
    }, {
      key: 'updateAlbumEl',
      value: function updateAlbumEl() {
        this.els.album.outerHTML = this.album;
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
        this.PLAYING = true;
        this.trigger('play');
        return this;
      }
    }, {
      key: 'pause',
      value: function pause() {
        this.audio.pause();
        this.PLAYING = false;
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

        if (!this.SEEKING) return this;
        this.MOUSEDOWN_TIMER = setInterval(function () {
          var applied = _this10.audio.currentTime + _this10.settings.seekInterval * -1;
          _this10.audio.currentTime = applied <= 0 ? 0 : applied;
        }, this.settings.seekTime);
        return this;
      }
    }, {
      key: 'seekForward',
      value: function seekForward() {
        var _this11 = this;

        if (!this.SEEKING) return this;
        this.MOUSEDOWN_TIMER = setInterval(function () {
          var applied = _this11.audio.currentTime + _this11.settings.seekInterval;
          _this11.audio.currentTime = applied >= _this11.audio.duration ? _this11.audio.duration : applied;
        }, this.settings.seekTime);
        return this;
      }
    }, {
      key: 'formatTracklist',
      value: function formatTracklist() {
        /* don't fuck with the user's tracklist */
        if (_.truthy(this.tracklist)) {
          return this;
        }
        var re = this.replacement;
        var tracklist = []; // let?
        for (var i = 0; i < this.trackCount; i++) {
          tracklist[i] = _.sliceRel(_.stripExtension(this.files[i]));
          if (_.truthy(re)) {
            tracklist[i] = tracklist[i].replace(re[0], re[1]);
          }
          tracklist[i] = tracklist[i].trim();
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
        return Lap[$$instances][id];
      }
    }, {
      key: 'setLib',
      value: function setLib(lib) {
        if (Array.isArray(lib)) return this.lib = lib;
        if (typeof lib === 'string' && Lap[$$audioExtensionRegExp].test(lib)) {
          return this.lib = [{ files: lib }];
        }
        if (typeof lib === 'object') return this.lib = [lib];
        throw new TypeError(lib + ' must be an array, object, or string');
      }
    }]);

    return Lap;
  })(Bus);

  module.exports = Lap;

  Lap[$$instances] = [];

  Lap[$$audioExtensionRegExp] = /mp3|wav|ogg|aiff/i;

  Lap[$$defaultSettings] = {
    callbacks: {},
    discogPlaylistExclusive: true,
    plugins: [],
    prependTrackNumbers: true,
    replacementText: void 0,
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
    volumeInterval: 0.05,
    $: !(function () {
      if (tooly && tooly.Frankie) return tooly.Frankie;
      return jQuery || Zepto || Bondo || new Error('Could not find a default selector library');
    })()
  };

  Lap[$$defaultSelectors] = {
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
});
//# sourceMappingURL=lap.js.map
