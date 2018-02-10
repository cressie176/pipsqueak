var uuid = require('uuid').v4;
var abstractApi = require('./abstract-api');

module.exports = function pipsqueak(options) {

  function run(emitter, name, factory, reschedule) {
    var id = uuid();
    var result;
    emitter.emit('begin', { name: name, run: id, timestamp: Date.now(), });
    try {
      result = factory()();
    } catch (err) {
      emitter.emit('error', { name: name, run: id, timestamp: Date.now(), error: err, });
    } finally {
      emitter.emit('end', { name: name, run: id, timestamp: Date.now(), result: result, });
      reschedule();
    };
  }

  return abstractApi(run, options);
};
