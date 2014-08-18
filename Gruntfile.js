'use strict';

module.exports = function(grunt) {

  var dev = true;
  var src = (dev) ? 'src/lap_dev.js' : 'src/lap.js';

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      build: {
        src: [
          'node_modules/tooly/dist/tooly-raw.js', 
          'node_modules/handler/src/handler.js',
          src
        ],
        dest: 'dist/lap.js'
      }
    },

    shell: {
      jsdoc: {
        command: 'rm -rf doc/jsdoc && jsdoc -c conf.json'
      },
      push: {
        command: 'git commit -a -m "-auto-" && git push -u origin master'
      }
    },

    uglify: {
      build: {
        src: 'dist/lap.js',
        dest: 'dist/lap.min.js'
      }
    },

    umd: {
      build: {
        src: 'dist/lap.js',
        // dest: 'dist/lap.js',
        objectToExport: 'Lap',
        amdModuleId: 'Lap',
        // indent: '  '
        deps: {
          // 'default': ['tooly', 'Handler'],
        }
      }
    },

    usebanner: {
      options: {
        position: 'top',
        banner: require('./banner'),
        linebreak: true
      },
      build: {
        files: {
          src: ['dist/lap.js']
        }
      },
      post: {
        files: {
          src: ['dist/lap.min.js']
        }
      }
    },

    watch: {
      build: {
        files: 'src/*',
        tasks: ['build']
      },
      doc: {
        files: 'src/*.js',
        tasks: ['shell:jsdoc']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-umd');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('default', ['build']);
  grunt.registerTask('build', [
    'concat:build',
    'umd:build', 
    'usebanner:build', 
    'uglify:build', 
    'usebanner:post'
  ]);
  // grunt.registerTask('push', ['build', 'shell:push']);
};