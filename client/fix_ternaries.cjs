const fs = require('fs');

function replaceAll(file, search, replace) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.split(search).join(replace);
  fs.writeFileSync(file, c);
}

replaceAll('src/pages/Register.jsx', "'Invalid 10-digit number'", "t('Invalid 10-digit number')");
replaceAll('src/pages/Register.jsx', "'Passwords do not match'", "t('Passwords do not match')");
replaceAll('src/pages/Register.jsx', "'Creating Account...'", "t('Creating Account...')");
replaceAll('src/pages/Register.jsx', "'Create Account'", "t('Create Account')");
replaceAll('src/pages/Login.jsx', "'Signing in...'", "t('Signing in...')");
replaceAll('src/pages/Login.jsx', "'Sign in'", "t('Sign in')");
