import React, { useState, useEffect } from 'react';
import { getAllSales } from '../firebase/firebase'; // Adjust path as needed
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  ChartBarIcon, 
  TrophyIcon 
} from '@heroicons/react/24/outline';

const MenuPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalQty: 0 });

  useEffect(() => {
    fetchAndAnalyzeData();
  }, []);

  const fetchAndAnalyzeData = async () => {
    try {
      const sales = await getAllSales();
      const itemMap = {};
      let grandTotalRevenue = 0;
      let grandTotalQty = 0;

      // Process sales records
      sales.forEach(sale => {
        // Assuming sale.items is an array of { name, quantity, price }
        sale.items?.forEach(item => {
          const itemRevenue = item.price * item.quantity;
          grandTotalRevenue += itemRevenue;
          grandTotalQty += item.quantity;

          if (!itemMap[item.name]) {
            itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
          }
          itemMap[item.name].quantity += item.quantity;
          itemMap[item.name].revenue += itemRevenue;
        });
      });

      // Convert to array and calculate contribution %
      const analyzed = Object.values(itemMap).map(item => ({
        ...item,
        contribution: ((item.revenue / grandTotalRevenue) * 100).toFixed(2)
      })).sort((a, b) => b.revenue - a.revenue);

      setPerformanceData(analyzed);
      setStats({ totalRevenue: grandTotalRevenue, totalQty: grandTotalQty });
    } catch (error) {
      console.error("Analysis Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const top10 = performanceData.slice(0, 10);
  const bottom10 = performanceData.length > 10 ? performanceData.slice(-10).reverse() : [];

  if (loading) return <div className="p-10 text-center">Analyzing Menu Data...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Menu Performance (ABC Analysis)</h1>
        <p className="text-gray-500">Analyze item popularity and revenue contribution.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Total Menu Revenue</p>
          <h2 className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</h2>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Items Sold</p>
          <h2 className="text-2xl font-bold text-blue-600">{stats.totalQty} Units</h2>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Active Menu Items</p>
          <h2 className="text-2xl font-bold text-purple-600">{performanceData.length} Items</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TOP 10 STARS */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-green-100">
          <div className="bg-green-50 p-4 border-b border-green-100 flex items-center gap-2">
            <TrophyIcon className="h-6 w-6 text-green-600" />
            <h3 className="font-bold text-green-800 uppercase tracking-wider">Top 10 Stars (By Revenue)</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Contrib %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {top10.map((item, index) => (
                <tr key={index} className="hover:bg-green-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{item.revenue}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                      {item.contribution}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BOTTOM 10 UNDERPERFORMERS */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-red-100">
          <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-2">
            <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
            <h3 className="font-bold text-red-800 uppercase tracking-wider">Bottom 10 Items</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Contrib %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bottom10.map((item, index) => (
                <tr key={index} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{item.revenue}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                      {item.contribution}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default MenuPerformance;