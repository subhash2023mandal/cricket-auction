import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { formatLakh } from '../../utils/auction';
import { teamColors } from '../../data/mockData';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';

export default function TeamsDropdown({ onClose }) {
  const { state } = useAuction();
  const panelRef = useRef(null);

  // ESC closes the dropdown.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="teams-dropdown card" ref={panelRef} role="dialog" aria-label="Team rosters">
      <div className="teams-dropdown__head">
        <div>
          <div className="label">Squads</div>
          <div className="teams-dropdown__title">Team Rosters</div>
        </div>
        <button
          className="teams-dropdown__close"
          onClick={onClose}
          aria-label="Close team rosters"
        >
          <X size={16} />
        </button>
      </div>

      <div className="teams-dropdown__grid">
        {state.teams.map((team) => (
          <TeamRosterCard key={team.id} team={team} />
        ))}
      </div>
    </div>
  );
}

function TeamRosterCard({ team }) {
  const isOrg = team.isOrganizer;
  const totalSpentLakh = isOrg ? 0 : team.initialPurseLakh - team.purseLakh;

  return (
    <div className={`team-roster ${isOrg ? 'team-roster--organizer' : ''}`}>
      <div className="team-roster__head">
        <span
          className="team-roster__short"
          style={{ background: teamColors[team.short] || '#334' }}
        >
          {team.short}
        </span>
        <div className="team-roster__head-meta">
          <div className="team-roster__name">{team.name}</div>
          <div className="team-roster__meta">
            {isOrg
              ? `${team.squad.length} unsold`
              : `₹${formatLakh(team.purseLakh)} left · Spent ₹${formatLakh(totalSpentLakh)} · ${team.squad.length}/${team.maxSquad}`}
          </div>
        </div>
      </div>

      {team.squad.length === 0 ? (
        <div className="team-roster__empty">
          {isOrg ? 'No unsold players yet' : 'No players bought yet'}
        </div>
      ) : (
        <ul className="team-roster__players">
          {team.squad.map((p) => (
            <li key={p.id} className="team-roster__player">
              <PlayerAvatar player={p} />
              <div className="team-roster__player-info">
                <span className="team-roster__player-name" title={p.name}>
                  {p.name}
                </span>
                <span className="team-roster__player-role">{p.role}</span>
              </div>
              {!isOrg && (
                <span className="team-roster__player-price">
                  ₹{formatLakh(p.soldPriceLakh)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
