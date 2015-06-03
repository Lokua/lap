'use strict';

describe('lap-service', function() {

  var Lap, lap, library, tooly;

  beforeEach(module('lnet.lap'));

  beforeEach(inject(function(_Lap_, _tooly_) {
    Lap = _Lap_;
    tooly = _tooly_;
    lap = new Lap(angular.element('<lap-container></lap-container>'), getLib());
  }));

  describe('Lap (instantiation)', function() {
    it('should inherit from tooly.Handler', function() {
      ['on', 'trigger', 'register', 'remove', 'removeAll'].forEach(function(method) {
        expect(lap[method] instanceof Function).toBe(true);
      });
    });
    it('should instantiate a new player with default settings', function() {
      expect(lap instanceof Lap).toBe(true);
      expect(lap.lib.length).toEqual(3);
      expect(lap.settings.startingTrackIndex).toEqual(0);
      expect(lap.settings.startingAlbumIndex).toEqual(0);
    });
    it('should load the first song of the first album, etc.', function() {
      expect(lap.trackIndex).toEqual(0);
      expect(lap.albumIndex).toEqual(0);
      expect(lap.audio.src).toEqual('http://lokua.net/audio/13/Lokua_-_16.wav');
      expect(lap.album).toEqual('Unreleased');
      expect(lap.artist).toEqual('Lokua');
      expect(lap.cover).toEqual('http://lokua.net/images/earth/grass1.png');
    });
  });


  describe('#playPause', function() {
    it('should start audio when play is called', function() {
      lap.play();
    });
    it('should pause audio when pause is called', function() {
      lap.play();
      expect(lap.audio.paused).toBe(false);
      lap.pause();
      expect(lap.audio.paused).toBe(true);
    });
    it('should trigger custom play handler when play is called', function() {
      var n = 0;
      lap.on('play', function() {
        n++;
      });
      lap.play();
      expect(n).toEqual(1);
    });
    it('should trigger custom pause handler when pause is called', function() {
      var n = 0;
      lap.on('pause', function() {
        n++;
      });
      lap.play();
      expect(n).toEqual(0);
      lap.pause();
      expect(n).toEqual(1);
    });
    it('should toggle and trigger togglePlay handler', function() {
      var n = 0;
      lap.on('togglePlay', function() {
        n++;
      });
      lap.togglePlay();
      expect(lap.audio.paused).toBe(false);
      lap.togglePlay();
      expect(lap.audio.paused).toBe(true);
      expect(n).toEqual(2);
    });
  });

  describe('#setTrack', function() {
    it('should set the trackIndex to 4', function() {
      lap.setTrack(4);
      expect(lap.trackIndex).toEqual(4);
    });
    it('should clamp to min when index < 0', function() {
      lap.setTrack(-1);
      expect(lap.trackIndex).toEqual(0);
    });
    it('should clamp to max when index is too high', function() {
      lap.setTrack(999);
      expect(lap.trackIndex).toEqual(lap.trackCount - 1);
    });
    it('should follow that audio.src follows', function() {
      lap.setTrack(3);
      expect(lap.audio.src).toEqual('http://lokua.net/audio/13/Lokua_-_Attack_The_Boards.wav');
    });
    it('should resume playing if audio was playing', function() {
      lap.play();
      lap.setTrack(1);
      expect(lap.audio.paused).toBe(false);
    });
    it('should not play when audio was paused', function() {    
      lap.play();
      lap.pause();
      lap.setTrack(2);
      expect(lap.audio.paused).toBe(true);
    });
    it('should fire a trackChange event', function() {
      var n = 0;
      lap.on('trackChange', function() {
        n++;
      });
      lap.setTrack(3);
      expect(n).toEqual(1);
    });
  });

  describe('#prev', function() {
    it('should go to last track in current album', function() {
      lap.prev();
      expect(lap.trackIndex).toEqual(lap.trackCount-1);
    });
    it('should go to second to last track', function() {
      lap.prev();
      lap.prev();
      expect(lap.trackIndex).toEqual(lap.trackCount-2);
    });
    it('should resume playing', function() {
      lap.play();
      lap.prev();
      expect(lap.audio.paused).toBe(false);
    });
    it('should remain paused', function() {
      lap.play();
      lap.pause();
      lap.prev();
      expect(lap.audio.paused).toBe(true);
    });
    it('should fire trackChange handler', function() {
      var count = 0;
      lap.on('trackChange', function() {
        count++;
      });
      lap.prev();
      expect(count).toEqual(1);
    });    
  });

  describe('#next', function() {
    it('should go to next track in current album', function() {
      lap.next();
      expect(lap.trackIndex).toEqual(1);
    });
    it('should start over at 0 after last', function() {
      lap.setTrack(lap.trackCount-1);
      lap.next();
      expect(lap.trackIndex).toEqual(0);
    });
    it('should resume playing', function() {
      lap.play();
      lap.next();
      expect(lap.audio.paused).toBe(false);
    });
    it('should remain paused', function() {
      lap.play();
      lap.pause();
      lap.next();
      expect(lap.audio.paused).toBe(true);
    });
    it('should fire trackChange handler', function() {
      var count = 0;
      lap.on('trackChange', function() {
        count++;
      });
      lap.next();
      expect(count).toEqual(1);
    });     
  });

  describe('#prevAlbum', function() {
    it('should skip to the previous album', function() {
      lap.prevAlbum();
      expect(lap.albumIndex).toEqual(2);
      lap.prevAlbum();
      expect(lap.albumIndex).toEqual(1);
      lap.prevAlbum();
      expect(lap.albumIndex).toEqual(0);
      lap.prevAlbum();
      expect(lap.albumIndex).toEqual(2);
      expect(lap.audio.paused).toBe(true);
    });
    it('should continue playing after skipping', function() {
      lap.play();
      lap.prevAlbum();
      expect(lap.audio.paused).toBe(false);
    });
    it('should fire albumChange handler', function() {
      var count = 0;
      lap.on('albumChange', function() {
        count++;
      });
      lap.prevAlbum();
      expect(count).toEqual(1);
    });         
  });

  describe('#nextAlbum', function() {
    it('should skip to the next album', function() {
      lap.nextAlbum();
      expect(lap.albumIndex).toEqual(1);
      lap.nextAlbum();
      expect(lap.albumIndex).toEqual(2);
      lap.nextAlbum();
      expect(lap.albumIndex).toEqual(0);
      expect(lap.audio.paused).toBe(true);
    });
    it('should continue playing after skipping', function() {
      lap.play();
      lap.nextAlbum();
      expect(lap.audio.paused).toBe(false);
    });
    it('should fire albumChange handler', function() {
      var count = 0;
      lap.on('albumChange', function() {
        count++;
      });
      lap.nextAlbum();
      expect(count).toEqual(1);
    });      
  });

  describe('#setAlbum', function() {
    it('should update the albumIndex', function() {
      lap.setAlbum(1);
      expect(lap.albumIndex).toEqual(1);
      lap.setAlbum(2);
      expect(lap.albumIndex).toEqual(2);
    });
    it('should clamp min max', function() {
      lap.setAlbum(-2);
      expect(lap.albumIndex).toEqual(0);
      lap.setAlbum(44);
      expect(lap.albumIndex).toEqual(2);
    });
    it('should reset trackIndex', function() {
      expect(lap.trackIndex).toEqual(0);
      lap.setTrack(2);
      expect(lap.trackIndex).toEqual(2);
      lap.setAlbum(1);
      expect(lap.trackIndex).toEqual(0);
    });
    it('should honor a lib\'s startTrackIndex', function() {
      lap.lib[2].startingTrackIndex = 2;
      lap.setAlbum(2);
      expect(lap.trackIndex).toEqual(2);
    });
    it('should fire albumChange', function() {
      var count = 0;
      lap.on('albumChange', function() {
        count++;
      });
      lap.setAlbum(1);
      expect(count).toEqual(1);      
    });
  });

  describe('#incVolume', function() {
    it('should increase volume', function() {
      expect(+lap.audio.volume.toFixed(2)).toEqual(0.8);
      lap.incVolume();
      expect(+lap.audio.volume.toFixed(2)).toEqual(0.85);
    });
    it('should fire volumeChange handler', function() {
      var count = 0;
      lap.on('volumeChange', function() {
        count++;
      });
      lap.incVolume();
      expect(count).toEqual(1);
    });    
  });

  describe('#decVolume', function() {
    it('should decrease volume', function() {
      expect(+lap.audio.volume.toFixed(2)).toEqual(0.8);
      lap.incVolume();
      expect(+lap.audio.volume.toFixed(2)).toEqual(0.85);
    });
    it('should fire volumeChange handler', function() {
      var count = 0;
      lap.on('volumeChange', function() {
        count++;
      });
      lap.decVolume();
      expect(count).toEqual(1);
    });      
  });  

  describe('#setVolume', function() { 
    it('should set volume to whatever', function() {
      lap.setVolume(true);
      lap.setVolume(true);
      expect(+lap.audio.volume.toFixed(2)).toEqual(0.9);
      lap.setVolume(false);
      lap.setVolume(false);
      lap.setVolume(false);
      lap.setVolume(false);
      expect(+lap.audio.volume.toFixed(2)).toEqual(0.7);
    });
    it('should clamp min and max', function() {
      lap.setVolume(true);
      lap.setVolume(true);
      lap.setVolume(true);
      lap.setVolume(true);
      lap.setVolume(true);
      expect(+lap.audio.volume).toEqual(1);
      for (var i = 0; i < 21; i++) {
        lap.setVolume(false);
      }
      expect(+lap.audio.volume).toEqual(0);
    });
    it('should fire volumeChange handler', function() {
      var count = 0;
      lap.on('volumeChange', function() {
        count++;
      });
      lap.setVolume(true);
      lap.setVolume(false);
      expect(count).toEqual(2);
    });      
  });

  /* TODO: how to handle the interval in seek* methods? */

  xdescribe('#seekBackward', function() {
    beforeEach(function() {
      lap.SEEKING = true;
    });
    it('should seek backward, duh!', function() {
      lap.audio.currentTime = 300;
      lap.seekBackward();
      setTimeout(function() {
        lap.SEEKING = false;
      }, lap.settings.seekTime);      
      expect(+lap.audio.currentTime).toEqual(50);
    });
    it('should clamp at 0', function() {
      lap.seekBackward();
      setTimeout(function() {
        lap.SEEKING = false;
      }, lap.settings.seekTime);
      expect(+lap.audio.currentTime).toEqual(0);
      lap.audio.currentTime = 300;
      lap.seekBackward();
      setTimeout(function() {
        lap.SEEKING = false;
      }, lap.settings.seekTime*2);      
      expect(+lap.audio.currentTime).toEqual(0);
    });
    it('should fire seek event', function() {
      var count = 0;
      lap.on('seek', function() {
        count++;
      });
      lap.audio.currentTime = 300;
      lap.seekBackward();
      setTimeout(function() {
        lap.SEEKING = false;
      }, lap.settings.seekTime+1);      
      expect(count).toEqual(1);
    });
  });

  xdescribe('#seekForward', function() {
    beforeEach(function() {
      lap.SEEKING = true;
    });    
    it('should seek forward, duh!', function() {
      lap.SEEKING = true;
      lap.audio.currentTime = 300;
      lap.seekForward();
      expect(+lap.audio.currentTime).toEqual(550);
    });
    xit('should clamp at audio duration', function() {
      lap.seekForward();
      expect(+lap.audio.currentTime).toEqual(250);
      lap.audio.currentTime = 300;
      lap.seekForward();
      lap.seekForward();
      expect(+lap.audio.currentTime).toEqual(0);
    });
    it('should fire seek event', function() {
      lap.SEEKING = true;
      var count = 0;
      lap.on('seek', function() {
        count++;
      });
      lap.seekForward();   
      expect(count).toEqual(1);
    });    
  });

  describe('#formatTracklist', function() {
    it('should do nothing if a tracklist already exists', function() {
      lap.tracklist = [true];
      expect(lap.formatTracklist().tracklist[0]).toBe(true);
    });
    it('should not apply replacement if one doesn\'t exist', function() {
      lap.replacement = undefined;
      lap.tracklist = undefined;
      lap.formatTracklist();
      expect(lap.tracklist[0]).toEqual('Lokua_-_16');
    });
  });

});

