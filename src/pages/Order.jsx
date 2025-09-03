// src/pages/Order.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getMenuItems,
  getTables,
  getStaff,
  addOrder,
  updateTableStatus,
} from "../firebase/firebase";
import Modal from "../components/Modal";
import MenuItemCard from "../components/MenuItemCard";

const Order = () => {
  const [tables, setTables] = useState([]);
  const [staff, setStaff] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [tableData, staffData, menuData] = await Promise.all([
          getTables(),
          getStaff(),
          getMenuItems(),
        ]);

        if (!mounted) return;

        setTables(tableData || []);
        setStaff(staffData || []);
        setMenuItems(menuData || []);

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

    return () => {
      mounted = false;
    };
  }, [location.search]);

  const handleQuantityChange = (itemId, qty) => {
    setOrderItems((prev) => {
      const copy = { ...prev };
      if (!qty || qty <= 0) delete copy[itemId];
      else copy[itemId] = qty;
      return copy;
    });
  };

  const totalAmount = menuItems.reduce((acc, item) => {
    const qty = orderItems[item.id] || 0;
    return acc + (item.price || 0) * qty;
  }, 0);

  const handleSubmitOrder = async () => {
    if (!selectedTable) {
      alert("Please select a table before submitting the order.");
      setIsModalOpen(true);
      return;
    }

    if (Object.keys(orderItems).length === 0) {
      if (!confirm("You have no items in the order. Submit empty order?")) return;
    }

    setSubmitting(true);
    try {
      const items = Object.entries(orderItems).map(([itemId, quantity]) => ({
        itemId,
        quantity,
      }));

      const orderPayload = {
        tableId: selectedTable,
        staffId: selectedStaff || null,
        items,
        total: totalAmount,
        createdAt: new Date().toISOString(),
      };

      await addOrder(orderPayload);

      try {
        await updateTableStatus(selectedTable, "occupied");
      } catch (err) {
        console.error("Failed to update table status:", err);
      }

      window.dispatchEvent(new CustomEvent("tablesUpdated"));

      alert("Order submitted successfully!");
      setOrderItems({});
      setSelectedStaff("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error submitting order:", err);
      alert("Failed to submit order. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Place Order</h1>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4 text-gray-800">Select Table and Staff</h2>

        <label className="block text-sm font-medium mb-1">Table</label>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Table</option>
          {tables.map((t) => (
            <option key={t.id ?? t._id ?? t.name} value={t.id ?? t._id}>
              {t.name}
            </option>
          ))}
        </select>

        <label className="block text-sm font-medium mb-1">Staff (optional)</label>
        <select
          value={selectedStaff}
          onChange={(e) => setSelectedStaff(e.target.value)}
          className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Staff (Optional)</option>
          {staff.map((s) => (
            <option key={s.id ?? s._id} value={s.id ?? s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <div className="flex justify-end">
          <button
            onClick={() => setIsModalOpen(false)}
            disabled={!selectedTable}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !selectedTable ? "bg-gray-300 text-gray-600" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Done
          </button>
        </div>
      </Modal>

      {loading && <div className="text-gray-500 mb-4">Loading menu & data...</div>}

      {selectedTable ? (
        <div className="mb-4 p-4 bg-white rounded shadow flex items-center justify-between">
          <div>
            <div className="text-lg font-medium text-gray-800">
              {tables.find((t) => (t.id ?? t._id) === selectedTable)?.name || "Selected Table"}
            </div>
            <div className="text-sm text-gray-500">
              Staff:{" "}
              {staff.find((s) => (s.id ?? s._id) === selectedStaff)?.name || "Not assigned"}
            </div>
          </div>
          <div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-2 bg-gray-100 rounded border hover:bg-gray-200"
            >
              Change
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
        {menuItems.map((item) => (
          <MenuItemCard
            key={item.id ?? item._id}
            item={item}
            quantity={orderItems[item.id] || 0}
            onQuantityChange={(qty) => handleQuantityChange(item.id ?? item._id, qty)}
          />
        ))}
      </div>

      <div className="bg-white shadow rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-xl font-semibold text-gray-800">
          Total: ₹{totalAmount.toFixed(2)}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-2 rounded border hover:bg-gray-50"
          >
            Select Table / Staff
          </button>

          <button
            onClick={handleSubmitOrder}
            disabled={submitting || !selectedTable}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !selectedTable
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {submitting ? "Submitting..." : "Submit Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Order;