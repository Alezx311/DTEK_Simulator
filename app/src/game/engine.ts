import { THREATS } from '../data/threats';
import { generateAidCards } from '../data/aidCards';
import { calcIncomePerSec, calcDiplomaticTier } from './economy';
import { applyRebEffect, combatTick, updateProjectiles, applyBlast } from './combat';
import type { GameState, ThreatInstance } from '../types';

// ─── RUSSIAN LAUNCH CITIES ────────────────────────────────────────
const LAUNCH_SITES = [
  { name: 'Москва',      lat: 55.755, lng: 37.617 },
  { name: 'Курськ',      lat: 51.730, lng: 36.193 },
  { name: 'Бєлгород',    lat: 50.595, lng: 36.587 },
  { name: 'Брянськ',     lat: 53.243, lng: 34.363 },
  { name: 'Ростов',      lat: 47.236, lng: 39.713 },
  { name: 'Воронеж',     lat: 51.672, lng: 39.184 },
  { name: 'Краснодар',   lat: 45.035, lng: 38.976 },
  { name: 'Севастополь', lat: 44.616, lng: 33.525 },
  { name: 'Мінськ',      lat: 53.900, lng: 27.567 },
  { name: 'Каспійськ',   lat: 42.891, lng: 47.634 },
  { name: 'Мурманськ',   lat: 68.970, lng: 33.075 },
  { name: 'Саратов',     lat: 51.533, lng: 46.034 },
];

const BLACKOUT_GRACE = 30;

function addEv(s: GameState, type: GameState['events'][number]['type'], text: string): GameState {
  const time = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const events = [{ id: Date.now() + Math.random(), type, text, time }, ...s.events].slice(0, 8);
  return { ...s, events };
}

