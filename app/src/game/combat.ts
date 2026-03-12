import type { GameState, ThreatInstance, Projectile } from '../types';

// Haversine distance in meters
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function threatCurrentPos(t: ThreatInstance): { lat: number; lng: number } {
  return {
    lat: t.startLat + (t.targetLat - t.startLat) * t.progress,
    lng: t.startLng + (t.targetLng - t.startLng) * t.progress,
  };
}

// Apply REB slow to threats within radius
export function applyRebEffect(state: GameState): GameState {
  const rebs = state.weapons.filter(w => w.type === 'reb');

  const threats = state.wave.threats.map(t => {
    if (rebs.length === 0) return { ...t, rebSlowed: false };
    const pos = threatCurrentPos(t);
    const slowed = rebs.some(r =>
      distanceMeters(r.lat, r.lng, pos.lat, pos.lng) <= r.radius
    );
    return { ...t, rebSlowed: slowed };
  });

  return { ...state, wave: { ...state.wave, threats } };
}

// Weapons fire projectiles at threats in range
export function combatTick(state: GameState, dt: number): GameState {
  const newProjectiles: Projectile[] = [...state.projectiles];
  const weapons = state.weapons.map(w => ({ ...w }));
  const threats = state.wave.threats;

  for (const weapon of weapons) {
    if (weapon.type === 'reb' || weapon.fireRate === 0) continue;

    // Cooldown decreases by dt (in seconds)
    weapon.cooldown = Math.max(0, weapon.cooldown - dt);
    if (weapon.cooldown > 0) continue;

    // Find nearest threat in range
    let nearestThreat: ThreatInstance | null = null;
    let nearestDist = Infinity;

    for (const t of threats) {
      const pos = threatCurrentPos(t);
      const dist = distanceMeters(weapon.lat, weapon.lng, pos.lat, pos.lng);
      if (dist <= weapon.radius && dist < nearestDist) {
        nearestDist = dist;
        nearestThreat = t;
      }
    }

    if (nearestThreat) {
      const pos = threatCurrentPos(nearestThreat);
      const isCrit = Math.random() < (weapon.critChance || 0);
      const dmg = isCrit ? weapon.damage * (weapon.critMultiplier || 2) : weapon.damage;
      const proj: Projectile = {
        id: `proj_${Date.now()}_${Math.random()}`,
        weaponId: weapon.id,
        targetThreatId: nearestThreat.instanceId,
        damage: dmg,
        hitChance: weapon.hitChance,
        hitChanceMod: nearestThreat.hitChanceMod,
        isCrit,
        startLat: weapon.lat,
        startLng: weapon.lng,
        targetLat: pos.lat,
        targetLng: pos.lng,
        progress: 0,
      };
      newProjectiles.push(proj);
      // Cooldown = 1/fireRate seconds
      weapon.cooldown = 1 / weapon.fireRate;
    }
  }

  return { ...state, weapons, projectiles: newProjectiles };
}

// Move projectiles; resolve hits when progress >= 1
export function updateProjectiles(state: GameState, dt: number): GameState {
  // Projectile speed: crosses full distance in ~0.3 seconds
  const PROJ_SPEED = 3.5; // progress units per second

  const threats = state.wave.threats.map(t => ({ ...t }));
  const threatMap = new Map(threats.map(t => [t.instanceId, t]));
  const toRemove = new Set<string>();

  let diplomacyPoints = state.diplomacyPoints;
  let enemiesKilled = state.wave.enemiesKilled;
  const events = [...state.events];
  let money = state.money;

  const updatedProjectiles = state.projectiles.map(p => {
    const target = threatMap.get(p.targetThreatId);
    if (!target) { toRemove.add(p.id); return p; }

    const pos = threatCurrentPos(target);
    const updated: Projectile = {
      ...p,
      targetLat: pos.lat,
      targetLng: pos.lng,
      progress: p.progress + PROJ_SPEED * dt,
    };

    if (updated.progress >= 1) {
      toRemove.add(p.id);
      if (Math.random() < updated.hitChance * updated.hitChanceMod) {
        target.currentHealth -= updated.damage;
        target.hitFlash = updated.isCrit ? 5 : 3;
        if (target.currentHealth <= 0) {
          target.currentHealth = 0;
          const dpReward = updated.isCrit ? 4 : 2;
          const moneyReward = Math.floor(target.maxHealth * (updated.isCrit ? 8 : 5));
          diplomacyPoints += dpReward;
          enemiesKilled++;
          money += moneyReward;
          const time = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const critText = updated.isCrit ? ' КРИТ!' : '';
          events.unshift({ id: Date.now() + Math.random(), type: 'success' as const, text: `${target.icon} ${target.name} збито!${critText} +${dpReward}🔵`, time });
        } else if (updated.isCrit) {
          const time = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          events.unshift({ id: Date.now() + Math.random(), type: 'info' as const, text: `💥 КРИТ по ${target.name}! -${updated.damage} HP`, time });
        }
      }
    }

    return updated;
  }).filter(p => !toRemove.has(p.id));

  const survivingThreats = threats.filter(t => t.currentHealth > 0);

  return {
    ...state,
    money,
    diplomacyPoints,
    projectiles: updatedProjectiles,
    events: events.slice(0, 8),
    wave: { ...state.wave, threats: survivingThreats, enemiesKilled },
  };
}

// Apply blast damage when a threat reaches its target
export function applyBlast(state: GameState, threat: ThreatInstance): GameState {
  if (state.settings.godMode || state.shieldTimer !== null) return state;

  const buildings = state.buildings.map(b => ({ ...b }));

  let hitCount = 0;

  for (const b of buildings) {
    if (b.status === 'destroyed') continue;
    const dist = distanceMeters(threat.targetLat, threat.targetLng, b.lat, b.lng);
    if (dist <= 10) {
      b.status = 'destroyed';
      b.destroyedAt = Date.now();
      hitCount++;
    } else if (dist <= threat.blastRadius) {
      if (b.status === 'on') {
        b.status = Math.random() < 0.3 ? 'destroyed' : 'damaged';
        if (b.status === 'destroyed') b.destroyedAt = Date.now();
        hitCount++;
      } else if (b.status === 'damaged' && Math.random() < 0.2) {
        b.status = 'destroyed';
        b.destroyedAt = Date.now();
        hitCount++;
      }
    }
  }

  const events = [...state.events];
  if (hitCount > 0) {
    const time = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    events.unshift({
      id: Date.now() + Math.random(),
      type: 'alert' as const,
      text: `${threat.icon} ${threat.name} влучив! ${hitCount} буд. пошкоджено`,
      time,
    });
  }

  return {
    ...state,
    buildings,
    events: events.slice(0, 8),
    wave: {
      ...state.wave,
      buildingsHitThisWave: state.wave.buildingsHitThisWave + (hitCount > 0 ? 1 : 0),
    },
  };
}
