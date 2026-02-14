export default function GameOverlay({ state, dispatch }) {
  if (!state.gameOver) return null;

  const isVictory = state.gameResult === 'victory';

  return (
    <div className="overlay active">
      <div className={`overlay-title ${isVictory ? 'victory' : 'defeat'}`}>
        {isVictory ? '\u{1F3C6} ПЕРЕМОГА!' : '\u26AB БЛЕКАУТ'}
      </div>
      <div className="overlay-stats">
        {isVictory ? (
          <>12 хвиль!<br />День {state.day}<br />{'\u20B4'}{state.money}</>
        ) : (
          <>Хвиль: {state.wave.num - 1}<br />Макс: {state.maxLoad}%<br />{'\u20B4'}{state.money}</>
        )}
      </div>
      <button className="overlay-btn" onClick={() => dispatch({ type: 'RESET' })}>
        {'\u{1F504}'} Знову
      </button>
    </div>
  );
}
