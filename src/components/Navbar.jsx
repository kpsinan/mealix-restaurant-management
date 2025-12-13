// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUtensils,
  FaUsers,
  FaClipboardList,
  FaConciergeBell,
  FaFileInvoiceDollar,
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
  FaChartBar,
  FaMagic,
  FaTachometerAlt,
  FaChevronDown,
} from "react-icons/fa";

// Navigation Items Configuration
const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: FaTachometerAlt },
  { path: "/", label: "Floor Plan", icon: FaHome },
  { path: "/smart-assign", label: "Smart Assign", icon: FaMagic },
  { path: "/order", label: "Order", icon: FaClipboardList },
  { path: "/menu", label: "Menu", icon: FaUtensils },
  { path: "/billing", label: "Billing", icon: FaFileInvoiceDollar },
  { path: "/reports", label: "Reports", icon: FaChartBar },
  { path: "/staff", label: "Staff", icon: FaUsers },
  { path: "/kitchen", label: "Kitchen", icon: FaConciergeBell },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const location = useLocation();

  // Close menu automatically when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Prevent background scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* === TOP NAVBAR (Fixed) === */}
      <nav className="fixed top-0 left-0 w-full z-50 lg:hidden transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        {/* SAFE AREA SPACER: Keeps content below status bar icons */}
        <div className="w-full h-8 bg-transparent" />

        <div className="flex items-center justify-between px-5 h-16">
          {/* Brand Logo with gradient text */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200">
              M
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
              MealiX
            </span>
          </div>

          {/* Animated Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="group relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            <div className="w-5 h-4 relative flex flex-col justify-between">
              <span
                className={`w-full h-0.5 bg-gray-800 rounded-full transition-all duration-300 ease-out origin-left ${
                  isMenuOpen ? "rotate-45 translate-x-0.5" : ""
                }`}
              />
              <span
                className={`w-full h-0.5 bg-gray-800 rounded-full transition-all duration-300 ease-out ${
                  isMenuOpen ? "opacity-0 translate-x-2" : "opacity-100"
                }`}
              />
              <span
                className={`w-full h-0.5 bg-gray-800 rounded-full transition-all duration-300 ease-out origin-left ${
                  isMenuOpen ? "-rotate-45 translate-x-0.5" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* === SLIDE-OUT DRAWER OVERLAY === */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${
          isMenuOpen ? "visible" : "invisible delay-300"
        }`}
      >
        {/* Backdrop with Blur */}
        <div
          className={`absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity duration-500 ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Drawer Content */}
        <div
          className={`absolute right-0 top-0 h-full w-[85%] max-w-xs bg-white shadow-2xl transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer Header (Matches Top Navbar Height + Safe Area) */}
          <div className="flex-none pt-8 px-6 pb-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Menu
              </p>
              <h2 className="text-lg font-bold text-gray-800">Navigation</h2>
            </div>
            {/* Close Icon inside drawer (optional, as backdrop closes it too) */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Items (Scrollable) */}
          <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1 scroll-smooth">
            {navItems.map(({ path, label, icon: Icon }, index) => (
              <NavLink
                key={path}
                to={path}
                style={{
                  animationDelay: `${index * 50}ms`, // Staggered reveal effect could be added here
                }}
                className={({ isActive }) =>
                  `flex items-center p-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm ring-1 ring-emerald-100"
                      : "text-gray-600 hover:bg-gray-50 hover:text-emerald-600"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 mr-4 transition-transform duration-300 group-hover:scale-110 ${
                        isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-emerald-500"
                      }`}
                    />
                    <span className="relative z-10">{label}</span>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-500 rounded-r-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Bottom Section: User Profile & Settings */}
          <div className="flex-none p-4 border-t border-gray-100 bg-gray-50/50">
            {/* Settings Link */}
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-xl mb-3 transition-colors ${
                  isActive
                    ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100"
                    : "text-gray-600 hover:bg-white hover:shadow-sm"
                }`
              }
            >
              <FaCog className="w-5 h-5 mr-3 text-gray-400" />
              <span className="font-medium">Settings</span>
            </NavLink>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100 overflow-hidden">
              <div
                onClick={() => setProfileExpanded(!profileExpanded)}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src="https://i.pravatar.cc/150?img=11"
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">
                      Manager
                    </span>
                    <span className="text-xs text-gray-500">Admin Access</span>
                  </div>
                </div>
                <FaChevronDown
                  className={`text-gray-400 transition-transform duration-300 ${
                    profileExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Collapsible Profile Menu */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  profileExpanded
                    ? "grid-rows-[1fr] opacity-100 pb-2"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden px-3">
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    <button className="flex w-full items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-emerald-600 rounded-lg transition-colors">
                      <FaUserCircle className="mr-3 w-4 h-4" />
                      My Profile
                    </button>
                    <button className="flex w-full items-center px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <FaSignOutAlt className="mr-3 w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;