function getLib() {
  /*jshint ignore:start*/
  return [
    {  
      "artist": "Lokua",
      "album": "Unreleased",
      "date": "2012.01.31",
      "label": "unreleased",
      "cover": "http://lokua.net/images/earth/grass1.png",
      "replacement": ["[_-]|Lokua", " "],
      "files": [
        "http://lokua.net/audio/13/Lokua_-_16.wav",
        "http://lokua.net/audio/13/Lokua_-_All_Most.wav",
        "http://lokua.net/audio/13/Lokua_-_Alpha_Square.wav",
        "http://lokua.net/audio/13/Lokua_-_Attack_The_Boards.wav",
        "http://lokua.net/audio/13/Lokua_-_Black_Amethyst.wav",
        "http://lokua.net/audio/13/Lokua_-_Blackbird.wav",
        "http://lokua.net/audio/13/Lokua_-_Country_Neon.wav",
        "http://lokua.net/audio/13/Lokua_-_dcaf_pt1.wav",
        "http://lokua.net/audio/13/Lokua_-_dcaf_pt2.wav",
        "http://lokua.net/audio/13/Lokua_-_dlyn.wav",
        "http://lokua.net/audio/13/Lokua_-_Gruff_Glider.wav",
        "http://lokua.net/audio/13/Lokua_-_Ice_The_Breaks.wav",
        "http://lokua.net/audio/13/Lokua_-_june1b.wav",
        "http://lokua.net/audio/13/Lokua_-_Midsummer_Nightmare.wav",
        "http://lokua.net/audio/13/Lokua_-_mod_pt1.wav",
        "http://lokua.net/audio/13/Lokua_-_mod_pt2.wav",
        "http://lokua.net/audio/13/Lokua_-_MorphK.wav",
        "http://lokua.net/audio/13/Lokua_-_Mush_Face.wav",
        "http://lokua.net/audio/13/Lokua_-_Oatmeal_Cookies.wav",
        "http://lokua.net/audio/13/Lokua_-_Pain_Forever.wav",
        "http://lokua.net/audio/13/Lokua_-_Ptone_pt1.wav",
        "http://lokua.net/audio/13/Lokua_-_q2Mud.wav",
        "http://lokua.net/audio/13/Lokua_-_Rimsn.wav",
        "http://lokua.net/audio/13/Lokua_-_Swamp.wav",
        "http://lokua.net/audio/13/Lokua_-_techno2.wav",
        "http://lokua.net/audio/13/Lokua_-_Zero_N.wav"
      ]
    }, 
    {  
      "artist": "Lokua",
      "album": "osd",
      "date": "2012.01.31",
      "label": "unreleased",
      "cover": "http://lokua.net/images/earth/ibis.jpg",
      "replacement": ["[_-]|Lokua|O\\.S\\.D\\.|[0-9]{2}", " "],
      "files": [
        "http://lokua.net/audio/OSD/Lokua_-_O.S.D._-_01_Mercury.mp3",
        "http://lokua.net/audio/OSD/Lokua_-_O.S.D._-_02_Eartheia_(Coalesce).mp3",
        "http://lokua.net/audio/OSD/Lokua_-_O.S.D._-_03_Labor_Pains.mp3",
        "http://lokua.net/audio/OSD/Lokua_-_O.S.D._-_04_cHorridor8.mp3",
        "http://lokua.net/audio/OSD/Lokua_-_O.S.D._-_05_Hue.mp3",
        "http://lokua.net/audio/OSD/Lokua_-_O.S.D._-_06_Kaleidoscope.mp3",
        "http://lokua.net/audio/OSD/Lokua_-_O.S.D._-_07_Orgital.mp3"
      ]
    },
    {  
      "artist": "Lokua",
      "album": "Vacuus",
      "date": "2012.01.31",
      "label": "unreleased",
      "cover": "http://lokua.net/images/earth/snakeby.png",
      "replacement": ["[_-]|Lokua|Vacuus|[0-9]{2}", " "],
      "files": [
        "http://lokua.net/audio/vacuus/Lokua_-_Vacuus_-_01_-_Dark_Energy.mp3",
        "http://lokua.net/audio/vacuus/Lokua_-_Vacuus_-_02_-_Source_Direct.mp3",
        "http://lokua.net/audio/vacuus/Lokua_-_Vacuus_-_03_-_The_Glimmer_Fade.mp3"
      ]
    }
  ];
  /*jshint ignore:end*/
}