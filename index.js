'use strict';

var through2 = require('through2');
var diffLines = require('diff').diffLines;
var clc = require('cli-color');
var fs = require('fs');
var path = require('path');
var PluginError = require('gulp-util').PluginError;

function pluginError(msg) {
  return new PluginError('gulp-diff', msg);
}

var diff = function diff(dest) {
  var stream = through2.obj(function(file, enc, cb) {
    if (file.isNull()) {
      return cb(null, file);
    }
    var compareFile = path.resolve(dest || file.base, file.relative);
    fs.stat(compareFile, function(errStat, stat) {
      if (errStat) {
        stream.emit('error', pluginError('Failed to stat file: ' + errStat.message));
        return cb();
      }
      if (stat && !stat.isDirectory()) {
        fs.readFile(compareFile, 'utf8', function(errRead, contents) {
          if (errRead) {
            stream.emit('error', pluginError('Failed to read file: ' + errRead.message));
            return cb();
          }
          if (contents !== String(file.contents)) {
            try {
              file.diff = diffLines(fs.readFileSync(compareFile, 'utf8'), String(file.contents));
            } catch (err) {
              stream.emit('error', pluginError('Failed to diff file: ' + err.message));
              return cb();
            }
          }
          return cb(null, file);
        });
      } else {
        if (!stat) {
          stream.emit('error', pluginError('Failed to find file: ' + compareFile));
          return cb();
        } else {
          return cb(null, file);
        }
      }
    });
  });
  return stream;
};

var reporter = function reporter(opts) {
  opts = opts || {};
  return through2.obj(function(file, enc, cb) {
    if (file.diff && Object.keys(file.diff).length) {
      if (!opts.quiet) {
        console.log('\n' + clc.underline(file.path), '\n');
        console.log(file.diff.map(formatLine).join(''));
      }
      if (opts.fail) {
        this.emit('error', pluginError('Files differ'));
      }
    }
    return cb(null, file);
  });
};

function formatLine(part, i) {
  var indent = '    ';
  return (!i ? indent : '') + part.value.split('\n').map(function(ln) {
    return clc[colorLine(part)](ln);
  }).join('\n' + indent);
}

function colorLine(ln) {
  if (ln.added) {
    return 'bgGreen';
  }
  if (ln.removed) {
    return 'bgRed';
  }
  return 'blackBright';
}

module.exports = diff;
module.exports.reporter = reporter;
module.exports.diff = diff;
