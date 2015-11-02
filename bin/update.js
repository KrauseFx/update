#!/usr/bin/env node

var path = require('path');
var multi = require('../lib/multi')();
var utils = require('../lib/utils');
var argv = require('minimist')(process.argv.slice(2), {
  alias: {verbose: 'v'}
});

var cmd = utils.commands(argv);
var cli = multi(argv);

var task = cmd.list ? ['list', 'default'] : 'default';

cli.on('*', function (method, key, val) {
  console.log(method + ':', key, val);
});

if (argv.verbose) {
  cli.on('register', function(key) {
    utils.ok(utils.gray('registered'), 'updater', utils.cyan(key));
  });
}

cli.registerEach('update-*', {cwd: utils.gm});

cli.base.task('run', function (cb) {
  cli.run(cb);
});

cli.base.build(task, function (err) {
  if (err) console.error(err);
  utils.ok('Finished.');
});
