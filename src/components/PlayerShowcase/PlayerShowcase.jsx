import { useMemo } from 'react';
import { Trophy, Users } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { formatLakh } from '../../utils/auction';
import { teamColors } from '../../data/mockData';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';
import './PlayerShowcase.css';

const ROLE_ICONS = { BAT: '🏏', BOWL: '🎯', AR: '⚡', WK: '🧤' };

// Ladder 1 — original Hinglish escalation (₹10 Cr onwards).
const BID_REACTIONS_CLASSIC = [
  { minLakh: 400, text: 'Aree bas ho gaya bhai 😅' },
  { minLakh: 700, text: 'Aur bhi player hain 🙄' },
  { minLakh: 900, text: 'Ab to ruk jaa bhai 🛑' },
  { minLakh: 1100, text: 'Paisa ped pe nahi ugta 🌳💸' },
  { minLakh: 1300, text: 'Auctioneer ka dil baith gaya 😵' },
  { minLakh: 1500, text: 'Yeh toh Virat se bhi mehnga ho gaya 🏏👑' },
  { minLakh: 1700, text: 'RBI ko bula lo 🏦' },
  { minLakh: 1900, text: 'Loan le ke khel rahe ho? 💳🤔' },
  { minLakh: 2100, text: 'Paagal ho gaye ho! 🤯' },
  { minLakh: 2300, text: 'Bhai dimag kharab? 😱' },
  { minLakh: 2500, text: 'Iska autograph bhi free nahi milega 🖊️' },
  { minLakh: 2700, text: 'Coach bhi chai pi rahe hain shocked ☕😶' },
  { minLakh: 2900, text: 'Owner ki nani yaad aa gayi 👵💔' },
  { minLakh: 3100, text: 'Bas karo bhai, ghar bhi chalana hai 🏠' },
  { minLakh: 3300, text: 'Yeh cricket hai ya IPO? 📈' },
  { minLakh: 3500, text: 'Bidder pls visit doctor 🩺' },
  { minLakh: 3700, text: 'Itne paise mein team kharid lo 🏟️' },
  { minLakh: 3900, text: 'Sachin bhi itne ka nahi tha 🐐' },
  { minLakh: 4100, text: 'BHAGWAN BACHAYE 🙏🔥' },
];

// Ladder 2 — vibey Hinglish commentary, kicks in at ₹5 Cr.
const BID_REACTIONS_HYPE = [
  { minLakh: 400,  text: 'Opening bid? Ab maza aayega! 🏏' },
  { minLakh: 700,  text: 'Competition shuru ho chuki hai 👀' },
  { minLakh: 900,  text: 'Purse halka, excitement zyada 💸' },
  { minLakh: 1100, text: 'Yeh player demand mein lag raha hai 🔥' },
  { minLakh: 1300, text: 'Ab bidding interesting ho gayi 😎' },
  { minLakh: 1500, text: 'Captain ki pehli pasand lagta hai 🧢' },
  { minLakh: 1700, text: 'War room mein strategy change ho rahi hai 📋' },
  { minLakh: 1900, text: 'Auctioneer bhi muskura raha hai 😄' },
  { minLakh: 2100, text: 'Koi peeche hatne ko tayyar nahi 💪' },
  { minLakh: 2300, text: 'Purse se awaaz aa rahi hai... bachao! 😭' },
  { minLakh: 2500, text: 'Ye toh blockbuster auction ban gaya 🍿' },
  { minLakh: 2700, text: 'Record books ready rakho 📚' },
  { minLakh: 2900, text: 'Ye player luxury ban chuka hai 💎' },
  { minLakh: 3100, text: 'Ab har bid headlines ban rahi hai 📰' },
  { minLakh: 3300, text: 'Auction room on fire! 🔥' },
  { minLakh: 3500, text: 'Wallet HP is critically low ❤️‍🩹' },
  { minLakh: 3700, text: 'Kya trophy guarantee ke saath aata hai? 🏆' },
  { minLakh: 3900, text: 'Iss bid pe toh sab khade ho gaye 👏' },
  { minLakh: 4100, text: 'History in the making! ⭐' },
  { minLakh: 4300, text: 'Auction ka MVP moment! 🚀' },
  { minLakh: 4500, text: 'Legendary bid unlocked! 👑🏏' },
];

