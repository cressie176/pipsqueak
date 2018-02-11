var abstractApi = require('./abstract-api');
var format = require('util').format;

module.exports = function pipsqueak(options) {

  function run(ctx, emitter, factory, reschedule) {
    var result;
    emitter.emit('begin', { name: ctx.name, run: ctx.run, iteration: ctx.iteration, timestamp: Date.now(), });
    factory(ctx)
      .then(function(_result) {
        result = _result;
      }).catch(function(err) {
        emitter.emit('error', { name: ctx.name, run: ctx.run, iteration: ctx.iteration, timestamp: Date.now(), error: err, });
      }).then(function() {
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



