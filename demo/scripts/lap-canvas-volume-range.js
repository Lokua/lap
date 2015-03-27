!function(undefined) { 'use strict';
  
  var _ = tooly, $ = tooly.Frankie, _mousedown = false;
  /*>>*/
  var logger = _.Logger('LAP_VOLUME_RANGE');
  /*<<*/

  Lap.prototype.CanvasVolumeRange = CanvasVolumeRange;

  function CanvasVolumeRange(lap, container, options) {

    var thiz = this;
    thiz.lap = lap;
    thiz.$container = $(container, lap.container);

    thiz.$container
      .append(_.tag('canvas.lap__canvas-volume-range__track'))
      .append(_.tag('canvas.lap__canvas-volume-range__knob'));

    thiz.track = $('.lap__canvas-volume-range__track').get(0);
    thiz.knob  = $('.lap__canvas-volume-range__knob').get(0);

    thiz.trackCtx = thiz.track.getContext('2d');
    thiz.knobCtx  = thiz.knob.getContext('2d');    

    thiz.settings = _.extend({}, {
      trackColor: '#a7a7a7',
      trackHeight: 2,
      knobColor: '#555',
      knobWidth: 6,
      knobHeight: 12,
      width: 76,
      height: 16
    }, options);

    return thiz;
  }

  CanvasVolumeRange.prototype.init = function() {
    var thiz = this,
        settings = thiz.settings,
        audio = thiz.lap.audio;

    thiz.track.width = thiz.knob.width = settings.width;
    thiz.$container.attr('height', thiz.settings.height);

    thiz.drawTrack();
    thiz.drawKnob(0);

    thiz.$container
      .on('mousedown', function(e) {
        _mousedown = true; 
      })
      .on('mousemove', function(e) {
        if (_mousedown) {
          thiz.drawKnob(e.offsetX);
          audio.volume = _.scale(e.offsetX, 0, settings.width, 0, 1);
        }
      });

    $('body').on('mouseup', function(e) {
      if (_mousedown) {
        _mousedown = false;
      }
    });

    return thiz;
  }

  /**
   * Draws the static track.
   * 
   * @return {CanvasVolumeRange} this
   */
  CanvasVolumeRange.prototype.drawTrack = function() {
    var thiz = this,
        ctx = thiz.trackCtx,
        canvas = thiz.track,
        settings = thiz.settings,
        params = [],
        offset = 0;
    ctx.clearRect(0, 0, settings.width, settings.width);
    ctx.fillStyle = settings.trackColor;
    if (settings.trackHeight < settings.knobHeight) {
      offset = (settings.knobHeight - settings.trackHeight)/2; 
    }
    params = [0, offset, canvas.width, settings.trackHeight];
    ctx.fillRect.apply(ctx, params);
    if (settings.trackStroke) {
      ctx.strokeStyle = settings.trackStroke;
      ctx.strokeRect.apply(ctx, params);
    }
    return thiz;
  };

  CanvasVolumeRange.prototype.drawKnob = function(override) {
    var thiz = this,
        settings = thiz.settings,
        ctx = thiz.knobCtx,
        canvas = thiz.knob,
        audio = thiz.lap.audio,
        params = [],
        offset,
        x;
    ctx.clearRect(0, 0, settings.width, settings.height);
    x = override ? override : audio.volume;
    ctx.fillStyle = settings.knobColor;
    params = [
      override 
        ? override 
        : _.scale(x, 0, audio.volume, 0, canvas.width), 
      0, 
      settings.knobWidth, 
      settings.knobHeight
    ];
    ctx.fillRect.apply(ctx, params);
    if (settings.knobStroke) {
      ctx.strokeStyle = settings.knobStroke;
      ctx.strokeRect.apply(ctx, params);
    }

    return thiz;
  }

}();