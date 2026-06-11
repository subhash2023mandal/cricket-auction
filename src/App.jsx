import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import PlayerShowcase from './components/PlayerShowcase/PlayerShowcase';
import BiddingPanel from './components/BiddingPanel/BiddingPanel';
import BidHistory from './components/BidHistory/BidHistory';
import NextPlayersQueue from './components/NextPlayersQueue/NextPlayersQueue';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <Navbar />

      <main className="app__layout">
        <aside className="app__col-left">
          <Sidebar />
        </aside>

        <section className="app__col-center">
          <PlayerShowcase />
        </section>

        <aside className="app__col-right">
          <BiddingPanel />
          <BidHistory />
        </aside>

        <div className="app__queue">
          <NextPlayersQueue />
        </div>
      </main>
    </div>
  );
}
