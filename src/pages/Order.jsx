// src/pages/Order.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getMenuItems,
  getTables,
  getStaff,
  addOrder,
  updateTableStatus,
  getSettings,
} from "../firebase/firebase";
import MenuItemCard from "../components/MenuItemCard";
import Modal from "../components/Modal";

// A reusable component for quantity control inside the new modal
const QuantityControl = ({ quantity, onDecrease, onIncrease }) => (
  <div className="flex items-center justify-center gap-2">
    <button onClick={onDecrease} className="w-8 h-8 rounded-full bg-gray-200 text-gray-800 font-bold text-lg hover:bg-gray-300 transition-colors disabled:opacity-50" disabled={quantity <= 0}>-</button>
    <span className="text-lg font-semibold w-10 text-center">{quantity}</span>
    <button onClick={onIncrease} className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-colors">+</button>
  </div>
);

const Order = () => {
  const [tables, setTables] = useState([]);
  const [staff, setStaff] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState({ currencySymbol: '₹' });

  // State for portion selection
  const [orderItems, setOrderItems] = useState({}); // New structure: { itemId: { full: qty, half: qty, quarter: qty } }
  const [isPortionModalOpen, setIsPortionModalOpen] = useState(false);
  const [selectedItemForPortion, setSelectedItemForPortion] = useState(null);

  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [tableData, staffData, menuData, currentSettings] = await Promise.all([
          getTables(), getStaff(), getMenuItems(), getSettings(),
        ]);
        if (!mounted) return;
        setTables(tableData || []);
        setStaff(staffData || []);
        setMenuItems(menuData || []);
        if (currentSettings) setSettings(currentSettings);

        const params = new URLSearchParams(location.search);
        const tableId = params.get("tableId");
        if (tableId) {
          setSelectedTable(tableId);
          setIsModalOpen(true);
        }
        if (staffData && staffData.length > 0 && !selectedStaff) {
          setSelectedStaff(staffData[0].id ?? staffData[0]._id ?? "");
        }
      } catch (err) {
        console.error("Error fetching order data:", err);
        alert("Failed to load order data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, [location.search]);

  // Handler to open the portion modal
  const handleCardClick = (item) => {
    setSelectedItemForPortion(item);
    setIsPortionModalOpen(true);
  };

  // Handler to manage quantities for each portion
  const handlePortionQuantityChange = (itemId, portion, change) => {
    setOrderItems((prev) => {
      const copy = { ...prev };
      if (!copy[itemId]) copy[itemId] = { full: 0, half: 0, quarter: 0 };
      const currentQty = copy[itemId][portion] || 0;
      copy[itemId][portion] = Math.max(0, currentQty + change);
      if (copy[itemId].full === 0 && copy[itemId].half === 0 && copy[itemId].quarter === 0) {
        delete copy[itemId];
      }
      return copy;
    });
  };

  // Updated total amount calculation
  const totalAmount = Object.keys(orderItems).reduce((acc, itemId) => {
    const portions = orderItems[itemId];
    const menuItem = menuItems.find(item => (item.id ?? item._id) === itemId);
    if (!menuItem) return acc;
    let itemTotal = 0;
    const fullPrice = menuItem.fullPrice ?? menuItem.price ?? 0;
    if (portions.full > 0) itemTotal += fullPrice * portions.full;
    if (portions.half > 0 && menuItem.halfPrice) itemTotal += menuItem.halfPrice * portions.half;
    if (portions.quarter > 0 && menuItem.quarterPrice) itemTotal += menuItem.quarterPrice * portions.quarter;
    return acc + itemTotal;
  }, 0);
  
  const getTotalQuantityForItem = (itemId) => {
    const portions = orderItems[itemId];
    if (!portions) return 0;
    return (portions.full || 0) + (portions.half || 0) + (portions.quarter || 0);
  };

  // Updated order submission logic
  const handleSubmitOrder = async () => {
    if (!selectedTable) {
      alert("Please select a table before submitting the order.");
      setIsModalOpen(true);
      return;
    }

    const items = Object.entries(orderItems).flatMap(([itemId, portions]) => {
      const menuItem = menuItems.find(item => (item.id ?? item._id) === itemId);
      if (!menuItem) return [];
      const portionEntries = [];
      const fullPrice = menuItem.fullPrice ?? menuItem.price ?? 0;
      if (portions.full > 0) portionEntries.push({ itemId, quantity: portions.full, portion: 'full', price: fullPrice });
      if (portions.half > 0 && menuItem.halfPrice) portionEntries.push({ itemId, quantity: portions.half, portion: 'half', price: menuItem.halfPrice });
      if (portions.quarter > 0 && menuItem.quarterPrice) portionEntries.push({ itemId, quantity: portions.quarter, portion: 'quarter', price: menuItem.quarterPrice });
      return portionEntries;
    });

    if (items.length === 0) {
      if (!confirm("You have no items in the order. Submit empty order?")) return;
    }

    setSubmitting(true);
    try {
      await addOrder({
        tableId: selectedTable,
        staffId: selectedStaff || null,
        items,
        total: totalAmount,
        createdAt: new Date().toISOString(),
      });
      await updateTableStatus(selectedTable, "occupied");
      window.dispatchEvent(new CustomEvent("tablesUpdated"));
      alert("Order submitted successfully!");
      setOrderItems({});
    } catch (err) {
      console.error("Error submitting order:", err);
      alert("Failed to submit order. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const itemPortions = selectedItemForPortion ? orderItems[selectedItemForPortion.id ?? selectedItemForPortion._id] : null;

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Place Order</h1>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4 text-gray-800">Select Table and Staff</h2>
        <label className="block text-sm font-medium mb-1">Table</label>
        <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select Table</option>
          {tables.map((t) => <option key={t.id ?? t._id} value={t.id ?? t._id}>{t.name}</option>)}
        </select>
        <label className="block text-sm font-medium mb-1">Staff (optional)</label>
        <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select Staff (Optional)</option>
          {staff.map((s) => <option key={s.id ?? s._id} value={s.id ?? s._id}>{s.name}</option>)}
        </select>
        <div className="flex justify-end">
          <button onClick={() => setIsModalOpen(false)} disabled={!selectedTable} className={`px-4 py-2 rounded-lg transition-colors ${!selectedTable ? "bg-gray-300 text-gray-600" : "bg-blue-600 text-white hover:bg-blue-700"}`}>Done</button>
        </div>
      </Modal>

      {/* Portion Selection Modal */}
      {selectedItemForPortion && (
        <Modal isOpen={isPortionModalOpen} onClose={() => setIsPortionModalOpen(false)}>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{selectedItemForPortion.name}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
              <div>
                <p className="font-semibold text-lg">Full</p>
                <p className="text-gray-600">{settings.currencySymbol}{(selectedItemForPortion.fullPrice ?? selectedItemForPortion.price).toFixed(2)}</p>
              </div>
              <QuantityControl quantity={itemPortions?.full || 0} onDecrease={() => handlePortionQuantityChange(selectedItemForPortion.id ?? selectedItemForPortion._id, 'full', -1)} onIncrease={() => handlePortionQuantityChange(selectedItemForPortion.id ?? selectedItemForPortion._id, 'full', 1)} />
            </div>
            {selectedItemForPortion.halfPrice != null && (
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div><p className="font-semibold text-lg">Half</p><p className="text-gray-600">{settings.currencySymbol}{selectedItemForPortion.halfPrice.toFixed(2)}</p></div>
                <QuantityControl quantity={itemPortions?.half || 0} onDecrease={() => handlePortionQuantityChange(selectedItemForPortion.id ?? selectedItemForPortion._id, 'half', -1)} onIncrease={() => handlePortionQuantityChange(selectedItemForPortion.id ?? selectedItemForPortion._id, 'half', 1)} />
              </div>
            )}
            {selectedItemForPortion.quarterPrice != null && (
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div><p className="font-semibold text-lg">Quarter</p><p className="text-gray-600">{settings.currencySymbol}{selectedItemForPortion.quarterPrice.toFixed(2)}</p></div>
                <QuantityControl quantity={itemPortions?.quarter || 0} onDecrease={() => handlePortionQuantityChange(selectedItemForPortion.id ?? selectedItemForPortion._id, 'quarter', -1)} onIncrease={() => handlePortionQuantityChange(selectedItemForPortion.id ?? selectedItemForPortion._id, 'quarter', 1)} />
              </div>
            )}
          </div>
          <div className="flex justify-end mt-6"><button onClick={() => setIsPortionModalOpen(false)} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">Done</button></div>
        </Modal>
      )}

      {loading && <div className="text-gray-500 mb-4 text-center">Loading menu & data...</div>}

      {selectedTable && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow flex items-center justify-between">
          <div>
            <div className="text-lg font-medium text-gray-800">{tables.find((t) => (t.id ?? t._id) === selectedTable)?.name || "Selected Table"}</div>
            <div className="text-sm text-gray-500">Staff: {staff.find((s) => (s.id ?? s._id) === selectedStaff)?.name || "Not assigned"}</div>
          </div>
          <div><button onClick={() => setIsModalOpen(true)} className="px-3 py-2 bg-gray-100 rounded border hover:bg-gray-200">Change</button></div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 mb-6">
        {menuItems.map((item) => (
          <MenuItemCard
            key={item.id ?? item._id}
            item={item}
            currencySymbol={settings.currencySymbol}
            quantity={getTotalQuantityForItem(item.id ?? item._id)}
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      <div className="sticky bottom-0 bg-white shadow-lg rounded-t-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t">
        <div className="text-xl font-semibold text-gray-800">Total: {settings.currencySymbol}{totalAmount.toFixed(2)}</div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsModalOpen(true)} className="px-3 py-2 rounded border hover:bg-gray-50 text-sm font-medium">Table/Staff</button>
          <button onClick={handleSubmitOrder} disabled={submitting || !selectedTable} className={`px-6 py-2 rounded-lg transition-colors font-semibold ${!selectedTable ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"}`}>
            {submitting ? "Submitting..." : "Submit Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Order;