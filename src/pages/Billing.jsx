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
  addSaleRecord, // <-- 1. IMPORT addSaleRecord
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
  const [billDetails, setBillDetails] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tableSelectRef = useRef(null);
  const billPanelRef = useRef(null);

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

  const buildEscPosPayload = (details, discountValue = 0) => {
    if (!details) return new Uint8Array();
    const ESC = 0x1b;
    const GS = 0x1d;
    const chunks = [];
    const push = (arr) => chunks.push(new Uint8Array(arr));
    const pushText = (txt) => {
      const enc = new TextEncoder();
      chunks.push(enc.encode(txt));
    };

    const restaurantName = settings?.restaurantName || "SyncServe";

    push([ESC, 0x40]); // Init
    push([ESC, 0x61, 0x01]); // Center
    push([ESC, 0x45, 0x01]); // Bold on
    pushText(`${details.tableName || "TABLE"}\n`);
    pushText(`${restaurantName}\n`);
    push([ESC, 0x45, 0x00]); // Bold off
    pushText(`Served by: ${details.staffName || "N/A"}\n`);
    pushText(`Order: ${details.order?.id || ""}\n`);
    pushText('\n');

    push([ESC, 0x61, 0x00]); // Left align
    pushText('No  ITEM                     QTY   RATE     AMT\n');
    push([ESC, 0x2d, 0x01]);
    pushText('---------------------------------------------\n');
    push([ESC, 0x2d, 0x00]);

    (details.items || []).forEach((it, i) => {
      const name = (it.name || 'Item').toString().slice(0, 20).padEnd(20, ' ');
      const qty = String(it.quantity ?? it.qty ?? 1).padStart(3, ' ');
      const rate = Number(it.price ?? 0).toFixed(2).padStart(8, ' ');
      const amt = (Number(it.price ?? 0) * Number(it.quantity ?? it.qty ?? 1)).toFixed(2).padStart(8, ' ');
      pushText(`${String(i + 1).padStart(2, ' ')}  ${name}${qty}${rate}${amt}\n`);
    });

    pushText('\n');
    const subtotal = (details.items || []).reduce((s, it) => s + (Number(it.price ?? 0) * Number(it.quantity ?? it.qty ?? 1)), 0);

    const isAdditive = typeof discountValue === "string" && discountValue.trim().startsWith("+");
    const parsedDiscount = parseFloat(discountValue) || 0;
    const disc = isAdditive ? -parsedDiscount : parsedDiscount;

    const total = subtotal - disc;

    pushText(`Sub Total:${String(subtotal.toFixed(2)).padStart(12, ' ')}\n`);
    if (disc !== 0) {
      pushText(`Discount:${String(disc.toFixed(2)).padStart(12, ' ')}\n`);
    }

    push([GS, 0x21, 0x11]);
    pushText(`TOTAL:${String(total.toFixed(2)).padStart(14, ' ')}\n`);
    push([GS, 0x21, 0x00]);

    pushText('\n');
    push([ESC, 0x61, 0x01]);
    pushText('Thank you for dining with us!\n');
    push([ESC, 0x61, 0x00]);

    push([GS, 0x56, 0x00]);

    const totalLen = chunks.reduce((p, c) => p + c.length, 0);
    const out = new Uint8Array(totalLen);
    let offset = 0;
    chunks.forEach((c) => { out.set(c, offset); offset += c.length; });
    return out;
  };

  const handleEscPosDownload = () => {
    if (!billDetails) {
      alert("Select a table and load a bill first");
      return;
    }
    try {
      const payload = buildEscPosPayload(billDetails, discount);
      const blob = new Blob([payload], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt_${String(billDetails.order?.id || "receipt")}.bin`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      alert("ESC/POS payload downloaded. Send this raw .bin to your printer service.");
    } catch (err) {
      console.error("Failed to generate ESC/POS payload", err);
      alert("Failed to create ESC/POS payload (see console).");
    }
  };

  const handleFinalizeAndPrint = async () => {
    if (!billDetails || !selectedTableId) {
      alert("Please select a table with a bill to finalize.");
      return;
    }

    printUsingIframe();

    // --- 2. UPDATED LOGIC FOR SALES REPORTING ---
    try {
      // Step 1: Create the sales record object from the bill details.
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
      };

      // Step 2: Save the sale record to Firestore.
      await addSaleRecord(saleData);

      // Step 3: Update table status and delete the original active order.
      await updateTableStatus(selectedTableId, "available");
      await deleteOrder(billDetails.order.id);

      // Step 4: Reset the UI.
      alert(
        `Bill for table ${billDetails.tableName} has been processed and recorded.`
      );
      setBillDetails(null);
      setSelectedTableId("");
      setDiscount(0);
    } catch (err) {
      console.error("Failed to finalize bill:", err);
      alert("An error occurred while finalizing the bill. Check console.");
    }
  };

  const occupiedTables = tables.filter((table) => table.status === "occupied");

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Billing</h1>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6 no-print">
        <label htmlFor="table-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select an Occupied Table
        </label>
        <select
          id="table-select"
          ref={tableSelectRef}
          value={selectedTableId}
          onChange={(e) => setSelectedTableId(e.target.value)}
          className="w-full md:w-1/2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="">{loading ? "Loading tables..." : "Select a Table"}</option>
          {occupiedTables.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-500 text-center mb-4 no-print">{error}</p>}

      {billDetails && (
        <>
          <BillPanel
            ref={billPanelRef}
            details={billDetails}
            settings={settings}
            discount={discount}
            onDiscountChange={(e) => setDiscount(e.target.value)}
            onPrint={handleFinalizeAndPrint}
          />

          <div className="mt-3 flex gap-2 items-center no-print">
            <button
              onClick={() => printUsingIframe()}
              className="px-3 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
            >
              Preview / Print (Browser)
            </button>

            <button
              onClick={handleEscPosDownload}
              className="px-3 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
            >
              Download ESC/POS Payload
            </button>

            <button
              onClick={handleFinalizeAndPrint}
              className="px-3 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
            >
              Finalize & Print
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Billing;