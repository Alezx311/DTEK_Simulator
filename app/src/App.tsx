import { useReducer, useEffect, useRef, useState, useCallback } from 'react';
import { createInitialState, gameReducer } from './game/state';
import { gameTick } from './game/engine';
import Header from './components/Header';
import MoodPanel from './components/MoodPanel';
import LeafletMap from './components/LeafletMap';
import DefensePanel from './components/DefensePanel';
import SubgroupsPanel from './components/SubgroupsPanel';
import AidSelectionModal from './components/AidSelectionModal';
import RepairModal from './components/RepairModal';
import GameOverlay from './components/GameOverlay';
import SettingsModal from './components/modals/SettingsModal';
import type { GameState, GameAction } from './types';
import './App.css';

const TICK_MS = 50; // 20 fps smooth game loop

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const stateRef = useRef<GameState>(state);
  stateRef.current = state;
  const spaceHeldRef = useRef(false);

  const wrappedDispatch = useCallback((action: GameAction) => {
    dispatch(action);
  }, []);

  // Space bar = 5x speed boost while held
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        spaceHeldRef.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Smooth game loop — 50ms ticks (20 fps)
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.wave.phase === 'aid' || s.wave.phase === 'repair') return;
      const dt = TICK_MS / 1000; // 0.05
      const speedBoost = spaceHeldRef.current ? 5 : 1;
      const newState = gameTick(s, dt * speedBoost);
      if (newState !== s) {
        dispatch({ type: 'TICK', payload: newState });
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const isBlackout = state.blackoutTimer !== null;
  const showAid = state.wave.phase === 'aid' && !state.gameOver;
  const showRepair = state.wave.phase === 'repair' && !state.gameOver;

  return (
    <div className="game-root">
      <Header
        state={state}
        dispatch={wrappedDispatch}
        onOpenSettings={() => {
          dispatch({ type: 'SET_PAUSED', payload: true });
          setSettingsOpen(true);
        }}
      />

      <div className="main-layout">
        <div className="top-section">
          <MoodPanel state={state} />
          <LeafletMap state={state} />
          <DefensePanel state={state} dispatch={wrappedDispatch} />
        </div>
        <SubgroupsPanel state={state} dispatch={wrappedDispatch} />
      </div>

      {/* Blackout warning banner */}
      {isBlackout && !state.gameOver && (
        <div className="blackout-warning">
          ⚡ БЛЕКАУТ! Місто залишилося без живлення! {Math.ceil(state.blackoutTimer ?? 0)} секунд до кінця гри!
        </div>
      )}

      {/* Phase modals */}
      {showAid && <AidSelectionModal state={state} dispatch={wrappedDispatch} />}
      {showRepair && <RepairModal state={state} dispatch={wrappedDispatch} />}

      {/* Overlays */}
      <GameOverlay state={state} dispatch={wrappedDispatch} />
      <SettingsModal
        state={state}
        dispatch={wrappedDispatch}
        isOpen={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          dispatch({ type: 'SET_PAUSED', payload: false });
        }}
      />
    </div>
  );
}
