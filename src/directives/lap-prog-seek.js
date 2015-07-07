(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapProgSeek', {
    level: 0,
    nameStyle: 'color:indigo'
  });
  /*<<*/

  angular.module('lnet.lap').directive('progSeek', progSeek);
  progSeek.$inject = ['$timeout', 'tooly'];

  var _id = _id || 0;

  function progSeek($timeout, tooly) {

    function makeEl(name, id) {
      return angular.element('<div class="prog-seek__' + name +
        '" id="prog-seek__'+ name + '--' + id + '">');
    }

    return {
      restrict: 'E',
      link: function(scope, element, attrs) {

        var id = _id++,
            container = makeEl('container', id),
            inner     = makeEl('inner',     id),
            track     = makeEl('track',     id),
            progress  = makeEl('progress',  id),
            handle    = makeEl('handle',    id),
            dragging = false,
            timeUpdating = false,
            dragdealer, lap, audio;

        if (scope.options && !angular.equals(scope.options, {})) {
          var o = scope.options;
          if (o.progressColor) progress.css('background-color', o.progressColor);
          if (o.handleColor) handle.css('background-color', o.handleColor);
          if (o.trackColor) track.css('background-color', o.trackColor);
        }

        element.append(container.append(inner
          .append(track)
          .append(progress)
          .append(handle)));

        var off = scope.$watch('ready', function(newValue, oldValue) {
          if (!newValue) return;
          off();


          lap = scope.$parent.lap;
          /*>>*/logger.debug('ready >> lap: %o', lap);/*<<*/
          audio = lap.audio;

          dragdealer = new Dragdealer('prog-seek__container--' + id, {
            handleClass: 'prog-seek__handle',
            dragStartCallback: function(x, y) {
              dragging = true;
            },
            dragStopCallback: function(x, y) {
              audio.currentTime = tooly.scale(x, 0, 1, 0, audio.duration);
              dragging = false;
            }/*,
            animationCallback: function(x, y) {
              $timeout(function() {
                if (dragging) {
                  audio.currentTime = tooly.scale(x, 0, 1, 0, audio.duration);
                }
              });
            }*/
          });          

          audio.addEventListener('timeupdate', function(e) {
            if (!dragging) {
              dragdealer.setValue(tooly.scale(audio.currentTime, 0, audio.duration, 0, 1));
            }
          });
          audio.addEventListener('progress', function(e) {
            var x = +lap.bufferFormatted();
            progress.css('width', x + '%');
          });
        });
      }
    };
  }
})();