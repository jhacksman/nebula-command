# Nebula Command Design Reset

## High-Level Pitch

Nebula Command is a classic real-time strategy game with the long-form industrial progression of a factory automation game.

Moment to moment, it plays like a traditional RTS: select workers, gather resources, build a base, manage production, expand, defend, and command units in real time.

Long term, its tech tree behaves more like Satisfactory: the player does not simply buy isolated upgrades. They build an industrial base, unlock production tiers, create material chains, and turn raw resources into increasingly advanced capabilities.

Short version:

> A grounded RTS where your army is the visible output of an expanding industrial machine.

## Starting Premise

The game begins with a landing.

The player's main base drops from orbit and deploys on a planet surface. The first setting is Earth. Later maps can move to the Moon, Mars, asteroids, exoplanets, or alien worlds, but Earth is the starting baseline because its resources are immediately readable: ore, lumber, terrain, and familiar environmental rules.

Opening fantasy:

1. A main base lands.
2. The base has a small starter reserve of raw resources.
3. The base fabricates compact gatherer robots called cartbots.
4. Cartbots harvest nearby ore and wood.
5. The base uses those resources to fabricate more cartbots and bootstrap the first production chain.

This makes the main base feel like a landed industrial seed, not just a generic RTS town hall.

## Cartbot Worker Concept

The first worker unit is a compact robot gatherer, not a humanoid worker and not a ship.

Working name: Cartbot.

Core silhouette:

- Compact body shaped like a two-basket-high shopping cart.
- Two side wheels.
- Two grippers or manipulator arms mounted on top/front.
- Small sensor head or status light.
- Basket/cart body visibly carries ore chunks, logs, or refined parts.

Design intent:

- It should read as practical, cheap, and mass-producible.
- It should feel like something a landed base can fabricate quickly.
- It should be cute enough to be readable, but still industrial.
- It should look like it gathers, hauls, and deposits physical materials.

The current prototype draws this directly in canvas: two side wheels, upper grippers, a compact two-basket cart body, and a small sensor section. If we later replace it with a sprite or 3D asset, that silhouette should remain.

## Design Promise

The game should combine two pleasures:

- RTS pressure: quick decisions, spatial control, worker management, production queues, and tactical response.
- Factory progression: satisfying unlock tiers, production dependencies, resource refinement, and long-term base optimization.

The player fantasy is not just "I command units." It is:

> I bootstrap an outpost into an industrial war machine.

## Goal

Build a clean browser RTS foundation before adding armies, aliens, bugs, ships, full tech trees, or spectacle.

The first version should feel like the opening minute of a classic RTS:

1. You start with one main base building.
2. The main base has landed on Earth with 50 starting raw resources.
3. The base can fabricate its first cartbot.
4. Cartbots can gather ore or lumber.
5. The base can queue more cartbots.
6. Selection and basic commands behave the way RTS players expect.

No ships in this pass. No squads. No enemies. No alien dynamics. Training dummies are allowed as passive test targets so worker attack/recon commands can be verified without turning the game into a combat sandbox.

## Current Playable Version

The current browser demo is the worker-management slice.

- Start on Earth with one landed main base, 50 ore, and one deployed cartbot.
- The map uses a hex tile system: the main base occupies a multi-hex footprint, each resource node occupies one hex, and each training dummy occupies one hex.
- Cartbots gather ore or lumber, return to the main base, deposit, then loop until redirected or the node empties.
- Resource nodes are inspectable and expose early survey composition percentages such as iron, copper, silica, cellulose, carbon, resin, and trace material.
- The command panel shows selected-object details: cartbot brain/order state, base queue progress, resource composition and assignment count, or dummy HP.
- The bottom HUD tracks worker assignment counts: idle, ore, lumber, returning, building, recon, and combat.
- Standard RTS controls are in: left click, drag select, shift select, double click same-type visible selection, right-click smart commands, hotkey command modes, and control groups.
- Training dummies have 100 HP and do not fight back. Cartbots deal 1 damage every 0.8 seconds, which makes them command-test workers, not soldiers.
- The main base queue supports canceling the newest queued Cartbot for a full resource refund and immediate worker-capacity release.
- Main base rally supports both ground rally and resource rally. Resource-rallied Cartbots start gathering that ore or lumber as soon as they spawn.
- Gatherers whose assigned resource empties automatically retarget to the nearest available resource node of the same type.
- The map is expanded to a larger Earth landing zone with starter deposits and farther ore/lumber clusters with varied compositions.
- Worker capacity is active: the main base provides 10, queued and completed Cartbots reserve capacity, and completed Battery Banks add +10 each.
- Battery Banks are the first worker-built structure: 1 hex, 150 HP, 75 ore / 25 lumber, 10 second build time, invalid on occupied static hexes.
- Cartbots can queue multiple build jobs and complete them in order.
- Right-clicking an unfinished worker-built structure with a Cartbot selected resumes construction from its existing progress.

## Long-Term Game Shape

The first MVP is intentionally tiny, but it should point toward this eventual structure.

### Early Game

- Start with a landed main base and starter resources.
- Fabricate the first cartbot.
- Gather raw ore and lumber.
- Queue more cartbots.
- Build basic structures.
- Establish a stable economy.

This phase should feel like a clean classic RTS opening.

### Mid Game

- Add production buildings that refine raw materials.
- Ore becomes plates, gears, ammo, machinery, or electronics.
- Lumber becomes planks, frames, biofuel, scaffolding, or utility parts.
- Buildings require processed materials, not only raw resources.
- The player starts balancing worker allocation, processing capacity, and production queues.

This phase starts to feel like a factory game layered into RTS control.

### Late Game

- Unlock advanced tiers through milestones.
- Build logistics systems and specialized production chains.
- Produce advanced units, defenses, vehicles, aircraft, or faction-specific tech.
- Expand to resource outposts.
- Defend industrial lines and production hubs.

This phase should feel like commanding a strategic industrial ecosystem, not only an army blob.

## Satisfactory-Like Tech Tree Direction

The tech tree should not be a flat list of upgrades. It should be a set of industrial milestones that require the player to produce and deliver specific goods.

