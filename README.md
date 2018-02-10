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

Pipsqueak is an interval based task runner, with support for promises, callbacks and synchronous functions. Pipsqueak is also the name of a Hamster. Hamsters like running in circles. A bit like an interval based task runner.

<img alt="Pipsqueak" src="https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Pipsqueak_Go_Go_Hamster.png/220px-Pipsqueak_Go_Go_Hamster.png" width="220" height="188" class="thumbimage" srcset="https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Pipsqueak_Go_Go_Hamster.png/330px-Pipsqueak_Go_Go_Hamster.png 1.5x, https://upload.wikimedia.org/wikipedia/en/8/87/Pipsqueak_Go_Go_Hamster.png 2x" data-file-width="341" data-file-height="292">

## TL;DR
###  Promise API
```
const { promiseApi: pipsqueak } = require('pipsqueak');

const factory = () => new Promise((resolve, reject) => {
  resolve(new Date().toISOString());
})

const p = pipsqueak({ name: 'example', factory: factory, interval: '1s', delay: '1s' })
  .on('begin', ({ name, run, }) => console.log(`begin: ${name}/${run}`))
  .on('end', ({ name, run, result }) => console.log(`end:   ${name}/${run} ${result}`))
  .on('error', ({ name, run, error }) => console.error(`error: ${name}/${run} ${error.message}`))
  .start();

setTimeout(p.stop, 60000);
```
### Callback API
```
const { callbackApi: pipsqueak } = require('pipsqueak');

const task = cb => cb(null, new Date().toISOString());

const p = pipsqueak({ name: 'example', task: task, interval: '1s', delay: '1s' })
  .on('begin', ({ name, run, }) => console.log(`begin: ${name}/${run}`))
  .on('end', ({ name, run, result }) => console.log(`end:   ${name}/${run} ${result[0]}`))
  .on('error', ({ name, run, error }) => console.error(`error: ${name}/${run} ${error.message}`))
  .start();

setTimeout(p.stop, 60000);
```
n.b. the results are an array
### Synchronous API
```
const { synchronousApi: pipsqueak } = require('pipsqueak');

const task = () => new Date().toISOString();

const p = pipsqueak({ name: 'example', task: task, interval: '1s', delay: '1s' })
  .on('begin', ({ name, run, }) => console.log(`begin: ${name}/${run}`))
  .on('end', ({ name, run, result }) => console.log(`end:   ${name}/${run} ${result}`))
  .on('error', ({ name, run, error }) => console.error(`error: ${name}/${run} ${error.message}`))
  .start();

setTimeout(p.stop, 60000);
```
### Output
```
begin: example/39195fc7-7035-48a2-9f73-ef6476ff3fdd
end:   example/39195fc7-7035-48a2-9f73-ef6476ff3fdd 2018-02-10T22:41:51.025Z
begin: example/2c3fc5c6-c5dd-4233-8979-21b047b443b6
end:   example/2c3fc5c6-c5dd-4233-8979-21b047b443b6 2018-02-10T22:41:56.028Z
begin: example/aa6b7d7f-608b-4469-b874-18fda2457a45
end:   example/aa6b7d7f-608b-4469-b874-18fda2457a45 2018-02-10T22:42:01.029Z
```

## Events

### begin
Emitted whenever the task begins.

| Property  | Description |
|-----------|-------------|
| name      | The supplied task runner name. Useful if you want to aggregate metrics by task |
| run       | Uniquely identifies the run. Useful if you want to calculate task duration |
| timestamp | Uniquely identifies the run. Useful if you want to calculate task duration |

### end
Emitted whenever the task finishes.

| Property  | Description |
|-----------|-------------|
| name      | The supplied task runner name. Useful if you want to aggregate metrics by task |
| run       | Uniquely identifies the run. Useful if you want to calculate task duration |
| timestamp | Uniquely identifies the run. Useful if you want to calculate task duration |
| result    | The result of the task, passed the the callback, resolved or returned |


### error
Emitted whenever the task errors.

| Property  | Description |
|-----------|-------------|
| name      | The supplied task runner name. Useful if you want to aggregate metrics by task |
| run       | Uniquely identifies the run. Useful if you want to calculate task duration |
| timestamp | Uniquely identifies the run. Useful if you want to calculate task duration |
| error     | The error object thrown, rejected or passed to the callback |

