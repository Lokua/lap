# [0.2.0] 2015.03.10

+ Updated to newest `tooly` dependency
+ Changed `lap.registerCallback` to `lap.register` to conform to 
  `tooly.Handler` parent.
+ removed ajax - lib has to be supplied by user (works better in 
  success callback anyway)
+ Removed support of `string` lib. Lap will now only accept an object or 
  array
