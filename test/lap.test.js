'use strict'

describe('lap.js', () => {

  let albumLib = {
    files: [
      'https://s3.amazonaws.com/lokua.net.audio/albums/nostalgia-digest/Lokua_-_Strobe.mp3',
      'https://s3.amazonaws.com/lokua.net.audio/albums/nostalgia-digest/Lokua_-_Quick.mp3'
    ]
  }
  let discogLib = [albumLib]
  let lap

  function setupFullPlayer() {
    const els = []
    Object.keys(Lap.$$defaultSelectors).forEach(key => {
      if (key !== 'state') els.push(`<div class="${Lap.$$defaultSelectors[key]}"></div>`)
    })
    document.body.insertAdjacentHTML('afterBegin', `<div id="player">${els.join('')}</div>`)
  }
  function tearDown() {
    document.body.removeChild(document.getElementById('player'))
    lap = null
    Lap.$$instances = []
  }

  beforeEach(() => {
    let fixture = `<div id="player"></div>`
    document.body.insertAdjacentHTML('afterBegin', fixture)
  })
  afterEach(() => {
    tearDown()
  })

  describe('constructor', () => {

    it('should select container element', () => {
      lap = new Lap('#player', albumLib)
      expect(lap.element.getAttribute('id')).toEqual('player')
    })
    it('should cache instance', () => {
      lap = new Lap('#player', albumLib)
      expect(Lap.$$instances.length).toEqual(1)
    })
    it('should set default id', () => {
      lap = new Lap('#player', albumLib)
      expect(lap.id).toEqual(0)
    })
    it('should fallback to default settings', () => {
      lap = new Lap('#player', albumLib)
      expect(lap.settings).toEqual(Lap.$$defaultSettings)
    })
    it('should merge default settings', () => {
      lap = new Lap('#player', albumLib, {
        startingTrackIndex: 3,
        useNativeProgress: true
      }, true)
      expect(lap.settings.startingTrackIndex).toEqual(3)
      expect(lap.settings.useNativeProgress).toBe(true)
    })
  })

  xdescribe('setLib', () => {
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

  xdescribe('initialize', () => {
    it('should prepare state variables', () => {
      lap = new Lap('#player', albumLib)
      expect(lap.seeking).toBe(false)
      expect(lap.seeking).toBe(false)
      expect(lap.volumeChanging).toBe(false)
      expect(lap.mouseDownTimer).toEqual(0)
      expect(lap.playing).toBe(false)
    })
    it('should prepare other ease of access variables', () => {
      lap = new Lap('#player', albumLib)
      expect(lap.albumIndex).toEqual(0)
      expect(lap.albumCount).toEqual(1)
    })
    it('should set plugins to empty array', () => {
      lap = new Lap('#player', albumLib)
      expect(lap.plugins instanceof Array).toBe(true)
    })
    it('should defer the rest of initialization to other handlers', () => {
      spyOn(Lap.prototype, 'update')
      spyOn(Lap.prototype, '$$initAudio')
      spyOn(Lap.prototype, '$$initElements')
      spyOn(Lap.prototype, '$$addAudioListeners')
      spyOn(Lap.prototype, '$$addVolumeListeners')
      spyOn(Lap.prototype, '$$addSeekListeners')
      spyOn(Lap.prototype, '$$addListeners')
      spyOn(Lap.prototype, '$$activatePlugins')
      spyOn(Lap.prototype, 'trigger')

      lap = new Lap('#player', albumLib)

      expect(Lap.prototype.update).toHaveBeenCalled()
      expect(Lap.prototype.$$initAudio).toHaveBeenCalled()
      expect(Lap.prototype.$$initElements).toHaveBeenCalled()
      expect(Lap.prototype.$$addAudioListeners).toHaveBeenCalled()
      expect(Lap.prototype.$$addVolumeListeners).toHaveBeenCalled()
      expect(Lap.prototype.$$addSeekListeners).toHaveBeenCalled()
      expect(Lap.prototype.$$addListeners).toHaveBeenCalled()
      expect(Lap.prototype.$$activatePlugins).toHaveBeenCalled()
      expect(Lap.prototype.trigger).toHaveBeenCalled()
    })
  })

  xdescribe('update', () => {
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
      spyOn(Lap.prototype, '$$formatTracklist')
      lap.update()
      expect(lap.trackIndex).toEqual(0)
      expect(lap.playlistPopulated).toBe(false)
      expect(lap.trackCount).toEqual(2)
      expect(lap.artist).toEqual('foo')
      expect(lap.album).toEqual('bar')
      expect(lap.cover).toEqual('dang.png')
      expect(lap.replacement.length).toEqual(2)
      expect(lap.replacement[0] instanceof RegExp).toBe(true)
      expect(Lap.prototype.$$formatTracklist).toHaveBeenCalled()
    })
  })

  xdescribe('$$initAudio', () => {
    it('should create audio element', () => {
      spyOn(Lap.prototype, '$$updateSource')
      // skip init
      lap = new Lap('#player', {
        artist: 'foo',
        album: 'bar',
        files: albumLib.files,
        replacement: '\\d+',
        cover: 'dang.png'
      }, {}, true)
      lap.update()
      lap.$$initAudio()
      expect(lap.audio instanceof Audio).toBe(true)
      expect(lap.audio.volume).toEqual(1)
      expect(Lap.prototype.$$updateSource).toHaveBeenCalled()
    });
    // hmmm... audio.canPlayType seems to always evaluate to "probably"
    xit('should warn when filetype is not supported', () => {
      spyOn(console, 'warn')
      // use valid mp3 to pass audioExtensionRegExp...
      lap = new Lap('#player', 'file.mp3', null, true)
      lap.update()
      lap.lib = [{ files: ['nope.nope'] }]
      lap.$$initAudio()
      expect(console.warn).toHaveBeenCalled()
    })
  })

  xdescribe('$$initElements', () => {
    it('should not create elements if they aren\'t found in container', () => {
      lap = new Lap('#player', 'file.mp3', null, true)
      lap.update()
      lap.$$initElements()
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
      lap.update()
      lap.$$initElements()
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
      lap.update()
      lap.$$initElements()
      Object.keys(Lap.$$defaultSelectors).forEach(key => {
        if (key !== 'state') expect(lap.els[key].nodeType).toEqual(1)
      })
    });
  })

  xdescribe('addAudioListener', () => {
    beforeEach(() => {
      document.body.removeChild(document.getElementById('player'))
      document.body.insertAdjacentHTML('afterBegin', `
        <div id="player">
          <div class="lap__play-pause"></div>
          <div class="lap__current-time"></div>
          <div class="lap__duration"></div>
          <input type="range" class="lap__progress">
          <input type="range" class="lap__seek-range">
          <input type="range" class="lap__volume-range">
        </div>
      `)
      lap = new Lap('#player', albumLib, {
        useNativeProgress: true,
        useNativeSeekRange: true,
        useNativeVolumeRange: true
      }, true)
      lap.update()
      lap.$$initAudio()
    })
    it('should add outside listener to audioListeners cache', () => {
      let fn = function fn() {}
      lap.addAudioListener('timeupdate', fn)
      expect(lap.$$audioListeners).toBeDefined()
      expect(Object.keys(lap.$$audioListeners)).toEqual(['timeupdate'])
      expect(typeof lap.$$audioListeners.timeupdate[0]).toEqual('function')
      lap.addAudioListener('timeupdate', fn)
      expect(lap.$$audioListeners.timeupdate.length).toEqual(2)
    });
  })

  xdescribe('$$addAudioListeners', () => {
    beforeEach(() => {
      document.body.removeChild(document.getElementById('player'))
      document.body.insertAdjacentHTML('afterBegin', `
        <div id="player">
          <div class="lap__play-pause"></div>
          <div class="lap__current-time"></div>
          <div class="lap__duration"></div>
          <input type="range" class="lap__progress">
          <input type="range" class="lap__seek-range">
          <input type="range" class="lap__volume-range">
        </div>
      `)

      lap = new Lap('#player', albumLib, {
        useNativeProgress: true,
        useNativeSeekRange: true,
        useNativeVolumeRange: true
      }, true)

      lap.update()
      lap.$$initAudio()
      lap.$$initElements()
      lap.$$addAudioListeners()
      lap.$$addListeners()
    })
    it('should populate audioListeners object', () => {
      expect(lap.$$audioListeners.progress instanceof Array).toBe(true)
      expect(lap.$$audioListeners.timeupdate instanceof Array).toBe(true)
      expect(lap.$$audioListeners.durationchange instanceof Array).toBe(true)
      expect(lap.$$audioListeners.ended instanceof Array).toBe(true)

      let t = 0
      lap.addAudioListener('timeupdate', () => t++)
      lap.play()
      setTimeout(() => expect(t).toBeGreaterThan(0))

      let d = 0
      lap.addAudioListener('durationchange', () => d++)
      lap.next()
      setTimeout(() => expect(d).toBeGreaterThan(0))

      expect(Object.keys(lap.$$audioListeners)).toEqual(
        ['progress', 'timeupdate', 'durationchange', 'ended']
      )
      expect(lap.$$audioListeners.progress.length).toEqual(1)
      expect(lap.$$audioListeners.timeupdate.length).toEqual(2)
      expect(lap.$$audioListeners.durationchange.length).toEqual(2)
      expect(lap.$$audioListeners.ended.length).toEqual(1)
    });
  })

  xdescribe('addListener', () => {
    beforeEach(() => {
      setupFullPlayer()
      lap = new Lap('#player', albumLib, null, true)
      lap.$$initElements()
    })
    afterEach(tearDown)
    it('should setup listener cache and add handler to it', () => {
      expect(lap.$$listeners).toBeUndefined()
      lap.addListener('playPause', 'click', () => {})
      expect(lap.$$listeners).toBeDefined()
      expect(lap.$$listeners.playPause.click.length).toEqual(1)
      expect(typeof lap.$$listeners.playPause.click[0]).toEqual('function')
    })
  })

  xdescribe('$$addListeners', () => {
    beforeEach(() => {
      setupFullPlayer()
      lap = new Lap('#player', albumLib, null, true)
      lap.update()
      lap.$$initAudio()
      lap.$$initElements()
      lap.$$addAudioListeners()
      lap.$$addListeners()
    })
    afterEach(tearDown)
    it('should setup all initial click handlers', () => {
      const elNames = [
        'playPause',
        'prev',
        'next',
        'prevAlbum',
        'nextAlbum',
        'volumeUp',
        'volumeDown'
      ]
      expect(Object.keys(lap.$$listeners)).toEqual(elNames)
      elNames.forEach(name => {
        expect(lap.$$listeners[name].click.length).toEqual(1)
        expect(typeof lap.$$listeners[name].click[0]).toEqual('function')
      })
    })
    it('should setup lap super handlers', () => {
      expect(Object.keys(lap.handlers)).toEqual(['load', 'trackChange', 'albumChange'])
      expect(lap.handlers.load.length).toEqual(1)
      expect(lap.handlers.trackChange.length).toEqual(1)
      expect(lap.handlers.albumChange.length).toEqual(1)
    })
  })

  xdescribe('destroy', () => {
    beforeEach(() => {
      setupFullPlayer()
      lap = new Lap('#player', albumLib)
    })
    afterEach(tearDown)
    it('should remove all dom, audio, and bus handlers', () => {
      Lap.destroy(lap)
      expect(lap.$$listeners).toBeUndefined()
      expect(lap.$$audioListeners).toBeUndefined()
      expect(lap.handlers).toBeUndefined()
      expect(lap.els).toBeUndefined()
      expect(lap.element).toBeUndefined()
      expect(Object.keys(lap)).toEqual([])
    });
  })

  xdescribe('$$formatTracklist', () => {
    xit('should exec replacement value', () => {
      const lib = albumLib
      lib.replacement = ['Lokua_-_']
      lap = new Lap('#player', lib, null, true)
      lap.update()
      expect(lap.replacement[0]).toEqual(/Lokua_-_/g)
      expect(lap.tracklist).toEqual(['Strobe', 'Quick'])
    })
    it('should ignore replacement when tracklist is supplied', () => {
      const lib = albumLib
      lib.replacement = ['Lokua_-_']
      lib.tracklist = ['foo', 'bar']
      lap = new Lap('#player', lib, null, true)
      lap.update()
      expect(lap.tracklist).toEqual(['foo', 'bar'])
    })
  })

})
