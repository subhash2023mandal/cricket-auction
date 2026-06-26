import { useCallback, useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import AuctionStarterOverlay from './AuctionStarterOverlay';
import './StartAuctionButton.css';

// localStorage key + helpers. The button is meant to appear once per local
// calendar day — we persist the last day the starter was triggered and hide
// the button once it matches today.
const STARTER_KEY = 'volt-auction:starter-shown-on';

function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readShownDay() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STARTER_KEY);
  } catch {
    return null;
  }
}

function writeShownDay(day) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STARTER_KEY, day);
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export default function StartAuctionButton() {
  // `available` controls whether the button is rendered. We compute it lazily
  // so SSR/first paint doesn't flash a button that's about to be hidden.
  const [available, setAvailable] = useState(() => readShownDay() !== todayKey());
  const [open, setOpen] = useState(false);

  // If the user keeps the tab open past midnight, re-enable the button so the
  // next day's first visit can trigger the starter again.
  useEffect(() => {
    if (available) return;
    const ms = millisUntilMidnight();
    const timer = window.setTimeout(() => {
      setAvailable(readShownDay() !== todayKey());
    }, ms + 500);
    return () => window.clearTimeout(timer);
  }, [available]);

  const handleStart = useCallback(() => {
    writeShownDay(todayKey());
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setAvailable(false);
  }, []);

  if (!available && !open) return null;

  return (
    <>
      {available && (
        <button
          type="button"
          className="start-auction-btn"
          onClick={handleStart}
          aria-label="Start the auction with a live reveal"
          title="Go LIVE — show the auction starter (once per day)"
        >
          <span className="start-auction-btn__pulse" aria-hidden="true" />
          <Play size={14} className="start-auction-btn__icon" />
          <span className="start-auction-btn__label">Go Live</span>
        </button>
      )}
      {open && <AuctionStarterOverlay onClose={handleClose} />}
    </>
  );
}

function millisUntilMidnight() {
  const now = new Date();
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0,
  );
  return Math.max(1000, next.getTime() - now.getTime());
}
