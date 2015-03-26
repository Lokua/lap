!function(undefined) {

  /*>>*/
  var logger = tooly.Logger('EXPVOL', { level: 0 });
  /*<<*/

  var _id = _id || 0;

  Lap.prototype.ExpandingVolumeRange = ExpandingVolumeRange;  

  /**
   * Lap plugin providing support for hiding and showing
   * of a native range input on speaker-icon hover - like Youtube.
   * Hover over the speaker icon and the volume range appears; move away, 
   * it is again hidden.
   * 
   * @param {Lap}    lap       the Lap instance
   * @param {String} container valid css3 selector string, defaults to '.lap__volume__container'
   * @param {String} speaker valid css3 selector string for the speaker icon, defaults to '.lap__speaker'
   * @param {String} nonVolumeControlsClass class name for elements to hide when volume range is shown
   * @param {Array} levelClasses classes to add the speaker element whenever the volume changes (used
   *                             to show differentvolume icons depending on the volume level)
   */
  function ExpandingVolumeRange(lap, container, speaker, nonVolumeControlsClass, levelClasses) {
    var plug = this;
    plug.lap = lap;
    plug.id = ++_id;
    plug.name = 'EXPNDVOLRNG_' + plug.id;
    plug.container = container || '.lap__volume__container';
    plug.speaker = speaker || '.lap__speaker';
    plug.nonVolumeControlsClass = nonVolumeControlsClass || '.lap__controls--non-volume';
    plug.levelClasses = levelClasses || plug.levelClasses;
    return plug;
  }

  ExpandingVolumeRange.prototype.levelClasses = [
    'lap-i-volume-off',
    'lap-i-volume-low',
    'lap-i-volume-mid',
    'lap-i-volume-high',
    'lap-i-volume-max'
  ];

  ExpandingVolumeRange.prototype.init = function() {
    var thiz = this,
        lap = thiz.lap,
        $ = tooly.Frankie,
        $speaker = $(thiz.speakerClass, lap.container), 
        $volumeRange = lap.$els.volumeRange,
        $opps = $(thiz.nonVolumeControlsClass, lap.container),
        DOWN = ENTERED = false;

    if (!$volumeRange) {
      console.error(
        'Lap.ExpandingVolumeRange cannot init without Lap#$els.volumeRange element');
      return;
    }

    $volumeRange
      .on('change', function() {
        var v = this.value,
            classNum = 0;
        if (v > 0) {
          var n = tooly.scale(v, 0, 100, 0, thiz.levelClasses.length-1);
          classNum = Math.ceil(n); 
        }
        $speaker.removeClass(thiz.levelClasses.filter(function(c) {
          return c !== thiz.levelClasses[classNum];
        }).join(' ')).addClass(thiz.levelClasses[classNum]);
      })
      .on('mousedown', function() {
        DOWN = true;
      });


    $(thiz.container, lap.container)
      .on('mouseenter', function() {
        if (!ENTERED) {
          $volumeRange.removeClass(lap.selectors.state.hidden);
          $opps.addClass(lap.selectors.state.hidden);
          ENTERED = true;
        }
      })
      .on('mouseleave', function(e) {
        ENTERED = false;
        if (!DOWN) {
          $volumeRange.addClass(lap.selectors.state.hidden);
          $opps.removeClass(lap.selectors.state.hidden);
        };
      });

    // add the mouseup to the body so we can inc/dec volume by dragging
    // left or right regardless if we're in the same horizontal span as the slider
    // or not
    $('body').on('mouseup', function() {
      DOWN = false;
      if (!ENTERED) {
        $volumeRange.addClass(lap.selectors.state.hidden);
        $opps.removeClass(lap.selectors.state.hidden);
      }
    });
  };
}(window);