var pipsqueak = require('..').promiseApi;
var assert = require('assert');

describe('Promise API', function() {

  var p;
  var executions = 0;
  var factory = function() {
    return new Promise(function(resolve, reject) {
      resolve(++executions);
    });
  };
  var boom = function() {
    return new Promise(function(resolve, reject) {
      reject(new Error('You have idea face!'));
    });
  };
  var slow = function() {
    return new Promise(function(resolve, reject) {
      executions++;
      setTimeout(resolve, 300);
    });
  };

  afterEach(function(done) {
    executions = 0;
    if (p) {
      p.stop().then(done).catch(done);
    } else {
      done();
    }
  });

  it('should pass context to the task', function(done) {
    var contexts = [];
    var factory = (ctx) => new Promise(function(resolve, reject) {
      contexts.push(ctx);
      resolve();
    });
    p = pipsqueak({ name: 'awesome', factory: factory, interval: '100ms', }).start();

    setTimeout(function() {
      assert.equal(contexts.length, 3);

      assert.equal(contexts[0].name, 'awesome');
      assert.equal(contexts[0].iteration, 0);
      assert.ok(contexts[0].run);

      assert.equal(contexts[1].name, 'awesome');
      assert.equal(contexts[1].iteration, 1);
      assert.ok(contexts[1].run);

      assert.notEqual(contexts[0].run, contexts[1].run);
      done();
    }, 250);
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

  it('should support object durations', function(done) {
    p = pipsqueak({ factory: factory, interval: { min: 100, max: 100, }, delay: { min: 100, max: 100, },}).start();
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
      assert.equal(events[0].iteration, 0);
      assert.equal(events[1].iteration, 0);
      assert.equal(events[1].result, 1);
      assert.equal(events[0].run, events[1].run);

      assert.equal(events[2].name, 'awesome');
      assert.equal(events[3].name, 'awesome');
      assert.equal(events[2].iteration, 1);
      assert.equal(events[3].iteration, 1);
      assert.equal(events[3].result, 2);
      assert.equal(events[2].run, events[3].run);
      done();
    }, 250);
  });

  it('should emit error events', function(done) {
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
      assert.equal(events[0].iteration, 0);

      assert.equal(events[0].run, events[1].run);
      assert.equal(events[1].run, events[2].run);

      assert.equal(events[1].error.message, 'You have idea face!');
      done();
    }, 250);
  });

  it('should stop', function(done) {
    p = pipsqueak({ factory: factory, interval: '100ms', delay: '50ms', }).start();
    setTimeout(function() {
      p.stop().then(function() {
        p = null;
        done();
      }).catch(done);
    }, 100);
  });

  it('should wait for tasks to stop', function(done) {
    p = pipsqueak({ factory: slow, interval: '100ms',}).start();
    setTimeout(function() {
      p.stop().then(function() {
        assert.equal(executions, 1);
        p = null;
        done();
      }).catch(done);
    });
  });

  it('should timeout waiting for tasks to stop', function(done) {
    p = pipsqueak({ name: 'awesome', factory: slow, interval: '100ms', timeout: '200ms', }).start();
    setTimeout(function() {
      p.stop().catch(function(err) {
        assert.equal(err.message, 'Timedout while waiting for awesome task to stop');
        assert.equal(executions, 1);
        p = null;
        done();
      });
    });
  });

  it('should run a hamster horde', function(done) {
    p = pipsqueak([
      { factory: factory, interval: '100ms', },
      { factory: factory, interval: '50ms', },
    ]).start();
    setTimeout(function() {
      assert.equal(executions, 8);
      done();
    }, 250);
  });

});
