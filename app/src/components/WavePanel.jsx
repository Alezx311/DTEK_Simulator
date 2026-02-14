import { DISTRICTS } from '../data/districts';
import { UPGRADES } from '../data/upgrades';

export default function WavePanel({ state, dispatch }) {
  const w = state.wave;
  const ups = UPGRADES[state.currentTab] || [];

  return (
    <div className="panel right-panel">
      <div className="panel-header">{'\u{1F3AF}'} ХВИЛЯ</div>
      <div className="wave-display">
        <div className={`wave-number${w.phase === 'attack' ? ' danger' : ''}`}>{w.num}</div>
        <div className="wave-timer">{Math.floor(Math.max(0, w.time) / 60)}:{String(Math.max(0, Math.floor(w.time)) % 60).padStart(2, '0')}</div>
        <div className={`wave-phase ${w.phase}`}>{w.phase === 'prep' ? 'ПІДГОТОВКА' : 'АТАКА!'}</div>
      </div>

      <div className="threat-slots">
        {w.threats.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 5 }}>{'\u2014'}</div>
        ) : (
          w.threats.slice(0, 3).map(t => {
            const dist = DISTRICTS.find(d => d.id === t.targetId);
            return (
              <div className="threat-slot" key={t.id}>
                <span className="threat-icon">{t.icon}</span>
                <span className="threat-name">{t.name}</span>
                <span className="threat-target">{'\u2192'}{dist?.short || '?'}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="upgrades-tabs">
        <button className={`upgrade-tab${state.currentTab === 'infra' ? ' active' : ''}`} onClick={() => dispatch({ type: 'SET_TAB', payload: 'infra' })}>
          {'\u{1F3D7}\uFE0F'}Інфра
        </button>
        <button className={`upgrade-tab${state.currentTab === 'defense' ? ' active' : ''}`} onClick={() => dispatch({ type: 'SET_TAB', payload: 'defense' })}>
          {'\u{1F6E1}\uFE0F'}Захист
        </button>
      </div>

      <div className="panel-content upgrades-list">
        {ups.map(u => {
          const bought = state.boughtUpgrades.includes(u.id);
          const canBuy = state.money >= u.cost && !bought;
          let cls = 'upgrade-item';
          if (bought) cls += ' bought';
          else if (!canBuy) cls += ' locked';
          return (
            <div className={cls} key={u.id} onClick={() => dispatch({ type: 'BUY_UPGRADE', payload: u.id })}>
              <div className="upgrade-header">
                <span className="upgrade-name">{u.name}</span>
                <span className="upgrade-cost">{bought ? '\u2713' : u.cost}</span>
              </div>
              <div className="upgrade-desc">{u.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
