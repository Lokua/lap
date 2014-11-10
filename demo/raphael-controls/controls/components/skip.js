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