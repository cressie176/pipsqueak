var abstractApi = require('./abstract-api');

module.exports = function pipsqueak(options) {

  function run(emitter, name, id, iteration, factory, reschedule) {
    var result;
    emitter.emit('begin', { name: name, run: id, iteration: iteration, timestamp: Date.now(), });
    factory(name, id, iteration)
      .then(function(_result) {
        result = _result;
      }).catch(function(err) {
        emitter.emit('error', { name: name, run: id, iteration: iteration, timestamp: Date.now(), error: err, });
      }).then(function() {
        emitter.emit('end', { name: name, run: id, iteration: iteration, timestamp: Date.now(), result: result, });
        reschedule();
      });
  }

  return abstractApi(run, options);
};



