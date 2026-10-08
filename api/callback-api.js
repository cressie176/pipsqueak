const debug = require('debug')('pipsqueak');
const abstractApi = require('./abstract-api');

module.exports = function pipsqueak(options) {
  function run(ctx, emitter, factory, reschedule) {
    debug('%s/%d is running', ctx.name, ctx.iteration);
    emitter.emit('begin', {
      name: ctx.name,
      run: ctx.run,
      iteration: ctx.iteration,
      timestamp: Date.now(),
    });
    factory(ctx)((err, ...result) => {
      if (err) {
        debug('%s/%d failed', ctx.name, ctx.iteration);
        emitter.emit('error', {
          name: ctx.name,
          run: ctx.run,
          iteration: ctx.iteration,
          timestamp: Date.now(),
          error: err,
        });
      }
      debug('%s/%d finished', ctx.name, ctx.iteration);
      emitter.emit('end', {
        name: ctx.name,
        run: ctx.run,
        iteration: ctx.iteration,
        timestamp: Date.now(),
        result,
      });
      reschedule();
    });
  }

  const api = abstractApi(run, options);
  const wrapped = api.stop;
  api.stop = (cb) => {
    api
      .once('stopped', () => {
        cb();
      })
      .once('timeout', (event) => {
        cb(new Error(`Timedout while waiting for ${event.name} task to stop`));
      });
    wrapped();
  };
  return api;
};
