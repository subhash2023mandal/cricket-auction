import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { formatLakh } from '../../utils/auction';
import { players as allPlayers } from '../../data/players';
import { teamColors } from '../../data/mockData';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';

const FILTERS = [
  { id: 'all',    label: 'All' },
  { id: 'queued', label: 'In Pool' },
  { id: 'live',   label: 'Live' },
  { id: 'sold',   label: 'Sold' },
  { id: 'unsold', label: 'Unsold' },
];

export default function StatsDropdown({ onClose }) {
  const { state } = useAuction();
  const [filter, setFilter] = useState('all');

  // ESC closes.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Walks all auction state once and produces { [playerId]: {status, ...} }.
  const statusMap = useMemo(() => {
    const map = {};

    state.pool.forEach((p) => {
      map[p.id] = { status: 'queued' };
    });

    if (state.current) {
      const winner = state.current.highestBidderId
        ? state.teams.find((t) => t.id === state.current.highestBidderId)
        : null;
      map[state.current.player.id] = {
        status: 'live',
        currentPriceLakh: state.current.currentPriceLakh,
        winnerShort: winner?.short ?? null,
      };
    }

    state.teams.forEach((team) => {
      team.squad.forEach((p) => {
        map[p.id] = {
          status: team.isOrganizer ? 'unsold' : 'sold',
          teamShort: team.short,
          teamName: team.name,
          soldPriceLakh: p.soldPriceLakh,
        };
      });
    });

    return map;
  }, [state]);

  // Filter chip counts.
  const counts = useMemo(() => {
    const c = { all: allPlayers.length, queued: 0, live: 0, sold: 0, unsold: 0 };
    allPlayers.forEach((p) => {
      const s = statusMap[p.id]?.status ?? 'queued';
      c[s] = (c[s] ?? 0) + 1;
    });
    return c;
  }, [statusMap]);

  const totalSpentLakh = useMemo(() => {
    return state.teams
      .filter((t) => !t.isOrganizer)
      .reduce((sum, t) => sum + (t.initialPurseLakh - t.purseLakh), 0);
  }, [state.teams]);

  const filtered = useMemo(() => {
    if (filter === 'all') return allPlayers;
    return allPlayers.filter(
      (p) => (statusMap[p.id]?.status ?? 'queued') === filter,
    );
  }, [filter, statusMap]);

  return (
    <div className="stats-dropdown card" role="dialog" aria-label="All players">
      <header className="stats-dropdown__head">
        <div className="stats-dropdown__head-text">
          <div className="label">All Players</div>
          <div className="stats-dropdown__title">
            Player Pool · {allPlayers.length}
          </div>
          <div className="stats-dropdown__summary">
            {counts.sold} sold · {counts.unsold} unsold ·{' '}
            {counts.queued + counts.live} remaining · ₹
            {formatLakh(totalSpentLakh)} spent
          </div>
        </div>
        <button
          className="stats-dropdown__close"
          onClick={onClose}
          aria-label="Close all players"
        >
          <X size={16} />
        </button>
      </header>

      <div className="stats-dropdown__filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`stats-chip ${filter === f.id ? 'is-active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            <span className="stats-chip__count">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <div className="stats-dropdown__grid">
        {filtered.length === 0 ? (
          <div className="stats-dropdown__empty">
            No players match this filter.
          </div>
        ) : (
          filtered.map((player) => (
            <PlayerStatRow
              key={player.id}
              player={player}
              status={statusMap[player.id] ?? { status: 'queued' }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PlayerStatRow({ player, status }) {
  return (
    <div className={`player-stat player-stat--${status.status}`}>
      <PlayerAvatar
        player={player}
        className="player-stat__avatar"
      />
      <div className="player-stat__info">
        <div className="player-stat__name" title={player.name}>
          {player.name}
        </div>
        <div className="player-stat__meta">
          {player.role} · {player.country} · Base ₹
          {formatLakh(player.basePriceLakh)}
        </div>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

function StatusBadge({ status }) {
  switch (status.status) {
    case 'live':
      return (
        <div className="player-stat__status player-stat__status--live">
          <span className="player-stat__status-label">LIVE</span>
          <span className="player-stat__status-amount">
            ₹{formatLakh(status.currentPriceLakh)}
          </span>
        </div>
      );
    case 'sold':
      return (
        <div className="player-stat__status player-stat__status--sold">
          <span
            className="player-stat__status-team"
            style={{ background: teamColors[status.teamShort] || '#334' }}
          >
            {status.teamShort}
          </span>
          <span className="player-stat__status-amount">
            ₹{formatLakh(status.soldPriceLakh)}
          </span>
        </div>
      );
    case 'unsold':
      return (
        <div className="player-stat__status player-stat__status--unsold">
          UNSOLD
        </div>
      );
    default:
      return (
        <div className="player-stat__status player-stat__status--queued">
          IN POOL
        </div>
      );
  }
}
