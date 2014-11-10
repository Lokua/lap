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