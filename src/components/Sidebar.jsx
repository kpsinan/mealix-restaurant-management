// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from "react";
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
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
  FaChartBar, // <-- 1. IMPORT THE NEW ICON
} from "react-icons/fa";

// Custom hook to detect clicks outside a component
const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
};


// Config-driven nav items remain the same
const navItems = [
  { path: "/", label: "Home", icon: FaHome },
  { path: "/menu", label: "Menu", icon: FaUtensils },
  { path: "/billing", label: "Billing", icon: FaFileInvoiceDollar },
  { path: "/reports", label: "Reports", icon: FaChartBar }, // <-- 2. ADD THE NEW NAV ITEM
  { path: "/staff", label: "Staff", icon: FaUsers },
  { path: "/order", label: "Order", icon: FaClipboardList },
  { path: "/kitchen", label: "Kitchen", icon: FaConciergeBell },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useOutsideClick(profileRef, () => setProfileOpen(false));

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
    // MODIFIED: Changed `relative` to `sticky top-0` to make the sidebar stick to the top during scroll.
    <aside className={`sticky top-0 h-screen bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? "w-64" : "w-20"}`}>
      
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        className="absolute -right-3 top-8 z-10 p-1.5 rounded-full bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-900 transition-colors"
      >
        {isOpen ? <FaChevronLeft size={14} /> : <FaBars size={14} />}
      </button>

      {/* Top Section: Logo + Nav */}
      <div className={`flex-1 flex flex-col ${isOpen ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`}>
        {/* Brand */}
        <div className="flex items-center h-20 px-6 shrink-0">
          <span className="text-amber-400 text-3xl">🍴</span>
          {isOpen && (
            <span className="ml-4 text-2xl font-bold tracking-wider text-amber-400">
              MealIX
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `relative flex items-center rounded-lg font-medium py-3 px-4 transition-colors group
                ${isActive
                    ? "bg-amber-500 text-slate-900 shadow-lg"
                    : "hover:bg-slate-800 hover:text-amber-400"
                }`
              }
            >
              <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />
              {isOpen && <span className="ml-4 flex-1 whitespace-nowrap">{label}</span>}
              
              {/* Tooltip for collapsed state */}
              {!isOpen && (
                <span className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-slate-800 text-amber-400 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg transition-opacity pointer-events-none z-20">
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section: Settings, Profile */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        {/* Settings Link */}
        <NavLink
            to="/settings"
            className={({ isActive }) =>
            `relative flex items-center rounded-lg font-medium py-3 px-4 transition-colors group
            ${isActive
                ? "bg-amber-500 text-slate-900 shadow-lg"
                : "hover:bg-slate-800 hover:text-amber-400"
            }`
          }
        >
          <FaCog className="w-6 h-6 shrink-0" aria-hidden="true" />
          {isOpen && <span className="ml-4">Settings</span>}
          {!isOpen && (
             <span className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-slate-800 text-amber-400 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg transition-opacity pointer-events-none z-20">
                  Settings
             </span>
          )}
        </NavLink>

        {/* Profile Section */}
        <div ref={profileRef} className="relative mt-2">
            {/* Profile Popover Menu */}
            {profileOpen && (
                <div className={`absolute bottom-full mb-2 w-56 ${isOpen ? 'left-0' : 'left-4'} bg-slate-800 rounded-lg shadow-lg py-2 transition-all duration-300 ease-in-out transform origin-bottom ${profileOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                    <div className="px-4 py-3 border-b border-slate-700">
                        <p className="font-semibold text-slate-200">Manager</p>
                        <p className="text-sm text-slate-400 truncate">manager@restrogrid.com</p>
                    </div>
                    <button className="flex w-full items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-amber-400">
                        <FaUserCircle className="mr-3" /> Profile
                    </button>
                    <button className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-slate-700">
                        <FaSignOutAlt className="mr-3" /> Logout
                    </button>
                </div>
            )}
            
            {/* Profile Trigger */}
            <div
                className={`mt-2 p-2 flex items-center cursor-pointer rounded-lg hover:bg-slate-800 transition-colors ${!isOpen && "justify-center"}`}
                onClick={() => setProfileOpen((prev) => !prev)}
            >
                <img
                    src="https://i.pravatar.cc/48"
                    alt="profile"
                    className="w-10 h-10 rounded-full border-2 border-amber-400"
                />
                {isOpen && (
                    <div className="ml-3">
                    <p className="font-semibold text-slate-200">Manager</p>
                    <p className="text-xs text-slate-400">Admin</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;