import { createBuildings } from '../data/mapData';
import { CITY_UPGRADES } from '../data/cityUpgrades';
import { generateAidCards } from '../data/aidCards';
import { getWeaponTemplate, WEAPON_TEMPLATES } from '../data/weapons';
import { calcRepairCost, calcDiplomaticTier, applyAutoRepair } from './economy';
import type { GameState, GameAction, GameSettings, WeaponInstance, Building } from '../types';

// ─── MAP BOUNDS (Akademmistechko, Kyiv) ────────────────────────────
const MAP = { latMin: 50.448, latMax: 50.482, lngMin: 30.318, lngMax: 30.392 };
const MAP_CENTER = { lat: 50.465, lng: 30.355 };

let _weaponCounter = 0;
function newWeaponId() { return `w_${++_weaponCounter}_${Date.now()}`; }

function createWeaponAt(templateId: string, lat: number, lng: number): WeaponInstance {
  const t = getWeaponTemplate(templateId);
  return {
    id: newWeaponId(),
    templateId,
    type: t.type,
    lat,
    lng,
    radius: t.radius,
    hitChance: t.hitChance,
    fireRate: t.fireRate,
    damage: t.damage,
    critChance: t.critChance,
    critMultiplier: t.critMultiplier,
    cooldown: 0,
    ...(t.slowFactor !== undefined ? { slowFactor: t.slowFactor } : {}),
  };
}

function randomMapPos() {
  return {
    lat: MAP.latMin + Math.random() * (MAP.latMax - MAP.latMin),
    lng: MAP.lngMin + Math.random() * (MAP.lngMax - MAP.lngMin),
  };
}

// Place weapon on the perimeter of the district (for initial defense)
function perimeterPos(angle: number) {
  const latRadius = (MAP.latMax - MAP.latMin) / 2 * 0.9;
  const lngRadius = (MAP.lngMax - MAP.lngMin) / 2 * 0.9;
  return {
    lat: MAP_CENTER.lat + Math.sin(angle) * latRadius,
    lng: MAP_CENTER.lng + Math.cos(angle) * lngRadius,
  };
}

