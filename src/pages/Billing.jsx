// src/pages/Billing.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getMenuItems,
  getStaff,
  updateTableStatus,
  deleteOrder,
  onTablesRealtime,
  onOrdersRealtime,
} from "../firebase/firebase";
import BillPanel from "../components/BillPanel";
import "../thermal-print.css"; // ensure on-screen preview uses the same styles

const Billing = () => {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [billDetails, setBillDetails] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tableSelectRef = useRef(null);
  const billPanelRef = useRef(null);

  // Initial fetch for menuItems and staff
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [menuItemsData, staffData] = await Promise.all([
          getMenuItems(),
          getStaff(),
        ]);
        setMenuItems(menuItemsData || []);
        setStaff(staffData || []);
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

  // Real-time listener for tables
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

    return () => {
      try { unsubscribe(); } catch {}
    };
  }, []);

  // Real-time listener for orders
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

    return () => {
      try { unsubscribe(); } catch {}
    };
  }, []);

  // Update bill details when selected table changes
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

    const tableName =
      tables.find((t) => t.id === latestOrder.tableId)?.name || "N/A";
    const staffName =
      staff.find((s) => s.id === latestOrder.staffId)?.name || "N/A";

    setBillDetails({
      order: latestOrder,
      items: enrichedItems,
      tableName,
      staffName,
    });
    setDiscount(0);
    setError("");
  }, [selectedTableId, orders, menuItems, staff, tables]);

  // Print using an iframe that links to the external thermal CSS
  const printUsingIframe = useCallback(() => {
    if (!billPanelRef.current) {
      alert("Nothing to print — make sure a table is selected and the bill is visible.");
      return;
    }

    const billHTML = billPanelRef.current.innerHTML || billPanelRef.current.outerHTML || "";
    // NOTE: We use a link to /thermal-print.css so your dedicated CSS is applied inside the iframe.
    // Ensure that file is served at /thermal-print.css (copy to public/thermal-print.css if needed).
    const docHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1"/>
          <title>Receipt</title>
          <link rel="stylesheet" href="/thermal-print.css" />
        </head>
        <body>
          <div class="print-container">
            <div class="bill-panel-print receipt">
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

  // Build ESC/POS raw payload bytes (Uint8Array)
  const buildEscPosPayload = (details, discountValue = 0) => {
    if (!details) return new Uint8Array();
    const ESC = 0x1b;
    const GS = 0x1d;
    const chunks = [];
    const push = (arr) => chunks.push(new Uint8Array(arr));
    const pushText = (txt) => {
      const enc = new TextEncoder(); // UTF-8; change to CP437 / server-side if needed
      chunks.push(enc.encode(txt));
    };

    // Init
    push([ESC, 0x40]); // ESC @

    // Centered bold header
    push([ESC, 0x61, 0x01]); // center
    push([ESC, 0x45, 0x01]); // bold on
    pushText(`${details.tableName || "TABLE"}\n`);
    pushText(`SyncServe\n`);
    push([ESC, 0x45, 0x00]); // bold off
    pushText(`Served by: ${details.staffName || "N/A"}\n`);
    pushText(`Order: ${details.order?.id || ""}\n`);
    push([ESC, 0x61, 0x00]); // left

    pushText('\n');
    pushText('No  ITEM                     QTY   RATE     AMT\n');
    push([ESC, 0x2d, 0x01]); // underline on
    pushText('---------------------------------------------\n');
    push([ESC, 0x2d, 0x00]); // underline off

    (details.items || []).forEach((it, i) => {
      const name = (it.name || 'Item').toString().slice(0, 20).padEnd(20, ' ');
      const qty = String(it.quantity ?? it.qty ?? 1).padStart(3, ' ');
      const rate = Number(it.price ?? 0).toFixed(2).padStart(8, ' ');
      const amt = (Number(it.price ?? 0) * Number(it.quantity ?? it.qty ?? 1)).toFixed(2).padStart(8, ' ');
      pushText(`${String(i + 1).padStart(2, ' ')}  ${name}${qty}${rate}${amt}\n`);
    });

    pushText('\n');
    const subtotal = (details.items || []).reduce((s, it) => s + (Number(it.price ?? 0) * Number(it.quantity ?? it.qty ?? 1)), 0);
    const disc = Number(discountValue || 0);
    const total = subtotal - disc;

    pushText(`Sub Total:${String(subtotal.toFixed(2)).padStart(12, ' ')}\n`);
    if (disc > 0) pushText(`Discount:${String(disc.toFixed(2)).padStart(12, ' ')}\n`);

    push([GS, 0x21, 0x11]); // double size
    pushText(`TOTAL:${String(total.toFixed(2)).padStart(14, ' ')}\n`);
    push([GS, 0x21, 0x00]); // reset

    pushText('\n');
    push([ESC, 0x61, 0x01]); // center
    pushText('Thank you for dining with us!\n');
    push([ESC, 0x61, 0x00]); // left

    // Feed and cut (many printers support)
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

    // Browser print preview and print
    printUsingIframe();

    try {
      await updateTableStatus(selectedTableId, "available");
      await deleteOrder(billDetails.order.id);
      console.log(`Finalized bill for table ${selectedTableId}. Table set to available, order deleted.`);
      alert(`Bill for table ${billDetails.tableName} has been processed.`);
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
            discount={discount}
            onDiscountChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
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
