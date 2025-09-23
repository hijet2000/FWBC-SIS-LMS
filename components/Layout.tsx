

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import { SettingsProvider } from '../contexts/SettingsContext';

const Layout: React.FC = () => {
  return (
    <SettingsProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-hidden">
            <Breadcrumbs />
            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SettingsProvider>
  );
};

export default Layout;