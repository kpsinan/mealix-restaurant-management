import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserRole } from './firebase/firebase';
import Login from './pages/Login';

// Layout & Network
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import NetworkHandler from './components/NetworkHandler';
import StaffDirectory from './pages/hr/StaffDirectory';

// Core Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Order from './pages/Order';
import Menu from './pages/Menu';
import Staff from './pages/Staff';
import Kitchen from './pages/Kitchen';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import StaffAndHR from './pages/StaffAndHR';
import Attendance from './pages/Attendance';

// Reports Hubs
import Reports from './pages/Reports';
import SalesReport from './pages/SalesReport';
import SalesAndRevenue from './pages/SalesAndRevenue';
import AnalyticalReports from './pages/AnalyticalReports';

// Standard Reports
import ItemWiseSalesReport from './pages/ItemWiseSalesReport';
import TableWiseSalesReport from './pages/TableWiseSalesReport';
import PaymentModeReport from './pages/PaymentModeReport';
import DiscountsReport from './pages/DiscountsReport';
import OrderTypeReport from './pages/OrderTypeReport';
import HourlySalesReport from './pages/HourlySalesReport';
import TimeComparisonReport from './pages/TimeComparisonReport';

// Analytical Sub-Reports
import SalesTrendAnalysis from './pages/SalesTrendAnalysis';
import PeakTimeAnalysis from './pages/PeakTimeAnalysis';
import MenuPerformance from './pages/MenuPerformance';
import CategoryContribution from './pages/CategoryContribution';
import TableUtilization from './pages/TableUtilization';
import AbvAnalysis from './pages/AbvAnalysis';

// HR Analytical Pages
import StaffOrderVolume from './pages/hr/StaffOrderVolume';
import StaffSalesContribution from './pages/hr/StaffSalesContribution';
import StaffProductivityKPI from './pages/hr/StaffProductivityKPI';
import ActivityEngagementMonitor from './pages/hr/ActivityEngagementMonitor';
import StaffLoadRevenueBalance from './pages/hr/StaffLoadRevenueBalance';

// Others
import SmartAssigner from './pages/SmartAssigner';

import { signOut } from 'firebase/auth';

export const UserContext = React.createContext({ 
  user: null, 
  role: 'admin',
  permissions: [],
  blocked: false,
  staffId: null
});

