;(function(window, undefined) {

  window.onload = function() {

    var logger = tooly.Logger(0, 'CSS_DEMO');
    var $ = tooly.Frankie.bind(this);



    var lap = new Lap('#lap', '../lib.json', { 
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
      }] 
    }, true);


  };
})(window);