function pickLaunchSite(threatType: string) {
  let pool = LAUNCH_SITES;
  if (threatType === 'rocket') {
    pool = LAUNCH_SITES.filter(s =>
      ['Каспійськ', 'Севастополь', 'Ростов', 'Краснодар', 'Мурманськ'].includes(s.name)
    );
  } else if (threatType === 'ballistic' || threatType === 'boss') {
    pool = LAUNCH_SITES.filter(s =>
      ['Курськ', 'Бєлгород', 'Воронеж', 'Брянськ', 'Саратов', 'Москва'].includes(s.name)
    );
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnThreat(s: GameState): GameState {
  const avail = THREATS.filter(t => t.unlockDay <= s.day);
  if (avail.length === 0) return s;
  const tmpl = avail[Math.floor(Math.random() * avail.length)];

  const candidates = s.buildings.filter(b => b.status !== 'destroyed');
  if (candidates.length === 0) return s;
  const target = candidates[Math.floor(Math.random() * candidates.length)];

  const site = pickLaunchSite(tmpl.type);
  const jitterLat = (Math.random() - 0.5) * 0.3;
  const jitterLng = (Math.random() - 0.5) * 0.3;

  const threat: ThreatInstance = {
    instanceId: `threat_${Date.now()}_${Math.random()}`,
    templateId: tmpl.id,
    name: tmpl.name,
    icon: tmpl.icon,
    type: tmpl.type,
    speed: tmpl.speed,
    currentHealth: tmpl.health,
    maxHealth: tmpl.health,
    blastRadius: tmpl.blastRadius,
    dmg: tmpl.dmg,
    hitChanceMod: tmpl.hitChanceMod,
    targetId: target.id,
    targetLat: target.lat,
    targetLng: target.lng,
    startLat: site.lat + jitterLat,
    startLng: site.lng + jitterLng,
    launchCity: site.name,
    startX: Math.random(),
    progress: 0,
    hitFlash: 0,
    rebSlowed: false,
  };

  s = addEv(s, 'alert', `${tmpl.icon} ${tmpl.name} запущено з ${site.name}!`);
  return { ...s, wave: { ...s.wave, threats: [...s.wave.threats, threat] } };
}

function startAttack(s: GameState): GameState {
  s = { ...s, wave: { ...s.wave, phase: 'attack' } };
  if (s.settings.autopause) s = { ...s, paused: true };
  return addEv(s, 'alert', `⚠️ ХВИЛЯ ${s.wave.num}! АТАКА!`);
}

function endWave(s: GameState): GameState {
  let dp = s.diplomacyPoints;
  let evText = `Хвиля ${s.wave.num} відбита!`;

  if (s.wave.buildingsHitThisWave === 0) {
    dp += 5;
    evText += ' +5🔵 (чиста хвиля)';
  }

  if (s.wave.num % 7 === 0) {
    dp += 10;
    evText += ' +10🔵 (тиждень)';
  }

  const cardCount = 3 + s.nextAidCardBonus;
  const tier = calcDiplomaticTier(dp);
  const pendingAidCards = generateAidCards(tier, cardCount);

  return addEv({
    ...s,
    diplomacyPoints: dp,
    diplomaticTier: tier,
    pendingAidCards,
    projectiles: [],
    wave: {
      ...s.wave,
      num: s.wave.num + 1,
      phase: 'aid',
      threats: [],
      time: 0,
    },
  }, 'success', evText);
}

function moveThreats(s: GameState, dt: number): GameState {
  const toHit: ThreatInstance[] = [];

  const movedThreats = s.wave.threats.map(t => {
    const effectiveSpeed = t.rebSlowed ? t.speed * 0.4 : t.speed;
    const newProgress = t.progress + effectiveSpeed * dt;
    const newHitFlash = Math.max(0, t.hitFlash - dt * 20); // decay flash over time
    if (newProgress >= 1) {
      toHit.push(t);
      return { ...t, progress: 1, hitFlash: newHitFlash };
    }
    return { ...t, progress: newProgress, hitFlash: newHitFlash };
  });

  s = { ...s, wave: { ...s.wave, threats: movedThreats } };

  for (const t of toHit) {
    s = applyBlast(s, t);
  }

  const hitInstanceIds = new Set(toHit.map(t => t.instanceId));
  s = { ...s, wave: { ...s.wave, threats: s.wave.threats.filter(t => !hitInstanceIds.has(t.instanceId)) } };

  return s;
}

function blackoutCheck(s: GameState, dt: number): GameState {
  if (s.settings.godMode) return { ...s, blackoutTimer: null };

  const hasLivingBuilding = s.buildings.some(b => b.status === 'on');

  if (!hasLivingBuilding) {
    if (s.blackoutTimer === null) {
      s = addEv(s, 'alert', '⚡ БЛЕКАУТ! 30 секунд до кінця гри!');
      return { ...s, blackoutTimer: BLACKOUT_GRACE };
    }
    const newTimer = s.blackoutTimer - dt;
    if (newTimer <= 0) {
      return { ...s, blackoutTimer: 0, gameOver: true, gameResult: 'defeat' };
    }
    return { ...s, blackoutTimer: newTimer };
  }

  return { ...s, blackoutTimer: null };
}

function updateShield(s: GameState, dt: number): GameState {
  if (s.shieldTimer === null) return s;
  const newTimer = s.shieldTimer - dt;
  if (newTimer <= 0) {
    return addEv({ ...s, shieldTimer: null }, 'info', 'Щит вичерпано');
  }
  return { ...s, shieldTimer: newTimer };
}

function spawnWaveThreats(s: GameState, dt: number): GameState {
  // Spawn chance per second scales with wave; dt converts to per-tick probability
  const spawnPerSec = Math.min(3.0, 0.5 + s.wave.num * 0.1);
  const spawnChance = spawnPerSec * dt;
  const maxThreats = 5 + Math.floor(s.wave.num * 2);

  if (s.wave.threats.length < maxThreats && Math.random() < spawnChance) {
    s = spawnThreat(s);
  }
  return s;
}

// ─── MAIN GAME TICK ───────────────────────────────────────────────
// dt = delta time in seconds (e.g. 0.05 for 50ms tick)
export function gameTick(state: GameState, dt: number): GameState {
  if (state.paused || state.gameOver) return state;

  let s = { ...state };

  // --- PREP PHASE ---
  if (s.wave.phase === 'prep') {
    s = { ...s, wave: { ...s.wave, time: s.wave.time - dt } };
    if (s.wave.time <= 0) {
      s = startAttack(s);
    }
  }

  // --- ATTACK PHASE ---
  if (s.wave.phase === 'attack') {
    // Economy tick
    const income = calcIncomePerSec(s.buildings) * dt;
    s = { ...s, money: s.money + income };

    // Apply REB slow effect
    s = applyRebEffect(s);

    // Spawn new threats
    s = spawnWaveThreats(s, dt);

    // Combat: weapons fire
    s = combatTick(s, dt);

    // Move projectiles + resolve hits
    s = updateProjectiles(s, dt);

    // Move threats + apply blast on arrival
    s = moveThreats(s, dt);

    // Check wave complete (enough enemies killed and no more on screen)
    if (s.wave.threats.length === 0 && s.wave.enemiesKilled >= Math.floor(3 + s.wave.num * 2)) {
      s = endWave(s);
    }
  }

  // --- SHIELD TICK ---
  if (s.shieldTimer !== null) {
    s = updateShield(s, dt);
  }

  // --- BLACKOUT CHECK ---
  if (s.wave.phase === 'prep' || s.wave.phase === 'attack') {
    s = blackoutCheck(s, dt);
  }

  // --- VICTORY CHECK ---
  if (s.day > 30 && !s.gameOver) {
    s = addEv(s, 'success', '🏆 ПЕРЕМОГА! 30 днів пережито!');
    return { ...s, gameOver: true, gameResult: 'victory' };
  }

  return s;
}
