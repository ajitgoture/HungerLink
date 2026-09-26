export const getDashboardRoute = (role) => {
  if (!role) return '/explore';
  
  const roleLower = role.toLowerCase();
  
  if (roleLower === 'admin') return '/admin';
  if (roleLower.includes('food')) {
    return roleLower.includes('donor') ? '/food/donor-dashboard' : '/food/receiver-dashboard';
  }
  if (roleLower.includes('cloth')) {
    return roleLower.includes('donor') ? '/cloth/donor-dashboard' : '/cloth/receiver-dashboard';
  }
  
  return '/explore';
};
