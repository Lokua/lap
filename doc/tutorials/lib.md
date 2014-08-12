Audio resources (file, track names, artist) can be passed to the {@link Lap} constructor
in a number of ways, resulting in a player that is for a single track, multiple tracks (album), or
multiple albums (discography); "lib" is the generic term to encompass all possible scenarios.

---

The most minimal possible format is that of a single audio file and no data, 
where a string is passed in for the lib argument:

    var lap = new Lap($container, "http://lokua.net/audio/Lokua_-_Mafioso.mp3", settings);

Passing an object of type {@linkplain string} will always result in a single-track 
player.

---

At its fullest, multiple albums can be passed as objects within an array.

```javascipt
var lib = [
  {
    album: "I Don't Care Because You Don't",
    artist: "Latex Flynn",
    date: "3014.12.32",
    label: "unreleased",
    details: { 
      // this can be whatever 
    },
    cover: "full-path-to-image.png",
    files: [
      "full-path-1",
      "full-path-2" // etc...
    ],
    // if not supplied, or if the length of trackNames does not match the length of
    // files, Lap will try to autogen tracknames from the filename without extension
    trackNames: [
      "actual display name of files[0]"
      // etc...
    ]
  },
  // second album
  {
    album: "Polyester Elbow",
    // etc....    
  }
];
var lap = new Lap($container, lib, settings);
```

Passing an array to the lib argument will always result in a multi-album player. The only
required fields of each object are the files array. For a single-album player, simply pass one
object (NOT an array).