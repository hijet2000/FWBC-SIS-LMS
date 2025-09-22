import React from 'react';
import { useAuth } from '../../auth/AuthContext';

const ParentHeader: React.FC = () => {
  const { user } = useAuth();
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <span className="text-xl font-bold text-gray-800">FWBC Parent Portal</span>
          {user && (
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">{user.name}</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default ParentHeader;
