const fs = require('fs');

let appContent = fs.readFileSync('client/src/App.jsx', 'utf8');

if (!appContent.includes('getDashboardRoute')) {
  appContent = appContent.replace(
    /import \{ AuthProvider, useAuth \} from '\.\/context\/AuthContext';/,
    `import { AuthProvider, useAuth } from './context/AuthContext';\nimport { getDashboardRoute } from './utils/routeUtils';`
  );
}

appContent = appContent.replace(
  /return <Navigate to="\/dashboard" replace \/>;/,
  `return <Navigate to={getDashboardRoute(user.role)} replace />;`
);

appContent = appContent.replace(
  /import UserDashboard from '\.\/pages\/UserDashboard';\n/,
  ''
);

if (!appContent.includes('const DashboardRedirect')) {
  appContent = appContent.replace(
    /const ProtectedRoute = /,
    `const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardRoute(user.role)} replace />;
};

const ProtectedRoute = `
  );
}

appContent = appContent.replace(
  /<Route path="\/dashboard" element=\{<ProtectedRoute><UserDashboard \/><\/ProtectedRoute>\} \/>/,
  `<Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />`
);

fs.writeFileSync('client/src/App.jsx', appContent);
console.log('Patched App.jsx unified');
