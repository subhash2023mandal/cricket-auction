import { useEffect, useRef, useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import './AddPlayerModal.css';

const ROLES = [
  { id: 'BAT',  label: 'Batter' },
  { id: 'BOWL', label: 'Bowler' },
  { id: 'AR',   label: 'All-rounder' },
  { id: 'WK',   label: 'Wicket-keeper' },
];

// Quick chips for common base prices (₹ in Lakh).
const QUICK_BASES = [50, 75, 100, 150, 200];

export default function AddPlayerModal({ onClose }) {
  const { actions, state } = useAuction();
  const [name, setName] = useState('');
  const [role, setRole] = useState('BAT');
  const [basePriceLakh, setBasePriceLakh] = useState(50);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const nameInputRef = useRef(null);

  // Autofocus name + ESC closes.
  useEffect(() => {
    nameInputRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trimmed = name.trim();
  const duplicate =
    trimmed &&
    [...state.pool, state.current?.player]
      .concat(state.teams.flatMap((t) => t.squad))
      .filter(Boolean)
      .some((p) => p.name.toLowerCase() === trimmed.toLowerCase());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    const base = Math.round(Number(basePriceLakh));
    if (!Number.isFinite(base) || base < 1) {
      setError('Base price must be at least 1 lakh');
      return;
    }
    actions.addPlayer({
      name: trimmed,
      role,
      basePriceLakh: base,
      imageUrl: imageUrl.trim(),
    });
    onClose?.();
  };

  // Click outside the panel closes.
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className="add-player-backdrop" onMouseDown={handleBackdrop}>
      <form className="add-player card" onSubmit={handleSubmit} role="dialog" aria-label="Add a player">
        <header className="add-player__head">
          <div className="add-player__head-text">
            <div className="add-player__head-icon">
              <UserPlus size={16} />
            </div>
            <div>
              <div className="label">On-the-spot Entry</div>
              <h2 className="add-player__title">Add a Player</h2>
            </div>
          </div>
          <button
            type="button"
            className="add-player__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="add-player__field">
          <label htmlFor="add-player-name" className="label">Name</label>
          <input
            id="add-player-name"
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="e.g. Rohit Sharma"
            className="add-player__input"
            autoComplete="off"
          />
          {duplicate && (
            <div className="add-player__warn">
              Heads up — a player named “{trimmed}” already exists in the auction.
            </div>
          )}
        </div>

        <div className="add-player__field">
          <span className="label">Role</span>
          <div className="add-player__chips">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`add-player__chip ${role === r.id ? 'is-active' : ''}`}
                onClick={() => setRole(r.id)}
              >
                <span className="add-player__chip-id">{r.id}</span>
                <span className="add-player__chip-label">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="add-player__field">
          <label htmlFor="add-player-base" className="label">Base Price (₹ Lakh)</label>
          <div className="add-player__base-row">
            <input
              id="add-player-base"
              type="number"
              min={1}
              step={1}
              value={basePriceLakh}
              onChange={(e) => { setBasePriceLakh(e.target.value); setError(''); }}
              className="add-player__input add-player__input--number"
            />
            <div className="add-player__quick">
              {QUICK_BASES.map((b) => (
                <button
                  key={b}
                  type="button"
                  className={`add-player__quick-chip ${
                    Number(basePriceLakh) === b ? 'is-active' : ''
                  }`}
                  onClick={() => setBasePriceLakh(b)}
                >
                  {b < 100 ? `${b} L` : `${b / 100} Cr`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="add-player__field">
          <label htmlFor="add-player-image" className="label">
            Image URL <span className="add-player__optional">(optional)</span>
          </label>
          <input
            id="add-player-image"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Leave blank to use a generated avatar"
            className="add-player__input"
            autoComplete="off"
          />
        </div>

        {error && <div className="add-player__error">{error}</div>}

        <footer className="add-player__footer">
          <button type="button" className="add-player__btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="add-player__btn add-player__btn--primary"
            disabled={!trimmed}
          >
            Add to Auction
          </button>
        </footer>

        <p className="add-player__hint">
          The new player jumps to the front of the pool and goes under the
          hammer next — or becomes live immediately if the pool is empty.
        </p>
      </form>
    </div>
  );
}
