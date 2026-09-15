# BattleBrotts Reborn

An original small real-time robot auto-battler. Watch Pip fight, choose equipment, and give optional movement or target commands.

## The complete compact campaign

Four regular encounters and one boss, one starter, two equipment directions and eight upgrades. Both directions have completed real browser campaigns. Original opt-in audio, numerical reward previews, mobile controls and two repair attempts are implemented and browser-checked. A five-slide presentation and actual captioned gameplay recording accompany the game.

- [Play the game](https://brotatotes.github.io/battlebrotts-reborn/)
- [Five-slide presentation](https://brotatotes.github.io/battlebrotts-reborn/presentation.html) and [PDF](https://brotatotes.github.io/battlebrotts-reborn/media/battlebrotts-presentation.pdf)
- [Actual captioned gameplay demo](https://brotatotes.github.io/battlebrotts-reborn/demo.html)
- [Runnable download and checksums](https://github.com/brotatotes/battlebrotts-reborn/releases/latest)

The release archive includes both source and the built site. Its `SOURCE.json` identifies the exact source commit. Serve its `dist` folder with the command below to play without Node.js, or rebuild with Node.js. `npm run package` creates the same deterministic source-and-site ZIP for a clean source checkout.

Testing and independent critical review are agent-only, not human playtesting. Browser coverage uses Chromium and emulated desktop/tablet/phone viewports, not physical-device or Safari certification. Passing tests cannot establish universal balance or enjoyment.

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

Open `presentation.html` for the five-slide presentation. Use the visible Previous/Next buttons or arrow keys. Home/End jump to the first/last slide. Download `media/battlebrotts-presentation.pdf` for all five slides. `demo.html` plays the actual captioned gameplay recording and includes a transcript, MP4 and caption downloads. The recording uses labeled time cuts from one ordinary-controls run, not a promotional animation.

## Structure

`src/sim.js` is the one production simulation shared by browser and Node tests. It uses fixed steps, one committed movement update, independent target/waypoint state, and swept projectile collision. `src/render.js` draws original geometric artwork without owning gameplay state. `src/main.js` binds real controls and menus to the simulation. Browser diagnostics provide read-only snapshots, not state injection.

## Provenance

All game code, robot drawings, visual layout, synthesized sounds and writing in this repository are newly created for this project. No earlier BattleBrotts source, assets or studio infrastructure is included. System fonts only. No third-party runtime assets or packages. See `ASSETS.md` for artwork and screenshot provenance and `LICENSE` for reuse terms.
