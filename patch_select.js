const fs = require('fs');

let file = 'client/src/pages/cloth/DonateClothForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Recipient Category
content = content.replace(/<Select[\s\n]*value=\{item\.recipientCategory\}[\s\n]*onChange=\{\(e\) => handleItemChange\(idx, 'recipientCategory', e\.target\.value\)\}[\s\n]*required[\s\n]*>[\s\n]*<option value="">\{t\("Select Category"\)\}<\/option>[\s\n]*\{Object\.keys\(typeOptionsMap\)\.map\(cat => \([\s\n]*<option key=\{cat\} value=\{cat\}>\{t\(cat\)\}<\/option>[\s\n]*\)\)\}[\s\n]*<\/Select>/,
`<Select 
  value={item.recipientCategory}
  onChange={(e) => handleItemChange(idx, 'recipientCategory', e.target.value)}
  required
  options={Object.keys(typeOptionsMap).map(cat => ({ value: cat, label: t(cat) }))}
/>`);

// 2. Type
content = content.replace(/<Select[\s\n]*value=\{item\.type\}[\s\n]*onChange=\{\(e\) => handleItemChange\(idx, 'type', e\.target\.value\)\}[\s\n]*required[\s\n]*disabled=\{!item\.recipientCategory\}[\s\n]*>[\s\n]*<option value="">\{t\("Select Type"\)\}<\/option>[\s\n]*\{currentTypeOptions\.map\(type => \([\s\n]*<option key=\{type\} value=\{type\}>\{t\(type\)\}<\/option>[\s\n]*\)\)\}[\s\n]*<\/Select>/,
`<Select
  value={item.type}
  onChange={(e) => handleItemChange(idx, 'type', e.target.value)}
  required
  disabled={!item.recipientCategory}
  options={currentTypeOptions.map(type => ({ value: type, label: t(type) }))}
/>`);

// 3. Size
content = content.replace(/<Select[\s\n]*value=\{item\.size\}[\s\n]*onChange=\{\(e\) => handleItemChange\(idx, 'size', e\.target\.value\)\}[\s\n]*required[\s\n]*disabled=\{!item\.type\}[\s\n]*>[\s\n]*<option value="">\{t\("Select Size"\)\}<\/option>[\s\n]*\{currentSizeOptions\.map\(sz => \([\s\n]*<option key=\{sz\} value=\{sz\}>\{t\(sz\)\}<\/option>[\s\n]*\)\)\}[\s\n]*<\/Select>/,
`<Select
  value={item.size}
  onChange={(e) => handleItemChange(idx, 'size', e.target.value)}
  required
  disabled={!item.type}
  options={currentSizeOptions.map(sz => ({ value: sz, label: t(sz) }))}
/>`);

// 4. Condition
content = content.replace(/<Select[\s\n]*value=\{item\.condition\}[\s\n]*onChange=\{\(e\) => handleItemChange\(idx, 'condition', e\.target\.value\)\}[\s\n]*required[\s\n]*>[\s\n]*\{\['New', 'Like New', 'Good', 'Fair'\]\.map\(cond => \([\s\n]*<option key=\{cond\} value=\{cond\}>\{t\(cond\)\}<\/option>[\s\n]*\)\)\}[\s\n]*<\/Select>/,
`<Select
  value={item.condition}
  onChange={(e) => handleItemChange(idx, 'condition', e.target.value)}
  required
  options={['New', 'Like New', 'Good', 'Fair'].map(cond => ({ value: cond, label: t(cond) }))}
/>`);

// 5. Season
content = content.replace(/<Select[\s\n]*value=\{item\.season\}[\s\n]*onChange=\{\(e\) => handleItemChange\(idx, 'season', e\.target\.value\)\}[\s\n]*>[\s\n]*\{\['All Season', 'Summer', 'Winter', 'Monsoon', 'Formal', 'Sports', 'Other'\]\.map\(s => \([\s\n]*<option key=\{s\} value=\{s\}>\{t\(s\)\}<\/option>[\s\n]*\)\)\}[\s\n]*<\/Select>/,
`<Select
  value={item.season}
  onChange={(e) => handleItemChange(idx, 'season', e.target.value)}
  options={['All Season', 'Summer', 'Winter', 'Monsoon', 'Formal', 'Sports', 'Other'].map(s => ({ value: s, label: t(s) }))}
/>`);

// 6. Time Window
content = content.replace(/<Select[\s\n]*value=\{timelines\.pickupTimeWindow\}[\s\n]*onChange=\{\(e\) => setTimelines\(\{ \.\.\.timelines, pickupTimeWindow: e\.target\.value \}\)\}[\s\n]*>[\s\n]*<option value="Flexible">\{t\("Flexible \(Anytime\)"\)\}<\/option>[\s\n]*<option value="Morning \(8 AM - 12 PM\)">\{t\("Morning \(8 AM - 12 PM\)"\)\}<\/option>[\s\n]*<option value="Afternoon \(12 PM - 4 PM\)">\{t\("Afternoon \(12 PM - 4 PM\)"\)\}<\/option>[\s\n]*<option value="Evening \(4 PM - 8 PM\)">\{t\("Evening \(4 PM - 8 PM\)"\)\}<\/option>[\s\n]*<\/Select>/,
`<Select
  value={timelines.pickupTimeWindow}
  onChange={(e) => setTimelines({ ...timelines, pickupTimeWindow: e.target.value })}
  options={[
    {value: 'Flexible', label: t('Flexible (Anytime)')},
    {value: 'Morning (8 AM - 12 PM)', label: t('Morning (8 AM - 12 PM)')},
    {value: 'Afternoon (12 PM - 4 PM)', label: t('Afternoon (12 PM - 4 PM)')},
    {value: 'Evening (4 PM - 8 PM)', label: t('Evening (4 PM - 8 PM)')}
  ]}
/>`);

fs.writeFileSync(file, content);
console.log('Patched Select props');
