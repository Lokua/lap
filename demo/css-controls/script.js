;(function(window, undefined) {

  tooly.ready(function() {
    tooly.getJSON('../lib.json', function(data) {
      run(data.data);
    }, true);
  });

  function run(data) {

    var logger = tooly.Logger(0, 'CSS_DEMO');
    var $ = tooly.Frankie.bind(this);

    var fullDiscogPlayer = new Lap('#full-discography-player', data, { 
      useNativeVolumeRange: true,
      useNativeSeekRange: true,
      useNativeProgress: true,
      callbacks: {
        play : function() { 
          fullDiscogPlayer.$els.playPause
            .removeClass('lap-i-play')
            .addClass('lap-i-pause');
        },
        pause: function() { 
          fullDiscogPlayer.$els.playPause
            .removeClass('lap-i-pause')
            .addClass('lap-i-play'); 
        }
      },
      plugins: [{ 
        constructor: Lap.ExpandingVolumeRange, 
        // args here is redundant as they are the defaults
        args: [
          '.lap__volume__container',
          '.lap__speaker',
          '.lap__controls--non-volume'
        ] 
      }, {
        constructor: Lap.DiscogPopulator
      }] 
    }, false);

    fullDiscogPlayer.initialize();

    // var singleTrackPlayerLib = {
    //   artist: 'Lokua',
    //   files: ['../sh.mp3']
    // };

    // var singleTrackPlayer = new Lap('#single-track-player', singleTrackPlayerLib, {
    //   useNativeVolumeRange: true,
    //   useNativeSeekRange: true,
    //   callbacks: {
    //     play: function() { 
    //       singleTrackPlayer.$els.playPause.removeClass('lap-i-play').addClass('lap-i-pause');
    //     },
    //     pause: function() { 
    //       singleTrackPlayer.$els.playPause.removeClass('lap-i-pause').addClass('lap-i-play'); 
    //     }
    //   },
    //   plugins: [{ constructor: Lap.ExpandingVolumeRange }]
    // }, false);
    // singleTrackPlayer.initialize();

    // var miniPlayer = new Lap('#mini-player', { files: ['../sh.mp3'] }, {
    //   callbacks: {
    //     play: function() { 
    //       miniPlayer.$els.playPause.removeClass('lap-i-play').addClass('lap-i-pause');
    //     },
    //     pause: function() { 
    //       miniPlayer.$els.playPause.removeClass('lap-i-pause').addClass('lap-i-play'); 
    //     }
    //   }
    // }, false);
    // miniPlayer.initialize();

  }
})(window);