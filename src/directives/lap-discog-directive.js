(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapDiscogDirective', {
    outputTimestamp: false,
    level: 0,
    nameStyle: 'color:rgb(124, 0, 33);' 
  });
  /*<<*/
  
  angular.module('lnet.lap').directive('lapDiscog', lapDiscog);
  lapDiscog.$inject = ['$templateCache', 'tooly'];

  function lapDiscog($templateCache, tooly) {
    return {
      restrict: 'E',
      template: $templateCache.get('lap-discog.html'),
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
          scope.showDiscog = true;
        }

        function update() {
          scope.lib = lap.lib.map(function(item) {
            return { 
              cover: item.cover, 
              album: item.album 
            };
          });
        }

        scope.loadAlbum = function(index) {
          lap.setAlbum(index);
        };
      }        
    };
  }
  
})();