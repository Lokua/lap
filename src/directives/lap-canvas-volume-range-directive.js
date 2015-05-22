(function() { 'use strict';

  /*>>*/
  var logger = new Lo66er('lapCanvasVolumeRange', { 
    nameStyle: 'color:forestgreen',
    level: 0 
  });
  /*<<*/

  angular.module('lnet.lap').directive('lapCanvasVolumeRange', lapCanvasVolumeRange);
  lapCanvasVolumeRange.$inject = ['tooly', 'Lap', 'lapUtil'];

  function lapCanvasVolumeRange(tooly, Lap, lapUtil) {

    var _MOUSEDOWN = false;

    Lap.CanvasVolumeRange = function(lap, element, options) {
      var thiz = this;
      thiz.lap = lap;
      thiz.element = angular.element(element.children()[0]);

      if (!thiz.element.length) {
        throw new Lap.PluginConstructorError('unable to find Lap.VolumeRange element');
      }

      thiz.element
        .append(tooly.tag('canvas.lap__canvas-volume-range__track'))
        .append(tooly.tag('canvas.lap__canvas-volume-range__knob'));

      thiz.track = thiz.element[0].querySelector('.lap__canvas-volume-range__track');
      thiz.knob  = thiz.element[0].querySelector('.lap__canvas-volume-range__knob');

      if (!thiz.track) {
        throw new Lap.PluginConstructorError('unable to find track element');
      }
      if (!thiz.knob) {
        throw new Lap.PluginConstructorError('unable to find knob element');
      }  

      thiz.trackCtx = thiz.track.getContext('2d');
      thiz.knobCtx  = thiz.knob.getContext('2d');    

      thiz.settings = angular.extend({}, {
        trackColor: '#a7a7a7',
        trackHeight: 2,
        knobColor: '#555',
        knobWidth: 6,
        knobHeight: 12,
        width: 76,
        height: 16
      }, options);

      return thiz;       
    };

    Lap.CanvasVolumeRange.prototype.init = function() {
      var thiz = this,
          settings = thiz.settings,
          audio = thiz.lap.audio,
          v;

      thiz.track.width  = thiz.knob.width  = settings.width;
      thiz.track.height = thiz.knob.height = settings.height;
      thiz.element.attr('height', thiz.settings.height);

      thiz.drawTrack();
      thiz.drawKnob(tooly.scale(audio.volume, 0, 1, 0, settings.width));

      thiz.element
        .on('mousedown', function(e) {
          _MOUSEDOWN = true; 
        })
        .on('mousemove', function(e) {
          if (_MOUSEDOWN) {
            thiz.drawKnob(e.offsetX);
            v = tooly.scale(e.offsetX, 0, settings.width - settings.knobWidth, 0, 1);
            if (v >= 0.95) v = 1;
            if (v < 0) v = 0;
            audio.volume = v;
            thiz.lap.trigger('volumeChange');
          }
        });

      lapUtil.body().on('mouseup', function(e) {
        if (_MOUSEDOWN) _MOUSEDOWN = false;
      });

      /*>>*/
      logger.debug('post init >> this: %o', thiz);
      /*<<*/

      thiz.lap.registerPlugin('CanvasVolumeRange', thiz);

      return thiz;
    };

    Lap.CanvasVolumeRange.prototype.drawTrack = function() {
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

    Lap.CanvasVolumeRange.prototype.drawKnob = function(override) {
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
        override !== undefined ? override : tooly.scale(x, 0, 1, 0, canvas.width), 
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
    };    

    return {
      restrict: 'E',
      template: '<div class="lap__canvas-volume-range lap__volume-range"></div>',
      link: function(scope, element, attrs) {

        var volumeRange;       

        var options = { 
          width: 76, 
          height: 18 
        };

        var off = scope.$watch('ready', function(newValue, oldValue) {
          if (!newValue) return;

          volumeRange = new Lap.CanvasVolumeRange(scope.lap, element, options);
          volumeRange.init();
          scope.vRangeReady = true;

          off();
        });

      }
    };
  }
})();