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