const fs = require('fs');
let s = fs.readFileSync('client/src/components/ReviewForm.jsx', 'utf8');

const target = `      await api.post('/reviews/submit', {
        donationId: donation._id || donation.id,
        moduleType: donation.moduleType || (donation.foodName ? 'food' : 'cloth'),
        rating,`;

const replacement = `      await api.post('/reviews/submit', {
        donationId: donation._id || donation.id,
        moduleType: donation.moduleType || (donation.foodName ? 'food' : 'cloth'),
        revieweeId: isDonor ? (donation.acceptedReceiver?._id || donation.acceptedReceiver) : (donation.donor?._id || donation.donor),
        rating,`;

s = s.replace(target, replacement);

fs.writeFileSync('client/src/components/ReviewForm.jsx', s);
console.log('Fixed ReviewForm');
