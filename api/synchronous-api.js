const debug = require('debug')('pipsqueak');
const abstractApi = require('./abstract-api');

module.exports = function pipsqueak(options) {
  function run(ctx, emitter, factory, reschedule) {
    debug('%s/%d is running', ctx.name, ctx.iteration);
    let result;
    emitter.emit('begin', {
      name: ctx.name,
      run: ctx.run,
      iteration: ctx.iteration,
      timestamp: Date.now(),
    });
    try {
      result = factory(ctx)();
    } catch (err) {
      debug('%s/%d failed', ctx.name, ctx.iteration);
      emitter.emit('error', {
        name: ctx.name,
        run: ctx.run,
        iteration: ctx.iteration,
        timestamp: Date.now(),
        error: err,
      });
    } finally {
      debug('%s/%d finished', ctx.name, ctx.iteration);
      emitter.emit('end', {
        name: ctx.name,
        run: ctx.run,
        iteration: ctx.iteration,
        timestamp: Date.now(),
        result,
      });
      reschedule();
    }
  }

  return abstractApi(run, options);
};
