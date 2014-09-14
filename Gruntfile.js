'use strict';

module.exports = function(grunt) {

  var dev = false;
  var lap_src = (dev) ? 'src/lap_dev.js' : 'src/lap.js';
  var raphael_source = 'src/controls/raphael-controls/';

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: '\n\n'
      },
      build: {
        src: [
          'node_modules/tooly/dist/tooly-raw.js',
          lap_src
        ],
        dest: 'dist/lap.js'
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

    connect: { main: { options: { port: 9140, keepalive: true } } },

    lineremover: {
      strict: {
        files: {'<%= concat.bundle.dest %>': '<%= concat.bundle.dest %>'},
        options: {
          exclusionPattern: /'use strict';/g
        }
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
      },
      raphlap: {
        src: '<%= concat.raphlap.dest %>',
        dest: 'dist/lap-raphael-bundle.min.js'
      }
    },

    umd: {
      build: {
        src: 'dist/lap.js',
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
          src: ['dist/lap.js']
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
      // build: {
      //   files: 'src/*',
      //   tasks: ['build']
      // },
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
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-line-remover');
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
  grunt.registerTask('raphlap', [
    'concat:raphlap',
    'uglify:raphlap',
    'usebanner:raphlap'
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