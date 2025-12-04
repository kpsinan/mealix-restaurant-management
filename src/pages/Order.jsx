// src/pages/Order.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  getMenuItems,
  getTables,
  getStaff,
  addOrder,
  updateMultipleTablesStatus, // Use bulk update
  getSettings,
} from "../firebase/firebase";
import Modal from "../components/Modal";

// --- Icons System ---
const Icons = {
  Chevron: ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>,
  Minus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>,
  Table: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
  Alert: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
};

// --- Sub-Components ---
const Toast = ({ notification }) => {
  if (!notification) return null;
  const styles = {
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-red-50 text-red-800 border-red-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
  };
  const Icon = notification.type === 'success' ? Icons.Check : Icons.Alert;

  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-fade-in-down ${styles[notification.type]}`}>
      <Icon />
      <span className="font-medium text-sm">{notification.message}</span>
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-20 bg-gray-100 rounded-xl w-full border border-gray-200" />
    ))}
  </div>
);

const QuantityControl = React.memo(({ quantity, onDecrease, onIncrease }) => (
  <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-inner shrink-0">
    <button onClick={(e) => { e.stopPropagation(); onDecrease(); }} disabled={quantity <= 0} 
      className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-700 shadow-sm hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-all touch-manipulation">
      <Icons.Minus />
    </button>
    <span className="w-8 text-center font-bold text-gray-800 text-sm leading-none">{quantity}</span>
    <button onClick={(e) => { e.stopPropagation(); onIncrease(); }} 
      className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all touch-manipulation">
      <Icons.Plus />
    </button>
  </div>
));

const Order = () => {
  const isSidebarOpen = true; 
  const location = useLocation();

  // State
  const [data, setData] = useState({ tables: [], staff: [], menu: [], settings: { currencySymbol: '₹' } });
  const [session, setSession] = useState({ tableId: "", staffId: "", linkedTableIds: [] });
  const [orderState, setOrderState] = useState({ items: {}, expandedId: null, loading: false, submitting: false });
  const [uiState, setUiState] = useState({ isModalOpen: true, notification: null });

  // Helpers
  const showNotification = useCallback((message, type = 'success') => {
    setUiState(prev => ({ ...prev, notification: { message, type } }));
    setTimeout(() => setUiState(prev => ({ ...prev, notification: null })), 3000);
  }, []);

  // Fetch Data & Parse URL
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setOrderState(prev => ({ ...prev, loading: true }));
      try {
        const [tables, staff, menu, settings] = await Promise.all([
          getTables(), getStaff(), getMenuItems(), getSettings()
        ]);
        
        if (mounted) {
          setData({ tables: tables || [], staff: staff || [], menu: menu || [], settings: settings || { currencySymbol: '₹' } });

          const params = new URLSearchParams(location.search);
          const tId = params.get("tableId");
          const linked = params.get("linked");

          if (tId) {
            // Auto-select Table ONLY
            setSession(prev => ({ 
              ...prev, 
              tableId: tId, 
              linkedTableIds: linked ? linked.split(',') : [] 
            }));
            
            // NOTE: REMOVED AUTO-SELECT STAFF LOGIC HERE
            // Modal stays open to force Staff selection
            setUiState(prev => ({ ...prev, isModalOpen: true }));
          } else {
             setUiState(prev => ({ ...prev, isModalOpen: true }));
          }
        }
      } catch (err) {
        showNotification("Failed to load menu data", "error");
      } finally {
        if (mounted) setOrderState(prev => ({ ...prev, loading: false }));
      }
    };
    init();
    return () => { mounted = false; };
  }, [location.search, showNotification]);

  // Derived: Display Name for Tables (Handling Merge)
  const sessionTableName = useMemo(() => {
    if (!session.tableId || data.tables.length === 0) return "Table ?";
    const mainTable = data.tables.find(t => t.id === session.tableId);
    let name = mainTable?.name || "Unknown";
    
    if (session.linkedTableIds.length > 0) {
      const linkedNames = session.linkedTableIds.map(id => {
        const t = data.tables.find(tbl => tbl.id === id);
        return t ? t.name : "";
      }).filter(Boolean);
      if (linkedNames.length > 0) name += ` + ${linkedNames.join(" + ")}`;
    }
    return name;
  }, [session.tableId, session.linkedTableIds, data.tables]);

  const handlePortionChange = useCallback((itemId, portion, change) => {
    setOrderState(prev => {
      const items = { ...prev.items };
      if (!items[itemId]) items[itemId] = { full: 0, half: 0, quarter: 0 };
      items[itemId][portion] = Math.max(0, (items[itemId][portion] || 0) + change);
      if (!items[itemId].full && !items[itemId].half && !items[itemId].quarter) delete items[itemId];
      return { ...prev, items };
    });
  }, []);

  const totalAmount = useMemo(() => {
    return Object.entries(orderState.items).reduce((acc, [itemId, portions]) => {
      const item = data.menu.find(i => (i.id ?? i._id) === itemId);
      if (!item) return acc;
      return acc + 
        (portions.full * (item.fullPrice ?? item.price ?? 0)) +
        (portions.half * (item.halfPrice ?? 0)) +
        (portions.quarter * (item.quarterPrice ?? 0));
    }, 0);
  }, [orderState.items, data.menu]);

  const handleSubmit = async () => {
    if (!session.tableId) return setUiState(prev => ({ ...prev, isModalOpen: true }));

    // Validation: Staff is strictly required now
    if (!session.staffId) {
      setUiState(prev => ({ ...prev, isModalOpen: true }));
      return showNotification("Please select a staff member", "warning");
    }

    const orderPayload = [];
    Object.entries(orderState.items).forEach(([itemId, portions]) => {
      const item = data.menu.find(i => (i.id ?? i._id) === itemId);
      if (!item) return;
      
      if (portions.full > 0) orderPayload.push({ itemId, quantity: portions.full, portion: 'full', price: item.fullPrice ?? item.price });
      if (portions.half > 0) orderPayload.push({ itemId, quantity: portions.half, portion: 'half', price: item.halfPrice });
      if (portions.quarter > 0) orderPayload.push({ itemId, quantity: portions.quarter, portion: 'quarter', price: item.quarterPrice });
    });

    if (orderPayload.length === 0) return showNotification("Please add items first", "warning");

    setOrderState(prev => ({ ...prev, submitting: true }));
    try {
      // Create Order
      await addOrder({
        tableId: session.tableId,
        linkedTableIds: session.linkedTableIds, 
        staffId: session.staffId, // Now strictly required
        items: orderPayload,
        total: totalAmount,
        createdAt: new Date().toISOString(),
      });
      
      // Update ALL tables to occupied NOW (Logic moved from SmartAssigner to here)
      const allTableIds = [session.tableId, ...session.linkedTableIds];
      await updateMultipleTablesStatus(allTableIds, "occupied");
      
      window.dispatchEvent(new CustomEvent("tablesUpdated"));
      showNotification("Order submitted successfully!", "success");
      setOrderState(prev => ({ ...prev, items: {}, expandedId: null }));
    } catch (err) {
      console.error(err);
      showNotification("Failed to submit order", "error");
    } finally {
      setOrderState(prev => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Toast notification={uiState.notification} />

      {/* Main Layout */}
      <div className="container mx-auto px-4 md:px-6 pt-24 pb-40 max-w-3xl">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">New Order</h1>
            <p className="text-gray-500 text-xs mt-0.5">Select items from menu</p>
          </div>
          
          {/* Session Badge */}
          {session.tableId && (
            <div onClick={() => setUiState(prev => ({ ...prev, isModalOpen: true }))}
              className="flex flex-col items-end cursor-pointer bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm active:bg-gray-50 transition-colors touch-manipulation">
              <div className="flex items-center gap-1.5 text-blue-600 font-bold text-sm">
                <Icons.Table />
                {/* Updated to show Merged Name */}
                <span className="truncate max-w-[150px]">{sessionTableName}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400 text-[10px] font-medium uppercase tracking-wide">
                <Icons.User />
                <span className="truncate max-w-[80px]">{data.staff.find(s => (s.id ?? s._id) === session.staffId)?.name || "No Staff"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Session Modal */}
        <Modal isOpen={uiState.isModalOpen} onClose={() => setUiState(prev => ({ ...prev, isModalOpen: false }))}>
          <div className="max-h-[70vh] overflow-y-auto px-1 py-1 scrollbar-hide">
            <h2 className="text-xl font-bold mb-6 text-gray-800 sticky top-0 bg-white pb-2">Start Session</h2>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Table</label>
                <select value={session.tableId} onChange={(e) => setSession({ ...session, tableId: e.target.value, linkedTableIds: [] })} 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium appearance-none">
                  <option value="">Select Table</option>
                  {/* Show all tables, but normally filtered in a real app */}
                  {data.tables.map(t => <option key={t.id ?? t._id} value={t.id ?? t._id}>{t.name} (Cap: {t.capacity || 0})</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Staff</label>
                <select value={session.staffId} onChange={(e) => setSession({ ...session, staffId: e.target.value })} 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium appearance-none">
                  <option value="">Select Staff</option>
                  {data.staff.map(s => <option key={s.id ?? s._id} value={s.id ?? s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            {/* Button disabled if either table OR staff is missing */}
            <button onClick={() => setUiState(prev => ({ ...prev, isModalOpen: false }))} disabled={!session.tableId || !session.staffId} 
              className={`mt-8 w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all touch-manipulation ${(!session.tableId || !session.staffId) ? "bg-gray-200 text-gray-400" : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"}`}>
              Start Order
            </button>
          </div>
        </Modal>

        {/* Loading State */}
        {orderState.loading ? <SkeletonLoader /> : (
          /* Menu List */
          <div className="space-y-3">
            {data.menu.map((item) => {
              const itemId = item.id ?? item._id;
              const isExpanded = orderState.expandedId === itemId;
              const qty = orderState.items[itemId];
              const totalQty = (qty?.full || 0) + (qty?.half || 0) + (qty?.quarter || 0);

              return (
                <div key={itemId} className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${isExpanded ? 'ring-1 ring-blue-500 border-blue-500 shadow-md' : 'border-gray-100 shadow-sm'}`}>
                  <div onClick={() => setOrderState(prev => ({ ...prev, expandedId: prev.expandedId === itemId ? null : itemId }))}
                    className="p-4 flex justify-between items-center cursor-pointer active:bg-gray-50 touch-manipulation select-none">
                    <div className="min-w-0 flex-1 mr-4">
                      <h3 className="font-bold text-gray-800 text-base truncate">{item.name}</h3>
                      <span className="text-xs text-gray-500 font-medium">
                        {data.settings.currencySymbol}{(item.fullPrice ?? item.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {totalQty > 0 && <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">{totalQty}</span>}
                      <Icons.Chevron className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-600' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Section */}
                  <div className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[600px]' : 'max-h-0'}`}>
                    <div className="px-4 pb-4 pt-1 bg-gray-50 space-y-2 border-t border-gray-100">
                      {[
                        { label: "Full", price: item.fullPrice ?? item.price, key: 'full' },
                        item.halfPrice && { label: "Half", price: item.halfPrice, key: 'half' },
                        item.quarterPrice && { label: "Quarter", price: item.quarterPrice, key: 'quarter' }
                      ].filter(Boolean).map(opt => (
                        <div key={opt.key} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                          <div>
                            <div className="text-xs font-semibold text-gray-600">{opt.label}</div>
                            <div className="text-xs font-bold text-blue-600">{data.settings.currencySymbol}{opt.price.toFixed(2)}</div>
                          </div>
                          <QuantityControl quantity={qty?.[opt.key] || 0} 
                            onDecrease={() => handlePortionChange(itemId, opt.key, -1)} 
                            onIncrease={() => handlePortionChange(itemId, opt.key, 1)} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Action Bar */}
      <div className={`fixed bottom-20 right-0 w-full z-40 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'md:pl-20'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-4 max-w-3xl md:mx-auto">
          <div className="bg-gray-900/95 backdrop-blur-md shadow-2xl rounded-xl p-3 flex items-center justify-between border border-gray-800">
            <div className="pl-2">
              <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total</div>
              <div className="text-xl font-bold text-white font-mono leading-none">{data.settings.currencySymbol}{totalAmount.toFixed(2)}</div>
            </div>
            <button onClick={handleSubmit} disabled={orderState.submitting} 
              className={`px-6 py-2.5 rounded-lg font-bold text-sm shadow transition-transform active:scale-95 flex items-center gap-2 touch-manipulation ${(!session.tableId || !session.staffId) ? "bg-gray-700 text-gray-500" : "bg-white text-gray-900 hover:bg-gray-100"}`}>
              {orderState.submitting ? <span className="animate-pulse">Sending...</span> : <span>Place Order</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;