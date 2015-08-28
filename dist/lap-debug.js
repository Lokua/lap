(function() { 'use strict';

  /*>>*/
  Lo66er.setDefaults({
    outputTimestamp: false,
    outputSource: true,
    useAbsoluteSource: true,
    nameStyle: 'color:darkblue'
  });
  /*<<*/

  angular.module('lnet.lap', ['tooly']);

})();


(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('Lap', { level: 0 });
  /*<<*/

  angular.module('lnet.lap').factory('Lap', factory);
  factory.$inject = ['$http', '$q', '$rootScope', 'tooly', 'lapUtil'];

  function factory($http, $q, $rootScope, tooly, lapUtil) {

    var _id = _id || 0,
        _instances = [],
        _audioExtensionRegExp = /mp3|wav|ogg|aiff/i;

    /**
     * @constructor
     * @param {jqLite}  element  the container angular.element (lapContainer directive)
     * @param {Array}   lib      list of album objects of the form []
     * @param {Object}  options  hash of options to merge with Lap.prototype.defaultOptions
     * @param {Boolean} postpone if true, Lap will not call its initialize function 
     *                           when instantiated
     */
    function Lap(element, lib, options, postpone) {
      tooly.Handler.call(this);
      this.id = ++_id;
      this.element = element;
      this.container = element[0];
      this.settings = angular.extend({}, this.defaultSettings, options);
      this.lib = lib;
      if (!postpone) this.initialize();
      /*>>*/
      var lap = this;
      var echo = function echo(event) { 
        lap.on(event, function() {
          logger.info('%c%s handler called', 'color:#800080', event); 
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
      _instances.push(this);
      return this;
    }

    Lap.getInstance = function(index) {
      var deferred = $q.defer();
      deferred.resolve(_instances[index]);
      return deferred.promise;
    };

    /**
     * Static helper to fetch json or audio file, or convert an existing javascript Object/Array
     * into the proper format for Lap's lib member.
     * 
     * @param  {Object|Array|String} arg either an array of album objects, a single album object
     *                                   or a url pointing to either a json file or single audio 
     *                                   file
     * @return {Promise.Array[Object]} 
     * @static
     */
    Lap.getLib = function(arg) {
      var deferred = $q.defer();

      if (tooly.type(arg) === 'object') {
        /*>>*/
        logger.debug('getLib >> isObject...');
        /*<<*/
        deferred.resolve([arg]);
        return deferred.promise;

      } else if (tooly.type(arg) === 'array') {
        /*>>*/
        logger.debug('getLib >> isArray...');
        /*<<*/
        deferred.resolve(arg);
        return deferred.promise;

      } else if (_audioExtensionRegExp.test(arg)) {
        /*>>*/
        logger.debug('getLib >> _audioExtensionRegExp.test(arg)...');
        logger.log('arg appears to be a single audio file');
        /*<<*/
        deferred.resolve([{ files: arg }]);
        return deferred.promise;
      }

      return $http.get(arg).then(function(response) {
        deferred.resolve(response.data);
        return deferred.promise;
      }, function(err) {
        return deferred.reject(err);
      });
    };

    Lap.PluginConstructorError = function(msg) {
      Error.call(this);
    };
    Lap.PluginConstructorError.prototype = Error;

    Lap.prototype = new tooly.Handler();

    Lap.prototype.defaultSettings = {
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
      volumeInterval: 0.05
    };

    Lap.prototype.selectors = {
      state: {
        playlistItemCurrent:  'lap__playlist__item--current',
        playing:              'lap--playing',
        paused:               'lap--paused',
        hidden:               'lap--hidden'
      },
      album:               'lap__album',
      artist:              'lap__artist',
      buffered:            'lap__buffered',
      cover:               'lap__cover',
      currentTime:         'lap__current-time',
      discog:              'lap__discog',
      discogItem:          'lap__discog__item',
      discogPanel:         'lap__discog__panel',
      duration:            'lap__duration',
      info:                'lap__info', // button
      infoPanel:           'lap__info-panel',
      next:                'lap__next',
      nextAlbum:           'lap__next-album',
      playPause:           'lap__play-pause',
      playlist:            'lap__playlist', // button
      playlistItem:        'lap__playlist__item', // list item
      playlistPanel:       'lap__playlist__panel',
      playlistTrackNumber: 'lap__playlist__track-number',
      playlistTrackTitle:  'lap__playlist__track-title',
      prev:                'lap__prev',
      prevAlbum:           'lap__prev-album',
      progress:            'lap__progress',
      seekBackward:        'lap__seek-backward',
      seekForward:         'lap__seek-forward',
      seekRange:           'lap__seek-range',
      trackNumber:         'lap__track-number', // the currently cued track
      trackTitle:          'lap__track-title',
      volumeButton:        'lap__volume-button',
      volumeDown:          'lap__volume-down',
      volumeRead:          'lap__volume-read',
      volumeRange:         'lap__volume-range',
      volumeUp:            'lap__volume-up'
    };

    Lap.prototype.SEEKING = false;
    Lap.prototype.VOLUME_CHANGING = false;
    Lap.prototype.MOUSEDOWN_TIMER = 0;
    Lap.prototype.PLAYING = false;

    Lap.prototype.initialize = function() {

      this.plugins = {};
      this.playlistPopulated = false;

      this.albumIndex = this.settings.startingAlbumIndex;
      this.albumCount = this.lib.length;

      this.update();

      this.initAudio();
      this.initElements();

      this.addAudioListeners();

      if (!lapUtil.isMobile()) {
        this.addVolumeListeners();
      }
      this.addSeekListeners();
      this.addListeners();

      this.register(this.settings.callbacks);

      /*>>*/
      logger.debug('post initialize >> Lap instance #%d: %o', this.id, this);
      /*<<*/

      $rootScope.$broadcast('lnet.lap.instanceInitialized', this);

      this.trigger('load');
    };

    /**
     * Configures instance variables relative to the current album.
     * Called on initialization and whenever an album is changed.
     *     
     * @return {Lap} this
     */
    Lap.prototype.update = function() {
      var lap = this,
          lib = lap.lib,
          currentLibItem = lib[lap.albumIndex];

      lap.trackIndex = lap.settings.startingTrackIndex;
      lap.playlistPopulated = false;

      ['artist', 'album', 'files', 'cover', 'tracklist', 'replacement'].forEach(function(key) {
        lap[key] = currentLibItem[key];
      });

      lap.trackCount = lap.files.length;

      if (lap.replacement !== undefined) {
        var re = lap.replacement;
        // for replacment without value specified, empty string
        if (tooly.type(re) === 'string') re = [re, ''];
        // re may contain string-wrapped regexp (from json), convert if so
        if (tooly.type(re[0]) !== 'regexp') {
          var flags = re[2];
          re[0] = new RegExp(re[0], flags !== undefined ? flags : 'g');
        }
      }
      lap.formatTracklist();
      return lap;
    };

    Lap.prototype.initAudio = function() {  
      this.audio = new Audio();
      this.audio.preload = 'auto';
      var fileType = this.getFileType(),
          canPlay = this.audio.canPlayType('audio/' + fileType);
      if (canPlay === 'probably' || canPlay === 'maybe') {
        this.setSource();
        this.audio.volume = lapUtil.isMobile() ? 0.80 : 1;
      } else {
        console.warn('This browser does not support ' + fileType + ' playback.');
      }
    };

    Lap.prototype.setSource = function() {
      this.audio.src = this.files[this.trackIndex];
    };

    Lap.prototype.getFileType = function() {
      return tooly.extension(this.files[this.trackIndex]);
    };

    Lap.prototype.initElements = function() {
      var lap = this;
      lap.els = {};
      lap.selectors = angular.extend({}, lap.selectors, lap.settings.selectors);
      tooly.each(lap.selectors, function(sel, key) {
        if (tooly.type(sel) === 'object') return;
        var el = lapUtil.element('.' + sel, lap.element);
        if (el.length) lap.els[key] = el;
      });
    };

    Lap.prototype.addAudioListeners = function() {
      var lap = this, 
          audio = lap.audio,
          els = lap.els;

      if (els.buffered || (lap.settings.useNativeProgress && els.progress)) {
        audio.addEventListener('progress', function() {
          var buffered = +lap.bufferFormatted();
          if (els.buffered)   els.buffered.html(buffered);
          if (nativeProgress) els.progress[0].value = buffered;
        });
      }
      if (els.currentTime) {
        audio.addEventListener('timeupdate', function() {
          els.currentTime.html(lap.currentTimeFormatted());
        });
      }
      if (els.duration) {
        audio.addEventListener('durationchange', function() {
          els.duration.html(lap.durationFormatted());        
        });
      }
      if (!lapUtil.isMobile() && els.volumeRead) {
        audio.addEventListener('volumechange', function() {
          els.volumeRead.html(lap.volumeFormatted());
        });
      }
      audio.addEventListener('ended', function() {
        /*>>*/logger.debug('ended > lap.audio.paused: %o', lap.audio.paused);/*<<*/
        // if (lap.audio.paused) lap.audio.play();
        if (lap.PLAYING) {
          lap.next();
          lap.audio.play();
        }
      });

      return lap;       
    };    

    Lap.prototype.addListeners = function() {
      var lap = this,
          els = lap.els;

      if (els.playPause) els.playPause.on('click', function() { lap.togglePlay(); });
      if (els.prev) els.prev.on('click', function() { lap.prev(); });
      if (els.next) els.next.on('click', function() { lap.next(); });
      if (!lapUtil.isMobile()) {
        if (els.volumeUp) els.volumeUp.on('click', function() { lap.incVolume(); });
        if (els.volumeDown) els.volumeDown.on('click', function() { lap.decVolume(); });
      }
      if (els.prevAlbum) els.prevAlbum.on('click', function() { lap.prevAlbum(); });
      if (els.nextAlbum) els.nextAlbum.on('click', function() { lap.nextAlbum(); });
      if (els.discog) els.discog.on('click', function() { lap.trigger('discogClick'); });

      lap
        .on('load', function() {
          if (els.trackTitle) lap.updateTrackTitleEl();
          if (els.trackNumber) lap.updateTrackNumberEl();
          if (els.artist) lap.updateArtistEl();
          if (els.album) lap.updateAlbumEl();
          if (els.cover) lap.updateCover();
          if (els.playPause) {
            els.playPause.addClass(lap.selectors.state.paused);
            lap
              .on('play', function() {
                els.playPause
                  .removeClass(lap.selectors.state.paused)
                  .addClass(lap.selectors.state.playing);
              })
              .on('pause', function() {
                els.playPause
                  .removeClass(lap.selectors.state.playing)
                  .addClass(lap.selectors.state.paused);
              });
          }
        })
        .on('trackChange', function() {
          if (els.trackTitle) lap.updateTrackTitleEl();
          if (els.trackNumber) lap.updateTrackNumberEl();
          if (els.currentTime) els.currentTime.html(lap.currentTimeFormatted());
          if (els.duration) els.duration.html(lap.durationFormatted());
        })
        .on('albumChange', function() {
          if (els.trackTitle) lap.updateTrackTitleEl();
          if (els.trackNumber) lap.updateTrackNumberEl();
          if (els.artist) lap.updateArtistEl();
          if (els.album) lap.updateAlbumEl();
          if (els.cover) lap.updateCover();
        });      
    };

    Lap.prototype.addSeekListeners = function() {
      var lap = this, 
          els = lap.els,
          audio = lap.audio,
          seekRange = els.seekRange,
          nativeSeek = lap.settings.useNativeSeekRange && seekRange && seekRange.els.length > 0;

      if (nativeSeek) {
        audio.addEventListener('timeupdate', function(e) {
          if (!lap.SEEKING) {
            seekRange.get(0).value = tooly.scale(audio.currentTime, 0, audio.duration, 0, 100);
          }
        });
        seekRange
          .on('mousedown', function(e) {
            lap.SEEKING = true;
          })
          .on('mouseup', function(e) {
            var el = seekRange.get(0);
            if (!el.value) lap.logger.debug('what the fuck! ' + el);
            audio.currentTime = tooly.scale(el.value, 0, el.max, 0, audio.duration);
            lap.trigger('seek');
            lap.SEEKING = false;
          });

      } else { // using buttons
        [els.seekForward, els.seekBackward].forEach(function(el) {
          if (!el) return;
          el
            .on('mousedown', function(e) {
              lap.SEEKING = true;
              if (angular.element(e.target).hasClass(lap.selectors.seekForward)) {
                lap.seekForward();
              } else {
                lap.seekBackward();
              }
            })
            .on('mouseup', function(e) {
              lap.SEEKING = false;
              clearTimeout(lap.MOUSEDOWN_TIMER);
            });
        });
      }
    };

    if (!lapUtil.isMobile()) {

      Lap.prototype.addVolumeListeners = function() {
        var lap = this, 
            els = lap.els,
            audio = lap.audio,
            vslider = els.volumeRange;

        if (lap.settings.useNativeVolumeRange && vslider && vslider.els.length > 0) {
          audio.addEventListener('volumechange', function() {
            if (!lap.VOLUME_CHANGING) {
              vslider.get(0).value = lap.volumeFormatted();
            }
          });
          vslider
            .on('mousedown', function() {
              lap.VOLUME_CHANGING = true;
            })
            .on('mouseup', function() {
              audio.volume = vslider.get(0).value * 0.01;
              lap.trigger('volumeChange');
              lap.VOLUME_CHANGING = false;
            });
        }
      };

      Lap.prototype.incVolume = function() {
        this.setVolume(true);
        return this;      
      };

      Lap.prototype.decVolume = function() {
        this.setVolume(false);
        return this;
      };

      Lap.prototype.setVolume = function(up) {
        var vol = this.audio.volume,
            interval = this.settings.volumeInterval;
        if (up) {
          this.audio.volume = (vol + interval >= 1) ? 1 : vol + interval;
        } else {
          this.audio.volume = (vol - interval <= 0) ? 0 : vol - interval;
        }
        this.trigger('volumeChange');
        return this;      
      };
      
      Lap.prototype.volumeFormatted = function() {
        return Math.round(this.audio.volume * 100);
      };      
    }


    /**
     * Add a plug-in instance to the plugins hash
     * @param  {String} key    the plugin instance identifier
     * @param  {Object} plugin the plugin instance (not the class)
     * @return {Lap}           this
     */ 
    Lap.prototype.registerPlugin = function(key, plugin) {
      this.plugins[key] = plugin;
    };

    Lap.prototype.updateTrackTitleEl = function() {
      this.els.trackTitle.html(this.tracklist[this.trackIndex]);
      return this;
    };

    Lap.prototype.updateTrackNumberEl = function() {
      this.els.trackNumber.html(+this.trackIndex+1);
      return this;
    };

    Lap.prototype.updateArtistEl = function() {
      this.els.artist.html(this.artist);
      return this;      
    };

    Lap.prototype.updateAlbumEl = function() {
      this.els.album.html(this.album);
      return this;      
    };

    Lap.prototype.updateCover = function() {
      this.els.cover.get(0).src = this.cover;
      return this;      
    };

    Lap.prototype.togglePlay = function() {
      this.audio.paused ? this.play() : this.pause();
      this.trigger('togglePlay');
      return this;
    };
    Lap.prototype.play = function() {
      this.audio.play();
      this.PLAYING = true;
      this.trigger('play');
      return this;
    };
    Lap.prototype.pause = function() {
      this.audio.pause();
      this.PLAYING = false;
      this.trigger('pause');
      return this;
    };

    Lap.prototype.setTrack = function(index) {
      if (index <= 0) {
        this.trackIndex = 0;
      } else if (index >= this.trackCount) {
        this.trackIndex = this.trackCount-1;
      } else {
        this.trackIndex = index;
      }
      var wasPlaying = !this.audio.paused;
      this.setSource();
      if (wasPlaying) this.audio.play();
      this.trigger('trackChange');
      return this;      
    };
    Lap.prototype.prev = function() {
      var wasPlaying = !this.audio.paused;
      this.trackIndex = (this.trackIndex-1 < 0) ? this.trackCount-1 : this.trackIndex-1;
      this.setSource();
      if (wasPlaying) this.audio.play();
      this.trigger('trackChange');
      return this;       
    };
    Lap.prototype.next = function() {
      var wasPlaying = !this.audio.paused;
      this.trackIndex = (this.trackIndex+1 >= this.trackCount) ? 0 : this.trackIndex+1;
      this.setSource();
      if (wasPlaying) this.audio.play();
      this.trigger('trackChange');
      return this;      
    };

    Lap.prototype.prevAlbum = function() {
      var wasPlaying = !this.audio.paused;
      this.albumIndex = (this.albumIndex-1 < 0) ? this.albumCount-1 : this.albumIndex-1;
      this.update();
      this.trackIndex = 0;
      this.setSource();
      if (wasPlaying) this.audio.play();
      this.trigger('albumChange');
      return this;      
    };
    Lap.prototype.nextAlbum = function() {
      var wasPlaying= !this.audio.paused;
      this.albumIndex = (this.albumIndex+1 > this.albumCount-1) ? 0 : this.albumIndex+1;
      this.update();
      this.trackIndex = 0;
      this.setSource();
      if (wasPlaying) this.audio.play();
      this.trigger('albumChange');
      return this;      
    };
    Lap.prototype.setAlbum = function(index) {
      if (index <= 0) {
        this.albumIndex = 0;
      } else if (index >= this.albumCount) {
        this.albumIndex = this.albumCount-1;
      } else {
        this.albumIndex = index;
      }
      this.update();
      this.setTrack(this.lib[this.albumIndex].startingTrackIndex || 0);
      this.trigger('albumChange');
      return this;      
    };

    function _seek(lap, forward) {
      var applied;
      if (forward) {
        applied = lap.audio.currentTime + lap.settings.seekInterval;
        lap.audio.currentTime = (applied >= lap.audio.duration) ? lap.audio.duration : applied;
      } else {
        applied = lap.audio.currentTime + (lap.settings.seekInterval * -1);
        lap.audio.currentTime = (applied <= 0) ? 0 : applied;
      }
      lap.trigger('seek');
      return lap;      
    }    
    Lap.prototype.seekBackward = function() {
      if (!this.SEEKING) return this;
      var lap = this;
      this.MOUSEDOWN_TIMER = setInterval(function() {
        lap.seek(lap, false);
      }, lap.settings.seekTime);
      return lap;      
    };
    Lap.prototype.seekForward = function() {
      if (!this.SEEKING) return this;
      var lap = this;
      this.MOUSEDOWN_TIMER = setInterval(function() {
        lap.seek(lap, true);
      }, lap.settings.seekTime);
      return lap;      
    };

    Lap.prototype.formatTracklist = function() {
      // don't fuck with the user's tracklist
      if (tooly.truthy(this.tracklist)) {
        return this;
      }
      var lap = this,
          re = lap.replacement, 
          tracklist = [], 
          i = 0;
      for (; i < lap.trackCount; i++) {
        tracklist[i] = tooly.sliceRel(tooly.stripExtension(lap.files[i]));
        if (tooly.truthy(re)) {
          tracklist[i] = tracklist[i].replace(re[0], re[1]);
        }
        tracklist[i] = tracklist[i].trim();
      }
      lap.tracklist = tracklist;
      return lap;
    };

    Lap.prototype.bufferFormatted = function() {
      if (!this.audio) return 0;

      var buffered,
          audio = this.audio;

      try {
        buffered = audio.buffered.end(audio.buffered.length-1);
      } catch(e) {
        return 0;
      }
      var formatted = Math.round(tooly.scale(buffered, 0, audio.duration, 0, 100));
      // TODO: why are we returning 0?
      return isNaN(formatted) ? 0 : formatted;      
    };

    Lap.prototype.currentTimeFormatted = function() {
      if (isNaN(this.audio.duration)) {
        return '00:00';
      }      
      var formatted = tooly.formatTime(Math.floor(this.audio.currentTime.toFixed(1)));
      if (this.audio.duration < 3600 || formatted === '00:00:00') {
        return formatted.slice(3); // nn:nn
      }
      return formatted;      
    };

    Lap.prototype.durationFormatted = function() {
      if (isNaN(this.audio.duration)) {
        return '00:00';
      }
      var formatted = tooly.formatTime(Math.floor(this.audio.duration.toFixed(1)));
      if (this.audio.duration < 3600 || formatted === '00:00:00') {
        return formatted.slice(3); // nn:nn
      }
      return formatted;      
    };

    Lap.prototype.trackNumberFormatted = function(n) {
      var count = (''+this.trackCount).length - (''+n).length;
      return tooly.repeat('0', count) + n + this.settings.trackNumberPostfix;      
    };

    return Lap;
  }


})();

(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapUtil', {
    level: 0,
    nameStyle: 'color:brown'
  });
  /*<<*/

  angular.module('lnet.lap').factory('lapUtil', lapUtil);
  lapUtil.$inject = ['tooly'];

  function lapUtil(tooly) {

    var _body, _isMobileRegExp;

    function _isNode(el) {
      return el && (el.nodeType === 1 || el.nodeType === 9);
    }

    function _query(which, selector, context) {
      var node;
      if (context) {
        node = (_isNode(context) ? context : context[0])[which](selector);
      } else {
        node = document[which](selector);
      }
      return angular.element(node);

    }

    return {

      isMobile: function() {
        if (!_isMobileRegExp) {
          _isMobileRegExp = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        }
        return _isMobileRegExp.test(navigator.userAgent);
      },

      safeApply: function(scope) {
        var phase = scope.$root.$$phase;
        if (phase !== '$apply' && phase !== '$digest') {
          scope.$apply();
        }
      },

      /**
       * Used to avoid duplicate selections of body element
       * @return {jqLite}
       */
      body: function() {
        if (!_body) {
          _body = this.element('body');
        }
        return _body;
      },

      /**
       * @return {Boolean}    true if el is an instance of Node
       */
      isNode: function(el) {
        return _isNode(el);
      },

      /**
       * angular's jqLite does not provide lookup by class,
       * so here we have an abstraction that works exactly like HTMLElement.querySelector,
       * only returning an angular.element instead. for querySelectorAll use #elementAll
       */
      element: function(selector, context) {
        return _query('querySelector', selector, context);
      },
      elementAll: function(selector, context) {
        return _query('querySelectorAll', selector, context);
      }

    };
  }

})();

