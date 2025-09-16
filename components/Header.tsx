import React from 'react';
import ScopeSwitcher from '@/components/dev/ScopeSwitcher';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-1 md:flex md:items-center md:gap-12">
            <span className="text-xl font-bold text-gray-800">FWBC 2025</span>
          </div>
          <div className="md:flex md:items-center md:gap-4">
            <ScopeSwitcher />
            <span className="text-sm font-medium text-gray-500">Foundation</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;