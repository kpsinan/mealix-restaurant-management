import React, { useState, useEffect } from 'react';
import { getSalesByDateRange } from '../../firebase/firebase'; // Adjust path if your firebase.js is elsewhere
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  BanknotesIcon,
  ChevronLeftIcon 
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const StaffSalesContribution = () => {
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
  const [staffMetrics, setStaffMetrics] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    topEarner: 'N/A',
    highestAbvStaff: 'N/A',
    highestAbvValue: 0
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
      console.error("Error fetching sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (data) => {
    // Debugging: Log data to console to verify structure if needed
    if (data.length > 0) {
      console.log("Latest Sales Record Structure:", data[0]);
    }

    const statsMap = {};
    let globalTotalRevenue = 0;

    data.forEach(sale => {
      // 1. Robust Staff Name Check
      const staffName = sale.waiterName || sale.staffName || sale.employeeName || "Unassigned";

      // 2. Robust Amount Check (Fixes the 0 revenue issue)
      // Checks multiple common field names for the bill total
      const rawAmount = 
        sale.totalAmount || 
        sale.grandTotal || 
        sale.total || 
        sale.finalAmount || 
        sale.billTotal || 
        0;
        
      const amount = Number(rawAmount) || 0; 

      if (!statsMap[staffName]) {
        statsMap[staffName] = {
          name: staffName,
          totalOrders: 0,
          totalRevenue: 0,
        };
      }
      
      statsMap[staffName].totalOrders += 1;
      statsMap[staffName].totalRevenue += amount;
      globalTotalRevenue += amount;
    });

    // Calculate ABV and format data for chart/table
    const metricsData = Object.values(statsMap).map(staff => ({
      ...staff,
      // Avg Bill Value = Total Revenue / Total Orders
      abv: staff.totalOrders > 0 ? (staff.totalRevenue / staff.totalOrders).toFixed(2) : 0,
      // Contribution % = (Staff Revenue / Global Revenue) * 100
      contribution: globalTotalRevenue > 0 ? ((staff.totalRevenue / globalTotalRevenue) * 100).toFixed(1) : 0
    })).sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by Revenue descending

    setStaffMetrics(metricsData);

    // Calculate Summary Stats
    const topEarner = metricsData.length > 0 ? metricsData[0].name : 'N/A';
    
    // Find highest ABV (upselling champion)
    let maxAbv = 0;
    let maxAbvName = 'N/A';
    metricsData.forEach(s => {
      const val = parseFloat(s.abv);
      if (val > maxAbv) {
        maxAbv = val;
        maxAbvName = s.name;
      }
    });

    setSummary({
      totalRevenue: globalTotalRevenue,
      topEarner,
      highestAbvStaff: maxAbvName,
      highestAbvValue: maxAbv
    });
  };

  // Helper for formatting currency (Indian Rupee)
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
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <Link 
            to="/staff-and-hr" 
            className="flex items-center text-sm font-medium text-gray-500 hover:text-amber-600 transition-colors mb-2 group"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to HR Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Sales Contribution</h1>
          <p className="text-gray-500 mt-1">Identify top revenue generators and analyze upselling performance.</p>
        </div>

        {/* Date Filters */}
        <div className="flex gap-4 mt-4 md:mt-0 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-full mr-4">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Staff Revenue</p>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-full mr-4">
            <ChartBarIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Top Revenue Generator</p>
            <p className="text-xl font-bold text-gray-800">{summary.topEarner}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-indigo-50 rounded-full mr-4">
            <BanknotesIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Highest Avg Bill (Upseller)</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-gray-800">{summary.highestAbvStaff}</p>
              <span className="text-sm text-gray-500">({formatCurrency(summary.highestAbvValue)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Share by Staff</h3>
        <div className="h-80 w-full">
          {loading ? (
             <div className="flex h-full items-center justify-center text-gray-400">Loading chart...</div>
          ) : staffMetrics.length === 0 ? (
             <div className="flex h-full items-center justify-center text-gray-400">No data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffMetrics} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar 
                  dataKey="totalRevenue" 
                  name="Total Revenue Generated" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                >
                  {staffMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#d97706' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Detailed Financial Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-800 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Staff Name</th>
                <th className="px-6 py-4 text-center">Orders Count</th>
                <th className="px-6 py-4 text-right">Total Revenue</th>
                <th className="px-6 py-4 text-right">Avg Bill Value (ABV)</th>
                <th className="px-6 py-4 text-right">Contribution %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center">Loading data...</td></tr>
              ) : staffMetrics.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center">No sales records found.</td></tr>
              ) : (
                staffMetrics.map((staff, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-400">#{index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{staff.name}</td>
                    <td className="px-6 py-4 text-center text-gray-500">{staff.totalOrders}</td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600">
                      {formatCurrency(staff.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-indigo-600">
                      {formatCurrency(staff.abv)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{staff.contribution}%</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full" 
                            style={{ width: `${staff.contribution}%` }}
                          ></div>
                        </div>
                      </div>
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

export default StaffSalesContribution;