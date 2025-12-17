// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import db from "../firebase/firebase"; // Importing the initialized Firestore instance
import { getTranslation } from "../translations";

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
  FaTachometerAlt,
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

// Sidebar navigation items mapped to translation keys
const navItems = [
  { path: "/dashboard", key: "dashboard", icon: FaTachometerAlt },
  { path: "/", key: "floorPlan", icon: FaHome },
  { path: "/smart-assign", key: "smartAssign", icon: FaMagic },
  { path: "/order", key: "order", icon: FaClipboardList },
  { path: "/menu", key: "menu", icon: FaUtensils },
  { path: "/billing", key: "billing", icon: FaFileInvoiceDollar },
  { path: "/reports", key: "reports", icon: FaChartBar },
  { path: "/staff", key: "staff", icon: FaUsers },
  { path: "/kitchen", key: "kitchen", icon: FaConciergeBell },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [language, setLanguage] = useState("en"); // Default to English initially
  const profileRef = useRef(null);

  // Get translation object based on current state
  const t = getTranslation(language);
  const isRTL = language === 'ar'; // Right-to-Left check for Arabic

  useOutsideClick(profileRef, () => setProfileOpen(false));

  // 1. Load Sidebar Open/Close State from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("sidebarOpen");
    if (stored !== null) setIsOpen(JSON.parse(stored));
  }, []);

  // 2. Save Sidebar Open/Close State to LocalStorage
  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isOpen));
  }, [isOpen]);

  // 3. Real-time Listener for Language Settings from Firebase
  useEffect(() => {
    const settingsRef = doc(db, "settings", "appSettings");

    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.language) {
          setLanguage(data.language);
        }
      }
    }, (error) => {
      console.error("Error listening to settings:", error);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const scrollbarHiddenStyle = {
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  };

  return (
    <aside
      dir={isRTL ? "rtl" : "ltr"}
      className={`sticky top-0 h-screen bg-[#F9FAFB] text-[#1F2937] flex flex-col transition-all duration-300 ease-in-out border-r border-[#E5E7EB] ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? t.sidebar.collapse : t.sidebar.expand}
        className={`absolute ${isRTL ? "-left-3" : "-right-3"} top-8 z-10 p-1.5 rounded-full bg-[#E5E7EB] text-[#1F2937] hover:bg-[#10B981] hover:text-white transition-colors shadow-sm`}
      >
        {isOpen ? <FaChevronLeft className={isRTL ? "rotate-180" : ""} size={14} /> : <FaBars size={14} />}
      </button>

      {/* Top Section: Logo + Nav */}
      <div
        className={`flex-1 flex flex-col ${
          isOpen ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden"
        }`}
        style={scrollbarHiddenStyle}
      >
        {/* Brand */}
        <div className={`flex items-center h-20 px-6 shrink-0 ${!isOpen && "justify-center px-0"}`}>
          <span className="text-[#10B981] text-3xl font-bold">M</span>
          {isOpen && (
            <div className={`ml-4 flex flex-col ${isRTL ? "mr-4 ml-0" : ""}`}>
              <span className="text-2xl font-bold tracking-wider text-[#10B981] leading-tight">
                MealiX
              </span>
              <span className="text-[10px] text-[#6B7280] tracking-wider mt-0.5">
                Developed by Sinan KP
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-2">
          {navItems.map(({ path, key, icon: Icon }) => {
            const translatedLabel = t.sidebar[key] || "Link";
            return (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `relative flex items-center rounded-lg font-medium py-3 px-4 transition-all duration-200 group ${
                    isActive
                      ? "bg-[#D1FAE5] text-[#065F46] shadow-sm"
                      : "hover:bg-[#C6F6D5] hover:text-[#065F46]"
                  } ${!isOpen && "justify-center"}`
                }
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                {isOpen && (
                  <span className={`${isRTL ? "mr-4" : "ml-4"} flex-1 whitespace-nowrap`}>
                    {translatedLabel}
                  </span>
                )}
                {!isOpen && (
                  <span
                    className={`absolute ${
                      isRTL ? "right-full mr-4" : "left-full ml-4"
                    } top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1F2937] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg transition-opacity pointer-events-none z-50`}
                  >
                    {translatedLabel}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Settings & Profile */}
      <div className="px-4 py-4 border-t border-[#E5E7EB]">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `relative flex items-center rounded-lg font-medium py-3 px-4 transition-all duration-200 group ${
              isActive
                ? "bg-[#D1FAE5] text-[#065F46] shadow-sm"
                : "hover:bg-[#C6F6D5] hover:text-[#065F46]"
            } ${!isOpen && "justify-center"}`
          }
        >
          <FaCog className="w-5 h-5 shrink-0" aria-hidden="true" />
          {isOpen && <span className={`${isRTL ? "mr-4" : "ml-4"}`}>{t.sidebar.settings}</span>}
          {!isOpen && (
            <span
              className={`absolute ${
                isRTL ? "right-full mr-4" : "left-full ml-4"
              } top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1F2937] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg transition-opacity pointer-events-none z-50`}
            >
              {t.sidebar.settings}
            </span>
          )}
        </NavLink>

        {/* Profile Section */}
        <div ref={profileRef} className="relative mt-2">
          {profileOpen && (
            <div
              className={`absolute bottom-full mb-2 w-56 ${
                isRTL ? "right-0" : "left-0"
              } bg-white rounded-xl shadow-xl border border-[#E5E7EB] py-2 z-50 transition-all duration-300 ease-in-out transform origin-bottom ${
                profileOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            >
              <div className="px-4 py-3 border-b border-[#E5E7EB]">
                <p className="font-semibold text-[#1F2937]">{t.sidebar.profileDefaultName}</p>
                <p className="text-xs text-[#6B7280] truncate">
                  {t.sidebar.profileDefaultEmail}
                </p>
              </div>
              <button className="flex w-full items-center px-4 py-2.5 text-sm text-[#1F2937] hover:bg-[#ECFDF5] hover:text-[#10B981] transition-colors">
                <FaUserCircle className={`${isRTL ? "ml-3" : "mr-3"}`} /> {t.sidebar.profile}
              </button>
              <button className="flex w-full items-center px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEE2E2] transition-colors">
                <FaSignOutAlt className={`${isRTL ? "ml-3" : "mr-3"}`} /> {t.sidebar.logout}
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
              <div className={`${isRTL ? "mr-3 text-right" : "ml-3 text-left"}`}>
                <p className="font-semibold text-sm text-[#1F2937] leading-none">
                  {t.sidebar.manager}
                </p>
                <p className="text-[10px] text-[#6B7280] mt-1">{t.sidebar.admin}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;