(function(undefined) { 'use strict';

  /*>>*/
  var logger = tooly.Logger('LAP_DISCOG_POPULATOR', { level: 0 });
  /*<<*/

  var _id = _id || 0, _ = tooly, $ = _.Frankie;

  Lap.prototype.DiscogPopulator = DiscogPopulator;

  function DiscogPopulator(lap) {
    this.id = ++_id;
    this.lap = lap;
    return this;
  }

  DiscogPopulator.prototype.init = function() {

    var lap = this.lap, 
        lib = lap.lib;

    lap.$els.discogPanel.append(lib.map(function(item, i) {

      logger.debug('item: %o', item);

      return '<div class="lap__discog__thumb" data-lap-album-index="'+i+'">' +
          _.tag('img', { 
            src: item.cover, title: 'click to play this album'/*_.sliceRel(item.cover)*/ }, true) +
          _.tag('h4', item.album, true) +
          _.tag('h5', item.date, true) +
          _.tag('h6', item.label, true) +
        '</div>';

    }).join(''));

    $('.lap__discog__thumb', lap.container).on('click', function(e) {
      lap.setAlbum($(this).attr('data-lap-album-index'));
      $('.lap__cover__container, .lap__playlist__panel, .lap__discog__container')
        .toggleClass(lap.selectors.state.hidden);
    });

  };

})();
