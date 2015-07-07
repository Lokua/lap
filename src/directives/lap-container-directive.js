(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapContainer', { 
    outputTimestamp: false,
    level: 0,
    nameStyle: 'color:purple' 
  });
  /*<<*/
  
  angular.module('lnet.lap').directive('lapContainer', lapContainer);
  lapContainer.$inject = ['$templateCache', '$parse', 'Lap', 'lapUtil'];

  function lapContainer($templateCache, $parse, Lap, lapUtil) {
    return {
      restrict: 'E',
      scope: {
        src: '@'
      },
      template: $templateCache.get('lap-controls.html'),
      link: function(scope, element, attrs) {

        scope.ready = false;
        scope.discogActive = false;
        scope.isMobile = lapUtil.isMobile();

        // element.addClass('lap');

        if (!attrs.hasOwnProperty('src')) {
          return console.warn('lap-container needs a src attribute. Exiting.');
        }

        scope.$watch('src', function(src) {
          var ch = src.charAt(0);

          if (ch === '[' || ch === '{') {
            /*>>*/logger.debug('src.charAt(0) === `[` or `}`. Evaluating...');/*<<*/
            src = scope.$eval(src);
          }

          Lap.getLib(src).then(function(lib) {
            /* TODO: options should be able to be passed from user */
            new Lap(element, lib, {
              discogPlaylistExclusive: true,
              plugins: [],
              prependTrackNumbers: true,
              replacementText: void 0,
              startingAlbumIndex: 0,
              startingTrackIndex: 0,
              seekInterval: 5, 
              seekTime: 250,
              selectors: {},
              selectorPrefix: 'lap',
              trackNumberPostfix: ' - ',
              useNativeProgress: false,
              useNativeSeekRange: false,
              useNativeVolumeRange: false,
              volumeInterval: 0.05,              
              callbacks: {
                load: function() {
                  scope.lap = this;
                  scope.ready = true;
                }
              }
            }, false, true);
          }); 

        });
      }
    };
  }

})();