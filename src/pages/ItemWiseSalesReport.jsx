import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { getSalesByDateRange, getSettings } from "../firebase/firebase.js";

// --- SVG Icons ---
const FaFilePdf = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M416 224V64c0-8.8-7.2-16-16-16H112c-8.8 0-16 7.2-16 16v160h320zM96 256H32v176c0 13.3 10.7 24 24 24h32v-80c0-26.5 21.5-48 48-48h160c26.5 0 48 21.5 48 48v80h32c13.3 0 24-10.7 24-24V256H96zM480 96h-32v128h32c8.8 0 16-7.2 16-16V112c0-8.8-7.2-16-16-16zM288 352h-64c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16v-64c0-8.8-7.2-16-16-16z"></path></svg>;
const FaFileCsv = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M512 288c0 44.2-35.8 80-80 80s-80-35.8-80-80 35.8-80 80-80 80 35.8 80 80zM400 288c0 22.1 17.9 40 40 40s40-17.9 40-40-17.9-40-40-40-40 17.9-40 40zM192 288c0 44.2-35.8 80-80 80s-80-35.8-80-80 35.8-80 80-80 80 35.8 80 80zM32 288c0 22.1 17.9 40 40 40s40-17.9 40-40-17.9-40-40-40-40 17.9-40 40zM320 128c0 44.2-35.8 80-80 80s-80-35.8-80-80 35.8-80 80-80 80 35.8 80 80zM160 128c0 22.1 17.9 40 40 40s40-17.9 40-40-17.9-40-40-40-40 17.9-40 40zM256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zM256 480c-123.5 0-224-100.5-224-224S132.5 32 256 32s224 100.5 224 224-100.5 224-224 224z"></path></svg>;
const FaInbox = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M528 224H48.8c-10.7 0-20.8 5.1-26.9 13.2L0 273.4V464c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V273.4l-21.9-36.2c-6-8.1-16.1-13.2-26.9-13.2zM48 352h160v64H48v-64zm192 0h160v64H240v-64zm336-48.4l19.2 31.8-19.2 31.8V303.6zM48 0h480c26.5 0 48 21.5 48 48v80H0V48C0 21.5 21.5 0 48 0z"></path></svg>;
const FaPlay = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path></svg>;
const FaChartBar = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M32 32v448h448V32H32zm240 344h-32V200h32v176zm88 0h-32V136h32v240zm-176 0h-32V280h32v96z"></path></svg>;
const FaChartPie = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 544 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M527.79 288H290.51a15.95 15.95 0 0 1-15.95-16V16.21a15.95 15.95 0 0 1 15.95-16c2.65 0 5.26.65 7.64 1.86A256.06 256.06 0 0 1 527.79 288zm-288-16a15.95 15.95 0 0 1 15.95-16H528a16 16 0 0 1 16 16v16a256 256 0 0 1-256 256H21.53c-11.21 0-19.18-11.45-14.45-21.53A256.06 256.06 0 0 1 239.79 272z"></path></svg>;
const FaChartLine = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M500 384c6.6 0 12-5.4 12-12V108c0-6.6-5.4-12-12-12h-20c-6.6 0-12 5.4-12 12v33.3L339.5 280.8 223.7 125.5c-4.5-5.8-12.3-7.5-18.7-4.4l-112 56C85.7 180.1 80 186.8 80 194.5V320c0 6.6 5.4 12 12 12h20c6.6 0 12-5.4 12-12v-33.3l128.5-160.6 115.7 154.3c4.5 5.8 12.3 7.5 18.7 4.4l112-56c6.4-3.1 13.2-2.3 18.7 2.2l20 20V372c0 6.6 5.4 12 12 12z"></path></svg>;
const FaTrophy = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M552 64H448V24c0-13.3-10.7-24-24-24H152c-13.3 0-24 10.7-24 24v40H24C10.7 64 0 74.7 0 88v56c0 66.5 77.9 130.7 171.9 142.4C203.3 392.4 256 464 256 464v48H176c-13.3 0-24 10.7-24 24s10.7 24 24 24h224c13.3 0 24-10.7 24-24s-10.7-24-24-24H320v-48s52.7-71.6 84.1-177.6C502.1 274.7 576 210.5 576 144V88c0-13.3-10.7-24-24-24zM128 128c0-17.7 14.3-32 32-32h192c17.7 0 32 14.3 32 32v32H128v-32z"></path></svg>;
const FaMoon = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M283.211 512c78.962 0 151.079-35.925 198.857-94.792 7.068-8.708-.639-21.43-11.562-19.35-124.203 23.654-238.262-71.576-238.262-196.954 0-72.222 38.662-138.635 101.498-174.394 9.686-5.512 7.25-20.197-3.756-22.23A258.156 258.156 0 0 0 283.211 0c-141.309 0-256 114.51-256 256 0 141.309 114.51 256 256 256z"></path></svg>;
const FaSun = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M256 160c-52.9 0-96 43.1-96 96s43.1 96 96 96 96-43.1 96-96-43.1-96-96-96zm246.4 80.5l-94.7-47.3 33.5-100.4c4.5-13.6-8.4-26.5-21.9-21.9l-100.4 33.5-47.3-94.7c-6.4-12.8-24.6-12.8-31 0l-47.3 94.7-100.4-33.5c-13.6-4.5-26.5 8.4-21.9 21.9l33.5 100.4-94.7 47.3c-12.8 6.4-12.8 24.6 0 31l94.7 47.3-33.5 100.5c-4.5 13.6 8.4 26.5 21.9 21.9l100.4-33.5 47.3 94.7c6.4 12.8 24.6 12.8 31 0l47.3-94.7 100.4 33.5c13.6 4.5 26.5-8.4 21.9-21.9l-33.5-100.4 94.7-47.3c13-6.5 13-24.7.2-31.1z"></path></svg>;

