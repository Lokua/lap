'use strict';

module.exports = function(grunt) {

  // doesn't work with watch for some reason?
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    shell: {
      jsdoc: {
        command: 'rm -rf doc/jsdoc && jsdoc -c conf.json'
      },
      build: {
        command: 'component build'
      },
      push: {
        command: 'git commit -a -m "***generated push***" && git push -u origin master'
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
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['copy:main', 'uglify:main']);
  grunt.registerTask('build', ['shell:build', 'default']);
  grunt.registerTask('push', ['build', 'shell:push']);
};