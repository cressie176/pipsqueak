var uuid = require('uuid').v4;
var parse = require('parse-duration');
var EventEmitter = require('events').EventEmitter;

module.exports = function pipsqueak(run, options) {

  var name = options.name || uuid();
  var factory = options.factory || function(name, id, iteration) {
    return options.task.bind(null, name, id, iteration);
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
    timeout = setTimeout(run.bind(null, api, name, uuid(), iteration++, factory, schedule.bind(null, interval)), delay).unref();
  }

  EventEmitter.call(api);
  Object.assign(api, EventEmitter.prototype);

  return api;
};


