import type { ThreatTemplate } from '../types';

export const THREATS: ThreatTemplate[] = [
  // Shaheds: slow, weak, many — satisfying to shoot down
  { id: 'shahed136', name: 'Шахед-136', icon: '🛩️', type: 'shahed', speed: 0.015, health: 1, blastRadius: 60, dmg: 1, hitChanceMod: 1.0, unlockDay: 1 },
  { id: 'shahed131', name: 'Шахед-131', icon: '🛩️', type: 'shahed', speed: 0.018, health: 1, blastRadius: 50, dmg: 1, hitChanceMod: 0.95, unlockDay: 2 },
  { id: 'geran2', name: 'Герань-2', icon: '🛩️', type: 'shahed', speed: 0.020, health: 2, blastRadius: 70, dmg: 1, hitChanceMod: 0.9, unlockDay: 4 },
  { id: 'decoy', name: 'Декой-дрон', icon: '🛩️', type: 'shahed', speed: 0.030, health: 1, blastRadius: 30, dmg: 0, hitChanceMod: 1.0, unlockDay: 5 },
  { id: 'swarm', name: 'Рій дронів', icon: '🦟', type: 'shahed', speed: 0.012, health: 3, blastRadius: 80, dmg: 1, hitChanceMod: 0.85, unlockDay: 8 },

  // Rockets: faster, tougher
  { id: 'kalibr', name: 'Калібр', icon: '🚀', type: 'rocket', speed: 0.035, health: 4, blastRadius: 100, dmg: 2, hitChanceMod: 0.6, unlockDay: 4 },
  { id: 'x101', name: 'Х-101', icon: '🚀', type: 'rocket', speed: 0.040, health: 5, blastRadius: 110, dmg: 2, hitChanceMod: 0.5, unlockDay: 8 },
  { id: 'cruise_swarm', name: 'Крилата + рій', icon: '🚀', type: 'rocket', speed: 0.028, health: 6, blastRadius: 120, dmg: 2, hitChanceMod: 0.55, unlockDay: 12 },

  // Ballistic: very fast, hard to hit
  { id: 'iskander', name: 'Іскандер-М', icon: '☄️', type: 'ballistic', speed: 0.060, health: 8, blastRadius: 130, dmg: 3, hitChanceMod: 0.35, unlockDay: 14 },
  { id: 'kn23', name: 'КН-23', icon: '☄️', type: 'ballistic', speed: 0.070, health: 10, blastRadius: 140, dmg: 3, hitChanceMod: 0.30, unlockDay: 17 },
  { id: 'kinzhal', name: 'Кинджал', icon: '⚡', type: 'ballistic', speed: 0.085, health: 12, blastRadius: 160, dmg: 4, hitChanceMod: 0.25, unlockDay: 20 },
  { id: 'zircon', name: 'Циркон', icon: '⚡', type: 'ballistic', speed: 0.100, health: 15, blastRadius: 180, dmg: 4, hitChanceMod: 0.20, unlockDay: 23 },
  { id: 'cluster', name: 'Балістика+кластер', icon: '☄️', type: 'ballistic', speed: 0.060, health: 12, blastRadius: 200, dmg: 5, hitChanceMod: 0.30, unlockDay: 26 },

  // Boss
  { id: 'oreshnik', name: 'Орешнік', icon: '💥', type: 'boss', speed: 0.050, health: 30, blastRadius: 250, dmg: 6, hitChanceMod: 0.25, unlockDay: 25 },
];
