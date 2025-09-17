import React from 'react';

const AnalyticsDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
      <div className="flex flex-col items-center justify-center h-full text-center bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 min-h-[400px]">
        <h2 className="text-2xl font-bold text-gray-800">Centralized Analytics Hub</h2>
        <p className="mt-2 text-gray-500 max-w-2xl">
          This dashboard will provide a comprehensive, cross-functional view of school performance, powered by the central data warehouse.
          Key metrics from SIS, Fees, Academics, and more will be visualized here.
        </p>
         <p className="mt-1 text-sm text-gray-400">This feature is currently under development.</p>
      </div>
    </div>
  );
};

export default AnalyticsDashboardPage;
