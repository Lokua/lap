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
export default class Lap extends Bus {

  /**
   * Class constructor.
   * @param  {String|HTML Element} element container element
   * @param  {Array|Object|String} lib a Lap "library", which can be an array of
   *                                   album objects, a single album object, or a url to a
   *                                   single audio file
   * @param  {Object} options  settings hash that will be merged with Lap._defaultSettings
   */
  constructor(element, lib, options, postpone=false) {
    super()

    // default id to zero-based index incrementer
    this.id = options && options.id ? options.id : Lap._instances.length
    Lap._instances[this.id] = this

    this.element = typeof element === 'string'
      ? document.querySelector(element)
      : element

    this.setLib(lib)

    this.settings = {}
    if (options) {
      Lap.each(Lap._defaultSettings, (val, key) => {
        if (options.hasOwnProperty(key)) this.settings[key] = options[key]
        else this.settings[key] = val
      })
    } else {
      this.settings = Lap._defaultSettings
    }

    this.debug = this.settings.debug


    if (this.debug) {
      this.on('load', () => console.info('%cLap(%s) [DEBUG]:%c %o',
        Lap._debugSignature, this.id, 'color:inherit', this))
      const echo = e => {
        this.on(e, () => console.info('%cLap(%s) [DEBUG]:%c %s handler called',
          Lap._debugSignature, this.id, 'color:inherit', e))
      }
      echo('load')
      echo('play')
      echo('pause')
      echo('seek')
      echo('trackChange')
      echo('albumChange')
      echo('volumeChange')
    }

    if (!postpone) this.initialize()

    return this
  }

  /**
   * Get a Lap instance by id. Id is not an element container id; it is the `Lap#settings.id`
   * member, which if not supplied on creation, is zero-based the nth instance number.
   *
   * @param  {number} id Lap#settings.id
   * @return {Lap} the instance
   */
  static getInstance(id) {
    return Lap._instances[id]
  }

  /**
   * Add class `class` to HTML Element `el`
   *
   * @param {HTML Element} el
   * @param {string} _class
   */
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

  /**
   * Remove class `class` from HTML Element `el`
   *
   * @param {HTML Element} el
   * @param {string} _class
   */
  static removeClass(el, _class) {
    if (!el) return console.warn(`${el} is not defined`)
    // uncomment for multiple class removal
    // _class = `(${_class.split(/\s+/).join('|')})`

    // TODO: cache?
    const re = new RegExp('\\s*' + _class + '\\s*(![\\w\\W])?', 'g')
    el.className = el.className.replace(re, ' ').trim()
    return Lap
  }

  /**
   * Convert milliseconds into hh:mm:ss format
   *
   * @param  {string|number} time milliseconds
   * @return {string} `time` in hh:mm:ss format
   */
  static formatTime(time) {
    let h = Math.floor(time / 3600)
    let m = Math.floor((time - (h * 3600)) / 60)
    let s = Math.floor(time - (h * 3600) - (m * 60))
    if (h < 10) h = '0' + h
    if (m < 10) m = '0' + m
    if (s < 10) s = '0' + s
    return h + ':' + m + ':' + s
  }

