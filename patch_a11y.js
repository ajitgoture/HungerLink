const fs = require('fs');

let file = 'client/src/pages/cloth/DonateClothForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// Category
content = content.replace(
  /<div className="space-y-1\.5">\s*<label className="text-sm font-semibold text-slate-700">\{t\("Recipient Category"\)\} \*<\/label>\s*<Select\s*value=\{item\.recipientCategory\}/,
  `<div className="space-y-1.5">
  <label htmlFor={"recipientCategory-" + idx} className="text-sm font-semibold text-slate-700">{t("Recipient Category")} *</label>
  <Select 
    id={"recipientCategory-" + idx}
    name="recipientCategory"
    value={item.recipientCategory}`
);

// Type
content = content.replace(
  /<div className="space-y-1\.5">\s*<label className="text-sm font-semibold text-slate-700">\{t\("Clothing Type"\)\} \*<\/label>\s*<Select\s*value=\{item\.type\}/,
  `<div className="space-y-1.5">
  <label htmlFor={"type-" + idx} className="text-sm font-semibold text-slate-700">{t("Clothing Type")} *</label>
  <Select
    id={"type-" + idx}
    name="type"
    value={item.type}`
);

// Size
content = content.replace(
  /<div className="space-y-1\.5">\s*<label className="text-sm font-semibold text-slate-700">\{t\("Size"\)\} \*<\/label>\s*<Select\s*value=\{item\.size\}/,
  `<div className="space-y-1.5">
  <label htmlFor={"size-" + idx} className="text-sm font-semibold text-slate-700">{t("Size")} *</label>
  <Select
    id={"size-" + idx}
    name="size"
    value={item.size}`
);

// Quantity
content = content.replace(
  /<div className="space-y-1\.5">\s*<label className="text-sm font-semibold text-slate-700">\{t\("Quantity"\)\} \*<\/label>\s*<Input\s*type="number"/,
  `<div className="space-y-1.5">
  <label htmlFor={"quantity-" + idx} className="text-sm font-semibold text-slate-700">{t("Quantity")} *</label>
  <Input
    id={"quantity-" + idx}
    name="quantity"
    type="number"`
);

// Condition
content = content.replace(
  /<div className="space-y-1\.5">\s*<label className="text-sm font-semibold text-slate-700">\{t\("Condition"\)\} \*<\/label>\s*<Select\s*value=\{item\.condition\}/,
  `<div className="space-y-1.5">
  <label htmlFor={"condition-" + idx} className="text-sm font-semibold text-slate-700">{t("Condition")} *</label>
  <Select
    id={"condition-" + idx}
    name="condition"
    value={item.condition}`
);

// Season
content = content.replace(
  /<div className="space-y-1\.5">\s*<label className="text-sm font-semibold text-slate-700">\{t\("Season"\)\}<\/label>\s*<Select\s*value=\{item\.season\}/,
  `<div className="space-y-1.5">
  <label htmlFor={"season-" + idx} className="text-sm font-semibold text-slate-700">{t("Season")}</label>
  <Select
    id={"season-" + idx}
    name="season"
    value={item.season}`
);

fs.writeFileSync(file, content);
console.log("Patched accessibility attributes (name, id, htmlFor)");
