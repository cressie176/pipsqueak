var uuid = require('uuid').v4;
var abstractApi = require('./abstract-api');

module.exports = function pipsqueak(options) {

  function run(emitter, name, factory, reschedule) {
    var id = uuid();
    emitter.emit('begin', { name: name, run: id, timestamp: Date.now(), });
    factory()(function(err) {
      if (err) emitter.emit('error', { name: name, run: id, timestamp: Date.now(), error: err, });
      var result = Array.prototype.slice.call(arguments, 1);
      emitter.emit('end', { name: name, run: id, timestamp: Date.now(), result: result, });
      reschedule();
    });
  }

  return abstractApi(run, options);
};
