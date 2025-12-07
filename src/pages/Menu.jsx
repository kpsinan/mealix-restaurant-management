import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  addMenuItem, updateMenuItem, onMenuItemsRealtime, deleteMenuItemsInBulk, getSettings
} from "../firebase/firebase";
import Modal from "../components/Modal";
import MenuItemCard from "../components/MenuItemCard";

// Compact Translations
const TRANSLATIONS = {
  en: { menuTitle: "Menu", menuSubtitle: "Manage your restaurant's menu items.", selected: "selected", selectSubtitle: "Select items to delete.", selectAll: "Select All", deselectAll: "Deselect All", delete: "Delete", cancel: "Cancel", bulkActions: "Bulk Actions", selectItems: "Select Items", addNewItem: "Add New Item", confirmDeleteTitle: "Confirm Deletion", confirmDeleteMsg: "Are you sure you want to permanently delete", items: "item(s)?", deleting: "Deleting...", addItemTitle: "Add New Menu Item", itemName: "Item Name", fullPrice: "Full Portion Price", halfPrice: "Half Portion Price", quarterPrice: "Quarter Portion Price", ingredients: "Ingredients (comma-separated)", specialNote: "Special Note (optional)", done: "Done", bulkActionTitle: "Bulk Actions", bulkActionSubtitle: "Add or update multiple items quickly.", addNewItemsBtn: "Add New Items", updateExistingBtn: "Update Existing Items", bulkAddTitle: "Bulk Add New Items", bulkAddSubtitle: "Use arrow keys. Rows missing name/price skipped.", bulkUpdateTitle: "Bulk Update Existing Items", bulkUpdateSubtitle: "Edit multiple items. Match by name.", status: "Status", matchStatus: "Match", matched: "Matched", notMatched: "Not Found", willUpdate: "Will Update", addRow: "+ Add Row", clearAll: "Clear All", addItems: "Add Items", updateItems: "Update Items", adding: "Adding...", updating: "Updating...", updatedCount: "items updated successfully.", noMatches: "No items matched.", partialUpdate: "Some updated, others not found." },
  hi: { menuTitle: "मेनू (Menu)", menuSubtitle: "मेनू आइटम प्रबंधित करें।", selected: "चयनित", selectSubtitle: "हटाने के लिए आइटम चुनें।", selectAll: "सभी चुनें", deselectAll: "सभी अचयनित करें", delete: "हटाएं", cancel: "रद्द करें", bulkActions: "थोक क्रियाएं", selectItems: "आइटम चुनें", addNewItem: "नया आइटम", confirmDeleteTitle: "हटाने की पुष्टि", confirmDeleteMsg: "क्या आप हटाना चाहते हैं", items: "आइटम?", deleting: "हटा रहा है...", addItemTitle: "नया आइटम जोड़ें", itemName: "आइटम का नाम", fullPrice: "पूर्ण कीमत", halfPrice: "आधी कीमत", quarterPrice: "चौथाई कीमत", ingredients: "सामग्री", specialNote: "विशेष नोट", done: "हो गया", bulkActionTitle: "थोक क्रियाएं", bulkActionSubtitle: "कई आइटम जोड़ें/अपडेट करें।", addNewItemsBtn: "नए आइटम जोड़ें", updateExistingBtn: "मौजूदा अपडेट करें", bulkAddTitle: "थोक में जोड़ें", bulkAddSubtitle: "तीर कुंजियों का उपयोग करें।", bulkUpdateTitle: "थोक अपडेट", bulkUpdateSubtitle: "नाम से मिलान करें।", status: "स्थिति", matchStatus: "मिलान", matched: "मिला", notMatched: "नहीं मिला", willUpdate: "अपडेट होगा", addRow: "+ पंक्ति", clearAll: "साफ़ करें", addItems: "जोड़ें", updateItems: "अपडेट करें", adding: "जोड़ रहा है...", updating: "अपडेट...", updatedCount: "सफल।", noMatches: "कोई नहीं मिला।", partialUpdate: "कुछ अपडेट, कुछ नहीं।" },
  es: { menuTitle: "Menú", menuSubtitle: "Administra el menú.", selected: "seleccionado", selectSubtitle: "Selecciona para eliminar.", selectAll: "Todos", deselectAll: "Ninguno", delete: "Eliminar", cancel: "Cancelar", bulkActions: "Acciones masivas", selectItems: "Seleccionar", addNewItem: "Nuevo artículo", confirmDeleteTitle: "Confirmar", confirmDeleteMsg: "¿Eliminar", items: "elemento(s)?", deleting: "Eliminando...", addItemTitle: "Nuevo elemento", itemName: "Nombre", fullPrice: "Precio completo", halfPrice: "Precio media", quarterPrice: "Precio cuarto", ingredients: "Ingredientes", specialNote: "Nota", done: "Hecho", bulkActionTitle: "Acciones masivas", bulkActionSubtitle: "Gestiona múltiples elementos.", addNewItemsBtn: "Agregar nuevos", updateExistingBtn: "Actualizar existentes", bulkAddTitle: "Agregar masivo", bulkAddSubtitle: "Usa flechas.", bulkUpdateTitle: "Actualización masiva", bulkUpdateSubtitle: "Coincidencia por nombre.", status: "Estado", matchStatus: "Coincidencia", matched: "Coincide", notMatched: "No encontrado", willUpdate: "Actualizará", addRow: "+ Fila", clearAll: "Borrar", addItems: "Agregar", updateItems: "Actualizar", adding: "Agregando...", updating: "Actualizando...", updatedCount: "actualizados.", noMatches: "Sin coincidencias.", partialUpdate: "Parcialmente actualizado." },
  ar: { menuTitle: "القائمة", menuSubtitle: "إدارة القائمة.", selected: "محدد", selectSubtitle: "حدد للحذف.", selectAll: "تحديد الكل", deselectAll: "إلغاء الكل", delete: "حذف", cancel: "إلغاء", bulkActions: "إجراءات جماعية", selectItems: "تحديد", addNewItem: "عنصر جديد", confirmDeleteTitle: "تأكيد الحذف", confirmDeleteMsg: "هل تريد حذف", items: "عنصر؟", deleting: "حذف...", addItemTitle: "إضافة عنصر", itemName: "الاسم", fullPrice: "سعر كامل", halfPrice: "سعر نصف", quarterPrice: "سعر ربع", ingredients: "المكونات", specialNote: "ملاحظة", done: "تم", bulkActionTitle: "إجراءات جماعية", bulkActionSubtitle: "إضافة/تحديث بسرعة.", addNewItemsBtn: "إضافة جديد", updateExistingBtn: "تحديث موجود", bulkAddTitle: "إضافة بالجملة", bulkAddSubtitle: "استخدم الأسهم.", bulkUpdateTitle: "تحديث جماعي", bulkUpdateSubtitle: "تطابق بالاسم.", status: "الحالة", matchStatus: "تطابق", matched: "متطابق", notMatched: "غير موجود", willUpdate: "سيحدث", addRow: "+ صف", clearAll: "مسح", addItems: "إضافة", updateItems: "تحديث", adding: "إضافة...", updating: "تحديث...", updatedCount: "تم بنجاح.", noMatches: "لا يوجد تطابق.", partialUpdate: "تحديث جزئي." },
  fr: { menuTitle: "Menu", menuSubtitle: "Gérez le menu.", selected: "sélectionné", selectSubtitle: "Sélectionnez pour supprimer.", selectAll: "Tout", deselectAll: "Rien", delete: "Supprimer", cancel: "Annuler", bulkActions: "Actions en masse", selectItems: "Sélectionner", addNewItem: "Nouvel élément", confirmDeleteTitle: "Confirmer", confirmDeleteMsg: "Supprimer", items: "élément(s)?", deleting: "Suppression...", addItemTitle: "Ajouter élément", itemName: "Nom", fullPrice: "Prix complet", halfPrice: "Prix demi", quarterPrice: "Prix quart", ingredients: "Ingrédients", specialNote: "Note", done: "Fait", bulkActionTitle: "Actions en masse", bulkActionSubtitle: "Ajoutez/Modifiez rapidement.", addNewItemsBtn: "Ajouter nouveaux", updateExistingBtn: "Mettre à jour", bulkAddTitle: "Ajout en masse", bulkAddSubtitle: "Utilisez les flèches.", bulkUpdateTitle: "Mise à jour en masse", bulkUpdateSubtitle: "Match par nom.", status: "Statut", matchStatus: "Match", matched: "Trouvé", notMatched: "Non trouvé", willUpdate: "Sera maj", addRow: "+ Ligne", clearAll: "Effacer", addItems: "Ajouter", updateItems: "MAJ", adding: "Ajout...", updating: "MAJ...", updatedCount: "succès.", noMatches: "Aucun trouvé.", partialUpdate: "MAJ partielle." }
};

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
  const [t, setT] = useState(TRANSLATIONS.en);
  const [menuItems, setMenuItems] = useState([]);
  const [notif, setNotif] = useState(null);
  
  // Modals & Modes
  const [modals, setModals] = useState({ single: false, bulkSelect: false, bulkAdd: false, bulkUpdate: false, confirm: false });
  const [selection, setSelection] = useState({ active: false, items: [], deleting: false });
  
  // Form Data
  const [newItem, setNewItem] = useState({ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" });
  const [bulkItems, setBulkItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs
  const cellRefs = useRef([]);
  const isRTL = settings.language === 'ar';
  
  const showNotify = useCallback((msg, type = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3000);
  }, []);

  useEffect(() => {
    getSettings().then(s => {
      if (s) {
        setSettings({ currencySymbol: s.currencySymbol || '₹', language: s.language || 'en' });
        setT(TRANSLATIONS[s.language] || TRANSLATIONS.en);
      }
    });
    return onMenuItemsRealtime(items => setMenuItems(items || []));
  }, []);

  const toggleModal = (key, open = true) => setModals(p => ({ ...p, [key]: open }));
  
  // Handlers: Selection & Delete
  const toggleSelect = (id) => setSelection(prev => ({ ...prev, items: prev.items.includes(id) ? prev.items.filter(x => x !== id) : [...prev.items, id] }));
  
  const handleBulkDelete = async () => {
    if (!selection.items.length) return;
    setSelection(p => ({ ...p, deleting: true }));
    try {
      await deleteMenuItemsInBulk(selection.items);
      if (modals.bulkUpdate) {
        // Remove deleted items from the bulk update table view
        setBulkItems(prev => prev.filter(i => !selection.items.includes(i.id)));
      }
      showNotify("Item(s) deleted successfully.");
    } catch (e) {
      console.error(e);
      showNotify("Error deleting items.", "error");
    }
    setSelection({ active: false, items: [], deleting: false });
    toggleModal('confirm', false);
  };

  const handleRowXClick = (idx, row) => {
    if (modals.bulkUpdate) {
      // In Bulk Update, try to delete the actual item if it exists
      const match = menuItems.find(i => i.name.trim().toLowerCase() === row.name?.trim().toLowerCase());
      if (match) {
        setSelection({ active: false, items: [match.id], deleting: false });
        toggleModal('confirm', true);
      } else {
        // If it's a new row or not matched, just remove from list
        setBulkItems(p => p.filter((_, i) => i !== idx));
      }
    } else {
      // In Bulk Add, just remove the row
      setBulkItems(p => p.filter((_, i) => i !== idx));
    }
  };

  // Handlers: Add Single
  const handleAddItem = async () => {
    if (!newItem.name?.trim() || !newItem.fullPrice || isNaN(parseFloat(newItem.fullPrice))) {
      return showNotify("Name and valid Full Price are required.", "error");
    }
    await addMenuItem({ ...newItem, fullPrice: parseFloat(newItem.fullPrice), halfPrice: parseFloat(newItem.halfPrice)||null, quarterPrice: parseFloat(newItem.quarterPrice)||null });
    setNewItem({ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" });
    toggleModal('single', false);
    showNotify("Item added successfully!");
  };

  // Handlers: Bulk
  const initBulk = (type) => {
    toggleModal('bulkSelect', false);
    toggleModal(type, true);
    cellRefs.current = [];
    if (type === 'bulkAdd') setBulkItems([{ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" }]);
    else setBulkItems(menuItems.length ? menuItems.map(i => ({ ...i, id: i.id, fullPrice: "", halfPrice: "", quarterPrice: "" })) : [{ name: "" }]);
  };

  const handleBulkChange = (idx, field, val) => {
    setBulkItems(prev => { const c = [...prev]; c[idx] = { ...c[idx], [field]: val }; return c; });
  };

  const handleBulkSubmit = async (isUpdate) => {
    const validRows = bulkItems.filter(r => r.name?.trim());
    if (!validRows.length) return showNotify("No valid items to process.", "error");
    
    setIsProcessing(true);
    try {
      if (!isUpdate) {
        const toAdd = validRows.filter(r => r.fullPrice && !isNaN(parseFloat(r.fullPrice)));
        if (!toAdd.length) throw new Error("No rows with valid Name and Price.");
        await Promise.all(toAdd.map(r => addMenuItem({ ...r, fullPrice: parseFloat(r.fullPrice), halfPrice: parseFloat(r.halfPrice)||null, quarterPrice: parseFloat(r.quarterPrice)||null })));
        showNotify(`${toAdd.length} items added.`);
      } else {
        const updates = validRows.map(r => {
          const original = menuItems.find(m => m.name.trim().toLowerCase() === r.name.trim().toLowerCase());
          if (!original) return null;
          const u = {};
          
          // Helper to check if value exists (non-empty) and is different from original
          const checkNum = (key, val) => {
             if (val && parseFloat(val) !== original[key]) u[key] = parseFloat(val);
          };
          const checkStr = (key, val) => {
             if (val && val !== original[key]) u[key] = val;
          };

          checkNum('fullPrice', r.fullPrice);
          checkNum('halfPrice', r.halfPrice);
          checkNum('quarterPrice', r.quarterPrice);
          checkStr('ingredients', r.ingredients);
          checkStr('specialNote', r.specialNote);

          return Object.keys(u).length ? updateMenuItem(original.id, u) : null;
        }).filter(Boolean);
        
        await Promise.all(updates);
        
        const count = updates.length;
        const msg = count === 1 
          ? "1 item updated successfully." 
          : (count ? `${count} ${t.updatedCount}` : "No items required updates.");
          
        showNotify(msg, count ? 'success' : 'error');
      }
      if (isUpdate && validRows.some(r => r)) toggleModal('bulkUpdate', false); // Close only if something happened
      else if (!isUpdate) toggleModal('bulkAdd', false);

    } catch (e) { showNotify(e.message, "error"); }
    setIsProcessing(false);
  };

  const handleKey = (e, r, c) => {
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    let nr = r, nc = c;
    if (e.key === "ArrowUp") nr = Math.max(0, r - 1);
    if (e.key === "ArrowDown") nr = Math.min(bulkItems.length - 1, r + 1);
    // Logic for left/right omitted for brevity but keeps focus flow if needed, mostly up/down used in bulk
    cellRefs.current[nr]?.[nc]?.focus();
  };

  // Render Helpers
  const renderBulkTable = (isUpdate) => (
    <div className="flex-grow overflow-hidden rounded-lg border border-gray-200">
      <div className="max-h-[55vh] overflow-y-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-center">{isUpdate ? t.matchStatus : t.status}</th>
              {[t.itemName, t.fullPrice, t.halfPrice, t.quarterPrice, t.ingredients, t.specialNote].map(h => <th key={h} className="px-4 py-3">{h}</th>)}
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {bulkItems.map((row, idx) => {
              const matched = isUpdate && menuItems.some(i => i.name.trim().toLowerCase() === row.name?.trim().toLowerCase());
              const valid = !isUpdate && row.name && row.fullPrice && !isNaN(parseFloat(row.fullPrice));
              const statusColor = isUpdate ? (matched ? (row.fullPrice ? "bg-yellow-500" : "bg-green-500") : "bg-red-500") : (valid ? "bg-green-500" : (row.name ? "bg-red-500" : "bg-gray-300"));
              
              if (!cellRefs.current[idx]) cellRefs.current[idx] = [];

              return (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-center"><span className={`inline-block w-3 h-3 rounded-full ${statusColor}`}></span></td>
                  {['name', 'fullPrice', 'halfPrice', 'quarterPrice', 'ingredients', 'specialNote'].map((field, ci) => (
                    <td key={field}>
                      <input
                        ref={el => cellRefs.current[idx][ci] = el}
                        type="text"
                        value={row[field] || ""}
                        placeholder={isUpdate && matched && field !== 'name' ? "no change" : (field.includes('Price') ? '0.00' : '')}
                        onChange={(e) => handleBulkChange(idx, field, e.target.value)}
                        onKeyDown={(e) => handleKey(e, idx, ci)}
                        className="w-full p-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
                      />
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
            {selection.active ? (
              <>
                <button onClick={() => setSelection(p => ({ ...p, items: p.items.length === menuItems.length ? [] : menuItems.map(i => i.id) }))} className="btn-secondary">{selection.items.length === menuItems.length ? t.deselectAll : t.selectAll}</button>
                <button onClick={() => toggleModal('confirm')} disabled={!selection.items.length} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{t.delete}</button>
                <button onClick={() => setSelection({ active: false, items: [], deleting: false })} className="btn-secondary">{t.cancel}</button>
              </>
            ) : (
              <>
                <button onClick={() => toggleModal('bulkSelect')} className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-gray-800">{t.bulkActions}</button>
                <button onClick={() => setSelection({ active: true, items: [], deleting: false })} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">{t.selectItems}</button>
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
            <MenuItemCard key={item.id} item={item} selectionMode={selection.active} isSelected={selection.items.includes(item.id)} onSelect={() => toggleSelect(item.id)} currency={settings.currencySymbol} />
          ))}
        </main>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={modals.confirm} onClose={() => toggleModal('confirm', false)}>
        <h2 className="text-2xl font-bold mb-4">{t.confirmDeleteTitle}</h2>
        <p className="text-gray-600 mb-6">{t.confirmDeleteMsg} {selection.items.length} {t.items}</p>
        <div className="flex justify-end gap-4">
          <button onClick={() => toggleModal('confirm', false)} className="px-6 py-2 bg-gray-200 rounded-lg">{t.cancel}</button>
          <button onClick={handleBulkDelete} disabled={selection.deleting} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{selection.deleting ? t.deleting : t.delete}</button>
        </div>
      </Modal>

      {/* Single Add Modal */}
      <Modal isOpen={modals.single} onClose={() => toggleModal('single', false)}>
        <h2 className="text-2xl font-bold mb-5">{t.addItemTitle}</h2>
        <div className="space-y-4">
          {[
            { n: 'name', p: t.itemName }, 
            { n: 'fullPrice', p: t.fullPrice, pre: settings.currencySymbol },
            { n: 'halfPrice', p: t.halfPrice, pre: settings.currencySymbol },
            { n: 'quarterPrice', p: t.quarterPrice, pre: settings.currencySymbol },
            { n: 'ingredients', p: t.ingredients },
            { n: 'specialNote', p: t.specialNote }
          ].map(f => (
            <div key={f.n} className="relative">
              {f.pre && <span className="absolute left-3 top-2.5 text-gray-500">{f.pre}</span>}
              <input 
                name={f.n} 
                value={newItem[f.n]} 
                onChange={e => setNewItem(p => ({ ...p, [e.target.name]: e.target.value }))} 
                placeholder={f.p} 
                className={`w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${f.pre ? 'pl-8' : ''}`} 
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={handleAddItem} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold">{t.done}</button>
        </div>
      </Modal>

      {/* Bulk Select Modal */}
      <Modal isOpen={modals.bulkSelect} onClose={() => toggleModal('bulkSelect', false)}>
        <h2 className="text-2xl font-bold mb-4">{t.bulkActionTitle}</h2>
        <p className="text-gray-600 mb-6">{t.bulkActionSubtitle}</p>
        <div className="space-y-4">
          <button onClick={() => initBulk('bulkAdd')} className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">{t.addNewItemsBtn}</button>
          <button onClick={() => initBulk('bulkUpdate')} className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">{t.updateExistingBtn}</button>
        </div>
      </Modal>

      {/* Shared Bulk Modal (Add & Update) */}
      {(modals.bulkAdd || modals.bulkUpdate) && (
        <Modal isOpen={true} onClose={() => { toggleModal('bulkAdd', false); toggleModal('bulkUpdate', false); }} size="5xl">
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">{modals.bulkAdd ? t.bulkAddTitle : t.bulkUpdateTitle}</h2>
              <p className="text-gray-600 mt-1">{modals.bulkAdd ? t.bulkAddSubtitle : t.bulkUpdateSubtitle}</p>
            </div>
            {renderBulkTable(modals.bulkUpdate)}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6">
              <div className="flex gap-2">
                <button onClick={() => setBulkItems(p => [...p, { name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" }])} className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 font-semibold">{t.addRow}</button>
                <button onClick={() => setBulkItems(modals.bulkAdd ? [{ name: "", fullPrice: "" }] : [])} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">{t.clearAll}</button>
              </div>
              <button onClick={() => handleBulkSubmit(modals.bulkUpdate)} disabled={isProcessing} className={`px-6 py-2.5 rounded-lg text-white font-semibold w-32 ${isProcessing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isProcessing ? (modals.bulkUpdate ? t.updating : t.adding) : (modals.bulkUpdate ? t.updateItems : t.addItems)}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Menu;