// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../firebase/firebase';

// A list of common currencies for the dropdown
const currencies = [
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: '$', code: 'USD', name: 'United States Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound Sterling' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
  { symbol: 'CHF', code: 'CHF', name: 'Swiss Franc' },
  { symbol: 'AED', code: 'AED', name: 'UAE Dirham' },
  { symbol: 'SAR', code: 'SAR', name: 'Saudi Riyal' },
  { symbol: 'SGD', code: 'SGD', name: 'Singapore Dollar' },
];

const Settings = () => {
  const [formData, setFormData] = useState({
    restaurantName: '',
    address: '',
    upiId: '',
    currencySymbol: '₹', // <-- ADD currency symbol state
    currencyCode: 'INR',   // <-- ADD currency code state
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Fetch existing settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const currentSettings = await getSettings();
        if (currentSettings) {
          // Ensure defaults if currency settings don't exist yet
          setFormData({
            ...{ currencySymbol: '₹', currencyCode: 'INR' }, // Default values
            ...currentSettings,
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        setMessage("Could not load settings.");
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Special handler for the currency dropdown
    if (name === 'currency') {
      try {
        const { symbol, code } = JSON.parse(value);
        setFormData((prev) => ({
          ...prev,
          currencySymbol: symbol,
          currencyCode: code,
        }));
      } catch (error) {
        console.error("Could not parse currency data", error);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.restaurantName || !formData.upiId) {
      setMessage("Restaurant Name and UPI ID are required.");
      setIsError(true);
      return;
    }
    
    try {
      setMessage("Saving...");
      setIsError(false);
      await updateSettings(formData);
      setMessage("Settings saved successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
      setMessage("Failed to save settings. Please try again.");
      setIsError(true);
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading settings...</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Application Settings</h1>

      {/* START: ADDED QUOTE */}
      <p className="text-center text-red-700 font-semibold text-lg mb-8 italic">
        "Palestine is the anvil of our consciousness." - Edward Said
      </p>
      {/* END: ADDED QUOTE */}

      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          {/* Restaurant Name Input */}
          <div className="mb-4">
            <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Name
            </label>
            <input
              type="text"
              id="restaurantName"
              name="restaurantName"
              value={formData.restaurantName}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., The Grand Eatery"
              required
            />
          </div>

          {/* Address Input */}
          <div className="mb-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 123 Culinary Lane, Food Town"
            />
          </div>

          {/* UPI ID Input */}
          <div className="mb-4">
            <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">
              UPI ID (for QR Code Payments)
            </label>
            <input
              type="text"
              id="upiId"
              name="upiId"
              value={formData.upiId}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., yourname@oksbi"
              required
            />
          </div>
          
          {/* NEW: Currency Selection Dropdown */}
          <div className="mb-6">
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              value={JSON.stringify({ symbol: formData.currencySymbol, code: formData.currencyCode })}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencies.map(({symbol, code, name}) => (
                <option key={code} value={JSON.stringify({ symbol, code })}>
                  {name} ({symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Settings
            </button>
            {message && (
              <p className={`text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;