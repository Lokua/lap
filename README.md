# Lokua Audio Player (Lap)

> HTML5 Audio player for modern browsers.

Lap is an audio player implementation that handles all common, typical audio player 
functionality. Actions like toggling play/pause, skipping, seeking, volume changes, and album 
changing are handled by Lap while developers are free to code their own visual solution. 
In other words,  _Lap provides the hooks, you provide the looks_.

The Lap constructor takes a container, and automatically sets up audio and event listeners
to any `.lap__<element>` classes it finds underneath. 
The following code snippet illustrates the minimum required to create a player that can 
simply play and pause a song:


```html
<div class="container">
  <button class="lap__play-pause">PLAY</button>
</div>
<script src="lap.js"></script>
<script>
  var lap = new Lap('.container', { files: ['track.mp3'] });
</script>
``` 

The above is not extremely useful, but there are a few things to note that will give you
a better understanding of how Lap works and how you can use it to your advantage.

+ Lap uses BEM style syntax; all Lap aware classes are named in `.lap__element--modifier` form
+ Lap will toggle `.lap--playing` and `.lap--paused` classes on the `.lap__play-pause` element
  whenever it is clicked (in addition to actually playing or pause the audio, of course)
+ Lap will fire the `play` or `pause` event, which you can react to through
  `lap.on('play', callback)` or `lap.on('pause', callback)`
+ Lap exposes all elements it finds under its instance's container through the `lap.$els` object,
  so the button in this example is accessible through `lap.$els.playPause` (the js element name
  is the camelCase version of the css element snake-case). See the [Selectors](selectors) section
  for a complete list of control, read, and modifier classes/elements.

The above information goes for all typical audio controls. The following list's each supported
selector, it's `lap.$els` member name, the click event it fires if appropriate, and additional notes
where relavent:


# Selectors

```js
selectors: {
  state: {
    playlistItemCurrent: 'lap__playlist__item--current',
    playing:             'lap--playing',
    paused:              'lap--paused',
    hidden:              'lap--hidden'
  },
  album:               'lap__album',
  artist:              'lap__artist',
  buffered:            'lap__buffered',
  cover:               'lap__cover',
  currentTime:         'lap__current-time',
  discog:              'lap__discog',
  discogItem:          'lap__discog__item',
  discogPanel:         'lap__discog__panel',
  duration:            'lap__duration',
  info:                'lap__info', // button
  infoPanel:           'lap__info-panel',
  next:                'lap__next',
  nextAlbum:           'lap__next-album',
  playPause:           'lap__play-pause',
  playlist:            'lap__playlist', // button
  playlistItem:        'lap__playlist__item', // list item
  playlistPanel:       'lap__playlist__panel',
  playlistTrackNumber: 'lap__playlist__track-number',
  playlistTrackTitle : 'lap__playlist__track-title',
  prev:                'lap__prev',
  prevAlbum:           'lap__prev-album',
  progress:            'lap__progress',
  seekBackward:        'lap__seek-backward',
  seekForward:         'lap__seek-forward',
  seekRange:           'lap__seek-range',
  trackNumber:         'lap__track-number', // the currently cued track
  trackTitle:          'lap__track-title',
  volumeButton:        'lap__volume-button',
  volumeDown:          'lap__volume-down',
  volumeRead:          'lap__volume-read',
  volumeRange:         'lap__volume-range',
  volumeUp:            'lap__volume-up'
}
```

# Development

`npm install` and run `grunt` (default task), which will start a connect
server for `localhost:3000/test` and `localhost:3000/demo` locations, 
compile sass for the demo, and build `dist/lap-debug.js` whenever changes
are made to `src/lap.js`.

Final production build is done with `grunt all`.
