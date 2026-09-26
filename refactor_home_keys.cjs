const fs = require('fs');

let c = fs.readFileSync('client/src/pages/Home.jsx', 'utf8');

const replacements = {
  'Food Module': 'home.food.badge',
  'Surplus food shouldn\'t': 'home.food.titlePart1',
  'go to waste.': 'home.food.titlePart2',
  'Whether it\'s leftover meals from a wedding, fresh produce from your farm, or extra tiffins — list it in under 2 minutes. Nearby receivers get real-time alerts and can request instantly.': 'home.food.description',
  'Explore Food Donations': 'home.food.cta',
  'Food Donation': 'home.food.imgAlt',

  'Clothes Module': 'home.clothes.badge',
  'Unused clothes deserve': 'home.clothes.titlePart1',
  'a second life.': 'home.clothes.titlePart2',
  'Sort through your wardrobe and pass on what you no longer need. Filter by size, age group, gender, and season so your clothes reach exactly who needs them most.': 'home.clothes.description',
  'Explore Clothes Donations': 'home.clothes.cta',
  'Clothes Donation': 'home.clothes.imgAlt',

  'Community': 'home.howItWorks.imgAlt',
  'Process': 'home.howItWorks.badge',
  'How HungerLink Works': 'home.howItWorks.title',
  'From listing to handover — every step is transparent, secure, and real-time.': 'home.howItWorks.subtitle',

  'Post a Donation': 'home.howItWorks.step1.title',
  'List excess food or unused clothes with photos, quantity, and pickup location in under 2 minutes.': 'home.howItWorks.step1.desc',
  
  'Real-time Alert': 'home.howItWorks.step2.title',
  'Nearby receivers are instantly notified via app alerts and can browse and request your donation.': 'home.howItWorks.step2.desc',
  
  'Live Coordination': 'home.howItWorks.step3.title',
  'Accepted receiver gets your live GPS location. Chat securely to arrange the perfect handover time.': 'home.howItWorks.step3.desc',
  
  'QR Verified Handover': 'home.howItWorks.step4.title',
  'Scan a unique QR code to confirm the transfer. Both sides rate each other to build community trust.': 'home.howItWorks.step4.desc',

  'Why HungerLink': 'home.features.badge',
  'Built for Trust & Speed': 'home.features.title',
  
  'Verified & Secure': 'home.features.item1.title',
  'Every user is JWT-authenticated. Exact GPS coordinates are only shared with verified, accepted receivers — never publicly exposed.': 'home.features.item1.desc',
  
  'Real-time Matching': 'home.features.item2.title',
  'WebSocket-powered live notifications mean a donor and receiver can complete a transaction within minutes of posting.': 'home.features.item2.desc',
  
  'Peer-to-Peer Only': 'home.features.item3.title',
  'No NGOs. No couriers. No middlemen. Just a direct connection between someone with more and someone with need.': 'home.features.item3.desc',

  'Join HungerLink': 'home.cta.imgAlt',
  'Start making a difference': 'home.cta.titlePart1',
  'today.': 'home.cta.titlePart2',
  'Join thousands of donors and receivers building a zero-waste, zero-hunger community — one handoff at a time.': 'home.cta.description',
  'Sign Up Free': 'home.cta.button1',
  'Browse Donations': 'home.cta.button2',

  'Smart category & size filtering': 'home.clothes.feature1',
  'Condition grading system': 'home.clothes.feature2',
  'Age group matching (Kids / Adults)': 'home.clothes.feature3',
  'Direct pickup coordination': 'home.clothes.feature4',
  
  'Real-time GPS location sharing': 'home.food.feature1',
  'Automatic food expiry tracking': 'home.food.feature2',
  'Veg & Non-Veg categories': 'home.food.feature3',
  'Secure QR-verified handover': 'home.food.feature4'
};

const enPath = 'client/src/locales/en.json';
const knPath = 'client/src/locales/kn.json';
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let kn = JSON.parse(fs.readFileSync(knPath, 'utf8'));

