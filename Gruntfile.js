'use strict';

module.exports = function(grunt) {

  var dist_lap_debug = 'dist/lap-debug.js';
  var dist_lap = 'dist/lap.js';
  var src_lap = 'src/lap.js';
  var src_rc = 'src/controls/raphael-controls/';
  var dist_rc_debug = 'dist/controls/raphael-controls/raphael-controls-debug.js';
  var dist_rc = 'dist/controls/raphael-controls/raphael-controls.js';

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: '\n\n'
      },
      debug: {
        src: [
          'node_modules/tooly/dist/tooly-raw.js',
          dist_lap_debug
        ],
        dest: dist_lap_debug
      },
      build: {
        src: [
          'node_modules/tooly/dist/tooly-raw.js',
          dist_lap
        ],
        dest: dist_lap
      },
      rc_debug: {
        src: [
          src_rc + 'ctor.js',
          src_rc + 'components/*.js'
        ],
        dest: dist_rc_debug
      },
      rc_bundle: {
        src: [
          'dist/controls/raphael-controls/raphael-min.js',
          'dist/controls/raphael-controls/raphael-controls.min.js'
        ],
        dest: 'dist/controls/raphael-controls/bundle.min.js'
      }
    },

    connect: { 
      main: { 
        options: { 
          port: 9140, 
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
        src: dist_lap_debug,
        dest: dist_lap
      },
      rc_deps: {
        src: 'node_modules/raphael/raphael-min.js',
        dest: 'dist/controls/raphael-controls/raphael-min.js'
      },
      rc: {
        src: dist_rc_debug,
        dest: dist_rc
      },
      controls: {
        src: src_rc + 'style.css',
        dest: 'dist/controls/raphael-controls/style.css'
      } 
    },

    // lineremover: {
    //   strict: {
    //     files: {'<%= concat.bundle.dest %>': '<%= concat.bundle.dest %>'},
    //     options: {
    //       exclusionPattern: /'use strict';/g
    //     }
    //   }
    // },

    // remove: {
    //   default_options: { 
    //     trace: true, 
    //     fileList: ['./src/lap_temp.js']
    //   }
    // },

    sass: {
      test: {
        options: {
          style: 'expanded'
        },
        files: {
          'test/test.css' : 'test/test.scss'
        }
      },
      controls: {
        options: {
          style: 'expanded',
          cacheLocation: src_rc + '.sass-cache'
        },
        files: {
          'src/controls/raphael-controls/style.css':'src/controls/raphael-controls/sass/style.scss'
        }
      },
      cssDemo: {
        options: {
          style: 'expanded',
          cacheLocation: 'demo/css-controls/.sass-cache'
        },
        files: {
          'demo/css-controls/style.css':'demo/css-controls/style.scss'
        }
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

    strip_code: {
      options: {
        start_comment: '>>',
        end_comment: '<<'
      },
      build: {
        src: dist_lap
      },
      rc: {
        src: dist_rc
      }
    },

    uglify: {
      build: {
        src: dist_lap,
        dest: 'dist/lap.min.js'
      },
      rc: {
        src: dist_rc,
        dest: 'dist/controls/raphael-controls/raphael-controls.min.js'
      }
    },

    umd: {
      build: {
        src: 'dist/lap.js',
        objectToExport: 'Lap',
        amdModuleId: 'Lap',
      },
      debug: {
        src: dist_lap_debug,
        objectToExport: 'Lap',
        amdModuleId: 'Lap',
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
          src: [dist_lap]
        }
      },
      debug: {
        files: { 
          src: [dist_lap_debug] 
        }
      },
      // rc_debug: {
      //   options: {
      //     position: 'top',
      //     banner: require(rc_src + 'banner'),
      //     linebreak: true
      //   },
      //   files: {
      //     src: [dist_rc_debug]
      //   }
      // },
      post: {
        files: {
          src: ['dist/lap.min.js']
        }
      },
      // rc: {
      //   options: {
      //     position: 'top',
      //     banner: require(rc_src + 'banner'),
      //     linebreak: true
      //   },
      //   files: {
      //     src: ['dist/controls/raphael-controls/raphael-controls.min.js']
      //   }
      // }
    },

    watch: {
      // build: {
      //   files: src_lap,
      //   tasks: ['build']
      // },
      debug: {
        files: src_lap,
        tasks: ['debug', 'build']
      },
      rc: {
        files: [
          'src/*.js', 
          src_rc + '*.js', 
          src_rc + 'components/*'
        ], 
        tasks: ['rc_all']
      },
      // doc: {
      //   files: 'src/*.js',
      //   tasks: ['shell:jsdoc']
      // },
      // styles: {
      //   files: 'test/*.scss',
      //   tasks: ['sass:test']
      // },
      controls: {
        files: src_rc + 'sass/*.scss',
        tasks: ['sass:controls']
      },
      // lap: { 
      //   files: [
      //     'src/*.js', 
      //     src_rc + '*.js', 
      //     src_rc + 'components/*'
      //   ], 
      //   tasks: ['bundle']
      // },
      cssDemo: {
        files: 'demo/css-controls/*.scss',
        tasks: ['sass:cssDemo']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-line-remover');
  grunt.loadNpmTasks('grunt-remove');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-strip-code');
  grunt.loadNpmTasks('grunt-umd');

  grunt.registerTask('default', ['build']);
  grunt.registerTask('debug', [
    'copy:debug',
    'concat:debug',
    'umd:debug', 
    'usebanner:debug'
  ]);
  grunt.registerTask('build', [
    'copy:build',
    'strip_code:build',
    'concat:build',
    'umd:build', 
    'usebanner:build', 
    'uglify:build', 
    'usebanner:post'
  ]);
  grunt.registerTask('rc_debug', [
    'concat:rc_debug'
  ]);
  grunt.registerTask('rc', [
    'copy:rc',
    'strip_code:rc',
    'uglify:rc',
    // 'concat:rc_bundle'
    // 'usebanner:rc'
  ]);
  grunt.registerTask('lap_all', ['debug', 'build']);
  grunt.registerTask('rc_all', ['rc_debug', 'rc']);
  grunt.registerTask('all', ['lap_all', 'rc_all']);
};