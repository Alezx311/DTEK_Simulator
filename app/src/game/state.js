import { UPGRADES, applyUpgradeEffect } from '../data/upgrades';
import { createBuildings } from '../data/mapData';

export function createInitialState() {
  const buildings = createBuildings();
  const totalPower = buildings.reduce((a, b) => a + b.power, 0);

  return {
    paused: false,
    gameOver: false,
    gameResult: null,
    day: 1,
    generation: Math.round(totalPower * 1.4), // ~40% headroom
    consumption: Math.round(totalPower * 0.85),
    load: 65,
    maxLoad: 65,
    money: 500,
    mood: { residents: 80, business: 75, critical: 95 },
    repairTime: 35,
    hasReserve: false,
    reserveActive: false,
    hasAuto: false,
    coolBonus: 0,
    shahedDef: 0,
    rocketDef: 0,
    globalDef: 0,
    dmgReduction: 0,
    wave: { num: 1, phase: 'prep', time: 45, threats: [] },
    buildings,
    boughtUpgrades: [],
    currentTab: 'infra',
    events: [{ id: Date.now(), type: 'info', text: 'Старт! Клікай по будинках або групах.', time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }],
    settings: {
      difficulty: 'normal',
      attackFreq: 100,
      enemyDmg: 100,
      repairTimeMod: 100,
      gameSpeed: 100,
      autopause: false,
      godMode: false,
      timeAccel: 1,
      showTooltips: true,
      uiScale: 100,
      fontSize: 'normal',
      detailedStats: false,
      gfxQuality: 'medium',
      fpsLimit: 60,
    },
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'TICK':
      return action.payload;

    case 'TOGGLE_PAUSE':
      return { ...state, paused: !state.paused };

    case 'SET_PAUSED':
      return { ...state, paused: action.payload };

    // Toggle entire group by groupId
    case 'TOGGLE_GROUP': {
      const groupId = action.payload;
      const groupBuildings = state.buildings.filter(b => b.group === groupId);
      if (groupBuildings.length === 0) return state;
      // If any are on, turn all off. Otherwise turn all on.
      const anyOn = groupBuildings.some(b => b.status === 'on');
      let diff = 0;
      const newBuildings = state.buildings.map(b => {
        if (b.group !== groupId || b.status === 'damaged') return b;
        if (anyOn && b.status === 'on') {
          diff -= b.power;
          return { ...b, status: 'off' };
        } else if (!anyOn && b.status === 'off') {
          diff += b.power;
          return { ...b, status: 'on' };
        }
        return b;
      });
      return { ...state, buildings: newBuildings, consumption: state.consumption + diff };
    }

    case 'ENABLE_ALL': {
      let diff = 0;
      let count = 0;
      const newBuildings = state.buildings.map(b => {
        if (b.status === 'off') { diff += b.power; count++; return { ...b, status: 'on' }; }
        return b;
      });
      return addEvent({ ...state, buildings: newBuildings, consumption: state.consumption + diff }, 'info', `ON ${count} будинків`);
    }

    case 'EMERGENCY_OFF': {
      // Turn off 20% of buildings that are on (random selection)
      const onBuildings = state.buildings.filter(b => b.status === 'on');
      const count = Math.min(Math.ceil(onBuildings.length * 0.2), onBuildings.length);
      const shuffled = [...onBuildings].sort(() => Math.random() - 0.5);
      const toOff = new Set(shuffled.slice(0, count).map(b => b.id));
      let diff = 0;
      const newBuildings = state.buildings.map(b => {
        if (toOff.has(b.id)) { diff -= b.power; return { ...b, status: 'off' }; }
        return b;
      });
      return addEvent({ ...state, buildings: newBuildings, consumption: state.consumption + diff }, 'warning', `OFF ${count} будинків`);
    }

    case 'ROTATE_GROUPS': {
      // Find groups that have all buildings on, and groups that have all off
      const groups = {};
      state.buildings.forEach(b => {
        if (!groups[b.group]) groups[b.group] = { on: 0, off: 0, damaged: 0 };
        groups[b.group][b.status === 'on' ? 'on' : b.status === 'off' ? 'off' : 'damaged']++;
      });
      const onGroups = Object.entries(groups).filter(([, g]) => g.on > 0 && g.off === 0).map(([id]) => id);
      const offGroups = Object.entries(groups).filter(([, g]) => g.off > 0 && g.on === 0).map(([id]) => id);
      const n = Math.min(3, onGroups.length, offGroups.length);
      const toOff = new Set(onGroups.slice(0, n));
      const toOn = new Set(offGroups.slice(0, n));
      let diff = 0;
      const newBuildings = state.buildings.map(b => {
        if (toOff.has(b.group) && b.status === 'on') { diff -= b.power; return { ...b, status: 'off' }; }
        if (toOn.has(b.group) && b.status === 'off') { diff += b.power; return { ...b, status: 'on' }; }
        return b;
      });
      return addEvent({ ...state, buildings: newBuildings, consumption: state.consumption + diff }, 'info', `Ротація ${n} груп`);
    }

    case 'USE_RESERVE': {
      if (!state.hasReserve || state.reserveActive) return state;
      return addEvent({ ...state, generation: state.generation + 300, reserveActive: true }, 'success', '+300MW 15с!');
    }

    case 'RESERVE_END':
      return addEvent({ ...state, generation: state.generation - 300, reserveActive: false }, 'info', 'Резерв вичерпано');

    case 'BUY_UPGRADE': {
      const allUps = [...UPGRADES.infra, ...UPGRADES.defense];
      const u = allUps.find(x => x.id === action.payload);
      if (!u || state.boughtUpgrades.includes(action.payload) || state.money < u.cost) return state;
      let newState = { ...state, money: state.money - u.cost, boughtUpgrades: [...state.boughtUpgrades, action.payload] };
      newState = applyUpgradeEffect(newState, u.effectKey);
      return addEvent(newState, 'success', u.name);
    }

    case 'SET_TAB':
      return { ...state, currentTab: action.payload };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'CHEAT': {
      switch (action.payload) {
        case 'money': return { ...state, money: state.money + 10000 };
        case 'reputation': return { ...state, mood: { residents: 100, business: 100, critical: 100 } };
        case 'unlock': {
          let s = state;
          const allIds = [...UPGRADES.infra, ...UPGRADES.defense];
          allIds.forEach(u => {
            if (!s.boughtUpgrades.includes(u.id)) {
              s = { ...s, boughtUpgrades: [...s.boughtUpgrades, u.id] };
              s = applyUpgradeEffect(s, u.effectKey);
            }
          });
          return s;
        }
        case 'repair': {
          let diff = 0;
          const newBuildings = state.buildings.map(b => {
            if (b.status === 'damaged') { diff += b.power; return { ...b, status: 'on' }; }
            return b;
          });
          return { ...state, buildings: newBuildings, consumption: state.consumption + diff };
        }
        case 'cooldown': return state;
        default: return state;
      }
    }

    case 'RESET':
      return createInitialState();

    default:
      return state;
  }
}

function addEvent(state, type, text) {
  const time = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const events = [{ id: Date.now() + Math.random(), type, text, time }, ...state.events].slice(0, 8);
  return { ...state, events };
}
