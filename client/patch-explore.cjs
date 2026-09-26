const fs = require('fs');
let c = fs.readFileSync('src/pages/Explore.jsx', 'utf-8');

c = c.replace(/const urgentDonations = donations\.filter/g, 
`const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  
  const activeDonations = donations.filter(d => {
    if (activeTab === 'food' && d.expiryTime) {
       return new Date(d.expiryTime) > Date.now();
    }
    return true;
  });
  const urgentDonations = activeDonations.filter`);

c = c.replace(/donations\.length === 0 \?/g, 'activeDonations.length === 0 ?');
c = c.replace(/\{donations\.length\} \{t/g, '{activeDonations.length} {t');
c = c.replace(/donations\.map\(d => <DonationCard/g, 'activeDonations.map(d => <DonationCard');
c = c.replace(/<ExploreMap donations=\{donations\}/g, '<ExploreMap donations={activeDonations}');

fs.writeFileSync('src/pages/Explore.jsx', c);
