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

function Discog(rc) {

  var settings = rc.settings,
      w = settings.width,
      h = settings.height,
      cx = w/2,
      cy = h/2,
      paper = rc.paper;

  var discog = paper.set();

  var u = cx+cx/2,
      box1 = paper.rect(0, 0, u, u),
      box2 = paper.rect(cx-cx/2, cy-cy/2, u, u);

  box1.node.id = rc.idf + 'discog-box1-' + rc.lap.id;
  box2.node.id = rc.idf + 'discog-box2-' + rc.lap.id;

  discog.push(box1, box2);

  discog.attr({ fill: settings.fill, stroke: settings.background, strokeWidth: 2 });

  return discog;  
}


/**
 * renders a typical info icon; a circle with a blocky `i` in the center        
 */
function Info(rc) {
  
  var settings = rc.settings,
      w = settings.width,
      h = settings.height,
      cx = w/2,
      cy = h/2;

  var paper = rc.paper, 
      info = paper.set(),
      circle = paper.circle(cx, cy, cx)
        .attr({ fill: settings.fill, stroke: settings.stroke, strokeWidth: settings.strokeWidth });

  var attrs = { fill: settings.background, stroke: 'none' },
      d = 2.5, // divisor
      // the dot of the i
      dot  = paper.circle(cx, cy/2, cx/d/1.5).attr(attrs),
      // the stem of the i
      rect = paper.rect(cx-cx/(d*2), cy, cx/d, cy-cy/4).attr(attrs);

  // we don't want rec or dot effected by css hover (only circle)
  circle.node.id = rc.idf + 'info-circle-'   + rc.lap.id;
  dot.   node.id =          'lap-info-dot-'  + rc.lap.id;
  rect.  node.id =          'lap-info-rect-' + rc.lap.id;

  info.push(circle, dot, rect);

  return info; 
}

function Pause(rc) {
  
  var settings = rc.settings,
      w = settings.width,
      h = settings.height;

  var paper = rc.paper,
      pause = paper.set();

  var rect0 = paper.rect(0, 0, w/3, h).attr(rc.attrs),
      rect1 = paper.rect(w-w/3, 0, w/3, h).attr(rc.attrs);

  rect0.node.id = rc.idf + 'pause-rect0-' + rc.lap.id;
  rect1.node.id = rc.idf + 'pause-rect1-' + rc.lap.id;

  pause.push(rect0, rect1);

  return pause; 
}

function Play(rc) {

  var settings = rc.settings,
      w = settings.width,
      h = settings.height,
      cx = w/2,
      cy = h/2;

  // var paper = Raphael(rc.$el, w, h),
  var paper = rc.paper,
      play = paper.path(['M',0,0,'L',w,cy,'L',0,h,'z']).attr(rc.attrs);
      
  play.node.id = rc.idf + 'play-' + rc.lap.id;

  return play;
}

/**
 * renders a mobile-menu style playlist icon 
 * (square with three horizontal lines stacked)
 */
function Playlist(rc) {

  var w = rc.settings.width,
      h = rc.settings.height,
      cx = w/2,
      cy = h/2;

  var paper = rc.paper,
      playlist = paper.set(),
      bh = h/3.75, // bar height
      bar1 = paper.rect(0, 0, w, bh),
      bar2 = paper.rect(0, cy-(bh/2), w, bh),
      bar3 = paper.rect(0, h-bh, w, bh);

  bar1.node.id = rc.idf + 'playlist-button-bar1-' + rc.lap.id;
  bar2.node.id = rc.idf + 'playlist-button-bar2-' + rc.lap.id;
  bar3.node.id = rc.idf + 'playlist-button-bar3-' + rc.lap.id;

  playlist.push(bar1, bar2, bar3).attr(rc.attrs);

  return playlist;
}

function Seek(rc, forward) {
  
  var w = rc.settings.width,
      h = rc.settings.height,
      cx = w/2,
      cy = h/2,
      offs = 0.15,
      paper = rc.paper,
      seek;

  var path = [
    'M', 0 , cy,
    'L', cx, h*offs,
    'L', cx, cy,
    'L', w , h*offs,
    'L', w , h*(1-offs),
    'L', cx, cy,
    'L', cx, h*(1-offs),
    'z'
  ];

  if (forward) {
    seek = paper.path(path).transform(['r',180,cx,cy]);
  } else {
    seek = paper.path(path);
  }
  seek.attr(rc.attrs);

  seek.node.id = rc.idf + 'seek-' + (forward ? 'forward-' : 'backward-') + rc.lap.id;

  return seek; 
}

