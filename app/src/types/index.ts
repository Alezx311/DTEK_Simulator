export type BuildingStatus = 'on' | 'damaged' | 'destroyed';
export type WeaponType = 'mobile' | 'static' | 'reb' | 'machinegun' | 'sam';
export type ThreatType = 'shahed' | 'rocket' | 'ballistic' | 'boss';
export type AidRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type WavePhase = 'prep' | 'attack' | 'aid' | 'repair';
export type EventType = 'info' | 'alert' | 'success' | 'warning';

export interface Building {
  id: string;
  lat: number;
  lng: number;
  address: string;
  group: string;
  incomeRate: number;     // UAH/sec
  status: BuildingStatus;
  destroyedAt: number | null;
  offTime: number;
}

export interface WeaponTemplate {
  id: string;
  type: WeaponType;
  name: string;
  radius: number;          // meters
  hitChance: number;       // 0-1
  fireRate: number;        // shots/sec
  damage: number;
  critChance: number;      // 0-1, chance for critical hit
  critMultiplier: number;  // damage multiplier on crit (e.g. 2.0 = double)
  mobileReposition: boolean;
  slowFactor?: number;
}

export interface WeaponInstance {
  id: string;
  templateId: string;
  type: WeaponType;
  lat: number;
  lng: number;
  radius: number;
  hitChance: number;
  fireRate: number;
  damage: number;
  critChance: number;
  critMultiplier: number;
  cooldown: number;        // ticks until next shot
  slowFactor?: number;
}

export interface Projectile {
  id: string;
  weaponId: string;
  targetThreatId: string;
  damage: number;
  hitChance: number;
  hitChanceMod: number;
  isCrit: boolean;         // critical hit projectile
  startLat: number;
  startLng: number;
  targetLat: number;       // current threat position (updated each tick)
  targetLng: number;
  progress: number;        // 0 → 1
}

export interface ThreatTemplate {
  id: string;
  name: string;
  icon: string;
  type: ThreatType;
  speed: number;           // progress units/tick
  health: number;
  blastRadius: number;     // meters
  dmg: number;
  hitChanceMod: number;    // multiplier on weapon hitChance (0.3=hard to hit)
  unlockDay: number;
}

export interface ThreatInstance {
  instanceId: string;
  templateId: string;
  name: string;
  icon: string;
  type: ThreatType;
  speed: number;
  currentHealth: number;
  maxHealth: number;
  blastRadius: number;
  dmg: number;
  hitChanceMod: number;
  targetId: string;
  targetLat: number;
  targetLng: number;
  startLat: number;
  startLng: number;
  launchCity: string;      // name of the Russian launch city
  startX: number;          // 0-1, for map rendering
  progress: number;        // 0 → 1
  hitFlash: number;        // ticks of hit flash remaining
  rebSlowed: boolean;
}

export interface AidCard {
  id: string;
  name: string;
  description: string;
  rarity: AidRarity;
  type: string;
  icon: string;
  effectKey: string;
}

export interface CityUpgrade {
  id: string;
  name: string;
  desc: string;
  cost: number;
  costType: 'money' | 'dp';
  effectKey: string;
}

export interface Wave {
  num: number;
  phase: WavePhase;
  time: number;
  threats: ThreatInstance[];
  enemiesKilled: number;
  buildingsHitThisWave: number;
}

export interface GameSettings {
  gameSpeed: number;
  autopause: boolean;
  godMode: boolean;
  timeAccel: number;
  showTooltips: boolean;
  uiScale: number;
  fontSize: string;
  detailedStats: boolean;
  gfxQuality: string;
  fpsLimit: number;
}

export interface GameEvent {
  id: number;
  type: EventType;
  text: string;
  time: string;
}

export interface GameState {
  paused: boolean;
  gameOver: boolean;
  gameResult: 'victory' | 'defeat' | null;
  day: number;
  money: number;
  diplomacyPoints: number;
  diplomaticTier: number;
  buildings: Building[];
  weapons: WeaponInstance[];
  projectiles: Projectile[];
  wave: Wave;
  pendingAidCards: AidCard[];
  boughtUpgrades: string[];
  events: GameEvent[];
  blackoutTimer: number | null;
  shieldTimer: number | null;
  nextAidCardBonus: number;
  settings: GameSettings;
}

export type GameAction =
  | { type: 'TICK'; payload: GameState }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SELECT_AID_CARD'; payload: string }
  | { type: 'SKIP_AID' }
  | { type: 'REPAIR_BUILDING'; payload: string }
  | { type: 'REPAIR_ALL' }
  | { type: 'AUTO_REPAIR' }
  | { type: 'CONFIRM_REPAIR' }
  | { type: 'BUY_CITY_UPGRADE'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings> }
  | { type: 'CHEAT'; payload: string }
  | { type: 'RESET' };
