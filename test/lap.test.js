'use strict'

describe('lap.js', () => {

  let albumLib = {
    files: ['a.mp3', 'b.wav']
  }
  let discogLib = [albumLib]
  let lap

  beforeEach(() => {
    let fixture = `<div id="player"></div>`
    document.body.insertAdjacentHTML('afterBegin', fixture)
  })
  afterEach(() => {
    document.body.removeChild(document.getElementById('player'))
    lap = null
    Lap.$$instances = []
  })

  describe('constructor', () => {
    beforeEach(() => lap = new Lap('#player', albumLib))
    it('should select container element', () => {
      expect(lap.element.getAttribute('id')).toEqual('player')
    })
    it('should cache instance', () => {
      expect(Lap.$$instances.length).toEqual(1)
    })
    it('should set default id', () => {
      expect(lap.id).toEqual(0)
    })
    it('should fallback to default settings', () => {
      expect(lap.settings).toEqual(Lap.$$defaultSettings)
    })
  })

  describe('setLib', () => {
    it('should make lib an array regardless of str, obj, ', () => {
      // string
      lap = new Lap('#player', 'file.mp3')
      expect(lap.lib instanceof Array).toBe(true)
      // object
      lap = new Lap('#player', albumLib)
      expect(lap.lib instanceof Array).toBe(true)
      // array
      lap = new Lap('#player', discogLib)
      expect(lap.lib instanceof Array).toBe(true)
    })
  })

  describe('initialize', () => {
    beforeEach(() => {
      spyOn(Lap.prototype, 'update')
      spyOn(Lap.prototype, 'initAudio')
      spyOn(Lap.prototype, 'initElements')
      spyOn(Lap.prototype, 'addAudioListeners')
      spyOn(Lap.prototype, 'addVolumeListeners')
      spyOn(Lap.prototype, 'addSeekListeners')
      spyOn(Lap.prototype, 'addListeners')
      spyOn(Lap.prototype, 'activatePlugins')
      spyOn(Lap.prototype, 'trigger')
      lap = new Lap('#player', albumLib)
    })
    it('should prepare state variables', () => {
      expect(lap.seeking).toBe(false)
      expect(lap.seeking).toBe(false)
      expect(lap.volumeChanging).toBe(false)
      expect(lap.mouseDownTimer).toEqual(0)
      expect(lap.playing).toBe(false)
    })
    it('should prepare other ease of access variables', () => {
      expect(lap.albumIndex).toEqual(0)
      expect(lap.albumCount).toEqual(1)
    })
    it('should set plugins to empty array', () => {
      expect(lap.plugins instanceof Array).toBe(true)
    })
    it('should defer the rest of initialization to other handlers', () => {
      expect(Lap.prototype.update).toHaveBeenCalled()
      expect(Lap.prototype.initAudio).toHaveBeenCalled()
      expect(Lap.prototype.initElements).toHaveBeenCalled()
      expect(Lap.prototype.addAudioListeners).toHaveBeenCalled()
      expect(Lap.prototype.addVolumeListeners).toHaveBeenCalled()
      expect(Lap.prototype.addSeekListeners).toHaveBeenCalled()
      expect(Lap.prototype.addListeners).toHaveBeenCalled()
      expect(Lap.prototype.activatePlugins).toHaveBeenCalled()
      expect(Lap.prototype.trigger).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    beforeEach(() => {
      // skip init
      lap = new Lap('player', {
        artist: 'foo',
        album: 'bar',
        files: albumLib.files,
        replacement: '\\d+',
        cover: 'dang.png'
      }, {}, false)
    })
    it('should init current album variables', () => {
      lap.albumIndex = 0
      spyOn(Lap.prototype, 'formatTracklist')
      lap.update()
      expect(lap.trackIndex).toEqual(0)
      expect(lap.playlistPopulated).toBe(false)
      expect(lap.trackCount).toEqual(2)
      expect(lap.artist).toEqual('foo')
      expect(lap.album).toEqual('bar')
      expect(lap.cover).toEqual('dang.png')
      expect(lap.replacement.length).toEqual(2)
      expect(lap.replacement[0] instanceof RegExp).toBe(true)
      expect(Lap.prototype.formatTracklist).toHaveBeenCalled()
    })
  })
})
