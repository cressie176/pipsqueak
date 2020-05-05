# Pipsqueak

[![Greenkeeper badge](https://badges.greenkeeper.io/cressie176/pipsqueak.svg)](https://greenkeeper.io/)
[![NPM version](https://img.shields.io/npm/v/pipsqueak.svg?style=flat-square)](https://www.npmjs.com/package/pipsqueak)
[![NPM downloads](https://img.shields.io/npm/dm/pipsqueak.svg?style=flat-square)](https://www.npmjs.com/package/pipsqueak)
[![Build Status](https://img.shields.io/travis/cressie176/pipsqueak/master.svg)](https://travis-ci.org/cressie176/pipsqueak)
[![Code Climate](https://codeclimate.com/github/cressie176/pipsqueak/badges/gpa.svg)](https://codeclimate.com/github/cressie176/pipsqueak)
[![Test Coverage](https://codeclimate.com/github/cressie176/pipsqueak/badges/coverage.svg)](https://codeclimate.com/github/cressie176/pipsqueak/coverage)
[![Code Style](https://img.shields.io/badge/code%20style-imperative-brightgreen.svg)](https://github.com/cressie176/eslint-config-imperative)
[![Dependency Status](https://david-dm.org/cressie176/pipsqueak.svg)](https://david-dm.org/cressie176/pipsqueak)
[![devDependencies Status](https://david-dm.org/cressie176/pipsqueak/dev-status.svg)](https://david-dm.org/cressie176/pipsqueak?type=dev)

Pipsqueak is an in memory interval based task scheduler, with support for promises, callbacks and synchronous functions. Pipsqueak is also the name of a Hamster. Hamsters like running in circles. A bit like an interval based task scheduler, but more cute.

<img alt="Pipsqueak" src="https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Pipsqueak_Go_Go_Hamster.png/220px-Pipsqueak_Go_Go_Hamster.png" width="110" height="94" class="thumbimage">

## Advantages Over setInterval / setTimeout
- Monitor a task's lifecycle through `begin`, `end` and `error` events
- Reduce the boilerplate code associated with setTimeout/setInterval
- Randomly stagger execution when running multiple instances
- Configure intervals in human readable form
- Stop worrying about [unref](https://nodejs.org/api/timers.html#timers_timeout_unref)

## Promise API
```javascript
const { promiseApi: pipsqueak } = require('pipsqueak');

const factory = (ctx) => new Promise((resolve, reject) => {
  resolve(new Date().toISOString());
})

const p = pipsqueak({ name: 'example', factory: factory, interval: '1s', delay: '1s' })
  .on('begin', ({ name, run, }) => console.log(`begin: ${name}/${run}`))
  .on('end', ({ name, run, result }) => console.log(`end:   ${name}/${run} ${result}`))
  .on('error', ({ name, run, error }) => console.error(`error: ${name}/${run} ${error.message}`))
  .start();
```
n.b. In order for the promise to be re-evaluated a factory must be used
## Callback API
```javascript
const { callbackApi: pipsqueak } = require('pipsqueak');

const task = (ctx, cb) => cb(null, new Date().toISOString());

const p = pipsqueak({ name: 'example', task: task, interval: '1s', delay: '1s' })
  .on('begin', ({ name, run, }) => console.log(`begin: ${name}/${run}`))
  .on('end', ({ name, run, result }) => console.log(`end:   ${name}/${run} ${result[0]}`))
  .on('error', ({ name, run, error }) => console.error(`error: ${name}/${run} ${error.message}`))
  .start();
```
n.b. the results are an array
## Synchronous API
```javascript
const { synchronousApi: pipsqueak } = require('pipsqueak');

const task = (ctx) => new Date().toISOString();

const p = pipsqueak({ name: 'example', task: task, interval: '1s', delay: '1s' })
  .on('begin', ({ name, run, }) => console.log(`begin: ${name}/${run}`))
  .on('end', ({ name, run, result }) => console.log(`end:   ${name}/${run} ${result}`))
  .on('error', ({ name, run, error }) => console.error(`error: ${name}/${run} ${error.message}`))
  .start();
```
## Output
```
begin: example/39195fc7-7035-48a2-9f73-ef6476ff3fdd
end:   example/39195fc7-7035-48a2-9f73-ef6476ff3fdd 2018-02-10T22:41:51.025Z
begin: example/2c3fc5c6-c5dd-4233-8979-21b047b443b6
end:   example/2c3fc5c6-c5dd-4233-8979-21b047b443b6 2018-02-10T22:41:56.028Z
begin: example/aa6b7d7f-608b-4469-b874-18fda2457a45
end:   example/aa6b7d7f-608b-4469-b874-18fda2457a45 2018-02-10T22:42:01.029Z
```

## Advanced Usage

### Multiple tasks
You can specify multiple tasks by passing pipsqueak an array instead of a map
```javascript
const { promiseApi: pipsqueak } = require('pipsqueak');

const factory = (ctx) => new Promise((resolve, reject) => {
  resolve(new Date().toISOString());
})

const tasks = [
  { name: 'example-1', factory: factory, interval: '1s', delay: '1s' },
  { name: 'example-2', factory: factory, interval: '5s' },
]
const p = pipsqueak(tasks)
  .on('begin', ({ name, run, }) => console.log(`begin: ${name}/${run}`))
  .on('end', ({ name, run, result }) => console.log(`end:   ${name}/${run} ${result}`))
  .on('error', ({ name, run, error }) => console.error(`error: ${name}/${run} ${error.message}`))
  .start();
```

### Intervals / Delays
You must set an interval, but an initial delay is optional. Values may be integers, [parsable](https://www.npmjs.com/package/parse-duration) strings or if you want a random duration, an object containing `max` and optional `min` properties.
```javascript
const { promiseApi: pipsqueak } = require('pipsqueak');

const factory = (ctx) => new Promise((resolve, reject) => {
  resolve(new Date().toISOString());
})

const interval = { min: '1m', max: '5m' };
const delay = { max: '1m' };
const p = pipsqueak({ name: 'example', factory, interval, delay }).start();
```

### Stopping
Calling stop will cancel any schedule runs and prevent new runs from being scheduled. You can specify a shutdown timeout at a task level
```javascript
const tasks = [
  { name: 'example-1', factory: factory, interval: '1s', timeout: '2s' },
  { name: 'example-2', factory: factory, interval: '5s', timeout: '5s' },
]
```
#### Promise API
```javascript
const { promiseApi: pipsqueak } = require('pipsqueak');

const p = pipsqueak(tasks).start()
p.stop().then(() => {
  ...
}).catch(err => {
  console.error(err.message);
});
```
#### Callback API
```javascript
const { callbackApi: pipsqueak } = require('pipsqueak');

const p = pipsqueak(tasks).start();
p.stop(function(err) {
  if (err) console.error(err.message);
  ...
})
```
#### Synchronous API
Synchronous tasks are blocking, so there's no need to wait for them

### Poking Tasks
You can force a task or tasks to run by poking them.
```js
const p = pipsqueak(tasks).start();
p.poke();
p.poke('task1');
p.poke(['task1', 'task2']);
```
If pipsqueak is stopped, or the task was running or disabled, poking it will have no effect.
If pipsqueak was not started, the task will be run once, but not scheduled.
If pipsqueak was started, the next schedule will be cancelled, the task will be run once and rescheduled.

### Disabling Tasks
If you want to configure, but disable a specific tasks (maybe because it should only run under specific conditions, set `disabled` to true, e.g.
```javascript
pipsqueak({ name: 'example', task: task, interval: '1s', disabled: true })

```

## Events

### begin
Emitted whenever the task begins.

| Property  | Type    | Description |
|-----------|---------|-------------|
| name      | String  | The supplied task runner name. |
| run       | UUID    | Uniquely identifies the run. |
| iteration | Integer | The number of times the task has been executed |
| timestamp | Integer | The current time in millis |

### end
Emitted whenever the task finishes.

| Property  | Type    | Description |
|-----------|---------|-------------|
| name      | String  | The supplied task runner name. |
| run       | UUID    | Uniquely identifies the run. |
| iteration | Integer | The number of times the task has been executed |
| timestamp | Integer | The current time in millis |
| result    | Mixed   | The result of the task, passed the the callback, resolved or returned |

### error
Emitted whenever the task errors.

| Property  | Type    | Description |
|-----------|---------|-------------|
| name      | String  | The supplied task runner name. |
| run       | UUID    | Uniquely identifies the run. |
| iteration | Integer | The number of times the task has been executed |
| timestamp | Integer | Uniquely identifies the run. |
| error     | Error   | The error object thrown, rejected or passed to the callback |

## Debug
To run with debug enabled set `DEBUG=pipsqueak`
