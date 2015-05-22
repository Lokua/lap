(function(undefined) { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapVolumeRangeRevealer', { 
    nameStyle: 'color:orangered',
    level: 0 
  });
  /*<<*/

  angular.module('lnet.lap').directive('lapVolumeRangeRevealer', lapVolumeRangeRevealer);
  lapVolumeRangeRevealer.$inject = ['$document', '$timeout', '$interval', 'tooly', 'Lap', 'lapUtil'];

  function lapVolumeRangeRevealer($document, $timeout, $interval, tooly, Lap, lapUtil) {

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
          lapContainer = angular.element(lap.container)[0],
          speaker = lapUtil.element('.lap__speaker', lapContainer),
          speakerContainer = lapUtil.element('.lap__speaker__container', lapContainer),
          volumeRange = lap.els.volumeRange,
          rangeWidth = thiz.element[0].querySelector('.lap__canvas-volume-range__track').width,
          nonVolumeControls = lapUtil.elementAll('.lap__non-v', lapContainer),
          MOUSEDOWN, SPEAKER_ENTERED, RANGE_ENTERED;

      if (!volumeRange || !volumeRange.length) {
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

          logger.debug('rangeWidth: %o, e.offsetX: %o, v: %o, classNum: %o, thiz.levelClasses[classNum]: %o', 
            rangeWidth, e.offsetX, v, classNum, thiz.levelClasses[classNum]);

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
            thiz.element.removeClass(lap.selectors.state.hidden);
            nonVolumeControls.addClass(lap.selectors.state.hidden);
            SPEAKER_ENTERED = true;
          }
        })
        .on('mouseleave', function(e) {
          SPEAKER_ENTERED = false;
          // allow time to move mouse into the range element
          $timeout(function() {
            if (!SPEAKER_ENTERED && !RANGE_ENTERED) {
              release();
            }
          }, 500);
        });


      // add the mouseup to the body so we can inc/dec volume by dragging
      // left or right regardless if we're in the same horizontal span as the slider
      // or not
      lapUtil.body().on('mouseup', function() {
        MOUSEDOWN = false;
        if (!RANGE_ENTERED && !SPEAKER_ENTERED) release();
      });

      function release() {
        thiz.element.addClass(lap.selectors.state.hidden);
        nonVolumeControls.removeClass(lap.selectors.state.hidden);
      }

      lap.registerPlugin('VolumeRangeRevealer', thiz);

      /*>>*/
      logger.debug('post init >> this: %o', thiz);
      /*<<*/
    };

    return {
      restrict: 'A',
      link: function(scope, element, attrs) {

        var revealer;

        var unwatch = scope.$watch('ready', function(newValue, oldValue) {
          if (!newValue) return;

          revealer = new Lap.VolumeRangeRevealer(scope.lap, element);
          unwatch();

          unwatch = scope.$watch('vRangeReady', function(newValue, oldValue) {
            if (!newValue) return;

            revealer.init();
            unwatch();
          });
        });
      }
    };
  }


})();