### Milestones

Each tier unlock should require a delivery package, for example:

- Tier 1: 100 ore, 60 lumber.
- Tier 2: 80 plates, 40 planks.
- Tier 3: 60 gears, 30 reinforced frames.
- Tier 4: 40 circuits, 20 power cells.

The exact names can change, but the important design choice is this:

> Unlocks are earned by building production capacity, not by waiting on a timer.

### Recipes

Resources should move from raw to processed:

- Ore -> plates.
- Ore -> gears.
- Lumber -> planks.
- Lumber + plates -> frames.
- Plates + gears -> machinery.
- Later resources -> electronics, fuel, advanced materials.

These recipes create meaningful economic decisions:

- Do I spend raw resources on more cartbots now?
- Do I process ore into plates for tech?
- Do I stockpile lumber for buildings?
- Do I divert production to unlock the next tier?

### Buildings

Long-term economy buildings can include:

- Main Base: cartbot fabrication, deposits, milestones.
- Lumber Yard: improves lumber dropoff and processing.
- Ore Refinery: turns ore into plates.
- Workshop: turns plates/lumber into basic components.
- Assembly Plant: creates advanced components.
- Power Plant: unlocks powered buildings.
- Depot: stores and routes materials.

The first playable pass does not need these yet. But the code should avoid assumptions that every cost is only raw ore and lumber.

### Logistics

Satisfactory-like depth does not mean the first version needs belts.

Possible staged approach:

1. Manual worker hauling: Gatherer Bots gather and deposit raw resources.
2. Dropoff buildings: shorten worker routes and create expansion decisions.
3. Processing queues: buildings convert materials over time.
4. Route automation: carts, drones, belts, pipes, or abstracted supply links.
5. Vulnerable logistics: enemies can threaten production, not just bases.

This keeps the first browser version achievable while leaving a path to the larger pitch.

### Tech Unlock Philosophy

Good unlocks should do one of four things:

- Open a new resource.
- Open a new recipe.
- Open a new building.
- Open a new strategic capability.

Avoid upgrades that are just invisible percentage bumps unless they change a decision.

Good examples:

- Unlock Lumber Yard: Gatherer Bots can drop lumber closer to forests.
- Unlock Refinery: ore can become plates.
- Unlock Workshop: plates and lumber can become frames.
- Unlock Survey Tower: reveals distant resource deposits.
- Unlock Logistics Cart: automates a route between two buildings.

Weak examples:

- Gatherer Bots gather 5% faster.
- Base has 10% more health.
- Units do 3% more damage.

Those can exist later, but they should not carry the tech tree.

## Genre Positioning

This should be described internally as:

- RTS control layer.
- Factory progression layer.
- Base-building economy layer.

The RTS layer gives urgency and spatial tactics.

The factory layer gives long-term goals and satisfying optimization.

The base-building layer connects them: your structures and production chains create the army, defenses, and tools you command.

## First MVP Relationship To The Pitch

The MVP should not try to implement the full tech tree.

The MVP should prove the first brick of the pitch:

- A Gatherer Bot can gather raw materials.
- A base can queue production.
- Resources are clear and useful.
- Selection and command grammar feels like an RTS.

After that works, the next milestone is not combat. The next milestone should probably be:

1. Add Lumber Yard.
2. Add Ore Refinery.
3. Add one processed material, such as plates.
4. Add one milestone unlock that requires delivered materials.

That sequence makes the game more like the pitch before it becomes a combat sandbox.

## Product Feel

The game should read as a grounded management game first.

- Units are small ground workers, not spacecraft.
- The base is a visible, central structure with a clear footprint.
- Ore and lumber are separate resource types with distinct map objects.
- The player should understand the loop by looking at the screen: landed base, cartbot, ore, lumber, fabrication queue.
- Every interaction should produce immediate visual feedback.

## Design Pillars

These choices should guide implementation whenever there is ambiguity.

### Readability Before Realism

The player must be able to identify a cartbot, landed base, ore patch, lumber grove, selection state, carried load, and command target instantly.

- Silhouettes matter more than decorative detail.
- Resource colors stay consistent everywhere:
  - Ore: blue-gray / cyan.
  - Lumber: warm brown / green.
  - Player selection: bright teal.
- Units should never visually disappear under the HUD, buildings, or resource nodes.
- The game should be readable at default zoom without needing to zoom in.

### Predictable RTS Grammar

The same mouse actions should always mean the same category of thing.

- Left click answers: "What am I selecting?"
- Left drag answers: "Which of my units am I selecting?"
- Double click answers: "Select all visible units like this."
- Right click answers: "Do the most obvious useful action here."
- Command buttons are for explicit actions like Fabricate Bot.

### Management First

The first fun should come from deciding what workers do and when to queue more workers.

- A player with one cartbot should immediately understand the loop.
- A player with three cartbots should start making allocation choices.
- The game should not need combat to be interesting at the MVP level.

### Fast Feedback

Every command should produce visible confirmation within one frame.

- Selection rings appear immediately.
- Commanded cartbots briefly flash or show a small order marker.
- Resource nodes show a subtle hit/gather pulse.
- The base queue shows progress immediately after clicking Fabricate Bot.
- Invalid commands show a short alert near the command panel or cursor.

### Low Friction, High Control

The player should feel that units obey cleanly.

- Cartbots may stack on one another in the current slice; avoiding static blockers matters more than unit-unit spacing right now.
- Cartbots should not jitter around the base.
- Redirecting a cartbot should cancel its previous gather loop cleanly.
- Box selection should feel generous, not pixel-perfect.
- The camera should never fight basic selection.

### Extensible Foundation

The first slice should be small, but built in a way that later supports buildings, combat, AI, and factions.

- Unit/building/resource definitions should be data-driven.
- Orders should be explicit state machines, not scattered flags.
- Renderer, input, simulation, and UI update logic should remain separable.
- Alien/bug dynamics should be addable later without rewriting cartbot economy.

## Core Game Loop

The first playable loop:

