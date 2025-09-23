import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
    { name: 'Modules & Navigation', href: 'modules' },
    { name: 'Locale & Formats', href: 'locale' },
    { name: 'Calendars & Holidays', href: 'calendar' },
];

const SettingsLayout: React.FC = () => {
    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm ${
            isActive
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">System & Tenant Settings</h1>
                <p className="mt-1 text-sm text-gray-500">Manage global settings for the entire school tenant.</p>
            </div>
            
            <div className="bg-white border-b border-gray-200">
                 <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map((tab) => (
                        <NavLink
                            key={tab.name}
                            to={tab.href}
                            className={navLinkClasses}
                        >
                            {tab.name}
                        </NavLink>
                    ))}
                </nav>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <Outlet />
            </div>
        </div>
    );
};

export default SettingsLayout;
