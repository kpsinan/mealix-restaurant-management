import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line 
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import { ArrowLeftIcon, ShoppingBagIcon, BanknotesIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { getSalesByDateRange } from '../firebase/firebase'; // Adjust path based on your file structure

const SalesTrendAnalysis = () => {
  const [days, setDays] = useState(7);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendData();
  }, [days]);

  const fetchTrendData = async () => {
    setLoading(true);
    try {
      // Define the time window based on user selection
      const start = startOfDay(subDays(new Date(), days - 1));
      const end = new Date();
      
      // Fetching from your existing salesRecords collection
      const data = await getSalesByDateRange(start, end);
      setSalesData(data);
    } catch (error) {
      console.error("Error fetching trends:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Data Transformation logic
   * Calculates revenue using the (Price * Quantity) logic from MenuPerformance.jsx
   */
  const chartData = useMemo(() => {
    const interval = eachDayOfInterval({
      start: subDays(new Date(), days - 1),
      end: new Date(),
    });

    return interval.map(day => {
      // Filter sales belonging to this specific calendar day
      const daySales = salesData.filter(sale => isSameDay(new Date(sale.finalizedAt), day));
      
      let dayRevenue = 0;
      let dayOrders = daySales.length;

      daySales.forEach(sale => {
        // Checking for items array as seen in MenuPerformance.jsx
        if (sale.items && Array.isArray(sale.items)) {
          sale.items.forEach(item => {
            dayRevenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
          });
        } else if (sale.totalAmount) {
          // Fallback if totalAmount is directly on the record
          dayRevenue += Number(sale.totalAmount);
        }
      });

      return {
        date: format(day, 'MMM dd'),
        revenue: dayRevenue,
        orders: dayOrders,
      };
    });
  }, [salesData, days]);

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <Link to="/reports/analytical" className="text-blue-600 flex items-center text-sm font-medium mb-2 hover:underline">
            <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Analytics
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Sales Trend Analysis</h1>
          <p className="text-gray-500">Monitoring revenue and order flow for the last {days} days.</p>
        </div>

        {/* Range Selector Filter */}
        <div className="flex bg-white rounded-xl shadow-sm border p-1 border-gray-200">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                days === d 
                ? 'bg-green-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Revenue" 
          value={`₹${totalRevenue.toLocaleString()}`} 
          icon={<BanknotesIcon />} 
          color="text-green-600" 
          bg="bg-green-50"
        />
        <StatCard 
          title="Total Orders" 
          value={totalOrders} 
          icon={<ShoppingBagIcon />} 
          color="text-blue-600" 
          bg="bg-blue-50"
        />
        <StatCard 
          title="Avg Daily Sales" 
          value={`₹${Math.round(totalRevenue / days).toLocaleString()}`} 
          icon={<ArrowTrendingUpIcon />} 
          color="text-indigo-600" 
          bg="bg-indigo-50"
        />
      </div>

      {/* Main Analysis Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Growth Trajectory</h3>
            <p className="text-xs text-gray-400">Comparing daily revenue against order volume</p>
          </div>
          <div className="flex items-center space-x-6 text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center text-green-600">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span> Revenue
            </div>
            <div className="flex items-center text-blue-500">
              <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span> Orders
            </div>
          </div>
        </div>

        <div className="h-[450px] w-full">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
              <p className="text-gray-400 text-sm animate-pulse">Processing sales data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}} 
                  dy={15} 
                />
                <YAxis 
                  yAxisId="left" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}} 
                  tickFormatter={(value) => `₹${value}`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}} 
                />
                <Tooltip 
                  cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    padding: '12px' 
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue"
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={1500}
                />
                <Area
                  yAxisId="right"
                  type="monotone" 
                  dataKey="orders" 
                  name="Orders"
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fill="transparent"
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ title, value, icon, color, bg }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-transform hover:scale-[1.02]">
    <div className={`p-4 rounded-xl ${bg} ${color} mr-5`}>
      {React.cloneElement(icon, { className: "h-7 w-7" })}
    </div>
    <div>
      <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-black text-gray-800">{value}</p>
    </div>
  </div>
);

export default SalesTrendAnalysis;