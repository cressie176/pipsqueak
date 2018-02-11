const { promiseApi: pipsqueak } = require('..');

const factory = (ctx) => new Promise((resolve, reject) => {
  resolve(new Date().toISOString());
})

console.log('Promise Example')
console.log('---------------')

const p = pipsqueak({ name: 'example', factory: factory, interval: '100ms', delay: '1s' })
  .on('begin', ({ name, run, }) => console.log(`begin: ${name}/${run}`))
  .on('end', ({ name, run, result }) => console.log(`end:   ${name}/${run} ${result}`))
  .on('error', ({ name, run, error }) => console.error(`error: ${name}/${run} ${error.message}`))
  .start();

setTimeout(() => p.stop().then(() => {
  console.log('Stopped\n');
}), 2000);
