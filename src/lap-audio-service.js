(function() { 'use strict';

  angular.module('lap').factory('lapAudioSvc', lapAudioSvc);
  lapAudioSvc.$inject = ['lapSvc'];

  function lapAudioSvc(lapSvc) {

    return {
      // create: function(player) {
      //   player.audio = new Audio();
      //   player.audio.preload = 'auto';
      //   var fileType = lapSvc.getFileType(player),
      //       canPlay = this.audio.canPlayType('audio/' + fileType);
      //   if (canPlay === 'probably' || canPlay === 'maybe') {
      //     this.setSource();
      //     this.audio.volume = 0.80;
      //   } else {
      //     console.log('This browser does not support ' + fileType + ' playback.');
      //   }
      // }
    };
  }  

})();