var pipsqueak = require('..').synchronousApi;
var assert = require('assert');

describe('Synchronous API', function() {

  var p;
  var executions = 0;
  var task = function() {
    return ++executions;
  };

  afterEach(function(done) {
    executions = 0;
    p.on('stopped', function() {
      done();
    }).on('timeout', function() {
      done();
    }).stop();
  });

  it('should pass context to the task', function(done) {
    var contexts = [];
    var task = function(ctx) {
      contexts.push(ctx);
    };
    p = pipsqueak({ name: 'awesome', task: task, interval: '100ms', }).start();

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
    p = pipsqueak({ task: task, interval: '100ms', }).start();
    setTimeout(function() {
      assert.equal(executions, 3);
      done();
    }, 250);
  });

  it('should start the task after the specified delay', function(done) {
    p = pipsqueak({ task: task, interval: '100ms', delay: '100ms', }).start();
    setTimeout(function() {
      assert.equal(executions, 2);
      done();
    }, 250);
  });

  it('should support object durations', function(done) {
    p = pipsqueak({ task: task, interval: { min: 100, max: 100, }, delay: { min: 100, max: 100, },}).start();
    setTimeout(function() {
      assert.equal(executions, 2);
      done();
    }, 250);
  });

  it('should ignore disabled tasks', function(done) {
    p = pipsqueak({ task: task, disabled: true, interval: '100ms', }).start();
    setTimeout(function() {
      assert.equal(executions, 0);
      done();
    }, 250);
  });

  it('should emit begin and end events', function(done) {
    var events = [];
    var handler = function(event) {
      events.push(event);
    };
    p = pipsqueak({ name: 'awesome', task: task, interval: '100ms', })
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
    var boom = function() {
      throw new Error('You have idea face!');
    };
    var events = [];
    var handler = function(event) {
      events.push(event);
    };

    p = pipsqueak({ name: 'awesome', task: boom, interval: '100ms', })
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
    p = pipsqueak({ task: task, interval: '100ms', delay: '50ms', });
    p.once('stopped', function() {
      assert.equal(executions, 1);
      done();
    })
    .start();
    setTimeout(p.stop, 100);
  });

  it('should start a hamster horde', function(done) {
    p = pipsqueak([
      { task: task, interval: '100ms', },
      { task: task, interval: '50ms', },
    ]).start();
    setTimeout(function() {
      assert.equal(executions, 8);
      done();
    }, 250);
  });

  it('should poke a hamster horde', function(done) {
    p = pipsqueak([
      { task: task, interval: '100ms', },
      { task: task, interval: '50ms', },
    ]).poke();
    setTimeout(function() {
      assert.equal(executions, 2);
      done();
    }, 250);
  });

  it('should poke a subset of a hamster horde', function(done) {
    p = pipsqueak([
      { name: 'rod', task: task, interval: '50ms', },
      { name: 'jane', task: task, interval: '50ms', },
      { name: 'freddy', task: task, interval: '50ms', },
    ]).poke(['rod', 'jane',]);
    setTimeout(function() {
      assert.equal(executions, 2);
      done();
    }, 250);
  });

  it('should poke a single hamster in a hamster horde', function(done) {
    p = pipsqueak([
      { name: 'rod', task: task, interval: '50ms', },
      { name: 'jane', task: task, interval: '50ms', },
      { name: 'freddy', task: task, interval: '50ms', },
    ]).poke('rod');
    setTimeout(function() {
      assert.equal(executions, 1);
      done();
    }, 250);
  });

  it('should resume existing schedule after being poked', function(done) {
    p = pipsqueak([
      { name: 'rod', task: task, interval: '100ms', },
      { name: 'jane', task: task, interval: '100ms', },
      { name: 'freddy', task: task, interval: '100ms', },
    ]).start();
    setTimeout(function() {
      assert.equal(executions, 3);
      p.poke('rod');
      setTimeout(function() {
        assert.equal(executions, 4);
        setTimeout(function() {
          assert.equal(executions, 6);
          done();
        }, 50);
      }, 25);
    }, 50);
  });

  it('should not poke disabled tasks', function(done) {
    p = pipsqueak([
      { task: task, interval: '50ms', disabled: true, },
    ]).poke();
    setTimeout(function() {
      assert.equal(executions, 0);
      done();
    }, 100);
  });

  it('should poke disabled tasks with force parameter', function(done) {
    p = pipsqueak([
      { task: task, interval: '50ms', disabled: true, },
    ]).poke(true);
    setTimeout(function() {
      assert.equal(executions, 1);
      done();
    }, 100);
  });

  it('should not poke stopped tasks', function(done) {
    p = pipsqueak([
      { task: task, interval: '50ms', },
    ]);
    p.stop();
    p.poke();
    setTimeout(function() {
      assert.equal(executions, 0);
      done();
    }, 100);
  });

});
