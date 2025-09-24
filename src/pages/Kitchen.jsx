// src/pages/Kitchen.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  onOrdersRealtime,
  getTables,
  getMenuItems,
  getStaff,
  getSettings,
  clearAllOrders,
} from "../firebase/firebase";

// --- Reusable SVG Icon Components ---
const AlertIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);

// --- Emergency Press and Hold Button Component ---
const EmergencyHoldButton = ({ onComplete, holdTime = 2000, children }) => {
  const [progress, setProgress] = useState(0);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const startPress = () => {
    startTimeRef.current = Date.now();
    const animate = () => {
      const elapsedTime = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsedTime / holdTime) * 100, 100);
      setProgress(newProgress);
      if (newProgress < 100) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        onComplete();
        setTimeout(() => setProgress(0), 500);
      }
    };
    animationFrameRef.current = requestAnimationFrame(animate);
  };
  const cancelPress = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setProgress(0);
  };
  const buttonStyle = { background: `linear-gradient(to right, #b91c1c ${progress}%, #ef4444 ${progress}%)`, transition: 'background 0.1s linear' };
  return <button onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress} onTouchStart={startPress} onTouchEnd={cancelPress} className="bg-red-600 text-white font-bold py-2 px-4 rounded shadow-md select-none focus:outline-none" style={buttonStyle}>{children}</button>;
};

const Kitchen = () => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [settings, setSettings] = useState({ currencySymbol: '₹' });
  const [notification, setNotification] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmClear = useCallback(async () => {
    if (!isConfirming || isDeleting) return;
    setIsDeleting(true);
    try {
      await clearAllOrders();
      setNotification({ type: "success", message: "All orders have been cleared successfully." });
    } catch (error) {
      console.error("Failed to clear orders:", error);
      setNotification({ type: "error", message: "An error occurred while clearing orders." });
    } finally {
      setIsDeleting(false);
      setIsConfirming(false);
    }
  }, [isConfirming, isDeleting]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [tableData, menuData, staffData, currentSettings] = await Promise.all([
          getTables(), getMenuItems(), getStaff(), getSettings(),
        ]);
        setTables(tableData || []);
        setMenuItems(menuData || []);
        setStaff(staffData || []);
        if (currentSettings) setSettings(currentSettings);
      } catch (err) {
        console.error("Error fetching static data:", err);
        setNotification({ type: 'error', message: 'Could not load initial app data.' });
      }
    };
    fetchStaticData();

    const unsubscribe = onOrdersRealtime((liveOrders) => {
      const sortedOrders = liveOrders.map((o) => ({ ...o, createdAt: new Date(o.createdAt) })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
    }, (err) => {
      console.error("Realtime orders error:", err);
      setNotification({ type: 'error', message: 'Error connecting to real-time orders.' });
    });
    return () => unsubscribe();
  }, []);

  const getTableName = (tableId) => tables.find((t) => (t.id ?? t._id) === tableId)?.name || "Unknown";
  const getItemName = (itemId) => menuItems.find((i) => (i.id ?? i._id) === itemId)?.name || "Unknown";
  const getStaffName = (staffId) => staff.find((s) => (s.id ?? s._id) === staffId)?.name || "N/A";

  const NotificationBanner = () => {
    if (!notification) return null;
    const isError = notification.type === 'error';
    return (
      <div className={`fixed top-5 right-5 flex items-center p-4 mb-4 text-sm rounded-lg shadow-lg z-50 ${isError ? 'text-red-800 bg-red-50' : 'text-green-800 bg-green-50'}`} role="alert">
        <AlertIcon />
        <span className="sr-only">{isError ? 'Error' : 'Success'}</span>
        <div className="ml-3 font-medium">{notification.message}</div>
      </div>
    );
  };
  
  const ConfirmationModal = () => {
    if (!isConfirming) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-xl font-bold mb-4">Confirm Action</h2>
          <p className="mb-6">Are you sure you want to clear all orders? This cannot be undone.</p>
          <div className="flex justify-end gap-4">
            <button onClick={() => setIsConfirming(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
            <button onClick={handleConfirmClear} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 flex items-center">
              {isDeleting && <SpinnerIcon />}
              {isDeleting ? 'Clearing...' : 'Clear All'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ConfirmationModal />
      <div className="container mx-auto py-6 px-4">
        <NotificationBanner />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Kitchen Orders</h1>
          {orders.length > 0 && (
            <EmergencyHoldButton onComplete={() => setIsConfirming(true)}>Press & Hold to Clear Orders</EmergencyHoldButton>
          )}
        </div>
        {orders.length === 0 ? (
          <p className="text-gray-600 text-center text-lg mt-8">No active orders.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-2">Table: {getTableName(order.tableId)}</h3>
                <ul className="text-gray-700 mb-3 space-y-1 flex-grow">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-start">
                      <span className="flex-1 pr-2">
                        {getItemName(item.itemId)}
                        {/* This line checks for and displays the portion */}
                        {item.portion && (
                          <span className="text-sm text-gray-500 capitalize ml-1">({item.portion})</span>
                        )}
                      </span>
                      <span className="font-semibold">x {item.quantity}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-2 border-t">
                  <p className="text-gray-800 font-semibold">Total: {settings.currencySymbol}{order.total.toFixed(2)}</p>
                  {order.staffId && (<p className="text-sm text-gray-500 mt-1">Staff: {getStaffName(order.staffId)}</p>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Kitchen;