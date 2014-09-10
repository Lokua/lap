Lap.RaphaelControls = function(lap, options, init) {

  this.tooly = window.tooly || Lap.prototype.getTooly();
  this.lap = lap;

  var _defSize = 24, 
      _defBarSize = _defSize*4,
      // dual settings for seekbar and volume sloder
      _defBar = { 
        width: _defBarSize,
        height: _defSize/4,
        trackFill: '#eee',
        trackStroke: 'none',
        levelFill: '#888',
        levelStroke: 'none',
        knobFill: '#fff',
        knobStroke: '#ddd',
        knobWidth: 6,
        knobShape: 'circle', // circle or rect
      },
      
      _defaults = {
        padding: 2,
        width: _defSize, 
        height: _defSize,
        background: '#fff',
        fill: '#000',
        stroke: '#000',
        strokeWidth: 1,
        scale: true,
        scaleAmount: 0.95,
        seekStyle: 'buttons', // either 'bar' or 'buttons'
        seekbar: _defBar,
        volumeStyle: 'slider', // either 'slider' or 'buttons'
        volumeSlider: _defBar
      };

  this.settings = this.tooly.extend(true, {}, _defaults, options);

  if (init) this.init();

  return this;
}

Lap.RaphaelControls.prototype = (function() {

  return {

    init: function() {

      var t = this,
          lap = t.lap,
          settings = t.settings;

      t.id  = 'lap-rc-';   // id prefix for objs not effected by css changes
      t.idf = 'lap-rcf-';  // id prefix for css hover fill change
      t.ids = 'lap-rcs-';  // id prefix for css hover stroke change
      t.sliding = false;
      t.attrs = {
        fill: settings.fill,
        stroke: settings.stroke,
        strokeWidth: settings.strokeWidth
      };

      t.draw('playPause');
      t.draw('seekbar');
      if (settings.seekStyle === 'bar') {
        // TODO implement
      } else {
        t.draw('seekBackward');
        t.draw('seekForward');
      }
      t.draw('prev');
      t.draw('next');
      t.draw('info');
      t.draw('playlist');
      t.draw('discog');
      if (settings.volumeStyle === 'slider') {
        t.draw('volumeButton');
        t.draw('volumeSlider');
      } else {
        t.draw('volumeUp');
        t.draw('volumeDown');
      }
      t.draw('download');

      this.pause.hide();

      lap.registerCallbacks({
        togglePlay: function() { 
          if (lap.audio.paused) {
            t.pause.hide();
            t.play.show();
          } else {
            t.play.hide();
            t.pause.show();
          }
        }
      });

      return t;
    },

    draw: function(elem) {

      try {
        this.$el = this.lap.$els[elem];
        if (!this.$el) return this;
      } catch(e) {
        console.info('%o%s%o', e.name, '\n\telem:', elem);
      }

      this.paper = Raphael(this.$el, this.settings.width, this.settings.height);

      switch(elem) {
        case 'playPause': this.play = new Play(this); this.pause = new Pause(this); break;
        case 'seekbar': this.seekbar = new Seekbar(this); break;
        case 'seekBackward': this.seekBackward = new Seek(this, false); break;
        case 'seekForward': this.seekForward = new Seek(this, true); break;
        case 'prev': this.prev = new Skip(this, false); break;
        case 'next': this.next = new Skip(this, true); break;
        case 'volumeUp': this.volumeUp = new Volume(this, true); break;
        case 'volumeDown': this.volumeDown = new Volume(this, false); break;
        case 'volumeButton': this.volumeButton = new VolumeButton(this); break;
        case 'volumeSlider': this.volumeSlider = new VolumeSlider(this); break;
        case 'info': this.info = new Info(this); break;
        case 'playlist': this.playlist = new Playlist(this); break;
        case 'discog': this.discog = new Discog(this); break;
      }

      return this;
    }
  };
})();