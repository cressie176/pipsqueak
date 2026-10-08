var debug = require('debug')('pipsqueak');
var randomUUID = require('node:crypto').randomUUID;
var parse = require('parse-duration').default;
var EventEmitter = require('node:events').EventEmitter;
var forward = require('forward-events');

module.exports = function hamsters(run, optionsList) {
  var api = { start: start, stop: stop, poke: poke };

  EventEmitter.call(api);
  Object.assign(api, EventEmitter.prototype);

  var horde = []
    .concat(optionsList)
    .map((options) => hamster(api, run, options));

  function start() {
    horde.forEach((hamster) => {
      hamster.start();
    });
    return api;
  }

  function stop() {
    api.on('_stopped', onStopped);
    api.once('_timeout', onTimeout);
    horde.forEach((hamster) => {
      hamster.stop();
    });
  }

  function poke(namesParam, forceParam) {
    const [names, force] = getPokeOptions(namesParam, forceParam);
    horde.filter(byNames(names)).forEach((hamster) => {
      hamster.poke(force);
    });
    return api;
  }

  function byNames(names) {
    return (hamster) => {
      if (!names) return true;
      if ([].concat(names).includes(hamster.name)) return true;
      return false;
    };
  }

  var onStopped = (_event) => {
    var running = horde.find((hamster) => hamster.status() !== 'stopped');
    if (!running) {
      api.removeListener('_stopped', onStopped);
      api.emit('stopped');
    }
  };

  var onTimeout = (event) => {
    api.removeListener('_stopped', onStopped);
    api.emit('timeout', event);
  };

  return api;
};

function hamster(hordeEmitter, run, options) {
  var name = options.name || randomUUID();
  var enabled = !options.disabled;
  var factory = options.factory || ((meta) => options.task.bind(null, meta));
  var interval = getDuration(options.interval, undefined);
  var delay = getDuration(options.delay, 0);
  var timeout = getDuration(options.timeout, undefined);
  var iteration = 0;
  var next;
  var running = false;
  var stopping = false;
  var emitter = new EventEmitter();
  forward(emitter, hordeEmitter);

  function start() {
    if (!enabled) return;
    debug('%s is starting', name);
    schedule(delay);
  }

  function stop() {
    debug('%s is waiting to stop', name);
    stopping = true;
    clearTimeout(next);

    if (!running) {
      debug('%s has stopped', name);
      return emitter.emit('_stopped', { name: name, iteration: iteration });
    }

    function onEnd() {
      debug('%s has stopped', name);
      clearTimeout(timeoutId);
      process.nextTick(() => {
        emitter.emit('_stopped', { name: name, iteration: iteration });
      });
    }

    function onTimeout() {
      debug('%s timedout', name);
      emitter.removeListener('end', onEnd);
      emitter.emit('_timeout', { name: name, timestamp: Date() });
    }

    emitter.once('end', onEnd);

    if (timeout === undefined) return;
    var timeoutId = setTimeout(onTimeout, timeout).unref();
  }

  function schedule(delay) {
    if (stopping) return;
    debug('%s is scheduled to run in %d milliseconds', name, delay);
    var ctx = { name: name, run: randomUUID(), iteration: iteration++ };
    var reschedule = schedule.bind(null, interval);
    next = setTimeout(
      run.bind(null, ctx, emitter, factory, reschedule),
      delay,
    ).unref();
  }

  function poke(force) {
    if ((!enabled && !force) || stopping || running) return;
    debug('Poking %s', name);
    var ctx = { name: name, run: randomUUID(), iteration: iteration++ };
    var reschedule = next ? schedule.bind(null, interval) : () => {};
    clearTimeout(next);
    run(ctx, emitter, factory, reschedule);
  }

  function status() {
    return running ? 'running' : 'stopped';
  }

  emitter.on('begin', (_event) => {
    running = true;
  });

  emitter.on('end', (_event) => {
    running = false;
  });

  return {
    start: start,
    stop: stop,
    poke: poke,
    status: status,
    get name() {
      return name;
    },
  };
}

function getMillis(duration) {
  return typeof duration === 'string' ? parse(duration) : duration;
}

function getDuration(duration, defaultValue) {
  if (duration === null || duration === undefined) return defaultValue;
  if (typeof duration === 'string') return parse(duration);
  if (typeof duration === 'object') {
    const min = getMillis(duration.min) || 0;
    const max = getMillis(duration.max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return duration;
}

function getPokeOptions(names, force) {
  if (typeof names === 'boolean' && force === undefined)
    return [undefined, names];
  return [names, force];
}
