import { useState, useEffect } from 'react';
import { THREATS } from '../../data/threats';
import { DISTRICTS } from '../../data/districts';

export default function SettingsModal({ state, dispatch, isOpen, onClose }) {
  const [tab, setTab] = useState('game');
  const [devMode, setDevMode] = useState(false);
  const [local, setLocal] = useState({ ...state.settings });

  useEffect(() => {
    function handleKey(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDevMode(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (isOpen) setLocal({ ...state.settings });
  }, [isOpen, state.settings]);

  if (!isOpen) return null;

  function apply() {
    let s = { ...local };
    if (s.difficulty !== 'custom') {
      const presets = { easy: [70, 70, 70], normal: [100, 100, 100], hard: [150, 150, 130] };
      const [af, ed, rt] = presets[s.difficulty] || presets.normal;
      s.attackFreq = af; s.enemyDmg = ed; s.repairTimeMod = rt;
    }
    // Apply UI scale via CSS variable
    const basePx = Math.round(14 * (s.uiScale || 100) / 100);
    document.documentElement.style.setProperty('--base-font', basePx + 'px');
    dispatch({ type: 'UPDATE_SETTINGS', payload: s });
    onClose();
  }

  function debugSpawn() {
    const type = document.getElementById('spawn-type')?.value || 'shahed136';
    const count = parseInt(document.getElementById('spawn-count')?.value) || 3;
    const tmpl = THREATS.find(t => t.id === type) || THREATS[0];
    const newThreats = [];
    for (let i = 0; i < count; i++) {
      const target = DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)];
      newThreats.push({
        id: Date.now() + Math.random() + i,
        ...tmpl,
        targetId: target.id,
        x: -20,
        y: Math.random() * 180,
        tx: target.x,
        ty: target.y,
        progress: 0,
      });
    }
    dispatch({
      type: 'TICK',
      payload: {
        ...state,
        wave: { ...state.wave, threats: [...state.wave.threats, ...newThreats] },
      },
    });
    onClose();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  return (
    <div className="settings-overlay active" onClick={e => { if (e.target.className.includes('settings-overlay')) onClose(); }}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">{'\u2699\uFE0F'} Налаштування</span>
          <button className="settings-close" onClick={onClose}>{'\u2715'}</button>
        </div>

        <div className="settings-tabs">
          <button className={`settings-tab${tab === 'game' ? ' active' : ''}`} onClick={() => setTab('game')}>{'\u{1F3AE}'} Гра</button>
          <button className={`settings-tab${tab === 'graphics' ? ' active' : ''}`} onClick={() => setTab('graphics')}>{'\u{1F5A5}\uFE0F'} Графіка</button>
          {devMode && <button className={`settings-tab debug${tab === 'debug' ? ' active' : ''}`} onClick={() => setTab('debug')}>{'\u{1F527}'} Дебаг</button>}
        </div>

        <div className="settings-content">
          {tab === 'game' && (
            <>
              <div className="settings-section">
                <div className="settings-section-title">Складність</div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Рівень складності</div>
                    <div className="setting-desc">Впливає на частоту атак та шкоду</div>
                  </div>
                  <select className="setting-select" value={local.difficulty} onChange={e => setLocal({ ...local, difficulty: e.target.value })}>
                    <option value="easy">Легка</option>
                    <option value="normal">Нормальна</option>
                    <option value="hard">Важка</option>
                    <option value="custom">Кастом</option>
                  </select>
                </div>
                {local.difficulty === 'custom' && (
                  <div className="custom-difficulty active">
                    {[['attackFreq', 'Частота атак'], ['enemyDmg', 'Шкода ворогів'], ['repairTimeMod', 'Час ремонту']].map(([key, label]) => (
                      <div className="custom-slider-row" key={key}>
                        <span className="setting-label">{label}</span>
                        <div className="setting-control">
                          <input type="range" className="setting-slider" min="50" max="200" value={local[key]} onChange={e => setLocal({ ...local, [key]: parseInt(e.target.value) })} />
                          <span className="slider-value">{local[key]}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Швидкість</div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Швидкість гри</div>
                    <div className="setting-desc">Прискорення ігрового часу</div>
                  </div>
                  <div className="setting-control">
                    <input type="range" className="setting-slider" min="25" max="200" step="25" value={local.gameSpeed} onChange={e => setLocal({ ...local, gameSpeed: parseInt(e.target.value) })} />
                    <span className="slider-value">{(local.gameSpeed / 100).toFixed(2)}x</span>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Автоматизація</div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Автопауза при загрозах</div>
                    <div className="setting-desc">Пауза при початку хвилі</div>
                  </div>
                  <div className={`setting-checkbox${local.autopause ? ' active' : ''}`} onClick={() => setLocal({ ...local, autopause: !local.autopause })} />
                </div>
              </div>
            </>
          )}

          {tab === 'graphics' && (
            <>
              <div className="settings-section">
                <div className="settings-section-title">Інтерфейс</div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Масштаб UI</div>
                    <div className="setting-desc">Розмір всього інтерфейсу</div>
                  </div>
                  <div className="setting-control">
                    <input type="range" className="setting-slider" min="75" max="200" step="5" value={local.uiScale || 100} onChange={e => setLocal({ ...local, uiScale: parseInt(e.target.value) })} />
                    <span className="slider-value">{local.uiScale || 100}%</span>
                  </div>
                </div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Розмір шрифтів</div>
                    <div className="setting-desc">Читабельність тексту</div>
                  </div>
                  <select className="setting-select" value={local.fontSize || 'normal'} onChange={e => setLocal({ ...local, fontSize: e.target.value })}>
                    <option value="small">Маленький</option>
                    <option value="normal">Нормальний</option>
                    <option value="large">Великий</option>
                    <option value="extra">Екстра</option>
                  </select>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Відображення</div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Детальна статистика</div>
                    <div className="setting-desc">Показувати додаткові цифри</div>
                  </div>
                  <div className={`setting-checkbox${local.detailedStats ? ' active' : ''}`} onClick={() => setLocal({ ...local, detailedStats: !local.detailedStats })} />
                </div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Тултіпи підгруп</div>
                    <div className="setting-desc">Інфо при наведенні на групу</div>
                  </div>
                  <div className={`setting-checkbox${local.showTooltips ? ' active' : ''}`} onClick={() => setLocal({ ...local, showTooltips: !local.showTooltips })} />
                </div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Якість графіки</div>
                    <div className="setting-desc">Анімації та ефекти</div>
                  </div>
                  <select className="setting-select" value={local.gfxQuality || 'medium'} onChange={e => setLocal({ ...local, gfxQuality: e.target.value })}>
                    <option value="low">Низька</option>
                    <option value="medium">Середня</option>
                    <option value="high">Висока</option>
                  </select>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Продуктивність</div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">FPS ліміт</div>
                  </div>
                  <div className="setting-control">
                    <input type="range" className="setting-slider" min="30" max="120" step="10" value={local.fpsLimit || 60} onChange={e => setLocal({ ...local, fpsLimit: parseInt(e.target.value) })} />
                    <span className="slider-value">{local.fpsLimit || 60}</span>
                  </div>
                </div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Повноекранний режим</div>
                  </div>
                  <button className="action-btn" onClick={toggleFullscreen}>Увімкнути</button>
                </div>
              </div>
            </>
          )}

          {tab === 'debug' && (
            <>
              <div className="debug-warning">
                <div className="debug-warning-icon">{'\u26A0\uFE0F'}</div>
                <div className="debug-warning-text">Тільки для тестування! Використання чітів вимкне досягнення.</div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Режими</div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Режим Бога</div>
                    <div className="setting-desc">Невразливість до атак і перевантаження</div>
                  </div>
                  <div className={`setting-checkbox${local.godMode ? ' active' : ''}`} onClick={() => setLocal({ ...local, godMode: !local.godMode })} />
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Швидкий спавн ворога</div>
                <div className="setting-row">
                  <select className="setting-select" id="spawn-type" style={{ minWidth: 150 }}>
                    {THREATS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <div className="spawn-controls">
                    <input type="number" className="spawn-input" id="spawn-count" defaultValue={3} min={1} max={50} />
                    <button className="spawn-btn" onClick={debugSpawn}>Спавн</button>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Чіти</div>
                <div className="cheat-buttons">
                  <button className="cheat-btn" onClick={() => { dispatch({ type: 'CHEAT', payload: 'money' }); }}>+10k {'\u20B4'}</button>
                  <button className="cheat-btn" onClick={() => { dispatch({ type: 'CHEAT', payload: 'reputation' }); }}>Max Репутація</button>
                  <button className="cheat-btn" onClick={() => { dispatch({ type: 'CHEAT', payload: 'unlock' }); }}>Unlock All</button>
                  <button className="cheat-btn" onClick={() => { dispatch({ type: 'CHEAT', payload: 'repair' }); }}>Ремонт всього</button>
                  <button className="cheat-btn" onClick={() => { dispatch({ type: 'CHEAT', payload: 'cooldown' }); }}>Скинути нагрів</button>
                  <button className="cheat-btn" onClick={() => { dispatch({ type: 'CHEAT', payload: 'skip' }); onClose(); }}>Пропустити хвилю</button>
                </div>
                <div style={{ marginTop: 14 }}>
                  <button className="cheat-btn danger" onClick={() => { dispatch({ type: 'RESET' }); onClose(); }} style={{ width: '100%' }}>{'\u{1F504}'} Обнулення статів (скидання гри)</button>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Швидкий час</div>
                <div className="setting-row">
                  <div className="setting-label">Прискорення (до 100x)</div>
                  <div className="setting-control">
                    <input type="range" className="setting-slider" min="1" max="100" value={local.timeAccel} onChange={e => setLocal({ ...local, timeAccel: parseInt(e.target.value) })} />
                    <span className="slider-value">{local.timeAccel}x</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="settings-footer">
          <button className="settings-btn cancel" onClick={onClose}>Скасувати</button>
          <button className="settings-btn apply" onClick={apply}>{'\u2713'} Застосувати</button>
        </div>
      </div>
    </div>
  );
}
