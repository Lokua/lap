/**
 * Lap plugin providing support for hiding and showing
 * of a native range input on speaker-icon hover.
 * Works exactly like YouTube. Hover over the speaker icon 
 * and the volume range appears; move away, it is again hidden.
 * 
 * @param {Lap}    lap       the Lap instance
 * @param {String} hideClass class name for elements to hide
 *                           when volume range is shown, and vis a versa
 */
Lap.ExpandingVolumeRange = function(lap, hideClass) {
  this.lap = lap;
  this.hideClass = hideClass;
  return this;
}

Lap.ExpandingVolumeRange.prototype.name = 'ExpandingVolumeRange';

Lap.ExpandingVolumeRange.prototype.init = function() {
  var me = this,
      lap = me.lap,
      $ = tooly.Frankie,
      pre = lap.settings.selectorPrefix,
      $speaker = $('.'+pre+'-speaker', lap.container), 
      $volumeSlider = lap.$els.volumeSlider,
      $opps = $(me.hideClass, lap.container),
      mouseState = { down: false, entered: false };


  $volumeSlider
    .on('change', function() {

      var v = this.value;

      if (v < 33) {
        $speaker.removeClass('fa-volume-up fa-volume-down')
          .addClass('fa-volume-off');
      } else if (v < 66) {
        $speaker.removeClass('fa-volume-up fa-volume-off')
          .addClass('fa-volume-down');
      } else {
        $speaker.removeClass('fa-volume-off fa-volume-down')
          .addClass('fa-volume-up ');
      }
    })
    .on('mousedown', function() {
      mouseState.down = true;
    });

  var hidden = pre+'-hidden';

  $('.'+pre+'-volume-wrapper', lap.container)
    .on('mouseenter', function() {
      if (!mouseState.entered) {
        $volumeSlider.removeClass(hidden);
        $opps.addClass(hidden);
        mouseState.entered = true;
      }
    })
    .on('mouseleave', function(e) {
      mouseState.entered = false;
      if (!mouseState.down) {
        $volumeSlider.addClass(hidden);
        $opps.removeClass(hidden);
      };
    });

  // add the mouseup to the body so we can inc/dec volume by dragging
  // left or right regardless if we're in the same horizontal span as the slider
  // or not
  $(lap.container).on('mouseup', function() {
    mouseState.down = false;
    if (!mouseState.entered) {
      $volumeSlider.addClass(hidden);
      $opps.removeClass(hidden);
    }
  });
};