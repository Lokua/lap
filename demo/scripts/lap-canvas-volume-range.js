!function(undefined) { 'use strict';
  
  var _ = tooly, $ = tooly.Frankie, MOUSEDOWN = false;
  /*>>*/
  var logger = _.Logger('LAP_VOLUME_RANGE');
  /*<<*/

  Lap.prototype.CanvasVolumeRange = CanvasVolumeRange;

  function CanvasVolumeRange(lap, container, options) {

    var thiz = this;
    thiz.lap = lap;
    thiz.$container = $(container, lap.container);

    if (!thiz.$container.length()) {
      console.error('unable to create CanvasVolumeRange container');
      thiz.constructorErrorThrown = true;
      return;
    }

    thiz.$container
      .append(_.tag('canvas.lap__canvas-volume-range__track'))
      .append(_.tag('canvas.lap__canvas-volume-range__knob'));

    thiz.track = $('.lap__canvas-volume-range__track').get(0);
    thiz.knob  = $('.lap__canvas-volume-range__knob').get(0);

    if (!thiz.track) {
      console.error('unable to find track element');
      thiz.constructorErrorThrown = true;
      return;
    }
    if (!thiz.knob) {
      console.error('unable to find knob element');
      thiz.constructorErrorThrown = true;
      return;
    }  

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

  CanvasVolumeRange.prototype.constructorErrorThrown = false;

  CanvasVolumeRange.prototype.init = function() {
    if (this.constructorErrorThrown) return;
    
    var thiz = this,
        settings = thiz.settings,
        audio = thiz.lap.audio,
        v;

    thiz.track.width = thiz.knob.width = settings.width;
    thiz.track.height = thiz.knob.height = settings.height;
    thiz.$container.attr('height', thiz.settings.height);

    thiz.drawTrack();
    thiz.drawKnob(_.scale(audio.volume, 0, 1, 0, settings.width));

    thiz.$container
      .on('mousedown', function(e) {
        MOUSEDOWN = true; 
      })
      .on('mousemove', function(e) {
        if (MOUSEDOWN) {
          thiz.drawKnob(e.offsetX);
          v = _.scale(e.offsetX, 0, settings.width - settings.knobWidth, 0, 1);
          if (v >= 0.95) v = 1;
          audio.volume = v;
          thiz.lap.trigger('volumeChange');
        }
      });

    $('body').on('mouseup', function(e) {
      if (MOUSEDOWN) MOUSEDOWN = false;
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
    ctx.clearRect(0, 0, settings.width, settings.height);
    ctx.fillStyle = settings.trackColor;
    if (settings.trackHeight < settings.knobHeight) {
      offset = (settings.knobHeight - settings.trackHeight)/2; 
    }
    // x, y, width, height
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
    ctx.fillStyle = settings.knobColor;
    if (override !== undefined) {
      if (override >= canvas.width - thiz.settings.knobWidth) {
        override = canvas.width - thiz.settings.knobWidth;
      }
      x = override;
    } else {
      x = audio.volume;
    }
    params = [
      override !== undefined ? override : _.scale(x, 0, 1, 0, canvas.width), 
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