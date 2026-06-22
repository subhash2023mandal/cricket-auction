// Tournament + ball-by-ball cricket helpers.
//
// Tournament structure:
//   • Two groups of three teams. Each group is a round-robin (3 matches).
//   • Top two from each group qualify for the semi-finals.
//   • Semi-final winners play the Final.
//
// Knockout matches are seeded with placeholders ("A1", "B2", "SF1") and have
// their actual team IDs auto-resolved by `resolveKnockouts` whenever the source
// matches all complete.
//
// Each innings tracks:
//   • A batter lineup (with status: did-not-bat / batting / out / retired-hurt)
//   • A bowler lineup (with running balls / runs / wickets / dotBalls)
//   • Which two batters are at the crease (strikerIdx / nonStrikerIdx) and
//     which bowler is bowling (currentBowlerId).
// The scoring workflow requires the user to pick openers and the bowler before
// any ball can be recorded, and to pick a replacement after a wicket / retired-
// hurt and a new bowler after every over.

export const MAX_WICKETS = 10;
export const DEFAULT_OVERS = 5;
const LINEUP_SIZE = 11; // T20 playing XI

// ─── Tournament constants ──────────────────────────────────────────────────
export const GROUPS = [
  { id: 'A', name: 'Group A', teamIds: ['kkr', 'mi', 'csk'] },
  { id: 'B', name: 'Group B', teamIds: ['rcb', 'srh', 'dc'] },
];

// ─── Ball types (keypad buttons) ───────────────────────────────────────────
export const BALL_TYPES = [
  { id: 'run-0',  label: '0',  runs: 0, isLegal: true,  isWicket: false, kind: 'dot'    },
  { id: 'run-1',  label: '1',  runs: 1, isLegal: true,  isWicket: false, kind: 'run'    },
  { id: 'run-2',  label: '2',  runs: 2, isLegal: true,  isWicket: false, kind: 'run'    },
  { id: 'run-3',  label: '3',  runs: 3, isLegal: true,  isWicket: false, kind: 'run'    },
  { id: 'run-4',  label: '4',  runs: 4, isLegal: true,  isWicket: false, kind: 'four'   },
  { id: 'run-6',  label: '6',  runs: 6, isLegal: true,  isWicket: false, kind: 'six'    },
  { id: 'wicket', label: 'W',  runs: 0, isLegal: true,  isWicket: true,  kind: 'wicket' },
  { id: 'wide',   label: 'Wd', runs: 1, isLegal: false, isWicket: false, kind: 'extra'  },
  { id: 'noball', label: 'Nb', runs: 1, isLegal: false, isWicket: false, kind: 'extra'  },
  { id: 'bye',    label: 'B',  runs: 1, isLegal: true,  isWicket: false, kind: 'bye'    },
  { id: 'legbye', label: 'Lb', runs: 1, isLegal: true,  isWicket: false, kind: 'bye'    },
];

export function getBallType(id) {
  return BALL_TYPES.find((b) => b.id === id) ?? null;
}

// ─── Lineup construction ───────────────────────────────────────────────────
// Every innings has a fixed-size lineup (11 batters / 11 bowlers per side).
// We pull as many real players as the auction has sold to that team, and pad
// the rest with team-prefixed placeholders ("KKR #5") so the picker is always
// usable even before the auction is complete.
function batterFromSquadPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    status: 'did-not-bat',
  };
}

function bowlerFromSquadPlayer(player) {
  return {
    id: `bowl-${player.id}`,
    name: player.name,
    balls: 0,
    runs: 0,
    wickets: 0,
    dotBalls: 0,
  };
}

function teamLabel(teamId, teamShort) {
  return teamShort ?? (teamId ? String(teamId).toUpperCase() : 'TBD');
}

function buildBattingLineup(squad, teamId, teamShort) {
  const lineup = (squad ?? []).map(batterFromSquadPlayer);
  const label = teamLabel(teamId, teamShort);
  const key = teamId ?? 'tbd';
  while (lineup.length < LINEUP_SIZE) {
    const num = lineup.length + 1;
    lineup.push({
      id: `bat-${key}-${num}`,
      name: `${label} #${num}`,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      status: 'did-not-bat',
    });
  }
  return lineup;
}

