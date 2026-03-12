import type { GameState, GameAction, AidCard } from '../types';

interface Props {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#3fb950',
  rare: '#2f81f7',
  epic: '#a371f7',
  legendary: '#ffd700',
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Звичайна',
  rare: 'Рідкісна',
  epic: 'Епічна',
  legendary: 'Легендарна',
};

function AidCardView({ card, onSelect }: { card: AidCard; onSelect: () => void }) {
  const color = RARITY_COLORS[card.rarity] || '#3fb950';
  return (
    <div className={`aid-card ${card.rarity}`} onClick={onSelect} style={{ borderColor: color }}>
      <div className="aid-card-rarity" style={{ color }}>{RARITY_LABELS[card.rarity]}</div>
      <div className="aid-card-icon">{card.icon}</div>
      <div className="aid-card-name">{card.name}</div>
      <div className="aid-card-desc">{card.description}</div>
      <button className="aid-card-btn" style={{ background: color }}>ОБРАТИ</button>
    </div>
  );
}

export default function AidSelectionModal({ state, dispatch }: Props) {
  if (state.wave.phase !== 'aid' || state.pendingAidCards.length === 0) return null;

  const { wave, pendingAidCards } = state;
  const cleanWave = wave.buildingsHitThisWave === 0;

  return (
    <div className="aid-modal-overlay">
      <div className="aid-modal">
        <div className="aid-modal-header">
          <h2>🌍 ІНОЗЕМНА ДОПОМОГА</h2>
          <div className="aid-modal-subtitle">
            Хвиля {wave.num - 1} відбита! Збито: {wave.enemiesKilled} ворогів.
            {cleanWave && <span style={{ color: 'var(--status-green)' }}> Чиста хвиля! +5🔵</span>}
          </div>
          <div className="aid-modal-subtitle">
            Дипломатичний рівень: {state.diplomaticTier} • ДО: {state.diplomacyPoints}🔵
          </div>
        </div>

        <div className="aid-modal-subtitle" style={{ textAlign: 'center', marginBottom: 12 }}>
          Оберіть одну пропозицію допомоги:
        </div>

        <div className="aid-cards-row">
          {pendingAidCards.map(card => (
            <AidCardView
              key={card.id}
              card={card}
              onSelect={() => dispatch({ type: 'SELECT_AID_CARD', payload: card.effectKey })}
            />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            className="overlay-btn"
            style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            onClick={() => dispatch({ type: 'SKIP_AID' })}
          >
            Відмовитися від допомоги
          </button>
        </div>
      </div>
    </div>
  );
}
