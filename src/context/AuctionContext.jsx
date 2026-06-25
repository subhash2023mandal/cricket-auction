import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { players as allPlayers } from '../data/players';
import { load, save, reset as resetStorage, STORAGE_VERSION } from '../utils/storage';
import { shuffle, nextBidAmount } from '../utils/auction';
import {
  applyBall,
  applyToss,
  canScore,
  completeMatch,
  ensureBatters,
  finalizeMatchIfDone,
  getBallType,
  makeMatch,
  refreshFreshLineups,
  renameBatterInInnings,
  renameBowlerInInnings,
  resolveKnockouts,
  retireBatterInInnings,
  seedMatches,
  setBowlerInInnings,
  setNextBatterInInnings,
  setOpenersInInnings,
  swapStrikeInInnings,
  undoBall,
} from '../utils/match';

// ─── Constants ──────────────────────────────────────────────────────────────
const TEAMS = [
  { id: 'vv', name: 'Voltage Vipers',     short: 'VV' },
  { id: 'tt', name: 'Thunder Titans',     short: 'TT' },
  { id: 'ss', name: 'Surge Strikers',     short: 'SS' },
  { id: 'pp', name: 'Plasma Panthers',    short: 'PP' },
  { id: 'cs', name: 'Circuit Spartans',   short: 'CS' },
  { id: 'nk', name: 'Neon Knights',       short: 'NK' },
];
const ORGANIZER_ID = 'organizer';
const INITIAL_PURSE_LAKH = 10000; // 100 Cr per franchise
const SQUAD_LIMIT = 11;
const MAX_BID_HISTORY = 4;

// One player per franchise is pre-allocated before the live auction starts.
// Each is recorded as a ₹5 Cr (500 L) sale: added to the team's squad,
// deducted from the purse, and listed in soldHistory.
const PREASSIGNED_SALE_LAKH = 500;
const PREASSIGNMENTS = [
  { teamId: 'vv', playerId: 'p036' }, // Voltage Vipers   → Parvez Khandakar
  { teamId: 'tt', playerId: 'p021' }, // Thunder Titans   → Madhav (Madhavendra)
  { teamId: 'ss', playerId: 'p018' }, // Surge Strikers   → Debesh Pattanaik
  { teamId: 'pp', playerId: 'p012' }, // Plasma Panthers  → Harsh Mani Tripathi
  { teamId: 'cs', playerId: 'p005' }, // Circuit Spartans → Amit Pandey (Amit Kumar Pandey)
  { teamId: 'nk', playerId: 'p072' }, // Neon Knights     → Pankaj
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function newCurrentFrom(player) {
  if (!player) return null;
  return {
    player,
    currentPriceLakh: player.basePriceLakh,
    highestBidderId: null,
    startedAt: Date.now(),
  };
}

function makeBidId() {
  return `bid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// After a SOLD or UNSOLD action, work out the next player. If the active pool
// is empty but the organizer (unsold pile) has players, we start a new round —
// the unsold pile gets shuffled back into a fresh pool and the round counter
// ticks up.
function advanceAfterAction({ pool, teams, round }) {
  if (pool.length > 0) {
    const [next, ...rest] = pool;
    return { current: newCurrentFrom(next), pool: rest, teams, round };
  }

  const organizer = teams.find((t) => t.isOrganizer);
  if (organizer && organizer.squad.length > 0) {
    // Drop the per-sale metadata so re-listed players look fresh.
    const recycled = shuffle(organizer.squad).map(
      // eslint-disable-next-line no-unused-vars
      ({ soldPriceLakh, soldAt, ...player }) => player,
    );
    const [next, ...remaining] = recycled;
    const updatedTeams = teams.map((t) =>
      t.isOrganizer ? { ...t, squad: [] } : t,
    );
    return {
      current: newCurrentFrom(next),
      pool: remaining,
      teams: updatedTeams,
      round: round + 1,
    };
  }

  return { current: null, pool: [], teams, round };
}

// ─── Initial / seed state ───────────────────────────────────────────────────
export function seedState() {
  const now = Date.now();
  const playerById = Object.fromEntries(allPlayers.map((p) => [p.id, p]));

  // Resolve the pre-assignments into concrete player records, skipping any
  // entry whose player id no longer exists (defensive against roster edits).
  const resolvedPre = PREASSIGNMENTS
    .map((p) => ({ ...p, player: playerById[p.playerId] }))
    .filter((p) => p.player);
  const preassignedIds = new Set(resolvedPre.map((p) => p.playerId));
  const preByTeam = Object.fromEntries(resolvedPre.map((p) => [p.teamId, p]));

  // Pool excludes the pre-assigned players.
  const remaining = allPlayers.filter((p) => !preassignedIds.has(p.id));
  const shuffled = shuffle(remaining);
  const [first, ...rest] = shuffled;

  const teams = [
    ...TEAMS.map((t) => {
      const pre = preByTeam[t.id];
      const squad = pre
        ? [{ ...pre.player, soldPriceLakh: PREASSIGNED_SALE_LAKH, soldAt: now }]
        : [];
      return {
        ...t,
        initialPurseLakh: INITIAL_PURSE_LAKH,
        purseLakh: INITIAL_PURSE_LAKH - (pre ? PREASSIGNED_SALE_LAKH : 0),
        squad,
        maxSquad: SQUAD_LIMIT,
        isOrganizer: false,
      };
    }),
    {
      id: ORGANIZER_ID,
      name: 'Unsold Pool',
      short: 'ORG',
      initialPurseLakh: 0,
      purseLakh: 0,
      squad: [],
      maxSquad: allPlayers.length,
      isOrganizer: true,
    },
  ];

  const soldHistory = resolvedPre.map((p) => ({
    playerId: p.player.id,
    playerName: p.player.name,
    teamId: p.teamId,
    priceLakh: PREASSIGNED_SALE_LAKH,
    timestamp: now,
  }));

  return {
    version: STORAGE_VERSION,
    round: 1,
    pool: rest,
    current: newCurrentFrom(first),
    teams,
    bidHistory: [],
    soldHistory,
    matches: seedMatches(teams),
  };
}

// Backfill missing slices when loading older persisted state so saved auctions
// (and saved match scoring) survive across feature additions.
function migrate(loaded) {
  let next = loaded;
  // Lift any team that's still on an older squad cap up to the current
  // SQUAD_LIMIT (without wiping any picks they've already made).
  if (Array.isArray(next.teams)) {
    next = {
      ...next,
      teams: next.teams.map((t) =>
        t.isOrganizer || t.maxSquad >= SQUAD_LIMIT
          ? t
          : { ...t, maxSquad: SQUAD_LIMIT },
      ),
    };
  }
  if (!Array.isArray(next.matches) || next.matches.length === 0) {
    next = { ...next, matches: seedMatches(next.teams) };
  }
  // Backfill any structural fields that older saved states might be missing
  // (stage, day, seedTeam1, seedTeam2, group, name) by aligning each match
  // with the canonical fixture template by id. Live scoring data is preserved.
  const canonical = seedMatches(next.teams);
  const canonicalById = Object.fromEntries(canonical.map((m) => [m.id, m]));
  next = {
    ...next,
    matches: next.matches.map((m) => {
      const canon = canonicalById[m.id];
      if (!canon) return m;
      const stage = m.stage ?? canon.stage;
      // A group match that was saved with no team IDs (older buggy state) is
      // effectively a blank slate — just replace it with the canonical entry so
      // its innings, lineups and seed data are all consistent.
      const hasNeverScored =
        m.status !== 'completed' &&
        m.status !== 'live' &&
        !m.startedAt &&
        (m.innings ?? []).every((inn) => (inn?.deliveries?.length ?? 0) === 0);
      if (
        stage === 'group' &&
        canon.team1Id &&
        canon.team2Id &&
        (!m.team1Id || !m.team2Id) &&
        hasNeverScored
      ) {
        return { ...canon, startTimeAt: m.startTimeAt ?? null };
      }
      return {
        ...m,
        stage,
        group: m.group ?? canon.group,
        name: m.name || canon.name,
        // Always pull the day/seed from the canonical schedule so historical
        // off-by-one fixtures get aligned (e.g. final used to be on day 4).
        day: canon.day,
        seedTeam1: m.seedTeam1 ?? canon.seedTeam1 ?? null,
        seedTeam2: m.seedTeam2 ?? canon.seedTeam2 ?? null,
      };
    }),
  };
  // Add any matches that exist in the canonical fixture but are missing from
  // saved state (e.g. older saves that didn't include knockouts).
  const knownIds = new Set(next.matches.map((m) => m.id));
  const missing = canonical.filter((m) => !knownIds.has(m.id));
  if (missing.length > 0) {
    next = { ...next, matches: [...next.matches, ...missing] };
  }

  const teamLookup = (id) => next.teams.find((t) => t.id === id);
  next = {
    ...next,
    matches: next.matches.map((m) => ensureBatters(m, teamLookup)),
  };
  // Knockout team IDs may need to be (re)populated based on current state.
  next = { ...next, matches: resolveKnockouts(next.matches, next.teams) };
  return next;
}

function updateMatch(state, matchId, updater) {
  const matches = state.matches.map((m) => (m.id === matchId ? updater(m) : m));
  // After every match mutation we re-run the knockout resolver so semis pick
  // up the latest group standings, and the final picks up the latest semi
  // winners. The resolver is a no-op for matches that already have scoring.
  return { ...state, matches: resolveKnockouts(matches, state.teams) };
}

// ─── Reducer ────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'BID': {
      if (!state.current) return state;
      const { teamId } = action;
      const team = state.teams.find((t) => t.id === teamId);
      if (!team || team.isOrganizer) return state;
      if (state.current.highestBidderId === teamId) return state; // can't outbid self
      if (team.squad.length >= team.maxSquad) return state;

      const hasBids = state.current.highestBidderId != null;
      const amountLakh = nextBidAmount(
        state.current.currentPriceLakh,
        state.current.player.basePriceLakh,
        hasBids,
      );
      if (team.purseLakh < amountLakh) return state;

      const bid = {
        id: makeBidId(),
        teamId,
        teamShort: team.short,
        amountLakh,
        timestamp: Date.now(),
      };

      return {
        ...state,
        current: {
          ...state.current,
          currentPriceLakh: amountLakh,
          highestBidderId: teamId,
        },
        bidHistory: [bid, ...state.bidHistory].slice(0, MAX_BID_HISTORY),
      };
    }

    case 'SOLD': {
      if (!state.current) return state;
      const { player, currentPriceLakh, highestBidderId } = state.current;
      if (!highestBidderId) return state; // need a bidder to sell

      const teamsAfterSale = state.teams.map((t) => {
        if (t.id !== highestBidderId) return t;
        return {
          ...t,
          purseLakh: Math.max(0, t.purseLakh - currentPriceLakh),
          squad: [
            ...t.squad,
            { ...player, soldPriceLakh: currentPriceLakh, soldAt: Date.now() },
          ],
        };
      });

      const next = advanceAfterAction({
        pool: state.pool,
        teams: teamsAfterSale,
        round: state.round ?? 1,
      });

      return {
        ...state,
        ...next,
        matches: refreshFreshLineups(state.matches, next.teams),
        bidHistory: [],
        soldHistory: [
          ...state.soldHistory,
          {
            playerId: player.id,
            playerName: player.name,
            teamId: highestBidderId,
            priceLakh: currentPriceLakh,
            timestamp: Date.now(),
          },
        ],
      };
    }

    case 'UNSOLD': {
      if (!state.current) return state;
      const { player } = state.current;
      const teamsAfterUnsold = state.teams.map((t) =>
        t.id === ORGANIZER_ID
          ? {
              ...t,
              squad: [
                ...t.squad,
                { ...player, soldPriceLakh: 0, soldAt: Date.now() },
              ],
            }
          : t,
      );

      const next = advanceAfterAction({
        pool: state.pool,
        teams: teamsAfterUnsold,
        round: state.round ?? 1,
      });

      return {
        ...state,
        ...next,
        matches: refreshFreshLineups(state.matches, next.teams),
        bidHistory: [],
      };
    }

    case 'RESHUFFLE_POOL': {
      return { ...state, pool: shuffle(state.pool) };
    }

    // Slot a brand-new player into the auction at runtime. If there's no live
    // bidding and the queue is empty, they become the current player; otherwise
    // they jump to the front of the pool so they're next up after the current
    // sale closes.
    case 'ADD_PLAYER': {
      const { player } = action;
      if (!player || !player.id) return state;
      if (!state.current && state.pool.length === 0) {
        return { ...state, current: newCurrentFrom(player), bidHistory: [] };
      }
      return { ...state, pool: [player, ...state.pool] };
    }

    case 'MATCH_BALL': {
      const ballType = getBallType(action.ballTypeId);
      if (!ballType) return state;
      const teamLookup = (id) => state.teams.find((t) => t.id === id);
      return updateMatch(state, action.matchId, (m) => {
        if (m.status === 'completed') return m;
        if (!m.team1Id || !m.team2Id) return m; // knockout not yet decided
        const idx = m.currentInnings;
        const innings = m.innings[idx];
        if (!canScore(innings)) return m;
        const nextInnings = applyBall(innings, ballType);
        const updated = {
          ...m,
          status: m.status === 'upcoming' ? 'live' : m.status,
          startedAt: m.startedAt ?? Date.now(),
          innings: m.innings.map((inn, i) => (i === idx ? nextInnings : inn)),
        };
        return finalizeMatchIfDone(updated, teamLookup);
      });
    }

    case 'MATCH_SET_START_TIME': {
      return updateMatch(state, action.matchId, (m) => ({
        ...m,
        startTimeAt: action.time || null,
      }));
    }

    case 'MATCH_SET_TOSS': {
      const teamLookup = (id) => state.teams.find((t) => t.id === id);
      return updateMatch(state, action.matchId, (m) =>
        applyToss(m, action.tossWinnerId, action.decision, teamLookup),
      );
    }

    case 'MATCH_CLEAR_TOSS': {
      return updateMatch(state, action.matchId, (m) => {
        // Only allow clearing if the match hasn't started.
        const started = m.innings.some(
          (inn) =>
            (inn.deliveries?.length ?? 0) > 0 ||
            inn.openersSet ||
            inn.currentBowlerId != null,
        );
        if (started) return m;
        return { ...m, tossWinnerId: null, tossDecision: null };
      });
    }

    case 'MATCH_SET_OPENERS': {
      return updateMatch(state, action.matchId, (m) => {
        const idx = m.currentInnings;
        const inn = m.innings[idx];
        if (inn.openersSet) return m;
        const next = setOpenersInInnings(
          inn,
          action.strikerId,
          action.nonStrikerId,
        );
        if (next === inn) return m;
        return {
          ...m,
          innings: m.innings.map((i, ix) => (ix === idx ? next : i)),
        };
      });
    }

    case 'MATCH_SET_NEXT_BATTER': {
      return updateMatch(state, action.matchId, (m) => {
        const idx = m.currentInnings;
        const inn = m.innings[idx];
        const next = setNextBatterInInnings(inn, action.batterId);
        if (next === inn) return m;
        return {
          ...m,
          innings: m.innings.map((i, ix) => (ix === idx ? next : i)),
        };
      });
    }

    case 'MATCH_RETIRE_BATTER': {
      return updateMatch(state, action.matchId, (m) => {
        const idx = m.currentInnings;
        const inn = m.innings[idx];
        const next = retireBatterInInnings(inn, action.batterId);
        if (next === inn) return m;
        return {
          ...m,
          innings: m.innings.map((i, ix) => (ix === idx ? next : i)),
        };
      });
    }

    case 'MATCH_SET_BOWLER': {
      return updateMatch(state, action.matchId, (m) => {
        const idx = m.currentInnings;
        const inn = m.innings[idx];
        const next = setBowlerInInnings(inn, action.bowlerId);
        if (next === inn) return m;
        return {
          ...m,
          innings: m.innings.map((i, ix) => (ix === idx ? next : i)),
        };
      });
    }

    case 'MATCH_RENAME_BOWLER': {
      const { matchId, inningsIdx, bowlerId, name } = action;
      return updateMatch(state, matchId, (m) => ({
        ...m,
        innings: m.innings.map((inn, i) =>
          i === inningsIdx ? renameBowlerInInnings(inn, bowlerId, name) : inn,
        ),
      }));
    }

    case 'MATCH_UNDO': {
      return updateMatch(state, action.matchId, (m) => {
        const idx = m.currentInnings;
        const innings = m.innings[idx];
        if (innings.deliveries.length === 0) return m;
        const reverted = undoBall(innings);
        return {
          ...m,
          status: m.status === 'completed' ? 'live' : m.status,
          result: null,
          finishedAt: null,
          winnerTeamId: null,
          innings: m.innings.map((inn, i) => (i === idx ? reverted : inn)),
        };
      });
    }

    case 'MATCH_END_INNINGS': {
      const teamLookup = (id) => state.teams.find((t) => t.id === id);
      return updateMatch(state, action.matchId, (m) => {
        if (m.status === 'completed') return m;
        if (!m.team1Id || !m.team2Id) return m;
        const idx = m.currentInnings;
        const closed = { ...m.innings[idx], closed: true };
        const innings = m.innings.map((inn, i) => (i === idx ? closed : inn));
        const updated = {
          ...m,
          status: m.status === 'upcoming' ? 'live' : m.status,
          startedAt: m.startedAt ?? Date.now(),
          innings,
        };
        if (idx === 0) {
          return { ...updated, currentInnings: 1 };
        }
        return completeMatch(updated, teamLookup);
      });
    }

    case 'MATCH_RESET': {
      return updateMatch(state, action.matchId, (m) => {
        const t1 = m.team1Id ? state.teams.find((t) => t.id === m.team1Id) : null;
        const t2 = m.team2Id ? state.teams.find((t) => t.id === m.team2Id) : null;
        return makeMatch({
          id: m.id,
          stage: m.stage,
          group: m.group,
          day: m.day,
          name: m.name,
          // Knockouts go back to placeholder mode so the resolver can repopulate
          // them with the latest source standings.
          team1Id: m.stage === 'group' ? m.team1Id : null,
          team2Id: m.stage === 'group' ? m.team2Id : null,
          seedTeam1: m.seedTeam1,
          seedTeam2: m.seedTeam2,
          oversLimit: m.oversLimit,
          team1Squad: t1?.squad ?? [],
          team2Squad: t2?.squad ?? [],
          team1Short: t1?.short,
          team2Short: t2?.short,
        });
      });
    }

    case 'MATCH_RENAME_BATTER': {
      const { matchId, inningsIdx, batterId, name } = action;
      return updateMatch(state, matchId, (m) => ({
        ...m,
        innings: m.innings.map((inn, i) =>
          i === inningsIdx ? renameBatterInInnings(inn, batterId, name) : inn,
        ),
      }));
    }

    case 'MATCH_SWAP_STRIKE': {
      return updateMatch(state, action.matchId, (m) => {
        if (m.status === 'completed') return m;
        const idx = m.currentInnings;
        const inn = m.innings[idx];
        if (inn.closed) return m;
        return {
          ...m,
          innings: m.innings.map((i, ix) =>
            ix === idx ? swapStrikeInInnings(i) : i,
          ),
        };
      });
    }

    case 'RESET': {
      return seedState();
    }

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────
const AuctionContext = createContext(null);

export function AuctionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const loaded = load();
    return loaded ? migrate(loaded) : seedState();
  });

  // Persist on every state change.
  useEffect(() => {
    save(state);
  }, [state]);

  const value = useMemo(() => {
    const actions = {
      placeBid: (teamId) => dispatch({ type: 'BID', teamId }),
      markSold: () => dispatch({ type: 'SOLD' }),
      markUnsold: () => dispatch({ type: 'UNSOLD' }),
      reshufflePool: () => dispatch({ type: 'RESHUFFLE_POOL' }),
      addPlayer: (input) => {
        const name = String(input.name || '').trim();
        if (!name) return;
        const basePriceLakh = Math.max(1, Math.round(Number(input.basePriceLakh) || 50));
        const role = ['BAT', 'BOWL', 'AR', 'WK'].includes(input.role) ? input.role : 'BAT';
        const id = `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
        const player = {
          id,
          name,
          role,
          country: String(input.country || 'India').trim() || 'India',
          tags: ['Uncapped', 'Indian'],
          base: basePriceLakh < 100
            ? `${basePriceLakh} L`
            : `${Number.isInteger(basePriceLakh / 100) ? basePriceLakh / 100 : (basePriceLakh / 100).toFixed(2)} Cr`,
          basePriceLakh,
          imageUrl: String(input.imageUrl || '').trim() || `${import.meta.env.BASE_URL}players/${id}.jpg`,
          funFact: '',
        };
        dispatch({ type: 'ADD_PLAYER', player });
      },
      resetAuction: () => {
        resetStorage();
        dispatch({ type: 'RESET' });
      },
    };
    const matchActions = {
      recordBall: (matchId, ballTypeId) =>
        dispatch({ type: 'MATCH_BALL', matchId, ballTypeId }),
      undoBall: (matchId) => dispatch({ type: 'MATCH_UNDO', matchId }),
      endInnings: (matchId) => dispatch({ type: 'MATCH_END_INNINGS', matchId }),
      resetMatch: (matchId) => dispatch({ type: 'MATCH_RESET', matchId }),
      swapStrike: (matchId) =>
        dispatch({ type: 'MATCH_SWAP_STRIKE', matchId }),
      renameBatter: (matchId, inningsIdx, batterId, name) =>
        dispatch({
          type: 'MATCH_RENAME_BATTER',
          matchId,
          inningsIdx,
          batterId,
          name,
        }),
      setMatchStartTime: (matchId, time) =>
        dispatch({ type: 'MATCH_SET_START_TIME', matchId, time }),
      setToss: (matchId, tossWinnerId, decision) =>
        dispatch({
          type: 'MATCH_SET_TOSS',
          matchId,
          tossWinnerId,
          decision,
        }),
      clearToss: (matchId) =>
        dispatch({ type: 'MATCH_CLEAR_TOSS', matchId }),
      setOpeners: (matchId, strikerId, nonStrikerId) =>
        dispatch({
          type: 'MATCH_SET_OPENERS',
          matchId,
          strikerId,
          nonStrikerId,
        }),
      setNextBatter: (matchId, batterId) =>
        dispatch({ type: 'MATCH_SET_NEXT_BATTER', matchId, batterId }),
      retireBatter: (matchId, batterId) =>
        dispatch({ type: 'MATCH_RETIRE_BATTER', matchId, batterId }),
      setBowler: (matchId, bowlerId) =>
        dispatch({ type: 'MATCH_SET_BOWLER', matchId, bowlerId }),
      renameBowler: (matchId, inningsIdx, bowlerId, name) =>
        dispatch({
          type: 'MATCH_RENAME_BOWLER',
          matchId,
          inningsIdx,
          bowlerId,
          name,
        }),
    };
    return { state, actions, matchActions };
  }, [state]);

  return (
    <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>
  );
}

export function useAuction() {
  const ctx = useContext(AuctionContext);
  if (!ctx) {
    throw new Error('useAuction must be used inside an <AuctionProvider>');
  }
  return ctx;
}

// ─── Selectors (small convenience wrappers) ─────────────────────────────────
export function useCurrentPlayer() {
  return useAuction().state.current;
}

export function useTeams() {
  return useAuction().state.teams;
}

export function useFranchises() {
  return useAuction().state.teams.filter((t) => !t.isOrganizer);
}
