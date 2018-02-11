var debug = require('debug')('pipsqueak');
var abstractApi = require('./abstract-api');
var format = require('util').format;

module.exports = function pipsqueak(options) {

  function run(ctx, emitter, factory, reschedule) {
    debug('%s/%d is running', ctx.name, ctx.iteration);
    emitter.emit('begin', { name: ctx.name, run: ctx.run, iteration: ctx.iteration, timestamp: Date.now(), });
    factory(ctx)(function(err) {
      if (err) {
        debug('%s/%d failed', ctx.name, ctx.iteration);
        emitter.emit('error', { name: ctx.name, run: ctx.run, iteration: ctx.iteration, timestamp: Date.now(), error: err, });
      }
      var result = Array.prototype.slice.call(arguments, 1);
      debug('%s/%d finished', ctx.name, ctx.iteration);
      emitter.emit('end', { name: ctx.name, run: ctx.run, iteration: ctx.iteration, timestamp: Date.now(), result: result, });
      reschedule();
    });
  }

  var api = abstractApi(run, options);
  var wrapped = api.stop;
  api.stop = function(cb) {
    api.on('stopped', function() {
      cb();
    }).on('timeout', function(event) {
      cb(new Error(format('Timedout while waiting for %s task to stop', event.name)));
    });
    wrapped();
  };
  return api;
};
