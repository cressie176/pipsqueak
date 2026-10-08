const debug = require('debug')('pipsqueak');
const { randomUUID } = require('node:crypto');
const { default: parse } = require('parse-duration');
const { EventEmitter } = require('node:events');
const forward = require('forward-events');

module.exports = function hamsters(run, optionsList) {
  const api = Object.assign(new EventEmitter(), { start, stop, poke, status });

  const horde = [optionsList]
    .flat()
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

  function status(names) {
    const statuses = Object.fromEntries(
      horde
        .filter(byNames(names))
        .map((hamster) => [hamster.name, hamster.status()]),
    );
    return typeof names === 'string' ? statuses[names] : statuses;
  }

  function byNames(names) {
    return (hamster) => {
      if (!names) return true;
      if ([names].flat().includes(hamster.name)) return true;
      return false;
    };
  }

  const onStopped = (_event) => {
    const running = horde.find((hamster) => hamster.status() === 'running');
    if (!running) {
      api.removeListener('_stopped', onStopped);
      api.emit('stopped');
    }
  };

  const onTimeout = (event) => {
    api.removeListener('_stopped', onStopped);
    api.emit('timeout', event);
  };

  return api;
};

function hamster(hordeEmitter, run, options) {
  const name = options.name || randomUUID();
  const enabled = !options.disabled;
  const factory =
    options.factory ||
    ((meta) =>
      (...args) =>
        options.task(meta, ...args));
  const interval = getDuration(options.interval, undefined);
  const delay = getDuration(options.delay, 0);
  const timeout = getDuration(options.timeout, undefined);
  let iteration = 0;
  let next;
  let running = false;
  let stopping = false;
  const emitter = new EventEmitter();
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
      return emitter.emit('_stopped', { name, iteration });
    }

    let timeoutId;

    const onEnd = () => {
      debug('%s has stopped', name);
      clearTimeout(timeoutId);
      process.nextTick(() => {
        emitter.emit('_stopped', { name, iteration });
      });
    };

    const onTimeout = () => {
      debug('%s timedout', name);
      emitter.removeListener('end', onEnd);
      emitter.emit('_timeout', { name, timestamp: Date() });
    };

    emitter.once('end', onEnd);

    if (timeout !== undefined) {
      timeoutId = setTimeout(onTimeout, timeout).unref();
    }
  }

  function schedule(delay) {
    if (stopping) return;
    debug('%s is scheduled to run in %d milliseconds', name, delay);
    const ctx = { name, run: randomUUID(), iteration: iteration++ };
    const reschedule = () => schedule(interval);
    next = setTimeout(
      () => run(ctx, emitter, factory, reschedule),
      delay,
    ).unref();
  }

  function poke(force) {
    if ((!enabled && !force) || stopping || running) return;
    debug('Poking %s', name);
    const ctx = { name, run: randomUUID(), iteration: iteration++ };
    const reschedule = next ? () => schedule(interval) : () => {};
    clearTimeout(next);
    run(ctx, emitter, factory, reschedule);
  }

  function status() {
    if (running) return 'running';
    if (!enabled) return 'disabled';
    if (stopping) return 'stopped';
    return 'idle';
  }

  emitter.on('begin', (_event) => {
    running = true;
  });

  emitter.on('end', (_event) => {
    running = false;
  });

  return {
    start,
    stop,
    poke,
    status,
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
