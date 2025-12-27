// src/pages/hr/StaffLoadRevenueBalance.jsx
import React, { useState, useEffect } from 'react';
import { 
  getStaff, 
  getSalesByDateRange 
} from '../../firebase/firebase';
import { 
  ScaleIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

const StaffLoadRevenueBalance = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // Default last 30 days

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Define Time Window
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      // 2. Fetch Data
      const [staffList, salesData] = await Promise.all([
        getStaff(),
        getSalesByDateRange(startDate, endDate)
      ]);

      // 3. Aggregate Metrics per Staff
      const staffMetrics = {};
      
      // Initialize zero values for all staff
      staffList.forEach(s => {
        staffMetrics[s.staffId] = {
          id: s.staffId,
          name: s.name,
          role: s.role,
          orders: 0,
          revenue: 0,
          abv: 0
        };
      });

      // Aggregate Sales
      salesData.forEach(sale => {
        // Match sale to staff (using ID preferred, fallback to name)
        const staffId = sale.staffId; 
        
        if (staffMetrics[staffId]) {
          staffMetrics[staffId].orders += 1;
          staffMetrics[staffId].revenue += (parseFloat(sale.totalAmount) || 0);
        } else {
            // Handle edge case where sale has staff ID not in current directory (e.g. deleted staff)
            // Optional: Add to a "Former Staff" bucket if needed
        }
      });

      // 4. Calculate Team Averages (Baselines)
      const activeStaff = Object.values(staffMetrics).filter(s => s.orders > 0);
      const totalOrders = activeStaff.reduce((sum, s) => sum + s.orders, 0);
      const totalRevenue = activeStaff.reduce((sum, s) => sum + s.revenue, 0);
      
      const avgOrders = activeStaff.length ? totalOrders / activeStaff.length : 0;
      const avgRevenue = activeStaff.length ? totalRevenue / activeStaff.length : 0;

      // 5. Final Processing & Categorization
      const processedData = Object.values(staffMetrics)
        .filter(s => s.orders > 0) // Hide staff with 0 activity to avoid skewing table
        .map(s => {
          const abv = s.orders > 0 ? s.revenue / s.orders : 0;
          
          // Determine Insight Category
          let category = 'Balanced';
          let recommendation = 'Maintain';
          let color = 'text-gray-600 bg-gray-100';

          const loadRatio = s.orders / avgOrders; // > 1 means higher than avg load
          const revRatio = s.revenue / avgRevenue; // > 1 means higher than avg rev

          if (loadRatio > 1.1 && revRatio > 1.1) {
            category = 'Star Performer';
            recommendation = 'Reward & Retain';
            color = 'text-purple-700 bg-purple-100';
          } else if (loadRatio > 1.1 && revRatio < 0.9) {
            category = 'High Load / Low Yield';
            recommendation = 'Train Upselling'; // High effort, low return
            color = 'text-amber-700 bg-amber-100';
          } else if (loadRatio < 0.9 && revRatio > 1.1) {
            category = 'Efficient / High Value';
            recommendation = 'Assign VIP Tables'; // Low effort, high return
            color = 'text-blue-700 bg-blue-100';
          } else if (loadRatio < 0.8 && revRatio < 0.8) {
            category = 'Underutilized';
            recommendation = 'Reassign / Monitor';
            color = 'text-red-700 bg-red-100';
          }

          return { ...s, abv, category, recommendation, color, loadRatio, revRatio };
        });

      // Sort by Revenue descending
      setReportData(processedData.sort((a, b) => b.revenue - a.revenue));

    } catch (error) {
      console.error("Error calculating load balance:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Load vs. Revenue Balance</h1>
          <p className="text-gray-500 mt-1">Identify overworked staff and revenue gaps.</p>
        </div>
        
        <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          {['7', '30', '90'].map((val) => (
            <button
              key={val}
              onClick={() => setDateRange(val)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                dateRange === val 
                ? 'bg-cyan-100 text-cyan-700' 
                : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Last {val} Days
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Calculating workload analytics...</div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Orders (Load)
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    ABV (Avg Bill)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider pl-8">
                    Managerial Insight
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                    {/* Staff Name & Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">
                          {staff.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                          <div className="text-xs text-gray-500">{staff.role}</div>
                        </div>
                      </div>
                    </td>

                    {/* Orders (Load) */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900 font-medium">{staff.orders}</div>
                      <div className="text-xs text-gray-400">orders</div>
                    </td>

                    {/* Revenue */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900 font-bold">
                        ${staff.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* ABV */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${staff.abv < 30 ? 'text-red-600' : 'text-green-600'}`}>
                        ${staff.abv.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">per order</div>
                    </td>

                    {/* Insight Category */}
                    <td className="px-6 py-4 whitespace-nowrap pl-8">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${staff.color}`}>
                        {staff.category}
                      </span>
                    </td>

                    {/* Recommended Action */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {staff.recommendation === 'Train Upselling' && (
                            <div className="flex items-center text-amber-600">
                                <ArrowTrendingUpIcon className="h-4 w-4 mr-1"/>
                                <span>Upskill Needed</span>
                            </div>
                        )}
                        {staff.recommendation === 'Reassign / Monitor' && (
                            <div className="flex items-center text-red-500">
                                <ExclamationCircleIcon className="h-4 w-4 mr-1"/>
                                <span>Review Role</span>
                            </div>
                        )}
                         {staff.recommendation === 'Reward & Retain' && (
                            <div className="flex items-center text-purple-600">
                                <ScaleIcon className="h-4 w-4 mr-1"/>
                                <span>Retain</span>
                            </div>
                        )}
                         {staff.recommendation === 'Assign VIP Tables' && (
                            <div className="flex items-center text-blue-600">
                                <ArrowTrendingUpIcon className="h-4 w-4 mr-1"/>
                                <span>Optimize</span>
                            </div>
                        )}
                        {staff.recommendation === 'Maintain' && (
                            <span className="text-gray-400">-</span>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {reportData.length === 0 && (
             <div className="p-8 text-center text-gray-500">No active staff data found for this period.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffLoadRevenueBalance;