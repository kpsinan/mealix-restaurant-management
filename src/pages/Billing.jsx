// src/pages/Billing.jsx
import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { getMenuItems, getStaff, getSettings, updateTableStatus, deleteOrder, onTablesRealtime, onOrdersRealtime, addSaleRecord } from "../firebase/firebase";
import BillPanel from "../components/BillPanel";
import thermalPrintCss from "../thermal-print.css?inline";

// --- Optimized Sub-Components ---

const Icons = {
  success: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>,
  error: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>,
  warning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>,
  info: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
};

const Toast = memo(({ show, message, type, onClose }) => {
  if (!show) return null;
  const styles = {
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-red-50 text-red-800 border-red-200",
    warning: "bg-orange-50 text-orange-800 border-orange-200", 
    info: "bg-gray-50 text-gray-600 border-gray-200"
  };
  return (
    <div className={`fixed top-5 left-4 right-4 md:left-auto md:right-5 md:w-96 z-50 flex items-center p-4 rounded-lg border shadow-lg transition-all duration-300 ${styles[type] || styles.info}`}>
      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{Icons[type] || Icons.info}</svg>
      <div className="text-sm font-medium">{message}</div>
      <button onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 opacity-70 hover:opacity-100 focus:ring-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
      </button>
    </div>
  );
});

