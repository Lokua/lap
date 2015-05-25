(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapPlaylistDirective', {
    outputTimestamp: false,
    level: 0,
    nameStyle: 'color:rgb(124, 126, 33);' 
  });
  /*<<*/
  
  angular.module('lnet.lap').directive('lapPlaylist', lapPlaylist);
  lapPlaylist.$inject = ['$templateCache', 'tooly', 'lapUtil'];

  function lapPlaylist($templateCache, tooly, lapUtil) {
    return {
      restrict: 'E',
      template: $templateCache.get('lap-playlist.html'),
      scope: true,
      link: function(scope, element, attrs) {

        var lap;

        var off = scope.$watch('lap', function(newValue, oldValue) {
          if (!newValue) return;
          lap = newValue;
          logger.debug('watch >> lap: %o', lap);
          init();
          off();
        });        

        function init() {

          update();
          scope.showPlayist = true;
          
          lap
            .on('albumChange', function() {
              update();
              lapUtil.safeApply(scope);
            })
            .on('trackChange', function() {
              lapUtil.safeApply(scope);
            });
        }

        scope.setTrack = function(index) {
          lap.setTrack(index);
        };

        function update() {
          var len = String(lap.trackCount).length;
          scope.trackNumbers = lap.tracklist.map(function(track, i) {
            return tooly.lpad(String(i+1), len, '0');
          });
          scope.tracklist = lap.tracklist;
          scope.cover = lap.cover;
        }
      }
    };
  }


})();