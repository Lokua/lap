(function() { 'use strict';

  var logger = tooly.Logger('CSS_DEMO');
  var $ = tooly.Frankie;
  var fillColor = '#555';
  var trackColor = '#a7a7a7';
  var progOpts = {
    width: 76,
    height: 18,
    track: {
      fill: trackColor,
      height: 2
    },
    progress: {
      fill: fillColor,
      height: 2
    },
    knob: {
      fill: fillColor,
      height: 12,
      width: 6
    }
  };
  var volOpts = { width: 76, height: 18 };
  var players = {};  

  tooly.ready(function() {

    tooly.getJSON('lib.json', function(data) {
      createPlayer(data.data, 'fullPlayer', '#full-discography-player');
      createPlayer([{
        files: [
          'http://lokua.net/audio/13/Lokua_-_Midsummer_Nightmare.wav'
        ]      
      }], 'singlePlayer', '#single-track-player');
    }, true);


  });  

  function createPlayer(data, varname, container) {
    players[varname] = new Lap(container, data, { 
      useNativeVolumeRange: false, 
      useNativeSeekRange: false, 
      useNativeProgress: false,
      selectors: {
        volumeRange: 'lap__canvas-volume-range'
      },
      callbacks: {
        load: function() {
          var thiz = this;
          new thiz.CanvasProgSeek(thiz, '.lap__prog-seek', progOpts).init();
          new thiz.CanvasVolumeRange(thiz, '.lap__canvas-volume-range', volOpts).init();
          new thiz.VolumeRangeRevealer(
            thiz, 
            '.lap__canvas-volume-range__container',
            '.lap__speaker',
            '.lap__controls--non-volume'
          ).init();
          if (varname === 'fullPlayer') {
            new thiz.DiscogPopulator(thiz, '.lap__discog__container').init();
          }
        },
        discogClick: function() {
          logger.debug('toggling cover and playlist...');
          $('.lap__cover__container, .lap__playlist__panel').toggleClass('lap--hidden');
        }
      }
    });
  }

})();