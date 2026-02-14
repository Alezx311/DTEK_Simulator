import { useMemo } from 'react';

export default function Header({ state, dispatch, onOpenSettings }) {
  const load = state.load;
  const loadClass = load >= 88 ? 'red' : load >= 70 ? 'yellow' : 'green';

  const reputation = useMemo(() => {
    const rep = Math.round((state.mood.residents + state.mood.business + state.mood.critical) / 60);
    return '\u2605'.repeat(Math.min(5, rep)) + '\u2606'.repeat(Math.max(0, 5 - rep));
  }, [state.mood]);

  return (
    <header className="header">
      <div className="logo">ДТЕК SIMULATOR</div>
      <div className="header-stats">
        <div className="stat-pill">
          <span className="stat-label">ДЕНЬ</span>
          <span className="stat-value cyan">{state.day}</span>
        </div>
        <div className={`stat-pill${load >= 88 ? ' danger' : ''}`}>
          <span className="stat-label">МЕРЕЖА</span>
          <span className={`stat-value ${loadClass}`}>{load}%</span>
          <div className="mini-bar">
            <div className={`mini-bar-fill ${loadClass}`} style={{ width: `${Math.min(100, load)}%` }} />
          </div>
        </div>
        <div className="stat-pill">
          <span className="stat-label">GEN</span>
          <span className="stat-value cyan">{state.generation}</span>
        </div>
        <div className="stat-pill">
          <span className="stat-value gold">{'\u20B4'}{state.money}</span>
        </div>
        <div className="stat-pill">
          <span className="stat-value gold">{reputation}</span>
        </div>
        <div className="header-buttons">
          <button className="btn-sm" onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}>
            {state.paused ? '\u25B6' : '\u23F8'}
          </button>
          <button className="btn-sm" onClick={onOpenSettings}>{'\u2699\uFE0F'}</button>
        </div>
      </div>
    </header>
  );
}
