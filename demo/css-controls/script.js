;(function(window, undefined) {

  window.onload = function() {

    var logger = tooly.Logger(0, 'CSS_DEMO');
    var $ = tooly.Frankie.bind(this);

/*    var player_01 = new Lap('#player_01', '../lib.json', { 
      startingAlbumIndex: 2,
      useNativeVolumeRange: true,
      callbacks: {
        play : function() { 
          player_01.$els.playPause.removeClass('lap-i-play').addClass('lap-i-pause'); 
        },
        pause: function() { 
          player_01.$els.playPause.removeClass('lap-i-pause').addClass('lap-i-play'); 
        }
      },
      plugins: [{ 
        constructor: Lap.ExpandingVolumeRange, 
        args: ['.lap-non-volume'] 
      }] 
    }, true);*/



    var player_02 = new Lap('#player_02', '../lib.json', { 
      useNativeVolumeRange: true,
      useNativeSeekRange: true,
      useNativeProgress: true,
      callbacks: {
        play : function() { 
          player_02.$els.playPause.removeClass('lap-i-play').addClass('lap-i-pause');
        },
        pause: function() { 
          player_02.$els.playPause.removeClass('lap-i-pause').addClass('lap-i-play'); 
        }
      },
      plugins: [{ 
        constructor: Lap.ExpandingVolumeRange, 
        args: ['.lap-non-volume'] 
      }, {
        constructor: Lap.DiscogPopulator
      }] 
    }, false);
    player_02.initialize();

    var singleTrackPlayerLib = {
      artist: 'Lokua',
      files: ['../sh.mp3']
    };

    var singleTrackPlayer = new Lap('#single-track-player', singleTrackPlayerLib, {
      useNativeVolumeRange: true,
      useNativeSeekRange: true,
      callbacks: {
        play : function() { 
          singleTrackPlayer.$els.playPause.removeClass('lap-i-play').addClass('lap-i-pause');
        },
        pause: function() { 
          singleTrackPlayer.$els.playPause.removeClass('lap-i-pause').addClass('lap-i-play'); 
        }
      },
      plugins: [{ 
        constructor: Lap.ExpandingVolumeRange, 
        args: ['.lap-non-volume'] 
      }]       
    }, true);

    var miniPlayer = new Lap('#mini-player', '../sh.mp3', {
      callbacks: {
        play : function() { 
          miniPlayer.$els.playPause.removeClass('lap-i-play').addClass('lap-i-pause');
        },
        pause: function() { 
          miniPlayer.$els.playPause.removeClass('lap-i-pause').addClass('lap-i-play'); 
        }
      }
    }, true);

  };
})(window);