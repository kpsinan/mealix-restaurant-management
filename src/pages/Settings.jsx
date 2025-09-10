// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../firebase/firebase';

const Settings = () => {
  const [formData, setFormData] = useState({
    restaurantName: '',
    address: '',
    upiId: '',
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
          setFormData(currentSettings);
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
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

          <div className="mb-6">
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