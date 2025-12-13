// src/pages/Home.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Assuming react-router is available

// --- ORIGINAL FIREBASE IMPORTS RESTORED ---
import {
  addTable,
  onTablesRealtime,
  deleteTable,
  deleteTablesInBulk,
} from "../firebase/firebase";

// --- ORIGINAL COMPONENT IMPORTS RESTORED ---
import Modal from "../components/Modal";
import TableCard from "../components/TableCard";


// --- HOME COMPONENT (ORIGINAL LOGIC) ---
const Home = () => {
  const [tables, setTables] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'available', 'occupied'

  // Restoring to original useNavigate import for navigation
  const navigate = useNavigate();

  // State for selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTables, setSelectedTables] = useState(new Set());

  // State for the modal inputs
  const [addMode, setAddMode] = useState("single");
  const [tableName, setTableName] = useState("");
  const [tableCapacity, setTableCapacity] = useState(""); 
  
  // Bulk Mode States
  const [bulkTableInput, setBulkTableInput] = useState("");
  const [tablePrefix, setTablePrefix] = useState("T");
  const [bulkStage, setBulkStage] = useState("setup"); // 'setup' | 'review'
  const [pendingBulkTables, setPendingBulkTables] = useState([]); // Array of { name, capacity }

  // --- REALTIME DATA FETCH ---
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onTablesRealtime(
      (tablesData) => {
        // Ensure data is an array
        const safeData = Array.isArray(tablesData) ? tablesData : [];
        setTables(safeData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching tables in real-time:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // --- DERIVED STATS ---
  const stats = useMemo(() => {
    const total = tables.length;
    const available = tables.filter(t => t.status === "available").length;
    const occupied = tables.filter(t => t.status === "occupied").length;
    return { total, available, occupied };
  }, [tables]);

  // --- FILTERING & SORTING ---
  const filteredTables = useMemo(() => {
    return tables
      .filter((t) => {
        // Filter by Status
        if (filterStatus !== "all" && t.status !== filterStatus) return false;
        // Filter by Search
        if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        // Natural Sort (T1, T2, T10 instead of T1, T10, T2)
        const numA = parseInt(a.name.replace(/\D/g, ""), 10) || Infinity;
        const numB = parseInt(b.name.replace(/\D/g, ""), 10) || Infinity;
        if (numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name);
      });
  }, [tables, filterStatus, searchQuery]);

  // --- HANDLERS ---

  const openOrderFor = (tableId) => {
    if (isSelectionMode || !tableId) return;
    navigate(`/order?tableId=${encodeURIComponent(tableId)}`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAddMode("single");
    setTableName("");
    setTableCapacity("");
    // Reset Bulk States
    setBulkTableInput("");
    setTablePrefix("T");
    setBulkStage("setup");
    setPendingBulkTables([]);
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
  
  // Custom modal for confirmation instead of window.confirm
  const handleDeleteSelected = async () => {
    if (selectedTables.size === 0) return;
    
    // Using window.confirm as it was in the original context (before the mock fix)
    if (!window.confirm(`Are you sure you want to delete ${selectedTables.size} selected table(s)? This action cannot be undone.`)) {
        return;
    }

    try {
        await deleteTablesInBulk(Array.from(selectedTables));
        clearSelection();
    } catch (error) {
        console.error("Error deleting selected tables:", error);
        // Using window.alert as it was in the original context (before the mock fix)
        window.alert("Failed to delete the selected tables. Please try again.");
    }
  };

  // --- SINGLE TABLE ADD ---
  const handleAddSingleTable = async () => {
    const name = tableName.trim();
    if (!name) return;
    
    // Check for existing name
    if (tables.some((table) => table.name.toLowerCase() === name.toLowerCase())) {
      // Using window.alert as it was in the original context (before the mock fix)
      window.alert(`A table with the name "${name}" already exists.`);
      return;
    }
    
    let capacity = parseInt(tableCapacity);
    if (isNaN(capacity) || capacity < 1) capacity = 4; // Default to 4 if empty or invalid capacity for single add

    setIsSubmitting(true);
    try {
      await addTable(name, capacity);
      closeModal();
    } catch (err) {
      console.error("Error adding table:", err);
      // Using window.alert as it was in the original context (before the mock fix)
      window.alert("Failed to add table.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- BULK TABLE GENERATION (Step 1) ---
  const handleGeneratePreview = () => {
    const trimmedInput = bulkTableInput.trim();
    if (!trimmedInput) return;

    // Default capacity for the batch
    const defaultCap = 4; 

    let namesToCreate = [];
    const rangeMatch = trimmedInput.match(/^(\d+)-(\d+)$/);

    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);

      if (isNaN(start) || isNaN(end) || start > end) {
        // Using window.alert as it was in the original context (before the mock fix)
        window.alert("Invalid range format. Use '1-10'.");
        return;
      }
      
      const count = end - start + 1;
      if (count > 100) {
        // Using window.confirm as it was in the original context (before the mock fix)
        if (!window.confirm(`You are about to generate ${count} tables. Continue?`)) return;
      }

      for (let i = start; i <= end; i++) {
        namesToCreate.push(`${tablePrefix.trim()}${i}`);
      }
    } else {
      const commaSeparatedNames = trimmedInput.split(",").map((name) => name.trim()).filter(Boolean);
      namesToCreate.push(...commaSeparatedNames);
    }

    if (namesToCreate.length === 0) {
      // Using window.alert as it was in the original context (before the mock fix)
      window.alert("No valid table names found.");
      return;
    }

    const existingNames = new Set(tables.map((t) => t.name.toLowerCase()));
    const newTables = [];
    
    namesToCreate.forEach(name => {
      if (!existingNames.has(name.toLowerCase())) {
        newTables.push({ name: name, capacity: defaultCap });
      }
    });

    if (newTables.length === 0) {
      // Using window.alert as it was in the original context (before the mock fix)
      window.alert("All specified tables already exist.");
      return;
    }

    setPendingBulkTables(newTables);
    setBulkStage("review");
  };

  // --- BULK TABLE CAPACITY CHANGE (Step 2) ---
  const updatePendingCapacity = (index, newCap) => {
    const updated = [...pendingBulkTables];
    // Ensure capacity is a non-negative integer
    const parsedCap = parseInt(newCap);
    updated[index].capacity = (isNaN(parsedCap) || parsedCap < 0) ? 0 : parsedCap;
    setPendingBulkTables(updated);
  };

  // --- BULK TABLE SUBMIT (Step 3) ---
  const handleBulkSubmitFinal = async () => {
    setIsSubmitting(true);
    // Filter out tables with zero or invalid capacity before submission
    const tablesToSubmit = pendingBulkTables.filter(t => t.capacity > 0);
    
    if (tablesToSubmit.length === 0) {
        // Using window.alert as it was in the original context (before the mock fix)
        window.alert("No tables with valid capacity (greater than 0) to add.");
        setIsSubmitting(false);
        return;
    }
    
    try {
      const promises = tablesToSubmit.map(t => addTable(t.name, t.capacity));
      await Promise.all(promises);
      closeModal();
    } catch (err) {
      console.error("Error adding bulk tables:", err);
      // Using window.alert as it was in the original context (before the mock fix)
      window.alert("Failed to add some tables.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!tableId) return;
    
    // Using window.confirm as it was in the original context (before the mock fix)
    if (!window.confirm("Are you sure you want to delete this table? This action cannot be undone.")) {
        return;
    }
    
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
        // Using window.alert as it was in the original context (before the mock fix)
        window.alert("Failed to delete table.");
    }
  };
  
  // Custom Scrollbar for better review UX on smaller screens
  const CustomScrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
    /* Add basic animation for selection banner */
    @keyframes fadeInDown {
      0% { opacity: 0; transform: translateY(-10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
      animation: fadeInDown 0.3s ease-out;
    }
  `;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      {/* Add Custom CSS Styles */}
      <style>{CustomScrollbarStyles}</style>

      {/* Use a maximum width but allow it to be fluid */}
      <div className="max-w-7xl w-full mx-auto space-y-6 md:space-y-8">
        
        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Floor Plan</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage tables and live status</p>
          </div>
          <div className="flex items-center gap-3">
             {/* Add Table Button - Larger on desktop, but perfectly sized for mobile */}
             <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-[#10B981] text-white px-4 py-2.5 sm:px-6 rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-[#059669] active:scale-[0.98] transition-all duration-150 ease-in-out"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
               </svg>
               <span className="hidden sm:inline">Add New Table</span>
               <span className="sm:hidden">Add Table</span>
             </button>
          </div>
        </div>

        {/* --- STATS DASHBOARD --- */}
        {/* CHANGED: grid-cols-1 for mobile (stack vertically), sm:grid-cols-3 for tablet/desktop (side-by-side) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Total Tables Card - Removed col-span-2 to allow standard stacking/grid behavior */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Tables</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-xl text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
          </div>
          {/* Available Tables Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Available</p>
              <p className="text-3xl font-bold text-[#10B981]">{stats.available}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-[#10B981]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          {/* Occupied Tables Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Occupied</p>
              <p className="text-3xl font-bold text-red-500">{stats.occupied}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* --- CONTROLS & GRID --- */}
        <div className="space-y-4 md:space-y-6">
          
          {/* Controls Bar - Optimized for stacking on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
            {/* Filter Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-xl w-full sm:w-auto flex-wrap sm:flex-nowrap">
              {['all', 'available', 'occupied'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex-1 sm:flex-auto px-3 md:px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200 whitespace-nowrap m-0.5 ${
                    filterStatus === status 
                      ? "bg-white text-gray-800 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 md:w-72 lg:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:border-gray-300 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-[#10B981] transition-colors"
              />
            </div>
          </div>

          {/* Selection Banner */}
          {isSelectionMode && (
            <div className="bg-[#10B981] bg-opacity-10 border border-[#10B981] p-3 sm:p-4 rounded-xl flex flex-wrap items-center justify-between animate-fade-in-up">
              <div className="flex items-center gap-3 py-1">
                <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#10B981] text-white font-bold text-xs sm:text-sm">
                  {selectedTables.size}
                </span>
                <span className="font-medium text-[#065F46] text-sm sm:text-base">
                    {selectedTables.size} Table{selectedTables.size !== 1 ? 's' : ''} Selected
                </span>
              </div>
              <div className="flex gap-2 sm:gap-3 py-1">
                <button 
                  onClick={clearSelection}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-white/50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteSelected}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Tables Grid */}
          {loading ? (
             <div className="text-center py-20 text-gray-400">Loading tables...</div>
          ) : filteredTables.length === 0 ? (
             <div className="text-center py-20 px-4 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
               <p className="text-lg">
                 {searchQuery ? "No tables match your search criteria." : "No tables found. Click 'Add Table' to get started!"}
               </p>
             </div>
          ) : (
            /* Optimized grid structure for all screen sizes - Changed to 1 column on mobile (grid-cols-1) */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {filteredTables.map((table) => {
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
              {/* Add Button Card at the end of grid for easy access */}
              <TableCard isAddButton onClick={() => setIsModalOpen(true)} />
            </div>
          )}
        </div>
      </div>

      {/* --- ADD TABLE MODAL --- */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="p-5 sm:p-6 w-full">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Add Table(s)</h2>
          <p className="text-sm text-gray-500 mb-6">Create new seating areas for your floor plan.</p>
          
          {/* Mode Switcher */}
          <div className="flex border-b mb-6">
            <button 
              onClick={() => { setAddMode("single"); setBulkStage("setup"); }} 
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
                 addMode === "single" ? "text-[#10B981]" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Single Table
              {addMode === "single" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#10B981] rounded-t-full"></div>}
            </button>
            <button 
              onClick={() => setAddMode("bulk")} 
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
                 addMode === "bulk" ? "text-[#10B981]" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Bulk Add
              {addMode === "bulk" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#10B981] rounded-t-full"></div>}
            </button>
          </div>

          <div className="space-y-5">
            
            {/* --- SINGLE MODE --- */}
            {addMode === "single" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Table Name</label>
                  <input 
                    type="text" 
                    value={tableName} 
                    onChange={(e) => setTableName(e.target.value)} 
                    placeholder="e.g. T1, A10" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white transition-all text-base sm:text-sm" 
                    onKeyDown={(e) => e.key === "Enter" && handleAddSingleTable()} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Seating Capacity</label>
                  <input 
                    type="number" 
                    min="1"
                    value={tableCapacity} 
                    onChange={(e) => setTableCapacity(e.target.value)} 
                    placeholder="Default: 4" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white transition-all text-base sm:text-sm" 
                  />
                </div>
              </>
            )}

            {/* --- BULK MODE --- */}
            {addMode === "bulk" && (
              <>
                {/* STAGE 1: SETUP */}
                {bulkStage === "setup" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-sm text-blue-800 font-medium mb-1">How to use Bulk Add:</p>
                      <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                        <li>Use ranges like <b>1-10</b> (creates T1, T2... T10).</li>
                        <li>Or use a list like <b>A1, B2, C3</b>.</li>
                      </ul>
                    </div>
                    {/* Adjusted layout for better mobile flow: prefix is 1/4, range is 3/4 */}
                    <div className="flex gap-3">
                      <div className="w-1/4">
                         <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Prefix</label>
                         <input 
                            type="text" 
                            value={tablePrefix} 
                            onChange={(e) => setTablePrefix(e.target.value)} 
                            placeholder="T" 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10B981] text-base sm:text-sm" 
                         />
                      </div>
                      <div className="w-3/4">
                         <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Range / List</label>
                         <input 
                            type="text" 
                            value={bulkTableInput} 
                            onChange={(e) => setBulkTableInput(e.target.value)} 
                            placeholder="1-10 or A, B, C" 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#10B981] text-base sm:text-sm" 
                            onKeyDown={(e) => e.key === "Enter" && handleGeneratePreview()} 
                         />
                      </div>
                    </div>
                  </div>
                )}

                {/* STAGE 2: REVIEW */}
                {bulkStage === "review" && (
                  <div className="flex flex-col h-72">
                    <div className="flex justify-between items-center mb-2 border-b pb-2 px-1">
                      <span className="text-xs font-bold text-gray-400 uppercase">Table Name</span>
                      <span className="text-xs font-bold text-gray-400 uppercase mr-1 sm:mr-4">Capacity</span>
                    </div>
                    {/* Added custom-scrollbar for smooth scrolling on review list */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 sm:pr-2 custom-scrollbar">
                      {pendingBulkTables.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors">
                          <span className="font-bold text-gray-700 truncate max-w-[60%]">{t.name}</span>
                          <input 
                            type="number" 
                            min="1"
                            value={t.capacity}
                            onChange={(e) => updatePendingCapacity(idx, e.target.value)}
                            className="w-16 sm:w-20 px-2 py-1.5 bg-white border rounded-md text-center focus:ring-2 focus:ring-[#10B981] focus:outline-none text-base sm:text-sm font-medium"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="text-center pt-4">
                      <span className="text-xs font-medium px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                        Adding {pendingBulkTables.length} tables
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
            <button 
              onClick={closeModal} 
              className="px-4 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            {addMode === "single" && (
              <button onClick={handleAddSingleTable} className="bg-[#10B981] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#059669] transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Table"}
              </button>
            )}

            {addMode === "bulk" && bulkStage === "setup" && (
              <button onClick={handleGeneratePreview} className="bg-[#10B981] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#059669] transition-all">
                Preview List
              </button>
            )}

            {addMode === "bulk" && bulkStage === "review" && (
              <>
                <button onClick={() => setBulkStage("setup")} className="px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                  Back
                </button>
                <button onClick={handleBulkSubmitFinal} className="bg-[#10B981] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#059669] transition-all disabled:opacity-50" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : `Confirm (${pendingBulkTables.length})`}
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Home;