1. Select cartbot.
2. Right click ore or lumber.
3. Cartbot gathers a load.
4. Cartbot returns to main base.
5. Resource count increases.
6. Select base.
7. Queue another cartbot.
8. Assign multiple cartbots across ore and lumber.

This is the foundation loop. Later loops can add supply, buildings, map expansion, combat, upgrades, scouting, and enemy pressure.

## First-Balance Decisions

These numbers are not final balance; they are starter values chosen to make the economy readable.

### Starting State

- Main Base: 1.
- Cartbot: 0 or 1 depending on tutorial pacing.
- Starting raw resources: 50.
- Starting lumber: 0.
- Cartbot cost: 50 raw resources.
- Cartbot fabrication time: 8 seconds.

Reasoning:

- The landed base has just enough material to fabricate the first cartbot.
- This makes fabrication the first deliberate action if we start with 0 cartbots.
- If we start with 1 cartbot for a faster prototype, the fiction is that it deployed from the base during landing.
- Lumber is learned after the player has at least one cartbot operating.

### Gathering

- Cartbot carry capacity: 10 ore/raw resource or 10 lumber.
- Gather time per load: 1.4 seconds in the browser slice so the first economy loop proves itself quickly.
- Deposit time: instant once the cartbot reaches the base.
- Cartbots continue the same gather route until redirected or the node is empty.
- Ore and lumber use the same mechanical rules at first, with different visuals.

Reasoning:

- Matching rules make the economy easy to understand.
- Different visuals make the resource choice obvious.
- Later, lumber can become slower or spatially messier if we want more depth.

## Resource Model

The early economy has two visible resource categories:

- Raw resources: initially represented by ore.
- Lumber: harvested from trees/wood sources.

The term "resources" should not stay vague forever. In the long-term design, raw resource deposits have composition.

### Raw Resource Deposits

A mining/resource node can contain a mix of elements or materials.

Example ore deposit:

- 70% iron-bearing ore.
- 20% copper-bearing ore.
- 8% silica/stone.
- 2% trace rare metal.

Another deposit might be:

- 45% copper-bearing ore.
- 35% iron-bearing ore.
- 15% nickel-bearing ore.
- 5% trace rare metal.

At the start, the player may only see a simple "Ore" or "Raw Resources" label. Later tech can reveal exact composition percentages through scanning, surveying, or lab analysis.

### Refinement Direction

Raw resources can later refine into elemental or processed parts.

Possible flow:

- Raw ore -> iron.
- Raw ore -> copper.
- Raw ore -> stone/silica.
- Raw ore -> trace metals.
- Iron -> plates.
- Copper -> wire.
- Lumber -> planks.
- Iron + lumber -> frames.
- Copper + iron -> basic circuits or motors.

The important design choice:

> A deposit is not just a pile of one generic resource. It is a material source with composition, and better tech lets the player exploit that composition more precisely.

### Why Composition Matters

Composition creates richer RTS/factory decisions:

- Which nearby deposit should I mine first?
- Do I expand toward high-iron ore or high-copper ore?
- Do I need wood now, or refined plates?
- Is a low-grade deposit still useful because it contains rare traces?
- Should I build a refinery near the deposit or haul raw ore home?

This supports the Satisfactory-like tech tree without requiring belts or full automation in the first pass.

### Resource Nodes

- Nearby ore patch: enough for several Gatherer Bots to mine.
- Nearby lumber grove: enough for several Gatherer Bots to chop.
- Nodes visibly deplete.
- Empty nodes remain as depleted stumps/rock rubble for player memory.

Reasoning:

- Keeping depleted remains helps the player understand what happened.
- It also establishes a later path toward expansion pressure.

## Spatial Design

The map should teach the economy.

### Opening Layout

- Main base starts near the left-center of the playable area.
- Ore is slightly closer to the base than lumber.
- Lumber is offset in a separate direction so the player learns resource splitting.
- There is enough empty space around the landed base for cartbot spawning and future buildings.

### Scale

- Main Base footprint: large and unmistakably landed/deployed.
- Cartbot footprint: small but not tiny.
- Ore patch: chunky and clickable.
- Lumber grove: larger than one tree, clickable as a whole.
- Selection rectangle should use screen-space coordinates, while selection tests use world-space bounds.

### Future-Proofing

- Reserve open space for later building placement.
- Reserve outer map regions for later expansions.
- Do not place future enemy pressure in the first economy MVP.

## Visual Design Choices

### Art Direction

The first pass can use clean canvas-drawn placeholders if open ground-worker assets are not good enough.

Preferred direction:

- Cartbot: compact top-down utility robot with two side wheels, two upper grippers, and a two-basket-high shopping-cart body.
- Main Base: chunky frontier command hall, town-center-like, not a spaceship.
- Ore: blue-gray rocks or crystals embedded in the ground.
- Lumber: trees, stumps, or stacked logs.

The art can be simple, but the silhouettes must be strong.

### Animation Standards

The MVP should include simple state animation:

- Idle: subtle breathing/bob.
- Moving: step/walk cycle or tool sway.
- Gathering ore: short tool swing or mining pulse.
- Gathering lumber: chopping motion or tree shake.
- Carrying: visible ore chunk or log bundle.
- Depositing: quick resource sparkle at base.

The animation can be procedural canvas drawing. It does not need sprite sheets yet.

## UI Design Choices

### Top HUD

Show only what matters:

- Ore.
- Lumber.
- Optional population later.

Do not show combat stats, faction lore, minimap clutter, or extra resources in the first pass.

### Selection Panel

Single selected cartbot:

- Name: Cartbot or Gatherer Bot.
- State: Idle, Moving, Gathering Ore, Gathering Lumber, Returning.
- Carried resource, if any.

Single selected base:

- Name: Main Base.
- Queue list.
- Current production progress.
- Fabricate Bot button.

Multiple selected cartbots:

- Count: "3 Cartbots" or "3 Gatherer Bots".
- Aggregate state summary can come later.
- Commands should still work from right click, even without buttons.

### Command Card

The first pass needs very few command buttons:

- Main Base: Fabricate Bot.
- Cartbot: Stop can exist, but movement/gathering should mostly use right click.

