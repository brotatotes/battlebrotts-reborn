# BattleBrotts Reborn

An original small real-time robot auto-battler. Watch Pip fight, choose equipment, and give optional movement or target commands.

## Development status

This is a development build, not the finished release. The approved finite scope is four regular encounters and one boss, one starter and two equipment directions. Both build directions have completed real browser campaigns. Independent critical review, final tuning, accessibility and release verification remain in progress. Optional original audio, numerical reward previews and a five-slide presentation are implemented with unit checks but await browser verification. The captioned demo is not yet recorded. Passing tests is not a claim of human playtesting or finished-game quality.

## Run locally

Requires Node.js 22 or later to test/build. No package installation is needed.

```
npm test
npm run build
python3 -m http.server 8000 --directory dist --bind 127.0.0.1
```

Open http://127.0.0.1:8000. The game itself is a standalone static site with no runtime dependencies, accounts, network services or analytics.

## Controls

- Start the circuit with the visible button.
- Click or tap open arena ground to move. A waypoint persists until arrival, replacement or Return to auto.
- Click an enemy to target it. A target selection does not cancel a movement command.
- Focus the arena to use WASD/arrows. Escape pauses. Return to auto restores autonomous control.
- Choose one reward after each victory. Two repairs retry the current encounter with your build intact.
- Sound starts off. Use the Sound button to opt into sparse original mechanical tones. Mute remains in effect across new runs. No essential information depends on sound.

## Presentation

Open `presentation.html` for the five-slide development presentation. Use the visible Previous/Next buttons or arrow keys. Home/End jump to the first/last slide. Browser printing includes all five slides. Screenshots are labeled development captures and final delivery links remain pending.

## Structure

`src/sim.js` is the one production simulation shared by browser and Node tests. It uses fixed steps, one committed movement update, independent target/waypoint state, and swept projectile collision. `src/render.js` draws original geometric artwork without owning gameplay state. `src/main.js` binds real controls and menus to the simulation. Browser diagnostics provide read-only snapshots, not state injection.

## Provenance

All game code, robot drawings, visual layout, synthesized sounds and writing in this repository are newly created for this project. No earlier BattleBrotts source, assets or studio infrastructure is included. System fonts only. No third-party runtime assets or packages. See `ASSETS.md` for artwork and screenshot provenance and `LICENSE` for reuse terms.
