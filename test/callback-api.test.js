const pipsqueak = require('..').callbackApi;
const assert = require('node:assert');
const { describe, it, afterEach } = require('node:test');
const { execFile } = require('node:child_process');

describe('Callback API', () => {
  let p;
  let executions = 0;
  const task = (_ctx, cb) => {
    cb(null, ++executions);
  };
  const boom = (_ctx, cb) => {
    setImmediate(() => {
      cb(new Error('You have idea face!'));
    });
  };
  const slow = (_ctx, cb) => {
    executions++;
    setTimeout(cb, 250);
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
    const contexts = [];
    const task = (ctx, cb) => {
      contexts.push(ctx);
      cb();
    };
    p = pipsqueak({ name: 'awesome', task, interval: '100ms' }).start();

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
    p = pipsqueak({ task, interval: '100ms' }).start();
    setTimeout(() => {
      assert.equal(executions, 3);
      done();
    }, 250);
  });

  it('should start the task after the specified delay', (_t, done) => {
    p = pipsqueak({ task, interval: '100ms', delay: '100ms' }).start();
    setTimeout(() => {
      assert.equal(executions, 2);
      done();
    }, 250);
  });

  it('should support object durations', (_t, done) => {
    p = pipsqueak({
      task,
      interval: { min: 100, max: 100 },
      delay: { min: 100, max: 100 },
    }).start();
    setTimeout(() => {
      assert.equal(executions, 2);
      done();
    }, 250);
  });

  it('should ignore disabled tasks', (_t, done) => {
    p = pipsqueak({ task, disabled: true, interval: '100ms' }).start();
    setTimeout(() => {
      assert.equal(executions, 0);
      done();
    }, 250);
  });

  it('should emit begin and end events', (_t, done) => {
    const events = [];
    const handler = (event) => {
      events.push(event);
    };
    p = pipsqueak({ name: 'awesome', task, interval: '100ms' })
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
    const events = [];
    const handler = (event) => {
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
    p = pipsqueak({ task, interval: '100ms', delay: '50ms' }).start();
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
    let finished = false;
    const slower = (_ctx, cb) => {
      setTimeout(() => {
        finished = true;
        cb();
      }, 250);
    };
    p = pipsqueak([
      { name: 'idle', task, interval: '1s', delay: '1s' },
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

  it('should settle stop without anything else keeping the process alive', (_t, done) => {
    const script = [
      `var pipsqueak = require(${JSON.stringify(require.resolve('..'))}).callbackApi;`,
      'var slow = (_ctx, cb) => setTimeout(cb, 250);',
      "var p = pipsqueak({ task: slow, interval: '100ms' }).start();",
      "setTimeout(() => p.stop(() => console.log('stopped')));",
    ].join('\n');
    execFile(process.execPath, ['-e', script], (err, stdout) => {
      if (err) return done(err);
      assert.equal(stdout.trim(), 'stopped');
      done();
    });
  });

  it('should emit end before stopped', (_t, done) => {
    const events = [];
    p = pipsqueak({ task: slow, interval: '1s' })
      .on('end', () => events.push('end'))
      .start();
    setTimeout(() => {
      p.stop((err) => {
        events.push('stopped');
        assert.deepEqual(events, ['end', 'stopped']);
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

  it('should report the status of each hamster', (_t, done) => {
    p = pipsqueak([
      { name: 'busy', task: slow, interval: '1s' },
      { name: 'lazy', task, interval: '1s', delay: '1s' },
      { name: 'off', task, interval: '1s', disabled: true },
    ]);
    assert.deepEqual(p.status(), {
      busy: 'idle',
      lazy: 'idle',
      off: 'disabled',
    });
    p.start();
    setTimeout(() => {
      assert.deepEqual(p.status(), {
        busy: 'running',
        lazy: 'idle',
        off: 'disabled',
      });
      assert.equal(p.status('busy'), 'running');
      assert.equal(p.status('nope'), undefined);
      p.stop((err) => {
        assert.deepEqual(p.status(), {
          busy: 'stopped',
          lazy: 'stopped',
          off: 'disabled',
        });
        p = null;
        done(err);
      });
    }, 50);
  });

  it('should start a hamster horde', (_t, done) => {
    p = pipsqueak([
      { task, interval: '100ms' },
      { task, interval: '50ms' },
    ]).start();
    setTimeout(() => {
      assert.equal(executions, 8);
      done();
    }, 250);
  });

  it('should poke a hamster horde', (_t, done) => {
    p = pipsqueak([
      { task, interval: '100ms' },
      { task, interval: '50ms' },
    ]).poke();
    setTimeout(() => {
      assert.equal(executions, 2);
      done();
    }, 250);
  });

  it('should poke a subset of a hamster horde', (_t, done) => {
    p = pipsqueak([
      { name: 'rod', task, interval: '50ms' },
      { name: 'jane', task, interval: '50ms' },
      { name: 'freddy', task, interval: '50ms' },
    ]).poke(['rod', 'jane']);
    setTimeout(() => {
      assert.equal(executions, 2);
      done();
    }, 250);
  });

  it('should poke a single hamster in a hamster horde', (_t, done) => {
    p = pipsqueak([
      { name: 'rod', task, interval: '50ms' },
      { name: 'jane', task, interval: '50ms' },
      { name: 'freddy', task, interval: '50ms' },
    ]).poke('rod');
    setTimeout(() => {
      assert.equal(executions, 1);
      done();
    }, 250);
  });

  it('should resume existing schedule after being poked', (_t, done) => {
    p = pipsqueak([
      { name: 'rod', task, interval: '100ms' },
      { name: 'jane', task, interval: '100ms' },
      { name: 'freddy', task, interval: '100ms' },
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
    p = pipsqueak([{ task, interval: '50ms', disabled: true }]).poke();
    setTimeout(() => {
      assert.equal(executions, 0);
      done();
    }, 100);
  });

  it('should poke disabled tasks with force parameter', (_t, done) => {
    p = pipsqueak([{ task, interval: '50ms', disabled: true }]).poke(true);
    setTimeout(() => {
      assert.equal(executions, 1);
      done();
    }, 100);
  });

  it('should not poke stopped tasks', (_t, done) => {
    p = pipsqueak([{ task, interval: '50ms' }]);
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
