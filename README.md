Lokua Audio Player (Lap)
========================

(in progress)

HTML5 Audio player for modern browsers.

Lap does not implement an actual interface. It is meant to provide the logical player and dom selection functionality any player would need, while leaving the visual design up to you, however, there is a
controls implementation using [Raphael.js](http://raphaeljs.com/) as well as some experiments using 
HTML5 Canvas (check out the [demo](./demo) folders).

```javascript
{
  albumTitle         : '.lap-album-title',
  artist             : '.lap-artist',
  buffered           : '.lap-buffered',
  control            : '.lap-control',
  controls           : '.lap-controls',
  cover              : '.lap-cover',
  currentTime        : '.lap-current-time',
  discog             : '.lap-discog',
  duration           : '.lap-duration',
  info               : '.lap-info', // button
  infoPanel          : '.lap-info-panel',
  next               : '.lap-next',
  nextAlbum          : '.lap-next-album',
  playPause          : '.lap-play-pause',
  playlist           : '.lap-playlist', // button
  playlistPanel      : '.lap-playlist-panel',
  playlistTrackNumber: '.lap-playlist-track-number',
  prev               : '.lap-prev',
  prevAlbum          : '.lap-prev-album',
  seekBackward       : '.lap-seek-backward',
  seekForward        : '.lap-seek-forward',
  seekbar            : '.lap-seekbar',
  trackNumber        : '.lap-track-number', // the currently cued track
  trackTitle         : '.lap-track-title',
  volumeButton       : '.lap-volume-button',
  volumeDown         : '.lap-volume-down',
  volumeRead         : '.lap-volume-read',
  volumeSlider       : '.lap-volume-slider',
  volumeUp           : '.lap-volume-up'
};
```


