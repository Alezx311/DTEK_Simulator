import { useMemo } from 'react';
import { groupColors } from '../data/mapData';

export default function SubgroupsPanel({ state, dispatch }) {
  const groups = useMemo(() => {
    const map = {};
    state.buildings.forEach(b => {
      if (!map[b.group]) {
        map[b.group] = { id: b.group, on: 0, off: 0, damaged: 0, totalPower: 0, onPower: 0, addresses: new Set() };
      }
      const g = map[b.group];
      g[b.status === 'on' ? 'on' : b.status === 'off' ? 'off' : 'damaged']++;
      g.totalPower += b.power;
      if (b.status === 'on') g.onPower += b.power;
      g.addresses.add(b.address.split(',')[0]);
    });
    return Object.values(map).sort((a, b) => a.id.localeCompare(b.id));
  }, [state.buildings]);

  const totalOnPower = groups.reduce((a, g) => a + g.onPower, 0);
  const totalBuildings = state.buildings.length;
  const onBuildings = state.buildings.filter(b => b.status === 'on').length;
  const damagedBuildings = state.buildings.filter(b => b.status === 'damaged').length;

  return (
    <div className="bottom-section">
      <div className="controls-header">
        <div className="controls-header-left">
          <span>{'\u26A1'} ГРУПИ</span>
          <span style={{ color: 'var(--accent-cyan)' }}>{totalOnPower} кВт</span>
          <span style={{ color: 'var(--text-muted)' }}>{onBuildings}/{totalBuildings} буд.</span>
          {damagedBuildings > 0 && (
            <span style={{ color: 'var(--status-red)' }}>{damagedBuildings} пошк.</span>
          )}
        </div>
        <div className="controls-header-actions">
          <button className="action-btn success" onClick={() => dispatch({ type: 'ENABLE_ALL' })}>{'\u2713'} Все ON</button>
          <button className="action-btn" onClick={() => dispatch({ type: 'USE_RESERVE' })} disabled={!state.hasReserve || state.reserveActive}>{'\u{1F50B}'}+300</button>
          <button className="action-btn danger" onClick={() => dispatch({ type: 'EMERGENCY_OFF' })}>{'\u26A0'} Скинути 20%</button>
          <button className="action-btn" onClick={() => dispatch({ type: 'ROTATE_GROUPS' })}>{'\u{1F504}'} Ротація</button>
        </div>
      </div>
      <div className="subgroups-container">
        <div className="subgroups-grid">
          {groups.map(g => {
            const hasDmg = g.damaged > 0;
            const allOn = g.on > 0 && g.off === 0 && g.damaged === 0;
            const allOff = g.off > 0 && g.on === 0;
            let cls = 'subgroup-btn';
            if (hasDmg) cls += ' damaged';
            else if (allOff) cls += ' off';

            const color = groupColors[g.id] || '#3fb950';
            const streets = [...g.addresses].slice(0, 2).join(', ');
            const total = g.on + g.off + g.damaged;

            return (
              <button
                className={cls}
                key={g.id}
                onClick={() => dispatch({ type: 'TOGGLE_GROUP', payload: g.id })}
                style={{ borderColor: allOn ? color : undefined }}
              >
                <span className="subgroup-id">{g.id}</span>
                <span className="subgroup-power">{total} буд {'\u2022'} {g.totalPower} кВт</span>
                <span className="subgroup-streets">{streets}</span>
                {hasDmg && <span className="subgroup-status">{'\u{1F4A5}'}</span>}
                {allOff && <span className="subgroup-status">{'\u{1F319}'}</span>}
                <div className="fatigue-bar">
                  <div
                    className={`fatigue-fill ${hasDmg ? 'critical' : allOn ? 'ok' : 'warn'}`}
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
