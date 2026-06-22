import { useState } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Coins,
  HeartPulse,
  Pencil,
  Repeat,
  RotateCcw,
  Undo2,
  UserRoundCheck,
  UserRoundPlus,
} from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { teamColors } from '../../data/mockData';
import {
  BALL_TYPES,
  canScore,
  formatOvers,
  lastOverDeliveries,
  MAX_WICKETS,
  placeholderLabelForSeed,
  previousOverBowlerId,
} from '../../utils/match';

const STATUS_LABELS = {
  upcoming: 'Upcoming',
  live: 'Live',
  completed: 'Final',
};

const KEYPAD_ROWS = [
  ['run-0', 'run-1', 'run-2', 'run-3', 'run-4', 'run-6', 'wicket'],
  ['wide', 'noball', 'bye', 'legbye'],
];

export default function MatchScorer({ match, onBack, onSelectMatch }) {
  const { state, matchActions } = useAuction();
  const teamLookup = (id) => (id ? state.teams.find((t) => t.id === id) : null);
  const [view, setView] = useState('live'); // 'live' | 'scorecard'

  // Next playable match after the current one — first non-completed match
  // (with both teams known) that comes after this one in the fixture order.
  const nextMatch = (() => {
    const idx = state.matches.findIndex((m) => m.id === match.id);
    if (idx === -1) return null;
    for (let i = idx + 1; i < state.matches.length; i += 1) {
      const m = state.matches[i];
      if (m.status !== 'completed' && m.team1Id && m.team2Id) return m;
    }
    return null;
  })();

  const team1 = teamLookup(match.team1Id);
  const team2 = teamLookup(match.team2Id);
  const team1Label = team1?.name ?? placeholderLabelForSeed(match.seedTeam1);
  const team2Label = team2?.name ?? placeholderLabelForSeed(match.seedTeam2);
  const team1Short = team1?.short ?? match.seedTeam1 ?? 'T1';
  const team2Short = team2?.short ?? match.seedTeam2 ?? 'T2';
  const teamsKnown = Boolean(match.team1Id && match.team2Id);

  const idx = match.currentInnings;
  const innings = match.innings[idx];
  const isCompleted = match.status === 'completed';
  const isInningsClosed = innings.closed;
  const battingTeam = teamLookup(innings.battingTeamId);
  const bowlingTeam = teamLookup(innings.bowlingTeamId);
  const target = idx === 1 ? match.innings[0].runs + 1 : null;
  const tossDone =
    match.tossWinnerId != null && match.tossDecision != null;
  const matchHasStarted = match.innings.some(
    (inn) =>
      (inn.deliveries?.length ?? 0) > 0 ||
      inn.openersSet ||
      inn.currentBowlerId != null,
  );
  const canEditToss = teamsKnown && !isCompleted && !matchHasStarted;

  // Work out what action (if any) the user needs to take before the next ball.
  const setupAction = !teamsKnown
    ? 'awaiting-teams'
    : isCompleted
      ? 'completed'
      : isInningsClosed
        ? 'innings-closed'
        : !tossDone && idx === 0 && !matchHasStarted
          ? 'pick-toss'
          : !innings.openersSet
            ? 'pick-openers'
            : innings.strikerIdx == null || innings.nonStrikerIdx == null
              ? 'pick-batter'
              : innings.currentBowlerId == null
                ? 'pick-bowler'
                : 'ready';
  const canScoreNow = canScore(innings) && !isCompleted;

  return (
    <div className="match-scorer">
      <header className="match-scorer__top">
        <button
          type="button"
          className="match-scorer__back"
          onClick={onBack}
          aria-label="Back to tournament"
        >
          <ArrowLeft size={16} />
          <span>Tournament</span>
        </button>
        <div className="match-scorer__meta">
          <span className="match-scorer__day">Day {match.day}</span>
          <span className="match-scorer__divider">·</span>
          <span>{match.name}</span>
          <span className={`match-scorer__status match-scorer__status--${match.status}`}>
            {match.status === 'live' && <span className="match-scorer__dot" />}
            {STATUS_LABELS[match.status]}
          </span>
        </div>
        {teamsKnown && (
          <div className="match-scorer__view-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'live'}
              className={`view-tab ${view === 'live' ? 'is-active' : ''}`}
              onClick={() => setView('live')}
            >
              Live
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'scorecard'}
              className={`view-tab ${view === 'scorecard' ? 'is-active' : ''}`}
              onClick={() => setView('scorecard')}
            >
              <ClipboardList size={13} />
              Scorecard
            </button>
          </div>
        )}
      </header>

      <section className="match-scorer__heading">
        <TeamPill short={team1Short} label={team1Label} />
        <span className="match-scorer__vs">vs</span>
        <TeamPill short={team2Short} label={team2Label} />
        <div className="match-scorer__overs">{match.oversLimit} overs</div>
      </section>

      {match.result && (
        <div className="match-scorer__result">{match.result}</div>
      )}

      {isCompleted && nextMatch && onSelectMatch && (
        <NextMatchPrompt
          nextMatch={nextMatch}
          teamLookup={teamLookup}
          onSelectMatch={onSelectMatch}
        />
      )}

      {!teamsKnown ? (
        <WaitingForTeams match={match} />
      ) : view === 'scorecard' ? (
        <ScorecardView match={match} teamLookup={teamLookup} />
      ) : (
        <>
          <section className="match-scorer__innings">
            <InningsCard
              label="Innings 1"
              innings={match.innings[0]}
              team={teamLookup(match.innings[0].battingTeamId)}
              oversLimit={match.oversLimit}
              isActive={idx === 0 && !isCompleted}
            />
            <InningsCard
              label="Innings 2"
              innings={match.innings[1]}
              team={teamLookup(match.innings[1].battingTeamId)}
              oversLimit={match.oversLimit}
              isActive={idx === 1 && !isCompleted}
            />
          </section>

          {target != null && !isCompleted && (
            <div className="match-scorer__target">
              {battingTeam?.short ?? 'Team 2'} need{' '}
              <strong>{Math.max(0, target - innings.runs)}</strong> runs from{' '}
              <strong>
                {Math.max(0, match.oversLimit * 6 - innings.legalBalls)}
              </strong>{' '}
              balls
            </div>
          )}

          <StatusBanner action={setupAction} innings={innings} />

          {tossDone && setupAction !== 'pick-toss' && (
            <TossSummary
              match={match}
              team1={team1}
              team2={team2}
              canEdit={canEditToss}
            />
          )}

          {/* Setup pickers (only one is active at a time) */}
          {setupAction === 'pick-toss' && (
            <TossPanel match={match} team1={team1} team2={team2} />
          )}
          {setupAction === 'pick-openers' && (
            <OpenerPicker match={match} innings={innings} battingTeam={battingTeam} />
          )}
          {setupAction === 'pick-batter' && (
            <NextBatterPicker
              match={match}
              innings={innings}
              battingTeam={battingTeam}
            />
          )}
          {setupAction === 'pick-bowler' && (
            <BowlerPicker match={match} innings={innings} bowlingTeam={bowlingTeam} />
          )}

          {(setupAction === 'ready' ||
            setupAction === 'pick-batter' ||
            setupAction === 'pick-bowler' ||
            setupAction === 'innings-closed' ||
            setupAction === 'completed') &&
            innings.openersSet && (
            <>
              <BowlerPanel innings={innings} bowlingTeam={bowlingTeam} />
              <BattersPanel
                match={match}
                innings={innings}
                canRetire={!isCompleted && !isInningsClosed && innings.openersSet}
                canSwap={canScoreNow}
              />
              <CurrentOverPanel
                innings={innings}
                oversLimit={match.oversLimit}
                isCompleted={isCompleted}
                isInningsClosed={isInningsClosed}
                battingTeam={battingTeam}
                bowlingTeam={bowlingTeam}
              />
            </>
          )}

          <Keypad
            disabled={!canScoreNow}
            onPress={(id) => matchActions.recordBall(match.id, id)}
          />

          <section className="match-scorer__controls">
            <button
              className="scorer-control"
              onClick={() => matchActions.undoBall(match.id)}
              disabled={innings.deliveries.length === 0}
              type="button"
            >
              <Undo2 size={14} /> Undo
            </button>
            <button
              className="scorer-control"
              onClick={() => matchActions.endInnings(match.id)}
              disabled={isCompleted || isInningsClosed || !innings.openersSet}
              type="button"
            >
              {idx === 0 ? 'End Innings' : 'End Match'}
            </button>
            <button
              className="scorer-control scorer-control--danger"
              onClick={() => {
                if (window.confirm('Reset this match? All scoring will be lost.')) {
                  matchActions.resetMatch(match.id);
                }
              }}
              type="button"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </section>
        </>
      )}
    </div>
  );
}

