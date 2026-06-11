import { Trophy } from 'lucide-react';
import TeamWallet from './TeamWallet';
import { useAuction } from '../../context/AuctionContext';
import { tournament } from '../../data/mockData';
import './Sidebar.css';

export default function Sidebar() {
  const { state } = useAuction();

  return (
    <aside className="sidebar">
      <div className="sidebar__tournament">
        <div className="sidebar__tournament-icon">
          <Trophy size={18} />
        </div>
        <div>
          <div className="sidebar__tournament-name">{tournament.name}</div>
          <div className="sidebar__tournament-season">{tournament.season}</div>
        </div>
      </div>

      <button className="sidebar__live">
        <span>LIVE UPDATES</span>
        <span className="sidebar__live-dot" />
      </button>

      <div className="sidebar__section-label label">Team Wallets</div>

      <div className="sidebar__wallets">
        {state.teams.map((team) => (
          <TeamWallet key={team.id} team={team} />
        ))}
      </div>
    </aside>
  );
}
