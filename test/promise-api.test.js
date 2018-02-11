var pipsqueak = require('..').promiseApi;
var assert = require('assert');

describe('Promise API', function() {

  var p;
  var executions = 0;
  var factory = () => new Promise((resolve, reject) => {
    resolve(++executions);
  });

  afterEach(function() {
    executions = 0;
    p.stop();
  });

  it('should run the task at the specified interval', function(done) {
    p = pipsqueak({ factory: factory, interval: '100ms', }).start();
    setTimeout(function() {
      assert.equal(executions, 3);
      done();
    }, 250);
  });

  it('should start the task after the specified delay', function(done) {
    p = pipsqueak({ factory: factory, interval: '100ms', delay: '100ms', }).start();
    setTimeout(function() {
      assert.equal(executions, 2);
      done();
    }, 250);
  });

  it('should emit begin and end events', function(done) {
    var events = [];
    var handler = function(event) {
      events.push(event);
    };
    p = pipsqueak({ name: 'awesome', factory: factory, interval: '100ms', })
      .on('begin', handler)
      .on('error', handler)
      .on('end', handler)
      .start();

    setTimeout(function() {
      assert.equal(events.length, 6);
      assert.equal(events[0].name, 'awesome');
      assert.equal(events[1].name, 'awesome');

      assert.equal(events[0].run, events[1].run);
      assert.equal(events[2].run, events[3].run);
      assert.notEqual(events[0].run, events[2].run);

      assert.equal(events[1].result, 1);
      assert.equal(events[3].result, 2);
      assert.equal(events[5].result, 3);
      done();
    }, 250);
  });

  it('should emit error events', function(done) {
    var boom = () => new Promise((resolve, reject) => {
      reject(new Error('You have idea face!'));
    });
    var events = [];
    var handler = function(event) {
      events.push(event);
    };
    p = pipsqueak({ name: 'awesome', factory: boom, interval: '100ms', })
      .on('begin', handler)
      .on('error', handler)
      .on('end', handler)
      .start();

    setTimeout(function() {
      assert.equal(events.length, 9);
      assert.equal(events[0].name, 'awesome');

      assert.equal(events[0].run, events[1].run);
      assert.equal(events[1].run, events[2].run);

      assert.equal(events[1].error.message, 'You have idea face!');
      done();
    }, 250);
  });

  it('should stop', function(done) {
    p = pipsqueak({ factory: factory, interval: '100ms', delay: '100ms', }).start();
    p.stop();
    setTimeout(function() {
      assert.equal(executions, 0);
      done();
    }, 250);
  });

});