Buttons must disable when unaffordable and explain the missing resource in a short tooltip or alert.

### Cursor And Order Feedback

Well-designed RTS games communicate the right-click action before or immediately after input.

Minimum version:

- Hovering ore can slightly outline the ore patch.
- Hovering lumber can slightly outline the grove.
- Right clicking creates a small marker:
  - Move: teal ring on ground.
  - Ore: blue pulse on ore patch.
  - Lumber: brown/green pulse on grove.
  - Deposit/base: teal pulse at base.

## Input Edge Cases

These details matter because they make the game feel fair.

- Clicking a selected unit should not accidentally issue a move.
- Drag threshold should prevent tiny accidental selection boxes.
- Double click should not also leave a weird partial single-selection state.
- Double-click same-type selection should be limited to owned visible units on screen, not the whole map.
- Shift-box selection can come later; shift-click is enough for the MVP.
- Right-clicking with no selected cartbots should do nothing except maybe clear a pending command mode.
- Right-clicking a resource with a base selected should set rally later, but for now can do nothing.

## Unit Behavior Choices

### Cartbot Order State Machine

Cartbot orders should be explicit:

- idle
- move
- gather_resource
- return_resource
- deposit

Gather order data:

- resource node id.
- resource type.
- dropoff building id.
- loop enabled.

This avoids bugs where a cartbot carries ore to a tree, gathers from an empty node forever, or forgets what resource it was assigned to.

### Movement

The first pass originally used simple direct movement with soft separation. That is no longer enough for the gather loop because resource nodes and the main base now have real hex occupancy.

Requirements:

- Cartbots can stack with other cartbots in this slice.
- Cartbots should stop on walkable hexes near their target, not on static-object hexes.
- Cartbots must not occupy resource hexes.
- Cartbots must not occupy the main base footprint.
- Cartbots must not occupy future building footprints.
- Multiple cartbots are allowed to overlap or stack on one another for now. Unit-on-unit collision is not part of the blocker model yet.

Non-goals for the current pathing fix:

- Unit-on-unit path blocking.
- Collision-perfect formations.
- Advanced terrain costs.
- Full building placement.

### Mining And Static Occupancy Fix Plan

The intermittent mining stoppage appears to come from two connected implementation problems:

- Gather paths are partially visual. The bot often moves directly toward the resource center or base center instead of following the displayed hex route.
- The target hexes for gather and deposit are occupied static-object hexes. A resource node owns its hex, and the main base owns a multi-hex footprint, but cartbots were still trying to resolve movement against points inside those occupied spaces.

That creates fragile state transitions. A bot can be "close enough" to gather or deposit on one cycle, then be pushed or offset slightly differently on another cycle and appear to stall while collecting or returning.

The fix should introduce a clear occupancy model:

- Static blockers:
  - resource node hexes.
  - main base footprint hexes.
  - future building footprint hexes.
- Non-blockers:
  - cartbots.
  - other friendly units.
  - temporary order markers.

Unit stacking is acceptable in this slice. Soft separation can remain as a visual nicety, but it must never be used by the pathfinder as a blocking rule.

#### Resource Approach Rule

A cartbot assigned to a resource does not path to the resource hex.

Instead:

1. The gather command stores the resource node id.
2. The command chooses a walkable approach hex adjacent to the resource hex.
3. The cartbot paths to that approach hex.
4. When the cartbot reaches the approach hex, it gathers from the adjacent resource.
5. The cartbot never enters the resource hex.

Multiple cartbots can share the same approach hex if needed. Later we can distribute them across several adjacent approach hexes for readability, but that distribution is not required for correctness.

#### Base Dropoff Rule

A cartbot returning resources does not path to the main base center.

Instead:

1. The gather command stores the dropoff building id.
2. The command chooses a walkable dropoff hex adjacent to the building footprint.
3. The cartbot paths to that dropoff hex.
4. When the cartbot reaches that dropoff hex, the carried resource is deposited instantly.
5. If the resource node still has material, the cartbot paths back to the stored resource approach hex and repeats.

The dropoff hex is outside the building footprint. The cartbot never enters the main base footprint.

#### Hex Pathfinding Rule

Movement should use hex paths for actual simulation, not only for drawing.

Path rules:

- Use axial hex coordinates.
- Use six-neighbor movement.
- Exclude static blocker hexes.
- Allow the starting hex even if a legacy state places a cartbot in a blocked hex, then route it out.
- Do not treat other cartbots as blockers.
- If the clicked destination is blocked, resolve to the nearest walkable hex beside it.
- If no path is found, keep the current order and retry/replan briefly instead of silently idling.

Implementation can use breadth-first search or A*. The map is small enough that either is fine. A* is preferred because it will scale better once we add more buildings and terrain.

#### Gather Order Data

A gather order should explicitly store:

- resource node id.
- resource type.
- resource approach hex.
- dropoff building id.
- dropoff approach hex.
- current phase:
  - toResource
  - gathering
  - returning
- current path and path index.

The order should not depend on recalculating "am I close enough to the resource center/base center" every cycle. Reaching the correct approach/dropoff hex should drive the state transition.

#### Replan Conditions

The bot should replan rather than stop when:

- its current path is empty but its order is still valid.
- the bot is pushed off the expected hex.
- the destination approach hex becomes blocked by a new static object later.
- the bot starts a phase from a different hex than expected.

The bot should stop only when:

- the resource node is depleted and it is not carrying a final load.
- the carried final load has been deposited and the resource node is depleted.
- the dropoff building no longer exists.
- the player gives a new order or presses Stop.

#### Verification Plan

The browser smoke test for this fix should cover:

- One cartbot gathers ore for at least five full deposit cycles without stopping.
- Two cartbots gather the same ore node for at least five full deposit cycles without stopping.
- A cartbot gathering lumber follows the same approach/dropoff rules.
- During gather and return, no cartbot's current hex equals a resource hex.
- During gather and return, no cartbot's current hex is inside the main base footprint.
- A right-click move onto a resource hex resolves to a nearby walkable hex unless it is a gather command.
- A right-click move onto the main base footprint resolves to a nearby walkable hex unless it is a deposit command.
- Recon/move paths route around resource hexes and the main base footprint.
- Control groups and double-click selection still work after the pathing change.

