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
  FaChartBar,
  FaMagic,
  FaTachometerAlt, // Added for Dashboard
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

// Sidebar navigation items
const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: FaTachometerAlt }, // New Dashboard Link
  { path: "/", label: "Floor Plan", icon: FaHome }, // Renamed Home to Floor Plan for clarity
  { path: "/smart-assign", label: "Smart Assign", icon: FaMagic },
  { path: "/order", label: "Order", icon: FaClipboardList },
  { path: "/menu", label: "Menu", icon: FaUtensils },
  { path: "/billing", label: "Billing", icon: FaFileInvoiceDollar },
  { path: "/reports", label: "Reports", icon: FaChartBar },
  { path: "/staff", label: "Staff", icon: FaUsers },
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
    if (stored !== null) setIsOpen(JSON.parse(stored));
  }, []);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isOpen));
  }, [isOpen]);

  const scrollbarHiddenStyle = {
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  };

  return (
    <aside
      className={`sticky top-0 h-screen bg-[#F9FAFB] text-[#1F2937] flex flex-col transition-all duration-300 ease-in-out ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        className="absolute -right-3 top-8 z-10 p-1.5 rounded-full bg-[#E5E7EB] text-[#1F2937] hover:bg-[#10B981] hover:text-white transition-colors"
      >
        {isOpen ? <FaChevronLeft size={14} /> : <FaBars size={14} />}
      </button>

      {/* Top Section: Logo + Nav */}
      <div
        className={`flex-1 flex flex-col ${
          isOpen ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden"
        }`}
        style={scrollbarHiddenStyle}
      >
        {/* Brand */}
        <div className="flex items-center h-20 px-6 shrink-0">
          <span className="text-[#10B981] text-3xl font-bold">M</span>
          {isOpen && (
            <div className="ml-4 flex flex-col">
              <span className="text-2xl font-bold tracking-wider text-[#10B981] leading-tight">
                MealiX
              </span>
              <span className="text-xs text-[#6B7280] tracking-wider mt-0.5">
                Developed by Sinan KP
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `relative flex items-center rounded-lg font-medium py-3 px-4 transition-all duration-200 group ${
                  isActive
                    ? "bg-[#D1FAE5] text-[#065F46] shadow-md"
                    : "hover:bg-[#C6F6D5] hover:text-[#065F46]"
                }`
              }
            >
              <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />
              {isOpen && <span className="ml-4 flex-1 whitespace-nowrap">{label}</span>}
              {!isOpen && (
                <span className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-[#ECFDF5] text-[#10B981] text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg transition-opacity pointer-events-none z-20">
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section: Settings & Profile */}
      <div className="px-4 py-4 border-t border-[#E5E7EB]">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `relative flex items-center rounded-lg font-medium py-3 px-4 transition-all duration-200 group ${
              isActive
                ? "bg-[#D1FAE5] text-[#065F46] shadow-md"
                : "hover:bg-[#C6F6D5] hover:text-[#065F46]"
            }`
          }
        >
          <FaCog className="w-6 h-6 shrink-0" aria-hidden="true" />
          {isOpen && <span className="ml-4">Settings</span>}
          {!isOpen && (
            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-[#ECFDF5] text-[#10B981] text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg transition-opacity pointer-events-none z-20">
              Settings
            </span>
          )}
        </NavLink>

        {/* Profile Section */}
        <div ref={profileRef} className="relative mt-2">
          {profileOpen && (
            <div
              className={`absolute bottom-full mb-2 w-56 ${
                isOpen ? "left-0" : "left-4"
              } bg-white rounded-lg shadow-md py-2 transition-all duration-300 ease-in-out transform origin-bottom ${
                profileOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            >
              <div className="px-4 py-3 border-b border-[#E5E7EB]">
                <p className="font-semibold text-[#1F2937]">Manager</p>
                <p className="text-sm text-[#6B7280] truncate">
                  manager@restrogrid.com
                </p>
              </div>
              <button className="flex w-full items-center px-4 py-2 text-sm text-[#1F2937] hover:bg-[#ECFDF5] hover:text-[#10B981]">
                <FaUserCircle className="mr-3" /> Profile
              </button>
              <button className="flex w-full items-center px-4 py-2 text-sm text-[#EF4444] hover:bg-[#FEE2E2]">
                <FaSignOutAlt className="mr-3" /> Logout
              </button>
            </div>
          )}

          {/* Profile Trigger */}
          <div
            className={`mt-2 p-2 flex items-center cursor-pointer rounded-lg hover:bg-[#ECFDF5] transition-colors ${
              !isOpen && "justify-center"
            }`}
            onClick={() => setProfileOpen((prev) => !prev)}
          >
            <img
              src="https://i.pravatar.cc/48"
              alt="profile"
              className="w-10 h-10 rounded-full border-2 border-[#10B981]"
            />
            {isOpen && (
              <div className="ml-3">
                <p className="font-semibold text-[#1F2937]">Manager</p>
                <p className="text-xs text-[#6B7280]">Admin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;