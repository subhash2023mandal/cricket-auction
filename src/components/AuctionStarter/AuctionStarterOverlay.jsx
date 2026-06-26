import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Lottie from 'lottie-react';
import { Gavel } from 'lucide-react';
import animationData from './auction-live.json';
import './AuctionStarterOverlay.css';

const AUTO_DISMISS_MS = 6500;

export default function AuctionStarterOverlay({ onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => onClose?.(), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const overlay = (
    <div className="auction-starter" role="dialog" aria-label="VoltMoney auction starter">
      <button
        type="button"
        className="auction-starter__backdrop"
        aria-label="Dismiss auction starter"
        onClick={() => onClose?.()}
      />

      <div className="auction-starter__stage">
        <div className="auction-starter__lottie">
          <Lottie animationData={animationData} loop={false} autoplay />
        </div>

        <div className="auction-starter__content">
          <div className="auction-starter__eyebrow">
            <Gavel size={16} />
            <span>VoltMoney presents</span>
          </div>
          <h1 className="auction-starter__headline">
            <span className="auction-starter__headline-line auction-starter__headline-line--1">
              VOLT PREMIER LEAGUE
            </span>
            <span className="auction-starter__headline-line auction-starter__headline-line--2">
              AUCTION IS NOW <em className="auction-starter__live">LIVE</em>
            </span>
          </h1>
          <p className="auction-starter__tagline">
            Paddles up. Wallets ready. May the best franchise win.
          </p>

          <div className="auction-starter__chips">
            <span className="auction-starter__chip">6 Franchises</span>
            <span className="auction-starter__chip">100 Cr Purse</span>
            <span className="auction-starter__chip">Live Bidding</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(overlay, document.body);
}
