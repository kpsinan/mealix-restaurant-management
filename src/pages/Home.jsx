// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addTable, onTablesRealtime, deleteTable } from "../firebase/firebase"; // Assuming deleteTable is exported
import Modal from "../components/Modal";
import TableCard from "../components/TableCard";

const Home = () => {
  const [tables, setTables] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableName, setTableName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onTablesRealtime(
      (tablesData) => {
        setTables(tablesData || []);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching tables in real-time:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const openOrderFor = (tableId) => {
    if (!tableId) return;
    navigate(`/order?tableId=${encodeURIComponent(tableId)}`);
  };

  const handleAddTable = async () => {
    const name = tableName.trim();
    if (!name) return;
    try {
      await addTable(name);
      setTableName("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error adding table:", err);
      alert("Failed to add table.");
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!tableId) return;

    const isConfirmed = window.confirm(
      "Are you sure you want to delete this table? This action cannot be undone."
    );

    if (isConfirmed) {
      try {
        await deleteTable(tableId); // Assumes deleteTable function exists in firebase.js
        // UI will update automatically via the real-time listener
      } catch (error) {
        console.error("Error deleting table:", error);
        alert("Failed to delete table. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-semibold text-gray-900">Tables</h1>
          <p className="text-gray-600 mt-2">
            Manage all your restaurant tables from here.
          </p>
        </header>

        {loading ? (
          <div className="text-gray-500 mb-6">Loading tables...</div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...tables]
            .sort((a, b) => {
              const numA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
              const numB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
              return numA - numB;
            })
            .map((table) => {
              const id = table.id ?? table._id ?? table.name;
              return (
                <TableCard
                  key={id}
                  table={table}
                  onDoubleClick={() => openOrderFor(table.id ?? table._id)}
                  onLongPress={() => openOrderFor(table.id ?? table._id)}
                  onDelete={() => handleDeleteTable(table.id ?? table._id)}
                />
              );
            })}

          <TableCard isAddButton onClick={() => setIsModalOpen(true)} />
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Add New Table
          </h2>
          <input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="Enter table name (e.g. T1)"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddTable();
            }}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTableName("");
                setIsModalOpen(false);
              }}
              className="px-4 py-2 rounded-lg border"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTable}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Home;