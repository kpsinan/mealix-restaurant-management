import React from 'react';

const QuantitySelector = ({ quantity, onIncrement, onDecrement }) => {
  return (
    <div className="flex items-center">
      <button
        onClick={onDecrement}
        disabled={quantity === 0}
        className="bg-gray-200 text-gray-800 px-3 py-1 rounded-l-lg hover:bg-gray-300 disabled:bg-gray-100"
      >
        -
      </button>
      <span className="px-4 py-1 bg-gray-100 text-gray-800">{quantity}</span>
      <button
        onClick={onIncrement}
        className="bg-gray-200 text-gray-800 px-3 py-1 rounded-r-lg hover:bg-gray-300"
      >
        +
      </button>
    </div>
  );
};

export default QuantitySelector;