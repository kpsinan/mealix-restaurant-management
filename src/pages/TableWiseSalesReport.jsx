import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Added for Back Button
import { getSalesByDateRange, getSettings } from "../firebase/firebase"; 

// --- SVG Icons ---
const FaArrowLeft = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"></path></svg>;
const FaCalendarAlt = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm320-196c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM192 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM64 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z"></path></svg>;
const FaFilePdf = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M416 224V64c0-8.8-7.2-16-16-16H112c-8.8 0-16 7.2-16 16v160h320zM96 256H32v176c0 13.3 10.7 24 24 24h32v-80c0-26.5 21.5-48 48-48h160c26.5 0 48 21.5 48 48v80h32c13.3 0 24-10.7 24-24V256H96zM480 96h-32v128h32c8.8 0 16-7.2 16-16V112c0-8.8-7.2-16-16-16zM288 352h-64c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16v-64c0-8.8-7.2-16-16-16z"></path></svg>;
const FaFileExcel = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM332.1 128H256V51.9l76.1 76.1zM48 464V48h160v104c0 13.3 10.7 24 24 24h104v288H48zm212-240h-28.8c-4.4 0-8.4 2.4-10.5 6.3-18 33.1-22.2 42.4-28.6 57.7-13.9-29.1-6.9-17.3-28.6-57.7-2.1-3.9-6.2-6.3-10.6-6.3H124c-9.8 0-15.6 10-10.8 18.3l48 85.3c-22.3 20.4-44.5 44.9-66.2 73.3-4.5 5.9-2.2 14.3 4.9 16.3h28.3c4.5 0 8.5-2.5 10.6-6.3 22.4-40 44.8-80 67.2-120 10.1 18.6 20.8 38.2 32 59.2 2.9 5.5 8.7 9.1 14.8 9.1h28.3c7.1-1.9 9.4-10.3 4.9-16.3-21.2-27.6-43-55.5-65.3-84.8l48-85.3c4.9-8.3-.9-18.3-10.8-18.3z"></path></svg>;
const FaInbox = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M528 224H48.8c-10.7 0-20.8 5.1-26.9 13.2L0 273.4V464c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V273.4l-21.9-36.2c-6-8.1-16.1-13.2-26.9-13.2zM48 352h160v64H48v-64zm192 0h160v64H240v-64zm336-48.4l19.2 31.8-19.2 31.8V303.6zM48 0h480c26.5 0 48 21.5 48 48v80H0V48C0 21.5 21.5 0 48 0z"></path></svg>;
const FaPlay = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path></svg>;
const FaChartBar = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M32 32v448h448V32H32zm240 344h-32V200h32v176zm88 0h-32V136h32v240zm-176 0h-32V280h32v96z"></path></svg>;
const FaTrophy = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M552 64H448V24c0-13.3-10.7-24-24-24H152c-13.3 0-24 10.7-24 24v40H24C10.7 64 0 74.7 0 88v56c0 66.5 77.9 130.7 171.9 142.4C203.3 392.4 256 464 256 464v48H176c-13.3 0-24 10.7-24 24s10.7 24 24 24h224c13.3 0 24-10.7 24-24s-10.7-24-24-24H320v-48s52.7-71.6 84.1-177.6C502.1 274.7 576 210.5 576 144V88c0-13.3-10.7-24-24-24zM128 128c0-17.7 14.3-32 32-32h192c17.7 0 32 14.3 32 32v32H128v-32z"></path></svg>;
const FaChartPie = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 544 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M527.79 288H290.51a15.95 15.95 0 0 1-15.95-16V16.21a15.95 15.95 0 0 1 15.95-16c2.65 0 5.26.65 7.64 1.86A256.06 256.06 0 0 1 527.79 288zm-288-16a15.95 15.95 0 0 1 15.95-16H528a16 16 0 0 1 16 16v16a256 256 0 0 1-256 256H21.53c-11.21 0-19.18-11.45-14.45-21.53A256.06 256.06 0 0 1 239.79 272z"></path></svg>;
const FaTimes = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 352 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path></svg>;


