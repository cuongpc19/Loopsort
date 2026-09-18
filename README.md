# Candy Factory (Loop Sort)

A candy-factory puzzle: each tray holds boxes of candy, tapping a box pours its 64 candies onto
the conveyor belt, and every tray takes only one colour at a time. Fill a tray with four boxes of
one colour and it is packed and shipped. The belt has room for a fixed number of boxes — fill it
with candy nobody can take and the board jams.

Plain HTML/CSS/JS with [three.js](https://threejs.org/) for the board; Vite only bundles and
serves it. No art files beyond the backdrops in `bg/`: the trays, boxes, candy and effects are all
drawn in code.

Play: <https://cuongpc19.github.io/Loopsort/>

## Running it

```bash
npm install
npm run dev        # http://localhost:5173/
npm run build      # static site in dist/
npm run deploy     # build, then publish dist/ to the gh-pages branch
```

## Dev links

| link | what it does |
|---|---|
| `?level=N` | start on level N |
| `?reset` | erase progress once, then clean itself off the address bar |
| `?dev=1` | the dev panel (jump level, coins, win now, boosters) |
| `?data=<dir>` | read a different level set, for comparing two sets |
| `?picktest=1` | self-check: project every box to the screen and raycast back |
| `?elev=` `?delev=` `?fov=` `?ringfit=` | camera angles and framing, portrait / landscape |

Settings inside the game also has "Go to level" and "Start over from level 1", which is what a
phone needs — typing a URL there is far worse than typing a number.

## Files

| file | what it holds |
|---|---|
| `loopsort.js` | the rules and the physics: trays, pouring, the belt, packing, boosters |
| `three3d.js` | everything on screen: board, trays, candy, camera framing |
| `app.js` | the shell: home, HUD, cards, boosters, settings |
| `celebrate.js` | the win fireworks and the candy mascot |
| `audio.js` | every sound, synthesised at run time |
| `data/` | the 100 levels (`Levels.json`, `Carriers.json`, `Splines.json`, `remap.json`) |
| `editor.html` | level editor; it writes to `data/` through the dev server only |

## Checking it

```bash
node factory-check.mjs     # rules, conservation of candy, real levels played end to end
node headless.mjs 1 5 30   # play levels without a browser
node levelbot.mjs 1-20     # how often a bot wins a range of levels
```

`levelbot.mjs` and `remap.mjs` can compare against the original game's level set, which is
copyrighted and **not** in this repo. They look for it in a sibling working copy, or wherever
`LS_ORIG` points.