function buildBowlingLineup(squad, teamId, teamShort) {
  const lineup = (squad ?? []).map(bowlerFromSquadPlayer);
  const label = teamLabel(teamId, teamShort);
  const key = teamId ?? 'tbd';
  while (lineup.length < LINEUP_SIZE) {
    const num = lineup.length + 1;
    lineup.push({
      id: `bowl-${key}-${num}`,
      name: `${label} #${num}`,
      balls: 0,
      runs: 0,
      wickets: 0,
      dotBalls: 0,
    });
  }
  return lineup;
}

export function makeInnings(
  battingTeamId,
  bowlingTeamId,
  battingSquad = [],
  bowlingSquad = [],
  battingShort = null,
  bowlingShort = null,
) {
  return {
    battingTeamId,
    bowlingTeamId,
    runs: 0,
    wickets: 0,
    legalBalls: 0,
    extras: 0,
    deliveries: [],
    closed: false,
    batters: buildBattingLineup(battingSquad, battingTeamId, battingShort),
    strikerIdx: null,
    nonStrikerIdx: null,
    bowlers: buildBowlingLineup(bowlingSquad, bowlingTeamId, bowlingShort),
    currentBowlerId: null,
    openersSet: false,
  };
}

export function makeMatch({
  id,
  team1Id = null,
  team2Id = null,
  seedTeam1 = null,
  seedTeam2 = null,
  stage = 'group',
  group = null,
  day = 1,
  name = '',
  oversLimit = DEFAULT_OVERS,
  team1Squad = [],
  team2Squad = [],
  team1Short = null,
  team2Short = null,
}) {
  return {
    id,
    stage,
    group,
    day,
    name,
    team1Id,
    team2Id,
    seedTeam1,
    seedTeam2,
    oversLimit,
    status: 'upcoming',
    currentInnings: 0,
    // Scheduled start time of the match — "HH:mm" 24-hour string or null.
    startTimeAt: null,
    // The toss is conducted by the user before scoring starts. Until then
    // `tossWinnerId` / `tossDecision` are null and the first innings is a
    // placeholder built from team1's squad.
    tossWinnerId: null,
    tossDecision: null,
    innings: [
      makeInnings(team1Id, team2Id, team1Squad, team2Squad, team1Short, team2Short),
      makeInnings(team2Id, team1Id, team2Squad, team1Squad, team2Short, team1Short),
    ],
    startedAt: null,
    finishedAt: null,
    result: null,
    winnerTeamId: null,
    createdAt: Date.now(),
  };
}

// Apply a toss result to a match. The "bat" decision means the toss winner
// bats first; "bowl" means they field first. If the match has not started
// (no openers, no balls), the innings batting order is rebuilt to match the
// toss. Once scoring has begun the order is locked and only the toss metadata
// is updated.
export function applyToss(match, tossWinnerId, decision, teamLookup) {
  if (!match.team1Id || !match.team2Id) return match;
  if (tossWinnerId !== match.team1Id && tossWinnerId !== match.team2Id) return match;
  if (decision !== 'bat' && decision !== 'bowl') return match;

  const firstBattingTeamId =
    decision === 'bat'
      ? tossWinnerId
      : tossWinnerId === match.team1Id
        ? match.team2Id
        : match.team1Id;
  const firstBowlingTeamId =
    firstBattingTeamId === match.team1Id ? match.team2Id : match.team1Id;

  const hasStarted = match.innings.some(
    (inn) =>
      (inn.deliveries?.length ?? 0) > 0 ||
      inn.openersSet ||
      inn.currentBowlerId != null,
  );

  // If the chosen batting team already opens innings 0, just record the toss.
  if (
    hasStarted ||
    match.innings[0].battingTeamId === firstBattingTeamId
  ) {
    return { ...match, tossWinnerId, tossDecision: decision };
  }

  // Rebuild innings with the new batting order.
  const batTeam = teamLookup?.(firstBattingTeamId) ?? null;
  const bowlTeam = teamLookup?.(firstBowlingTeamId) ?? null;
  return {
    ...match,
    tossWinnerId,
    tossDecision: decision,
    innings: [
      makeInnings(
        firstBattingTeamId,
        firstBowlingTeamId,
        batTeam?.squad ?? [],
        bowlTeam?.squad ?? [],
        batTeam?.short,
        bowlTeam?.short,
      ),
      makeInnings(
        firstBowlingTeamId,
        firstBattingTeamId,
        bowlTeam?.squad ?? [],
        batTeam?.squad ?? [],
        bowlTeam?.short,
        batTeam?.short,
      ),
    ],
  };
}

