// src/pages/Menu.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  addMenuItem,
  onMenuItemsRealtime,
  deleteMenuItemsInBulk,
} from "../firebase/firebase";
import Modal from "../components/Modal";
import MenuItemCard from "../components/MenuItemCard"; // Ensure this path is correct

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAddNewBulkModalOpen, setIsAddNewBulkModalOpen] = useState(false);

  // State for selection and deletion flow
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [newItem, setNewItem] = useState({ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" });
  const [bulkItems, setBulkItems] = useState([{ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" }]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const cellRefs = useRef([]);

  useEffect(() => {
    const unsubscribe = onMenuItemsRealtime((items) => {
      setMenuItems(items || []);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // --- Handlers for selection and deletion ---
  const handleOpenSelectMode = () => setSelectionMode(true);

  const handleCancelSelectMode = () => {
    setSelectionMode(false);
    setSelectedItems([]);
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === menuItems.length) {
      setSelectedItems([]); // Deselect all
    } else {
      setSelectedItems(menuItems.map(item => item.id)); // Select all
    }
  };

  const confirmDeletion = async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    try {
      await deleteMenuItemsInBulk(selectedItems);
      alert("Selected items deleted successfully.");
      handleCancelSelectMode();
    } catch (err) {
      console.error("Error deleting selected items:", err);
      alert("Failed to delete items. Please check the console for details.");
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
    }
  };


  // --- Handlers for adding items ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.fullPrice) {
      alert("Item name and Full Portion price are required.");
      return;
    }
    const fullPrice = parseFloat(newItem.fullPrice);
    if (isNaN(fullPrice)) {
      alert("Full Portion price must be a valid number.");
      return;
    }
    const halfPrice = newItem.halfPrice ? parseFloat(newItem.halfPrice) : null;
    const quarterPrice = newItem.quarterPrice ? parseFloat(newItem.quarterPrice) : null;
    try {
      await addMenuItem({
        name: newItem.name.trim(),
        fullPrice,
        halfPrice,
        quarterPrice,
        ingredients: newItem.ingredients.trim(),
        specialNote: newItem.specialNote.trim(),
      });
      setNewItem({ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error adding menu item:", err);
      alert("Failed to add menu item.");
    }
  };
  
  const handleOpenAddNewBulk = () => {
    setIsBulkModalOpen(false);
    setIsAddNewBulkModalOpen(true);
    cellRefs.current = [];
  };
  
  const inputClasses = "w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow";

  // --- Bulk Add Spreadsheet handlers ---
  const getCellRef = (row, col) => {
    if (!cellRefs.current[row]) cellRefs.current[row] = [];
    if (!cellRefs.current[row][col]) cellRefs.current[row][col] = React.createRef();
    return cellRefs.current[row][col];
  };
  
  const removeCellRefsRow = (rowIndex) => {
    if (!cellRefs.current || !cellRefs.current.length) return;
    cellRefs.current.splice(rowIndex, 1);
  };
  
  const handleCellKeyDown = (e, rowIndex, colIndex) => {
    const cols = 6;
    let targetRow = rowIndex; let targetCol = colIndex;
    switch (e.key) {
      case "ArrowUp": targetRow = Math.max(0, rowIndex - 1); break;
      case "ArrowDown": targetRow = Math.min(bulkItems.length - 1, rowIndex + 1); break;
      case "ArrowLeft": targetCol = Math.max(0, colIndex - 1); break;
      case "ArrowRight": targetCol = Math.min(cols - 1, colIndex + 1); break;
      default: return;
    }
    e.preventDefault();
    const targetRef = getCellRef(targetRow, targetCol);
    if (targetRef && targetRef.current) {
      targetRef.current.focus();
      const el = targetRef.current;
      if (el.setSelectionRange && typeof el.value === "string") {
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  };
  
  const handleBulkChange = (index, field, value) => {
    setBulkItems((prev) => {
      const copy = [...prev]; copy[index] = { ...copy[index], [field]: value }; return copy;
    });
  };
  
  const handleAddRow = () => { setBulkItems((prev) => [...prev, { name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" }]); };
  
  const handleDeleteRow = (index) => {
    setBulkItems((prev) => prev.filter((_, i) => i !== index));
    removeCellRefsRow(index);
  };
  
  const handleClearRows = () => {
    setBulkItems([{ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" }]);
    cellRefs.current = [];
  };
  
  const handleBulkAdd = async () => {
    const rowsToAdd = bulkItems
      .map((r) => ({ ...r, fullPriceParsed: parseFloat(r.fullPrice), halfPriceParsed: r.halfPrice ? parseFloat(r.halfPrice) : null, quarterPriceParsed: r.quarterPrice ? parseFloat(r.quarterPrice) : null }))
      .filter((r) => r.name && !isNaN(r.fullPriceParsed));
    if (rowsToAdd.length === 0) {
      alert("No valid rows to add."); return;
    }
    setIsBulkProcessing(true);
    const promises = rowsToAdd.map((r) =>
      addMenuItem({ name: r.name.trim(), fullPrice: r.fullPriceParsed, halfPrice: r.halfPriceParsed, quarterPrice: r.quarterPriceParsed, ingredients: r.ingredients ? r.ingredients.trim() : "", specialNote: r.specialNote ? r.specialNote.trim() : "" })
    );
    try {
      const results = await Promise.allSettled(promises);
      const failed = results.filter((res) => res.status === "rejected");
      if (failed.length === 0) {
        alert(`Successfully added ${results.length} item(s).`); handleClearRows(); setIsAddNewBulkModalOpen(false);
      } else {
        console.error("Bulk add failures:", failed); alert(`${results.length - failed.length} added, ${failed.length} failed.`);
      }
    } catch (err) {
      console.error("Unexpected bulk add error:", err); alert("Bulk add failed.");
    } finally {
      setIsBulkProcessing(false);
    }
  };
  
  const isRowValid = (row) => row.name && row.fullPrice && !isNaN(parseFloat(row.fullPrice));

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            {selectionMode ? (
              <>
                <h1 className="text-2xl font-bold text-blue-700">{selectedItems.length} of {menuItems.length} selected</h1>
                <p className="mt-1 text-gray-500">Select items from the list below to delete.</p>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-gray-800">Menu</h1>
                <p className="mt-1 text-gray-500">Manage your restaurant's menu items.</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            {selectionMode ? (
              <>
                <button onClick={handleSelectAll} className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                  {selectedItems.length === menuItems.length ? 'Deselect All' : 'Select All'}
                </button>
                <button onClick={() => setShowConfirmModal(true)} disabled={selectedItems.length === 0} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors">
                  Delete
                </button>
                <button onClick={handleCancelSelectMode} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsBulkModalOpen(true)} className="px-5 py-2.5 text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                  Bulk Actions
                </button>
                <button onClick={handleOpenSelectMode} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-all">
                  Select Items
                </button>
              </>
            )}
          </div>
        </header>

        <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {!selectionMode && (
            <button onClick={() => setIsModalOpen(true)} className="group border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center h-full min-h-[180px] hover:border-blue-500 hover:bg-blue-50 transition-all duration-200">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-2xl text-gray-500 group-hover:text-blue-600">+</span>
              </div>
              <span className="mt-3 text-gray-600 font-semibold group-hover:text-blue-700">Add New Item</span>
            </button>
          )}

          {menuItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              selectionMode={selectionMode}
              isSelected={selectedItems.includes(item.id)}
              onSelect={() => handleSelectItem(item.id)}
            />
          ))}
        </main>
      </div>
      
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Confirm Deletion</h2>
        <p className="text-gray-600 mb-6">Are you sure you want to permanently delete {selectedItems.length} item(s)? This action cannot be undone.</p>
        <div className="flex justify-end gap-4">
          <button onClick={() => setShowConfirmModal(false)} className="px-6 py-2 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
          <button onClick={confirmDeletion} disabled={isDeleting} className="px-6 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-wait transition-colors">
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>

      {/* CORRECTED: Removed the extra outer Modal tag */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-2xl font-bold mb-5 text-gray-900">Add New Menu Item</h2>
        <div className="space-y-4">
            <input
            type="text"
            name="name"
            value={newItem.name}
            onChange={handleInputChange}
            placeholder="Item Name"
            className={inputClasses}
            />
            <input
            type="text"
            name="fullPrice"
            value={newItem.fullPrice}
            onChange={handleInputChange}
            placeholder="Full Portion Price"
            className={inputClasses}
            />
            <input
            type="text"
            name="halfPrice"
            value={newItem.halfPrice}
            onChange={handleInputChange}
            placeholder="Half Portion Price"
            className={inputClasses}
            />
            <input
            type="text"
            name="quarterPrice"
            value={newItem.quarterPrice}
            onChange={handleInputChange}
            placeholder="Quarter Portion Price"
            className={inputClasses}
            />
            <input
            type="text"
            name="ingredients"
            value={newItem.ingredients}
            onChange={handleInputChange}
            placeholder="Ingredients (comma-separated)"
            className={inputClasses}
            />
            <textarea
            name="specialNote"
            value={newItem.specialNote}
            onChange={handleInputChange}
            placeholder="Special Note (optional)"
            rows={3}
            className={inputClasses}
            />
        </div>
        <div className="flex justify-end mt-6">
            <button
            onClick={handleAddItem}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
            Done
            </button>
        </div>
      </Modal>
      
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)}>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Bulk Actions</h2>
        <p className="text-gray-600 mb-6">Add multiple new items using a spreadsheet-like interface.</p>
        <div className="space-y-4">
            <button onClick={handleOpenAddNewBulk} className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">Add New Items</button>
            <button className="w-full bg-gray-200 text-gray-500 px-6 py-3 rounded-lg transition-colors cursor-not-allowed" disabled>Update Existing Items</button>
        </div>
      </Modal>

      {/* CORRECTED: Removed the extra outer Modal tag */}
      <Modal isOpen={isAddNewBulkModalOpen} onClose={() => setIsAddNewBulkModalOpen(false)} size="5xl">
        <div className="flex flex-col h-full">
            <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Bulk Add New Items</h2>
            <p className="text-gray-600 mt-1">
                Use arrow keys to navigate. Rows missing a name or valid price for the full portion will be skipped.
            </p>
            </div>

            <div className="flex-grow overflow-hidden rounded-lg border border-gray-200">
            <div className="max-h-[55vh] overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                    <tr>
                    <th className="px-4 py-3 w-1/12 text-center">Status</th>
                    <th className="px-4 py-3 w-2/12">Item Name*</th>
                    <th className="px-4 py-3 w-1/12">Full Portion Price*</th>
                    <th className="px-4 py-3 w-1/12">Half Portion Price</th>
                    <th className="px-4 py-3 w-1/12">Quarter Portion Price</th>
                    <th className="px-4 py-3 w-2/12">Ingredients</th>
                    <th className="px-4 py-3 w-2/12">Special Note</th>
                    <th className="px-4 py-3 w-1/12 text-center"></th>
                    </tr>
                </thead>
                <tbody>
                    {bulkItems.map((row, idx) => {
                    const valid = isRowValid(row);
                    const fullPriceInvalid = row.fullPrice && isNaN(parseFloat(row.fullPrice));
                    const status = !row.name && !row.fullPrice ? "empty" : valid ? "ok" : "invalid";
                    return (
                        <tr key={idx} className="group bg-white border-b hover:bg-gray-50">
                        <td className="px-4 py-1 text-center">
                            {status === "ok" && <span title="Valid row" className="inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>}
                            {status === "invalid" && <span title="Invalid row" className="inline-block h-2.5 w-2.5 rounded-full bg-red-500"></span>}
                            {status === "empty" && <span title="Empty row" className="inline-block h-2.5 w-2.5 rounded-full bg-gray-300"></span>}
                        </td>
                        <td>
                            <input
                            ref={getCellRef(idx, 0)}
                            type="text"
                            placeholder="e.g., Veg Biryani"
                            value={row.name}
                            onChange={(e) => handleBulkChange(idx, "name", e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, idx, 0)}
                            className="w-full bg-transparent p-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
                            />
                        </td>
                        <td>
                            <input
                            ref={getCellRef(idx, 1)}
                            type="text"
                            placeholder="e.g., 150.00"
                            value={row.fullPrice}
                            onChange={(e) => handleBulkChange(idx, "fullPrice", e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, idx, 1)}
                            className={`w-full bg-transparent p-2 border-0 focus:outline-none focus:ring-2 ${
                                fullPriceInvalid ? "ring-red-400" : "focus:ring-blue-300"
                            } rounded`}
                            />
                        </td>
                        <td>
                            <input
                            ref={getCellRef(idx, 2)}
                            type="text"
                            placeholder="e.g., 80.00"
                            value={row.halfPrice}
                            onChange={(e) => handleBulkChange(idx, "halfPrice", e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, idx, 2)}
                            className="w-full bg-transparent p-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
                            />
                        </td>
                        <td>
                            <input
                            ref={getCellRef(idx, 3)}
                            type="text"
                            placeholder="e.g., 45.00"
                            value={row.quarterPrice}
                            onChange={(e) => handleBulkChange(idx, "quarterPrice", e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, idx, 3)}
                            className="w-full bg-transparent p-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
                            />
                        </td>
                        <td>
                            <input
                            ref={getCellRef(idx, 4)}
                            type="text"
                            placeholder="e.g., rice, carrot, beans"
                            value={row.ingredients}
                            onChange={(e) => handleBulkChange(idx, "ingredients", e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, idx, 4)}
                            className="w-full bg-transparent p-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
                            />
                        </td>
                        <td>
                            <input
                            ref={getCellRef(idx, 5)}
                            type="text"
                            placeholder="Optional note"
                            value={row.specialNote}
                            onChange={(e) => handleBulkChange(idx, "specialNote", e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, idx, 5)}
                            className="w-full bg-transparent p-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
                            />
                        </td>
                        <td className="px-4 py-1 text-center">
                            <button
                            title="Delete row"
                            onClick={() => handleDeleteRow(idx)}
                            className="px-2 py-1 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                            ✕
                            </button>
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between mt-6">
            <div className="flex items-center gap-2">
                <button
                onClick={handleAddRow}
                className="bg-green-100 text-green-800 font-semibold px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
                >
                + Add Row
                </button>
                <button
                onClick={handleClearRows}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                Clear All
                </button>
            </div>
            <div className="mt-4 sm:mt-0">
                <button
                onClick={handleBulkAdd}
                disabled={isBulkProcessing}
                className={`px-6 py-2.5 rounded-lg text-white font-semibold transition-colors w-32 ${
                    isBulkProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
                >
                {isBulkProcessing ? "Adding..." : "Add Items"}
                </button>
            </div>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default Menu;