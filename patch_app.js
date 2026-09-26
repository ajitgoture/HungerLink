const fs = require('fs');

let appContent = fs.readFileSync('client/src/App.jsx', 'utf8');

// Import getDashboardRoute if not present
if (!appContent.includes('getDashboardRoute')) {
  appContent = appContent.replace(
    /import \{ AuthProvider, useAuth \} from '\.\/context\/AuthContext';/,
    `import { AuthProvider, useAuth } from './context/AuthContext';\nimport { getDashboardRoute } from './utils/routeUtils';`
  );
}

// Update ProtectedRoute
appContent = appContent.replace(
  /return <Navigate to="\/dashboard" replace \/>;/,
  `return <Navigate to={getDashboardRoute(user.role)} replace />;`
);

// Remove UserDashboard import
appContent = appContent.replace(
  /import UserDashboard from '\.\/pages\/UserDashboard';\n/,
  ''
);

// Redirect /dashboard to the computed dashboard
appContent = appContent.replace(
  /<Route path="\/dashboard" element=\{<ProtectedRoute><UserDashboard \/><\/ProtectedRoute>\} \/>/,
  `<Route path="/dashboard" element={<ProtectedRoute><Navigate to="/" replace /></ProtectedRoute>} />`
);

fs.writeFileSync('client/src/App.jsx', appContent);
console.log('Patched App.jsx');
