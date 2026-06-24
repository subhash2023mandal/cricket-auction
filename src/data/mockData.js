// Static config used by the chrome (navbar, tournament header, team colors).
// All live auction data (players, teams, bids, sales) lives in AuctionContext.

export const tournament = {
  name: 'VPL 2026',
  season: 'Season 02 • Live Auction',
};

export const navItems = [
  { id: 'tournaments', label: 'Tournaments' },
  { id: 'match-center', label: 'Match Center', active: true },
  { id: 'standings', label: 'Standings' },
  { id: 'stats', label: 'Stats' },
  { id: 'teams', label: 'Teams' },
];

export const teamColors = {
  VV: '#16a34a', // Voltage Vipers — electric green
  TT: '#eab308', // Thunder Titans — gold
  SS: '#dc2626', // Surge Strikers — surge red
  PP: '#7c3aed', // Plasma Panthers — plasma purple
  CS: '#f97316', // Circuit Spartans — circuit orange
  NK: '#06b6d4', // Neon Knights — neon cyan
  ORG: '#475569',
};
