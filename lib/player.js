"use strict";

var p = require('path');
var spawn = require('child_process').spawn

function spawnFaad(infile) {
  infile = p.join('/home/dbond/', infile);
  return spawn('faad', ['-w', '-f', '2', infile], {stdio: [null, 'pipe', 'inherit']});
}

function spawnMad(infile) {
  infile = p.join('/home/dbond/', infile);
  return spawn('madplay', ['--output=raw:-', infile], {stdio: [null, 'pipe', 'inherit']});
}

function getDecoder(infile) {
  if (infile.match(/\.mp3$/)) return 'mp3';
  if (infile.match(/\.m4a$/)) return 'aac';
  if (infile.match(/\.aac$/)) return 'aac';
}


module.exports.play = function(opts) {
  if (!opts)
    return;

  opts.decoder = opts.decoder || getDecoder(opts.file);

  var output;
  if (opts.decoder === 'aac')
    output = spawnFaad(opts.file);
  else if (opts.decoder === 'mp3')
    output = spawnMad(opts.file);

  if (!output)
    return;

  var play = spawn('aplay', ['-i', '-c', '2', '-t', 'raw', '-f', 'dat', '-'], {stdio: ['pipe', 'pipe', 'inherit']});
  output.stdout.pipe(play.stdin);
};
