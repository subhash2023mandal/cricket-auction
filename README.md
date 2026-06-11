# Cricket Pulse — Live Auction UI

A React + Vite single-page interface that recreates the **Cricket Pulse** live auction screen. The layout is fully component-based with a dark, neon-green theme.

## Stack

- **React 18** with the Vite dev server
- **lucide-react** for icons
- Vanilla CSS modules per component (no UI framework needed)

## Folder structure

```
src/
├── App.jsx                # Composes the page layout
├── App.css
├── main.jsx
├── data/
│   └── mockData.js        # All mock data (tournament, teams, player, bids, queue)
├── styles/
│   └── global.css         # Theme variables + base styles
└── components/
    ├── Navbar/            # Top nav with logo, links, icons, avatar
    ├── Sidebar/           # IPL header, live updates, team wallets
    │   ├── Sidebar.jsx
    │   └── TeamWallet.jsx
    ├── PlayerShowcase/    # Center card: base price, player, current bid
    ├── BiddingPanel/      # +₹25L / +₹50L / Custom bid actions
    ├── BidHistory/        # Live bid log
    └── NextPlayersQueue/  # Footer queue strip
```

Each component owns its own `.jsx` and `.css` files for isolated styling.

## Getting started

```bash
npm install
npm run dev          # starts at http://localhost:5173
npm run build        # production build to dist/
npm run preview      # serves the built bundle
```

## Customising data

All on-screen content (teams, player profile, bid history, upcoming queue) lives in [`src/data/mockData.js`](src/data/mockData.js). Edit that file to plug in real data, or replace the import with API calls from a hook.
