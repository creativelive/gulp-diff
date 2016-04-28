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

        var flag = flagParts();
        var formatLine = lineFormatter(opts);
        console.log(file.diff
          .map(flag)
          .map(formatLine).join('')
        );
      }
      if (opts.fail) {
        this.emit('error', pluginError('Files differ'));
      }
    }
    return cb(null, file);
  });
};

function flagParts() {
  var previous = null;

  function changed(part) {
    return part.removed || part.added;
  }

  return function(part) {
    if (changed(part) && previous !== null && !changed(previous))
      previous.before = true;

    if (!changed(part) && previous !== null && changed(previous))
      part.after = true;

    previous = part;
    return part;
  };
}

function trimPart(part, compact) {
  var lines = part.value.split('\n');
  var res = [];
  if (!compact) return lines;

  if (part.added || part.removed)
    return lines;

  if (part.before && part.after && lines < 10)
    return lines;

  if (part.after)
    res = res.concat(lines.slice(0, 5)).concat(['...']);

  if (part.before)
    res = res.concat(['...']).concat(lines.slice(-5));

  return res;
}

function lineFormatter(opts) {
  return function formatLine(part, i) {
    var indent = '    ';
    return (!i ? indent : '') + trimPart(part, opts.compact)
      .map(function(ln) {
        return clc[colorLine(part)](ln);
      }).join('\n' + indent);
  };
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
