import { useReducer, useEffect, useRef, useState, useCallback } from 'react';
import { createInitialState, gameReducer } from './game/state';
import { gameTick } from './game/engine';
import Header from './components/Header';
import MoodPanel from './components/MoodPanel';
import KyivMap from './components/KyivMap';
import WavePanel from './components/WavePanel';
import SubgroupsPanel from './components/SubgroupsPanel';
import GameOverlay from './components/GameOverlay';
import SettingsModal from './components/modals/SettingsModal';
import './App.css';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const reserveTimerRef = useRef(null);

  const wrappedDispatch = useCallback((action) => {
    if (action.type === 'USE_RESERVE') {
      dispatch(action);
      if (reserveTimerRef.current) clearTimeout(reserveTimerRef.current);
      reserveTimerRef.current = setTimeout(() => {
        dispatch({ type: 'RESERVE_END' });
      }, 15000);
    } else {
      dispatch(action);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newState = gameTick(stateRef.current);
      if (newState !== stateRef.current) {
        dispatch({ type: 'TICK', payload: newState });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const overloaded = state.load >= 92 && !state.settings.godMode && !state.gameOver;

  return (
    <div className="game-root">
      <Header state={state} dispatch={wrappedDispatch} onOpenSettings={() => { dispatch({ type: 'SET_PAUSED', payload: true }); setSettingsOpen(true); }} />

      <div className="main-layout">
        <div className="top-section">
          <MoodPanel state={state} />
          <KyivMap state={state} />
          <WavePanel state={state} dispatch={wrappedDispatch} />
        </div>
        <SubgroupsPanel state={state} dispatch={wrappedDispatch} />
      </div>

      {overloaded && (
        <div className="overload-banner active">{'\u26A0\uFE0F'} ПЕРЕВАНТАЖЕННЯ!</div>
      )}

      <GameOverlay state={state} dispatch={wrappedDispatch} />
      <SettingsModal state={state} dispatch={wrappedDispatch} isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
