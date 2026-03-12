import { useMemo } from 'react';
import { groupColors } from '../data/mapData';
import { calcRepairCost } from '../game/economy';
import type { GameState, GameAction } from '../types';

interface Props {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

export default function SubgroupsPanel({ state, dispatch }: Props) {
  const groups = useMemo(() => {
    const map: Record<string, { id: string; on: number; damaged: number; destroyed: number; totalIncome: number; addresses: Set<string> }> = {};
    state.buildings.forEach(b => {
      if (!map[b.group]) map[b.group] = { id: b.group, on: 0, damaged: 0, destroyed: 0, totalIncome: 0, addresses: new Set() };
      const g = map[b.group];
      if (b.status === 'on') g.on++;
      else if (b.status === 'damaged') g.damaged++;
      else g.destroyed++;
      g.totalIncome += b.incomeRate;
      g.addresses.add(b.address.split(',')[0]);
    });
    return Object.values(map).sort((a, b) => a.id.localeCompare(b.id));
  }, [state.buildings]);

  const totalBuildings = state.buildings.length;
  const onBuildings = state.buildings.filter(b => b.status === 'on').length;
  const destroyedBuildings = state.buildings.filter(b => b.status === 'destroyed').length;
  const isRepairPhase = state.wave.phase === 'repair';
  const totalRepairCost = state.buildings.filter(b => b.status === 'destroyed').reduce((s, b) => s + calcRepairCost(b), 0);

  return (
    <div className="bottom-section">
      <div className="controls-header">
        <div className="controls-header-left">
          <span>⚡ ГРУПИ</span>
          <span style={{ color: 'var(--accent-cyan)' }}>{onBuildings}/{totalBuildings} буд.</span>
          {destroyedBuildings > 0 && (
            <span style={{ color: 'var(--status-red)' }}>💥 {destroyedBuildings} знищено</span>
          )}
        </div>
        {isRepairPhase && (
          <div className="controls-header-actions">
            <button
              className="action-btn success"
              onClick={() => dispatch({ type: 'REPAIR_ALL' })}
              disabled={state.money < totalRepairCost || destroyedBuildings === 0}
            >
              🔧 Ремонт всіх ({totalRepairCost}₴)
            </button>
            <button
              className="action-btn"
              onClick={() => dispatch({ type: 'AUTO_REPAIR' })}
              disabled={destroyedBuildings === 0}
            >
              🔄 Авто (≤50%)
            </button>
          </div>
        )}
      </div>
      <div className="subgroups-container">
        <div className="subgroups-grid">
          {groups.map(g => {
            const hasDmg = g.damaged > 0;
            const hasDest = g.destroyed > 0;
            const total = g.on + g.damaged + g.destroyed;

            let cls = 'subgroup-btn';
            if (hasDest) cls += ' damaged';
            else if (hasDmg) cls += ' off';

            const color = groupColors[g.id] || '#3fb950';
            const streets = [...g.addresses].slice(0, 2).join(', ');
            const groupRepairCost = isRepairPhase
              ? state.buildings.filter(b => b.group === g.id && b.status === 'destroyed').reduce((s, b) => s + calcRepairCost(b), 0)
              : 0;

            function handleClick() {
              if (isRepairPhase && hasDest) {
                state.buildings
                  .filter(b => b.group === g.id && b.status === 'destroyed')
                  .forEach(b => dispatch({ type: 'REPAIR_BUILDING', payload: b.id }));
              }
            }

            return (
              <button
                className={cls}
                key={g.id}
                onClick={handleClick}
                style={{ borderColor: (!hasDmg && !hasDest) ? color : undefined }}
                title={isRepairPhase && hasDest ? `Ремонт ${g.id} (${groupRepairCost}₴)` : g.id}
              >
                <span className="subgroup-id">{g.id}</span>
                <span className="subgroup-power">{total} буд • {g.totalIncome}₴/с</span>
                <span className="subgroup-streets">{streets}</span>
                {hasDest && <span className="subgroup-status">💥</span>}
                {!hasDest && hasDmg && <span className="subgroup-status">⚠️</span>}
                <div className="fatigue-bar">
                  <div
                    className={`fatigue-fill ${hasDest ? 'critical' : hasDmg ? 'warn' : 'ok'}`}
                    style={{ width: `${total > 0 ? (g.on / total) * 100 : 0}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
