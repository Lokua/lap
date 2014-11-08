;(function(window, undefined) {

  // constructor
  Lap.DiscogPopulator = function(lap) {
    this.lap = lap;
    /*>>*/
    this.logger = tooly.Logger(0, 'Lap['+lap.id+']<DISCOG_POP...>');
    /*<<*/
    return this;
  };

  Lap.DiscogPopulator.prototype.name = 'DiscogPopulator';

  Lap.DiscogPopulator.prototype.init = function() {
    var lap = this.lap;
    var albums = lap.property('album');
    var covers = lap.property('cover');
    albums.forEach(function(album, i) {
      lap.$els.discogPanel.append(tooly.tag('div .lap-discog-item', album + 
        tooly.tag('img src="' + covers[i] + '"')));
    });
  };

})(window);
