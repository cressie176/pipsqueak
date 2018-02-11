const { callbackApi: pipsqueak } = require('..');

const task = (ctx, cb) => cb(null, new Date().toISOString());

console.log('Callback Example')
console.log('----------------')

const p = pipsqueak({ name: 'example', task: task, interval: '100ms', delay: '1s' })
  .on('begin', ({ name, run, }) => console.log(`begin: ${name}/${run}`))
  .on('end', ({ name, run, result }) => console.log(`end:   ${name}/${run} ${result[0]}\n`))
  .on('error', ({ name, run, error }) => console.error(`error: ${name}/${run} ${error.message}`))
  .start();

setTimeout(p.stop, 2000);
