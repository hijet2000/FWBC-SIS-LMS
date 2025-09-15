import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Icon components defined internally for clarity and to avoid extra files
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
);
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m9 5.197a6 6 0 006-5.197M15 21a6 6 0 00-9-5.197" /></svg>
);
const BookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
);
const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
);
const LibraryIcon: React.FC<{ className?: string }> = ({ className }) => (
 <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
);
const FilmIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
  </svg>
);
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const TableIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const CreditCardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);
const ReceiptIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l2-2 4 4 4-4-2-2m-2 4V3M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
);
const BusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.5c3.314 0 6 2.686 6 6v7.5H6v-7.5c0-3.314 2.686-6 6-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18h12M6 12h12m-9 6a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h3m9 0h3" />
    </svg>
);
const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944A12.02 12.02 0 0012 22a12.02 12.02 0 009-1.056v-1.007" />
    </svg>
);


interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  const baseClasses = "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2";
  const activeClasses = "bg-indigo-50 text-indigo-600 font-medium";

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : ""}`}
    >
      {icon}
      {label}
    </NavLink>
  );
};

const Sidebar: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const { user } = useAuth();

  const hasAnyScope = (requiredScopes: string[]): boolean => {
      if (!user) return false;
      return requiredScopes.some(scope => user.scopes.includes(scope));
  };
  
  const hasScope = (scope: string) => hasAnyScope([scope]);


  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 p-4 flex flex-col">
      <nav className="flex flex-col gap-1 text-sm font-normal">
        <div className="px-3 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">SIS</div>
        {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}`} icon={<HomeIcon className="h-4 w-4" />} label="Dashboard" />}
        {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/students`} icon={<UsersIcon className="h-4 w-4" />} label="Students" />}
        {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/academics`} icon={<BookIcon className="h-4 w-4" />} label="Academics" />}
        
        <div className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance</div>
        {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/attendance`} icon={<ClipboardIcon className="h-4 w-4" />} label="Daily Entry" />}
        {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/attendance/records`} icon={<TableIcon className="h-4 w-4" />} label="Records" />}
        {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/attendance/exports`} icon={<DownloadIcon className="h-4 w-4" />} label="Exports & Reports" />}

        <div className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fees</div>
        {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/fees`} icon={<CreditCardIcon className="h-4 w-4" />} label="Structures" />}
        {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/fees/payments`} icon={<ReceiptIcon className="h-4 w-4" />} label="Payments" />}

        <div className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Transport</div>
        {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/transport/vehicles`} icon={<BusIcon className="h-4 w-4" />} label="Vehicles" />}
        {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/transport/trips`} icon={<ClipboardIcon className="h-4 w-4" />} label="Trips" />}
        {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/transport/boarding`} icon={<UsersIcon className="h-4 w-4" />} label="Boarding" />}

        <div className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">LMS</div>
        {hasAnyScope(['lms:admin']) && <NavItem to={`/school/${siteId}/courses`} icon={<LibraryIcon className="h-4 w-4" />} label="Courses" />}
        {hasAnyScope(['school:admin', 'lms:admin', 'student']) && <NavItem to={`/school/${siteId}/library`} icon={<FilmIcon className="h-4 w-4" />} label="Digital Library" />}
        {hasAnyScope(['school:admin', 'student']) && <NavItem to={`/school/${siteId}/library/catchup`} icon={<ClockIcon className="h-4 w-4" />} label="Catch-Up Classes" />}
      
        <div className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</div>
        {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/admin/audit`} icon={<ShieldIcon className="h-4 w-4" />} label="Audit Trail" />}
        {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/admin/activity`} icon={<UsersIcon className="h-4 w-4" />} label="User Activity" />}
      
      </nav>
      <div className="mt-auto">
        {user && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-semibold text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-500">{user.role}</div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;