### Multi-Unit Orders

When several cartbots are sent to one target:

- They receive small offset positions around the target.
- Gatherers can share a resource node.
- Return paths should not require precise collision.

## Production Queue Choices

The main base should behave like a real RTS production building.

- Queue accepts multiple cartbots.
- Cost is paid on queue.
- Queue items finish in order.
- The visible progress bar tracks the first item.
- Canceling queued cartbots is supported in the current management pass.
- Spawn location should be near the base and not inside the building.
- If a spawn point is crowded, choose the nearest free offset.

### Implemented Pass: Management And Expansion

This pass adds five connected systems: worker queue canceling, resource rally, exhausted-resource retargeting, a larger map, and battery-bank worker capacity.

#### 1. Cancel Queued Cartbots

The main base production queue should support canceling queued cartbots.

Rules:

- Selecting the main base shows its production queue.
- If at least one cartbot is queued, the command card shows a Cancel Bot command.
- The first implementation can cancel the newest queued cartbot rather than a specific queue slot. This avoids extra UI complexity while still giving the player the important RTS correction tool.
- Canceling returns the full cost of the cartbot to the player.
- Canceling immediately frees the worker-capacity reservation for that queued cartbot.
- Canceling an empty queue does nothing except show a short alert.

Reasoning:

- Full refund is cleaner while the economy is small.
- Newest-item cancel is predictable and easy to test.
- Per-slot queue canceling can come later when the queue UI becomes more detailed.

Acceptance test:

- Queue two cartbots.
- Click Cancel Bot once.
- Ore increases by one cartbot cost.
- Queue length decreases by one.
- Worker capacity used decreases by one reserved worker.

#### 2. Resource Rally From Main Base

The main base should be able to rally new workers directly to a resource.

Rules:

- With the main base selected, right-clicking ground sets a ground rally point, as it does now.
- With the main base selected, right-clicking an ore or lumber node sets a resource rally.
- A resource rally stores:
  - rally type: resource.
  - resource node id.
  - resource type.
- Newly completed cartbots check the base rally on spawn.
- If the rally is a resource and the node still has material, the new cartbot immediately receives a gather order for that node.
- If the rally resource is exhausted by the time the cartbot spawns, the cartbot should gather the nearest available node of the same resource type.
- If no matching resource exists, the cartbot should spawn and idle near the base.

Visual/UI:

- Ground rally remains a simple marker/line.
- Resource rally should draw a line from the base to the resource approach hex and pulse the target resource.
- Base selection meta should say something like "Rally: Mixed Copper Vein" or "Rally: Ground q6 r4".

Acceptance test:

- Select main base.
- Right-click an ore node.
- Queue a cartbot.
- When the cartbot finishes, it starts gathering ore automatically without another command.

#### 3. Exhausted Resource Retargeting

Cartbots assigned to a resource should not stop just because their current node empties.

Rules:

- A gather order keeps the intended resource type.
- If the current node is depleted while the cartbot is not carrying a load, it finds the nearest available node of the same type.
- If the current node is depleted after the cartbot picks up the final load, it returns and deposits that load first.
- After depositing a final load, it finds the nearest available node of the same type.
- If no matching node with remaining resources exists, it idles and shows a short "No ore nearby" or "No lumber nearby" alert.
- Retargeting must use the same static-blocker pathing rules as normal gathering.

Nearest-resource scoring:

- Start with simple hex distance from the cartbot's current hex.
- Ignore depleted nodes.
- Ignore different resource types.
- Later, scoring can consider richness, composition, danger, or assigned worker count.

Acceptance test:

- Reduce one ore node to near-depleted.
- Assign a cartbot to it.
- Let it finish the node.
- Confirm it routes to the next nearest ore node instead of idling.

#### 4. Larger And More Diverse Map

The map should be expanded so worker management matters more.

Rules:

- Increase the world bounds enough that the minimap and camera have real value.
- Keep the starting base area readable and not overcrowded.
- Add more resource clusters with different compositions:
  - nearby basic iron-heavy ore.
  - nearby lumber.
  - farther copper-rich ore.
  - farther nickel/trace ore.
  - farther dense hardwood or resin-rich lumber.
- Leave open walkable corridors between clusters.
- Do not add enemies yet.
- Do not add fog of war yet.

Resource diversity:

- Nearby resource nodes should be simple and approachable.
- Farther resource nodes should have more interesting composition percentages.
- This points toward the Satisfactory-style tech tree without implementing refinement yet.

Acceptance test:

- Camera can reach the new outer resource clusters.
- Minimap shows the expanded resource spread.
- Pathfinding can route cartbots from base to distant resources without entering static-object hexes.

#### 5. Battery Banks And Worker Capacity

Battery Banks are the first worker-built structure.

Purpose:

- The main base starts with a worker capacity of 10.
- Each completed Battery Bank adds +10 worker capacity.
- Worker capacity limits cartbots, including queued cartbots.

Battery Bank definition:

- Building type: batteryBank.
- Footprint: 1 hex.
- HP: 150.
- Suggested cost: 75 ore and 25 lumber.
- Suggested build time: 10 seconds.
- Built by cartbots.

Capacity rules:

- Main base provides 10 worker capacity.
- Each completed Battery Bank provides +10 worker capacity.
- Existing cartbots count against capacity.
- Queued cartbots reserve capacity as soon as they are queued.
- If capacity is full, Fabricate Bot is disabled and shows a clear "Need Battery Bank" alert/tooltip.
- Canceling a queued cartbot releases its reserved capacity.

Build command rules:

- Selected cartbots get a Build Battery command.
- The first implementation can use hotkey B.
- Clicking Build Battery enters placement mode.
- Placement is valid only on a walkable, unoccupied static hex.
- Resource hexes, the main base footprint, existing building footprints, and future reserved building footprints are invalid.
- Once placed, the battery bank footprint becomes a static blocker immediately.
- The assigned cartbot paths to an adjacent build hex and builds over time.
- When complete, the Battery Bank has 150 HP and adds +10 worker capacity.

