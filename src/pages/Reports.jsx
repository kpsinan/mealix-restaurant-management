// src/pages/Reports.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  UsersIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';

const reportCategories = [
  {
    isLink: true,
    to: '/reports/sales-and-revenue',
    title: 'Sales & Revenue Reports',
    description: 'Track daily, weekly, and monthly sales performance and revenue streams.',
    icon: <ArrowTrendingUpIcon className="h-8 w-8 text-blue-500" />,
    color: 'blue'
  },
  {
    title: 'Profit & Financial Reports',
    description: 'Analyze profit margins, costs of goods sold, and overall financial health.',
    icon: <BanknotesIcon className="h-8 w-8 text-green-500" />,
    color: 'green'
  },
  {
    title: 'Customer Reports',
    description: 'Gain insights into customer behavior, order frequency, and popular items.',
    icon: <UsersIcon className="h-8 w-8 text-purple-500" />,
    color: 'purple'
  },
  {
    isLink: true, // Link enabled
    to: '/staff-and-hr', // Pointing to your new page
    title: 'Staff & HR Reports',
    description: 'Monitor staff performance, work hours, tips, and payroll data.',
    icon: <UserGroupIcon className="h-8 w-8 text-red-500" />,
    color: 'red'
  },
  {
    isLink: true,
    to: '/reports/analytical',
    title: 'Analytical & Comparative Reports',
    description: 'Compare performance across different time periods or menu items.',
    icon: <DocumentChartBarIcon className="h-8 w-8 text-indigo-500" />,
    color: 'indigo'
  },
];

const Reports = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Reports Dashboard</h1>
        <p className="text-gray-500 mt-1">Select a category to view detailed reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {reportCategories.map((report) => (
          report.isLink ? (
            <Link
              key={report.title}
              to={report.to}
              className="group bg-white rounded-xl shadow-md p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-200"
            >
              <div>
                <div className="mb-4">{report.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{report.title}</h3>
                <p className="text-gray-600 text-sm">{report.description}</p>
              </div>
              <div className="mt-6">
                <span className={`font-semibold text-${report.color}-600 group-hover:text-${report.color}-800 transition-colors`}>
                  View Reports &rarr;
                </span>
              </div>
            </Link>
          ) : (
            <div
              key={report.title}
              className="group bg-white rounded-xl shadow-md p-6 flex flex-col justify-between border border-gray-200"
            >
              <div>
                <div className="mb-4">{report.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{report.title}</h3>
                <p className="text-gray-600 text-sm">{report.description}</p>
              </div>
              <div className="mt-6">
                <span className="font-semibold text-gray-400">
                  Coming Soon
                </span>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default Reports;