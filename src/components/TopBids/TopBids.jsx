import { useMemo } from 'react';
import { Crown } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { formatLakh } from '../../utils/auction';
import { teamColors } from '../../data/mockData';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';
import './TopBids.css';

const TOP_N = 10;

export default function TopBids() {
  const { state } = useAuction();

  // Walk every franchise squad once and produce a flat, price-sorted list of
  // sold players. Organizer (unsold pile) is skipped — those weren't bid on.
  const topSold = useMemo(() => {
    const sold = [];
    for (const team of state.teams) {
      if (team.isOrganizer) continue;
      for (const p of team.squad) {
        sold.push({
          id: p.id,
          name: p.name,
          role: p.role,
          imageUrl: p.imageUrl,
          priceLakh: p.soldPriceLakh,
          teamShort: team.short,
        });
      }
    }
    return sold
      .sort((a, b) => b.priceLakh - a.priceLakh)
      .slice(0, TOP_N);
  }, [state.teams]);

  return (
    <section className="top-bids card">
      <header className="top-bids__header">
        <div className="top-bids__title-group">
          <Crown size={14} className="top-bids__icon" />
          <span className="label">Top {TOP_N} Highest Bids</span>
        </div>
        {topSold.length > 0 && (
          <span className="top-bids__count">{topSold.length}</span>
        )}
      </header>

      {topSold.length === 0 ? (
        <div className="top-bids__empty">
          No players sold yet. Big bids will show up here.
        </div>
      ) : (
        <ol className="top-bids__list">
          {topSold.map((entry, idx) => (
            <li key={entry.id} className="top-bids__item">
              <span className={`top-bids__rank top-bids__rank--${idx + 1}`}>
                #{idx + 1}
              </span>

              <PlayerAvatar
                player={entry}
                className="top-bids__avatar"
              />

              <div className="top-bids__meta">
                <div className="top-bids__name" title={entry.name}>
                  {entry.name}
                </div>
                <div className="top-bids__sub">
                  <span
                    className="top-bids__team"
                    style={{ background: teamColors[entry.teamShort] || '#334' }}
                  >
                    {entry.teamShort}
                  </span>
                  <span className="top-bids__role">{entry.role}</span>
                </div>
              </div>

              <div className="top-bids__amount">
                ₹{formatLakh(entry.priceLakh)}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
