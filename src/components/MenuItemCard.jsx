// src/components/MenuItemCard.jsx
import React from "react";

const MenuItemCard = ({
  item,
  currencySymbol = "₹",
  // Displays a badge with the total quantity (for Order page)
  quantity = 0,
  // Function to call when the card is clicked (for Order page)
  onCardClick,
  // Props for selection feature (for Menu page)
  selectionMode = false,
  isSelected = false,
  onSelect,
}) => {
  if (!item) return null;

  // Universal click handler
  const handleClick = () => {
    if (selectionMode) {
      // In selection mode, trigger the select function
      onSelect?.();
    } else {
      // Otherwise, trigger the card's main click action (opens portion modal)
      onCardClick?.(item);
    }
  };

  // Dynamic classes for styling based on mode and state
  const cardClasses = [
    "bg-white rounded-xl shadow-md p-4 flex flex-col justify-between transition-all duration-200 relative border",
    // Make the card clickable in either mode
    (onCardClick || selectionMode) ? "cursor-pointer" : "",
    // Apply selection styling
    isSelected ? "ring-2 ring-blue-600 border-blue-500 shadow-lg" : "border-gray-200 hover:shadow-lg",
  ].join(" ");

  return (
    <div className={cardClasses} onClick={handleClick}>
      {/* Quantity Badge: Only shows on the Order page when items are in the cart */}
      {quantity > 0 && !selectionMode && (
        <div className="absolute top-[-10px] right-[-10px] bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg z-10">
          {quantity}
        </div>
      )}

      {/* Selection Overlay: Only shows on the Menu page in selection mode */}
      {selectionMode && isSelected && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-xl pointer-events-none flex items-center justify-center">
            <div className="bg-white rounded-full p-1 shadow">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
        </div>
      )}

      <div className="flex-grow">
        {/* Item Name */}
        <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">{item.name}</h3>
        
        {/* Detailed Price Section */}
        <div className="text-sm font-semibold mb-3">
          {(item.fullPrice || item.halfPrice || item.quarterPrice) ? (
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-gray-700">
              {item.fullPrice != null && (
                <>
                  <span className="font-medium text-gray-500">Full:</span>
                  <span>{currencySymbol}{item.fullPrice.toFixed(2)}</span>
                </>
              )}
              {item.halfPrice != null && (
                <>
                  <span className="font-medium text-gray-500">Half:</span>
                  <span>{currencySymbol}{item.halfPrice.toFixed(2)}</span>
                </>
              )}
              {item.quarterPrice != null && (
                <>
                  <span className="font-medium text-gray-500">Qtr:</span>
                  <span>{currencySymbol}{item.quarterPrice.toFixed(2)}</span>
                </>
              )}
            </div>
          ) : (
            // Fallback for old 'price' field for compatibility
            item.price && <div className="text-gray-700">{currencySymbol}{item.price.toFixed(2)}</div>
          )}
        </div>

        {/* Ingredients */}
        {item.ingredients && (
          <p className="text-xs text-gray-600 mb-2">
            {item.ingredients}
          </p>
        )}
      </div>

      {/* Special Note */}
      {item.specialNote && (
        <p className="text-xs italic text-blue-600 mt-auto pt-2 border-t border-gray-100">
          Note: {item.specialNote}
        </p>
      )}

      {/* The old +/- quantity controls are intentionally removed from this component */}
    </div>
  );
};

export default MenuItemCard;