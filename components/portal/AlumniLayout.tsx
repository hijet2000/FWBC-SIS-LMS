import React from 'react';
import { Outlet, NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const AlumniHeader: React.FC = () => {
  const { user } = useAuth();
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <span className="text-xl font-bold text-gray-800">FWBC Alumni Portal</span>
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

const AlumniLayout: React.FC = () => {
    const { siteId, alumniId } = useParams<{ siteId: string, alumniId: string }>();

    const navItems = [
        { name: 'My Profile', href: `/portal/${siteId}/alumni/${alumniId}/profile` },
        { name: 'Directory', href: `/portal/${siteId}/alumni/${alumniId}/directory` },
        { name: 'Events', href: `/portal/${siteId}/alumni/${alumniId}/events` },
        { name: 'Give Back', href: `/portal/${siteId}/alumni/${alumniId}/donate` },
    ];

    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm ${
            isActive
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <AlumniHeader />
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

export default AlumniLayout;
