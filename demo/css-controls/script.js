;(function(window, undefined) {

  window.onload = function() {

    var logger = tooly.Logger(0, 'CSS_DEMO');
    var $ = tooly.Frankie.bind(this);

    var lap = new Lap('#lap', '../lib.json', { 
      elements: 'auto',
      useNativeVolumeRange: true,
      callbacks: {
        play : function() { 
          lap.$els.playPause
            .removeClass('fa-play')
            .addClass('fa-pause'); 
        },
        pause: function() { 
          lap.$els.playPause
            .removeClass('fa-pause')
            .addClass('fa-play'); 
        }
      },
      plugins: [{ 
        constructor: Lap.ExpandingVolumeRange, 
        args: ['.lap-non-volume'] 
      }] 
    }, true);

    var lap2 = new Lap('#lap2', '../lib.json', { 
      elements: 'auto',
      useNativeVolumeRange: true,
      callbacks: {
        play : function() { 
          lap2.$els.playPause
            .removeClass('fa-play')
            .addClass('fa-pause'); 
        },
        pause: function() { 
          lap2.$els.playPause
            .removeClass('fa-pause')
            .addClass('fa-play'); 
        }
      },
      plugins: [{ 
        constructor: Lap.ExpandingVolumeRange, 
        args: ['.lap-non-volume'] 
      }] 
    }, true);
  };
})(window);