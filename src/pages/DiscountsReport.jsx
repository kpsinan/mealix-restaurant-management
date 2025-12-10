// src/pages/DiscountsReport.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// FIX: Added explicit .js extension to resolve build error
import { getSalesByDateRange, getSettings } from '../firebase/firebase.js'; 
import { 
  TagIcon, 
  CurrencyRupeeIcon, 
  TicketIcon, 
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ArrowLeftIcon, 
  PrinterIcon
} from '@heroicons/react/24/outline';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { format } from 'date-fns';

const DiscountsReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  
  // Default to current month
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [metrics, setMetrics] = useState({
    totalDiscountGiven: 0,
    discountCount: 0,
    avgDiscount: 0,
    discountPercentage: 0, // Burn Rate
    totalGrossSales: 0,
    maxDiscountValues: { amount: 0, reason: 'N/A' }
  });

  const [reasonStats, setReasonStats] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [data, appSettings] = await Promise.all([
        getSalesByDateRange(new Date(dateRange.startDate), new Date(dateRange.endDate)),
        getSettings()
      ]);
      
      if (appSettings) setSettings(appSettings);

      // Filter only orders that had a discount
      const discountedOrders = data.filter(order => (Number(order.discount) || 0) > 0);
      
      processMetrics(data, discountedOrders);
      setSalesData(discountedOrders);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  const processMetrics = (allSales, discountedSales) => {
    // 1. Calculate Totals
    const totalDiscount = discountedSales.reduce((sum, order) => sum + (Number(order.discount) || 0), 0);
    // Handle both 'subTotal' (from updated billing) and legacy 'totalAmount'
    const totalGross = allSales.reduce((sum, order) => sum + (Number(order.subTotal) || Number(order.totalAmount) || 0), 0);
    
    // Find Max Discount
    let maxDisc = { amount: 0, reason: 'N/A' };
    discountedSales.forEach(o => {
      if ((Number(o.discount) || 0) > maxDisc.amount) {
        maxDisc = { amount: o.discount, reason: o.discountReason || 'Manual' };
      }
    });

    // 2. Group by Reason/Code
    const reasons = {};
    discountedSales.forEach(order => {
      // Fallback for old data without reasons
      const reason = order.discountReason || (order.couponCode ? `Coupon: ${order.couponCode}` : 'Manual Override');
      if (!reasons[reason]) reasons[reason] = 0;
      reasons[reason] += Number(order.discount);
    });

    const reasonChartData = Object.keys(reasons).map(key => ({
      name: key,
      value: reasons[key]
    })).sort((a, b) => b.value - a.value);

    // 3. Daily Trend
    const daily = {};
    discountedSales.forEach(order => {
      const dateKey = order.finalizedAt ? format(order.finalizedAt, 'dd MMM') : 'Unknown';
      if (!daily[dateKey]) daily[dateKey] = 0;
      daily[dateKey] += Number(order.discount);
    });

    const dailyChartData = Object.keys(daily).map(key => ({
      date: key,
      amount: daily[key]
    }));

    setMetrics({
      totalDiscountGiven: totalDiscount,
      discountCount: discountedSales.length,
      avgDiscount: discountedSales.length ? (totalDiscount / discountedSales.length) : 0,
      discountPercentage: totalGross ? ((totalDiscount / totalGross) * 100) : 0,
      totalGrossSales: totalGross,
      maxDiscountValues: maxDisc
    });

    setReasonStats(reasonChartData);
    setDailyStats(dailyChartData);
  };

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  // --- EXPORT FUNCTIONS ---

  const handleExportCSV = () => {
    if (!salesData.length) {
      alert("No data to export.");
      return;
    }

    const headers = [
      "Date", "Time", "Bill ID", "Table", "Staff", "Order Type", 
      "Bill Amount", "Discount Amount", "Discount %", "Reason", "Coupon Code"
    ];

    const csvRows = [headers.join(",")];

    salesData.forEach(order => {
      const date = order.finalizedAt ? format(order.finalizedAt, 'yyyy-MM-dd') : '';
      const time = order.finalizedAt ? format(order.finalizedAt, 'HH:mm') : '';
      const billAmt = Number(order.subTotal) || Number(order.totalAmount) || 0;
      const discAmt = Number(order.discount) || 0;
      const percent = billAmt > 0 ? ((discAmt / billAmt) * 100).toFixed(2) : 0;
      
      const row = [
        date,
        time,
        `"${order.id}"`, // ID
        `"${order.tableName || 'N/A'}"`,
        `"${order.staffName || 'N/A'}"`,
        `"${order.orderType || 'N/A'}"`,
        billAmt,
        discAmt,
        `${percent}%`,
        `"${order.discountReason || 'Manual'}"`,
        `"${order.couponCode || ''}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Discount_Report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Indian Palette for Charts
  const COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen print:bg-white print:p-0">
      
      {/* 1. PROFESSIONAL PRINT HEADER (Hidden on Screen, Visible on Print) */}
      <div className="hidden print:block mb-8 border-b-2 border-gray-800 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{settings?.storeName || 'Restaurant Discount Report'}</h1>
            <p className="text-sm text-gray-600 mt-1">{settings?.address || 'Address Not Available'}</p>
            <p className="text-sm text-gray-600">Ph: {settings?.contactNumber || 'N/A'}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">Discount Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">
              Period: <span className="font-semibold">{format(new Date(dateRange.startDate), 'dd MMM yyyy')}</span> to <span className="font-semibold">{format(new Date(dateRange.endDate), 'dd MMM yyyy')}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Generated: {format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
          </div>
        </div>
      </div>

      {/* Back Navigation - Hidden in Print */}
      <div className="mb-6 print:hidden">
        <Link 
          to="/reports/sales-and-revenue" 
          className="inline-flex items-center text-gray-500 hover:text-orange-600 transition-colors font-medium"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Reports Dashboard
        </Link>
      </div>

      {/* Screen Header Section - Hidden in Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Discount & Offer Report</h1>
          <p className="text-gray-500 mt-1 text-sm">Analyze "Burn Rate", coupon usage, and staff complimentaries.</p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-2 items-center bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 px-2">
              <span className="text-gray-400 text-xs uppercase font-semibold">From</span>
              <input 
                type="date" 
                name="startDate" 
                value={dateRange.startDate} 
                onChange={handleDateChange}
                className="border-none p-1 text-sm text-gray-700 focus:ring-0 bg-transparent font-medium"
              />
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex items-center space-x-2 px-2">
              <span className="text-gray-400 text-xs uppercase font-semibold">To</span>
              <input 
                type="date" 
                name="endDate" 
                value={dateRange.endDate} 
                onChange={handleDateChange}
                className="border-none p-1 text-sm text-gray-700 focus:ring-0 bg-transparent font-medium"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-1 ml-2">
              <button 
                onClick={handleExportCSV}
                className="bg-gray-100 hover:bg-green-50 hover:text-green-600 text-gray-600 p-2 rounded-md transition-colors border border-transparent hover:border-green-200" 
                title="Export to CSV"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={handlePrint}
                className="bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 p-2 rounded-md transition-colors border border-transparent hover:border-blue-200" 
                title="Print Report"
              >
                <PrinterIcon className="h-5 w-5" />
              </button>
            </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:grid-cols-4 print:gap-2">
            {/* Total Discount */}
            <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-orange-500 print:shadow-none print:border print:p-3">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Discount</p>
                  <h3 className="text-2xl font-extrabold text-gray-800 mt-1">₹{metrics.totalDiscountGiven.toLocaleString('en-IN')}</h3>
                  <p className="text-xs text-gray-400 mt-1">{metrics.discountCount} Bills</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-full h-12 w-12 flex items-center justify-center print:hidden">
                  <CurrencyRupeeIcon className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Burn Rate */}
            <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-red-500 print:shadow-none print:border print:p-3">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Burn Rate</p>
                  <h3 className="text-2xl font-extrabold text-gray-800 mt-1">{metrics.discountPercentage.toFixed(2)}%</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                     of ₹{metrics.totalGrossSales.toLocaleString('en-IN')} Sales
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-full h-12 w-12 flex items-center justify-center print:hidden">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Average Discount */}
            <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-blue-500 print:shadow-none print:border print:p-3">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Avg Disc / Bill</p>
                  <h3 className="text-2xl font-extrabold text-gray-800 mt-1">₹{metrics.avgDiscount.toFixed(0)}</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-full h-12 w-12 flex items-center justify-center print:hidden">
                  <TagIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Highest Single Discount */}
            <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-green-500 print:shadow-none print:border print:p-3">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Max Discount</p>
                  <h3 className="text-2xl font-extrabold text-gray-800 mt-1">₹{metrics.maxDiscountValues.amount.toLocaleString('en-IN')}</h3>
                  <p className="text-xs text-gray-500 mt-1 truncate w-24 print:w-auto" title={metrics.maxDiscountValues.reason}>
                    {metrics.maxDiscountValues.reason}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full h-12 w-12 flex items-center justify-center print:hidden">
                  <TicketIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row - Often hidden in print if desired, but kept here with adjustments */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 print:break-inside-avoid print:hidden">
            {/* Pie Chart: Reasons */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col print:shadow-none print:border">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                Discount Reasons
              </h3>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasonStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {reasonStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Daily Trend */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col print:shadow-none print:border">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Daily Discount Trend</h3>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip 
                      cursor={{fill: '#F3F4F6'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                    />
                    <Bar dataKey="amount" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Discount Given" barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Transaction Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-t-2 print:border-gray-800 print:rounded-none">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center print:bg-white print:px-0">
              <h3 className="text-lg font-bold text-gray-800">Discounted Bill Log</h3>
              <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded-full print:border print:bg-white">
                {salesData.length} Records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 print:divide-gray-300">
                <thead className="bg-gray-50 print:bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider print:px-2 print:text-black">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider print:px-2 print:text-black">Bill Details</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider print:px-2 print:text-black">Reason / Code</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider print:px-2 print:text-black">Bill Amt</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider print:px-2 print:text-black">Discount</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:px-2 print:text-black">% Given</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 print:divide-gray-300">
                  {salesData.length > 0 ? (
                    salesData.sort((a,b) => b.finalizedAt - a.finalizedAt).map((order) => {
                      const billAmt = Number(order.subTotal) || Number(order.totalAmount) || 0;
                      const discAmt = Number(order.discount) || 0;
                      const percent = billAmt > 0 ? ((discAmt / billAmt) * 100).toFixed(1) : 0;
                      const isHigh = percent > 15; // Highlight if discount > 15%

                      return (
                        <tr key={order.id} className="hover:bg-orange-50 transition-colors print:hover:bg-transparent">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:px-2 print:py-2 print:text-black">
                             {order.finalizedAt ? format(order.finalizedAt, 'dd MMM, hh:mm a') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap print:px-2 print:py-2">
                            <div className="text-sm font-medium text-gray-900 print:text-black">{order.tableName || 'Takeaway'}</div>
                            <div className="text-xs text-gray-500 print:text-gray-600">{order.staffName || 'Unknown Staff'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap print:px-2 print:py-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${order.couponCode ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} print:border print:bg-transparent print:text-black print:px-0`}>
                              {order.discountReason || order.couponCode || 'Manual'}
                            </span>
                            {order.couponCode && <div className="text-xs text-gray-400 mt-1 print:text-black">Code: {order.couponCode}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:px-2 print:py-2 print:text-black">
                            ₹{billAmt.toLocaleString('en-IN')}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${isHigh ? 'text-red-600' : 'text-gray-700'} print:px-2 print:py-2 print:text-black`}>
                            - ₹{discAmt.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center print:px-2 print:py-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${isHigh ? 'bg-red-100 text-red-700' : 'bg-green-50 text-green-700'} print:border print:bg-transparent print:text-black print:px-0`}>
                              {percent}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-gray-400 italic">
                        No discounts found in this period. Great for revenue, boring for reports!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Print Footer */}
          <div className="hidden print:flex mt-8 border-t pt-4 text-xs text-gray-500 justify-between">
            <p>Printed from SyncServe Restaurant Management System</p>
            <p>Page 1 of 1</p>
          </div>
        </>
      )}
    </div>
  );
};

export default DiscountsReport;