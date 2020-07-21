var debug = require('debug')('pipsqueak');
var uuid = require('uuid').v4;
var parse = require('parse-duration');
var EventEmitter = require('events').EventEmitter;
var forward = require('forward-events');

module.exports = function hamsters(run, optionsList) {

  var api = { start: start, stop: stop, poke: poke, };

  EventEmitter.call(api);
  Object.assign(api, EventEmitter.prototype);

  var horde = [].concat(optionsList).map(function(options) {
    return hamster(api, run, options);
  });

  function start() {
    horde.forEach(function(hamster) {
      hamster.start();
    });
    return api;
  }

  function stop() {
    api.on('_stopped', onStopped);
    api.once('_timeout', onTimeout);
    horde.forEach(function(hamster) {
      hamster.stop();
    });
  }

  function poke(namesParam, forceParam) {
    const [names, force,] = getPokeOptions(namesParam, forceParam);
    horde.filter(byNames(names)).forEach(function(hamster) {
      hamster.poke(force);
    });
    return api;
  }

  function byNames(names) {
    return function(hamster) {
      if (!names) return true;
      if ([].concat(names).includes(hamster.name)) return true;
      return false;
    };
  }

  var onStopped = function(event) {
    var running = horde.find(function(hamster) {
      hamster.status() !== 'stopped';
    });
    if (!running) {
      api.removeListener('_stopped', onStopped);
      api.emit('stopped');
    }
  };

  var onTimeout = function(event) {
    api.removeListener('_stopped', onStopped);
    api.emit('timeout', event);
  };

  return api;

};

function hamster(hordeEmitter, run, options) {

  var name = options.name || uuid();
  var enabled = !options.disabled;
  var factory = options.factory || function(meta) {
    return options.task.bind(null, meta);
  };
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
      return emitter.emit('_stopped', { name: name, iteration: iteration, });
    }

    function checkStopped() {
      if (running) return false;
      debug('%s has stopped', name);
      clearInterval(checkStoppedId);
      clearTimeout(checkTimeoutId);
      emitter.emit('_stopped', { name: name, iteration: iteration, });
      return true;
    }

    function checkTimeout() {
      debug('%s timedout', name);
      clearInterval(checkStoppedId);
      emitter.emit('_timeout', { name: name, timestamp: Date(), });
    }

    var checkStoppedId = setInterval(checkStopped, 100).unref();

    if (timeout === undefined) return;
    var checkTimeoutId = setTimeout(checkTimeout, timeout).unref();
  }

  function schedule(delay) {
    if (stopping) return;
    debug('%s is scheduled to run in %d milliseconds', name, delay);
    var ctx = { name: name, run: uuid(), iteration: iteration++, };
    var reschedule = schedule.bind(null, interval);
    next = setTimeout(run.bind(null, ctx, emitter, factory, reschedule), delay).unref();
  }

  function poke(force) {
    if ((!enabled && !force) || stopping || running) return;
    debug('Poking %s', name);
    var ctx = { name: name, run: uuid(), iteration: iteration++, };
    var reschedule = next ? schedule.bind(null, interval) : function() {};
    clearTimeout(next);
    run(ctx, emitter, factory, reschedule);
  }

  function status() {
    return running ? 'running' : 'stopped';
  }

  emitter.on('begin', function(event) {
    running = true;
  });

  emitter.on('end', function(event) {
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
};

function getMillis(duration) {
  return typeof duration === 'string' ? parse(duration) : duration;
}

function getDuration(duration, defaultValue) {
  if (duration === null || duration === undefined) return defaultValue;
  if (typeof duration === 'string') return parse(duration);
  if (typeof duration === 'object') {
    var min = getMillis(duration.min) || 0;
    var max = getMillis(duration.max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return duration;
}

function getPokeOptions(names, force) {
  if (typeof names === 'boolean' && force === undefined) return [undefined, names,];
  return [names, force,];
}
