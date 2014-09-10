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