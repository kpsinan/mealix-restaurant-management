// src/pages/Menu.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  addMenuItem,
  onMenuItemsRealtime,
  deleteMenuItemsInBulk,
  getSettings // <-- Import getSettings
} from "../firebase/firebase";
import Modal from "../components/Modal";
import MenuItemCard from "../components/MenuItemCard";

// --- Translations Configuration ---
const TRANSLATIONS = {
  en: {
    menuTitle: "Menu",
    menuSubtitle: "Manage your restaurant's menu items.",
    selected: "selected",
    selectSubtitle: "Select items from the list below to delete.",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    delete: "Delete",
    cancel: "Cancel",
    bulkActions: "Bulk Actions",
    selectItems: "Select Items",
    addNewItem: "Add New Item",
    confirmDeleteTitle: "Confirm Deletion",
    confirmDeleteMsg: "Are you sure you want to permanently delete",
    items: "item(s)? This action cannot be undone.",
    deleting: "Deleting...",
    addItemTitle: "Add New Menu Item",
    itemName: "Item Name",
    fullPrice: "Full Portion Price",
    halfPrice: "Half Portion Price",
    quarterPrice: "Quarter Portion Price",
    ingredients: "Ingredients (comma-separated)",
    specialNote: "Special Note (optional)",
    done: "Done",
    bulkActionTitle: "Bulk Actions",
    bulkActionSubtitle: "Add multiple new items using a spreadsheet-like interface.",
    addNewItemsBtn: "Add New Items",
    updateExistingBtn: "Update Existing Items",
    bulkAddTitle: "Bulk Add New Items",
    bulkAddSubtitle: "Use arrow keys to navigate. Rows missing a name or valid price for the full portion will be skipped.",
    status: "Status",
    addRow: "+ Add Row",
    clearAll: "Clear All",
    addItems: "Add Items",
    adding: "Adding..."
  },
  hi: {
    menuTitle: "मेनू (Menu)",
    menuSubtitle: "अपने रेस्तरां के मेनू आइटम प्रबंधित करें।",
    selected: "चयनित",
    selectSubtitle: "हटाने के लिए नीचे दी गई सूची से आइटम चुनें।",
    selectAll: "सभी चुनें",
    deselectAll: "सभी अचयनित करें",
    delete: "हटाएं",
    cancel: "रद्द करें",
    bulkActions: "थोक क्रियाएं",
    selectItems: "आइटम चुनें",
    addNewItem: "नया आइटम जोड़ें",
    confirmDeleteTitle: "हटाने की पुष्टि करें",
    confirmDeleteMsg: "क्या आप वाकई हटाना चाहते हैं",
    items: "आइटम? यह कार्रवाई पूर्ववत नहीं की जा सकती।",
    deleting: "हटा रहा है...",
    addItemTitle: "नया मेनू आइटम जोड़ें",
    itemName: "आइटम का नाम",
    fullPrice: "पूर्ण हिस्से की कीमत",
    halfPrice: "आधे हिस्से की कीमत",
    quarterPrice: "चौथाई हिस्से की कीमत",
    ingredients: "सामग्री (अल्पविराम से अलग)",
    specialNote: "विशेष नोट (वैकल्पिक)",
    done: "हो गया",
    bulkActionTitle: "थोक क्रियाएं",
    bulkActionSubtitle: "स्प्रेडशीट जैसे इंटरफ़ेस का उपयोग करके कई नए आइटम जोड़ें।",
    addNewItemsBtn: "नए आइटम जोड़ें",
    updateExistingBtn: "मौजूदा आइटम अपडेट करें",
    bulkAddTitle: "थोक में नए आइटम जोड़ें",
    bulkAddSubtitle: "नेविगेट करने के लिए तीर कुंजियों का उपयोग करें।",
    status: "स्थिति",
    addRow: "+ पंक्ति जोड़ें",
    clearAll: "सभी साफ़ करें",
    addItems: "आइटम जोड़ें",
    adding: "जोड़ रहा है..."
  },
  es: {
    menuTitle: "Menú",
    menuSubtitle: "Administra los elementos del menú de tu restaurante.",
    selected: "seleccionado",
    selectSubtitle: "Selecciona elementos de la lista para eliminar.",
    selectAll: "Seleccionar todo",
    deselectAll: "Deseleccionar todo",
    delete: "Eliminar",
    cancel: "Cancelar",
    bulkActions: "Acciones masivas",
    selectItems: "Seleccionar elementos",
    addNewItem: "Agregar nuevo artículo",
    confirmDeleteTitle: "Confirmar eliminación",
    confirmDeleteMsg: "¿Estás seguro de que quieres eliminar",
    items: "elemento(s)? Esta acción no se puede deshacer.",
    deleting: "Eliminando...",
    addItemTitle: "Agregar nuevo elemento al menú",
    itemName: "Nombre del artículo",
    fullPrice: "Precio porción completa",
    halfPrice: "Precio media porción",
    quarterPrice: "Precio cuarto de porción",
    ingredients: "Ingredientes (separados por comas)",
    specialNote: "Nota especial (opcional)",
    done: "Hecho",
    bulkActionTitle: "Acciones masivas",
    bulkActionSubtitle: "Agrega múltiples elementos nuevos usando una interfaz tipo hoja de cálculo.",
    addNewItemsBtn: "Agregar nuevos elementos",
    updateExistingBtn: "Actualizar elementos existentes",
    bulkAddTitle: "Agregar nuevos elementos en masa",
    bulkAddSubtitle: "Usa las teclas de flecha para navegar.",
    status: "Estado",
    addRow: "+ Agregar fila",
    clearAll: "Borrar todo",
    addItems: "Agregar elementos",
    adding: "Agregando..."
  },
  ar: {
    menuTitle: "القائمة",
    menuSubtitle: "إدارة عناصر قائمة المطعم الخاصة بك.",
    selected: "محدد",
    selectSubtitle: "حدد عناصر من القائمة أدناه لحذفها.",
    selectAll: "تحديد الكل",
    deselectAll: "إلغاء تحديد الكل",
    delete: "حذف",
    cancel: "إلغاء",
    bulkActions: "إجراءات جماعية",
    selectItems: "تحديد العناصر",
    addNewItem: "إضافة عنصر جديد",
    confirmDeleteTitle: "تأكيد الحذف",
    confirmDeleteMsg: "هل أنت متأكد أنك تريد حذف",
    items: "عنصر (عناصر)؟ لا يمكن التراجع عن هذا الإجراء.",
    deleting: "جاري الحذف...",
    addItemTitle: "إضافة عنصر قائمة جديد",
    itemName: "اسم العنصر",
    fullPrice: "سعر الحصة الكاملة",
    halfPrice: "سعر نصف الحصة",
    quarterPrice: "سعر ربع الحصة",
    ingredients: "المكونات (مفصولة بفواصل)",
    specialNote: "ملاحظة خاصة (اختياري)",
    done: "تم",
    bulkActionTitle: "إجراءات جماعية",
    bulkActionSubtitle: "إضافة عناصر جديدة متعددة.",
    addNewItemsBtn: "إضافة عناصر جديدة",
    updateExistingBtn: "تحديث العناصر الموجودة",
    bulkAddTitle: "إضافة عناصر جديدة بالجملة",
    bulkAddSubtitle: "استخدم مفاتيح الأسهم للتنقل.",
    status: "الحالة",
    addRow: "+ إضافة صف",
    clearAll: "مسح الكل",
    addItems: "إضافة العناصر",
    adding: "جاري الإضافة..."
  },
  fr: {
    menuTitle: "Menu",
    menuSubtitle: "Gérez les éléments de menu de votre restaurant.",
    selected: "sélectionné",
    selectSubtitle: "Sélectionnez des éléments dans la liste ci-dessous pour les supprimer.",
    selectAll: "Tout sélectionner",
    deselectAll: "Tout désélectionner",
    delete: "Supprimer",
    cancel: "Annuler",
    bulkActions: "Actions en masse",
    selectItems: "Sélectionner des éléments",
    addNewItem: "Ajouter un nouvel élément",
    confirmDeleteTitle: "Confirmer la suppression",
    confirmDeleteMsg: "Êtes-vous sûr de vouloir supprimer définitivement",
    items: "élément(s) ? Cette action est irréversible.",
    deleting: "Suppression...",
    addItemTitle: "Ajouter un nouvel élément de menu",
    itemName: "Nom de l'élément",
    fullPrice: "Prix portion complète",
    halfPrice: "Prix demi-portion",
    quarterPrice: "Prix quart de portion",
    ingredients: "Ingrédients (séparés par des virgules)",
    specialNote: "Note spéciale (facultatif)",
    done: "Terminé",
    bulkActionTitle: "Actions en masse",
    bulkActionSubtitle: "Ajoutez plusieurs nouveaux éléments à l'aide d'une interface de type feuille de calcul.",
    addNewItemsBtn: "Ajouter de nouveaux éléments",
    updateExistingBtn: "Mettre à jour les éléments existants",
    bulkAddTitle: "Ajout en masse",
    bulkAddSubtitle: "Utilisez les touches fléchées pour naviguer.",
    status: "Statut",
    addRow: "+ Ajouter une ligne",
    clearAll: "Tout effacer",
    addItems: "Ajouter des éléments",
    adding: "Ajout..."
  }
};

