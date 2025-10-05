// src/pages/PaymentModeReport.jsx
import React, { useState, useEffect, useRef } from "react";
import { getSalesByDateRange, getSettings } from "../firebase/firebase";

// --- SVG Icons ---
const FaFilePdf = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M416 224V64c0-8.8-7.2-16-16-16H112c-8.8 0-16 7.2-16 16v160h320zM96 256H32v176c0 13.3 10.7 24 24 24h32v-80c0-26.5 21.5-48 48-48h160c26.5 0 48 21.5 48 48v80h32c13.3 0 24-10.7 24-24V256H96zM480 96h-32v128h32c8.8 0 16-7.2 16-16V112c0-8.8-7.2-16-16-16zM288 352h-64c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16v-64c0-8.8-7.2-16-16-16z"></path></svg>;
const FaFileExcel = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM332.1 128H256V51.9l76.1 76.1zM48 464V48h160v104c0 13.3 10.7 24 24 24h104v288H48zm212-240h-28.8c-4.4 0-8.4 2.4-10.5 6.3-18 33.1-22.2 42.4-28.6 57.7-13.9-29.1-6.9-17.3-28.6-57.7-2.1-3.9-6.2-6.3-10.6-6.3H124c-9.8 0-15.6 10-10.8 18.3l48 85.3c-22.3 20.4-44.5 44.9-66.2 73.3-4.5 5.9-2.2 14.3 4.9 16.3h28.3c4.5 0 8.5-2.5 10.6-6.3 22.4-40 44.8-80 67.2-120 10.1 18.6 20.8 38.2 32 59.2 2.9 5.5 8.7 9.1 14.8 9.1h28.3c7.1-1.9 9.4-10.3 4.9-16.3-21.2-27.6-43-55.5-65.3-84.8l48-85.3c4.9-8.3-.9-18.3-10.8-18.3z"></path></svg>;
const FaInbox = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M528 224H48.8c-10.7 0-20.8 5.1-26.9 13.2L0 273.4V464c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V273.4l-21.9-36.2c-6-8.1-16.1-13.2-26.9-13.2zM48 352h160v64H48v-64zm192 0h160v64H240v-64zm336-48.4l19.2 31.8-19.2 31.8V303.6zM48 0h480c26.5 0 48 21.5 48 48v80H0V48C0 21.5 21.5 0 48 0z"></path></svg>;
const FaPlay = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path></svg>;
const FaChartPie = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 544 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M527.79 288H290.51a15.95 15.95 0 0 1-15.95-16V16.21a15.95 15.95 0 0 1 15.95-16c2.65 0 5.26.65 7.64 1.86A256.06 256.06 0 0 1 527.79 288zm-288-16a15.95 15.95 0 0 1 15.95-16H528a16 16 0 0 1 16 16v16a256 256 0 0 1-256 256H21.53c-11.21 0-19.18-11.45-14.45-21.53A256.06 256.06 0 0 1 239.79 272z"></path></svg>;

