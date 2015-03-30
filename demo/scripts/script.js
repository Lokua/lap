!function() {

  var logger = tooly.Logger('CSS_DEMO'),
      $ = tooly.Frankie;

  tooly.ready(function() {
    tooly.getJSON('lib.json', function(data) {
      run(data.data);
    }, true);
  });

  function run(data) {

    var player = new Lap('#full-discography-player', data, { 
      useNativeVolumeRange: false, 
      useNativeSeekRange: false, 
      useNativeProgress: false,
      selectors: {
        volumeRange: 'lap__canvas-volume-range'
      },
      callbacks: {
        load: function() {

          new player.VolumeRangeRevealer(
            player, 
            '.lap__volume__container',
            '.lap__speaker',
            '.lap__controls--non-volume'
          ).init();

          var fillColor = '#555', trackColor = '#a7a7a7';

          new player.CanvasProgSeek(player, '.lap__prog-seek', {
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
          }).init();

          new player.CanvasVolumeRange(player, '.lap__canvas-volume-range', {
            width: 76, 
            height: 18,
          }).init();
        }
      }
    });
  }
}();