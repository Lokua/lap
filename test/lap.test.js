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

  describe('getFileType', () => {
    it('extract file extension', () => {
      lap = new Lap('#player', 'file.mp3', null, true)
      lap.albumIndex = 0
      lap.update()
      const type = lap.getFileType()
      expect(type).toEqual('mp3')
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
      lap = new Lap('#player', {
        artist: 'foo',
        album: 'bar',
        files: albumLib.files,
        replacement: '\\d+',
        cover: 'dang.png'
      }, {}, true)
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

  describe('initAudio', function() {
    it('should create audio element', () => {
      spyOn(Lap.prototype, 'setSource')
      // skip init
      lap = new Lap('#player', {
        artist: 'foo',
        album: 'bar',
        files: albumLib.files,
        replacement: '\\d+',
        cover: 'dang.png'
      }, {}, true)
      lap.albumIndex = 0
      lap.trackIndex = 0
      lap.update()
      lap.initAudio()
      expect(lap.audio instanceof Audio).toBe(true)
      expect(lap.audio.volume).toEqual(1)
      expect(Lap.prototype.setSource).toHaveBeenCalled()
    });
    // hmmm... audio.canPlayType seems to always evaluate to "probably"
    xit('should warn when filetype is not supported', () => {
      spyOn(console, 'warn')
      // use valid mp3 to pass audioExtensionRegExp...
      lap = new Lap('#player', 'file.mp3', null, true)
      lap.albumIndex = 0
      lap.trackIndex = 0
      lap.update()
      lap.lib = [{ files: ['nope.nope'] }]
      lap.initAudio()
      expect(console.warn).toHaveBeenCalled()
    })
  })

  describe('initElements', () => {
    it('should not create elements if they aren\'t found in container', () => {
      lap = new Lap('#player', 'file.mp3', null, true)
      lap.albumIndex = 0
      lap.trackIndex = 0
      lap.update()
      lap.initElements()
      expect(Object.keys(lap.els).length).toBe(0)
    })
    it('should only create elements that are present', () => {
      document.body.insertAdjacentHTML('afterBegin', `
        <div id="player">
          <div class="lap__play-pause"></div>
          <div class="lap__prev"></div>
          <div class="lap__next"></div>
        </div>
      `)
      lap = new Lap('#player', 'file.mp3', null, true)
      lap.albumIndex = 0
      lap.trackIndex = 0
      lap.update()
      lap.initElements()
      expect(Object.keys(lap.els).length).toEqual(3)
      expect(lap.els.playPause.nodeType).toEqual(1)
      expect(lap.els.prev.nodeType).toEqual(1)
      expect(lap.els.next.nodeType).toEqual(1)
    })
    it('should create for every default element', () => {
      const els = []
      Object.keys(Lap.$$defaultSelectors).forEach(key => {
        if (key !== 'state') els.push(`<div class="${Lap.$$defaultSelectors[key]}"></div>`)
      })
      document.body.insertAdjacentHTML('afterBegin', `<div id="player">${els.join('')}</div>`)
      lap = new Lap('#player', 'file.mp3', null, true)
      lap.albumIndex = 0
      lap.trackIndex = 0
      lap.update()
      lap.initElements()
      Object.keys(Lap.$$defaultSelectors).forEach(key => {
        if (key !== 'state') expect(lap.els[key].nodeType).toEqual(1)
      })
    });    
  })
})
