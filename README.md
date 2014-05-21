# gulp-diff [![](https://travis-ci.org/creativelive/gulp-diff.png)](https://travis-ci.org/creativelive/gulp-diff)

Gulp taks to diff files in the stream against a destination.

## Usage

An example jsbeautify verification task to show diffs from js-beautify and
exit with a non-zero exit code if files need beautification.

```
/*eslint no-process-exit:0 */

'use strict';

var gulp = require('gulp');
var prettify = require('gulp-jsbeautifier');
var diff = require('./').diff;
var diffReporter = require('./').reporter;

gulp.task('js-beautify', function() {
  return gulp.src([
      '!node_modules/**/*.js',
      '**/*.js'
    ])
    .pipe(prettify({
      config: '.jsbeautifyrc',
      mode: 'VERIFY_AND_WRITE'
    }))
    .pipe(diff('.'))
    .pipe(diffReporter())
    .on('data', function(data) {
      if (data.diff && Object.keys(data.diff).length) {
        // record that there have been errors
        gulp.fail = true;
      }
    });
});

process.on('exit', function() {
  if (gulp.fail) {
    // return non-zero exit code
    process.exit(1);
  }
});

```
