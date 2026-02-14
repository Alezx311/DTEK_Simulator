export default function MoodPanel({ state }) {
  const moodData = [
    { key: 'residents', label: '\u{1F465} Мешканці', val: state.mood.residents },
    { key: 'business', label: '\u{1F3E2} Бізнес', val: state.mood.business },
    { key: 'critical', label: '\u{1F3E5} Критична інфра', val: state.mood.critical },
  ];

  const longOff = state.subgroups
    .filter(s => s.status === 'off' && s.offTime > 30)
    .sort((a, b) => b.offTime - a.offTime)
    .slice(0, 5);

  return (
    <div className="panel left-panel">
      <div className="panel-header">{'\u{1F4CA}'} НАСТРОЇ</div>
      <div className="panel-content">
        {moodData.map(m => {
          const cls = m.val >= 70 ? 'happy' : m.val >= 50 ? 'neutral' : m.val >= 30 ? 'angry' : 'furious';
          const emoji = m.val >= 70 ? '\u{1F60A}' : m.val >= 50 ? '\u{1F610}' : m.val >= 30 ? '\u{1F620}' : '\u{1F621}';
          const txt = m.val >= 70 ? 'Задоволені' : m.val >= 50 ? 'Нейтрально' : m.val >= 30 ? 'Незадоволені' : 'Протести!';
          return (
            <div className="mood-section" key={m.key}>
              <div className="mood-title">{m.label}</div>
              <div className="mood-bar-container">
                <div className={`mood-bar ${cls}`} style={{ width: `${m.val}%` }} />
              </div>
              <div className="mood-value">
                <span>{emoji} {txt}</span>
                <span>{Math.round(m.val)}%</span>
              </div>
            </div>
          );
        })}

        <div className="outage-list">
          <div className="outage-title">{'\u23F1'} Довгі відключення:</div>
          {longOff.length === 0 ? (
            <div className="outage-item ok">{'\u2713'} Немає</div>
          ) : (
            longOff.map(s => {
              const min = Math.floor(s.offTime / 60);
              const sec = s.offTime % 60;
              const cls = s.offTime > 90 ? 'danger' : 'warn';
              const emoji = s.offTime > 90 ? '\u{1F621}' : '\u{1F610}';
              return (
                <div className={`outage-item ${cls}`} key={s.id}>
                  <span>{s.districtShort}-{s.num}</span>
                  <span>{emoji} {min}:{String(sec).padStart(2, '0')}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="events-mini">
          <div className="outage-title">{'\u{1F4CB}'} Останні події:</div>
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
