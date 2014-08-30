# gulp-diff [![](https://travis-ci.org/creativelive/gulp-diff.svg)](https://travis-ci.org/creativelive/gulp-diff)

Gulp task to diff files in the stream against a destination.

## Usage

An example jsbeautify verification task to show diffs from js-beautify and
exit with a non-zero exit code if files need beautification.

```
/*eslint no-process-exit:0 */

'use strict';

var gulp = require('gulp');
var prettify = require('gulp-jsbeautifier');
var diff = require('gulp-diff').diff;
var diffReporter = require('gulp-diff').reporter;

gulp.task('js-beautify', function() {
  return gulp.src([
      '!node_modules/**/*.js',
      '**/*.js'
    ])
    .pipe(prettify({
      config: '.jsbeautifyrc',
      mode: 'VERIFY_AND_WRITE'
    }))
    .pipe(diff(/* 'target directory to diff against', defaults to diff against original source file */))
    .pipe(diffReporter({ fail: true }));
});

```
