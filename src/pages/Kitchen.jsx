// src/pages/Kitchen.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  onOrdersRealtime,
  getTables,
  getMenuItems,
  clearAllOrders,
} from "../firebase/firebase";

// --- Reusable SVG Icon Components ---
const AlertIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setProgress(0);
  };

  const buttonStyle = {
    background: `linear-gradient(to right, #b91c1c ${progress}%, #ef4444 ${progress}%)`,
    transition: 'background 0.1s linear',
  };

  return (
    <button
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      className="bg-red-600 text-white font-bold py-2 px-4 rounded shadow-md select-none focus:outline-none"
      style={buttonStyle}
    >
      {children}
    </button>
  );
};


const Kitchen = () => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handles the actual deletion after confirmation.
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

  // Effect to automatically hide the notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Effect to handle 'Enter' key press for modal confirmation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isConfirming && event.key === 'Enter') {
        event.preventDefault();
        handleConfirmClear();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isConfirming, handleConfirmClear]);

  // Main data fetching and real-time listener setup
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [tableData, menuData] = await Promise.all([getTables(), getMenuItems()]);
        setTables(tableData || []);
        setMenuItems(menuData || []);
      } catch (err) {
        console.error("Error fetching tables or menu items:", err);
        setNotification({ type: 'error', message: 'Could not load menu or table data.' });
      }
    };
    fetchStaticData();

    const unsubscribe = onOrdersRealtime(
      (liveOrders) => {
        const sortedOrders = liveOrders
          .map((o) => ({ ...o, createdAt: new Date(o.createdAt) }))
          .sort((a, b) => b.createdAt - a.createdAt);
        setOrders(sortedOrders);
      },
      (err) => {
        console.error("Realtime orders error:", err);
        setNotification({ type: 'error', message: 'Error connecting to real-time orders.' });
      }
    );
    return () => unsubscribe();
  }, []);

  // Helpers to get names from IDs
  const getTableName = (tableId) => tables.find((t) => (t.id ?? t._id) === tableId)?.name || "Unknown";
  const getItemName = (itemId) => menuItems.find((i) => (i.id ?? i._id) === itemId)?.name || "Unknown";

  // --- Reusable UI sub-components ---
  const NotificationBanner = () => {
    if (!notification) return null;
    const baseClasses = "flex items-center p-4 mb-4 text-sm rounded-lg";
    const typeClasses = { success: "bg-green-100 text-green-700", error: "bg-red-100 text-red-700" };
    return (
      <div className={`${baseClasses} ${typeClasses[notification.type]}`} role="alert">
        <AlertIcon /> <span className="ml-3 font-medium">{notification.message}</span>
        <button onClick={() => setNotification(null)} className="ml-auto -mx-1.5 -my-1.5 bg-transparent p-1.5 rounded-lg focus:ring-2 inline-flex h-8 w-8" aria-label="Dismiss">
          <span className="sr-only">Dismiss</span>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
        </button>
      </div>
    );
  };
  
  const ConfirmationModal = () => {
    if (!isConfirming) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm" aria-modal="true" role="dialog">
        <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md mx-4">
          <h3 className="text-xl font-bold text-gray-900">Emergency Action</h3>
          <p className="mt-4 text-sm bg-yellow-100 text-yellow-800 p-3 rounded-md border border-yellow-300">
            <strong>Warning:</strong> This button is only for emergency situations if the system does not automatically clear the orders.
          </p>
          <p className="mt-3 text-gray-600">Are you sure you want to permanently delete all orders? This action cannot be undone.</p>
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => setIsConfirming(false)}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmClear}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold transition-colors flex items-center disabled:opacity-75 disabled:cursor-not-allowed hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <SpinnerIcon />
                  Deleting...
                </>
              ) : (
                "Confirm & Delete All"
              )}
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
            <EmergencyHoldButton onComplete={() => setIsConfirming(true)}>
              Press & Hold to Clear Orders
            </EmergencyHoldButton>
          )}
        </div>
        {orders.length === 0 ? (
          <p className="text-gray-600 text-center text-lg mt-8">No orders currently.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-2">Table: {getTableName(order.tableId)}</h3>
                <ul className="text-gray-700 mb-3 space-y-1 flex-grow">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{getItemName(item.itemId)}</span>
                      <span>x {item.quantity}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-2 border-t">
                  <p className="text-gray-800 font-semibold">Total: ₹{order.total.toFixed(2)}</p>
                  {order.staffId && (<p className="text-sm text-gray-500 mt-1">Staff ID: {order.staffId}</p>)}
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