(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapContainer', { 
    outputTimestamp: false,
    level: 0,
    nameStyle: 'color:purple' 
  });
  /*<<*/
  
  angular.module('lnet.lap').directive('lapContainer', lapContainer);
  lapContainer.$inject = ['$templateCache', '$parse', 'Lap', 'lapUtil'];

  function lapContainer($templateCache, $parse, Lap, lapUtil) {
    return {
      restrict: 'E',
      scope: {
        src: '@'
      },
      template: $templateCache.get('lap-controls.html'),
      link: function(scope, element, attrs) {

        scope.ready = false;
        scope.discogActive = false;
        scope.isMobile = lapUtil.isMobile();

        // element.addClass('lap');

        if (!attrs.hasOwnProperty('src')) {
          return console.warn('lap-container needs a src attribute. Exiting.');
        }

        scope.$watch('src', function(src) {
          var ch = src.charAt(0);

          if (ch === '[' || ch === '{') {
            /*>>*/logger.debug('src.charAt(0) === `[` or `}`. Evaluating...');/*<<*/
            src = scope.$eval(src);
          }

          Lap.getLib(src).then(function(lib) {
            /* TODO: options should be able to be passed from user */
            new Lap(element, lib, {
              discogPlaylistExclusive: true,
              plugins: [],
              prependTrackNumbers: true,
              replacementText: void 0,
              startingAlbumIndex: 0,
              startingTrackIndex: 0,
              seekInterval: 5, 
              seekTime: 250,
              selectors: {},
              selectorPrefix: 'lap',
              trackNumberPostfix: ' - ',
              useNativeProgress: false,
              useNativeSeekRange: false,
              useNativeVolumeRange: false,
              volumeInterval: 0.05,              
              callbacks: {
                load: function() {
                  scope.lap = this;
                  scope.ready = true;
                }
              }
            }, false, true);
          }); 

        });
      }
    };
  }

})();

