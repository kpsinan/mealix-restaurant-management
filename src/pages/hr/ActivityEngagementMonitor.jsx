import React, { useState, useEffect } from 'react';
import { 
  getStaff, 
  getSalesByDateRange, 
  getAttendanceRecords 
} from '../../firebase/firebase'; 
import { 
  ClockIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  UserMinusIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

const ActivityEngagementMonitor = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, idle, offline
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      
      // Look back 24 hours for meaningful sales context
      const startOfWindow = new Date();
      startOfWindow.setHours(today.getHours() - 24);

      // 1. Fetch Core Data
      const [staffList, recentSales, attendanceLogs] = await Promise.all([
        getStaff(),
        getSalesByDateRange(startOfWindow, today), 
        getAttendanceRecords('all') 
      ]);

      // 2. Process Data Per Staff
      const processed = staffList.map(staff => {
        // --- A. ATTENDANCE LOGIC ---
        // Get all logs for this staff
        const staffLogs = attendanceLogs
          .filter(log => log.staffId === staff.staffId)
          .sort((a, b) => b.timestamp - a.timestamp); // Descending (newest first)
        
        const lastLog = staffLogs[0]; // Most recent punch
        
        // Check if "Currently In"
        // Condition: Must have a record, type must be 'in', and it must be from today.
        // (Optional: You can remove the 'today' check if you run 24h shifts)
        const isToday = lastLog && new Date(lastLog.timestamp).toDateString() === new Date().toDateString();
        const isClockedIn = isToday && lastLog.type === 'in';

        // --- B. SALES ACTIVITY LOGIC ---
        const staffSales = recentSales.filter(sale => 
          sale.staffId === staff.staffId || sale.staffName === staff.name
        );
        
        // Find Last Order time
        staffSales.sort((a, b) => b.finalizedAt - a.finalizedAt);
        const lastSale = staffSales[0];

        let minutesSinceLastOrder = null;
        if (lastSale) {
          const diffMs = new Date() - lastSale.finalizedAt;
          minutesSinceLastOrder = Math.floor(diffMs / 60000);
        }

        // --- C. DETERMINE FINAL STATUS ---
        let status = 'Offline'; // Default

        if (isClockedIn) {
            // If they are clocked in, are they working or idle?
            if (minutesSinceLastOrder !== null && minutesSinceLastOrder < 60) {
                status = 'Active'; // Handled order in last 60 mins
            } else {
                status = 'Idle'; // Clocked in but no recent orders
            }
        } else {
            status = 'Offline'; // Not clocked in (or clocked out)
        }

        return {
          ...staff,
          isClockedIn,
          clockInTime: isClockedIn ? lastLog.timestamp : null,
          lastOrderTime: lastSale ? lastSale.finalizedAt : null,
          minutesSinceLastOrder,
          status
        };
      });

      setReportData(processed);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error loading activity monitor:", error);
    } finally {
      setLoading(false);
    }
  };

  // UI Helpers
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Idle': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Offline': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredData = reportData.filter(d => 
    filter === 'all' ? true : d.status.toLowerCase() === filter
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Activity & Engagement Monitor</h1>
          <p className="text-gray-500 mt-1">
              Live tracking of staff attendance and floor activity.
          </p>
        </div>
        <button 
          onClick={fetchData} 
          className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
        >
          <ArrowPathIcon className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Actively Engaging</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {reportData.filter(d => d.status === 'Active').length}
              </h3>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-amber-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Idle (Clocked In)</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {reportData.filter(d => d.status === 'Idle').length}
              </h3>
            </div>
            <ClockIcon className="h-10 w-10 text-amber-500 opacity-20" />
          </div>
          <p className="text-xs text-amber-600 mt-2 font-medium">No orders in last 60 mins</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-gray-400">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Offline / Off-Shift</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {reportData.filter(d => d.status === 'Offline').length}
              </h3>
            </div>
            <UserMinusIcon className="h-10 w-10 text-gray-400 opacity-20" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        {/* Table Filters */}
        <div className="p-4 border-b border-gray-200 flex gap-2 overflow-x-auto">
            {['all', 'active', 'idle', 'offline'].map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                        filter === f 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>

        {loading && reportData.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Syncing with attendance logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Idle Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Insight</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold mr-3">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{staff.name}</div>
                          <div className="text-xs text-gray-500">{staff.role}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusColor(staff.status)}`}>
                        {staff.status.toUpperCase()}
                      </span>
                      {staff.isClockedIn && staff.clockInTime && (
                        <div className="text-[10px] text-gray-400 mt-1 font-medium">
                            In at {new Date(staff.clockInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                        {staff.lastOrderTime ? (
                            <div className="text-sm text-gray-700">
                                {new Date(staff.lastOrderTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                <span className="text-xs text-gray-400 ml-1">
                                  ({new Date(staff.lastOrderTime).toLocaleDateString()})
                                </span>
                            </div>
                        ) : (
                            <span className="text-xs text-gray-400 italic">No recent orders</span>
                        )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                        {staff.minutesSinceLastOrder !== null ? (
                            <span className={`text-sm font-bold ${staff.minutesSinceLastOrder > 60 && staff.isClockedIn ? 'text-rose-500' : 'text-gray-700'}`}>
                                {Math.floor(staff.minutesSinceLastOrder / 60)}h {staff.minutesSinceLastOrder % 60}m
                            </span>
                        ) : (
                            <span className="text-gray-400">-</span>
                        )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                        {staff.status === 'Idle' && (
                            <div className="flex items-center text-amber-600 text-xs font-bold">
                                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                Check Activity
                            </div>
                        )}
                        {staff.status === 'Active' && (
                            <span className="text-green-600 text-xs font-bold">Good Pace</span>
                        )}
                        {staff.status === 'Offline' && (
                            <span className="text-gray-400 text-xs">Not clocked in</span>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
            <span className="text-xs text-gray-400">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
        </div>
      </div>
    </div>
  );
};

export default ActivityEngagementMonitor;