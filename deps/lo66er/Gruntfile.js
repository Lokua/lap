'use strict';

module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('./package.json'),

    concat: {
      options: {
        banner: '/*!\n' +
          ' * <%= pkg.name %> - version <%= pkg.version %> ' + 
          '(built: <%= grunt.template.today("yyyy-mm-dd") %>)\n' +
          ' * <%= pkg.description %>\n' + 
          ' *\n' + 
          ' * <%= pkg.repository.url %>\n' + 
          ' *\n' + 
          ' * Copyright ' + String.fromCharCode(169) + 
          ' <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
          ' * Licensed under the <%= pkg.license.type %> license.\n' +
          ' * <%= pkg.license.url %>\n' +
          ' */\n',
        process: true,
        separator: '\n\n'
      },
      dist: {
        src: ['src/lo66er.js'],
        dest: 'dist/lo66er.js'
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> v<%= pkg.version %> | ' + 
          'Copyright ' + String.fromCharCode(169) + 
          ' <%= grunt.template.today("yyyy") %> <%= pkg.author %> | ' +
          '<%= pkg.license.url %> */\n'      
      },
      dist: {
        files: {
          'dist/lo66er.min.js': ['dist/lo66er.js']
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['concat:dist', 'uglify:dist']);
};