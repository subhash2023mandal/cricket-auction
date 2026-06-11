import { useEffect, useState } from 'react';
import { useAuction } from '../../context/AuctionContext';
import { formatLakh, formatTimeAgo } from '../../utils/auction';
import { teamColors } from '../../data/mockData';
import './BidHistory.css';

const MAX_VISIBLE_BIDS = 4;

export default function BidHistory() {
  const { state } = useAuction();
  const bidHistory = state.bidHistory.slice(0, MAX_VISIBLE_BIDS);

  // Tick once a second so "X seconds ago" stays fresh while idle.
  const [, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="bid-history card">
      <header className="bid-history__header">
        <span className="label">Bid History</span>
        <span className="bid-history__live">
          <span className="bid-history__live-dot" />
          LIVE
        </span>
      </header>

      {bidHistory.length === 0 ? (
        <div className="bid-history__empty">
          No bids yet for the current player.
        </div>
      ) : (
        <ul className="bid-history__list">
          {bidHistory.map((bid, idx) => (
            <li
              key={bid.id}
              className={`bid-history__item ${idx === 0 ? 'is-current' : ''}`}
            >
              <span
                className="bid-history__badge"
                style={{ background: teamColors[bid.teamShort] || '#334' }}
              >
                {bid.teamShort}
              </span>

              <div className="bid-history__meta">
                <div className="bid-history__team">{bid.teamShort}</div>
                <div className="bid-history__time">
                  {formatTimeAgo(bid.timestamp)}
                </div>
              </div>

              <div className="bid-history__amount">
                ₹{formatLakh(bid.amountLakh)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
