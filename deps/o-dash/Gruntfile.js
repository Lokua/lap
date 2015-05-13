'use strict';

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    exec: {
      gen: {
        cmd: 'npm run gen'
      }
    },

    jade: {
      dev: {
        options: {
          pretty: true,
          layout: false
        },
        files: {
          'docs/index.html': 'docs/index.jade'
        }
      }
    },

    'sass-convert': {
      options: {
        from: 'scss',
        to: 'sass'
      },
      files: {
        src: ['lib/**/*.scss'],
        dest: 'scss'
      }
    },

    sass: {
      docs: {
        options: {
          style: 'expanded'
        },
        files: {
          'docs/style.css': 'docs/style.sass'
        }
      }
    },

    watch: {
      jade: { 
        files: ['docs/*.jade'],
        tasks: ['jade:dev']
      },
      sass: {
        files: ['lib/**/*.sass', 'docs/*.sass'],
        tasks: ['exec', 'sass:docs']
      }
    }

  });

  grunt.registerTask('default', ['watch']);
  grunt.registerTask('gen', ['exec']);
  grunt.registerTask('doc', ['exec', 'jade', 'sass']);
}