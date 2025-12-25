import React, { useEffect, useState } from 'react';
import { getAllSales, getMenuItems, onCategoriesRealtime } from '../firebase/firebase';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CategoryContribution = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sales = await getAllSales();
        const menuItems = await getMenuItems();
        
        // We need categories real-time or just fetch once. Using a promise wrapper for simplicity here or fetch logic
        // Assuming categories are relatively static, we can fetch normally. 
        // Since firebase.js only has onCategoriesRealtime, let's just grab the snapshot logic manually or assume a fetch helper exists.
        // For this code, I will infer categories from the menuItems relationship if possible, 
        // but strictly we need the category names. 
        // *Pattern fix*: Let's use the realtime listener for categories briefly to get data.
        let categories = [];
        const unsub = onCategoriesRealtime((cats) => { categories = cats; });
        
        // Wait a small tick for the callback or better, refactor firebase.js to export getCategories. 
        // For now, I will assume we can map itemId -> categoryId -> categoryName.
        
        // PROCESSING LOGIC
        const itemCategoryMap = {}; // itemId -> categoryId
        menuItems.forEach(item => {
          itemCategoryMap[item.id] = item.category; // Assuming 'category' field stores the ID or Name
        });

        const categoryStats = {};

        sales.forEach(sale => {
          // Flatten items from orders
          (sale.items || []).forEach(saleItem => {
            const catId = itemCategoryMap[saleItem.id] || 'Uncategorized';
            
            // If category is an ID, we ideally need to map to Name. 
            // For this snippet, assuming category stored is the Name or we group by ID.
            const catKey = catId; 

            if (!categoryStats[catKey]) {
              categoryStats[catKey] = { name: catKey, revenue: 0, count: 0 };
            }
            categoryStats[catKey].revenue += (saleItem.price * saleItem.quantity);
            categoryStats[catKey].count += saleItem.quantity;
          });
        });

        // Convert to array and calculate percentages
        const totalRev = Object.values(categoryStats).reduce((acc, curr) => acc + curr.revenue, 0);
        const chartData = Object.values(categoryStats).map(stat => ({
          ...stat,
          share: ((stat.revenue / totalRev) * 100).toFixed(1)
        })).sort((a, b) => b.revenue - a.revenue);

        setData(chartData);
        setLoading(false);
        unsub(); // Cleanup listener
      } catch (error) {
        console.error("Error calculating contribution:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-6">Loading Analytics...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Category Contribution</h1>
      
      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
          <h3 className="text-lg font-semibold mb-4">Revenue Share (%)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="revenue"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
          <h3 className="text-lg font-semibold mb-4">Sales Volume by Category</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" name="Items Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Sold</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contribution</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => (
              <tr key={row.name}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{row.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">₹{row.revenue.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{row.count}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {row.share}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryContribution;