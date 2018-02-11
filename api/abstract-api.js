var uuid = require('uuid').v4;
var parse = require('parse-duration');
var EventEmitter = require('events').EventEmitter;

module.exports = function pipsqueak(run, options) {

  var name = options.name || uuid();
  var factory = options.factory || function(meta) {
    return options.task.bind(null, meta);
  };
  var interval = typeof options.interval === 'string' ? parse(options.interval) : options.interval;
  var delay = typeof options.delay === 'string' ? parse(options.delay) : options.delay || 0;

  var api = { start: start, stop: stop, run: run, };
  var iteration = 0;
  var timeout;

  function start() {
    schedule(delay);
    return api;
  }

  function stop() {
    clearTimeout(timeout);
  }

  function schedule(delay) {
    var ctx = { name: name, run: uuid(), iteration: iteration++, };
    var reschedule = schedule.bind(null, interval);
    timeout = setTimeout(run.bind(null, ctx, api, factory, reschedule), delay).unref();
  }

  EventEmitter.call(api);
  Object.assign(api, EventEmitter.prototype);

  return api;
};


