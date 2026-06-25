import { Trophy, Users } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { formatLakh } from '../../utils/auction';
import { teamColors } from '../../data/mockData';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';
import './PlayerShowcase.css';

const ROLE_ICONS = { BAT: '🏏', BOWL: '🎯', AR: '⚡', WK: '🧤' };

export default function PlayerShowcase() {
  const { state } = useAuction();
  const { current, teams, pool, soldHistory, round = 1 } = state;

  if (!current) {
    return (
      <section className="showcase card showcase--empty">
        <Trophy size={56} />
        <h1 className="showcase__name">AUCTION COMPLETE</h1>
        <p className="showcase__empty-text">
          All {soldHistory.length} sales recorded across {round} round
          {round > 1 ? 's' : ''}. The remaining pool is empty.
        </p>
      </section>
    );
  }

  const p = current.player;
  const winner = current.highestBidderId
    ? teams.find((t) => t.id === current.highestBidderId)
    : null;

  return (
    <section className="showcase card">
      <header className="showcase__header">
        <div>
          <div className="label">Base Price</div>
          <div className="showcase__base-price">₹{formatLakh(p.basePriceLakh)}</div>
        </div>

        <div className="showcase__timer">
          <Users size={14} />
          <span>
            {round > 1 && <strong>Round {round} · </strong>}
            {pool.length} left in pool
          </span>
        </div>
      </header>

      {p.funFact && (
        <p className="showcase__funfact">“{p.funFact}”</p>
      )}

      <div className="showcase__body">
        <div className="showcase__player-image">
          <div
            className={`showcase__player-image-ring ${
              current.highestBidderId ? 'showcase__player-image-ring--bidding' : ''
            }`}
          >
            <PlayerAvatar player={p} />
          </div>
          <span className="showcase__role-badge">{p.role}</span>
        </div>

        <div className="showcase__info">
          <h1 className="showcase__name">{p.name.toUpperCase()}</h1>

          <hr className="showcase__divider" />

          <ul className="showcase__meta">
            <li className="showcase__meta-row">
              <span className="showcase__meta-pair">
                <span className="showcase__meta-icon">
                  {ROLE_ICONS[p.role] ?? '🏏'}
                </span>
                <span>{p.role}</span>
              </span>
              <span className="showcase__meta-pair">
                <span className="showcase__meta-icon">💰</span>
                <span>₹{formatLakh(p.basePriceLakh)}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <footer className="showcase__footer">
        <div className="showcase__bidder">
          <div
            className="showcase__bidder-badge"
            style={
              winner
                ? { background: teamColors[winner.short] || '#334' }
                : undefined
            }
          >
            <span>{winner ? winner.short : '—'}</span>
          </div>
          <div>
            <div className="label">Highest Bidder</div>
            <div className="showcase__bidder-name">
              {winner ? winner.name : 'No bids yet'}
            </div>
          </div>
        </div>

        <div className="showcase__current-price">
          <div className="label" style={{ color: 'var(--accent-green)' }}>
            Current Price
          </div>
          <div
            key={current.currentPriceLakh}
            className="showcase__current-price-value"
          >
            ₹{formatLakh(current.currentPriceLakh)}
          </div>
        </div>
      </footer>
    </section>
  );
}
