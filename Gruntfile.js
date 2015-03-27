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
      }
    },

    cssbeautifier : {
      files: ['demo/style.css'],
      options: {
        indent: '  '
      }
    },

    jade: {
      demo: {
        options: {
          pretty: true,
          timestamp: '<%= grunt.template.today("yyyy-mm-dd") %> <%= new Date().getTime() %>'
        },
        files: {
          'demo/index.html': ['demo/index.jade']
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
        src: dist_lap
      },
      raw: {
        src: 'dist/lap-raw.js'
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
        tasks: ['debug']
      },
      demo: {
        files: 'demo/sass/*.scss',
        tasks: ['sass:demo', 'autoprefixer:demo', 'cssbeautifier']
      },
      demoJade: {
        files: 'demo/*.jade',
        tasks: ['jade']
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
};