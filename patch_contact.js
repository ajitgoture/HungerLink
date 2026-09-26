const fs = require('fs');

let file = 'client/src/pages/cloth/DonateClothForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add contactNumber to locationData state
content = content.replace(
  /lng: user\?\.location\?\.coordinates\?\.\[0\] \|\| -74\.006,/,
  `lng: user?.location?.coordinates?.[0] || -74.006,
    contactNumber: user?.phone || '',`
);

// 2. Add validation in handleSubmit
content = content.replace(
  /if \(!locationData\.city \|\| !locationData\.pickupAddress\) \{/,
  `if (!locationData.contactNumber || !/^[0-9]{10}$/.test(locationData.contactNumber)) {
      return setError(t("Please enter a valid 10-digit contact number"));
    }
    if (!locationData.city || !locationData.pickupAddress) {`
);

// 3. Append to submitData
content = content.replace(
  /submitData\.append\('qualityAcknowledged', qualityAcknowledged\);/,
  `submitData.append('qualityAcknowledged', qualityAcknowledged);
      submitData.append('contactNumber', locationData.contactNumber);`
);

// 4. Render the input field
content = content.replace(
  /onChange=\{\(e\) => setLocationData\(\{ \.\.\.locationData, pickupAddress: e\.target\.value \}\)\}\s*\/>\s*<\/div>\s*<\/div>/,
  `onChange={(e) => setLocationData({ ...locationData, pickupAddress: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">{t("Contact Number")} *</label>
                  <Input
                    required
                    type="tel"
                    placeholder={t("10-digit mobile number")}
                    value={locationData.contactNumber}
                    onChange={(e) => setLocationData({ ...locationData, contactNumber: e.target.value })}
                  />
                </div>
              </div>`
);

fs.writeFileSync(file, content);
console.log("Patched contactNumber in DonateClothForm.jsx");
