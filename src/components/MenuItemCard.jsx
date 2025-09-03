import React from "react";

const MenuItemCard = ({ item, quantity, onQuantityChange }) => {
  if (!item) return null;

  return (
    <div className="card border rounded-lg shadow-md p-4 bg-white flex flex-col">
      {/* Item Name */}
      <h3 className="text-lg font-bold text-gray-800 mb-2">{item.name}</h3>

      {/* Price */}
      <p className="text-gray-700 font-semibold mb-2">
        ₹{item.price?.toFixed(2)}
      </p>

      {/* Ingredients */}
      {item.ingredients && (
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Ingredients:</span>{" "}
          {item.ingredients}
        </p>
      )}

      {/* Special Note */}
      {item.specialNote && (
        <p className="text-xs italic text-gray-500 mb-3">
          {item.specialNote}
        </p>
      )}

      {/* Quantity Controls (optional) */}
      <div className="mt-auto flex items-center gap-2">
        <button
          onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          -
        </button>
        <span className="px-2">{quantity}</span>
        <button
          onClick={() => onQuantityChange(quantity + 1)}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;
