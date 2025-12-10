import React, { useState, useEffect } from 'react';
// FIX: Reverting to standard relative import without extension to match file system behavior
import { getSalesByDateRange } from '../firebase/firebase';
import { 
  ArrowDownTrayIcon, 
  PrinterIcon, 
  FunnelIcon,
  ClockIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';

const HourlySalesReport = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesData, setSalesData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [peakHour, setPeakHour] = useState(null);
  const [lowHour, setLowHour] = useState(null);

  // Fetch and Process Data
  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch sales from Firestore
      const sales = await getSalesByDateRange(new Date(startDate), new Date(endDate));
      setSalesData(sales);
      processHourlyData(sales);
      
      // DEBUG: Log the first sale to see data structure if counts exist but revenue is 0
      if (sales.length > 0) {
        console.log("Sample Sale Data:", sales[0]);
      }

    } catch (error) {
      console.error("Error fetching hourly sales:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to safely parse amounts from various formats (strings, numbers, currency symbols)
  const parseAmount = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove currency symbols, commas, spaces
    const cleanStr = value.toString().replace(/[^0-9.-]+/g, "");
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  const processHourlyData = (sales) => {
    // 1. Initialize 24-hour buckets
    const buckets = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00 - ${(i + 1).toString().padStart(2, '0')}:00`,
      shortLabel: `${i.toString().padStart(2, '0')}:00`,
      count: 0,
      total: 0,
    }));

    // 2. Aggregate Data
    sales.forEach(sale => {
      if (sale.finalizedAt) {
        // Handle both Firestore Timestamp and JS Date objects
        const date = sale.finalizedAt.toDate ? sale.finalizedAt.toDate() : new Date(sale.finalizedAt);
        const hour = date.getHours();
        
        // Robust Amount Extraction: Checks multiple common field names
        const rawAmount = sale.totalAmount || sale.total || sale.grandTotal || sale.amount || 0;
        const amount = parseAmount(rawAmount);

        if (hour >= 0 && hour < 24) {
          buckets[hour].total += amount;
          buckets[hour].count += 1;
        }
      }
    });

    // 3. Find Peak and Low Hours
    // FIX 1: Initialize maxVal to 0 so we don't pick a 0-value hour as peak
    let maxVal = 0; 
    let minVal = Infinity;
    let maxHour = null;
    let minHour = null;

    buckets.forEach(b => {
      // FIX 1 & 5: Ensure strictly greater than 0 for peak consideration
      if (b.total > maxVal) {
        maxVal = b.total;
        maxHour = b;
      }
      // Low hour logic: must have sales to be considered "slow", otherwise it's just closed/empty
      if (b.total > 0 && b.total < minVal) {
        minVal = b.total;
        minHour = b;
      }
    });

    setHourlyData(buckets);
    setPeakHour(maxHour);
    setLowHour(minHour || { label: 'N/A', total: 0 }); // Fallback if no sales
  };

  // --- Export Functions ---

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    // CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Time Slot,Orders Count,Total Revenue\n";

    // CSV Rows
    hourlyData.forEach(row => {
      // FIX 3: Ensure 2 decimal places in CSV export
      csvContent += `${row.label},${row.count},${row.total.toFixed(2)}\n`;
    });

    // Download Trigger
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hourly_sales_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for max value to scale charts
  const maxRevenue = hourlyData.reduce((acc, curr) => Math.max(acc, curr.total), 0) || 1;

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* Header Section (Hidden on Print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hourly Sales Report</h1>
          <p className="text-gray-500 mt-1">Analyze performance by time of day to optimize staffing and prep.</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
           <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export CSV
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
          >
            <PrinterIcon className="w-5 h-5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Filters (Hidden on Print) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end print:hidden">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm p-2.5 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm p-2.5 border"
          />
        </div>
        <div className="pb-1">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
          >
            <FunnelIcon className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* --- PRINTABLE CONTENT STARTS HERE --- */}
      <div className="print:block print:w-full">
        
        {/* Print Only Header */}
        <div className="hidden print:block mb-8 text-center border-b pb-4">
          <h1 className="text-2xl font-bold text-black">Hourly Sales Report</h1>
          <p className="text-gray-600">Period: {startDate} to {endDate}</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading sales data...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:grid-cols-3">
              {/* Total Revenue */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:border-gray-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider">Total Revenue</h3>
                  <div className="p-2 bg-green-100 rounded-full print:hidden">
                    <CurrencyRupeeIcon className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{hourlyData.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {hourlyData.reduce((acc, curr) => acc + curr.count, 0)} Total Orders
                </p>
              </div>

              {/* Peak Hour */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:border-gray-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider">Peak Hour</h3>
                  <div className="p-2 bg-blue-100 rounded-full print:hidden">
                    <ArrowDownTrayIcon className="w-5 h-5 text-blue-600 rotate-180" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {peakHour ? peakHour.label : 'N/A'}
                </p>
                <p className="text-sm text-green-600 font-medium mt-1">
                  ₹{peakHour ? peakHour.total.toLocaleString() : 0} Revenue
                </p>
              </div>

              {/* Low Hour */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:border-gray-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider">Slowest Hour</h3>
                  <div className="p-2 bg-orange-100 rounded-full print:hidden">
                    <ClockIcon className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {lowHour ? lowHour.label : 'N/A'}
                </p>
                <p className="text-sm text-orange-600 font-medium mt-1">
                  ₹{lowHour ? lowHour.total.toLocaleString() : 0} Revenue
                </p>
              </div>
            </div>

            {/* Hourly Performance Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 print:break-inside-avoid">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Hourly Revenue Trend</h3>
              
              <div className="h-64 flex items-end justify-between gap-1 print:h-48 border-b border-gray-200 relative">
                {/* Y-Axis Grid Lines (Optional visual guide) */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                   <div className="border-t border-dashed border-gray-100 w-full h-px"></div>
                   <div className="border-t border-dashed border-gray-100 w-full h-px"></div>
                   <div className="border-t border-dashed border-gray-100 w-full h-px"></div>
                   <div className="border-t border-dashed border-gray-100 w-full h-px"></div>
                </div>

                {hourlyData.map((data, index) => {
                  // FIX 4: Explicit Number casting to avoid NaN
                  const totalVal = Number(data.total) || 0;
                  const heightPercentage = maxRevenue > 0 ? (totalVal / maxRevenue) * 100 : 0;
                  const isPeak = peakHour && peakHour.hour === data.hour;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col justify-end group relative h-full">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none w-32 text-center print:hidden shadow-lg">
                        <div className="font-bold">{data.label}</div>
                        <div>₹{totalVal.toFixed(2)}</div>
                        <div>{data.count} Orders</div>
                      </div>

                      {/* Bar */}
                      <div className="w-full flex items-end h-full px-[1px] relative z-0">
                         <div 
                          className={`w-full rounded-t-sm transition-all duration-500 ${isPeak ? 'bg-blue-600' : 'bg-blue-300 hover:bg-blue-400'}`}
                          style={{ height: `${heightPercentage}%` }}
                        ></div>
                      </div>
                      
                      {/* X-Axis Label - Aligned to Center of Bar */}
                      {index % 3 === 0 && (
                        <div className="absolute top-full flex flex-col items-center left-1/2 -translate-x-1/2">
                          {/* Tick Mark */}
                          <div className="h-1.5 w-px bg-gray-400"></div>
                          {/* Label Text */}
                          <div className="mt-1 transform -rotate-45 origin-top-left translate-x-1">
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">
                               {data.shortLabel}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-12 text-center text-xs text-gray-400">
                Hours (24h format)
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-gray-300">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 print:bg-gray-100">
                <h3 className="font-semibold text-gray-800">Detailed Breakdown</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold tracking-wide text-gray-500 uppercase bg-gray-50 print:bg-gray-100">
                    <th className="px-6 py-3">Time Slot</th>
                    <th className="px-6 py-3 text-right">Orders Count</th>
                    <th className="px-6 py-3 text-right">Average Order Value</th>
                    <th className="px-6 py-3 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {hourlyData.map((row) => (
                    <tr key={row.hour} className={`hover:bg-gray-50 ${row.total === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                      <td className="px-6 py-3 text-sm font-medium">
                        {row.label}
                        {peakHour && peakHour.hour === row.hour && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 print:hidden">
                            Peak
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm text-right">
                        {row.count}
                      </td>
                      <td className="px-6 py-3 text-sm text-right">
                        {/* FIX 2: Ensure 2 decimal places for AOV */}
                        ₹{row.count > 0 ? (row.total / row.count).toFixed(2) : '0.00'}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-bold">
                        ₹{row.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <td className="px-6 py-3 text-sm">TOTAL</td>
                    <td className="px-6 py-3 text-sm text-right">
                      {hourlyData.reduce((acc, curr) => acc + curr.count, 0)}
                    </td>
                    <td className="px-6 py-3 text-sm text-right">-</td>
                    <td className="px-6 py-3 text-sm text-right text-blue-700">
                      ₹{hourlyData.reduce((acc, curr) => acc + curr.total, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 text-center text-xs text-gray-400 print:block hidden">
              Generated by SyncServe • {new Date().toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HourlySalesReport;