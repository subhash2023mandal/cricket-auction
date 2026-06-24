// All money is stored as integer Lakh (so ₹2 Cr = 200, ₹250 Cr = 25000).
// Display helpers convert to "75 L" / "1.50 Cr" / "12.50 Cr".

export function formatLakh(lakh) {
  if (lakh == null || Number.isNaN(lakh)) return '—';
  if (lakh < 100) return `${lakh} L`;
  const cr = lakh / 100;
  // Strip trailing zero for whole numbers (e.g. "5 Cr"), keep 2dp otherwise.
  return `${Number.isInteger(cr) ? cr : cr.toFixed(2)} Cr`;
}

export function parseLakhFromBaseString(str) {
  if (!str) return 0;
  const s = String(str).trim().toLowerCase();
  const m = s.match(/([\d.]+)\s*(cr|l)?/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (Number.isNaN(n)) return 0;
  return m[2] === 'cr' ? Math.round(n * 100) : Math.round(n);
}

// Bid increments (in Lakh):
//   • Under ₹2 Cr  → +30 L per bid
//   • At/above ₹2 Cr → +50 L per bid
export function nextBidIncrement(currentLakh) {
  if (currentLakh < 200) return 30;
  return 50;
}

// The amount a team would bid right now: base price if no one has bid yet,
// otherwise the current price plus the next minimum increment.
export function nextBidAmount(currentPriceLakh, basePriceLakh, hasBids) {
  if (!hasBids) return basePriceLakh;
  return currentPriceLakh + nextBidIncrement(currentPriceLakh);
}

// Fisher-Yates shuffle, returns a new array (does not mutate input).
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const sec = Math.floor((Date.now() - timestamp) / 1000);
  if (sec < 5)   return 'just now';
  if (sec < 60)  return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60)  return `${min} min${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  return `${hr} hr${hr === 1 ? '' : 's'} ago`;
}