  /**
   * Barebones forEach for object
   *
   * @param  {Object}   obj POJO
   * @param  {Function} fn  iterator called val,key,obj
   * @param  {Object}   ctx optional context
   * @return {undefined}
   */
  static each(obj, fn, ctx) {
    const keys = Object.keys(obj)
    let i = 0, len = keys.length
    for (; i < len; i++) fn.call(ctx, obj[keys[i]], keys[i], obj)
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
  static scale(n, oldMin, oldMax, min, max) {
    return (((n-oldMin)*(max-min)) / (oldMax-oldMin)) + min
  }

  /**
   * Removes all dom, audio, and internal event handlers from the given Lap instance,
   * then deletes all properties
   *
   * @param  {Lap} lap the Lap instance
   */
  static destroy(lap) {

    const id = lap.id

    // remove dom event handlers
    Lap.each(lap._listeners, (events, elementName) => delete lap._listeners[elementName])

    // remove audio events
    Lap.each(lap._audioListeners, (listeners, event) => delete lap._audioListeners[event])

    // remove all super handlers
    lap.remove()

    // nullify elements
    Lap.each(lap.els, (element, elName) => delete lap.els[elName])

    // everything else just in case
    Lap.each(lap, (val, key) => delete lap[key])

    delete Lap._instances[id]
    lap = null
  }

  /**
   * Set this player's `lib` member. `lib` is the same as would
   * be passed to the Lap constructor. This method is used internally on first instantiation,
   * yet should only be called manually in the case where you want to completely replace the instances
   * lib. Note that `#update` must be called after `#setLib` for changes to take effect.
   *
   * @param {Array|Object|string} lib
   */
  setLib(lib) {
    const type = typeof lib
    const isArray = lib instanceof Array
    if (isArray) {
      this.lib = lib
    } else if (type === 'object') {
      this.lib = [lib]
    } else if (type === 'string' && Lap._audioExtensionRegExp.test(lib)) {
      this.lib = [{ files: [lib] }]
    } else {
      throw new Error(`${lib} must be an array, object, or string`)
    }
    return this
  }

  /**
   * This method is basically a secondary constructor and should not really need
   * to be called manually except in the case that you want to prepare a player with its
   * settings while waiting for a lib to come back from an ajax call.
   *
   * @return {Lap} this
   */
  initialize() {

    // state
    this.seeking = false
    this.volumeChanging = false
    this.mouseDownTimer = 0
    this.playing = false

    this.update()
    this._initAudio()
    this._initElements()
    this._addAudioListeners()
    this._addVolumeListeners()
    this._addSeekListeners()
    this._addListeners()
    this._activatePlugins()

    Lap.each(this.settings.callbacks, (fn, key) => this.on(key, fn.bind(this)))

    this.trigger('load', this)

    return this
  }

  /**
   * Configures instance variables relative to the current album.
   * Called on instance initialization and whenever an album is changed.
   * This method is also needed if you manually replace an instance's `lib` member
   * via `#setLib`, in which case you'll need to call `#update` directly after
   *
   * @return {Lap} this
   */
  update() {
    if (this.albumIndex === undefined) {
      this.albumIndex = this.settings.startingAlbumIndex || 0
    }
    if (this.trackIndex === undefined) {
      this.trackIndex = this.settings.startingTrackIndex || 0
    }

    this.albumCount = this.lib.length;

    const currentLibItem = this.lib[this.albumIndex]

    const keys = ['artist', 'album', 'files', 'cover', 'tracklist', 'replacement']
    keys.forEach(key => this[key] = currentLibItem[key])


    this.trackCount = this.files.length

    // replacement in === [regexp string, replacement string, optional flags]
    // replacement out === [regexp instance, replacement]
    if (this.replacement) {
      let re = this.replacement

      if (Array.isArray(re) && re[0] instanceof RegExp) {
        this.replacement = re

      } else {
        if (typeof re === 'string') re = [re]

        // re may contain string-wrapped regexp (from json), convert if so
        re[0] = new RegExp(re[0], re[2] || 'g')
        re[1] = re[1] || ''

        this.replacement = re
      }
    }

    this._formatTracklist()

    return this
  }

  /**
   * Instantiate every plugin's contructor with this Lap instance
   *
   * @return {Lap} this
   * @private
   */
  _activatePlugins() {
    this.plugins = []
    this.settings.plugins.forEach((plugin, i) => this.plugins[i] = new plugin(this))
    return this
  }

  /**
   * @return {Lap} this
   * @private
   */
  _initAudio() {
    this.audio = new Audio()
    this.audio.preload = 'auto'
    let fileType = this.files[this.trackIndex]
    fileType = fileType.slice(fileType.lastIndexOf('.')+1)
    const canPlay = this.audio.canPlayType('audio/' + fileType)
    if (canPlay === 'probably' || canPlay === 'maybe') {
      this._updateSource()
      this.audio.volume = 1
    } else {
      // TODO: return a flag to signal skipping the rest of the initialization process
      console.warn(`This browser does not support ${fileType} playback.`)
    }
    return this
  }

  /**
   * @return {Lap} this
   * @private
   */
  _updateSource() {
    this.audio.src = this.files[this.trackIndex]
    return this
  }

  /**
   * @return {Lap} this
   * @private
   */
  _initElements() {
    this.els = {}
    this.selectors = { state: {} }
    Lap.each(Lap._defaultSelectors, (selector, key) => {
      if (key !== 'state') {

        this.selectors[key] = this.settings.selectors.hasOwnProperty(key)
          ? this.settings.selectors[key]
          : selector

        const el = this.element.querySelector(`.${this.selectors[key]}`)
        if (el) this.els[key] = el

      } else {
        const hasCustomState = this.settings.selectors.state

        if (!hasCustomState) return (this.selectors.state = Lap._defaultSelectors.state)

        Lap.each(Lap._defaultSelectors.state, (sel, k) => {
          this.selectors.state[k] = this.settings.selectors.state.hasOwnProperty(k)
            ? this.settings.selectors.state[k]
            : sel
        })
      }
    })
  }

  /**
   * A wrapper around this Lap instances `audio.addEventListener` that
   * ensures handlers are cached for later removal via `Lap.destroy(instance)` call
   *
   * @param {string}   event       Audio Event name
   * @param {Function} listener    callback
   * @return {Lap} this
   */
  addAudioListener(event, listener) {
    this._audioListeners = this._audioListeners || {}
    this._audioListeners[event] = this._audioListeners[event] || []

    const bound = listener.bind(this)
    this._audioListeners[event].push(bound)
    this.audio.addEventListener(event, bound)
    return this
  }

  /**
   * @return {Lap} this
   * @private
   */
  _addAudioListeners() {
    const audio = this.audio
    const els = this.els
    const nativeProgress = !!(this.settings.useNativeProgress && els.progress)

    const _addListener = (condition, event, listener) => {
      if (condition) this.addAudioListener(event, listener)
    }

    _addListener(!!(els.buffered || nativeProgress), 'progress', () => {
      var buffered = this._bufferFormatted()
      if (els.buffered) els.buffered.innerHTML = buffered
      if (nativeProgress) els.progress.value = buffered
    })

    _addListener(!!els.currentTime, 'timeupdate', () => this._updateCurrentTimeEl())
    _addListener(!!els.duration, 'durationchange', () => this._updateDurationEl())

    _addListener(true, 'ended', () => {
      if (this.playing) {
        this.next()
        audio.play()
      }
    })

    return this
  }

  /**
   * A wrapper around element.addEventListener which ensures listners
   * are cached for later removal via `Lap.destroy(instance)` call
   *
   * @param {string}   elementName Lap#els elementkey
   * @param {string}   event       DOM Event name
   * @param {Function} listener    callback
   */
  addListener(elementName, event, listener) {
    // bypass non-existent elements
    if (!this.els[elementName]) return this

    // ie. listeners = { seekRange: { click: [handlers], mousedown: [handlers], ... }, ... }
    this._listeners = this._listeners || {}
    this._listeners[elementName] = this._listeners[elementName] || {}
    this._listeners[elementName][event] = this._listeners[elementName][event] || []

    const bound = listener.bind(this)
    this._listeners[elementName][event].push(bound)
    this.els[elementName].addEventListener(event, bound)
    return this
  }

  /**
   * @return {Lap} this
   * @private
   */
  _addListeners() {
    const els = this.els

    this.addListener('playPause', 'click', this.togglePlay)
    this.addListener('prev', 'click', this.prev)
    this.addListener('next', 'click', this.next)
    this.addListener('prevAlbum', 'click', this.prevAlbum)
    this.addListener('nextAlbum', 'click', this.nextAlbum)
    this.addListener('volumeUp', 'click', this._incVolume)
    this.addListener('volumeDown', 'click', this._decVolume)

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
      _if('trackTitle', '_updateTrackTitleEl')
      _if('trackNumber', '_updateTrackNumberEl')
      _if('artist', '_updateArtistEl')
      _if('album', '_updateAlbumEl')
      _if('cover', '_updateCover')
      _if('currentTime', '_updateCurrentTimeEl')
      _if('duration', '_updateDurationEl')
      _if('playPause', () => {
        const s = this.selectors.state
        const pp = els.playPause
        Lap.addClass(pp, s.paused)
        this.on('play', () => Lap.removeClass(pp, s.paused).addClass(pp, s.playing))
        this.on('pause', () => Lap.removeClass(pp, s.playing).addClass(pp, s.paused))
      })
    })

