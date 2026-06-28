import { formatLakh } from '../../utils/auction';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';

export default function TeamWallet({ team, isSelected = false, onSelect }) {
  const fillPercent = team.isOrganizer
    ? Math.round((team.squad.length / Math.max(team.maxSquad, 1)) * 100)
    : Math.round((team.purseLakh / Math.max(team.initialPurseLakh, 1)) * 100);

  const purseLabel = team.isOrganizer ? '—' : `₹${formatLakh(team.purseLakh)}`;
  const hasPlayers = team.squad.length > 0;

  const classes = [
    'team-wallet',
    team.isOrganizer ? 'team-wallet--organizer' : '',
    isSelected ? 'team-wallet--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <button
        type="button"
        className="team-wallet__row team-wallet__row--button"
        onClick={onSelect}
        aria-pressed={isSelected}
      >
        <span className="team-wallet__name">{team.name}</span>
        <span className="team-wallet__purse">{purseLabel}</span>
      </button>

      <div className="team-wallet__bar">
        <div
          className="team-wallet__bar-fill"
          style={{ width: `${Math.min(100, Math.max(0, fillPercent))}%` }}
        />
      </div>

      <div className="team-wallet__row team-wallet__meta">
        <span>
          {team.isOrganizer ? 'Unsold' : 'Squad'}: {team.squad.length}/
          {team.maxSquad}
        </span>
        {!team.isOrganizer && (
          <span>Spent: ₹{formatLakh(team.initialPurseLakh - team.purseLakh)}</span>
        )}
      </div>

      <div className="team-wallet__squad">
        {hasPlayers ? (
          <ul className="team-wallet__players">
            {team.squad.map((p) => (
              <li key={p.id} className="team-wallet__player">
                <PlayerAvatar
                  player={p}
                  className="team-wallet__player-avatar"
                />
                <span className="team-wallet__player-name" title={p.name}>
                  {p.name}
                </span>
                {!team.isOrganizer && (
                  <span className="team-wallet__player-price">
                    ₹{formatLakh(p.soldPriceLakh)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="team-wallet__empty">
            {team.isOrganizer ? 'No unsold players' : 'No players bought yet'}
          </div>
        )}
      </div>
    </div>
  );
}
