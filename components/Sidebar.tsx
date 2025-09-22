// FIX: Removed invalid CDATA wrapper.
import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// --- Icon Components ---
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
const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const FolderAddIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h5l2 2h5a2 2 0 012 2v10a2 2 0 01-2-2H5a2 2 0 01-2-2z" />
  </svg>
);
const IdentificationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6" />
  </svg>
);
const PhoneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);
const MailIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);
const OfficeBuildingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-4h1m-1 4h1m-5-4h1m-1 4h1" />
  </svg>
);
const CogIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const ArchiveBoxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);
const BellIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);
const GlobeAltIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0112 13.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 003 12c0 .778.099 1.533.284 2.253m0 0c1.393 2.129 3.65 3.541 6.16 3.931" />
  </svg>
);

// --- Navigation Components ---

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isDashboard?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isDashboard = false }) => {
  const baseClasses = "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2";
  const activeClasses = "bg-indigo-50 text-indigo-600 font-medium";

  return (
    <NavLink
      to={to}
      end={isDashboard}
      className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : ""}`}
    >
      {icon}
      {label}
    </NavLink>
  );
};

interface CollapsibleNavSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const CollapsibleNavSection: React.FC<CollapsibleNavSectionProps> = ({ title, icon, children }) => {
  const location = useLocation();

  const isChildActive = useMemo(() => {
    let isActive = false;
    React.Children.forEach(children, (child) => {
      // FIX: Add a type assertion to safely access the 'to' property on child props,
      // as TypeScript cannot infer the type of props on children passed via React.Children.
      if (React.isValidElement(child)) {
        const props = child.props as { to?: string };
        if (props.to && location.pathname.startsWith(props.to)) {
          isActive = true;
        }
      }
    });
    return isActive;
  }, [children, location.pathname]);

  const [isOpen, setIsOpen] = useState(isChildActive);
  
  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [isChildActive]);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pl-4 pt-1 mt-1 border-l border-gray-200 ml-5">
          <nav className="flex flex-col gap-1">
            {children}
          </nav>
        </div>
      )}
    </div>
  );
};

// --- Main Sidebar Component ---

const Sidebar: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const { user } = useAuth();

  const hasAnyScope = (requiredScopes: string[]): boolean => {
      if (!user) return false;
      return requiredScopes.some(scope => user.scopes.includes(scope));
  };
  
  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 p-4 flex flex-col">
      <nav className="flex flex-col gap-2 text-sm font-normal">
        {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}`} icon={<HomeIcon className="h-4 w-4" />} label="Dashboard" isDashboard />}

        {hasAnyScope(['school:admin']) && (
            <CollapsibleNavSection title="SIS" icon={<UsersIcon className="h-4 w-4" />}>
                <NavItem to={`/school/${siteId}/students`} icon={<UsersIcon className="h-4 w-4" />} label="Students" />
                <NavItem to={`/school/${siteId}/attendance`} icon={<ClipboardIcon className="h-4 w-4" />} label="Daily Entry" />
                <NavItem to={`/school/${siteId}/attendance/records`} icon={<TableIcon className="h-4 w-4" />} label="Records" />
                <NavItem to={`/school/${siteId}/attendance/exports`} icon={<DownloadIcon className="h-4 w-4" />} label="Exports" />
            </CollapsibleNavSection>
        )}
        
        {hasAnyScope(['school:admin', 'homework:teacher']) && (
            <CollapsibleNavSection title="Academics" icon={<BookIcon className="h-4 w-4" />}>
                 {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/academics`} icon={<BookIcon className="h-4 w-4" />} label="Overview" />}
                 {hasAnyScope(['homework:teacher']) && <NavItem to={`/school/${siteId}/homework`} icon={<ClipboardIcon className="h-4 w-4" />} label="Homework" />}
                 {hasAnyScope(['homework:teacher']) && <NavItem to={`/school/${siteId}/homework/reports`} icon={<DownloadIcon className="h-4 w-4" />} label="Reports" />}
                 {hasAnyScope(['homework:teacher']) && <NavItem to={`/school/${siteId}/homework/notifications`} icon={<BellIcon className="h-4 w-4" />} label="Notifications" />}
                 {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/academics/planner`} icon={<CalendarIcon className="h-4 w-4" />} label="Planner" />}
                 {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/academics/timetable/class`} icon={<TableIcon className="h-4 w-4" />} label="Class Timetables" />}
                 {hasAnyScope(['school:admin']) && <NavItem to={`/school/${siteId}/academics/timetable/teacher`} icon={<TableIcon className="h-4 w-4" />} label="Teacher Timetables" />}
            </CollapsibleNavSection>
        )}
        
        {hasAnyScope(['admissions:admin']) && (
            <CollapsibleNavSection title="Admissions" icon={<FolderAddIcon className="h-4 w-4" />}>
                <NavItem to={`/school/${siteId}/admissions`} icon={<HomeIcon className="h-4 w-4" />} label="Dashboard" />
                <NavItem to={`/school/${siteId}/admissions/applications`} icon={<UsersIcon className="h-4 w-4" />} label="Applications" />
                <NavItem to={`/school/${siteId}/admissions/seats`} icon={<TableIcon className="h-4 w-4" />} label="Seat Allocation" />
                <NavItem to={`/school/${siteId}/admissions/import`} icon={<UploadIcon className="h-4 w-4" />} label="Bulk Import" />
                <NavItem to={`/school/${siteId}/admissions/comms`} icon={<MailIcon className="h-4 w-4" />} label="Parent Comms" />
                <NavItem to={`/school/${siteId}/admissions/reports`} icon={<DownloadIcon className="h-4 w-4" />} label="Reports" />
                <NavItem to={`/school/${siteId}/admissions/online`} icon={<ClipboardIcon className="h-4 w-4" />} label="Online Admissions" />
                <NavItem to={`/school/${siteId}/admissions/offers`} icon={<CheckCircleIcon className="h-4 w-4" />} label="Offers" />
            </CollapsibleNavSection>
        )}

        {hasAnyScope(['frontoffice:admin']) && (
            <CollapsibleNavSection title="Front Office" icon={<IdentificationIcon className="h-4 w-4" />}>
                <NavItem to={`/school/${siteId}/frontoffice`} icon={<HomeIcon className="h-4 w-4" />} label="Dashboard" isDashboard/>
                <NavItem to={`/school/${siteId}/frontoffice/enquiries`} icon={<ClipboardIcon className="h-4 w-4" />} label="Enquiries" />
                <NavItem to={`/school/${siteId}/frontoffice/visitors`} icon={<IdentificationIcon className="h-4 w-4" />} label="Visitor Book" />
                <NavItem to={`/school/${siteId}/frontoffice/calls`} icon={<PhoneIcon className="h-4 w-4" />} label="Call Log" />
                <NavItem to={`/school/${siteId}/frontoffice/postal`} icon={<MailIcon className="h-4 w-4" />} label="Postal Log" />
            </CollapsibleNavSection>
        )}

        {hasAnyScope(['school:admin']) && (
            <CollapsibleNavSection title="Fees" icon={<CreditCardIcon className="h-4 w-4" />}>
                <NavItem to={`/school/${siteId}/fees`} icon={<CreditCardIcon className="h-4 w-4" />} label="Structures" />
                <NavItem to={`/school/${siteId}/fees/payments`} icon={<ReceiptIcon className="h-4 w-4" />} label="Payments" />
            </CollapsibleNavSection>
        )}
        
        {hasAnyScope(['sis:library:write']) && (
            <CollapsibleNavSection title="Physical Library" icon={<BookIcon className="h-4 w-4" />}>
                <NavItem to={`/school/${siteId}/library/catalog`} icon={<BookIcon className="h-4 w-4" />} label="Catalog" />
                <NavItem to={`/school/${siteId}/library/members`} icon={<UsersIcon className="h-4 w-4" />} label="Members" />
                <NavItem to={`/school/${siteId}/library/issue-return`} icon={<ClipboardIcon className="h-4 w-4" />} label="Circulation" />
                <NavItem to={`/school/${siteId}/library/reports`} icon={<DownloadIcon className="h-4 w-4" />} label="Reports & Notices" />
                <NavItem to={`/school/${siteId}/library/settings`} icon={<CogIcon className="h-4 w-4" />} label="Settings" />
            </CollapsibleNavSection>
        )}
        
        {hasAnyScope(['sis:hostel:write']) && (
            <CollapsibleNavSection title="Hostel" icon={<OfficeBuildingIcon className="h-4 w-4" />}>
                <NavItem to={`/school/${siteId}/hostel`} icon={<HomeIcon className="h-4 w-4" />} label="Dashboard" isDashboard/>
                <NavItem to={`/school/${siteId}/hostel/structure`} icon={<TableIcon className="h-4 w-4" />} label="Structure" />
                <NavItem to={`/school/${siteId}/hostel/allocations`} icon={<UsersIcon className="h-4 w-4" />} label="Allocations" />
                <NavItem to={`/school/${siteId}/hostel/visitors`} icon={<IdentificationIcon className="h-4 w-4" />} label="Visitors" />
                <NavItem to={`/school/${siteId}/hostel/curfew`} icon={<ClockIcon className="h-4 w-4" />} label="Curfew" />
                <NavItem to={`/school/${siteId}/hostel/settings`} icon={<CogIcon className="h-4 w-4" />} label="Settings" />
            </CollapsibleNavSection>
        )}

        {hasAnyScope(['school:admin']) && (
            <CollapsibleNavSection title="Inventory" icon={<ArchiveBoxIcon className="h-4 w-4" />}>
                <NavItem to={`/school/${siteId}/inventory/items`} icon={<ArchiveBoxIcon className="h-4 w-4" />} label="Items" />
                <NavItem to={`/school/${siteId}/inventory/stock`} icon={<ClipboardIcon className="h-4 w-4" />} label="Stock" />
                <NavItem to={`/school/${siteId}/inventory/requests`} icon={<ClipboardIcon className="h-4 w-4" />} label="Requests" />
                <NavItem to={`/school/${siteId}/inventory/suppliers`} icon={<UsersIcon className="h-4 w-4" />} label="Suppliers" />
                <NavItem to={`/school/${siteId}/inventory/assets`} icon={<IdentificationIcon className="h-4 w-4" />} label="Assets" />
            </CollapsibleNavSection>
        )}
        
        {hasAnyScope(['school:admin']) && (
            <CollapsibleNavSection title="Transport" icon={<BusIcon className="h-4 w-4" />}>
                <NavItem to={`/school/${siteId}/transport/vehicles`} icon={<BusIcon className="h-4 w-4" />} label="Vehicles" />
                <NavItem to={`/school/${siteId}/transport/trips`} icon={<ClipboardIcon className="h-4 w-4" />} label="Trips" />
                <NavItem to={`/school/${siteId}/transport/boarding`} icon={<UsersIcon className="h-4 w-4" />} label="Boarding" />
            </CollapsibleNavSection>
        )}

        {hasAnyScope(['lms:admin', 'school:admin', 'student', 'homework:student', 'homework:parent']) && (
             <CollapsibleNavSection title="LMS" icon={<LibraryIcon className="h-4 w-4" />}>
                {hasAnyScope(['lms:admin']) && <NavItem to={`/school/${siteId}/courses`} icon={<LibraryIcon className="h-4 w-4" />} label="Courses" />}
                {hasAnyScope(['school:admin', 'lms:admin', 'student']) && <NavItem to={`/school/${siteId}/library`} icon={<FilmIcon className="h-4 w-4" />} label="Digital Library" />}
                {hasAnyScope(['school:admin', 'student']) && <NavItem to={`/school/${siteId}/library/catchup`} icon={<ClockIcon className="h-4 w-4" />} label="Catch-Up Classes" />}
                {hasAnyScope(['homework:student']) && <NavItem to={`/school/${siteId}/student/homework`} icon={<ClipboardIcon className="h-4 w-4" />} label="My Homework" />}
                {hasAnyScope(['homework:student']) && <NavItem to={`/school/${siteId}/student/hostel`} icon={<OfficeBuildingIcon className="h-4 w-4" />} label="My Hostel" />}
                {hasAnyScope(['homework:parent']) && <NavItem to={`/portal/${siteId}/parent/student/${user?.studentId || 's01'}/homework`} icon={<UsersIcon className="h-4 w-4" />} label="Parent Portal" />}
             </CollapsibleNavSection>
        )}

        {hasAnyScope(['cms:admin', 'cms:edit']) && (
             <CollapsibleNavSection title="Website CMS" icon={<GlobeAltIcon className="h-4 w-4" />}>
                <NavItem to={`/school/${siteId}/cms/pages`} icon={<ClipboardIcon className="h-4 w-4" />} label="Pages" />
                <NavItem to={`/school/${siteId}/cms/menus`} icon={<TableIcon className="h-4 w-4" />} label="Menus" />
                <NavItem to={`/school/${siteId}/cms/news`} icon={<BookIcon className="h-4 w-4" />} label="News & Events" />
                <NavItem to={`/school/${siteId}/cms/media`} icon={<FilmIcon className="h-4 w-4" />} label="Media Library" />
                <NavItem to={`/school/${siteId}/cms/settings`} icon={<CogIcon className="h-4 w-4" />} label="Settings" />
             </CollapsibleNavSection>
        )}
      
        {hasAnyScope(['certificates:admin', 'certificates:issue']) && (
             <CollapsibleNavSection title="Certificates & IDs" icon={<IdentificationIcon className="h-4 w-4" />}>
                <NavItem to={`/school/${siteId}/certificates/issues`} icon={<ClipboardIcon className="h-4 w-4" />} label="Manage Issues" />
                <NavItem to={`/school/${siteId}/certificates/issue`} icon={<DownloadIcon className="h-4 w-4" />} label="Batch Issuance" />
                <NavItem to={`/school/${siteId}/certificates/templates`} icon={<BookIcon className="h-4 w-4" />} label="Templates" />
             </CollapsibleNavSection>
        )}

        {hasAnyScope(['school:admin']) && (
            <CollapsibleNavSection title="Admin" icon={<ShieldIcon className="h-4 w-4" />}>
                <NavItem to={`/school/${siteId}/admin/audit`} icon={<ShieldIcon className="h-4 w-4" />} label="Audit Trail" />
                <NavItem to={`/school/${siteId}/admin/activity`} icon={<UsersIcon className="h-4 w-4" />} label="User Activity" />
            </CollapsibleNavSection>
        )}
      
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