const TableWiseSalesReport = () => {
  const navigate = useNavigate();
  // Modal and Date Management State
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Report Data State
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  // New Features State
  const [chartType, setChartType] = useState('bar');
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Refs for Enter key navigation
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const submitButtonRef = useRef(null);
  
  // --- Data Processing ---
  const processSalesData = (sales) => {
    const tableData = sales.reduce((acc, sale) => {
      // ADAPTATION FOR MERGED TABLES:
      // Merged tables often come as "Table 1 + Table 2".
      // We keep this as the key to show the performance of that specific combo.
      // The CSS in the render section ensures this long text wraps correctly.
      const tableName = sale.tableName || "Unknown Table";
      if (!acc[tableName]) {
        acc[tableName] = {
          orders: 0,
          total: 0,
          discount: 0,
          grandTotal: 0,
          items: {}
        };
      }
      acc[tableName].orders += 1; // This is the turnover
      acc[tableName].total += sale.subTotal || 0;
      acc[tableName].discount += sale.discount || 0;
      acc[tableName].grandTotal += sale.grandTotal || 0;
      
      (sale.items || []).forEach(item => {
        if (!acc[tableName].items[item.name]) {
          acc[tableName].items[item.name] = 0;
        }
        acc[tableName].items[item.name] += item.quantity;
      });

      return acc;
    }, {});

    let bestTable = { name: null, value: -1 };
    let worstTable = { name: null, value: Infinity };

    const formattedReport = Object.keys(tableData).map(tableName => {
      const data = tableData[tableName];
      const aov = data.orders > 0 ? data.grandTotal / data.orders : 0;
      
      if(data.grandTotal > bestTable.value) bestTable = { name: tableName, value: data.grandTotal };
      if(data.grandTotal < worstTable.value) worstTable = { name: tableName, value: data.grandTotal };
      
      const topItems = Object.entries(data.items)
                             .sort((a, b) => b[1] - a[1])
                             .slice(0, 2)
                             .map(item => `${item[0]} (x${item[1]})`)
                             .join(', ');

      return {
        name: tableName,
        turnover: data.orders,
        aov,
        topItems: topItems || 'N/A',
        ...data,
      };
    });

    return formattedReport.map(table => ({
      ...table,
      isBest: table.name === bestTable.name && formattedReport.length > 1,
      isWorst: table.name === worstTable.name && formattedReport.length > 1,
    }));
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
                console.error("Error processing table sales report:", err);
            }
            setLoading(false);
        }
    };
    
    fetchData();
  }, [startDate, endDate]);

  // --- Chart Drawing ---
  useEffect(() => {
    const drawChart = () => {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }
        const ctx = chartRef.current.getContext('2d');
        const labels = reportData.map(d => d.name);
        const data = reportData.map(d => d.grandTotal);

        chartInstanceRef.current = new window.Chart(ctx, {
            type: chartType,
            data: {
                labels,
                datasets: [{
                    label: 'Total Sales',
                    data,
                    backgroundColor: chartType === 'pie' ? [ '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] : '#36A2EB',
                    borderColor: '#fff',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: chartType === 'pie', position: 'top' },
                    title: { display: true, text: 'Sales Revenue by Table' }
                }
            }
        });
    }
    
    if (reportData.length > 0 && chartRef.current) {
        if (!window.Chart) {
            const chartScript = document.createElement('script');
            chartScript.src = "https://cdn.jsdelivr.net/npm/chart.js";
            chartScript.onload = drawChart;
            document.body.appendChild(chartScript);
        } else {
            drawChart();
        }
    }
  }, [reportData, chartType]);

  // --- Calculations ---
  const totals = reportData.reduce(
    (acc, curr) => {
      acc.orders += curr.turnover;
      acc.total += curr.total;
      acc.discount += curr.discount;
      acc.grandTotal += curr.grandTotal;
      return acc;
    }, { orders: 0, total: 0, discount: 0, grandTotal: 0 }
  );
  const overallAOV = totals.orders > 0 ? totals.grandTotal / totals.orders : 0;
  const currency = ""; 

  // --- Handlers ---
  const handleDateShortcut = (range) => {
    const end = new Date();
    let start = new Date();
    if(range === 'today') {
        start.setHours(0,0,0,0);
    } else if (range === 'week') {
        start.setDate(end.getDate() - end.getDay()); // Start of week (Sunday)
    } else if (range === 'month') {
        start.setDate(1); // Start of month
    }
    const formatDate = (date) => date.toISOString().split('T')[0];
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
    setIsModalOpen(false);
  }

  const handleDateSubmit = () => {
    if (!startDateRef.current.value || !endDateRef.current.value) { return; }
    setStartDate(startDateRef.current.value);
    setEndDate(endDateRef.current.value);
    setIsModalOpen(false);
  };
  
  // --- Export Functions ---
  const exportPDF = () => {
     if (reportData.length === 0) return;
     const jspdfLoaded = () => {
        const autotableLoaded = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.text("Table-wise Sales Report", 14, 15);
            doc.autoTable({
                startY: 20,
                head: [["Table", "Turnover", "AOV", "Top Items", "Net Sales"]],
                body: reportData.map(r => [r.name, r.turnover, r.aov.toFixed(2), r.topItems, r.grandTotal.toFixed(2)])
            });
            doc.save(`TableWiseSalesReport_${startDate}_to_${endDate}.pdf`);
        };
        if(window.jspdf.autoTable) autotableLoaded();
        else {
            const s = document.createElement('script');
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js";
            s.onload = autotableLoaded;
            document.body.appendChild(s);
        }
     };
     if(window.jspdf) jspdfLoaded();
     else {
        const s = document.createElement('script');
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        s.onload = jspdfLoaded;
        document.body.appendChild(s);
     }
  };
  const exportXLSX = () => {
    if (reportData.length === 0) return;
    const excelLoaded = () => {
        const wb = window.XLSX.utils.book_new();
        const wsData = [
            ["Table Name", "Turnover", "Avg. Order Value", "Gross Sales", "Discounts", "Net Sales", "Top Items"],
            ...reportData.map(row => [
                row.name, row.turnover, row.aov.toFixed(2), row.total.toFixed(2), row.discount.toFixed(2), row.grandTotal.toFixed(2), row.topItems
            ])
        ];
        const ws = window.XLSX.utils.aoa_to_sheet(wsData);
        window.XLSX.utils.book_append_sheet(wb, ws, "Table-wise Report");
        window.XLSX.writeFile(wb, `TableWiseSalesReport_${startDate}_to_${endDate}.xlsx`);
    };
    if (window.XLSX) excelLoaded();
    else {
        const s = document.createElement('script');
        s.src = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
        s.onload = excelLoaded;
        document.body.appendChild(s);
    }
  };

  // --- Render Logic ---
  if (isModalOpen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md animate-fade-in-up relative">
          {/* Close Button */}
          <button 
            onClick={() => setIsModalOpen(false)} 
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            title="Close"
          >
            <FaTimes style={{ fontSize: '1.25rem' }} />
          </button>

          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Select Date Range</h2>
          <div className="flex justify-center gap-2 mb-4">
              <button onClick={() => handleDateShortcut('today')} className="px-3 py-1 text-sm bg-slate-200 rounded-full hover:bg-slate-300">Today</button>
              <button onClick={() => handleDateShortcut('week')} className="px-3 py-1 text-sm bg-slate-200 rounded-full hover:bg-slate-300">This Week</button>
              <button onClick={() => handleDateShortcut('month')} className="px-3 py-1 text-sm bg-slate-200 rounded-full hover:bg-slate-300">This Month</button>
          </div>
          <div className="space-y-4">
            <input ref={startDateRef} type="date" className="w-full border border-gray-300 rounded-md px-3 py-2" />
            <input ref={endDateRef} type="date" className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <button ref={submitButtonRef} onClick={handleDateSubmit} className="w-full mt-8 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-md hover:bg-indigo-700">
            <FaPlay /> Generate Report
          </button>
          {startDate && endDate && (
            <button onClick={() => setIsModalOpen(false)} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 underline">
               Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* ADDED: Header with Back Button and Date Range Controls */}
      <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 bg-white rounded-full shadow hover:bg-gray-100 text-slate-600 transition"
                title="Go Back"
              >
                  <FaArrowLeft />
              </button>
              <h1 className="text-3xl font-bold text-slate-800">Advanced Table-wise Report</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
             <div>
                <p className="text-sm text-slate-500">Currently showing results for:</p>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-slate-700">{startDate}</span>
                    <span className="text-slate-400">to</span>
                    <span className="font-bold text-lg text-slate-700">{endDate}</span>
                </div>
             </div>
             
             <div className="flex flex-wrap gap-2">
                 <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 border border-indigo-200 font-medium transition"
                 >
                    <FaCalendarAlt /> Change Date
                 </button>
                 <button onClick={exportXLSX} disabled={reportData.length === 0} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 transition">
                    <FaFileExcel /> Excel
                </button>
                <button onClick={exportPDF} disabled={reportData.length === 0} className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-rose-700 disabled:bg-gray-400 transition">
                    <FaFilePdf /> PDF
                </button>
             </div>
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-5 rounded-lg shadow"><p className="text-sm text-slate-500">Total Revenue</p><p className="text-2xl font-bold text-slate-800">{currency}{totals.grandTotal.toFixed(2)}</p></div>
        <div className="bg-white p-5 rounded-lg shadow"><p className="text-sm text-slate-500">Total Turnovers</p><p className="text-2xl font-bold text-slate-800">{totals.orders}</p></div>
        <div className="bg-white p-5 rounded-lg shadow"><p className="text-sm text-slate-500">Overall AOV</p><p className="text-2xl font-bold text-slate-800">{currency}{overallAOV.toFixed(2)}</p></div>
        <div className="bg-white p-5 rounded-lg shadow"><p className="text-sm text-slate-500">Active Tables</p><p className="text-2xl font-bold text-slate-800">{reportData.length}</p></div>
      </div>

      {reportData.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
            <div className="flex justify-end gap-2 mb-2">
                <button onClick={() => setChartType('bar')} className={`p-2 rounded-full ${chartType === 'bar' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}><FaChartBar/></button>
                <button onClick={() => setChartType('pie')} className={`p-2 rounded-full ${chartType === 'pie' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}><FaChartPie/></button>
            </div>
            <div className="h-96"><canvas ref={chartRef}></canvas></div>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
        {loading ? (
          <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                {["Table", "Turnover", "AOV", "Top Items", "Net Sales"].map((head) => (
                  <th key={head} className={`px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider ${head.includes("Sales") || head.includes("AOV") ? 'text-right' : 'text-left'}`}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.length > 0 ? (
                reportData.map((row) => (
                  <tr key={row.name} className={`${row.isBest ? 'bg-green-50' : ''} ${row.isWorst ? 'bg-red-50' : ''} hover:bg-indigo-50`}>
                    <td className="px-6 py-4 font-medium text-gray-800 whitespace-normal break-words max-w-xs">
                        {/* ADAPTATION: whitespace-normal and break-words ensures Merged Table names don't break layout */}
                        {row.name}
                        {row.isBest && <span className="ml-2 text-xs text-green-600 font-bold flex items-center gap-1"><FaTrophy/> Best</span>}
                        {row.isWorst && <span className="ml-2 text-xs text-red-600 font-bold">Lowest</span>}
                    </td>
                    <td className="px-6 py-4 text-center">{row.turnover}</td>
                    <td className="px-6 py-4 text-right">{currency}{row.aov.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.topItems}</td>
                    <td className="px-6 py-4 font-bold text-indigo-700 text-right">{currency}{row.grandTotal.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <FaInbox className="w-16 h-16 mb-4" />
                      <h3 className="text-xl font-semibold">No Table Data Found</h3>
                      <p className="text-sm mt-1">There were no sales records for any table in this date range.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TableWiseSalesReport;