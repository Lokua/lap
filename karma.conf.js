// Karma configuration
// Generated on Mon May 25 2015 23:11:44 GMT-0500 (CDT)

module.exports = function(config) {
  'use strict';
  
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'deps/angular/angular.js',
      'deps/angular-mocks/angular-mocks.js',
      'deps/tooly/dist/ng-tooly.js',
      'dist/lap.js',
      'test/*.test.js'
    ],


    // list of files to exclude
    exclude: [
      'src/templates/*',
      'src/resources/*'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'dist/lap.js': 'coverage'
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['spec', 'coverage'],

    coverageReporter: {
      reporters: [{
        type: 'html',
        dir: 'test/coverage'
      }, {
        type: 'text'
      }]
    },


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_WARN,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};