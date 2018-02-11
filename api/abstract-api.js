var uuid = require('uuid').v4;
var parse = require('parse-duration');
var EventEmitter = require('events').EventEmitter;

module.exports = function hamsters(run, optionsList) {

  var api = { start: start, stop: stop, };

  EventEmitter.call(api);
  Object.assign(api, EventEmitter.prototype);

  const horde = [].concat(optionsList).map(function(options) {
    return hamster(api, run, options);
  });

  function start() {
    horde.forEach(hamster => hamster.start());
    return api;
  }

  function stop() {
    horde.forEach(hamster => hamster.stop());
  }

  return api;

};

function hamster(emitter, run, options) {

  var name = options.name || uuid();
  var factory = options.factory || function(meta) {
    return options.task.bind(null, meta);
  };
  var interval = getDuration(options.interval);
  var delay = getDuration(options.delay);
  var iteration = 0;
  var timeout;

  function start() {
    schedule(delay);
  }

  function stop() {
    clearTimeout(timeout);
  }

  function schedule(delay) {
    var ctx = { name: name, run: uuid(), iteration: iteration++, };
    var reschedule = schedule.bind(null, interval);
    timeout = setTimeout(run.bind(null, ctx, emitter, factory, reschedule), delay).unref();
  }

  return { start: start, stop: stop, };
};

function getMillis(duration) {
  return typeof duration === 'string' ? parse(duration) : duration;
}

function getDuration(duration) {
  if (!duration) return 0;
  if (typeof duration === 'string') return parse(duration);
  if (typeof duration === 'object') {
    var min = getMillis(duration.min) || 0;
    var max = getMillis(duration.max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return duration;
}


