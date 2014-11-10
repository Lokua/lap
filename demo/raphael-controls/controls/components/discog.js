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
