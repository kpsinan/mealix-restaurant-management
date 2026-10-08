import React from 'react';

const PageSkeleton = () => {
  return (
    <div className="w-full min-h-screen p-6 space-y-6 bg-gray-50 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div className="w-1/3 h-10 bg-gray-200 rounded-lg"></div>
        <div className="flex gap-4">
          <div className="w-24 h-10 bg-gray-200 rounded-lg"></div>
          <div className="w-24 h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
            <div className="w-1/2 h-6 bg-gray-200 rounded mb-2"></div>
            <div className="w-3/4 h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-96">
        <div className="w-1/4 h-8 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-4">
          <div className="w-full h-12 bg-gray-100 rounded"></div>
          <div className="w-full h-12 bg-gray-100 rounded"></div>
          <div className="w-full h-12 bg-gray-100 rounded"></div>
          <div className="w-full h-12 bg-gray-100 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;
