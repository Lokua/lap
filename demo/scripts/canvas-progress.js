!function(undefined) { 'use strict';


  /*>>*/
  var logger = tooly.Logger('EXPVOL', { level: 0 });
  /*<<*/
  var $ = tooly.Frankie;

  Lap.prototype.Progress = Progress;

  function Progress(lap, canvas, options) {

    var t = this;

    t.lap = lap;
    t.canvas = $(canvas, lap.container).get(0);
    t.ctx = t.canvas.getContext('2d');

    var _h = 16; // default height

    t.settings = tooly.extend({}, {
      track: {
        draw: true,
        fill: '#bbb',
        stroke: null,
        height: _h
      },
      progress: {
        draw: true,
        fill: '#999',
        stroke: null,
        height: _h
      },    
      playhead: {
        draw: true,
        fill: '#000',
        stroke: null,
        height: _h,
        width: 4
      },
      lineWidth: 2,
      width:  t.canvas.width  || 100,
      height: t.canvas.height || 16,
      padding: 0
    }, options);

    return t;
  }

  var MOUSEDOWN = false;

  Progress.prototype.init = function() {
    var t = this,
        audio = t.lap.audio,
        canvas = t.canvas;

    t.draw();

    audio.addEventListener('progress', function() { 
      if (!MOUSEDOWN) t.draw(); 
    });
    audio.addEventListener('timeupdate', function() { 
      if (!MOUSEDOWN) t.draw(); 
    });

    canvas.addEventListener('mousedown', function() { 
      MOUSEDOWN = true; 
    });
    canvas.addEventListener('mousemove', function(e) {
      if (MOUSEDOWN) t.draw(e.offsetX);
    });
    canvas.addEventListener('mouseup', function(e) {
      if (MOUSEDOWN) {
        audio.currentTime = tooly.scale(e.offsetX, 0, canvas.width, 0, audio.duration);
        MOUSEDOWN = false;
      }
    });
    // t.canvas.addEventListener('mouseleave', function(e) {
    // });

    return this;
  };

  Progress.prototype.draw = function(overridePlayhead) {

    var t = this,
        s = t.settings,
        ctx = t.ctx,
        canvas = t.canvas,
        lap = t.lap,
        params = [],
        ofs,
        x;

    ctx.lineWidth = s.lineWidth;        

    // clear
    ctx.clearRect(0, 0, s.width, s.height);

    // track
    if (s.track.draw) {
      ctx.fillStyle = s.track.fill;

      ofs = (s.track.height < s.playhead.height) ? 
        (s.playhead.height-s.track.height)/2 : 0;

      params = [0, ofs, canvas.width, s.track.height];
      ctx.fillRect.apply(ctx, params);
      if (s.track.stroke) {
        ctx.strokeStyle = s.track.stroke;
        ctx.strokeRect.apply(ctx, params);
      }
    }

    // progress
    if (s.progress.draw) {
      x = lap.bufferFormatted();
      ctx.fillStyle = s.progress.fill;

      ofs = (s.progress.height < s.playhead.height) ? 
        (s.playhead.height-s.progress.height)/2 : 0;
        
      params = [
        0, 
        ofs, 
        tooly.scale(x, 0, 100, 0, canvas.width), 
        s.progress.height
      ];
      ctx.fillRect.apply(ctx, params);
      if (s.progress.stroke) {
        ctx.strokeStyle = s.progress.stroke;
        ctx.strokeRect.apply(ctx, params);
      }
    }

    // play-head
    if (s.playhead.draw) {
      x = overridePlayhead ? overridePlayhead : lap.audio.currentTime;

      // todo, handle if playhead is smaller (center it)

      // ofs = (s.playhead.height < s.track.height) ? (s.track.height-s.playhead.height)/2 : 0;

      ctx.fillStyle = s.playhead.fill;
      params = [
        (overridePlayhead) ? 
          overridePlayhead : 
          tooly.scale(x, 0, lap.audio.duration, 0, canvas.width), 
        0, 
        s.playhead.width, 
        s.playhead.height
      ];
      ctx.fillRect.apply(ctx, params);
      if (s.playhead.stroke) {
        ctx.strokeStyle = s.playhead.stroke;
        ctx.strokeRect.apply(ctx, params);
      }
    }

    return this;
  };

}();
