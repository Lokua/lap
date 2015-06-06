(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapUtil', {
    level: 0,
    nameStyle: 'color:brown'
  });
  /*<<*/

  angular.module('lnet.lap').factory('lapUtil', lapUtil);
  lapUtil.$inject = ['tooly'];

  function lapUtil(tooly) {

    var _body, _isMobileRegExp;

    function _isNode(el) {
      return el && (el.nodeType === 1 || el.nodeType === 9);
    }

    function _query(which, selector, context) {
      var node;
      if (context) {
        node = (_isNode(context) ? context : context[0])[which](selector);
      } else {
        node = document[which](selector);
      }
      return angular.element(node);

    }

    return {

      isMobile: function() {
        if (!_isMobileRegExp) {
          _isMobileRegExp = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        }
        return _isMobileRegExp.test(navigator.userAgent);
      },

      safeApply: function(scope) {
        var phase = scope.$root.$$phase;
        if (phase !== '$apply' && phase !== '$digest') {
          scope.$apply();
        }
      },

      /**
       * Used to avoid duplicate selections of body element
       * @return {jqLite}
       */
      body: function() {
        if (!_body) {
          _body = this.element('body');
        }
        return _body;
      },

      /**
       * @return {Boolean}    true if el is an instance of Node
       */
      isNode: function(el) {
        return _isNode(el);
      },

      /**
       * angular's jqLite does not provide lookup by class,
       * so here we have an abstraction that works exactly like HTMLElement.querySelector,
       * only returning an angular.element instead. for querySelectorAll use #elementAll
       */
      element: function(selector, context) {
        return _query('querySelector', selector, context);
      },
      elementAll: function(selector, context) {
        return _query('querySelectorAll', selector, context);
      }

    };
  }

})();