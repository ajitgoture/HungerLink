const fs = require('fs');

let file = 'client/src/pages/cloth/DonateClothForm.jsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/t\(\`Recipient Category is required for Item \$\{i \+ 1\}\`\)/, `t('Recipient Category is required') + ' (' + t('Clothing Item') + ' ' + (i + 1) + ')'`);
c = c.replace(/t\(\`Clothing Type is required for Item \$\{i \+ 1\}\`\)/, `t('Clothing Type is required') + ' (' + t('Clothing Item') + ' ' + (i + 1) + ')'`);
c = c.replace(/t\(\`Size is required for Item \$\{i \+ 1\}\`\)/, `t('Size is required') + ' (' + t('Clothing Item') + ' ' + (i + 1) + ')'`);
c = c.replace(/t\(\`Quantity must be a positive integer for Item \$\{i \+ 1\}\`\)/, `t('Quantity must be a positive integer') + ' (' + t('Clothing Item') + ' ' + (i + 1) + ')'`);
c = c.replace(/t\(\`Condition is required for Item \$\{i \+ 1\}\`\)/, `t('Condition is required') + ' (' + t('Clothing Item') + ' ' + (i + 1) + ')'`);

fs.writeFileSync(file, c);