export function createInitialState(): GameState {
  const buildings = createBuildings();

  // Initial defense: weapons placed around the perimeter
  const startWeapons: WeaponInstance[] = [];
  // 2 mobile groups (north and south)
  const posN = perimeterPos(Math.PI / 2);  // north
  const posS = perimeterPos(-Math.PI / 2); // south
  startWeapons.push(createWeaponAt('mobile', posN.lat, posN.lng));
  startWeapons.push(createWeaponAt('mobile', posS.lat, posS.lng));
  // 2 machineguns (east and west)
  const posE = perimeterPos(0);            // east
  const posW = perimeterPos(Math.PI);      // west
  startWeapons.push(createWeaponAt('machinegun', posE.lat, posE.lng));
  startWeapons.push(createWeaponAt('machinegun', posW.lat, posW.lng));
  // 1 static PPO at center
  startWeapons.push(createWeaponAt('static', MAP_CENTER.lat, MAP_CENTER.lng));
  // 1 REB station (northeast — main threat direction)
  const posNE = perimeterPos(Math.PI / 4);
  startWeapons.push(createWeaponAt('reb', posNE.lat, posNE.lng));

  return {
    paused: false,
    gameOver: false,
    gameResult: null,
    day: 1,
    money: 2000,
    diplomacyPoints: 0,
    diplomaticTier: 1,
    buildings,
    weapons: startWeapons,
    projectiles: [],
    wave: {
      num: 1,
      phase: 'prep',
      time: 30,
      threats: [],
      enemiesKilled: 0,
      buildingsHitThisWave: 0,
    },
    pendingAidCards: [],
    boughtUpgrades: [],
    events: [{
      id: Date.now(),
      type: 'info',
      text: 'Захищайте місто! Хвиля 1 починається за 30 сек.',
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }],
    blackoutTimer: null,
    shieldTimer: null,
    nextAidCardBonus: 0,
    settings: {
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

// ─── AID CARD EFFECT APPLICATION ──────────────────────────────────
function applyAidEffect(state: GameState, effectKey: string): GameState {
  const pos = randomMapPos();
  switch (effectKey) {
    case 'add_mobile_weapon':
      return { ...state, weapons: [...state.weapons, createWeaponAt('mobile', pos.lat, pos.lng)] };

    case 'add_static_weapon':
      return { ...state, weapons: [...state.weapons, createWeaponAt('static', pos.lat, pos.lng)] };

    case 'add_reb_station':
      return { ...state, weapons: [...state.weapons, createWeaponAt('reb', pos.lat, pos.lng)] };

    case 'add_machinegun':
      return { ...state, weapons: [...state.weapons, createWeaponAt('machinegun', pos.lat, pos.lng)] };

    case 'add_sam':
      return { ...state, weapons: [...state.weapons, createWeaponAt('sam', pos.lat, pos.lng)] };

    case 'add_three_static': {
      const positions = [randomMapPos(), randomMapPos(), randomMapPos()];
      const newWeapons = positions.map(p => createWeaponAt('static', p.lat, p.lng));
      return { ...state, weapons: [...state.weapons, ...newWeapons] };
    }

    case 'add_money_500':
      return { ...state, money: state.money + 500 };

    case 'add_money_1500':
      return { ...state, money: state.money + 1500 };

    case 'add_money_5000':
      return { ...state, money: state.money + 5000 };

    case 'add_dp_15':
      return { ...state, diplomacyPoints: state.diplomacyPoints + 15 };

    case 'add_dp_50':
      return { ...state, diplomacyPoints: state.diplomacyPoints + 50 };

    case 'add_dp_100':
      return { ...state, diplomacyPoints: state.diplomacyPoints + 100 };

    case 'boost_hit_10':
      return {
        ...state,
        weapons: state.weapons.map(w => ({ ...w, hitChance: Math.min(0.99, w.hitChance + 0.10) })),
      };

    case 'boost_dmg_30':
      return {
        ...state,
        weapons: state.weapons.map(w => ({ ...w, damage: Math.round(w.damage * 1.3 * 100) / 100 })),
      };

    case 'boost_dp_tier':
      return {
        ...state,
        diplomacyPoints: state.diplomacyPoints + 200,
      };

    case 'shield_30s':
      return { ...state, shieldTimer: 30 };

    case 'next_extra_card':
      return { ...state, nextAidCardBonus: state.nextAidCardBonus + 1 };

    case 'instant_repair_all': {
      const newBuildings = state.buildings.map(b =>
        b.status === 'destroyed' ? { ...b, status: 'on' as const, destroyedAt: null } : b
      );
      return { ...state, buildings: newBuildings };
    }

    case 'reroll_aid': {
      const count = 3 + state.nextAidCardBonus;
      return {
        ...state,
        pendingAidCards: generateAidCards(state.diplomaticTier, count),
        // Keep phase at 'aid' — user still needs to pick
      };
    }

    default:
      return state;
  }
}

// ─── CITY UPGRADE EFFECT APPLICATION ──────────────────────────────
function applyCityUpgradeEffect(state: GameState, effectKey: string): GameState {
  switch (effectKey) {
    case 'income_boost_25':
      return {
        ...state,
        buildings: state.buildings.map(b => ({ ...b, incomeRate: Math.round(b.incomeRate * 1.25) })),
      };

    case 'blackout_time_plus':
      // Encoded: when blackout starts, timer will be 45s instead of 30s.
      // Store as a modifier on settings (we'll add it as a custom field).
      return state; // handled in engine

    case 'auto_repair_damaged':
      return state; // handled in engine

    case 'all_hit_plus_10':
      return {
        ...state,
        weapons: state.weapons.map(w => ({ ...w, hitChance: Math.min(0.99, w.hitChance + 0.10) })),
      };

    case 'all_dmg_plus_1':
      return {
        ...state,
        weapons: state.weapons.map(w => ({ ...w, damage: w.damage + 1 })),
      };

    case 'early_warning':
      return state; // purely visual, handled in engine

    case 'add_dp_50':
      return { ...state, diplomacyPoints: state.diplomacyPoints + 50 };

    case 'next_extra_card':
      return { ...state, nextAidCardBonus: state.nextAidCardBonus + 1 };

    default:
      return state;
  }
}

function addEvent(state: GameState, type: GameState['events'][number]['type'], text: string): GameState {
  const time = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const events = [{ id: Date.now() + Math.random(), type, text, time }, ...state.events].slice(0, 8);
  return { ...state, events };
}

// ─── REDUCER ──────────────────────────────────────────────────────
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TICK':
      return action.payload;

    case 'TOGGLE_PAUSE':
      return { ...state, paused: !state.paused };

    case 'SET_PAUSED':
      return { ...state, paused: action.payload };

    case 'SELECT_AID_CARD': {
      const card = state.pendingAidCards.find(c => c.effectKey === action.payload);
      if (!card) return state;

      let newState = applyAidEffect(state, action.payload);

      // If reroll, stay in 'aid' phase
      if (action.payload === 'reroll_aid') {
        return addEvent(newState, 'info', `Новий набір карток отримано`);
      }

      // Otherwise transition to repair phase
      newState = { ...newState, pendingAidCards: [], wave: { ...newState.wave, phase: 'repair' } };
      return addEvent(newState, 'success', `${card.icon} ${card.name} застосовано`);
    }

    case 'SKIP_AID':
      return {
        ...state,
        pendingAidCards: [],
        wave: { ...state.wave, phase: 'repair' },
      };

    case 'REPAIR_BUILDING': {
      const b = state.buildings.find(x => x.id === action.payload);
      if (!b || b.status !== 'destroyed') return state;
      const cost = calcRepairCost(b);
      if (state.money < cost) return addEvent(state, 'warning', 'Недостатньо коштів!');
      const buildings = state.buildings.map(x =>
        x.id === action.payload ? { ...x, status: 'on' as const, destroyedAt: null } : x
      );
      return addEvent({ ...state, money: state.money - cost, buildings }, 'success', `${b.address.split(',')[0]} відремонтовано (-${cost}₴)`);
    }

    case 'REPAIR_ALL': {
      const destroyed = state.buildings.filter(b => b.status === 'destroyed');
      const total = destroyed.reduce((s, b) => s + calcRepairCost(b), 0);
      if (state.money < total) return addEvent(state, 'warning', `Потрібно ${total}₴, є лише ${Math.floor(state.money)}₴`);
      const buildings = state.buildings.map(b =>
        b.status === 'destroyed' ? { ...b, status: 'on' as const, destroyedAt: null } : b
      );
      return addEvent({ ...state, money: state.money - total, buildings }, 'success', `Всі будинки відремонтовано (-${total}₴)`);
    }

    case 'AUTO_REPAIR':
      return applyAutoRepair(state);

    case 'CONFIRM_REPAIR': {
      // Free repair of all 'damaged' buildings
      const buildings = state.buildings.map((b: Building) =>
        b.status === 'damaged' ? { ...b, status: 'on' as const } : b
      );
      // Reposition mobile weapons
      const weapons = state.weapons.map(w => {
        if (w.type !== 'mobile') return w;
        const { lat, lng } = randomMapPos();
        return { ...w, lat, lng };
      });
      const newState: GameState = {
        ...state,
        buildings,
        weapons,
        projectiles: [],
        wave: {
          ...state.wave,
          phase: 'prep',
          time: 30,
          threats: [],
          enemiesKilled: 0,
          buildingsHitThisWave: 0,
        },
        day: state.day + 1,
        diplomaticTier: calcDiplomaticTier(state.diplomacyPoints),
      };
      return addEvent(newState, 'info', `День ${newState.day}. Хвиля ${newState.wave.num} починається за 30 сек.`);
    }

    case 'BUY_CITY_UPGRADE': {
      const upgrade = CITY_UPGRADES.find(u => u.id === action.payload);
      if (!upgrade || state.boughtUpgrades.includes(action.payload)) return state;
      if (upgrade.costType === 'money' && state.money < upgrade.cost) {
        return addEvent(state, 'warning', 'Недостатньо гривень!');
      }
      if (upgrade.costType === 'dp' && state.diplomacyPoints < upgrade.cost) {
        return addEvent(state, 'warning', 'Недостатньо ДО!');
      }
      const newMoney = upgrade.costType === 'money' ? state.money - upgrade.cost : state.money;
      const newDp = upgrade.costType === 'dp' ? state.diplomacyPoints - upgrade.cost : state.diplomacyPoints;
      let newState = { ...state, money: newMoney, diplomacyPoints: newDp, boughtUpgrades: [...state.boughtUpgrades, upgrade.id] };
      newState = applyCityUpgradeEffect(newState, upgrade.effectKey);
      return addEvent(newState, 'success', `${upgrade.name} придбано!`);
    }

    case 'UPDATE_SETTINGS': {
      const newSettings: GameSettings = { ...state.settings, ...action.payload };
      const basePx = Math.round(14 * (newSettings.uiScale || 100) / 100);
      document.documentElement.style.setProperty('--base-font', basePx + 'px');
      return { ...state, settings: newSettings };
    }

    case 'CHEAT': {
      switch (action.payload) {
        case 'money':
          return addEvent({ ...state, money: state.money + 10000 }, 'info', '+10000₴ (чіт)');
        case 'dp':
          return addEvent({ ...state, diplomacyPoints: state.diplomacyPoints + 100 }, 'info', '+100 ДО (чіт)');
        case 'repair': {
          const buildings = state.buildings.map(b =>
            b.status !== 'on' ? { ...b, status: 'on' as const, destroyedAt: null } : b
          );
          return addEvent({ ...state, buildings }, 'success', 'Всі будинки відремонтовано (чіт)');
        }
        case 'shield':
          return addEvent({ ...state, shieldTimer: 60 }, 'info', 'Щит 60с (чіт)');
        case 'skip': {
          // Skip to end of wave
          const count = 3 + state.nextAidCardBonus;
          const cards = generateAidCards(state.diplomaticTier, count);
          return {
            ...state,
            wave: { ...state.wave, phase: 'aid', time: 0, threats: [] },
            pendingAidCards: cards,
          };
        }
        case 'add_weapon': {
          const templateIdx = Math.floor(Math.random() * WEAPON_TEMPLATES.length);
          const tmpl = WEAPON_TEMPLATES[templateIdx];
          const { lat, lng } = randomMapPos();
          return { ...state, weapons: [...state.weapons, createWeaponAt(tmpl.id, lat, lng)] };
        }
        default:
          return state;
      }
    }

    case 'RESET':
      return createInitialState();

    default:
      return state;
  }
}
