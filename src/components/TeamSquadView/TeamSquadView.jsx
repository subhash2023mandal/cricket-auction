import { useMemo } from 'react';
import { X, Users } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { formatLakh } from '../../utils/auction';
import { teamColors } from '../../data/mockData';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';
import './TeamSquadView.css';

const ROLE_ICONS = { BAT: '🏏', BOWL: '🎯', AR: '⚡', WK: '🧤' };

export default function TeamSquadView({ teamId, onClose }) {
  const { state } = useAuction();
  const team = state.teams.find((t) => t.id === teamId);

  // Sort squad by sold price (highest first) so the captain / top buys sit at
  // the top, mirroring the Top Bids ranking layout.
  const sortedSquad = useMemo(() => {
    if (!team) return [];
    return [...team.squad].sort(
      (a, b) => (b.soldPriceLakh ?? 0) - (a.soldPriceLakh ?? 0),
    );
  }, [team]);

  if (!team) {
    return (
      <section className="team-squad card team-squad--empty">
        <p>Team not found.</p>
        <button className="team-squad__close-btn" onClick={onClose} type="button">
          Back
        </button>
      </section>
    );
  }

  const spentLakh = team.isOrganizer
    ? 0
    : Math.max(0, team.initialPurseLakh - team.purseLakh);
  const accent = teamColors[team.short] || 'var(--accent-green)';

  return (
    <section
      className="team-squad card"
      style={{ '--team-accent': accent }}
    >
      <header className="team-squad__header">
        <div className="team-squad__title-block">
          <div
            className="team-squad__badge"
            style={{ background: accent }}
          >
            {team.short}
          </div>
          <div>
            <h2 className="team-squad__name">{team.name}</h2>
            <div className="team-squad__sub">
              <span className="team-squad__sub-item">
                <Users size={12} />
                {team.squad.length}
                {team.maxSquad ? ` / ${team.maxSquad}` : ''} players
              </span>
              {!team.isOrganizer && (
                <>
                  <span className="team-squad__sub-dot">•</span>
                  <span className="team-squad__sub-item">
                    Spent ₹{formatLakh(spentLakh)}
                  </span>
                  <span className="team-squad__sub-dot">•</span>
                  <span className="team-squad__sub-item">
                    Purse ₹{formatLakh(team.purseLakh)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="team-squad__close"
          onClick={onClose}
          aria-label="Close team view"
        >
          <X size={18} />
        </button>
      </header>

      {sortedSquad.length === 0 ? (
        <div className="team-squad__empty">
          {team.isOrganizer
            ? 'No unsold players yet.'
            : 'No players bought yet.'}
        </div>
      ) : (
        <ol className="team-squad__list">
          {sortedSquad.map((p, idx) => (
            <li key={p.id} className="team-squad__item">
              <span className="team-squad__rank">{idx + 1}</span>

              <PlayerAvatar player={p} className="team-squad__avatar" />

              <div className="team-squad__meta">
                <div className="team-squad__player-name" title={p.name}>
                  {p.name}
                </div>
                <div className="team-squad__player-sub">
                  <span className="team-squad__role">
                    <span className="team-squad__role-icon">
                      {ROLE_ICONS[p.role] ?? '🏏'}
                    </span>
                    {p.role}
                  </span>
                  <span className="team-squad__base">
                    Base ₹{formatLakh(p.basePriceLakh)}
                  </span>
                </div>
              </div>

              <div
                className={`team-squad__amount ${
                  team.isOrganizer ? 'team-squad__amount--unsold' : ''
                }`}
              >
                {team.isOrganizer ? 'UNSOLD' : `₹${formatLakh(p.soldPriceLakh)}`}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
