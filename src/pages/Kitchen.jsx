// src/pages/Kitchen.jsx
import React, { useState, useEffect } from "react";
import { onOrdersRealtime, getTables, getMenuItems } from "../firebase/firebase";

const Kitchen = () => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    // 1️⃣ Fetch static data: tables and menu items
    const fetchStaticData = async () => {
      try {
        const [tableData, menuData] = await Promise.all([getTables(), getMenuItems()]);
        setTables(tableData || []);
        setMenuItems(menuData || []);
      } catch (err) {
        console.error("Error fetching tables or menu items:", err);
      }
    };
    fetchStaticData();

    // 2️⃣ Set up real-time listener for orders
    const unsubscribe = onOrdersRealtime(
      (liveOrders) => {
        // Ensure newest orders appear first
        const sortedOrders = liveOrders
          .map((o) => ({ ...o, createdAt: new Date(o.createdAt) })) // convert string to Date
          .sort((a, b) => b.createdAt - a.createdAt);

        setOrders(sortedOrders);
      },
      (err) => console.error("Realtime orders error:", err)
    );

    // 3️⃣ Clean up listener on unmount
    return () => unsubscribe();
  }, []);

  // Helpers to get names
  const getTableName = (tableId) => {
    const table = tables.find((t) => (t.id ?? t._id) === tableId);
    return table ? table.name : "Unknown";
  };

  const getItemName = (itemId) => {
    const item = menuItems.find((i) => (i.id ?? i._id) === itemId);
    return item ? item.name : "Unknown";
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Kitchen Orders</h1>

      {orders.length === 0 ? (
        <p className="text-gray-600">No orders currently.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Table: {getTableName(order.tableId)}
              </h3>
              <ul className="text-gray-600 mb-2">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {getItemName(item.itemId)} x {item.quantity}
                  </li>
                ))}
              </ul>
              <p className="text-gray-800 font-semibold">
                Total: ₹{order.total.toFixed(2)}
              </p>
              {order.staffId && (
                <p className="text-sm text-gray-500">Staff ID: {order.staffId}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Kitchen;
