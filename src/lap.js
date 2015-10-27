/*>>*/
const logger = new Logger('Lap', {
  level: 0,
  nameStyle: 'color:rgb(10, 102, 85)'
});
/*<<*/

const _ = tooly;
const $ = _.Frankie;
const IS_MOBILE = true; // temp fix as we don't give a shit about volume for now...

const $$instances = Symbol();
const $$defaultSettings = Symbol();
const $$defaultSelectors = Symbol();
const $$audioExtensionRegExp = Symbol();

export default class Lap extends Bus {

  constructor(element, lib, options, postpone=false) {
    super();
    this.id = options && options.id ? options.id : Lap[$$instances].length;
    this.element = element;
    this.container = document.querySelector(element);
    this.settings = _.extend({}, Lap[$$defaultSettings], options);
    this.lib = lib;
    if (!postpone) this.initialize();

    /*>>*/
    const echo = e => this.on(e, () => logger.info('%c%s handler called', 'color:#800080', e));
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

  static getInstance(id) {
    return Lap[$$instances][id];
  }

  static setLib(lib) {
    if (Array.isArray(lib)) return (this.lib = lib);
    if (typeof lib === 'string' && Lap[$$audioExtensionRegExp].test(lib)) {
      return (this.lib = [{ files: lib }]);
    }
    if (typeof lib === 'object') return (this.lib = [lib]);
    throw new TypeError(`${lib} must be an array, object, or string`);
  }

  initialize() {
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

    _.each(this.settings.callbacks, (fn, key) => this.on(key, fn));
    this.activatePlugins();

    /*>>*/logger.debug('initialize >> instance #%o: %o', this.id, this);/*<<*/

    this.trigger('load');
  }

  activatePlugins() {
    this.plugins.forEach((plugin, i) => {
      this.plugins[i] = new plugin(this); /* jshint ignore:line */
    });
  }

  /**
   * Configures instance variables relative to the current album.
   * Called on initialization and whenever an album is changed.
   *
   * @return {Lap} this
   */
  update() {
    this.trackIndex = this.settings.startingTrackIndex;
    this.playlistPopulated = false;

    const currentLibItem = this.lib[this.albumIndex];

    ['artist', 'album', 'files', 'cover', 'tracklist', 'replacement'].forEach(key =>
      this[key] = currentLibItem[key]);

    this.trackCount = this.files.length;

    if (this.replacement !== undefined) {
      let re = this.replacement;
      /* for replacment without value specified, empty string */
      if (_.type(re) === 'string') re = [re, ''];
      /* re may contain string-wrapped regexp (from json), convert if so */
      if (_.type(re[0]) !== 'regexp') {
        const flags = re[2];
        re[0] = new RegExp(re[0], flags !== undefined ? flags : 'g');
      }
    }
    this.formatTracklist();
    return this;
  }

  initAudio() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    const fileType = this.getFileType();
    const canPlay = this.audio.canPlayType('audio/' + fileType);
    if (canPlay === 'probably' || canPlay === 'maybe') {
      this.setSource();
      this.audio.volume = 1;
    } else {
      // TODO: return a flag to signal skipping the rest of the initialization process
      console.warn(`This browser does not support ${filetype} playback.`);
    }
  }

  setSource() {
    this.audio.src = this.files[this.trackIndex];
    return this;
  }

  getFileType() {
    const f = this.files[this.trackIndex];
    return f.substr(0, f.lastIndexOf('.'));
  }

  initElements() {
    this.els = {};
    this.selectors = Object.keys(Lap[$$defaultSelectors]).map(key => {
      return this.settings.selectors[key] || Lap[$$defaultSelectors][key];
    });
    Object.keys(this.selectors).forEach((sel, key) => {
      if (_.type(sel) === 'object') return;
      const el = document.querySelector(`.${sel}`, this.element);
      if (el) this.els[key] = el;
    });
  }

  addAudioListeners() {
    const audio = this.audio;
    const els = this.els;

    if (els.buffered || (this.settings.useNativeProgress && els.progress)) {
      audio.addEventListener('progress', () => {
        // TODO: verify if this really needs to be type cast...
        var buffered = +this.bufferFormatted();
        if (els.buffered) els.buffered.outerHTML = buffered;
        if (nativeProgress) els.progress.value = buffered;
      });
    }
    if (els.currentTime) {
      audio.addEventListener('timeupdate', () => {
        els.currentTime.outerHTML = this.currentTimeFormatted();
      });
    }
    if (els.duration) {
      audio.addEventListener('durationchange', () => {
        els.duration.outerHTML = this.durationFormatted();
      });
    }
    if (!IS_MOBILE && els.volumeRead) {
      audio.addEventListener('volumechange', () => {
        els.volumeRead.outerHTML = this.volumeFormatted();
      });
    }
    audio.addEventListener('ended', () => {
      /*>>*/logger.debug('ended > this.audio.paused: %o', this.audio.paused);/*<<*/
      if (this.PLAYING) {
        this.next();
        this.audio.play();
      }
    });

    return this;
  }

