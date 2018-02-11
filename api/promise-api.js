var abstractApi = require('./abstract-api');

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

  return abstractApi(run, options);
};



