import { Trophy, Users } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { formatLakh } from '../../utils/auction';
import { teamColors } from '../../data/mockData';
import './PlayerShowcase.css';

export default function PlayerShowcase() {
  const { state } = useAuction();
  const { current, teams, pool, soldHistory } = state;

  if (!current) {
    return (
      <section className="showcase card showcase--empty">
        <Trophy size={56} />
        <h1 className="showcase__name">AUCTION COMPLETE</h1>
        <p className="showcase__empty-text">
          All {soldHistory.length} sales recorded. The remaining pool is empty.
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
          <span>{pool.length} left in pool</span>
        </div>
      </header>

      <div className="showcase__body">
        <div className="showcase__player-image">
          <div className="showcase__player-image-ring">
            <img src={p.imageUrl} alt={p.name} />
          </div>
          <span className="showcase__role-badge">{p.role}</span>
        </div>

        <div className="showcase__info">
          <div className="showcase__tags">
            {p.tags.map((tag, i) => (
              <span key={tag} className="showcase__tag">
                {tag.toUpperCase()}
                {i < p.tags.length - 1 && (
                  <span className="showcase__tag-sep">|</span>
                )}
              </span>
            ))}
          </div>

          <h1 className="showcase__name">
            {p.name.split(' ').map((n, i) => (
              <span key={i}>
                {n.toUpperCase()}
                <br />
              </span>
            ))}
          </h1>

          <dl className="showcase__stats">
            <div>
              <dt className="label">Role</dt>
              <dd>{p.role}</dd>
            </div>
            <div>
              <dt className="label">Country</dt>
              <dd>{p.country}</dd>
            </div>
            <div>
              <dt className="label">Base</dt>
              <dd>₹{formatLakh(p.basePriceLakh)}</dd>
            </div>
          </dl>
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
          <div className="showcase__current-price-value">
            ₹{formatLakh(current.currentPriceLakh)}
          </div>
        </div>
      </footer>
    </section>
  );
}
