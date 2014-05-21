'use strict';

var through2 = require('through2');
var diffLines = require('diff').diffLines;
var clc = require('cli-color');
var fs = require('fs');
var path = require('path');

exports.diff = function diff(dest) {
  return through2.obj(function(file, enc, cb) {
    if (file.isNull()) {
      return cb(null, file);
    }
    var compareFile = path.resolve(dest || process.cwd(), file.relative);
    fs.stat(compareFile, function(err, stat) {
      if (err) {
        return cb(err);
      }
      if (stat && !stat.isDirectory()) {
        fs.readFile(compareFile, 'utf8', function(err, contents) {
          if (err) {
            cb('failed to read file: ' + err.message);
          }
          if (contents !== String(file.contents)) {
            try {
              file.diff = diffLines(fs.readFileSync(compareFile, 'utf8'), String(file.contents));

            } catch (err) {
              cb('failed to diff file: ' + err.message);
            }
          }
          return cb(null, file);
        });
      } else {
        if (!stat) {
          return cb('failed to find file: ' + compareFile);
        } else {
          return cb(null, file);
        }
      }
    });
  });
};

exports.reporter = function reporter(opts) {
  opts = opts || {};
  return through2.obj(function(file, enc, cb) {
    if (file.diff && Object.keys(file.diff).length) {
      console.log('\n' + clc.underline(file.path), '\n');
      console.log(file.diff.map(formatLine).join(''));
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
