import React from 'react';
import { Link } from 'react-router-dom';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  linkTo: string;
  loading: boolean;
  className?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, linkTo, loading, className = '' }) => {
  const renderContent = () => {
    if (loading) {
      return <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>;
    }
    return <p className={`text-4xl font-bold ${className}`}>{value}</p>;
  };

  return (
    <Link to={linkTo} className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="mt-2">
            {renderContent()}
          </div>
        </div>
        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-full">
          {icon}
        </div>
      </div>
    </Link>
  );
};

export default KpiCard;
