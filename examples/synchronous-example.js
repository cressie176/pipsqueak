const { synchronousApi: pipsqueak } = require('..');

const task = (ctx) => new Date().toISOString();

console.log('Synchronous Example')
console.log('-------------------')

const p = pipsqueak({ name: 'example', task, interval: '100ms', delay: '1s' })
  .on('begin', ({ name, run, }) => console.log(`begin: ${name}/${run}`))
  .on('end', ({ name, run, result }) => console.log(`end:   ${name}/${run} ${result}`))
  .on('error', ({ name, run, error }) => console.error(`error: ${name}/${run} ${error.message}`))
  .start();

setTimeout(function() {
  p.stop();
  console.log('Stopped\n');
}, 2000);
