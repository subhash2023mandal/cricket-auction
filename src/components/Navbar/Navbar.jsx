import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, RotateCcw, Settings, UserPlus } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { navItems } from '../../data/mockData';
import TeamsDropdown from './TeamsDropdown';
import StatsDropdown from './StatsDropdown';
import TournamentOverlay from '../Tournament/TournamentOverlay';
import AddPlayerModal from '../AddPlayerModal/AddPlayerModal';
import './Navbar.css';

const MENUS = {
  teams: TeamsDropdown,
  stats: StatsDropdown,
};

export default function Navbar() {
  const { actions } = useAuction();
  // Which dropdown is open: 'teams' | 'stats' | null. Only one at a time.
  const [openMenu, setOpenMenu] = useState(null);
  // Full-screen tournament overlay (triggered by the Tournaments nav item).
  const [tournamentOpen, setTournamentOpen] = useState(false);
  // Modal for adding a player on the spot.
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const wrapRefs = useRef({});

  // Outside click closes whatever's open.
  useEffect(() => {
    if (!openMenu) return;
    const onMouseDown = (e) => {
      const wrap = wrapRefs.current[openMenu];
      if (!wrap?.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openMenu]);

  const close = () => setOpenMenu(null);

  return (
    <header className="navbar">
      <div style={{ fontSize: '24px', fontWeight: 'bold' }} className="navbar__brand">VOLT PREMIER LEAGUE</div>

      <nav className="navbar__links" aria-label="Primary">
        {navItems.map((item) => {
          if (item.id === 'tournaments') {
            return (
              <button
                key={item.id}
                className={`navbar__link ${tournamentOpen ? 'is-active' : ''}`}
                onClick={() => setTournamentOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={tournamentOpen}
              >
                {item.label}
              </button>
            );
          }

          const Menu = MENUS[item.id];
          if (!Menu) {
            return (
              <button
                key={item.id}
                className={`navbar__link ${item.active ? 'is-active' : ''}`}
              >
                {item.label}
              </button>
            );
          }

          const isOpen = openMenu === item.id;
          return (
            <div
              key={item.id}
              className="navbar__menu-wrap"
              ref={(node) => {
                wrapRefs.current[item.id] = node;
              }}
            >
              <button
                className={`navbar__link navbar__link--menu ${isOpen ? 'is-open' : ''}`}
                onClick={() => setOpenMenu(isOpen ? null : item.id)}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
              >
                {item.label}
                <ChevronDown
                  size={14}
                  className={`navbar__chevron ${isOpen ? 'is-up' : ''}`}
                />
              </button>
              {isOpen && <Menu onClose={close} />}
            </div>
          );
        })}
      </nav>

      <div className="navbar__actions">
        <button
          className="navbar__icon-btn navbar__icon-btn--accent"
          aria-label="Add Player"
          title="Add a player on the spot"
          onClick={() => setAddPlayerOpen(true)}
        >
          <UserPlus size={18} />
        </button>
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

      {tournamentOpen && (
        <TournamentOverlay onClose={() => setTournamentOpen(false)} />
      )}
      {addPlayerOpen && (
        <AddPlayerModal onClose={() => setAddPlayerOpen(false)} />
      )}
    </header>
  );
}
