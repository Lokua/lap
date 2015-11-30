const IS_MOBILE = false

export default class Lap extends Bus {

  constructor(element, lib, options, postpone=false) {
    super()

    // default id to zero-based index incrementer
    this.id = options && options.id ? options.id : Lap.$$instances.length
    Lap.$$instances[this.id] = this

    this.element = typeof element === 'string'
      ? document.querySelector(element)
      : element

    this.setLib(lib)

    this.settings = {}
    if (options) {
      Lap.each(Lap.$$defaultSettings, (val, key) => {
        if (options.hasOwnProperty(key)) this.settings[key] = options[key]
        else this.settings[key] = val
      })
    } else {
      this.settings = Lap.$$defaultSettings
    }

    if (!postpone) this.initialize()

    if (this.settings.debug) {
      const echo = e => {
        this.on(e, () => console.info('%c%s handler called', 'color:#800080', e))
      }
      echo('load')
      echo('play')
      echo('pause')
      echo('seek')
      echo('trackChange')
      echo('albumChange')
      echo('volumeChange')
    }

    return this
  }

  static getInstance(id) {
    return Lap.$$instances[id]
  }

  static addClass(el, _class) {
    if (!el) return console.warn(`${el} is not defined`)
    if (!el.className) {
      return (el.className += ' ' + _class)
    }
    const classNames = el.className
    const newClasses = _class
      .split(/\s+/)
      .filter(n => classNames.indexOf(n) === -1)
      .join(' ')
    el.className += ' ' + newClasses
    return Lap
  }

  static removeClass(el, _class) {
    if (!el) return console.warn(`${el} is not defined`)
    // uncomment for multiple class removal
    // _class = `(${_class.split(/\s+/).join('|')})`
    
    // TODO: cache?
    const re = new RegExp('\\s*' + _class + '\\s*(![\\w\\W])?', 'g')
    el.className = el.className.replace(re, ' ').trim()
    return Lap
  }

  static formatTime(time) {
    let h = Math.floor(time / 3600)
    let m = Math.floor((time - (h * 3600)) / 60)
    let s = Math.floor(time - (h * 3600) - (m * 60))
    if (h < 10) h = '0' + h
    if (m < 10) m = '0' + m
    if (s < 10) s = '0' + s
    return h + ':' + m + ':' + s
  }

  static each(obj, fn, ctx) {
    const keys = Object.keys(obj)
    let i = 0, len = keys.length
    for (; i < len; i++) fn.call(ctx, obj[keys[i]], keys[i], obj)
  }

  setLib(lib) {
    const type = typeof lib
    const isArray = lib instanceof Array
    if (isArray) {
      this.lib = lib
    } else if (type === 'object') {
      this.lib = [lib]
    } else if (type === 'string' && Lap.$$audioExtensionRegExp.test(lib)) {
      this.lib = [{ files: [lib] }]
    } else {
      throw new Error(`${lib} must be an array, object, or string`)
    }
    return this
  }

  initialize() {

    // state
    this.seeking = false
    this.volumeChanging = false
    this.mouseDownTimer = 0
    this.playing = false

    this.plugins = this.settings.plugins

    this.update()
    this.$$initAudio()
    this.$$initElements()
    this.$$addAudioListeners()
    if (!IS_MOBILE) this.$$addVolumeListeners()
    this.$$addSeekListeners()
    this.$$addListeners()
    // Lap.each(this.settings.callbacks, (fn, key) => this.on(key, fn))
    Object.keys(this.settings.callbacks).forEach(key => this.on(key, this.settings.callbacks[key]))
    this.$$activatePlugins()
    this.trigger('load')
  }

