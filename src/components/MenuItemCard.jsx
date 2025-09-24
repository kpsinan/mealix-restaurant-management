import React from "react";

const MenuItemCard = ({ 
  item, 
  currencySymbol = '₹', 
  // Prop to hide +/- buttons on the Menu page
  showControls = true, 
  // Props for the new selection feature
  selectionMode = false,
  isSelected = false,
  onSelect = () => {},
}) => {
  if (!item) return null;

  // Base classes for the card
  let cardClasses = "card border rounded-lg shadow-md p-4 bg-white flex flex-col transition-all duration-200";
  // Add styles for selection mode
  if (selectionMode) {
    cardClasses += " cursor-pointer";
    if (isSelected) {
      cardClasses += " ring-2 ring-blue-500 border-blue-500";
    } else {
      cardClasses += " hover:ring-2 hover:ring-blue-300";
    }
  }

  return (
    <div className={cardClasses} onClick={selectionMode ? onSelect : null}>
      {/* Selection Checkbox Overlay */}
      {selectionMode && (
        <div className="absolute top-2 right-2">
          <div className={`w-5 h-5 border-2 rounded ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
            {isSelected && <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
          </div>
        </div>
      )}

      {/* Item Name */}
      <h3 className="text-lg font-bold text-gray-800 mb-2 pr-6">{item.name}</h3>

      {/* --- MODIFIED PRICE SECTION FOR PERFECT ALIGNMENT --- */}
      <div className="text-sm font-semibold mb-3">
        {/* Fallback for old 'price' field for compatibility */}
        {item.price && !item.fullPrice && (
          <div className="text-gray-700">{currencySymbol}{item.price.toFixed(2)}</div>
        )}
        
        {/* Grid layout for new multi-price items */}
        {(item.fullPrice || item.halfPrice || item.quarterPrice) && (
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-gray-700">
            {item.fullPrice && (
              <>
                <span className="font-medium text-gray-500">Full:</span>
                <span>{currencySymbol}{item.fullPrice.toFixed(2)}</span>
              </>
            )}
            {item.halfPrice && (
              <>
                <span className="font-medium text-gray-500">Half:</span>
                <span>{currencySymbol}{item.halfPrice.toFixed(2)}</span>
              </>
            )}
            {item.quarterPrice && (
              <>
                <span className="font-medium text-gray-500">Qtr:</span>
                <span>{currencySymbol}{item.quarterPrice.toFixed(2)}</span>
              </>
            )}
          </div>
        )}
      </div>

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

      {/* Quantity Controls (conditionally rendered) */}
      {/* This div will now only appear on the Order page */}
      {showControls && (
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
      )}
    </div>
  );
};

export default MenuItemCard;