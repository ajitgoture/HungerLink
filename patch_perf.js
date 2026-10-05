const fs = require('fs');

function patchForm(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add import
  if (!content.includes('compressImage')) {
    content = content.replace(
      'import { useTranslation } from "react-i18next";',
      'import { useTranslation } from "react-i18next";\nimport { compressImage } from "../../utils/imageCompressor";'
    );
  }

  // Handle Nominatim fetch with timeout
  if (content.includes('https://nominatim.openstreetmap.org/search')) {
    content = content.replace(
      /const resp = addressStr[\s\S]*?await fetch\(`https:\/\/nominatim\.openstreetmap\.org\/search\?format=json&q=\$\{encodeURIComponent\(addressStr\)\}`\)[\s\S]*?: null;/,
      `const fetchWithTimeout = (url, options, timeout = 3000) => {
            return Promise.race([
              fetch(url, options),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
            ]);
          };
          const resp = addressStr
            ? await fetchWithTimeout(\`https://nominatim.openstreetmap.org/search?format=json&q=\$\{encodeURIComponent(addressStr)}\`, {})
            : null;`
    );
  }

  // Handle compression before API post
  if (file.includes('Food')) {
    content = content.replace(
      /if \(imageFile\) submitData\.append\('foodImage', imageFile\);/,
      `if (imageFile) {
        try {
          const compressed = await compressImage(imageFile);
          submitData.append('foodImage', compressed);
        } catch (e) {
          submitData.append('foodImage', imageFile);
        }
      }`
    );
  } else if (file.includes('Cloth')) {
    content = content.replace(
      /if \(imageFile\) formDataToSend\.append\('clothImage', imageFile\);/,
      `if (imageFile) {
        try {
          const compressed = await compressImage(imageFile);
          formDataToSend.append('clothImage', compressed);
        } catch (e) {
          formDataToSend.append('clothImage', imageFile);
        }
      }`
    );
  }

  fs.writeFileSync(file, content);
  console.log('Patched', file);
}

patchForm('client/src/pages/food/DonateFoodForm.jsx');
patchForm('client/src/pages/cloth/DonateClothForm.jsx');
