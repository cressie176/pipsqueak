const { callbackApi: pipsqueak } = require('..');

const task = cb => cb(null, new Date().toISOString());

const p = pipsqueak({ name: 'example', task: task, interval: '1s', delay: '1s' })
  .on('begin', ({ name, run, }) => console.log(`begin: ${name}/${run}`))
  .on('end', ({ name, run, result }) => console.log(`end:   ${name}/${run} ${result[0]}`))
  .on('error', ({ name, run, error }) => console.error(`error: ${name}/${run} ${error.message}`))
  .start();

setTimeout(p.stop, 60000);
