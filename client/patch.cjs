const fs = require('fs');
const hi = JSON.parse(fs.readFileSync('src/locales/hi.json', 'utf-8'));

hi['Explore Available Food'] = 'उपलब्ध भोजन खोजें';
hi['Donate Surplus Food'] = 'अतिरिक्त भोजन दान करें';
hi['Donate Clothes'] = 'कपड़े दान करें';
hi['Blood Donation'] = 'रक्तदान';
hi['Dashboard'] = 'डैशबोर्ड';
hi['Log In'] = 'लॉग इन करें';
hi['Sign Up'] = 'साइन अप करें';
hi['I Want This Food'] = 'मुझे यह भोजन चाहिए';
hi['Browse Donations'] = 'दान ब्राउज़ करें';

fs.writeFileSync('src/locales/hi.json', JSON.stringify(hi, null, 2));
