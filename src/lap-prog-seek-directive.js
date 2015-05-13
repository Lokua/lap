(function() { 'use strict';

  var logger = new Lo66er('lapProgSeek', { nameStyle: 'color:darkturquoise' });
  
  angular.module('lap').directive('lapProgSeek', lapProgSeek);
  lapProgSeek.$inject = ['lapSvc'];

  function lapProgSeek(lapSvc) {
    return {
      restrict: 'E',
      template: '<div class="lap__prog-seek"></div>',
      link: function(scope, element, attrs) {
        logger.debug('link');
        element.addClass('lap__prog-seek__container');

        logger.debug(scope.$parent.src);
      },
      controller: function($scope, $element) {
      }
    };
  }

})();