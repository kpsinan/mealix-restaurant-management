// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Order from './pages/Order';
import Menu from './pages/Menu';
import Staff from './pages/Staff';
import Kitchen from './pages/Kitchen';
import Billing from './pages/Billing';
import Settings from './pages/Settings'; // <-- IMPORT the new Settings page

const App = () => {
  return (
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
          <Route path="/settings" element={<Settings />} /> {/* <-- ADD the new route */}
        </Routes>
      </main>
    </div>
  );
};

export default App;