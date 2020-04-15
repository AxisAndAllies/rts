## rts

to run: `npm start` (starts BE and also serves FE)

- uses [paper.js](http://paperjs.org/about/) and socket.io

### dev

To add a new unit attribute:

1.  add it to the consts in `./public/constants.js`
2.  update the `calcCost` function on both backend and frontend
3.  implement its behavior

To add a new action type:

1.  add it to the `ACTION_TYPES` enum in `./public/constants.js`
2.  add a handler in `handlePlayerAction()` in `./game/game.js`
3.  add a frontend way to call `emitAction(ACTION_TYPES.[your_action_type])`

For hot reloading, see [this section](./README.md#Hot-reloading-everything).

### known bugs

### main todos

- HIGH priority

  - implement ControlPointsCaptured unit historical stat
  - set unit to also prioritize units that pose a threat to it first in addition to above (prioritize threats)
  - [ongoing] unit balance :)
  - load from export file...
  - show turn resolve summary/highlights
  - diagonal panning (n-key rollover?)

- MID priority

  - support both manual + AI targetting simultaneously
  - better collision resolution
  - enable placing more factories
  - more map types {height, width, control points}
  - make factories destructable
  - add ability to unlock higher limits for certain stats?? (like researching tech)
  - huge refactor for readability?

- LOW priority
  - better unit visuals based on unit class (artillery, tanky, raider, scout, balanced)
  - maybe different pricing formulas based on unit class?
  - more unit stats
    - sight radius?
    - AOE
    - short/long reload...
    - healing per sec
  - all units to show healthbars
  - factory upgrade build speed, build radius
    - factory choose where to build unit
  - use more backend validation instead of frontend validation

### Misc notes:

- a lot of hacks/simple tricks are possible simply b/c it's small scale (< 50 units usually)

- Victor.js is mutable, modifies vector directly unless you use `.clone()`

### Hot reloading everything

- Frontend doesn't use hot-reload per-se, but preserves state across reloads because of custom server-side socket.io reconnect logic
- Backend uses [node-hot](https://github.com/mihe/node-hot) for hot-reloading file changes in `./game` without restarting server.
  - Also can tolerate errors (fix the error, then press enter in console to continue game)
- ~~Frontend hot-reload uses [webpack-hot-middleware](https://github.com/webpack-contrib/webpack-hot-middleware/tree/master/example)~~
  - can't use Parcel for FE b/c v1 [trips on sourcemaps](https://github.com/parcel-bundler/parcel/pull/2427) so can't import `paper`
  - parcel2 issues [here](https://github.com/parcel-bundler/parcel/issues/3377)

### 2d engines compared:

- paper js - has vector lib, lots of demos, has scenegraph, has efficient sweep+Prune collision detection https://github.com/paperjs/paper.js/issues/1737
  - collisions - http://paperjs.org/reference/item/#intersects-item
- two js - focuses on animation, has basic vector lib, actively developed, has scenegraph
- pixi js - just rendering, not enough, has collision detect?
- stage js - not actively developed, no vector lib, has scenegraph

### vector engines compared:

- b/c paper JS's vector point stuff doesn't really work...
- https://github.com/evanshortiss/vector2d
- ended up using http://victorjs.org/