const ProtectedRoute = ({ children, requiredPermission, permissions }) => {
  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-500">You do not have permission to view this page.</p>
      </div>
    );
  }
  return children;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [userAccess, setUserAccess] = useState({ role: 'admin', permissions: [], blocked: false, staffId: null });
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const accessData = await getUserRole(currentUser.uid);
        if (accessData.blocked) {
          // If blocked, instantly sign out
          await signOut(auth);
          setUserAccess({ ...accessData, blocked: true });
          setUser(null);
        } else {
          setUser(currentUser);
          setUserAccess(accessData);
        }
      } else {
        setUser(null);
        setUserAccess({ role: 'admin', permissions: [], blocked: false, staffId: null });
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (userAccess.blocked && !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">!</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Blocked</h2>
          <p className="text-gray-600 mb-6">Your login was blocked by the Administrator. Please contact support.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors">Return to Login</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <UserContext.Provider value={{ user, ...userAccess }}>
      <NetworkHandler />

      {/* Layout Container */}
      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100 text-gray-800 font-sans">
        
        {/* Desktop Sidebar */}
        <div className="hidden lg:block z-30">
          <Sidebar />
        </div>

        {/* Mobile Navbar */}
        <div className="lg:hidden z-30">
          <Navbar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="pt-28 pb-20 px-4 lg:pt-4 lg:pb-4 lg:px-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/smart-assign" element={<SmartAssigner />} />
              <Route path="/order" element={<ProtectedRoute requiredPermission="manage_orders" permissions={userAccess.permissions}><Order /></ProtectedRoute>} />
              <Route path="/kitchen" element={<ProtectedRoute requiredPermission="manage_kitchen" permissions={userAccess.permissions}><Kitchen /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute requiredPermission="manage_billing" permissions={userAccess.permissions}><Billing /></ProtectedRoute>} />
              <Route path="/attendance" element={<Attendance />} />
              
              {/* Leaderboards for Staff */}
              <Route path="/hr/staff-order-volume" element={<StaffOrderVolume />} />
              <Route path="/hr/productivity-kpi" element={<StaffProductivityKPI />} />
              <Route path="/hr/activity-monitor" element={<ActivityEngagementMonitor />} />
              <Route path="/hr/load-revenue-balance" element={<StaffLoadRevenueBalance />} />

              {/* Admin / Manager Routes */}
              <Route path="/dashboard" element={<ProtectedRoute requiredPermission="view_dashboard" permissions={userAccess.permissions}><Dashboard /></ProtectedRoute>} />
              <Route path="/menu" element={<ProtectedRoute requiredPermission="manage_menu" permissions={userAccess.permissions}><Menu /></ProtectedRoute>} />
              <Route path="/staff" element={<ProtectedRoute requiredPermission="manage_staff" permissions={userAccess.permissions}><Staff /></ProtectedRoute>} />
              <Route path="/hr/directory" element={<ProtectedRoute requiredPermission="manage_staff" permissions={userAccess.permissions}><StaffDirectory /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute requiredPermission="manage_settings" permissions={userAccess.permissions}><Settings /></ProtectedRoute>} />
              <Route path="/staff-and-hr" element={<ProtectedRoute requiredPermission="manage_staff" permissions={userAccess.permissions}><StaffAndHR /></ProtectedRoute>} />
              
              {/* Financial & Full Reports */}
              <Route path="/reports" element={<ProtectedRoute requiredPermission="view_reports" permissions={userAccess.permissions}><Reports /></ProtectedRoute>} />
              <Route path="/reports/sales" element={<ProtectedRoute requiredPermission="view_financials" permissions={userAccess.permissions}><SalesReport /></ProtectedRoute>} />
              <Route path="/reports/sales-and-revenue" element={<ProtectedRoute requiredPermission="view_financials" permissions={userAccess.permissions}><SalesAndRevenue /></ProtectedRoute>} />
              <Route path="/reports/analytical" element={<ProtectedRoute requiredPermission="view_reports" permissions={userAccess.permissions}><AnalyticalReports /></ProtectedRoute>} />
              <Route path="/reports/analytical/sales-trends" element={<ProtectedRoute requiredPermission="view_financials" permissions={userAccess.permissions}><SalesTrendAnalysis /></ProtectedRoute>} />
              <Route path="/reports/analytical/peak-times" element={<ProtectedRoute requiredPermission="view_reports" permissions={userAccess.permissions}><PeakTimeAnalysis /></ProtectedRoute>} />
              <Route path="/reports/analytical/menu-performance" element={<ProtectedRoute requiredPermission="view_reports" permissions={userAccess.permissions}><MenuPerformance /></ProtectedRoute>} />
              <Route path="/reports/analytical/time-comparison" element={<ProtectedRoute requiredPermission="view_reports" permissions={userAccess.permissions}><TimeComparisonReport /></ProtectedRoute>} />
              <Route path="/reports/analytical/category-contribution" element={<ProtectedRoute requiredPermission="view_reports" permissions={userAccess.permissions}><CategoryContribution /></ProtectedRoute>} />
              <Route path="/reports/analytical/table-utilization" element={<ProtectedRoute requiredPermission="view_reports" permissions={userAccess.permissions}><TableUtilization /></ProtectedRoute>} />
              <Route path="/reports/analytical/abv-analysis" element={<ProtectedRoute requiredPermission="view_reports" permissions={userAccess.permissions}><AbvAnalysis /></ProtectedRoute>} />
              <Route path="/hr/sales-contribution" element={<ProtectedRoute requiredPermission="view_reports" permissions={userAccess.permissions}><StaffSalesContribution /></ProtectedRoute>} />
              <Route path="/reports/item-wise-sales" element={<ProtectedRoute requiredPermission="view_financials" permissions={userAccess.permissions}><ItemWiseSalesReport /></ProtectedRoute>} />
              <Route path="/reports/table-wise-sales" element={<ProtectedRoute requiredPermission="view_financials" permissions={userAccess.permissions}><TableWiseSalesReport /></ProtectedRoute>} />
              <Route path="/reports/payment-mode" element={<ProtectedRoute requiredPermission="view_financials" permissions={userAccess.permissions}><PaymentModeReport /></ProtectedRoute>} />
              <Route path="/reports/discounts" element={<ProtectedRoute requiredPermission="view_financials" permissions={userAccess.permissions}><DiscountsReport /></ProtectedRoute>} />
              <Route path="/reports/order-type" element={<ProtectedRoute requiredPermission="view_reports" permissions={userAccess.permissions}><OrderTypeReport /></ProtectedRoute>} />
              <Route path="/reports/hourly-sales" element={<ProtectedRoute requiredPermission="view_financials" permissions={userAccess.permissions}><HourlySalesReport /></ProtectedRoute>} />
            </Routes>
          </div>
        </main>
      </div>
    </UserContext.Provider>
  );
};

export default App;