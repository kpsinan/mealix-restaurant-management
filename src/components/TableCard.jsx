// src/components/TableCard.jsx
import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

const LONG_PRESS_MS = 600; // long-press threshold
const DOUBLE_TAP_MS = 300; // double-tap detection window

/**
 * Props:
 * - table: object (optional) - { id, name, status, ... }
 * - isAddButton: boolean - renders the "Add Table" button
 * - onClick: function - only used by add button or general click
 * - onDoubleClick: function - desktop double-click OR touch double-tap
 * - onLongPress: function - long press on touch devices
 * - onDelete: function - called when delete is clicked
 */
const TableCard = ({ table, isAddButton, onClick, onDoubleClick, onLongPress, onDelete }) => {
  const elRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const lastTapRef = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Start long-press timer on touchstart
  const handleTouchStart = (ev) => {
    if (!onLongPress) return;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      onLongPress();
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }, LONG_PRESS_MS);
  };

  // Cancel long-press timer
  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Attach native touchend listener to detect double-tap and prevent double-tap zoom
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const onNativeTouchEnd = (ev) => {
      clearLongPress();
      const now = Date.now();
      const delta = now - (lastTapRef.current || 0);
      if (delta > 0 && delta <= DOUBLE_TAP_MS) {
        ev.preventDefault();
        ev.stopPropagation?.();
        onDoubleClick?.();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
    };
    el.addEventListener("touchend", onNativeTouchEnd, { passive: false });
    return () => {
      el.removeEventListener("touchend", onNativeTouchEnd);
      clearLongPress();
    };
  }, [onDoubleClick]);

  // Cleanup on unmount
  useEffect(() => () => clearLongPress(), []);

  // Event handlers for menu and delete
  const handleMenuToggle = (e) => {
    e.stopPropagation(); // Prevent card click events from firing
    setMenuOpen((prev) => !prev);
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent card click events
    onDelete?.();
    setMenuOpen(false);
  };

  // Render Add Button variant
  if (isAddButton) {
    return (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="h-40 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center transition hover:border-blue-500 hover:text-blue-600 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Add Table"
      >
        <span className="text-gray-500 font-medium text-lg">+ Add Table</span>
      </motion.button>
    );
  }

  const occupied = table?.status === "occupied";

  return (
    <motion.div
      ref={elRef}
      role="button"
      tabIndex={0}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onDoubleClick={() => onDoubleClick?.()}
      onKeyDown={(e) => {
        if (e.key === "Enter") onDoubleClick?.();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={clearLongPress}
      onTouchCancel={clearLongPress}
      onTouchMove={clearLongPress}
      className={`relative h-40 rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer flex flex-col items-center justify-center border p-4
        ${
          occupied
            ? "bg-green-100 border-green-400 text-green-900"
            : "bg-white border-gray-200 text-gray-800"
        }`}
      aria-pressed={occupied}
    >
      {/* Options Menu */}
      {onDelete && (
        <div ref={menuRef} className="absolute top-1 right-1 z-10">
          <button
            onClick={handleMenuToggle}
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
            aria-label="Table options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-800 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                  </svg>
                  Delete Table
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status dot */}
      {table?.status && (
        <div
          className={`absolute top-2 left-2 h-3 w-3 rounded-full ${
            table.status === "available"
              ? "bg-green-500"
              : table.status === "occupied"
              ? "bg-green-700"
              : "bg-yellow-400"
          }`}
          title={table.status}
        />
      )}

      <span className="text-xl font-semibold">{table?.name ?? "Table"}</span>
      {table?.status && <span className="text-sm mt-1 capitalize">{table.status}</span>}
    </motion.div>
  );
};

export default TableCard;