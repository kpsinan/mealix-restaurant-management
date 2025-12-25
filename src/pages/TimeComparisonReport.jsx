import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  CalendarIcon, 
  ChevronLeftIcon,
  CurrencyRupeeIcon,
  ClipboardDocumentCheckIcon,
  CalculatorIcon
} from '@heroicons/react/24/solid';
import { getSalesByDateRange } from '../firebase/firebase'; // Ensure path is correct
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, isWithinInterval } from 'date-fns';

const TimeComparisonReport = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [period, setPeriod] = useState('day'); // 'day', 'week', 'month'

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startOfPrev, endOfCurr;

      // Define the range needed to cover both current and previous periods
      if (period === 'day') {
        startOfPrev = startOfDay(subDays(now, 1));
        endOfCurr = endOfDay(now);
      } else if (period === 'week') {
        startOfPrev = startOfWeek(subWeeks(now, 1));
        endOfCurr = endOfWeek(now);
      } else {
        startOfPrev = startOfMonth(subMonths(now, 1));
        endOfCurr = endOfMonth(now);
      }

      const data = await getSalesByDateRange(startOfPrev, endOfCurr);
      setSalesData(data);
    } catch (error) {
      console.error("Error fetching comparison data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    let currInterval, prevInterval;

    if (period === 'day') {
      currInterval = { start: startOfDay(now), end: endOfDay(now) };
      prevInterval = { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
    } else if (period === 'week') {
      currInterval = { start: startOfWeek(now), end: endOfWeek(now) };
      prevInterval = { start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) };
    } else {
      currInterval = { start: startOfMonth(now), end: endOfMonth(now) };
      prevInterval = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    }

    const calculateMetrics = (interval) => {
      const filtered = salesData.filter(sale => 
        isWithinInterval(new Date(sale.finalizedAt), interval)
      );
      const revenue = filtered.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const orders = filtered.length;
      const abv = orders > 0 ? revenue / orders : 0;
      return { revenue, orders, abv };
    };

    const current = calculateMetrics(currInterval);
    const previous = calculateMetrics(prevInterval);

    const getGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      current,
      previous,
      growth: {
        revenue: getGrowth(current.revenue, previous.revenue),
        orders: getGrowth(current.orders, previous.orders),
        abv: getGrowth(current.abv, previous.abv)
      }
    };
  }, [salesData, period]);

  const StatCard = ({ title, current, previous, growth, icon: Icon, isCurrency }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-50 rounded-lg">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
        <div className={`flex items-center text-sm font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {growth >= 0 ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
          {Math.abs(growth).toFixed(1)}%
        </div>
      </div>
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">
          {isCurrency ? `₹${current.toLocaleString()}` : current}
        </span>
        <span className="text-sm text-gray-400">
          {isCurrency ? `₹${previous.toLocaleString()}` : previous}
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-1 italic">vs. previous {period}</p>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <button 
            onClick={() => window.history.back()}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" /> Back to Reports
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Time-Based Comparison</h1>
          <p className="text-gray-500 mt-1">Growth and performance analytics across periods.</p>
        </div>

        <div className="inline-flex p-1 bg-gray-200 rounded-lg">
          {['day', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}ly
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Revenue" 
            current={stats.current.revenue} 
            previous={stats.previous.revenue} 
            growth={stats.growth.revenue}
            icon={CurrencyRupeeIcon}
            isCurrency
          />
          <StatCard 
            title="Total Orders" 
            current={stats.current.orders} 
            previous={stats.previous.orders} 
            growth={stats.growth.orders}
            icon={ClipboardDocumentCheckIcon}
          />
          <StatCard 
            title="Avg Order Value (ABV)" 
            current={stats.current.abv} 
            previous={stats.previous.abv} 
            growth={stats.growth.abv}
            icon={CalculatorIcon}
            isCurrency
          />
        </div>
      )}
      
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6 text-blue-800">
        <div className="flex items-start gap-3">
          <CalendarIcon className="h-6 w-6 text-blue-500 flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Insights Summary</h4>
            <p className="text-sm mt-1">
              {stats.growth.revenue >= 0 
                ? `Great job! Your revenue is up by ${stats.growth.revenue.toFixed(1)}% compared to the previous ${period}.`
                : `Revenue has declined by ${Math.abs(stats.growth.revenue).toFixed(1)}%. Consider running promotions or checking your menu performance.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeComparisonReport;