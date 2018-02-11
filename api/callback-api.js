var abstractApi = require('./abstract-api');
var format = require('util').format;

module.exports = function pipsqueak(options) {

  function run(ctx, emitter, factory, reschedule) {
    emitter.emit('begin', { name: ctx.name, run: ctx.run, iteration: ctx.iteration, timestamp: Date.now(), });
    factory(ctx)(function(err) {
      if (err) {
        emitter.emit('error', { name: ctx.name, run: ctx.run, iteration: ctx.iteration, timestamp: Date.now(), error: err, });
      }
      var result = Array.prototype.slice.call(arguments, 1);
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
