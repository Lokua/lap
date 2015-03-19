!function(undefined) { 'use strict';

  tooly.ready(function() {
    tooly.getJSON('lib.json', construct, true);
  });

  var logger = tooly.Logger('TEST', 0),
      $ = tooly.Frankie;

  function construct(data) {

    var lap = new Lap('#player', data, { 
      startingAlbumIndex: 1,
      startingTrackIndex: 1,
      selectorPrefix: 'lap',
      useNativeProgress: true,
      useNativeSeekRange: true,
      useNativeVolumeRange: true 
    }, false);


    lap.on('play', function() {
      logger.debug('what the fuck?');
    });
    
    lap.initialize();
  }

}();
