this dir contains various full and min builds for different use cases:

## lap-bundle.js
Contains Lap and the raphael-controls controls implementation for various player needs.
Only exposes Lap as global namespace. Lap's [tooly.js](http://github.com/Lokua/tooly) 
dependency can be retrieved from a static call to `Lap.prototype.getTooly()`.
weighs in min ~70k

## lap-raphael-bundle.js
same as above; additionally includes the [Raphael.js](http://raphaeljs.com/) dependency.
weighs in min ~112k

## lap.js
contains both Lap and its only dependency [tooly.js](https://github.com/Lokua/tooly); 
exposes both `Lap` and `tooly` as global variables.
Weighs in min ~16k

