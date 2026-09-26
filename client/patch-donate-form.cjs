const fs = require('fs');

const file = 'd:/Smart_Unified_Donation_System/client/src/pages/cloth/DonateClothForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the formData state setup
content = content.replace(/const \[formData, setFormData\] = useState\(\{[\s\S]*?qualityAcknowledged: false\s*\}\);/,
`const [items, setItems] = useState([
    {
      recipientCategory: 'Unisex',
      type: 'T-Shirt',
      size: 'M',
      quantity: 1,
      condition: 'Good',
      season: 'All Season'
    }
  ]);
  const [formData, setFormData] = useState({
    description: '',
    availableFrom: '',
    pickupDate: '',
    pickupTimeWindow: 'Flexible',
    expiryTime: '',
    responseDeadline: '',
    city: user?.city || '',
    area: '',
    pickupAddress: user?.address || '',
    lat: user?.location?.lat || 40.7128,
    lng: user?.location?.lng || -74.006,
    contactNumber: user?.phone || '',
    qualityAcknowledged: false
  });`);

// Add type options and size options
const optionsLogic = `
  const categoryTypeMap = {
    Men: ['Shirt', 'T-Shirt', 'Pants', 'Jeans', 'Shorts', 'Kurta', 'Jacket', 'Sweater', 'Coat', 'Suit', 'Traditional Wear', 'Sportswear', 'Other'],
    Women: ['Saree', 'Salwar Suit', 'Kurti', 'Dress', 'Top', 'Shirt', 'T-Shirt', 'Jeans', 'Pants', 'Skirt', 'Jacket', 'Sweater', 'Coat', 'Traditional Wear', 'Sportswear', 'Other'],
    Children: ['T-Shirt', 'Shirt', 'Pants', 'Jeans', 'Shorts', 'Dress', 'Frock', 'Sweater', 'Jacket', 'School Uniform', 'Sportswear', 'Other'],
    Unisex: ['T-Shirt', 'Shirt', 'Hoodie', 'Jacket', 'Sweater', 'Jeans', 'Pants', 'Shorts', 'Sportswear', 'Other']
  };

  const getSizeOptions = (category, type) => {
    if (category === 'Children') {
      return ['0–3 Months', '3–6 Months', '6–12 Months', '1–2 Years', '2–3 Years', '3–4 Years', '4–5 Years', '5–6 Years', '6–8 Years', '8–10 Years', '10–12 Years', '12–14 Years', '14–16 Years', 'Other'];
    }
    if (['Pants', 'Jeans', 'Shorts'].includes(type)) {
      return ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', 'Other'];
    }
    if (['Saree', 'Traditional Wear'].includes(type)) {
      return ['Free Size', 'Other'];
    }
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size', 'Other'];
  };

  const addItem = () => {
    setItems([...items, { recipientCategory: 'Unisex', type: 'T-Shirt', size: 'M', quantity: 1, condition: 'Good', season: 'All Season' }]);
  };

  const removeItem = (idx) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx][field] = value;
    
    // Dynamic resets
    if (field === 'recipientCategory') {
       newItems[idx].type = categoryTypeMap[value][0];
       newItems[idx].size = getSizeOptions(value, newItems[idx].type)[0];
    }
    if (field === 'type') {
       newItems[idx].size = getSizeOptions(newItems[idx].recipientCategory, value)[0];
    }
    setItems(newItems);
  };

  const totalPieces = items.reduce((acc, it) => acc + (parseInt(it.quantity) || 0), 0);
`;

content = content.replace('const [imageFiles, setImageFiles] = useState([]);', optionsLogic + '\n  const [imageFiles, setImageFiles] = useState([]);');

// Rewrite handleSubmit
const newSubmit = `const handleSubmit = async e => {
    e.preventDefault();
    setErrors([]);
    const newErrors = [];
    
    if (items.length === 0) newErrors.push(t('At least one clothing item is required.'));
    items.forEach((it, i) => {
      if (!it.recipientCategory) newErrors.push(t('Item') + ' ' + (i+1) + ': ' + t('Category is required.'));
      if (!it.type) newErrors.push(t('Item') + ' ' + (i+1) + ': ' + t('Type is required.'));
      if (!it.size) newErrors.push(t('Item') + ' ' + (i+1) + ': ' + t('Size is required.'));
      if (!it.quantity || Number(it.quantity) < 1 || !Number.isInteger(Number(it.quantity))) newErrors.push(t('Item') + ' ' + (i+1) + ': ' + t('Quantity must be a positive integer.'));
    });

    if (!formData.availableFrom || !formData.expiryTime || !formData.responseDeadline) {
      newErrors.push(t('All availability timeline fields are required.'));
    }
    if (!formData.pickupAddress || !formData.city || !formData.contactNumber) {
      newErrors.push(t('Complete pickup location details are required.'));
    }
    if (imageFiles.length === 0) {
      newErrors.push(t('Please upload at least one image of the clothing.'));
    }
    if (!formData.qualityAcknowledged) {
      newErrors.push(t('You must acknowledge the clothing quality guarantees.'));
    }
    if (newErrors.length > 0) {
      setErrors(newErrors);
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('items', JSON.stringify(items));
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      imageFiles.forEach(file => {
        data.append('images', file);
      });
      
      const res = await api.post('/cloth/donations', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      showToast(t('toastTitle_success'), t('toastMsg_clothDonationPostedSuccessfully'), 'success');
      navigate('/cloth/my-donations');
    } catch (error) {
      setErrors([error.response?.data?.message || t('toastMsg_failedToPostDonation')]);
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } finally {
      setSubmitting(false);
    }
  };`;

content = content.replace(/const handleSubmit = async e => \{[\s\S]*?setSubmitting\(false\);\s*\}\s*\};/m, newSubmit);

// Rewrite Section 1 in JSX
const section1Replacement = `{/* SECTION 1: Clothing Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shirt className="w-5 h-5" /> {t("1. Clothing Items")}</CardTitle>
              <p className="text-xs text-slate-500">{t("Add each different type, size, and category separately.")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-2xl relative bg-slate-50">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 bg-white p-1 rounded-full shadow-sm text-xs font-bold flex items-center gap-1">
                      <X className="w-4 h-4"/> {t("Remove Item")}
                    </button>
                  )}
                  <h4 className="font-bold text-slate-700 mb-4">{t("Clothing Item")} {idx + 1}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Select label={t("Recipient Category *")} value={item.recipientCategory} onChange={(e) => updateItem(idx, 'recipientCategory', e.target.value)} options={Object.keys(categoryTypeMap).map(c => ({value: c, label: t(c)}))} required />
                    
                    <Select label={t("Clothing Type *")} value={item.type} onChange={(e) => updateItem(idx, 'type', e.target.value)} options={categoryTypeMap[item.recipientCategory].map(tName => ({value: tName, label: tName}))} required />
                    
                    <Select label={t("Size *")} value={item.size} onChange={(e) => updateItem(idx, 'size', e.target.value)} options={getSizeOptions(item.recipientCategory, item.type).map(s => ({value: s, label: s}))} required />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label={t("Quantity *")} type="number" min="1" step="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} required />
                    
                    <Select label={t("Condition *")} value={item.condition} onChange={(e) => updateItem(idx, 'condition', e.target.value)} options={['New', 'Like New', 'Good', 'Fair'].map(c => ({value: c, label: t(c)}))} required />
                    
                    <Select label={t("Season")} value={item.season} onChange={(e) => updateItem(idx, 'season', e.target.value)} options={['All Season', 'Summer', 'Winter', 'Monsoon', 'Formal', 'Sports', 'Other'].map(s => ({value: s, label: t(s)}))} />
                  </div>
                </div>
              ))}
              
              <Button type="button" onClick={addItem} variant="outline" className="w-full border-dashed border-2 py-6 text-indigo-600 hover:bg-indigo-50 border-indigo-200">
                <Plus className="w-4 h-4 mr-2"/> {t("Add Another Clothing Item")}
              </Button>

              <Textarea label={t("Description (Optional)")} name="description" value={formData.description} onChange={handleChange} placeholder={t("Any specific details?")} rows={3} />
            </CardContent>
          </Card>`;

content = content.replace(/{\/\* SECTION 1: Clothing Details \*\/}[\s\S]*?{\/\* SECTION 2: Image Upload \*\/}/, section1Replacement + '\n\n          {/* SECTION 2: Image Upload */}');

// Add the review summary before the submit button
const summaryReplacement = `
          {/* SECTION 5: Review Before Submit */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2">{t("Review & Submit")}</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                 <h4 className="font-bold text-indigo-900 mb-2">{t("Donation Summary")}</h4>
                 <p className="text-sm text-indigo-800 mb-3 font-semibold">{t("Clothing Items:")} {items.length}</p>
                 <ul className="text-sm text-indigo-700 space-y-1 mb-4 pl-4 list-disc">
                   {items.map((it, i) => (
                      <li key={i}>{t(it.recipientCategory)} — {it.type} — {it.size} — {it.quantity} {t("pieces")} — {t(it.condition)}</li>
                   ))}
                 </ul>
                 <p className="font-black text-indigo-900 border-t border-indigo-200 pt-3">{t("Total Pieces:")} {totalPieces}</p>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 6: Quality Acknowledgement */}`;

content = content.replace(/{\/\* SECTION 6: Quality Acknowledgement \*\/}/, summaryReplacement);

// Fix the import to include Shirt
content = content.replace(/import \{ X, Upload, MapPin, Clock, AlertCircle \} from 'lucide-react';/, "import { X, Upload, MapPin, Clock, AlertCircle, Shirt, Plus } from 'lucide-react';");
content = content.replace(/import \{ X, Upload, MapPin, Clock, AlertCircle, Map \} from 'lucide-react';/, "import { X, Upload, MapPin, Clock, AlertCircle, Shirt, Plus, Map } from 'lucide-react';");
if (!content.includes('Shirt')) {
   content = content.replace(/import \{ (.*?) \} from 'lucide-react';/, "import { $1, Shirt, Plus } from 'lucide-react';");
}


fs.writeFileSync(file, content);
