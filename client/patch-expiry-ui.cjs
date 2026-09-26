const fs = require('fs');
let detailFile = 'src/pages/DonationDetail.jsx';
let c = fs.readFileSync(detailFile, 'utf8');

c = c.replace(/if \(!donation\) return;\n\s*const interval = setInterval\(\(\) => \{/, 
`if (!donation) return;
    const interval = setInterval(() => {
      if (!isFood) return;`);

const availRegex = /\{new Date\(donation\.availableFrom\)\.toLocaleString\([\s\S]*?\{' - '\}\s*\{new Date\(donation\.expiryTime\)\.toLocaleString\([\s\S]*?\}\)\}/;

const availReplacement = `{new Date(donation.availableFrom).toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' })}
                          {isFood && donation.expiryTime && (
                            <>
                              {' - '}
                              {new Date(donation.expiryTime).toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' })}
                            </>
                          )}`;

c = c.replace(availRegex, availReplacement);
fs.writeFileSync(detailFile, c);
