// src/pages/Kitchen.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  onOrdersRealtime,
  getTables,
  getMenuItems,
  getStaff,
  getSettings,
  clearAllOrders,
  updateOrderStatus,
} from "../firebase/firebase";

// --- Reusable SVG Icon Components ---
const AlertIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);
const CheckIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>;
const CookingIcon = () => <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.362 5.214A8.252 8.252 0 0012 3a8.25 8.25 0 00-3.362 2.214c-1.121 2.3-.11 4.701 2.362 7.048-2.472 2.347-3.483 4.749-2.362 7.048A8.252 8.252 0 0012 21a8.25 8.25 0 003.362-2.214c1.121-2.3.11-4.701-2.362-7.048 2.472-2.347 3.483-4.749 2.362-7.048z" /></svg>;


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
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

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

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (updatingOrderId) return;
    setUpdatingOrderId(orderId);
    try {
        await updateOrderStatus(orderId, newStatus);
    } catch (error) {
        console.error(`Failed to update order ${orderId} to ${newStatus}:`, error);
        setNotification({ type: 'error', message: 'Failed to update order status.' });
    } finally {
        setUpdatingOrderId(null);
    }
  };

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
      const activeOrders = liveOrders.filter(o => o.status !== 'Served');
      const sortedOrders = activeOrders.map((o) => ({ 
          ...o, 
          createdAt: new Date(o.createdAt),
          status: o.status || 'Pending',
        }))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
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
  
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Preparing':
        return { borderColor: 'border-yellow-400', badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-800' };
      case 'Ready':
        return { borderColor: 'border-green-400', badgeBg: 'bg-green-100', badgeText: 'text-green-800' };
      case 'Pending':
      default:
        return { borderColor: 'border-blue-400', badgeBg: 'bg-blue-100', badgeText: 'text-blue-800' };
    }
  };

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
          <p className="mb-6">Are you sure you want to clear all orders? This action cannot be undone.</p>
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
            <div className="text-right">
              <EmergencyHoldButton onComplete={() => setIsConfirming(true)}>Press & Hold to Clear Orders</EmergencyHoldButton>
              {/* --- ADDED WARNING MESSAGE --- */}
              <div className="flex items-center justify-end mt-2 text-red-600">
                <div className="w-4 h-4 mr-1">
                  <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.273-1.21 2.91 0l5.396 10.297c.63 1.202-.288 2.653-1.64 2.653H4.5c-1.352 0-2.27-1.451-1.64-2.653l5.396-10.297zM9 8a1 1 0 011 1v3a1 1 0 11-2 0V9a1 1 0 011-1zm1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path></svg>
                </div>
                <p className="text-xs font-semibold">Warning: This will permanently delete all active orders.</p>
              </div>
            </div>
          )}
        </div>
        {orders.length === 0 ? (
          <p className="text-gray-600 text-center text-lg mt-8">No active orders.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {orders.map((order) => {
              const statusStyles = getStatusStyles(order.status);
              const isUpdating = updatingOrderId === order.id;

              return (
                <div key={order.id} className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${statusStyles.borderColor} flex flex-col`}>
                  <div className="flex justify-between items-center mb-2 pb-2 border-b">
                     <h3 className="text-lg font-semibold text-gray-900">Table: {getTableName(order.tableId)}</h3>
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles.badgeBg} ${statusStyles.badgeText}`}>{order.status}</span>
                  </div>
                  
                  <ul className="text-gray-700 mb-3 space-y-1 flex-grow">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-start">
                        <span className="flex-1 pr-2">
                          {getItemName(item.itemId)}
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
                  
                    <div className="mt-4 flex flex-col gap-2">
                      {order.status === 'Pending' && (
                        <button onClick={() => handleUpdateStatus(order.id, 'Preparing')} disabled={isUpdating} className="w-full flex justify-center items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-yellow-300 font-semibold">
                          {isUpdating ? <SpinnerIcon /> : <CookingIcon />}
                          {isUpdating ? 'Starting...' : 'Start Cooking'}
                        </button>
                      )}
                      {order.status === 'Preparing' && (
                        <button onClick={() => handleUpdateStatus(order.id, 'Ready')} disabled={isUpdating} className="w-full flex justify-center items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 font-semibold">
                          {isUpdating ? <SpinnerIcon /> : <CheckIcon />}
                          {isUpdating ? 'Finishing...' : 'Mark as Ready'}
                        </button>
                      )}
                      {order.status === 'Ready' && (
                        <button onClick={() => handleUpdateStatus(order.id, 'Served')} disabled={isUpdating} className="w-full flex justify-center items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 font-semibold">
                          {isUpdating ? <SpinnerIcon /> : <CheckIcon />}
                          {isUpdating ? 'Serving...' : 'Mark as Served'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Kitchen;