(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapDiscogDirective', {
    outputTimestamp: false,
    level: 0,
    nameStyle: 'color:rgb(124, 0, 33);' 
  });
  /*<<*/
  
  angular.module('lnet.lap').directive('lapDiscog', lapDiscog);
  lapDiscog.$inject = ['$templateCache', 'tooly'];

  function lapDiscog($templateCache, tooly) {
    return {
      restrict: 'E',
      template: $templateCache.get('lap-discog.html'),
      scope: true,
      link: function(scope, element, attrs) {

        var lap;

        var off = scope.$watch('lap', function(newValue, oldValue) {
          if (!newValue) return;
          lap = newValue;
          logger.debug('watch >> lap: %o', lap);
          init();
          off();
        });        

        function init() {
          update();
          scope.showDiscog = true;
        }

        function update() {
          scope.lib = lap.lib.map(function(item) {
            return { 
              cover: item.cover, 
              album: item.album 
            };
          });
        }

        scope.loadAlbum = function(index) {
          lap.setAlbum(index);
          scope.$emit('lnet.lap.discogItemChosen', true);
        };
      }        
    };
  }
  
})();

(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapPlaylistDirective', {
    outputTimestamp: false,
    level: 0,
    nameStyle: 'color:rgb(124, 126, 33);' 
  });
  /*<<*/
  
  angular.module('lnet.lap').directive('lapPlaylist', lapPlaylist);
  lapPlaylist.$inject = ['$templateCache', 'tooly', 'lapUtil'];

  function lapPlaylist($templateCache, tooly, lapUtil) {
    return {
      restrict: 'E',
      template: $templateCache.get('lap-playlist.html'),
      scope: true,
      link: function(scope, element, attrs) {

        var lap;

        var off = scope.$watch('lap', function(newValue, oldValue) {
          if (!newValue) return;
          lap = newValue;
          logger.debug('watch >> lap: %o', lap);
          init();
          off();
        });        

        function init() {

          update();
          scope.showPlayist = true;
          
          lap
            .on('albumChange', function() {
              update();
              lapUtil.safeApply(scope);
            })
            .on('trackChange', function() {
              lapUtil.safeApply(scope);
            });
        }

        scope.setTrack = function(index) {
          lap.setTrack(index);
        };

        function update() {
          var len = String(lap.trackCount).length;
          scope.trackNumbers = lap.tracklist.map(function(track, i) {
            return tooly.lpad(String(i+1), len, '0');
          });
          scope.tracklist = lap.tracklist;
          scope.cover = lap.cover;
        }
      }
    };
  }


})();

