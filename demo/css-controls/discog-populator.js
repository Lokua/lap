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
    lap.$els.discogPanel.html(tooly.tag('ul', lap.property('album').map(function(a) {
      return tooly.tag('li .lap-discog-item', a);
    }).join('')));
  };

})(window);
