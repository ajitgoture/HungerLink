const fs = require('fs');
let file = 'client/src/components/ConnectedDetailsModal.jsx';
let content = fs.readFileSync(file, 'utf8');

// Import ClickablePhoneNumber
if (!content.includes('ClickablePhoneNumber')) {
  content = content.replace(
    /import MapView from '\.\/MapView';/,
    `import MapView from './MapView';\nimport ClickablePhoneNumber from './ClickablePhoneNumber';`
  );
}

// Replace the phone div
const oldPhone = `<div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-teal-600" />
              <a href={\`tel:\${donation.contactNumber || targetPerson?.phone}\`} className="font-bold text-teal-700 hover:underline">
                {donation.contactNumber || targetPerson?.phone || '10-digit Phone'}
              </a>
            </div>`;

const newPhone = `<div className="flex items-center text-slate-700">
              <ClickablePhoneNumber 
                phone={donation.contactNumber || targetPerson?.phone} 
                showIcon={true}
                iconClassName="w-4 h-4 text-teal-600"
                textClassName="font-bold text-teal-700 hover:underline"
              />
            </div>`;

content = content.replace(oldPhone, newPhone);
fs.writeFileSync(file, content);
console.log('Patched ConnectedDetailsModal.jsx');
