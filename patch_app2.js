const fs = require('fs');

let appContent = fs.readFileSync('client/src/App.jsx', 'utf8');

// Replace the old patch logic for the route
appContent = appContent.replace(
  /<Route path="\/dashboard" element=\{<ProtectedRoute><Navigate to="\/" replace \/><\/ProtectedRoute>\} \/>/,
  `<Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />`
);

// Add DashboardRedirect component
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

fs.writeFileSync('client/src/App.jsx', appContent);
console.log('Patched App.jsx again');
