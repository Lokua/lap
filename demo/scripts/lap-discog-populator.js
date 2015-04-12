!function(undefined) { 'use strict';

  /*>>*/
  var logger = tooly.Logger('LAP_DISCOG_POPULATOR', { level: 0 });
  /*<<*/

  var _id = _id || 0, _ = tooly, $ = _.Frankie;

  Lap.prototype.DiscogPopulator = DiscogPopulator;

  function DiscogPopulator(lap, container) {
    this.id = ++_id;
    this.lap = lap;
    this.$container = $(container);
    return this;
  }

  DiscogPopulator.prototype.init = function() {
    var thiz = this,
        lap = thiz.lap,
        lib = lap.lib,
        $panel = lap.$els.discogPanel;
    
    var covers = lib.map(function(item) {
      return _.tag('.lap__discog__thumb', {
        content: _.tag('img', {
          src: item.cover,
          title: _.sliceRel(item.cover)
        }, true) +  _.tag('span.lap--hidden', {
          content: item.album
        }, true)
      }, true);
    }).join('');
    // var parser = new DOMParser();
    // var html = parser.parseFromString(covers, 'text/html'));
    // $panel.append($(html).find('body').children());

  };

}();
