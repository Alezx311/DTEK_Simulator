import { CITY_UPGRADES } from '../data/cityUpgrades';
import type { GameState, GameAction } from '../types';

interface Props {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

const WEAPON_ICONS: Record<string, string> = {
  mobile: '🚗', static: '🏗️', reb: '📡', machinegun: '🔫', sam: '🚀',
};
const WEAPON_NAMES: Record<string, string> = {
  mobile: 'Мобільна ППО', static: 'Статичне ППО', reb: 'РЕБ-станція', machinegun: 'Кулемет', sam: 'ЗРК',
};

export default function DefensePanel({ state, dispatch }: Props) {
  const w = state.wave;
  const timerMin = Math.floor(Math.max(0, w.time) / 60);
  const timerSec = String(Math.max(0, Math.floor(w.time)) % 60).padStart(2, '0');
  const phaseLabel =
    w.phase === 'prep' ? 'ПІДГОТОВКА' :
    w.phase === 'attack' ? 'АТАКА!' :
    w.phase === 'aid' ? 'ДОПОМОГА' : 'РЕМОНТ';

  const moneyUpgrades = CITY_UPGRADES.filter(u => u.costType === 'money');
  const dpUpgrades = CITY_UPGRADES.filter(u => u.costType === 'dp');

  return (
    <div className="panel right-panel">
      <div className="panel-header">🎯 ОБОРОНА</div>

      <div className="wave-display">
        <div className={`wave-number${w.phase === 'attack' ? ' danger' : ''}`}>{w.num}/30</div>
        {w.phase !== 'aid' && w.phase !== 'repair' && (
          <div className="wave-timer">{timerMin}:{timerSec}</div>
        )}
        <div className={`wave-phase ${w.phase}`}>{phaseLabel}</div>
      </div>

      {w.threats.length > 0 && (
        <div className="threat-slots">
          {w.threats.slice(0, 6).map(t => (
            <div className="threat-slot" key={t.instanceId}>
              <span className="threat-icon">{t.icon}</span>
              <span className="threat-name" title={t.launchCity ? `з ${t.launchCity}` : ''}>{t.name}</span>
              <span className="threat-target" style={{ fontSize: '0.7em' }}>
                {'█'.repeat(Math.max(0, Math.ceil(t.currentHealth / t.maxHealth * 4)))}
                {'░'.repeat(Math.max(0, 4 - Math.ceil(t.currentHealth / t.maxHealth * 4)))}
                {' '}{Math.round(t.progress * 100)}%
              </span>
            </div>
          ))}
          {w.threats.length > 4 && (
            <div style={{ textAlign: 'center', fontSize: '0.8em', color: 'var(--text-muted)' }}>+{w.threats.length - 4} ще</div>
          )}
        </div>
      )}

      <div className="panel-header" style={{ fontSize: '0.75em' }}>🛡️ ЗБРОЯ ({state.weapons.length})</div>
      <div className="threat-slots" style={{ maxHeight: 120 }}>
        {state.weapons.map(wp => (
          <div className="threat-slot" key={wp.id}>
            <span className="threat-icon">{WEAPON_ICONS[wp.type] || '🔫'}</span>
            <span className="threat-name" style={{ fontSize: '0.8em' }}>{WEAPON_NAMES[wp.type] || wp.type}</span>
            <span className="threat-target" style={{ fontSize: '0.65em' }}>
              R:{wp.radius}м {wp.damage > 0 && `⚔${wp.damage}`}
              {wp.critChance > 0 && <span style={{ color: '#ffd700' }}>{' '}💥{Math.round(wp.critChance * 100)}%×{wp.critMultiplier}</span>}
            </span>
          </div>
        ))}
      </div>

      <div className="upgrades-tabs">
        <span style={{ padding: '6px 8px', fontSize: '0.8em', color: 'var(--text-muted)' }}>💰 Апгрейди міста</span>
      </div>
      <div className="panel-content upgrades-list">
        <div style={{ fontSize: '0.75em', color: 'var(--text-muted)', marginBottom: 4 }}>За гривні:</div>
        {moneyUpgrades.map(u => {
          const bought = state.boughtUpgrades.includes(u.id);
          const canBuy = state.money >= u.cost && !bought;
          let cls = 'upgrade-item';
          if (bought) cls += ' bought';
          else if (!canBuy) cls += ' locked';
          return (
            <div
              className={cls}
              key={u.id}
              onClick={() => canBuy && dispatch({ type: 'BUY_CITY_UPGRADE', payload: u.id })}
            >
              <div className="upgrade-header">
                <span className="upgrade-name">{u.name}</span>
                <span className="upgrade-cost">{bought ? '✓' : `${u.cost}₴`}</span>
              </div>
              <div className="upgrade-desc">{u.desc}</div>
            </div>
          );
        })}
        <div style={{ fontSize: '0.75em', color: 'var(--text-muted)', margin: '6px 0 4px' }}>За ДО:</div>
        {dpUpgrades.map(u => {
          const bought = state.boughtUpgrades.includes(u.id);
          const canBuy = state.diplomacyPoints >= u.cost && !bought;
          let cls = 'upgrade-item';
          if (bought) cls += ' bought';
          else if (!canBuy) cls += ' locked';
          return (
            <div
              className={cls}
              key={u.id}
              onClick={() => canBuy && dispatch({ type: 'BUY_CITY_UPGRADE', payload: u.id })}
            >
              <div className="upgrade-header">
                <span className="upgrade-name">{u.name}</span>
                <span className="upgrade-cost" style={{ color: '#39c5ff' }}>{bought ? '✓' : `${u.cost}🔵`}</span>
              </div>
              <div className="upgrade-desc">{u.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
