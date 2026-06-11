import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { players as allPlayers } from '../data/players';
import { load, save, reset as resetStorage, STORAGE_VERSION } from '../utils/storage';
import { shuffle, nextBidAmount } from '../utils/auction';

// ─── Constants ──────────────────────────────────────────────────────────────
const TEAMS = [
  { id: 'kkr', name: 'Kolkata Knight Riders', short: 'KKR' },
  { id: 'mi',  name: 'Mumbai Indians',         short: 'MI'  },
  { id: 'csk', name: 'Chennai Super Kings',    short: 'CSK' },
  { id: 'rcb', name: 'Royal Challengers',      short: 'RCB' },
  { id: 'srh', name: 'Sunrisers Hyderabad',    short: 'SRH' },
  { id: 'dc',  name: 'Delhi Capitals',         short: 'DC'  },
];
const ORGANIZER_ID = 'organizer';
const INITIAL_PURSE_LAKH = 25000; // 250 Cr per franchise
const SQUAD_LIMIT = 15;
const MAX_BID_HISTORY = 4;

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
  const shuffled = shuffle(allPlayers);
  const [first, ...rest] = shuffled;
  return {
    version: STORAGE_VERSION,
    round: 1,
    pool: rest,
    current: newCurrentFrom(first),
    teams: [
      ...TEAMS.map((t) => ({
        ...t,
        initialPurseLakh: INITIAL_PURSE_LAKH,
        purseLakh: INITIAL_PURSE_LAKH,
        squad: [],
        maxSquad: SQUAD_LIMIT,
        isOrganizer: false,
      })),
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
    ],
    bidHistory: [],
    soldHistory: [],
  };
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
        bidHistory: [],
      };
    }

    case 'RESHUFFLE_POOL': {
      return { ...state, pool: shuffle(state.pool) };
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
    return load() ?? seedState();
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
      resetAuction: () => {
        resetStorage();
        dispatch({ type: 'RESET' });
      },
    };
    return { state, actions };
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