// Backfill any new innings fields when loading older persisted state. If the
// match hasn't started yet we also refresh the lineups from the current
// squads, so the picker only shows real squad players (and the lists adjust as
// auction sales come in).
export function ensureBatters(match, teamLookup) {
  // Backfill match-level fields added in later schema versions.
  match = {
    ...match,
    startTimeAt: match.startTimeAt ?? null,
    tossWinnerId: match.tossWinnerId ?? null,
    tossDecision: match.tossDecision ?? null,
  };
  const innings = match.innings.map((inn) => {
    const battingTeam = inn.battingTeamId ? teamLookup(inn.battingTeamId) : null;
    const bowlingTeam = inn.bowlingTeamId ? teamLookup(inn.bowlingTeamId) : null;

    let next = inn;
    const fresh =
      (next.deliveries?.length ?? 0) === 0 &&
      !next.openersSet &&
      next.currentBowlerId == null;

    if (
      !Array.isArray(next.batters) ||
      next.batters.length === 0 ||
      fresh
    ) {
      next = {
        ...next,
        batters: buildBattingLineup(
          battingTeam?.squad ?? [],
          next.battingTeamId,
          battingTeam?.short,
        ),
        strikerIdx: null,
        nonStrikerIdx: null,
        openersSet: false,
      };
    } else if (next.batters.some((b) => b.status == null)) {
      // Pre-status batter list — give every existing entry a sensible default.
      next = {
        ...next,
        batters: next.batters.map((b, i) => ({
          ...b,
          status:
            b.status ??
            (i === next.strikerIdx || i === next.nonStrikerIdx
              ? 'batting'
              : b.balls > 0 || b.runs > 0
                ? 'out'
                : 'did-not-bat'),
        })),
        openersSet: next.openersSet ?? next.deliveries.length > 0,
      };
    }
    if (!Array.isArray(next.bowlers) || fresh) {
      next = {
        ...next,
        bowlers: buildBowlingLineup(
          bowlingTeam?.squad ?? [],
          next.bowlingTeamId,
          bowlingTeam?.short,
        ),
        currentBowlerId: null,
      };
    }
    return next;
  });
  return { ...match, innings };
}

// Rebuild lineups for every match that hasn't started yet, using the latest
// team squads. Use this after the auction state changes so the picker stays
// in sync with whatever players the teams actually own.
export function refreshFreshLineups(matches, teams) {
  const teamLookup = (id) => teams.find((t) => t.id === id) ?? null;
  return matches.map((m) => ensureBatters(m, teamLookup));
}

// ─── Setup actions (before scoring) ────────────────────────────────────────
export function setOpenersInInnings(innings, strikerId, nonStrikerId) {
  if (innings.openersSet) return innings;
  if (strikerId === nonStrikerId) return innings;
  const sIdx = innings.batters.findIndex((b) => b.id === strikerId);
  const nIdx = innings.batters.findIndex((b) => b.id === nonStrikerId);
  if (sIdx < 0 || nIdx < 0) return innings;
  return {
    ...innings,
    batters: innings.batters.map((b, i) =>
      i === sIdx || i === nIdx ? { ...b, status: 'batting' } : b,
    ),
    strikerIdx: sIdx,
    nonStrikerIdx: nIdx,
    openersSet: true,
  };
}

export function setNextBatterInInnings(innings, batterId) {
  // Place the new batter into whichever crease slot is currently empty.
  const slot =
    innings.strikerIdx == null
      ? 'striker'
      : innings.nonStrikerIdx == null
        ? 'nonStriker'
        : null;
  if (!slot) return innings;
  const idx = innings.batters.findIndex(
    (b) => b.id === batterId && b.status === 'did-not-bat',
  );
  if (idx < 0) return innings;
  const updatedBatters = innings.batters.map((b, i) =>
    i === idx ? { ...b, status: 'batting' } : b,
  );
  return {
    ...innings,
    batters: updatedBatters,
    strikerIdx: slot === 'striker' ? idx : innings.strikerIdx,
    nonStrikerIdx: slot === 'nonStriker' ? idx : innings.nonStrikerIdx,
  };
}

export function retireBatterInInnings(innings, batterId) {
  const idx = innings.batters.findIndex(
    (b) => b.id === batterId && b.status === 'batting',
  );
  if (idx < 0) return innings;
  const updatedBatters = innings.batters.map((b, i) =>
    i === idx ? { ...b, status: 'retired-hurt' } : b,
  );
  return {
    ...innings,
    batters: updatedBatters,
    // Empty the crease slot that held this batter so the user is prompted to
    // pick a replacement.
    strikerIdx: innings.strikerIdx === idx ? null : innings.strikerIdx,
    nonStrikerIdx: innings.nonStrikerIdx === idx ? null : innings.nonStrikerIdx,
  };
}

export function setBowlerInInnings(innings, bowlerId) {
  if (!innings.bowlers.some((b) => b.id === bowlerId)) return innings;
  return { ...innings, currentBowlerId: bowlerId };
}

export function renameBatterInInnings(innings, batterId, name) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return innings;
  return {
    ...innings,
    batters: innings.batters.map((b) =>
      b.id === batterId ? { ...b, name: trimmed } : b,
    ),
  };
}

export function renameBowlerInInnings(innings, bowlerId, name) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return innings;
  return {
    ...innings,
    bowlers: innings.bowlers.map((b) =>
      b.id === bowlerId ? { ...b, name: trimmed } : b,
    ),
  };
}

export function swapStrikeInInnings(innings) {
  if (innings.strikerIdx == null || innings.nonStrikerIdx == null) return innings;
  return {
    ...innings,
    strikerIdx: innings.nonStrikerIdx,
    nonStrikerIdx: innings.strikerIdx,
  };
}

// ─── Per-ball deltas ───────────────────────────────────────────────────────
function batterDeltaForBall(ballType) {
  switch (ballType.id) {
    case 'wide':
    case 'noball':
      return { addedRuns: 0, addedBalls: 0, addedFours: 0, addedSixes: 0, outAdded: false };
    case 'bye':
    case 'legbye':
      return { addedRuns: 0, addedBalls: 1, addedFours: 0, addedSixes: 0, outAdded: false };
    case 'wicket':
      return { addedRuns: 0, addedBalls: 1, addedFours: 0, addedSixes: 0, outAdded: true };
    default: {
      const r = ballType.runs;
      return {
        addedRuns: r,
        addedBalls: 1,
        addedFours: r === 4 ? 1 : 0,
        addedSixes: r === 6 ? 1 : 0,
        outAdded: false,
      };
    }
  }
}

function bowlerDeltaForBall(ballType) {
  // Bowler accounting (simplified):
  //   • Balls: only legal deliveries count.
  //   • Runs: everything except byes / leg byes (those aren't the bowler's
  //     fault).
  //   • Wickets: all wicket types credit the bowler.
  //   • Dot balls: legal deliveries that scored 0 (incl. wickets that produced
  //     no runs).
  const isBye = ballType.id === 'bye' || ballType.id === 'legbye';
  const isLegal = ballType.isLegal;
  return {
    addedBalls: isLegal ? 1 : 0,
    addedRuns: isBye ? 0 : ballType.runs,
    addedWickets: ballType.isWicket ? 1 : 0,
    addedDots:
      isLegal && !isBye && ballType.runs === 0 && !ballType.isWicket ? 1 : 0,
  };
}

// ─── Apply / undo a delivery ───────────────────────────────────────────────
export function canScore(innings) {
  return (
    !innings.closed &&
    innings.openersSet &&
    innings.strikerIdx != null &&
    innings.nonStrikerIdx != null &&
    innings.currentBowlerId != null
  );
}

