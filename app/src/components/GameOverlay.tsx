import type { GameState, GameAction } from '../types';

interface Props {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

export default function GameOverlay({ state, dispatch }: Props) {
  if (!state.gameOver) return null;

  const isVictory = state.gameResult === 'victory';
  const surviving = state.buildings.filter(b => b.status === 'on').length;
  const total = state.buildings.length;
  const survivalRate = total > 0 ? Math.round((surviving / total) * 100) : 0;
  const stars = survivalRate >= 90 ? 3 : survivalRate >= 70 ? 2 : 1;

  return (
    <div className="overlay active">
      <div className={`overlay-title ${isVictory ? 'victory' : 'defeat'}`}>
        {isVictory ? '🏆 ПЕРЕМОГА!' : '⚫ ПОРАЗКА'}
      </div>
      <div className="overlay-stats">
        {isVictory ? (
          <>
            <div>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
            <div>30 днів вижито!</div>
            <div>Виживання: {survivalRate}% будинків</div>
            <div>Знищено ворогів: {state.wave.enemiesKilled}</div>
            <div>💰 {Math.floor(state.money)}₴ залишилося</div>
            <div>🔵 {state.diplomacyPoints} ДО накопичено</div>
          </>
        ) : (
          <>
            <div>День {state.day} з 30</div>
            <div>Хвиля {state.wave.num}</div>
            <div>Причина: {(state.blackoutTimer !== null && state.blackoutTimer <= 0) ? 'БЛЕКАУТ' : 'Місто знищено'}</div>
            <div>Збито ворогів: {state.wave.enemiesKilled}</div>
            <div>Вижило будинків: {surviving}/{total}</div>
          </>
        )}
      </div>
      <button className="overlay-btn" onClick={() => dispatch({ type: 'RESET' })}>
        🔄 Знову
      </button>
    </div>
  );
}
