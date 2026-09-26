const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'client/src/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newKeys = [
  "Clothing Items",
  "Recipient Category",
  "Clothing Type",
  "Size",
  "Quantity",
  "Condition",
  "Season",
  "Men",
  "Women",
  "Children",
  "Unisex",
  "New",
  "Like New",
  "Good",
  "Fair",
  "All Season",
  "Summer",
  "Winter",
  "Monsoon",
  "Formal",
  "Sports",
  "Other",
  "Add Another Clothing Item",
  "Remove Item",
  "Total Pieces",
  "Available For Pickup From",
  "Preferred Time Window",
  "Description",
  "Images",
  "Recipient Category is required",
  "Clothing Type is required",
  "Size is required",
  "Quantity must be a positive integer"
];

const knTranslations = {
  "Men": "ಪುರುಷರು",
  "Women": "ಮಹಿಳೆಯರು",
  "Children": "ಮಕ್ಕಳು",
  "Unisex": "ಯುನಿಸೆಕ್ಸ್",
  "Clothing Items": "ಬಟ್ಟೆ ವಸ್ತುಗಳು",
  "Recipient Category": "ಸ್ವೀಕರಿಸುವವರ ವರ್ಗ",
  "Clothing Type": "ಬಟ್ಟೆಯ ಪ್ರಕಾರ",
  "Size": "ಗಾತ್ರ",
  "Quantity": "ಪ್ರಮಾಣ",
  "Condition": "ಸ್ಥಿತಿ",
  "Season": "ಋತು",
  "New": "ಹೊಸತು",
  "Like New": "ಹೊಸದರಂತೆ",
  "Good": "ಉತ್ತಮ",
  "Fair": "ಸಾಧಾರಣ",
  "All Season": "ಎಲ್ಲಾ ಋತುಗಳು",
  "Summer": "ಬೇಸಿಗೆ",
  "Winter": "ಚಳಿಗಾಲ",
  "Monsoon": "ಮಳೆಗಾಲ",
  "Formal": "ಔಪಚಾರಿಕ",
  "Sports": "ಕ್ರೀಡೆ",
  "Other": "ಇತರೆ",
  "Add Another Clothing Item": "ಮತ್ತೊಂದು ಬಟ್ಟೆ ಸೇರಿಸಿ",
  "Remove Item": "ವಸ್ತು ತೆಗೆಯಿರಿ",
  "Total Pieces": "ಒಟ್ಟು ತುಂಡುಗಳು",
  "Available For Pickup From": "ಇಲ್ಲಿಂದ ಪಿಕಪ್‌ಗೆ ಲಭ್ಯವಿದೆ",
  "Preferred Time Window": "ಆದ್ಯತೆಯ ಸಮಯ",
  "Description": "ವಿವರಣೆ",
  "Images": "ಚಿತ್ರಗಳು"
};

const hiTranslations = {
  "Men": "पुरुष",
  "Women": "महिलाएं",
  "Children": "बच्चे",
  "Unisex": "यूनिसेक्स",
  "Clothing Items": "कपड़े के आइटम",
  "Recipient Category": "प्राप्तकर्ता श्रेणी",
  "Clothing Type": "कपड़े का प्रकार",
  "Size": "आकार",
  "Quantity": "मात्रा",
  "Condition": "स्थिति",
  "Season": "मौसम",
  "New": "नया",
  "Like New": "नए जैसा",
  "Good": "अच्छा",
  "Fair": "ठीक-ठाक",
  "All Season": "सभी मौसम",
  "Summer": "गर्मी",
  "Winter": "सर्दी",
  "Monsoon": "मानसून",
  "Formal": "औपचारिक",
  "Sports": "खेल",
  "Other": "अन्य",
  "Add Another Clothing Item": "एक और कपड़े का आइटम जोड़ें",
  "Remove Item": "आइटम हटाएं",
  "Total Pieces": "कुल टुकड़े",
  "Available For Pickup From": "पिकअप के लिए उपलब्ध",
  "Preferred Time Window": "पसंदीदा समय",
  "Description": "विवरण",
  "Images": "छवियां"
};

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  newKeys.forEach(key => {
    if (!data[key]) {
      if (file === 'kn.json' && knTranslations[key]) {
        data[key] = knTranslations[key];
      } else if (file === 'hi.json' && hiTranslations[key]) {
        data[key] = hiTranslations[key];
      } else {
        // Default to English string
        data[key] = key;
      }
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
});

console.log("Translations successfully injected!");
