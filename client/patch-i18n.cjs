const fs = require('fs');
const file = 'client/src/locales/en.json';
let en = JSON.parse(fs.readFileSync(file, 'utf8'));

const newKeys = {
  "Recipient Category *": "Recipient Category *",
  "Clothing Item": "Clothing Item",
  "Add Another Clothing Item": "Add Another Clothing Item",
  "Remove Item": "Remove Item",
  "Item": "Item",
  "Total Qty:": "Total Qty:",
  "Total Pieces:": "Total Pieces:",
  "pieces": "pieces",
  "Available Items:": "Available Items:",
  "more items...": "more items...",
  "Items Donation": "Items Donation",
  "Category is required.": "Category is required.",
  "Type is required.": "Type is required.",
  "Size is required.": "Size is required.",
  "Quantity must be a positive integer.": "Quantity must be a positive integer.",
  "At least one clothing item is required.": "At least one clothing item is required.",
  "Clothing Items:": "Clothing Items:"
};

for (const [key, val] of Object.entries(newKeys)) {
  if (!en[key]) {
    en[key] = val;
  }
}

fs.writeFileSync(file, JSON.stringify(en, null, 2));