export function applyBall(innings, ballType) {
  if (!canScore(innings)) return innings;

  const isLegal = ballType.isLegal;
  const isWicket = ballType.isWicket;
  const newLegalBalls = innings.legalBalls + (isLegal ? 1 : 0);
  const endOfOver = isLegal && newLegalBalls > 0 && newLegalBalls % 6 === 0;

  const preStrikerIdx = innings.strikerIdx;
  const preNonStrikerIdx = innings.nonStrikerIdx;
  const preCurrentBowlerId = innings.currentBowlerId;
  const preStrikerId = innings.batters[preStrikerIdx]?.id ?? null;

  // ── Batter updates ──
  const bDelta = batterDeltaForBall(ballType);
  let batters = innings.batters.map((b, i) =>
    i === preStrikerIdx
      ? {
          ...b,
          runs: b.runs + bDelta.addedRuns,
          balls: b.balls + bDelta.addedBalls,
          fours: b.fours + bDelta.addedFours,
          sixes: b.sixes + bDelta.addedSixes,
          status: bDelta.outAdded ? 'out' : b.status,
        }
      : b,
  );

  let strikerIdx = preStrikerIdx;
  let nonStrikerIdx = preNonStrikerIdx;
  if (bDelta.outAdded) {
    // Empty the striker slot — the user must pick a replacement before the
    // next ball can be bowled.
    strikerIdx = null;
  }
  // Strike rotation. We allow swapping even when one side is null (e.g.,
  // wicket on the last ball of the over): the null slot just moves with the
  // swap, and the replacement batter walks in at whichever end is open.
  if (bDelta.addedRuns % 2 === 1) {
    [strikerIdx, nonStrikerIdx] = [nonStrikerIdx, strikerIdx];
  }
  if (endOfOver) {
    [strikerIdx, nonStrikerIdx] = [nonStrikerIdx, strikerIdx];
  }

  // ── Bowler updates ──
  const bowDelta = bowlerDeltaForBall(ballType);
  const bowlers = innings.bowlers.map((b) =>
    b.id === preCurrentBowlerId
      ? {
          ...b,
          balls: b.balls + bowDelta.addedBalls,
          runs: b.runs + bowDelta.addedRuns,
          wickets: b.wickets + bowDelta.addedWickets,
          dotBalls: b.dotBalls + bowDelta.addedDots,
        }
      : b,
  );
  // End of over: require a fresh bowler pick.
  const nextBowlerId = endOfOver ? null : preCurrentBowlerId;

  const delivery = {
    id: innings.deliveries.length + 1,
    label: ballType.label,
    runs: ballType.runs,
    isLegal,
    isWicket,
    kind: ballType.kind,
    timestamp: Date.now(),
    endOfOver,
    batter: {
      strikerId: preStrikerId,
      addedRuns: bDelta.addedRuns,
      addedBalls: bDelta.addedBalls,
      addedFours: bDelta.addedFours,
      addedSixes: bDelta.addedSixes,
      outAdded: bDelta.outAdded,
      preStrikerIdx,
      preNonStrikerIdx,
    },
    bowler: {
      bowlerId: preCurrentBowlerId,
      addedBalls: bowDelta.addedBalls,
      addedRuns: bowDelta.addedRuns,
      addedWickets: bowDelta.addedWickets,
      addedDots: bowDelta.addedDots,
      preCurrentBowlerId,
    },
  };

  return {
    ...innings,
    runs: innings.runs + ballType.runs,
    wickets: innings.wickets + (isWicket ? 1 : 0),
    legalBalls: newLegalBalls,
    extras: innings.extras + (isLegal ? 0 : ballType.runs),
    deliveries: [...innings.deliveries, delivery],
    batters,
    strikerIdx,
    nonStrikerIdx,
    bowlers,
    currentBowlerId: nextBowlerId,
  };
}

