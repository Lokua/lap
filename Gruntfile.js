/*jshint camelcase:false*/
'use strict';

module.exports = function(grunt) {

  var distLapDebug = 'dist/lap-debug.js';
  var distLap = 'dist/lap.js';
  var srcLap = 'src/lap.js';

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    autoprefixer: {
      options: {
        browsers: ['> 1%'],
        cascade: true
      },
      demo: {
        src: 'demo/style.css'
      }
    },

    concat: {
      options: {
        separator: '\n\n'
      },
      debug: {
        src: [
          'node_modules/tooly/dist/tooly.js',
          distLapDebug
        ],
        dest: distLapDebug
      },
      build: {
        src: [
          'node_modules/tooly/dist/tooly-slim.js',
          distLap
        ],
        dest: distLap
      }
    },

    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      debug: {
        tasks: ['connect', 'watch']
      },
      angular: {
        tasks: ['connect', 'watch']
      }
    },

    connect: { 
      main: { 
        options: { 
          port: 3000, 
          keepalive: true,
          livereload: true 
        } 
      } 
    },

    copy: {
      debug: {
        src: srcLap,
        dest: distLapDebug
      },
      build: {
        src: srcLap,
        dest: distLap
      },
      raw: {
        src: srcLap,
        dest: 'dist/lap-raw.js'
      }
    },

    cssbeautifier : {
      files: ['demo/style.css'],
      options: {
        indent: '  '
      }
    },

    jade: {
      options: {
        pretty: true,
        timestamp: '<%= grunt.template.today("yyyy-mm-dd") %> <%= new Date().getTime() %>'
      },
      angular: {
        files: {
          'src/templates/lap-controls.html': ['src/templates/lap-controls.jade'],
          'src/templates/lap-playlist.html': ['src/templates/lap-playlist.jade'],
        }
      }
    },

    sass: {
      test: {
        options: {
          outputStyle: 'expanded',
          noCache: true,
          sourcemap: 'none'
        },
        files: {
          'test/test.css' : 'test/test.scss'
        }
      },
      demo: {
        options: {
          outputStyle: 'expanded',
          cacheLocation: 'demo/.sass-cache',
          noCache: true,
          sourceMap: 'none'
        },
        files: {
          'demo/style.css': 'demo/sass/style.scss'
        }
      }
    },

    shell: {
      push: {
        command: 'git commit -a -m "-auto-" && git push -u origin master'
      }
    },

    strip_code: {
      options: {
        start_comment: '>>',
        end_comment: '<<'
      },
      build: {
        src: distLap
      },
      raw: {
        src: 'dist/lap-raw.js'
      }
    },

    uglify: {
      build: {
        src: distLap,
        dest: 'dist/lap.min.js'
      },
      raw: {
        src: 'dist/lap-raw.js',
        dest: 'dist/lap-raw.min.js'
      }
    },

    usebanner: {
      options: {
        position: 'top',
        banner: require('./src/resources/banner'),
        linebreak: true
      },
      build: {
        files: {
          src: [distLap]
        }
      },
      debug: {
        files: { 
          src: [distLapDebug] 
        }
      },
      post: {
        options: {
          banner: require('./src/resources/banner-min')
        },
        files: {
          src: ['dist/lap.min.js']
        }
      },
      post_raw: {
        options: {
          banner: require('./src/resources/banner-min')
        },
        files: {
          src: ['dist/lap-raw.min.js']
        }        
      },
      raw: {
        files: {
          src: ['dist/lap-raw.js']
        }        
      }
    },

    watch: {
      options: {
        livereload: true
      },
      demo: {
        files: 'demo/sass/*.scss',
        tasks: ['sass:demo', 'autoprefixer:demo', 'cssbeautifier']
      },
      jade: {
        files: 'src/templates/*.jade',
        tasks: ['jade']
      },
      angular: {
        files: ['**/*.js', 'demo/**/*'],
        tasks: []
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-cssbeautifier');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-strip-code');
  grunt.loadNpmTasks('grunt-umd');

  grunt.registerTask('default', ['concurrent']);
  grunt.registerTask('all', ['debug', 'build', 'raw']);
  grunt.registerTask('raw', [
    'copy:raw',
    'strip_code:raw',
    'umd:raw', 
    'usebanner:raw', 
    'uglify:raw', 
    'usebanner:post_raw'    
  ]);
  grunt.registerTask('debug', [
    'copy:debug',
    'umd:debug', 
    'usebanner:debug',
    'concat:debug'
  ]);
  grunt.registerTask('build', [
    'copy:build',
    'strip_code:build',
    'umd:build', 
    'usebanner:build', 
    'concat:build',
    'uglify:build', 
    'usebanner:post'
  ]);
  grunt.registerTask('angular', ['concurrent:angular']);
};