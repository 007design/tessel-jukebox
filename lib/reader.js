"use strict";

var fs = require('fs');
var p = require('path');
var validExt = /[\.mp3]$/;

module.exports.readdir = function(path, callback) {
  var fullPath = path;//.join('/mnt/sda1', path)
  // var fullPath = p.join('/mnt/sda1', path)

  var list = []

  fs.readdir(fullPath, function(err, files) {
    if (err) {
      return callback(err)
    }

    var pending = files.length
    if (!pending) {
      return callback(null, list)
    }

    files.forEach(function(file) {
      var filePath = p.join(fullPath, file)
      fs.stat(filePath, function(_err, stats) {
        if (_err) {
          return callback(_err)
        }

        if (stats.isDirectory()) {
          list.push({
            'name': file,
            'path': p.join(path, file),
            'isDirectory': true
          });
        } else {
          // if (p.extname(filePath).match(validExt))
            list.push({
              'name': file,
              'path': p.join(path, file)
            });
        }

        pending -= 1
        if (!pending) {
          return callback(null, list)
        }
      })
    })
  })
};

function readfiles(path, callback) {
  var fullPath = p.join(__dirname, path)

  var list = []

  fs.readdir(fullPath, function(err, files) {
    if (err) {
      return callback(err)
    }

    var pending = files.length
    if (!pending) {
      return callback(null, list)
    }

    files.forEach(function(file) {
      var filePath = p.join(fullPath, file)
      fs.stat(filePath, function(_err, stats) {
        if (_err) {
          return callback(_err)
        }

        if (stats.isDirectory()) {
          list.push({
            'name': file,
            'path': p.join(path, file),
            'isDirectory': true
          });
          readfiles(filePath, function(__err, res) {
            if (__err) {
              return callback(__err)
            }

            list = list.concat(res)
            pending -= 1
            if (!pending) {
              return callback(null, list)
            }
          })
        } else {
          if (p.extname(filePath).match(validExt))
            list.push({
              'name': file,
              'path': p.join(path, file)
            });
        }

        pending -= 1
        if (!pending) {
          return callback(null, list)
        }
      })
    })
  })
}

module.exports.readfiles = readfiles;
