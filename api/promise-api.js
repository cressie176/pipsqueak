var debug = require('debug')('pipsqueak');
var abstractApi = require('./abstract-api');
var format = require('util').format;

module.exports = function pipsqueak(options) {

  function run(ctx, emitter, factory, reschedule) {
    debug('%s/%d is running', ctx.name, ctx.iteration);
    var result;
    emitter.emit('begin', { name: ctx.name, run: ctx.run, iteration: ctx.iteration, timestamp: Date.now(), });
    factory(ctx)
      .then(function(_result) {
        result = _result;
      }).catch(function(err) {
        debug('%s/%d failed', ctx.name, ctx.iteration);
        emitter.emit('error', { name: ctx.name, run: ctx.run, iteration: ctx.iteration, timestamp: Date.now(), error: err, });
      }).then(function() {
        debug('%s/%d finished', ctx.name, ctx.iteration);
        emitter.emit('end', { name: ctx.name, run: ctx.run, iteration: ctx.iteration, timestamp: Date.now(), result: result, });
        reschedule();
      });
  }

  var api = abstractApi(run, options);
  var wrapped = api.stop;
  api.stop = function() {
    return new Promise(function(resolve, reject) {
      api.on('stopped', function() {
        resolve();
      }).on('timeout', function(event) {
        reject(new Error(format('Timedout while waiting for %s task to stop', event.name)));
      });
      wrapped();
    });
  };
  return api;
};



