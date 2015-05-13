(function() { 'use strict';

  Lo66er.setDefaults({
    outputSource: true,
    useAbsoluteSource: true
  });

  var logger = new Lo66er('lapSvc', { level: 0 });
  
  angular.module('lap', []).factory('lapSvc', lapSvc);
  lapSvc.$inject = ['$http', '$q'];

  function lapSvc($http, $q) {

    var _audioExtensionRegExp = /mp3|wav|ogg|aiff/i;

    return {

      lib: null,

      /**
       * http get json or single-file url, yet ensure that lib
       * ends up in the discography form `[{}]`
       * @param  {string} url the path to a json library, audio file,
       *                      or endpoint that returns either
       * @return {Promise} this.lib
       */
      getLib: function(url) {
        var thiz = this,
            deferred = $q.defer();

        if (_audioExtensionRegExp.test(url)) {
          logger.log('url appears to be a single audio file');
          thiz.lib = [{ files: url }];
          deferred.resolve(thiz.lib);
          return deferred.promise;
        }

        return $http.get(url).then(function(response) {
          thiz.lib = response.data;
          deferred.resolve(thiz.lib);
          return deferred.promise;
        }, function(err) {
          return deferred.reject(err);
        });
      }
    };
  }

})();