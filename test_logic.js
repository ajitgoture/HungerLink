const { JSDOM } = require('jsdom');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Since this is JSX, I can't easily compile it in Node without babel.
// But I can verify the logical mapping functions manually in JS.

const typeOptionsMap = {
  Men: ['Shirt', 'T-Shirt', 'Pants', 'Jeans', 'Shorts', 'Kurta', 'Jacket', 'Sweater', 'Coat', 'Suit', 'Traditional Wear', 'Sportswear', 'Other'],
  Women: ['Saree', 'Salwar Suit', 'Kurti', 'Dress', 'Top', 'Shirt', 'T-Shirt', 'Jeans', 'Pants', 'Skirt', 'Jacket', 'Sweater', 'Coat', 'Traditional Wear', 'Sportswear', 'Other'],
  Children: ['T-Shirt', 'Shirt', 'Pants', 'Jeans', 'Shorts', 'Dress', 'Frock', 'Sweater', 'Jacket', 'School Uniform', 'Sportswear', 'Other'],
  Unisex: ['T-Shirt', 'Shirt', 'Hoodie', 'Jacket', 'Sweater', 'Jeans', 'Pants', 'Shorts', 'Sportswear', 'Other']
};

const getSizeOptions = (category, type) => {
  if (!category || !type) return [];
  if (category === 'Children') {
    return ['0-3 Months', '3-6 Months', '6-12 Months', '1-2 Years', '2-3 Years', '3-4 Years', '4-5 Years', '5-6 Years', '6-8 Years', '8-10 Years', '10-12 Years', '12-14 Years', '14-16 Years', 'Other'];
  }
  if (['Saree', 'Traditional Wear'].includes(type)) {
    return ['Free Size', 'Other'];
  }
  if (['Pants', 'Jeans', 'Shorts', 'Skirt'].includes(type)) {
    return ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', 'Other'];
  }
  return ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size', 'Other'];
};

let item = { recipientCategory: '', type: '', size: '' };

const handleItemChange = (field, value) => {
  item[field] = value;
  if (field === 'recipientCategory') {
    item.type = '';
    item.size = '';
  }
  if (field === 'type') {
    item.size = '';
  }
};

console.log("INITIAL STATE:", item);

// Simulate user selecting Men
handleItemChange('recipientCategory', 'Men');
console.log("AFTER SELECTING MEN:", item);

let currentTypeOptions = (item.recipientCategory && typeOptionsMap[item.recipientCategory]) ? typeOptionsMap[item.recipientCategory] : [];
console.log("TYPE OPTIONS FOR MEN:", currentTypeOptions);

// Simulate user selecting Shirt
handleItemChange('type', 'Shirt');
console.log("AFTER SELECTING SHIRT:", item);

let currentSizeOptions = getSizeOptions(item.recipientCategory, item.type);
console.log("SIZE OPTIONS FOR SHIRT:", currentSizeOptions);

// Simulate user selecting M
handleItemChange('size', 'M');
console.log("AFTER SELECTING M:", item);

// Simulate changing category to Women
handleItemChange('recipientCategory', 'Women');
console.log("AFTER CHANGING TO WOMEN:", item);
console.log("TYPE OPTIONS FOR WOMEN:", (item.recipientCategory && typeOptionsMap[item.recipientCategory]) ? typeOptionsMap[item.recipientCategory] : []);
console.log("SIZE OPTIONS (SHOULD BE EMPTY):", getSizeOptions(item.recipientCategory, item.type));

// Simulate selecting Saree
handleItemChange('type', 'Saree');
console.log("AFTER SELECTING SAREE:", item);
console.log("SIZE OPTIONS FOR SAREE:", getSizeOptions(item.recipientCategory, item.type));
