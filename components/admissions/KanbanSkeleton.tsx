import React from 'react';

const KanbanSkeleton: React.FC = () => {
  return (
    <div className="flex space-x-4 h-full overflow-x-auto p-2 -m-2 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex-1 bg-gray-100 p-3 rounded-lg min-w-[280px]">
          <div className="flex justify-between items-center mb-4">
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            <div className="h-5 bg-gray-200 rounded-full w-8"></div>
          </div>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-md shadow-sm border">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm border">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm border">
               <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
               <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanSkeleton;
