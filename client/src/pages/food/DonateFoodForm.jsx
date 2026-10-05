import { useTranslation } from "react-i18next";
import { compressImage } from "../../utils/imageCompressor";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, MapPin, AlertCircle, Clock, Info, PlusCircle, Trash2, Navigation } from 'lucide-react';
import LocationPicker from '../../components/LocationPicker';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { validateDonationDates, validateQuantity } from '../../utils/donationValidation';
import { Button, Input, Select, Textarea, Card, CardHeader, CardTitle, CardContent } from '../../components/ui';

// Default shape for one food item
const makeItem = () => ({
  foodName: '',
  foodType: 'Vegetarian',
  quantity: '',
  unit: 'Pieces',
  customUnit: '',
  peopleServed: '',
  description: '',
  preparationTime: '',
  expiryTime: ''
});


const DonateFoodForm = () => {
  const { t, i18n } = useTranslation();
  // Full unit options list
const UNIT_OPTIONS = [{
  value: 'Pieces',
  label: t("Pieces")
}, {
  value: 'Plates',
  label: t("Plates")
}, {
  value: 'Kg',
  label: t("Kg")
}, {
  value: 'Grams',
  label: t("Grams")
}, {
  value: 'Litres',
  label: t("Litres")
}, {
  value: 'Millilitres',
  label: t("Millilitres")
}, {
  value: 'Packets',
  label: t("Packets")
}, {
  value: 'Boxes',
  label: t("Boxes")
}, {
  value: 'Bottles',
  label: t("Bottles")
}, {
  value: 'Containers',
  label: t("Containers")
}, {
  value: 'Other',
  label: t("Other")
}];
  
  
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    showToast
  } = useNotifications();

  const [formData, setFormData] = useState({
    city: user?.city || '',
    area: '',
    pickupAddress: user?.address || '',
    contactNumber: user?.phone || '',
    packaging: 'Packed',
    storageCondition: 'Room Temperature',
    availableFrom: '',
    lat: null,
    lng: null,
    safetyAcknowledged: false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not a donor
  React.useEffect(() => {
    if (user && !['Food Donor', 'donor'].includes(user.role)) {
      showToast('toastTitle_accessDenied', 'toastMsg_onlyFoodDonorsCanPostFoodDonations');
      navigate('/dashboard');
    }
  }, [user, navigate, showToast]);

  // ── MULTI-ITEM STATE ─────────────────────────────────────────────────────────
  const [foodItems, setFoodItems] = useState([makeItem()]);
  const handleItemChange = (index, e) => {
    const {
      name,
      value
    } = e.target;
    setFoodItems(prev => prev.map((item, i) => i === index ? {
      ...item,
      [name]: value
    } : item));
  };
  const addItem = () => setFoodItems(prev => [...prev, makeItem()]);
  const removeItem = index => {
    if (foodItems.length === 1) return; // always keep at least one
    setFoodItems(prev => prev.filter((_, i) => i !== index));
  };
  // ────────────────────────────────────────────────────────────────────────────

  const reverseGeocodePickup = async ({ lat, lng }) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': i18n.language || 'en' }
      });
      if (!response.ok) return;
      const result = await response.json();
      const address = result.address || {};
      setFormData(previous => ({
        ...previous,
        lat,
        lng,
        city: address.city || address.town || address.village || address.municipality || address.locality || address.city_district || address.county || '',
        area: address.suburb || address.neighbourhood || address.district || '',
        pickupAddress: result.display_name || '',
      }));
    } catch {
      showToast('Location Error', 'Location coordinates were saved. Please complete the address manually.');
    }
  };
  // ────────────────────────────────────────────────────────────────────────────

  const handleChange = e => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'city' || name === 'area' || name === 'pickupAddress' ? { lat: null, lng: null } : {})
    }));
  };
  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('toastTitle_fileTooLarge', 'toastMsg_imageMustBeUnder5mb');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('toastTitle_invalidFile', 'toastMsg_pleaseUploadAValidImageFile');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setErrors([]);

    // Validate global dates — availableFrom only
    const validationErrors = [];
    if (!formData.availableFrom) {
      validationErrors.push('Available For Pickup From is required.');
    }

    // Validate each food item
    foodItems.forEach((item, idx) => {
      const label = foodItems.length > 1 ? ` (Food Item ${idx + 1})` : '';
      if (!item.foodName.trim()) {
        validationErrors.push(`Food Title/Name is required${label}.`);
      }
      const qty = Number(item.quantity);
      if (!item.quantity || isNaN(qty) || qty <= 0) {
        validationErrors.push(`Quantity must be greater than 0${label}.`);
      }
      if (item.unit === 'Other' && !item.customUnit.trim()) {
        validationErrors.push(`Custom Unit is required when "Other" is selected${label}.`);
      }
      const pErr = validateQuantity(item.peopleServed, `People Served${label}`);
      if (pErr) validationErrors.push(pErr);

      // Per-item preparation and expiry time validation
      if (!item.preparationTime) {
        validationErrors.push(`Preparation Time is required${label}.`);
      }
      if (!item.expiryTime) {
        validationErrors.push(`Expiry Time is required${label}.`);
      }
      if (item.preparationTime && item.expiryTime) {
        if (new Date(item.expiryTime) <= new Date(item.preparationTime)) {
          validationErrors.push(`Expiry Time must be later than Preparation Time${label}.`);
        }
      }
    });
    // GPS coordinate validation — reject null/missing coordinates
    // GPS is optional at this stage
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }
    try {
      setSubmitting(true);
      
      let finalLat = formData.lat;
      let finalLng = formData.lng;

      const hasCoordinates = Number.isFinite(Number(finalLat)) && Number.isFinite(Number(finalLng))
        && finalLat !== null && finalLng !== null && !(Number(finalLat) === 0 && Number(finalLng) === 0);
      if (!hasCoordinates) {
        const addressStr = formData.pickupAddress.trim();
        try {
          const fetchWithTimeout = (url, options, timeout = 3000) => {
            return Promise.race([
              fetch(url, options),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
            ]);
          };
          const resp = addressStr
            ? await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}`, {})
            : null;
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.length > 0) {
              finalLat = parseFloat(data[0].lat);
              finalLng = parseFloat(data[0].lon);
            }
          }
        } catch (geocodingError) {
          console.error("Geocoding failed", geocodingError);
        }
      }

      const coordinatesAreValid = Number.isFinite(Number(finalLat)) && Number.isFinite(Number(finalLng))
        && finalLat !== null && finalLng !== null && !(Number(finalLat) === 0 && Number(finalLng) === 0);
      
      const submitData = new FormData();

      // Shared / non-item fields — simple append, no special cases needed
      Object.keys(formData).forEach(key => {
        if (key === 'lat' || key === 'lng') return;
        else submitData.append(key, formData[key]);
      });
      if (coordinatesAreValid) {
        submitData.append('lat', Number(finalLat));
        submitData.append('lng', Number(finalLng));
      }

      // All items as JSON array — resolve customUnit before sending
      const resolveUnit = item => item.unit === 'Other' ? item.customUnit.trim() : item.unit;
      const serializedItems = foodItems.map(item => ({
        ...item,
        unit: resolveUnit(item),
        customUnit: undefined
      }));
      submitData.append('foodItems', JSON.stringify(serializedItems));
      if (imageFile) {
        try {
          const compressed = await compressImage(imageFile);
          submitData.append('foodImage', compressed);
        } catch (e) {
          submitData.append('foodImage', imageFile);
        }
      }
      await api.post('/food/donations', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      showToast('toastTitle_success', 'toastMsg_foodDonationPostedSuccessfully');
      navigate('/food/donor-dashboard');
    } catch (err) {
      setErrors([err.response?.data?.message || 'Failed to post donation']);
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } finally {
      setSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900">{"Post Food Donation"}</h1>
          <p className="text-sm text-slate-500">{"Provide accurate details to ensure food safety and quick matching."}</p>
        </div>

        {errors.length > 0 && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
              <AlertCircle className="w-5 h-5" /> {"Please fix the following errors:"}
            </div>
            <ul className="list-disc list-inside text-xs text-red-600 pl-2">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: Food Details — Multi-item */}
          <Card>
            <CardHeader>
              <CardTitle>{"1. Food Details"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {foodItems.map((item, idx) => <div key={idx} className={`space-y-4 ${idx > 0 ? 'pt-5 border-t border-slate-200' : ''}`}>
                  {/* Item header with label + remove button */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                      {"Food Item"} {idx + 1}
                    </span>
                    {foodItems.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> {"Remove"}
                      </button>}
                  </div>

                  {/* Food Title */}
                  <Input label={"Food Title/Name *"} name="foodName" value={item.foodName} onChange={e => handleItemChange(idx, e)} placeholder={"e.g. Veg Biryani"} required />

                  {/* Food Type + Quantity + Unit */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Select label={"Food Type *"} name="foodType" value={item.foodType} onChange={e => handleItemChange(idx, e)} options={[{
                  value: 'Vegetarian',
                  label: t("Vegetarian")
                }, {
                  value: 'Non-Vegetarian',
                  label: t("Non-Vegetarian")
                }, {
                  value: 'Mixed Food (Vegetarian and Non-Vegetarian)',
                  label: t("Mixed Food")
                }]} required />
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input label={"Quantity *"} type="number" name="quantity" value={item.quantity} onChange={e => handleItemChange(idx, e)} min="1" step="any" required />
                      </div>
                      <div className="w-2/5">
                        <Select label={"Unit *"} name="unit" value={item.unit} onChange={e => handleItemChange(idx, e)} options={UNIT_OPTIONS} required />
                      </div>
                    </div>
                  </div>

                  {/* Custom Unit — only shown when unit is Other */}
                  {item.unit === 'Other' && <Input label={"Custom Unit *"} name="customUnit" value={item.customUnit} onChange={e => handleItemChange(idx, e)} placeholder={"e.g. Bunches, Trays, Servings..."} required />}

                  {/* People Served */}
                  <Input label={"Estimated People it can serve *"} type="number" name="peopleServed" value={item.peopleServed} onChange={e => handleItemChange(idx, e)} min="1" required />

                  {/* Description */}
                  <Textarea label={"Description (Optional)"} name="description" value={item.description} onChange={e => handleItemChange(idx, e)} placeholder={"Any specific details about this item?"} rows={2} />

                  {/* Per-item: Preparation Time + Expiry Time */}
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-sm text-blue-800">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{"Set the preparation and expiry time for"} <strong>{"this item"}</strong>{". Expiry must be after preparation time."}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label={"Preparation Time *"} type="datetime-local" name="preparationTime" value={item.preparationTime} onChange={e => handleItemChange(idx, e)} required />
                    <Input label={"Expiry Time (Unsafe to consume) *"} type="datetime-local" name="expiryTime" value={item.expiryTime} onChange={e => handleItemChange(idx, e)} required />
                  </div>
                </div>)}

              {/* Add Another Food Item button */}
              <button type="button" onClick={addItem} className="flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 px-4 py-2.5 rounded-xl transition-colors w-full justify-center mt-2">
                <PlusCircle className="w-4 h-4" />
                {"+ Add Another Food Item"}
              </button>
            </CardContent>
          </Card>

          {/* SECTION 2: Food Safety & Packaging */}
          <Card>
            <CardHeader><CardTitle>{"2. Safety & Storage"}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select label={"Packaging Type"} name="packaging" value={formData.packaging} onChange={handleChange} options={[{
                value: 'Packed',
                label: t("Packed/Sealed")
              }, {
                value: 'Containers',
                label: t("In Containers (Needs transfer)")
              }, {
                value: 'Open',
                label: t("Open/Loose")
              }, {
                value: 'Other',
                label: t("Other")
              }]} />
                <Select label={"Current Storage Condition"} name="storageCondition" value={formData.storageCondition} onChange={handleChange} options={[{
                value: 'Room Temperature',
                label: t("Room Temperature")
              }, {
                value: 'Refrigerated',
                label: t("Refrigerated")
              }, {
                value: 'Frozen',
                label: t("Frozen")
              }]} />
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: Timelines */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> {"3. Timelines"}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-sm text-blue-800">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{"Preparation and expiry times are set per food item above. Set the overall pickup window here."}</p>
              </div>
              <Input label={"Available For Pickup From *"} type="datetime-local" name="availableFrom" value={formData.availableFrom} onChange={handleChange} required />
            </CardContent>
          </Card>

          {/* SECTION 4: Image Upload */}
          <Card>
            <CardHeader><CardTitle>{"4. Food Image"}</CardTitle></CardHeader>
            <CardContent>
              {imagePreview ? <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-slate-200">
                  <img src={imagePreview} alt={"Preview"} className="w-full h-48 object-cover" />
                  <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-600 rounded-full hover:bg-red-50 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div> : <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-slate-400 mb-3" />
                    <p className="text-sm font-semibold text-slate-600">{"Click to upload an image"}</p>
                    <p className="text-xs text-slate-500 mt-1">{"JPEG, PNG, JPG (Max 5MB)"}</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>}
            </CardContent>
          </Card>

          {/* SECTION 5: Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" /> {t("5. Pickup Location")}
                </div>
                <span className="text-sm text-slate-500 font-normal">{t("Choose how you want to provide your pickup location: use your current location, enter an address, or select a point on the map.")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label={t("City *")} name="city" value={formData.city} onChange={handleChange} required />
                <Input label={t("Neighborhood / Area")} name="area" value={formData.area} onChange={handleChange} />
              </div>
              <Textarea label={t("Precise Pickup Address *")} name="pickupAddress" value={formData.pickupAddress} onChange={handleChange} placeholder={t("This will only be revealed to the receiver you accept.")} rows={2} required />
              
              <div className="pt-2 border-t border-slate-100">
                <LocationPicker 
                  position={formData.lat !== null && formData.lng !== null ? { lat: formData.lat, lng: formData.lng } : null}
                  setPosition={(pos) => setFormData(prev => ({ ...prev, lat: pos.lat, lng: pos.lng }))}
                  onPositionSelected={reverseGeocodePickup}
                />
              </div>

              <Input label={t("Contact Number *")} name="contactNumber" value={formData.contactNumber} onChange={handleChange} required />
            </CardContent>
          </Card>

          {/* SECTION 6: Safety Acknowledgement */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-500" /> {"6. Food Safety Acknowledgement"}</CardTitle></CardHeader>
            <CardContent>
              <label className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl cursor-pointer">
                <input type="checkbox" name="safetyAcknowledged" checked={formData.safetyAcknowledged} onChange={e => setFormData({
                ...formData,
                safetyAcknowledged: e.target.checked
              })} className="mt-1 w-5 h-5 text-red-600 focus:ring-red-500 border-red-300 rounded" required />
                <div className="text-sm text-red-900">
                  <p className="font-bold mb-1">{"I acknowledge and guarantee that:"}</p>
                  <ul className="list-disc pl-4 space-y-1 text-red-800">
                    <li>{"The food is safe for human consumption."}</li>
                    <li>{"All allergen information provided is accurate to the best of my knowledge."}</li>
                    <li>{"The food has been stored hygienically and at appropriate temperatures."}</li>
                    <li>{"I accept full responsibility for the quality of the donated food."}</li>
                  </ul>
                </div>
              </label>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={!formData.safetyAcknowledged} className="w-full text-lg py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed" isLoading={submitting}>
            {submitting ? 'Posting Donation...' : 'Post Food Donation'}
          </Button>

        </form>
      </div>
    </div>;
};
export default DonateFoodForm;