'use strict';

module.exports = function(grunt) {

  var raphael_source = 'src/controls/raphael-controls/';
  var dist_lap_debug = 'dist/lap-debug.js';
  var dist_lap = 'dist/lap.js';
  var src_lap = 'src/lap.js';

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
      controls: {
        src: [
          raphael_source + 'raphael-controls.js',
          raphael_source + 'components/*.js'
        ],
        dest: 'dist/controls/raphael-controls/raphael-controls.js'
      },
      bundle: {
        src: [
          '<%= concat.build.dest %>',
          '<%= concat.controls.dest %>'
        ],
        dest: 'dist/lap-bundle.js'
      },
      raphlap: {
        src: [
          'bower_components/raphael/raphael.js',
          '<%= concat.bundle.dest %>'
        ],
        dest: 'dist/lap-raphael-bundle.js'
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
        src: src_lap,
        dest: dist_lap
      },
      controls: {
        src: raphael_source + 'style.css',
        dest: 'dist/controls/raphael-controls/style.css'
      } 
    },

    lineremover: {
      strict: {
        files: {'<%= concat.bundle.dest %>': '<%= concat.bundle.dest %>'},
        options: {
          exclusionPattern: /'use strict';/g
        }
      }
    },

    remove: {
      default_options: { 
        trace: true, 
        fileList: ['./src/lap_temp.js']
      }
    },

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
          cacheLocation: raphael_source + '.sass-cache'
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

    uglify: {
      build: {
        src: dist_lap,
        dest: 'dist/lap.min.js'
      },
      raphlap: {
        src: '<%= concat.raphlap.dest %>',
        dest: 'dist/lap-raphael-bundle.min.js'
      }
    },

    strip_code: {
      options: {
        start_comment: '>>',
        end_comment: '<<'
      },
      build: {
        src: dist_lap
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
      },      
      controls: {
        src: 'dist/controls/raphael-controls/raphael-controls.js',
        objectToExport: 'Lap',
        amdModuleId: 'Lap',
      },
      bundle: {
        src: '<%= concat.bundle.dest %>',
        objectToExport: 'Lap',
        amdModuleId: 'Lap'
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
      post: {
        files: {
          src: ['dist/lap.min.js']
        }
      },
      raphlap: {
        files: {
          src: ['<%= uglify.raphlap.dest %>']
        }
      }
    },

    watch: {
      build: {
        files: src_lap,
        tasks: ['build']
      },
      debug: {
        files: src_lap,
        tasks: ['debug', 'build']
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
        files: raphael_source + 'sass/*.scss',
        tasks: ['sass:controls']
      },
      lap: { 
        files: [
          'src/*.js', 
          raphael_source + '*.js', 
          raphael_source + 'components/*'
        ], 
        tasks: ['bundle']
      },
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
  grunt.registerTask('raphlap', [
    'concat:raphlap',
    'uglify:raphlap',
    'usebanner:raphlap',
    'copy:controls'
  ]);
  grunt.registerTask('bundle', [
    'concat:build', 
    'concat:controls', 
    'concat:bundle',
    'umd:bundle',
    'lineremover:strict',
    'raphlap'
  ]);
};