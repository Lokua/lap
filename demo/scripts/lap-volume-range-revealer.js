!function(undefined) { 'use strict';

  /*>>*/
  var logger = tooly.Logger('VOLUME_RANGE_REVEALER', { level: 0 });
  /*<<*/

  var _id = _id || 0;

  Lap.prototype.VolumeRangeRevealer = VolumeRangeRevealer;  

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
  function VolumeRangeRevealer(lap, container, speaker, nonVolumeControlsClass, levelClasses) {
    var plug = this;
    plug.lap = lap;
    plug.id = ++_id;
    plug.name = 'VOLUME_RANGE_REVEALER' + plug.id;
    plug.container = container || '.lap__volume__container';
    plug.speaker = speaker || '.lap__speaker';
    plug.nonVolumeControlsClass = nonVolumeControlsClass || '.lap__controls--non-volume';
    plug.levelClasses = levelClasses || plug.levelClasses;
    return plug;
  }

  VolumeRangeRevealer.prototype.levelClasses = [
    'lap-i-volume-off',
    'lap-i-volume-low',
    'lap-i-volume-mid',
    'lap-i-volume-high',
    'lap-i-volume-max'
  ];

  VolumeRangeRevealer.prototype.init = function() {
    var thiz = this,
        lap = thiz.lap,
        $ = tooly.Frankie,
        $container = $(thiz.container, lap.container),
        $speaker = $(thiz.speaker, lap.container),
        $speakerContainer = $('.lap__speaker__container', lap.container), 
        $volumeRange = lap.$els.volumeRange,
        rangeWidth = $volumeRange.find('canvas').attr('width'),
        $opps = $(thiz.nonVolumeControlsClass, lap.container),
        MOUSEDOWN, SPEAKER_ENTERED, RANGE_ENTERED;

    if (!$volumeRange) {
      console.error(
        'Lap.VolumeRangeRevealer cannot init without Lap#$els.volumeRange element');
      return;
    }


    // TODO: these would be better as callback hooks on CanvasVolumeRange events
    $volumeRange
      .on('mouseenter', function() {
        RANGE_ENTERED = true;
      })
      .on('mousedown', function() {
        MOUSEDOWN = true;
      })
      .on('mousemove', function(e) {
        if (!MOUSEDOWN) return;
        var v = tooly.scale(e.offsetX, 0, rangeWidth, 0, 100),
            classNum = 0;
        if (v > 0) {
          var n = tooly.scale(v, 0, 100, 0, thiz.levelClasses.length-1);
          classNum = Math.ceil(n); 
        }
        $speaker.removeClass(thiz.levelClasses.filter(function(c) {
          return c !== thiz.levelClasses[classNum];
        }).join(' ')).addClass(thiz.levelClasses[classNum]);
      })
      .on('mouseleave', function() {
        RANGE_ENTERED = false;
        if (!MOUSEDOWN) release();
      });


    // $(thiz.container, lap.container)
    $speaker
      .on('mouseenter', function() {
        if (!SPEAKER_ENTERED && !RANGE_ENTERED) {
          $container.removeClass(lap.selectors.state.hidden);
          $opps.addClass(lap.selectors.state.hidden);
          SPEAKER_ENTERED = true;
        }
      })
      .on('mouseleave', function(e) {
        SPEAKER_ENTERED = false;
        // allow time to move mouse into the range element
        setTimeout(function() {
          if (!SPEAKER_ENTERED && !RANGE_ENTERED) release();
        }, 250 /*500*/);
      });


    // add the mouseup to the body so we can inc/dec volume by dragging
    // left or right regardless if we're in the same horizontal span as the slider
    // or not
    $('body').on('mouseup', function() {
      MOUSEDOWN = false;
      if (!RANGE_ENTERED && !SPEAKER_ENTERED) release();
    });

    function release() {
      $container.addClass(lap.selectors.state.hidden);
      $opps.removeClass(lap.selectors.state.hidden);
    }
  };
}();