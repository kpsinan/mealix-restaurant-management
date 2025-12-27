import React, { useState, useEffect } from 'react';
import { 
  getSalesByDateRange, 
  getAllSales // Fallback if needed, but date range is preferred
} from '../../firebase/firebase'; // Adjust path based on your folder structure
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  ClipboardDocumentCheckIcon, 
  UserGroupIcon, 
  TrophyIcon,
  ChevronLeftIcon 
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const StaffOrderVolume = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Default Date Range: Current Month
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Aggregated Data State
  const [staffStats, setStaffStats] = useState([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    activeStaffCount: 0,
    topPerformer: 'N/A'
  });

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Convert string dates to Date objects for the query
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const salesData = await getSalesByDateRange(start, end);
      setSales(salesData);
      processData(salesData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (data) => {
    const statsMap = {};

    // Calculate number of days in selected range for "Avg per day"
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    // Ensure at least 1 day to avoid division by zero
    const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 

    data.forEach(sale => {
      // Check for staff info in sale record. 
      // Adjust 'waiterName' or 'staffName' based on how you save it in 'addSaleRecord'
      const staffName = sale.waiterName || sale.staffName || "Unassigned";
      
      if (!statsMap[staffName]) {
        statsMap[staffName] = {
          name: staffName,
          totalOrders: 0,
          totalRevenue: 0,
        };
      }
      
      statsMap[staffName].totalOrders += 1;
      // Assuming sale has totalAmount, nice to have for context even if not primary metric
      statsMap[staffName].totalRevenue += (Number(sale.totalAmount) || 0);
    });

    // Convert map to array and sort by Total Orders
    const chartData = Object.values(statsMap).map(staff => ({
      ...staff,
      avgPerDay: (staff.totalOrders / daysDiff).toFixed(1)
    })).sort((a, b) => b.totalOrders - a.totalOrders);

    setStaffStats(chartData);

    // Update Summary Cards
    const totalOrders = chartData.reduce((acc, curr) => acc + curr.totalOrders, 0);
    const topPerformer = chartData.length > 0 ? chartData[0].name : 'N/A';

    setSummary({
      totalOrders,
      activeStaffCount: chartData.length,
      topPerformer
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <Link 
            to="/staff-and-hr" 
            className="flex items-center text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors mb-2 group"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to HR Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Staff Order Volume</h1>
          <p className="text-gray-500 mt-1">Analyze operational workload and order handling performance.</p>
        </div>

        {/* Date Filters */}
        <div className="flex gap-4 mt-4 md:mt-0 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-full mr-4">
            <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Orders Handled</p>
            <p className="text-2xl font-bold text-gray-800">{summary.totalOrders}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-50 rounded-full mr-4">
            <UserGroupIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Staff</p>
            <p className="text-2xl font-bold text-gray-800">{summary.activeStaffCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-full mr-4">
            <TrophyIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Top Performer</p>
            <p className="text-2xl font-bold text-gray-800">{summary.topPerformer}</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Order Volume Distribution</h3>
        <div className="h-80 w-full">
          {loading ? (
             <div className="flex h-full items-center justify-center text-gray-400">Loading chart...</div>
          ) : staffStats.length === 0 ? (
             <div className="flex h-full items-center justify-center text-gray-400">No data available for this range.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar 
                  dataKey="totalOrders" 
                  name="Total Orders" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Detailed Performance Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-800 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Staff Name</th>
                <th className="px-6 py-4 text-center">Total Orders</th>
                <th className="px-6 py-4 text-center">Avg. Orders / Day</th>
                <th className="px-6 py-4 text-right">Workload Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center">Loading data...</td></tr>
              ) : staffStats.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center">No sales records found.</td></tr>
              ) : (
                staffStats.map((staff, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-400">#{index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{staff.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-emerald-100 text-emerald-700 py-1 px-3 rounded-full font-bold">
                        {staff.totalOrders}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">{staff.avgPerDay}</td>
                    <td className="px-6 py-4 text-right">
                      {summary.totalOrders > 0 
                        ? ((staff.totalOrders / summary.totalOrders) * 100).toFixed(1) 
                        : 0}%
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

export default StaffOrderVolume;