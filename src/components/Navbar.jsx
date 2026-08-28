// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

/**
 * NOTE: For the purpose of this environment, we assume the existence of 
 * your Firebase configuration and Translation utility.
 * In a real project structure, ensure these files exist at the specified paths.
 */
import { signOut } from "firebase/auth";
import db, { auth } from "../firebase/firebase"; 
import { getTranslation } from "../translations";

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
  FaBars,
} from "react-icons/fa";

// Navigation Items Configuration using Translation Keys to match Sidebar.jsx logic
const navItems = [
  { path: "/dashboard", key: "dashboard", icon: FaTachometerAlt, permission: 'view_dashboard' },
  { path: "/", key: "floorPlan", icon: FaHome },
  { path: "/smart-assign", key: "smartAssign", icon: FaMagic },
  { path: "/order", key: "order", icon: FaClipboardList, permission: 'manage_orders' },
  { path: "/kitchen", key: "kitchen", icon: FaConciergeBell, permission: 'manage_kitchen' },
  { path: "/billing", key: "billing", icon: FaFileInvoiceDollar, permission: 'manage_billing' },
  { path: "/attendance", key: "Attendance", icon: FaUsers },
  { path: "/hr/productivity-kpi", key: "Leaderboard", icon: FaChartBar },
  { path: "/menu", key: "menu", icon: FaUtensils, permission: 'manage_menu' },
  { path: "/reports", key: "reports", icon: FaChartBar, permission: 'view_reports' },
  { path: "/staff", key: "staff", icon: FaUsers, permission: 'manage_staff' },
];

import { UserContext } from "../App";

const Navbar = () => {
  const { user, role, permissions } = React.useContext(UserContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [language, setLanguage] = useState("en"); // Default language
  const location = useLocation();

  // Get current translations based on the active language
  const t = getTranslation(language);
  const isRTL = language === "ar"; // RTL logic for Arabic

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // 1. Fetch Language Settings from Firebase (Optimized for cost efficiency: one-time read instead of real-time listener)
  useEffect(() => {
    if (!db) return;

    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, "settings", "appSettings");
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.language) {
            setLanguage(data.language);
          }
        }
      } catch (error) {
        console.error("Error fetching settings in Navbar:", error);
      }
    };

    fetchSettings();
  }, []);

  // Close menu automatically when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Prevent background scrolling when mobile menu is open
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
      {/* === TOP APP BAR === */}
      <nav
        dir={isRTL ? "rtl" : "ltr"}
        className="lg:hidden fixed top-0 w-full bg-white shadow-sm border-b border-gray-100 z-50 transition-all duration-300"
      >
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2 rounded-xl">
              <span className="text-emerald-500 text-xl font-black tracking-tighter">M</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-800">
              MealiX
            </span>
          </div>

          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            aria-label="Open Menu"
          >
            <FaBars className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* === SLIDE-OUT DRAWER OVERLAY === */}
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${
          isMenuOpen ? "visible" : "invisible delay-300"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity duration-500 ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Drawer Content */}
        <div
          className={`absolute ${isRTL ? "left-0" : "right-0"} top-0 h-full w-[85%] max-w-xs bg-white shadow-2xl transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${
            isMenuOpen ? "translate-x-0" : (isRTL ? "-translate-x-full" : "translate-x-full")
          }`}
        >
          {/* Drawer Header */}
          <div className="flex-none pt-8 px-6 pb-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t.sidebar.menu}
              </p>
              <h2 className="text-lg font-bold text-gray-800">
                {language === 'ar' ? 'التنقل' : 'Navigation'}
              </h2>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Items (Mapped to translations) */}
          <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1 scroll-smooth">
            {navItems.filter(item => !item.permission || permissions.includes(item.permission)).map(({ path, key, icon: Icon }, index) => {
              const label = t.sidebar[key] || key;
              return (
                <NavLink
                  key={path}
                  to={path}
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
                        className={`w-5 h-5 ${isRTL ? "ml-4" : "mr-4"} transition-transform duration-300 group-hover:scale-110 ${
                          isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-emerald-500"
                        }`}
                      />
                      <span className="relative z-10">{label}</span>
                      {isActive && (
                        <div className={`absolute ${isRTL ? "right-0" : "left-0"} top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-500 ${isRTL ? "rounded-l-full" : "rounded-r-full"}`} />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Bottom Section: Profile & Settings */}
          <div className="flex-none p-4 border-t border-gray-100 bg-gray-50/50">
            {/* Settings Link */}
            {permissions.includes('manage_settings') && (
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
                <FaCog className={`w-5 h-5 ${isRTL ? "ml-3" : "mr-3"} text-gray-400`} />
                <span className="font-medium">{t.sidebar.settings}</span>
              </NavLink>
            )}

            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100 overflow-hidden">
              <div
                onClick={() => setProfileExpanded(!profileExpanded)}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-xl"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="relative">
                    <img
                      src="https://i.pravatar.cc/100"
                      alt="User"
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-gray-800 truncate capitalize">
                      {auth.currentUser?.displayName || role}
                    </span>
                    <span className="text-xs font-medium text-emerald-600 truncate capitalize">
                      {role}
                    </span>
                  </div>
                </div>
                <FaChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                    profileExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Collapsible Profile Sub-menu */}
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
                      <FaUserCircle className={`${isRTL ? "ml-3" : "mr-3"} w-4 h-4`} />
                      {t.sidebar.profile}
                    </button>
                    <button onClick={handleLogout} className="flex w-full items-center px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <FaSignOutAlt className={`${isRTL ? "ml-3" : "mr-3"} w-4 h-4`} />
                      {t.sidebar.logout}
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