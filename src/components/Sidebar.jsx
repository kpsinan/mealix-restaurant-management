// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUtensils,
  FaUsers,
  FaClipboardList,
  FaConciergeBell,
  FaBars,
  FaChevronLeft,
  FaFileInvoiceDollar,
} from "react-icons/fa";

// Config-driven nav items
const navItems = [
  { path: "/", label: "Home", icon: FaHome },
  { path: "/menu", label: "Menu", icon: FaUtensils },
  { path: "/billing", label: "Billing", icon: FaFileInvoiceDollar },
  { path: "/staff", label: "Staff", icon: FaUsers },
  { path: "/order", label: "Order", icon: FaClipboardList },
  { path: "/kitchen", label: "Kitchen", icon: FaConciergeBell },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  // Load sidebar state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("sidebarOpen");
    if (stored !== null) {
      setIsOpen(JSON.parse(stored));
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isOpen));
  }, [isOpen]);

  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-20"
      } bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200 h-screen p-4 flex flex-col justify-between shadow-lg transition-all duration-300`}
    >
      {/* Top Section: Logo */}
      <div>
        <div
          className={`text-2xl font-extrabold tracking-wide text-yellow-400 mb-8 transition-opacity duration-300 ${
            !isOpen && "opacity-0 hidden"
          }`}
        >
          🍴 SyncServe
        </div>

        {/* Nav Links */}
        <nav className="space-y-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center rounded-lg font-medium transition-all duration-300 py-3 px-4 relative group
                ${
                  isActive
                    ? "bg-yellow-500 text-gray-900 shadow-md"
                    : "hover:bg-gray-700 hover:text-yellow-400"
                }`
              }
            >
              {/* Icon */}
              <span className="w-6 flex justify-center text-xl">
                <Icon aria-hidden="true" />
              </span>

              {/* Label (visible when open) */}
              {isOpen && (
                <span className="ml-4 flex-1 whitespace-nowrap">{label}</span>
              )}

              {/* Tooltip (visible only when collapsed) */}
              {!isOpen && (
                <span
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-gray-900 text-yellow-400 text-sm rounded opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg"
                  role="tooltip"
                >
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section: Profile + Toggle */}
      <div>
        {/* Profile */}
        <div
          className={`border-t border-gray-700 pt-4 flex items-center transition-all duration-300 ${
            !isOpen ? "justify-center" : "gap-3"
          }`}
        >
          <img
            src="https://i.pravatar.cc/40"
            alt="profile"
            className="w-10 h-10 rounded-full border-2 border-yellow-400"
          />
          {isOpen && (
            <div>
              <p className="font-semibold">Manager</p>
              <p className="text-sm text-gray-400">Admin</p>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isOpen}
          className="mt-4 w-full flex items-center justify-center py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-yellow-400 transition-colors"
        >
          {isOpen ? <FaChevronLeft size={18} /> : <FaBars size={18} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