function Seekbar(rc) {

  var settings = rc.settings,
      ss = settings.seekbar,
      w = ss.width,
      h  = ss.height,
      strokeWidth = settings.strokeWidth,
      tooly = rc.tooly,
      lap = rc.lap,
      audio = lap.audio,
      _mousedown = false,
      $container = lap.$container,
      $el = rc.$el,
      $wrapper = tooly.select('.lap-seekbar', $container),
      p = (h < settings.height) ? (settings.height - h)/2 : 0,  // padding
      pad = 6; // horiz padding

  var paper = rc.paper;
  paper.setSize(w+(pad), settings.height);

  var seekbar = paper.set();

  var track = paper.rect(pad, p, w-pad, h)
    .attr({ fill: ss.trackFill, stroke: ss.trackStroke, strokeWidth: strokeWidth });

  var progress = paper.rect(pad, p, tooly.scale(lap.bufferFormatted(), 0, 100, pad, w-pad), h)
    .attr({ fill: ss.levelFill, stroke: ss.levelStroke, strokeWidth: strokeWidth });

  var playhead = (ss.knobShape === 'rect') ? 
    paper.rect(0, p, ss.knobWidth, h) :
    paper.circle(0, settings.height/2, ss.knobWidth);
  playhead.attr({ fill: ss.knobFill, stroke: ss.knobStroke, strokeWidth: strokeWidth });

  seekbar.push(track, progress, playhead);

  track.node.id    = 'lap-rc-seekbar-track'    + rc.lap.id;
  progress.node.id = 'lap-rc-seekbar-progress' + rc.lap.id;
  playhead.node.id = 'lap-rc-seekbar-playhead' + rc.lap.id;

  seekbar
    .mousedown(function(e) { _mousedown = true; })
    .mousemove(function(e) { 
      if (_mousedown) {
        var dest = (e.offsetX <= pad) ? pad : e.offsetX;
        dest = (e.offsetX >= w-pad) ? w-pad : dest;
        playhead.animate(ss.knobShape === 'rect' ? { x: dest } : { cx: dest });
      }
    })
    .mouseup(function(e) {
      if (_mousedown) {
        audio.currentTime = tooly.scale(e.offsetX, 0, w, 0, audio.duration);
        _mousedown = false;
      }
    });

  audio.addEventListener('progress', function(e) {
    progress.animate({ width: tooly.scale(lap.bufferFormatted(), 0, 100, pad, w-pad) });
  });
  audio.addEventListener('timeupdate', function() {
    if (!_mousedown) {
      var val = tooly.scale(audio.currentTime, 0, audio.duration, pad, w-pad);
      playhead.animate(ss.knobShape === 'rect' ? { x: val } : { cx: val });
    }
  });

  return seekbar;
}

function Skip(rc, forward) {
  
  var w = rc.settings.width,
      h = rc.settings.height,
      cx = w/2,
      cy = h/2,
      seek = {};

  var paper = rc.paper,
      skip = paper.set(),
      path = ['M',0,0,'L',w,cy,'L',0,h,'z'];

  var tri  = (forward) ?  paper.path(path) : 
                          paper.path(path).transform(['r',180,cx,cy]);

  var rextX = (forward) ? w-w/4 : 0,                        
      rect = paper.rect(rextX, 0, w/4, h);

  var pre = (forward) ? 'next-': 'prev-';

  tri .node.id = rc.idf + pre + 'tri-'  + rc.lap.id;
  rect.node.id = rc.idf + pre + 'rect-' + rc.lap.id;

  skip.push(tri, rect).attr(rc.attrs);

  return skip;       
}

/**
 * renders a typical right-facing speaker with sound-wave volume-curves icon.
 * meant only to hide or show an actual volume-slider, though could be used as a multi-level
 * toggle.
 */
function VolumeButton(rc) {

  var settings = rc.settings,
      w = settings.width,
      h = settings.height,
      cx = w/2,
      cy = h/2;

  // var paper = Raphael(rc.$el, w, h),
  var paper = rc.paper,
      button = paper.set();

  // draw the speaker-horn
  var horn = paper
    .path(['M',0,cy/2,'H',cx/2,'L',cx+cx/4,0,'V',h,'L',cx/2,cy+cy/2,'H',0,'z'])
    .attr(rc.attrs);

  // draw the sound-waves
  var d1 = 1.5, 
      d2 = 3,
      curve = ['M',w-cx/d2,cy/d2,'C',w,cy/d1,w,h-cy/d1,w-cx/d2,h-cy/d2],
      vattrs = {
        fill: 'none', 
        stroke: settings.fill, 
        strokeWidth: settings.strokeWidth,
        strokeLineCap: 'round'
      },
      curve1 = paper.path(curve).transform(['t',-2.5,0,'s',0.6]).attr(vattrs),
      curve2 = paper.path(curve).attr(vattrs);

  horn  .node.id = 'lap-rcf-volume-horn-'   + rc.lap.id;
  curve1.node.id = 'lap-rcs-volume-curve2-' + rc.lap.id;
  curve2.node.id = 'lap-rcs-volume-curve3-' + rc.lap.id;

  button.push(horn, curve1, curve2);

  return button;
}

