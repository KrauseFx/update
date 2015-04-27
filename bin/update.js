#!/usr/bin/env node

var path = require('path');
var chalk = require('chalk');
var prettyTime = require('pretty-hrtime');
var completion = require('../lib/utils/completion');
var taskTree = require('../lib/utils/task-tree');
var update = require('..');

var argv = require('minimist')(process.argv.slice(2));

var stack = argv._;
var name = stack.shift();
var tasks = stack.length ? stack : ['default'];

var updater = typeof name !== 'undefined'
  ? update.updater(name)
  : exit(0);

var fp = updater.module;

if (fp) {
  var cwd = path.dirname(fp);
  var instance = require(fp);

  instance.set('updater.cwd', cwd);
  instance.set('updater.templates', cwd + '/templates');
  instance.emit('init');
  instance.emit('loaded');
  instance.extend('argv', argv);

  process.nextTick(function () {
    instance.start.apply(instance, tasks);
  }.bind(instance));
}

// exit with 0 or 1
var failed = false;
process.once('exit', function(code) {
  if (code === 0 && failed) {
    exit(1);
  }
});

update.on('last', function () {
  var args;
  if (argv.set) {
    args = argv.set.split('=');
    update.store.set.apply(update.store, args);
  }

  if (argv.has) {
    args = argv.has.split('=');
    update.store.has.apply(update.store, args);
  }

  if (argv.omit) {
    args = argv.omit.split('=');
    update.store.omit.apply(update.store, args);
  }

  if (argv.del) {
    update.store.delete({force: true});
  }
});

update.on('err', function () {
  failed = true;
});

update.on('task_start', function (e) {
  console.log('starting', '\'' + chalk.cyan(e.task) + '\'');
});

update.on('task_stop', function (e) {
  var time = prettyTime(e.hrDuration);
  console.log('finished', '\'' + chalk.cyan(e.task) + '\'', 'after', chalk.magenta(time));
});

update.on('task_err', function (e) {
  var msg = formatError(e);
  var time = prettyTime(e.hrDuration);
  console.log(chalk.cyan(e.task), chalk.red('errored after'), chalk.magenta(time));
  console.log(msg);
});

update.on('task_not_found', function (err) {
  console.log(chalk.red('task \'' + err.task + '\' is not in your updatefile'));
  console.log('please check the documentation for proper updatefile formatting');
  exit(1);
});

function logTasks(env, instance) {
  var tree = taskTree(instance.tasks);
  tree.label = 'Tasks for ' + tildify(instance.module);
  archy(tree).split('\n').forEach(function (v) {
    if (v.trim().length === 0) {
      return;
    }
    console.log(v);
  });
}

// format orchestrator errors
function formatError(e) {
  if (!e.err) {
    return e.message;
  }

  // PluginError
  if (typeof e.err.showStack === 'boolean') {
    return e.err.toString();
  }

  // normal error
  if (e.err.stack) {
    return e.err.stack;
  }

  // unknown (string, number, etc.)
  return new Error(String(e.err)).stack;
}


// fix stdout truncation on windows
function exit(code) {
  if (process.platform === 'win32' && process.stdout.bufferSize) {
    process.stdout.once('drain', function() {
      process.exit(code);
    });
    return;
  }
  process.exit(code);
}

if (!argv._.length) {
  update.emit('loaded');
}
