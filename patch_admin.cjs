const fs = require('fs');
let content = fs.readFileSync('client/src/pages/admin/AdminDashboard.jsx', 'utf8');

content = content.replace(
  `    useEffect(() => {
      if (user?.role !== 'admin') {
        showToast(t('toastTitle_error'), t('toastMsg_unauthorizedAccessAdminOnly'));
        navigate('/');
      }
    }, [user, navigate, showToast]);`,
  ``
);

fs.writeFileSync('client/src/pages/admin/AdminDashboard.jsx', content);