export function undoBall(innings) {
  if (innings.deliveries.length === 0) return innings;
  const last = innings.deliveries[innings.deliveries.length - 1];

  let batters = innings.batters;
  let strikerIdx = innings.strikerIdx;
  let nonStrikerIdx = innings.nonStrikerIdx;
  let bowlers = innings.bowlers;
  let currentBowlerId = innings.currentBowlerId;

  if (last.batter) {
    batters = batters.map((b) =>
      b.id === last.batter.strikerId
        ? {
            ...b,
            runs: Math.max(0, b.runs - last.batter.addedRuns),
            balls: Math.max(0, b.balls - last.batter.addedBalls),
            fours: Math.max(0, b.fours - last.batter.addedFours),
            sixes: Math.max(0, b.sixes - last.batter.addedSixes),
            status: last.batter.outAdded ? 'batting' : b.status,
          }
        : b,
    );
    // If a replacement batter walked in after the wicket (so a 'did-not-bat'
    // batter is now 'batting' that wasn't before), reset them back. We detect
    // this by checking who is currently in a crease slot that doesn't match
    // the original.
    const pre = { strikerIdx: last.batter.preStrikerIdx, nonStrikerIdx: last.batter.preNonStrikerIdx };
    [innings.strikerIdx, innings.nonStrikerIdx].forEach((curIdx) => {
      if (curIdx == null) return;
      if (curIdx === pre.strikerIdx || curIdx === pre.nonStrikerIdx) return;
      // This batter was brought in after the wicket — revert them.
      batters = batters.map((b, i) =>
        i === curIdx ? { ...b, status: 'did-not-bat' } : b,
      );
    });
    strikerIdx = pre.strikerIdx;
    nonStrikerIdx = pre.nonStrikerIdx;
  }

  if (last.bowler) {
    bowlers = bowlers.map((b) =>
      b.id === last.bowler.bowlerId
        ? {
            ...b,
            balls: Math.max(0, b.balls - last.bowler.addedBalls),
            runs: Math.max(0, b.runs - last.bowler.addedRuns),
            wickets: Math.max(0, b.wickets - last.bowler.addedWickets),
            dotBalls: Math.max(0, b.dotBalls - last.bowler.addedDots),
          }
        : b,
    );
    currentBowlerId = last.bowler.preCurrentBowlerId;
  }

  return {
    ...innings,
    runs: Math.max(0, innings.runs - last.runs),
    wickets: Math.max(0, innings.wickets - (last.isWicket ? 1 : 0)),
    legalBalls: Math.max(0, innings.legalBalls - (last.isLegal ? 1 : 0)),
    extras: Math.max(0, innings.extras - (last.isLegal ? 0 : last.runs)),
    deliveries: innings.deliveries.slice(0, -1),
    closed: false,
    batters,
    strikerIdx,
    nonStrikerIdx,
    bowlers,
    currentBowlerId,
  };
}

// ─── Innings / over helpers ────────────────────────────────────────────────
export function isInningsOver(innings, oversLimit) {
  return innings.legalBalls >= oversLimit * 6 || innings.wickets >= MAX_WICKETS;
}

