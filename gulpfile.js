var gulp = require('gulp'),
    browserify = require('gulp-browserify'),
    babelify = require('babelify'),
    vueify = require('vueify');
    less = require('gulp-less');


gulp.task("vue", function() {
  return gulp.src('src/js/*.js')
    .pipe(browserify({transform: [babelify, [{_flags: {debug: true}}, vueify]]}))
    .pipe(gulp.dest('build/js/'))
});

gulp.task("less", function() {
  return gulp.src('src/less/*.less')
    .pipe(less())
    .pipe(gulp.dest('build/css/'))
});