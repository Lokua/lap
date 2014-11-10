/**
 * renders a mobile-menu style playlist icon 
 * (square with three horizontal lines stacked)
 */
function Playlist(rc) {

  var w = rc.settings.width,
      h = rc.settings.height,
      cx = w/2,
      cy = h/2;

  var paper = rc.paper,
      playlist = paper.set(),
      bh = h/3.75, // bar height
      bar1 = paper.rect(0, 0, w, bh),
      bar2 = paper.rect(0, cy-(bh/2), w, bh),
      bar3 = paper.rect(0, h-bh, w, bh);

  bar1.node.id = rc.idf + 'playlist-button-bar1-' + rc.lap.id;
  bar2.node.id = rc.idf + 'playlist-button-bar2-' + rc.lap.id;
  bar3.node.id = rc.idf + 'playlist-button-bar3-' + rc.lap.id;

  playlist.push(bar1, bar2, bar3).attr(rc.attrs);

  return playlist;
}