import type { Building, GameState } from '../types';

export function calcIncomePerSec(buildings: Building[]): number {
  return buildings.reduce((sum, b) => {
    if (b.status === 'on') return sum + b.incomeRate;
    if (b.status === 'damaged') return sum + b.incomeRate * 0.5;
    return sum;
  }, 0);
}

export function calcRepairCost(building: Building): number {
  return building.incomeRate * 10;
}

export function calcTotalRepairCost(buildings: Building[]): number {
  return buildings
    .filter(b => b.status === 'destroyed')
    .reduce((sum, b) => sum + calcRepairCost(b), 0);
}

// Auto-repair: spend up to 50% of money on cheapest destroyed buildings
export function applyAutoRepair(state: GameState): GameState {
  const budget = Math.floor(state.money * 0.5);
  const destroyed = state.buildings
    .filter(b => b.status === 'destroyed')
    .sort((a, b) => calcRepairCost(a) - calcRepairCost(b));

  let spent = 0;
  const repairedIds = new Set<string>();

  for (const building of destroyed) {
    const cost = calcRepairCost(building);
    if (spent + cost <= budget) {
      spent += cost;
      repairedIds.add(building.id);
    }
  }

  if (repairedIds.size === 0) return state;

  const newBuildings = state.buildings.map(b =>
    repairedIds.has(b.id) ? { ...b, status: 'on' as const, destroyedAt: null } : b
  );

  const time = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const newEvent = {
    id: Date.now() + Math.random(),
    type: 'success' as const,
    text: `Авто-ремонт: ${repairedIds.size} буд. (-${spent}₴)`,
    time,
  };

  return {
    ...state,
    money: state.money - spent,
    buildings: newBuildings,
    events: [newEvent, ...state.events].slice(0, 8),
  };
}

export function calcDiplomaticTier(dp: number): number {
  if (dp < 50) return 1;
  if (dp < 150) return 2;
  if (dp < 350) return 3;
  if (dp < 700) return 4;
  return 5;
}
