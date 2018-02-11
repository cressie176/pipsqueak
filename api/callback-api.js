var abstractApi = require('./abstract-api');

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

  return abstractApi(run, options);
};
