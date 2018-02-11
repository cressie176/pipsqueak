const { synchronousApi: pipsqueak } = require('..');

const task = (name, run, iteration) => new Date().toISOString();

console.log('Synchronous Example')
console.log('-------------------')

const p = pipsqueak({ name: 'example', task, interval: '100ms', delay: '1s' })
  .on('begin', ({ name, run, }) => console.log(`begin: ${name}/${run}`))
  .on('end', ({ name, run, result }) => console.log(`end:   ${name}/${run} ${result}\n`))
  .on('error', ({ name, run, error }) => console.error(`error: ${name}/${run} ${error.message}`))
  .start();

setTimeout(p.stop, 2000);
