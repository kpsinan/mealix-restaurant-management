import React, { useState, useEffect, useRef } from "react";
// MODIFIED: Corrected the import path for firebase functions
import { getSalesByDateRange, getSettings } from "../firebase/firebase"; 

// --- SVG Icons ---
const FaFilePdf = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M416 224V64c0-8.8-7.2-16-16-16H112c-8.8 0-16 7.2-16 16v160h320zM96 256H32v176c0 13.3 10.7 24 24 24h32v-80c0-26.5 21.5-48 48-48h160c26.5 0 48 21.5 48 48v80h32c13.3 0 24-10.7 24-24V256H96zM480 96h-32v128h32c8.8 0 16-7.2 16-16V112c0-8.8-7.2-16-16-16zM288 352h-64c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16v-64c0-8.8-7.2-16-16-16z"></path></svg>;
const FaInbox = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M528 224H48.8c-10.7 0-20.8 5.1-26.9 13.2L0 273.4V464c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V273.4l-21.9-36.2c-6-8.1-16.1-13.2-26.9-13.2zM48 352h160v64H48v-64zm192 0h160v64H240v-64zm336-48.4l19.2 31.8-19.2 31.8V303.6zM48 0h480c26.5 0 48 21.5 48 48v80H0V48C0 21.5 21.5 0 48 0z"></path></svg>;
const FaPlay = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path></svg>;
const FaUtensils = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M416 0C400 0 288 32 288 176V288c0 35.3 28.7 64 64 64h32v128c0 17.7 14.3 32 32 32s32-14.3 32-32V352h32c35.3 0 64-28.7 64-64V176c0-144-112-176-128-176zM208 32c-17.7 0-32 14.3-32 32V480c0 17.7 14.3 32 32 32s32-14.3 32-32V64c0-17.7-14.3-32-32-32zM32 64C14.3 64 0 78.3 0 96v320c0 17.7 14.3 32 32 32s32-14.3 32-32V96c0-17.7-14.3-64-32-64z"></path></svg>;
const FaUsers = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.7 0-32 14.3-32 32v128c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V288c0-17.7-14.3-32-32-32zm-256 0h-64c-17.7 0-32 14.3-32 32v128c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V288c0-17.7-14.3-32-32-32zM288 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm-192 32h-64c-17.7 0-32 14.3-32 32v128c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V288c0-17.7-14.3-32-32-32z"></path></svg>;
const FaChartBar = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M32 32v448h448V32H32zm240 344h-32V200h32v176zm88 0h-32V136h32v240zm-176 0h-32V280h32v96z"></path></svg>;