// Ladder 3 — English/Hinglish "finance dept" running joke, kicks in at ₹5 Cr.
const BID_REACTIONS_FINANCE = [
  { minLakh: 400,  text: 'Abhi toh party shuru hui hai! 🥳🏏' },
  { minLakh: 700,  text: 'Wallets are waking up 💰' },
  { minLakh: 900,  text: 'Looks like someone really wants this player 👀' },
  { minLakh: 1100, text: 'Bidding war initiated! 🔥' },
  { minLakh: 1300, text: 'Volt wallets feeling the heat ⚡' },
  { minLakh: 1500, text: 'Budget? Never heard of it 😅' },
  { minLakh: 1700, text: 'Finance team has entered the chat 📊' },
  { minLakh: 1900, text: 'Credit limit getting tested 💳' },
  { minLakh: 2100, text: 'This player is becoming premium 💎' },
  { minLakh: 2300, text: 'Wallet balance is sweating 🥵' },
  { minLakh: 2500, text: 'Owner: "Bas ek aur bid…" 🤞' },
  { minLakh: 2700, text: 'Volt Premier League record incoming 🚀' },
  { minLakh: 2900, text: 'Risk appetite: Maximum 📈' },
  { minLakh: 3100, text: 'EMI calculator loading… 😂' },
  { minLakh: 3300, text: 'Even the auctioneer is impressed 👏' },
  { minLakh: 3500, text: 'Loan approved? Asking for a friend 😜' },
  { minLakh: 3700, text: 'Wallet health: Critical 🚨' },
  { minLakh: 3900, text: 'Team owner has stopped blinking 😳' },
  { minLakh: 4100, text: 'This bid deserves a standing ovation 👏🔥' },
  { minLakh: 4300, text: 'Volt Finance Department is nervous ⚡💸' },
  { minLakh: 4500, text: 'LEGENDARY BID UNLOCKED! 👑⚡🏆' },
];

const BID_REACTION_LADDERS = [
  BID_REACTIONS_CLASSIC,
  BID_REACTIONS_HYPE,
  BID_REACTIONS_FINANCE,
];

function getBidReaction(lakh, ladder) {
  if (lakh == null || !ladder) return null;
  for (let i = ladder.length - 1; i >= 0; i--) {
    if (lakh >= ladder[i].minLakh) return ladder[i];
  }
  return null;
}

export default function PlayerShowcase() {
  const { state } = useAuction();
  const { current, teams, pool, soldHistory, round = 1 } = state;

  const ladder = useMemo(
    () => BID_REACTION_LADDERS[Math.floor(Math.random() * BID_REACTION_LADDERS.length)],
    [current?.player?.id],
  );

  if (!current) {
    return (
      <section className="showcase card showcase--empty">
        <Trophy size={56} />
        <h1 className="showcase__name">AUCTION COMPLETE</h1>
        <p className="showcase__empty-text">
          All {soldHistory.length} sales recorded across {round} round
          {round > 1 ? 's' : ''}. The remaining pool is empty.
        </p>
      </section>
    );
  }

  const p = current.player;
  const winner = current.highestBidderId
    ? teams.find((t) => t.id === current.highestBidderId)
    : null;
  const reaction = current ? getBidReaction(current.currentPriceLakh, ladder) : null;

  return (
    <section className="showcase card">
      <header className="showcase__header">
        <div>
          <div className="label">Base Price</div>
          <div className="showcase__base-price">₹{formatLakh(p.basePriceLakh)}</div>
        </div>

        <div className="showcase__timer">
          <Users size={14} />
          <span>
            {round > 1 && <strong>Round {round} · </strong>}
            {pool.length} left in pool
          </span>
        </div>
      </header>

      {p.funFact && (
        <p className="showcase__funfact">“{p.funFact}”</p>
      )}

      <div className="showcase__body">
        <div className="showcase__player-image">
          <div
            className={`showcase__player-image-ring ${
              current.highestBidderId ? 'showcase__player-image-ring--bidding' : ''
            }`}
          >
            <PlayerAvatar player={p} />
          </div>
          <span className="showcase__role-badge">{p.role}</span>
        </div>

        <div className="showcase__info">
          <h1 className="showcase__name">{p.name.toUpperCase()}</h1>

          <hr className="showcase__divider" />

          <ul className="showcase__meta">
            <li className="showcase__meta-row">
              <span className="showcase__meta-pair">
                <span className="showcase__meta-icon">
                  {ROLE_ICONS[p.role] ?? '🏏'}
                </span>
                <span>{p.role}</span>
              </span>
              <span className="showcase__meta-pair">
                <span className="showcase__meta-icon">💰</span>
                <span>₹{formatLakh(p.basePriceLakh)}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      {reaction && (
        <div
          key={reaction.minLakh}
          className="showcase__reaction"
          role="status"
          aria-live="polite"
        >
          {reaction.text}
        </div>
      )}

      <footer className="showcase__footer">
        <div className="showcase__bidder">
          <div
            className="showcase__bidder-badge"
            style={
              winner
                ? { background: teamColors[winner.short] || '#334' }
                : undefined
            }
          >
            <span>{winner ? winner.short : '—'}</span>
          </div>
          <div>
            <div className="label">Highest Bidder</div>
            <div className="showcase__bidder-name">
              {winner ? winner.name : 'No bids yet'}
            </div>
          </div>
        </div>

        <div className="showcase__current-price">
          <div className="label" style={{ color: 'var(--accent-green)' }}>
            Current Price
          </div>
          <div
            key={current.currentPriceLakh}
            className="showcase__current-price-value"
          >
            ₹{formatLakh(current.currentPriceLakh)}
          </div>
        </div>
      </footer>
    </section>
  );
}
