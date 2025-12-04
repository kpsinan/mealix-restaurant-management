// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  addTable,
  onTablesRealtime,
  deleteTable,
  addTablesInBulk,
  deleteTablesInBulk,
} from "../firebase/firebase";
import Modal from "../components/Modal";
import TableCard from "../components/TableCard";

const Home = () => {
  const [tables, setTables] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // State for selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTables, setSelectedTables] = useState(new Set());

  // State for the modal inputs
  const [addMode, setAddMode] = useState("single");
  const [tableName, setTableName] = useState("");
  const [tableCapacity, setTableCapacity] = useState(""); // New State for Capacity
  const [bulkTableInput, setBulkTableInput] = useState("");
  const [tablePrefix, setTablePrefix] = useState("T");

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
    if (isSelectionMode || !tableId) return;
    navigate(`/order?tableId=${encodeURIComponent(tableId)}`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAddMode("single");
    setTableName("");
    setTableCapacity(""); // Reset capacity
    setBulkTableInput("");
    setTablePrefix("T");
  };

  const handleEnterSelectionMode = (tableId) => {
    setIsSelectionMode(true);
    setSelectedTables((prev) => new Set(prev).add(tableId));
  };

  const handleTableClick = (tableId) => {
    if (!isSelectionMode) return;
    setSelectedTables((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tableId)) {
        newSet.delete(tableId);
      } else {
        newSet.add(tableId);
      }
      if (newSet.size === 0) {
        setIsSelectionMode(false);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedTables(new Set());
    setIsSelectionMode(false);
  };
  
  const handleDeleteSelected = async () => {
    if (selectedTables.size === 0) return;
    const isConfirmed = window.confirm(
      `Are you sure you want to delete ${selectedTables.size} selected table(s)? This action cannot be undone.`
    );
    if (isConfirmed) {
      try {
        await deleteTablesInBulk(Array.from(selectedTables));
        clearSelection();
      } catch (error) {
        console.error("Error deleting selected tables:", error);
        alert("Failed to delete the selected tables. Please try again.");
      }
    }
  };

  const handleAddTable = async () => {
    const name = tableName.trim();
    if (!name) return;
    if (tables.some((table) => table.name.toLowerCase() === name.toLowerCase())) {
      alert(`A table with the name "${name}" already exists.`);
      return;
    }
    
    // Parse Capacity
    let capacity = parseInt(tableCapacity);
    if (isNaN(capacity)) capacity = 0; // Default to 0 (Missing) if empty

    setIsSubmitting(true);
    try {
      await addTable(name, capacity);
      closeModal();
    } catch (err) {
      console.error("Error adding table:", err);
      alert("Failed to add table.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAddTables = async () => {
    const trimmedInput = bulkTableInput.trim();
    if (!trimmedInput) return;
    
    // Use the same capacity for all bulk tables if provided
    let capacity = parseInt(tableCapacity);
    if (isNaN(capacity)) capacity = 0;

    let initialNamesToCreate = [];
    const rangeMatch = trimmedInput.match(/^(\d+)-(\d+)$/);

    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);

      if (isNaN(start) || isNaN(end) || start > end) {
        alert("Invalid range.");
        return;
      }
      for (let i = start; i <= end; i++) {
        initialNamesToCreate.push(`${tablePrefix.trim()}${i}`);
      }
    } else {
      const commaSeparatedNames = trimmedInput.split(",").map((name) => name.trim()).filter(Boolean);
      initialNamesToCreate.push(...commaSeparatedNames);
    }

    if (initialNamesToCreate.length === 0) {
      alert("No valid table names found.");
      return;
    }

    const existingNames = new Set(tables.map((table) => table.name.toLowerCase()));
    const uniqueNewNames = [];

    initialNamesToCreate.forEach((name) => {
      if (!existingNames.has(name.toLowerCase())) {
        uniqueNewNames.push(name);
      }
    });

    if (uniqueNewNames.length === 0) {
      alert("All proposed tables already exist.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Pass capacity to bulk add function
      await addTablesInBulk(uniqueNewNames, capacity);
      closeModal();
    } catch (err) {
      console.error("Error adding tables in bulk:", err);
      alert("Failed to add tables in bulk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!tableId) return;
    const isConfirmed = window.confirm("Are you sure you want to delete this table? This action cannot be undone.");
    if (isConfirmed) {
      if (selectedTables.has(tableId)) {
        setSelectedTables((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tableId);
          if (newSet.size === 0) setIsSelectionMode(false);
          return newSet;
        });
      }
      try {
        await deleteTable(tableId);
      } catch (error) {
        console.error("Error deleting table:", error);
        alert("Failed to delete table.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-semibold text-gray-900">Tables</h1>
          <p className="text-gray-600 mt-2">
            {isSelectionMode ? `${selectedTables.size} table(s) selected` : "Manage all your restaurant tables from here."}
          </p>
        </header>

        {loading ? <div className="text-gray-500 mb-6">Loading tables...</div> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...tables]
            .sort((a, b) => {
              const numA = parseInt(a.name.replace(/\D/g, ""), 10) || Infinity;
              const numB = parseInt(b.name.replace(/\D/g, ""), 10) || Infinity;
              if (numA !== numB) return numA - numB;
              return a.name.localeCompare(b.name);
            })
            .map((table) => {
              const id = table.id ?? table.name;
              return (
                <TableCard
                  key={id}
                  table={table}
                  isSelected={selectedTables.has(id)}
                  isSelectionMode={isSelectionMode}
                  onClick={() => handleTableClick(id)}
                  onDoubleClick={() => openOrderFor(id)}
                  onEnterSelectionMode={() => handleEnterSelectionMode(id)}
                  onDelete={() => handleDeleteTable(id)}
                />
              );
            })}
          <TableCard isAddButton onClick={() => setIsModalOpen(true)} />
        </div>
      </div>
      
      {isSelectionMode && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white p-3 rounded-2xl shadow-lg border animate-fade-in-up">
          <button
            onClick={handleDeleteSelected}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-2 disabled:bg-red-300"
            disabled={selectedTables.size === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
            Delete
          </button>
          <button onClick={clearSelection} className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Table(s)</h2>
          
          {/* Mode Switcher */}
          <div className="flex border-b mb-4">
            <button onClick={() => setAddMode("single")} className={`px-4 py-2 text-sm font-medium ${addMode === "single" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
              Single
            </button>
            <button onClick={() => setAddMode("bulk")} className={`px-4 py-2 text-sm font-medium ${addMode === "bulk" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
              Bulk
            </button>
          </div>

          <div className="space-y-4">
            {addMode === "single" ? (
              <input type="text" value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="Enter table name (e.g. T1)" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" onKeyDown={(e) => e.key === "Enter" && handleAddTable()} />
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-2">Range (e.g. <code className="bg-gray-200 px-1 rounded">1-10</code>) or List (e.g. <code className="bg-gray-200 px-1 rounded">A1, B2</code>).</p>
                <div className="flex gap-2">
                  <input type="text" value={tablePrefix} onChange={(e) => setTablePrefix(e.target.value)} placeholder="Prefix" className="w-1/4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" value={bulkTableInput} onChange={(e) => setBulkTableInput(e.target.value)} placeholder="e.g. 1-10 or T1, B2" className="w-3/4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" onKeyDown={(e) => e.key === "Enter" && handleBulkAddTables()} />
                </div>
              </div>
            )}
            
            {/* Capacity Field - Available for both modes */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Seating Capacity (Optional)</label>
              <input 
                type="number" 
                min="0"
                value={tableCapacity} 
                onChange={(e) => setTableCapacity(e.target.value)} 
                placeholder="Ex: 4" 
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <p className="text-[10px] text-gray-400 mt-1">If left empty, Smart Assign will skip this table.</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={closeModal} className="px-4 py-2 rounded-lg border disabled:opacity-50" disabled={isSubmitting}>
              Cancel
            </button>
            <button onClick={addMode === "single" ? handleAddTable : handleBulkAddTables} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Done"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Home;