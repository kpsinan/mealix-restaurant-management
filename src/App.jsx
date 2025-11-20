// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NetworkHandler from './components/NetworkHandler'; // Imported NetworkHandler

import Home from './pages/Home';
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

const App = () => {
  return (
    <>
      {/* NetworkHandler placed outside the layout so it covers everything */}
      <NetworkHandler />
      
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-4 bg-gray-100 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
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
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </>
  );
};

export default App;