c = c.replace(/\{t\(\"Food Module\"\)\}/g, '{t(\"home.food.badge\")}');
c = c.replace(/\{t\(\"Surplus food shouldn't\"\)\}/g, '{t(\"home.food.titlePart1\")}');
c = c.replace(/\{t\(\"go to waste.\"\)\}/g, '{t(\"home.food.titlePart2\")}');
c = c.replace(/\{t\(\"Whether it's leftover meals from a wedding, fresh produce from your farm, or extra tiffins [^]*? list it in under 2 minutes. Nearby receivers get real-time alerts and can request instantly.\"\)\}/g, '{t(\"home.food.description\")}');
c = c.replace(/\{t\(\"Explore Food Donations\"\)\}/g, '{t(\"home.food.cta\")}');
c = c.replace(/t\(\"Food Donation\"\)/g, 't(\"home.food.imgAlt\")');

c = c.replace(/\{t\(\"Clothes Module\"\)\}/g, '{t(\"home.clothes.badge\")}');
c = c.replace(/\{t\(\"Unused clothes deserve\"\)\}/g, '{t(\"home.clothes.titlePart1\")}');
c = c.replace(/\{t\(\"a second life.\"\)\}/g, '{t(\"home.clothes.titlePart2\")}');
c = c.replace(/\{t\(\"Sort through your wardrobe and pass on what you no longer need. Filter by size, age group, gender, and season so your clothes reach exactly who needs them most.\"\)\}/g, '{t(\"home.clothes.description\")}');
c = c.replace(/\{t\(\"Explore Clothes Donations\"\)\}/g, '{t(\"home.clothes.cta\")}');
c = c.replace(/t\(\"Clothes Donation\"\)/g, 't(\"home.clothes.imgAlt\")');

c = c.replace(/t\(\"Community\"\)/g, 't(\"home.howItWorks.imgAlt\")');
c = c.replace(/\{t\(\"Process\"\)\}/g, '{t(\"home.howItWorks.badge\")}');
c = c.replace(/\{t\(\"How HungerLink Works\"\)\}/g, '{t(\"home.howItWorks.title\")}');
c = c.replace(/\{t\(\"From listing to handover [^]*? every step is transparent, secure, and real-time.\"\)\}/g, '{t(\"home.howItWorks.subtitle\")}');

c = c.replace(/title: t\(\"Post a Donation\"\)/g, 'title: t(\"home.howItWorks.step1.title\")');
c = c.replace(/desc: t\(\"List excess food or unused clothes with photos, quantity, and pickup location in under 2 minutes.\"\)/g, 'desc: t(\"home.howItWorks.step1.desc\")');

c = c.replace(/title: t\(\"Real-time Alert\"\)/g, 'title: t(\"home.howItWorks.step2.title\")');
c = c.replace(/desc: t\(\"Nearby receivers are instantly notified via app alerts and can browse and request your donation.\"\)/g, 'desc: t(\"home.howItWorks.step2.desc\")');

c = c.replace(/title: t\(\"Live Coordination\"\)/g, 'title: t(\"home.howItWorks.step3.title\")');
c = c.replace(/desc: t\(\"Accepted receiver gets your live GPS location. Chat securely to arrange the perfect handover time.\"\)/g, 'desc: t(\"home.howItWorks.step3.desc\")');

c = c.replace(/title: t\(\"QR Verified Handover\"\)/g, 'title: t(\"home.howItWorks.step4.title\")');
c = c.replace(/desc: t\(\"Scan a unique QR code to confirm the transfer. Both sides rate each other to build community trust.\"\)/g, 'desc: t(\"home.howItWorks.step4.desc\")');

c = c.replace(/\{t\(\"Why HungerLink\"\)\}/g, '{t(\"home.features.badge\")}');
c = c.replace(/\{t\(\"Built for Trust & Speed\"\)\}/g, '{t(\"home.features.title\")}');

c = c.replace(/title: t\(\"Verified & Secure\"\)/g, 'title: t(\"home.features.item1.title\")');
c = c.replace(/desc: t\(\"Every user is JWT-authenticated. Exact GPS coordinates are only shared with verified, accepted receivers [^]*? never publicly exposed.\"\)/g, 'desc: t(\"home.features.item1.desc\")');

c = c.replace(/title: t\(\"Real-time Matching\"\)/g, 'title: t(\"home.features.item2.title\")');
c = c.replace(/desc: t\(\"WebSocket-powered live notifications mean a donor and receiver can complete a transaction within minutes of posting.\"\)/g, 'desc: t(\"home.features.item2.desc\")');

c = c.replace(/title: t\(\"Peer-to-Peer Only\"\)/g, 'title: t(\"home.features.item3.title\")');
c = c.replace(/desc: t\(\"No NGOs. No couriers. No middlemen. Just a direct connection between someone with more and someone with need.\"\)/g, 'desc: t(\"home.features.item3.desc\")');

c = c.replace(/t\(\"Join HungerLink\"\)/g, 't(\"home.cta.imgAlt\")');
c = c.replace(/\{t\(\"Start making a difference\"\)\}/g, '{t(\"home.cta.titlePart1\")}');
c = c.replace(/\{t\(\"today.\"\)\}/g, '{t(\"home.cta.titlePart2\")}');
c = c.replace(/\{t\(\"Join thousands of donors and receivers building a zero-waste, zero-hunger community [^]*? one handoff at a time.\"\)\}/g, '{t(\"home.cta.description\")}');
c = c.replace(/\{t\(\"Sign Up Free [^]*?\"\)\}/g, '{t(\"home.cta.button1\")}');
c = c.replace(/\{t\(\"Browse Donations\"\)\}/g, '{t(\"home.cta.button2\")}');

c = c.replace(/t\('Smart category & size filtering'\)/g, 't(\"home.clothes.feature1\")');
c = c.replace(/t\('Condition grading system'\)/g, 't(\"home.clothes.feature2\")');
c = c.replace(/t\('Age group matching \\(Kids \/ Adults\\)'\)/g, 't(\"home.clothes.feature3\")');
c = c.replace(/t\('Direct pickup coordination'\)/g, 't(\"home.clothes.feature4\")');

c = c.replace(/t\('Real-time GPS location sharing'\)/g, 't(\"home.food.feature1\")');
c = c.replace(/t\('Automatic food expiry tracking'\)/g, 't(\"home.food.feature2\")');
c = c.replace(/t\('Veg & Non-Veg categories'\)/g, 't(\"home.food.feature3\")');
c = c.replace(/t\('Secure QR-verified handover'\)/g, 't(\"home.food.feature4\")');

fs.writeFileSync('client/src/pages/Home.jsx', c);

Object.entries(replacements).forEach(([enStr, key]) => {
  en[key] = enStr;
});

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(knPath, JSON.stringify(kn, null, 2));

console.log('Finished refactoring Home.jsx structural keys');
