import React, { useState, useEffect } from 'react';
import { getSalesByDateRange } from '../../firebase/firebase'; // Adjust path based on folder structure
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  ChartBarSquareIcon, 
  BoltIcon, 
  CurrencyDollarIcon,
  ChevronLeftIcon,
  ScaleIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const StaffProductivityKPI = () => {
  const [loading, setLoading] = useState(true);
  
  // Default Date Range: Current Month (Ideal for Monthly Reviews)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [staffData, setStaffData] = useState([]);
  const [summary, setSummary] = useState({
    avgOrdersPerStaff: 0,
    avgRevenuePerStaff: 0,
    globalAov: 0,
    topPerformer: 'N/A'
  });

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const salesData = await getSalesByDateRange(start, end);
      processData(salesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (data) => {
    const statsMap = {};
    let globalOrders = 0;
    let globalRevenue = 0;

    // 1. Aggregation
    data.forEach(sale => {
      const staffName = sale.waiterName || sale.staffName || sale.employeeName || "Unassigned";
      
      const rawAmount = 
        sale.totalAmount || 
        sale.grandTotal || 
        sale.total || 
        sale.finalAmount || 
        sale.billTotal || 
        0;
      const amount = Number(rawAmount) || 0;

      if (!statsMap[staffName]) {
        statsMap[staffName] = { name: staffName, orders: 0, revenue: 0 };
      }
      
      statsMap[staffName].orders += 1;
      statsMap[staffName].revenue += amount;
      
      globalOrders++;
      globalRevenue += amount;
    });

    // 2. Calculate Global Averages for Benchmarking
    const activeStaffCount = Object.keys(statsMap).length || 1;
    const avgOrders = globalOrders / activeStaffCount;
    const avgRevenue = globalRevenue / activeStaffCount;
    const globalAov = globalOrders > 0 ? (globalRevenue / globalOrders) : 0;

    // 3. Process Individual Staff Metrics & Assign Appraisal Tags
    const processed = Object.values(statsMap).map(staff => {
      const aov = staff.orders > 0 ? staff.revenue / staff.orders : 0;
      
      // --- APPRAISAL LOGIC ---
      let badges = [];
      let reviewAction = "Maintain";
      let reviewColor = "text-gray-500 bg-gray-50 border-gray-200";

      // Badge: Financial Contribution
      if (staff.revenue > avgRevenue * 1.2) badges.push({ label: "Top Earner", color: "text-green-700 bg-green-50 border-green-200" });
      
      // Badge: Workload/Volume
      if (staff.orders > avgOrders * 1.2) badges.push({ label: "High Volume", color: "text-blue-700 bg-blue-50 border-blue-200" });
      
      // Badge: Quality/Upselling
      if (aov > globalAov * 1.1) badges.push({ label: "Upseller", color: "text-purple-700 bg-purple-50 border-purple-200" });

      // Manager's Insight (Automated Review Suggestion)
      if (staff.revenue > avgRevenue && staff.orders > avgOrders) {
        reviewAction = "🌟 Bonus Eligible";
        reviewColor = "text-amber-700 bg-amber-50 border-amber-200 font-bold";
      } else if (staff.revenue > avgRevenue) {
        reviewAction = "🎯 High Value";
        reviewColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
      } else if (staff.orders > avgOrders) {
        reviewAction = "🔨 Train Upselling"; // Hard worker but low revenue
        reviewColor = "text-blue-700 bg-blue-50 border-blue-200";
      } else {
        reviewAction = "⚠️ Needs Coaching";
        reviewColor = "text-red-700 bg-red-50 border-red-200";
      }

      return {
        ...staff,
        aov: aov.toFixed(0),
        badges,
        reviewAction,
        reviewColor
      };
    }).sort((a, b) => b.revenue - a.revenue); // Sort by Revenue for "Top Performer" view

    setStaffData(processed);

    setSummary({
      avgOrdersPerStaff: avgOrders.toFixed(1),
      avgRevenuePerStaff: avgRevenue.toFixed(0),
      globalAov: globalAov.toFixed(0),
      topPerformer: processed.length > 0 ? processed[0].name : 'N/A'
    });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <Link 
            to="/staff-and-hr" 
            className="flex items-center text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors mb-2 group"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to HR Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Performance & Appraisal</h1>
          <p className="text-gray-500 mt-1">Data-driven insights for reviews, bonuses, and coaching.</p>
        </div>

        {/* Date Filter */}
        <div className="flex gap-4 mt-4 md:mt-0 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Review Period Start</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Review Period End</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Benchmarks (Context for Appraisals) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Team Benchmark</p>
          <div className="flex items-baseline gap-2 mt-1">
             <span className="text-2xl font-bold text-gray-800">{summary.avgOrdersPerStaff}</span>
             <span className="text-xs text-gray-400">orders/staff</span>
          </div>
          <div className="mt-2 text-xs text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded">
            Target Volume
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Revenue Benchmark</p>
          <div className="flex items-baseline gap-2 mt-1">
             <span className="text-2xl font-bold text-gray-800">{formatCurrency(summary.avgRevenuePerStaff)}</span>
             <span className="text-xs text-gray-400">avg revenue</span>
          </div>
           <div className="mt-2 text-xs text-green-600 bg-green-50 inline-block px-2 py-1 rounded">
            Target Output
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Quality Benchmark</p>
          <div className="flex items-baseline gap-2 mt-1">
             <span className="text-2xl font-bold text-gray-800">{formatCurrency(summary.globalAov)}</span>
             <span className="text-xs text-gray-400">global AOV</span>
          </div>
           <div className="mt-2 text-xs text-purple-600 bg-purple-50 inline-block px-2 py-1 rounded">
            Upsell Baseline
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl shadow-sm border border-amber-100">
          <p className="text-amber-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckBadgeIcon className="h-4 w-4" /> Top Performer
          </p>
          <p className="text-xl font-bold text-gray-900 mt-2 truncate">{summary.topPerformer}</p>
          <p className="text-xs text-amber-700 mt-1">Leading candidate for bonus</p>
        </div>
      </div>

      {/* Visual Analysis Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800">Efficiency Matrix (Volume vs. Revenue)</h3>
          <div className="flex gap-4 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-sm"></span> Revenue (Bar)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded-full"></span> Orders (Line)</span>
          </div>
        </div>
        
        <div className="h-80 w-full">
          {loading ? (
             <div className="flex h-full items-center justify-center text-gray-400">Loading chart...</div>
          ) : staffData.length === 0 ? (
             <div className="flex h-full items-center justify-center text-gray-400">No data for this period.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={staffData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} scale="point" padding={{ left: 30, right: 30 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#8b5cf6" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" axisLine={false} tickLine={false} />
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   formatter={(value, name) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? 'Revenue' : 'Orders']}
                />
                <Bar yAxisId="left" dataKey="revenue" barSize={30} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Appraisal & Review Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Staff Review Sheet</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-100 text-gray-800 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Staff Name</th>
                <th className="px-6 py-4 text-center">Output (Revenue)</th>
                <th className="px-6 py-4 text-center">Workload (Orders)</th>
                <th className="px-6 py-4 text-center">Quality (AOV)</th>
                <th className="px-6 py-4">Performance Badges</th>
                <th className="px-6 py-4 text-center">Manager's Insight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan="6" className="px-6 py-8 text-center">Loading data...</td></tr>
              ) : staffData.length === 0 ? (
                 <tr><td colSpan="6" className="px-6 py-8 text-center">No records found.</td></tr>
              ) : (
                staffData.map((staff, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800">
                        {staff.name}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-800">
                      {formatCurrency(staff.revenue)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {staff.orders}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500">
                      {formatCurrency(staff.aov)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {staff.badges.length > 0 ? (
                            staff.badges.map((badge, i) => (
                                <span key={i} className={`text-[10px] px-2 py-0.5 rounded border ${badge.color}`}>
                                    {badge.label}
                                </span>
                            ))
                        ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded border text-gray-400 bg-gray-50 border-gray-100">No Badges</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs px-3 py-1 rounded-full border ${staff.reviewColor}`}>
                        {staff.reviewAction}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffProductivityKPI;