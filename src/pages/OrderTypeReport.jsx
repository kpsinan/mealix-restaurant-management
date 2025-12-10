import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSalesByDateRange, getSettings } from '../firebase/firebase.js'; 
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  Calendar, 
  RefreshCw, 
  Download, 
  Utensils, 
  ShoppingBag, 
  Truck, 
  HelpCircle,
  IndianRupee,
  ArrowLeft,
  FileText,
  Printer,
  MapPin,
  TrendingUp
} from 'lucide-react';

const OrderTypeReport = () => {
  const navigate = useNavigate();
  // Default to last 30 days
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1); 
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: 'SyncServe Restaurant',
    address: '123 Culinary Ave, Food City',
    contact: ''
  });
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0
  });

  // --- COLORS ---
  // Screen Colors (Brighter, Modern)
  const SCREEN_COLORS = {
    'Dine-in': '#3B82F6',   // Blue-500
    'Takeaway': '#10B981',  // Emerald-500
    'Delivery': '#F59E0B',  // Amber-500
    'Other': '#8B5CF6'      // Violet-500
  };
  
  // Print Colors (Professional, High Contrast, Darker)
  const PRINT_COLORS = {
    'Dine-in': '#1E3A8A',    // Navy Blue
    'Takeaway': '#047857',   // Dark Green
    'Delivery': '#B45309',   // Dark Amber
    'Other': '#5B21B6'       // Dark Purple
  };
  const FALLBACK_COLORS = ['#333333', '#666666', '#999999', '#CCCCCC'];

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Sales
      const data = await getSalesByDateRange(new Date(startDate), new Date(endDate));
      processData(data);

      // 2. Fetch Restaurant Settings
      const settings = await getSettings();
      if (settings) {
        setRestaurantInfo({
          name: settings.restaurantName || 'SyncServe Restaurant',
          address: settings.address || '123 Culinary Ave, Food City',
          contact: settings.contact || ''
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const processData = (data) => {
    const stats = {};
    let globalRevenue = 0;
    let globalCount = 0;

    data.forEach(order => {
      // Normalize Order Type
      let type = order.orderType || 'Other';
      if (type.toLowerCase() === 'parcel') type = 'Takeaway';
      // Capitalize first letter
      type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

      // Initialize if new
      if (!stats[type]) {
        stats[type] = { name: type, value: 0, revenue: 0, count: 0 };
      }

      // Aggregate
      const orderAmount = Number(order.grandTotal || order.totalAmount || 0);
      stats[type].value += orderAmount; // Value for Pie Chart
      stats[type].revenue += orderAmount;
      stats[type].count += 1;

      globalRevenue += orderAmount;
      globalCount += 1;
    });

    // Sort by Revenue Descending
    const chartData = Object.values(stats).sort((a, b) => b.revenue - a.revenue);

    setSalesData(chartData);
    setSummary({
      totalRevenue: globalRevenue,
      totalOrders: globalCount,
      avgOrderValue: globalCount > 0 ? globalRevenue / globalCount : 0
    });
  };

  // --- FORMATTERS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'dine-in': return <Utensils className="w-5 h-5 text-blue-500" />;
      case 'takeaway': return <ShoppingBag className="w-5 h-5 text-green-500" />;
      case 'delivery': return <Truck className="w-5 h-5 text-amber-500" />;
      default: return <HelpCircle className="w-5 h-5 text-violet-500" />;
    }
  };

  // --- CSS CHART HELPERS (FOR PRINT RELIABILITY) ---
  const getConicGradient = () => {
    let currentAngle = 0;
    const parts = salesData.map((item, index) => {
      const percentage = summary.totalRevenue ? (item.revenue / summary.totalRevenue) * 100 : 0;
      const color = PRINT_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
      const start = currentAngle;
      const end = currentAngle + percentage;
      currentAngle = end;
      return `${color} ${start}% ${end}%`;
    });
    // Fallback for empty data
    if (parts.length === 0) return 'gray 0% 100%';
    return `conic-gradient(${parts.join(', ')})`;
  };

  const getMaxRevenue = () => Math.max(...salesData.map(d => d.revenue), 1);
  const getMaxOrders = () => Math.max(...salesData.map(d => d.count), 1);

  const exportToCSV = () => {
    if (salesData.length === 0) return;
    const headers = ["Order Type", "Total Orders", "Gross Sales", "Avg Ticket Size", "Contribution %"];
    const rows = salesData.map(item => {
      const avgTicket = item.count ? (item.revenue / item.count).toFixed(2) : 0;
      const contribution = summary.totalRevenue ? ((item.revenue / summary.totalRevenue) * 100).toFixed(1) + '%' : '0%';
      return [item.name, item.count, item.revenue.toFixed(2), avgTicket, contribution];
    });
    rows.push(["TOTAL", summary.totalOrders, summary.totalRevenue.toFixed(2), "-", "100%"]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OrderTypeReport_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 relative font-sans">
      
      {/* ================================================================
        PRINT STYLES ( STRICTLY FOR PDF/PAPER )
        ================================================================
      */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          /* RESET & HIDE SCREEN ELEMENTS */
          body {
            background: white;
            color: #111;
            font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .screen-only, nav, header, aside, button, .no-print { display: none !important; }
          .print-only { display: block !important; }

          /* MAIN CONTAINER */
          .print-container {
            width: 100%;
            max-width: 100%;
          }

          /* TYPOGRAPHY */
          h1 { font-size: 24pt; font-weight: 800; margin-bottom: 2pt; text-transform: uppercase; letter-spacing: 0.5px; color: #111; }
          .header-meta { font-size: 10pt; color: #444; margin-bottom: 2pt; }
          
          h2 { font-size: 14pt; font-weight: 700; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 5px; text-transform: uppercase; }
          h3 { font-size: 11pt; font-weight: 700; margin-bottom: 10px; color: #333; }
          
          /* METRIC BOXES */
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px; }
          .summary-box { border: 1px solid #ccc; padding: 12px; background: #f9f9f9; }
          .summary-label { font-size: 9pt; text-transform: uppercase; color: #666; font-weight: 600; }
          .summary-value { font-size: 16pt; font-weight: 800; margin-top: 4px; color: #000; }

          /* CHART LAYOUT */
          .charts-row { display: grid; grid-template-columns: 45% 50%; gap: 5%; margin-bottom: 30px; page-break-inside: avoid; height: 220px; }
          .chart-container { border: 1px solid #eee; padding: 10px; }

          /* CSS PIE CHART */
          .css-pie {
            width: 140px; height: 140px; border-radius: 50%;
            margin: 0 auto;
            border: 1px solid #eee;
          }
          .pie-legend { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 15px; font-size: 8pt; }
          .legend-item { display: flex; align-items: center; gap: 4px; }
          .color-dot { width: 8px; height: 8px; display: inline-block; }

          /* CSS BAR CHART */
          .css-bar-chart { 
            display: flex; align-items: flex-end; justify-content: space-around; 
            height: 150px; width: 100%; padding-top: 10px; padding-bottom: 5px;
            border-bottom: 1px solid #333;
          }
          .bar-group { display: flex; flex-direction: column; align-items: center; width: 100%; position: relative; }
          .bar { width: 60%; background: #333; transition: none; min-height: 2px; }
          .bar-label { font-size: 7pt; margin-top: 5px; text-align: center; font-weight: 600; text-transform: uppercase; }
          .bar-value { font-size: 7pt; margin-bottom: 3px; font-weight: bold; }

          /* DATA TABLE */
          table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 20px; }
          thead th { 
            background-color: #eee !important; 
            color: #000; 
            font-weight: 700; 
            text-transform: uppercase; 
            font-size: 8pt; 
            padding: 8px 6px; 
            border-bottom: 2px solid #000;
            text-align: right;
          }
          thead th:first-child { text-align: left; }
          td { border-bottom: 1px solid #ddd; padding: 6px; text-align: right; color: #333; }
          td:first-child { text-align: left; font-weight: 600; color: #000; }
          tr.total-row td { border-top: 2px solid #000; border-bottom: none; font-weight: 800; font-size: 10pt; background-color: #f9f9f9; }

          /* FOOTER */
          .report-footer {
            margin-top: 40px; 
            border-top: 1px solid #000; 
            padding-top: 8px; 
            font-size: 8pt; 
            display: flex; 
            justify-content: space-between;
            color: #555;
          }
        }
        
        /* HIDE PRINT CONTENT ON SCREEN */
        .print-only { display: none; }
      `}</style>


      {/* ================================================================
        SCREEN VIEW (Interactive Web UI)
        ================================================================
      */}
      <div className="screen-only space-y-8">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/reports/sales-and-revenue')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Order Type Analysis</h1>
              <p className="text-sm text-gray-500">Track revenue across Dine-in, Takeaway, and Delivery</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-sm focus:ring-0 p-0 text-gray-700 w-32 cursor-pointer"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-sm focus:ring-0 p-0 text-gray-700 w-32 cursor-pointer"
              />
            </div>
            
            <button 
              onClick={fetchData}
              disabled={loading}
              className={`p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-shadow shadow-sm ${loading ? 'opacity-70' : ''}`}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

            <button 
              onClick={() => window.print()}
              disabled={salesData.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              <span className="font-medium">Print Report</span>
            </button>
          </div>
        </div>

        {/* Screen Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm font-medium text-blue-600 mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</h3>
            </div>
            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-blue-50 to-transparent"></div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm font-medium text-green-600 mb-1">Total Orders</p>
              <h3 className="text-3xl font-bold text-gray-900">{summary.totalOrders}</h3>
            </div>
            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-green-50 to-transparent"></div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm font-medium text-purple-600 mb-1">Avg. Ticket Size</p>
              <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(summary.avgOrderValue)}</h3>
            </div>
            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-purple-50 to-transparent"></div>
          </div>
        </div>

        {/* Screen Content */}
        {loading && salesData.length === 0 ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-gray-100">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <span className="text-sm text-gray-500">Loading data...</span>
            </div>
          </div>
        ) : (
          <>
            {salesData.length === 0 ? (
              <div className="bg-white rounded-xl p-16 text-center border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No Data Available</h3>
                <p className="text-gray-500 mt-1">Try selecting a different date range.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Interactive Screen Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      Revenue Contribution
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={salesData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {salesData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={SCREEN_COLORS[entry.name] || FALLBACK_COLORS[index]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-gray-500" />
                      Order Volume
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#6B7280', fontSize: 12 }} 
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                          />
                          <Tooltip cursor={{ fill: '#f9fafb' }} />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                            {salesData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={SCREEN_COLORS[entry.name] || FALLBACK_COLORS[index]} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Screen Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Detailed Breakdown</h3>
                    <button 
                      onClick={exportToCSV}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" /> Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Channel</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Orders</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Gross Sales</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Avg. Ticket</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Contrib. %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {salesData.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: SCREEN_COLORS[item.name] }}></span>
                                <span className="font-medium text-gray-900">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">{item.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 font-bold">{formatCurrency(item.revenue)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">{formatCurrency(item.count ? item.revenue / item.count : 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {summary.totalRevenue ? ((item.revenue / summary.totalRevenue) * 100).toFixed(1) : 0}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ================================================================
        PRINT ONLY VIEW ( Strict A4 Report Layout )
        ================================================================
      */}
      <div className="print-only print-container">
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #111', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1>{restaurantInfo.name}</h1>
            <p className="header-meta">{restaurantInfo.address}</p>
            {restaurantInfo.contact && <p className="header-meta">Tel: {restaurantInfo.contact}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ borderBottom: 'none', marginBottom: '5px', fontSize: '16pt' }}>ORDER TYPE REPORT</h2>
            <p style={{ fontSize: '10pt', color: '#666' }}>Period: <strong>{startDate}</strong> to <strong>{endDate}</strong></p>
            <p style={{ fontSize: '9pt', color: '#888', marginTop: '4px' }}>Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="summary-grid">
          <div className="summary-box">
            <div className="summary-label">Total Revenue</div>
            <div className="summary-value">{formatCurrency(summary.totalRevenue)}</div>
          </div>
          <div className="summary-box">
            <div className="summary-label">Total Orders</div>
            <div className="summary-value">{summary.totalOrders}</div>
          </div>
          <div className="summary-box">
            <div className="summary-label">Avg Order Value</div>
            <div className="summary-value">{formatCurrency(summary.avgOrderValue)}</div>
          </div>
        </div>

        {/* Charts Section (Print Safe CSS Only) */}
        {salesData.length > 0 && (
          <div className="charts-row">
            {/* Pie Chart */}
            <div className="chart-container">
              <h3>Revenue Contribution</h3>
              <div style={{ padding: '10px 0', textAlign: 'center' }}>
                <div className="css-pie" style={{ background: getConicGradient() }}></div>
                <div className="pie-legend">
                  {salesData.map((item, i) => (
                    <div key={item.name} className="legend-item">
                      <span className="color-dot" style={{ background: PRINT_COLORS[item.name] || FALLBACK_COLORS[i] }}></span>
                      <span>{item.name} ({((item.revenue / summary.totalRevenue) * 100).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar Chart (Order Volume) */}
            <div className="chart-container">
              <h3>Order Volume By Type</h3>
              <div className="css-bar-chart">
                {salesData.map((item, i) => {
                   const maxVal = getMaxOrders();
                   const heightPercent = maxVal > 0 ? (item.count / maxVal) * 85 : 0; // scale to 85% max height to leave room for label
                   return (
                     <div key={item.name} className="bar-group">
                       <div className="bar-value">{item.count}</div>
                       <div 
                         className="bar" 
                         style={{ 
                           height: `${Math.max(heightPercent, 2)}%`, 
                           backgroundColor: PRINT_COLORS[item.name] || FALLBACK_COLORS[i] 
                         }} 
                       ></div>
                       <div className="bar-label">{item.name}</div>
                     </div>
                   );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Formal Data Table */}
        <div style={{ marginTop: '30px' }}>
          <h3>Order Type Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th width="30%">Type</th>
                <th width="15%">Orders</th>
                <th width="20%">Gross Sales</th>
                <th width="20%">Avg Ticket</th>
                <th width="15%">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.count}</td>
                  <td>{formatCurrency(item.revenue)}</td>
                  <td>{formatCurrency(item.count ? item.revenue / item.count : 0)}</td>
                  <td>{summary.totalRevenue ? ((item.revenue / summary.totalRevenue) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>TOTAL</td>
                <td>{summary.totalOrders}</td>
                <td>{formatCurrency(summary.totalRevenue)}</td>
                <td>{formatCurrency(summary.avgOrderValue)}</td>
                <td>100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="report-footer">
          <span>SyncServe Restaurant Management System</span>
          <span>Printed by: Administrator</span>
        </div>
      </div>
    </div>
  );
};

export default OrderTypeReport;