# Change Log

## Unreleased
### Added
- `status()` reports whether each task is `idle`, `running`, `stopped` or `disabled` (#17)

### Fixed
- The horde no longer reports `stopped` until every hamster has stopped (#27)
- `stop()` now settles as soon as the running task ends instead of polling, so it can no longer be skipped when nothing else keeps the process alive (#30)

### Changed
- **Breaking:** Node 22.12 or later is now required
- Source modernised to ES2015+: `const`/`let`, arrow functions, destructuring, shorthand properties and template literals, enforced by Biome
- Replaced mocha and nyc with the built-in Node test runner and coverage reporter
- Replaced eslint with Biome
- Replaced husky with lefthook
- Migrated CI from Travis to GitHub Actions, with coverage reported to Codecov
- Publish to npm via GitHub Actions using trusted (staged) publishing
- Replaced uuid with `crypto.randomUUID`
- Updated dependencies

### Removed
- Code Climate, Greenkeeper and Travis configuration and badges

## 2.7.0
### Added
- Force poke will cause the job to run even when it is disabled

### Updated
- Bump dependencies

## 2.6.3
### Updated
- Bump dependencies, re-instate Node 14 tests

## 2.6.2
### Updated
- Bump dependencies

## 2.6.1
### Updated
- Readme

## 2.6.0
### Updated
- Fixed a bug where if any hamster was running, all hamsters were reported as running
- Added the ability to poke one or more hamsters

## 2.5.2
### Updated
- Dependencies

## 2.5.1
### Updated
- Dependencies

## 2.4.0
### Updated
- Dependencies

## 2.3.0
### Updated
- Dependencies

## 2.2.0
### Updated
- Dependencies
- Dropped support for node 4 and 5

## 2.1.0
### Updated
- Remove codeclimate from dev dependencies
- Improved readme
- Update dependencies

## 2.0.0
### Added
- Hamster hordes!!!
- Randomised durations
- Wait for tasks to finish before stopping
- Disabled config flag
- Added debug

## 1.0.0
### Added
- First release

The format is based on [Keep a Changelog](http://keepachangelog.com/)
