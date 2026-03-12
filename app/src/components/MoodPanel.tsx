import type { GameState } from '../types';

interface Props {
  state: GameState;
}

export default function MoodPanel({ state }: Props) {
  const buildings = state.buildings;
  const total = buildings.length;
  const onCount = buildings.filter(b => b.status === 'on').length;
  const damagedCount = buildings.filter(b => b.status === 'damaged').length;
  const destroyedCount = buildings.filter(b => b.status === 'destroyed').length;

  const cityHealth = total > 0 ? Math.round((onCount / total) * 100) : 0;
  const cls = cityHealth >= 70 ? 'happy' : cityHealth >= 50 ? 'neutral' : cityHealth >= 30 ? 'angry' : 'furious';
  const emoji = cityHealth >= 70 ? '😊' : cityHealth >= 50 ? '😐' : cityHealth >= 30 ? '😠' : '😡';
  const label = cityHealth >= 70 ? 'Добре' : cityHealth >= 50 ? 'Нормально' : cityHealth >= 30 ? 'Погано' : 'Критично';

  return (
    <div className="panel left-panel">
      <div className="panel-header">📊 СТАН МІСТА</div>
      <div className="panel-content">
        <div className="mood-section">
          <div className="mood-title">🏙️ Стан міста</div>
          <div className="mood-bar-container">
            <div className={`mood-bar ${cls}`} style={{ width: `${cityHealth}%` }} />
          </div>
          <div className="mood-value">
            <span>{emoji} {label}</span>
            <span>{cityHealth}%</span>
          </div>
        </div>

        <div className="outage-list">
          <div className="outage-title">🏠 Будинки:</div>
          <div className="outage-item ok">✅ Активні: {onCount}</div>
          {damagedCount > 0 && <div className="outage-item warn">⚠️ Пошкоджені: {damagedCount}</div>}
          {destroyedCount > 0 && <div className="outage-item danger">💥 Знищені: {destroyedCount}</div>}
        </div>

        <div className="outage-list">
          <div className="outage-title">⚔️ Ця хвиля:</div>
          <div className="outage-item ok">🎯 Збито: {state.wave.enemiesKilled}</div>
          <div className={`outage-item ${state.wave.buildingsHitThisWave > 0 ? 'danger' : 'ok'}`}>
            {state.wave.buildingsHitThisWave > 0 ? '💥' : '✅'} Влучань: {state.wave.buildingsHitThisWave}
          </div>
        </div>

        <div className="events-mini">
          <div className="outage-title">📋 Події:</div>
          {state.events.map(ev => (
            <div className={`event-item ${ev.type}`} key={ev.id}>
              <span className="event-time">{ev.time}</span>{' '}
              <span className="event-text">{ev.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
