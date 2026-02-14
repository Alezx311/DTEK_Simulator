export const UPGRADES = {
  infra: [
    { id: 'gen1', name: '\u26A1 +100 MW', desc: 'Модернізація ТЕЦ', cost: 80, effectKey: 'gen1' },
    { id: 'gen2', name: '\u{1F50B} Резерв', desc: 'Кнопка +300MW', cost: 120, effectKey: 'gen2' },
    { id: 'gen3', name: '\u{1F69B} +150 MW', desc: 'Мобільні дизелі', cost: 200, effectKey: 'gen3' },
    { id: 'auto', name: '\u{1F504} Авто-баланс', desc: 'Авто при 92%', cost: 250, effectKey: 'auto' },
    { id: 'cool', name: '\u2744\uFE0F Охолодження', desc: '-40% перегріву', cost: 180, effectKey: 'cool' },
    { id: 'gen4', name: '\u{1F3ED} +300 MW', desc: 'Супер-ТЕЦ', cost: 400, effectKey: 'gen4' },
  ],
  defense: [
    { id: 'reb', name: '\u{1F4E1} РЕБ', desc: '-25% шахедів', cost: 120, effectKey: 'reb' },
    { id: 'repair', name: '\u{1F527} Ремонт 15с', desc: 'Швидкі бригади', cost: 150, effectKey: 'repair' },
    { id: 'ppo', name: '\u{1F680} ППО', desc: '-25% ракет', cost: 250, effectKey: 'ppo' },
    { id: 'cable', name: '\u{1F50C} Кабелі', desc: '-30% пошкоджень', cost: 300, effectKey: 'cable' },
    { id: 'air', name: '\u2708\uFE0F Щит', desc: '-20% всіх', cost: 450, effectKey: 'air' },
  ],
}

export function applyUpgradeEffect(state, effectKey) {
  switch (effectKey) {
    case 'gen1':
      return { ...state, generation: state.generation + 100 }
    case 'gen2':
      return { ...state, hasReserve: true }
    case 'gen3':
      return { ...state, generation: state.generation + 150 }
    case 'gen4':
      return { ...state, generation: state.generation + 300 }
    case 'auto':
      return { ...state, hasAuto: true }
    case 'cool':
      return { ...state, coolBonus: state.coolBonus + 0.4 }
    case 'reb':
      return { ...state, shahedDef: state.shahedDef + 0.25 }
    case 'repair':
      return { ...state, repairTime: 15 }
    case 'ppo':
      return { ...state, rocketDef: state.rocketDef + 0.25 }
    case 'cable':
      return { ...state, dmgReduction: state.dmgReduction + 0.3 }
    case 'air':
      return { ...state, globalDef: state.globalDef + 0.2 }
    default:
      return state
  }
}
