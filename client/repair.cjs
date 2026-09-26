const fs = require('fs');

function repair(filePath) {
  if (!fs.existsSync(filePath)) return;
  let c = fs.readFileSync(filePath, 'utf8');
  
  c = c.replace(/showToas'([^']*)'/g, "showToast('$1')");
  
  fs.writeFileSync(filePath, c);
}

['src/pages/ImpactDashboard.jsx', 'src/pages/food/DonateFoodForm.jsx', 'src/components/ProgressTracker.jsx', 'src/components/LanguageSelector.jsx', 'src/components/ui/Textarea.jsx', 'src/components/ui/Input.jsx'].forEach(repair);
console.log('Fixed showToas syntax error!');