    this.on('trackChange', () => {
      _if('trackTitle', '_updateTrackTitleEl')
      _if('trackNumber', '_updateTrackNumberEl')
      _if('currentTime', '_updateCurrentTimeEl')
      _if('duration', '_updateDurationEl')
    })

    this.on('albumChange', () => {
      _if('trackTitle', '_updateTrackTitleEl')
      _if('trackNumber', '_updateTrackNumberEl')
      _if('artist', '_updateArtistEl')
      _if('album', '_updateAlbumEl')
      _if('cover', '_updateCover')
    })
  }

  /**
   * @return {Lap} this
   * @private
   */
  _addSeekListeners() {
    const els = this.els
    const seekRange = els.seekRange
    const audio = this.audio
    const useNative = !!(this.settings.useNativeSeekRange && seekRange)

    if (useNative) {
      this.addAudioListener('timeupdate', () => {
        if (!this.seeking) {
          seekRange.value = Lap.scale(
            audio.currentTime, 0, audio.duration, 0, 100)
        }
      })
      this.addListener('seekRange', 'input', () => {
        this.seeking = true
        audio.currentTime = Lap.scale(
          seekRange.value, 0, seekRange.max, 0, audio.duration)
        this.trigger('seek')
        this.seeking = false
      })
    }

    const maybeWarn = () => {
      if (this.debug && seekRange) {
        const c = 'color:darkgreen;font-family:monospace'
        const r = 'color:inherit'
        console.warn(`
          %cLap(%s) [DEBUG]:
          %cSimultaneous use of %cLap#els.seekRange%c and
          %cLap#els.seekForward|seekBackward%c is redundant.
          Consider choosing one or the other.
          `.split('\n').map(s => s.trim()).join(' '),
          Lap._debugSignature, this.id, r, c, r, c, r
        )
      }
    }

    if (els.seekForward) {
      maybeWarn()
      this.addListener('seekForward', 'mousedown', () => {
        this.seeking = true
        this._seekForward()
      })
      this.addListener('seekForward', 'mouseup', () => {
        this.seeking = false
        clearTimeout(this.mouseDownTimer)
        this.trigger('seek')
      })
    }

    if (els.seekBackward) {
      maybeWarn()
      this.addListener('seekBackward', 'mousedown', () => {
        this.seeking = true
        this._seekBackward()
      })
      this.addListener('seekBackward', 'mouseup', () => {
        this.seeking = false
        clearTimeout(this.mouseDownTimer)
        this.trigger('seek')
      })
    }
  }

  _seekBackward() {
    if (!this.seeking) return this
    this.mouseDownTimer = setInterval(() => {
      const x = this.audio.currentTime + (this.settings.seekInterval * -1)
      this.audio.currentTime = x < 0 ? 0 : x
    }, this.settings.seekTime)
    return this
  }

  _seekForward() {
    if (!this.seeking) return this
    this.mouseDownTimer = setInterval(() => {
      const x = this.audio.currentTime + this.settings.seekInterval
      this.audio.currentTime = x > this.audio.duration ? this.audio.duration : x
    }, this.settings.seekTime)
    return this
  }

  _addVolumeListeners() {
    const els = this.els
    const volumeRange = els.volumeRange
    const volumeRead = els.volumeRead
    const volumeUp = els.volumeUp
    const volumeDown = els.volumeDown

    if (volumeRead) {
      const fn = () => volumeRead.innerHTML = Math.round(this.audio.volume*100)
      this.on('volumeChange', fn)
      fn()
    }

    if (this.settings.useNativeVolumeRange && volumeRange) {

      const fn = () => {
        if (!this.volumeChanging) volumeRange.value = Math.round(this.audio.volume*100)
      }
      this.addAudioListener('volumechange', fn)
      this.on('load', fn)

      this.addListener('volumeRange', 'mousedown', () => this.volumeChanging = true)
      this.addListener('volumeRange', 'mouseup', () => {
        this.audio.volume = volumeRange.value * 0.01
        this.trigger('volumeChange')
        this.volumeChanging = false
      })
    }

    const maybeWarn = () => {
      if (this.debug && volumeRange) {
        const c = 'color:darkgreen;font-family:monospace'
        const r = 'color:inherit'
        console.warn(`
          %cLap(%s) [DEBUG]:
          %cSimultaneous use of %cLap#els.volumeRange%c and
          %cLap#els.volumeUp|volumeDown%c is redundant.
          Consider choosing one or the other.
          `.split('\n').map(s => s.trim()).join(' '),
          Lap._debugSignature, this.id, r, c, r, c, r
        )
      }
    }

    if (volumeUp) {
      maybeWarn()
      this.addListener('volumeUp', 'click', () => this._incVolume())
    }
    if (volumeDown) {
      maybeWarn()
      this.addListener('volumeDown', 'click', () => this._decVolume())
    }
  }

  _incVolume() {
    const v = this.audio.volume
    const i = this.settings.volumeInterval
    this.audio.volume = v+i > 1 ? 1 : v+i
    this.trigger('volumeChange')
    return this
  }

  _decVolume() {
    const v = this.audio.volume
    const i = this.settings.volumeInterval
    this.audio.volume = v-i < 0 ? 0 : v-i
    this.trigger('volumeChange')
    return this
  }

  _updateCurrentTimeEl() {
    this.els.currentTime.innerHTML = this._currentTimeFormatted()
    return this
  }

  _updateDurationEl() {
    this.els.duration.innerHTML = this._durationFormatted()
    return this
  }

  _updateTrackTitleEl() {
    this.els.trackTitle.innerHTML = this.tracklist[this.trackIndex]
    return this
  }

  _updateTrackNumberEl() {
    this.els.trackNumber.innerHTML = +this.trackIndex+1
    return this
  }

  _updateArtistEl() {
    this.els.artist.innerHTML = this.artist
    return this
  }

  _updateAlbumEl() {
    this.els.album.innerHTML = this.album
    return this
  }

  _updateCover() {
    this.els.cover.src = this.cover
    return this
  }

  togglePlay() {
    this.audio.paused ? this.play() : this.pause()
    this.trigger('togglePlay')
    return this
  }

  play() {
    if (Lap.exclusiveMode) Lap.each(Lap._instances, instance => instance.pause())
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
    this._updateSource()
    if (wasPlaying) this.audio.play()
    this.trigger('trackChange')
    return this
  }

  prev() {
    const wasPlaying = !this.audio.paused
    this.trackIndex = (this.trackIndex-1 < 0) ? this.trackCount-1 : this.trackIndex-1
    this._updateSource()
    if (wasPlaying) this.audio.play()
    this.trigger('trackChange')
    return this
  }

  next() {
    const wasPlaying = !this.audio.paused
    this.trackIndex = (this.trackIndex+1 >= this.trackCount) ? 0 : this.trackIndex+1
    this._updateSource()
    if (wasPlaying) this.audio.play()
    this.trigger('trackChange')
    return this
  }

  prevAlbum() {
    const wasPlaying = !this.audio.paused
    this.albumIndex = (this.albumIndex-1 < 0) ? this.albumCount-1 : this.albumIndex-1
    this.update()
    this.trackIndex = 0
    this._updateSource()
    if (wasPlaying) this.audio.play()
    this.trigger('albumChange')
    return this
  }

  nextAlbum() {
    const wasPlaying= !this.audio.paused
    this.albumIndex = (this.albumIndex+1 > this.albumCount-1) ? 0 : this.albumIndex+1
    this.update()
    this.trackIndex = 0
    this._updateSource()
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

  _formatTracklist() {
    if (this.tracklist && this.tracklist.length) return this

    const re = this.replacement
    const tracklist = []
    for (let i = 0; i < this.trackCount; i++) {
      let t = this.files[i]
      // strip ext
      t = t.slice(0, t.lastIndexOf('.'))
      // get last path segment
      t = t.slice(t.lastIndexOf('/')+1)
      if (re) t = t.replace(re[0], re[1])
      tracklist[i] = t.trim()
    }
    this.tracklist = tracklist
    return this
  }

  _bufferFormatted() {
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

  /**
   * @return {Lap} this
   * @private
   */
  _getAudioTimeFormatted(audioProp) {
    if (isNaN(this.audio.duration)) return '00:00'
    let formatted = Lap.formatTime(Math.floor(this.audio[audioProp].toFixed(1)))
    if (this.audio.duration < 3600 || formatted === '00:00:00') {
      formatted = formatted.slice(3) // nn:nn
    }
    return formatted
  }

  _currentTimeFormatted() {
    return this._getAudioTimeFormatted('currentTime')
  }

  _durationFormatted() {
    return this._getAudioTimeFormatted('duration')
  }

  trackNumberFormatted(n) {
    var count = String(this.trackCount).length - String(n).length
    return '0'.repeat(count) + n + this.settings.trackNumberPostfix
  }

  get(key, index) {
    return this.lib[index === undefined ? this.albumIndex : index][key]
  }
}

/**
 * If set true, only one Lap can be playing at a given time
 * @type {Boolean}
 */
Lap.exclusiveMode = false

/**
 * console format prefix used when Lap#settings.debugdebug=true
 *
 * @private
 * @type {String}
 */
Lap._debugSignature = 'color:teal;font-weight:bold'

/**
 * Lap instance cache
 *
 * @private
 * @type {Object}
 */
Lap._instances = {}

/**
 * @private
 * @type {RegExp}
 */
Lap._audioExtensionRegExp = /mp3|wav|ogg|aiff/i

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
}

Lap._defaultSelectors = {
  state: {
    playing:              'lap--playing',
    paused:               'lap--paused'
  },
  album:               'lap__album',
  artist:              'lap__artist',
  buffered:            'lap__buffered',
  cover:               'lap__cover',
  currentTime:         'lap__current-time',
  duration:            'lap__duration',
  next:                'lap__next',
  nextAlbum:           'lap__next-album',
  playPause:           'lap__play-pause',
  prev:                'lap__prev',
  prevAlbum:           'lap__prev-album',
  progress:            'lap__progress',
  seekBackward:        'lap__seek-backward',
  seekForward:         'lap__seek-forward',
  seekRange:           'lap__seek-range',
  trackNumber:         'lap__track-number',
  trackTitle:          'lap__track-title',
  volumeDown:          'lap__volume-down',
  volumeRead:          'lap__volume-read',
  volumeRange:         'lap__volume-range',
  volumeUp:            'lap__volume-up'
}

if (window) window.Lap = Lap