// --- Custom Hooks ---
const useAnimatedCounter = (endValue = 0, duration = 1500) => {
    const [count, setCount] = useState(0);
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);

    useEffect(() => {
        let currentFrame = 0;
        const counter = setInterval(() => {
            currentFrame++;
            const progress = currentFrame / totalFrames;
            setCount(endValue * progress);

            if (currentFrame === totalFrames) {
                clearInterval(counter);
                setCount(endValue);
            }
        }, frameRate);

        return () => clearInterval(counter);
    }, [endValue, duration]);

    return count;
};


const ItemWiseSalesReport = () => {
    // --- State Management ---
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reportData, setReportData] = useState([]);
    const [previousReportData, setPreviousReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState(null);
    const [chartType, setChartType] = useState('bar');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'totalRevenue', direction: 'descending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const itemsPerPage = 10;

    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const submitButtonRef = useRef(null);
    
    // --- Data Processing ---
    const processSalesData = (sales) => {
        const itemData = sales.reduce((acc, sale) => {
            (sale.items || []).forEach(item => {
                const itemName = item.name || "Unknown Item";
                if (!acc[itemName]) {
                    acc[itemName] = { quantity: 0, totalRevenue: 0, price: Number(item.price) || 0 };
                }
                const quantity = Number(item.quantity) || 0;
                acc[itemName].quantity += quantity;
                acc[itemName].totalRevenue += quantity * (Number(item.price) || 0);
            });
            return acc;
        }, {});

        const totalRevenueAllItems = Object.values(itemData).reduce((sum, item) => sum + item.totalRevenue, 0);
        return Object.entries(itemData).map(([name, data]) => ({
            name, ...data,
            contribution: totalRevenueAllItems > 0 ? (data.totalRevenue / totalRevenueAllItems) * 100 : 0,
        }));
    };

    // --- Data Fetching & URL Param Handling ---
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const start = params.get('startDate');
        const end = params.get('endDate');
        if(start && end) {
            setStartDate(start);
            setEndDate(end);
            setIsModalOpen(false);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (startDate && endDate) {
                setLoading(true);
                const currentStart = new Date(startDate);
                const currentEnd = new Date(endDate);
                const diff = currentEnd.getTime() - currentStart.getTime();
                const prevEnd = new Date(currentStart.getTime() - 1);
                const prevStart = new Date(prevEnd.getTime() - diff);

                try {
                    const [settingsData, sales, prevSales] = await Promise.all([
                        getSettings(),
                        getSalesByDateRange(currentStart, currentEnd),
                        getSalesByDateRange(prevStart, prevEnd),
                    ]);
                    setSettings(settingsData || {});
                    setReportData(processSalesData(sales));
                    setPreviousReportData(processSalesData(prevSales));
                    
                    const params = new URLSearchParams({startDate, endDate});
                    window.history.pushState(null, '', `?${params.toString()}`);
                } catch (err) {
                    console.error("Error processing item-wise sales report:", err);
                }
                setLoading(false);
            }
        };
        fetchData();
    }, [startDate, endDate]);

    // --- Dark Mode ---
    useEffect(() => {
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDarkMode]);

    // --- Memoized Data for Performance ---
    const sortedFilteredData = useMemo(() => {
        let data = [...reportData];
        if (searchTerm) {
            data = data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        data.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return data;
    }, [reportData, searchTerm, sortConfig]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedFilteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedFilteredData, currentPage]);
    
    // --- Calculations for Summary & Comparison ---
    const summary = useMemo(() => reportData.reduce((acc, curr) => {
        acc.totalRevenue += curr.totalRevenue;
        acc.totalQuantity += curr.quantity;
        return acc;
    }, { totalRevenue: 0, totalQuantity: 0 }), [reportData]);

    const prevSummary = useMemo(() => previousReportData.reduce((acc, curr) => {
        acc.totalRevenue += curr.totalRevenue;
        acc.totalQuantity += curr.quantity;
        return acc;
    }, { totalRevenue: 0, totalQuantity: 0 }), [previousReportData]);
    
    const calculateChange = (current, previous) => {
        if(previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };
    const revenueChange = calculateChange(summary.totalRevenue, prevSummary.totalRevenue);
    const quantityChange = calculateChange(summary.totalQuantity, prevSummary.totalQuantity);

    const bestSeller = sortedFilteredData.length > 0 ? sortedFilteredData[0].name : "N/A";
    const currency = "";
    
    // --- Animated Counters ---
    const animatedRevenue = useAnimatedCounter(summary.totalRevenue);
    const animatedQuantity = useAnimatedCounter(summary.totalQuantity);
    
    // --- Chart Drawing ---
    useEffect(() => {
        if (chartInstanceRef.current) chartInstanceRef.current.destroy();
        if (paginatedData.length === 0 || !chartRef.current) return;

        const drawChart = () => {
            const ctx = chartRef.current.getContext('2d');
            const dataToShow = chartType === 'pie' ? sortedFilteredData.slice(0, 7) : paginatedData;
            const labels = dataToShow.map(d => d.name);
            const data = dataToShow.map(d => d.totalRevenue);

            // Dynamically set colors for dark/light mode
            const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            const textColor = isDarkMode ? '#e2e8f0' : '#334155';
            const titleColor = isDarkMode ? '#f1f5f9' : '#1e293b';

            chartInstanceRef.current = new window.Chart(ctx, {
                type: chartType,
                data: {
                    labels,
                    datasets: [{
                        label: 'Total Revenue',
                        data,
                        backgroundColor: chartType === 'pie' ? ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'] : '#4f46e5',
                        borderColor: isDarkMode ? '#374151' : '#fff',
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: chartType === 'bar' ? 'y' : 'x',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: chartType === 'pie',
                            labels: { color: textColor }
                        },
                        title: {
                            display: true,
                            text: 'Item Revenue',
                            color: titleColor
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: { color: textColor },
                            grid: { color: gridColor }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: { color: textColor },
                            grid: { color: gridColor }
                        }
                    }
                }
            });
        };

        if (!window.Chart) {
            const chartScript = document.createElement('script');
            chartScript.src = "https://cdn.jsdelivr.net/npm/chart.js";
            chartScript.onload = drawChart;
            document.body.appendChild(chartScript);
        } else {
            drawChart();
        }
    }, [paginatedData, sortedFilteredData, chartType, isDarkMode]);

    // --- Handlers ---
    const handleDateShortcut = (range) => {
        const end = new Date();
        let start = new Date();
        if(range === 'today') start.setHours(0,0,0,0);
        else if (range === 'week') start.setDate(end.getDate() - 6);
        else if (range === 'month') start.setDate(1);
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
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    // --- Exporters ---
    const exportPDF = useCallback(() => {
        if (sortedFilteredData.length === 0) return;

        const performExport = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const restaurantName = settings?.restaurantName || "Restaurant";

            doc.setFontSize(18);
            doc.text(`${restaurantName} - Item-Wise Sales Report`, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 30);

            const tableColumns = ["#", "Item Name", "Qty Sold", "Unit Price", "Total Revenue", "% of Total"];
            const tableRows = sortedFilteredData.map((item, idx) => [
                idx + 1, item.name, item.quantity,
                `${currency}${item.price.toFixed(2)}`,
                `${currency}${item.totalRevenue.toFixed(2)}`,
                `${item.contribution.toFixed(2)}%`,
            ]);

            doc.autoTable({
                startY: 40, head: [tableColumns], body: tableRows,
                foot: [['', 'TOTALS', summary.totalQuantity, '', `${currency}${summary.totalRevenue.toFixed(2)}`, '100.00%']],
                theme: "striped",
                headStyles: { fillColor: [44, 62, 80] },
                footStyles: { fillColor: [236, 240, 241], textColor: [44, 62, 80], fontStyle: 'bold' },
            });

            doc.save(`ItemWiseSalesReport_${startDate}_to_${endDate}.pdf`);
        };

        const loadScriptsAndExport = () => {
            if (window.jspdf && window.jspdf.autoTable) {
                performExport();
            } else if (window.jspdf) {
                const autoTableScript = document.createElement('script');
                autoTableScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
                autoTableScript.onload = performExport;
                document.body.appendChild(autoTableScript);
            } else {
                const jspdfScript = document.createElement('script');
                jspdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
                jspdfScript.onload = () => loadScriptsAndExport();
                document.body.appendChild(jspdfScript);
            }
        };
        loadScriptsAndExport();
    }, [sortedFilteredData, settings, startDate, endDate, summary]);
    
    const exportCSV = () => {
        if(sortedFilteredData.length === 0) return;
        const headers = ["Item Name", "Qty Sold", "Unit Price", "Total Revenue", "% of Total"];
        const rows = sortedFilteredData.map(item => [
            `"${item.name.replace(/"/g, '""')}"`, item.quantity, item.price, item.totalRevenue, item.contribution.toFixed(2)
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `ItemWiseSalesReport_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const ChangeIndicator = ({ value }) => (
        <span className={`text-xs ml-2 font-bold ${value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {value >= 0 ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
        </span>
    );
    
    // --- Render Logic ---
    if (isModalOpen) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md animate-fade-in-up">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Select Date Range</h2>
                    <div className="flex justify-center gap-2 mb-4">
                        <button onClick={() => handleDateShortcut('today')} className="px-3 py-1 text-sm bg-slate-200 rounded-full hover:bg-slate-300">Today</button>
                        <button onClick={() => handleDateShortcut('week')} className="px-3 py-1 text-sm bg-slate-200 rounded-full hover:bg-slate-300">This Week</button>
                        <button onClick={() => handleDateShortcut('month')} className="px-3 py-1 text-sm bg-slate-200 rounded-full hover:bg-slate-300">This Month</button>
                    </div>
                    <div className="space-y-4">
                        <input ref={startDateRef} type="date" className="w-full border-gray-300 rounded-md p-2" />
                        <input ref={endDateRef} type="date" className="w-full border-gray-300 rounded-md p-2" />
                    </div>
                    <button ref={submitButtonRef} onClick={handleDateSubmit} className="w-full mt-8 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-md hover:bg-indigo-700">
                        <FaPlay /> Generate Report
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-300">
            <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Item-Wise Sales Report</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {startDate} to {endDate}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600">{isDarkMode ? <FaSun/> : <FaMoon/>}</button>
                    <button onClick={exportCSV} disabled={reportData.length === 0} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg shadow hover:bg-green-700 disabled:bg-gray-400"><FaFileCsv /> CSV</button>
                    <button onClick={exportPDF} disabled={reportData.length === 0} className="flex items-center gap-2 bg-rose-600 text-white px-3 py-2 rounded-lg shadow hover:bg-rose-700 disabled:bg-gray-400"><FaFilePdf /> PDF</button>
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow text-center"><p className="text-sm text-slate-500 dark:text-slate-400">Total Revenue</p><p className="text-2xl font-bold flex items-center justify-center">{currency}{animatedRevenue.toFixed(2)} <ChangeIndicator value={revenueChange} /></p></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow text-center"><p className="text-sm text-slate-500 dark:text-slate-400">Total Items Sold</p><p className="text-2xl font-bold flex items-center justify-center">{Math.round(animatedQuantity)} <ChangeIndicator value={quantityChange}/></p></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow text-center"><p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1"><FaTrophy className="text-amber-400"/>Best Seller</p><p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 truncate">{bestSeller}</p></div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg mb-6">
                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                    <input type="text" placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2 border rounded-md bg-transparent dark:border-slate-600"/>
                    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <button onClick={() => setChartType('bar')} className={`p-2 rounded-md ${chartType === 'bar' ? 'bg-indigo-600 text-white' : ''}`}><FaChartBar/></button>
                        <button onClick={() => setChartType('pie')} className={`p-2 rounded-md ${chartType === 'pie' ? 'bg-indigo-600 text-white' : ''}`}><FaChartPie/></button>
                        <button onClick={() => setChartType('line')} className={`p-2 rounded-md ${chartType === 'line' ? 'bg-indigo-600 text-white' : ''}`}><FaChartLine/></button>
                    </div>
                </div>
                <div className="h-96"><canvas ref={chartRef}></canvas></div>
            </div>
            
            <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                {loading ? <div className="text-center p-20">Loading...</div> : (
                <table className="min-w-full">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">#</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"><button onClick={() => requestSort('name')} className="w-full flex items-center justify-start gap-1"><span>Item Name</span>{sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button></th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"><button onClick={() => requestSort('quantity')} className="w-full flex items-center justify-end gap-1"><span>Qty Sold</span>{sortConfig.key === 'quantity' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button></th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"><button onClick={() => requestSort('price')} className="w-full flex items-center justify-end gap-1"><span>Unit Price</span>{sortConfig.key === 'price' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button></th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"><button onClick={() => requestSort('totalRevenue')} className="w-full flex items-center justify-end gap-1"><span>Total Revenue</span>{sortConfig.key === 'totalRevenue' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button></th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"><button onClick={() => requestSort('contribution')} className="w-full flex items-center justify-end gap-1"><span>% of Total</span>{sortConfig.key === 'contribution' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                    {paginatedData.length > 0 ? paginatedData.map((row, idx) => (
                        <tr key={row.name} className="hover:bg-indigo-50 dark:hover:bg-slate-700">
                            <td className="px-6 py-4 text-right">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                            <td className="px-6 py-4 font-medium text-left">{row.name}</td>
                            <td className="px-6 py-4 text-right">{row.quantity}</td>
                            <td className="px-6 py-4 text-right">{currency}{row.price.toFixed(2)}</td>
                            <td className="px-6 py-4 font-bold text-indigo-700 dark:text-indigo-400 text-right">{currency}{row.totalRevenue.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right text-sm">{row.contribution.toFixed(1)}%</td>
                        </tr>
                    )) : (
                        <tr>
                           <td colSpan={6} className="text-center py-16">
                               <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                                   <FaInbox className="w-16 h-16 mb-4" />
                                   <h3 className="text-xl font-semibold">No Item Data Found</h3>
                                   <p className="text-sm mt-1">There were no items sold in this date range.</p>
                               </div>
                           </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                )}
            </div>

            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">Showing {paginatedData.length} of {sortedFilteredData.length} items</span>
                <div>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50 dark:border-slate-600">Prev</button>
                    <span className="mx-2">{currentPage} / {Math.max(1, Math.ceil(sortedFilteredData.length / itemsPerPage))}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedFilteredData.length / itemsPerPage), p + 1))} disabled={currentPage * itemsPerPage >= sortedFilteredData.length} className="px-3 py-1 border rounded-md disabled:opacity-50 dark:border-slate-600">Next</button>
                </div>
            </div>
        </div>
    );
};

export default ItemWiseSalesReport;

//This is new 