Simplifications for the first implementation:

- One cartbot builds one Battery Bank.
- Multiple cartbots do not speed construction yet.
- Canceling under-construction buildings can come later.
- Power simulation is not implemented yet; the battery bank is a capacity building for now.

UI:

- Top HUD should show worker capacity, for example "3/10 bots".
- Selecting a Battery Bank shows name, HP, and "+10 capacity".
- Selecting the main base shows current queue and capacity status.

Acceptance test:

- Starting capacity is 10.
- Queueing cartbots cannot exceed 10 used/reserved workers.
- Build one Battery Bank on a valid empty hex.
- Capacity becomes 20 after construction completes.
- Fabricate Bot becomes available again when capacity increases.

#### 6. Construction Orders And Resume Rules

Construction must behave like a standard RTS worker job, not like a one-shot animation.

Rules:

- Building placement creates an under-construction building immediately and reserves that hex as a static blocker.
- A Cartbot assigned to build uses a normal build order that targets the building id, not a special-case Battery Bank command.
- If a Cartbot already has a build order or queued build jobs, placing another building appends the new build job to that Cartbot's build queue.
- Build jobs complete in order: the Cartbot finishes the current foundation, then moves to the next queued foundation.
- If a Cartbot is redirected, stopped, or given another command, any unfinished building remains under construction with its current progress.
- Right-clicking an under-construction building with one or more Cartbots selected assigns them to resume construction.
- Resuming construction should use the same static-blocker pathing rules: the Cartbot stands on an adjacent walkable build hex and never enters the building footprint.
- This must be generic for every future worker-built building, not just Battery Banks.

Acceptance test:

- Select a Cartbot, place one Battery Bank, then place a second Battery Bank before the first finishes.
- The Cartbot completes the first Battery Bank, then automatically moves to and completes the second.
- Start a Battery Bank, redirect the Cartbot away before it completes, then select the Cartbot and right-click the partial Battery Bank.
- The Cartbot resumes construction from the existing build percentage and completes it.

## Sound Choices

Sound is optional for the first implementation, but the design should reserve hooks for it.

Good RTS feedback sounds:

- Select cartbot.
- Command accepted.
- Gather impact.
- Resource deposit.
- Production started.
- Unit ready.
- Cannot afford.

Sound should be quiet and functional, not cinematic.

## Accessibility And Usability

The MVP should avoid common usability traps.

- Do not require precise clicks on tiny units.
- Use high contrast for selection rings.
- Keep resource numbers legible.
- Avoid tiny command buttons.
- Avoid hidden keyboard-only commands.
- Do not rely on color alone where shape can help:
  - Ore looks like rocks/crystals.
  - Lumber looks like trees/logs.

## Technical Architecture Choices

### Data Model

Use data definitions for:

- unit types
- building types
- resource types
- command buttons
- costs
- gather rates
- train times

The simulation should read definitions rather than hard-coding cartbot behavior in many places.

### Systems

Keep the code organized around systems:

- Input system: mouse, keyboard, selection, double click detection.
- Command system: translates player intent into orders.
- Simulation system: updates orders, gathering, production, movement.
- Render system: draws world, entities, selection, order feedback.
- UI system: reflects current resources, selection, queue, and alerts.

### Debuggability

Add lightweight debugging affordances during development:

- A clear reset/restart path.
- Console-free normal operation.
- Optional debug overlay later for entity counts and selected ids.

### Browser Constraints

- Must run as a static browser project.
- No required build step.
- No required server for normal use, though localhost testing is fine.
- Open assets must be local and credited.

## Standard RTS Expectations

These are genre standards from games like Warcraft, StarCraft, Age of Empires, Command & Conquer, and similar RTS titles.

### Selection

- Left click selects one unit or structure.
- Left click empty ground clears selection.
- Left click drag draws a selection rectangle.
- Drag selection selects all owned units inside the rectangle.
- If both units and buildings are inside the box, units take priority.
- Shift click adds or removes a unit from the current selection.
- Double click on a unit selects all visible owned units of the same type currently on screen.
- Selected units have clear selection rings or outlines.
- Selected structures have a larger outline around their footprint.

### Commands

- Right click on ground orders selected cartbots to move.
- Right click on ore orders selected cartbots to gather ore/raw resources.
- Right click on trees/lumber orders selected cartbots to gather lumber.
- Right click on the main base while carrying resources orders deposit.
- If multiple cartbots receive one command, they may share the same path and target hex in this slice.
- Invalid commands should produce a short visible alert or cursor feedback.

### Economy

- Cartbots gather one resource type at a time.
- A cartbot rolls to a resource node, gathers, carries a visible load, returns to the base, deposits, then repeats.
- Ore and lumber should be displayed separately in the top HUD.
- Resource numbers should update only when cartbots deposit at the base.
- Resource nodes should visibly deplete over time.
- The player should be able to redirect a cartbot from ore to lumber or lumber to ore at any time.

### Production

- Selecting the main base shows a command button to fabricate a cartbot.
- Clicking Fabricate Bot spends resources immediately and adds one cartbot to the base production queue.
- The base shows queue progress.
- Multiple cartbots can be queued.
- Finished cartbots deploy near the base.
- A rally point is standard, but optional for the first code pass. If included, right clicking ground with the base selected sets the rally point.

### Camera

- The camera should pan with arrow keys and edge scrolling so A/G/R/S remain clean command hotkeys.
- Zoom can stay simple, but it must not make selection unreliable.
- The game should maintain a readable scale where cartbots, the landed base, ore, and trees are obvious.

### UI

- The top HUD shows only essential resources: ore, lumber, and population/supply if population exists.
- For the first pass, population can be omitted unless it is already needed for production limits.
- The command panel shows the selected object name, health if applicable, and available actions.
- Command buttons should be large enough to click and should use simple icons or clear silhouettes.
- The UI should not contain tutorial paragraphs inside the playfield.

## First Playable Scope

### Starting State

