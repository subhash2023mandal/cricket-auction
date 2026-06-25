// Auction pool — local roster (66 entries, deduped from the source list).
// IDs are intentionally stable (gaps like p022/p038/p039/p042/p043/p045/p046
// remain so that any photos already at `public/players/{id}.jpg` stay aligned to
// the canonical id). New names continue from p051.
//
// `imageUrl` points to `public/players/{id}.jpg`. Drop a matching file in
// that folder and it appears automatically. If the file is missing, the
// PlayerAvatar component falls back to a deterministic i.pravatar.cc avatar.
//
// Base price rules (auction is decided by bids on top of the base):
//   • Premium picks (Subhash Mandal, Ankit Agarwal, Lalit Bihani) → ₹2 Cr.
//   • Everyone else gets a deterministic bucket between ₹50 L and ₹2 Cr,
//     keyed by the player's id so prices are stable across reloads.

// BASE_URL is '/' in dev and '/cricket-auction/' on GitHub Pages, so the same
// asset path works locally and after `npm run deploy`.
const localImage = (id) => `${import.meta.env.BASE_URL}players/${id}.jpg`;

const PREMIUM_BASE_LAKH = 200; // 2 Cr
const PREMIUM_IDS = new Set(['p033', 'p048', 'p049']);
const BASE_BUCKETS_LAKH = [50, 75, 100, 125, 150, 175, 200];

// Tiny string hash → keeps each id's bucket fixed instead of changing on
// every reload (which a Math.random() would do).
function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function basePriceFor(id) {
  if (PREMIUM_IDS.has(id)) return PREMIUM_BASE_LAKH;
  return BASE_BUCKETS_LAKH[hashId(id) % BASE_BUCKETS_LAKH.length];
}

function formatBase(lakh) {
  if (lakh < 100) return `${lakh} L`;
  const cr = lakh / 100;
  return `${Number.isInteger(cr) ? cr : cr.toFixed(2)} Cr`;
}


const ROSTER = [
  ['p001', 'Ashik Krishnan',        'BAT'],
  ['p002', 'Soham Sahajwani',       'BOWL'],
  ['p003', 'Priyesh Agrawal',       'AR'],
  ['p004', 'Anmol Verma',           'BAT'],
  ['p005', 'Amit Pandey',           'BOWL'],
  ['p006', 'Ranjithkumar G',        'AR'],
  ['p007', 'Mayank Kriparam',       'BAT'],
  ['p008', 'Ashutosh',              'BOWL'],
  ['p009', 'Arpit Luniya',          'AR'],
  ['p010', 'Mahesh Reddy',          'WK'],
  ['p011', 'Dhruv Dubey',           'BAT'],
  ['p012', 'Harsh Mani Tripathi',   'BOWL'],
  ['p013', 'Abhishek Singh',        'AR'],
  ['p014', 'Pratyush Tiwari',       'BAT'],
  ['p015', 'Nishant Yadav',         'BOWL'],
  ['p016', 'Jasdeep Juneja',        'AR'],
  ['p017', 'Syed Afrid',            'BAT'],
  ['p018', 'Debesh Pattanaik',      'BOWL'],
  ['p019', 'Ananta Roy',            'AR'],
  ['p020', 'Shivam Gupta',          'WK'],
  ['p021', 'Madhav',                'BAT'],
  ['p023', 'Anshu Kumar',           'AR'],
  ['p024', 'Vivek',                 'BAT'],
  ['p025', 'Asit',                  'BOWL'],
  ['p026', 'Amit',                  'AR'],
  ['p027', 'Shankar Vyas',          'BAT'],
  ['p028', 'Akshay',                'BOWL'],
  ['p029', 'Swarabharavi Ulaya',    'AR'],
  ['p030', 'Suhaib Rayyan',         'WK'],
  ['p031', 'Anish Kumar',           'BAT'],
  ['p032', 'Vishal Jain',           'BOWL'],
  ['p033', 'Subhash Mandal',        'AR'],
  ['p034', 'Vidya Sagar',           'BAT'],
  ['p035', 'Johnson Pinto',         'BOWL'],
  ['p036', 'Parvez Khandakar',      'AR'],
  ['p037', 'Akash Thakur',          'BAT'],
  ['p040', 'Nishant Kumar',         'WK'],
  ['p041', 'Ananta Ray',            'BAT'],
  ['p044', 'Bikash Jena',           'BAT'],
  ['p047', 'Abhijit Taware',        'BAT'],
  ['p048', 'Ankit Agarwal',         'AR'],
  ['p049', 'Lalit Bihani',          'BOWL'],
  ['p050', 'Vaibhav Arora',         'AR'],

  ['p051', 'Adit',                  'BAT'],
  ['p052', 'Manoj G V',             'BOWL'],
  ['p054', 'Surya',                 'BAT'],
  ['p055', 'Rahul Sarungbam Singh', 'BOWL'],
  ['p056', 'Rashid Khan',           'AR'],
  ['p057', 'Baharul',               'BAT'],
  ['p058', 'Srinivas G',            'BOWL'],
  ['p059', 'Jomy Mathew',           'AR'],
  ['p060', 'Vivek Nair',            'WK'],
  ['p061', 'S Vijay Kumar',         'BAT'],
  ['p062', 'Sarthik Chothani',      'BOWL'],
  ['p063', 'Keyur',                 'AR'],
  ['p064', 'Yash Carpenter',        'BAT'],
  ['p065', 'Ameya',                 'BOWL'],
  ['p066', 'Rushikesh Kalantri',    'AR'],
  ['p067', 'Shreyas',               'BAT'],
  ['p068', 'Abhijeet Jha',          'BOWL'],
  ['p070', 'Shaik Muhammad Irfan',  'WK'],
  ['p071', 'Jnanesha P S',          'BAT'],
  ['p072', 'Pankaj',                'BOWL'],
  ['p073', 'Tushar',                'AR'],
  ['p074', 'Mohit Pareek',          'BAT'],
  ['p075', 'Gaurav Kumar',          'BOWL'],
  ['p076', 'Tanmay Kumar',          'AR'],
  ['p077', 'Shrishti Kashyap',      'BAT'],
  ['p078', 'Karthikeyan M',         'BOWL'],
  ['p079', 'Karuna Sankolli',       'WK'],
  ['p080', 'Manav Mittal',          'BAT'],
];

// One-liner descriptions shown in the player showcase. Premium picks
// (Subhash, Ankit, Lalit) get genuinely flattering scouting reports —
// everyone else gets a tongue-in-cheek riff on the name / persona.
const FUN_FACTS = {
  p001: 'Cover drives so smooth, even the ball stops to clap.',
  p002: 'Bowls yorkers — blames Bluetooth lag whenever they go for six.',
  p003: 'All-rounder by hobby, networking pro by profession.',
  p004: 'His bat costs more than his bike. Both have seen better mileage.',
  p005: 'Bowls fast. Walks faster — especially toward the lunch tent.',
  p006: 'The G is silent. The appeal isn’t.',
  p007: 'Promised a wicket every over. Stats so far: 12 overs, 1 wicket — his own.',
  p008: 'First-name-only player; treats every T20 like an aerobics class.',
  p009: 'Single-handed sixes, double-handed selfies.',
  p010: 'Keeps every wicket — and every secret behind the stumps.',
  p011: 'Steady as a tax filing, twice as dependable.',
  p012: 'Three names, one mood: aggressive.',
  p013: 'Hit a six in 2019. It’s still being looked for in the next district.',
  p014: 'Off-spin so confusing, Google Maps reroutes mid-delivery.',
  p015: 'Calm by name (Nishant). Chaos against the short ball.',
  p016: 'Bats like a wedding buffet line — picks the best deliveries first.',
  p017: 'Allegedly related to Shahid. Equally unpredictable.',
  p018: 'Bowls with the precision of a CRUD operation.',
  p019: 'Endless (Ananta) potential. Finite stamina.',
  p020: 'Keeps wicket. Also keeps the team WhatsApp birthday tracker.',
  p021: 'Plays cricket because Excel sheets aren’t thrilling enough.',
  p023: 'Quiet on the pitch. Loud on the team chat.',
  p024: 'Insists wisdom comes with age. Refuses to age past 25.',
  p025: 'Three-letter name. Three-hour debate after every dismissal.',
  p026: 'Generic name. Dangerously specific yorkers.',
  p027: 'Treats the pitch like a stage — mid-pitch monologues included.',
  p028: 'Indestructible (Akshay) by name. His bat — significantly less so.',
  p029: 'Long name. Even longer boundaries.',
  p030: 'Collects edges behind the stumps like Pokémon cards.',
  p031: 'Bats left. Swears right. Hits both ends.',
  p032: 'Vishal-sized heart. Bigger appetite for the deep-cover boundary.',
  p033: 'Captain material. Reads the game two overs ahead, keeps cool under fire, and lifts the team when it matters most.',
  p034: 'Ocean of cricket knowledge. Most of it stored in YouTube tabs.',
  p035: 'Foreign-sounding name. Very desi off-cutters.',
  p036: 'Brings biryani after every match. Win or lose. Usually wins.',
  p037: 'The sky (Akash) is the limit. So is his off-stump line.',
  p040: 'Calm under pressure. Hopelessly lost when keeping score.',
  p041: 'Endless overs. Infinite hope. Occasional wickets.',
  p044: 'Engineer by day. Run-machine by weekend.',
  p047: 'Old-school technique, new-school slogs. Confuses the field, scores anyway.',
  p048: 'A complete cricketer — silken with the bat, surgical with the ball, and the calm head every captain wants at the death.',
  p049: 'Power-hitter and game-changer. Clears boundaries with ease and flips a match’s momentum in a single over.',
  p050: 'Keeper-batter who commentates on every ball — including his own dismissals.',
  p051: 'Single-name showman. Thinks he’s Pelé. Plays like a part-timer.',
  p052: 'G stands for Grumpy. Especially after a run-out.',
  p054: 'Burns bright. Fades fast. Like a sun in playoff weather.',
  p055: 'Owns the league’s longest name and shortest backlift.',
  p056: 'Not the Rashid Khan. Tries his best. Apologises after every over.',
  p057: 'Comes from the spring (Bahar). Blooms only in the death overs.',
  p058: 'Engineer by training. No-balls by tradition.',
  p059: 'Catches everything. Except his own jaw after a misfield.',
  p060: 'Coconut-tree-tall sixes. Kerala precision.',
  p061: 'The S stands for Stealth. Has never batted above number 9.',
  p062: 'Two-syllable surname. One-purpose bat: chaaaark!',
  p063: 'Swagger of a peacock. Batting average of a chicken.',
  p064: 'Carpenters his innings — neatly, slowly, occasionally with the wrong nails.',
  p065: 'Bowls medium pace. Talks even slower.',
  p066: 'Sage on the field. College kid off it.',
  p067: 'The auspicious one (Shreyas). His bat agrees on alternate weekends.',
  p068: 'Victorious by name (Abhijeet). Fearlessly bad at fielding.',
  p070: 'Tall, lanky, terrifying. Especially the bouncer.',
  p071: 'Lord of wisdom (Jnanesha). Won’t shut up about analytics.',
  p072: 'Lotus (Pankaj) by name. Rises slowly out of every batting collapse.',
  p073: 'Frost by name (Tushar). Meltdown by the 12th over.',
  p074: 'Pareeks the pitch like a parking spot — then drives straight through it.',
  p075: 'Bowls heavy (Gaurav) deliveries. Even the umpire flinches.',
  p076: 'Came (Tanmay) for the cricket, stayed for the catered lunch.',
  p077: 'Bats with grace. Sledges with poetry. Wins the over-rate, too.',
  p078: 'The M stands for Miser. Ten dot balls or it’s personal.',
  p079: 'Kindness (Karuna) personified — until the keeper’s gloves come on.',
  p080: 'Human (Manav) batting machine. Glitches only on inswingers.',
};

export const players = ROSTER.map(([id, name, role]) => {
  const basePriceLakh = basePriceFor(id);
  return {
    id,
    name,
    role,
    country: 'India',
    tags: ['Uncapped', 'Indian'],
    base: formatBase(basePriceLakh),
    basePriceLakh,
    imageUrl: localImage(id),
    funFact: FUN_FACTS[id] || '',
  };
});

export const totalPlayers = players.length;
