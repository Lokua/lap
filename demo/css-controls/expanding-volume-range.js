;(function(window, undefined) {

  var __id = __id || 0;  

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
  Lap.ExpandingVolumeRange = function(lap, hideClass, classes) {
    this.lap = lap;
    this.id = ++__id;
    this.name = 'EXPNDVOLRNG_' + this.id;
    /*>>*/
    this.logger = tooly.Logger(0, this.name);
    /*<<*/
    this.hideClass = hideClass || 'lap-non-volume';
    this.classes = classes || this.classes;
    return this;
  };

  Lap.ExpandingVolumeRange.prototype.classes = [
    'lap-i-volume-off',
    'lap-i-volume-low',
    'lap-i-volume-mid',
    'lap-i-volume-high',
    'lap-i-volume-max'
  ];

  Lap.ExpandingVolumeRange.prototype.init = function() {
    var lev = this,
        lap = lev.lap,
        $ = tooly.Frankie,
        $speaker = $('.lap-speaker', lap.container), 
        $volumeRange = lap.$els.volumeRange,
        $opps = $(lev.hideClass, lap.container),
        mouseState = { down: false, entered: false };

    if (!$volumeRange) {
      console.error(
        'Lap.ExpandingVolumeRange cannot init without Lap#$els.volumeRange element');
      return;
    }

    $volumeRange
      .on('change', function() {
        var v = this.value;

        var classNum = v > 0 ? Math.ceil(tooly.scale(v, 0, 100, 0, lev.classes.length-1)) : 0;

        $speaker.removeClass(lev.classes.filter(function(c) {
          return c !== lev.classes[classNum];
        }).join(' ')).addClass(lev.classes[classNum]);

      })
      .on('mousedown', function() {
        mouseState.down = true;
      });


    $('.lap-volume-wrapper', lap.container)
      .on('mouseenter', function() {
        if (!mouseState.entered) {
          $volumeRange.removeClass('lap-hidden');
          $opps.addClass('lap-hidden');
          mouseState.entered = true;
        }
      })
      .on('mouseleave', function(e) {
        mouseState.entered = false;
        if (!mouseState.down) {
          $volumeRange.addClass('lap-hidden');
          $opps.removeClass('lap-hidden');
        };
      });

    // add the mouseup to the body so we can inc/dec volume by dragging
    // left or right regardless if we're in the same horizontal span as the slider
    // or not
    $('body').on('mouseup', function() {
      mouseState.down = false;
      if (!mouseState.entered) {
        $volumeRange.addClass('lap-hidden');
        $opps.removeClass('lap-hidden');
      }
    });
  };

})(window);