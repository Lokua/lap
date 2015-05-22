(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapPlaylistDirective', {
    outputTimestamp: false,
    level: 0,
    nameStyle: 'color:rgb(124, 126, 33);' 
  });
  /*<<*/
  
  angular.module('lnet.lap').directive('lapPlaylist', lapPlaylist);
  lapPlaylist.$inject = ['tooly'];

  function lapPlaylist(tooly) {
    return {
      restrict: 'E',
      templateUrl: '../src/templates/lap-playlist.html',
      link: function(scope, element, attrs) {

        var lap;

        var off = scope.$watch('ready', function(newValue, oldValue) {
          if (!newValue) return;
          lap = scope.lap;
          init();
          off();
        });

        function init() {

          format();
          scope.showPlayist = true;
          
          lap.on('albumChange', function() {
            format();
            scope.$apply();
          });
        }

        function format() {
          var len = String(lap.tracklist.length-1).length;
          var trackNumbers = lap.tracklist.map(function(track, i) {
            return tooly.lpad( String( (i+1) ), len, '0');
          });
          scope.tracklist = lap.tracklist;
          scope.trackNumbers = trackNumbers;
        }
      }
    };
  }


})();