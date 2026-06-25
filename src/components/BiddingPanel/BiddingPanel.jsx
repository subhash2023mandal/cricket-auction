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
    <section className="bidding card">
      <div className="bidding__header">
        <div className="label bidding__title">Place Your Bid</div>
        {hasCurrent && (
          <div className="bidding__next">
            Next: <strong>₹{formatLakh(proposedBidLakh)}</strong>
          </div>
        )}
      </div>

      <div className="bidding__teams">
        {franchises.map((team) => {
          const isWinning = current?.highestBidderId === team.id;
          const canAfford = team.purseLakh >= proposedBidLakh;
          const squadFull = team.squad.length >= team.maxSquad;
          const disabled = !hasCurrent || isWinning || !canAfford || squadFull;

          return (
            <button
              key={team.id}
              className={`bidding__team ${isWinning ? 'is-winning' : ''}`}
              style={{ '--team-color': teamColors[team.short] || '#334' }}
              onClick={() => actions.placeBid(team.id)}
              disabled={disabled}
              title={
                squadFull
                  ? 'Squad full'
                  : !canAfford
                    ? 'Insufficient purse'
                    : isWinning
                      ? 'Currently winning'
                      : `Bid ₹${formatLakh(proposedBidLakh)} for ${team.name}`
              }
            >
              <div className="bidding__team-top">
                <span className="bidding__team-dot" />
                <span className="bidding__team-short">{team.short}</span>
              </div>
              <span className="bidding__team-name">{team.name}</span>
              <span className="bidding__team-purse">
                ₹{formatLakh(team.purseLakh)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bidding__actions">
        <button
          className="bidding__action bidding__action--sold"
          onClick={actions.markSold}
          disabled={!canSell}
        >
          <Gavel size={16} />
          <span>SOLD</span>
        </button>
        <button
          className="bidding__action bidding__action--unsold"
          onClick={actions.markUnsold}
          disabled={!hasCurrent}
        >
          <X size={16} />
          <span>UNSOLD</span>
        </button>
      </div>

      <button
        className="bidding__reset"
        onClick={() => {
          if (window.confirm('Reset the entire auction? All progress will be lost.')) {
            actions.resetAuction();
          }
        }}
      >
        <RefreshCw size={13} />
        <span>RESET AUCTION</span>
      </button>
    </section>
  );
}
