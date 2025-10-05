// src/pages/Billing.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getMenuItems,
  getStaff,
  getSettings,
  updateTableStatus,
  deleteOrder,
  onTablesRealtime,
  onOrdersRealtime,
  addSaleRecord,
} from "../firebase/firebase";
import BillPanel from "../components/BillPanel";
import thermalPrintCss from "../thermal-print.css?inline";

const Billing = () => {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [billDetails, setBillDetails] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderType, setOrderType] = useState('Dine-In');
  const [paymentMode, setPaymentMode] = useState('Cash');

  const tableSelectRef = useRef(null);
  const billPanelRef = useRef(null);

  const occupiedTables = tables.filter((table) => table.status === "occupied");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [menuItemsData, staffData, settingsData] = await Promise.all([
          getMenuItems(),
          getStaff(),
          getSettings(),
        ]);
        setMenuItems(menuItemsData || []);
        setStaff(staffData || []);
        setSettings(settingsData || {});
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError("Could not load necessary data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    tableSelectRef.current?.focus();
  }, []);
  
  const printUsingIframe = useCallback(() => {
    if (!billPanelRef.current) {
      alert("Nothing to print — make sure a table is selected and the bill is visible.");
      return;
    }

    const billHTML = billPanelRef.current.innerHTML || billPanelRef.current.outerHTML || "";

    const docHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1"/>
          <title>Receipt</title>
          <style>${thermalPrintCss}</style>
        </head>
        <body>
          <div class="receipt-print-container">
            <div class="receipt">
              ${billHTML}
            </div>
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(docHtml);
    iframeDoc.close();

    const doPrint = () => {
      const win = iframe.contentWindow;
      if (!win) return;
      try {
        win.focus();
        setTimeout(() => {
          try { win.print(); } catch (e) { console.error("Print error:", e); }
          setTimeout(() => {
            try { document.body.removeChild(iframe); } catch (e) {}
          }, 600);
        }, 250);
      } catch (e) {
        console.error("Print error:", e);
      }
    };

    if (iframe.contentWindow && iframe.contentDocument.readyState === "complete") {
      doPrint();
    } else {
      iframe.onload = doPrint;
      setTimeout(() => { if (document.body.contains(iframe)) doPrint(); }, 900);
    }
  }, [billPanelRef]);

  const handleFinalizeAndPrint = useCallback(async () => {
    if (!billDetails || !selectedTableId) {
      alert("Please select a table with a bill to finalize.");
      return;
    }

    printUsingIframe();

    try {
      const subTotal = billDetails.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const discountValue = Number(discount) || 0;
      const grandTotal = subTotal - discountValue;

      const saleData = {
        tableName: billDetails.tableName,
        staffName: billDetails.staffName,
        subTotal: subTotal,
        discount: discountValue,
        grandTotal: grandTotal,
        items: billDetails.items,
        originalOrderId: billDetails.order.id,
        orderType: orderType,
        paymentMode: paymentMode,
      };

      await addSaleRecord(saleData);
      await updateTableStatus(selectedTableId, "available");
      await deleteOrder(billDetails.order.id);

      alert(
        `Bill for table ${billDetails.tableName} (${orderType} / ${paymentMode}) has been processed and recorded.`
      );
      setBillDetails(null);
      setSelectedTableId("");
      setHighlightedIndex(-1);
      setDiscount(0);
      setOrderType('Dine-In');
      setPaymentMode('Cash');
      tableSelectRef.current?.focus();
    } catch (err) {
      console.error("Failed to finalize bill:", err);
      alert("An error occurred while finalizing the bill. Check console.");
    }
  }, [billDetails, selectedTableId, discount, orderType, paymentMode, printUsingIframe]);

  // Effect for all keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (billDetails) {
            handleFinalizeAndPrint();
        } else {
            alert("Please select a table first to finalize and print.");
        }
        return;
      }

      switch (e.key) {
        case 'F3': e.preventDefault(); setOrderType('Dine-In'); break;
        case 'F4': e.preventDefault(); setOrderType('Takeaway'); break;
        case 'F7': e.preventDefault(); setPaymentMode('Cash'); break;
        case 'F8': e.preventDefault(); setPaymentMode('Card'); break;
        case 'F9': e.preventDefault(); setPaymentMode('UPI'); break;
        
        case 'ArrowDown':
            e.preventDefault();
            if (occupiedTables.length > 0) {
                setHighlightedIndex(prev => (prev + 1) % occupiedTables.length);
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (occupiedTables.length > 0) {
                setHighlightedIndex(prev => (prev - 1 + occupiedTables.length) % occupiedTables.length);
            }
            break;
        case 'Enter':
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < occupiedTables.length) {
                setSelectedTableId(occupiedTables[highlightedIndex].id);
            }
            break;

        default: break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [occupiedTables, highlightedIndex, billDetails, handleFinalizeAndPrint]);

  useEffect(() => {
    const unsubscribe = onTablesRealtime(
      (tablesData) => {
        setTables(tablesData || []);
        setLoading(false);
      },
      (err) => {
        console.error("Tables real-time listener error:", err);
        setError("Failed to load table data. Please try again.");
        setLoading(false);
      }
    );
    return () => { try { unsubscribe(); } catch {} };
  }, []);

  useEffect(() => {
    const unsubscribe = onOrdersRealtime(
      (ordersData) => {
        setOrders(ordersData || []);
        setLoading(false);
      },
      (err) => {
        console.error("Orders real-time listener error:", err);
        setError("Failed to load order data. Please try again.");
        setLoading(false);
      }
    );
    return () => { try { unsubscribe(); } catch {} };
  }, []);

  useEffect(() => {
    if (!selectedTableId) {
      setBillDetails(null);
      return;
    }

    const tableOrders = orders
      .filter((o) => o.tableId === selectedTableId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (tableOrders.length === 0) {
      setError("No active orders found for this table.");
      setBillDetails(null);
      return;
    }

    const latestOrder = tableOrders[0];
    const enrichedItems = (latestOrder.items || []).map((orderItem) => {
      const menuItem = menuItems.find((mi) => mi.id === orderItem.itemId);
      return {
        ...orderItem,
        name: menuItem?.name || orderItem.name || "Unknown Item",
        price: Number(menuItem?.price ?? orderItem.price ?? 0),
      };
    });

    const tableName = tables.find((t) => t.id === latestOrder.tableId)?.name || "N/A";
    const staffName = staff.find((s) => s.id === latestOrder.staffId)?.name || "N/A";

    setBillDetails({
      order: latestOrder,
      items: enrichedItems,
      tableName,
      staffName,
    });
    setDiscount(0);
    setError("");
  }, [selectedTableId, orders, menuItems, staff, tables]);

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Billing</h1>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                <div className="flex space-x-2">
                    <button onClick={() => setOrderType('Dine-In')} className={`w-full transition-colors duration-200 px-4 py-2 rounded-lg text-sm font-semibold ${ orderType === 'Dine-In' ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 hover:bg-gray-300' }`}>Dine-In (F3)</button>
                    <button onClick={() => setOrderType('Takeaway')} className={`w-full transition-colors duration-200 px-4 py-2 rounded-lg text-sm font-semibold ${ orderType === 'Takeaway' ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 hover:bg-gray-300' }`}>Takeaway (F4)</button>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                <div className="flex space-x-2">
                    <button onClick={() => setPaymentMode('Cash')} className={`w-full transition-colors duration-200 px-4 py-2 rounded-lg text-sm font-semibold ${ paymentMode === 'Cash' ? 'bg-green-600 text-white shadow' : 'bg-gray-200 hover:bg-gray-300' }`}>Cash (F7)</button>
                    <button onClick={() => setPaymentMode('Card')} className={`w-full transition-colors duration-200 px-4 py-2 rounded-lg text-sm font-semibold ${ paymentMode === 'Card' ? 'bg-green-600 text-white shadow' : 'bg-gray-200 hover:bg-gray-300' }`}>Card (F8)</button>
                    <button onClick={() => setPaymentMode('UPI')} className={`w-full transition-colors duration-200 px-4 py-2 rounded-lg text-sm font-semibold ${ paymentMode === 'UPI' ? 'bg-green-600 text-white shadow' : 'bg-gray-200 hover:bg-gray-300' }`}>UPI (F9)</button>
                </div>
            </div>
        </div>

        <div className="mt-6 pt-6 border-t">
            <label htmlFor="table-select" className="block text-sm font-medium text-gray-700 mb-1">Select an Occupied Table (Use ↑↓ & Enter)</label>
            <select 
                id="table-select" 
                ref={tableSelectRef} 
                value={occupiedTables[highlightedIndex]?.id || ""} 
                onChange={(e) => {
                    const newId = e.target.value;
                    const newIndex = occupiedTables.findIndex(t => t.id === newId);
                    setHighlightedIndex(newIndex);
                    setSelectedTableId(newId);
                }} 
                className="w-full md:w-1/2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                disabled={loading}
            >
              <option value="">{loading ? "Loading tables..." : "Select a Table"}</option>
              {occupiedTables.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
        </div>
      </div>

      {error && <p className="text-red-500 text-center mb-4 no-print">{error}</p>}

      {billDetails && (
        <>
          <BillPanel
            ref={billPanelRef}
            details={{...billDetails, orderType, paymentMode}}
            settings={settings}
            discount={discount}
            onDiscountChange={(e) => setDiscount(e.target.value)}
            onPrint={handleFinalizeAndPrint}
          />
        </>
      )}
    </div>
  );
};

export default Billing;