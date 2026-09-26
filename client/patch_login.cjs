const fs = require('fs');

let content = fs.readFileSync('src/pages/DonationDetail.jsx', 'utf8');

// 1. Add useLocation to imports
content = content.replace(
  `import { useParams, useNavigate } from 'react-router-dom';`,
  `import { useParams, useNavigate, useLocation } from 'react-router-dom';`
);

// 2. Instantiate useLocation
content = content.replace(
  `const navigate = useNavigate();`,
  `const navigate = useNavigate();
  const location = useLocation();`
);

// 3. Pass state to navigate
content = content.replace(
  `      if (!user) {
        navigate('/login');
        return;
      }`,
  `      if (!user) {
        navigate('/login', { state: { from: location } });
        return;
      }`
);

fs.writeFileSync('src/pages/DonationDetail.jsx', content);
