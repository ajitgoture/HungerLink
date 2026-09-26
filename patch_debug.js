const fs = require('fs');

let file = 'client/src/pages/cloth/DonateClothForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// Inject console logs into handleItemChange
content = content.replace(
  /const handleItemChange = \(index, field, value\) => \{/g,
  `const handleItemChange = (index, field, value) => {
    console.log("handleItemChange triggered:", { index, field, value });`
);

// Inject render logs
content = content.replace(
  /const currentSizeOptions = getSizeOptions\(item\.recipientCategory, item\.type\);/g,
  `const currentSizeOptions = getSizeOptions(item.recipientCategory, item.type);
   console.log("Render item", idx, ":", item);
   console.log("currentTypeOptions:", currentTypeOptions);
   console.log("currentSizeOptions:", currentSizeOptions);`
);

fs.writeFileSync(file, content);
console.log('Injected debug logs');