- One player-owned landed main base.
- One player-owned cartbot, or 50 starting resources to fabricate the first cartbot.
- At least one ore patch near the base.
- At least one lumber grove near the base.
- Starting resources:
  - Raw resources: 50.
  - Lumber: 0.

### Units

#### Cartbot / Gatherer Bot

Role: worker.

Abilities:

- Move.
- Gather ore.
- Gather lumber.
- Return carried resources to the main base.

Important visuals:

- Small grounded robot-cart silhouette: two wheels, top grippers, compact two-basket-high shopping cart body.
- Selection ring.
- Carry state:
  - Ore load should look blue/stone/metal.
  - Lumber load should look brown/log-like.

### Buildings

#### Main Base

Role: landed economy hub and cartbot fabrication.

Abilities:

- Accept deposited ore and lumber.
- Queue cartbots.
- Deploy completed cartbots.

Important visuals:

- Clear footprint.
- Health/progress bar if selected.
- Production queue indicator.

### Resources

#### Ore

- Map object: mine, crystal, rock, or ore patch.
- Gathered by cartbots.
- Depletes by amount gathered.
- Should not look like a power-up pickup.

#### Lumber

- Map object: trees or log piles.
- Gathered by cartbots.
- Depletes by amount gathered.
- Multiple trees can count as one grove for simplicity.

## Explicit Non-Goals For This Pass

- No ships.
- No aircraft.
- No hostile combat systems beyond passive training dummies.
- No enemies.
- No barracks.
- No turrets.
- No marines/rangers.
- No aliens or bugs.
- No tech tree.
- No fog of war.
- No multiplayer.

Those can come later after the worker loop feels good.

## Browser Implementation Plan

### Phase 1: Strip To Economy MVP

- Remove ship units from the starting game.
- Remove enemy base and enemy wave logic.
- Remove combat projectile logic from visible gameplay.
- Keep the canvas renderer and input system where useful.
- Replace the starting state with one base, one Gatherer Bot, ore, and lumber.

### Phase 2: Grounded Visual Rewrite

- Replace ship sprites with Gatherer Bot/base/resource art.
- If good open Gatherer Bot assets are not immediately available, draw readable canvas art:
  - Gatherer Bot: compact two-wheeled robot with top grippers and a two-basket cart body.
  - Base: chunky top-down town hall/command hut.
  - Ore: blue-gray rocks or crystals.
  - Lumber: trees/logs.
- Keep attribution for any downloaded open assets.

### Phase 3: Selection Standards

- Preserve left click single select.
- Preserve drag-box multi-select.
- Add double-click same-type visible selection.
- Ensure empty click clears selection.
- Ensure units take priority over buildings in drag selection.
- Add shift-click add/remove.

### Phase 4: Economy Behavior

- Implement Gatherer Bot gather states:
  - idle
  - moving to resource
  - gathering
  - returning to base
  - depositing
- Add visible carried resource.
- Add looped gather behavior until the node is empty or the Gatherer Bot is redirected.
- Make resource counts update on deposit.

### Phase 5: Production Queue

- Selecting the main base shows Fabricate Bot.
- Clicking Fabricate Bot spends resources and appends to queue.
- Queue progress appears on the base and/or command panel.
- Finished Gatherer Bots spawn beside the base.
- Multiple queued Gatherer Bots complete in order.

### Phase 6: Polish And Verification

- Desktop smoke test.
- Mobile/readability smoke test.
- Interaction test:
  - Select Gatherer Bot.
  - Gather ore.
  - Gather lumber.
  - Queue/fabricate Gatherer Bot.
  - Drag-select multiple Gatherer Bots.
  - Double-click select all visible Gatherer Bots.

## Acceptance Criteria

The pass is done only when all of this is true:

- The game opens in browser without console errors.
- The first screen shows a base, one Gatherer Bot, ore, and lumber.
- There are no ships visible.
- The Gatherer Bot can gather ore and deposit it.
- The Gatherer Bot can gather lumber and deposit it.
- The main base can queue at least one Gatherer Bot.
- Production consumes resources and completes after a short timer.
- Left click select works.
- Drag-select multiple Gatherer Bots works.
- Double-click selects all visible Gatherer Bots of the same type.
- The UI clearly shows ore and lumber.
- Resource nodes can be selected and inspected for remaining amount, hex, assigned cartbots, and composition percentages.
- The bottom HUD shows worker assignment counts for idle, ore, lumber, returning, recon, and combat.
- Ctrl+1 through Ctrl+9 saves selected cartbots as control groups, and number keys recall them.
- A, G, R, and S work as attack, gather, recon/patrol, and stop command hotkeys.
- Training dummies have 100 HP, do not fight back, and let cartbot attack timing be tested.

## Management Pass Acceptance Criteria

The management pass is done only when all of this is true:

- Queued cartbots can be canceled from the main base.
- Canceling a queued cartbot refunds its full cost.
- Canceling a queued cartbot releases reserved worker capacity.
- Main base resource rally works: right-clicking a resource with the base selected causes newly built cartbots to gather that resource.
- If a rallied resource is exhausted before spawn, the new cartbot picks the nearest available resource of the same type.
- Gatherers whose current node depletes automatically route to the nearest available node of the same type.
- If no same-type resource remains, the gatherer idles with a clear alert.
- The map is larger and contains more varied ore/lumber clusters.
- Static-object pathing still prevents cartbots from occupying resource hexes or building footprints.
- The main base provides 10 worker capacity.
- Each completed Battery Bank adds +10 worker capacity.
- Queued and completed cartbots count against worker capacity.
- Workers can build a one-hex Battery Bank with 150 HP.
- Battery Bank placement is invalid on resources, the main base footprint, or other building footprints.
- A Cartbot can queue multiple Battery Bank foundations and complete them in placement order.
- A stopped or redirected Cartbot can resume a partial Battery Bank by right-clicking the unfinished building.

## Navigation And Alert Focus Pass

This pass fixes the HUD/minimap camera leak and makes the browser controls feel closer to a good RTS on a laptop trackpad.

### Current Problem

- Edge scrolling reads the last canvas mouse position.
- The HUD and minimap sit above the canvas, so moving into the lower HUD can leave the last canvas position near the bottom edge.
- That stale position can keep scrolling the world down while the player is trying to use the minimap or bottom command area.
- Minimap input should be its own control surface, never a hidden command to the main map.

### Input Ownership

- The battlefield canvas owns selection, drag selection, right-click orders, command placement, edge scrolling, and battlefield zoom.
- The top HUD, command panel, bottom HUD, and minimap own their own clicks, hover, and wheel events.
- Hovering or interacting with any HUD element must pause pointer-driven edge scrolling.
- Arrow-key camera panning remains active unless a text input or future chat/control field has keyboard focus.
- Screen-to-world command conversion should only happen for canvas-originated map commands, not HUD interactions.

### Pointer And Edge Scroll Rules

- Track pointer state explicitly:
  - screen position
  - world position
  - whether the pointer is over the canvas battlefield
  - whether the pointer is over HUD
  - whether the pointer is over the minimap
- Edge scroll can run only when all of this is true:
  - the pointer is over the battlefield canvas
  - the pointer is inside the current camera safe rectangle
  - the pointer is not over top HUD, command panel, bottom HUD, tooltip, or minimap
  - a modal/placement-cancel UI is not consuming the pointer
- Edge scroll margins should use the HUD-aware `cameraSafeScreenRect()` edges, not the raw browser viewport edges.
- Drag selection may still edge-scroll when the pointer is dragged near the visible battlefield edge, but it must stop the instant the pointer enters HUD or minimap space.
- Minimap clicks and future minimap drags should center or pan the camera through a dedicated minimap handler, then stop propagation.

### Touchpad And Zoom Rules

- Battlefield wheel and pinch gestures zoom the camera around the cursor location.
- The world point under the cursor before zoom should remain under the cursor after zoom.
- Use smooth exponential zoom scaling from wheel delta instead of fixed large steps, so trackpads and mouse wheels both feel controlled.
- Browser pinch events that arrive as `wheel` plus `ctrlKey` use the same cursor-anchored zoom path.
- Wheel or pinch events over HUD/minimap should not zoom or scroll the battlefield.
- The page itself should never scroll during gameplay; the game consumes valid battlefield navigation events.
- Zoom must clamp to readable limits and call the same HUD-aware camera clamp used by normal panning.

### Alert Focus Rules

- Add a world-alert helper for important events with a map position, such as future unit-under-attack or building-under-attack events.
- A world alert should:
  - show the existing alert text in the HUD
  - store a recent alert camera target
  - add a minimap ping at the alert world position
- Space bar centers the camera on the most recent important world alert.
- Repeated Space presses can cycle through recent active alerts if multiple alerts arrive close together.
- Space should prevent browser page scrolling and should be ignored while a text input has focus.
- If there is no active world alert, Space should either do nothing or use a simple fallback later, such as centering the selected unit.

### Minimap Alert Pings

- Danger alerts draw a red fading minimap ring at the world alert position.
- The ping should fade quickly enough to avoid clutter, but stay visible long enough to glance down and identify the area.
- The minimap viewport rectangle continues to represent the HUD-safe visible world area.
- Pings should be visual only; clicking the minimap keeps its normal camera jump behavior.

### Implementation Steps

1. Add explicit pointer state and HUD hit-testing helpers.
2. Gate pointer-driven edge scrolling behind the battlefield-only rules.
3. Stop minimap and HUD pointer/wheel interactions from leaking into canvas navigation.
4. Replace fixed wheel zoom steps with smooth cursor-anchored zoom math.
5. Add `focusCameraOnWorld` using the HUD-safe viewport center.
6. Add world-alert storage, Space-bar focus, and fading minimap ping drawing.
7. Verify with desktop and small viewport smoke tests.

### Acceptance Criteria

- Hovering the lower HUD or minimap never scrolls the main map.
- Clicking, dragging, or wheeling over the minimap never triggers canvas selection, orders, edge scroll, or battlefield zoom.
- Edge scroll still works near the visible battlefield edges.
- Arrow-key panning still works over UI unless an input element is focused.
- Wheel/pinch zoom keeps the cursor's world position anchored.
- Zoom and camera clamp still allow the map edges to be viewed outside the HUD panels.
- Pressing Space focuses the most recent important world alert.
- World alerts create a red fading minimap ping.

## Remote Brain Economy Pass

The colony is a remote extraction site, not a semiconductor factory. Ore and lumber are local. Advanced cartbot brains come from offsite industry and arrive through trade.

### Economy Shape

- Mine local ore and lumber.
- Export practical bundles through the main base.
- Offsite foundries and chip fabs send back brain chips.
- Brain chips install into individual cartbots.
- Better brains make cartbots more autonomous and useful before the colony can support more complex local industry.

### First Implemented Loop

- Main Base command: Export Goods.
- Main Base command: Auto Export.
- Export cost: 80 ore and 35 lumber.
- Export time: 11 seconds.
- Reward: 1 brain chip.
- Auto Export keeps one brain-chip shipment queued whenever resources are available.
- Cartbot command: Install Brain.
- Brain chips appear in the top HUD as a third strategic resource.

### Brain Tiers

- Basic Brain: normal movement, gathering, carrying, and building.
- Route Brain: faster movement and slightly faster gathering.
- Builder Brain: faster movement, faster gathering, +5 carry capacity, and faster construction.

### Design Intent

- Progression should feel like earning automation, not buying abstract upgrades.
- The player should understand why advanced chips arrive from elsewhere: this site is dirty, temporary, and resource-heavy.
- The long-term tech tree can unlock better offsite contracts, better local refining, and eventually limited local fabrication.
- The first browser slice should let the player feel one clear arc: gather, export, receive a chip, improve a cartbot, expand faster.
- Browser persistence should be local-first: autosave to local storage, no account, no backend, no subscription service.

## Later Additions

Only after the economy foundation works:

- More worker commands.
- Additional buildings.
- Population/supply.
- Combat units.
- Enemy AI.
- Bug or alien faction dynamics.
- Terrain blockers and better pathfinding.
- Fog of war.