function WaitingForTeams({ match }) {
  return (
    <div className="match-scorer__waiting">
      <div className="label">Awaiting teams</div>
      <p>
        This {match.stage === 'final' ? 'final' : 'semi-final'} will be played
        between <strong>{placeholderLabelForSeed(match.seedTeam1)}</strong> and{' '}
        <strong>{placeholderLabelForSeed(match.seedTeam2)}</strong>. Finish the
        prior matches to unlock live scoring.
      </p>
    </div>
  );
}

function TeamPill({ short, label }) {
  const color = teamColors[short] || '#334';
  return (
    <div className="team-pill" title={label}>
      <span className="team-pill__short" style={{ background: color }}>
        {short}
      </span>
      <span className="team-pill__name">{label}</span>
    </div>
  );
}

function InningsCard({ label, innings, team, oversLimit, isActive }) {
  const short = team?.short ?? innings.battingTeamId?.toUpperCase() ?? 'TBD';
  const name = team?.name ?? short;
  const played = innings.deliveries.length > 0 || innings.closed;
  return (
    <div
      className={`innings-card ${isActive ? 'innings-card--active' : ''} ${innings.closed ? 'innings-card--closed' : ''}`}
    >
      <div className="innings-card__head">
        <span
          className="innings-card__pill"
          style={{ background: teamColors[short] || '#334' }}
        >
          {short}
        </span>
        <div className="innings-card__head-text">
          <div className="innings-card__label">{label}</div>
          <div className="innings-card__name" title={name}>
            {name}
          </div>
        </div>
      </div>
      <div className="innings-card__score">
        {played ? (
          <>
            <span className="innings-card__runs">
              {innings.runs}/{innings.wickets}
            </span>
            <span className="innings-card__overs">
              ({formatOvers(innings.legalBalls)} / {oversLimit})
            </span>
          </>
        ) : (
          <span className="innings-card__pending">Yet to bat</span>
        )}
      </div>
      {innings.wickets >= MAX_WICKETS && (
        <div className="innings-card__tag">All out</div>
      )}
    </div>
  );
}

