function VolumeRange(rc) {

  var settings = rc.settings,
      v = settings.volumeSlider,
      w = v.width,
      h  = v.height,
      knobWidth = 6,
      strokeWidth = settings.strokeWidth,
      /*>>*/
      logger = tooly.Logger(2, 'RCTRLS_VOLUME-RANGE');
      /*<<*/
      $ = rc.lap.getSelector,
      container = rc.lap.container,
      $el = $(rc.$el, container),
      $wrapper = $('.lap-volume-wrapper', container),
      paper = rc.paper,
      p = (h < settings.height) ? (settings.height - h)/2 : 0; // padding;

  paper.setSize(w, settings.height);
  var slider = paper.set();

  var track = paper.rect(0, p, w, h)
    // .transform('s1,0.75,0,0')
    .attr({ fill: v.trackFill, stroke: v.trackStroke, strokeWidth: strokeWidth });

  var level = paper.rect(0, p, w * rc.lap.audio.volume, h)
    .attr({ fill: v.levelFill, stroke: v.levelStroke, strokeWidth: strokeWidth });

  var knob = (v.knobShape === 'rect') ? 
      paper.rect((w * rc.lap.audio.volume) - 2, p, knobWidth, h) :
      paper.circle((w * rc.lap.audio.volume) - 2, settings.height/2, knobWidth);
  knob.attr({ fill: v.knobFill,  stroke: v.knobStroke, strokeWidth: strokeWidth });

  track.node.id = 'lap-rc-volume-track' + rc.lap.id;
  level.node.id = 'lap-rc-volume-level' + rc.lap.id;
  knob .node.id = 'lap-rc-volume-knob'  + rc.lap.id;

  slider.push(track, level, knob);

  slider
    .mousedown(function(e) {
      rc.sliding = true;
      level.animate({ width: e.offsetX }, 20);
      knob.animate(v.knobShape === 'rect' ? { x: e.offsetX-2 } : { cx: e.offsetX-2 }, 20);
    })
    .mousemove(function(e) {
      if (rc.sliding) {

        var rect = e.target.getBoundingClientRect(),
            x = (e.clientX - rect.left) / rect.width * this.attrs.width + this.getBBox().x,
            val = tooly.scale(x, 0, w, 0, 1).toFixed(2);

        // happens with circle sometimes.
        if (isNaN(x)) return;

        // bounds check
        x   = (x >= w-2)    ? w : x;
        x   = (val <= 0.05) ? 0 : x;
        val = (val >= 0.99) ? 1 : val;

        level.animate({ width: x }, 20);

        // adjust knob width
        var kx = (x === 0) ? x : x - 2;
        kx = (x === w) ? w-knobWidth : kx;

        try {
          knob.animate(v.knobShape === 'rect' ? { x: kx } : { cx: kx }, 20);
        } catch(e) {
          /*>>*/
          logger.error('caught %s: %s -> kx: %d, val: %d ', 
            e.name, e.message, kx, val);
          /*<<*/
        }

        // hide/show horn waves depending on volume level
        if (val <= 0.666) rc.volumeButton[2].hide();
        if (val >  0.666) rc.volumeButton[2].show();
        if (val <= 0.333) rc.volumeButton[1].hide();
        if (val >  0.333) rc.volumeButton[1].show();

        try {
          rc.lap.audio.volume = val;
        } catch(e) {
          /*>>*/
          logger.error('caught %s: %s -> kx: %d, val: %d ', 
            e.name, e.message, kx, val);
          /*<<*/
        }
      }
    })
    .mouseup(function(e) { rc.sliding = false; });

  // `wrapper` should be container holding both the slider and the volumeButton,
  // in which case hovering over the button will reveal the slider, and leaving the button
  // or slider will again hide the slider.
  $wrapper.on('mouseenter', function() {
    $el.removeClass('lap-hidden');
  });
  $wrapper.on('mouseleave', function() {
    if (!rc.sliding) $el.addClass('lap-hidden');
  });

  return slider;
}