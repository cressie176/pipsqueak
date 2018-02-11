var uuid = require('uuid').v4;
var parse = require('parse-duration');
var EventEmitter = require('events').EventEmitter;

module.exports = function hamsters(run, optionsList) {

  var api = { start: start, stop: stop, };

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

  var onStopped = function(event) {
    const running = horde.find(function(hamster) {
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

function hamster(emitter, run, options) {

  var name = options.name || uuid();
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

  function start() {
    schedule(delay);
  }

  function stop() {
    clearTimeout(next);
    if (!running) {
      return emitter.emit('_stopped', { name: name, iteration: iteration, });
    }

    stopping = true;
    var checkStopped = setInterval(function() {
      if (running) return;
      clearInterval(checkStopped);
      emitter.emit('_stopped', { name: name, iteration: iteration, });
    }, 100).unref();

    if (timeout === undefined) return;
    setTimeout(function() {
      clearInterval(interval, timeout);
      emitter.emit('_timeout', { name: name, timestamp: Date(), });
    }, timeout);
  }

  function schedule(delay) {
    if (stopping) return;
    var ctx = { name: name, run: uuid(), iteration: iteration++, };
    var reschedule = schedule.bind(null, interval);
    next = setTimeout(run.bind(null, ctx, emitter, factory, reschedule), delay).unref();
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

  return { start: start, stop: stop, status: status, };
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