(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapProgSeek', {
    level: 0,
    nameStyle: 'color:indigo'
  });
  /*<<*/

  angular.module('lnet.lap').directive('progSeek', progSeek);
  progSeek.$inject = ['$timeout', 'tooly'];

  var _id = _id || 0;

  function progSeek($timeout, tooly) {

    function makeEl(name, id) {
      return angular.element('<div class="prog-seek__' + name +
        '" id="prog-seek__'+ name + '--' + id + '">');
    }

    return {
      restrict: 'E',
      link: function(scope, element, attrs) {

        var id = _id++,
            container = makeEl('container', id),
            inner     = makeEl('inner',     id),
            track     = makeEl('track',     id),
            progress  = makeEl('progress',  id),
            handle    = makeEl('handle',    id),
            dragging = false,
            timeUpdating = false,
            dragdealer, lap, audio;

        if (scope.options && !angular.equals(scope.options, {})) {
          var o = scope.options;
          if (o.progressColor) progress.css('background-color', o.progressColor);
          if (o.handleColor) handle.css('background-color', o.handleColor);
          if (o.trackColor) track.css('background-color', o.trackColor);
        }

        element.append(container.append(inner
          .append(track)
          .append(progress)
          .append(handle)));

        var off = scope.$watch('ready', function(newValue, oldValue) {
          if (!newValue) return;
          off();


          lap = scope.$parent.lap;
          /*>>*/logger.debug('ready >> lap: %o', lap);/*<<*/
          audio = lap.audio;

          dragdealer = new Dragdealer('prog-seek__container--' + id, {
            handleClass: 'prog-seek__handle',
            dragStartCallback: function(x, y) {
              dragging = true;
            },
            dragStopCallback: function(x, y) {
              audio.currentTime = tooly.scale(x, 0, 1, 0, audio.duration);
              dragging = false;
            }
          });          

          audio.addEventListener('timeupdate', function(e) {
            if (!dragging) {
              dragdealer.setValue(tooly.scale(audio.currentTime, 0, audio.duration, 0, 1));
            }
          });
          audio.addEventListener('progress', function(e) {
            var x = +lap.bufferFormatted();
            progress.css('width', x + '%');
          });
        });
      }
    };
  }
})();

