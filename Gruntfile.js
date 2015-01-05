'use strict';

module.exports = function(grunt) {

  var dist_lap_debug = 'dist/lap-debug.js';
  var dist_lap = 'dist/lap.js';
  var src_lap = 'src/lap.js';

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    autoprefixer: {
      options: {
        browsers: ['> 1%'],
        cascade: true
      },
      cssDemo: {
        src: 'demo/css-controls/style.css'
      }
    },

    concat: {
      options: {
        separator: '\n\n'
      },
      debug: {
        src: [
          'node_modules/tooly/dist/tooly.js',
          dist_lap_debug
        ],
        dest: dist_lap_debug
      },
      build: {
        src: [
          'node_modules/tooly/dist/tooly-slim.js',
          dist_lap
        ],
        dest: dist_lap
      },
      // raw: {
      //   src: [
      //     'node_modules/tooly/dist/tooly-slim.js',
      //     dist_lap
      //   ],
      //   dest: dist_lap
      // },
      rc_debug: {
        src: [
          'demo/raphael-controls/controls/ctor.js',
          'demo/raphael-controls/controls/components/*.js'
        ],
        dest: 'demo/raphael-controls/raphael-controls-debug.js'
      },
      rc_bundle: {
        src: [
          'demo/raphael-controls/raphael-min.js',
          'demo/raphael-controls/raphael-controls.min.js'
        ],
        dest: 'demo/raphael-controls/bundle.min.js'
      }
    },

    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      debug: {
        tasks: ['connect', 'watch']
      }
    },

    connect: { 
      main: { 
        options: { 
          port: 3000, 
          keepalive: true 
        } 
      } 
    },

    copy: {
      debug: {
        src: src_lap,
        dest: dist_lap_debug
      },
      build: {
        src: src_lap,
        dest: dist_lap
      },
      raw: {
        src: src_lap,
        dest: 'dist/lap-raw.js'
      },      
      rc_deps: {
        src: 'node_modules/raphael/raphael-min.js',
        dest: 'demo/raphael-controls/raphael-min.js'
      },
      rc: {
        src: 'demo/raphael-controls/raphael-controls-debug.js',
        dest: 'demo/raphael-controls/raphael-controls.js'
      }
    },

    jade: {
      cssDemo: {
        options: {
          pretty: true,
          timestamp: '<%= grunt.template.today("yyyy-mm-dd") %> <%= new Date().getTime() %>'
        },
        files: {
          'demo/css-controls/index.html': ['demo/css-controls/jade/index.jade']
        }
      }
    },

    sass: {
      test: {
        options: {
          style: 'expanded',
          noCache: true,
          sourcemap: 'none'
        },
        files: {
          'test/test.css' : 'test/test.scss'
        }
      },
      rc: {
        options: {
          style: 'expanded',
          cacheLocation: 'demo/raphael-controls/sass/.sass-cache',
          noCache: true,
          sourcemap: 'none'
        },
        files: {
          'demo/raphael-controls/style.css': 'demo/raphael-controls/sass/style.scss'
        }
      },
      cssDemo: {
        options: {
          style: 'expanded',
          cacheLocation: 'demo/css-controls/.sass-cache',
          noCache: true,
          sourcemap: 'none'
        },
        files: {
          'demo/css-controls/style.css':'demo/css-controls/sass/style.scss'
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
        src: dist_lap
      },
      raw: {
        src: 'dist/lap-raw.js'
      },
      rc: {
        src: 'demo/raphael-controls/raphael-controls.js'
      }
    },

    uglify: {
      build: {
        src: dist_lap,
        dest: 'dist/lap.min.js'
      },
      raw: {
        src: 'dist/lap-raw.js',
        dest: 'dist/lap-raw.min.js'
      },      
      rc: {
        src: 'demo/raphael-controls/raphael-controls.js',
        dest: 'demo/raphael-controls/raphael-controls.min.js'
      }
    },

    umd: {
      build: {
        src: dist_lap,
        objectToExport: 'Lap',
        amdModuleId: 'Lap',
        template: 'src/umd-template.hbs'
      },
      raw: {
        src: 'dist/lap-raw.js',
        objectToExport: 'Lap',
        amdModuleId: 'Lap',
        template: 'src/umd-template.hbs'
      },      
      debug: {
        src: dist_lap_debug,
        objectToExport: 'Lap',
        amdModuleId: 'Lap',
        template: 'src/umd-template.hbs'
      }
    },

    usebanner: {
      options: {
        position: 'top',
        banner: require('./src/banner'),
        linebreak: true
      },
      build: {
        files: {
          src: [dist_lap]
        }
      },
      debug: {
        files: { 
          src: [dist_lap_debug] 
        }
      },
      post: {
        options: {
          banner: require('./src/banner-min')
        },
        files: {
          src: ['dist/lap.min.js']
        }
      },
      post_raw: {
        options: {
          banner: require('./src/banner-min')
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
      debug: {
        files: src_lap,
        tasks: ['debug'/*, 'build'*/]
      },
      rc_sass: {
        files: ['demo/raphael-controls/sass/*.scss'],
        tasks: ['sass:rc']
      },
      rc: {
        files: [
          'src/*.js', 
          'demo/raphael-controls/controls/*.js', 
          'demo/raphael-controls/controls/components/*.js'
        ], 
        tasks: ['rc_all']
      },
      cssDemo: {
        files: 'demo/css-controls/sass/*.scss',
        tasks: ['sass:cssDemo', 'autoprefixer:cssDemo']
      },
      cssDemoJade: {
        files: 'demo/css-controls/jade/*.jade',
        tasks: ['jade']
      }
    },

    wrap: {
      rc: {
        src: ['demo/raphael-controls/raphael-controls-debug.js'],
        dest: 'demo/raphael-controls/raphael-controls-debug.js',
        options: {
          indent: '  ',
          wrapper: [';(function(window, Lap, undefined) {\n', '\n})(window, window.Lap);']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-line-remover');
  grunt.loadNpmTasks('grunt-remove');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-strip-code');
  grunt.loadNpmTasks('grunt-umd');
  grunt.loadNpmTasks('grunt-wrap');

  grunt.registerTask('default', ['concurrent']);
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
  grunt.registerTask('rc_debug', [
    'concat:rc_debug',
    'wrap:rc'
  ]);
  grunt.registerTask('rc', [
    'copy:rc',
    'strip_code:rc',
    'uglify:rc',
    'concat:rc_bundle'
  ]);
  grunt.registerTask('lap_all', ['debug', 'build', 'raw']);
  grunt.registerTask('rc_all', ['rc_debug', 'rc']);
  grunt.registerTask('all', ['lap_all', 'rc_all']);
};