!function(window, undefined) {

  /*>>*/
  var logger = tooly.Logger('EXPVOL', { level: 0 });
  /*<<*/

  var __id = __id || 0;  

  /**
   * Lap plugin providing support for hiding and showing
   * of a native range input on speaker-icon hover.
   * Works exactly like YouTube. Hover over the speaker icon 
   * and the volume range appears; move away, it is again hidden.
   * 
   * @param {Lap}    lap       the Lap instance
   * @param {String} nonVolumeControlsClass class name for elements to hide when volume range is shown
   */
  Lap.ExpandingVolumeRange = function(lap, container, speaker, nonVolumeControlsClass, levelClasses) {
    this.lap = lap;
    this.id = ++__id;
    this.name = 'EXPNDVOLRNG_' + this.id;
    /*>>*/
    logger.name = this.name;
    /*<<*/
    this.container = container || '.lap__volume__container';
    this.speaker= speaker || '.lap__speaker';
    this.nonVolumeControlsClass = nonVolumeControlsClass || '.lap__controls--non-volume';
    this.levelClasses = levelClasses || this.levelClasses;
    return this;
  };

  Lap.ExpandingVolumeRange.prototype.levelClasses = [
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
        $speaker = $(lev.speakerClass, lap.container), 
        $volumeRange = lap.$els.volumeRange,
        $opps = $(lev.nonVolumeControlsClass, lap.container),
        mouseState = { down: false, entered: false };

    if (!$volumeRange) {
      console.error(
        'Lap.ExpandingVolumeRange cannot init without Lap#$els.volumeRange element');
      return;
    }

    $volumeRange
      .on('change', function() {
        var v = this.value;

        var classNum = v > 0 ? Math.ceil(tooly.scale(v, 0, 100, 0, lev.levelClasses.length-1)) : 0;

        $speaker.removeClass(lev.levelClasses.filter(function(c) {
          return c !== lev.levelClasses[classNum];
        }).join(' ')).addClass(lev.levelClasses[classNum]);

      })
      .on('mousedown', function() {
        mouseState.down = true;
      });


    $(lev.container, lap.container)
      .on('mouseenter', function() {
        if (!mouseState.entered) {
          $volumeRange.removeClass(lap.selectors.state.hidden);
          $opps.addClass(lap.selectors.state.hidden);
          mouseState.entered = true;
        }
      })
      .on('mouseleave', function(e) {
        mouseState.entered = false;
        if (!mouseState.down) {
          $volumeRange.addClass(lap.selectors.state.hidden);
          $opps.removeClass(lap.selectors.state.hidden);
        };
      });

    // add the mouseup to the body so we can inc/dec volume by dragging
    // left or right regardless if we're in the same horizontal span as the slider
    // or not
    $('body').on('mouseup', function() {
      mouseState.down = false;
      if (!mouseState.entered) {
        $volumeRange.addClass(lap.selectors.state.hidden);
        $opps.removeClass(lap.selectors.state.hidden);
      }
    });
  };

}(window);