  /**
   * Configures instance variables relative to the current album.
   * Called on initialization and whenever an album is changed.
   *
   * @return {Lap} this
   */
  update() {
    this.albumIndex = this.settings.startingAlbumIndex || 0
    this.albumCount = this.lib.length
    this.trackIndex = this.settings.startingTrackIndex || 0
    this.playlistPopulated = false

    const currentLibItem = this.lib[this.albumIndex]

    const keys = ['artist', 'album', 'files', 'cover', 'tracklist', 'replacement']
    keys.forEach(key => this[key] = currentLibItem[key])

    this.trackCount = this.files.length

    // replacement === [regexp, replacement, optional_flags]
    if (this.replacement) {
      let re = this.replacement
      // for replacment without value specified, empty string 
      if (typeof re === 'string') re = [re, '']
      // re may contain string-wrapped regexp (from json), convert if so
      if (re instanceof Array) {
        const flags = re[2]
        re[0] = new RegExp(re[0], flags !== undefined ? flags : 'g')
      }
      this.replacement = re
    }
    this.formatTracklist()
    return this
  }

  /**
   * Instantiate every plugin's contructor with this Lap instance
   *
   * @return {Lap} this
   */
  $$activatePlugins() {
    this.plugins.forEach((plugin, i) => this.plugins[i] = new plugin(this))
    return this
  }

  $$initAudio() {
    this.audio = new Audio()
    this.audio.preload = 'auto'
    let fileType = this.files[this.trackIndex]
    fileType = fileType.slice(fileType.lastIndexOf('.')+1)
    const canPlay = this.audio.canPlayType('audio/' + fileType)
    if (canPlay === 'probably' || canPlay === 'maybe') {
      this.$$updateSource()
      this.audio.volume = 1
    } else {
      // TODO: return a flag to signal skipping the rest of the initialization process
      console.warn(`This browser does not support ${fileType} playback.`)
    }
  }

  $$updateSource() {
    this.audio.src = this.files[this.trackIndex]
    return this
  }

  $$initElements() {
    this.els = {}
    this.selectors = { state: {} }
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
    Object.keys(Lap.$$defaultSelectors).forEach(key => {
      if (key !== 'state') {
        if (this.settings.selectors.hasOwnProperty[key]) {
          this.selectors[key] = this.settings.selectors[key]
        } else {
          this.selectors[key] = Lap.$$defaultSelectors[key]
        }

        const el = this.element.querySelector(`.${this.selectors[key]}`)
        if (el) this.els[key] = el

      } else {
        const hasStateOverrides = !!this.settings.selectors.state
        Object.keys(Lap.$$defaultSelectors.state).forEach(k => {
          if (hasStateOverrides && this.settings.state.hasOwnProperty[k]) {
            this.selectors.state[k] = this.settings.state[k]
          } else {
            this.selectors.state[k] = Lap.$$defaultSelectors.state[k]
          }
        })
      }
    })
  }

  /**
   * A wrapper around this Lap instances `audio.addEventListener` that 
   * ensures handlers are cached for later removal in the `Lap#destroy` call
   */
  addAudioListener(event, listener) {
    this.audioListeners = this.audioListeners || {}
    this.audioListeners[event] = this.audioListeners[event] || []

    const bound = listener.bind(this)
    this.audioListeners[event].push(bound)
    this.audio.addEventListener(event, bound)
  }

  $$addAudioListeners() {
    const audio = this.audio
    const els = this.els
    const nativeProgress = !!(this.settings.useNativeProgress && els.progress)

    this.audioListeners = {}

    const _addListener = (condition, event, listener) => {
      if (condition) this.addAudioListener(event, listener)
    }

    _addListener(!!(els.buffered || nativeProgress), 'progress', () => {
      // TODO: verify if this really needs to be type cast...
      var buffered = +this.bufferFormatted()
      if (els.buffered) els.buffered.innerHTML = buffered
      if (nativeProgress) els.progress.value = buffered
    })

    _addListener(!!els.currentTime, 'timeupdate', () => {
      els.currentTime.innerHTML = this.currentTimeFormatted()
    })

    _addListener(!!els.duration, 'durationchange', () => {
      els.duration.innerHTML = this.durationFormatted()
    })

    _addListener(true, 'ended', () => {
      if (this.playing) {
        this.next()
        audio.play()
      }
    })

    return this
  }

