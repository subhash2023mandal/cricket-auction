import { Gavel, X, RefreshCw } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { formatLakh, nextBidAmount } from '../../utils/auction';
import { teamColors } from '../../data/mockData';
import './BiddingPanel.css';

export default function BiddingPanel() {
  const { state, actions } = useAuction();
  const { current, teams } = state;

  const franchises = teams.filter((t) => !t.isOrganizer);
  const hasCurrent = !!current;
  const hasBids = !!current?.highestBidderId;

  const proposedBidLakh = hasCurrent
    ? nextBidAmount(
        current.currentPriceLakh,
        current.player.basePriceLakh,
        hasBids,
      )
    : 0;

  const canSell = hasCurrent && hasBids;

  return (
   <></>
  );
}
