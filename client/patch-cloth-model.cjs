const fs = require('fs');

function patchModel() {
  const modelFile = 'd:/Smart_Unified_Donation_System/server/models/ClothDonation.js';
  let c = fs.readFileSync(modelFile, 'utf-8');

  // Add the items array schema
  if (!c.includes('items: [')) {
    const itemsSchema = `
    items: [
      {
        recipientCategory: {
          type: String,
          enum: ['Men', 'Women', 'Children', 'Unisex'],
          required: true
        },
        type: {
          type: String,
          required: true
        },
        size: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        condition: {
          type: String,
          enum: ['New', 'Like New', 'Good', 'Usable', 'Fair'],
          required: true
        },
        season: {
          type: String,
          default: 'All Season'
        }
      }
    ],
    // Legacy fields made optional for backward compatibility
`;
    c = c.replace(/clothingCategory:\s*\{\s*type: String,\s*enum: \['Men', 'Women', 'Children', 'Unisex'\],\s*required: \[true, 'Clothing category is required'\],\s*\},/, itemsSchema + `clothingCategory: {
      type: String,
      enum: ['Men', 'Women', 'Children', 'Unisex']
    },`);

    // Remove required from clothingType
    c = c.replace(/required: \[true, 'Clothing type is required'\]/, 'required: false');
    // Remove required from quantity
    c = c.replace(/required: \[true, 'Quantity is required'\]/, 'required: false');
    // Remove required from size
    c = c.replace(/required: \[true, 'Size is required'\]/, 'required: false');
    // Remove required from condition
    c = c.replace(/required: \[true, 'Condition is required'\]/, 'required: false');
    // Remove required from season
    c = c.replace(/required: \[true, 'Season is required'\]/, 'required: false');

    fs.writeFileSync(modelFile, c);
    console.log('Patched ClothDonation model');
  }
}

patchModel();
