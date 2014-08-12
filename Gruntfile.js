'use strict';

module.exports = function(grunt) {

  // doesn't work with watch for some reason?
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    shell: {
      jsdoc: {
        command: 'rm -rf doc/jsdoc && jsdoc -c conf.json'
      }
    },

    concat: {
      options: {
        separator: '\n/*<-- concat -->*/\n'
      },
      rdemo_depends: {
        src: [
          'bower_components/jquery/dist/jquery.min.js',
          'bower_components/raphael/raphael-min.js',
          'bower_components/fraphael/fraphael.js',
        ],
        dest: 'demos/raphael-controls-demo/js/deps.js'
      }
    },

    copy: {
      main: {
        src: 'build/build.js',
        dest: 'dist/lap.js'
      }
    },

    uglify: {
      main: {
        src: '<%= copy.main.dest %>',
        dest: 'dist/lap.min.js'
      },
      rdemo_depends: {
        src: '<%= concat.rdemo_depends.dest %>',
        dest: '<%= concat.rdemo_depends.dest %>'
      }
    },

    compass: {
      dist: {
        options: {
          require: 'animation',
          basePath: 'demos/raphael-controls-demo/css/',
          sassDir: 'sass',
          cssDir: '.',
          // outputStyle: 'compressed',
          outputStyle: 'expanded',
          noLineComments: true
        }
      }
    },

    watch: {
      main: {
        files: 'src/*',
        tasks: ['copy:main', 'uglify:main']
      },
      doc: {
        files: 'src/*.js',
        tasks: ['shell:jsdoc']
      },
      rdemo: {
        files: 'demos/raphael-controls-demo/js/*.js',
        tasks: ['concat:raphaelDemo']
      },
      styles: {
        files: 'demos/raphael-controls-demo/css/sass/*.scss',
        tasks: ['compass']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['copy:main', 'uglify:main']);
  grunt.registerTask('rdemo_depends', ['concat:rdemo_depends', 'uglify:rdemo_depends']);
};