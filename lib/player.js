"use strict";

var p = require('path');
var spawn = require('child_process').spawn;
var stream, output;

function spawnFaad(infile) {
  // infile = p.join('/mnt/sda1/', infile);
  return spawn('faad', ['-q', '-w', '-f', '2', infile], {stdio: [null, 'pipe', 'inherit']});
}

function spawnMad(infile) {
  // infile = p.join('/mnt/sda1/', infile);
  return spawn('madplay', ['--bit-depth=16', '--sample-rate=48000', '--output=raw:-', infile], {stdio: [null, 'pipe', 'inherit']});
}

function spawnAplay() {
  // return spawn('play', ['--interactive', '-c', '2', '-b', '16', '-e', 'signed-integer', '-t', 'raw', '-r', '48k', '-'], {stdio: ['pipe', 'pipe', 'inherit']});
  return spawn('aplay', ['-q', '-i', '-c', '2', '-t', 'raw', '-f', 'dat', '-'], {stdio: ['pipe', 'pipe', 'inherit']});
}

function getDecoder(infile) {
  if (infile.match(/\.mp3$/)) return 'mp3';
  if (infile.match(/\.m4a$/)) return 'aac';
  if (infile.match(/\.aac$/)) return 'aac';
}

module.exports.pause = function(stream) {
  try {
    stream.kill('SIGSTOP');
  } catch (x) {
    console.log('paused');
  }
};

module.exports.resume = function(stream) {
  try {
    stream.kill('SIGCONT');
  } catch (x) {
    console.log('resumed');
  }
};

module.exports.stop = function(stream) {
  try {
    stream.kill('SIGINT');
  } catch (x) {
    console.log('stopped')
  }
};

module.exports.play = function(opts, callback) {
  if (!opts)
    return;

  opts.decoder = opts.decoder || getDecoder(opts.file);

  if (opts.decoder === 'aac')
    output = spawnFaad(opts.file);
  else if (opts.decoder === 'mp3')
    output = spawnMad(opts.file);

  if (!output)
    return;

  stream = spawnAplay();
  output.stdout.pipe(stream.stdin);
  stream.on('close', callback);
  stream.stdin.on('error', function(err) {
    console.log('stream err',err);
  });
  stream.on('error', function(err) {
    console.log('aplay err', err);
  });
  return stream;
};
