import { useState, useEffect } from 'react';
import { THREATS } from '../../data/threats';
import type { GameState, GameAction } from '../../types';

interface Props {
  state: GameState;
  dispatch: (action: GameAction) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ state, dispatch, isOpen, onClose }: Props) {
  const [tab, setTab] = useState<'game' | 'graphics' | 'debug'>('game');
  const [devMode, setDevMode] = useState(false);
  const [local, setLocal] = useState({ ...state.settings });

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') setDevMode(prev => !prev);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (isOpen) setLocal({ ...state.settings });
  }, [isOpen, state.settings]);

  if (!isOpen) return null;

  function apply() {
    const basePx = Math.round(14 * (local.uiScale || 100) / 100);
    document.documentElement.style.setProperty('--base-font', basePx + 'px');
    dispatch({ type: 'UPDATE_SETTINGS', payload: local });
    onClose();
  }

  function debugSpawnThreat() {
    const typeEl = document.getElementById('spawn-type') as HTMLSelectElement | null;
    const countEl = document.getElementById('spawn-count') as HTMLInputElement | null;
    const typeId = typeEl?.value || 'shahed136';
    const count = parseInt(countEl?.value || '3');
    const tmpl = THREATS.find(t => t.id === typeId) ?? THREATS[0];

    const newThreats = Array.from({ length: count }, (_, i) => {
      const target = state.buildings[Math.floor(Math.random() * state.buildings.length)];
      return {
        instanceId: `debug_${Date.now()}_${i}`,
        templateId: tmpl.id,
        name: tmpl.name,
        icon: tmpl.icon,
        type: tmpl.type,
        speed: tmpl.speed,
        currentHealth: tmpl.health,
        maxHealth: tmpl.health,
        blastRadius: tmpl.blastRadius,
        dmg: tmpl.dmg,
        hitChanceMod: tmpl.hitChanceMod,
        targetId: target.id,
        targetLat: target.lat,
        targetLng: target.lng,
        startLat: 50.495,
        startLng: 30.318 + Math.random() * 0.074,
        launchCity: 'Дебаг',
        startX: Math.random(),
        progress: 0,
        hitFlash: 0,
        rebSlowed: false,
      } as const;
    });

    dispatch({
      type: 'TICK',
      payload: {
        ...state,
        wave: { ...state.wave, phase: 'attack', threats: [...state.wave.threats, ...newThreats] },
      },
    });
    onClose();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }

  return (
    <div className="settings-overlay active" onClick={e => { if ((e.target as HTMLElement).classList.contains('settings-overlay')) onClose(); }}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">⚙️ Налаштування</span>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-tabs">
          <button className={`settings-tab${tab === 'game' ? ' active' : ''}`} onClick={() => setTab('game')}>🎮 Гра</button>
          <button className={`settings-tab${tab === 'graphics' ? ' active' : ''}`} onClick={() => setTab('graphics')}>🖥️ Графіка</button>
          {devMode && <button className={`settings-tab debug${tab === 'debug' ? ' active' : ''}`} onClick={() => setTab('debug')}>🔧 Дебаг</button>}
        </div>

        <div className="settings-content">
          {tab === 'game' && (
            <>
              <div className="settings-section">
                <div className="settings-section-title">Швидкість гри</div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Швидкість</div>
                    <div className="setting-desc">Прискорення ігрового часу</div>
                  </div>
                  <div className="setting-control">
                    <input type="range" className="setting-slider" min="25" max="200" step="25"
                      value={local.gameSpeed}
                      onChange={e => setLocal({ ...local, gameSpeed: parseInt(e.target.value) })} />
                    <span className="slider-value">{(local.gameSpeed / 100).toFixed(2)}x</span>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Автоматизація</div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Автопауза при атаці</div>
                    <div className="setting-desc">Пауза на початку хвилі</div>
                  </div>
                  <div
                    className={`setting-checkbox${local.autopause ? ' active' : ''}`}
                    onClick={() => setLocal({ ...local, autopause: !local.autopause })}
                  />
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
                  </div>
                  <div className="setting-control">
                    <input type="range" className="setting-slider" min="75" max="150" step="5"
                      value={local.uiScale || 100}
                      onChange={e => setLocal({ ...local, uiScale: parseInt(e.target.value) })} />
                    <span className="slider-value">{local.uiScale || 100}%</span>
                  </div>
                </div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Розмір шрифту</div>
                  </div>
                  <select className="setting-select" value={local.fontSize || 'normal'}
                    onChange={e => setLocal({ ...local, fontSize: e.target.value })}>
                    <option value="small">Маленький</option>
                    <option value="normal">Нормальний</option>
                    <option value="large">Великий</option>
                  </select>
                </div>
                <div className="setting-row">
                  <div><div className="setting-label">Повноекранний</div></div>
                  <button className="action-btn" onClick={toggleFullscreen}>Увімкнути</button>
                </div>
              </div>
            </>
          )}

          {tab === 'debug' && (
            <>
              <div className="debug-warning">
                <div className="debug-warning-icon">⚠️</div>
                <div className="debug-warning-text">Режим розробника</div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Режим Бога</div>
                <div className="setting-row">
                  <div><div className="setting-label">Невразливість до атак</div></div>
                  <div
                    className={`setting-checkbox${local.godMode ? ' active' : ''}`}
                    onClick={() => setLocal({ ...local, godMode: !local.godMode })}
                  />
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Спавн ворогів</div>
                <div className="setting-row">
                  <select className="setting-select" id="spawn-type" style={{ minWidth: 150 }}>
                    {THREATS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <div className="spawn-controls">
                    <input type="number" className="spawn-input" id="spawn-count" defaultValue={3} min={1} max={20} />
                    <button className="spawn-btn" onClick={debugSpawnThreat}>Спавн</button>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Чіти</div>
                <div className="cheat-buttons">
                  <button className="cheat-btn" onClick={() => dispatch({ type: 'CHEAT', payload: 'money' })}>+10k ₴</button>
                  <button className="cheat-btn" onClick={() => dispatch({ type: 'CHEAT', payload: 'dp' })}>+100 ДО</button>
                  <button className="cheat-btn" onClick={() => dispatch({ type: 'CHEAT', payload: 'repair' })}>Ремонт всього</button>
                  <button className="cheat-btn" onClick={() => dispatch({ type: 'CHEAT', payload: 'shield' })}>Щит 60с</button>
                  <button className="cheat-btn" onClick={() => { dispatch({ type: 'CHEAT', payload: 'skip' }); onClose(); }}>Пропустити хвилю</button>
                  <button className="cheat-btn" onClick={() => dispatch({ type: 'CHEAT', payload: 'add_weapon' })}>+ Зброя</button>
                </div>
                <div style={{ marginTop: 14 }}>
                  <button className="cheat-btn danger" style={{ width: '100%' }}
                    onClick={() => { dispatch({ type: 'RESET' }); onClose(); }}>
                    🔄 Скинути гру
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Прискорення часу</div>
                <div className="setting-row">
                  <div className="setting-label">Множник (для тестів)</div>
                  <div className="setting-control">
                    <input type="range" className="setting-slider" min="1" max="10"
                      value={local.timeAccel}
                      onChange={e => setLocal({ ...local, timeAccel: parseInt(e.target.value) })} />
                    <span className="slider-value">{local.timeAccel}x</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="settings-footer">
          <button className="settings-btn cancel" onClick={onClose}>Скасувати</button>
          <button className="settings-btn apply" onClick={apply}>✓ Застосувати</button>
        </div>
      </div>
    </div>
  );
}
