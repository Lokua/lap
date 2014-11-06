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

    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      debug: {
        tasks: ['connect', 'watch:debug', 'watch:cssDemo', 'watch:cssDemoJade']
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
      controls: {
        options: {
          style: 'expanded',
          cacheLocation: src_rc + '.sass-cache',
          noCache: true,
          sourcemap: 'none'
        },
        files: {
          'src/controls/raphael-controls/style.css':'src/controls/raphael-controls/sass/style.scss'
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
        src: dist_lap,
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
      }
    },

    watch: {
      debug: {
        files: src_lap,
        tasks: ['debug'/*, 'build'*/]
      },
      rc: {
        files: [
          'src/*.js', 
          src_rc + '*.js', 
          src_rc + 'components/*'
        ], 
        tasks: ['rc_all']
      },
      controls: {
        files: src_rc + 'sass/*.scss',
        tasks: ['sass:controls']
      },
      cssDemo: {
        files: 'demo/css-controls/sass/*.scss',
        tasks: ['sass:cssDemo']
      },
      cssDemoJade: {
        files: 'demo/css-controls/jade/*.jade',
        tasks: ['jade']
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
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-line-remover');
  grunt.loadNpmTasks('grunt-remove');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-strip-code');
  grunt.loadNpmTasks('grunt-umd');

  grunt.registerTask('default', ['build']);
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
    'concat:rc_debug'
  ]);
  grunt.registerTask('rc', [
    'copy:rc',
    'strip_code:rc',
    'uglify:rc'
  ]);
  grunt.registerTask('lap_all', ['debug', 'build']);
  grunt.registerTask('rc_all', ['rc_debug', 'rc']);
  grunt.registerTask('all', ['lap_all', 'rc_all']);
};