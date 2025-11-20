// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../firebase/firebase';

import { 
  Store, 
  Globe, 
  Printer, 
  Keyboard, 
  Info, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Monitor
} from 'lucide-react';

// --- Constants ---
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'fr', name: 'French (Français)' },
];

const CURRENCIES = [
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
  { symbol: 'AED', code: 'AED', name: 'UAE Dirham' },
];

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
          // Merge existing settings with defaults (in case new fields were added)
          setFormData(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        showNotify("Failed to load settings from database.", "error");
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
      showNotify("Settings saved permanently!", "success");
    } catch (err) {
      console.error("Error saving settings:", err);
      showNotify("Failed to save settings. Check internet connection.", "error");
    } finally {
      setSaving(false);
    }
  };

  // --- Tabs Config ---
  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'localization', label: 'Language & Currency', icon: Globe },
    { id: 'printing', label: 'Print & Receipt', icon: Printer },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
    { id: 'about', label: 'About App', icon: Info },
  ];

  // --- Render Helper ---
  const InputGroup = ({ label, subLabel, children }) => (
    <div className="mb-6">
      <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
      {subLabel && <p className="text-xs text-gray-500 mb-2">{subLabel}</p>}
      {children}
    </div>
  );

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Loading Preferences...</p>
        </div>
    </div>
  );

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure your POS system parameters</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className={`flex items-center justify-center px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl active:scale-95'}`}
        >
          {saving ? (
            <span className="flex items-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Saving...</span>
          ) : (
            <><Save className="w-5 h-5 mr-2" /> Save Changes</>
          )}
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-xl border ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} animate-in fade-in slide-in-from-top-5 duration-300`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3"/> : <AlertCircle className="w-5 h-5 mr-3"/>}
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
                  className={`w-full flex items-center px-5 py-4 text-left transition-all duration-200 border-l-4 ${isActive ? 'bg-blue-50 text-blue-700 border-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 border-transparent hover:text-gray-900'}`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {tab.label}
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
                  <Store className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-800">General Information</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <InputGroup label="Restaurant Name">
                   <input type="text" name="restaurantName" value={formData.restaurantName} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. The Grand Kitchen" />
                </InputGroup>

                <InputGroup label="Address" subLabel="This address will appear on printed receipts.">
                   <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Full street address..." />
                </InputGroup>

                <InputGroup label="UPI ID" subLabel="Used to generate QR codes for customer payments.">
                   <div className="relative">
                       <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="username@bank" />
                       <div className="absolute left-3 top-3.5 text-gray-400 font-bold">@</div>
                   </div>
                </InputGroup>
              </div>
            </div>
          )}

          {/* --- TAB: LOCALIZATION --- */}
          {activeTab === 'localization' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
                  <Globe className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-800">Language & Currency</h2>
              </div>

              <div className="max-w-lg">
                <InputGroup label="Application Language" subLabel="Select your preferred interface language.">
                   <select name="language" value={formData.language} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white outline-none">
                     {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                   </select>
                </InputGroup>

                <InputGroup label="Default Currency" subLabel="This symbol will be used for all pricing.">
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
                  <Printer className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-800">Receipt Printing Config</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <InputGroup label="Paper Size" subLabel="Width of your thermal paper roll.">
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
                   <InputGroup label="Font Density" subLabel="Adjust text size on the receipt.">
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
                          Preview: <span className={formData.printFontSize === 'large' ? 'text-lg' : formData.printFontSize === 'small' ? 'text-xs' : 'text-sm'}>Total: ₹150.00</span>
                       </div>
                   </InputGroup>
                </div>

                <div className="md:col-span-2">
                    <InputGroup label="Footer Message" subLabel="Appears at the very bottom of the receipt.">
                        <input type="text" name="receiptFooter" value={formData.receiptFooter} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </InputGroup>
                </div>

                <div className="md:col-span-2">
                     <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="checkbox" name="showLogo" checked={formData.showLogo} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                        <div className="ml-4">
                            <span className="block font-bold text-gray-800">Show Header Logo/Name</span>
                            <span className="block text-sm text-gray-500">Include the restaurant name at the top of the receipt.</span>
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
                  <Keyboard className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-800">Keyboard Cheat Sheet</h2>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                       <tr>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Key</th>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Action</th>
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Category</th>
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
               <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center mb-6 transform rotate-3">
                  <Monitor className="w-12 h-12" />
               </div>
               <h2 className="text-3xl font-extrabold text-gray-900">Restaurant POS</h2>
               <span className="inline-block px-3 py-1 mt-3 text-xs font-bold text-blue-800 bg-blue-100 rounded-full">Version 2.5.0 (Pro)</span>
               
               <p className="text-gray-500 mt-6 max-w-md text-center leading-relaxed">
                  Designed to simplify restaurant management. From billing to settings, everything you need is right here.
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