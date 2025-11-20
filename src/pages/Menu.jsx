// src/pages/Menu.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { addMenuItem, onMenuItemsRealtime, deleteMenuItemsInBulk, getSettings } from "../firebase/firebase";
import Modal from "../components/Modal";
import MenuItemCard from "../components/MenuItemCard";
import { Plus, Trash2, CheckSquare, Square, X, MoreHorizontal, Save, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

// --- Dictionary ---
const I18N = {
  en: { title: "Menu Management", sub: "Organize your cuisine catalog.", sel: "Selected", del: "Delete", cancel: "Cancel", bulk: "Bulk Editor", select: "Select", add: "Add Item", confirm: "Confirm Delete?", warn: "irreversible action.", name: "Item Name", full: "Full Price", half: "Half Price", qtr: "Qtr Price", ing: "Ingredients", note: "Note", done: "Save", status: "Status", row: "+ Row", clear: "Reset", saving: "Saving..." },
  hi: { title: "मेनू प्रबंधन", sub: "अपने व्यंजनों को व्यवस्थित करें।", sel: "चयनित", del: "हटाएं", cancel: "रद्द", bulk: "थोक संपादक", select: "चयन", add: "नया जोड़ें", confirm: "हटाने की पुष्टि?", warn: "यह कार्रवाई स्थायी है।", name: "नाम", full: "पूर्ण मूल्य", half: "आधा मूल्य", qtr: "चौथाई मूल्य", ing: "सामग्री", note: "नोट", done: "सहेजें", status: "स्थिति", row: "+ पंक्ति", clear: "रीसेट", saving: "सहेजा जा रहा है..." },
  es: { title: "Gestión de Menú", sub: "Organiza tu catálogo.", sel: "Selec.", del: "Eliminar", cancel: "Cancelar", bulk: "Editor Masivo", select: "Selec.", add: "Agregar", confirm: "¿Eliminar?", warn: "Acción irreversible.", name: "Nombre", full: "Precio Completo", half: "Precio Medio", qtr: "Precio Cuarto", ing: "Ingredientes", note: "Nota", done: "Guardar", status: "Estado", row: "+ Fila", clear: "Reiniciar", saving: "Guardando..." },
  ar: { title: "إدارة القائمة", sub: "تنظيم كتالوج المأكولات.", sel: "محدد", del: "حذف", cancel: "إلغاء", bulk: "محرر جماعي", select: "تحديد", add: "إضافة", confirm: "تأكيد الحذف؟", warn: "إجراء لا رجعة فيه.", name: "الاسم", full: "سعر كامل", half: "نصف سعر", qtr: "ربع سعر", ing: "مكونات", note: "ملاحظة", done: "حفظ", status: "الحالة", row: "+ صف", clear: "إعادة تعيين", saving: "جاري الحفظ..." },
  fr: { title: "Gestion Menu", sub: "Organisez votre catalogue.", sel: "Sélec.", del: "Supprimer", cancel: "Annuler", bulk: "Éditeur de masse", select: "Sélec.", add: "Ajouter", confirm: "Supprimer ?", warn: "Action irréversible.", name: "Nom", full: "Prix Plein", half: "Prix Demi", qtr: "Prix Quart", ing: "Ingrédients", note: "Note", done: "Sauver", status: "Statut", row: "+ Ligne", clear: "Réinitialiser", saving: "Sauvegarde..." }
};

const Menu = () => {
  // --- State Management ---
  const [config, setConfig] = useState({ cur: '₹', lang: 'en' });
  const [data, setData] = useState([]);
  const [ui, setUi] = useState({ modal: false, bulkModal: false, selMode: false, selIds: [], deleting: false, processing: false });
  const [notify, setNotify] = useState({ show: false, msg: '', type: 'info' });
  
  // Form States
  const [single, setSingle] = useState({ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" });
  const [bulk, setBulk] = useState([{ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" }]);
  
  const cellRefs = useRef([]);
  const t = useMemo(() => I18N[config.lang] || I18N.en, [config.lang]);
  const isRTL = config.lang === 'ar';

  // --- Init & Realtime ---
  useEffect(() => {
    getSettings().then(s => s && setConfig({ cur: s.currencySymbol || '₹', lang: s.language || 'en' })).catch(console.error);
    return onMenuItemsRealtime(items => setData(items || []));
  }, []);

  // --- Helpers ---
  const toast = useCallback((msg, type = 'success') => {
    setNotify({ show: true, msg, type });
    setTimeout(() => setNotify(p => ({ ...p, show: false })), 3000);
  }, []);

  const toggleId = (id) => setUi(p => ({ ...p, selIds: p.selIds.includes(id) ? p.selIds.filter(x => x !== id) : [...p.selIds, id] }));
  const selectAll = () => setUi(p => ({ ...p, selIds: p.selIds.length === data.length ? [] : data.map(i => i.id) }));
  const closeAll = () => setUi(p => ({ ...p, modal: false, bulkModal: false, selMode: false, selIds: [] }));

  // --- Actions ---
  const handleAdd = async () => {
    if (!single.name || !single.fullPrice) return toast("Name & Full Price required", "error");
    try {
      await addMenuItem({ ...single, fullPrice: parseFloat(single.fullPrice), halfPrice: parseFloat(single.halfPrice)||null, quarterPrice: parseFloat(single.quarterPrice)||null });
      setSingle({ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" });
      setUi(p => ({ ...p, modal: false }));
      toast("Item added successfully");
    } catch (e) { toast("Failed to add item", "error"); }
  };

  const handleDelete = async () => {
    if (!ui.selIds.length) return;
    setUi(p => ({ ...p, deleting: true }));
    try {
      await deleteMenuItemsInBulk(ui.selIds);
      toast(`Deleted ${ui.selIds.length} items`);
      closeAll();
    } catch (e) { toast("Deletion failed", "error"); }
    finally { setUi(p => ({ ...p, deleting: false })); }
  };

  const handleBulkSave = async () => {
    const validRows = bulk.filter(r => r.name && !isNaN(parseFloat(r.fullPrice))).map(r => ({
      ...r, fullPrice: parseFloat(r.fullPrice), halfPrice: parseFloat(r.halfPrice)||null, quarterPrice: parseFloat(r.quarterPrice)||null
    }));
    if (!validRows.length) return toast("No valid rows to add", "warn");

    setUi(p => ({ ...p, processing: true }));
    try {
      await Promise.all(validRows.map(r => addMenuItem(r)));
      setBulk([{ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" }]);
      setUi(p => ({ ...p, bulkModal: false, processing: false }));
      toast(`Added ${validRows.length} items`);
    } catch (e) { 
      setUi(p => ({ ...p, processing: false }));
      toast("Bulk add partial failure", "error"); 
    }
  };

  // --- Bulk Grid Logic ---
  const gridNav = (e, r, c) => {
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const tr = Math.min(Math.max(0, r + (e.key==='ArrowUp'?-1:(e.key==='ArrowDown'?1:0))), bulk.length-1);
    const tc = Math.min(Math.max(0, c + (e.key==='ArrowLeft'?-1:(e.key==='ArrowRight'?1:0))), 5);
    cellRefs.current[tr]?.[tc]?.current?.focus();
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Toast */}
      {notify.show && (
        <div className={`fixed top-5 right-5 z-[60] flex items-center p-4 rounded-lg shadow-xl border animate-in fade-in slide-in-from-top-5 ${notify.type==='error'?'bg-red-50 border-red-200 text-red-800':'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          {notify.type==='error' ? <AlertCircle className="w-5 h-5 mr-2"/> : <CheckCircle className="w-5 h-5 mr-2"/>}
          <span className="font-medium text-sm">{notify.msg}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {ui.selMode ? <span className="text-blue-600">{ui.selIds.length} {t.sel}</span> : t.title}
          </h1>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{ui.selMode ? t.selectSubtitle : t.sub}</p>
        </div>
        <div className="flex items-center gap-3">
          {ui.selMode ? (
            <>
              <button onClick={selectAll} className="btn-secondary flex items-center gap-2">
                {ui.selIds.length === data.length ? <CheckSquare size={16}/> : <Square size={16}/>} {t.sel}
              </button>
              <button onClick={handleDelete} disabled={!ui.selIds.length || ui.deleting} className="btn-danger">
                {ui.deleting ? <Loader2 className="animate-spin" size={16}/> : <Trash2 size={16}/>} {t.del}
              </button>
              <button onClick={closeAll} className="btn-ghost">{t.cancel}</button>
            </>
          ) : (
            <>
              <button onClick={() => setUi(p => ({...p, bulkModal: true}))} className="btn-secondary hidden sm:flex">{t.bulk}</button>
              <button onClick={() => setUi(p => ({...p, selMode: true}))} className="btn-secondary">{t.select}</button>
              <button onClick={() => setUi(p => ({...p, modal: true}))} className="btn-primary">
                <Plus size={18} className={isRTL?"ml-1":"mr-1"}/> {t.add}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Content Grid */}
      <main className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {!ui.selMode && (
          <div onClick={() => setUi(p => ({...p, modal: true}))} className="group border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center h-48 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="text-slate-400 group-hover:text-blue-600" size={24} />
            </div>
            <span className="mt-3 font-semibold text-slate-500 group-hover:text-blue-700">{t.add}</span>
          </div>
        )}
        {data.map(item => (
          <MenuItemCard 
            key={item.id} 
            item={item} 
            selectionMode={ui.selMode} 
            isSelected={ui.selIds.includes(item.id)} 
            onSelect={() => toggleId(item.id)} 
            currency={config.cur} 
          />
        ))}
      </main>

      {/* Add Single Item Modal */}
      <Modal isOpen={ui.modal} onClose={() => setUi(p => ({...p, modal: false}))} size="md">
        <div className="p-1">
          <h2 className="text-xl font-bold text-slate-800 mb-6">{t.add}</h2>
          <div className="space-y-4">
            <input name="name" value={single.name} onChange={e => setSingle({...single, name: e.target.value})} placeholder={t.name} className="input-field font-medium" autoFocus />
            <div className="grid grid-cols-3 gap-3">
              <div className="relative"><span className="absolute top-2.5 left-3 text-slate-400 text-sm">{config.cur}</span><input name="fullPrice" type="number" value={single.fullPrice} onChange={e => setSingle({...single, fullPrice: e.target.value})} placeholder={t.full} className="input-field pl-7" /></div>
              <div className="relative"><span className="absolute top-2.5 left-3 text-slate-400 text-sm">{config.cur}</span><input name="halfPrice" type="number" value={single.halfPrice} onChange={e => setSingle({...single, halfPrice: e.target.value})} placeholder={t.half} className="input-field pl-7" /></div>
              <div className="relative"><span className="absolute top-2.5 left-3 text-slate-400 text-sm">{config.cur}</span><input name="quarterPrice" type="number" value={single.quarterPrice} onChange={e => setSingle({...single, quarterPrice: e.target.value})} placeholder={t.qtr} className="input-field pl-7" /></div>
            </div>
            <input name="ingredients" value={single.ingredients} onChange={e => setSingle({...single, ingredients: e.target.value})} placeholder={t.ing} className="input-field" />
            <textarea name="specialNote" value={single.specialNote} onChange={e => setSingle({...single, specialNote: e.target.value})} placeholder={t.note} rows={3} className="input-field resize-none" />
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setUi(p => ({...p, modal: false}))} className="btn-ghost">{t.cancel}</button>
            <button onClick={handleAdd} className="btn-primary w-32">{t.done}</button>
          </div>
        </div>
      </Modal>

      {/* Bulk Modal */}
      <Modal isOpen={ui.bulkModal} onClose={() => setUi(p => ({...p, bulkModal: false}))} size="5xl">
        <div className="flex flex-col h-[80vh]">
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{t.bulk}</h2>
              <p className="text-xs text-slate-500">{t.sub}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBulk([{ name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" }])} className="btn-ghost text-xs">{t.clear}</button>
              <button onClick={() => setBulk([...bulk, { name: "", fullPrice: "", halfPrice: "", quarterPrice: "", ingredients: "", specialNote: "" }])} className="btn-secondary text-xs">{t.row}</button>
              <button onClick={handleBulkSave} disabled={ui.processing} className="btn-primary text-xs px-6">
                {ui.processing ? <Loader2 className="animate-spin mr-2" size={14}/> : <Save size={14} className="mr-2"/>} {ui.processing ? t.saving : t.done}
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto bg-slate-50 border rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-3 py-2 w-8 text-center">#</th>
                  <th className="px-3 py-2">{t.name}*</th>
                  <th className="px-3 py-2 w-24">{t.full}*</th>
                  <th className="px-3 py-2 w-24">{t.half}</th>
                  <th className="px-3 py-2 w-24">{t.qtr}</th>
                  <th className="px-3 py-2 w-1/4">{t.ing}</th>
                  <th className="px-3 py-2 w-1/5">{t.note}</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {bulk.map((r, i) => {
                  if (!cellRefs.current[i]) cellRefs.current[i] = [];
                  const status = (!r.name && !r.fullPrice) ? 'neutral' : (r.name && !isNaN(parseFloat(r.fullPrice))) ? 'valid' : 'invalid';
                  return (
                    <tr key={i} className="hover:bg-blue-50/30 group transition-colors">
                      <td className="px-2 text-center">
                        <div className={`w-2 h-2 rounded-full mx-auto ${status==='valid'?'bg-emerald-500':status==='invalid'?'bg-rose-500':'bg-slate-300'}`}/>
                      </td>
                      {['name','fullPrice','halfPrice','quarterPrice','ingredients','specialNote'].map((f, ci) => (
                        <td key={f} className="p-1">
                          <input
                            ref={el => cellRefs.current[i][ci] = { current: el }}
                            value={r[f]}
                            onChange={e => { const nb=[...bulk]; nb[i][f]=e.target.value; setBulk(nb); }}
                            onKeyDown={e => gridNav(e, i, ci)}
                            className="w-full bg-transparent p-1.5 rounded border border-transparent focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-700 placeholder-slate-300"
                            placeholder={ci===1?config.cur:'-'}
                          />
                        </td>
                      ))}
                      <td className="text-center">
                        <button onClick={() => setBulk(bulk.filter((_,idx) => idx!==i))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"><X size={14}/></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .btn-primary { @apply px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-sm flex items-center justify-center; }
        .btn-secondary { @apply px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg font-medium transition-all text-sm shadow-sm; }
        .btn-danger { @apply px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-lg font-medium transition-all text-sm flex items-center gap-2; }
        .btn-ghost { @apply px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-all text-sm; }
        .input-field { @apply w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-slate-400; }
      `}</style>
    </div>
  );
};

export default Menu;