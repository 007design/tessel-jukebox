"use strict";

// Import the interface to Tessel hardware
var fs = require('fs');
var p = require('path');
var tessel = require('tessel');
var express = require('express');
var reader = require('./lib/reader.js');

var list = [];
var busy = false;

var app = express();
app.use(express.static(__dirname + '/src'));

app.get('/list', function(req, res) {
  res.send(list);
});

// app.get('/refresh', function(req, res) {
//   if (!busy) {
//     busy = true;
//     readdir(__dirname, function(err, data) {
//       if (err)
//         return console.log(err);

//       for (var a=0; a<data.length; a++)
//         list[a] = data[a];
//       busy = false;
//     });
//   }

//   res.send({
//     status: 'reading'
//   });
// });

app.get('/dir', function(req, res) {
  list = {};
  var path = req.query.d ? req.query.d : '/';
  console.log('reading dir', path);

  if (!busy) {
    busy = true;
    reader.readdir(path, function(err, files) {
      list = files;
      busy = false;
    });
  }

  res.send({
    status: 'reading'
  })
});

app.get('/status', function(req, res) {
  res.send({
    'status': busy ? 'busy' : 'ok'
  })
});

app.listen(8080);
console.log("Server listening on port 8000");