(function(undefined) { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapVolumeRangeRevealer', { 
    nameStyle: 'color:orangered',
    level: 0 
  });
  /*<<*/

  angular.module('lnet.lap').directive('lapVolumeRangeRevealer', lapVolumeRangeRevealer);
  lapVolumeRangeRevealer.$inject = ['$document', '$timeout', '$interval', 'tooly', 'Lap', 'lapUtil'];

  function lapVolumeRangeRevealer($document, $timeout, $interval, tooly, Lap, lapUtil) {
    

    if (lapUtil.isMobile()) return angular.noop;

    /**
     * Lap plugin providing support for hiding and showing
     * of a native range input on speaker-icon hover - like Youtube.
     * Hover over the speaker icon and the volume range appears; move away, 
     * it is again hidden.
     * 
     * @param {Lap}    lap       the Lap instance
     * @param {jqLite} element
     * @constructor
     */
    Lap.VolumeRangeRevealer = function(lap, element) {
      var thiz = this;
      thiz.lap = lap;
      thiz.element = element;
      return thiz;      
    };  

    Lap.VolumeRangeRevealer.prototype.levelClasses = [
      'lap-i-volume-off',
      'lap-i-volume-low',
      'lap-i-volume-mid',
      'lap-i-volume-high',
      'lap-i-volume-max'
    ];

    Lap.VolumeRangeRevealer.prototype.init = function(scope, attrs) {
      var thiz = this,
          lap = thiz.lap,
          lapContainer = angular.element(lap.container)[0],
          speaker = lapUtil.element('.lap__speaker', lapContainer),
          speakerContainer = lapUtil.element('.lap__speaker__container', lapContainer),
          volumeRange = lap.els.volumeRange,
          rangeWidth = thiz.element[0].querySelector('.lap__volume-range__track').width,
          nonVolumeControls = lapUtil.elementAll('.lap__non-v', lapContainer),
          MOUSEDOWN, SPEAKER_ENTERED, RANGE_ENTERED;

      if (!volumeRange || !volumeRange.length) {
        throw new Lap.PluginContructorError(
          'Lap.VolumeRangeRevealer cannot init without Lap#els.volumeRange element');
      }

      // TODO: these would be better as callback hooks on CanvasVolumeRange events
      volumeRange
        .on('mouseenter', function() {
          RANGE_ENTERED = true;
        })
        .on('mousedown', function() {
          MOUSEDOWN = true;
        })
        .on('mousemove', function(e) {
          if (!MOUSEDOWN) return;
          var v = tooly.scale(e.offsetX, 0, rangeWidth, 0, 100),
              classNum = 0;
          if (v > 0) {
            var n = tooly.scale(v, 0, 100, 0, thiz.levelClasses.length-1);
            classNum = Math.ceil(n); 
          }

          /*>>*/logger.debug('rangeWidth: %o, e.offsetX: %o, v: %o, classNum: %o, thiz.levelClasses[classNum]: %o', 
            rangeWidth, e.offsetX, v, classNum, thiz.levelClasses[classNum]);/*<<*/

          speaker.removeClass(thiz.levelClasses.filter(function(c) {
            return c !== thiz.levelClasses[classNum];
          }).join(' ')).addClass(thiz.levelClasses[classNum]);
        })
        .on('mouseleave', function() {
          RANGE_ENTERED = false;
          if (!MOUSEDOWN) release();
        });


      speaker
        .on('mouseenter', function() {
          /*>>*/logger.debug('scope.vrangeDragging: %o', scope.vrangeDragging);/*<<*/
          /*>>*/logger.debug('attrs.vrangeDragging: %o', attrs.vrangeDragging);/*<<*/

          if (!SPEAKER_ENTERED && !RANGE_ENTERED) {
            thiz.element.removeClass(lap.selectors.state.hidden);
            nonVolumeControls.addClass(lap.selectors.state.hidden);
            SPEAKER_ENTERED = true;
          }
        })
        .on('mouseleave', function(e) {
          SPEAKER_ENTERED = false;
          // allow time to move mouse into the range element
          $timeout(function() {
            if (!SPEAKER_ENTERED && !RANGE_ENTERED) {
              release();
            }
          }, 1000);
        });


      // add the mouseup to the body so we can inc/dec volume by dragging
      // left or right regardless if we're in the same horizontal span as the slider
      // or not
      lapUtil.body().on('mouseup', function() {
        MOUSEDOWN = false;
        if (!RANGE_ENTERED && !SPEAKER_ENTERED) release();
      });

      function release() {
        thiz.element.addClass(lap.selectors.state.hidden);
        nonVolumeControls.removeClass(lap.selectors.state.hidden);
      }

      lap.registerPlugin('VolumeRangeRevealer', thiz);

      /*>>*/
      logger.debug('post init >> this: %o', thiz);
      /*<<*/
    };

    return {
      restrict: 'A',
      link: function(scope, element, attrs) {

        var revealer;

        var unwatch = scope.$watch('ready', function(newValue, oldValue) {
          if (!newValue) return;

          /*>>*/logger.debug('ready >> lap: %o', scope.lap);/*<<*/

          revealer = new Lap.VolumeRangeRevealer(scope.lap, element);
          unwatch();

          unwatch = scope.$watch('vRangeReady', function(newValue, oldValue) {
            if (!newValue) return;

            /*>>*/logger.debug('vRangeReady >> lap: %o', scope.lap);/*<<*/

            revealer.init(scope, attrs);
            unwatch();
          });
        });
      }
    };
  }


})();

