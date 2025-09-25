import React, { useState, useEffect, useRef } from "react";
import { getSalesByDateRange, getSettings } from "../firebase/firebase"; // Adjust path as needed
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFilePdf, FaCalendarAlt, FaInbox, FaPlay } from "react-icons/fa";

// Note: Font imports are removed as they are not needed if no symbol is shown.

const SalesReport = () => {
  // Modal and Date Management State
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Report Data State
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  // Refs for Enter key navigation
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const submitButtonRef = useRef(null);

  // --- Helper Functions ---
  const formatDate = (date) => {
    if (!date) return "-";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-CA"); // YYYY-MM-DD format
  };

  const formatTime = (date) => {
    if (!date) return "-";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };
  
  // --- Data Fetching ---
  useEffect(() => {
    const loadInitialData = async () => {
      const settingsData = await getSettings();
      setSettings(settingsData || {});

      if (startDate && endDate) {
        setLoading(true);
        try {
          const data = await getSalesByDateRange(new Date(startDate), new Date(endDate));
          const formattedData = data.map((s) => ({
            ...s,
            table: s.tableName || "-",
            servedBy: s.staffName || "-",
            total: s.subTotal || 0,
            discount: s.discount || 0,
            grandTotal: s.grandTotal || 0,
          }));
          setSales(formattedData);
        } catch (err) {
          console.error("Error fetching sales:", err);
        }
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [startDate, endDate]);

  // --- Calculations & Global Variables ---
  const totalSum = sales.reduce(
    (acc, curr) => {
      acc.total += curr.total;
      acc.discount += curr.discount;
      acc.grandTotal += curr.grandTotal;
      return acc;
    },
    { total: 0, discount: 0, grandTotal: 0 }
  );
  
  // ✅ This line ensures no currency symbol is ever shown.
  const currency = "";

  // --- Modal Submission & Enter Key Logic ---
  const handleDateSubmit = () => {
    if (!startDateRef.current.value || !endDateRef.current.value) {
      alert("Please select both a start and end date.");
      return;
    }
    setStartDate(startDateRef.current.value);
    setEndDate(endDateRef.current.value);
    setIsModalOpen(false);
  };

  const handleStartDateKeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      endDateRef.current.focus();
    }
  };
  
  const handleEndDateKeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitButtonRef.current.click();
    }
  };

  // --- PDF Export ---
  const exportPDF = () => {
    if (sales.length === 0) {
      alert("No data available to export.");
      return;
    }
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    
    // 1. Professional Header
    const restaurantName = settings?.restaurantName || "SyncServe Restaurant";
    const generatedTime = new Date().toLocaleString("en-IN", {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(restaurantName, pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Sales Report", pageWidth / 2, 28, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 40);
    doc.text(`Generated on: ${generatedTime}`, pageWidth - 14, 40, { align: "right" });

    // 2. High-Level Summary Block
    const totalTransactions = sales.length;
    const avgSale = totalTransactions > 0 ? totalSum.grandTotal / totalTransactions : 0;
    
    doc.setFontSize(10);
    doc.text("Report Summary", 14, 52);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 53, pageWidth - 14, 53);

    let summaryTextY = 62;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Gross Sales:`, 14, summaryTextY);
    doc.setFont("helvetica", "bold");
    doc.text(`${currency}${totalSum.grandTotal.toFixed(2)}`, 60, summaryTextY);

    doc.setFont("helvetica", "normal");
    doc.text(`Total Transactions:`, 14, summaryTextY + 8);
    doc.setFont("helvetica", "bold");
    doc.text(`${totalTransactions}`, 60, summaryTextY + 8);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Total Discounts:`, pageWidth / 2, summaryTextY);
    doc.setFont("helvetica", "bold");
    doc.text(`${currency}${totalSum.discount.toFixed(2)}`, (pageWidth / 2) + 40, summaryTextY);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Average Sale Value:`, pageWidth / 2, summaryTextY + 8);
    doc.setFont("helvetica", "bold");
    doc.text(`${currency}${avgSale.toFixed(2)}`, (pageWidth / 2) + 40, summaryTextY + 8);

    // 3. Clean Table
    const tableColumns = ["#", "Date & Time", "Table", "Served By", "Total", "Discount", "Grand Total"];
    const tableRows = sales.map((sale, idx) => [
      idx + 1,
      `${formatDate(sale.finalizedAt)}\n${formatTime(sale.finalizedAt)}`,
      sale.table,
      sale.servedBy,
      `${currency}${sale.total.toFixed(2)}`,
      `${currency}${sale.discount.toFixed(2)}`,
      `${currency}${sale.grandTotal.toFixed(2)}`,
    ]);

    const totalsRow = [
        { content: '' }, { content: '' }, { content: '' },
        { content: 'TOTALS', styles: { fontStyle: 'bold' } },
        { content: `${currency}${totalSum.total.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `${currency}${totalSum.discount.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `${currency}${totalSum.grandTotal.toFixed(2)}`, styles: { fontStyle: 'bold' } },
    ];

    autoTable(doc, {
      startY: summaryTextY + 20,
      head: [tableColumns],
      body: tableRows,
      foot: [totalsRow],
      theme: "grid",
      styles: {
        cellPadding: 3,
        halign: 'center',
        valign: 'middle',
      },
      headStyles: { 
        fillColor: [44, 62, 80],
        textColor: 255,
        fontStyle: 'bold',
      },
      bodyStyles: {
        lineWidth: 0,
      },
      footStyles: { 
        fillColor: [236, 240, 241],
        textColor: [44, 62, 80],
        fontStyle: 'bold',
        lineWidth: 0,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 30 },
      },
      didDrawPage: function (data) {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      },
    });

    doc.save(`SalesReport_${restaurantName.replace(/\s+/g, '')}_${startDate}_to_${endDate}.pdf`);
  };

  // --- Conditional Rendering ---
  if (isModalOpen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md animate-fade-in-up">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Select Date Range</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Start Date</label>
              <input
                ref={startDateRef}
                type="date"
                onKeyDown={handleStartDateKeydown}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">End Date</label>
              <input
                ref={endDateRef}
                type="date"
                onKeyDown={handleEndDateKeydown}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>
          <button
            ref={submitButtonRef}
            onClick={handleDateSubmit}
            className="w-full mt-8 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            <FaPlay size={14} /> Generate Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Sales Report</h1>
            <p className="text-sm text-slate-500 mt-1">Showing results for: <span className="font-semibold">{startDate}</span> to <span className="font-semibold">{endDate}</span></p>
        </div>
        <button
          onClick={exportPDF}
          disabled={sales.length === 0}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-rose-700 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed mt-4 sm:mt-0"
        >
          <FaFilePdf size={18} /> Export as PDF
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="ml-4 text-slate-600">Loading sales records...</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                {[
                  { title: "#", align: "text-left" },
                  { title: "Date", align: "text-left" },
                  { title: "Time", align: "text-left" },
                  { title: "Table", align: "text-left" },
                  { title: "Served By", align: "text-left" },
                  { title: "Total", align: "text-right" },
                  { title: "Discount", align: "text-right" },
                  { title: "Grand Total", align: "text-right" },
                ].map((head) => (
                  <th
                    key={head.title}
                    className={`px-6 py-3 ${head.align} text-xs font-bold text-slate-600 uppercase tracking-wider`}
                  >
                    {head.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.length > 0 ? (
                sales.map((sale, idx) => (
                  <tr key={sale.id} className="hover:bg-indigo-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">{idx + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">{formatDate(sale.finalizedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">{formatTime(sale.finalizedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">{sale.table}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">{sale.servedBy}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 text-right">{currency}{sale.total.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">{currency}{sale.discount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700 text-right">{currency}{sale.grandTotal.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                        <FaInbox className="w-16 h-16 mb-4 text-slate-300" />
                        <h3 className="text-xl font-semibold">No Sales Records Found</h3>
                        <p className="text-sm mt-1">There were no sales in the selected date range.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {sales.length > 0 && (
              <tfoot className="bg-slate-200 font-bold text-slate-800">
                <tr>
                  <td colSpan={5} className="px-6 py-3 text-right text-sm">TOTALS</td>
                  <td className="px-6 py-3 text-right text-sm">{currency}{totalSum.total.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right text-sm text-red-700">{currency}{totalSum.discount.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right text-sm text-indigo-800">{currency}{totalSum.grandTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
};

export default SalesReport;