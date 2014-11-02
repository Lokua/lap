;(function(window, undefined) {

  window.onload = function() {

    var logger = tooly.Logger(0, 'CSS_DEMO');
    var $ = tooly.Frankie.bind(this);

    var lap = new Lap('#lap', '../lib.json', { 
      elements: 'auto',
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
      } 
    }, true);

    var $speaker = $('.lap-speaker'), 
        $volumeSlider = lap.$els.volumeSlider,
        mouseState = { down: false, entered: false };

    $volumeSlider
      .on('change', function() {
        var v = this.value;
        lap.audio.volume = v * 0.01;
        if (v < 33) {
          $speaker
            .removeClass('fa-volume-up fa-volume-down')
            .addClass('fa-volume-off');
        } else if (v < 66) {
          $speaker
            .removeClass('fa-volume-up fa-volume-off')
            .addClass('fa-volume-down');
        } else {
          $speaker
            .removeClass('fa-volume-off fa-volume-down')
            .addClass('fa-volume-up ');
        }
      })
      .on('mousedown', function() {
        mouseState.down = true;
      });

    $('.lap-volume-wrapper')
      .on('mouseenter', function() {
        if (!mouseState.entered) {
          $volumeSlider.removeClass('lap-hidden');
          mouseState.entered = true;
        }
      })
      .on('mouseleave', function(e) {
        mouseState.entered = false;
        if (!mouseState.down) {
          $volumeSlider.addClass('lap-hidden');
        };
      });

    // add the mouseup to the body so we can inc/dec volume by dragging
    // left or right regardless if we're in the same horizontal span as the slider
    // or not
    $('body').on('mouseup', function() {
      mouseState.down = false;
      if (!mouseState.entered) {
        $volumeSlider.addClass('lap-hidden');
      }
    });
  };
})(window);