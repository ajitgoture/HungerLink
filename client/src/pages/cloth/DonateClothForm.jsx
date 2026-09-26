import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, MapPin, AlertCircle, Clock, Trash2, PlusCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Button, Input, Select, Textarea, Card, CardHeader, CardTitle, CardContent } from '../../components/ui';

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

const DonateClothForm = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  // Multi-item form state
  const makeItem = () => ({
    recipientCategory: '',
    type: '',
    size: '',
    quantity: '',
    condition: 'Good',
    season: 'All Season'
  });

  const [items, setItems] = useState([makeItem()]);
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [isLocating, setIsLocating] = useState(false);
  const [locationData, setLocationData] = useState({
    city: user?.city || '',
    pickupAddress: user?.address || '',
    lat: user?.location?.coordinates?.[1] || 40.7128,
    lng: user?.location?.coordinates?.[0] || -74.006,
    contactNumber: user?.phone || '',
  });

  const [timelines, setTimelines] = useState({
    availableFrom: '',
    pickupDate: '',
    pickupTimeWindow: 'Flexible',
  });

  const [qualityAcknowledged, setQualityAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handlers
  const handleItemChange = (index, field, value) => {
    console.log("handleItemChange triggered:", { index, field, value });
    setItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index], [field]: value };

      if (field === 'recipientCategory') {
        item.type = '';
        item.size = '';
      }
      if (field === 'type') {
        item.size = '';
      }
      // Integer enforcement for quantity
      if (field === 'quantity') {
        if (value === '') item.quantity = '';
        else {
          const num = parseInt(value, 10);
          item.quantity = (isNaN(num) || num < 1) ? '' : num;
        }
      }

      newItems[index] = item;
      return newItems;
    });
  };

  const addItem = () => setItems(prev => [...prev, makeItem()]);
  const removeItem = index => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const totalPieces = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

    const getUserLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
              headers: {
                'Accept-Language': 'en'
              }
            });
            const data = await response.json();
            if (data && data.address) {
              const addr = data.address;
              const city = addr.city || addr.town || addr.village || addr.municipality || addr.locality || addr.county || "Unknown Location";
              setLocationData({
                city: city,
                pickupAddress: data.display_name || city,
                lat: lat,
                lng: lng,
              });
              showToast("Location detected successfully", 'success');
            } else {
              setLocationData(prev => ({ ...prev, lat, lng }));
              showToast("Unable to determine address from coordinates", 'error');
            }
          } catch (err) {
            console.error("Reverse geocoding error:", err);
            setLocationData(prev => ({ ...prev, lat, lng }));
            showToast("Unable to determine address from coordinates", 'error');
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
          if (error.code === 1) {
            showToast("Location permission was denied. Please allow location access or enter your location manually.", 'error');
          } else if (error.code === 2) {
            showToast("Location unavailable.", 'error');
          } else if (error.code === 3) {
            showToast("Location request timed out.", 'error');
          } else {
            showToast("Could not get your location. Please ensure location services are enabled.", 'error');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      showToast("Geolocation is not supported by your browser", 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.recipientCategory) return setError(t('Recipient Category is required') + ' (' + t('Clothing Item') + ' ' + (i + 1) + ')');
      if (!it.type) return setError(t('Clothing Type is required') + ' (' + t('Clothing Item') + ' ' + (i + 1) + ')');
      if (!it.size) return setError(t('Size is required') + ' (' + t('Clothing Item') + ' ' + (i + 1) + ')');
      if (!it.quantity || parseInt(it.quantity) < 1) return setError(t('Quantity must be a positive integer') + ' (' + t('Clothing Item') + ' ' + (i + 1) + ')');
      if (!it.condition) return setError(t('Condition is required') + ' (' + t('Clothing Item') + ' ' + (i + 1) + ')');
    }

    if (!locationData.contactNumber || !/^[0-9]{10}$/.test(locationData.contactNumber)) {
      return setError("Please enter a valid 10-digit contact number");
    }
    if (!locationData.city || !locationData.pickupAddress) {
      return setError("Pickup city and address are required");
    }
    if (!timelines.availableFrom) {
      return setError("Please specify when the clothes are available from");
    }
    if (!qualityAcknowledged) {
      return setError("Please acknowledge that the clothes are clean and usable");
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('items', JSON.stringify(items));
      submitData.append('description', description);
      submitData.append('availableFrom', timelines.availableFrom);
      submitData.append('pickupDate', timelines.pickupDate);
      submitData.append('pickupTimeWindow', timelines.pickupTimeWindow);
      submitData.append('city', locationData.city);
      submitData.append('pickupAddress', locationData.pickupAddress);
      submitData.append('lat', locationData.lat);
      submitData.append('lng', locationData.lng);
      submitData.append('qualityAcknowledged', qualityAcknowledged);
      submitData.append('contactNumber', locationData.contactNumber);

      if (imageFile) {
        submitData.append('clothImage', imageFile);
      }

      await api.post('/cloth/donations', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast("Clothes donation posted successfully!", 'success');
      navigate('/cloth/donor-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || "Error posting donation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">{t("Donate Clothes")}</h1>
          <p className="text-slate-600 mt-2">{t("Share warmth and clothing with those in need.")}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error ? t(error) : ""}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECTION 1: CLOTHING ITEMS */}
          <Card>
            <CardHeader>
              <CardTitle>{t("1. Clothing Items")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item, idx) => {
                const currentTypeOptions = (item.recipientCategory && typeOptionsMap[item.recipientCategory]) ? typeOptionsMap[item.recipientCategory] : [];
                const currentSizeOptions = getSizeOptions(item.recipientCategory, item.type);
   console.log("Render item", idx, ":", item);
   console.log("currentTypeOptions:", currentTypeOptions);
   console.log("currentSizeOptions:", currentSizeOptions);

                return (
                  <div key={idx} className={`space-y-4 ${idx > 0 ? 'pt-6 border-t border-slate-200' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                        {t("Clothing Item")} {idx + 1}
                      </span>
                      {idx > 0 && (
                        <button type="button" onClick={() => removeItem(idx)} className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> {t("Remove Item")}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
  <label htmlFor={"recipientCategory-" + idx} className="text-sm font-semibold text-slate-700">{t("Recipient Category")} *</label>
  <Select 
    id={"recipientCategory-" + idx}
    name="recipientCategory"
    value={item.recipientCategory}
  onChange={(e) => handleItemChange(idx, 'recipientCategory', e.target.value)}
  required
  options={Object.keys(typeOptionsMap).map(cat => ({ value: cat, label: t(cat) }))}
/>
                      </div>

                      <div className="space-y-1.5">
  <label htmlFor={"type-" + idx} className="text-sm font-semibold text-slate-700">{t("Clothing Type")} *</label>
  <Select
    id={"type-" + idx}
    name="type"
    value={item.type}
  onChange={(e) => handleItemChange(idx, 'type', e.target.value)}
  required
  disabled={!item.recipientCategory}
  options={currentTypeOptions.map(type => ({ value: type, label: t(type) }))}
/>
                      </div>

                      <div className="space-y-1.5">
  <label htmlFor={"size-" + idx} className="text-sm font-semibold text-slate-700">{t("Size")} *</label>
  <Select
    id={"size-" + idx}
    name="size"
    value={item.size}
  onChange={(e) => handleItemChange(idx, 'size', e.target.value)}
  required
  disabled={!item.type}
  options={currentSizeOptions.map(sz => ({ value: sz, label: t(sz) }))}
/>
                      </div>

                      <div className="space-y-1.5">
  <label htmlFor={"quantity-" + idx} className="text-sm font-semibold text-slate-700">{t("Quantity")} *</label>
  <Input
    id={"quantity-" + idx}
    name="quantity"
    type="number"
                          min="1"
                          step="1"
                          placeholder={t("e.g. 5")}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
  <label htmlFor={"condition-" + idx} className="text-sm font-semibold text-slate-700">{t("Condition")} *</label>
  <Select
    id={"condition-" + idx}
    name="condition"
    value={item.condition}
  onChange={(e) => handleItemChange(idx, 'condition', e.target.value)}
  required
  options={['New', 'Like New', 'Good', 'Fair'].map(cond => ({ value: cond, label: t(cond) }))}
/>
                      </div>

                      <div className="space-y-1.5">
  <label htmlFor={"season-" + idx} className="text-sm font-semibold text-slate-700">{t("Season")}</label>
  <Select
    id={"season-" + idx}
    name="season"
    value={item.season}
  onChange={(e) => handleItemChange(idx, 'season', e.target.value)}
  options={['All Season', 'Summer', 'Winter', 'Monsoon', 'Formal', 'Sports', 'Other'].map(s => ({ value: s, label: t(s) }))}
/>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button type="button" onClick={addItem} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-colors font-semibold text-sm">
                <PlusCircle className="w-4 h-4" /> {t("Add Another Clothing Item")}
              </button>

              <div className="bg-violet-50 text-violet-800 p-4 rounded-xl border border-violet-100 flex items-center justify-between font-bold">
                <span>{t("Total Pieces:")}</span>
                <span className="text-xl">{totalPieces}</span>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: ADDITIONAL DETAILS & IMAGE */}
          <Card>
            <CardHeader>
              <CardTitle>{t("2. Additional Details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">{t("Description")}</label>
                <Textarea
                  placeholder={t("Any specific details (e.g., specific colors, washing instructions)")}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">{t("Upload Image")}</label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden transition-colors hover:bg-slate-100">
                  {imagePreview ? (
                    <div className="relative w-full h-48 group">
                      <img src={imagePreview} alt={t("Preview")} className="w-full h-full object-contain rounded-lg" />
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-sm">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                        <Upload className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">{t("Click to upload photo")}</p>
                      <p className="text-xs text-slate-500 mt-1">{t("JPG, PNG up to 5MB")}</p>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: LOCATION */}
          <Card>
            <CardHeader>
              <CardTitle>{t("3. Location")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={getUserLocation} className="gap-2" disabled={isLocating}>
                  <MapPin className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} /> {isLocating ? t("Detecting Location...") : t("Use Current Location")}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">{t("City")} *</label>
                  <Input
                    required
                    placeholder={t("e.g. Mumbai")}
                    value={locationData.city}
                    onChange={(e) => setLocationData({ ...locationData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">{t("Pickup Address")} *</label>
                  <Input
                    required
                    placeholder={t("Complete address or landmark")}
                    value={locationData.pickupAddress}
                    onChange={(e) => setLocationData({ ...locationData, pickupAddress: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">{t("Contact Number")} *</label>
                  <Input
                    required
                    type="tel"
                    placeholder={t("10-digit mobile number")}
                    value={locationData.contactNumber}
                    onChange={(e) => setLocationData({ ...locationData, contactNumber: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4: AVAILABILITY TIMELINES */}
          <Card>
            <CardHeader>
              <CardTitle>{t("4. Availability Timelines")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-500" /> {t("Available For Pickup From")} *
                  </label>
                  <Input
                    type="datetime-local"
                    required
                    value={timelines.availableFrom}
                    onChange={(e) => setTimelines({ ...timelines, availableFrom: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-500" /> {t("Preferred Time Window")}
                  </label>
                  <Select
  value={timelines.pickupTimeWindow}
  onChange={(e) => setTimelines({ ...timelines, pickupTimeWindow: e.target.value })}
  options={[
    {value: 'Flexible', label: t('Flexible (Anytime)')},
    {value: 'Morning (8 AM - 12 PM)', label: t('Morning (8 AM - 12 PM)')},
    {value: 'Afternoon (12 PM - 4 PM)', label: t('Afternoon (12 PM - 4 PM)')},
    {value: 'Evening (4 PM - 8 PM)', label: t('Evening (4 PM - 8 PM)')}
  ]}
/>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 5: CONFIRMATION */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                className="mt-1 w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                checked={qualityAcknowledged}
                onChange={(e) => setQualityAcknowledged(e.target.checked)}
              />
              <span className="text-sm text-slate-700 font-medium">
                {t("I confirm that the clothing items are washed, clean, and in dignified condition for donation. I understand that items unfit for use may be declined upon pickup.")} *
              </span>
            </label>

            <Button type="submit" size="lg" className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 text-lg font-bold shadow-md" isLoading={loading}>
              {t("Post Clothes Donation")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonateClothForm;