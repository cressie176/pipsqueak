var pipsqueak = require('..').callbackApi;
var assert = require('node:assert');
var { describe, it, before, after, afterEach } = require('node:test');

describe('Callback API', () => {
  // pipsqueak unrefs all of its timers, so a stop that is waiting for a
  // running task to finish only completes if something else keeps the event
  // loop alive. Mocha's per-test timeout timer used to do that implicitly.
  // See https://github.com/cressie176/pipsqueak/issues/30
  var keepAlive;
  before(() => {
    keepAlive = setInterval(() => {}, 1000);
  });
  after(() => {
    clearInterval(keepAlive);
  });

  var p;
  var executions = 0;
  var task = (_ctx, cb) => {
    cb(null, ++executions);
  };
  var boom = (_ctx, cb) => {
    setImmediate(() => {
      cb(new Error('You have idea face!'));
    });
  };
  var slow = (_ctx, cb) => {
    executions++;
    setTimeout(cb, 300);
  };

  afterEach((_t, done) => {
    executions = 0;
    if (p) {
      p.stop((err) => {
        if (err) return done(err);
        done();
      });
    } else {
      done();
    }
  });

  it('should pass context to the task', (_t, done) => {
    var contexts = [];
    var task = (ctx, cb) => {
      contexts.push(ctx);
      cb();
    };
    p = pipsqueak({ name: 'awesome', task: task, interval: '100ms' }).start();

    setTimeout(() => {
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

  it('should run the task at the specified interval', (_t, done) => {
    p = pipsqueak({ task: task, interval: '100ms' }).start();
    setTimeout(() => {
      assert.equal(executions, 3);
      done();
    }, 250);
  });

  it('should start the task after the specified delay', (_t, done) => {
    p = pipsqueak({ task: task, interval: '100ms', delay: '100ms' }).start();
    setTimeout(() => {
      assert.equal(executions, 2);
      done();
    }, 250);
  });

  it('should support object durations', (_t, done) => {
    p = pipsqueak({
      task: task,
      interval: { min: 100, max: 100 },
      delay: { min: 100, max: 100 },
    }).start();
    setTimeout(() => {
      assert.equal(executions, 2);
      done();
    }, 250);
  });

  it('should ignore disabled tasks', (_t, done) => {
    p = pipsqueak({ task: task, disabled: true, interval: '100ms' }).start();
    setTimeout(() => {
      assert.equal(executions, 0);
      done();
    }, 250);
  });

  it('should emit begin and end events', (_t, done) => {
    var events = [];
    var handler = (event) => {
      events.push(event);
    };
    p = pipsqueak({ name: 'awesome', task: task, interval: '100ms' })
      .on('begin', handler)
      .on('error', handler)
      .on('end', handler)
      .start();

    setTimeout(() => {
      assert.equal(events.length, 6);
      assert.equal(events[0].name, 'awesome');
      assert.equal(events[1].name, 'awesome');
      assert.equal(events[0].iteration, 0);
      assert.equal(events[1].iteration, 0);
      assert.equal(events[1].result[0], 1);
      assert.equal(events[0].run, events[1].run);

      assert.equal(events[2].name, 'awesome');
      assert.equal(events[3].name, 'awesome');
      assert.equal(events[2].iteration, 1);
      assert.equal(events[3].iteration, 1);
      assert.equal(events[3].result[0], 2);
      assert.equal(events[2].run, events[3].run);

      assert.notEqual(events[0].run, events[2].run);

      done();
    }, 250);
  });

  it('should emit error events', (_t, done) => {
    var events = [];
    var handler = (event) => {
      events.push(event);
    };

    p = pipsqueak({ name: 'awesome', task: boom, interval: '100ms' })
      .on('begin', handler)
      .on('error', handler)
      .on('end', handler)
      .start();

    setTimeout(() => {
      assert.equal(events.length, 9);
      assert.equal(events[0].name, 'awesome');
      assert.equal(events[0].iteration, 0);

      assert.equal(events[0].run, events[1].run);
      assert.equal(events[1].run, events[2].run);

      assert.equal(events[1].error.message, 'You have idea face!');
      done();
    }, 250);
  });

  it('should stop', (_t, done) => {
    p = pipsqueak({ task: task, interval: '100ms', delay: '50ms' }).start();
    setTimeout(() => {
      p.stop((err) => {
        p = null;
        done(err);
      });
    }, 100);
  });

  it('should wait for tasks to stop', (_t, done) => {
    p = pipsqueak({ task: slow, interval: '100ms' }).start();
    setTimeout(() => {
      p.stop((err) => {
        assert.equal(executions, 1);
        p = null;
        done(err);
      });
    });
  });

  it('should wait for every hamster in a horde to stop', (_t, done) => {
    var finished = false;
    var slower = (_ctx, cb) => {
      setTimeout(() => {
        finished = true;
        cb();
      }, 250);
    };
    p = pipsqueak([
      { name: 'idle', task: task, interval: '1s', delay: '1s' },
      { name: 'busy', task: slower, interval: '1s' },
    ]).start();
    setTimeout(() => {
      p.stop((err) => {
        assert.ok(finished, 'stopped before the busy hamster finished');
        p = null;
        done(err);
      });
    }, 50);
  });

  it('should timeout waiting for tasks to stop', (_t, done) => {
    p = pipsqueak({
      name: 'awesome',
      task: slow,
      interval: '100ms',
      timeout: '200ms',
    }).start();
    setTimeout(() => {
      p.stop((err) => {
        assert.equal(
          err.message,
          'Timedout while waiting for awesome task to stop',
        );
        assert.equal(executions, 1);
        p = null;
        done();
      });
    });
  });

  it('should start a hamster horde', (_t, done) => {
    p = pipsqueak([
      { task: task, interval: '100ms' },
      { task: task, interval: '50ms' },
    ]).start();
    setTimeout(() => {
      assert.equal(executions, 8);
      done();
    }, 250);
  });

  it('should poke a hamster horde', (_t, done) => {
    p = pipsqueak([
      { task: task, interval: '100ms' },
      { task: task, interval: '50ms' },
    ]).poke();
    setTimeout(() => {
      assert.equal(executions, 2);
      done();
    }, 250);
  });

  it('should poke a subset of a hamster horde', (_t, done) => {
    p = pipsqueak([
      { name: 'rod', task: task, interval: '50ms' },
      { name: 'jane', task: task, interval: '50ms' },
      { name: 'freddy', task: task, interval: '50ms' },
    ]).poke(['rod', 'jane']);
    setTimeout(() => {
      assert.equal(executions, 2);
      done();
    }, 250);
  });

  it('should poke a single hamster in a hamster horde', (_t, done) => {
    p = pipsqueak([
      { name: 'rod', task: task, interval: '50ms' },
      { name: 'jane', task: task, interval: '50ms' },
      { name: 'freddy', task: task, interval: '50ms' },
    ]).poke('rod');
    setTimeout(() => {
      assert.equal(executions, 1);
      done();
    }, 250);
  });

  it('should resume existing schedule after being poked', (_t, done) => {
    p = pipsqueak([
      { name: 'rod', task: task, interval: '100ms' },
      { name: 'jane', task: task, interval: '100ms' },
      { name: 'freddy', task: task, interval: '100ms' },
    ]).start();
    setTimeout(() => {
      assert.equal(executions, 3);
      p.poke('rod');
      setTimeout(() => {
        assert.equal(executions, 4);
        setTimeout(() => {
          assert.equal(executions, 6);
          done();
        }, 50);
      }, 25);
    }, 50);
  });

  it('should not poke disabled tasks', (_t, done) => {
    p = pipsqueak([{ task: task, interval: '50ms', disabled: true }]).poke();
    setTimeout(() => {
      assert.equal(executions, 0);
      done();
    }, 100);
  });

  it('should poke disabled tasks with force parameter', (_t, done) => {
    p = pipsqueak([{ task: task, interval: '50ms', disabled: true }]).poke(
      true,
    );
    setTimeout(() => {
      assert.equal(executions, 1);
      done();
    }, 100);
  });

  it('should not poke stopped tasks', (_t, done) => {
    p = pipsqueak([{ task: task, interval: '50ms' }]);
    p.stop((err) => {
      assert.ifError(err);
      p.poke();
      setTimeout(() => {
        assert.equal(executions, 0);
        done();
      }, 100);
    });
  });

  it('should not poke running tasks', (_t, done) => {
    p = pipsqueak([{ task: slow, interval: '50ms' }])
      .start()
      .poke();
    setTimeout(() => {
      assert.equal(executions, 1);
      done();
    }, 100);
  });
});
