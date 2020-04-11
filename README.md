## rts

to run: `npm start` (starts BE and also serves FE)

- uses [paper.js](http://paperjs.org/about/) and socket.io

### known bugs

- fix bug on shoot_targets[0] of dead targets?? (not being cleared??)
  - not able to repro 4/10
- [x] can't hover over blueprint buttons when some unit selected?
- [x] prevent seeing enemy move plans

### main todos

- HIGH priority

  - [x] need to show cur stats + base stats on hover
  - [x] show your current \$ + projected amount gained per turn
  - [x] show blueprint cost...
  - [x] controlPoints to show capture progress
  - different unit visuals based on unit class (artillery, tanky, raider, scout, balanced)
  - auto-target mode
  - [ongoing] unit balance :)
    - maybe different pricing formulas based on unit class?
  - write state to file, load from file...
  - [x] fix unit wiggle on move (slow down if going to overshoot move target)

- MID priority

  - enable placing more factories
  - larger playing field (enable map pan/zoom)
  - more map types {height, width, control points}
  - [x] unit build times + factory queue to build one at a time
  - [x] initial control point capture time
  - make factories destructable
  - add ability to unlock higher limits for certain stats?? (like researching tech)

- LOW priority
  - more unit stats
    - sight radius?
    - AOE
    - short/long reload...
    - [x] accuracy (% to hit)
    - healing per sec
  - all units to show healthbars
  - factory upgrade build speed, build radius
    - factory choose where to build unit
  - use more backend validation instead of frontend validation
  - rectangle select + smarter auto spread out?

### NOTES:

- Victor.js is mutable, modifies vector directly unless you use `.clone()`
- uses [node-hot](https://github.com/mihe/node-hot) for hot-reloading file changes in `./game` without restarting server. Incredibly useful for development!
- FE doesn't use hot-reload per-se, but preserves state across reloads because of custom server-side socket.io reconnect logic
- ~~FE hot-reload uses [webpack-hot-middleware](https://github.com/webpack-contrib/webpack-hot-middleware/tree/master/example)~~
  - can't use Parcel for FE b/c v1 [trips on sourcemaps](https://github.com/parcel-bundler/parcel/pull/2427) so can't import `paper`

* parcel2 issues [here](https://github.com/parcel-bundler/parcel/issues/3377)

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
