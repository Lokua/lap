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
        play : function() { 
          player.$els.playPause
            .removeClass('lap-i-play')
            .addClass('lap-i-pause');
        },
        pause: function() { 
          player.$els.playPause
            .removeClass('lap-i-pause')
            .addClass('lap-i-play'); 
        },
        load: function() {
          new player.ExpandingVolumeRange(
            player, 
            '.lap__volume__container',
            '.lap__speaker',
            '.lap__controls--non-volume'
          ).init();
        }
      }
    });
  }
}();