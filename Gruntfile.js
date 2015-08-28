/*jshint camelcase:false*/
'use strict';

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

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
      dev: {
        src: [
          'src/lap-module-definition.js',
          'src/services/*.js',
          'src/directives/*.js',
          'src/directives/!*volume*.js'
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
          hostname: '0.0.0.0',
          port: 8000,
          keepalive: true,
          livereload: true
        }
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
        files: [{
          expand: true,
          src: 'src/templates/*.jade',
          ext: '.html'
        }]
      }
    },

    ngtemplates: {
      build: {
        options: {
          module: 'lnet.lap'
        },
        cwd: 'src/templates',
        src: '*.html',
        dest: 'src/lap-templates.js'
      }
    },

    sass: {
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
        tasks: ['jade', 'ngtemplates:build', 'wrap:templates']
      },
      angular: {
        files: ['src/services/*.js', 'src/directives/*.js', 'demo/**/*'],
        tasks: ['concat:dev']
      }
    },

    wrap: {
      templates: {
        src: 'src/lap-templates.js',
        dest: 'src/lap-templates.js',
        options: {
          wrapper: function(filepath, options) {
            return ['!function() {\n\n', '\n\n}();']
          }
        }
      }
    }
  });

  grunt.registerTask('default', ['concurrent:dev']);
  grunt.registerTask('devbuild', ['ngtemplates:build', 'wrap:templates', 'concat:dev']);
  grunt.registerTask('build', [
    'concat:dist',
    'strip_code:dist',
    'uglify:dist',
    'usebanner:dist',
    'usebanner:post'
  ]);
  grunt.registerTask('all', ['devbuild', 'build']);
};
