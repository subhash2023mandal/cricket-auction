// 90-player auction pool — all Indian. Base prices are drawn from the standard
// IPL tiers between ₹50 Lakh and ₹2 Crore (50 / 75 / 100 / 125 / 150 / 175 / 200 in Lakh).
// `imageUrl` uses i.pravatar.cc so every player gets a deterministic avatar.

const avatar = (seed) => `https://i.pravatar.cc/150?u=${seed}`;

export const players = [
  // ─── Marquee picks: ₹2.00 Cr ───────────────────────────────────────────────
  { id: 'p001', name: 'Virat Kohli',          role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '2.00 Cr', basePriceLakh: 200, imageUrl: avatar('p001') },
  { id: 'p002', name: 'Rohit Sharma',         role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '2.00 Cr', basePriceLakh: 200, imageUrl: avatar('p002') },
  { id: 'p003', name: 'Hardik Pandya',        role: 'AR',   country: 'India', tags: ['Capped', 'Indian'],   base: '2.00 Cr', basePriceLakh: 200, imageUrl: avatar('p003') },
  { id: 'p004', name: 'Jasprit Bumrah',       role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '2.00 Cr', basePriceLakh: 200, imageUrl: avatar('p004') },
  { id: 'p005', name: 'KL Rahul',             role: 'WK',   country: 'India', tags: ['Capped', 'Indian'],   base: '2.00 Cr', basePriceLakh: 200, imageUrl: avatar('p005') },
  { id: 'p006', name: 'Ravindra Jadeja',      role: 'AR',   country: 'India', tags: ['Capped', 'Indian'],   base: '2.00 Cr', basePriceLakh: 200, imageUrl: avatar('p006') },
  { id: 'p007', name: 'Mohammed Shami',       role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '2.00 Cr', basePriceLakh: 200, imageUrl: avatar('p007') },
  { id: 'p008', name: 'Rishabh Pant',         role: 'WK',   country: 'India', tags: ['Capped', 'Indian'],   base: '2.00 Cr', basePriceLakh: 200, imageUrl: avatar('p008') },
  { id: 'p009', name: 'Suryakumar Yadav',     role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '2.00 Cr', basePriceLakh: 200, imageUrl: avatar('p009') },
  { id: 'p010', name: 'Shubman Gill',         role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '2.00 Cr', basePriceLakh: 200, imageUrl: avatar('p010') },
  { id: 'p011', name: 'Mohammed Siraj',       role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '2.00 Cr', basePriceLakh: 200, imageUrl: avatar('p011') },
  { id: 'p012', name: 'Yuzvendra Chahal',     role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '2.00 Cr', basePriceLakh: 200, imageUrl: avatar('p012') },

  // ─── Tier: ₹1.75 Cr ────────────────────────────────────────────────────────
  { id: 'p013', name: 'Shreyas Iyer',         role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.75 Cr', basePriceLakh: 175, imageUrl: avatar('p013') },
  { id: 'p014', name: 'Ishan Kishan',         role: 'WK',   country: 'India', tags: ['Capped', 'Indian'],   base: '1.75 Cr', basePriceLakh: 175, imageUrl: avatar('p014') },
  { id: 'p015', name: 'Sanju Samson',         role: 'WK',   country: 'India', tags: ['Capped', 'Indian'],   base: '1.75 Cr', basePriceLakh: 175, imageUrl: avatar('p015') },
  { id: 'p016', name: 'Axar Patel',           role: 'AR',   country: 'India', tags: ['Capped', 'Indian'],   base: '1.75 Cr', basePriceLakh: 175, imageUrl: avatar('p016') },
  { id: 'p017', name: 'Kuldeep Yadav',        role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.75 Cr', basePriceLakh: 175, imageUrl: avatar('p017') },
  { id: 'p018', name: 'Tilak Varma',          role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.75 Cr', basePriceLakh: 175, imageUrl: avatar('p018') },
  { id: 'p019', name: 'Yashasvi Jaiswal',     role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.75 Cr', basePriceLakh: 175, imageUrl: avatar('p019') },
  { id: 'p020', name: 'Ruturaj Gaikwad',      role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.75 Cr', basePriceLakh: 175, imageUrl: avatar('p020') },
  { id: 'p021', name: 'Bhuvneshwar Kumar',    role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.75 Cr', basePriceLakh: 175, imageUrl: avatar('p021') },
  { id: 'p022', name: 'Arshdeep Singh',       role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.75 Cr', basePriceLakh: 175, imageUrl: avatar('p022') },

  // ─── Tier: ₹1.50 Cr ────────────────────────────────────────────────────────
  { id: 'p023', name: 'Deepak Chahar',        role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.50 Cr', basePriceLakh: 150, imageUrl: avatar('p023') },
  { id: 'p024', name: 'Washington Sundar',    role: 'AR',   country: 'India', tags: ['Capped', 'Indian'],   base: '1.50 Cr', basePriceLakh: 150, imageUrl: avatar('p024') },
  { id: 'p025', name: 'Prasidh Krishna',      role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.50 Cr', basePriceLakh: 150, imageUrl: avatar('p025') },
  { id: 'p026', name: 'Shardul Thakur',       role: 'AR',   country: 'India', tags: ['Capped', 'Indian'],   base: '1.50 Cr', basePriceLakh: 150, imageUrl: avatar('p026') },
  { id: 'p027', name: 'Umran Malik',          role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.50 Cr', basePriceLakh: 150, imageUrl: avatar('p027') },
  { id: 'p028', name: 'Avesh Khan',           role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.50 Cr', basePriceLakh: 150, imageUrl: avatar('p028') },
  { id: 'p029', name: 'Sai Sudharsan',        role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.50 Cr', basePriceLakh: 150, imageUrl: avatar('p029') },
  { id: 'p030', name: 'Rajat Patidar',        role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.50 Cr', basePriceLakh: 150, imageUrl: avatar('p030') },
  { id: 'p031', name: 'Venkatesh Iyer',       role: 'AR',   country: 'India', tags: ['Capped', 'Indian'],   base: '1.50 Cr', basePriceLakh: 150, imageUrl: avatar('p031') },
  { id: 'p032', name: 'Krunal Pandya',        role: 'AR',   country: 'India', tags: ['Capped', 'Indian'],   base: '1.50 Cr', basePriceLakh: 150, imageUrl: avatar('p032') },
  { id: 'p033', name: 'Shikhar Dhawan',       role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.50 Cr', basePriceLakh: 150, imageUrl: avatar('p033') },
  { id: 'p034', name: 'Dinesh Karthik',       role: 'WK',   country: 'India', tags: ['Capped', 'Indian'],   base: '1.50 Cr', basePriceLakh: 150, imageUrl: avatar('p034') },
  { id: 'p035', name: 'Ajinkya Rahane',       role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.50 Cr', basePriceLakh: 150, imageUrl: avatar('p035') },

  // ─── Tier: ₹1.25 Cr ────────────────────────────────────────────────────────
  { id: 'p036', name: 'Cheteshwar Pujara',    role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.25 Cr', basePriceLakh: 125, imageUrl: avatar('p036') },
  { id: 'p037', name: 'Hanuma Vihari',        role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.25 Cr', basePriceLakh: 125, imageUrl: avatar('p037') },
  { id: 'p038', name: 'Mayank Agarwal',       role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.25 Cr', basePriceLakh: 125, imageUrl: avatar('p038') },
  { id: 'p039', name: 'Prithvi Shaw',         role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.25 Cr', basePriceLakh: 125, imageUrl: avatar('p039') },
  { id: 'p040', name: 'Devdutt Padikkal',     role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.25 Cr', basePriceLakh: 125, imageUrl: avatar('p040') },
  { id: 'p041', name: 'Karun Nair',           role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.25 Cr', basePriceLakh: 125, imageUrl: avatar('p041') },
  { id: 'p042', name: 'Abhishek Sharma',      role: 'AR',   country: 'India', tags: ['Capped', 'Indian'],   base: '1.25 Cr', basePriceLakh: 125, imageUrl: avatar('p042') },
  { id: 'p043', name: 'Jitesh Sharma',        role: 'WK',   country: 'India', tags: ['Capped', 'Indian'],   base: '1.25 Cr', basePriceLakh: 125, imageUrl: avatar('p043') },
  { id: 'p044', name: 'Rinku Singh',          role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.25 Cr', basePriceLakh: 125, imageUrl: avatar('p044') },
  { id: 'p045', name: 'Harshit Rana',         role: 'BOWL', country: 'India', tags: ['Uncapped', 'Indian'], base: '1.25 Cr', basePriceLakh: 125, imageUrl: avatar('p045') },
  { id: 'p046', name: 'Vaibhav Arora',        role: 'BOWL', country: 'India', tags: ['Uncapped', 'Indian'], base: '1.25 Cr', basePriceLakh: 125, imageUrl: avatar('p046') },
  { id: 'p047', name: 'Akash Madhwal',        role: 'BOWL', country: 'India', tags: ['Uncapped', 'Indian'], base: '1.25 Cr', basePriceLakh: 125, imageUrl: avatar('p047') },
  { id: 'p048', name: 'Mukesh Choudhary',     role: 'BOWL', country: 'India', tags: ['Uncapped', 'Indian'], base: '1.25 Cr', basePriceLakh: 125, imageUrl: avatar('p048') },

  // ─── Tier: ₹1.00 Cr ────────────────────────────────────────────────────────
  { id: 'p049', name: 'Riyan Parag',          role: 'AR',   country: 'India', tags: ['Capped', 'Indian'],   base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p049') },
  { id: 'p050', name: 'Sarfaraz Khan',        role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p050') },
  { id: 'p051', name: 'Nitish Kumar Reddy',   role: 'AR',   country: 'India', tags: ['Capped', 'Indian'],   base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p051') },
  { id: 'p052', name: 'Mukesh Kumar',         role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p052') },
  { id: 'p053', name: 'Mayank Yadav',         role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p053') },
  { id: 'p054', name: 'Khaleel Ahmed',        role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p054') },
  { id: 'p055', name: 'Ravi Bishnoi',         role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p055') },
  { id: 'p056', name: 'Manish Pandey',        role: 'BAT',  country: 'India', tags: ['Capped', 'Indian'],   base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p056') },
  { id: 'p057', name: 'T Natarajan',          role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p057') },
  { id: 'p058', name: 'Mohit Sharma',         role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p058') },
  { id: 'p059', name: 'Sandeep Sharma',       role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p059') },
  { id: 'p060', name: 'Shivam Dube',          role: 'AR',   country: 'India', tags: ['Capped', 'Indian'],   base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p060') },
  { id: 'p061', name: 'Anuj Rawat',           role: 'WK',   country: 'India', tags: ['Uncapped', 'Indian'], base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p061') },
  { id: 'p062', name: 'Rahul Tewatia',        role: 'AR',   country: 'India', tags: ['Capped', 'Indian'],   base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p062') },
  { id: 'p063', name: 'Tushar Deshpande',     role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '1.00 Cr', basePriceLakh: 100, imageUrl: avatar('p063') },

  // ─── Tier: ₹75 Lakh ────────────────────────────────────────────────────────
  { id: 'p064', name: 'Mohammed Azharuddeen', role: 'WK',   country: 'India', tags: ['Uncapped', 'Indian'], base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p064') },
  { id: 'p065', name: 'Atharva Taide',        role: 'BAT',  country: 'India', tags: ['Uncapped', 'Indian'], base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p065') },
  { id: 'p066', name: 'Wriddhiman Saha',      role: 'WK',   country: 'India', tags: ['Capped', 'Indian'],   base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p066') },
  { id: 'p067', name: 'KS Bharat',            role: 'WK',   country: 'India', tags: ['Capped', 'Indian'],   base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p067') },
  { id: 'p068', name: 'Robin Minz',           role: 'WK',   country: 'India', tags: ['Uncapped', 'Indian'], base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p068') },
  { id: 'p069', name: 'Kumar Kushagra',       role: 'WK',   country: 'India', tags: ['Uncapped', 'Indian'], base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p069') },
  { id: 'p070', name: 'Mahipal Lomror',       role: 'AR',   country: 'India', tags: ['Uncapped', 'Indian'], base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p070') },
  { id: 'p071', name: 'Shahbaz Ahmed',        role: 'AR',   country: 'India', tags: ['Uncapped', 'Indian'], base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p071') },
  { id: 'p072', name: 'Krishnappa Gowtham',   role: 'AR',   country: 'India', tags: ['Capped', 'Indian'],   base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p072') },
  { id: 'p073', name: 'Murugan Ashwin',       role: 'BOWL', country: 'India', tags: ['Uncapped', 'Indian'], base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p073') },
  { id: 'p074', name: 'Piyush Chawla',        role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p074') },
  { id: 'p075', name: 'Amit Mishra',          role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p075') },
  { id: 'p076', name: 'Shivam Mavi',          role: 'BOWL', country: 'India', tags: ['Uncapped', 'Indian'], base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p076') },
  { id: 'p077', name: 'Kartik Tyagi',         role: 'BOWL', country: 'India', tags: ['Uncapped', 'Indian'], base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p077') },
  { id: 'p078', name: 'Chetan Sakariya',      role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '75 L',    basePriceLakh: 75,  imageUrl: avatar('p078') },

  // ─── Tier: ₹50 Lakh ────────────────────────────────────────────────────────
  { id: 'p079', name: 'Anukul Roy',           role: 'AR',   country: 'India', tags: ['Uncapped', 'Indian'], base: '50 L',    basePriceLakh: 50,  imageUrl: avatar('p079') },
  { id: 'p080', name: 'Yash Dayal',           role: 'BOWL', country: 'India', tags: ['Uncapped', 'Indian'], base: '50 L',    basePriceLakh: 50,  imageUrl: avatar('p080') },
  { id: 'p081', name: 'Shams Mulani',         role: 'AR',   country: 'India', tags: ['Uncapped', 'Indian'], base: '50 L',    basePriceLakh: 50,  imageUrl: avatar('p081') },
  { id: 'p082', name: 'Aman Hakim Khan',      role: 'BOWL', country: 'India', tags: ['Uncapped', 'Indian'], base: '50 L',    basePriceLakh: 50,  imageUrl: avatar('p082') },
  { id: 'p083', name: 'Tanush Kotian',        role: 'AR',   country: 'India', tags: ['Uncapped', 'Indian'], base: '50 L',    basePriceLakh: 50,  imageUrl: avatar('p083') },
  { id: 'p084', name: 'Sumit Kumar',          role: 'BOWL', country: 'India', tags: ['Uncapped', 'Indian'], base: '50 L',    basePriceLakh: 50,  imageUrl: avatar('p084') },
  { id: 'p085', name: 'M Siddharth',          role: 'BOWL', country: 'India', tags: ['Uncapped', 'Indian'], base: '50 L',    basePriceLakh: 50,  imageUrl: avatar('p085') },
  { id: 'p086', name: 'Akash Singh',          role: 'BOWL', country: 'India', tags: ['Uncapped', 'Indian'], base: '50 L',    basePriceLakh: 50,  imageUrl: avatar('p086') },
  { id: 'p087', name: 'Akash Deep',           role: 'BOWL', country: 'India', tags: ['Capped', 'Indian'],   base: '50 L',    basePriceLakh: 50,  imageUrl: avatar('p087') },
  { id: 'p088', name: 'Vidwath Kaverappa',    role: 'BOWL', country: 'India', tags: ['Uncapped', 'Indian'], base: '50 L',    basePriceLakh: 50,  imageUrl: avatar('p088') },
  { id: 'p089', name: 'Saurabh Kumar',        role: 'AR',   country: 'India', tags: ['Uncapped', 'Indian'], base: '50 L',    basePriceLakh: 50,  imageUrl: avatar('p089') },
  { id: 'p090', name: 'Suyash Sharma',        role: 'BOWL', country: 'India', tags: ['Uncapped', 'Indian'], base: '50 L',    basePriceLakh: 50,  imageUrl: avatar('p090') },
];

export const totalPlayers = players.length;
