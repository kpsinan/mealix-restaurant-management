import React, { useState, useEffect } from "react";
import { getSalesByDateRange } from "../firebase/firebase";
import { FaFilePdf, FaFileCsv } from "react-icons/fa";
import jsPDF from 'jspdf';
import 'jspdf-autotable'; 
import "./SalesReport.css"; // Make sure this path is correct

// Helper to format date for input fields (YYYY-MM-DD)
const formatDateForInput = (date) => {
  return date.toISOString().split("T")[0];
};

// Safe numeric formatter that avoids NBSP/unicode quirks
const formatCurrency = (value) => {
  const n = Number(value || 0);
  const fixed = n.toFixed(2); // "2110.00"
  // Insert commas for thousands (EN grouping)
  const parts = fixed.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `₹ ${parts.join(".")}`;
};

const SalesReport = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState(formatDateForInput(new Date()));
  const [endDate, setEndDate] = useState(formatDateForInput(new Date()));

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // include end day's full time
      end.setHours(23, 59, 59, 999);

      if (end < start) {
        setError("End date cannot be earlier than the start date.");
        setSales([]);
        setLoading(false);
        return;
      }
      const salesData = await getSalesByDateRange(start, end) || [];
      // Sort by most recent first (handle timestamp or Date)
      salesData.sort((a, b) => new Date(b.finalizedAt) - new Date(a.finalizedAt));
      setSales(salesData);
    } catch (err) {
      console.error("Error fetching sales report:", err);
      setError("Failed to fetch sales data. Please try again.");
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = sales.reduce(
    (acc, sale) => {
      acc.subTotal += Number(sale.subTotal || 0);
      acc.discount += Number(sale.discount || 0);
      acc.grandTotal += Number(sale.grandTotal || 0);
      return acc;
    },
    { subTotal: 0, discount: 0, grandTotal: 0 }
  );

  const generatePDF = () => {
    if (sales.length === 0) {
      setError("No sales to export to PDF.");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const marginLeft = 40;
    let y = 40;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Your Company Name", marginLeft, y);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Sales Report", marginLeft, y + 20);

    // Date range and generated at on the right
    const generatedAt = new Date();
    const rightText = `Generated: ${generatedAt.toLocaleString()}`;
    const dateRangeText = `From: ${startDate}  To: ${endDate}`;
    const pageWidth = doc.internal.pageSize.getWidth();
    const rightX = pageWidth - marginLeft;
    doc.setFontSize(10);
    doc.text(dateRangeText, rightX, y, { align: "right" });
    doc.text(rightText, rightX, y + 14, { align: "right" });

    y += 36;

    // Table columns
    const head = [
      [
        "#",
        "Date",
        "Time",
        "Table",
        "Served By",
        "Total",
        "Discount",
        "Grand Total",
      ],
    ];

    const body = sales.map((sale, idx) => {
      const finalized = new Date(sale.finalizedAt || Date.now());
      return [
        idx + 1,
        finalized.toLocaleDateString(),
        finalized.toLocaleTimeString(),
        sale.tableName || "-",
        sale.staffName || "-",
        formatCurrency(sale.subTotal || 0),
        formatCurrency(sale.discount || 0),
        formatCurrency(sale.grandTotal || 0),
      ];
    });

    // Use autoTable for the main table
    doc.autoTable({
      head,
      body,
      startY: y,
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 6,
        valign: "middle",
      },
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: 40,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 30 },
        1: { halign: "left", cellWidth: 70 },
        2: { halign: "left", cellWidth: 70 },
        3: { halign: "left", cellWidth: 80 },
        4: { halign: "left", cellWidth: 120 },
        5: { halign: "right", cellWidth: 90 },
        6: { halign: "right", cellWidth: 90 },
        7: { halign: "right", cellWidth: 110 },
      },
      foot: [
        [
          { content: "Totals:", colSpan: 5, styles: { halign: "right", fontStyle: "bold" } },
          { content: formatCurrency(totals.subTotal), styles: { halign: "right", fontStyle: "bold" } },
          { content: formatCurrency(totals.discount), styles: { halign: "right", textColor: 200, fontStyle: "bold" } },
          { content: formatCurrency(totals.grandTotal), styles: { halign: "right", fontStyle: "bold" } },
        ],
      ],
      footStyles: {
        fillColor: [245, 245, 245],
      },
      showFoot: "lastPage",
      margin: { left: marginLeft, right: marginLeft },
      didDrawPage: (data) => {
        // Optional small footer with page number
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`, rightX, doc.internal.pageSize.getHeight() - 20, { align: "right" });
      },
    });

    // Save file
    const fileName = `SalesReport_${startDate}_to_${endDate}.pdf`;
    doc.save(fileName);
  };

  const exportCSV = () => {
    if (sales.length === 0) {
      setError("No sales to export to CSV.");
      return;
    }
    const header = ["#", "Date", "Time", "Table", "Served By", "Total", "Discount", "Grand Total"];
    const rows = sales.map((sale, idx) => {
      const finalized = new Date(sale.finalizedAt || Date.now());
      return [
        idx + 1,
        finalized.toLocaleDateString(),
        finalized.toLocaleTimeString(),
        `"${(sale.tableName || "-").replace(/"/g, '""')}"`,
        `"${(sale.staffName || "-").replace(/"/g, '""')}"`,
        (sale.subTotal || 0).toFixed(2),
        (sale.discount || 0).toFixed(2),
        (sale.grandTotal || 0).toFixed(2),
      ].join(",");
    });

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `SalesReport_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sr-container">
      <div className="sr-header">
        <h1>Sales Report</h1>
        <div className="sr-actions">
          <button className="sr-btn pdf" title="Export PDF" onClick={generatePDF} disabled={loading}>
            <FaFilePdf /> <span className="sr-btn-text">PDF</span>
          </button>
          <button className="sr-btn csv" title="Export CSV" onClick={exportCSV} disabled={loading}>
            <FaFileCsv /> <span className="sr-btn-text">CSV</span>
          </button>
        </div>
      </div>

      <div className="sr-filter">
        <div className="sr-field">
          <label htmlFor="start-date">Start Date</label>
          <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="sr-field">
          <label htmlFor="end-date">End Date</label>
          <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <div className="sr-field">
          <button onClick={fetchReport} className="sr-generate" disabled={loading}>
            {loading ? "Loading..." : "Generate Report"}
          </button>
        </div>
      </div>

      {error && <div className="sr-error">{error}</div>}

      <div className="sr-table-wrap">
        <table className="sr-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Time</th>
              <th>Table</th>
              <th>Served By</th>
              <th className="align-right">Total</th>
              <th className="align-right">Discount</th>
              <th className="align-right">Grand Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="center">Loading report data...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan="8" className="center">No sales found for the selected date range.</td></tr>
            ) : (
              sales.map((sale, index) => {
                const finalized = new Date(sale.finalizedAt || Date.now());
                return (
                  <tr key={sale.id || index}>
                    <td>{index + 1}</td>
                    <td>{finalized.toLocaleDateString()}</td>
                    <td>{finalized.toLocaleTimeString()}</td>
                    <td className="font-medium">{sale.tableName || "-"}</td>
                    <td>{sale.staffName || "-"}</td>
                    <td className="align-right">{formatCurrency(sale.subTotal)}</td>
                    <td className="align-right discount">{formatCurrency(sale.discount)}</td>
                    <td className="align-right bold">{formatCurrency(sale.grandTotal)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="5" className="align-right">Totals:</td>
              <td className="align-right">{formatCurrency(totals.subTotal)}</td>
              <td className="align-right discount">{formatCurrency(totals.discount)}</td>
              <td className="align-right bold">{formatCurrency(totals.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default SalesReport;
