(function() { 'use strict';
  
  /*>>*/
  Lo66er.setDefaults({
    outputTimestamp: false,
    outputSource: true,
    useAbsoluteSource: true,
    nameStyle: 'color:darkblue'
  });
  /*<<*/

  angular.module('lnet.lap', ['tooly'])
    .constant('lnetQuery', {
      selector: function(element, selector) {
        if (!element && selector) {
          return angular.element(document.querySelector(selector));
        } else if (typeof element === 'string') {
          if (arguments.length === 1) {
            return angular.element(document.querySelector(element));
          }
        }
        return angular.element(element[0].querySelector(selector));
      }
    });

})();