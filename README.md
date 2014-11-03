# Lokua Audio Player (Lap)

> HTML5 Audio player for modern browsers.

<small>(in progress)</small>

Lap provides the backing code for audio players of varying degrees of complexity, while leaving
the visual controls open for implementation.

## Usage

> Documentation is in progress. For now here is a quick overview.

The Lap constructor takes four arguments, with the latter two being optional.

```js
var player = new Lap(container, lib, options, init)
```

### container 

a valid selector string or HTMLElement to house the player controls.

### lib 

a path to a single audio or json file, or object hash. 
The json file or hash can denote a single track, a full album,
or entire discography. Lap will automatically perform an XHR for the json file. 
Here is a example of a full album:

```json
{
  "data": {  
    "artist": "Lokua",
    "album": "Vacuus",
    "date": "2012.01.31",
    "label": "unreleased",
    "cover": "http://lokua.net/images/earth/disco3.png",
    "replacement": ["Lokua_-_Vacuus_-_[0-9]{2}_-_|_+|\\s{2,}", " "],
    "files": [
      "http://lokua.net/audio/vacuus/Lokua_-_Vacuus_-_01_-_Dark_Energy.mp3",
      "http://lokua.net/audio/vacuus/Lokua_-_Vacuus_-_02_-_Source_Direct.mp3",
      "http://lokua.net/audio/vacuus/Lokua_-_Vacuus_-_03_-_The_Glimmer_Fade.mp3"
    ]
  }
}
```

For multible albums, simply pass an array to the `data` property. 

While most properties are simply metadata, the `replacement` property can denote a `RegExp` used 
for tracklist formatting. Notice that the replacement only pays attention to the basename of the 
path, or everything after the last `/`; Lap automatically removes this before formatting the 
tracklist. After player construction, the tracklist will be accessible through the instance's
`tracklist` property.

### options

defaults:

```js
{
  // the first track to be cued from the current album on player load
  startingTrackIndex: 0,
  // if multiple albums are supplied, choose the first album to be cued on player load
  startingAlbumIndex: 0,
  // the amount to increase/decrement volume per click
  volumeInterval: 0.05,
  // how often the seek action is repeated when a seek button is held
  seekInterval: 5,
  // how far to seek per click
  seekTime: 250,   
  // adds numbers in order for each item in the tracklist, as parsed from the current album's
  // files array.
  prependTrackNumbers: true,
  // if prependTrackNumbers is true, place this between the number and track title 
  // - numbers are indexed from 1
  trackNumberPostfix: ' - ',
  replacementText: void 0,
  // default element selectors. After instantiation, elements are accessible as
  // lapInstance.$els.elementName
  elements: {
    // read only
    albumTitle:          '.lap-album-title',
    // read only
    artist:              '.lap-artist',
    // read only
    buffered:            '.lap-buffered',
    // deprecated
    control:             '.lap-control',
    // deprecated
    controls:            '.lap-controls',
    // img element
    cover:               '.lap-cover',
    currentTime:         '.lap-current-time',
    // button to show/hide a discog panel
    discog:              '.lap-discog',
    // read only
    duration:            '.lap-duration',
    // button to show/hide an info panel
    info:                '.lap-info', // button
    // generic info panel
    infoPanel:           '.lap-info-panel',
    // button to step to next track, click emits "trackChanged" event
    next:                '.lap-next',
    // button to step to next album, click emits "albumChanged" event
    nextAlbum:           '.lap-next-album',
    // button, toggle play-pause state, emits either "play" or "pause" event,
    // adds corresponding .lap-playing/.lap-paused class to itself
    playPause:           '.lap-play-pause',
    // button, hide/show playlistPanel element
    playlist:            '.lap-playlist',
    // generic container
    playlistPanel:       '.lap-playlist-panel',
    // span element, prepended before each playlistItem
    playlistTrackNumber: '.lap-playlist-track-number',
    // button to step to previous track, click emits "trackChanged" event
    prev:                '.lap-prev',
    // button to step to previous album, click emits "albumChanged" event
    // TODO: shouldn't these emit "trackChanged" as well?
    prevAlbum:           '.lap-prev-album',
    // button, seek backward in time, click emits "seek" event
    seekBackward:        '.lap-seek-backward',
    // button, seek forward in time, click emits "seek" event
    seekForward:         '.lap-seek-forward',
    // input type=range element, alternative to the seek buttons, emits the "seek" event
    seekbar:             '.lap-seekbar',
    // read only
    trackNumber:         '.lap-track-number', // the currently cued track
    // read only
    trackTitle:          '.lap-track-title',
    // deprecated
    volumeButton:        '.lap-volume-button',
    // button, decrement volume, emits the "volumeChanged" event
    volumeDown:          '.lap-volume-down',
    // read only, volume as percent ie. 90%
    volumeRead:          '.lap-volume-read',
    // input type=range element, alternative to volume buttons, emits the "volumeChanged" event
    volumeSlider:        '.lap-volume-slider',
    // button, increment volume, emits the "volumeChanged" event
    volumeUp:            '.lap-volume-up'
  },
  // supply callback functions for the above mentioned events.
  // Example:
  // callbacks: { volumeChanged: function() {}, trackChanged: function() {} }
  callbacks: {},
  // experimental
  plugins: {}
}
```

Using the default selectors is recommended. Lap will only add the appropriate handlers
for elements it finds under the `container`. Automatic handling and updating of the elements in the 
dom is included for all "click based" controls. For example, when the `playPause` element is 
clicked, Lap will toggle `lap-playing` and `lap-paused` classes accordingly. If using a multiple
album `lib`, when `prevAlbum` or `nextAlbum` is clicked, Lap will automatically change the `src` 
attribute of any image it finds under the `cover` element with that supplied in the `lib` object 
for that particular album. The same goes for all other metadata like artist, label, etc.

### init

By default, Lap will immediately being selecting control elements under the passed container
and initialize its internal audio reference, which is why Lap should be instantiated after 
the `window.load` event is fired.

If false, Lap will not initialize the audio element or perform the dom element selections it 
requires. This is useful if you are dynamically adding players to a page. Call `#.init` later
to concretely instantiate.

## Examples

See the [demos folder][0] for a few examples. Likewise, after installing Lap's dependencies, you 
can serve the [test page][1] which contains all supported elements.

To run the test page or many of the examples you'll need to serve the files, as the scripts make
cross origin requests.

You can use something like [http-server][2], or
alternatively, from the Lap project root:

1. `npm install`
2. `grunt connect`

With the `grunt-connect` server running, and you can access the file 
from [localhost:3000/demo/basic/PAGE.HTML][3], where PAGE.HTML is the name of the demo
(ie. _playpause.html_)

## License

The MIT License

Copyright (c) 2014 Joshua Kleckner

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

[0]: /demo/
[1]: /test/index.html
[2]: https://www.npmjs.org/package/http-server
[3]: localhost:3000/demo/basic/album.html

