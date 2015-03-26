# Lokua Audio Player (Lap)

> HTML5 Audio player for modern browsers.

See [version 0.0.7 branch](https://github.com/Lokua/lap/tree/0.0.7) 
for the most stable version with working examples.

# Default Selectors

```js
selectors: {
  state: {
    playlistItemCurrent: 'lap__playlist__item--current',
    playing            : 'lap--playing',
    paused             : 'lap--paused',
    hidden             : 'lap--hidden'
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
