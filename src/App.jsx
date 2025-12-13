// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import NetworkHandler from './components/NetworkHandler';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Order from './pages/Order';
import Menu from './pages/Menu';
import Staff from './pages/Staff';
import Kitchen from './pages/Kitchen';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import SalesReport from './pages/SalesReport';
import SalesAndRevenue from './pages/SalesAndRevenue';
import ItemWiseSalesReport from './pages/ItemWiseSalesReport';
import TableWiseSalesReport from './pages/TableWiseSalesReport';
import PaymentModeReport from './pages/PaymentModeReport';
import SmartAssigner from './pages/SmartAssigner';
import DiscountsReport from './pages/DiscountsReport'; 
import OrderTypeReport from './pages/OrderTypeReport';
import HourlySalesReport from './pages/HourlySalesReport';

const App = () => {
  return (
    <>
      <NetworkHandler />
      
      {/* Layout Container:
        - Mobile: Column direction (Navbar top, Content bottom)
        - Desktop: Row direction (Sidebar left, Content right)
      */}
      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100 text-gray-800 font-sans">
        
        {/* Desktop Sidebar (Hidden on Mobile) */}
        <div className="hidden lg:block z-30">
          <Sidebar />
        </div>

        {/* Mobile Navbar (Hidden on Desktop) */}
        <div className="lg:hidden z-30">
          <Navbar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative">
          
          {/* Content Padding Logic:
            - lg:p-4: Standard padding on desktop.
            - p-4: Standard padding on mobile.
            - pt-28: Top padding for mobile ONLY. 
              (32px Safe Area + 64px Navbar + 16px buffer = ~112px/28rem class)
              This ensures content doesn't hide behind the fixed transparent header.
          */}
          <div className="pt-28 pb-20 px-4 lg:pt-4 lg:pb-4 lg:px-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/smart-assign" element={<SmartAssigner />} />
              <Route path="/order" element={<Order />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/kitchen" element={<Kitchen />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/sales" element={<SalesReport />} />
              <Route path="/reports/sales-and-revenue" element={<SalesAndRevenue />} />
              <Route path="/reports/item-wise-sales" element={<ItemWiseSalesReport />} />
              <Route path="/reports/table-wise-sales" element={<TableWiseSalesReport />} />
              <Route path="/reports/payment-mode" element={<PaymentModeReport />} />
              <Route path="/reports/discounts" element={<DiscountsReport />} /> 
              <Route path="/reports/order-type" element={<OrderTypeReport />} />
              <Route path="/reports/hourly-sales" element={<HourlySalesReport />} />
              
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </>
  );
};

export default App;