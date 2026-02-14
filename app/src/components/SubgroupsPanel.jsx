import { useState } from 'react';

export default function SubgroupsPanel({ state, dispatch }) {
  const [tooltip, setTooltip] = useState(null);

  const totalPower = state.subgroups.filter(s => s.status === 'on').reduce((a, s) => a + s.power, 0);

  function handleHover(e, s) {
    if (!state.settings.showTooltips) return;
    const rect = e.target.getBoundingClientRect();
    setTooltip({ s, x: rect.left, y: rect.top - 100 });
  }

  return (
    <div className="bottom-section">
      <div className="controls-header">
        <div className="controls-header-left">
          <span>{'\u26A1'} ПІДГРУПИ</span>
          <span style={{ color: 'var(--accent-cyan)' }}>{totalPower} MW</span>
          <div className="legend">
            <div className="legend-item"><div className="legend-dot on" />ON</div>
            <div className="legend-item"><div className="legend-dot off" />OFF</div>
            <div className="legend-item"><div className="legend-dot hot" />HOT</div>
            <div className="legend-item"><div className="legend-dot dmg" />DMG</div>
          </div>
        </div>
        <div className="controls-header-actions">
          <button className="action-btn success" onClick={() => dispatch({ type: 'ENABLE_ALL' })}>{'\u2713'} Все ON</button>
          <button className="action-btn" onClick={() => dispatch({ type: 'USE_RESERVE' })} disabled={!state.hasReserve || state.reserveActive}>{'\u{1F50B}'}+300</button>
          <button className="action-btn danger" onClick={() => dispatch({ type: 'EMERGENCY_OFF' })}>{'\u26A0'}-5</button>
          <button className="action-btn" onClick={() => dispatch({ type: 'ROTATE_GROUPS' })}>{'\u{1F504}'} Ротація</button>
        </div>
      </div>
      <div className="subgroups-container">
        <div className="subgroups-grid">
          {state.subgroups.map(s => {
            let cls = 'subgroup-btn ' + s.status;
            let statusIcon = '';
            if (s.status === 'on' && s.heat >= 70) { cls = 'subgroup-btn overheated'; statusIcon = '\u{1F525}'; }
            if (s.status === 'off' && s.offTime > 90) { cls += ' angry'; statusIcon = '\u{1F621}'; }
            else if (s.status === 'off' && s.offTime > 45) { statusIcon = '\u{1F610}'; }
            const heatPct = Math.min(100, s.heat);
            const heatCls = heatPct >= 70 ? 'critical' : heatPct >= 50 ? 'danger' : heatPct >= 30 ? 'warn' : 'ok';

            return (
              <button
                className={cls}
                key={s.id}
                onClick={() => dispatch({ type: 'TOGGLE_SUBGROUP', payload: s.id })}
                onMouseEnter={e => handleHover(e, s)}
                onMouseLeave={() => setTooltip(null)}
                disabled={s.status === 'damaged'}
              >
                <span className="subgroup-status">{statusIcon}</span>
                <span className="subgroup-id">{s.districtShort}-{s.num}</span>
                <span className="subgroup-power">{s.power}MW</span>
                <div className="fatigue-bar">
                  <div className={`fatigue-fill ${heatCls}`} style={{ width: `${heatPct}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {tooltip && (
        <div className="tooltip active" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="tooltip-title">{tooltip.s.districtName} - Група {tooltip.s.num}</div>
          <div className="tooltip-row"><span className="tooltip-label">Потужність:</span><span>{tooltip.s.power} MW</span></div>
          <div className="tooltip-row"><span className="tooltip-label">Статус:</span><span>{tooltip.s.status === 'on' ? 'ON' : tooltip.s.status === 'off' ? 'OFF' : 'DMG'}</span></div>
          <div className="tooltip-row"><span className="tooltip-label">Нагрів:</span><span>{Math.round(tooltip.s.heat)}%</span></div>
          {tooltip.s.status === 'off' && (
            <div className="tooltip-row"><span className="tooltip-label">Без світла:</span><span>{Math.floor(tooltip.s.offTime / 60)}:{String(tooltip.s.offTime % 60).padStart(2, '0')}</span></div>
          )}
        </div>
      )}
    </div>
  );
}
