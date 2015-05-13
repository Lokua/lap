(function() { 'use strict';

  var logger = new Lo66er('lapContainer', { level: 0 });
  
  angular.module('lap').directive('lapContainer', lapContainer);
  lapContainer.$inject = ['$parse', 'lapSvc'];

  function lapContainer($parse, lapSvc) {
    return {
      restrict: 'E',
      scope: {
        src: '@'
      },
      templateUrl: '../../src/lap-controls.html',
      compile: function(tElement, tAttrs, transclude) {
        return {
          pre: function(scope, element, attrs) {

            logger.debug('pre');

            scope.ready = false;
            scope.player = scope;

            if (!attrs.hasOwnProperty('src')) {
              return console.warn('lap-container needs a src attribute. Exiting.');
            }

            scope.$watch('src', function(src) {
              var ch = src.charAt(0);

              if (ch === '[' || ch === '{') {
                src = scope.$eval(src);

              } else {
                lapSvc.getLib(src).then(function(lib) {
                  logger.debug('lib: %o', lib);
                });
              }

            });
          },
          post: angular.noop
        };
      },
      controller: function($scope, $element) {
        // logger.debug($element.children());
        // logger.debug($scope);
      }
    };
  }

})();