var abstractApi = require('./abstract-api');

module.exports = function pipsqueak(options) {

  function run(emitter, name, id, iteration, factory, reschedule) {
    emitter.emit('begin', { name: name, run: id, iteration: iteration, timestamp: Date.now(), });
    factory()(function(err) {
      if (err) emitter.emit('error', { name: name, run: id, iteration: iteration, timestamp: Date.now(), error: err, });
      var result = Array.prototype.slice.call(arguments, 1);
      emitter.emit('end', { name: name, run: id, iteration: iteration, timestamp: Date.now(), result: result, });
      reschedule();
    });
  }

  return abstractApi(run, options);
};