(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lap-volume-range', {
    level: 0,
    nameStyle: 'color:indigo'
  });
  /*<<*/

  angular.module('lnet.lap').directive('lapVolumeRange', lapVolumeRange);
  lapVolumeRange.$inject = ['tooly'];

  var _id = _id || 0;

  function lapVolumeRange() {

    function makeEl(name, id) {
      return angular.element('<div class="lap__volume-range__' + name +
        '" id="lap__volume-range__'+ name + '--' + id + '">');
    }

    return {
      restrict: 'E',
      link: function(scope, element, attrs) {
          var id = _id++,
            container = makeEl('container', id),
            inner     = makeEl('inner',     id),
            track     = makeEl('track',     id),
            handle    = makeEl('handle',    id),
            dragging = false,
            // timeUpdating = false,
            dragdealer, lap, audio;

        if (scope.options && !angular.equals(scope.options, {})) {
          var o = scope.options;
          // if (o.progressColor) progress.css('background-color', o.progressColor);
          if (o.handleColor) handle.css('background-color', o.handleColor);
          if (o.trackColor) track.css('background-color', o.trackColor);
        }

        element.append(container.append(inner
          .append(track)
          // .append(progress)
          .append(handle)));

        var off = scope.$watch('ready', function(newValue, oldValue) {
          if (!newValue) return;
          off();

          lap = scope.$parent.lap;
          /*>>*/logger.debug('ready >> lap: %o', lap);/*<<*/
          audio = lap.audio;

          dragdealer = new Dragdealer('lap-volume-range__container--' + id, {
            handleClass: 'lap__volume-range__handle',
            dragStartCallback: function(x, y) {
              dragging = true;
              scope.vrangeDragging = true;
              scope.$apply();
            },
            dragStopCallback: function(x, y) {
              // audio.volume = tooly.scale(x, 0, 1, 0, audio.duration);
              dragging = false;
              scope.vrangeDragging = false;
              scope.$apply();
            }
          });

          scope.vRangeReady = true;

          audio.addEventListener('volumeupdate', function(e) {
            /*>>*/logger.debug('volumeupdate fired');/*<<*/
            // if (!dragging) {
            //   dragdealer.setValue(tooly.scale(audio.currentTime, 0, audio.duration, 0, 1));
            // }
          });
          // audio.addEventListener('progress', function(e) {
          //   var x = +lap.bufferFormatted();
          //   progress.css('width', x + '%');
          // });
          
        });
      }
    };
  }

})();