import type { GameState, GameAction } from '../types';

interface Props {
  state: GameState;
  dispatch: (action: GameAction) => void;
  onOpenSettings: () => void;
}

export default function Header({ state, dispatch, onOpenSettings }: Props) {
  const w = state.wave;
  const phaseLabel =
    w.phase === 'prep' ? 'ПІДГОТОВКА' :
    w.phase === 'attack' ? 'АТАКА' :
    w.phase === 'aid' ? 'ДОПОМОГА' : 'РЕМОНТ';
  const phaseColor =
    w.phase === 'attack' ? 'var(--status-red)' :
    w.phase === 'aid' ? '#2f81f7' :
    w.phase === 'repair' ? 'var(--status-yellow)' : 'var(--status-green)';

  const destroyed = state.buildings.filter(b => b.status === 'destroyed').length;
  const damaged = state.buildings.filter(b => b.status === 'damaged').length;

  return (
    <header className="header">
      <div className="logo">ДТЕК SIMULATOR</div>
      <div className="header-stats">
        <div className="stat-pill">
          <span className="stat-label">ДЕНЬ</span>
          <span className="stat-value cyan">{state.day}/30</span>
        </div>
        <div className="stat-pill">
          <span className="stat-label">ХВИЛЯ</span>
          <span className="stat-value" style={{ color: phaseColor }}>{w.num} — {phaseLabel}</span>
        </div>
        <div className="stat-pill">
          <span className="stat-value gold">₴{Math.floor(state.money)}</span>
        </div>
        <div className="stat-pill">
          <span className="stat-value" style={{ color: '#39c5ff' }}>🔵{state.diplomacyPoints}</span>
          <span className="stat-label">Рів.{state.diplomaticTier}</span>
        </div>
        {destroyed > 0 && (
          <div className="stat-pill" style={{ borderColor: 'var(--status-red)' }}>
            <span className="stat-value red">💥{destroyed}</span>
          </div>
        )}
        {damaged > 0 && (
          <div className="stat-pill" style={{ borderColor: 'var(--status-yellow)' }}>
            <span className="stat-value yellow">⚠️{damaged}</span>
          </div>
        )}
        {state.shieldTimer !== null && (
          <div className="stat-pill" style={{ borderColor: '#39c5ff' }}>
            <span className="stat-value" style={{ color: '#39c5ff' }}>🛡️{Math.ceil(state.shieldTimer)}с</span>
          </div>
        )}
        <div className="header-buttons">
          <button className="btn-sm" onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}>
            {state.paused ? '▶' : '⏸'}
          </button>
          <button className="btn-sm" onClick={onOpenSettings}>⚙️</button>
        </div>
      </div>
    </header>
  );
}
