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

const localImage = (id) => `/players/${id}.jpg`;

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
  ['p050', 'Vaibhav Arora',         'WK'],

  ['p051', 'Adit',                  'BAT'],
  ['p052', 'Manoj G V',             'BOWL'],
  ['p053', 'Spoorthi Bhat P',       'AR'],
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
  ['p069', 'Tanmay Kumar',          'AR'],
  ['p070', 'Shaik Muhammad Irfan',  'WK'],
  ['p071', 'Jnanesha P S',          'BAT'],
  ['p072', 'Pankaj',                'BOWL'],
  ['p073', 'Tushar',                'AR'],
];

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
    funFact: '',
  };
});

export const totalPlayers = players.length;
