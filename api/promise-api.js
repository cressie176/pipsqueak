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
    factory(ctx)
      .then((_result) => {
        result = _result;
      })
      .catch((err) => {
        debug('%s/%d failed', ctx.name, ctx.iteration);
        emitter.emit('error', {
          name: ctx.name,
          run: ctx.run,
          iteration: ctx.iteration,
          timestamp: Date.now(),
          error: err,
        });
      })
      .then(() => {
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
  api.stop = () =>
    new Promise((resolve, reject) => {
      api
        .once('stopped', () => {
          resolve();
        })
        .once('timeout', (event) => {
          reject(
            new Error(`Timedout while waiting for ${event.name} task to stop`),
          );
        });
      wrapped();
    });
  return api;
};
