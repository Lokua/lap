;(function(window, undefined) {

  /*>>*/
  var logger = tooly.Logger('DISCOPOP', { level: 0 });
  /*<<*/

  var __id = __id || 0;
  var Lap = window.Lap;
  var $ = tooly.Frankie;

  // constructor
  Lap.DiscogPopulator = function(lap) {
    this.lap = lap;
    this.id = ++__id;
    this.name = 'DISCOPOP_' + this.id;
    /*>>*/
    logger.name = this.name;
    /*<<*/
    return this;
  };

  Lap.DiscogPopulator.prototype.init = function() {
    var dp = this,
        lap = dp.lap,
        albums = lap.property('album'),
        covers = lap.property('cover'),
        $panel = lap.$els.discogPanel,
        discogItem = lap.selectors.discogItem,
        html = '';

    // --- populate thumb-nails
    albums.forEach(function(album, i) {
      var tag = 'div .'+discogItem+' data-lap-album-index="' + i + '"' + 
        (i === lap.albumIndex ? '' : ' .'+lap.selectors.state.hidden);
      var imgTag = 'img src="' + covers[i] + '"';
      html += tooly.tag(tag, tooly.tag(imgTag, tooly.tag('h4', album)));
    });
    $panel.find('.lap__discog__items').append(html);

    // --- write nav index, ie: < 2/7 >
    var $index = $panel.find('.lap__discog__nav-index'),
        $items = $panel.find('.lap__discog__item'),
        navIndex = lap.albumIndex;

    function updateIndex(index) {
      $index.html((+index) + 1 + '/' + albums.length);
    }
    updateIndex(navIndex);

    lap.on('albumChange', function() { // am i really needed?
      navIndex = lap.albumIndex;
      updateIndex(navIndex);
    });

    // --- bind nav controls to hide/show selected album cover, update nav/index
    $panel.find('.lap__discog__thumb--prev, .lap__discog__thumb--next')
      .on('click', function() {
        if ($(this).hasClass('lap__discog__thumb--prev')) {
          navIndex = navIndex - 1 < 0 ? albums.length-1 : navIndex - 1;
        } else {
          navIndex = navIndex + 1 > albums.length-1 ? 0 : navIndex + 1;
        }
        updateIndex(navIndex);
        $items.addClass(lap.selectors.state.hidden).eq(navIndex).removeClass(lap.selectors.state.hidden);
      });

    // --- direct click on item -> album change
    $items.on('click', function() {
      lap.setAlbum($(this).attr('data-lap-album-index'));
    });
  };

})(window);
