/**
 * renders a typical right-facing speaker with sound-wave volume-curves icon.
 * meant only to hide or show an actual volume-slider, though could be used as a multi-level
 * toggle.
 */
function Speaker(rc) {

  var settings = rc.settings,
      w = settings.width,
      h = settings.height,
      cx = w/2,
      cy = h/2;

  // var paper = Raphael(rc.$el, w, h),
  var paper = rc.paper,
      speaker = paper.set();

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

  horn  .node.id = 'lap-rcf-speaker-horn-'   + rc.lap.id;
  curve1.node.id = 'lap-rcs-speaker-curve2-' + rc.lap.id;
  curve2.node.id = 'lap-rcs-speaker-curve3-' + rc.lap.id;

  speaker.push(horn, curve1, curve2);

  return speaker;
}