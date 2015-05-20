(function(undefined) { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapVolumeRangeRevealer', { 
    nameStyle: 'color:orangered',
    level: 0 
  });
  /*<<*/

  angular.module('lnet.lap').directive('lapVolumeRangeRevealer', lapVolumeRangeRevealer);
  lapVolumeRangeRevealer.$inject = ['tooly', 'Lap', 'lnetQuery'];

  function lapVolumeRangeRevealer(tooly, Lap, lnetQuery) {

    /**
     * Lap plugin providing support for hiding and showing
     * of a native range input on speaker-icon hover - like Youtube.
     * Hover over the speaker icon and the volume range appears; move away, 
     * it is again hidden.
     * 
     * @param {Lap}    lap       the Lap instance
     * @param {jqLite} element
     * @constructor
     */
    Lap.VolumeRangeRevealer = function(lap, element) {
      var thiz = this;
      thiz.lap = lap;
      thiz.element = element;
      return thiz;      
    };  

    Lap.VolumeRangeRevealer.prototype.levelClasses = [
      'lap-i-volume-off',
      'lap-i-volume-low',
      'lap-i-volume-mid',
      'lap-i-volume-high',
      'lap-i-volume-max'
    ];

    Lap.VolumeRangeRevealer.prototype.init = function() {
      var thiz = this,
          lap = thiz.lap,
          container = angular.element(lap.container),
          speaker = lnetQuery.selector(container, '.lap__speaker'),
          speakerContainer =  lnetQuery.selector(container, '.lap__speaker__container'), 
          volumeRange = lap.els.volumeRange,
          rangeWidth = volumeRange.find('canvas').attr('width'),
          // opps = lnetQuery.selector(container, '.lap__control--non-volume'),
          opps = angular.element(container[0].querySelectorAll('.lap__control--non-volume')),
          MOUSEDOWN, SPEAKER_ENTERED, RANGE_ENTERED;

      if (!volumeRange) {
        throw new Lap.PluginContructorError(
          'Lap.VolumeRangeRevealer cannot init without Lap#els.volumeRange element');
      }


      // TODO: these would be better as callback hooks on CanvasVolumeRange events
      volumeRange
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
          speaker.removeClass(thiz.levelClasses.filter(function(c) {
            return c !== thiz.levelClasses[classNum];
          }).join(' ')).addClass(thiz.levelClasses[classNum]);
        })
        .on('mouseleave', function() {
          RANGE_ENTERED = false;
          if (!MOUSEDOWN) release();
        });


      speaker
        .on('mouseenter', function() {
          if (!SPEAKER_ENTERED && !RANGE_ENTERED) {
            container.removeClass(lap.selectors.state.hidden);
            opps.addClass(lap.selectors.state.hidden);
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
      lnetQuery.selector('body').on('mouseup', function() {
        MOUSEDOWN = false;
        if (!RANGE_ENTERED && !SPEAKER_ENTERED) release();
      });

      function release() {
        thiz.element.addClass(lap.selectors.state.hidden);
        opps.removeClass(lap.selectors.state.hidden);
      }

      /*>>*/
      logger.debug('post init >> this: %o', thiz);
      /*<<*/
    };

    return {
      restrict: 'A',
      link: function(scope, element, attrs) {

        var revealer;

        var off = scope.$watch('ready', function(newValue, oldValue) {
          if (!newValue) return;
          
          revealer = new Lap.VolumeRangeRevealer(scope.lap, element);
          revealer.init();

          off();
        });
      }
    };
  }


})();