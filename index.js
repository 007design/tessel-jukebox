"use strict";

// Import the interface to Tessel hardware
var tessel = require('tessel');
var fs = require('fs');
var p = require('path');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var reader = require('./lib/reader.js');
var player = require('./lib/player.js')();

var list = [];
var busy = false;

tessel.led[2].off();

app.use(express.static(__dirname + '/src'));

app.get('/list', function(req, res) {
  res.send(list);
});

function play(path) {
  if (player.playing)
    player.stop();

  player.play({
    file: path
  }, function() {
    // Done playing
    io.emit('status', 'stopped')
  });
}

function stop() {
  console.log('stopping');
  player.stop();
}

function pause() {
  console.log('pausing');
  player.pause();
}

function resume() {
  console.log('resuming');
  player.resume();
}

function refresh() {
  reader.readfiles('/mnt/sda1', function(err, tracks) {
    list = tracks;
    busy = false;
    tessel.led[2].off();
    fs.writeFile('/mnt/sda1/.tessel-db', JSON.stringify(tracks));
    io.emit('refresh', 'done');
  })
}

io.on('connection', function(socket) {
  socket.on('play', function(path) {
    play(path);
    console.log('emitting status')
    io.emit('status', player.playing ? 'playing' : 'stopped')
  });

  socket.on('stop', function() {
    stop();
    io.emit('status', player.playing ? 'playing' : 'stopped');
  });

  socket.on('pause', function() {
    pause();
    io.emit('status', player.playing ? 'playing' : 'paused');
  });

  socket.on('resume', function() {
    resume();
    io.emit('status', player.playing ? 'playing' : 'stopped');
  });

  socket.on('refresh', function() {
    if (!busy) {
      list = [];
      busy = true;
      tessel.led[2].on();
      refresh();
    }
    io.emit('refresh', 'reading');
  });
});

// app.get('/refresh', function(req, res) {
//   if (!busy) {
//     list = [];
//     busy = true;
//     tessel.led[2].on();
//     refresh();
//   }

//   res.send({
//     status: 'reading'
//   });
// });

// app.get('/status', function(req, res) {
//   res.send({
//     status: busy ? 'busy' : 'ok'
//   });
// });

app.get('/list', function(req, res) {
  res.send(list);
});

app.get('/dir', function(req, res) {
  var path = req.query.d ? req.query.d : '/';
  // path = p.join('/Users/dbond/', path);
  console.log('reading dir', path);

  if (!busy) {
    list = [];
    busy = true;
    tessel.led[2].on();
    reader.readdir(path, function(err, files) {
      if (err)
        console.log(err);

      list = files;
      busy = false;
      tessel.led[2].off();
      io.emit('refresh', 'done');
    });
  }

  res.send({
    status: 'reading'
  });
});

app.get('/tracks', function(req, res) {
  if (!busy) {
    list = [];
    busy = true;
    tessel.led[2].on();
    fs.stat('/mnt/sda1/.tessel-db', function(err) {
      console.log('reading files')
      if (err) {
        refresh();
      } else {
        fs.readFile('/mnt/sda1/.tessel-db', function(err, data) {
          list = data;
          busy = false;
          tessel.led[2].off();
          io.emit('refresh', 'done');
        });
      }
    });
  }

  res.send({
    status: 'reading'
  });
});

http.listen(8080, function() {
  console.log("Server listening on port 8080");
});