const OptionBtn = ({ active, label, onClick, color }) => (
  <button onClick={onClick} className={`w-full transition-colors duration-200 px-4 py-2 rounded-lg text-sm font-semibold ${active ? `bg-${color}-600 text-white shadow` : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
    {label}
  </button>
);

// --- Main Component ---

const Billing = () => {
  // Consolidated State for cleaner code
  const [state, setState] = useState({ tables: [], orders: [], menuItems: [], staff: [], settings: {} });
  const [ui, setUi] = useState({ 
    loading: false, 
    selectedTableId: "", 
    highlightedIndex: -1, // Controls the visual dropdown selection (Arrow Keys)
    discount: 0, 
    orderType: 'Dine-In', 
    paymentMode: 'Cash' 
  });
  const [billDetails, setBillDetails] = useState(null);
  const [notify, setNotify] = useState({ show: false, message: '', type: 'info' });

  const tableSelectRef = useRef(null);
  const billPanelRef = useRef(null);
  
  // Filter occupied tables
  const occupiedTables = state.tables.filter(t => t.status === "occupied");

  // Helper: Show Notification
  const showToast = useCallback((msg, type = 'success') => {
    setNotify({ show: true, message: msg, type });
    // Auto hide: 2.5s is snappier
    setTimeout(() => setNotify(prev => ({ ...prev, show: false })), 2500);
  }, []);

  // --- 1. Initial Data & Realtime Listeners ---
  useEffect(() => {
    const init = async () => {
      setUi(p => ({ ...p, loading: true }));
      try {
        const [m, s, cfg] = await Promise.all([getMenuItems(), getStaff(), getSettings()]);
        setState(p => ({ ...p, menuItems: m || [], staff: s || [], settings: cfg || {} }));
      } catch (e) { showToast("Failed to load data. Please refresh.", "error"); } 
      finally { setUi(p => ({ ...p, loading: false })); }
    };
    init();
    tableSelectRef.current?.focus();

    const unsubT = onTablesRealtime(d => setState(p => ({ ...p, tables: d || [] })), () => showToast("Table sync error", "error"));
    const unsubO = onOrdersRealtime(d => setState(p => ({ ...p, orders: d || [] })), () => showToast("Order sync error", "error"));
    return () => { unsubT && unsubT(); unsubO && unsubO(); };
  }, [showToast]);

  // --- 2. Print Logic ---
  const handlePrint = useCallback(async () => {
    // Validation 1: Is there a bill loaded?
    if (!billDetails) {
        if (occupiedTables.length === 0) return showToast("No active bills to process.", "info");
        
        // Validation 2: Has user highlighted a table but NOT pressed enter?
        const visualSelectionId = occupiedTables[ui.highlightedIndex]?.id;
        if (visualSelectionId && visualSelectionId !== ui.selectedTableId) {
            return showToast("Press ENTER to confirm table selection first.", "warning");
        }
        return showToast("Please select a table first.", "warning");
    }
    
    if (!billPanelRef.current) return;

    // Iframe Printing Logic
    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0', visibility: 'hidden' });
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!doctype html><html><head><style>${thermalPrintCss}</style></head><body><div class="receipt-print-container"><div class="receipt">${billPanelRef.current.innerHTML}</div></div></body></html>`);
    doc.close();
    
    iframe.onload = () => {
        const win = iframe.contentWindow;
        win.focus();
        setTimeout(() => {
            try { win.print(); } catch(e) { console.error(e); }
            setTimeout(() => document.body.removeChild(iframe), 500);
        }, 250);
    };

    // Database Update
    try {
      const subTotal = billDetails.items.reduce((s, i) => s + i.price * i.quantity, 0);
      await addSaleRecord({
        tableName: billDetails.tableName, staffName: billDetails.staffName,
        subTotal, discount: Number(ui.discount) || 0, grandTotal: subTotal - (Number(ui.discount) || 0),
        items: billDetails.items, originalOrderId: billDetails.order.id,
        orderType: ui.orderType, paymentMode: ui.paymentMode,
      });
      await updateTableStatus(ui.selectedTableId, "available");
      await deleteOrder(billDetails.order.id);

      showToast(`Saved: ${billDetails.tableName} (${ui.orderType} / ${ui.paymentMode})`, "success");
      
      // Reset UI
      setBillDetails(null);
      setUi(p => ({ ...p, selectedTableId: "", highlightedIndex: -1, discount: 0, orderType: 'Dine-In', paymentMode: 'Cash' }));
      tableSelectRef.current?.focus();
    } catch (e) { showToast("Finalize failed. Check console.", "error"); }
  }, [billDetails, ui, occupiedTables, showToast]);

  // --- 3. Keyboard Navigation (Restored Original Logic) ---
  useEffect(() => {
    const kbd = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'p') { e.preventDefault(); handlePrint(); return; }
      
      const setters = { 'F3': ['orderType','Dine-In'], 'F4': ['orderType','Takeaway'], 'F7': ['paymentMode','Cash'], 'F8': ['paymentMode','Card'], 'F9': ['paymentMode','UPI'] };
      if (setters[e.key]) { 
          e.preventDefault(); 
          setUi(p => ({ ...p, [setters[e.key][0]]: setters[e.key][1] })); 
          showToast(`${setters[e.key][1]} Mode`, "info"); 
          return; 
      }
      
      // ARROW KEYS: Update Highlight Index ONLY (Visual Scrolling)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (occupiedTables.length === 0) {
            if (!notify.show) showToast("No active bills to select.", "info");
            return;
        }
        setUi(p => {
            const nextIndex = e.key === 'ArrowDown' 
                ? (p.highlightedIndex + 1) % occupiedTables.length
                : (p.highlightedIndex - 1 + occupiedTables.length) % occupiedTables.length;
            return { ...p, highlightedIndex: nextIndex };
        });
      }

      // ENTER KEY: Confirm Selection (Lock in Table)
      if (e.key === 'Enter') {
          e.preventDefault();
          if (ui.highlightedIndex >= 0 && ui.highlightedIndex < occupiedTables.length) {
             const tableToSelect = occupiedTables[ui.highlightedIndex].id;
             setUi(p => ({ ...p, selectedTableId: tableToSelect }));
          }
      }
    };
    document.addEventListener('keydown', kbd);
    return () => document.removeEventListener('keydown', kbd);
  }, [occupiedTables, ui.highlightedIndex, handlePrint, showToast, notify.show]);

  // --- 4. Fetch Bill Details (When SelectedTableId changes) ---
  useEffect(() => {
    if (!ui.selectedTableId) { setBillDetails(null); return; }
    
    const ord = state.orders.filter(o => o.tableId === ui.selectedTableId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
    if (!ord) { 
        // Only warn if we actually have a table selected but no order found (rare edge case)
        setBillDetails(null); 
        return; 
    }
    
    setBillDetails({
      order: ord,
      tableName: state.tables.find(t => t.id === ord.tableId)?.name || "N/A",
      staffName: state.staff.find(s => s.id === ord.staffId)?.name || "N/A",
      items: (ord.items || []).map(i => {
        const mi = state.menuItems.find(m => m.id === i.itemId);
        return { ...i, name: mi?.name || i.name, price: Number(mi?.price ?? i.price ?? 0) };
      })
    });
    setUi(p => ({ ...p, discount: 0 }));
  }, [ui.selectedTableId, state.orders, state.menuItems, state.staff, state.tables]);

  return (
    <div className="container mx-auto py-6 px-4 relative">
      {/* Toast Notification Component */}
      <Toast {...notify} onClose={() => setNotify(p => ({ ...p, show: false }))} />
      
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Billing</h1>
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
            <div className="flex space-x-2">
              <OptionBtn label="Dine-In (F3)" active={ui.orderType === 'Dine-In'} onClick={() => { setUi(p => ({...p, orderType: 'Dine-In'})); showToast("Dine-In Mode", "info"); }} color="blue" />
              <OptionBtn label="Takeaway (F4)" active={ui.orderType === 'Takeaway'} onClick={() => { setUi(p => ({...p, orderType: 'Takeaway'})); showToast("Takeaway Mode", "info"); }} color="blue" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
            <div className="flex space-x-2">
              <OptionBtn label="Cash (F7)" active={ui.paymentMode === 'Cash'} onClick={() => { setUi(p => ({...p, paymentMode: 'Cash'})); showToast("Cash Payment", "info"); }} color="green" />
              <OptionBtn label="Card (F8)" active={ui.paymentMode === 'Card'} onClick={() => { setUi(p => ({...p, paymentMode: 'Card'})); showToast("Card Payment", "info"); }} color="green" />
              <OptionBtn label="UPI (F9)" active={ui.paymentMode === 'UPI'} onClick={() => { setUi(p => ({...p, paymentMode: 'UPI'})); showToast("UPI Payment", "info"); }} color="green" />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <label htmlFor="table-select" className="block text-sm font-medium text-gray-700 mb-1">Select Occupied Table (Use ↑↓ & Enter)</label>
          <select 
            id="table-select"
            ref={tableSelectRef} 
            // CRITICAL: Value bound to Highlighted Index for Arrow Keys visual feedback
            value={occupiedTables[ui.highlightedIndex]?.id || ""} 
            onChange={(e) => {
                const newId = e.target.value;
                const newIndex = occupiedTables.findIndex(t => t.id === newId);
                // Mouse click updates BOTH visual highlight and selection immediately
                setUi(p => ({ ...p, highlightedIndex: newIndex, selectedTableId: newId }));
            }} 
            className="w-full md:w-1/2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            disabled={ui.loading}
          >
            <option value="">{ui.loading ? "Loading tables..." : "Select a Table"}</option>
            {occupiedTables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {billDetails && (
        <BillPanel 
            ref={billPanelRef} 
            details={{...billDetails, orderType: ui.orderType, paymentMode: ui.paymentMode}} 
            settings={state.settings} 
            discount={ui.discount}
            onDiscountChange={(e) => setUi(p => ({ ...p, discount: e.target.value }))} 
            onPrint={handlePrint} 
        />
      )}
    </div>
  );
};

export default Billing;