import type { CityUpgrade } from '../types';

export const CITY_UPGRADES: CityUpgrade[] = [
  // === Енергомережа ===
  {
    id: 'net_upgrade',
    name: '⚡ Модернізація мережі',
    desc: '+25% доходу від будинків',
    cost: 3000,
    costType: 'money',
    effectKey: 'income_boost_25',
  },
  {
    id: 'backup_gen',
    name: '🔋 Резервний генератор',
    desc: '+15с до блекаут-таймера',
    cost: 2500,
    costType: 'money',
    effectKey: 'blackout_time_plus',
  },
  {
    id: 'fast_repair',
    name: '🔧 Швидкий ремонт',
    desc: 'Пошкоджені будинки → авто-ремонт',
    cost: 4000,
    costType: 'money',
    effectKey: 'auto_repair_damaged',
  },
  // === Оборона ===
  {
    id: 'training',
    name: '🎯 Навчання розрахунків',
    desc: '+10% точності всіх зброй',
    cost: 2000,
    costType: 'money',
    effectKey: 'all_hit_plus_10',
  },
  {
    id: 'ammo',
    name: '💥 Поліпшені боєприпаси',
    desc: '+1 до шкоди всіх зброй',
    cost: 4500,
    costType: 'money',
    effectKey: 'all_dmg_plus_1',
  },
  {
    id: 'radar',
    name: '📡 Радар раннього попередження',
    desc: 'Hit-flash з моменту спавну ворогів',
    cost: 5000,
    costType: 'money',
    effectKey: 'early_warning',
  },
  // === Дипломатія ===
  {
    id: 'diplo_mission',
    name: '🌍 Дипломатична місія',
    desc: '+50 дипломатичних очок',
    cost: 60,
    costType: 'dp',
    effectKey: 'add_dp_50',
  },
  {
    id: 'extra_cards',
    name: '🃏 Розширений пул',
    desc: '+1 картка в наступній допомозі',
    cost: 80,
    costType: 'dp',
    effectKey: 'next_extra_card',
  },
];
