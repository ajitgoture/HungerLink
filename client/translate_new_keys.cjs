const fs = require('fs');
const { translate } = require('@vitalets/google-translate-api');

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
  'Browse Donations': 'home.cta.button2'
};

async function run() {
  const knPath = 'src/locales/kn.json';
  let kn = JSON.parse(fs.readFileSync(knPath, 'utf8'));

  for (const [enStr, key] of Object.entries(replacements)) {
    try {
      const res = await translate(enStr.replace(/\\'/g, "'"), { to: 'kn' });
      if (res && res.text) {
        kn[key] = res.text;
        console.log(`Translated ${key}`);
      }
    } catch(e) {
      console.error('Failed to translate', key, e.message);
    }
  }

  fs.writeFileSync(knPath, JSON.stringify(kn, null, 2));
  console.log('Complete!');
}
run();
