const fs = require('fs');
const kn = JSON.parse(fs.readFileSync('src/locales/kn.json', 'utf-8'));

kn['Explore Available Food'] = 'ಲಭ್ಯವಿರುವ ಆಹಾರವನ್ನು ಅನ್ವೇಷಿಸಿ';
kn['Donate Surplus Food'] = 'ಹೆಚ್ಚುವರಿ ಆಹಾರವನ್ನು ದಾನ ಮಾಡಿ';
kn['Donate Clothes'] = 'ಬಟ್ಟೆಗಳನ್ನು ದಾನ ಮಾಡಿ';
kn['Blood Donation'] = 'ರಕ್ತದಾನ';
kn['Dashboard'] = 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್';
kn['Log In'] = 'ಲಾಗಿನ್ ಮಾಡಿ';
kn['Sign Up'] = 'ಸೈನ್ ಅಪ್ ಮಾಡಿ';
kn['I Want This Food'] = 'ನನಗೆ ಈ ಆಹಾರ ಬೇಕು';
kn['Browse Donations'] = 'ದೇಣಿಗೆಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ';

fs.writeFileSync('src/locales/kn.json', JSON.stringify(kn, null, 2));
