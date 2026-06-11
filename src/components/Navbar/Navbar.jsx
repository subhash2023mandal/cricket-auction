import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, RotateCcw, Settings } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { navItems } from '../../data/mockData';
import TeamsDropdown from './TeamsDropdown';
import './Navbar.css';

export default function Navbar() {
  const { actions } = useAuction();
  const [teamsOpen, setTeamsOpen] = useState(false);
  const teamsWrapRef = useRef(null);

  // Close the dropdown when clicking anywhere outside of it.
  useEffect(() => {
    if (!teamsOpen) return;
    const onClick = (e) => {
      if (!teamsWrapRef.current?.contains(e.target)) {
        setTeamsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [teamsOpen]);

  return (
    <header className="navbar">
      <div className="navbar__brand">CRICKET PULSE</div>

      <nav className="navbar__links" aria-label="Primary">
        {navItems.map((item) => {
          if (item.id === 'teams') {
            return (
              <div
                key={item.id}
                className="navbar__teams-wrap"
                ref={teamsWrapRef}
              >
                <button
                  className={`navbar__link navbar__link--teams ${teamsOpen ? 'is-open' : ''}`}
                  onClick={() => setTeamsOpen((o) => !o)}
                  aria-haspopup="dialog"
                  aria-expanded={teamsOpen}
                >
                  {item.label}
                  <ChevronDown
                    size={14}
                    className={`navbar__chevron ${teamsOpen ? 'is-up' : ''}`}
                  />
                </button>
                {teamsOpen && (
                  <TeamsDropdown onClose={() => setTeamsOpen(false)} />
                )}
              </div>
            );
          }
          return (
            <button
              key={item.id}
              className={`navbar__link ${item.active ? 'is-active' : ''}`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="navbar__actions">
        <button
          className="navbar__icon-btn"
          aria-label="Reset Auction"
          title="Reset Auction"
          onClick={() => {
            if (
              window.confirm(
                'Reset the entire auction? All progress will be lost.',
              )
            ) {
              actions.resetAuction();
            }
          }}
        >
          <RotateCcw size={18} />
        </button>
        <button className="navbar__icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button className="navbar__icon-btn" aria-label="Settings">
          <Settings size={18} />
        </button>
        <div className="navbar__avatar" aria-label="Profile">
          <span>S</span>
        </div>
      </div>
    </header>
  );
}
