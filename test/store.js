'use strict';

require('mocha');
require('should');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var store = require('base-store');
var support = require('./support');
var update = support.resolve();
var app;

describe('store', function () {
  beforeEach(function () {
    app = update();
    app.use(store('update-tests'));
  });

  afterEach(function () {
    app.store.data = {};
    app.store.del({force: true});
  });

  it('should create a store with the given `name`', function () {
    app.use(store('foo-bar-baz'));
    assert(app.store.name === 'foo-bar-baz');
  });

  it('should create a store at the given `cwd`', function () {
    var cwd = path.resolve(__dirname, 'actual');
    app.use(store('abc', {cwd: cwd}));
    app.store.set('foo', 'bar');
    path.basename(app.store.path).should.equal('abc.json');
    app.store.data.should.have.property('foo', 'bar');
    assert.equal(fs.existsSync(path.join(cwd, 'abc.json')), true);
  });

  it('should create a store using the given `indent` value', function () {
    var cwd = path.resolve(__dirname, 'actual');
    app.use(store('abc', {cwd: cwd, indent: 0}));
    app.store.set('foo', 'bar');
    var contents = fs.readFileSync(path.resolve(cwd, 'abc.json'), 'utf8');
    assert.equal(contents, '{"foo":"bar"}');
  });

  it('should `.set()` a value on the store', function () {
    app.store.set('one', 'two');
    app.store.data.one.should.equal('two');
  });

  it('should `.set()` an object', function () {
    app.store.set({four: 'five', six: 'seven'});
    app.store.data.four.should.equal('five');
    app.store.data.six.should.equal('seven');
  });

  it('should `.set()` a nested value', function () {
    app.store.set('a.b.c.d', {e: 'f'});
    app.store.data.a.b.c.d.e.should.equal('f');
  });

  it('should `.union()` a value on the store', function () {
    app.store.union('one', 'two');
    app.store.data.one.should.eql(['two']);
  });

  it('should not union duplicate values', function () {
    app.store.union('one', 'two');
    app.store.data.one.should.eql(['two']);

    app.store.union('one', ['two']);
    app.store.data.one.should.eql(['two']);
  });

  it('should concat an existing array:', function () {
    app.store.union('one', 'a');
    app.store.data.one.should.eql(['a']);

    app.store.union('one', ['b']);
    app.store.data.one.should.eql(['a', 'b']);

    app.store.union('one', ['c', 'd']);
    app.store.data.one.should.eql(['a', 'b', 'c', 'd']);
  });

  it('should return true if a key `.has()` on the store', function () {
    app.store.set('foo', 'bar');
    app.store.set('baz', null);
    app.store.set('qux', undefined);

    app.store.has('foo').should.eql(true);
    app.store.has('bar').should.eql(false);
    app.store.has('baz').should.eql(false);
    app.store.has('qux').should.eql(false);
  });

  it('should return true if a nested key `.has()` on the store', function () {
    app.store.set('a.b.c.d', {x: 'zzz'});
    app.store.set('a.b.c.e', {f: null});
    app.store.set('a.b.g.j', {k: undefined});

    app.store.has('a.b.bar').should.eql(false);
    app.store.has('a.b.c.d').should.eql(true);
    app.store.has('a.b.c.d.x').should.eql(true);
    app.store.has('a.b.c.d.z').should.eql(false);
    app.store.has('a.b.c.e').should.eql(true);
    app.store.has('a.b.c.e.f').should.eql(false);
    app.store.has('a.b.c.e.z').should.eql(false);
    app.store.has('a.b.g.j').should.eql(true);
    app.store.has('a.b.g.j.k').should.eql(false);
    app.store.has('a.b.g.j.z').should.eql(false);
  });

   it('should return true if a key exists `.hasOwn()` on the store', function () {
    app.store.set('foo', 'bar');
    app.store.set('baz', null);
    app.store.set('qux', undefined);

    app.store.hasOwn('foo').should.eql(true);
    app.store.hasOwn('bar').should.eql(false);
    app.store.hasOwn('baz').should.eql(true);
    app.store.hasOwn('qux').should.eql(true);
  });

  it('should return true if a nested key exists `.hasOwn()` on the store', function () {
    app.store.set('a.b.c.d', {x: 'zzz'});
    app.store.set('a.b.c.e', {f: null});
    app.store.set('a.b.g.j', {k: undefined});

    app.store.hasOwn('a.b.bar').should.eql(false);
    app.store.hasOwn('a.b.c.d').should.eql(true);
    app.store.hasOwn('a.b.c.d.x').should.eql(true);
    app.store.hasOwn('a.b.c.d.z').should.eql(false);
    app.store.has('a.b.c.e.f').should.eql(false);
    app.store.hasOwn('a.b.c.e.f').should.eql(true);
    app.store.hasOwn('a.b.c.e.bar').should.eql(false);
    app.store.has('a.b.g.j.k').should.eql(false);
    app.store.hasOwn('a.b.g.j.k').should.eql(true);
    app.store.hasOwn('a.b.g.j.foo').should.eql(false);
  });

  it('should `.get()` a stored value', function () {
    app.store.set('three', 'four');
    app.store.get('three').should.equal('four');
  });

  it('should `.get()` a nested value', function () {
    app.store.set({a: {b: {c: 'd'}}});
    app.store.get('a.b.c').should.equal('d');
  });

  it('should `.del()` a stored value', function () {
    app.store.set('a', 'b');
    app.store.set('c', 'd');
    app.store.data.should.have.property('a');
    app.store.data.should.have.property('c');

    app.store.del('a');
    app.store.del('c');
    app.store.data.should.not.have.property('a');
    app.store.data.should.not.have.property('c');
  });

  it('should `.del()` multiple stored values', function () {
    app.store.set('a', 'b');
    app.store.set('c', 'd');
    app.store.set('e', 'f');
    app.store.del(['a', 'c', 'e']);
    app.store.data.should.eql({});
  });
});

