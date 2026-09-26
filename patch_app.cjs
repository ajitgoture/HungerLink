const fs = require('fs');
let content = fs.readFileSync('client/src/App.jsx', 'utf8');

content = content.replace(
  "import PublicProfile from './pages/PublicProfile';",
  "import PublicProfile from './pages/PublicProfile';\nimport { NotFound } from './pages/NotFound';"
);

content = content.replace(
  '<Route path="*" element={<Navigate to="/" replace />} />',
  '<Route path="*" element={<NotFound />} />'
);

fs.writeFileSync('client/src/App.jsx', content);
