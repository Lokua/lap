!function(undefined) { 'use strict';


  var _ = tooly, 
      $ = _.Frankie,
      _mousedown = false,
      _defaultHeight = 16;

  /*>>*/
  var logger = _.Logger('PROGRESS_SEEK', { level: 0 });
  /*<<*/

  /**
   * Combination of seekbar + progress range for the Lokua Audio Player
   * 
   * @type {Object}
   * @constructor
   */
  Lap.prototype.CanvasProgSeek = CanvasProgSeek;

  function CanvasProgSeek(lap, container, options) {

    var thiz = this;
    thiz.lap = lap;
    thiz.$container = $(container, lap.container);

    if (!thiz.$container.length()) {
      console.error('unable to create CanvasProgSeek container');
      thiz.constructorErrorThrown = true;
      return;
    }

    // appended in intended stacking order
    thiz.$container
      .append(_.tag('canvas.lap__prog-seek__track'))
      .append(_.tag('canvas.lap__prog-seek__progress'))
      .append(_.tag('canvas.lap__prog-seek__knob'));

    thiz.track    = $('.lap__prog-seek__track').get(0);
    thiz.progress = $('.lap__prog-seek__progress').get(0);
    thiz.knob     = $('.lap__prog-seek__knob').get(0);

    // helper
    function errCheck(el) {
      if (!thiz[el]) {
        console.error('unable to find ' + el + ' element');
        thiz.constructorErrorThrown = true;
      }
    }
    errCheck('track');
    errCheck('progress');
    errCheck('knob');
    if (thiz.constructorErrorThrown) return;

    thiz.trackCtx    = thiz.track.getContext('2d');
    thiz.progressCtx = thiz.progress.getContext('2d');
    thiz.knobCtx     = thiz.knob.getContext('2d');

    thiz.settings = _.extend({}, {
      track: {
        fill: '#bbb',
        stroke: null,
        height: _defaultHeight
      },
      progress: {
        fill: '#999',
        stroke: null,
        height: _defaultHeight
      },    
      knob: {
        fill: '#000',
        stroke: null,
        height: _defaultHeight,
        width: 4
      },
      lineWidth: 2,
      width:  thiz.track.width  || 100,
      height: thiz.track.height || 16,
      padding: 0
    }, options);

    return thiz;
  }

  CanvasProgSeek.prototype.constructorErrorThrown = false;

  /**
   * Initialize this CanvasProgSeek. Draws the track, knob, and progress value; 
   * sets up audio and mouse event listeners.
   * 
   * @return {CanvasProgSeek} this
   */
  CanvasProgSeek.prototype.init = function() {
    if (this.constructorErrorThrown) return;

    var thiz = this,
        settings = thiz.settings,
        audio = thiz.lap.audio,
        x;

    thiz.track.width  = thiz.progress.width  = thiz.knob.width  = settings.width;
    thiz.track.height = thiz.progress.height = thiz.knob.height = settings.height;
    thiz.$container.attr('height', thiz.settings.height);

    thiz.drawTrack();
    thiz.drawProgress();
    thiz.drawKnob(0);

    audio.addEventListener('progress', function() { 
      if (!_mousedown) thiz.drawProgress(); 
    });

    audio.addEventListener('timeupdate', function() { 
      if (!_mousedown) thiz.drawKnob(); 
    });

    thiz.$container
      .on('mousedown', function(e) {
        _mousedown = true; 
      })
      .on('mousemove', function(e) {
        if (_mousedown) {
          thiz.drawKnob(e.offsetX);
          x = _.scale(e.offsetX, 0, settings.width - settings.knob.width, 0, 1);
          if (x >= audio.duration) x = audio.duration;
          audio.currentTime = x;
        }
      });

    $('body').on('mouseup', function(e) {
      if (_mousedown) {
        audio.currentTime = _.scale(
          e.offsetX, 0, settings.width, 0, audio.duration);
        _mousedown = false;
      }
    });

    return this;
  };

  /**
   * Draws the static progressbar/seekbar track.
   * 
   * @return {CanvasProgSeek} this
   */
  CanvasProgSeek.prototype.drawTrack = function() {
    var thiz = this,
        ctx = thiz.trackCtx,
        canvas = thiz.track,
        settings = thiz.settings,
        params = [],
        offset = 0;
    ctx.clearRect(0, 0, settings.width, settings.height);
    ctx.fillStyle = settings.track.fill;
    if (settings.track.height < settings.knob.height) {
      offset = (settings.knob.height - settings.track.height)/2; 
    }
    // x, y, width, height
    params = [0, offset, canvas.width, settings.track.height];
    ctx.fillRect.apply(ctx, params);
    if (settings.track.stroke) {
      ctx.strokeStyle = settings.track.stroke;
      ctx.strokeRect.apply(ctx, params);
    }
  };

  /**
   * Draws the progress value over the track.
   *     
   * @return {CanvasProgSeek} this
   */
  CanvasProgSeek.prototype.drawProgress = function() {
    var thiz = this,
        lap = thiz.lap,
        settings = thiz.settings,
        ctx = thiz.progressCtx,
        canvas = thiz.progress,
        params = [],
        offset = 0,
        x = lap.bufferFormatted();
    ctx.clearRect(0, 0, settings.width, settings.height);
    ctx.fillStyle = settings.progress.fill;
    if (settings.progress.height < settings.knob.height) {
      offset = (settings.knob.height - settings.progress.height)/2;
    }
    // x, y, width, height
    params = [
      0, 
      offset, 
      _.scale(x, 0, 100, 0, canvas.width), 
      settings.progress.height
    ];
    ctx.fillRect.apply(ctx, params);
    if (settings.progress.stroke) {
      ctx.strokeStyle = settings.progress.stroke;
      ctx.strokeRect.apply(ctx, params);
    }

    return this;   
  };

  /**
   * Draws the knob/playhead of the seekbar.
   * 
   * @param  {Number} override used to update the knob position from
   *                           user interaction, otherwise the knob is auto
   *                           adjusted from audio.currentTime
   * @return {CanvasProgSeek} this
   */
  CanvasProgSeek.prototype.drawKnob = function(override) {
    var thiz = this,
        settings = thiz.settings,
        ctx = thiz.knobCtx,
        canvas = thiz.knob,
        audio = thiz.lap.audio,
        params = [],
        offset,
        x = override !== undefined ? override : audio.currentTime;
    ctx.lineWidth = settings.lineWidth;        
    ctx.clearRect(0, 0, settings.width, settings.height);
    ctx.fillStyle = settings.knob.fill;

    if (override !== undefined) {
      if (override >= canvas.width - thiz.settings.knob.width) {
        override = canvas.width - thiz.settings.knob.width;
      }
      x = override;
    } else {
      x = audio.currentTime;
    }

    // x, y, width, height
    params = [
      override !== undefined
        ? override 
        : _.scale(x, 0, audio.duration, 0, canvas.width), 
      0, 
      settings.knob.width, 
      settings.knob.height
    ];
    ctx.fillRect.apply(ctx, params);
    if (settings.knob.stroke) {
      ctx.strokeStyle = settings.knob.stroke;
      ctx.strokeRect.apply(ctx, params);
    }

    return this;
  };  

}();
