'use strict';

var insert = require('gulp-insert');
var diff = require('..');

var expected = [{
  value: 'HELLO\nWORLD\n',
  added: true,
  removed: undefined
}, {
  value: 'hello\n',
  added: undefined,
  removed: true
}];

module.exports = function(gulp) {

  gulp.task('test', ['diff-none', 'diff-found'], function() {});

  gulp.task('diff-found', function() {
    return gulp.src('test/src/bar.txt')
      .pipe(insert.append('world\n'))
      .pipe(insert.transform(function(contents) {
        return contents.toUpperCase();
      }))
      .pipe(diff('test/expected'))
      .on('data', function(data) {
        if (data.diff && Object.keys(data.diff).length) {
          if (data.diff.toString() === expected.toString()) {
            console.log('gulp-diff output as expected');
          } else {
            // we're testing gulp-diff itself, so
            // if it did not find a diff, that's an error
            gulp.fail = true;
            console.log('gulp-diff unexpected output');
          }
        } else {
          // we're testing gulp-diff itself, so
          // if it did not find a diff, that's an error
          gulp.fail = true;
        }
      })
      .pipe(diff.reporter());
  });

  gulp.task('diff-none', function() {
    return gulp.src('test/src/**/foo.txt')
      .pipe(insert.append('world\n'))
      .pipe(insert.transform(function(contents) {
        return contents.toUpperCase();
      }))
      .pipe(diff('test/expected'))
      .on('data', function(data) {
        if (data.diff && Object.keys(data.diff).length) {
          // record that there have been errors
          gulp.fail = true;
        }
      })
      .pipe(diff.reporter());
  });
};