const PaymentModeReport = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const submitButtonRef = useRef(null);

  // --- Data Processing ---
  const processSalesData = (sales) => {
    const modeData = sales.reduce((acc, sale) => {
      const mode = sale.paymentMode || 'Unspecified'; // Handle older records without paymentMode
      if (!acc[mode]) {
        acc[mode] = { count: 0, total: 0 };
      }
      acc[mode].count += 1;
      acc[mode].total += sale.grandTotal || 0;
      return acc;
    }, {});

    const totalSales = Object.values(modeData).reduce((sum, mode) => sum + mode.total, 0);

    return Object.keys(modeData).map(modeName => ({
      name: modeName,
      count: modeData[modeName].count,
      total: modeData[modeName].total,
      percentage: totalSales > 0 ? (modeData[modeName].total / totalSales) * 100 : 0,
    })).sort((a, b) => b.total - a.total); // Sort by highest total
  };
  
  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
        if (startDate && endDate) {
            setLoading(true);
            try {
                const settingsData = await getSettings();
                setSettings(settingsData || {});
                const sales = await getSalesByDateRange(new Date(startDate), new Date(endDate));
                setReportData(processSalesData(sales));
            } catch (err) {
                console.error("Error processing payment mode report:", err);
            }
            setLoading(false);
        }
    };
    fetchData();
  }, [startDate, endDate]);

  // Chart Drawing
  useEffect(() => {
    const drawChart = () => {
        if (chartInstanceRef.current) chartInstanceRef.current.destroy();
        const ctx = chartRef.current.getContext('2d');
        const labels = reportData.map(d => d.name);
        const data = reportData.map(d => d.total);

        chartInstanceRef.current = new window.Chart(ctx, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    label: 'Sales by Payment Mode',
                    data,
                    backgroundColor: ['#4BC0C0', '#FF6384', '#FFCE56', '#36A2EB', '#9966FF'],
                    borderColor: '#fff',
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    if (reportData.length > 0 && chartRef.current) {
        if (!window.Chart) {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/chart.js";
            script.onload = drawChart;
            document.body.appendChild(script);
        } else {
            drawChart();
        }
    }
  }, [reportData]);

  // Calculations
  const totals = reportData.reduce((acc, curr) => {
      acc.count += curr.count;
      acc.total += curr.total;
      return acc;
    }, { count: 0, total: 0 }
  );
  
  const handleDateSubmit = () => {
    if (!startDateRef.current.value || !endDateRef.current.value) return;
    setStartDate(startDateRef.current.value);
    setEndDate(endDateRef.current.value);
    setIsModalOpen(false);
  };
  
  // Modal Render
  if (isModalOpen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md animate-fade-in-up">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Select Date Range</h2>
          <div className="space-y-4">
            <input ref={startDateRef} type="date" className="w-full border p-2 rounded-md" />
            <input ref={endDateRef} type="date" className="w-full border p-2 rounded-md" />
          </div>
          <button ref={submitButtonRef} onClick={handleDateSubmit} className="w-full mt-8 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg shadow-md hover:bg-indigo-700">
            <FaPlay /> Generate Report
          </button>
        </div>
      </div>
    );
  }

  // Main Report Render
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Payment Mode Report</h1>
          <p className="text-sm text-slate-500 mt-1">Results for: <span className="font-semibold">{startDate}</span> to <span className="font-semibold">{endDate}</span></p>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-5 rounded-lg shadow"><p className="text-sm text-slate-500">Total Revenue</p><p className="text-2xl font-bold text-slate-800">{totals.total.toFixed(2)}</p></div>
        <div className="bg-white p-5 rounded-lg shadow"><p className="text-sm text-slate-500">Total Transactions</p><p className="text-2xl font-bold text-slate-800">{totals.count}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Table Section */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                {["Payment Mode", "Transactions", "% of Total", "Total Amount"].map((head) => (
                  <th key={head} className={`px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider ${head.includes("Amount") || head === 'Transactions' ? 'text-right' : 'text-left'}`}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.length > 0 ? (
                reportData.map((row) => (
                  <tr key={row.name} className="hover:bg-indigo-50">
                    <td className="px-6 py-4 font-medium text-gray-800">{row.name}</td>
                    <td className="px-6 py-4 text-right">{row.count}</td>
                    <td className="px-6 py-4 text-right">{row.percentage.toFixed(2)}%</td>
                    <td className="px-6 py-4 font-bold text-indigo-700 text-right">{row.total.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-slate-500">
                    <FaInbox className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">No Data Found</h3>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        </div>
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-lg">
            <h3 className="font-bold text-lg text-slate-700 mb-4">Sales Distribution</h3>
            {reportData.length > 0 ? <div className="h-80"><canvas ref={chartRef}></canvas></div> : <p className="text-center text-slate-500 pt-16">No data to display chart.</p>}
        </div>
      </div>
    </div>
  );
};

export default PaymentModeReport;