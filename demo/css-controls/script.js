;(function(window, undefined) {

  window.onload = function() {

    var logger = tooly.Logger(0, 'CSS_DEMO');
    var $ = tooly.Frankie.bind(this);



    var lap = new Lap('#lap', '../lib.json', { 
      startingAlbumIndex: 2,
      useNativeVolumeRange: true,
      callbacks: {
        play : function() { 
          lap.$els.playPause.removeClass('lap-i-play').addClass('lap-i-pause'); 
        },
        pause: function() { 
          lap.$els.playPause.removeClass('lap-i-pause').addClass('lap-i-play'); 
        }
      },
      plugins: [{ 
        constructor: Lap.ExpandingVolumeRange, 
        args: ['.lap-non-volume'] 
      }] 
    }, false);



    var lap2 = new Lap('#lap2', '../lib.json', { 
      useNativeVolumeRange: true,
      useNativeSeekRange: true,
      useNativeProgress: true,
      callbacks: {
        play : function() { 
          lap2.$els.playPause.removeClass('lap-i-play').addClass('lap-i-pause');
        },
        pause: function() { 
          lap2.$els.playPause.removeClass('lap-i-pause').addClass('lap-i-play'); 
        }
      },
      plugins: [{ 
        constructor: Lap.ExpandingVolumeRange, 
        args: ['.lap-non-volume'] 
      }, {
        constructor: Lap.DiscogPopulator
      }] 
    }, true);

    // lap2.on('load', function() {
    //   var PLAYLIST_OPEN = DISCOG_OPEN = false;
    //   lap2.$els.discog.on('click', function() {
    //     DISCOG_OPEN = !DISCOG_OPEN;
    //     if (DISCOG_OPEN) lap2.$els.playlistPanel.addClass('lap-hidden');
    //   });
    //   lap2.$els.playlist.on('click', function() {
    //     PLAYLIST_OPEN = !PLAYLIST_OPEN;
    //     if (PLAYLIST_OPEN) lap2.$els.discogPanel.addClass('lap-hidden');
    //   });
    // });


  };
})(window);