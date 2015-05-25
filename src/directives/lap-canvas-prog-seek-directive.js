(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapCanvasProgSeek', { 
    nameStyle: 'color:brown',
    level: 0 
  });
  /*<<*/

  
  angular.module('lnet.lap').directive('lapCanvasProgSeek', lapCanvasProgSeek);
  lapCanvasProgSeek.$inject = ['tooly', 'Lap', 'lapUtil'];

  function lapCanvasProgSeek(tooly, Lap, lapUtil) {

    /**
     * Combination of seekbar + progress range for the Lokua Audio Player
     * 
     * @type {Object}
     * @constructor
     * @static
     */
    Lap.CanvasProgSeek = function(lap, element, options) {

      var thiz = this;
      thiz.lap = lap;
      thiz.element = angular.element(element.children()[0]);

      if (!thiz.element.length) {
        throw new Lap.PluginConstructorError('unable to find Lap.CanvasProgSeek element');
      }

      // appended in intended stacking order
      thiz.element
        .append(tooly.tag('canvas.lap__prog-seek__track'))
        .append(tooly.tag('canvas.lap__prog-seek__progress'))
        .append(tooly.tag('canvas.lap__prog-seek__knob'));

      thiz.track    = thiz.element[0].querySelector('.lap__prog-seek__track');
      thiz.progress = thiz.element[0].querySelector('.lap__prog-seek__progress');
      thiz.knob     = thiz.element[0].querySelector('.lap__prog-seek__knob');

      // helper
      var errCheck = function(el) {
        if (!thiz[el]) {
          throw new Lap.PluginConstructorError('unable to find ' + el + ' element');
        }
      };
      errCheck('track');
      errCheck('progress');
      errCheck('knob');

      thiz.trackCtx    = thiz.track.getContext('2d');
      thiz.progressCtx = thiz.progress.getContext('2d');
      thiz.knobCtx     = thiz.knob.getContext('2d');

      var defaultHeight = 16;
      thiz.settings = angular.extend({}, {
        track: {
          fill: '#bbb',
          stroke: null,
          height: defaultHeight
        },
        progress: {
          fill: '#999',
          stroke: null,
          height: defaultHeight
        },    
        knob: {
          fill: '#000',
          stroke: null,
          height: defaultHeight,
          width: 4
        },
        lineWidth: 2,
        width:  thiz.track.width  || 100,
        height: thiz.track.height || 16,
        padding: 0
      }, options);

      return thiz;
    };

    /**
     * Initialize this CanvasProgSeek. Draws the track, knob, and progress value; 
     * sets up audio and mouse event listeners.
     * 
     * @return {CanvasProgSeek} this
     */
    Lap.CanvasProgSeek.prototype.init = function() {
      var thiz = this,
          settings = thiz.settings,
          audio = thiz.lap.audio,
          MOUSEDOWN = false,
          x;

      thiz.track.width  = thiz.progress.width  = thiz.knob.width  = settings.width;
      thiz.track.height = thiz.progress.height = thiz.knob.height = settings.height;
      thiz.element.attr('height', thiz.settings.height);

      thiz.drawTrack();
      thiz.drawProgress();
      thiz.drawKnob(0);

      audio.addEventListener('progress', function() { 
        if (!MOUSEDOWN) thiz.drawProgress(); 
      });

      audio.addEventListener('timeupdate', function() { 
        if (!MOUSEDOWN) thiz.drawKnob(); 
      });

      thiz.element
        .on('mousedown', function(e) {
          MOUSEDOWN = true; 
        })
        .on('mousemove', function(e) {
          if (MOUSEDOWN) {
            thiz.drawKnob(e.offsetX);
            x = tooly.scale(e.offsetX, 0, settings.width - settings.knob.width, 0, 1);
            if (x >= audio.duration) x = audio.duration;
            audio.currentTime = x;
          }
        });

      lapUtil.body().on('mouseup', function(e) {
        if (MOUSEDOWN) {
          audio.currentTime = tooly.scale(e.offsetX, 0, settings.width, 0, audio.duration);
          MOUSEDOWN = false;
        }
      });

      /*>>*/
      logger.debug('post init >> this: %o', thiz);
      /*<<*/

      thiz.lap.registerPlugin('CanvasProgSeek', thiz);

      return thiz;
    };

    /**
     * Draws the static progressbar/seekbar track.
     * 
     * @return {CanvasProgSeek} this
     */
    Lap.CanvasProgSeek.prototype.drawTrack = function() {
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
    Lap.CanvasProgSeek.prototype.drawProgress = function() {
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
        tooly.scale(x, 0, 100, 0, canvas.width), 
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
    Lap.CanvasProgSeek.prototype.drawKnob = function(override) {
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
        override !== undefined ? override : tooly.scale(x, 0, audio.duration, 0, canvas.width), 
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

    return {
      restrict: 'E',
      template: '<div class="lap__prog-seek"></div>',
      link: function(scope, element, attrs) {

        var progSeek,
            fillColor = '#555',
            trackColor = '#a7a7a7';

        var options = {
          width: 76,
          height: 18,
          track: {
            fill: trackColor,
            height: 2
          },
          progress: {
            fill: fillColor,
            height: 2
          },
          knob: {
            fill: fillColor,
            height: 12,
            width: 6
          }
        };

        var off = scope.$watch('ready', function(newValue, oldValue) {
          if (!newValue) return;

          progSeek = new Lap.CanvasProgSeek(scope.lap, element, options);
          progSeek.init();

          off();
        });

      }
    };
  }

})();