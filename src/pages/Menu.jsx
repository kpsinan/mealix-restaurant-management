import React, { useState, useEffect } from "react";
import {
  addMenuItem,
  onMenuItemsRealtime,   // 👈 use the realtime listener
} from "../firebase/firebase";
import Modal from "../components/Modal";
import MenuItemCard from "../components/MenuItemCard";

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    ingredients: "",
    specialNote: "",
  });

  // ✅ Real-time subscription to menu items
  useEffect(() => {
    const unsubscribe = onMenuItemsRealtime((items) => {
      setMenuItems(items);
    });

    return () => unsubscribe();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle adding a new menu item
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      alert("Item name and price are required.");
      return;
    }

    try {
      const price = parseFloat(newItem.price);
      if (isNaN(price)) {
        alert("Price must be a valid number.");
        return;
      }

      const itemToAdd = { ...newItem, price };

      const addedItem = await addMenuItem(itemToAdd);
      console.log("Added Item:", addedItem); // 👈 should have {id, name, price, ...}

      // ✅ No need to manually push into state,
      // realtime listener will refresh automatically.

      setNewItem({ name: "", price: "", ingredients: "", specialNote: "" });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding menu item:", error);
      alert("Failed to add menu item.");
    }
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Menu</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Add Item Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="card border-2 border-dashed border-gray-400 flex items-center justify-center h-40"
        >
          <span className="text-gray-500 font-medium">+ Add Item</span>
        </button>

        {/* Menu Items */}
        {menuItems.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            quantity={0}
            onQuantityChange={() => {}}
          />
        ))}
      </div>

      {/* Add Item Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Add New Menu Item
        </h2>
        <input
          type="text"
          name="name"
          value={newItem.name}
          onChange={handleInputChange}
          placeholder="Item Name"
          className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          name="price"
          value={newItem.price}
          onChange={handleInputChange}
          placeholder="Price (with GST)"
          className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          name="ingredients"
          value={newItem.ingredients}
          onChange={handleInputChange}
          placeholder="Ingredients (comma-separated)"
          className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          name="specialNote"
          value={newItem.specialNote}
          onChange={handleInputChange}
          placeholder="Special Note (optional)"
          className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end">
          <button
            onClick={handleAddItem}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Menu;
