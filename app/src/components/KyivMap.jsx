import { DISTRICTS } from '../data/districts';

export default function KyivMap({ state }) {
  const shahedCount = state.wave.threats.filter(t => t.type === 'shahed').length;
  const rocketCount = state.wave.threats.filter(t => t.type === 'rocket').length;
  const ballCount = state.wave.threats.filter(t => t.type === 'ballistic' || t.type === 'boss').length;

  return (
    <div className="panel map-section">
      <div className="map-header">
        <span>{'\u{1F5FA}\uFE0F'} КИЇВ</span>
        <div className="threats-display">
          <span className="threat-counter shahed">{'\u{1F6E9}\uFE0F'}{shahedCount}</span>
          <span className="threat-counter rocket">{'\u{1F680}'}{rocketCount}</span>
          <span className="threat-counter ballistic">{'\u2604\uFE0F'}{ballCount}</span>
        </div>
      </div>
      <svg className="kyiv-map" viewBox="0 0 500 180">
        <path d="M300,0 Q320,60 310,90 Q300,130 320,180" stroke="var(--accent-cyan)" strokeWidth="8" fill="none" opacity="0.1" />
        <g>
          {DISTRICTS.map(d => {
            const subs = state.subgroups.filter(s => s.districtId === d.id);
            const hasDmg = subs.some(s => s.status === 'damaged');
            const hasOff = subs.some(s => s.status === 'off');
            const curPower = subs.filter(s => s.status === 'on').reduce((a, s) => a + s.power, 0);
            let cls = 'district-shape';
            if (hasDmg) cls += ' danger';
            else if (hasOff) cls += ' warning';
            const size = 22 + d.power / 15;
            const path = `M${d.x},${d.y - size / 2} L${d.x + size / 2},${d.y} L${d.x},${d.y + size / 2} L${d.x - size / 2},${d.y} Z`;
            return (
              <g key={d.id}>
                <path d={path} className={cls} />
                <text x={d.x} y={d.y - 1} className="district-label">{d.short}</text>
                <text x={d.x} y={d.y + 8} className="district-power">{curPower}</text>
              </g>
            );
          })}
        </g>
        <g>
          {state.wave.threats.map(t => {
            const cx = t.x + (t.tx - t.x) * t.progress;
            const cy = t.y + (t.ty - t.y) * t.progress;
            return (
              <g key={t.id}>
                <line x1={cx} y1={cy} x2={t.tx} y2={t.ty} className={`attack-path ${t.type}`} />
                <text x={cx} y={cy} fontSize="14" textAnchor="middle">{t.icon}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
