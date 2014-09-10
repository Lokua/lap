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