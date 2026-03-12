import type { WeaponTemplate } from '../types'

export const WEAPON_TEMPLATES: WeaponTemplate[] = [
  {
    id: 'mobile',
    name: 'Мобільна ППО-група',
    type: 'mobile',
    radius: 3000,
    hitChance: 0.65,
    fireRate: 0.8,
    damage: 1,
    critChance: 0.05,
    critMultiplier: 2.0,
    mobileReposition: true,
  },
  {
    id: 'static',
    name: 'Статичне ППО',
    type: 'static',
    radius: 4500,
    hitChance: 0.8,
    fireRate: 0.5,
    damage: 1,
    critChance: 0.08,
    critMultiplier: 2.0,
    mobileReposition: false,
  },
  {
    id: 'reb',
    name: 'РЕБ-станція',
    type: 'reb',
    radius: 6000,
    hitChance: 0,
    fireRate: 0,
    damage: 0,
    critChance: 0,
    critMultiplier: 1,
    mobileReposition: false,
    slowFactor: 0.4,
  },
  {
    id: 'machinegun',
    name: 'Зенітний кулемет',
    type: 'machinegun',
    radius: 2000,
    hitChance: 0.75,
    fireRate: 2.0,
    damage: 0.5,
    critChance: 0.15,
    critMultiplier: 1.5,
    mobileReposition: false,
  },
  {
    id: 'sam',
    name: 'ЗРК',
    type: 'sam',
    radius: 5000,
    hitChance: 0.9,
    fireRate: 0.3,
    damage: 4,
    critChance: 0.1,
    critMultiplier: 3.0,
    mobileReposition: false,
  },
]

export function getWeaponTemplate(id: string): WeaponTemplate {
  const t = WEAPON_TEMPLATES.find(w => w.id === id)
  if (!t) throw new Error(`Unknown weapon template: ${id}`)
  return t
}
