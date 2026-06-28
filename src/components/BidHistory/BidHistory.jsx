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
    <></>
  );
}
