import { DISTRICTS } from '../data/districts';
import { UPGRADES, applyUpgradeEffect } from '../data/upgrades';

export function createInitialState() {
  let subId = 1;
  const subgroups = [];
  DISTRICTS.forEach(d => {
    for (let i = 1; i <= d.subs; i++) {
      subgroups.push({
        id: subId++,
        districtId: d.id,
        districtName: d.name,
        districtShort: d.short,
        num: i,
        power: Math.round(d.power / d.subs),
        status: 'on',
        onTime: 0,
        offTime: 0,
        heat: 0,
      });
    }
  });

  return {
    paused: false,
    gameOver: false,
    gameResult: null,
    day: 1,
    generation: 1200,
    consumption: 780,
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
    subgroups,
    boughtUpgrades: [],
    currentTab: 'infra',
    events: [{ id: Date.now(), type: 'info', text: 'Старт! Ctrl+Shift+D для дебагу', time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }],
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

    case 'TOGGLE_SUBGROUP': {
      const s = state.subgroups.find(x => x.id === action.payload);
      if (!s || s.status === 'damaged') return state;
      const newSubs = state.subgroups.map(x => {
        if (x.id !== action.payload) return x;
        const newStatus = x.status === 'on' ? 'off' : 'on';
        return { ...x, status: newStatus };
      });
      const diff = s.status === 'on' ? -s.power : s.power;
      return { ...state, subgroups: newSubs, consumption: state.consumption + diff };
    }

    case 'ENABLE_ALL': {
      let diff = 0;
      const newSubs = state.subgroups.map(s => {
        if (s.status === 'off') { diff += s.power; return { ...s, status: 'on' }; }
        return s;
      });
      return addEvent({ ...state, subgroups: newSubs, consumption: state.consumption + diff }, 'info', `ON ${newSubs.filter((s, i) => state.subgroups[i].status === 'off').length} груп`);
    }

    case 'EMERGENCY_OFF': {
      const sorted = [...state.subgroups].filter(s => s.status === 'on').sort((a, b) => b.heat - a.heat).slice(0, 5);
      const ids = new Set(sorted.map(s => s.id));
      let diff = 0;
      const newSubs = state.subgroups.map(s => {
        if (ids.has(s.id)) { diff -= s.power; return { ...s, status: 'off' }; }
        return s;
      });
      return addEvent({ ...state, subgroups: newSubs, consumption: state.consumption + diff }, 'warning', `OFF ${ids.size} гарячих`);
    }

    case 'ROTATE_GROUPS': {
      const on = state.subgroups.filter(s => s.status === 'on').sort((a, b) => b.heat - a.heat);
      const off = state.subgroups.filter(s => s.status === 'off').sort((a, b) => b.offTime - a.offTime);
      const n = Math.min(4, on.length, off.length);
      const toOff = new Set();
      const toOn = new Set();
      for (let i = 0; i < n; i++) {
        if (on[i].heat > 25 || off[i].offTime > 25) {
          toOff.add(on[i].id);
          toOn.add(off[i].id);
        }
      }
      let diff = 0;
      const newSubs = state.subgroups.map(s => {
        if (toOff.has(s.id)) { diff -= s.power; return { ...s, status: 'off' }; }
        if (toOn.has(s.id)) { diff += s.power; return { ...s, status: 'on' }; }
        return s;
      });
      return addEvent({ ...state, subgroups: newSubs, consumption: state.consumption + diff }, 'info', `Ротація ${toOff.size} груп`);
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
          const newSubs = state.subgroups.map(s => {
            if (s.status === 'damaged') { diff += s.power; return { ...s, status: 'on', heat: 0 }; }
            return s;
          });
          return { ...state, subgroups: newSubs, consumption: state.consumption + diff };
        }
        case 'cooldown': return { ...state, subgroups: state.subgroups.map(s => ({ ...s, heat: 0 })) };
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