describe('events', function () {
  beforeEach(function () {
    app.use(store('abc'));
  });

  afterEach(function () {
    app.store.data = {};
    app.store.del({force: true});
  });

  it('should emit `set` when an object is set:', function () {
    var keys = [];
    app.store.on('set', function (key) {
      keys.push(key);
    });

    app.store.set({a: {b: {c: 'd'}}});
    keys.should.eql(['a']);
  });

  it('should emit `set` when a key/value pair is set:', function () {
    var keys = [];

    app.store.on('set', function (key) {
      keys.push(key);
    });

    app.store.set('a', 'b');
    keys.should.eql(['a']);
  });

  it('should emit `set` when an object value is set:', function () {
    var keys = [];

    app.store.on('set', function (key) {
      keys.push(key);
    });

    app.store.set('a', {b: 'c'});
    keys.should.eql(['a']);
  });

  it('should emit `set` when an array of objects is passed:', function (cb) {
    var keys = [];

    app.store.on('set', function (key) {
      keys.push(key);
    });

    app.store.set([{a: 'b'}, {c: 'd'}]);
    keys.should.eql(['a', 'c']);
    cb();
  });

  it('should emit `has`:', function (cb) {
    var keys = [];

    app.store.on('has', function (val) {
      assert(val);
      cb();
    });

    app.store.set('a', 'b');
    app.store.has('a');
  });

  it('should emit `del` when a value is delted:', function (cb) {
    app.store.on('del', function (keys) {
      keys.should.eql('a');
      assert(typeof app.store.get('a') === 'undefined');
      cb();
    });

    app.store.set('a', {b: 'c'});
    app.store.get('a').should.eql({b: 'c'});
    app.store.del('a');
  });

  it('should emit deleted keys on `del`:', function (cb) {
    var arr = [];

    app.store.on('del', function (key) {
      arr.push(key);
      assert(Object.keys(app.store.data).length === 0);
    });

    app.store.set('a', 'b');
    app.store.set('c', 'd');
    app.store.set('e', 'f');

    app.store.del({force: true});
    arr.should.eql(['a', 'c', 'e']);
    cb();
  });

  it('should throw an error if force is not passed', function () {
    app.store.set('a', 'b');
    app.store.set('c', 'd');
    app.store.set('e', 'f');

    (function () {
      app.store.del();
    }).should.throw('options.force is required to delete the entire cache.');
  });
});
