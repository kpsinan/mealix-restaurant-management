// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs,
  query,
  where,
  getCountFromServer 
} from "firebase/firestore";
import db, { getSalesByDateRange, getSettings } from "../firebase/firebase"; 
import { getTranslation } from "../translations"; // Adjust path if translations.js is in utils

const Dashboard = () => {
  // --- STATE ---
  const [t, setT] = useState(getTranslation("en")); // Default to English initially
  const [timeRange, setTimeRange] = useState("today"); // 'today', 'yesterday', '7days', '30days'
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeOrders: 0,
    occupiedTables: 0,
    totalTables: 0,
    totalTransactions: 0,
    avgOrderValue: 0
  });
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- HELPER: GET DATE RANGES ---
  const getDateRangeObj = (range) => {
    const end = new Date();
    const start = new Date();
    
    end.setHours(23, 59, 59, 999); // Always end of current day

    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (range === 'yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1); 
      end.setHours(23, 59, 59, 999);
    } else if (range === '7days') {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (range === '30days') {
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }
    return { start, end };
  };

  // --- INITIALIZATION (Load Language & Data) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 0. Fetch Settings for Language (Parallel with data if desired, but here specific for UI)
        const settings = await getSettings();
        if (settings?.language) {
          setT(getTranslation(settings.language));
        }

        const { start, end } = getDateRangeObj(timeRange);

        // 1. Prepare Promises for Parallel Execution
        const tablesPromise = getDocs(collection(db, "tables"));
        const salesPromise = getSalesByDateRange(start, end);
        
        // OPTIMIZATION: Count Active Orders
        const ordersQuery = query(
             collection(db, "orders"), 
             where("status", "in", ["Pending", "Preparing", "Ready"])
        );
        
        const activeOrdersPromise = getCountFromServer(ordersQuery)
             .then(snap => snap.data().count)
             .catch(async () => {
                 console.warn("Optimization fallback: Fetching orders for client-side filter");
                 const snap = await getDocs(collection(db, "orders"));
                 return snap.docs.filter(d => {
                     const s = d.data().status;
                     return s === "Pending" || s === "Preparing" || s === "Ready";
                 }).length;
             });

        // 2. Execute Parallel Requests
        const [tablesSnap, salesData, activeOrdersCount] = await Promise.all([
            tablesPromise,
            salesPromise,
            activeOrdersPromise
        ]);

        // 3. Process Tables
        const tables = tablesSnap.docs.map(d => d.data());
        const occupiedCount = tables.filter(t => t.status === "occupied").length;

        // 4. Process Sales Data
        let revenueSum = 0;
        const dataMap = new Map();

        // Initialize Buckets
        if (timeRange === 'today' || timeRange === 'yesterday') {
            for (let i = 8; i <= 22; i++) { 
                const h = i < 10 ? `0${i}` : `${i}`;
                dataMap.set(`${h}:00`, 0);
            }
        } else {
            const dayCount = timeRange === '30days' ? 30 : 7;
            for (let i = 0; i < dayCount; i++) {
                const d = new Date();
                d.setDate(end.getDate() - i);
                const dateKey = d.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
                dataMap.set(dateKey, 0);
            }
        }

        // Aggregate Sales
        salesData.forEach(sale => {
            const amount = sale.grandTotal || 0; 
            revenueSum += amount;
            const dateObj = sale.finalizedAt;

            let key;
            if (timeRange === 'today' || timeRange === 'yesterday') {
                const h = dateObj.getHours();
                const hStr = h < 10 ? `0${h}` : `${h}`;
                key = `${hStr}:00`;
                if (!dataMap.has(key)) dataMap.set(key, 0);
            } else {
                key = dateObj.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
                if (!dataMap.has(key)) dataMap.set(key, 0); 
            }

            dataMap.set(key, (dataMap.get(key) || 0) + amount);
        });

        // Convert Map to Array & Sort
        let chartData = [];
        if (timeRange === 'today' || timeRange === 'yesterday') {
            chartData = Array.from(dataMap.entries())
                .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                .map(([date, amount]) => ({ date, amount }));
        } else {
            const dayCount = timeRange === '30days' ? 30 : 7;
            const sortedData = [];
            for (let i = dayCount - 1; i >= 0; i--) {
                 const d = new Date();
                 d.setDate(end.getDate() - i);
                 const key = d.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
                 sortedData.push({ date: key, amount: dataMap.get(key) || 0 });
            }
            chartData = sortedData;
        }

        const totalTransactions = salesData.length;
        const avgOrderValue = totalTransactions > 0 ? Math.round(revenueSum / totalTransactions) : 0;

        setStats({
            totalRevenue: revenueSum,
            activeOrders: activeOrdersCount,
            occupiedTables: occupiedCount,
            totalTables: tables.length,
            totalTransactions,
            avgOrderValue
        });
        setGraphData(chartData);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);


  // --- ROBUST CHART COMPONENT ---
  const SalesChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">{t.dashboard.noData}</div>;
    }

    const height = 250;
    const width = 800; 
    const padding = 40;
    const maxVal = Math.max(...data.map(d => d.amount), 1000); 

    const points = data.map((d, i) => {
        const x = padding + (i * ((width - padding * 2) / Math.max(data.length - 1, 1)));
        const y = height - padding - ((d.amount / maxVal) * (height - padding * 2));
        return `${x},${y}`;
    }).join(" ");

    const fillPath = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;
    const labelInterval = Math.ceil(data.length / 8);

    return (
      <div className="w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[600px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-sm select-none">
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" strokeWidth="1" />
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
                <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={fillPath} fill="url(#chartGradient)" />
                <polyline points={points} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                
                {data.map((d, i) => {
                    const x = padding + (i * ((width - padding * 2) / Math.max(data.length - 1, 1)));
                    const y = height - padding - ((d.amount / maxVal) * (height - padding * 2));
                    const showLabel = i % labelInterval === 0;

                    return (
                        <g key={i} className="group cursor-pointer">
                            <circle cx={x} cy={y} r="12" fill="transparent" />
                            <circle cx={x} cy={y} r="4" fill="white" stroke="#10B981" strokeWidth="2" className="transition-all duration-200 group-hover:r-6 group-hover:stroke-[3px]" />
                            {showLabel && (
                                <text x={x} y={height - 15} textAnchor="middle" fontSize="11" fill="#9CA3AF" fontWeight="500">{d.date}</text>
                            )}
                            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                <rect x={x - 35} y={y - 45} width="70" height="35" rx="6" fill="#1F2937" />
                                <path d={`M${x - 6},${y - 11} L${x + 6},${y - 11} L${x},${y - 5} Z`} fill="#1F2937" />
                                <text x={x} y={y - 25} textAnchor="middle" fontSize="10" fill="#9CA3AF">{d.date}</text>
                                <text x={x} y={y - 14} textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">₹{d.amount.toLocaleString()}</text>
                            </g>
                        </g>
                    );
                })}
            </svg>
        </div>
      </div>
    );
  };

  // --- MAPPING FOR UI LABELS ---
  const dateLabels = {
    today: t.dashboard.today,
    yesterday: t.dashboard.yesterday,
    '7days': t.dashboard.last7,
    '30days': t.dashboard.last30
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      
      {/* --- HEADER & FILTERS --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t.dashboard.title}</h1>
          <p className="text-gray-500 mt-1">
             {t.dashboard.overview} • <span className="font-medium text-[#10B981]">{dateLabels[timeRange]}</span>
          </p>
        </div>
        
        {/* Date Filters */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 self-start md:self-auto overflow-x-auto max-w-full">
            {['today', 'yesterday', '7days', '30days'].map(range => (
                <button
                    key={range}
                    onClick={() => !loading && setTimeRange(range)}
                    disabled={loading}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                        timeRange === range 
                        ? "bg-[#10B981] text-white shadow-md" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                    {dateLabels[range]}
                </button>
            ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10B981] mb-3"></div>
            <span>{t.dashboard.syncing}</span>
        </div>
      ) : (
        <>
            {/* --- STATS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Revenue Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <svg className="w-16 h-16 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v2h2v-2zm0-8h2v6h-2V5z"/></svg>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.dashboard.totalRevenue}</p>
                    <h2 className="text-3xl font-bold text-gray-900 mt-1">₹{stats.totalRevenue.toLocaleString()}</h2>
                    <div className="mt-3 flex items-center text-sm font-medium text-emerald-600">
                         {stats.totalTransactions} {t.dashboard.transactions}
                    </div>
                </div>

                {/* Active Orders */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.dashboard.activeOrders}</p>
                    <div className="flex justify-between items-end mt-1">
                        <h2 className="text-3xl font-bold text-gray-900">{stats.activeOrders}</h2>
                    </div>
                    <p className="mt-3 text-xs text-gray-400">{t.dashboard.kitchenPending}</p>
                </div>

                {/* Avg Order Value */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.dashboard.avgOrderValue}</p>
                    <h2 className="text-3xl font-bold text-gray-900 mt-1">₹{stats.avgOrderValue.toLocaleString()}</h2>
                    <p className="mt-3 text-xs text-gray-400">{t.dashboard.revTrans}</p>
                </div>

                {/* Occupancy */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.dashboard.occupancy}</p>
                            <h2 className="text-3xl font-bold text-gray-900 mt-1">
                                {stats.occupiedTables} <span className="text-lg text-gray-400 font-normal">/ {stats.totalTables}</span>
                            </h2>
                        </div>
                        <div className={`p-2 rounded-lg ${stats.occupiedTables > 0 ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"}`}>
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4 overflow-hidden">
                        <div 
                            className="bg-orange-500 h-1.5 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: stats.totalTables > 0 ? `${(stats.occupiedTables / stats.totalTables) * 100}%` : '0%' }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* --- SALES CHART --- */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
                        {t.dashboard.salesTrend}
                    </h2>
                </div>
                <SalesChart data={graphData} />
            </div>

            {/* --- QUICK ACTIONS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-[#10B981] p-6 rounded-2xl shadow-lg shadow-emerald-100 text-white flex flex-col justify-between items-start">
                     <div>
                        <h3 className="text-lg font-bold">{t.dashboard.refreshTitle}</h3>
                        <p className="text-emerald-50 text-sm opacity-90 mt-1">
                            {t.dashboard.refreshDesc}
                        </p>
                     </div>
                     <button onClick={() => window.location.reload()} className="mt-4 bg-white text-[#10B981] px-5 py-2 rounded-lg font-bold text-sm hover:bg-emerald-50 transition w-full md:w-auto">
                        {t.dashboard.syncNow}
                     </button>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                     <h3 className="text-gray-900 font-bold mb-1">{t.dashboard.needReport}</h3>
                     <p className="text-gray-500 text-xs mb-3">{t.dashboard.reportDesc}</p>
                     <a href="/reports/sales" className="text-[#10B981] font-semibold text-sm hover:underline">
                        {t.dashboard.goReport} &rarr;
                     </a>
                 </div>
            </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;