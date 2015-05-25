/*jshint camelcase:false*/
'use strict';

module.exports = function(grunt) {

  var distLapDebug = 'dist/lap-debug.js';
  var distLap = 'dist/lap.js';
  var srcLap = 'src/lap.js';

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    ngtemplates: {
      build: {
        options: {
          module: 'lnet.lap'/*,
          htmlmin: {
            collapseBooleanAttributes:      true,
            collapseWhitespace:             true,
            removeAttributeQuotes:          true,
            removeComments:                 true, // Only if you don't use comment directives! 
            removeEmptyAttributes:          true,
            removeRedundantAttributes:      true,
            removeScriptTypeAttributes:     true,
            removeStyleLinkTypeAttributes:  true          
          }*/
        },
        cwd: 'src/templates',
        src: '*.html',
        dest: 'src/lap-templates.js'
      }
    },

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
      dev: {
        src: [
          'src/lap-module-definition.js',
          'src/services/*.js',
          'src/directives/*.js'
        ],
        dest: 'dist/lap-debug.js'
      },
      dist: {
        src: [
          'src/*.js',
          'src/services/*.js',
          'src/directives/*.js'
        ],
        dest: 'dist/lap.js'
      }
    },

    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      dev: {
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
        pretty: false,
        timestamp: '<%= grunt.template.today("yyyy-mm-dd") %> <%= new Date().getTime() %>'
      },
      angular: {
        files: {
          'src/templates/lap-controls.html': ['src/templates/lap-controls.jade'],
          'src/templates/lap-playlist.html': ['src/templates/lap-playlist.jade'],
          'src/templates/lap-discog.html': ['src/templates/lap-discog.jade'],
        }
      }
    },

    sass: {
      test: {
        options: {
          outputStyle: 'expanded',
          noCache: true
        },
        files: {
          'test/test.css' : 'test/test.scss'
        }
      },
      demo: {
        options: {
          outputStyle: 'expanded',
          cacheLocation: 'demo/.sass-cache',
          noCache: true
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
      dist: {
        src: 'dist/lap.js'
      }
    },

    uglify: {
      dist: {
        src: 'dist/lap.js',
        dest: 'dist/lap.min.js'
      }
    },

    usebanner: {
      options: {
        position: 'top',
        banner: require('./src/resources/banner'),
        linebreak: true
      },
      dev: {
        files: {
          src: 'dist/lap-debug.js'
        }
      },      
      dist: {
        files: {
          src: 'dist/lap.js'
        }
      },
      post: {
        options: {
          banner: require('./src/resources/banner-min')
        },
        files: {
          src: 'dist/lap.min.js'
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
        tasks: ['jade', 'ngtemplates:build']
      },
      angular: {
        files: ['src/services/*.js', 'src/directives/*.js', 'demo/**/*'],
        tasks: ['concat:dev']
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
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-strip-code');
  grunt.loadNpmTasks('grunt-umd');

  grunt.registerTask('default', ['concurrent:dev']);
  grunt.registerTask('build', [
    'concat:dist', 
    'strip_code:dist', 
    'uglify:dist', 
    'usebanner:dist', 
    'usebanner:post'
  ]);
};