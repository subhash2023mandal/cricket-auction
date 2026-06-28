import { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import PlayerShowcase from './components/PlayerShowcase/PlayerShowcase';
import TeamSquadView from './components/TeamSquadView/TeamSquadView';
import BiddingPanel from './components/BiddingPanel/BiddingPanel';
import BidHistory from './components/BidHistory/BidHistory';
import TopBids from './components/TopBids/TopBids';
import NextPlayersQueue from './components/NextPlayersQueue/NextPlayersQueue';
import './App.css';

export default function App() {
  // Default the center view to Neon Knights so the page lands on a team
  // squad instead of the "AUCTION COMPLETE" placeholder. Clicking another
  // team swaps to that team; clicking the same team again clears the view
  // and falls back to PlayerShowcase.
  const [selectedTeamId, setSelectedTeamId] = useState('nk');

  const handleSelectTeam = (id) =>
    setSelectedTeamId((cur) => (cur === id ? null : id));

  return (
    <div className="app">
      <Navbar />

      <main className="app__layout">
        <aside className="app__col-left">
          <Sidebar
            selectedTeamId={selectedTeamId}
            onSelectTeam={handleSelectTeam}
          />
        </aside>

        <section className="app__col-center">
          {selectedTeamId ? (
            <TeamSquadView
              teamId={selectedTeamId}
              onClose={() => setSelectedTeamId(null)}
            />
          ) : (
            <PlayerShowcase />
          )}
        </section>

        <aside className="app__col-right">
          <BiddingPanel />
          <BidHistory />
          <TopBids />
        </aside>

        <div className="app__queue">
          <NextPlayersQueue />
        </div>
      </main>
    </div>
  );
}
