import { THREATS } from '../data/threats';

export function gameTick(state) {
  if (state.paused || state.gameOver) return state;

  let s = {
    ...state,
    buildings: state.buildings.map(b => ({ ...b })),
    wave: { ...state.wave, threats: state.wave.threats.map(t => ({ ...t })) },
  };
  const speedMod = s.settings.gameSpeed / 100;
  const timeAccel = s.settings.timeAccel;

  for (let tick = 0; tick < timeAccel; tick++) {
    // Repair damaged buildings over time
    s.buildings.forEach(b => {
      if (b.status === 'damaged') {
        b._repairTicks = (b._repairTicks || 0) + 1;
        const repairTicks = Math.round(s.repairTime * s.settings.repairTimeMod / 100);
        if (b._repairTicks >= repairTicks) {
          b.status = 'on';
          b._repairTicks = 0;
          s.consumption += b.power;
          s = addEv(s, 'success', `${b.address} OK`);
        }
      }
      if (b.status === 'off') {
        b.offTime = (b.offTime || 0) + 1;
      } else {
        b.offTime = 0;
      }
    });

    // Wave timer
    s.wave.time -= speedMod;
    if (s.wave.phase === 'prep') {
      if (s.wave.time <= 0) {
        s = startAttack(s);
      }
    } else {
      if (s.wave.time > 2 && Math.random() < 0.4 * s.settings.attackFreq / 100) {
        s = spawnThreat(s);
      }
      s.consumption += (6 + s.wave.num * 2) * speedMod;
      if (s.wave.time <= 0 || (s.wave.threats.length === 0 && s.wave.time < 5)) {
        s = endWave(s);
      }
    }

    s = updateThreats(s);
    s.consumption += (Math.floor(Math.random() * 12) - 5) * speedMod;
    s.consumption = Math.max(200, s.consumption);

    if (s.hasAuto && getLoad(s) >= 92) {
      s = autoBalance(s);
    }
    if (getLoad(s) >= 100 && !s.settings.godMode) {
      return doGameOver(s);
    }
  }

  s = updateMood(s);
  s.load = getLoad(s);
  s.maxLoad = Math.max(s.maxLoad, s.load);

  if (s.mood.residents < 15 && !s.settings.godMode) {
    s = addEv(s, 'alert', 'МАСОВІ ПРОТЕСТИ!');
    return doGameOver(s);
  }

  return s;
}

function getLoad(s) {
  return Math.round((s.consumption / s.generation) * 100);
}

function startAttack(s) {
  s.wave.phase = 'attack';
  s.wave.time = 10 + s.wave.num * 2;
  s = addEv(s, 'alert', `ХВИЛЯ ${s.wave.num}!`);
  if (s.settings.autopause) s.paused = true;
  return s;
}

function spawnThreat(s) {
  const avail = THREATS.filter(t => t.wave <= s.wave.num);
  const tmpl = avail[Math.floor(Math.random() * avail.length)];

  let blocked = false;
  if (tmpl.type === 'shahed' && Math.random() < s.shahedDef + s.globalDef) blocked = true;
  if (tmpl.type === 'rocket' && Math.random() < s.rocketDef + s.globalDef) blocked = true;
  if (tmpl.type === 'ballistic' && Math.random() < s.globalDef) blocked = true;
  if (blocked) {
    return addEv(s, 'success', `${tmpl.name} збито!`);
  }

  // Pick a random active building as target
  const active = s.buildings.filter(b => b.status !== 'damaged');
  if (active.length === 0) return s;
  const target = active[Math.floor(Math.random() * active.length)];

  s.wave.threats.push({
    id: Date.now() + Math.random(),
    ...tmpl,
    targetId: target.id,
    targetLat: target.lat,
    targetLng: target.lng,
    targetAddress: target.address,
    targetGroup: target.group,
    startX: Math.random(),
    progress: 0,
  });

  return s;
}

function updateThreats(s) {
  const toRemove = [];
  s.wave.threats.forEach(t => {
    t.progress += t.speed * (s.settings.gameSpeed / 100);
    if (t.progress >= 1) {
      toRemove.push(t.id);
      if (t.dmg > 0) s = hitBuilding(s, t);
    }
  });
  s.wave.threats = s.wave.threats.filter(t => !toRemove.includes(t.id));
  return s;
}

function hitBuilding(s, threat) {
  if (s.settings.godMode) return s;

  const groupBuildings = s.buildings.filter(b => b.group === threat.targetGroup && b.status !== 'damaged');
  let dmg = Math.round(threat.dmg * (1 - s.dmgReduction) * s.settings.enemyDmg / 100);
  if (dmg < 1) dmg = 1;

  const toHit = groupBuildings.slice(0, Math.min(dmg, groupBuildings.length));
  toHit.forEach(b => {
    if (b.status === 'on') s.consumption -= b.power;
    b.status = 'damaged';
    b._repairTicks = 0;
  });

  if (toHit.length > 0) {
    s = addEv(s, 'alert', `${threat.name}\u2192${threat.targetAddress} (${toHit.length})`);
  }
  return s;
}

function endWave(s) {
  s.wave.threats = [];
  const reward = 50 + s.wave.num * 25;
  s.money += reward;
  s = addEv(s, 'success', `Хвиля ${s.wave.num}! +${reward}\u20B4`);
  s.consumption = Math.max(300, s.consumption - 80);
  s.wave.num++;
  s.wave.phase = 'prep';
  s.wave.time = Math.max(25, 45 - s.wave.num * 2);
  if (s.wave.num % 3 === 0) s.day++;
  if (s.wave.num > 12) return doVictory(s);
  return s;
}

function autoBalance(s) {
  const onGroups = [...new Set(s.buildings.filter(b => b.status === 'on').map(b => b.group))];
  if (onGroups.length === 0) return s;
  const group = onGroups[Math.floor(Math.random() * onGroups.length)];
  let diff = 0;
  s.buildings.forEach(b => {
    if (b.group === group && b.status === 'on') {
      b.status = 'off';
      diff -= b.power;
    }
  });
  s.consumption += diff;
  s = addEv(s, 'info', `Авто: ${group} OFF`);
  return s;
}

function updateMood(s) {
  const offCount = s.buildings.filter(b => b.status === 'off').length;
  const longOff = s.buildings.filter(b => b.status === 'off' && (b.offTime || 0) > 60).length;
  const veryLongOff = s.buildings.filter(b => b.status === 'off' && (b.offTime || 0) > 120).length;
  const damaged = s.buildings.filter(b => b.status === 'damaged').length;
  const total = s.buildings.length;

  s.mood = {
    residents: Math.max(10, 100 - (offCount / total) * 30 - longOff * 2 - veryLongOff * 5 - damaged * 1),
    business: Math.max(10, 100 - (offCount / total) * 20 - damaged * 2),
    critical: Math.max(20, 100 - damaged * 3),
  };
  return s;
}

function doGameOver(s) {
  return { ...s, gameOver: true, gameResult: 'defeat' };
}

function doVictory(s) {
  return { ...s, gameOver: true, gameResult: 'victory' };
}

function addEv(s, type, text) {
  const time = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const events = [{ id: Date.now() + Math.random(), type, text, time }, ...s.events].slice(0, 8);
  return { ...s, events };
}
