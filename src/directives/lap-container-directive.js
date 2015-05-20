(function() { 'use strict';

  var logger = new Lo66er('lapContainer', { 
    outputTimestamp: false,
    level: 0,
    nameStyle: 'color:purple' 
  });
  
  angular.module('lnet.lap').directive('lapContainer', lapContainer);
  lapContainer.$inject = ['$parse', 'Lap'];

  function lapContainer($parse, Lap) {
    return {
      restrict: 'E',
      scope: {
        src: '@'
      },
      templateUrl: '../src/templates/lap-controls.html',
      link: function(scope, element, attrs) {

        scope.ready = false;
        scope.player = scope;

        element.addClass('lap');

        if (!attrs.hasOwnProperty('src')) {
          return console.warn('lap-container needs a src attribute. Exiting.');
        }

        scope.$watch('src', function(src) {
          var ch = src.charAt(0);

          if (ch === '[' || ch === '{') {
            logger.debug('src.charAt(0) === `[` or `}`. Evaluating...');
            src = scope.$eval(src);
          }

          Lap.getLib(src).then(function(lib) {
            scope.lap = new Lap(element, lib, {
              callbacks: {
                load: function() {
                  scope.ready = true;
                }
              }
            }, false, true); // ,,postpone,debug
            logger.debug('scope.lap: %o', scope.lap);
          }); 

        });
      }
    };
  }

})();