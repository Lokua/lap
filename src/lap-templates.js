!function() {


angular.module('lnet.lap').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('lap-controls.html',
    "<div ng-switch=\"isMobile\" class=\"lap lap__player\"><div class=\"lap__details\"><div><span class=\"lap__detail lap__artist\"></span><span class=\"lap__detail lap__album\"></span></div><div><span class=\"lap__detail lap__track-number\"></span><span class=\"lap__detail lap__track-title\"></span></div></div><br/><div ng-switch-default=\"false\" class=\"lap__controls\"><div class=\"lap__control lap__non-v\"><i class=\"lap__play-pause lap-i-play\"></i></div><div data-lap-tooltip=\"previous track\" class=\"lap__control lap__tooltip lap__non-v\"><i class=\"lap__prev lap-i-prev\"></i></div><div data-lap-tooltip=\"next track\" class=\"lap__control lap__tooltip lap__non-v\"><i class=\"lap__next lap-i-next\"></i></div><div class=\"lap__read lap__non-v lap__current-time\">00:00</div><div class=\"lap__prog-seek\"><prog-seek class=\"prog-seek\"></prog-seek></div><div class=\"lap__read lap__duration lap__non-v\">00:00</div><div data-lap-tooltip=\"previous album\" class=\"lap__control lap__tooltip lap__non-v\"><i class=\"lap__prev-album lap-i-prev-album\"></i></div><div data-lap-tooltip=\"show albums\" class=\"lap__control lap__tooltip lap__non-v\"><i ng-class=\"{active:discogActive}\" ng-click=\"discogActive=!discogActive\" class=\"lap__discog lap-i-discog\"></i></div><div data-lap-tooltip=\"next album\" class=\"lap__control lap__tooltip lap__non-v\"><i class=\"lap__next-album lap-i-next-album\"></i></div></div><div ng-switch-when=\"true\" class=\"lap__controls lap--mobile\"><section class=\"lap__mobile-section--1\"><div class=\"lap__control\"><i class=\"lap__prev lap-i-prev\"></i></div><div class=\"lap__control\"><i class=\"lap__play-pause lap-i-play\"></i></div><div class=\"lap__control\"><i class=\"lap__next lap-i-next\"></i></div></section><section class=\"lap__mobile-section--2\"><div class=\"lap__read lap__current-time\">00:00</div><div class=\"lap__prog-seek\"><prog-seek class=\"prog-seek\"></prog-seek></div><div class=\"lap__read lap__duration\">00:00</div></section><section class=\"lap__mobile-section--3\"><div class=\"lap__control\"><i ng-class=\"{active:discogActive}\" ng-click=\"discogActive=!discogActive\" class=\"lap__discog lap-i-discog\"></i></div></section></div></div>"
  );


  $templateCache.put('lap-discog.html',
    "<div class=\"lap__discog__panel\"><div ng-repeat=\"album in lib\" ng-click=\"loadAlbum($index)\" ng-class=\"{active:$index===lap.albumIndex}\" class=\"lap__discog__item\"><img ng-src=\"{{album.cover}}\"/><aside>{{album.album}}</aside></div></div>"
  );


  $templateCache.put('lap-playlist.html',
    "<div class=\"lap__cover__container\"><img ng-src=\"{{cover}}\" class=\"lap__cover\"/></div><div ng-show=\"showPlayist\" class=\"lap__playlist__panel\"><div class=\"lap__playlist__panel__inner\"><div ng-repeat=\"track in tracklist\" ng-class=\"{ &quot;lap__playlist__item--current&quot;: $index === lap.trackIndex }\" ng-click=\"setTrack($index)\" class=\"lap__playlist__item\"><span class=\"lap__playlist__track-number\">{{trackNumbers[$index]}} &nbsp;</span><span class=\"lap__playlist__track-title\">{{track}}</span></div></div></div>"
  );

}]);



}();