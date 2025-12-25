import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  addMenuItem, 
  updateMenuItem, 
  onMenuItemsRealtime, 
  deleteMenuItemsInBulk, 
  updateMenuItemsInBulk,
  getSettings,
  onCategoriesRealtime,
  addCategory 
} from "../firebase/firebase";
import Modal from "../components/Modal";
import MenuItemCard from "../components/MenuItemCard";
import { getTranslation } from '../translations';

const Notification = ({ msg, type, onClose }) => {
  if (!msg) return null;
  const styles = type === 'error' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200';
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg flex items-center gap-3 ${styles} animate-fade-in-down`}>
      <span className="font-medium">{msg}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 font-bold text-lg leading-none">&times;</button>
    </div>
  );
};

const Menu = () => {
  const [settings, setSettings] = useState({ currencySymbol: '₹', language: 'en' });
  const [t, setT] = useState(getTranslation('en'));
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [notif, setNotif] = useState(null);
  
  // Modals & Modes
  const [modals, setModals] = useState({ 
    single: false, 
    bulkSelect: false, 
    bulkAdd: false, 
    bulkUpdate: false, 
    confirm: false,
    newCategory: false 
  });
  const [selection, setSelection] = useState({ active: false, items: [], deleting: false });
  
  // Form Data
  const [newItem, setNewItem] = useState({ 
    name: "", fullPrice: "", halfPrice: "", quarterPrice: "", 
    ingredients: "", specialNote: "", category: "" 
  });
  const [tempCategory, setTempCategory] = useState("");
  const [bulkItems, setBulkItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const cellRefs = useRef([]);
  const isRTL = settings.language === 'ar'; 
  
  const showNotify = useCallback((msg, type = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3000);
  }, []);

  useEffect(() => {
    getSettings().then(s => {
      if (s) {
        const lang = s.language || 'en';
        setSettings({ currencySymbol: s.currencySymbol || '₹', language: lang });
        setT(getTranslation(lang));
      }
    });

    const unsubItems = onMenuItemsRealtime(items => setMenuItems(items || []));
    const unsubCats = onCategoriesRealtime(cats => setCategories(cats || []));

    return () => {
        unsubItems();
        unsubCats();
    };
  }, []);

  const toggleModal = (key, open = true) => setModals(p => ({ ...p, [key]: open }));
  
  // Selection Handlers
  const toggleSelect = (id) => setSelection(prev => ({ 
    ...prev, 
    items: prev.items.includes(id) ? prev.items.filter(x => x !== id) : [...prev.items, id] 
  }));

  const handleBulkDelete = async () => {
    if (!selection.items.length) return;
    setSelection(p => ({ ...p, deleting: true }));
    try {
      await deleteMenuItemsInBulk(selection.items);
      if (modals.bulkUpdate) setBulkItems(prev => prev.filter(i => !selection.items.includes(i.id)));
      showNotify("Item(s) deleted successfully.");
    } catch (e) {
      showNotify("Error deleting items.", "error");
    }
    setSelection({ active: false, items: [], deleting: false });
    toggleModal('confirm', false);
  };

  // Category Handlers
  const handleAddNewCategory = async () => {
    if (!tempCategory.trim()) return;
    try {
      await addCategory({ name: tempCategory.trim() });
      setNewItem(p => ({ ...p, category: tempCategory.trim() }));
      setTempCategory("");
      toggleModal('newCategory', false);
      showNotify("Category added!");
    } catch (e) {
      showNotify("Error adding category", "error");
    }
  };

  // Grid Table Row Handler
  const handleRowXClick = (idx, row) => {
    if (modals.bulkUpdate) {
      let targetId = row.id || menuItems.find(i => i.name.trim().toLowerCase() === row.name?.trim().toLowerCase())?.id;
      if (targetId) {
        setSelection({ active: false, items: [targetId], deleting: false });
        toggleModal('confirm', true);
      } else {
        setBulkItems(p => p.filter((_, i) => i !== idx));
      }
    } else {
      setBulkItems(p => p.filter((_, i) => i !== idx));
    }
  };

  // Add Single Handler
  const handleAddItem = async () => {
    if (!newItem.name?.trim() || !newItem.fullPrice || isNaN(parseFloat(newItem.fullPrice))) {
      return showNotify(t.addItemTitle + " requires name and valid price.", "error");
    }
    await addMenuItem({ 
      ...newItem, 
      fullPrice: parseFloat(newItem.fullPrice), 
      halfPrice: newItem.halfPrice ? parseFloat(newItem.halfPrice) : null, 
      quarterPrice: newItem.quarterPrice ? parseFloat(newItem.quarterPrice) : null 
    });
    setNewItem({ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "", category: "" });
    toggleModal('single', false);
    showNotify("Item added successfully!");
  };

  // Bulk Handlers
  const initBulk = (type) => {
    toggleModal('bulkSelect', false);
    toggleModal(type, true);
    cellRefs.current = [];
    if (type === 'bulkAdd') {
      setBulkItems([{ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", category: "", ingredients: "", specialNote: "" }]);
    } else {
      setBulkItems(menuItems.map(i => ({ 
        ...i, 
        fullPrice: i.fullPrice?.toString() || "", 
        halfPrice: i.halfPrice?.toString() || "", 
        quarterPrice: i.quarterPrice?.toString() || "" 
      })));
    }
  };

  const handleBulkSubmit = async (isUpdate) => {
    const validRows = bulkItems.filter(r => r.name?.trim());
    if (!validRows.length) return showNotify("No valid items to process.", "error");
    
    setIsProcessing(true);
    try {
      if (!isUpdate) {
        const toAdd = validRows.filter(r => r.fullPrice && !isNaN(parseFloat(r.fullPrice)));
        await Promise.all(toAdd.map(r => addMenuItem({ 
          ...r, 
          fullPrice: parseFloat(r.fullPrice), 
          halfPrice: r.halfPrice ? parseFloat(r.halfPrice) : null, 
          quarterPrice: r.quarterPrice ? parseFloat(r.quarterPrice) : null 
        })));
        showNotify(`${toAdd.length} items added.`);
      } else {
        const updates = validRows.map(r => ({
          id: r.id,
          name: r.name,
          fullPrice: parseFloat(r.fullPrice),
          halfPrice: r.halfPrice ? parseFloat(r.halfPrice) : null,
          quarterPrice: r.quarterPrice ? parseFloat(r.quarterPrice) : null,
          category: r.category,
          ingredients: r.ingredients,
          specialNote: r.specialNote
        }));
        await updateMenuItemsInBulk(updates);
        showNotify("Bulk update successful.");
      }
      toggleModal(isUpdate ? 'bulkUpdate' : 'bulkAdd', false);
    } catch (e) { 
      showNotify(e.message, "error"); 
    }
    setIsProcessing(false);
  };

  const handleKey = (e, r, c) => {
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    let nr = r, nc = c;
    if (e.key === "ArrowUp") nr = Math.max(0, r - 1);
    if (e.key === "ArrowDown") nr = Math.min(bulkItems.length - 1, r + 1);
    cellRefs.current[nr]?.[nc]?.focus();
  };

  // Shared Table Renderer
  const renderBulkTable = (isUpdate) => (
    <div className="flex-grow overflow-hidden rounded-lg border border-gray-200">
      <div className="max-h-[55vh] overflow-y-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-center">{isUpdate ? t.matchStatus : t.status}</th>
              {[t.itemName, t.fullPrice, t.halfPrice, t.quarterPrice, "Category", t.ingredients, t.specialNote].map(h => <th key={h} className="px-4 py-3">{h}</th>)}
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {bulkItems.map((row, idx) => {
              const matched = isUpdate && menuItems.some(m => m.id === row.id || m.name.toLowerCase() === row.name?.toLowerCase());
              const valid = !isUpdate && row.name && row.fullPrice && !isNaN(parseFloat(row.fullPrice));
              const statusColor = isUpdate ? (matched ? "bg-green-500" : "bg-red-500") : (valid ? "bg-green-500" : (row.name ? "bg-red-500" : "bg-gray-300"));
              
              if (!cellRefs.current[idx]) cellRefs.current[idx] = [];

              return (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-center"><span className={`inline-block w-3 h-3 rounded-full ${statusColor}`}></span></td>
                  {['name', 'fullPrice', 'halfPrice', 'quarterPrice', 'category', 'ingredients', 'specialNote'].map((field, ci) => (
                    <td key={field} className="px-1">
                      {field === 'category' ? (
                        <select
                          ref={el => cellRefs.current[idx][ci] = el}
                          value={row[field] || ""}
                          onChange={(e) => setBulkItems(prev => { 
                            const c = [...prev]; 
                            c[idx] = { ...c[idx], [field]: e.target.value }; 
                            return c; 
                          })}
                          onKeyDown={(e) => handleKey(e, idx, ci)}
                          className="w-full p-2 bg-white border border-transparent focus:border-blue-300 focus:ring-1 focus:ring-blue-300 rounded outline-none"
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                      ) : (
                        <input
                          ref={el => cellRefs.current[idx][ci] = el}
                          type="text"
                          value={row[field] || ""}
                          onChange={(e) => setBulkItems(prev => { 
                            const c = [...prev]; 
                            c[idx] = { ...c[idx], [field]: e.target.value }; 
                            return c; 
                          })}
                          onKeyDown={(e) => handleKey(e, idx, ci)}
                          className="w-full p-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
                        />
                      )}
                    </td>
                  ))}
                  <td className="text-center">
                    <button onClick={() => handleRowXClick(idx, row)} className="text-red-500 hover:bg-red-100 px-2 rounded">✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-50 min-h-screen ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Notification {...notif} onClose={() => setNotif(null)} />
      
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className={`text-2xl sm:text-4xl font-bold ${selection.active ? 'text-blue-700' : 'text-gray-800'}`}>
              {selection.active ? `${selection.items.length} ${t.selected}` : t.menuTitle}
            </h1>
            <p className="mt-1 text-gray-500">{selection.active ? t.selectSubtitle : t.menuSubtitle}</p>
          </div>
          <div className="flex gap-2">
            {!selection.active ? (
              <>
                <button onClick={() => toggleModal('bulkSelect')} className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-gray-800">{t.bulkActions}</button>
                <button onClick={() => toggleModal('single')} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">{t.addNewItem}</button>
                <button onClick={() => setSelection({ active: true, items: [], deleting: false })} className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">{t.selectItems}</button>
              </>
            ) : (
              <>
                <button onClick={() => setSelection(p => ({ ...p, items: p.items.length === menuItems.length ? [] : menuItems.map(i => i.id) }))} className="px-4 py-2 bg-gray-200 rounded-lg">{selection.items.length === menuItems.length ? t.deselectAll : t.selectAll}</button>
                <button onClick={() => toggleModal('confirm')} disabled={!selection.items.length} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{t.delete}</button>
                <button onClick={() => setSelection({ active: false, items: [], deleting: false })} className="px-4 py-2 bg-gray-200 rounded-lg">{t.cancel}</button>
              </>
            )}
          </div>
        </header>

        <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {!selection.active && (
            <button onClick={() => toggleModal('single')} className="group border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center min-h-[180px] hover:border-blue-500 hover:bg-blue-50 transition-all">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center group-hover:bg-blue-200 text-2xl text-gray-500 group-hover:text-blue-600">+</div>
              <span className="mt-3 text-gray-600 font-semibold group-hover:text-blue-700">{t.addNewItem}</span>
            </button>
          )}
          {menuItems.map(item => (
            <MenuItemCard 
              key={item.id} 
              item={item} 
              selectionMode={selection.active} 
              isSelected={selection.items.includes(item.id)} 
              onSelect={() => toggleSelect(item.id)} 
              currency={settings.currencySymbol} 
            />
          ))}
        </main>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={modals.confirm} onClose={() => toggleModal('confirm', false)}>
        <h2 className="text-2xl font-bold mb-4">{t.confirmDeleteTitle}</h2>
        <p className="text-gray-600 mb-6">{t.confirmDeleteMsg} {selection.items.length} items</p>
        <div className="flex justify-end gap-4">
          <button onClick={() => toggleModal('confirm', false)} className="px-6 py-2 bg-gray-200 rounded-lg">{t.cancel}</button>
          <button onClick={handleBulkDelete} disabled={selection.deleting} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{selection.deleting ? t.deleting : t.delete}</button>
        </div>
      </Modal>

      {/* Single Add Modal */}
      <Modal isOpen={modals.single} onClose={() => toggleModal('single', false)}>
        <h2 className="text-2xl font-bold mb-5">{t.addItemTitle}</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <select
              value={newItem.category}
              onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
              className="flex-grow p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
            <button onClick={() => toggleModal('newCategory', !modals.newCategory)} className="p-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100">+</button>
          </div>

          {modals.newCategory && (
            <div className="flex gap-2 p-3 bg-blue-50 rounded-lg animate-fade-in">
                <input placeholder="New category name..." className="flex-grow p-2 border border-blue-200 rounded-md" value={tempCategory} onChange={e => setTempCategory(e.target.value)} />
                <button onClick={handleAddNewCategory} className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700">Add</button>
            </div>
          )}

          <input placeholder={t.itemName} value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} className="w-full p-2.5 border rounded-lg" />
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">{settings.currencySymbol}</span>
            <input placeholder={t.fullPrice} value={newItem.fullPrice} onChange={e => setNewItem(p => ({ ...p, fullPrice: e.target.value }))} className="w-full p-2.5 pl-8 border rounded-lg" />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={handleAddItem} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">{t.done}</button>
        </div>
      </Modal>

      {/* Shared Bulk Modal */}
      {(modals.bulkAdd || modals.bulkUpdate) && (
        <Modal isOpen={true} onClose={() => { toggleModal('bulkAdd', false); toggleModal('bulkUpdate', false); }} size="5xl">
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">{modals.bulkAdd ? t.bulkAddTitle : t.bulkUpdateTitle}</h2>
              <p className="text-gray-600 mt-1">{modals.bulkAdd ? t.bulkAddSubtitle : t.bulkUpdateSubtitle}</p>
            </div>
            {renderBulkTable(modals.bulkUpdate)}
            <div className="flex items-center justify-between mt-6">
              <button onClick={() => setBulkItems(p => [...p, { name: "", fullPrice: "", halfPrice: "", quarterPrice: "", category: "", ingredients: "", specialNote: "" }])} className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 font-semibold">{t.addRow}</button>
              <button onClick={() => handleBulkSubmit(modals.bulkUpdate)} disabled={isProcessing} className={`px-8 py-2.5 rounded-lg text-white font-bold ${isProcessing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isProcessing ? t.processing : (modals.bulkUpdate ? t.updateItems : t.addItems)}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Select Options */}
      <Modal isOpen={modals.bulkSelect} onClose={() => toggleModal('bulkSelect', false)}>
        <h2 className="text-2xl font-bold mb-4">{t.bulkActionTitle}</h2>
        <div className="space-y-4">
          <button onClick={() => initBulk('bulkAdd')} className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold">{t.addNewItemsBtn}</button>
          <button onClick={() => initBulk('bulkUpdate')} className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold">{t.updateExistingBtn}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Menu;