// ─── Status banner ─────────────────────────────────────────────────────────
function StatusBanner({ action, innings }) {
  let text = '';
  let tone = 'info';
  switch (action) {
    case 'pick-toss':
      text = 'Conduct the toss to decide who bats first';
      tone = 'prompt';
      break;
    case 'pick-openers':
      text = 'Pick the two opening batsmen to start the innings';
      tone = 'prompt';
      break;
    case 'pick-batter':
      text =
        innings.wickets > 0
          ? 'Wicket! Select the next batter at the crease'
          : 'Select the replacement batter at the crease';
      tone = 'prompt';
      break;
    case 'pick-bowler':
      text =
        innings.deliveries.length === 0
          ? 'Select the bowler for over 1'
          : `Over ${Math.floor(innings.legalBalls / 6)} complete · pick the bowler for over ${Math.floor(innings.legalBalls / 6) + 1}`;
      tone = 'prompt';
      break;
    case 'innings-closed':
      text = 'Innings closed — tap End Innings to start the next innings';
      tone = 'info';
      break;
    case 'completed':
      text = 'Match complete';
      tone = 'info';
      break;
    default:
      return null;
  }
  return <div className={`status-banner status-banner--${tone}`}>{text}</div>;
}

function NextMatchPrompt({ nextMatch, teamLookup, onSelectMatch }) {
  const t1 = teamLookup(nextMatch.team1Id);
  const t2 = teamLookup(nextMatch.team2Id);
  const matchup =
    t1 && t2
      ? `${t1.short} vs ${t2.short}`
      : `${nextMatch.seedTeam1 ?? 'TBD'} vs ${nextMatch.seedTeam2 ?? 'TBD'}`;
  return (
    <div className="next-match-prompt">
      <div className="next-match-prompt__label">Up next</div>
      <div className="next-match-prompt__title">
        Day {nextMatch.day} · {nextMatch.name}
      </div>
      <div className="next-match-prompt__matchup">{matchup}</div>
      <button
        type="button"
        className="next-match-prompt__cta"
        onClick={() => onSelectMatch(nextMatch.id)}
      >
        Start {nextMatch.name}
      </button>
    </div>
  );
}

