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
        lib = lap.lib, 
        width = /*(100/lib.length) +*/ '20%';

    lap.$els.discogPanel.append(lib.map(function(item, i) {

      return '<div class="lap__discog__thumb" data-lap-album-index="'+i+'" width="'+width+'">' +
          '<img src="'+item.cover+'" title="'+_.sliceRel(item.cover)+'">' +
          '<span class="lap--hidden">' + item.album + '</span>' +
        '</div>';

    }).join(''));

  };

})();
