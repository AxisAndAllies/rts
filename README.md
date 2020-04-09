## rts

---

to run: `npm start` (starts BE and also serves FE)

- uses [paper.js](http://paperjs.org/about/) and socket.io
### known bugs
  - fix bug on shoot_targets[0] of dead targets?? (not being cleared??)
  - can't hover over blueprint buttons when some unit selected?
### main todos
- high priority
  - need to show cur stats + base stats on hover
  - show your current $ + projected amount gained per turn
  - controlPoints to show capture progress
  - units to show healthbars
  - different unit visuals based on unit class (artillery, tanky, raider, scout, balanced)
  - [ongoing] unit balance :)
    - maybe different pricing formulas based on unit class?
  - more unit stats
    - sight radius?
    - AOE
    - short/long reload...
    - accuracy (% to hit)
    - healing per turn
  - write state to file, load from file...
- low priority
  - use more backend validation instead of frontend validation

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
