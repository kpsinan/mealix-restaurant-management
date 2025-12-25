// src/pages/AnalyticalReports.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowsRightLeftIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  StarIcon,
  ChartPieIcon,
  SquaresPlusIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';

const analyticalCards = [
  {
    to: '/reports/analytical/time-comparison',
    title: 'Time-Based Comparison',
    description: 'Compare Today vs Yesterday, This Week vs Last Week. Track growth percentages across periods.',
    icon: <ArrowsRightLeftIcon className="h-8 w-8 text-blue-500" />,
    color: 'blue'
  },
  {
    to: '/reports/analytical/sales-trends',
    title: 'Sales Trend Analysis',
    description: 'Graph-based visualization of daily, weekly, and monthly revenue and order trends.',
    icon: <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />,
    color: 'green'
  },
  {
    to: '/reports/analytical/peak-times',
    title: 'Peak Time Analysis',
    description: 'Identify busiest hours for orders and revenue. Critical for staff scheduling and kitchen management.',
    icon: <ClockIcon className="h-8 w-8 text-orange-500" />,
    color: 'orange'
  },
  {
    to: '/reports/analytical/menu-performance',
    title: 'Menu Performance (ABC)',
    description: 'ABC Analysis: Top 10 stars vs bottom 10 items. Analyze revenue contribution and popularity.',
    icon: <StarIcon className="h-8 w-8 text-yellow-500" />,
    color: 'yellow'
  },
  {
    to: '/reports/analytical/category-contribution',
    title: 'Category Contribution',
    description: 'Analyze which categories drive your revenue. View percentage share of total business.',
    icon: <ChartPieIcon className="h-8 w-8 text-indigo-500" />,
    color: 'indigo'
  },
  {
    to: '/reports/analytical/table-utilization',
    title: 'Table Utilization Analytics',
    description: 'Optimize layout by identifying most profitable and least used tables.',
    icon: <SquaresPlusIcon className="h-8 w-8 text-purple-500" />,
    color: 'purple'
  },
  {
    to: '/reports/analytical/abv-analysis',
    title: 'Average Bill Value (ABV)',
    description: 'Track ABV by day, table, and time to optimize upselling and combo strategies.',
    icon: <CalculatorIcon className="h-8 w-8 text-red-500" />,
    color: 'red'
  },
];

const AnalyticalReports = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Analytical & Comparative Reports</h1>
        <p className="text-gray-500 mt-1">Advanced insights for data-driven decision making.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {analyticalCards.map((card) => (
          <Link
            key={card.title}
            to={card.to}
            className="group bg-white rounded-xl shadow-md p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-200"
          >
            <div>
              <div className="mb-4">{card.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{card.title}</h3>
              <p className="text-gray-600 text-sm">{card.description}</p>
            </div>
            <div className="mt-6">
              <span className={`font-semibold text-${card.color}-600 group-hover:text-${card.color}-800 transition-colors`}>
                View Analytics &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AnalyticalReports;