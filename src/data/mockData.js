// Static config used by the chrome (navbar, tournament header, team colors).
// All live auction data (players, teams, bids, sales) lives in AuctionContext.

export const tournament = {
  name: 'IPL 2024',
  season: 'Season 17 • Live Auction',
};

export const navItems = [
  { id: 'tournaments', label: 'Tournaments' },
  { id: 'match-center', label: 'Match Center', active: true },
  { id: 'standings', label: 'Standings' },
  { id: 'stats', label: 'Stats' },
  { id: 'teams', label: 'Teams' },
];

export const teamColors = {
  KKR: '#5c1f8c',
  MI: '#1b4ea0',
  CSK: '#f2c12d',
  RCB: '#c8202b',
  SRH: '#e07a1e',
  DC: '#1f4eb2',
  ORG: '#475569',
};
