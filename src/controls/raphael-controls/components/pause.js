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