# Nebula Command

A browser RTS economy prototype: main base, compact robot gatherers, ore, lumber, production queue, and standard RTS selection behavior.

Playable web build, once GitHub Pages finishes deploying: `https://jhacksman.github.io/nebula-command/`

## Run

Open `index.html` in a browser, or run a local static server:

```bash
npm install
npm run start
```

Then open `http://localhost:4173`.

## Development

```bash
npm run check
npm run smoke
```

- `npm run check` syntax-checks the browser game, static server, and smoke test.
- `npm run smoke` launches the game in Chromium and checks the current critical interactions.

## Current Slice

- One landed main base, 50 starting resources, and one deployed cartbot for the playable slice.
- Gatherer bots use two wheels, top grippers, and a compact two-basket cart body.
- Bots gather ore or lumber, return to the main base, and repeat.
- Ore and lumber can be exported through the main base for offsite brain chips.
- Imported brain chips install better cartbot brains: Route Brains move/gather faster, Builder Brains carry more and construct faster.
- The main base can toggle auto-export so brain-chip shipments keep flowing once the local economy can afford them.
- The main base fabricates more bots, reserves worker capacity for queued bots, and can cancel the newest queued bot for a full refund.
- The main base can rally new bots to ground or directly to an ore/lumber node.
- Gatherers automatically retarget to the nearest same-type resource when their current node is exhausted.
- Hex tiles anchor the base footprint, one-hex Battery Banks, resources, and training dummies.
- Cartbot paths avoid resource hexes and building footprints; cartbots may stack on other cartbots.
- The main base provides 10 worker capacity. Completed Battery Banks cost 75 ore / 25 lumber, have 150 HP, occupy one hex, and add +10 worker capacity.
- Cartbots can queue multiple Battery Bank build jobs and complete them in order.
- Right-clicking an unfinished building with a Cartbot selected resumes construction from its current progress.
- The map is larger, with nearby starter deposits and farther ore/lumber clusters with varied compositions.
- Resource nodes can be selected to inspect remaining amount, hex location, assigned cartbots, and composition percentages.
- The bottom HUD shows worker management counts for idle, ore, lumber, returning, building, recon, and combat.
- The command panel shows cartbot brain/order state, base queue progress, resource surveys, and dummy HP.
- Cartbots can attack 100 HP training dummies for 1 damage every 0.8 seconds.
- Drag-select, shift-select, double-click same-type visible selection, right-click move/gather/deposit, rally point, minimap jump, mouse wheel/pinch zoom, Space alert focus, and camera pan.
- Camera panning is HUD-aware, so the right and bottom map edges can scroll into the visible play area instead of hiding under menus.
- HUD and minimap hover are isolated from battlefield edge scroll, so bottom menu interactions do not drag the map.
- No ships, enemies, combat units, aliens, or tech tree yet. This is the worker-economy foundation.

## Controls

- Left click: select.
- Drag: box select.
- Shift + left click: add/remove selection.
- Double click a bot: select all visible gatherer bots.
- Right click: move, gather, deposit, or set the main base rally.
- A: attack command mode.
- G: gather command mode.
- R: recon route command mode.
- B: build Battery Bank placement mode.
- T: queue an export shipment when the main base is selected.
- O: toggle auto-export when the main base is selected.
- I: install the next brain tier into selected cartbots when affordable.
- S: stop selected bots.
- Ctrl+1 through Ctrl+9: save selected units only.
- 1 through 9: recall a saved control group.
- Mouse wheel or touchpad pinch: cursor-anchored zoom.
- Space: jump to the most recent world alert.
- Edge/arrow keys: pan camera.
- Esc: clear selection.

## Possible Next Gameplay Pass

- Add Lumber Yard and Ore Refinery as the first local processing buildings.
- Add processed materials and explicit milestone unlocks for the offsite brain economy.
- Add dropoff buildings and richer placement rules.
- Add combat only after the economy and Satisfactory-like tech progression work.
