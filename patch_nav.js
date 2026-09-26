const fs = require('fs');

const navPath = 'client/src/components/Navbar.jsx';
let navContent = fs.readFileSync(navPath, 'utf8');

if (!navContent.includes('getDashboardRoute')) {
  navContent = navContent.replace(
    /import \{ useAuth \} from '\.\.\/context\/AuthContext';/,
    `import { useAuth } from '../context/AuthContext';\nimport { getDashboardRoute } from '../utils/routeUtils';`
  );
}

navContent = navContent.replace(
  /onClick=\{\(\) => navigate\('\/dashboard'\)\}/,
  `onClick={() => navigate(getDashboardRoute(user.role))}`
);

fs.writeFileSync(navPath, navContent);
console.log('Patched Navbar.jsx');
