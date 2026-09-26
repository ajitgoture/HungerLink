const fs = require('fs');

function replaceInFile(path, replacements) {
    let content = fs.readFileSync(path, 'utf8');
    let original = content;
    for (const [search, replace] of replacements) {
        // Use split/join for all occurrences
        content = content.split(search).join(replace);
    }
    if (content !== original) {
        fs.writeFileSync(path, content, 'utf8');
        console.log(`Updated ${path}`);
    } else {
        console.log(`No changes needed in ${path} (or already applied)`);
    }
}

// 1. LanguageSelector.jsx
replaceInFile('src/components/LanguageSelector.jsx', [
    ['>Select Language<', '>{t("Select Language")}<']
]);

// 2. NotificationDropdown.jsx
replaceInFile('src/components/NotificationDropdown.jsx', [
    ['aria-label="Notifications"', 'aria-label={t("Notifications")}']
]);

// 3. PickupVerification.jsx
replaceInFile('src/components/PickupVerification.jsx', [
    ["showToast('Success',", "showToast(t('Success'),"]
]);

// 4. ProfileQRCodeModal.jsx
replaceInFile('src/components/ProfileQRCodeModal.jsx', [
    ['<p className="font-bold mb-1">Testing on mobile?</p>', '<p className="font-bold mb-1">{t("Testing on mobile?")}</p>'],
    ["Access your app using your computer's local IP (e.g.,", "{t(\"Access your app using your computer's local IP (e.g.,\")}"],
    ["<strong>192.168.x.x</strong>)", "<strong>192.168.x.x</strong>){t(\") instead of\")}"],
    ["instead of <strong>localhost</strong> so the QR code can be scanned across devices.</p>", "<strong>localhost</strong> {t(\"so the QR code can be scanned across devices.\")}</p>"]
]);

// 5. ProtectedRoute.jsx
replaceInFile('src/components/ProtectedRoute.jsx', [
    ['>Access Denied<', '>{t("Access Denied")}<'],
    ['>You do not have permission to view this page. This area requires<', '>{t("You do not have permission to view this page. This area requires")}<'],
    ['>privileges.<', '>{t("privileges.")}<'],
    ['>Return to Home<', '>{t("Return to Home")}<']
]);

// 6. ReviewForm.jsx
replaceInFile('src/components/ReviewForm.jsx', [
    ["showToast(t('Error'), err.response?.data?.message || t('toastMsg_error'));", "showToast(t('Error'), err.response?.data?.message ? t(err.response.data.message) : t('toastMsg_error'));"]
]);

// 7. DonateClothForm.jsx
replaceInFile('src/pages/cloth/DonateClothForm.jsx', [
    ["showToast('success',", "showToast(t('Success'),"],
    ["showToast('error',", "showToast(t('Error'),"],
    ['alt="Preview"', 'alt={t("Preview")}']
]);

// 8. DonationDetail.jsx
replaceInFile('src/pages/DonationDetail.jsx', [
    ['alt="Donation"', 'alt={t("Donation")}']
]);

// 9. Explore.jsx
replaceInFile('src/pages/Explore.jsx', [
    ["showToast('warning',", "showToast(t('Warning'),"],
    ["showToast('error',", "showToast(t('Error'),"]
]);

// 10. Login.jsx
replaceInFile('src/pages/Login.jsx', [
    ["setError('Please enter your email and password.')", "setError(t('Please enter your email and password.'))"],
    ["setError(err.response?.data?.message || 'Login failed. Please check credentials.')", "setError(err.response?.data?.message ? t(err.response.data.message) : t('Login failed. Please check credentials.'))"]
]);

// 11. Register.jsx
replaceInFile('src/pages/Register.jsx', [
    ["setError('Please fill in all required fields.')", "setError(t('Please fill in all required fields.'))"],
    ["setError('Passwords do not match.')", "setError(t('Passwords do not match.'))"],
    ["setError('Password does not meet the minimum security requirements.')", "setError(t('Password does not meet the minimum security requirements.'))"],
    ["setError('Please enter a valid 10-digit Indian phone number.')", "setError(t('Please enter a valid 10-digit Indian phone number.'))"],
    ["setError(err.response?.data?.message || 'Registration failed. Please try again.')", "setError(err.response?.data?.message ? t(err.response.data.message) : t('Registration failed. Please try again.'))"]
]);

// 12. NotFound.jsx
replaceInFile('src/pages/NotFound.jsx', [
    ['>Page Not Found<', '>{t("Page Not Found")}<'],
    [">The page you are looking for doesn't exist or has been moved.<", ">{t(\"The page you are looking for doesn't exist or has been moved.\")}<"],
    ['>Return to Home<', '>{t("Return to Home")}<']
]);

// 13. ChatBox.jsx
replaceInFile('src/components/ChatBox.jsx', [
    ["setError(err.response?.data?.message || 'Error loading chat')", "setError(err.response?.data?.message ? t(err.response.data.message) : t('Error loading chat'))"]
]);

// 14. DonateFoodForm.jsx
replaceInFile('src/pages/food/DonateFoodForm.jsx', [
    ["err.response?.data?.message || 'Failed to post donation'", "err.response?.data?.message ? t(err.response.data.message) : t('Failed to post donation')"]
]);

// 15. Fix API responses passed to showToast in other files
const filesWithAPIResponse = [
    'src/components/TransferTimeline.jsx',
    'src/pages/PublicProfile.jsx',
    'src/pages/cloth/AvailableClothes.jsx',
    'src/pages/cloth/ClothRequestsReceived.jsx',
    'src/pages/cloth/DonateClothForm.jsx',
    'src/pages/cloth/MyClothDonations.jsx',
    'src/pages/cloth/MyClothRequests.jsx',
    'src/pages/food/AvailableFood.jsx',
    'src/pages/food/DonateFoodForm.jsx',
    'src/pages/food/MyDonations.jsx',
    'src/pages/food/MyRequests.jsx',
    'src/pages/food/RequestsReceived.jsx'
];

for (const file of filesWithAPIResponse) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace `err.response?.data?.message || t(...)`
    // with `err.response?.data?.message ? t(err.response.data.message) : t(...)`
    // Regex to capture this safely
    content = content.replace(/err\.response\?\.data\?\.message\s*\|\|\s*t\((['"][^'"]+['"])\)/g, 
        "err.response?.data?.message ? t(err.response.data.message) : t($1)");
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated API error fallbacks in ${file}`);
}
