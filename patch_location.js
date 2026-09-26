const fs = require('fs');

let file = 'client/src/pages/cloth/DonateClothForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add isLocating state
if (!content.includes('const [isLocating, setIsLocating]')) {
  content = content.replace(
    /const \[locationData, setLocationData\] = useState\(\{/,
    `const [isLocating, setIsLocating] = useState(false);\n  const [locationData, setLocationData] = useState({`
  );
}

// 2. Replace getUserLocation
const newGetUserLocation = `  const getUserLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            const response = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${lat}&lon=\${lng}&zoom=18&addressdetails=1\`, {
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
              showToast(t("Location detected successfully"), 'success');
            } else {
              setLocationData(prev => ({ ...prev, lat, lng }));
              showToast(t("Unable to determine address from coordinates"), 'error');
            }
          } catch (err) {
            console.error("Reverse geocoding error:", err);
            setLocationData(prev => ({ ...prev, lat, lng }));
            showToast(t("Unable to determine address from coordinates"), 'error');
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
          if (error.code === 1) {
            showToast(t("Location permission was denied. Please allow location access or enter your location manually."), 'error');
          } else if (error.code === 2) {
            showToast(t("Location unavailable."), 'error');
          } else if (error.code === 3) {
            showToast(t("Location request timed out."), 'error');
          } else {
            showToast(t("Could not get your location. Please ensure location services are enabled."), 'error');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      showToast(t("Geolocation is not supported by your browser"), 'error');
    }
  };`;

content = content.replace(
  /const getUserLocation = \(\) => \{[\s\S]*?else \{\s*showToast\(t\("Geolocation is not supported by your browser"\), 'error'\);\s*\}\s*\};/,
  newGetUserLocation
);

// 3. Update the button
content = content.replace(
  /<Button type="button" variant="outline" size="sm" onClick=\{getUserLocation\} className="gap-2">\s*<MapPin className="w-4 h-4" \/> \{t\("Use Current Location"\)\}\s*<\/Button>/,
  `<Button type="button" variant="outline" size="sm" onClick={getUserLocation} className="gap-2" disabled={isLocating}>
                  <MapPin className={\`w-4 h-4 \${isLocating ? 'animate-pulse' : ''}\`} /> {isLocating ? t("Detecting Location...") : t("Use Current Location")}
                </Button>`
);

fs.writeFileSync(file, content);
console.log("Patched getUserLocation with reverse geocoding in DonateClothForm.jsx");
