const fs = require('fs');

function fix(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  // Simple regex to unwrap t('...') or t("...")
  c = c.replace(/t\((['"].*?['"])\)/g, '$1');
  fs.writeFileSync(filePath, c);
}

['src/pages/ImpactDashboard.jsx', 'src/pages/food/DonateFoodForm.jsx', 'src/components/ProgressTracker.jsx', 'src/components/LanguageSelector.jsx', 'src/components/ui/Textarea.jsx', 'src/components/ui/Input.jsx'].forEach(fix);
console.log('Fixed unbound t wrappers!');
