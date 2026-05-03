(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const mini = document.getElementById("miniMap");
  const miniCtx = mini.getContext("2d");

  const ui = {
    ore: document.getElementById("oreValue"),
    wood: document.getElementById("woodValue"),
    chips: document.getElementById("chipValue"),
    workers: document.getElementById("workerValue"),
    alerts: document.getElementById("alertFeed"),
    topHud: document.getElementById("topHud"),
    commandPanel: document.getElementById("commandPanel"),
    bottomHud: document.getElementById("bottomHud"),
    selectionName: document.getElementById("selectionName"),
    selectionMeta: document.getElementById("selectionMeta"),
    actionGrid: document.getElementById("actionGrid"),
    selectionList: document.getElementById("selectionList"),
    status: document.getElementById("statusLine"),
    tooltip: document.getElementById("tooltip"),
    portraitIcon: document.getElementById("portraitIcon"),
    idleBots: document.getElementById("idleBots"),
    oreBots: document.getElementById("oreBots"),
    lumberBots: document.getElementById("lumberBots"),
    returningBots: document.getElementById("returningBots"),
    buildBots: document.getElementById("buildBots"),
    reconBots: document.getElementById("reconBots"),
    attackBots: document.getElementById("attackBots"),
    groupStrip: document.getElementById("groupStrip"),
  };

  const WORLD = { w: 3000, h: 2100 };
  const HEX = { size: 54, originX: 72, originY: 62 };
  const SQRT3 = Math.sqrt(3);

  const PLAYER = "#79e6c8";
  const ORE = "#66d8ff";
  const WOOD = "#d89d59";
  const DUMMY = "#efcf9a";
  const GROUND = "#151916";
  const HEX_LINE = "rgba(225, 236, 220, 0.095)";
  const HEX_OCCUPIED = "rgba(121, 230, 200, 0.105)";
  const HEX_BLOCKED = "rgba(255, 207, 103, 0.09)";

  const BASE_FOOTPRINT = [
    { q: 0, r: 0 },
    { q: 1, r: 0 },
    { q: -1, r: 0 },
    { q: 0, r: 1 },
    { q: 0, r: -1 },
    { q: 1, r: -1 },
    { q: -1, r: 1 },
  ];

  const HEX_DIRECTIONS = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];

  const RESOURCE_TYPES = {
    ore: { label: "Ore", color: ORE, carryLabel: "ore" },
    wood: { label: "Lumber", color: WOOD, carryLabel: "lumber" },
  };

  const DEFAULT_COMPOSITION = {
    ore: { iron: 68, copper: 14, silica: 12, trace: 6 },
    wood: { cellulose: 62, carbon: 22, resin: 10, water: 6 },
  };

  const UNIT_TYPES = {
    peon: {
      label: "Cartbot",
      radius: 16,
      hp: 45,
      speed: 138,
      gatherTime: 1.4,
      carry: 10,
      cost: { ore: 50, wood: 0 },
      trainTime: 8,
      attackDamage: 1,
      attackCooldown: 0.8,
      attackRange: 38,
      acquireRange: 170,
    },
  };

  const TRADE_SHIPMENTS = {
    brainChip: {
      label: "Brain Chips",
      cost: { ore: 80, wood: 35 },
      reward: { chips: 1 },
      time: 11,
    },
  };

  const BRAIN_TIERS = [
    {
      label: "Basic Brain",
      short: "Basic",
      speedMult: 1,
      gatherMult: 1,
      buildMult: 1,
      carryBonus: 0,
    },
    {
      label: "Route Brain",
      short: "Route",
      cost: { chips: 1 },
      speedMult: 1.18,
      gatherMult: 0.92,
      buildMult: 1,
      carryBonus: 0,
    },
    {
      label: "Builder Brain",
      short: "Builder",
      cost: { chips: 2, ore: 35 },
      speedMult: 1.28,
      gatherMult: 0.84,
      buildMult: 1.45,
      carryBonus: 5,
    },
  ];

  const BUILDING_TYPES = {
    mainBase: {
      label: "Main Base",
      radius: 92,
      hp: 1200,
      train: ["peon"],
      capacity: 10,
      footprint: BASE_FOOTPRINT,
    },
    batteryBank: {
      label: "Battery Bank",
      radius: 42,
      hp: 150,
      capacity: 10,
      buildTime: 10,
      cost: { ore: 75, wood: 25 },
      footprint: [{ q: 0, r: 0 }],
    },
  };

  const state = {
    resources: { ore: 50, wood: 0, chips: 0 },
    units: [],
    buildings: [],
    nodes: [],
    dummies: [],
    selectedIds: new Set(),
    controlGroups: new Map(),
    nextId: 1,
    camera: { x: 80, y: 40, zoom: 0.86 },
    mouse: {
      x: innerWidth / 2,
      y: innerHeight / 2,
      worldX: 0,
      worldY: 0,
      down: false,
      drag: null,
      inViewport: true,
      overHud: false,
      overMiniMap: false,
      overBattlefield: true,
    },
    keys: new Set(),
    commandMode: null,
    placement: null,
    last: performance.now(),
    elapsed: 0,
    hudTimer: 0,
    dpr: 1,
    alert: { text: "", t: 0 },
    worldAlerts: [],
    alertFocusIndex: 0,
    lastClick: { time: 0, x: 0, y: 0, type: "", kind: "" },
    orderMarkers: [],
    hitFlashes: [],
    miniMapPings: [],
  };

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function nextId() {
    const id = state.nextId;
    state.nextId += 1;
    return id;
  }

  function axialKey(hex) {
    return `${hex.q},${hex.r}`;
  }

  function axialAdd(a, b) {
    return { q: a.q + b.q, r: a.r + b.r };
  }

  function axialToWorld(q, r) {
    return {
      x: HEX.originX + HEX.size * SQRT3 * (q + r / 2),
      y: HEX.originY + HEX.size * 1.5 * r,
    };
  }

  function worldToAxial(x, y) {
    const px = x - HEX.originX;
    const py = y - HEX.originY;
    const q = ((SQRT3 / 3) * px - py / 3) / HEX.size;
    const r = ((2 / 3) * py) / HEX.size;
    return axialRound(q, r);
  }

  function axialRound(q, r) {
    let x = q;
    let z = r;
    let y = -x - z;

    let rx = Math.round(x);
    let ry = Math.round(y);
    let rz = Math.round(z);

    const xDiff = Math.abs(rx - x);
    const yDiff = Math.abs(ry - y);
    const zDiff = Math.abs(rz - z);

    if (xDiff > yDiff && xDiff > zDiff) rx = -ry - rz;
    else if (yDiff > zDiff) ry = -rx - rz;
    else rz = -rx - ry;

    return { q: rx, r: rz };
  }

  function hexDistance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  }

  function sameHex(a, b) {
    return Boolean(a && b && a.q === b.q && a.r === b.r);
  }

  function hexNeighbors(hex) {
    return HEX_DIRECTIONS.map((direction) => axialAdd(hex, direction));
  }

  function isHexInWorld(hex) {
    const p = axialToWorld(hex.q, hex.r);
    return p.x >= -HEX.size && p.y >= -HEX.size && p.x <= WORLD.w + HEX.size && p.y <= WORLD.h + HEX.size;
  }

  function staticBlockedHexKeys() {
    const blocked = new Set();
    for (const node of state.nodes) blocked.add(axialKey(node.hex));
    for (const building of state.buildings) {
      for (const hex of building.footprint || [building.hex]) blocked.add(axialKey(hex));
    }
    return blocked;
  }

  function isStaticBlockedHex(hex) {
    return staticBlockedHexKeys().has(axialKey(hex));
  }

  function isWalkableHex(hex, allowedKey = "") {
    if (!isHexInWorld(hex)) return false;
    const key = axialKey(hex);
    return key === allowedKey || !staticBlockedHexKeys().has(key);
  }

  function nearestWalkableHex(hex, fromHex = hex) {
    if (isWalkableHex(hex)) return hex;
    for (let radius = 1; radius <= 18; radius += 1) {
      const candidates = [];
      for (let q = hex.q - radius; q <= hex.q + radius; q += 1) {
        for (let r = hex.r - radius; r <= hex.r + radius; r += 1) {
          const candidate = { q, r };
          if (hexDistance(hex, candidate) !== radius || !isWalkableHex(candidate)) continue;
          candidates.push(candidate);
        }
      }
      if (candidates.length) {
        return candidates.sort((a, b) => hexDistance(fromHex, a) - hexDistance(fromHex, b))[0];
      }
    }
    return fromHex;
  }

  function chooseAdjacentWalkableHex(targetHex, fromHex) {
    const candidates = hexNeighbors(targetHex).filter((hex) => isWalkableHex(hex));
    if (!candidates.length) return nearestWalkableHex(targetHex, fromHex);
    return candidates.sort((a, b) => hexDistance(fromHex, a) - hexDistance(fromHex, b))[0];
  }

  function buildingDropoffHex(building, fromHex) {
    const footprintKeys = new Set((building.footprint || [building.hex]).map(axialKey));
    const candidates = [];
    const seen = new Set();
    for (const hex of building.footprint || [building.hex]) {
      for (const neighbor of hexNeighbors(hex)) {
        const key = axialKey(neighbor);
        if (seen.has(key) || footprintKeys.has(key) || !isWalkableHex(neighbor)) continue;
        seen.add(key);
        candidates.push(neighbor);
      }
    }
    if (!candidates.length) return nearestWalkableHex(building.hex, fromHex);
    return candidates.sort((a, b) => hexDistance(fromHex, a) - hexDistance(fromHex, b))[0];
  }

  function isAdjacentToBuildingFootprint(hex, building) {
    const footprint = building.footprint || [building.hex];
    if (footprint.some((item) => sameHex(item, hex))) return false;
    return footprint.some((item) => hexDistance(item, hex) === 1);
  }

  function findHexPath(from, to) {
    const start = { q: from.q, r: from.r };
    const goal = isWalkableHex(to) ? to : nearestWalkableHex(to, start);
    const startKey = axialKey(start);
    const goalKey = axialKey(goal);
    if (startKey === goalKey) return [start];

    const open = [start];
    const openKeys = new Set([startKey]);
    const cameFrom = new Map();
    const gScore = new Map([[startKey, 0]]);
    const fScore = new Map([[startKey, hexDistance(start, goal)]]);
    let guard = 0;

    while (open.length && guard < 2500) {
      guard += 1;
      let bestIndex = 0;
      for (let i = 1; i < open.length; i += 1) {
        if ((fScore.get(axialKey(open[i])) ?? Infinity) < (fScore.get(axialKey(open[bestIndex])) ?? Infinity)) bestIndex = i;
      }

      const current = open.splice(bestIndex, 1)[0];
      const currentKey = axialKey(current);
      openKeys.delete(currentKey);
      if (currentKey === goalKey) return rebuildHexPath(cameFrom, current);

      for (const neighbor of hexNeighbors(current)) {
        const key = axialKey(neighbor);
        if (!isWalkableHex(neighbor, startKey) && key !== goalKey) continue;
        const tentative = (gScore.get(currentKey) ?? Infinity) + 1;
        if (tentative >= (gScore.get(key) ?? Infinity)) continue;
        cameFrom.set(key, current);
        gScore.set(key, tentative);
        fScore.set(key, tentative + hexDistance(neighbor, goal));
        if (!openKeys.has(key)) {
          open.push(neighbor);
          openKeys.add(key);
        }
      }
    }

    return [start, goal];
  }

  function rebuildHexPath(cameFrom, current) {
    const path = [current];
    let key = axialKey(current);
    while (cameFrom.has(key)) {
      current = cameFrom.get(key);
      path.unshift(current);
      key = axialKey(current);
    }
    return path;
  }

  function hexPathToPoints(path, finalOffset = { x: 0, y: 0 }) {
    return path.map((hex, index) => {
      const center = axialToWorld(hex.q, hex.r);
      if (index === path.length - 1) {
        return { x: center.x + finalOffset.x, y: center.y + finalOffset.y, hex };
      }
      return { ...center, hex };
    });
  }

  function worldToScreen(x, y) {
    return {
      x: (x - state.camera.x) * state.camera.zoom,
      y: (y - state.camera.y) * state.camera.zoom,
    };
  }

  function screenToWorld(x, y) {
    return {
      x: x / state.camera.zoom + state.camera.x,
      y: y / state.camera.zoom + state.camera.y,
    };
  }

  function cameraSafeScreenRect() {
    const gutter = 14;
    let left = 0;
    let top = 0;
    let right = innerWidth;
    let bottom = innerHeight;

    const topHud = ui.topHud?.getBoundingClientRect();
    const commandPanel = ui.commandPanel?.getBoundingClientRect();
    const bottomHud = ui.bottomHud?.getBoundingClientRect();

    if (topHud && topHud.bottom < innerHeight * 0.35) {
      top = Math.max(top, topHud.bottom + gutter);
    }

    if (commandPanel) {
      if (commandPanel.left > innerWidth * 0.5) {
        right = Math.min(right, commandPanel.left - gutter);
      } else if (commandPanel.top > innerHeight * 0.45) {
        bottom = Math.min(bottom, commandPanel.top - gutter);
      }
    }

    if (bottomHud && bottomHud.top > innerHeight * 0.35) {
      bottom = Math.min(bottom, bottomHud.top - gutter);
    }

    if (right - left < 260) right = innerWidth;
    if (bottom - top < 220) {
      top = 0;
      bottom = innerHeight;
    }

    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }

  function pointInRect(x, y, rect) {
    return Boolean(rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
  }

  function pointInElement(x, y, element) {
    return Boolean(element && pointInRect(x, y, element.getBoundingClientRect()));
  }

  function pointOverHud(x, y) {
    return pointInElement(x, y, ui.topHud) || pointInElement(x, y, ui.commandPanel) || pointInElement(x, y, ui.bottomHud);
  }

  function pointerCanEdgeScroll(safe) {
    return (
      state.mouse.overBattlefield &&
      state.mouse.x >= safe.left &&
      state.mouse.x <= safe.right &&
      state.mouse.y >= safe.top &&
      state.mouse.y <= safe.bottom
    );
  }

  function allSelectable() {
    return [...state.buildings, ...state.units, ...state.nodes, ...state.dummies];
  }

  function selectedEntities() {
    return allSelectable().filter((entity) => state.selectedIds.has(entity.id));
  }

  function selectedUnits() {
    return state.units.filter((unit) => state.selectedIds.has(unit.id));
  }

  function getEntity(id) {
    return allSelectable().find((entity) => entity.id === id) || null;
  }

  function getBuilding(id) {
    return state.buildings.find((building) => building.id === id) || null;
  }

  function getNode(id) {
    return state.nodes.find((node) => node.id === id) || null;
  }

  function getDummy(id) {
    return state.dummies.find((dummy) => dummy.id === id) || null;
  }

  function nearestDropoff() {
    return state.buildings.find((building) => building.type === "mainBase") || null;
  }

  function announce(text) {
    state.alert = { text, t: 3.2 };
    ui.alerts.textContent = text;
  }

  function raiseWorldAlert(text, x, y, type = "danger") {
    announce(text);
    state.worldAlerts.unshift({ text, x, y, type, t: 12, max: 12 });
    state.worldAlerts = state.worldAlerts.slice(0, 5);
    state.alertFocusIndex = 0;
    state.miniMapPings.push({ x, y, type, t: 4.5, max: 4.5 });
  }

  function focusCameraOnWorld(x, y, zoom = state.camera.zoom) {
    const safe = cameraSafeScreenRect();
    state.camera.zoom = clamp(zoom, 0.58, 1.3);
    state.camera.x = x - (safe.left + safe.width / 2) / state.camera.zoom;
    state.camera.y = y - (safe.top + safe.height / 2) / state.camera.zoom;
    clampCamera();
  }

  function focusRecentWorldAlert() {
    const activeAlerts = state.worldAlerts.filter((alert) => alert.t > 0);
    if (!activeAlerts.length) return false;
    state.worldAlerts = activeAlerts;
    const alert = activeAlerts[state.alertFocusIndex % activeAlerts.length];
    state.alertFocusIndex = (state.alertFocusIndex + 1) % activeAlerts.length;
    focusCameraOnWorld(alert.x, alert.y, Math.max(state.camera.zoom, 0.96));
    announce(alert.text);
    return true;
  }

  function init() {
    state.resources = { ore: 50, wood: 0, chips: 0 };
    state.units = [];
    state.buildings = [];
    state.nodes = [];
    state.dummies = [];
    state.selectedIds.clear();
    state.controlGroups = new Map();
    state.nextId = 1;
    state.camera = { x: 70, y: 35, zoom: Math.min(1, Math.max(0.68, innerWidth / 1320)) };
    state.commandMode = null;
    state.placement = null;
    state.orderMarkers = [];
    state.hitFlashes = [];
    state.miniMapPings = [];
    state.worldAlerts = [];
    state.alertFocusIndex = 0;
    state.elapsed = 0;
    state.hudTimer = 0;
    state.lastClick = { time: 0, x: 0, y: 0, type: "", kind: "" };

    const base = addBuildingAtHex("mainBase", 4, 4);
    setGroundRally(base, axialToWorld(6, 4), false);

    const bot = addUnit("peon", axialToWorld(6, 4).x, axialToWorld(6, 4).y);
    bot.angle = -0.35;

    addResourceNodeAtHex("ore", 0, 3, 900, {
      name: "Hematite Ridge",
      composition: { iron: 74, copper: 8, silica: 12, trace: 6 },
    });
    addResourceNodeAtHex("ore", 1, 2, 40, {
      name: "Mixed Copper Vein",
      composition: { copper: 46, iron: 34, nickel: 12, trace: 8 },
    });
    addResourceNodeAtHex("ore", 2, 3, 850, {
      name: "Shallow Iron Shelf",
      composition: { iron: 64, silica: 18, copper: 10, trace: 8 },
    });
    addResourceNodeAtHex("wood", 7, 2, 950, {
      name: "Pine Stand",
      composition: { cellulose: 66, carbon: 20, resin: 9, water: 5 },
    });
    addResourceNodeAtHex("wood", 8, 3, 950, {
      name: "Hardwood Grove",
      composition: { cellulose: 58, carbon: 27, resin: 7, water: 8 },
    });
    addResourceNodeAtHex("wood", 6, 6, 950, {
      name: "Lowland Timber",
      composition: { cellulose: 61, carbon: 23, resin: 11, water: 5 },
    });
    addResourceNodeAtHex("ore", 11, 8, 1100, {
      name: "Nickel Trace Field",
      composition: { iron: 42, nickel: 28, copper: 18, trace: 12 },
    });
    addResourceNodeAtHex("wood", 12, 6, 1100, {
      name: "Dense Timber Stand",
      composition: { cellulose: 63, carbon: 25, resin: 8, water: 4 },
    });
    addResourceNodeAtHex("ore", 16, 5, 1250, {
      name: "Copper Shelf",
      composition: { copper: 58, iron: 24, silica: 10, trace: 8 },
    });
    addResourceNodeAtHex("ore", 18, 8, 1400, {
      name: "Magnetite Field",
      composition: { iron: 82, copper: 5, silica: 8, trace: 5 },
    });
    addResourceNodeAtHex("ore", 20, 12, 1500, {
      name: "Deep Nickel Matrix",
      composition: { nickel: 36, iron: 30, copper: 22, trace: 12 },
    });
    addResourceNodeAtHex("wood", 15, 10, 1300, {
      name: "Resin Grove",
      composition: { cellulose: 52, carbon: 21, resin: 21, water: 6 },
    });
    addResourceNodeAtHex("wood", 22, 7, 1500, {
      name: "Old Growth Stand",
      composition: { cellulose: 68, carbon: 23, resin: 5, water: 4 },
    });
    addResourceNodeAtHex("wood", 24, 14, 1500, {
      name: "Wetland Timber",
      composition: { cellulose: 55, carbon: 18, resin: 9, water: 18 },
    });
    addResourceNodeAtHex("ore", 13, 17, 1350, {
      name: "Southern Copper Wash",
      composition: { copper: 49, silica: 22, iron: 20, trace: 9 },
    });
    addResourceNodeAtHex("wood", 18, 18, 1450, {
      name: "South Basin Timber",
      composition: { cellulose: 60, carbon: 19, resin: 14, water: 7 },
    });
    addResourceNodeAtHex("ore", 7, 12, 950, {
      name: "Silica Iron Fan",
      composition: { silica: 34, iron: 45, copper: 9, trace: 12 },
    });
    addResourceNodeAtHex("wood", 3, 11, 900, {
      name: "Southern Lumber Patch",
      composition: { cellulose: 64, carbon: 20, resin: 12, water: 4 },
    });

    addTrainingDummyAtHex(8, 5);
    addTrainingDummyAtHex(10, 4);
    addTrainingDummyAtHex(10, 6);

    state.selectedIds.add(bot.id);
    announce("Base landed. Cartbot brain online.");
    updateMouseWorld();
    refreshUi();
  }

  function addUnit(type, x, y) {
    const def = UNIT_TYPES[type];
    const unit = {
      id: nextId(),
      kind: "unit",
      type,
      x,
      y,
      radius: def.radius,
      hp: def.hp,
      maxHp: def.hp,
      angle: 0,
      order: { type: "idle" },
      orderQueue: [],
      carried: null,
      gatherTimer: 0,
      attackTimer: 0,
      brainTier: 0,
      anim: Math.random() * 10,
    };
    state.units.push(unit);
    return unit;
  }

  function addBuildingAtHex(type, q, r, options = {}) {
    const def = BUILDING_TYPES[type];
    const center = axialToWorld(q, r);
    const hex = { q, r };
    const building = {
      id: nextId(),
      kind: "building",
      type,
      x: center.x,
      y: center.y,
      hex,
      footprint: (def.footprint || [{ q: 0, r: 0 }]).map((offset) => axialAdd(hex, offset)),
      radius: def.radius,
      hp: options.hp ?? def.hp,
      maxHp: def.hp,
      queue: [],
      rally: null,
      build: options.build || null,
      underConstruction: Boolean(options.underConstruction),
    };
    state.buildings.push(building);
    return building;
  }

  function addResourceNodeAtHex(type, q, r, amount, options = {}) {
    const center = axialToWorld(q, r);
    state.nodes.push({
      id: nextId(),
      kind: "resource",
      type,
      name: options.name || RESOURCE_TYPES[type].label,
      composition: options.composition || DEFAULT_COMPOSITION[type],
      x: center.x,
      y: center.y,
      hex: { q, r },
      radius: type === "ore" ? 34 : 42,
      amount,
      maxAmount: amount,
      wobble: Math.random() * Math.PI * 2,
    });
  }

  function addTrainingDummyAtHex(q, r) {
    const center = axialToWorld(q, r);
    state.dummies.push({
      id: nextId(),
      kind: "dummy",
      type: "trainingDummy",
      x: center.x,
      y: center.y,
      hex: { q, r },
      radius: 28,
      hp: 100,
      maxHp: 100,
      wobble: Math.random() * Math.PI * 2,
    });
  }

  function canAfford(cost) {
    return state.resources.ore >= (cost.ore || 0) && state.resources.wood >= (cost.wood || 0) && state.resources.chips >= (cost.chips || 0);
  }

  function workerCapacity() {
    return state.buildings.reduce((total, building) => {
      const def = BUILDING_TYPES[building.type];
      if (!def?.capacity || building.underConstruction || building.hp <= 0) return total;
      return total + def.capacity;
    }, 0);
  }

  function queuedWorkers() {
    return state.buildings.reduce((total, building) => total + building.queue.filter((item) => item.type === "peon").length, 0);
  }

  function usedWorkerCapacity() {
    return state.units.length + queuedWorkers();
  }

  function hasWorkerCapacity(count = 1) {
    return usedWorkerCapacity() + count <= workerCapacity();
  }

  function spend(cost) {
    if (!canAfford(cost)) return false;
    state.resources.ore -= cost.ore || 0;
    state.resources.wood -= cost.wood || 0;
    state.resources.chips -= cost.chips || 0;
    refreshUi();
    return true;
  }

  function trainPeon(base) {
    const cost = UNIT_TYPES.peon.cost;
    if (!hasWorkerCapacity()) {
      announce("Worker limit reached. Build a Battery Bank.");
      refreshUi();
      return;
    }
    if (!spend(cost)) {
      announce("Need more ore.");
      return;
    }
    base.queue.push({ type: "peon", remaining: UNIT_TYPES.peon.trainTime, total: UNIT_TYPES.peon.trainTime, cost: { ...cost } });
    announce("Cartbot queued.");
    refreshUi();
  }

  function cancelQueuedPeon(base) {
    const index = base.queue.map((item) => item.type).lastIndexOf("peon");
    if (index < 0) {
      announce("No cartbot queued.");
      return;
    }
    const [item] = base.queue.splice(index, 1);
    refund(item.cost || UNIT_TYPES.peon.cost);
    announce("Cartbot canceled. Resources refunded.");
    refreshUi();
  }

  function refund(cost) {
    state.resources.ore += cost.ore || 0;
    state.resources.wood += cost.wood || 0;
    state.resources.chips += cost.chips || 0;
  }

  function queueBrainShipment(base) {
    const shipment = TRADE_SHIPMENTS.brainChip;
    if (!spend(shipment.cost)) {
      announce("Need more ore and lumber for export.");
      return;
    }
    base.queue.push({
      type: "brainShipment",
      remaining: shipment.time,
      total: shipment.time,
      cost: { ...shipment.cost },
      reward: { ...shipment.reward },
    });
    announce("Export queued. Brain chips inbound.");
    refreshUi();
  }

  function cancelQueuedBrainShipment(base) {
    const index = base.queue.map((item) => item.type).lastIndexOf("brainShipment");
    if (index < 0) {
      announce("No export shipment queued.");
      return;
    }
    const [item] = base.queue.splice(index, 1);
    refund(item.cost || TRADE_SHIPMENTS.brainChip.cost);
    announce("Export canceled. Resources returned.");
    refreshUi();
  }

  function completeBrainShipment(base, item) {
    const reward = item.reward || TRADE_SHIPMENTS.brainChip.reward;
    state.resources.chips += reward.chips || 0;
    addMarker(base.x, base.y, "brain", "deposit");
    raiseWorldAlert(`${reward.chips || 1} brain chip${(reward.chips || 1) === 1 ? "" : "s"} delivered.`, base.x, base.y, "tech");
  }

  function nextBrainTier(unit) {
    return BRAIN_TIERS[(unit.brainTier || 0) + 1] || null;
  }

  function selectedBrainUpgradeCost() {
    const upgradable = selectedUnits().filter((unit) => nextBrainTier(unit));
    if (!upgradable.length) return null;
    return upgradable.reduce(
      (total, unit) => {
        const cost = nextBrainTier(unit).cost || {};
        total.ore += cost.ore || 0;
        total.wood += cost.wood || 0;
        total.chips += cost.chips || 0;
        return total;
      },
      { ore: 0, wood: 0, chips: 0 },
    );
  }

  function upgradeSelectedBrains() {
    const units = selectedUnits().filter((unit) => nextBrainTier(unit));
    if (!units.length) {
      announce("Selected cartbots already have the best brain.");
      return;
    }
    const cost = selectedBrainUpgradeCost();
    if (!canAfford(cost)) {
      announce("Need more brain chips for upgrades.");
      return;
    }
    spend(cost);
    for (const unit of units) {
      unit.brainTier += 1;
      state.hitFlashes.push({ x: unit.x, y: unit.y, t: 0.32, max: 0.32 });
    }
    const topTier = units.reduce((best, unit) => Math.max(best, unit.brainTier), 0);
    announce(`${units.length} cartbot${units.length === 1 ? "" : "s"} upgraded to ${BRAIN_TIERS[topTier].label}.`);
    refreshUi();
  }

  function spawnPeon(base, type) {
    const spawnHexes = [
      { q: 2, r: 0 },
      { q: 2, r: -1 },
      { q: 1, r: 1 },
      { q: -1, r: 2 },
      { q: -2, r: 1 },
      { q: 1, r: -2 },
    ].map((offset) => axialAdd(base.hex, offset));

    let chosen = axialToWorld(base.hex.q + 2, base.hex.r);
    for (const hex of spawnHexes) {
      if (!isWalkableHex(hex)) continue;
      const p = axialToWorld(hex.q, hex.r);
      chosen = p;
      break;
    }
    const bot = addUnit(type, chosen.x, chosen.y);
    bot.angle = Math.atan2(chosen.y - base.y, chosen.x - base.x);
    applyRallyToUnit(base, bot);
    announce("Cartbot ready.");
  }

  function setGroundRally(base, point, shouldAnnounce = true) {
    const hex = nearestWalkableHex(worldToAxial(point.x, point.y), base.hex);
    const p = axialToWorld(hex.q, hex.r);
    base.rally = { type: "point", x: p.x, y: p.y, hex };
    if (shouldAnnounce) {
      addMarker(p.x, p.y, "move", "move");
      announce("Rally point set.");
      refreshUi();
    }
  }

  function setResourceRally(base, node) {
    base.rally = { type: "resource", nodeId: node.id, resourceType: node.type };
    addMarker(node.x, node.y, node.type, "gather");
    announce(`Rally set: ${node.name}.`);
    refreshUi();
  }

  function applyRallyToUnit(base, unit) {
    if (!base.rally) return;
    if (base.rally.type === "resource") {
      const rallyNode = getNode(base.rally.nodeId);
      const node = rallyNode?.amount > 0 ? rallyNode : nearestResourceNode(base.rally.resourceType, worldToAxial(unit.x, unit.y));
      if (node) {
        setGatherOrder(unit, node);
        return;
      }
      announce(`No ${RESOURCE_TYPES[base.rally.resourceType].label.toLowerCase()} for rally.`);
      return;
    }
    if (base.rally.type === "point") setMoveOrder(unit, base.rally);
  }

  function brainTier(unit) {
    return BRAIN_TIERS[unit.brainTier || 0] || BRAIN_TIERS[0];
  }

  function unitSpeed(unit) {
    return UNIT_TYPES[unit.type].speed * brainTier(unit).speedMult;
  }

  function unitGatherTime(unit) {
    return UNIT_TYPES[unit.type].gatherTime * brainTier(unit).gatherMult;
  }

  function unitCarryCapacity(unit) {
    return UNIT_TYPES[unit.type].carry + brainTier(unit).carryBonus;
  }

  function unitBuildRate(unit) {
    return brainTier(unit).buildMult;
  }

  function update(dt) {
    state.elapsed += dt;
    updateCamera(dt);
    updateUnits(dt);
    updateProduction(dt);
    applySeparation(dt);
    enforceStaticOccupancy();
    updateMarkers(dt);
    updateAlerts(dt);
    removeDeadDummies();
    syncHud(dt);
  }

  function syncHud(dt) {
    state.hudTimer -= dt;
    if (state.hudTimer > 0) return;
    state.hudTimer = 0.22;
    ui.status.textContent = statusText();
    renderManagement();
    refreshSelectedMeta();
  }

  function updateUnits(dt) {
    const activeBuilds = new Set();
    for (const unit of state.units) {
      unit.anim += dt;
      unit.attackTimer = Math.max(0, unit.attackTimer - dt);
      if (!unit.order || unit.order.type === "idle") continue;

      if (unit.order.type === "move") updateMoveOrder(unit, dt);
      if (unit.order.type === "gather") updateGatherOrder(unit, dt);
      if (unit.order.type === "attack") updateAttackOrder(unit, dt);
      if (unit.order.type === "attackMove") updateAttackMoveOrder(unit, dt);
      if (unit.order.type === "recon") updateReconOrder(unit, dt);
      if (unit.order.type === "build") updateBuildOrder(unit, dt, activeBuilds);
    }
  }

  function updateMoveOrder(unit, dt) {
    if (!unit.order.path?.length) primeOrderPath(unit.order, worldToAxial(unit.x, unit.y), unit.order.targetHex);
    if (followOrderPath(unit, unit.order, dt, 8)) unit.order = { type: "idle" };
  }

  function updateGatherOrder(unit, dt) {
    const order = unit.order;
    const node = order.nodeId ? getNode(order.nodeId) : null;
    const base = getBuilding(order.dropoffId) || nearestDropoff();
    if (!base) {
      unit.order = { type: "idle" };
      unit.gatherTimer = 0;
      return;
    }

    if (order.phase === "returning" && !node) {
      if (!order.dropoffHex || !isAdjacentToBuildingFootprint(order.dropoffHex, base)) {
        order.dropoffHex = buildingDropoffHex(base, worldToAxial(unit.x, unit.y));
        order.path = [];
      }
      if (!order.path?.length) primeOrderPath(order, worldToAxial(unit.x, unit.y), order.dropoffHex);
      if (!followOrderPath(unit, order, dt, 6)) return;
      if (unit.carried) {
        state.resources[unit.carried.type] += unit.carried.amount;
        addMarker(base.x, base.y, unit.carried.type, "deposit");
        unit.carried = null;
        refreshUi();
      }
      unit.order = { type: "idle" };
      return;
    }

    if (!node) {
      if (order.resourceType && !unit.carried) retargetGather(unit, order.resourceType, order.nodeId);
      else unit.order = { type: "idle" };
      unit.gatherTimer = 0;
      return;
    }

    if (node.amount <= 0 && order.phase !== "returning") {
      if (!unit.carried) retargetGather(unit, node.type, node.id);
      else order.phase = "returning";
      unit.gatherTimer = 0;
      return;
    }

    ensureGatherEndpoints(order, unit, node, base);

    if (order.phase === "toResource") {
      if (!order.path?.length) primeOrderPath(order, worldToAxial(unit.x, unit.y), order.resourceApproachHex);
      if (!followOrderPath(unit, order, dt, 6)) return;
      order.phase = "gathering";
      order.path = [];
      unit.gatherTimer = 0;
    }

    if (order.phase === "gathering") {
      unit.gatherTimer += dt;
      unit.angle = Math.atan2(node.y - unit.y, node.x - unit.x);
      if (unit.gatherTimer < unitGatherTime(unit)) return;
      const amount = Math.min(unitCarryCapacity(unit), node.amount);
      if (amount <= 0) {
        retargetGather(unit, node.type, node.id);
        return;
      }
      node.amount -= amount;
      unit.carried = { type: node.type, amount };
      unit.gatherTimer = 0;
      order.phase = "returning";
      order.path = [];
      primeOrderPath(order, worldToAxial(unit.x, unit.y), order.dropoffHex);
      addMarker(node.x, node.y, node.type, "gather");
    }

    if (order.phase === "returning") {
      if (!order.path?.length) primeOrderPath(order, worldToAxial(unit.x, unit.y), order.dropoffHex);
      if (!followOrderPath(unit, order, dt, 6)) return;
      if (unit.carried) {
        state.resources[unit.carried.type] += unit.carried.amount;
        addMarker(base.x, base.y, unit.carried.type, "deposit");
        unit.carried = null;
        refreshUi();
      }

      if (node.amount > 0) {
        order.phase = "toResource";
        order.path = [];
        primeOrderPath(order, worldToAxial(unit.x, unit.y), order.resourceApproachHex);
      } else {
        retargetGather(unit, node.type, node.id);
      }
    }
  }

  function updateAttackOrder(unit, dt) {
    const target = getDummy(unit.order.targetId);
    if (!target || target.hp <= 0) {
      unit.order = { type: "idle" };
      return;
    }
    const def = UNIT_TYPES[unit.type];
    if (distance(unit, target) > def.attackRange + target.radius) {
      if (!unit.order.path?.length) primeOrderPath(unit.order, worldToAxial(unit.x, unit.y), target.hex);
      followOrderPath(unit, unit.order, dt, def.attackRange + target.radius - 2);
      return;
    }
    unit.angle = Math.atan2(target.y - unit.y, target.x - unit.x);
    if (unit.attackTimer <= 0) {
      target.hp -= def.attackDamage;
      unit.attackTimer = def.attackCooldown;
      state.hitFlashes.push({ x: target.x, y: target.y, t: 0.22, max: 0.22 });
      addMarker(target.x, target.y, "attack", "attack");
      refreshUi();
    }
  }

  function updateAttackMoveOrder(unit, dt) {
    const def = UNIT_TYPES[unit.type];
    const target = nearestDummy(unit, def.acquireRange);
    if (target) {
      unit.order = {
        type: "attack",
        targetId: target.id,
        targetHex: target.hex,
        path: [],
        pathIndex: 0,
      };
      return;
    }
    if (!unit.order.path?.length) primeOrderPath(unit.order, worldToAxial(unit.x, unit.y), unit.order.targetHex);
    if (followOrderPath(unit, unit.order, dt, 8)) unit.order = { type: "idle" };
  }

  function updateReconOrder(unit, dt) {
    if (!unit.order.path?.length) {
      const to = unit.order.direction === "out" ? unit.order.endHex : unit.order.startHex;
      primeOrderPath(unit.order, worldToAxial(unit.x, unit.y), to);
    }
    if (followOrderPath(unit, unit.order, dt, 8)) {
      unit.order.direction = unit.order.direction === "out" ? "back" : "out";
      const to = unit.order.direction === "out" ? unit.order.endHex : unit.order.startHex;
      primeOrderPath(unit.order, worldToAxial(unit.x, unit.y), to);
      addMarker(unit.x, unit.y, "recon", "move");
    }
  }

  function updateBuildOrder(unit, dt, activeBuilds) {
    const building = getBuilding(unit.order.buildingId);
    if (!building || !building.underConstruction) {
      advanceOrderQueue(unit);
      return;
    }
    prepareBuildOrder(unit, unit.order);
    if (!unit.order.path?.length) primeOrderPath(unit.order, worldToAxial(unit.x, unit.y), unit.order.buildHex);
    if (!sameHex(worldToAxial(unit.x, unit.y), unit.order.buildHex)) {
      if (!followOrderPath(unit, unit.order, dt, 6)) return;
    }

    if (activeBuilds.has(building.id)) return;
    activeBuilds.add(building.id);

    unit.angle = Math.atan2(building.y - unit.y, building.x - unit.x);
    building.build.remaining = Math.max(0, building.build.remaining - dt * unitBuildRate(unit));
    building.hp = Math.max(1, Math.round(building.maxHp * (1 - building.build.remaining / building.build.total)));
    if (building.build.remaining > 0) return;

    building.underConstruction = false;
    building.build = null;
    building.hp = building.maxHp;
    addMarker(building.x, building.y, "build", "deposit");
    const completeText = building.type === "batteryBank" ? "Battery Bank complete. Worker limit increased." : `${BUILDING_TYPES[building.type].label} complete.`;
    announce(completeText);
    advanceOrderQueue(unit);
    refreshUi();
  }

  function updateProduction(dt) {
    for (const building of state.buildings) {
      if (!building.queue.length) continue;
      const item = building.queue[0];
      item.remaining = Math.max(0, item.remaining - dt);
      if (item.remaining <= 0) {
        building.queue.shift();
        if (item.type === "peon") spawnPeon(building, item.type);
        if (item.type === "brainShipment") completeBrainShipment(building, item);
        refreshUi();
      }
    }
  }

  function removeDeadDummies() {
    const dead = state.dummies.filter((dummy) => dummy.hp <= 0);
    if (!dead.length) return;
    for (const dummy of dead) state.selectedIds.delete(dummy.id);
    state.dummies = state.dummies.filter((dummy) => dummy.hp > 0);
    for (const unit of state.units) {
      if ((unit.order?.type === "attack" || unit.order?.type === "attackMove") && !getDummy(unit.order.targetId)) {
        unit.order = { type: "idle" };
      }
    }
    refreshUi();
  }

  function updateMarkers(dt) {
    for (const marker of state.orderMarkers) marker.t -= dt;
    for (const flash of state.hitFlashes) flash.t -= dt;
    for (const ping of state.miniMapPings) ping.t -= dt;
    for (const alert of state.worldAlerts) alert.t -= dt;
    state.orderMarkers = state.orderMarkers.filter((marker) => marker.t > 0);
    state.hitFlashes = state.hitFlashes.filter((flash) => flash.t > 0);
    state.miniMapPings = state.miniMapPings.filter((ping) => ping.t > 0);
    state.worldAlerts = state.worldAlerts.filter((alert) => alert.t > 0);
    if (state.alertFocusIndex >= state.worldAlerts.length) state.alertFocusIndex = 0;
  }

  function updateAlerts(dt) {
    if (state.alert.t <= 0) return;
    state.alert.t -= dt;
    if (state.alert.t <= 0) ui.alerts.textContent = modeStatusText();
  }

  function nearestDummy(unit, maxRange) {
    let best = null;
    let bestD = maxRange;
    for (const dummy of state.dummies) {
      const d = distance(unit, dummy);
      if (d < bestD) {
        best = dummy;
        bestD = d;
      }
    }
    return best;
  }

  function nearestResourceNode(type, fromHex, excludedId = null) {
    let best = null;
    let bestScore = Infinity;
    for (const node of state.nodes) {
      if (node.type !== type || node.amount <= 0 || node.id === excludedId) continue;
      const score = hexDistance(fromHex, node.hex);
      if (score < bestScore) {
        best = node;
        bestScore = score;
      }
    }
    return best;
  }

  function retargetGather(unit, resourceType, exhaustedNodeId = null) {
    const node = nearestResourceNode(resourceType, worldToAxial(unit.x, unit.y), exhaustedNodeId);
    if (!node) {
      unit.order = { type: "idle" };
      unit.gatherTimer = 0;
      announce(`No ${RESOURCE_TYPES[resourceType].label.toLowerCase()} nearby.`);
      refreshUi();
      return false;
    }
    setGatherOrder(unit, node);
    announce(`Retargeting ${RESOURCE_TYPES[resourceType].label.toLowerCase()}: ${node.name}.`);
    return true;
  }

  function ensureGatherEndpoints(order, unit, node, base) {
    const currentHex = worldToAxial(unit.x, unit.y);
    if (!order.resourceApproachHex || hexDistance(order.resourceApproachHex, node.hex) !== 1 || !isWalkableHex(order.resourceApproachHex)) {
      order.resourceApproachHex = chooseAdjacentWalkableHex(node.hex, currentHex);
      if (order.phase === "toResource") order.path = [];
    }

    if (!order.dropoffHex || !isWalkableHex(order.dropoffHex) || !isAdjacentToBuildingFootprint(order.dropoffHex, base)) {
      order.dropoffHex = buildingDropoffHex(base, currentHex);
      if (order.phase === "returning") order.path = [];
    }
  }

  function setMoveOrder(unit, point) {
    clearOrderQueue(unit);
    const fromHex = worldToAxial(unit.x, unit.y);
    const targetHex = nearestWalkableHex(worldToAxial(point.x, point.y), fromHex);
    const order = { type: "move", targetHex, path: [], pathIndex: 0 };
    primeOrderPath(order, fromHex, targetHex);
    unit.order = order;
    unit.gatherTimer = 0;
  }

  function setGatherOrder(unit, node) {
    clearOrderQueue(unit);
    const base = nearestDropoff();
    if (!base) return;
    const fromHex = worldToAxial(unit.x, unit.y);
    const resourceApproachHex = chooseAdjacentWalkableHex(node.hex, fromHex);
    const dropoffHex = buildingDropoffHex(base, resourceApproachHex);
    const phase = unit.carried ? "returning" : "toResource";
    const order = {
      type: "gather",
      phase,
      nodeId: node.id,
      dropoffId: base.id,
      resourceType: node.type,
      resourceHex: node.hex,
      resourceApproachHex,
      dropoffHex,
      path: [],
      pathIndex: 0,
    };
    primeOrderPath(order, fromHex, phase === "returning" ? dropoffHex : resourceApproachHex);
    unit.order = order;
    unit.gatherTimer = 0;
  }

  function setAttackOrder(unit, dummy) {
    clearOrderQueue(unit);
    const fromHex = worldToAxial(unit.x, unit.y);
    const order = {
      type: "attack",
      targetId: dummy.id,
      targetHex: dummy.hex,
      path: [],
      pathIndex: 0,
    };
    primeOrderPath(order, fromHex, dummy.hex);
    unit.order = order;
    unit.gatherTimer = 0;
  }

  function setAttackMoveOrder(unit, point) {
    clearOrderQueue(unit);
    const fromHex = worldToAxial(unit.x, unit.y);
    const targetHex = nearestWalkableHex(worldToAxial(point.x, point.y), fromHex);
    const order = {
      type: "attackMove",
      targetHex,
      path: [],
      pathIndex: 0,
    };
    primeOrderPath(order, fromHex, targetHex);
    unit.order = order;
    unit.gatherTimer = 0;
  }

  function setReconOrder(unit, point) {
    clearOrderQueue(unit);
    const startHex = worldToAxial(unit.x, unit.y);
    const endHex = nearestWalkableHex(worldToAxial(point.x, point.y), startHex);
    const order = {
      type: "recon",
      startHex,
      endHex,
      direction: "out",
      path: [],
      pathIndex: 0,
    };
    primeOrderPath(order, startHex, endHex);
    unit.order = order;
    unit.gatherTimer = 0;
  }

  function createBuildOrder(building) {
    return {
      type: "build",
      buildingId: building.id,
      buildHex: null,
      path: [],
      pathIndex: 0,
    };
  }

  function prepareBuildOrder(unit, order) {
    const building = getBuilding(order.buildingId);
    if (!building || !building.underConstruction) return false;
    const currentHex = worldToAxial(unit.x, unit.y);
    if (!order.buildHex || !isWalkableHex(order.buildHex) || !isAdjacentToBuildingFootprint(order.buildHex, building)) {
      order.buildHex = buildingDropoffHex(building, currentHex);
      order.path = [];
    }
    if (!order.path?.length) primeOrderPath(order, currentHex, order.buildHex);
    return true;
  }

  function assignBuildOrder(unit, building, options = {}) {
    const order = createBuildOrder(building);
    const append = Boolean(options.append);
    if (append && unit.order?.type && unit.order.type !== "idle") {
      unit.orderQueue.push(order);
      return "queued";
    }
    unit.orderQueue = [];
    unit.order = order;
    unit.gatherTimer = 0;
    prepareBuildOrder(unit, order);
    return "active";
  }

  function advanceOrderQueue(unit) {
    while (unit.orderQueue.length) {
      const next = unit.orderQueue.shift();
      unit.order = next;
      unit.gatherTimer = 0;
      if (next.type !== "build" || prepareBuildOrder(unit, next)) return true;
    }
    unit.order = { type: "idle" };
    unit.gatherTimer = 0;
    return false;
  }

  function hasQueuedBuildWork(unit) {
    return unit.order?.type === "build" || unit.orderQueue.some((order) => order.type === "build");
  }

  function buildQueueCount(unit) {
    return unit.orderQueue.filter((order) => order.type === "build").length;
  }

  function setBuildBatteryOrder(unit, building) {
    const append = hasQueuedBuildWork(unit);
    return assignBuildOrder(unit, building, { append });
  }

  function setResumeBuildOrder(unit, building) {
    return assignBuildOrder(unit, building, { append: false });
  }

  function clearOrderQueue(unit) {
    unit.orderQueue = [];
  }

  function placeBatteryBank(point) {
    const unit = selectedUnits()[0];
    if (!unit) {
      announce("Select a cartbot first.");
      return false;
    }
    const hex = worldToAxial(point.x, point.y);
    if (!canPlaceBuildingAt(hex)) {
      announce("Cannot place Battery Bank there.");
      return false;
    }
    const cost = BUILDING_TYPES.batteryBank.cost;
    if (!spend(cost)) {
      announce("Need 75 ore and 25 lumber.");
      return false;
    }
    const bank = addBuildingAtHex("batteryBank", hex.q, hex.r, {
      underConstruction: true,
      hp: 1,
      build: { remaining: BUILDING_TYPES.batteryBank.buildTime, total: BUILDING_TYPES.batteryBank.buildTime },
    });
    const result = setBuildBatteryOrder(unit, bank);
    addMarker(bank.x, bank.y, "build", "move");
    announce(result === "queued" ? "Battery Bank queued for construction." : "Battery Bank foundation placed.");
    refreshUi();
    return true;
  }

  function canPlaceBuildingAt(hex) {
    if (!isWalkableHex(hex)) return false;
    if (state.dummies.some((dummy) => sameHex(dummy.hex, hex))) return false;
    return !state.buildings.some((building) => (building.footprint || [building.hex]).some((item) => sameHex(item, hex)));
  }

  function stopSelectedUnits() {
    for (const unit of selectedUnits()) {
      clearOrderQueue(unit);
      unit.order = { type: "idle" };
      unit.gatherTimer = 0;
    }
    state.commandMode = null;
    announce("Orders cleared.");
    refreshUi();
  }

  function primeOrderPath(order, fromHex, toHex, finalOffset = { x: 0, y: 0 }) {
    const targetHex = nearestWalkableHex(toHex, fromHex);
    const hexPath = findHexPath(fromHex, targetHex);
    order.pathHexes = hexPath;
    order.pathTargetHex = targetHex;
    order.path = hexPathToPoints(hexPath, finalOffset);
    order.pathIndex = 0;
  }

  function followOrderPath(unit, order, dt, stopDistance) {
    if (!order.path?.length) return true;
    const index = clamp(order.pathIndex || 0, 0, order.path.length - 1);
    const target = order.path[index];
    const final = index === order.path.length - 1;
    if (moveToward(unit, target, dt, final ? stopDistance : 20)) {
      if (!final) {
        order.pathIndex = index + 1;
        return false;
      }
      return true;
    }
    return false;
  }

  function moveToward(unit, point, dt, stopDistance) {
    const dx = point.x - unit.x;
    const dy = point.y - unit.y;
    const d = Math.hypot(dx, dy);
    if (d <= stopDistance + 0.75) return true;
    const step = Math.min(d - stopDistance, unitSpeed(unit) * dt);
    unit.x += (dx / d) * step;
    unit.y += (dy / d) * step;
    unit.angle = Math.atan2(dy, dx);
    return false;
  }

  function resourceOffsetFor(id, radius) {
    const angle = (id * 2.3999632297) % (Math.PI * 2);
    const r = radius * 0.55;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  }

  function depositOffsetFor(id) {
    const angle = (id * 1.713) % (Math.PI * 2);
    return { x: Math.cos(angle) * 42, y: Math.sin(angle) * 28 };
  }

  function formationOffset(index, count) {
    if (count <= 1) return { x: 0, y: 0 };
    const cols = Math.ceil(Math.sqrt(count));
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      x: (col - (cols - 1) / 2) * 34,
      y: (row - Math.floor((count - 1) / cols) / 2) * 34,
    };
  }

  function applySeparation(dt) {
    void dt;
    return;
    for (let i = 0; i < state.units.length; i += 1) {
      for (let j = i + 1; j < state.units.length; j += 1) {
        const a = state.units[i];
        const b = state.units[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const desired = a.radius + b.radius + 6;
        if (d >= desired) continue;
        const push = (desired - d) * 0.5 * Math.min(1, dt * 10);
        a.x -= (dx / d) * push;
        a.y -= (dy / d) * push;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
      }
    }
  }

  function enforceStaticOccupancy() {
    for (const unit of state.units) {
      const hex = worldToAxial(unit.x, unit.y);
      if (!isStaticBlockedHex(hex)) continue;
      const safeHex = nearestWalkableHex(hex, hex);
      const point = axialToWorld(safeHex.q, safeHex.r);
      unit.x = point.x;
      unit.y = point.y;
      if (unit.order) unit.order.path = [];
    }
  }

  function updateCamera(dt) {
    const margin = 24;
    const speed = 500 / state.camera.zoom;
    const safe = cameraSafeScreenRect();
    const edgeScroll = pointerCanEdgeScroll(safe);
    let vx = 0;
    let vy = 0;
    if (state.keys.has("arrowleft") || (edgeScroll && state.mouse.x < safe.left + margin)) vx -= 1;
    if (state.keys.has("arrowright") || (edgeScroll && state.mouse.x > safe.right - margin)) vx += 1;
    if (state.keys.has("arrowup") || (edgeScroll && state.mouse.y < safe.top + margin)) vy -= 1;
    if (state.keys.has("arrowdown") || (edgeScroll && state.mouse.y > safe.bottom - margin)) vy += 1;
    if (vx || vy) {
      const len = Math.hypot(vx, vy);
      state.camera.x += (vx / len) * speed * dt;
      state.camera.y += (vy / len) * speed * dt;
      clampCamera();
    }
  }

  function clampCamera() {
    const safe = cameraSafeScreenRect();
    const minX = -safe.left / state.camera.zoom;
    const minY = -safe.top / state.camera.zoom;
    const maxX = WORLD.w - safe.right / state.camera.zoom;
    const maxY = WORLD.h - safe.bottom / state.camera.zoom;
    state.camera.x = clamp(state.camera.x, minX, Math.max(minX, maxX));
    state.camera.y = clamp(state.camera.y, minY, Math.max(minY, maxY));
  }

  function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.save();
    ctx.scale(state.camera.zoom, state.camera.zoom);
    ctx.translate(-state.camera.x, -state.camera.y);
    drawGround();
    drawOrderPaths();
    drawNodes();
    drawDummies();
    drawPlacementPreview();
    drawOrderMarkers();
    drawBuildings();
    drawUnits();
    drawHitFlashes();
    drawHoverLabel();
    ctx.restore();
    drawSelectionBox();
    drawMiniMap();
  }

  function drawGround() {
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    drawGroundPatch(axialToWorld(4, 4).x, axialToWorld(4, 4).y, 520, 360, "rgba(121, 230, 200, 0.07)");
    drawGroundPatch(axialToWorld(7, 3).x, axialToWorld(7, 3).y, 390, 350, "rgba(85, 125, 74, 0.08)");
    drawGroundPatch(axialToWorld(1, 3).x, axialToWorld(1, 3).y, 330, 240, "rgba(102, 216, 255, 0.065)");
    drawGroundPatch(axialToWorld(17, 7).x, axialToWorld(17, 7).y, 620, 430, "rgba(102, 216, 255, 0.055)");
    drawGroundPatch(axialToWorld(22, 12).x, axialToWorld(22, 12).y, 700, 500, "rgba(145, 167, 255, 0.045)");
    drawGroundPatch(axialToWorld(5, 12).x, axialToWorld(5, 12).y, 560, 420, "rgba(85, 125, 74, 0.07)");
    drawGroundPatch(axialToWorld(16, 18).x, axialToWorld(16, 18).y, 760, 430, "rgba(75, 48, 44, 0.09)");
    drawHexGrid();
    drawOccupiedHexes();
    drawWorldBoundary();
  }

  function drawHexGrid() {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = HEX_LINE;
    const maxQ = Math.ceil(WORLD.w / (HEX.size * SQRT3)) + 12;
    const maxR = Math.ceil(WORLD.h / (HEX.size * 1.5)) + 12;
    for (let q = -8; q < maxQ; q += 1) {
      for (let r = -8; r < maxR; r += 1) {
        const p = axialToWorld(q, r);
        if (p.x < -HEX.size || p.y < -HEX.size || p.x > WORLD.w + HEX.size || p.y > WORLD.h + HEX.size) continue;
        drawHex(p.x, p.y, HEX.size - 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawOccupiedHexes() {
    const occupied = new Map();
    for (const building of state.buildings) {
      for (const hex of building.footprint) occupied.set(axialKey(hex), { hex, color: HEX_OCCUPIED });
    }
    for (const node of state.nodes) occupied.set(axialKey(node.hex), { hex: node.hex, color: node.type === "ore" ? "rgba(102,216,255,0.1)" : "rgba(216,157,89,0.11)" });
    for (const dummy of state.dummies) occupied.set(axialKey(dummy.hex), { hex: dummy.hex, color: HEX_BLOCKED });

    ctx.save();
    for (const item of occupied.values()) {
      const p = axialToWorld(item.hex.q, item.hex.r);
      ctx.fillStyle = item.color;
      ctx.strokeStyle = "rgba(244,247,242,0.16)";
      ctx.lineWidth = 1.5;
      drawHex(p.x, p.y, HEX.size - 4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWorldBoundary() {
    ctx.save();
    ctx.strokeStyle = "rgba(244, 247, 242, 0.18)";
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 12]);
    ctx.strokeRect(1, 1, WORLD.w - 2, WORLD.h - 2);
    ctx.restore();
  }

  function drawGroundPatch(x, y, w, h, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(232, 240, 224, 0.08)";
    roundedRect(-w / 2, -h / 2, w, h, 28);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawHex(x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = Math.PI / 180 * (60 * i - 30);
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawOrderPaths() {
    const selection = selectedUnits();
    ctx.save();
    for (const unit of selection) {
      const path = unit.order?.path || [];
      if (!path.length) continue;
      ctx.strokeStyle = orderColor(unit.order);
      ctx.fillStyle = orderColor(unit.order);
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.56;
      ctx.setLineDash([9, 8]);
      ctx.beginPath();
      ctx.moveTo(unit.x, unit.y);
      for (let i = unit.order.pathIndex || 0; i < path.length; i += 1) ctx.lineTo(path[i].x, path[i].y);
      ctx.stroke();
      ctx.setLineDash([]);
      const last = path[path.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function orderColor(order) {
    if (!order) return PLAYER;
    if (order.type === "gather") return RESOURCE_TYPES[order.resourceType]?.color || PLAYER;
    if (order.type === "attack" || order.type === "attackMove") return "#ff8a68";
    if (order.type === "recon") return "#ffcf67";
    if (order.type === "build") return "#91a7ff";
    return PLAYER;
  }

  function drawNodes() {
    const hover = state.mouse.overBattlefield ? findNodeAt({ x: state.mouse.worldX, y: state.mouse.worldY }) : null;
    for (const node of state.nodes) {
      const emphasized = hover?.id === node.id || state.selectedIds.has(node.id);
      if (node.type === "ore") drawOreNode(node, emphasized);
      else drawWoodNode(node, emphasized);
    }
  }

  function drawOreNode(node, hovered) {
    const pct = node.amount / node.maxAmount;
    const rocks = [
      { x: -18, y: 9, s: 23 },
      { x: 4, y: -12, s: 30 },
      { x: 21, y: 12, s: 21 },
    ];
    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.globalAlpha = node.amount > 0 ? 0.55 + pct * 0.45 : 0.32;
    ctx.shadowColor = hovered ? "rgba(102, 216, 255, 0.95)" : "rgba(102, 216, 255, 0.45)";
    ctx.shadowBlur = hovered ? 22 : 10;
    for (const rock of rocks) {
      ctx.save();
      ctx.translate(rock.x, rock.y);
      ctx.rotate((rock.x + rock.y) * 0.03);
      ctx.fillStyle = node.amount > 0 ? "#406576" : "#384246";
      ctx.strokeStyle = node.amount > 0 ? ORE : "rgba(190, 206, 202, 0.3)";
      ctx.lineWidth = 2;
      drawCrystal(0, 0, rock.s);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (hovered) drawNodeHover(node.radius);
    ctx.restore();
    drawResourceBar(node);
  }

  function drawWoodNode(node, hovered) {
    const pct = node.amount / node.maxAmount;
    const trees = [
      { x: -22, y: 5, s: 24 },
      { x: 0, y: -18, s: 28 },
      { x: 24, y: 8, s: 24 },
      { x: 7, y: 24, s: 22 },
    ];
    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.globalAlpha = node.amount > 0 ? 0.5 + pct * 0.5 : 0.3;
    ctx.shadowColor = hovered ? "rgba(216, 157, 89, 0.9)" : "rgba(216, 157, 89, 0.35)";
    ctx.shadowBlur = hovered ? 20 : 8;
    for (const tree of trees) {
      ctx.save();
      ctx.translate(tree.x, tree.y);
      ctx.fillStyle = node.amount > 0 ? "#305b38" : "#5b4630";
      ctx.beginPath();
      ctx.arc(0, -tree.s * 0.55, tree.s * 0.58, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#936139";
      roundedRect(-5, -tree.s * 0.35, 10, tree.s * 0.92, 4);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "rgba(235, 177, 100, 0.9)";
    roundedRect(-23, 18, 46, 10, 5);
    ctx.fill();
    if (hovered) drawNodeHover(node.radius);
    ctx.restore();
    drawResourceBar(node);
  }

  function drawNodeHover(radius) {
    ctx.strokeStyle = "rgba(255, 245, 210, 0.82)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 8, radius + 8, (radius + 2) * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawResourceBar(node) {
    const color = RESOURCE_TYPES[node.type].color;
    drawBar(node.x, node.y + node.radius + 12, 58, 6, node.amount / node.maxAmount, color);
  }

  function drawHoverLabel() {
    if (state.mouse.down) return;
    const node = findNodeAt({ x: state.mouse.worldX, y: state.mouse.worldY });
    if (!node) return;
    const lines = [
      node.name,
      `${Math.ceil(node.amount)}/${node.maxAmount} ${RESOURCE_TYPES[node.type].label}`,
      compositionText(node, 3),
    ];
    drawWorldLabel(node.x, node.y - node.radius - 28, lines, RESOURCE_TYPES[node.type].color);
  }

  function drawWorldLabel(x, y, lines, color) {
    ctx.save();
    ctx.font = "12px Inter, sans-serif";
    const width = Math.max(...lines.map((line) => ctx.measureText(line).width)) + 18;
    const height = lines.length * 16 + 12;
    ctx.translate(x - width / 2, y - height);
    ctx.fillStyle = "rgba(11, 14, 14, 0.88)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    roundedRect(0, 0, width, height, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f4f7f2";
    for (let i = 0; i < lines.length; i += 1) {
      ctx.fillText(lines[i], 9, 18 + i * 16);
    }
    ctx.restore();
  }

  function drawDummies() {
    for (const dummy of state.dummies) {
      const selected = state.selectedIds.has(dummy.id);
      ctx.save();
      ctx.translate(dummy.x, dummy.y);
      if (selected) {
        ctx.strokeStyle = "#ffcf67";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 12, 38, 22, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#5f4731";
      ctx.strokeStyle = DUMMY;
      ctx.lineWidth = 2;
      roundedRect(-16, -26, 32, 58, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#b58d5f";
      ctx.beginPath();
      ctx.arc(0, -34, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#d8b077";
      ctx.beginPath();
      ctx.moveTo(-28, -8);
      ctx.lineTo(28, -8);
      ctx.moveTo(-14, 34);
      ctx.lineTo(-26, 54);
      ctx.moveTo(14, 34);
      ctx.lineTo(26, 54);
      ctx.stroke();
      ctx.restore();
      drawBar(dummy.x, dummy.y - 58, 58, 6, dummy.hp / dummy.maxHp, "#ff8a68");
    }
  }

  function drawPlacementPreview() {
    if (state.commandMode !== "buildBattery") return;
    const hex = worldToAxial(state.mouse.worldX, state.mouse.worldY);
    const p = axialToWorld(hex.q, hex.r);
    const valid = canPlaceBuildingAt(hex) && selectedUnits().length > 0 && canAfford(BUILDING_TYPES.batteryBank.cost);
    ctx.save();
    ctx.fillStyle = valid ? "rgba(145,167,255,0.2)" : "rgba(255,106,86,0.18)";
    ctx.strokeStyle = valid ? "rgba(145,167,255,0.92)" : "rgba(255,106,86,0.82)";
    ctx.lineWidth = 2;
    drawHex(p.x, p.y, HEX.size - 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawBuildings() {
    for (const building of state.buildings) {
      if (building.type === "mainBase") drawMainBase(building);
      if (building.type === "batteryBank") drawBatteryBank(building);
    }
  }

  function drawMainBase(base) {
    const selected = state.selectedIds.has(base.id);
    ctx.save();
    for (const hex of base.footprint) {
      const p = axialToWorld(hex.q, hex.r);
      ctx.fillStyle = selected ? "rgba(121,230,200,0.13)" : "rgba(121,230,200,0.06)";
      ctx.strokeStyle = selected ? "rgba(121,230,200,0.52)" : "rgba(121,230,200,0.18)";
      ctx.lineWidth = selected ? 2 : 1;
      drawHex(p.x, p.y, HEX.size - 8);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(base.x, base.y);

    if (selected) {
      ctx.strokeStyle = PLAYER;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 22, 130, 72, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowColor = "rgba(0, 0, 0, 0.48)";
    ctx.shadowBlur = 20;

    ctx.strokeStyle = "#8be8cc";
    ctx.fillStyle = "#253531";
    ctx.lineWidth = 2;
    roundedRect(-98, -58, 196, 116, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#5f4630";
    ctx.strokeStyle = "#d6a05f";
    roundedRect(-74, -90, 148, 42, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#1d2926";
    roundedRect(-45, -26, 90, 52, 8);
    ctx.fill();

    ctx.strokeStyle = "rgba(121, 230, 200, 0.55)";
    ctx.setLineDash([8, 7]);
    ctx.beginPath();
    ctx.moveTo(-34, 0);
    ctx.lineTo(34, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = ORE;
    roundedRect(-92, 6, 34, 28, 5);
    ctx.fill();
    ctx.fillStyle = WOOD;
    roundedRect(58, 6, 40, 20, 5);
    ctx.fill();

    ctx.strokeStyle = "#d9e2dc";
    ctx.lineWidth = 4;
    for (const leg of [
      [-92, -46, -128, -80],
      [92, -46, 128, -80],
      [-92, 46, -128, 80],
      [92, 46, 128, 80],
    ]) {
      ctx.beginPath();
      ctx.moveTo(leg[0], leg[1]);
      ctx.lineTo(leg[2], leg[3]);
      ctx.stroke();
    }

    if (base.queue.length) {
      const item = base.queue[0];
      drawBar(0, -112, 112, 8, 1 - item.remaining / item.total, "#ffcf67");
    }

    ctx.restore();

    if (selected && base.rally) {
      const rallyTarget = rallyPoint(base.rally, base.hex);
      ctx.save();
      ctx.strokeStyle = "rgba(121, 230, 200, 0.55)";
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(rallyTarget.x, rallyTarget.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = base.rally.type === "resource" ? markerColor(base.rally.resourceType) : PLAYER;
      ctx.beginPath();
      ctx.arc(rallyTarget.x, rallyTarget.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function rallyPoint(rally, fromHex = null) {
    if (rally.type === "resource") {
      const node = getNode(rally.nodeId);
      if (node) {
        const approach = chooseAdjacentWalkableHex(node.hex, fromHex || node.hex);
        return axialToWorld(approach.q, approach.r);
      }
    }
    return { x: rally.x, y: rally.y };
  }

  function drawBatteryBank(bank) {
    const selected = state.selectedIds.has(bank.id);
    const pct = bank.underConstruction ? 1 - bank.build.remaining / bank.build.total : 1;
    ctx.save();
    const p = axialToWorld(bank.hex.q, bank.hex.r);
    ctx.fillStyle = selected ? "rgba(145,167,255,0.16)" : "rgba(145,167,255,0.08)";
    ctx.strokeStyle = selected ? "rgba(145,167,255,0.72)" : "rgba(145,167,255,0.32)";
    ctx.lineWidth = selected ? 2.5 : 1.5;
    drawHex(p.x, p.y, HEX.size - 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(bank.x, bank.y);
    if (selected) {
      ctx.strokeStyle = "#91a7ff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 16, 48, 27, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = bank.underConstruction ? "#263033" : "#26324a";
    ctx.strokeStyle = "#91a7ff";
    ctx.lineWidth = 2;
    roundedRect(-32, -28, 64, 58, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#111820";
    roundedRect(-22, -16, 44, 28, 5);
    ctx.fill();
    ctx.fillStyle = "#ffcf67";
    roundedRect(-17, -10, 34 * pct, 16, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(244,247,242,0.5)";
    ctx.beginPath();
    ctx.moveTo(-24, 24);
    ctx.lineTo(24, 24);
    ctx.stroke();
    ctx.restore();

    if (bank.underConstruction) drawBar(bank.x, bank.y - 50, 70, 7, pct, "#91a7ff");
  }

  function drawUnits() {
    for (const unit of [...state.units].sort((a, b) => a.y - b.y)) drawGathererBot(unit);
  }

  function drawGathererBot(unit) {
    const selected = state.selectedIds.has(unit.id);
    const moving = unit.order?.type !== "idle";
    const wheelSpin = moving ? unit.anim * 8 : 0;
    const bob = Math.sin(unit.anim * 7) * (moving ? 0.75 : 0.25);
    ctx.save();
    ctx.translate(unit.x, unit.y + bob);

    if (selected) {
      ctx.strokeStyle = PLAYER;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 6, 34, 21, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.rotate(unit.angle + Math.PI / 2);

    ctx.shadowColor = "rgba(0, 0, 0, 0.48)";
    ctx.shadowBlur = 12;

    drawRobotWheel(-26, 7, wheelSpin);
    drawRobotWheel(26, 7, -wheelSpin);
    drawCasterWheel(-15, -26, wheelSpin);
    drawCasterWheel(15, -26, -wheelSpin);

    ctx.fillStyle = "#101616";
    ctx.strokeStyle = "#30454d";
    ctx.lineWidth = 2.5;
    roundedRect(-25, -25, 50, 55, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#162225";
    ctx.strokeStyle = "#3a4d54";
    roundedRect(-22, 14, 44, 17, 5);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(65, 154, 255, 0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, 25);
    ctx.lineTo(18, 25);
    ctx.moveTo(-21, -18);
    ctx.lineTo(21, -18);
    ctx.stroke();

    drawWireBasket(-19, -24, 38, 18, true);
    drawWireBasket(-18, -4, 36, 18, false);
    if (unit.carried) drawCartbotCargo(unit.carried);

    ctx.strokeStyle = "#a9b8b9";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-23, 31);
    ctx.quadraticCurveTo(0, 38, 23, 31);
    ctx.stroke();

    ctx.fillStyle = "#141d20";
    ctx.strokeStyle = "#4a626b";
    roundedRect(-10, 27, 20, 8, 4);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = "#67d6ff";
    ctx.shadowBlur = 9;
    ctx.fillStyle = "#67d6ff";
    roundedRect(-13, 18, 26, 4, 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const claw =
      unit.order?.type === "gather"
        ? Math.sin(unit.gatherTimer * 16) * 4
        : unit.order?.type === "attack"
          ? Math.sin((UNIT_TYPES.peon.attackCooldown - unit.attackTimer) * 18) * 4
          : 0;
    drawCartbotArm(-1, claw);
    drawCartbotArm(1, claw);

    ctx.restore();
  }

  function drawRobotWheel(x, y, spin) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin * 0.18);
    ctx.fillStyle = "#090d0e";
    ctx.strokeStyle = "#39474b";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(65, 154, 255, 0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#1d2a2e";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(220, 231, 230, 0.72)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(8, 0);
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 8);
    ctx.stroke();
    ctx.restore();
  }

  function drawCasterWheel(x, y, spin) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin * 0.22);
    ctx.fillStyle = "#0a0e0f";
    ctx.strokeStyle = "#66777a";
    ctx.lineWidth = 1.5;
    roundedRect(-4, -8, 8, 16, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawWireBasket(x, y, w, h, topBasket) {
    ctx.save();
    ctx.fillStyle = topBasket ? "rgba(30, 39, 42, 0.92)" : "rgba(24, 33, 35, 0.92)";
    ctx.strokeStyle = "#909d9f";
    ctx.lineWidth = 1.8;
    roundedRect(x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(178, 190, 190, 0.42)";
    ctx.lineWidth = 1;
    for (let gx = x + 7; gx < x + w - 2; gx += 7) {
      ctx.beginPath();
      ctx.moveTo(gx, y + 3);
      ctx.lineTo(gx - 2, y + h - 3);
      ctx.stroke();
    }
    for (let gy = y + 6; gy < y + h - 2; gy += 6) {
      ctx.beginPath();
      ctx.moveTo(x + 3, gy);
      ctx.lineTo(x + w - 3, gy);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(65, 154, 255, 0.86)";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 2);
    ctx.lineTo(x + w - 3, y + 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawCartbotCargo(carried) {
    ctx.save();
    ctx.translate(0, -14);
    if (carried.type === "ore") {
      ctx.fillStyle = ORE;
      ctx.shadowColor = ORE;
      ctx.shadowBlur = 8;
      for (const rock of [
        [-7, 1, 7],
        [2, -1, 8],
        [8, 4, 6],
      ]) {
        drawCrystal(rock[0], rock[1], rock[2]);
        ctx.fill();
      }
    } else {
      ctx.rotate(-0.18);
      ctx.fillStyle = WOOD;
      ctx.shadowColor = WOOD;
      ctx.shadowBlur = 6;
      roundedRect(-14, -5, 28, 6, 3);
      ctx.fill();
      ctx.fillStyle = "#efbd76";
      roundedRect(-12, 2, 25, 5, 3);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCartbotArm(side, claw) {
    const mountX = side * 15;
    const elbowX = side * (23 + claw * 0.3);
    const wristX = side * (31 + claw);
    const gripX = side * (35 + claw);
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "#aeb9ba";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mountX, -15);
    ctx.lineTo(elbowX, -27);
    ctx.lineTo(wristX, -36);
    ctx.stroke();
    ctx.fillStyle = "#172225";
    ctx.strokeStyle = "#4c646b";
    ctx.lineWidth = 1.5;
    for (const joint of [
      [mountX, -15, 4],
      [elbowX, -27, 5],
      [wristX, -36, 4],
    ]) {
      ctx.beginPath();
      ctx.arc(joint[0], joint[1], joint[2], 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.strokeStyle = "#67d6ff";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(mountX, -15);
    ctx.lineTo(wristX, -36);
    ctx.stroke();
    ctx.strokeStyle = "#d5dedc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wristX, -36);
    ctx.lineTo(gripX, -43);
    ctx.lineTo(gripX - side * 7, -47);
    ctx.moveTo(gripX, -43);
    ctx.lineTo(gripX + side * 5, -49);
    ctx.stroke();
    ctx.restore();
  }

  function drawOrderMarkers() {
    for (const marker of state.orderMarkers) {
      const pct = marker.t / marker.max;
      const color = markerColor(marker.type);
      ctx.save();
      ctx.globalAlpha = pct;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.lineWidth = marker.kind === "move" ? 2 : 4;
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, (1 - pct) * 28 + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawHitFlashes() {
    for (const flash of state.hitFlashes) {
      const pct = flash.t / flash.max;
      ctx.save();
      ctx.globalAlpha = pct;
      ctx.strokeStyle = "#ff8a68";
      ctx.shadowColor = "#ff8a68";
      ctx.shadowBlur = 14;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(flash.x, flash.y, (1 - pct) * 22 + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function markerColor(type) {
    if (type === "ore") return ORE;
    if (type === "wood") return WOOD;
    if (type === "attack") return "#ff8a68";
    if (type === "recon") return "#ffcf67";
    if (type === "build") return "#91a7ff";
    if (type === "brain") return "#91a7ff";
    return PLAYER;
  }

  function drawSelectionBox() {
    const drag = state.mouse.drag;
    if (!state.mouse.down || !drag) return;
    const dx = state.mouse.x - drag.x;
    const dy = state.mouse.y - drag.y;
    if (Math.hypot(dx, dy) < 6) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = "rgba(121, 230, 200, 0.95)";
    ctx.fillStyle = "rgba(121, 230, 200, 0.12)";
    ctx.lineWidth = state.dpr;
    ctx.strokeRect(drag.x * state.dpr, drag.y * state.dpr, dx * state.dpr, dy * state.dpr);
    ctx.fillRect(drag.x * state.dpr, drag.y * state.dpr, dx * state.dpr, dy * state.dpr);
    ctx.restore();
  }

  function drawMiniMap() {
    const sx = mini.width / WORLD.w;
    const sy = mini.height / WORLD.h;
    miniCtx.clearRect(0, 0, mini.width, mini.height);
    miniCtx.fillStyle = "#111613";
    miniCtx.fillRect(0, 0, mini.width, mini.height);

    for (const node of state.nodes) {
      miniCtx.fillStyle = node.type === "ore" ? ORE : WOOD;
      miniCtx.globalAlpha = node.amount > 0 ? 1 : 0.35;
      miniCtx.fillRect(node.x * sx - 1.5, node.y * sy - 1.5, 3, 3);
    }
    miniCtx.globalAlpha = 1;
    for (const dummy of state.dummies) {
      miniCtx.fillStyle = "#ff8a68";
      miniCtx.fillRect(dummy.x * sx - 1.5, dummy.y * sy - 1.5, 3, 3);
    }
    for (const building of state.buildings) {
      miniCtx.fillStyle = PLAYER;
      miniCtx.fillRect(building.x * sx - 3, building.y * sy - 3, 6, 6);
    }
    for (const unit of state.units) {
      miniCtx.fillStyle = "#f4f7f2";
      miniCtx.fillRect(unit.x * sx - 1.5, unit.y * sy - 1.5, 3, 3);
    }

    for (const ping of state.miniMapPings) {
      const pct = clamp(ping.t / ping.max, 0, 1);
      const x = ping.x * sx;
      const y = ping.y * sy;
      const color = ping.type === "danger" || ping.type === "combat" ? "#ff5e4d" : "#ffcf67";
      miniCtx.save();
      miniCtx.globalAlpha = Math.max(0.12, pct);
      miniCtx.strokeStyle = color;
      miniCtx.fillStyle = color;
      miniCtx.lineWidth = 1.5;
      miniCtx.beginPath();
      miniCtx.arc(x, y, 3 + (1 - pct) * 18, 0, Math.PI * 2);
      miniCtx.stroke();
      miniCtx.globalAlpha = Math.max(0.18, pct * 0.8);
      miniCtx.beginPath();
      miniCtx.arc(x, y, 2.2, 0, Math.PI * 2);
      miniCtx.fill();
      miniCtx.restore();
    }

    const safe = cameraSafeScreenRect();
    const viewStart = screenToWorld(safe.left, safe.top);
    const viewEnd = screenToWorld(safe.right, safe.bottom);
    const viewLeft = clamp(viewStart.x, 0, WORLD.w);
    const viewTop = clamp(viewStart.y, 0, WORLD.h);
    const viewRight = clamp(viewEnd.x, 0, WORLD.w);
    const viewBottom = clamp(viewEnd.y, 0, WORLD.h);

    miniCtx.strokeStyle = "#f4f7f2";
    miniCtx.lineWidth = 1;
    miniCtx.strokeRect(viewLeft * sx, viewTop * sy, Math.max(0, viewRight - viewLeft) * sx, Math.max(0, viewBottom - viewTop) * sy);
  }

  function drawBar(x, y, w, h, pct, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    roundedRect(-w / 2, -h / 2, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = color;
    roundedRect(-w / 2, -h / 2, w * clamp(pct, 0, 1), h, h / 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCrystal(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.72, y - size * 0.15);
    ctx.lineTo(x + size * 0.38, y + size);
    ctx.lineTo(x - size * 0.55, y + size * 0.72);
    ctx.lineTo(x - size * 0.75, y - size * 0.12);
    ctx.closePath();
  }

  function roundedRect(x, y, w, h, r) {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function findEntityAt(point) {
    const units = state.units.filter((unit) => distance(unit, point) <= unit.radius + 8);
    if (units.length) return units.sort((a, b) => distance(a, point) - distance(b, point))[0];
    const nodes = state.nodes.filter((node) => distance(node, point) <= node.radius + 15);
    if (nodes.length) return nodes.sort((a, b) => distance(a, point) - distance(b, point))[0];
    const dummies = state.dummies.filter((dummy) => distance(dummy, point) <= dummy.radius + 12);
    if (dummies.length) return dummies.sort((a, b) => distance(a, point) - distance(b, point))[0];
    const buildings = state.buildings.filter((building) => distance(building, point) <= building.radius + 28);
    if (buildings.length) return buildings.sort((a, b) => distance(a, point) - distance(b, point))[0];
    return null;
  }

  function findNodeAt(point) {
    const nodes = state.nodes.filter((node) => distance(node, point) <= node.radius + 15);
    if (!nodes.length) return null;
    return nodes.sort((a, b) => distance(a, point) - distance(b, point))[0];
  }

  function isVisibleOnScreen(entity) {
    const p = worldToScreen(entity.x, entity.y);
    const safe = cameraSafeScreenRect();
    return p.x >= safe.left - 40 && p.y >= safe.top - 40 && p.x <= safe.right + 40 && p.y <= safe.bottom + 40;
  }

  function selectSingle(entity, append) {
    if (!append) state.selectedIds.clear();
    if (!entity) {
      refreshUi();
      return;
    }
    if (append && state.selectedIds.has(entity.id)) state.selectedIds.delete(entity.id);
    else state.selectedIds.add(entity.id);
    refreshUi();
  }

  function selectSameVisibleType(entity) {
    state.selectedIds.clear();
    if (entity.kind !== "unit") {
      state.selectedIds.add(entity.id);
      refreshUi();
      return;
    }
    for (const unit of state.units) {
      if (unit.type === entity.type && isVisibleOnScreen(unit)) state.selectedIds.add(unit.id);
    }
    announce(`Selected visible ${UNIT_TYPES[entity.type].label}s.`);
    refreshUi();
  }

  function selectBox(start, end, append) {
    const left = Math.min(start.worldX, end.worldX);
    const right = Math.max(start.worldX, end.worldX);
    const top = Math.min(start.worldY, end.worldY);
    const bottom = Math.max(start.worldY, end.worldY);

    const units = state.units.filter((unit) => unit.x >= left && unit.x <= right && unit.y >= top && unit.y <= bottom);
    const buildings = state.buildings.filter((building) => building.x >= left && building.x <= right && building.y >= top && building.y <= bottom);
    const dummies = state.dummies.filter((dummy) => dummy.x >= left && dummy.x <= right && dummy.y >= top && dummy.y <= bottom);
    const picked = units.length ? units : buildings.length ? buildings : dummies;

    if (!append) state.selectedIds.clear();
    for (const entity of picked) state.selectedIds.add(entity.id);
    refreshUi();
  }

  function issueRightClick(point) {
    const units = selectedUnits();
    const selected = selectedEntities();
    const node = findNodeAt(point);
    const entity = findEntityAt(point);

    if (units.length) {
      if (node) {
        if (node.amount <= 0) {
          announce("That resource is depleted.");
          return;
        }
        units.forEach((unit) => setGatherOrder(unit, node));
        addMarker(node.x, node.y, node.type, "gather");
        announce(`Gather route set: ${RESOURCE_TYPES[node.type].label} -> Main Base.`);
        return;
      }

      if (entity?.kind === "dummy") {
        units.forEach((unit) => setAttackOrder(unit, entity));
        addMarker(entity.x, entity.y, "attack", "attack");
        raiseWorldAlert("Attack target assigned.", entity.x, entity.y, "combat");
        return;
      }

      if (entity?.kind === "building" && entity.underConstruction) {
        units.forEach((unit) => setResumeBuildOrder(unit, entity));
        addMarker(entity.x, entity.y, "build", "move");
        announce(`Construction resumed: ${BUILDING_TYPES[entity.type].label}.`);
        refreshUi();
        return;
      }

      if (entity?.kind === "building" && entity.type === "mainBase") {
        units.forEach((unit) => {
          if (unit.carried) {
            clearOrderQueue(unit);
            const fromHex = worldToAxial(unit.x, unit.y);
            const dropoffHex = buildingDropoffHex(entity, fromHex);
            const order = {
              type: "gather",
              phase: "returning",
              nodeId: null,
              dropoffId: entity.id,
              resourceType: unit.carried.type,
              dropoffHex,
              path: [],
              pathIndex: 0,
            };
            primeOrderPath(order, fromHex, dropoffHex);
            unit.order = order;
            unit.gatherTimer = 0;
          } else {
            const dropoffHex = buildingDropoffHex(entity, worldToAxial(unit.x, unit.y));
            const p = axialToWorld(dropoffHex.q, dropoffHex.r);
            setMoveOrder(unit, p);
          }
        });
        addMarker(entity.x, entity.y, "base", "deposit");
        return;
      }

      units.forEach((unit, i) => {
        const offset = formationOffset(i, units.length);
        setMoveOrder(unit, { x: point.x + offset.x, y: point.y + offset.y });
      });
      addMarker(point.x, point.y, "move", "move");
      return;
    }

    if (selected.length === 1 && selected[0].kind === "building" && selected[0].type === "mainBase") {
      if (node) {
        setResourceRally(selected[0], node);
        return;
      }
      if (!entity) {
        setGroundRally(selected[0], point);
        return;
      }
    }
  }

  function issueCommandMode(point) {
    const units = selectedUnits();
    if (!units.length) {
      announce("Select cartbots first.");
      state.commandMode = null;
      refreshUi();
      return;
    }

    if (state.commandMode === "gather") {
      const node = findNodeAt(point);
      if (!node) {
        announce("Gather needs ore or lumber.");
        return;
      }
      units.forEach((unit) => setGatherOrder(unit, node));
      addMarker(node.x, node.y, node.type, "gather");
      announce(`Gather route set: ${RESOURCE_TYPES[node.type].label} -> Main Base.`);
      state.commandMode = null;
      refreshUi();
      return;
    }

    if (state.commandMode === "attack") {
      const entity = findEntityAt(point);
      if (entity?.kind === "dummy") {
        units.forEach((unit) => setAttackOrder(unit, entity));
        addMarker(entity.x, entity.y, "attack", "attack");
        raiseWorldAlert("Attack target assigned.", entity.x, entity.y, "combat");
      } else {
        units.forEach((unit, i) => {
          const offset = formationOffset(i, units.length);
          setAttackMoveOrder(unit, { x: point.x + offset.x, y: point.y + offset.y });
        });
        addMarker(point.x, point.y, "attack", "attack");
        raiseWorldAlert("Attack-move assigned.", point.x, point.y, "combat");
      }
      state.commandMode = null;
      refreshUi();
      return;
    }

    if (state.commandMode === "recon") {
      units.forEach((unit, i) => {
        const offset = formationOffset(i, units.length);
        setReconOrder(unit, { x: point.x + offset.x, y: point.y + offset.y });
      });
      addMarker(point.x, point.y, "recon", "move");
      announce("Recon route assigned.");
      state.commandMode = null;
      refreshUi();
      return;
    }

    if (state.commandMode === "buildBattery") {
      if (placeBatteryBank(point)) state.commandMode = null;
      refreshUi();
    }
  }

  function addMarker(x, y, type, kind) {
    state.orderMarkers.push({ x, y, type, kind, t: 0.55, max: 0.55 });
  }

  function saveControlGroup(n) {
    const ids = selectedUnits().map((unit) => unit.id);
    if (!ids.length) {
      announce(`Group ${n} needs units.`);
      return;
    }
    state.controlGroups.set(n, ids);
    announce(`Group ${n} saved: ${ids.length} bot${ids.length === 1 ? "" : "s"}.`);
    refreshUi();
  }

  function loadControlGroup(n) {
    const ids = state.controlGroups.get(n) || [];
    state.selectedIds.clear();
    for (const id of ids) {
      if (state.units.some((unit) => unit.id === id)) state.selectedIds.add(id);
    }
    if (state.selectedIds.size) announce(`Group ${n} recalled.`);
    refreshUi();
  }

  function setCommandMode(mode) {
    if (!selectedUnits().length) {
      announce("Select cartbots first.");
      return;
    }
    state.commandMode = state.commandMode === mode ? null : mode;
    ui.alerts.textContent = modeStatusText();
    refreshUi();
  }

  function modeStatusText() {
    if (state.commandMode === "attack") return "Attack: click a dummy or ground.";
    if (state.commandMode === "gather") return "Gather: click ore or lumber.";
    if (state.commandMode === "recon") return "Recon: click route endpoint.";
    if (state.commandMode === "buildBattery") return "Build Battery: click an empty hex.";
    return "";
  }

  function refreshUi() {
    hideTooltip();
    ui.ore.textContent = Math.floor(state.resources.ore);
    ui.wood.textContent = Math.floor(state.resources.wood);
    ui.chips.textContent = `${Math.floor(state.resources.chips)} chips`;
    ui.workers.textContent = `${usedWorkerCapacity()}/${workerCapacity()} bots`;
    ui.status.textContent = statusText();
    renderManagement();

    const selection = selectedEntities();
    renderSelectionPanel(selection);
    renderCommands(selection);
    renderSelectionList(selection);
  }

  function refreshSelectedMeta() {
    const selection = selectedEntities();
    renderSelectionPanel(selection);
    renderSelectionList(selection);
  }

  function renderSelectionPanel(selection) {
    if (!selection.length) {
      ui.selectionName.textContent = "No Selection";
      ui.selectionMeta.textContent = "Select a cartbot, dummy, resource, or the main base";
      ui.portraitIcon.dataset.kind = "none";
      return;
    }
    if (selection.length > 1) {
      ui.selectionName.textContent = `${selection.length} Selected`;
      ui.selectionMeta.textContent = summarizeSelection(selection);
      ui.portraitIcon.dataset.kind = "multi";
      return;
    }

    const entity = selection[0];
    if (entity.kind === "unit") {
      ui.selectionName.textContent = "Cartbot";
      ui.selectionMeta.textContent = unitStateText(entity);
      ui.portraitIcon.dataset.kind = "peon";
    } else if (entity.kind === "dummy") {
      ui.selectionName.textContent = "Training Dummy";
      ui.selectionMeta.textContent = `${Math.max(0, Math.ceil(entity.hp))}/100 HP`;
      ui.portraitIcon.dataset.kind = "dummy";
    } else if (entity.kind === "resource") {
      ui.selectionName.textContent = entity.name;
      ui.selectionMeta.textContent = resourceStateText(entity);
      ui.portraitIcon.dataset.kind = entity.type;
    } else {
      ui.selectionName.textContent = BUILDING_TYPES[entity.type].label;
      ui.selectionMeta.textContent = buildingStateText(entity);
      ui.portraitIcon.dataset.kind = entity.type === "batteryBank" ? "battery" : "base";
    }
  }

  function statusText() {
    if (state.commandMode) return modeStatusText();
    const active = state.units.filter((unit) => unit.order?.type && unit.order.type !== "idle").length;
    const queued = state.buildings.reduce((total, building) => total + building.queue.length, 0);
    const upgraded = state.units.filter((unit) => unit.brainTier > 0).length;
    return `${active}/${state.units.length} cartbots active. Queue: ${queued}. Capacity: ${usedWorkerCapacity()}/${workerCapacity()}. Brains: ${upgraded}/${state.units.length}.`;
  }

  function renderManagement() {
    const counts = { idle: 0, ore: 0, lumber: 0, returning: 0, build: 0, recon: 0, attack: 0 };
    for (const unit of state.units) {
      const order = unit.order || { type: "idle" };
      if (order.type === "idle") counts.idle += 1;
      else if (order.type === "gather" && order.phase === "returning") counts.returning += 1;
      else if (order.type === "gather" && order.resourceType === "ore") counts.ore += 1;
      else if (order.type === "gather" && order.resourceType === "wood") counts.lumber += 1;
      else if (order.type === "build") counts.build += 1;
      else if (order.type === "recon") counts.recon += 1;
      else if (order.type === "attack" || order.type === "attackMove") counts.attack += 1;
      else counts.idle += 1;
    }
    ui.idleBots.textContent = counts.idle;
    ui.oreBots.textContent = counts.ore;
    ui.lumberBots.textContent = counts.lumber;
    ui.returningBots.textContent = counts.returning;
    ui.buildBots.textContent = counts.build;
    ui.reconBots.textContent = counts.recon;
    ui.attackBots.textContent = counts.attack;
    renderControlGroups();
  }

  function renderControlGroups() {
    ui.groupStrip.innerHTML = "";
    const groups = [...state.controlGroups.entries()]
      .map(([n, ids]) => [n, ids.filter((id) => state.units.some((unit) => unit.id === id))])
      .filter(([, ids]) => ids.length);
    if (!groups.length) {
      const empty = document.createElement("span");
      empty.className = "group-empty";
      empty.textContent = "No groups";
      ui.groupStrip.append(empty);
      return;
    }
    for (const [n, ids] of groups) {
      const chip = document.createElement("div");
      chip.className = "group-chip";
      chip.innerHTML = `<strong>${n}</strong><small>${ids.length} bot${ids.length === 1 ? "" : "s"}</small>`;
      ui.groupStrip.append(chip);
    }
  }

  function summarizeSelection(selection) {
    const units = selection.filter((entity) => entity.kind === "unit").length;
    const bases = selection.filter((entity) => entity.kind === "building").length;
    const dummies = selection.filter((entity) => entity.kind === "dummy").length;
    const resources = selection.filter((entity) => entity.kind === "resource").length;
    const parts = [];
    if (units) parts.push(`${units} Cartbot${units === 1 ? "" : "s"}`);
    if (bases) parts.push(`${bases} Base${bases === 1 ? "" : "s"}`);
    if (dummies) parts.push(`${dummies} Dummy${dummies === 1 ? "" : "ies"}`);
    if (resources) parts.push(`${resources} Resource${resources === 1 ? "" : "s"}`);
    return parts.join(", ");
  }

  function unitStateText(unit) {
    const carry = unit.carried ? ` carrying ${unit.carried.amount} ${RESOURCE_TYPES[unit.carried.type].carryLabel}` : "";
    const queued = buildQueueCount(unit);
    const queueText = queued ? `, ${queued} build queued` : "";
    const brain = BRAIN_TIERS[unit.brainTier || 0].short;
    if (!unit.order || unit.order.type === "idle") return `${brain}: Idle${carry}`;
    if (unit.order.type === "move") return `${brain}: Moving${carry}`;
    if (unit.order.type === "gather") {
      const returnType = unit.carried?.type || unit.order.resourceType;
      if (unit.order.phase === "returning") return `${brain}: Returning ${RESOURCE_TYPES[returnType].label}${carry}`;
      return `${brain}: Gathering ${RESOURCE_TYPES[unit.order.resourceType].label}${carry}`;
    }
    if (unit.order.type === "attack") return `${brain}: Attacking`;
    if (unit.order.type === "attackMove") return `${brain}: Attack-moving`;
    if (unit.order.type === "recon") return `${brain}: Recon route`;
    if (unit.order.type === "build") {
      const building = getBuilding(unit.order.buildingId);
      return `${brain}: Building ${building ? BUILDING_TYPES[building.type].label : "Structure"}${queueText}`;
    }
    return `${brain}: Ready${carry}`;
  }

  function resourceStateText(node) {
    const assigned = assignedBotCount(node);
    const remaining = `${Math.ceil(node.amount)}/${node.maxAmount} ${RESOURCE_TYPES[node.type].label}`;
    return `${remaining} - ${assigned} bot${assigned === 1 ? "" : "s"} assigned`;
  }

  function assignedBotCount(node) {
    return state.units.filter((unit) => unit.order?.type === "gather" && unit.order.nodeId === node.id).length;
  }

  function compositionText(node, limit = 4) {
    return Object.entries(node.composition)
      .slice(0, limit)
      .map(([name, value]) => `${titleCase(name)} ${value}%`)
      .join(" / ");
  }

  function titleCase(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function buildingStateText(building) {
    if (building.type === "batteryBank") {
      if (building.underConstruction) return `Building - ${Math.round((1 - building.build.remaining / building.build.total) * 100)}%`;
      return "+10 worker capacity";
    }
    return baseStateText(building);
  }

  function baseStateText(base) {
    const rally = base.rally ? ` - ${rallyText(base.rally)}` : "";
    if (!base.queue.length) return `Queue empty${rally}`;
    const item = base.queue[0];
    const pct = Math.round((1 - item.remaining / item.total) * 100);
    return `${queueItemLabel(item)} - ${pct}% (${base.queue.length} queued)${rally}`;
  }

  function queueItemLabel(item) {
    if (item.type === "peon") return "Fabricating Cartbot";
    if (item.type === "brainShipment") return "Exporting for Brain Chips";
    return "Processing";
  }

  function rallyText(rally) {
    if (rally.type === "resource") {
      const node = getNode(rally.nodeId);
      return `Rally: ${node ? node.name : RESOURCE_TYPES[rally.resourceType].label}`;
    }
    if (rally.type === "point") return `Rally: ${hexLabel(rally.hex || worldToAxial(rally.x, rally.y))}`;
    return "Rally unset";
  }

  function renderCommands(selection) {
    ui.actionGrid.innerHTML = "";
    const base = selection.length === 1 && selection[0].kind === "building" && selection[0].type === "mainBase" ? selection[0] : null;
    const hasUnit = selection.some((entity) => entity.kind === "unit");

    if (base) {
      ui.actionGrid.append(
        commandButton({
          label: "Fabricate Bot",
          icon: "P",
          color: "#7fe5c7",
          cost: UNIT_TYPES.peon.cost,
          tip: hasWorkerCapacity() ? "Queue a compact cartbot at the main base." : "Worker limit reached. Build a Battery Bank.",
          disabled: !canAfford(UNIT_TYPES.peon.cost) || !hasWorkerCapacity(),
          onClick: () => trainPeon(base),
        }),
        commandButton({
          label: "Cancel Bot",
          icon: "X",
          color: "#ff8a68",
          cost: null,
          tip: "Cancel the newest queued cartbot and refund its cost.",
          disabled: !base.queue.some((item) => item.type === "peon"),
          onClick: () => cancelQueuedPeon(base),
        }),
        commandButton({
          label: "Export Goods",
          icon: "T",
          color: "#91a7ff",
          cost: TRADE_SHIPMENTS.brainChip.cost,
          tip: "Ship ore and lumber offsite. A foundry sends back brain chips for cartbot upgrades.",
          disabled: !canAfford(TRADE_SHIPMENTS.brainChip.cost),
          onClick: () => queueBrainShipment(base),
        }),
        commandButton({
          label: "Cancel Export",
          icon: "C",
          color: "#ffcf67",
          cost: null,
          tip: "Cancel the newest export shipment and return its resources.",
          disabled: !base.queue.some((item) => item.type === "brainShipment"),
          onClick: () => cancelQueuedBrainShipment(base),
        }),
      );
      return;
    }

    if (hasUnit) {
      const brainCost = selectedBrainUpgradeCost();
      ui.actionGrid.append(
        commandButton({
          label: "Attack",
          icon: "A",
          color: "#ff8a68",
          tip: "Click a dummy to attack, or ground to attack-move.",
          active: state.commandMode === "attack",
          onClick: () => setCommandMode("attack"),
        }),
        commandButton({
          label: "Gather",
          icon: "G",
          color: "#d89d59",
          tip: "Click ore or lumber to assign a gather-return route.",
          active: state.commandMode === "gather",
          onClick: () => setCommandMode("gather"),
        }),
        commandButton({
          label: "Recon",
          icon: "R",
          color: "#ffcf67",
          tip: "Click a point to patrol back and forth along a recon route.",
          active: state.commandMode === "recon",
          onClick: () => setCommandMode("recon"),
        }),
        commandButton({
          label: "Stop",
          icon: "S",
          color: "#f3efe2",
          tip: "Clear current orders.",
          onClick: stopSelectedUnits,
        }),
        commandButton({
          label: "Build Battery",
          icon: "B",
          color: "#91a7ff",
          cost: BUILDING_TYPES.batteryBank.cost,
          tip: "Place a one-hex Battery Bank. Adds 10 worker capacity when built.",
          disabled: !canAfford(BUILDING_TYPES.batteryBank.cost),
          active: state.commandMode === "buildBattery",
          onClick: () => setCommandMode("buildBattery"),
        }),
        commandButton({
          label: "Install Brain",
          icon: "I",
          color: "#91a7ff",
          cost: brainCost,
          tip: brainCost ? "Install the next imported brain tier into all selected cartbots." : "Selected cartbots are already at the best brain tier.",
          disabled: !brainCost || !canAfford(brainCost),
          onClick: upgradeSelectedBrains,
        }),
      );
      return;
    }

    const empty = document.createElement("div");
    empty.className = "selection-row";
    if (selection[0]?.kind === "dummy") empty.textContent = "Target dummy.";
    else if (selection[0]?.kind === "resource") empty.textContent = "Resource survey.";
    else empty.textContent = "No commands available.";
    ui.actionGrid.append(empty);
  }

  function commandButton(options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `command-button${options.active ? " active" : ""}`;
    button.disabled = Boolean(options.disabled);
    button.addEventListener("click", () => {
      hideTooltip();
      options.onClick();
    });
    button.addEventListener("mouseenter", (event) => showTooltip(options, event.clientX, event.clientY));
    button.addEventListener("mousemove", (event) => moveTooltip(event.clientX, event.clientY));
    button.addEventListener("mouseleave", hideTooltip);

    const icon = document.createElement("span");
    icon.className = "command-icon";
    icon.style.background = options.color;
    icon.textContent = options.icon;

    const label = document.createElement("span");
    label.className = "command-label";
    label.textContent = options.label;

    const cost = document.createElement("span");
    cost.className = "command-cost";
    cost.textContent = formatCost(options.cost);

    button.append(icon, label, cost);
    return button;
  }

  function renderSelectionList(selection) {
    ui.selectionList.innerHTML = "";
    if (!selection.length) return;

    if (selection.length === 1) {
      const entity = selection[0];
      if (entity.kind === "unit") {
        appendHealthRow("Hull", entity.hp, entity.maxHp);
        appendDetailRow("Brain", BRAIN_TIERS[entity.brainTier || 0].label);
        appendDetailRow("Order", unitStateText(entity));
        appendDetailRow("Move", `${Math.round(unitSpeed(entity))}/s`);
        appendDetailRow("Carry", entity.carried ? `${entity.carried.amount}/${unitCarryCapacity(entity)} ${RESOURCE_TYPES[entity.carried.type].carryLabel}` : `Empty / ${unitCarryCapacity(entity)}`);
        appendDetailRow("Build Queue", buildQueueCount(entity) ? `${buildQueueCount(entity)} structure${buildQueueCount(entity) === 1 ? "" : "s"}` : "Empty");
        return;
      }
      if (entity.kind === "building") {
        appendHealthRow("Hull", entity.hp, entity.maxHp);
        if (entity.type === "batteryBank") {
          if (entity.underConstruction) appendMeterRow("Build", `${Math.round((1 - entity.build.remaining / entity.build.total) * 100)}%`, 1 - entity.build.remaining / entity.build.total, "#91a7ff");
          appendDetailRow("Capacity", entity.underConstruction ? "Pending +10" : "+10 bots");
          appendDetailRow("Footprint", "1 hex");
          return;
        }
        appendDetailRow("Capacity", `${usedWorkerCapacity()}/${workerCapacity()} bots`);
        if (entity.queue.length) {
          entity.queue.forEach((item, index) => {
            const pct = index === 0 ? 1 - item.remaining / item.total : 0;
            appendMeterRow(index === 0 ? "Building" : `Queued ${index + 1}`, queueItemLabel(item), pct, item.type === "brainShipment" ? "#91a7ff" : "#ffcf67");
          });
        } else {
          appendDetailRow("Queue", "Empty");
        }
        appendDetailRow("Rally", entity.rally ? rallyText(entity.rally).replace("Rally: ", "") : "Unset");
        return;
      }
      if (entity.kind === "resource") {
        appendMeterRow("Remaining", `${Math.ceil(entity.amount)}/${entity.maxAmount}`, entity.amount / entity.maxAmount, RESOURCE_TYPES[entity.type].color);
        appendDetailRow("Assigned", `${assignedBotCount(entity)} cartbot${assignedBotCount(entity) === 1 ? "" : "s"}`);
        appendDetailRow("Hex", hexLabel(entity.hex));
        for (const [name, value] of Object.entries(entity.composition)) {
          appendMeterRow(titleCase(name), `${value}%`, value / 100, RESOURCE_TYPES[entity.type].color);
        }
        return;
      }
      if (entity.kind === "dummy") {
        appendHealthRow("Target", entity.hp, entity.maxHp);
        appendDetailRow("Behavior", "Passive");
        appendDetailRow("Test", "Cartbots deal 1 dmg / 0.8s");
        return;
      }
    }

    for (const entity of selection.slice(0, 18)) {
      const name = entity.kind === "unit" ? "Cartbot" : entity.kind === "dummy" ? "Dummy" : entity.kind === "resource" ? RESOURCE_TYPES[entity.type].label : BUILDING_TYPES[entity.type].label;
      appendMeterRow(name, entity.kind === "resource" ? `${Math.ceil(entity.amount)}` : `${Math.ceil(entity.hp)}`, entity.kind === "resource" ? entity.amount / entity.maxAmount : entity.hp / entity.maxHp, entity.kind === "resource" ? RESOURCE_TYPES[entity.type].color : "#7fe5c7");
    }
  }

  function appendHealthRow(label, hp, maxHp) {
    appendMeterRow(label, `${Math.ceil(hp)}/${maxHp}`, hp / maxHp, "#7fe5c7");
  }

  function appendMeterRow(label, value, pct, color) {
    const row = document.createElement("div");
    row.className = "selection-row";

    const text = document.createElement("span");
    text.textContent = `${label}: ${value}`;

    const meter = document.createElement("div");
    meter.className = "health-meter";
    meter.title = value;

    const fill = document.createElement("span");
    fill.style.width = `${clamp(pct * 100, 0, 100)}%`;
    fill.style.background = color;
    meter.append(fill);

    row.append(text, meter);
    ui.selectionList.append(row);
  }

  function appendDetailRow(label, value) {
    const row = document.createElement("div");
    row.className = "selection-row detail-row";

    const name = document.createElement("span");
    name.textContent = label;

    const detail = document.createElement("strong");
    detail.textContent = value;

    row.append(name, detail);
    ui.selectionList.append(row);
  }

  function hexLabel(hex) {
    return `q${hex.q} r${hex.r}`;
  }

  function showTooltip(options, x, y) {
    ui.tooltip.innerHTML = `<strong>${options.label}</strong><br>${options.tip}${options.cost ? `<br>${formatCost(options.cost)}` : ""}`;
    ui.tooltip.classList.add("visible");
    moveTooltip(x, y);
  }

  function moveTooltip(x, y) {
    ui.tooltip.style.left = `${x}px`;
    ui.tooltip.style.top = `${y}px`;
  }

  function hideTooltip() {
    ui.tooltip.classList.remove("visible");
  }

  function formatCost(cost) {
    if (!cost) return "";
    const parts = [];
    if (cost.ore) parts.push(`${cost.ore} ore`);
    if (cost.wood) parts.push(`${cost.wood} lumber`);
    if (cost.chips) parts.push(`${cost.chips} chip${cost.chips === 1 ? "" : "s"}`);
    return parts.join(" / ");
  }

  function updatePointerFromClient(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = clientX - rect.left;
    state.mouse.y = clientY - rect.top;
    state.mouse.inViewport = pointInRect(clientX, clientY, rect);
    state.mouse.overMiniMap = pointInElement(clientX, clientY, mini);
    state.mouse.overHud = pointOverHud(clientX, clientY);
    state.mouse.overBattlefield = state.mouse.inViewport && !state.mouse.overHud;
    updateMouseWorld();
  }

  function handlePointerMove(event) {
    updatePointerFromClient(event.clientX, event.clientY);
  }

  function handlePointerExit() {
    state.mouse.inViewport = false;
    state.mouse.overHud = false;
    state.mouse.overMiniMap = false;
    state.mouse.overBattlefield = false;
  }

  function handleMouseMove(event) {
    updatePointerFromClient(event.clientX, event.clientY);
  }

  function updateMouseWorld() {
    const p = screenToWorld(state.mouse.x, state.mouse.y);
    state.mouse.worldX = p.x;
    state.mouse.worldY = p.y;
  }

  function handleMouseDown(event) {
    if (event.button !== 0) return;
    handleMouseMove(event);
    if (!state.mouse.overBattlefield) return;
    event.preventDefault();
    state.mouse.down = true;
    state.mouse.drag = {
      x: state.mouse.x,
      y: state.mouse.y,
      worldX: state.mouse.worldX,
      worldY: state.mouse.worldY,
    };
  }

  function handleMouseUp(event) {
    if (event.button !== 0) return;
    handleMouseMove(event);
    const drag = state.mouse.drag;
    state.mouse.down = false;
    if (!drag) return;
    if (!state.mouse.overBattlefield) {
      state.mouse.drag = null;
      return;
    }

    const dragged = Math.hypot(state.mouse.x - drag.x, state.mouse.y - drag.y) > 7;
    if (dragged) {
      if (!state.commandMode) selectBox(drag, state.mouse, event.shiftKey);
      state.mouse.drag = null;
      return;
    }

    const point = { x: state.mouse.worldX, y: state.mouse.worldY };
    if (state.commandMode) {
      issueCommandMode(point);
      state.mouse.drag = null;
      return;
    }

    const entity = findEntityAt(point);
    const now = performance.now();
    const isDouble =
      entity &&
      !event.shiftKey &&
      now - state.lastClick.time < 330 &&
      Math.hypot(state.mouse.x - state.lastClick.x, state.mouse.y - state.lastClick.y) < 12 &&
      state.lastClick.kind === entity.kind &&
      state.lastClick.type === entity.type;

    if (isDouble) selectSameVisibleType(entity);
    else selectSingle(entity, event.shiftKey);

    state.lastClick = {
      time: now,
      x: state.mouse.x,
      y: state.mouse.y,
      type: entity?.type || "",
      kind: entity?.kind || "",
    };
    state.mouse.drag = null;
  }

  function handleContextMenu(event) {
    event.preventDefault();
    handleMouseMove(event);
    if (!state.mouse.overBattlefield) return;
    state.commandMode = null;
    issueRightClick({ x: state.mouse.worldX, y: state.mouse.worldY });
    refreshUi();
  }

  function normalizedWheelDelta(event) {
    let delta = event.deltaY;
    if (event.deltaMode === 1) delta *= 16;
    if (event.deltaMode === 2) delta *= innerHeight;
    return clamp(delta, -220, 220);
  }

  function handleWheel(event) {
    handleMouseMove(event);
    if (!state.mouse.overBattlefield) return;
    event.preventDefault();
    const before = screenToWorld(state.mouse.x, state.mouse.y);
    const delta = normalizedWheelDelta(event);
    if (!delta) return;
    const factor = clamp(Math.exp(-delta * 0.0016), 0.78, 1.28);
    state.camera.zoom = clamp(state.camera.zoom * factor, 0.58, 1.3);
    const after = screenToWorld(state.mouse.x, state.mouse.y);
    state.camera.x += before.x - after.x;
    state.camera.y += before.y - after.y;
    clampCamera();
  }

  function handleWindowMouseUp(event) {
    if (event.button !== 0 || event.target === canvas) return;
    updatePointerFromClient(event.clientX, event.clientY);
    state.mouse.down = false;
    state.mouse.drag = null;
  }

  function handleMiniMapClick(event) {
    event.preventDefault();
    event.stopPropagation();
    updatePointerFromClient(event.clientX, event.clientY);
    const rect = mini.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * WORLD.w;
    const y = ((event.clientY - rect.top) / rect.height) * WORLD.h;
    focusCameraOnWorld(x, y);
  }

  function handleMiniMapWheel(event) {
    event.preventDefault();
    event.stopPropagation();
    updatePointerFromClient(event.clientX, event.clientY);
  }

  function handleKeyDown(event) {
    const key = event.key.toLowerCase();

    if (event.target && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;

    if (event.code === "Space" || key === " " || key === "spacebar") {
      event.preventDefault();
      focusRecentWorldAlert();
      return;
    }

    if (/^[1-9]$/.test(key)) {
      if (event.ctrlKey) {
        event.preventDefault();
        saveControlGroup(Number(key));
      } else {
        loadControlGroup(Number(key));
      }
      return;
    }

    if (key === "escape") {
      state.commandMode = null;
      state.selectedIds.clear();
      announce("Selection cleared.");
      refreshUi();
      return;
    }

    if (key === "a") {
      setCommandMode("attack");
      return;
    }
    if (key === "g") {
      setCommandMode("gather");
      return;
    }
    if (key === "r") {
      setCommandMode("recon");
      return;
    }
    if (key === "s") {
      stopSelectedUnits();
      return;
    }
    if (key === "b") {
      setCommandMode("buildBattery");
      return;
    }

    if (key.startsWith("arrow")) event.preventDefault();
    state.keys.add(key);
  }

  function resize() {
    state.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(innerWidth * state.dpr);
    canvas.height = Math.floor(innerHeight * state.dpr);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    clampCamera();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - state.last) / 1000 || 0);
    state.last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function bind() {
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", (event) => state.keys.delete(event.key.toLowerCase()));
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerExit);
    window.addEventListener("mouseup", handleWindowMouseUp);
    window.addEventListener("blur", () => {
      state.keys.clear();
      state.mouse.down = false;
      state.mouse.drag = null;
      handlePointerExit();
    });
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("contextmenu", handleContextMenu);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    mini.addEventListener("click", handleMiniMapClick);
    mini.addEventListener("wheel", handleMiniMapWheel, { passive: false });
  }

  bind();
  resize();
  init();
  requestAnimationFrame(loop);
})();
