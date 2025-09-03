// src/components/TableCard.jsx
import React, { useRef, useEffect } from "react";
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
 */
const TableCard = ({ table, isAddButton, onClick, onDoubleClick, onLongPress }) => {
  const elRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const lastTapRef = useRef(0);

  // Start long-press timer on touchstart
  const handleTouchStart = (ev) => {
    // If there's no long-press handler, nothing to do here
    if (!onLongPress) return;

    // Clear any previous timer for safety
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Start timer
    longPressTimerRef.current = setTimeout(() => {
      // invoke long press callback
      onLongPress();
      // clear timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
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
      // Always cancel long-press when touch ends
      clearLongPress();

      const now = Date.now();
      const last = lastTapRef.current || 0;
      const delta = now - last;

      if (delta > 0 && delta <= DOUBLE_TAP_MS) {
        // double-tap detected
        // attempt to prevent default behavior (double-tap zoom)
        try {
          ev.preventDefault();
        } catch (err) {
          // ignore if preventDefault isn't allowed
        }
        ev.stopPropagation?.();

        // call double-click handler
        onDoubleClick?.();

        // reset lastTap
        lastTapRef.current = 0;
        return;
      }

      // Not a second tap — store timestamp and reset after window
      lastTapRef.current = now;
      window.setTimeout(() => {
        lastTapRef.current = 0;
      }, DOUBLE_TAP_MS + 50);
    };

    // Add native listener with passive: false so preventDefault works
    el.addEventListener("touchend", onNativeTouchEnd, { passive: false });

    return () => {
      el.removeEventListener("touchend", onNativeTouchEnd);
      clearLongPress();
    };
  }, [onDoubleClick]);

  // Cleanup on unmount (extra safety)
  useEffect(() => {
    return () => clearLongPress();
  }, []);

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

  // Occupied styling example (customize as needed)
  const occupied = table?.status === "occupied";

  return (
    <motion.div
      ref={elRef}
      role="button"
      tabIndex={0}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      // Desktop double-click
      onDoubleClick={() => onDoubleClick?.()}
      onKeyDown={(e) => {
        if (e.key === "Enter") onDoubleClick?.();
      }}
      // Touch handlers: start long-press detection and cancel when touch ends/moves/cancels
      onTouchStart={(e) => handleTouchStart(e)}
      onTouchEnd={() => clearLongPress()}
      onTouchCancel={() => clearLongPress()}
      onTouchMove={() => clearLongPress()}
      className={`relative h-40 rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer flex flex-col items-center justify-center border p-4
        ${
          occupied
            ? "bg-green-100 border-green-400 text-green-900"
            : "bg-white border-gray-200 text-gray-800"
        }`}
      aria-pressed={occupied}
    >
      {/* Status dot */}
      {table?.status && (
        <div
          className={`absolute top-2 right-2 h-3 w-3 rounded-full ${
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
      {table?.status && (
        <span className="text-sm mt-1 capitalize">{table.status}</span>
      )}
    </motion.div>
  );
};

export default TableCard;