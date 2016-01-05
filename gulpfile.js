'use strict'

const gulp = require('gulp')
const browserify = require('browserify')
const babelify = require('babelify')
const fs = require('fs')

gulp.task('js', () => {
  browserify({
    entries: 'src/lap.js',
    debug: true,
  })
  .transform(babelify.configure({
    presets: ['es2015']
  }))
  .bundle()
  .pipe(fs.createWriteStream('dist/lap.js'))
})


gulp.task('watch', () => {
  gulp.watch('src/lap.js', ['js'])
})

gulp.task('default', ['watch'])
