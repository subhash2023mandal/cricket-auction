import { useEffect } from 'react';
import { X, Star, Crown } from 'lucide-react';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';
import { formatLakh } from '../../utils/auction';
import { teamColors } from '../../data/mockData';
import './PlayerDetailModal.css';

const ROLE_LABELS = {
  BAT: 'Batter',
  BOWL: 'Bowler',
  AR: 'All-rounder',
  WK: 'Wicket-keeper',
};

const ROLE_ICONS = { BAT: '🏏', BOWL: '🎯', AR: '⚡', WK: '🧤' };

// Player ratings aren't stored explicitly, so we derive a 5-star score from the
// final sold price. Premium picks (₹20 Cr+) get five stars, basement bargains
// drop to one. Keeps the modal visually rich without needing extra data.
function ratingFromSoldPrice(lakh) {
  if (lakh == null) return 1;
  if (lakh >= 2000) return 5;
  if (lakh >= 1200) return 4.5;
  if (lakh >= 700) return 4;
  if (lakh >= 400) return 3.5;
  if (lakh >= 200) return 3;
  if (lakh >= 100) return 2.5;
  if (lakh > 0) return 2;
  return 1;
}

function StarRating({ value }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    let fill = 'empty';
    if (i < full) fill = 'full';
    else if (i === full && hasHalf) fill = 'half';
    stars.push(
      <span key={i} className={`player-detail__star player-detail__star--${fill}`}>
        <Star size={18} strokeWidth={1.5} />
      </span>,
    );
  }
  return (
    <div className="player-detail__rating" aria-label={`Rated ${value} out of 5`}>
      <div className="player-detail__stars">{stars}</div>
      <span className="player-detail__rating-num">{value.toFixed(1)}</span>
    </div>
  );
}

export default function PlayerDetailModal({ player, team, isCaptain, onClose }) {
  // ESC to close.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!player) return null;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const accent = team ? teamColors[team.short] || 'var(--accent-green)' : 'var(--accent-green)';
  const isUnsold = !!team?.isOrganizer;
  const soldLakh = player.soldPriceLakh ?? 0;
  const baseLakh = player.basePriceLakh ?? 0;
  const premiumMultiplier =
    !isUnsold && baseLakh > 0 && soldLakh > 0 ? soldLakh / baseLakh : null;
  const rating = isUnsold ? ratingFromSoldPrice(baseLakh) : ratingFromSoldPrice(soldLakh);

  return (
    <div
      className="player-detail-backdrop"
      onMouseDown={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`${player.name} details`}
    >
      <div
        className="player-detail card"
        style={{ '--team-accent': accent }}
      >
        <button
          type="button"
          className="player-detail__close"
          onClick={onClose}
          aria-label="Close player details"
        >
          <X size={18} />
        </button>

        <div className="player-detail__hero">
          <div className="player-detail__photo-wrap">
            <PlayerAvatar player={player} className="player-detail__photo" />
            <span className="player-detail__role-badge">
              <span aria-hidden="true">{ROLE_ICONS[player.role] ?? '🏏'}</span>
              {player.role}
            </span>
          </div>

          <div className="player-detail__hero-meta">
            {team && (
              <div className="player-detail__team">
                <span
                  className="player-detail__team-badge"
                  style={{ background: accent }}
                >
                  {team.short}
                </span>
                <span className="player-detail__team-name">{team.name}</span>
                {isCaptain && (
                  <span className="player-detail__captain" title="Team captain">
                    <Crown size={12} />
                    Captain
                  </span>
                )}
              </div>
            )}

            <h2 className="player-detail__name">{player.name}</h2>
            <div className="player-detail__role-line">
              {ROLE_LABELS[player.role] ?? player.role}
              {player.country && (
                <>
                  <span className="player-detail__dot">•</span>
                  {player.country}
                </>
              )}
            </div>

            <StarRating value={rating} />
          </div>
        </div>

        {player.funFact && (
          <p className="player-detail__funfact">“{player.funFact}”</p>
        )}

        <dl className="player-detail__stats">
          <div className="player-detail__stat">
            <dt>Base Price</dt>
            <dd>₹{formatLakh(baseLakh)}</dd>
          </div>

          {isUnsold ? (
            <div className="player-detail__stat">
              <dt>Status</dt>
              <dd className="player-detail__unsold">Unsold</dd>
            </div>
          ) : (
            <div className="player-detail__stat">
              <dt>Sold For</dt>
              <dd className="player-detail__sold">₹{formatLakh(soldLakh)}</dd>
            </div>
          )}

          {premiumMultiplier && premiumMultiplier > 1 && (
            <div className="player-detail__stat">
              <dt>Premium</dt>
              <dd>{premiumMultiplier.toFixed(1)}× base</dd>
            </div>
          )}

          {Array.isArray(player.tags) && player.tags.length > 0 && (
            <div className="player-detail__stat player-detail__stat--wide">
              <dt>Tags</dt>
              <dd className="player-detail__tags">
                {player.tags.map((tag) => (
                  <span key={tag} className="player-detail__tag">
                    {tag}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
