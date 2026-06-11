import { Shuffle } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { formatLakh } from '../../utils/auction';
import './NextPlayersQueue.css';

export default function NextPlayersQueue() {
  const { state, actions } = useAuction();
  const upcoming = state.pool.slice(0, 3);

  return (
    <section className="queue card">
      <div className="queue__header">
        <div className="label">In Queue</div>
        <div className="queue__title">Next Players</div>
        <button
          className="queue__shuffle"
          onClick={actions.reshufflePool}
          title="Re-shuffle the remaining pool"
        >
          <Shuffle size={12} />
          <span>Shuffle</span>
        </button>
      </div>

      <div className="queue__items">
        {upcoming.length === 0 ? (
          <div className="queue__empty">Pool empty — auction nearly complete.</div>
        ) : (
          upcoming.map((player) => (
            <div key={player.id} className="queue__item">
              <img
                className="queue__avatar"
                src={player.imageUrl}
                alt={player.name}
              />
              <div className="queue__meta">
                <div className="queue__name">{player.name}</div>
                <div className="queue__detail">
                  {player.role} | Base: ₹{formatLakh(player.basePriceLakh)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