// ─── Toss panel + summary ─────────────────────────────────────────────────
function TossPanel({ match, team1, team2 }) {
  const { matchActions } = useAuction();
  const [winnerId, setWinnerId] = useState(match.tossWinnerId);
  const [decision, setDecision] = useState(match.tossDecision);

  const winner = winnerId === team1?.id ? team1 : winnerId === team2?.id ? team2 : null;

  const confirm = () => {
    if (!winnerId || !decision) return;
    matchActions.setToss(match.id, winnerId, decision);
  };

  if (!team1 || !team2) return null;

  return (
    <section className="picker toss-panel" aria-label="Toss">
      <header className="picker__head">
        <div>
          <div className="label">Toss</div>
          <div className="picker__title">
            <Coins size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            Tap the team that won the toss
          </div>
        </div>
      </header>

      <div className="toss-panel__row">
        <button
          type="button"
          className={`picker-chip ${winnerId === team1.id ? 'picker-chip--selected' : ''}`}
          onClick={() => setWinnerId(team1.id)}
        >
          <span className="picker-chip__name">{team1.name}</span>
          <span className="picker-chip__sub">{team1.short}</span>
        </button>
        <button
          type="button"
          className={`picker-chip ${winnerId === team2.id ? 'picker-chip--selected' : ''}`}
          onClick={() => setWinnerId(team2.id)}
        >
          <span className="picker-chip__name">{team2.name}</span>
          <span className="picker-chip__sub">{team2.short}</span>
        </button>
      </div>

      {winner && (
        <>
          <div className="toss-panel__sub">
            <strong>{winner.short}</strong> won the toss · choose:
          </div>
          <div className="toss-panel__row">
            <button
              type="button"
              className={`picker-chip ${decision === 'bat' ? 'picker-chip--selected' : ''}`}
              onClick={() => setDecision('bat')}
            >
              <span className="picker-chip__name">Bat first</span>
              <span className="picker-chip__sub">{winner.short} opens the batting</span>
            </button>
            <button
              type="button"
              className={`picker-chip ${decision === 'bowl' ? 'picker-chip--selected' : ''}`}
              onClick={() => setDecision('bowl')}
            >
              <span className="picker-chip__name">Bowl first</span>
              <span className="picker-chip__sub">
                {(winnerId === team1.id ? team2 : team1).short} opens the batting
              </span>
            </button>
          </div>
        </>
      )}

      <div className="toss-panel__actions">
        <button
          type="button"
          className="picker__primary"
          disabled={!winnerId || !decision}
          onClick={confirm}
        >
          <UserRoundCheck size={14} /> Confirm toss
        </button>
      </div>
    </section>
  );
}

function TossSummary({ match, team1, team2, canEdit }) {
  const { matchActions } = useAuction();
  if (!team1 || !team2) return null;
  const winner = match.tossWinnerId === team1.id ? team1 : team2;
  const battingFirst =
    match.tossDecision === 'bat'
      ? winner
      : winner.id === team1.id
        ? team2
        : team1;
  return (
    <div className="toss-summary">
      <span className="toss-summary__icon" aria-hidden>
        <Coins size={14} />
      </span>
      <span className="toss-summary__text">
        <strong>{winner.short}</strong> won the toss & chose to{' '}
        <strong>{match.tossDecision === 'bat' ? 'bat' : 'bowl'}</strong> ·{' '}
        <strong>{battingFirst.short}</strong> batting first
      </span>
      {canEdit && (
        <button
          type="button"
          className="toss-summary__edit"
          onClick={() => matchActions.clearToss(match.id)}
          title="Re-do the toss"
          aria-label="Re-do the toss"
        >
          <Pencil size={12} />
          <span>Edit</span>
        </button>
      )}
    </div>
  );
}