  addListener(elementName, event, listener) {
    // ie. listeners = { seekRange: { click: [handlers], mousedown: [handlers], ... }, ... }
    this.listeners = this.listeners || {}
    this.listeners[elementName] = this.listeners[elementName] || {}
    this.listeners[elementName][event] = this.listeners[elementName][event] || []

    const bound = listener.bind(this)
    this.listeners[elementName][event].push(bound)
    this.els[elementName].addEventListener(event, bound)
  }

  $$addListeners() {
    const els = this.els
    this.listeners = {}

    // helper. ensure we aren't adding listeners to non-existent elements
    const _addListener = (elementName, event, listener) => {
      if (els[elementName]) this.addListener(elementName, event, this[listener])
    }

    _addListener('playPause', 'click', 'togglePlay')
    _addListener('prev', 'click', 'prev')
    _addListener('next', 'click', 'next')
    _addListener('prevAlbum', 'click', 'prevAlbum')
    _addListener('nextAlbum', 'click', 'nextAlbum')
    _addListener('volumeUp', 'click', 'incVolume')
    _addListener('volumeDown', 'click', 'decVolume')
    // _addListener('discog', 'click', 'discogClick')
    // _addListener('playlist', 'click', 'playlistClick')

    const _if = (elementName, fn) => {
      if (this.els[elementName]) {
        if (typeof fn === 'string') {
          this[fn]()
        } else {
          // anonymous
          fn()
        }
      }
    }

    this.on('load', () => {
      _if('trackTitle', 'updateTrackTitleEl')
      _if('trackNumber', 'updateTrackNumberEl')
      _if('artist', 'updateArtistEl')
      _if('album', 'updateAlbumEl')
      _if('cover', 'updateCover')
      _if('playPause', () => {
        const s = this.selectors.state
        const pp = els.playPause
        Lap.addClass(pp, s.paused)
        this.on('play', () => Lap.removeClass(pp, s.paused).addClass(pp, s.playing))
        this.on('pause', () => Lap.removeClass(pp, s.playing).addClass(pp, s.paused))
      })
    })

    this.on('trackChange', () => {
      _if('trackTitle', 'updateTrackTitleEl')
      _if('trackNumber', 'updateTrackNumberEl')
      _if('currentTime', () => els.currentTime.innerHTML = this.currentTimeFormatted())
      _if('duration', () => els.duration.innerHTML = this.durationFormatted())
    })

    this.on('albumChange', () => {
      _if('trackTitle', 'updateTrackTitleEl')
      _if('trackNumber', 'updateTrackNumberEl')
      _if('artist', 'updateArtistEl')
      _if('album', 'updateAlbumEl')
      _if('cover', 'updateCover')
    })
  }

  $$addSeekListeners() {
    const els = this.els
    const audio = this.audio
    const seekRange = els.seekRange
    const nativeSeek = !!(this.settings.useNativeSeekRange && seekRange && seekRange.els.length)

    if (nativeSeek) {
      // TODO: put us in listeners cache...
      audio.addEventListener('timeupdate', e => {
        if (!this.seeking) {
          seekRange.get(0).value = _.scale(audio.currentTime, 0, audio.duration, 0, 100)
        }
      })
      seekRange.addEventListener('mousedown', e => {
        this.seeking = true
      })
      seekRange.addEventListener('mouseup', e => {
        var el = seekRange.get(0)
        if (!el.value) this.logger.debug('what the fuck! ' + el)
        audio.currentTime = _.scale(el.value, 0, el.max, 0, audio.duration)
        this.trigger('seek')
        this.seeking = false
      })

    } else { // using buttons
      [els.seekForward, els.seekBackward].forEach(el => {
        if (!el) return
        // TODO: put me in listeners cache...
        el.addEventListener('mousedown', e => {
          this.seeking = true
          // if ($(e.target).hasClass(this.selectors.seekForward)) {
          if (e.target.className.indexOf(this.selectors.seekForward) > -1) {
            this.seekForward()
          } else {
            this.seekBackward()
          }
        })
        el.addEventListener('mouseup', e => {
          this.seeking = false
          clearTimeout(this.mouseDownTimer)
        })
      })
    }
  }

