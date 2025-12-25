import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllSales } from '../firebase/firebase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, 
  ReferenceLine, Legend, ComposedChart
} from 'recharts';
import { 
  ArrowLeftIcon, CalendarDaysIcon, ClockIcon, TableCellsIcon,
  ArrowDownTrayIcon, PrinterIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const AbvAnalysis = () => {
  const [sales, setSales] = useState([]);
  const [activeTab, setActiveTab] = useState('day'); // 'day', 'time', 'table'
  const [viewType, setViewType] = useState('abv'); // 'abv' or 'count'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const data = await getAllSales();
        setSales(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching sales:", error);
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  // --- 11. CACHE PROCESSED RESULTS (useMemo) ---
  const processedData = useMemo(() => {
    if (sales.length === 0) return { day: [], time: [], table: [], global: { abv: 0, orders: 0 } };

    const dateMap = {};
    const hourMap = {};
    const tableMap = {};
    let globalRevenue = 0;
    let validOrdersCount = 0;

    // Initialize 24-hour buckets (Improvement #6)
    for (let i = 0; i < 24; i++) {
      hourMap[i] = { revenue: 0, count: 0 };
    }

    sales.forEach(sale => {
      // 5. EXCLUDE ZERO / INVALID BILLS
      const amount = Number(sale.grandTotal) || 0;
      if (amount <= 0) return; 

      const timestamp = sale.finalizedAt || sale.createdAt;
      let dateObj = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(dateObj.getTime())) return;

      globalRevenue += amount;
      validOrdersCount += 1;

      // 4. ISO DATE KEYS INTERNALLY
      const isoDate = dateObj.toISOString().split('T')[0];
      if (!dateMap[isoDate]) dateMap[isoDate] = { revenue: 0, count: 0, rawDate: dateObj };
      dateMap[isoDate].revenue += amount;
      dateMap[isoDate].count += 1;

      const hour = dateObj.getHours();
      hourMap[hour].revenue += amount;
      hourMap[hour].count += 1;

      const table = sale.tableName || sale.tableId || "Takeaway";
      if (!tableMap[table]) tableMap[table] = { revenue: 0, count: 0 };
      tableMap[table].revenue += amount;
      tableMap[table].count += 1;
    });

    const globalABV = validOrdersCount > 0 ? Math.round(globalRevenue / validOrdersCount) : 0;

    // Format Data & Improvement #10 (Limits)
    const dayData = Object.keys(dateMap).sort().slice(-14).map(iso => {
      const item = dateMap[iso];
      const abv = Math.round(item.revenue / item.count);
      return {
        key: iso,
        display: new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        abv,
        count: item.count,
        isWeekend: [0, 6].includes(item.rawDate.getDay()), // 14. Weekend vs Weekday
        variance: globalABV > 0 ? Math.round(((abv - globalABV) / globalABV) * 100) : 0
      };
    });

    const timeData = Object.keys(hourMap).map(h => {
      const item = hourMap[h];
      const abv = item.count > 0 ? Math.round(item.revenue / item.count) : 0;
      return {
        key: `${h}:00`,
        abv,
        count: item.count,
        variance: globalABV > 0 && abv > 0 ? Math.round(((abv - globalABV) / globalABV) * 100) : 0
      };
    });

    const tableData = Object.keys(tableMap)
      .map(name => ({
        name,
        abv: Math.round(tableMap[name].revenue / tableMap[name].count),
        count: tableMap[name].count
      }))
      .sort((a, b) => b.abv - a.abv)
      .slice(0, 10); // Top 10 Tables

    return { day: dayData, time: timeData, table: tableData, global: { abv: globalABV, orders: validOrdersCount } };
  }, [sales]);

  // --- 1. TAB-AWARE PEAK ABV & 13. DYNAMIC STRATEGY ---
  const activeStats = useMemo(() => {
    const data = processedData[activeTab];
    if (!data || data.length === 0) return { peak: 0, strategy: "No data available." };
    
    const peak = Math.max(...data.map(d => d.abv));
    let strategy = "Analyze segments below the global average to identify upsell opportunities.";

    if (activeTab === 'time') {
      const lowHour = data.find(d => d.abv > 0 && d.abv < processedData.global.abv);
      if (lowHour) strategy = `ABV dips at ${lowHour.key}. Try 'Happy Hour' combos or dessert bundles then.`;
    } else if (activeTab === 'table') {
      strategy = "Tables with low ABV but high volume are perfect targets for side-dish training.";
    }

    return { peak, strategy };
  }, [activeTab, processedData]);

  // --- 16. CSV EXPORT ---
  const exportCSV = () => {
    const data = processedData[activeTab];
    const headers = "Label,ABV,Order Count\n";
    const rows = data.map(d => `${d.display || d.key || d.name},${d.abv},${d.count}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ABV_${activeTab}_Report.csv`);
    a.click();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-4 rounded-xl shadow-2xl border-none">
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase">{label}</p>
          <div className="space-y-1">
            <p className="text-lg font-bold">₹{data.abv.toLocaleString()}</p>
            {/* 2. WEIGHTED ABV (Count in tooltip) */}
            <p className="text-xs text-indigo-300 font-medium">{data.count} orders</p>
            {/* 3. VARIANCE INDICATOR */}
            <p className={`text-[10px] font-bold ${data.variance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.variance >= 0 ? '▲' : '▼'} {Math.abs(data.variance)}% vs Average
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Analytics...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen print:bg-white">
      {/* 17. PRINT FRIENDLY HEADER (Hide UI elements during print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 print:hidden">
        <div>
          <Link to="/reports/analytical" className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Reports</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">ABV Performance</h1>
        </div>

        <div className="flex items-center gap-3">
           <button onClick={() => window.print()} className="p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600"><PrinterIcon className="h-5 w-5"/></button>
           <button onClick={exportCSV} className="p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600"><ArrowDownTrayIcon className="h-5 w-5"/></button>
           <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 ml-2">
            {['day', 'time', 'table'].map(t => (
              <button 
                key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${activeTab === t ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global ABV</p>
          <h2 className="text-2xl font-black text-gray-900">₹{processedData.global.abv.toLocaleString()}</h2>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Peak {activeTab} ABV</p>
          <h2 className="text-2xl font-black text-indigo-600">₹{activeStats.peak.toLocaleString()}</h2>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm md:col-span-2 flex items-center gap-4">
          <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
            <ArrowTrendingUpIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Dynamic Strategy</p>
            <p className="text-sm font-semibold text-gray-700">{activeStats.strategy}</p>
          </div>
        </div>
      </div>

      {/* 9. VIEW TYPE TOGGLE */}
      <div className="flex justify-end mb-4 gap-2 print:hidden">
         <button onClick={()=>setViewType('abv')} className={`text-[10px] px-3 py-1 rounded-full font-bold border ${viewType==='abv' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>ABV View</button>
         <button onClick={()=>setViewType('count')} className={`text-[10px] px-3 py-1 rounded-full font-bold border ${viewType==='count' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>Volume View</button>
      </div>

      {/* CHART AREA */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-6 h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'day' ? (
            <ComposedChart data={processedData.day}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <Tooltip content={<CustomTooltip />} />
              {/* 18. DUAL CHART OVERLAY */}
              <Bar dataKey="count" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} yAxisId={0} />
              <Line 
                type="monotone" 
                dataKey={viewType === 'abv' ? 'abv' : 'count'} 
                stroke="#4f46e5" 
                strokeWidth={4} 
                dot={({payload}) => <circle cx={0} cy={0} r={4} fill={payload.isWeekend ? '#ef4444' : '#4f46e5'} />} 
              />
              {/* 8. REFERENCE LINE */}
              <ReferenceLine y={processedData.global.abv} stroke="#94a3b8" strokeDasharray="5 5" label={{ value: 'Avg', position: 'right', fontSize: 10 }} />
            </ComposedChart>
          ) : activeTab === 'time' ? (
            <AreaChart data={processedData.time}>
              <defs>
                <linearGradient id="colorVar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="key" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="stepAfter" dataKey="abv" stroke="#8b5cf6" fill="url(#colorVar)" strokeWidth={3} />
              <ReferenceLine y={processedData.global.abv} stroke="#94a3b8" strokeDasharray="3 3" />
            </AreaChart>
          ) : (
            <BarChart data={processedData.table} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} width={100} />
              <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
              <Bar dataKey="abv" radius={[0, 10, 10, 0]} barSize={25}>
                {processedData.table.map((entry, index) => (
                  // 7. HIGHLIGHT LOW-ABV ZONES
                  <Cell key={index} fill={entry.abv < processedData.global.abv ? '#fecaca' : '#c7d2fe'} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* FOOTER INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between">
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Weekend Premium</p>
              <p className="text-sm font-semibold mt-1">
                {(() => {
                  const we = processedData.day.filter(d => d.isWeekend).reduce((a, b) => a + b.abv, 0) / (processedData.day.filter(d => d.isWeekend).length || 1);
                  const wd = processedData.day.filter(d => !d.isWeekend).reduce((a, b) => a + b.abv, 0) / (processedData.day.filter(d => !d.isWeekend).length || 1);
                  const diff = Math.round(((we - wd) / wd) * 100);
                  return `Weekend ABV is ${diff}% ${diff >= 0 ? 'higher' : 'lower'} than weekdays.`;
                })()}
              </p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Executive Summary</p>
            <p className="text-sm font-semibold mt-1">
              Your overall ABV is ₹{processedData.global.abv}. Focus on {processedData.table[processedData.table.length-1]?.name || 'low performance'} tables to close the variance gap.
            </p>
        </div>
      </div>
    </div>
  );
};

export default AbvAnalysis;