// Reusable chip used by every picker. Names come from the team's squad — the
// chip is just a select button.
function PickerChip({ name, selected = false, role = null, subtitle = null, onPick }) {
  return (
    <button
      type="button"
      className={`picker-chip ${selected ? 'picker-chip--selected' : ''}`}
      onClick={onPick}
    >
      <span className="picker-chip__name">{name}</span>
      {subtitle && <span className="picker-chip__sub">{subtitle}</span>}
      {role && (
        <span className={`picker-chip__role picker-chip__role--${role}`}>
          {role === 'striker' ? 'On strike *' : 'Non-striker'}
        </span>
      )}
    </button>
  );
}

function EmptySquad({ team, role }) {
  return (
    <div className="picker__empty-state">
      <strong>{team?.name ?? 'This team'}</strong> has no {role} in the squad
      yet. Finish the auction (or sell at least one player to this team) before
      you can pick {role}.
    </div>
  );
}

// ─── Openers picker ────────────────────────────────────────────────────────
function OpenerPicker({ match, innings, battingTeam }) {
  const { matchActions } = useAuction();
  const [strikerId, setStrikerId] = useState(null);
  const [nonStrikerId, setNonStrikerId] = useState(null);
  const candidates = innings.batters.filter((b) => b.status === 'did-not-bat');

  const toggle = (id) => {
    if (strikerId === id) {
      setStrikerId(null);
      return;
    }
    if (nonStrikerId === id) {
      setNonStrikerId(null);
      return;
    }
    if (strikerId == null) setStrikerId(id);
    else if (nonStrikerId == null) setNonStrikerId(id);
  };

  const submit = () => {
    if (!strikerId || !nonStrikerId) return;
    matchActions.setOpeners(match.id, strikerId, nonStrikerId);
  };

  return (
    <section className="picker" aria-label="Opening batters">
      <header className="picker__head">
        <div>
          <div className="label">Openers</div>
          <div className="picker__title">
            Pick from <strong>{battingTeam?.name ?? 'the squad'}</strong> · tap
            two players (1st pick is on strike)
          </div>
        </div>
        <button
          type="button"
          className="picker__primary"
          disabled={!strikerId || !nonStrikerId}
          onClick={submit}
        >
          <UserRoundCheck size={14} /> Start innings
        </button>
      </header>
      {candidates.length === 0 ? (
        <EmptySquad team={battingTeam} role="batters" />
      ) : (
        <div className="picker__grid">
          {candidates.map((b) => {
            const role =
              b.id === strikerId
                ? 'striker'
                : b.id === nonStrikerId
                  ? 'non-striker'
                  : null;
            return (
              <PickerChip
                key={b.id}
                name={b.name}
                selected={Boolean(role)}
                role={role}
                onPick={() => toggle(b.id)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Next batter picker ────────────────────────────────────────────────────
function NextBatterPicker({ match, innings, battingTeam }) {
  const { matchActions } = useAuction();
  const candidates = innings.batters.filter((b) => b.status === 'did-not-bat');

  return (
    <section className="picker" aria-label="Next batter">
      <header className="picker__head">
        <div>
          <div className="label">Next batter</div>
          <div className="picker__title">
            {candidates.length === 0
              ? 'No batters left in the squad — end the innings'
              : `Pick the replacement from ${battingTeam?.name ?? 'the squad'}`}
          </div>
        </div>
      </header>
      {candidates.length > 0 && (
        <div className="picker__grid">
          {candidates.map((b) => (
            <PickerChip
              key={b.id}
              name={b.name}
              onPick={() => matchActions.setNextBatter(match.id, b.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Bowler picker ─────────────────────────────────────────────────────────
function BowlerPicker({ match, innings, bowlingTeam }) {
  const { matchActions } = useAuction();
  const previousBowlerId = previousOverBowlerId(innings);
  const candidates = innings.bowlers.filter((b) => b.id !== previousBowlerId);
  // If a bowler is excluded purely because they bowled last, fall back to
  // letting the user pick them anyway (one-bowler edge case).
  const effective = candidates.length === 0 ? innings.bowlers : candidates;

  return (
    <section className="picker" aria-label="Bowler">
      <header className="picker__head">
        <div>
          <div className="label">Bowler</div>
          <div className="picker__title">
            Pick from <strong>{bowlingTeam?.name ?? 'the squad'}</strong>
            {previousBowlerId
              ? ' · the previous over\u2019s bowler is hidden'
              : ''}
          </div>
        </div>
      </header>
      {effective.length === 0 ? (
        <EmptySquad team={bowlingTeam} role="bowlers" />
      ) : (
        <div className="picker__grid">
          {effective.map((b) => (
            <PickerChip
              key={b.id}
              name={b.name}
              subtitle={
                b.balls > 0
                  ? `${formatOvers(b.balls)} ov · ${b.wickets}/${b.runs}`
                  : null
              }
              onPick={() => matchActions.setBowler(match.id, b.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Bowler panel (current bowler stats) ───────────────────────────────────
function BowlerPanel({ innings, bowlingTeam }) {
  const bowler = innings.bowlers.find((b) => b.id === innings.currentBowlerId);

  return (
    <section className="bowler-panel" aria-label="Bowler">
      <div className="bowler-panel__head">
        <div className="bowler-panel__lead">
          <div className="label">Bowling</div>
          <div className="bowler-panel__team">{bowlingTeam?.name ?? 'Bowling side'}</div>
        </div>
      </div>
      {bowler ? (
        <div className="bowler-panel__row">
          <div className="bowler-panel__name" title={bowler.name}>
            {bowler.name}
          </div>
          <div className="bowler-panel__stats">
            <Stat label="O" value={formatOvers(bowler.balls)} />
            <Stat label="R" value={bowler.runs} highlight />
            <Stat label="W" value={bowler.wickets} highlight />
            <Stat
              label="Econ"
              value={bowler.balls > 0 ? ((bowler.runs / bowler.balls) * 6).toFixed(2) : '—'}
            />
          </div>
        </div>
      ) : (
        <div className="bowler-panel__empty">No bowler at the crease yet</div>
      )}
    </section>
  );
}

function Stat({ label, value, highlight = false }) {
  return (
    <div className={`stat ${highlight ? 'stat--highlight' : ''}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
    </div>
  );
}

// ─── Batters panel ─────────────────────────────────────────────────────────
function BattersPanel({ match, innings, canRetire, canSwap }) {
  const { matchActions } = useAuction();
  const striker =
    innings.strikerIdx != null ? innings.batters[innings.strikerIdx] : null;
  const nonStriker =
    innings.nonStrikerIdx != null ? innings.batters[innings.nonStrikerIdx] : null;

  const onRetire = (batter) => {
    if (!batter) return;
    if (
      window.confirm(
        `Retire ${batter.name} hurt? They'll be replaced and won't count as a wicket.`,
      )
    ) {
      matchActions.retireBatter(match.id, batter.id);
    }
  };

  return (
    <section className="batters-panel" aria-label="Batters">
      <header className="batters-panel__head">
        <div className="batters-panel__cols">
          <span>Batter</span>
          <span>R</span>
          <span>B</span>
          <span>4s</span>
          <span>6s</span>
          <span>SR</span>
        </div>
        <button
          type="button"
          className="batters-panel__swap"
          onClick={() => matchActions.swapStrike(match.id)}
          disabled={
            !canSwap ||
            innings.strikerIdx == null ||
            innings.nonStrikerIdx == null
          }
          title="Swap strike"
          aria-label="Swap strike"
        >
          <Repeat size={14} />
          <span>Swap</span>
        </button>
      </header>
      <BatterRow batter={striker} isStriker canRetire={canRetire} onRetire={onRetire} />
      <BatterRow batter={nonStriker} canRetire={canRetire} onRetire={onRetire} />
    </section>
  );
}

function BatterRow({ batter, isStriker = false, canRetire, onRetire }) {
  if (!batter) {
    return (
      <div className="batter-row batter-row--empty">
        <span className="batter-row__name batter-row__name--pending">
          <UserRoundPlus size={12} /> Awaiting batter
        </span>
        <span>—</span>
        <span>—</span>
        <span>—</span>
        <span>—</span>
        <span>—</span>
        <span />
      </div>
    );
  }
  const sr =
    batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(1) : '—';
  return (
    <div
      className={`batter-row ${isStriker ? 'batter-row--striker' : ''} ${batter.status === 'out' ? 'batter-row--out' : ''}`}
    >
      <span className="batter-row__name" title={batter.name}>
        {isStriker && (
          <span className="batter-row__star" aria-hidden>
            *
          </span>
        )}
        <span className="batter-row__name-text">{batter.name}</span>
      </span>
      <span className="batter-row__num batter-row__runs">{batter.runs}</span>
      <span className="batter-row__num">{batter.balls}</span>
      <span className="batter-row__num">{batter.fours}</span>
      <span className="batter-row__num">{batter.sixes}</span>
      <span className="batter-row__num batter-row__sr">{sr}</span>
      <span className="batter-row__actions">
        <button
          type="button"
          className="batter-row__edit batter-row__edit--retire"
          onClick={() => onRetire(batter)}
          disabled={!canRetire}
          aria-label={`Retire ${batter.name} hurt`}
          title="Retire hurt"
        >
          <HeartPulse size={12} />
        </button>
      </span>
    </div>
  );
}

// ─── Current over panel ────────────────────────────────────────────────────
function CurrentOverPanel({
  innings,
  oversLimit,
  isCompleted,
  isInningsClosed,
  battingTeam,
  bowlingTeam,
}) {
  return (
    <section className="match-scorer__current">
      <div className="match-scorer__current-head">
        <div>
          <div className="label">
            {isCompleted
              ? 'Match complete'
              : isInningsClosed
                ? 'Innings closed'
                : `${battingTeam?.short ?? 'Batting'} batting · ${bowlingTeam?.short ?? 'Bowling'} bowling`}
          </div>
          <div className="match-scorer__current-score">
            {innings.runs}/{innings.wickets}
            <span className="match-scorer__current-overs">
              ({formatOvers(innings.legalBalls)} / {oversLimit})
            </span>
          </div>
        </div>
        <div className="match-scorer__current-extras">
          Extras <strong>{innings.extras}</strong>
        </div>
      </div>
      <ThisOverStrip innings={innings} />
    </section>
  );
}

function ThisOverStrip({ innings }) {
  const deliveries = lastOverDeliveries(innings);
  return (
    <div className="this-over">
      <span className="this-over__label">This over</span>
      <div className="this-over__balls">
        {deliveries.length === 0 ? (
          <span className="this-over__empty">
            {innings.legalBalls > 0 ? 'New over starts now' : 'No balls yet'}
          </span>
        ) : (
          deliveries.map((d) => (
            <span
              key={d.id}
              className={`this-over__ball this-over__ball--${d.kind}`}
              title={`${d.label} · ${d.runs} run${d.runs === 1 ? '' : 's'}`}
            >
              {d.label}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Keypad ────────────────────────────────────────────────────────────────
function Keypad({ disabled, onPress }) {
  return (
    <section className="match-scorer__keypad" aria-label="Ball outcome keypad">
      {KEYPAD_ROWS.map((row, i) => (
        <div className="match-scorer__keypad-row" key={i}>
          {row.map((id) => {
            const b = BALL_TYPES.find((bt) => bt.id === id);
            if (!b) return null;
            return (
              <button
                key={b.id}
                type="button"
                className={`scorer-key scorer-key--${b.kind}`}
                disabled={disabled}
                onClick={() => onPress(b.id)}
                title={ballHint(b)}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      ))}
    </section>
  );
}

function ballHint(b) {
  if (b.isWicket) return 'Wicket (legal delivery, no runs)';
  if (!b.isLegal && b.id === 'wide') return 'Wide — 1 extra, ball not counted';
  if (!b.isLegal && b.id === 'noball')
    return 'No-ball — 1 extra, ball not counted';
  if (b.id === 'bye') return 'Bye — 1 run, legal delivery';
  if (b.id === 'legbye') return 'Leg bye — 1 run, legal delivery';
  return `${b.runs} run${b.runs === 1 ? '' : 's'}`;
}

// ─── Full scorecard view ───────────────────────────────────────────────────
function ScorecardView({ match, teamLookup }) {
  return (
    <div className="scorecard-view">
      {match.innings.map((inn, i) => (
        <InningsScorecard
          key={i}
          inningsIdx={i}
          innings={inn}
          oversLimit={match.oversLimit}
          team={teamLookup(inn.battingTeamId)}
          opponent={teamLookup(inn.bowlingTeamId)}
        />
      ))}
    </div>
  );
}

function InningsScorecard({ inningsIdx, innings, oversLimit, team, opponent }) {
  const short = team?.short ?? innings.battingTeamId?.toUpperCase() ?? 'TBD';
  const opponentShort =
    opponent?.short ?? innings.bowlingTeamId?.toUpperCase() ?? 'TBD';
  const battersWhoBatted = innings.batters.filter(
    (b) => b.status !== 'did-not-bat',
  );
  const bowlersWhoBowled = innings.bowlers.filter((b) => b.balls > 0);

  return (
    <article className="scorecard-innings">
      <header className="scorecard-innings__head">
        <span
          className="scorecard-innings__pill"
          style={{ background: teamColors[short] || '#334' }}
        >
          {short}
        </span>
        <div className="scorecard-innings__head-text">
          <div className="label">Innings {inningsIdx + 1}</div>
          <div className="scorecard-innings__title">
            {team?.name ?? short} vs {opponent?.name ?? opponentShort}
          </div>
        </div>
        <div className="scorecard-innings__score">
          <strong>
            {innings.runs}/{innings.wickets}
          </strong>
          <span>
            ({formatOvers(innings.legalBalls)} / {oversLimit})
          </span>
          {innings.extras > 0 && (
            <span className="scorecard-innings__extras">
              · Extras {innings.extras}
            </span>
          )}
        </div>
      </header>

      <section className="scorecard-section">
        <header className="scorecard-section__head">Batting</header>
        {battersWhoBatted.length === 0 ? (
          <div className="scorecard-section__empty">No batting yet</div>
        ) : (
          <table className="scorecard-table">
            <thead>
              <tr>
                <th>Batter</th>
                <th>R</th>
                <th>B</th>
                <th>4s</th>
                <th>6s</th>
                <th>SR</th>
              </tr>
            </thead>
            <tbody>
              {battersWhoBatted.map((b) => (
                <tr
                  key={b.id}
                  className={`scorecard-row scorecard-row--${b.status}`}
                >
                  <td className="scorecard-table__name">
                    <span>{b.name}</span>
                    <span className={`scorecard-tag scorecard-tag--${b.status}`}>
                      {b.status === 'out'
                        ? 'out'
                        : b.status === 'retired-hurt'
                          ? 'retired hurt'
                          : 'not out'}
                    </span>
                  </td>
                  <td>{b.runs}</td>
                  <td>{b.balls}</td>
                  <td>{b.fours}</td>
                  <td>{b.sixes}</td>
                  <td>{b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="scorecard-section">
        <header className="scorecard-section__head">Bowling</header>
        {bowlersWhoBowled.length === 0 ? (
          <div className="scorecard-section__empty">No bowling yet</div>
        ) : (
          <table className="scorecard-table">
            <thead>
              <tr>
                <th>Bowler</th>
                <th>O</th>
                <th>R</th>
                <th>W</th>
                <th>Dots</th>
                <th>Econ</th>
              </tr>
            </thead>
            <tbody>
              {bowlersWhoBowled.map((b) => (
                <tr key={b.id} className="scorecard-row">
                  <td className="scorecard-table__name">{b.name}</td>
                  <td>{formatOvers(b.balls)}</td>
                  <td>{b.runs}</td>
                  <td>{b.wickets}</td>
                  <td>{b.dotBalls}</td>
                  <td>{b.balls > 0 ? ((b.runs / b.balls) * 6).toFixed(2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </article>
  );
}
