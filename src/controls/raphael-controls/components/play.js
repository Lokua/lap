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