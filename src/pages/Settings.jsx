// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../firebase/firebase';
import { getTranslation, LANGUAGES, CURRENCIES } from '../translations'; // <-- UPDATED IMPORT

import { 
  Store, 
  Globe, 
  Printer, 
  Keyboard, 
  Info, 
  Save, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';

// --- Constants (Now imported or kept if non-translated) ---
const SHORTCUTS_MAP = [
  { category: 'Orders', keys: 'F3', action: 'New Dine-In Order' },
  { category: 'Orders', keys: 'F4', action: 'New Takeaway Order' },
  { category: 'Payment', keys: 'F7', action: 'Set Payment: Cash' },
  { category: 'Payment', keys: 'F8', action: 'Set Payment: Card' },
  { category: 'Payment', keys: 'F9', action: 'Set Payment: UPI' },
  { category: 'System', keys: 'Ctrl + P', action: 'Finalize & Print Bill' },
  { category: 'Navigation', keys: '↑ / ↓', action: 'Navigate Tables' },
  { category: 'Navigation', keys: 'Enter', action: 'Select Table' },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // State for Translations (Dynamically loaded)
  const [t, setT] = useState(getTranslation('en')); // Initialize with English
  const isRTL = t.language === 'ar'; // Determine RTL direction for styling

  const [formData, setFormData] = useState({
    // General
    restaurantName: '',
    address: '',
    upiId: '',
    // Localization
    currencySymbol: '₹',
    currencyCode: 'INR',
    language: 'en',
    // Printing
    printWidth: '80mm', // 58mm or 80mm
    printFontSize: 'normal', // small, normal, large
    receiptFooter: 'Thank you for visiting!',
    showLogo: true,
  });

  const showNotify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Load Settings from Firebase ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getSettings();
        if (data) {
          const lang = data.language || 'en';
          // Set translation based on loaded language
          setT(getTranslation(lang)); 
          
          // Merge existing settings with defaults (in case new fields were added)
          setFormData(prev => ({ ...prev, ...data, language: lang }));
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        showNotify(getTranslation('en').loadError, "error"); // Use English for load error if translations aren't ready
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'currency') {
      try {
        const { symbol, code } = JSON.parse(value);
        setFormData(prev => ({ ...prev, currencySymbol: symbol, currencyCode: code }));
      } catch (e) {
        console.error("Currency parse error", e);
      }
      return;
    }
    
    // Special handling for language selection to update translation immediately
    if (name === 'language') {
        const newLang = value;
        setT(getTranslation(newLang)); // Update translation object immediately
        setFormData(prev => ({
            ...prev,
            language: newLang
        }));
        return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // --- Save Settings to Firebase ---
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(formData);
      showNotify(t.saveSuccess, "success"); // Use current translation for success message
    } catch (err) {
      console.error("Error saving settings:", err);
      showNotify(t.saveError, "error"); // Use current translation for error message
    } finally {
      setSaving(false);
    }
  };

  // --- Tabs Config (Uses dynamic translations) ---
  const tabs = [
    { id: 'general', label: t.tabGeneral, icon: Store },
    { id: 'localization', label: t.tabLocalization, icon: Globe },
    { id: 'printing', label: t.tabPrinting, icon: Printer },
    { id: 'shortcuts', label: t.tabShortcuts, icon: Keyboard },
    { id: 'about', label: t.tabAbout, icon: Info },
  ];

  // --- Render Helper ---
  const InputGroup = ({ label, subLabel, children }) => (
    <div className={`mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
      {subLabel && <p className="text-xs text-gray-500 mb-2">{subLabel}</p>}
      {children}
    </div>
  );

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">{t.loading}</p>
        </div>
    </div>
  );

  return (
    <div className={`container mx-auto max-w-6xl py-8 px-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t.settingsTitle}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.settingsSubtitle}</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className={`flex items-center justify-center px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl active:scale-95'}`}
        >
          {saving ? (
            <span className="flex items-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> {t.saving}</span>
          ) : (
            <><Save className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t.saveChanges}</>
          )}
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-5 ${isRTL ? 'left-5' : 'right-5'} z-50 flex items-center p-4 rounded-lg shadow-xl border ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} animate-in fade-in slide-in-from-top-5 duration-300`}>
          {notification.type === 'success' ? <CheckCircle className={`w-5 h-5 ${isRTL ? 'ml-3' : 'mr-3'}`}/> : <AlertCircle className={`w-5 h-5 ${isRTL ? 'ml-3' : 'mr-3'}`}/>}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-5 py-4 transition-all duration-200 border-l-4 ${isRTL ? 'text-right justify-end border-r-4 border-l-0' : 'text-left border-l-4'} ${isActive ? 'bg-blue-50 text-blue-700 border-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 border-transparent hover:text-gray-900'}`}
                >
                  {isRTL ? (
                    <>
                      {tab.label}
                      <Icon className={`w-5 h-5 ml-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    </>
                  ) : (
                    <>
                      <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      {tab.label}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8 min-h-[600px]">
          
          {/* --- TAB: GENERAL --- */}
          {activeTab === 'general' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
                  <Store className={`w-6 h-6 text-blue-600 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  <h2 className="text-xl font-bold text-gray-800">{t.generalTitle}</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <InputGroup label={t.restaurantName}>
                   <input type="text" name="restaurantName" value={formData.restaurantName} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder={t.restaurantNamePlaceholder} dir="auto" />
                </InputGroup>

                <InputGroup label={t.address} subLabel={t.addressSubtitle}>
                   <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder={t.addressPlaceholder} dir="auto" />
                </InputGroup>

                <InputGroup label={t.upiId} subLabel={t.upiIdSubtitle}>
                   <div className="relative">
                       <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} className={`w-full p-3 ${isRTL ? 'pr-10' : 'pl-10'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all`} placeholder="username@bank" dir="auto" />
                       <div className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3.5 text-gray-400 font-bold`}>@</div>
                   </div>
                </InputGroup>
              </div>
            </div>
          )}

          {/* --- TAB: LOCALIZATION --- */}
          {activeTab === 'localization' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
                  <Globe className={`w-6 h-6 text-blue-600 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  <h2 className="text-xl font-bold text-gray-800">{t.localizationTitle}</h2>
              </div>

              <div className="max-w-lg">
                <InputGroup label={t.appLanguage} subLabel={t.appLanguageSubtitle}>
                   <select name="language" value={formData.language} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white outline-none">
                     {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                   </select>
                </InputGroup>

                <InputGroup label={t.defaultCurrency} subLabel={t.defaultCurrencySubtitle}>
                   <select
                      name="currency"
                      value={JSON.stringify({ symbol: formData.currencySymbol, code: formData.currencyCode })}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white outline-none"
                   >
                     {CURRENCIES.map(({symbol, code, name}) => (
                       <option key={code} value={JSON.stringify({ symbol, code })}>{name} ({symbol})</option>
                     ))}
                   </select>
                </InputGroup>
              </div>
            </div>
          )}

          {/* --- TAB: PRINTING --- */}
          {activeTab === 'printing' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
                  <Printer className={`w-6 h-6 text-blue-600 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  <h2 className="text-xl font-bold text-gray-800">{t.printingTitle}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <InputGroup label={t.paperSize} subLabel={t.paperSizeSubtitle}>
                      <div className="flex gap-4 mt-2">
                        {['58mm', '80mm'].map(size => (
                          <label key={size} className={`flex-1 flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.printWidth === size ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                             <input type="radio" name="printWidth" value={size} checked={formData.printWidth === size} onChange={handleChange} className="hidden" />
                             <Printer className={`w-8 h-8 mb-2 ${formData.printWidth === size ? 'text-blue-600' : 'text-gray-400'}`} />
                             <span className={`font-bold ${formData.printWidth === size ? 'text-blue-800' : 'text-gray-600'}`}>{size}</span>
                          </label>
                        ))}
                      </div>
                   </InputGroup>
                </div>

                <div>
                   <InputGroup label={t.fontDensity} subLabel={t.fontDensitySubtitle}>
                       <div className="flex gap-2 mt-2 bg-gray-100 p-1 rounded-lg">
                          {['small', 'normal', 'large'].map(size => (
                             <button
                               key={size}
                               onClick={() => setFormData(prev => ({...prev, printFontSize: size}))}
                               className={`flex-1 py-2 rounded-md text-sm font-medium capitalize transition-all ${formData.printFontSize === size ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                             >
                               {size}
                             </button>
                          ))}
                       </div>
                       <div className="mt-3 p-3 border border-dashed rounded text-center text-gray-400 text-xs">
                          Preview: <span className={formData.printFontSize === 'large' ? 'text-lg' : formData.printFontSize === 'small' ? 'text-xs' : 'text-sm'}>Total: {formData.currencySymbol}150.00</span>
                       </div>
                   </InputGroup>
                </div>

                <div className="md:col-span-2">
                    <InputGroup label={t.footerMessage} subLabel={t.footerMessageSubtitle}>
                        <input type="text" name="receiptFooter" value={formData.receiptFooter} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" dir="auto" />
                    </InputGroup>
                </div>

                <div className="md:col-span-2">
                     <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="checkbox" name="showLogo" checked={formData.showLogo} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                        <div className={`ml-4 ${isRTL ? 'mr-4 ml-0' : ''}`}>
                            <span className="block font-bold text-gray-800">{t.showLogo}</span>
                            <span className="block text-sm text-gray-500">{t.showLogoSubtitle}</span>
                        </div>
                     </label>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: SHORTCUTS --- */}
          {activeTab === 'shortcuts' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
                  <Keyboard className={`w-6 h-6 text-blue-600 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  <h2 className="text-xl font-bold text-gray-800">{t.shortcutsTitle}</h2>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                       <tr className={isRTL ? 'rtl' : 'ltr'}>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">{t.shortcutsKey}</th>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">{t.shortcutsAction}</th>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">{t.shortcutsCategory}</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {SHORTCUTS_MAP.map((item, idx) => (
                          <tr key={idx} className="hover:bg-blue-50 transition-colors">
                             <td className="p-4">
                                <span className="inline-block px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono font-bold text-gray-700 shadow-sm">
                                   {item.keys}
                                </span>
                             </td>
                             <td className="p-4 text-sm font-medium text-gray-800">{item.action}</td>
                             <td className="p-4 text-sm text-gray-500">{item.category}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </div>
          )}

          {/* --- TAB: ABOUT --- */}
          {activeTab === 'about' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center justify-center py-10">
               {/* Updated App Icon Section */}
               <div className="w-32 h-32 bg-white rounded-2xl shadow-2xl flex items-center justify-center mb-6 transform rotate-3 border border-gray-100 overflow-hidden">
                  <img src="/favicon.ico" alt="App Icon" className="w-full h-full object-contain p-4" />
               </div>
               <h2 className="text-3xl font-extrabold text-gray-900">MealiX POS</h2>
               <span className="inline-block px-3 py-1 mt-3 text-xs font-bold text-blue-800 bg-blue-100 rounded-full">Version 3.6.0</span>
               
               <p className="text-gray-500 mt-6 max-w-md text-center leading-relaxed">
                  {t.appSlogan}
               </p>

               <div className="mt-10 p-6 bg-blue-50 rounded-xl border border-blue-100 max-w-lg text-center">
                 <p className="text-lg font-serif italic text-blue-900">"Palestine is the anvil of our consciousness."</p>
                 <p className="text-sm text-blue-600 mt-3 font-semibold">— Edward Said</p>
               </div>

               <div className="mt-12 pt-8 border-t border-gray-100 w-full text-center">
                 <p className="text-xs text-gray-400">
                   System ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} <br/>
                   © {new Date().getFullYear()} All Rights Reserved.
                 </p>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;