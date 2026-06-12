import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, RotateCcw, Settings } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { navItems } from '../../data/mockData';
import TeamsDropdown from './TeamsDropdown';
import StatsDropdown from './StatsDropdown';
import './Navbar.css';

const MENUS = {
  teams: TeamsDropdown,
  stats: StatsDropdown,
};

export default function Navbar() {
  const { actions } = useAuction();
  // Which dropdown is open: 'teams' | 'stats' | null. Only one at a time.
  const [openMenu, setOpenMenu] = useState(null);
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
      <div className="navbar__brand">VOLT CRICKET PULSE</div>

      <nav className="navbar__links" aria-label="Primary">
        {navItems.map((item) => {
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
