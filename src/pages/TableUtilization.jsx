import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Using Link for the back button
import { getAllSales, getMenuItems } from '../firebase/firebase'; 
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

const CategoryContribution = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, totalItems: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Inventory (menuItems) and Sales (salesRecords)
        // We fetch inventory to ensure we get the correct Category for every item
        const [menuItems, sales] = await Promise.all([
          getMenuItems(),
          getAllSales()
        ]);

        // 2. Create a Lookup Map: Item Name -> Category Name
        // This logic mirrors your MenuPerformance to ensure accuracy
        const itemCategoryMap = {};
        menuItems.forEach(item => {
          if (item.name) {
            // Normalize string to trim spaces
            itemCategoryMap[item.name.trim()] = item.category || 'Uncategorized';
          }
        });

        // 3. Process Sales Items
        const categoryStats = {}; 
        let grandTotalRevenue = 0;
        let grandTotalCount = 0;

        sales.forEach(sale => {
          // Iterate through the items array within each sale
          if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach(item => {
              const itemName = item.name ? item.name.trim() : 'Unknown';
              const itemRevenue = (Number(item.price) || 0) * (Number(item.quantity) || 0);
              const itemQty = Number(item.quantity) || 0;

              // Find Category from Inventory Map
              // If item isn't in inventory map (deleted item), group it as 'Other'
              const categoryName = itemCategoryMap[itemName] || 'Other';

              if (!categoryStats[categoryName]) {
                categoryStats[categoryName] = { name: categoryName, revenue: 0, count: 0 };
              }

              categoryStats[categoryName].revenue += itemRevenue;
              categoryStats[categoryName].count += itemQty;

              grandTotalRevenue += itemRevenue;
              grandTotalCount += itemQty;
            });
          }
        });

        // 4. Format Data for Charts
        const chartData = Object.values(categoryStats)
          .map(stat => ({
            ...stat,
            // Calculate percentage share
            share: grandTotalRevenue > 0 ? ((stat.revenue / grandTotalRevenue) * 100).toFixed(1) : 0
          }))
          .sort((a, b) => b.revenue - a.revenue); // Sort highest revenue first

        setData(chartData);
        setStats({ totalRevenue: grandTotalRevenue, totalItems: grandTotalCount });
        setLoading(false);

      } catch (error) {
        console.error("Error analyzing category contribution:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      {/* Back Button matching Time-Based Comparison style */}
      <Link 
        to="/reports/analytical" 
        className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition-colors w-fit"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        <span className="font-medium">Back to Reports</span>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Category Contribution</h1>
        <p className="text-gray-500 mt-1">Analyze revenue share across different menu categories.</p>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-semibold uppercase">Total Revenue Processed</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">₹{stats.totalRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-semibold uppercase">Total Items Sold</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">{stats.totalItems}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-semibold uppercase">Top Category</p>
          <h3 className="text-2xl font-bold text-green-600 mt-1">{data[0]?.name || 'N/A'}</h3>
          <p className="text-xs text-gray-400">Contributes {data[0]?.share || 0}% of revenue</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Pie Chart: Revenue Share */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Share (%)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                outerRadius={100}
                fill="#8884d8"
                dataKey="revenue"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart: Sales Count */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Items Sold per Category</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="count" fill="#82ca9d" name="Quantity Sold" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-700">Detailed Category Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contribution</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={row.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="font-medium text-gray-900">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{row.count}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">₹{row.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2 min-w-[3rem]">{row.share}%</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ width: `${row.share}%`, backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                      </div>
                    </div>
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

export default CategoryContribution;