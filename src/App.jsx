import React from 'react';
import { Routes, Route } from 'react-router-dom';

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

// Analytical Sub-Reports (Existing)
import SalesTrendAnalysis from './pages/SalesTrendAnalysis';
import PeakTimeAnalysis from './pages/PeakTimeAnalysis';
import MenuPerformance from './pages/MenuPerformance';

// Analytical Sub-Reports (NEW - Ensure these are in src/pages/reports/)
import CategoryContribution from './pages/CategoryContribution';
import TableUtilization from './pages/TableUtilization';
import AbvAnalysis from './pages/AbvAnalysis';


// Others
import SmartAssigner from './pages/SmartAssigner';

const App = () => {
  return (
    <>
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
              {/* Core */}
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/smart-assign" element={<SmartAssigner />} />
              <Route path="/order" element={<Order />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/kitchen" element={<Kitchen />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/hr/directory" element={<StaffDirectory />} />

              {/* Reports Hubs */}
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/sales" element={<SalesReport />} />
              <Route path="/reports/sales-and-revenue" element={<SalesAndRevenue />} />

              {/* Analytical Reports Hub */}
              <Route path="/reports/analytical" element={<AnalyticalReports />} />

              {/* Analytical Sub Pages */}
              <Route 
                path="/reports/analytical/sales-trends" 
                element={<SalesTrendAnalysis />} 
              />
              <Route 
                path="/reports/analytical/peak-times" 
                element={<PeakTimeAnalysis />} 
              />
              <Route 
                path="/reports/analytical/menu-performance" 
                element={<MenuPerformance />} 
              />
              <Route 
                path="/reports/analytical/time-comparison" 
                element={<TimeComparisonReport />} 
              />
              <Route path="/staff-and-hr" element={<StaffAndHR />} />

              {/* --- NEW ANALYTICAL ROUTES --- */}
              <Route 
                path="/reports/analytical/category-contribution" 
                element={<CategoryContribution />} 
              />
              <Route 
                path="/reports/analytical/table-utilization" 
                element={<TableUtilization />} 
              />
              <Route 
                path="/reports/analytical/abv-analysis" 
                element={<AbvAnalysis />} 
              />
              {/* ----------------------------- */}

              {/* Other Reports */}
              <Route 
                path="/reports/item-wise-sales" 
                element={<ItemWiseSalesReport />} 
              />
              <Route 
                path="/reports/table-wise-sales" 
                element={<TableWiseSalesReport />} 
              />
              <Route 
                path="/reports/payment-mode" 
                element={<PaymentModeReport />} 
              />
              <Route 
                path="/reports/discounts" 
                element={<DiscountsReport />} 
              />
              <Route 
                path="/reports/order-type" 
                element={<OrderTypeReport />} 
              />
              <Route 
                path="/reports/hourly-sales" 
                element={<HourlySalesReport />} 
              />

              {/* Settings */}
              <Route path="/settings" element={<Settings />} />
              <Route path="/attendance" element={<Attendance />} />
            </Routes>
          </div>
        </main>
      </div>
    </>
  );
};

export default App;