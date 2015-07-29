(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lap-volume-range', {
    level: 0,
    nameStyle: 'color:indigo'
  });
  /*<<*/

  angular.module('lnet.lap').directive('lapVolumeRange', lapVolumeRange);
  lapVolumeRange.$inject = ['tooly'];

  var _id = _id || 0;

  function lapVolumeRange() {

    function makeEl(name, id) {
      return angular.element('<div class="lap__volume-range__' + name +
        '" id="lap__volume-range__'+ name + '--' + id + '">');
    }

    return {
      restrict: 'E',
      link: function(scope, element, attrs) {
          var id = _id++,
            container = makeEl('container', id),
            inner     = makeEl('inner',     id),
            track     = makeEl('track',     id),
            handle    = makeEl('handle',    id),
            dragging = false,
            // timeUpdating = false,
            dragdealer, lap, audio;

        if (scope.options && !angular.equals(scope.options, {})) {
          var o = scope.options;
          // if (o.progressColor) progress.css('background-color', o.progressColor);
          if (o.handleColor) handle.css('background-color', o.handleColor);
          if (o.trackColor) track.css('background-color', o.trackColor);
        }

        element.append(container.append(inner
          .append(track)
          // .append(progress)
          .append(handle)));

        var off = scope.$watch('ready', function(newValue, oldValue) {
          if (!newValue) return;
          off();

          lap = scope.$parent.lap;
          /*>>*/logger.debug('ready >> lap: %o', lap);/*<<*/
          audio = lap.audio;

          dragdealer = new Dragdealer('lap-volume-range__container--' + id, {
            handleClass: 'lap__volume-range__handle',
            dragStartCallback: function(x, y) {
              dragging = true;
              scope.vrangeDragging = true;
              scope.$apply();
            },
            dragStopCallback: function(x, y) {
              // audio.volume = tooly.scale(x, 0, 1, 0, audio.duration);
              dragging = false;
              scope.vrangeDragging = false;
              scope.$apply();
            }
          });

          scope.vRangeReady = true;

          audio.addEventListener('volumeupdate', function(e) {
            /*>>*/logger.debug('volumeupdate fired');/*<<*/
            // if (!dragging) {
            //   dragdealer.setValue(tooly.scale(audio.currentTime, 0, audio.duration, 0, 1));
            // }
          });
          // audio.addEventListener('progress', function(e) {
          //   var x = +lap.bufferFormatted();
          //   progress.css('width', x + '%');
          // });
          
        });
      }
    };
  }

})();