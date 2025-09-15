import React, { useEffect, useRef, useState } from "react";
import {
  addMenuItem,
  onMenuItemsRealtime,
} from "../firebase/firebase";
import Modal from "../components/Modal";
import MenuItemCard from "../components/MenuItemCard";

// A simple icon for buttons
const PlusIcon = () => (
  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const Menu = () => {
  // main list
  const [menuItems, setMenuItems] = useState([]);

  // modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAddNewBulkModalOpen, setIsAddNewBulkModalOpen] = useState(false);

  // single item form
  const [newItem, setNewItem] = useState({ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" });

  // spreadsheet bulk rows
  const [bulkItems, setBulkItems] = useState([{ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" }]);

  // UI state for bulk operation
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // refs for each cell: cellRefs.current[row][col] = ref
  const cellRefs = useRef([]);

  // Realtime subscription to menu items
  useEffect(() => {
    const unsubscribe = onMenuItemsRealtime((items) => {
      setMenuItems(items || []);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  /* ---------------- single add handlers ---------------- */
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

  /* ---------------- bulk spreadsheet handlers ---------------- */

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
    // There are now 6 columns
    const cols = 6;
    let targetRow = rowIndex;
    let targetCol = colIndex;
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
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }
  };

  const handleBulkChange = (index, field, value) => {
    setBulkItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddRow = () => {
    setBulkItems((prev) => [...prev, { name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" }]);
  };

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
      .map((r) => ({ 
        ...r, 
        fullPriceParsed: parseFloat(r.fullPrice),
        halfPriceParsed: r.halfPrice ? parseFloat(r.halfPrice) : null,
        quarterPriceParsed: r.quarterPrice ? parseFloat(r.quarterPrice) : null
      }))
      .filter((r) => r.name && !isNaN(r.fullPriceParsed));

    if (rowsToAdd.length === 0) {
      alert("No valid rows to add. Each row needs a name and a numeric price for at least the full portion.");
      return;
    }
    setIsBulkProcessing(true);
    const promises = rowsToAdd.map((r) =>
      addMenuItem({
        name: r.name.trim(),
        fullPrice: r.fullPriceParsed,
        halfPrice: r.halfPriceParsed,
        quarterPrice: r.quarterPriceParsed,
        ingredients: r.ingredients ? r.ingredients.trim() : "",
        specialNote: r.specialNote ? r.specialNote.trim() : "",
      })
    );
    try {
      const results = await Promise.allSettled(promises);
      const failed = results.filter((res) => res.status === "rejected");
      if (failed.length === 0) {
        alert(`Successfully added ${results.length} item(s).`);
        handleClearRows();
        setIsAddNewBulkModalOpen(false);
      } else {
        console.error("Bulk add failures:", failed);
        alert(`${results.length - failed.length} added, ${failed.length} failed. See console for details.`);
      }
    } catch (err) {
      console.error("Unexpected bulk add error:", err);
      alert("Bulk add failed. Check console for details.");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const isRowValid = (row) => row.name && row.fullPrice && !isNaN(parseFloat(row.fullPrice));

  const handleOpenAddNewBulk = () => {
    setIsBulkModalOpen(false);
    setIsAddNewBulkModalOpen(true);
    cellRefs.current = [];
  };

  // Common input classes for a consistent look
  const inputClasses = "w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow";

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Menu</h1>
            <p className="mt-1 text-gray-500">Manage your restaurant's menu items.</p>
          </div>
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="mt-4 sm:mt-0 flex items-center justify-center bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            Bulk Actions
          </button>
        </header>

        <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="group border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center h-full min-h-[180px] hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <span className="text-2xl text-gray-500 group-hover:text-blue-600">+</span>
            </div>
            <span className="mt-3 text-gray-600 font-semibold group-hover:text-blue-700">Add New Item</span>
          </button>

          {menuItems.map((item) => (
            <MenuItemCard key={item.id} item={item} quantity={0} onQuantityChange={() => {}} />
          ))}
        </main>
      </div>

      {/* ---------------- Single Add Modal ---------------- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-2xl font-bold mb-5 text-gray-900">Add New Menu Item</h2>
        <div className="space-y-4">
          <input type="text" name="name" value={newItem.name} onChange={handleInputChange} placeholder="Item Name" className={inputClasses} />
          <input type="text" name="fullPrice" value={newItem.fullPrice} onChange={handleInputChange} placeholder="Full Portion Price" className={inputClasses} />
          <input type="text" name="halfPrice" value={newItem.halfPrice} onChange={handleInputChange} placeholder="Half Portion Price" className={inputClasses} />
          <input type="text" name="quarterPrice" value={newItem.quarterPrice} onChange={handleInputChange} placeholder="Quarter Portion Price" className={inputClasses} />
          <input type="text" name="ingredients" value={newItem.ingredients} onChange={handleInputChange} placeholder="Ingredients (comma-separated)" className={inputClasses} />
          <textarea name="specialNote" value={newItem.specialNote} onChange={handleInputChange} placeholder="Special Note (optional)" rows={3} className={inputClasses} />
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={handleAddItem} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold">Done</button>
        </div>
      </Modal>

      {/* ---------------- Bulk Update Options Modal ---------------- */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)}>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Bulk Actions</h2>
        <p className="text-gray-600 mb-6">Choose an option to update your menu items in bulk.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button className="bg-gray-200 text-gray-500 px-6 py-3 rounded-lg transition-colors cursor-not-allowed" disabled>Update Existing</button>
            <button onClick={handleOpenAddNewBulk} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">Add New Items</button>
        </div>
      </Modal>

      {/* ---------------- Bulk Add Spreadsheet Modal ---------------- */}
      <Modal isOpen={isAddNewBulkModalOpen} onClose={() => setIsAddNewBulkModalOpen(false)} size="5xl">
        <div className="flex flex-col h-full">
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Bulk Add New Items</h2>
                <p className="text-gray-600 mt-1">Use arrow keys to navigate. Rows missing a name or valid price for the full portion will be skipped.</p>
            </div>

            <div className="flex-grow overflow-hidden rounded-lg border border-gray-200">
              <div className="max-h-[55vh] overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-3 w-1/12 text-center">Status</th>
                            <th scope="col" className="px-4 py-3 w-2/12">Item Name*</th>
                            <th scope="col" className="px-4 py-3 w-1/12">Full Portion Price*</th>
                            <th scope="col" className="px-4 py-3 w-1/12">Half Portion Price</th>
                            <th scope="col" className="px-4 py-3 w-1/12">Quarter Portion Price</th>
                            <th scope="col" className="px-4 py-3 w-2/12">Ingredients</th>
                            <th scope="col" className="px-4 py-3 w-2/12">Special Note</th>
                            <th scope="col" className="px-4 py-3 w-1/12 text-center"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {bulkItems.map((row, idx) => {
                            const valid = isRowValid(row);
                            const fullPriceInvalid = row.fullPrice && isNaN(parseFloat(row.fullPrice));
                            const status = !row.name && !row.fullPrice ? 'empty' : valid ? 'ok' : 'invalid';
                            return (
                                <tr key={idx} className="group bg-white border-b hover:bg-gray-50">
                                    <td className="px-4 py-1 text-center">
                                        {status === 'ok' && <span title="Valid row" className="inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>}
                                        {status === 'invalid' && <span title="Invalid row" className="inline-block h-2.5 w-2.5 rounded-full bg-red-500"></span>}
                                        {status === 'empty' && <span title="Empty row" className="inline-block h-2.5 w-2.5 rounded-full bg-gray-300"></span>}
                                    </td>
                                    <td><input ref={getCellRef(idx, 0)} type="text" placeholder="e.g., Veg Biryani" value={row.name} onChange={(e) => handleBulkChange(idx, "name", e.target.value)} onKeyDown={(e) => handleCellKeyDown(e, idx, 0)} className="w-full bg-transparent p-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"/></td>
                                    <td><input ref={getCellRef(idx, 1)} type="text" placeholder="e.g., 150.00" value={row.fullPrice} onChange={(e) => handleBulkChange(idx, "fullPrice", e.target.value)} onKeyDown={(e) => handleCellKeyDown(e, idx, 1)} className={`w-full bg-transparent p-2 border-0 focus:outline-none focus:ring-2 ${fullPriceInvalid ? 'ring-red-400' : 'focus:ring-blue-300'} rounded`}/></td>
                                    <td><input ref={getCellRef(idx, 2)} type="text" placeholder="e.g., 80.00" value={row.halfPrice} onChange={(e) => handleBulkChange(idx, "halfPrice", e.target.value)} onKeyDown={(e) => handleCellKeyDown(e, idx, 2)} className="w-full bg-transparent p-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"/></td>
                                    <td><input ref={getCellRef(idx, 3)} type="text" placeholder="e.g., 45.00" value={row.quarterPrice} onChange={(e) => handleBulkChange(idx, "quarterPrice", e.target.value)} onKeyDown={(e) => handleCellKeyDown(e, idx, 3)} className="w-full bg-transparent p-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"/></td>
                                    <td><input ref={getCellRef(idx, 4)} type="text" placeholder="e.g., rice, carrot, beans" value={row.ingredients} onChange={(e) => handleBulkChange(idx, "ingredients", e.target.value)} onKeyDown={(e) => handleCellKeyDown(e, idx, 4)} className="w-full bg-transparent p-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"/></td>
                                    <td><input ref={getCellRef(idx, 5)} type="text" placeholder="Optional note" value={row.specialNote} onChange={(e) => handleBulkChange(idx, "specialNote", e.target.value)} onKeyDown={(e) => handleCellKeyDown(e, idx, 5)} className="w-full bg-transparent p-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"/></td>
                                    <td className="px-4 py-1 text-center">
                                        <button title="Delete row" onClick={() => handleDeleteRow(idx)} className="px-2 py-1 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
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
                    <button onClick={handleAddRow} className="bg-green-100 text-green-800 font-semibold px-4 py-2 rounded-lg hover:bg-green-200 transition-colors">+ Add Row</button>
                    <button onClick={handleClearRows} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">Clear All</button>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button onClick={handleBulkAdd} disabled={isBulkProcessing} className={`px-6 py-2.5 rounded-lg text-white font-semibold transition-colors w-32 ${isBulkProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
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