function VolumeSlider(rc) {

  var settings = rc.settings,
      v = settings.volumeSlider,
      w = v.width,
      h  = v.height,
      knobWidth = 6,
      strokeWidth = settings.strokeWidth,
      tooly = rc.tooly,
      $container = rc.lap.$container,
      $el = rc.$el,
      $wrapper = tooly.select('.lap-volume-wrapper', $container),
      paper = rc.paper,
      p = (h < settings.height) ? (settings.height - h)/2 : 0; // padding;

  paper.setSize(w, settings.height);
  var slider = paper.set();

  var track = paper.rect(0, p, w, h)
    // .transform('s1,0.75,0,0')
    .attr({ fill: v.trackFill, stroke: v.trackStroke, strokeWidth: strokeWidth });

  var level = paper.rect(0, p, w * rc.lap.audio.volume, h)
    .attr({ fill: v.levelFill, stroke: v.levelStroke, strokeWidth: strokeWidth });

  var knob = (v.knobShape === 'rect') ? 
      paper.rect((w * rc.lap.audio.volume) - 2, p, knobWidth, h) :
      paper.circle((w * rc.lap.audio.volume) - 2, settings.height/2, knobWidth);
  knob.attr({ fill: v.knobFill,  stroke: v.knobStroke, strokeWidth: strokeWidth });

  track.node.id = 'lap-rc-volume-track' + rc.lap.id;
  level.node.id = 'lap-rc-volume-level' + rc.lap.id;
  knob .node.id = 'lap-rc-volume-knob'  + rc.lap.id;

  slider.push(track, level, knob);

  slider
    .mousedown(function(e) {
      rc.sliding = true;
      level.animate({ width: e.offsetX }, 20);
      knob.animate(v.knobShape === 'rect' ? { x: e.offsetX-2 } : { cx: e.offsetX-2 }, 20);
    })
    .mousemove(function(e) {
      if (rc.sliding) {

        var rect = e.target.getBoundingClientRect(),
            x = (e.clientX - rect.left) / rect.width * this.attrs.width + this.getBBox().x,
            val = tooly.scale(x, 0, w, 0, 1).toFixed(2);

        // happens with circle sometimes.
        if (isNaN(x)) return;

        // bounds check
        x = (x >= w-2) ? w : x;
        x = (val <= 0.05) ? 0 : x;
        val = (val >= 0.99) ? 1 : val;

        level.animate({ width: x }, 20);

        // adjust knob width
        var kx = (x === 0) ? x : x - 2;
        kx = (x === w) ? w-knobWidth : kx;

        try {
          knob.animate(v.knobShape === 'rect' ? { x: kx } : { cx: kx }, 20);
        } catch(e) {
          tooly.debug('knob catch: ', kx, val);
        }

        // hide/show horn waves depending on volume level
        if (val <= 0.666) rc.volumeButton[2].hide();
        if (val >  0.666) rc.volumeButton[2].show();
        if (val <= 0.333) rc.volumeButton[1].hide();
        if (val >  0.333) rc.volumeButton[1].show();

        try {
          rc.lap.audio.volume = val;
        } catch(e) {
          tooly.debug('volume catch: ', kx, val);
        }
      }
    })
    .mouseup(function(e) { rc.sliding = false; });

  // `wrapper` should be container holding both the slider and the volumeButton,
  // in which case hovering over the button will reveal the slider, and leaving the button
  // or slider will again hide the slider.
  $wrapper.addEventListener('mouseenter', function() {
    tooly.removeClass($el, 'lap-hidden');
  });
  $wrapper.addEventListener('mouseleave', function() {
    if (!rc.sliding) tooly.addClass($el, 'lap-hidden');
  });

  return slider;
}

/**
 * render an upward or downward facing arrow icon, depending on the boolean value of up.
 */
function Volume(rc, up) {
  
  var settings = rc.settings,
      w = settings.width,
      h = settings.height,
      cx = w/2,
      cy = h/2;

  var volume = rc.paper
    .path(['M',0,0,'L',w,cy,'L',0,h,'z'])
    .transform(['r', up?-90:90, cx, cy])
    .attr(rc.attrs);

  volume.node.id = rc.idf + 'volume-' + (up?'up-':'down-') + rc.lap.id;
  
  return volume;
}