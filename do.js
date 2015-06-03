/**
 * tired of Grunt and Gulp, plus this way I have more
 * fun and get more experience with awesome Node packages.
 */

/* global -Promise */

'use strict';

var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    glob = require('glob');

var pglob = Promise.promisify(glob);

var SRC = './src/', DEST = './dist-test';

function makeTemplateScript() {
  // glob(SRC+'templates/*.html', function(err, files) {
  //   fs.readdirAsync
  // });
  pglob(SRC+'templates/*.html').then(function(files) {
    console.log(files);
  });
}
makeTemplateScript();


