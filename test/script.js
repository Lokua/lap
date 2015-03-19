!function(_, $, undefined) { 'use strict';

  var logger = _.Logger('TEST', 0);

  _.ready(function() {
    _.getJSON('lib.json', construct, true);
  });


  function construct(data) {

    var lap = new Lap('#player', data, { 
      startingAlbumIndex: 1,
      startingTrackIndex: 1,
      selectorPrefix: 'lap',
      useNativeProgress: true,
      useNativeSeekRange: true,
      useNativeVolumeRange: true,
      callbacks: {
        load: updateMeta,
        albumChange: updateMeta
      }
    }, false);

    function updateMeta() {
      $('#lap__album-index').html(lap.albumIndex);
      $('#lap__els-length').html(Object.keys(lap.$els).length);
    }
    
    lap.initialize();
  }

}(tooly, tooly.Frankie);