const Menu = () => {
  // --- Settings State ---
  const [appSettings, setAppSettings] = useState({
    currencySymbol: '₹',
    language: 'en'
  });
  const [t, setT] = useState(TRANSLATIONS.en); // Current translations

  // --- Existing State ---
  const [menuItems, setMenuItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAddNewBulkModalOpen, setIsAddNewBulkModalOpen] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [newItem, setNewItem] = useState({ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" });
  const [bulkItems, setBulkItems] = useState([{ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" }]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const cellRefs = useRef([]);

  // --- 1. Fetch Settings on Mount ---
  useEffect(() => {
    const fetchAppSettings = async () => {
      try {
        const settings = await getSettings();
        if (settings) {
          setAppSettings({
            currencySymbol: settings.currencySymbol || '₹',
            language: settings.language || 'en'
          });
          // Set translations based on language
          setT(TRANSLATIONS[settings.language] || TRANSLATIONS.en);
        }
      } catch (error) {
        console.error("Error loading settings in Menu:", error);
      }
    };
    fetchAppSettings();
  }, []);

  // --- Realtime Menu Items ---
  useEffect(() => {
    const unsubscribe = onMenuItemsRealtime((items) => {
      setMenuItems(items || []);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // --- Handlers ---
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
      setSelectedItems([]); 
    } else {
      setSelectedItems(menuItems.map(item => item.id)); 
    }
  };

  const confirmDeletion = async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    try {
      await deleteMenuItemsInBulk(selectedItems);
      // Using browser alert strictly for now, assuming Notification system is in Billing
      // or we can use simple console logs if alerts are annoying
      // alert("Selected items deleted successfully."); 
    } catch (err) {
      console.error("Error deleting items:", err);
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
      handleCancelSelectMode();
    }
  };

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

  // --- Bulk Handlers ---
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
         handleClearRows(); setIsAddNewBulkModalOpen(false);
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
  
  // RTL check for Arabic
  const isRTL = appSettings.language === 'ar';

  return (
    <div className={`bg-gray-50 min-h-screen ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            {selectionMode ? (
              <>
                <h1 className="text-2xl font-bold text-blue-700">{selectedItems.length} {t.selected}</h1>
                <p className="mt-1 text-gray-500">{t.selectSubtitle}</p>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-gray-800">{t.menuTitle}</h1>
                <p className="mt-1 text-gray-500">{t.menuSubtitle}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            {selectionMode ? (
              <>
                <button onClick={handleSelectAll} className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                  {selectedItems.length === menuItems.length ? t.deselectAll : t.selectAll}
                </button>
                <button onClick={() => setShowConfirmModal(true)} disabled={selectedItems.length === 0} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors">
                  {t.delete}
                </button>
                <button onClick={handleCancelSelectMode} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                  {t.cancel}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsBulkModalOpen(true)} className="px-5 py-2.5 text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                  {t.bulkActions}
                </button>
                <button onClick={handleOpenSelectMode} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-all">
                  {t.selectItems}
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
              <span className="mt-3 text-gray-600 font-semibold group-hover:text-blue-700">{t.addNewItem}</span>
            </button>
          )}

          {menuItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              selectionMode={selectionMode}
              isSelected={selectedItems.includes(item.id)}
              onSelect={() => handleSelectItem(item.id)}
              currency={appSettings.currencySymbol} // <-- Passing Currency Prop
            />
          ))}
        </main>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{t.confirmDeleteTitle}</h2>
        <p className="text-gray-600 mb-6">{t.confirmDeleteMsg} {selectedItems.length} {t.items}</p>
        <div className="flex justify-end gap-4">
          <button onClick={() => setShowConfirmModal(false)} className="px-6 py-2 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">{t.cancel}</button>
          <button onClick={confirmDeletion} disabled={isDeleting} className="px-6 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-wait transition-colors">
            {isDeleting ? t.deleting : t.delete}
          </button>
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-2xl font-bold mb-5 text-gray-900">{t.addItemTitle}</h2>
        <div className="space-y-4">
            <input
            type="text"
            name="name"
            value={newItem.name}
            onChange={handleInputChange}
            placeholder={t.itemName}
            className={inputClasses}
            />
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">{appSettings.currencySymbol}</span>
                <input
                type="text"
                name="fullPrice"
                value={newItem.fullPrice}
                onChange={handleInputChange}
                placeholder={t.fullPrice}
                className={`${inputClasses} pl-8`}
                />
            </div>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">{appSettings.currencySymbol}</span>
                <input
                type="text"
                name="halfPrice"
                value={newItem.halfPrice}
                onChange={handleInputChange}
                placeholder={t.halfPrice}
                className={`${inputClasses} pl-8`}
                />
            </div>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">{appSettings.currencySymbol}</span>
                <input
                type="text"
                name="quarterPrice"
                value={newItem.quarterPrice}
                onChange={handleInputChange}
                placeholder={t.quarterPrice}
                className={`${inputClasses} pl-8`}
                />
            </div>
            <input
            type="text"
            name="ingredients"
            value={newItem.ingredients}
            onChange={handleInputChange}
            placeholder={t.ingredients}
            className={inputClasses}
            />
            <textarea
            name="specialNote"
            value={newItem.specialNote}
            onChange={handleInputChange}
            placeholder={t.specialNote}
            rows={3}
            className={inputClasses}
            />
        </div>
        <div className="flex justify-end mt-6">
            <button
            onClick={handleAddItem}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
            {t.done}
            </button>
        </div>
      </Modal>
      
      {/* Bulk Actions Modal */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)}>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{t.bulkActionTitle}</h2>
        <p className="text-gray-600 mb-6">{t.bulkActionSubtitle}</p>
        <div className="space-y-4">
            <button onClick={handleOpenAddNewBulk} className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">{t.addNewItemsBtn}</button>
            <button className="w-full bg-gray-200 text-gray-500 px-6 py-3 rounded-lg transition-colors cursor-not-allowed" disabled>{t.updateExistingBtn}</button>
        </div>
      </Modal>

      {/* Bulk Add Spreadsheet Modal */}
      <Modal isOpen={isAddNewBulkModalOpen} onClose={() => setIsAddNewBulkModalOpen(false)} size="5xl">
        <div className="flex flex-col h-full">
            <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{t.bulkAddTitle}</h2>
            <p className="text-gray-600 mt-1">{t.bulkAddSubtitle}</p>
            </div>

            <div className="flex-grow overflow-hidden rounded-lg border border-gray-200">
            <div className="max-h-[55vh] overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                    <tr>
                    <th className="px-4 py-3 w-1/12 text-center">{t.status}</th>
                    <th className="px-4 py-3 w-2/12">{t.itemName}*</th>
                    <th className="px-4 py-3 w-1/12">{t.fullPrice} ({appSettings.currencySymbol})*</th>
                    <th className="px-4 py-3 w-1/12">{t.halfPrice}</th>
                    <th className="px-4 py-3 w-1/12">{t.quarterPrice}</th>
                    <th className="px-4 py-3 w-2/12">{t.ingredients}</th>
                    <th className="px-4 py-3 w-2/12">{t.specialNote}</th>
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
                            placeholder={t.itemName}
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
                            placeholder="150.00"
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
                            placeholder="80.00"
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
                            placeholder="45.00"
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
                            placeholder="..."
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
                            placeholder="..."
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
                {t.addRow}
                </button>
                <button
                onClick={handleClearRows}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                {t.clearAll}
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
                {isBulkProcessing ? t.adding : t.addItems}
                </button>
            </div>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default Menu;