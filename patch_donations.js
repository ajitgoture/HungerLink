const fs = require('fs');

function patchFile(file, colorClass) {
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('ClickablePhoneNumber')) {
    content = content.replace(
      /import api from '\.\.\/\.\.\/services\/api';/,
      `import api from '../../services/api';\nimport ClickablePhoneNumber from '../../components/ClickablePhoneNumber';`
    );
  }

  const oldRegex = new RegExp(`<span className="font-bold text-${colorClass}-700">\\{acceptedReceiver\\.phone\\}<\\/span>`);
  
  const newText = `<ClickablePhoneNumber 
                        phone={acceptedReceiver.phone}
                        showIcon={true}
                        iconClassName={\`w-4 h-4 text-${colorClass}-600\`}
                        textClassName={\`font-bold text-${colorClass}-700 hover:underline\`}
                      />`;
                      
  if (oldRegex.test(content)) {
    content = content.replace(oldRegex, newText);
    fs.writeFileSync(file, content);
    console.log(`Patched ${file}`);
  } else {
    console.log(`Could not find target in ${file}`);
  }
}

patchFile('client/src/pages/cloth/MyClothDonations.jsx', 'indigo');
patchFile('client/src/pages/food/MyDonations.jsx', 'teal');

