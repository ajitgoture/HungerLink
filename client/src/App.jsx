import { useTranslation } from 'react-i18next';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getDashboardRoute } from './utils/routeUtils';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

// Food Module Imports
import FoodEntry from './pages/food/FoodEntry';
import DonateFoodForm from './pages/food/DonateFoodForm';
import DonorDashboard from './pages/food/DonorDashboard';
import ReceiverDashboard from './pages/food/ReceiverDashboard';
import AvailableFood from './pages/food/AvailableFood';
import RequestsReceived from './pages/food/RequestsReceived';
import MyRequests from './pages/food/MyRequests';
import MyDonations from './pages/food/MyDonations';
import MapExplorer from './pages/food/MapExplorer';

// Shared Detail View & Explore & Impact
import DonationDetail from './pages/DonationDetail';
import Explore from './pages/Explore';
import ImpactDashboard from './pages/ImpactDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

// Clothes Module Imports
import ClothEntry from './pages/cloth/ClothEntry';
import DonateClothForm from './pages/cloth/DonateClothForm';
import ClothDonorDashboard from './pages/cloth/ClothDonorDashboard';
import ClothReceiverDashboard from './pages/cloth/ClothReceiverDashboard';
import AvailableClothes from './pages/cloth/AvailableClothes';
import ClothRequestsReceived from './pages/cloth/ClothRequestsReceived';
import MyClothRequests from './pages/cloth/MyClothRequests';
import MyClothDonations from './pages/cloth/MyClothDonations';
import ClothMapExplorer from './pages/cloth/ClothMapExplorer';


import PublicProfile from './pages/PublicProfile';
import Profile from './pages/Profile';
import { NotFound } from './pages/NotFound';

// Protected Route Wrapper
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardRoute(user.role)} replace />;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-500">{t('loading_loadingUserAuthentication')}</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'admin') {
    return <Navigate to={getDashboardRoute(user.role)} replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-teal-500 selection:text-white pb-16 md:pb-0">
      <Navbar />
      
      <main className="flex-grow relative">
        <Routes>
          {/* Main Landing Page & Dashboard */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/impact" element={<ImpactDashboard />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<PublicProfile />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/:type/donations/:id" element={<DonationDetail />} />

          {/* Module 1: Food Donation Routes */}
          <Route path="/food" element={<FoodEntry />} />
          <Route path="/food/donate" element={<ProtectedRoute allowedRoles={['Food Donor']}><DonateFoodForm /></ProtectedRoute>} />
          <Route path="/food/donor-dashboard" element={<ProtectedRoute allowedRoles={['Food Donor']}><DonorDashboard /></ProtectedRoute>} />
          <Route path="/food/receiver-dashboard" element={<ProtectedRoute allowedRoles={['Food Receiver']}><ReceiverDashboard /></ProtectedRoute>} />
          <Route path="/food/available" element={<Explore mode="food" />} />
          <Route path="/food/requests-received" element={<ProtectedRoute allowedRoles={['Food Donor']}><RequestsReceived /></ProtectedRoute>} />
          <Route path="/food/my-requests" element={<ProtectedRoute allowedRoles={['Food Receiver']}><MyRequests /></ProtectedRoute>} />
          <Route path="/food/my-donations" element={<ProtectedRoute allowedRoles={['Food Donor']}><MyDonations /></ProtectedRoute>} />
          <Route path="/food/map" element={<Navigate to="/explore?tab=food" replace />} />

          {/* Module 2: Clothes Donation Routes */}
          <Route path="/cloth" element={<ClothEntry />} />
          <Route path="/clothes" element={<Navigate to="/cloth" replace />} />
          <Route path="/cloth/donate" element={<ProtectedRoute><DonateClothForm /></ProtectedRoute>} />
          <Route path="/cloth/donor-dashboard" element={<ProtectedRoute><ClothDonorDashboard /></ProtectedRoute>} />
          <Route path="/cloth/receiver-dashboard" element={<ProtectedRoute><ClothReceiverDashboard /></ProtectedRoute>} />
          <Route path="/cloth/available" element={<Navigate to="/explore?tab=cloth" replace />} />
          <Route path="/cloth/requests-received" element={<ProtectedRoute><ClothRequestsReceived /></ProtectedRoute>} />
          <Route path="/cloth/my-requests" element={<ProtectedRoute><MyClothRequests /></ProtectedRoute>} />
          <Route path="/cloth/my-donations" element={<ProtectedRoute><MyClothDonations /></ProtectedRoute>} />
          <Route path="/cloth/map" element={<Navigate to="/explore?tab=cloth" replace />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <Router>
            <AppRoutes />
          </Router>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