  addListeners() {
    const els = this.els;

    if (els.playPause) els.playPause.addEventListener('click', () => this.togglePlay());
    if (els.prev) els.prev.addEventListener('click', () => this.prev());
    if (els.next) els.next.addEventListener('click', () => this.next());
    if (!IS_MOBILE) {
      if (els.volumeUp) els.volumeUp.addEventListener('click', () => this.incVolume());
      if (els.volumeDown) els.volumeDown.addEventListener('click', () => this.decVolume());
    }
    if (els.prevAlbum) els.prevAlbum.addEventListener('click', () => this.prevAlbum());
    if (els.nextAlbum) els.nextAlbum.addEventListener('click', () => this.nextAlbum());
    if (els.discog) els.discog.addEventListener('click', () => this.trigger('discogClick'));
    if (els.playlist) els.playlist.addEventListener('click', () => this.trigger('playlistClick'));

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

  addSeekListeners() {
    const els = this.els;
    const audio = this.audio;
    const seekRange = els.seekRange;
    const nativeSeek = this.settings.useNativeSeekRange && seekRange && seekRange.els.length;

    if (nativeSeek) {
      audio.addEventListener('timeupdate', e => {
        if (!this.SEEKING) {
          seekRange.get(0).value = _.scale(audio.currentTime, 0, audio.duration, 0, 100);
        }
      });
      seekRange
        .on('mousedown', e => {
          this.SEEKING = true;
        })
        .on('mouseup', e => {
          var el = seekRange.get(0);
          if (!el.value) this.logger.debug('what the fuck! ' + el);
          audio.currentTime = _.scale(el.value, 0, el.max, 0, audio.duration);
          this.trigger('seek');
          this.SEEKING = false;
        });

    } else { // using buttons
      [els.seekForward, els.seekBackward].forEach(el => {
        if (!el) return;
        el
          .on('mousedown', e => {
            this.SEEKING = true;
            if ($(e.target).hasClass(this.selectors.seekForward)) {
              this.seekForward();
            } else {
              this.seekBackward();
            }
          })
          .on('mouseup', e => {
            this.SEEKING = false;
            clearTimeout(this.MOUSEDOWN_TIMER);
          });
      });
    }
  }

  addVolumeListeners() {
    if (IS_MOBILE) return this;

    const lap = this;
    const els = this.els;
    const audio = this.audio;
    const vslider = els.volumeRange;

    if (this.settings.useNativeVolumeRange && vslider && vslider.els.length) {
      audio.addEventListener('volumechange', () => {
        if (!this.VOLUME_CHANGING) {
          vslider.get(0).value = this.volumeFormatted();
        }
      });
      vslider
        .on('mousedown', () => {
          this.VOLUME_CHANGING = true;
        })
        .on('mouseup', () => {
          audio.volume = vslider.get(0).value * 0.01;
          this.trigger('volumeChange');
          this.VOLUME_CHANGING = false;
        });
    }
  }

  incVolume() {
    if (IS_MOBILE) return this;
    this.setVolume(true);
    return this;
  }

  decVolume() {
    if (IS_MOBILE) return this;
    this.setVolume(false);
    return this;
  }

  setVolume(up) {
    if (IS_MOBILE) return this;
    var vol = this.audio.volume,
        interval = this.settings.volumeInterval;
    if (up) {
      this.audio.volume = (vol + interval >= 1) ? 1 : vol + interval;
    } else {
      this.audio.volume = (vol - interval <= 0) ? 0 : vol - interval;
    }
    this.trigger('volumeChange');
    return this;
  }

  volumeFormatted() {
    return Math.round(this.audio.volume * 100);
  }

  /**
   * Add a plug-in instance to the plugins hash
   * @param  {String} key    the plugin instance identifier
   * @param  {Object} plugin the plugin instance (not the class)
   * @return {Lap}           this
   */
  registerPlugin(key, plugin) {
    this.plugins[key] = plugin;
  }

  updateTrackTitleEl() {
    this.els.trackTitle.outerHTML = this.tracklist[this.trackIndex];
    return this;
  }

  updateTrackNumberEl() {
    this.els.trackNumber.outerHTML = +this.trackIndex+1;
    return this;
  }

  updateArtistEl() {
    this.els.artist.outerHTML = this.artist;
    return this;
  }

  updateAlbumEl() {
    this.els.album.outerHTML = this.album;
    return this;
  }

  updateCover() {
    this.els.cover.get(0).src = this.cover;
    return this;
  }

  togglePlay() {
    this.audio.paused ? this.play() : this.pause();
    this.trigger('togglePlay');
    return this;
  }

  play() {
    this.audio.play();
    this.PLAYING = true;
    this.trigger('play');
    return this;
  }

  pause() {
    this.audio.pause();
    this.PLAYING = false;
    this.trigger('pause');
    return this;
  }

  setTrack(index) {
    if (index <= 0) {
      this.trackIndex = 0;
    } else if (index >= this.trackCount) {
      this.trackIndex = this.trackCount-1;
    } else {
      this.trackIndex = index;
    }
    const wasPlaying = !this.audio.paused;
    this.setSource();
    if (wasPlaying) this.audio.play();
    this.trigger('trackChange');
    return this;
  }

  prev() {
    const wasPlaying = !this.audio.paused;
    this.trackIndex = (this.trackIndex-1 < 0) ? this.trackCount-1 : this.trackIndex-1;
    this.setSource();
    if (wasPlaying) this.audio.play();
    this.trigger('trackChange');
    return this;
  }

  next() {
    const wasPlaying = !this.audio.paused;
    this.trackIndex = (this.trackIndex+1 >= this.trackCount) ? 0 : this.trackIndex+1;
    this.setSource();
    if (wasPlaying) this.audio.play();
    this.trigger('trackChange');
    return this;
  }

  prevAlbum() {
    const wasPlaying = !this.audio.paused;
    this.albumIndex = (this.albumIndex-1 < 0) ? this.albumCount-1 : this.albumIndex-1;
    this.update();
    this.trackIndex = 0;
    this.setSource();
    if (wasPlaying) this.audio.play();
    this.trigger('albumChange');
    return this;
  }
  nextAlbum() {
    const wasPlaying= !this.audio.paused;
    this.albumIndex = (this.albumIndex+1 > this.albumCount-1) ? 0 : this.albumIndex+1;
    this.update();
    this.trackIndex = 0;
    this.setSource();
    if (wasPlaying) this.audio.play();
    this.trigger('albumChange');
    return this;
  }
  setAlbum(index) {
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
  }

  seekBackward() {
    if (!this.SEEKING) return this;
    this.MOUSEDOWN_TIMER = setInterval(() => {
      const applied = this.audio.currentTime + (this.settings.seekInterval * -1);
      this.audio.currentTime = applied <= 0 ? 0 : applied;
    }, this.settings.seekTime);
    return this;
  }

  seekForward() {
    if (!this.SEEKING) return this;
    this.MOUSEDOWN_TIMER = setInterval(() => {
      const applied = this.audio.currentTime + this.settings.seekInterval;
      this.audio.currentTime = applied >= this.audio.duration ? this.audio.duration : applied;
    }, this.settings.seekTime);
    return this;
  }

  formatTracklist() {
    /* don't fuck with the user's tracklist */
    if (_.truthy(this.tracklist)) {
      return this;
    }
    const re = this.replacement;
    const tracklist = []; // let?
    for (let i = 0; i < this.trackCount; i++) {
      tracklist[i] = _.sliceRel(_.stripExtension(this.files[i]));
      if (_.truthy(re)) {
        tracklist[i] = tracklist[i].replace(re[0], re[1]);
      }
      tracklist[i] = tracklist[i].trim();
    }
    this.tracklist = tracklist;
    return this;
  }

  bufferFormatted() {
    if (!this.audio) return 0;

    const audio = this.audio;
    let buffered;

    try {
      buffered = audio.buffered.end(audio.buffered.length-1);
    } catch(e) {
      return 0;
    }
    var formatted = Math.round(_.scale(buffered, 0, audio.duration, 0, 100));
    return isNaN(formatted) ? 0 : formatted;
  }

  currentTimeFormatted() {
    if (isNaN(this.audio.duration)) {
      return '00:00';
    }
    var formatted = _.formatTime(Math.floor(this.audio.currentTime.toFixed(1)));
    if (this.audio.duration < 3600 || formatted === '00:00:00') {
      return formatted.slice(3); // nn:nn
    }
    return formatted;
  }

  durationFormatted() {
    if (isNaN(this.audio.duration)) {
      return '00:00';
    }
    var formatted = _.formatTime(Math.floor(this.audio.duration.toFixed(1)));
    if (this.audio.duration < 3600 || formatted === '00:00:00') {
      return formatted.slice(3); // nn:nn
    }
    return formatted;
  }

  trackNumberFormatted(n) {
    var count = (''+this.trackCount).length - (''+n).length;
    return _.repeat('0', count) + n + this.settings.trackNumberPostfix;
  }

  /**
   * Convenience method to grab a property from the currently cued album. A
   * second argument can be passed to choose a specific album.
   * @method get
   * @param  {String} what the property
   * @return {[type]}      [description]
   */
  get(key, index) {
    return this.lib[index === undefined ? this.albumIndex : index][key];
  }

}

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
  $: !() => {
    if (tooly && tooly.Frankie) return tooly.Frankie;
    return jQuery || Zepto || Bondo || new Error('Could not find a default selector library');
  }()
};

Lap[$$defaultSelectors] = {
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
