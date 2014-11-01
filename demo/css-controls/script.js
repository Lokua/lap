;(function(window, undefined) {

  window.onload = function() {

    var logger = tooly.Logger(0, 'CSS_DEMO');
    var $ = tooly.Frankie.bind(this);

    var lap = new Lap('#lap', '../lib.json', { 
      elements: 'auto',
      callbacks: {
        play : function() { 
          lap.$els.playPause.removeClass('fa-play').addClass('fa-pause'); 
        },
        pause: function() { 
          lap.$els.playPause.removeClass('fa-pause').addClass('fa-play'); 
        }
      } 
    }, true);

    var $speaker = $('.lap-speaker'); // non-native
    var $volumeSlider = lap.$els.volumeSlider;
    $volumeSlider.get(0).addEventListener('change', function() {
      var v = this.value;
      lap.audio.volume = v * 0.01;
      if (v < 33) {
        $speaker.removeClass('fa-volume-up fa-volume-down').addClass('fa-volume-off');
      } else if (v < 66) {
        $speaker.removeClass('fa-volume-up fa-volume-off').addClass('fa-volume-down');
      } else {
        $speaker.removeClass('fa-volume-off fa-volume-down').addClass('fa-volume-up ');
      }
    });
    var mouseState = { 
      down: false, 
      entered: false // true === entered, but hasn't left
    };
    var $volumeWrapper = $('.lap-volume-wrapper').get(0); // non-native
    $volumeWrapper.addEventListener('mouseenter', function() {
      if (!mouseState.entered) {
        $volumeSlider.removeClass('lap-hidden');
        mouseState.entered = true;
      }
    });
    $volumeSlider.get(0).onmousedown = function() {
      mouseState.down = true;
    };
    $volumeWrapper.addEventListener('mouseleave', function(e) {
      mouseState.entered = false;
      if (!mouseState.down) {
        $volumeSlider.addClass('lap-hidden');
      }
    });
    // add the mouseup to the body so we can inc/dec volume by dragging
    // left or right regardless if we're in the same horizontal span as the slider
    // or not
    document.body.onmouseup = function() {
      mouseState.down = false;
      if (!mouseState.entered) {
        $volumeSlider.addClass('lap-hidden');
      }
    };
  };
})(window);