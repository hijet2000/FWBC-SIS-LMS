import React from 'react';
import { Outlet, NavLink, useParams } from 'react-router-dom';
import ParentHeader from './ParentHeader';

const ParentLayout: React.FC = () => {
    const { siteId, studentId } = useParams<{ siteId: string, studentId: string }>();

    const navItems = [
        { name: 'Homework', href: `/portal/${siteId}/parent/student/${studentId}/homework` },
        { name: 'Library', href: `/portal/${siteId}/parent/student/${studentId}/library` },
        { name: 'Hostel', href: `/portal/${siteId}/parent/student/${studentId}/hostel` },
    ];

    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm ${
            isActive
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <ParentHeader />
            <div className="bg-white border-b border-gray-200">
                 <nav className="max-w-screen-2xl mx-auto -mb-px flex space-x-8 px-4 sm:px-6 lg:px-8" aria-label="Tabs">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            className={navLinkClasses}
                        >
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
            </div>
            <main className="flex-1 p-6 md:p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default ParentLayout;