export function formatOvers(legalBalls) {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

export function lastOverDeliveries(innings) {
  const buffer = [];
  let legalCount = 0;
  for (const d of innings.deliveries) {
    if (legalCount > 0 && legalCount % 6 === 0) buffer.length = 0;
    buffer.push(d);
    if (d.isLegal) legalCount += 1;
  }
  if (
    buffer.length > 0 &&
    buffer[buffer.length - 1].isLegal &&
    legalCount > 0 &&
    legalCount % 6 === 0
  ) {
    return [];
  }
  return buffer;
}

// Who bowled the previous over (the bowler of the last legal delivery)? Used
// to exclude that bowler from the "pick bowler" picker.
export function previousOverBowlerId(innings) {
  if (innings.deliveries.length === 0) return null;
  // The previous over's bowler is whoever bowled the very last delivery.
  return innings.deliveries[innings.deliveries.length - 1]?.bowler?.bowlerId ?? null;
}

export function availableBatters(innings) {
  return innings.batters.filter((b) => b.status === 'did-not-bat');
}

export function activeBatters(innings) {
  return {
    striker:
      innings.strikerIdx != null ? innings.batters[innings.strikerIdx] : null,
    nonStriker:
      innings.nonStrikerIdx != null
        ? innings.batters[innings.nonStrikerIdx]
        : null,
  };
}

export function getBowler(innings, id) {
  if (!id) return null;
  return innings.bowlers.find((b) => b.id === id) ?? null;
}

// ─── Finalising a match ────────────────────────────────────────────────────
export function finalizeMatchIfDone(match, teamLookup) {
  const idx = match.currentInnings;
  const innings = match.innings[idx];
  const target = idx === 1 ? match.innings[0].runs + 1 : null;
  const secondInningsWin = target != null && innings.runs >= target;
  if (!isInningsOver(innings, match.oversLimit) && !secondInningsWin) return match;

  const closedAll = match.innings.map((inn, i) =>
    i === idx ? { ...inn, closed: true } : inn,
  );
  if (idx === 0) return { ...match, innings: closedAll, currentInnings: 1 };
  return completeMatch({ ...match, innings: closedAll }, teamLookup);
}

export function completeMatch(match, teamLookup) {
  const [inn1, inn2] = match.innings;
  let winnerTeamId = null;
  let result = 'Match tied';
  const t1Short = teamLookup(match.team1Id)?.short ?? match.team1Id?.toUpperCase() ?? 'Team 1';
  const t2Short = teamLookup(match.team2Id)?.short ?? match.team2Id?.toUpperCase() ?? 'Team 2';
  if (inn1.runs > inn2.runs) {
    winnerTeamId = match.team1Id;
    result = `${t1Short} won by ${inn1.runs - inn2.runs} runs`;
  } else if (inn2.runs > inn1.runs) {
    winnerTeamId = match.team2Id;
    const wicketsLeft = MAX_WICKETS - inn2.wickets;
    result = `${t2Short} won by ${wicketsLeft} wicket${wicketsLeft === 1 ? '' : 's'}`;
  }
  return {
    ...match,
    status: 'completed',
    finishedAt: Date.now(),
    result,
    winnerTeamId,
  };
}

// ─── Group standings & knockout resolution ─────────────────────────────────
function emptyStanding(teamId) {
  return {
    teamId,
    played: 0,
    won: 0,
    lost: 0,
    tied: 0,
    points: 0,
    runsFor: 0,
    ballsFor: 0,
    runsAgainst: 0,
    ballsAgainst: 0,
    nrr: 0,
  };
}

export function computeGroupStandings(matches, groupTeamIds) {
  const stats = Object.fromEntries(groupTeamIds.map((id) => [id, emptyStanding(id)]));

  matches.forEach((m) => {
    if (m.stage !== 'group') return;
    if (m.status !== 'completed') return;
    if (!stats[m.team1Id] || !stats[m.team2Id]) return;

    const t1 = stats[m.team1Id];
    const t2 = stats[m.team2Id];
    t1.played += 1;
    t2.played += 1;

    m.innings.forEach((inn) => {
      const battingStat = stats[inn.battingTeamId];
      const bowlingStat = stats[inn.bowlingTeamId];
      const ballsCounted =
        inn.wickets >= MAX_WICKETS ? m.oversLimit * 6 : inn.legalBalls;
      if (battingStat) {
        battingStat.runsFor += inn.runs;
        battingStat.ballsFor += ballsCounted;
      }
      if (bowlingStat) {
        bowlingStat.runsAgainst += inn.runs;
        bowlingStat.ballsAgainst += ballsCounted;
      }
    });

    if (m.winnerTeamId === m.team1Id) {
      t1.won += 1;
      t2.lost += 1;
      t1.points += 2;
    } else if (m.winnerTeamId === m.team2Id) {
      t2.won += 1;
      t1.lost += 1;
      t2.points += 2;
    } else {
      t1.tied += 1;
      t2.tied += 1;
      t1.points += 1;
      t2.points += 1;
    }
  });

  Object.values(stats).forEach((s) => {
    const runRate = s.ballsFor > 0 ? (s.runsFor / s.ballsFor) * 6 : 0;
    const concRate = s.ballsAgainst > 0 ? (s.runsAgainst / s.ballsAgainst) * 6 : 0;
    s.nrr = Number((runRate - concRate).toFixed(3));
  });

  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.nrr !== a.nrr) return b.nrr - a.nrr;
    return a.teamId.localeCompare(b.teamId);
  });
}

function isGroupComplete(matches, groupId) {
  const groupMatches = matches.filter((m) => m.stage === 'group' && m.group === groupId);
  return groupMatches.length > 0 && groupMatches.every((m) => m.status === 'completed');
}

function isMatchScored(match) {
  return match.innings.some((inn) => inn.deliveries.length > 0);
}

