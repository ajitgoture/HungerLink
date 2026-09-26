const fs = require('fs');
const path = require('path');

const newKeys = {
  "Select Language": "Select Language",
  "Notifications": "Notifications",
  "Success": "Success",
  "Testing on mobile?": "Testing on mobile?",
  "Access your app using your computer's local IP (e.g.,": "Access your app using your computer's local IP (e.g.,",
  ") instead of": ") instead of",
  "so the QR code can be scanned across devices.": "so the QR code can be scanned across devices.",
  "Access Denied": "Access Denied",
  "You do not have permission to view this page. This area requires": "You do not have permission to view this page. This area requires",
  "privileges.": "privileges.",
  "Return to Home": "Return to Home",
  "Error": "Error",
  "Preview": "Preview",
  "Donation": "Donation",
  "Warning": "Warning",
  "Please enter your email and password.": "Please enter your email and password.",
  "Login failed. Please check credentials.": "Login failed. Please check credentials.",
  "Please fill in all required fields.": "Please fill in all required fields.",
  "Passwords do not match.": "Passwords do not match.",
  "Password does not meet the minimum security requirements.": "Password does not meet the minimum security requirements.",
  "Please enter a valid 10-digit Indian phone number.": "Please enter a valid 10-digit Indian phone number.",
  "Registration failed. Please try again.": "Registration failed. Please try again.",
  "Page Not Found": "Page Not Found",
  "The page you are looking for doesn't exist or has been moved.": "The page you are looking for doesn't exist or has been moved.",
  "Error loading chat": "Error loading chat",
  "Failed to post donation": "Failed to post donation",
  "User not found": "User not found",
  "Invalid credentials": "Invalid credentials",
  "Login failed": "Login failed",
  "Registration failed": "Registration failed",
  "Not authorized": "Not authorized",
  "Donation not found": "Donation not found",
  "Server error": "Server error",
  "Invalid token": "Invalid token"
};

const localesDir = path.join(__dirname, 'src', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

for (const file of files) {
    const filePath = path.join(localesDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let added = 0;
    for (const [key, value] of Object.entries(newKeys)) {
        if (!(key in content)) {
            // For now, auto-translate to English as fallback, the user/system can replace them later with real translations.
            content[key] = value;
            added++;
        }
    }
    
    if (added > 0) {
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
        console.log(`Added ${added} new keys to ${file}`);
    } else {
        console.log(`No new keys needed in ${file}`);
    }
}
