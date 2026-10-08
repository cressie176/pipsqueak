var debug = require('debug')('pipsqueak');
var abstractApi = require('./abstract-api');
var format = require('node:util').format;

module.exports = function pipsqueak(options) {
  function run(ctx, emitter, factory, reschedule) {
    debug('%s/%d is running', ctx.name, ctx.iteration);
    var result;
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
          result: result,
        });
        reschedule();
      });
  }

  var api = abstractApi(run, options);
  var wrapped = api.stop;
  api.stop = () =>
    new Promise((resolve, reject) => {
      api
        .once('stopped', () => {
          resolve();
        })
        .once('timeout', (event) => {
          reject(
            new Error(
              format('Timedout while waiting for %s task to stop', event.name),
            ),
          );
        });
      wrapped();
    });
  return api;
};
