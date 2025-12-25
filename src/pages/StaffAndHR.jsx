// src/pages/StaffAndHR.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  ChartBarSquareIcon,
  UserPlusIcon,
  ScaleIcon,
  ChevronLeftIcon, // Import the back arrow icon
} from '@heroicons/react/24/outline';

const hrCards = [
  {
    to: '/hr/directory',
    title: 'Staff Master & Directory',
    description: 'Quick look-up for all current employees, roles, and total headcount.',
    icon: <UsersIcon className="h-8 w-8 text-blue-500" />,
    color: 'blue'
  },
  {
    to: '/hr/staff-order-volume',
    title: 'Staff-wise Order Volume',
    description: 'Monitor physical workload and order fulfillment by individual staff.',
    icon: <ClipboardDocumentCheckIcon className="h-8 w-8 text-emerald-500" />,
    color: 'emerald'
  },
  {
    to: '/hr/sales-contribution',
    title: 'Sales Contribution by Staff',
    description: 'Identify top performers and staff members driving upselling revenue.',
    icon: <CurrencyDollarIcon className="h-8 w-8 text-amber-500" />,
    color: 'amber'
  },
  {
    to: '/hr/productivity-kpi',
    title: 'Productivity Dashboard (KPIs)',
    description: 'High-level comparison of efficiency and service speed across the team.',
    icon: <ChartBarSquareIcon className="h-8 w-8 text-purple-500" />,
    color: 'purple'
  },
  {
    to: '/hr/activity-monitor',
    title: 'Activity & Engagement Monitor',
    description: 'Verify real-time attendance and identify inactive staff members.',
    icon: <UserPlusIcon className="h-8 w-8 text-rose-500" />,
    color: 'rose'
  },
  {
    to: '/hr/load-revenue-balance',
    title: 'Load vs. Revenue Balance',
    description: 'Analyze the balance between order volume and actual revenue generated.',
    icon: <ScaleIcon className="h-8 w-8 text-cyan-500" />,
    color: 'cyan'
  },
];

const StaffAndHR = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Back Button and Header */}
      <div className="mb-8">
        <Link 
          to="/reports" 
          className="flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-4 group"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Reports
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Staff & HR Management</h1>
        <p className="text-gray-500 mt-1">Manage your team and monitor operational performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {hrCards.map((card) => (
          <Link
            key={card.title}
            to={card.to}
            className="group bg-white rounded-xl shadow-md p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-200"
          >
            <div>
              <div className="mb-4">{card.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{card.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{card.description}</p>
            </div>
            <div className="mt-6">
              <span className={`font-semibold text-${card.color}-600 group-hover:text-${card.color}-800 transition-colors inline-flex items-center`}>
                Manage & View &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default StaffAndHR;