  $$addVolumeListeners() {
    if (IS_MOBILE) return this

    const lap = this
    const els = this.els
    const audio = this.audio
    const vslider = els.volumeRange

    if (this.settings.useNativeVolumeRange && vslider && vslider.els.length) {
      audio.addEventListener('volumechange', () => {
        if (!this.volumeChanging) {
          vslider.get(0).value = this.volumeFormatted()
        }
      })
      vslider
        .on('mousedown', () => {
          this.volumeChanging = true
        })
        .on('mouseup', () => {
          audio.volume = vslider.get(0).value * 0.01
          this.trigger('volumeChange')
          this.volumeChanging = false
        })
    }
  }

  incVolume() {
    if (IS_MOBILE) return this

    this.setVolume(true)
    return this
  }

  decVolume() {
    if (IS_MOBILE) return this

    this.setVolume(false)
    return this
  }

  setVolume(up) {
    if (IS_MOBILE) return this

    var vol = this.audio.volume,
        interval = this.settings.volumeInterval
    if (up) {
      this.audio.volume = (vol + interval >= 1) ? 1 : vol + interval
    } else {
      this.audio.volume = (vol - interval <= 0) ? 0 : vol - interval
    }
    this.trigger('volumeChange')
    return this
  }

  volumeFormatted() {
    return Math.round(this.audio.volume * 100)
  }

  updateTrackTitleEl() {
    this.els.trackTitle.innerHTML = this.tracklist[this.trackIndex]
    return this
  }

  updateTrackNumberEl() {
    this.els.trackNumber.innerHTML = +this.trackIndex+1
    return this
  }

  updateArtistEl() {
    this.els.artist.innerHTML = this.artist
    return this
  }

  updateAlbumEl() {
    this.els.album.innerHTML = this.album
    return this
  }

  updateCover() {
    this.els.cover.src = this.cover
    return this
  }

  togglePlay() {
    this.audio.paused ? this.play() : this.pause()
    this.trigger('togglePlay')
    return this
  }

  play() {
    this.audio.play()
    this.playing = true
    this.trigger('play')
    return this
  }

  pause() {
    this.audio.pause()
    this.playing = false
    this.trigger('pause')
    return this
  }

  setTrack(index) {
    if (index <= 0) {
      this.trackIndex = 0
    } else if (index >= this.trackCount) {
      this.trackIndex = this.trackCount-1
    } else {
      this.trackIndex = index
    }
    const wasPlaying = !this.audio.paused
    this.$$updateSource()
    if (wasPlaying) this.audio.play()
    this.trigger('trackChange')
    return this
  }

  prev() {
    const wasPlaying = !this.audio.paused
    this.trackIndex = (this.trackIndex-1 < 0) ? this.trackCount-1 : this.trackIndex-1
    this.$$updateSource()
    if (wasPlaying) this.audio.play()
    this.trigger('trackChange')
    return this
  }

  next() {
    const wasPlaying = !this.audio.paused
    this.trackIndex = (this.trackIndex+1 >= this.trackCount) ? 0 : this.trackIndex+1
    this.$$updateSource()
    if (wasPlaying) this.audio.play()
    this.trigger('trackChange')
    return this
  }

  prevAlbum() {
    const wasPlaying = !this.audio.paused
    this.albumIndex = (this.albumIndex-1 < 0) ? this.albumCount-1 : this.albumIndex-1
    this.update()
    this.trackIndex = 0
    this.$$updateSource()
    if (wasPlaying) this.audio.play()
    this.trigger('albumChange')
    return this
  }

  nextAlbum() {
    const wasPlaying= !this.audio.paused
    this.albumIndex = (this.albumIndex+1 > this.albumCount-1) ? 0 : this.albumIndex+1
    this.update()
    this.trackIndex = 0
    this.$$updateSource()
    if (wasPlaying) this.audio.play()
    this.trigger('albumChange')
    return this
  }

  setAlbum(index) {
    if (index <= 0) {
      this.albumIndex = 0
    } else if (index >= this.albumCount) {
      this.albumIndex = this.albumCount-1
    } else {
      this.albumIndex = index
    }
    this.update()
    this.setTrack(this.lib[this.albumIndex].startingTrackIndex || 0)
    this.trigger('albumChange')
    return this
  }

  seekBackward() {
    if (!this.seeking) return this
    this.mouseDownTimer = setInterval(() => {
      const applied = this.audio.currentTime + (this.settings.seekInterval * -1)
      this.audio.currentTime = applied <= 0 ? 0 : applied
    }, this.settings.seekTime)
    return this
  }

  seekForward() {
    if (!this.seeking) return this
    this.mouseDownTimer = setInterval(() => {
      const applied = this.audio.currentTime + this.settings.seekInterval
      this.audio.currentTime = applied >= this.audio.duration ? this.audio.duration : applied
    }, this.settings.seekTime)
    return this
  }

  formatTracklist() {
    if (this.tracklist && this.tracklist.length) {
      return this
    }
    const re = this.replacement
    const tracklist = []
    for (let i = 0; i < this.trackCount; i++) {
      let t = this.files[i]
      // strip ext
      t = t.slice(t.lastIndexOf('.')+1)
      // get last path segment
      t = t.slice(t.lastIndexOf('/')+1)
      if (re) t = t.replace(re[0], re[1])
      tracklist[i] = t.trim()
    }
    this.tracklist = tracklist
    return this
  }

  bufferFormatted() {
    if (!this.audio) return 0

    const audio = this.audio
    let buffered

    try {
      buffered = audio.buffered.end(audio.buffered.length-1)
    } catch(e) {
      return 0
    }

    const formatted = Math.round((buffered/audio.duration)*100)
    // var formatted = Math.round(_.scale(buffered, 0, audio.duration, 0, 100))
    return isNaN(formatted) ? 0 : formatted
  }

  /** internal helper */
  $$getAudioTimeFormatted(audioProp) {
    if (isNaN(this.audio.duration)) return '00:00'
    let formatted = Lap.formatTime(Math.floor(this.audio[audioProp].toFixed(1)))
    if (this.audio.duration < 3600 || formatted === '00:00:00') {
      formatted = formatted.slice(3) // nn:nn
    }
    return formatted
  }

  currentTimeFormatted() {
    return this.$$getAudioTimeFormatted('currentTime')
    // if (isNaN(this.audio.duration)) return '00:00'
    // let formatted = Lap.formatTime(Math.floor(this.audio.currentTime.toFixed(1)))
    // if (this.audio.duration < 3600 || formatted === '00:00:00') {
    //   formatted = formatted.slice(3) // nn:nn
    // }
    // return formatted
  }

  durationFormatted() {
    return this.$$getAudioTimeFormatted('duration')
    // if (isNaN(this.audio.duration)) return '00:00'
    // let formatted = Lap.formatTime(Math.floor(this.audio.duration.toFixed(1)))
    // if (this.audio.duration < 3600 || formatted === '00:00:00') {
    //   formatted = formatted.slice(3) // nn:nn
    // }
    // return formatted
  }

  trackNumberFormatted(n) {
    var count = String(this.trackCount).length - String(n).length
    return '0'.repeat(count) + n + this.settings.trackNumberPostfix
    // return _.repeat('0', count) + n + this.settings.trackNumberPostfix
  }

  get(key, index) {
    return this.lib[index === undefined ? this.albumIndex : index][key]
  }

  /**
   * Removes all dom, audio, and internal event handlers, then deletes all properties
   * @param  {Lap} lap the Lap instance
   */
  static destroy(lap) {

    // remove dom event handlers
    Lap.each(lap.listeners, (events, elementName) => delete lap.listeners[elementName])

    // remove audio events
    Lap.each(lap.audioListeners, (listeners, event) => delete lap.audioListeners[event])

    // remove all super handlers
    lap.remove()

    // nullify elements
    Lap.each(lap.els, (element, elName) => delete lap.els[elName])

    // everything else just in case
    Lap.each(lap, (val, key) => delete lap[key])

    return null
  }
}

Lap.$$instances = []

Lap.$$audioExtensionRegExp = /mp3|wav|ogg|aiff/i

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
}

Lap.$$defaultSelectors = {
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
}

if (window) window.Lap = Lap