const TableWiseSalesReport = () => {
  // Modal and Date Management State
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Report Data State
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  // Refs for Enter key navigation
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const submitButtonRef = useRef(null);
  
  // Data Fetching and Processing
  useEffect(() => {
    const loadAndProcessData = async () => {
      if (startDate && endDate) {
        setLoading(true);
        try {
          const settingsData = await getSettings();
          setSettings(settingsData || {});
          
          const sales = await getSalesByDateRange(new Date(startDate), new Date(endDate));

          // Aggregate data by table name
          const tableData = sales.reduce((acc, sale) => {
            const tableName = sale.tableName || "Unknown Table";
            if (!acc[tableName]) {
              acc[tableName] = {
                orders: 0,
                total: 0,
                discount: 0,
                grandTotal: 0,
              };
            }
            acc[tableName].orders += 1;
            acc[tableName].total += sale.subTotal || 0;
            acc[tableName].discount += sale.discount || 0;
            acc[tableName].grandTotal += sale.grandTotal || 0;
            return acc;
          }, {});

          const formattedReport = Object.keys(tableData).map(tableName => ({
            name: tableName,
            ...tableData[tableName],
          }));

          setReportData(formattedReport);
        } catch (err) {
          console.error("Error processing table sales report:", err);
        }
        setLoading(false);
      }
    };
    
    loadAndProcessData();
  }, [startDate, endDate]);

  // --- Calculations ---
  const totals = reportData.reduce(
    (acc, curr) => {
      acc.orders += curr.orders;
      acc.total += curr.total;
      acc.discount += curr.discount;
      acc.grandTotal += curr.grandTotal;
      return acc;
    },
    { orders: 0, total: 0, discount: 0, grandTotal: 0 }
  );

  const currency = ""; // Currency symbol removed as per previous component

  // --- Modal & Form Handlers ---
  const handleDateSubmit = () => {
    if (!startDateRef.current.value || !endDateRef.current.value) {
      alert("Please select both a start and end date.");
      return;
    }
    setStartDate(startDateRef.current.value);
    setEndDate(endDateRef.current.value);
    setIsModalOpen(false);
  };
  
  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
        if(nextRef === submitButtonRef) {
          nextRef.current.click();
        }
      }
    }
  };

  // --- PDF Export ---
  const exportPDF = () => {
    if (reportData.length === 0) {
      alert("No data available to export.");
      return;
    }
    
    const jspdfLoaded = () => {
        const autotableLoaded = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
            
            const restaurantName = settings?.restaurantName || "SyncServe Restaurant";
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text(restaurantName, pageWidth / 2, 20, { align: "center" });
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text("Table-wise Sales Report", pageWidth / 2, 28, { align: "center" });
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 40);

            const summaryY = 55;
            doc.setFontSize(10);
            doc.text("Report Summary", 14, summaryY - 5);
            doc.setDrawColor(220, 220, 220);
            doc.line(14, summaryY - 4, pageWidth - 14, summaryY - 4);

            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(`Total Revenue:`, 14, summaryY + 5);
            doc.setFont("helvetica", "bold");
            doc.text(`${currency}${totals.grandTotal.toFixed(2)}`, 55, summaryY + 5);

            doc.setFont("helvetica", "normal");
            doc.text(`Total Orders:`, pageWidth / 2, summaryY + 5);
            doc.setFont("helvetica", "bold");
            doc.text(`${totals.orders}`, (pageWidth / 2) + 40, summaryY + 5);
            
            const tableColumns = ["Table Name", "Total Orders", "Gross Sales", "Discounts", "Net Sales"];
            const tableRows = reportData.map(row => [
              row.name,
              row.orders,
              `${currency}${row.total.toFixed(2)}`,
              `${currency}${row.discount.toFixed(2)}`,
              `${currency}${row.grandTotal.toFixed(2)}`,
            ]);

            const totalsRow = [
                { content: 'GRAND TOTALS', styles: { fontStyle: 'bold', halign: 'right' } },
                { content: totals.orders, styles: { fontStyle: 'bold' } },
                { content: `${currency}${totals.total.toFixed(2)}`, styles: { fontStyle: 'bold' } },
                { content: `${currency}${totals.discount.toFixed(2)}`, styles: { fontStyle: 'bold' } },
                { content: `${currency}${totals.grandTotal.toFixed(2)}`, styles: { fontStyle: 'bold' } },
            ];

            doc.autoTable({
              startY: summaryY + 20,
              head: [tableColumns],
              body: tableRows,
              foot: [totalsRow],
              theme: "grid",
              headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
              footStyles: { fillColor: [236, 240, 241], textColor: [44, 62, 80], fontStyle: 'bold'},
              columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
              },
            });

            doc.save(`TableWiseSalesReport_${startDate}_to_${endDate}.pdf`);
        };

        if (window.jspdf.autoTable) {
            autotableLoaded();
        } else {
            const autotableScript = document.createElement('script');
            autotableScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js";
            autotableScript.onload = autotableLoaded;
            document.body.appendChild(autotableScript);
        }
    };

    if (window.jspdf) {
        jspdfLoaded();
    } else {
        const jspdfScript = document.createElement('script');
        jspdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        jspdfScript.onload = jspdfLoaded;
        document.body.appendChild(jspdfScript);
    }
  };

  // --- Render Logic ---
  if (isModalOpen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md animate-fade-in-up">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Select Date Range</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Start Date</label>
              <input ref={startDateRef} type="date" onKeyDown={(e) => handleKeyDown(e, endDateRef)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">End Date</label>
              <input ref={endDateRef} type="date" onKeyDown={(e) => handleKeyDown(e, submitButtonRef)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <button ref={submitButtonRef} onClick={handleDateSubmit} className="w-full mt-8 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105">
            <FaPlay /> Generate Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Table-wise Sales Report</h1>
          <p className="text-sm text-slate-500 mt-1">Showing results for: <span className="font-semibold">{startDate}</span> to <span className="font-semibold">{endDate}</span></p>
        </div>
        <button onClick={exportPDF} disabled={reportData.length === 0} className="mt-4 sm:mt-0 flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-rose-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed">
          <FaFilePdf /> Export as PDF
        </button>
      </header>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-5 rounded-lg shadow flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full"><FaChartBar /></div>
            <div>
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-800">{currency}{totals.grandTotal.toFixed(2)}</p>
            </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full"><FaUtensils /></div>
            <div>
                <p className="text-sm text-slate-500">Total Orders</p>
                <p className="text-2xl font-bold text-slate-800">{totals.orders}</p>
            </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-full"><FaUsers /></div>
            <div>
                <p className="text-sm text-slate-500">Active Tables</p>
                <p className="text-2xl font-bold text-slate-800">{reportData.length}</p>
            </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="ml-4 text-slate-600">Aggregating report data...</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                {["Table Name", "Total Orders", "Gross Sales", "Discounts", "Net Sales"].map((head) => (
                  <th key={head} className={`px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider ${head.includes("Sales") || head.includes("Discounts") ? 'text-right' : (head.includes('Orders') ? 'text-center' : 'text-left')}`}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.length > 0 ? (
                reportData.map((row) => (
                  <tr key={row.name} className="hover:bg-indigo-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{row.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{row.orders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{currency}{row.total.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">{currency}{row.discount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700 text-right">{currency}{row.grandTotal.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <FaInbox className="w-16 h-16 mb-4 text-slate-300" />
                      <h3 className="text-xl font-semibold">No Table Data Found</h3>
                      <p className="text-sm mt-1">There were no sales records for any table in this date range.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {reportData.length > 0 && (
              <tfoot className="bg-slate-200 font-bold text-slate-800">
                <tr>
                  <td className="px-6 py-3 text-left text-sm">TOTALS</td>
                  <td className="px-6 py-3 text-center text-sm">{totals.orders}</td>
                  <td className="px-6 py-3 text-right text-sm">{currency}{totals.total.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right text-sm text-red-700">{currency}{totals.discount.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right text-sm text-indigo-800">{currency}{totals.grandTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
};

export default TableWiseSalesReport;

