# Lap.js

> Lokua Audio Player. A SIY (style it yourself) HTML5 Audio Player
  implementation for modern (ES5) browsers with support for single-track,
  single-album, and mutliple-album player implementations. Selector, element, and
  event hooks are all baked in - you just have to make them come to life.

## Getting started

```html
<!-- include lap.js -->
<script src="lap/dist/lap.js"></script>

<!-- provide a container and optional control elements -->
<div id="player">
  <button class="lap__play-pause">play/pause</button>
  <!--
    ... more elements with proper `lap__<element>` classes
  -->
</div>

<!-- create your Lap instance -->
<script>
  const lap = new Lap('#player', 'some-audio-url.mp3');
</script>
```

The above example is perhaps the lamest audio player imaginable, but there
are a few things to note that should give you a better understanding of the
big picture.

When the Lap constructor is called, it traverses the container element (the `#player`
div in the above example), and sets up appropriate dom, audio, and custom events hooks
for children of that container that match a defined element>selector pattern. In this case,
there is only a `playPause` element, so Lap will only set up `play`, `pause`, and a convenient `togglePlay` hook. Clicking the button for the first time will cause
audio to play, clicking again will pause. For a few elements, like `playPause`, Lap
will also add or remove appropriate state classes. In fact, immediately after the above
Lap instance is created, the `playPause` element if given the state class of `lap--paused`,
which is then replaced with `lap--playing` when the button is clicked. This is where
"style it yourself" comes to play.

Let's enhance our previous example ever so slightly:

```html
<style>
.lap--paused:after {
  content: 'play';
}
.lap--playing:after {
  content: 'paused'
}
</style>

<div id="player">
  <button class="lap__play-pause lap--paused"></button>
</div>
```

Because of the CSS psuedo elements, the text of the button will change automatically
whenever the button is clicked. And just to note, we didn't need to add the `lap--paused`
class to our markup as that class is added to a `lap__play-pause` element automatically.

> Note: Lap uses BEM syntax for class selectors, where the "block" portion is always `lap`,
  and the element portion is a snake-case mirror of what their equivalent camelCase js
  representation would be, so the class `lap__prev-album` refers to the `prevAlbum` element
  located in the `Lap#els` object.

Taking the example one step further, using font-awesome:

```html
<link rel="stylesheet" type="text/css" href="font-awesome.css"></link>
<style>
#player i,
#player i:before {
  display: inline-block;
  font: normal normal normal 14px/1 FontAwesome;
}
#player .lap--paused:before {
  content: '\f04b';
}
#player .lap--playing:before {
  content: '\f04c';
}
#player .lap__seek-backward:before {
  content: '\f049';
}
#player .lap__seek-forward:before {
  content: '\f050';
}
</style>

<div id="player">
  <i class="lap__seek-backward"></i>
  <i class="lap__play-pause"></i>
  <i class="lap__seek-forward"></i>
</div
```

---

...to be continued
