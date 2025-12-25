import React, { useState, useEffect, useMemo } from 'react';
import { 
  getSalesByDateRange 
} from '../firebase/firebase'; // Ensure this path correctly points to your firebase.js
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line
} from 'recharts';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { ClockIcon, ArrowTrendingUpIcon, FireIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const PeakTimeAnalysis = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const start = startOfDay(subDays(new Date(), parseInt(dateRange)));
      const end = endOfDay(new Date());
      const data = await getSalesByDateRange(start, end);
      setSalesData(data);
    } catch (error) {
      console.error("Error fetching peak time data:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Process data to calculate hourly stats
   * Uses the items-based revenue logic for accuracy
   */
  const hourlyStats = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      hourLabel: `${i % 12 || 12} ${i >= 12 ? 'PM' : 'AM'}`,
      orderCount: 0,
      revenue: 0,
    }));

    salesData.forEach(sale => {
      const hour = new Date(sale.finalizedAt).getHours();
      hours[hour].orderCount += 1;

      // Revenue calculation matching MenuPerformance logic
      let saleRevenue = 0;
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          saleRevenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
        });
      } else {
        saleRevenue = Number(sale.totalAmount) || 0;
      }
      
      hours[hour].revenue += saleRevenue;
    });

    return hours;
  }, [salesData]);

  const peakOrderHour = useMemo(() => 
    [...hourlyStats].sort((a, b) => b.orderCount - a.orderCount)[0], 
  [hourlyStats]);

  const peakRevenueHour = useMemo(() => 
    [...hourlyStats].sort((a, b) => b.revenue - a.revenue)[0], 
  [hourlyStats]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Link to="/reports/analytical" className="text-blue-600 flex items-center text-sm font-medium mb-2 hover:underline">
            <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Analytics
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <ClockIcon className="h-8 w-8 text-orange-500" />
            Peak Time Analysis
          </h1>
          <p className="text-gray-500">Optimizing staffing based on {dateRange}-day historical data.</p>
        </div>

        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 font-medium text-gray-700"
        >
          <option value="1">Today</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      {/* High-Level Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <InsightCard 
          title="Busiest Hour" 
          value={peakOrderHour?.orderCount > 0 ? peakOrderHour.hourLabel : 'No Data'} 
          subValue={`${peakOrderHour?.orderCount || 0} Total Orders`}
          icon={<FireIcon className="h-6 w-6" />}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <InsightCard 
          title="Top Revenue Hour" 
          value={peakRevenueHour?.revenue > 0 ? peakRevenueHour.hourLabel : 'No Data'} 
          subValue={`₹${(peakRevenueHour?.revenue || 0).toLocaleString()} Collected`}
          icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <InsightCard 
          title="Average Orders" 
          value={Math.round(salesData.length / parseInt(dateRange))} 
          subValue="Per Day"
          icon={<ClockIcon className="h-6 w-6" />}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Density Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800">Hourly Order Density</h3>
            <p className="text-sm text-gray-400">Total volume of orders placed per hour</p>
          </div>
          <div className="h-80 w-full">
            {loading ? <LoadingState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="hourLabel" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="orderCount" radius={[6, 6, 0, 0]}>
                    {hourlyStats.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.orderCount === peakOrderHour.orderCount && entry.orderCount > 0 ? '#f97316' : '#cbd5e1'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Hourly Revenue Line */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800">Hourly Revenue Trend</h3>
            <p className="text-sm text-gray-400">Financial contribution across the day</p>
          </div>
          <div className="h-80 w-full">
            {loading ? <LoadingState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="hourLabel" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis fontSize={11} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InsightCard = ({ title, value, subValue, icon, color, bgColor }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-all hover:shadow-md">
    <div className={`p-4 rounded-xl ${bgColor} ${color} mr-5`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 font-medium">{subValue}</p>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="h-full flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
  </div>
);

export default PeakTimeAnalysis;