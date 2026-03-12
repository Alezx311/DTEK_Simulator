import type { AidCard, AidRarity } from '../types';

const COMMON_CARDS: AidCard[] = [
  { id: 'c_mobile', name: 'Мобільна ППО', description: 'Додати мобільну ППО-групу на карту', rarity: 'common', type: 'weapon', icon: '🚗', effectKey: 'add_mobile_weapon' },
  { id: 'c_money', name: '+500 гривень', description: 'Фінансова допомога 500₴', rarity: 'common', type: 'resource', icon: '💰', effectKey: 'add_money_500' },
  { id: 'c_hitmod', name: 'Навчання розрахунків', description: '+10% точності всіх зброй', rarity: 'common', type: 'buff', icon: '🎯', effectKey: 'boost_hit_10' },
  { id: 'c_dp', name: '+15 ДО', description: 'Дипломатична підтримка', rarity: 'common', type: 'resource', icon: '🔵', effectKey: 'add_dp_15' },
  { id: 'c_machinegun', name: 'Зенітний кулемет', description: 'Встановити зенітний кулемет', rarity: 'common', type: 'weapon', icon: '🔫', effectKey: 'add_machinegun' },
];

const RARE_CARDS: AidCard[] = [
  { id: 'r_static', name: 'Статичне ППО', description: 'Встановити статичну ППО-установку', rarity: 'rare', type: 'weapon', icon: '🏗️', effectKey: 'add_static_weapon' },
  { id: 'r_reb', name: 'РЕБ-станція', description: 'Радіоелектронна боротьба', rarity: 'rare', type: 'weapon', icon: '📡', effectKey: 'add_reb_station' },
  { id: 'r_dp50', name: '+50 ДО', description: 'Дипломатична підтримка', rarity: 'rare', type: 'resource', icon: '🔵', effectKey: 'add_dp_50' },
  { id: 'r_dmg', name: 'Поліпшені боєприпаси', description: '+30% шкоди всіх зброй', rarity: 'rare', type: 'buff', icon: '💥', effectKey: 'boost_dmg_30' },
  { id: 'r_money1500', name: '+1500 гривень', description: 'Фінансова допомога', rarity: 'rare', type: 'resource', icon: '💵', effectKey: 'add_money_1500' },
];

const EPIC_CARDS: AidCard[] = [
  { id: 'e_sam', name: 'ЗРК', description: 'Зенітний ракетний комплекс', rarity: 'epic', type: 'weapon', icon: '🚀', effectKey: 'add_sam' },
  { id: 'e_reroll', name: 'Нові пропозиції', description: 'Отримати нові 3 картки', rarity: 'epic', type: 'special', icon: '🔄', effectKey: 'reroll_aid' },
  { id: 'e_dp_tier', name: 'Дипл. прорив', description: '+200 ДО (2 рівні вище)', rarity: 'epic', type: 'buff', icon: '⭐', effectKey: 'boost_dp_tier' },
  { id: 'e_shield', name: 'Повітряний щит', description: 'Захист від атак на 30 секунд', rarity: 'epic', type: 'special', icon: '🛡️', effectKey: 'shield_30s' },
  { id: 'e_extra_card', name: '+1 картка', description: 'Наступного разу 4 картки', rarity: 'epic', type: 'special', icon: '🃏', effectKey: 'next_extra_card' },
];

const LEGENDARY_CARDS: AidCard[] = [
  { id: 'l_repair_all', name: 'Миттєвий ремонт', description: 'Відновити всі знищені будинки', rarity: 'legendary', type: 'special', icon: '✨', effectKey: 'instant_repair_all' },
  { id: 'l_three_static', name: 'Три статичних ППО', description: 'Встановити 3 статичних ППО', rarity: 'legendary', type: 'weapon', icon: '🏰', effectKey: 'add_three_static' },
  { id: 'l_dp100', name: '+100 ДО', description: 'Масштабна дипломатична підтримка', rarity: 'legendary', type: 'resource', icon: '🌟', effectKey: 'add_dp_100' },
  { id: 'l_money5000', name: '+5000 гривень', description: 'Велика фінансова допомога', rarity: 'legendary', type: 'resource', icon: '💎', effectKey: 'add_money_5000' },
];

const ALL_CARDS: AidCard[] = [...COMMON_CARDS, ...RARE_CARDS, ...EPIC_CARDS, ...LEGENDARY_CARDS];

const TIER_WEIGHTS: Record<number, Record<AidRarity, number>> = {
  1: { common: 70, rare: 25, epic: 5, legendary: 0 },
  2: { common: 55, rare: 33, epic: 10, legendary: 2 },
  3: { common: 40, rare: 38, epic: 17, legendary: 5 },
  4: { common: 25, rare: 40, epic: 25, legendary: 10 },
  5: { common: 15, rare: 35, epic: 35, legendary: 15 },
};

function pickRarity(tier: number): AidRarity {
  const weights = TIER_WEIGHTS[Math.min(5, Math.max(1, tier))] ?? TIER_WEIGHTS[1];
  const total = (Object.values(weights) as number[]).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return rarity as AidRarity;
  }
  return 'common';
}

function pickCard(rarity: AidRarity, excluded: Set<string>): AidCard {
  const pool = ALL_CARDS.filter(c => c.rarity === rarity && !excluded.has(c.id));
  if (pool.length === 0) {
    const fallback = ALL_CARDS.filter(c => !excluded.has(c.id));
    return fallback[Math.floor(Math.random() * fallback.length)] ?? ALL_CARDS[0];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generateAidCards(tier: number, count: number): AidCard[] {
  const chosen: AidCard[] = [];
  const usedIds = new Set<string>();
  for (let i = 0; i < count; i++) {
    const rarity = pickRarity(tier);
    const card = pickCard(rarity, usedIds);
    chosen.push(card);
    usedIds.add(card.id);
  }
  return chosen;
}

export { ALL_CARDS };
