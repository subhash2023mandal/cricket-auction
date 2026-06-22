import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, X } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { teamColors, tournament } from '../../data/mockData';
import {
  computeGroupStandings,
  formatOvers,
  formatStartTime,
  GROUPS,
  placeholderLabelForSeed,
} from '../../utils/match';
import MatchScorer from './MatchScorer';
import './Tournament.css';

const STATUS_LABELS = {
  upcoming: 'Upcoming',
  live: 'Live',
  completed: 'Final',
};

const DAY_TITLES = {
  1: { title: 'Day 1', subtitle: 'Group A round-robin · 3 matches' },
  2: { title: 'Day 2', subtitle: 'Group B round-robin · 3 matches' },
  3: { title: 'Day 3', subtitle: 'Semi-Finals + Final · 3 matches' },
};

export default function TournamentOverlay({ onClose }) {
  const { state } = useAuction();
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  // Lock body scroll while the overlay is open so phones don't double-scroll.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (selectedMatchId) setSelectedMatchId(null);
      else onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, selectedMatchId]);

  const teamLookup = useMemo(() => {
    const map = Object.fromEntries(state.teams.map((t) => [t.id, t]));
    return (id) => (id ? map[id] : null);
  }, [state.teams]);

  const matchesByDay = useMemo(() => {
    const grouped = {};
    state.matches.forEach((m) => {
      const day = m.day ?? 1;
      grouped[day] = grouped[day] ?? [];
      grouped[day].push(m);
    });
    return grouped;
  }, [state.matches]);

  const selectedMatch = useMemo(
    () => state.matches.find((m) => m.id === selectedMatchId) ?? null,
    [state.matches, selectedMatchId],
  );

  const standingsByGroup = useMemo(() => {
    const out = {};
    GROUPS.forEach((g) => {
      out[g.id] = computeGroupStandings(state.matches, g.teamIds);
    });
    return out;
  }, [state.matches]);

  const counts = useMemo(() => {
    const c = { total: state.matches.length, live: 0, completed: 0, upcoming: 0 };
    state.matches.forEach((m) => {
      c[m.status] = (c[m.status] ?? 0) + 1;
    });
    return c;
  }, [state.matches]);

  const overlay = (
    <div
      className="tournament-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Tournament"
    >
      <button
        className="tournament-overlay__backdrop"
        onClick={() => (selectedMatchId ? setSelectedMatchId(null) : onClose?.())}
        aria-label="Close tournament"
      />

      <div className="tournament-overlay__panel">
        <header className="tournament-overlay__head">
          <div className="tournament-overlay__title-row">
            <Trophy size={20} className="tournament-overlay__trophy" />
            <div>
              <div className="label">Tournament</div>
              <h2 className="tournament-overlay__title">{tournament.name}</h2>
            </div>
          </div>
          <div className="tournament-overlay__summary">
            <span>
              <strong>{counts.total}</strong> matches
            </span>
            <span>
              <strong>{counts.live}</strong> live
            </span>
            <span>
              <strong>{counts.completed}</strong> finished
            </span>
            <span>
              <strong>{counts.upcoming}</strong> upcoming
            </span>
          </div>
          <button
            type="button"
            className="tournament-overlay__close"
            onClick={onClose}
            aria-label="Close tournament view"
          >
            <X size={18} />
          </button>
        </header>

        <div className="tournament-overlay__body">
          {selectedMatch ? (
            <MatchScorer
              match={selectedMatch}
              onBack={() => setSelectedMatchId(null)}
              onSelectMatch={setSelectedMatchId}
            />
          ) : (
            <ScheduleView
              matchesByDay={matchesByDay}
              standingsByGroup={standingsByGroup}
              teamLookup={teamLookup}
              onSelect={setSelectedMatchId}
            />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

function ScheduleView({ matchesByDay, standingsByGroup, teamLookup, onSelect }) {
  const allMatches = Object.values(matchesByDay).flat();
  const nextPlayable = allMatches.find(
    (m) => m.status !== 'completed' && m.team1Id && m.team2Id,
  );
  return (
    <div className="schedule">
      <aside className="schedule__standings">
        {GROUPS.map((g) => (
          <StandingsCard
            key={g.id}
            group={g}
            standings={standingsByGroup[g.id] ?? []}
            teamLookup={teamLookup}
          />
        ))}
        <BracketSummary
          matches={allMatches}
          teamLookup={teamLookup}
          onSelect={onSelect}
        />
      </aside>

      <main className="schedule__days">
        {Object.keys(matchesByDay)
          .map((d) => Number(d))
          .sort((a, b) => a - b)
          .map((day) => (
            <DaySection
              key={day}
              day={day}
              matches={matchesByDay[day]}
              teamLookup={teamLookup}
              onSelect={onSelect}
              nextPlayableId={nextPlayable?.id ?? null}
            />
          ))}
      </main>
    </div>
  );
}

function DaySection({ day, matches, teamLookup, onSelect, nextPlayableId }) {
  const { matchActions } = useAuction();
  const meta = DAY_TITLES[day] ?? { title: `Day ${day}`, subtitle: '' };
  return (
    <section className="day-section">
      <header className="day-section__head">
        <div>
          <div className="day-section__title">{meta.title}</div>
          <div className="day-section__subtitle">{meta.subtitle}</div>
        </div>
        <div className="day-section__count">{matches.length} matches</div>
      </header>

      {matches.length > 0 && (
        <ul className="day-section__lineup" aria-label="Today's matchups">
          {matches.map((m) => {
            const isNext = m.id === nextPlayableId;
            const isDone = m.status === 'completed';
            return (
              <li
                key={m.id}
                className={`day-section__lineup-row ${isNext ? 'is-next' : ''} ${isDone ? 'is-done' : ''}`}
              >
                <span className="day-section__lineup-tag">{m.name}</span>
                <input
                  type="time"
                  className="day-section__lineup-time"
                  value={m.startTimeAt ?? ''}
                  onChange={(e) =>
                    matchActions.setMatchStartTime(m.id, e.target.value)
                  }
                  aria-label={`Start time for ${m.name}`}
                  title={`Set start time for ${m.name}`}
                />
                <button
                  type="button"
                  className="day-section__lineup-link"
                  onClick={() => onSelect(m.id)}
                >
                  {matchupLabel(m, teamLookup)}
                  {isNext && (
                    <span className="day-section__lineup-pill">Next</span>
                  )}
                  {isDone && (
                    <span className="day-section__lineup-pill day-section__lineup-pill--done">
                      Done
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="day-section__matches">
        {matches.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            teamLookup={teamLookup}
            onSelect={() => onSelect(m.id)}
          />
        ))}
      </div>
    </section>
  );
}

function matchupLabel(match, teamLookup) {
  const labelFor = (teamId, seed) => {
    const t = teamId ? teamLookup(teamId) : null;
    if (t) return t.short;
    if (seed) return seed;
    return 'TBD';
  };
  const left = labelFor(match.team1Id, match.seedTeam1);
  const right = labelFor(match.team2Id, match.seedTeam2);
  return `${left} vs ${right}`;
}

function MatchCard({ match, teamLookup, onSelect }) {
  const t1 = teamLookup(match.team1Id);
  const t2 = teamLookup(match.team2Id);
  const inn1 = match.innings[0];
  const inn2 = match.innings[1];
  const tag = stageTag(match);

  return (
    <button
      className={`match-card match-card--${match.status} match-card--${match.stage}`}
      onClick={onSelect}
      type="button"
    >
      <div className="match-card__head">
        <span className="match-card__tag">{tag}</span>
        {match.startTimeAt && (
          <span className="match-card__time" title="Scheduled start">
            {formatStartTime(match.startTimeAt)}
          </span>
        )}
        <span
          className={`match-card__status match-card__status--${match.status}`}
        >
          {match.status === 'live' && <span className="match-card__dot" />}
          {STATUS_LABELS[match.status]}
        </span>
      </div>

      <div className="match-card__teams">
        <MatchTeamRow
          team={t1}
          fallbackLabel={placeholderLabelForSeed(match.seedTeam1)}
          fallbackShort={match.seedTeam1 ?? 'T1'}
          innings={inn1}
          isWinner={match.winnerTeamId === match.team1Id}
        />
        <MatchTeamRow
          team={t2}
          fallbackLabel={placeholderLabelForSeed(match.seedTeam2)}
          fallbackShort={match.seedTeam2 ?? 'T2'}
          innings={inn2}
          isWinner={match.winnerTeamId === match.team2Id}
        />
      </div>

      <div className="match-card__footer">
        {match.status === 'completed' && match.result
          ? match.result
          : match.status === 'live'
            ? `Innings ${match.currentInnings + 1} in progress`
            : match.team1Id && match.team2Id
              ? 'Tap to start scoring'
              : 'Awaiting prior matches'}
      </div>
    </button>
  );
}

function MatchTeamRow({
  team,
  fallbackLabel,
  fallbackShort,
  innings,
  isWinner,
}) {
  const short = team?.short ?? fallbackShort;
  const name = team?.name ?? fallbackLabel;
  const isPlaceholder = !team;
  const played = innings.deliveries.length > 0 || innings.closed;
  return (
    <div
      className={`match-card__team ${isPlaceholder ? 'match-card__team--placeholder' : ''} ${isWinner ? 'match-card__team--winner' : ''}`}
    >
      <span
        className="match-card__team-short"
        style={{ background: teamColors[short] || '#334' }}
      >
        {short}
      </span>
      <span className="match-card__team-name" title={name}>
        {name}
      </span>
      <span className="match-card__team-score">
        {played
          ? `${innings.runs}/${innings.wickets} (${formatOvers(innings.legalBalls)})`
          : isPlaceholder
            ? ''
            : '—'}
      </span>
    </div>
  );
}

function stageTag(match) {
  if (match.stage === 'group') return `Group ${match.group} · ${match.name}`;
  if (match.stage === 'semi') return match.name;
  return match.name;
}

function StandingsCard({ group, standings, teamLookup }) {
  return (
    <div className="standings-card">
      <header className="standings-card__head">
        <div className="standings-card__title">{group.name}</div>
        <div className="standings-card__sub">
          Top 2 qualify for the semi-finals
        </div>
      </header>
      <table className="standings-card__table">
        <thead>
          <tr>
            <th className="standings-card__pos">#</th>
            <th>Team</th>
            <th title="Played">P</th>
            <th title="Won">W</th>
            <th title="Lost">L</th>
            <th title="Points">Pts</th>
            <th title="Net Run Rate">NRR</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => {
            const team = teamLookup(row.teamId);
            const qualified = i < 2 && (row.played > 0 || row.points > 0);
            return (
              <tr
                key={row.teamId}
                className={`standings-card__row ${qualified ? 'standings-card__row--qualified' : ''}`}
              >
                <td className="standings-card__pos">{i + 1}</td>
                <td className="standings-card__team-cell">
                  <span
                    className="standings-card__pill"
                    style={{ background: teamColors[team?.short] || '#334' }}
                  >
                    {team?.short ?? '—'}
                  </span>
                  <span className="standings-card__team-name">
                    {team?.name ?? '—'}
                  </span>
                </td>
                <td>{row.played}</td>
                <td>{row.won}</td>
                <td>{row.lost}</td>
                <td className="standings-card__pts">{row.points}</td>
                <td>
                  {row.played > 0
                    ? (row.nrr >= 0 ? '+' : '') + row.nrr.toFixed(2)
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BracketSummary({ matches, teamLookup, onSelect }) {
  const sf1 = matches.find((m) => m.stage === 'semi' && m.name === 'Semi-Final 1');
  const sf2 = matches.find((m) => m.stage === 'semi' && m.name === 'Semi-Final 2');
  const finalMatch = matches.find((m) => m.stage === 'final');
  return (
    <div className="bracket">
      <header className="bracket__head">
        <div className="bracket__title">Knockouts</div>
        <div className="bracket__sub">Winners advance · loser is eliminated</div>
      </header>
      <div className="bracket__semis">
        <BracketRow match={sf1} teamLookup={teamLookup} onSelect={onSelect} />
        <BracketRow match={sf2} teamLookup={teamLookup} onSelect={onSelect} />
      </div>
      <div className="bracket__final">
        <BracketRow match={finalMatch} teamLookup={teamLookup} onSelect={onSelect} />
      </div>
    </div>
  );
}

function BracketRow({ match, teamLookup, onSelect }) {
  if (!match) return null;
  const t1 = teamLookup(match.team1Id);
  const t2 = teamLookup(match.team2Id);
  return (
    <button
      type="button"
      className={`bracket-row bracket-row--${match.status}`}
      onClick={() => onSelect(match.id)}
    >
      <div className="bracket-row__head">
        <span>{match.name}</span>
        <span className={`bracket-row__status bracket-row__status--${match.status}`}>
          {STATUS_LABELS[match.status]}
        </span>
      </div>
      <BracketTeamLine
        team={t1}
        fallback={placeholderLabelForSeed(match.seedTeam1)}
        innings={match.innings[0]}
        isWinner={match.winnerTeamId === match.team1Id}
      />
      <BracketTeamLine
        team={t2}
        fallback={placeholderLabelForSeed(match.seedTeam2)}
        innings={match.innings[1]}
        isWinner={match.winnerTeamId === match.team2Id}
      />
    </button>
  );
}

function BracketTeamLine({ team, fallback, innings, isWinner }) {
  const short = team?.short ?? '—';
  const name = team?.name ?? fallback;
  const played = innings.deliveries.length > 0 || innings.closed;
  return (
    <div
      className={`bracket-row__team ${!team ? 'bracket-row__team--placeholder' : ''} ${isWinner ? 'bracket-row__team--winner' : ''}`}
    >
      <span
        className="bracket-row__pill"
        style={{ background: teamColors[short] || '#334' }}
      >
        {team?.short ?? '?'}
      </span>
      <span className="bracket-row__name" title={name}>
        {name}
      </span>
      <span className="bracket-row__score">
        {played ? `${innings.runs}/${innings.wickets}` : ''}
      </span>
    </div>
  );
}
