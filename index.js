"use strict";

// Import the interface to Tessel hardware
var fs = require('fs');
var p = require('path');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var reader = require('./lib/reader.js');
var player = require('./lib/player.js');

var list = [];
var busy = false;
var playing = false;
var track;

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

function play(path) {
  playing = true;

  player.play({
    file: path
  }, function() {
    // Done playing
    playing = false;
    io.emit('status', 'stopped')
  });
}

io.on('connection', function(socket) {
  socket.on('play', function(path) {
    play(path);
    console.log('emitting status')
    io.emit('status', 'playing')
  });
});

app.get('/play', function(req, res) {
  if (playing)
    player.stop();

  if (!req.query) return;

  track = req.query.p;
  play(track);

  res.send({
    "status": "playing"
  });
});

app.get('/stop', function(req, res) {
  player.stop();
  res.send({
    "status": "stopped"
  });
});

app.get('/dir', function(req, res) {
  list = [];
  var path = req.query.d ? req.query.d : '/';
  // path = p.join('/Users/dbond/', path);
  console.log('reading dir', path);

  if (!busy) {
    busy = true;
    reader.readdir(path, function(err, files) {
      if (err)
        console.log(err);

      list = files;
      busy = false;
    });
  }

  res.send({
    status: 'reading'
  });
});

app.get('/tracks', function(req, res) {
  list = [];
  if (!busy)
    fs.stat('/mnt/sda1/.tessel-db', function(err) {
      console.log('reading files')
      if (err) {
        reader.readfiles('/mnt/sda1', function(err, tracks) {
          list = tracks;
          busy = false;
        })
      } else {
        fs.readFile('/mnt/sda1/.tessel-db', function(err, data) {
          list = data;
          busy = false;
        });
      }
    });

  res.send({
    status: 'reading'
  });
});

app.get('/playing', function(req, res) {
  res.send({
    'is_playing': playing,
    'track': track
  });
});

app.get('/status', function(req, res) {
  res.send({
    'status': busy ? 'busy' : 'ok'
  })
});

http.listen(8080, function() {
  console.log("Server listening on port 8080");
});