export function resolveKnockouts(matches, teams = []) {
  const groupAComplete = isGroupComplete(matches, 'A');
  const groupBComplete = isGroupComplete(matches, 'B');

  let standingsA = null;
  let standingsB = null;
  if (groupAComplete) {
    standingsA = computeGroupStandings(
      matches,
      GROUPS.find((g) => g.id === 'A').teamIds,
    );
  }
  if (groupBComplete) {
    standingsB = computeGroupStandings(
      matches,
      GROUPS.find((g) => g.id === 'B').teamIds,
    );
  }

  const teamLookup = (id) => (id ? teams.find((t) => t.id === id) : null);

  const seedToTeamId = (seed) => {
    if (!seed) return null;
    if (seed === 'A1' && standingsA) return standingsA[0]?.teamId ?? null;
    if (seed === 'A2' && standingsA) return standingsA[1]?.teamId ?? null;
    if (seed === 'B1' && standingsB) return standingsB[0]?.teamId ?? null;
    if (seed === 'B2' && standingsB) return standingsB[1]?.teamId ?? null;
    if (seed === 'SF1') {
      const sf1 = matches.find((m) => m.stage === 'semi' && m.name === 'Semi-Final 1');
      return sf1?.status === 'completed' ? sf1.winnerTeamId : null;
    }
    if (seed === 'SF2') {
      const sf2 = matches.find((m) => m.stage === 'semi' && m.name === 'Semi-Final 2');
      return sf2?.status === 'completed' ? sf2.winnerTeamId : null;
    }
    return null;
  };

  let changed = false;
  const resolved = matches.map((m) => {
    if (m.stage === 'group') return m;
    if (isMatchScored(m)) return m;

    const nextTeam1 = seedToTeamId(m.seedTeam1);
    const nextTeam2 = seedToTeamId(m.seedTeam2);
    if (nextTeam1 === m.team1Id && nextTeam2 === m.team2Id) return m;

    changed = true;
    const t1 = teamLookup(nextTeam1);
    const t2 = teamLookup(nextTeam2);
    const t1Squad = t1?.squad ?? [];
    const t2Squad = t2?.squad ?? [];
    return {
      ...m,
      team1Id: nextTeam1,
      team2Id: nextTeam2,
      innings: [
        makeInnings(nextTeam1, nextTeam2, t1Squad, t2Squad, t1?.short, t2?.short),
        makeInnings(nextTeam2, nextTeam1, t2Squad, t1Squad, t2?.short, t1?.short),
      ],
    };
  });

  return changed ? resolved : matches;
}

// Format a "HH:mm" 24-hour string as a 12-hour label ("2:30 PM"). Returns
// null if the input is empty / falsy.
export function formatStartTime(time) {
  if (!time || typeof time !== 'string') return null;
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function placeholderLabelForSeed(seed) {
  switch (seed) {
    case 'A1':  return 'Group A · 1st';
    case 'A2':  return 'Group A · 2nd';
    case 'B1':  return 'Group B · 1st';
    case 'B2':  return 'Group B · 2nd';
    case 'SF1': return 'Semi-Final 1 Winner';
    case 'SF2': return 'Semi-Final 2 Winner';
    default:    return 'TBD';
  }
}

// ─── Tournament seeding ────────────────────────────────────────────────────
function groupRoundRobin(teamIds) {
  const out = [];
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      out.push([teamIds[i], teamIds[j]]);
    }
  }
  return out;
}

export function seedMatches(teams) {
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const matches = [];
  let counter = 1;

  GROUPS.forEach((group, gi) => {
    groupRoundRobin(group.teamIds).forEach((pair) => {
      matches.push(
        makeMatch({
          id: `match-${counter}`,
          stage: 'group',
          group: group.id,
          day: gi + 1,
          name: `Match ${counter}`,
          team1Id: pair[0],
          team2Id: pair[1],
          team1Squad: teamById[pair[0]]?.squad ?? [],
          team2Squad: teamById[pair[1]]?.squad ?? [],
          team1Short: teamById[pair[0]]?.short,
          team2Short: teamById[pair[1]]?.short,
        }),
      );
      counter += 1;
    });
  });

  matches.push(
    makeMatch({
      id: `match-${counter}`,
      stage: 'semi',
      day: 3,
      name: 'Semi-Final 1',
      seedTeam1: 'A1',
      seedTeam2: 'B2',
    }),
  );
  counter += 1;
  matches.push(
    makeMatch({
      id: `match-${counter}`,
      stage: 'semi',
      day: 3,
      name: 'Semi-Final 2',
      seedTeam1: 'B1',
      seedTeam2: 'A2',
    }),
  );
  counter += 1;

  matches.push(
    makeMatch({
      id: `match-${counter}`,
      stage: 'final',
      day: 3,
      name: 'Final',
      seedTeam1: 'SF1',
      seedTeam2: 'SF2',
    }),
  );

  return matches;
}
