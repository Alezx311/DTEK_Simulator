import { useMemo } from 'react';
import { calcRepairCost, calcTotalRepairCost } from '../game/economy';
import type { GameState, GameAction } from '../types';

interface Props {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

export default function RepairModal({ state, dispatch }: Props) {
  if (state.wave.phase !== 'repair') return null;

  const destroyed = state.buildings.filter(b => b.status === 'destroyed');
  const totalCost = calcTotalRepairCost(state.buildings);
  const autoBudget = Math.floor(state.money * 0.5);

  const byGroup = useMemo(() => {
    const map: Record<string, typeof destroyed> = {};
    destroyed.forEach(b => {
      if (!map[b.group]) map[b.group] = [];
      map[b.group].push(b);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [destroyed]);

  return (
    <div className="repair-modal-overlay">
      <div className="repair-modal">
        <div className="aid-modal-header">
          <h2>🔧 ФАЗА РЕМОНТУ</h2>
          <div className="aid-modal-subtitle">
            Доступно: <span style={{ color: '#ffd700' }}>₴{Math.floor(state.money)}</span>
            {' • '}
            Знищено: <span style={{ color: 'var(--status-red)' }}>{destroyed.length} буд.</span>
          </div>
        </div>

        {destroyed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--status-green)', fontSize: '1.1em' }}>
            ✅ Всі будинки в порядку!
          </div>
        ) : (
          <>
            <div className="repair-group-list">
              {byGroup.map(([groupId, buildings]) => {
                const groupCost = buildings.reduce((s, b) => s + calcRepairCost(b), 0);
                const canAffordGroup = state.money >= groupCost;
                return (
                  <div key={groupId} className="repair-group">
                    <div className="repair-group-header">
                      <span style={{ color: 'var(--accent-cyan)' }}>{groupId}</span>
                      <span style={{ color: '#ffd700' }}>{groupCost}₴</span>
                    </div>
                    {buildings.slice(0, 3).map(b => (
                      <div key={b.id} className="repair-building-row">
                        <span style={{ flex: 1, fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                          {b.address.split(',')[0]}
                        </span>
                        <span style={{ color: '#ffd700', fontSize: '0.85em', marginRight: 8 }}>{calcRepairCost(b)}₴</span>
                        <button
                          className="action-btn success"
                          style={{ padding: '2px 8px', fontSize: '0.8em' }}
                          onClick={() => dispatch({ type: 'REPAIR_BUILDING', payload: b.id })}
                          disabled={state.money < calcRepairCost(b)}
                        >
                          Ремонт
                        </button>
                      </div>
                    ))}
                    {buildings.length > 3 && (
                      <div style={{ fontSize: '0.8em', color: 'var(--text-muted)', padding: '2px 0' }}>
                        +{buildings.length - 3} ще...
                      </div>
                    )}
                    <button
                      className="action-btn success"
                      style={{ width: '100%', marginTop: 4, fontSize: '0.85em' }}
                      onClick={() => buildings.forEach(b => dispatch({ type: 'REPAIR_BUILDING', payload: b.id }))}
                      disabled={!canAffordGroup}
                    >
                      Ремонт групи ({groupCost}₴)
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="repair-actions">
              <button
                className="action-btn success"
                disabled={state.money < totalCost}
                onClick={() => dispatch({ type: 'REPAIR_ALL' })}
              >
                🔧 Ремонт всіх ({totalCost}₴)
              </button>
              <button
                className="action-btn"
                onClick={() => dispatch({ type: 'AUTO_REPAIR' })}
                disabled={autoBudget === 0}
              >
                🔄 Авто (≤{autoBudget}₴)
              </button>
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="overlay-btn" onClick={() => dispatch({ type: 'CONFIRM_REPAIR' })}>
            Продовжити → День {state.day + 1}
          </button>
        </div>
      </div>
    </div>
  );
}
