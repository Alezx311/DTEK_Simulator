import { DISTRICTS } from '../data/districts';
import { THREATS } from '../data/threats';

export function gameTick(state) {
  if (state.paused || state.gameOver) return state;

  let s = { ...state, subgroups: state.subgroups.map(sg => ({ ...sg })), wave: { ...state.wave, threats: state.wave.threats.map(t => ({ ...t })) } };
  const speedMod = s.settings.gameSpeed / 100;
  const timeAccel = s.settings.timeAccel;

  for (let tick = 0; tick < timeAccel; tick++) {
    s.subgroups.forEach(sg => {
      if (sg.status === 'on') {
        sg.onTime++;
        sg.offTime = 0;
        sg.heat = Math.min(100, sg.heat + 0.4 * (1 - s.coolBonus) * speedMod);
        if (sg.heat >= 100 && !s.settings.godMode) {
          sg.status = 'damaged';
          s.consumption -= sg.power;
          s = addEv(s, 'alert', `${sg.districtShort}-${sg.num} ПЕРЕГОРІВ!`);
          sg._repairAt = Date.now() + s.repairTime * 1000 * s.settings.repairTimeMod / 100;
        }
      } else if (sg.status === 'off') {
        sg.offTime++;
        sg.onTime = 0;
        sg.heat = Math.max(0, sg.heat - 1.2);
      } else {
        sg.heat = Math.max(0, sg.heat - 1.5);
        if (sg._repairAt && Date.now() >= sg._repairAt) {
          sg.status = 'on';
          sg.heat = 0;
          s.consumption += sg.power;
          sg._repairAt = null;
          s = addEv(s, 'success', `${sg.districtShort}-${sg.num} OK`);
        }
      }
    });

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
    s.consumption = Math.max(400, s.consumption);

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
  const target = DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)];
  s.wave.threats.push({
    id: Date.now() + Math.random(),
    ...tmpl,
    targetId: target.id,
    x: -20,
    y: Math.random() * 180,
    tx: target.x,
    ty: target.y,
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
      if (t.dmg > 0) s = hitDistrict(s, t);
    }
  });
  s.wave.threats = s.wave.threats.filter(t => !toRemove.includes(t.id));
  return s;
}

function hitDistrict(s, threat) {
  if (s.settings.godMode) return s;
  const subs = s.subgroups.filter(sg => sg.districtId === threat.targetId && sg.status !== 'damaged');
  let dmg = Math.round(threat.dmg * (1 - s.dmgReduction) * s.settings.enemyDmg / 100);
  if (dmg < 1) dmg = 1;
  const toHit = subs.slice(0, Math.min(dmg, subs.length));
  toHit.forEach(sg => {
    if (sg.status === 'on') s.consumption -= sg.power;
    sg.status = 'damaged';
    sg._repairAt = Date.now() + s.repairTime * 1000 * s.settings.repairTimeMod / 100;
  });
  if (toHit.length > 0) {
    const dist = DISTRICTS.find(d => d.id === threat.targetId);
    s = addEv(s, 'alert', `${threat.name}\u2192${dist.short} ${toHit.length}шкоди`);
  }
  return s;
}

function endWave(s) {
  s.wave.threats = [];
  const reward = 50 + s.wave.num * 25;
  s.money += reward;
  s = addEv(s, 'success', `Хвиля ${s.wave.num}! +${reward}\u20B4`);
  s.consumption = Math.max(500, s.consumption - 80);
  s.wave.num++;
  s.wave.phase = 'prep';
  s.wave.time = Math.max(25, 45 - s.wave.num * 2);
  if (s.wave.num % 3 === 0) s.day++;
  if (s.wave.num > 12) return doVictory(s);
  return s;
}

function autoBalance(s) {
  const hot = s.subgroups.filter(sg => sg.status === 'on').sort((a, b) => b.heat - a.heat)[0];
  if (hot) {
    hot.status = 'off';
    s.consumption -= hot.power;
    s = addEv(s, 'info', `Авто: ${hot.districtShort}-${hot.num} OFF`);
  }
  return s;
}

function updateMood(s) {
  const offGroups = s.subgroups.filter(sg => sg.status === 'off');
  const longOff = offGroups.filter(sg => sg.offTime > 60).length;
  const veryLongOff = offGroups.filter(sg => sg.offTime > 120).length;
  const damaged = s.subgroups.filter(sg => sg.status === 'damaged').length;
  s.mood = {
    residents: Math.max(10, 100 - longOff * 8 - veryLongOff * 15 - damaged * 5),
    business: Math.max(10, 100 - offGroups.length * 3 - damaged * 8),
    critical: Math.max(20, 100 - damaged * 12),
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
