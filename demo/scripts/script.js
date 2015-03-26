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
      useNativeVolumeRange: true,
      useNativeSeekRange: true,
      useNativeProgress: true,
      callbacks: {
        load: function() {

          new player.ExpandingVolumeRange(
            player, 
            '.lap__volume__container',
            '.lap__speaker',
            '.lap__controls--non-volume'
          ).init();

          new player.Progress(player, '#canvas', {
            height: 18,
            playhead: {
              height: 12,
              width: 6
            },
            progress: {
              height: 2
            },
            track: {
              height: 2
            }
          }).init();

          // possible cross-browser range hacks...
          // set margin 0 on input range for mozilla

        }
      }
    });
  }
}();