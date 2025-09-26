import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

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
const VideoCameraIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);
const AcademicCapIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
    </svg>
);
const CurrencyPoundIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9a2 2 0 10-4 0v5a2 2 0 01-2 2h6m-6-4h4m8 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const CogIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944a11.955 11.955 0 009 2.056c3.238.16 6.257-1.08 8.618-3.04A12.02 12.02 0 0021 9.056a11.955 11.955 0 00-3.382-3.04z" />
  </svg>
);
const TruckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16h2a2 2 0 002-2v-4a2 2 0 00-2-2h-2v10z" />
    </svg>
);
const OfficeBuildingIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);
const ArchiveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
);
const IdentificationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6" />
  </svg>
);
const DocumentTextIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.293l.536.536M16.293 4.293l-.536.536M12 21a9 9 0 100-18 9 9 0 000 18z" />
    </svg>
);
const UserGroupIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);
const CollectionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);
const BriefcaseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);
const SwitchHorizontalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
);
const ChartBarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);
const DocumentDuplicateIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const BeakerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5v.75m0 0l-4.5 4.5M19 14.5l-4.5-4.5m0 0v.75m0 0l-4.5 4.5M4.5 20.25h15A2.25 2.25 0 0021.75 18v-2.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125V18a2.25 2.25 0 002.25 2.25z" />
    </svg>
);
const ClipboardListIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 4h.01M12 12h.01M12 16h.01M9 16H9.01" />
    </svg>
);
const ArrowCircleRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const ViewGridIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6A2.25 2.25 0 0115.75 3.75h2.25A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75A2.25 2.25 0 0115.75 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
);

// --- Navigation Item Component ---
interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  scopes?: string[];
  exact?: boolean;
}
const NavItem: React.FC<NavItemProps> = ({ to, icon, text, scopes }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  const hasAccess = scopes ? scopes.some(scope => user?.scopes.includes(scope)) : true;
  if (!hasAccess) return null;

  return (
    <NavLink
      to={to}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-200 transition-all hover:bg-gray-700/50 hover:text-white ${isActive ? 'bg-gray-700 text-white' : ''}`}
    >
      {icon}
      {text}
    </NavLink>
  );
};

// --- Section Component ---
interface SectionProps {
  title: string;
  children: React.ReactNode;
  scopes: string[];
}
const Section: React.FC<SectionProps> = ({ title, children, scopes }) => {
    const { user } = useAuth();
    const hasAccess = scopes.some(scope => user?.scopes.includes(scope));
    if (!hasAccess) return null;

    return (
        <div>
            <span className="px-3 text-xs font-semibold text-gray-400 uppercase">{title}</span>
            <nav className="mt-2 flex flex-col gap-1">{children}</nav>
        </div>
    );
};

// --- Main Sidebar Component ---
const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const { siteId: routeSiteId } = useParams<{ siteId: string }>();
  const siteId = routeSiteId || 'fwbc';

  const isSectionVisible = useMemo(() => (sectionName: keyof typeof settings.modules) => {
    if (settingsLoading || !settings) return true; // Show all if settings are loading
    return settings.modules[sectionName]?.enabled || false;
  }, [settings, settingsLoading]);

  const hasAnyScope = (scopes: string[]) => scopes.some(scope => user?.scopes.includes(scope));
  
  if (!user) return null;

  return (
    <aside className="hidden md:flex flex-col w-64 flex-shrink-0 border-r border-gray-700 bg-gray-800 p-4">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-y-6">
          <nav className="flex flex-col gap-1">
            <NavItem to={`/school/${siteId}`} icon={<HomeIcon className="h-5 w-5" />} text="Dashboard" />
            <NavItem to={`/school/${siteId}/tasks`} icon={<ClipboardListIcon className="h-5 w-5" />} text="My Tasks" />
          </nav>
          
          {isSectionVisible('sis') && (
            <Section title="Student Information" scopes={['school:admin']}>
              <NavItem to={`/school/${siteId}/students`} icon={<UsersIcon className="h-5 w-5" />} text="Students" />
              <NavItem to={`/school/${siteId}/attendance`} icon={<CheckCircleIcon className="h-5 w-5" />} text="Attendance" />
              <NavItem to={`/school/${siteId}/academics`} icon={<AcademicCapIcon className="h-5 w-5" />} text="Academics" />
               {/* Student-facing Links moved here */}
               {hasAnyScope(['homework:student']) && <NavItem to={`/school/${siteId}/student/live-classes`} icon={<VideoCameraIcon className="h-5 w-5" />} text="My Live Classes" />}
               {hasAnyScope(['homework:student']) && <NavItem to={`/school/${siteId}/student/online-exams`} icon={<DocumentTextIcon className="h-5 w-5" />} text="My Online Exams" />}
            </Section>
          )}

          {isSectionVisible('lms') && (
            <Section title="LMS" scopes={['homework:teacher', 'homework:student']}>
                {hasAnyScope(['homework:teacher']) && <NavItem to={`/school/${siteId}/homework`} icon={<BookOpenIcon className="h-5 w-5" />} text="Homework" />}
                {hasAnyScope(['homework:teacher']) && <NavItem to={`/school/${siteId}/online-exams`} icon={<DocumentTextIcon className="h-5 w-5" />} text="Online Exams" />}
                {hasAnyScope(['homework:teacher']) && <NavItem to={`/school/${siteId}/question-bank`} icon={<CollectionIcon className="h-5 w-5" />} text="Question Bank" />}
                {hasAnyScope(['homework:student']) && <NavItem to={`/school/${siteId}/student/homework`} icon={<AcademicCapIcon className="h-5 w-5" />} text="My Homework" />}
            </Section>
          )}

          {isSectionVisible('library') && (
            <Section title="Library" scopes={['sis:library:write', 'lms:admin', 'student']}>
              <NavItem to={`/school/${siteId}/library`} icon={<ViewGridIcon className="h-5 w-5" />} text="Digital Library" />
              <NavItem to={`/school/${siteId}/library/catchup`} icon={<FilmIcon className="h-5 w-5" />} text="Catch-up Classes" />
               <div className="pt-2 mt-2 border-t border-gray-700/50">
                    <span className="px-3 text-xs font-semibold text-gray-400 uppercase">Physical Library</span>
               </div>
              <NavItem to={`/school/${siteId}/library/catalog`} icon={<BookOpenIcon className="h-5 w-5" />} text="Catalog" scopes={['sis:library:write']} />
              <NavItem to={`/school/${siteId}/library/members`} icon={<UsersIcon className="h-5 w-5" />} text="Members" scopes={['sis:library:write']} />
              <NavItem to={`/school/${siteId}/library/issue-return`} icon={<SwitchHorizontalIcon className="h-5 w-5" />} text="Issue / Return" scopes={['sis:library:write']} />
              <NavItem to={`/school/${siteId}/library/settings`} icon={<CogIcon className="h-5 w-5" />} text="Settings" scopes={['sis:library:write']} />
              <NavItem to={`/school/${siteId}/library/reports`} icon={<ChartBarIcon className="h-5 w-5" />} text="Reports" scopes={['sis:library:write']} />
            </Section>
          )}

          {isSectionVisible('admissions') && (
            <Section title="Admissions" scopes={['admissions:admin']}>
              <NavItem to={`/school/${siteId}/admissions`} icon={<ArrowCircleRightIcon className="h-5 w-5" />} text="Dashboard" />
              <NavItem to={`/school/${siteId}/admissions/applications`} icon={<DocumentDuplicateIcon className="h-5 w-5" />} text="Applications" />
            </Section>
          )}

          {isSectionVisible('frontoffice') && (
            <Section title="Front Office" scopes={['frontoffice:admin']}>
              <NavItem to={`/school/${siteId}/frontoffice`} icon={<OfficeBuildingIcon className="h-5 w-5" />} text="Dashboard" />
              <NavItem to={`/school/${siteId}/frontoffice/enquiries`} icon={<ClipboardIcon className="h-5 w-5" />} text="Enquiries" />
              <NavItem to={`/school/${siteId}/frontoffice/visitors`} icon={<IdentificationIcon className="h-5 w-5" />} text="Visitors" />
            </Section>
          )}
          
          <div className="pt-4 border-t border-gray-700/50 space-y-6">
            {isSectionVisible('fees') && <Section title="Business" scopes={['school:admin', 'finance:admin']}>
              <NavItem to={`/school/${siteId}/fees`} icon={<CurrencyPoundIcon className="h-5 w-5" />} text="Fees" scopes={['school:admin']} />
              <NavItem to={`/school/${siteId}/finance`} icon={<ChartBarIcon className="h-5 w-5" />} text="Finance" scopes={['finance:admin']} />
            </Section>}

            {isSectionVisible('transport') && <Section title="Operations" scopes={['school:admin', 'inventory:admin', 'sis:hostel:write']}>
              <NavItem to={`/school/${siteId}/transport`} icon={<TruckIcon className="h-5 w-5" />} text="Transport" scopes={['school:admin']} />
              <NavItem to={`/school/${siteId}/hostel`} icon={<OfficeBuildingIcon className="h-5 w-5" />} text="Hostel" scopes={['sis:hostel:write']} />
              {hasAnyScope(['homework:student']) && <NavItem to={`/school/${siteId}/student/hostel`} icon={<OfficeBuildingIcon className="h-5 w-5" />} text="My Hostel" />}
              <NavItem to={`/school/${siteId}/inventory`} icon={<ArchiveIcon className="h-5 w-5" />} text="Inventory" scopes={['inventory:admin']} />
            </Section>}

             {isSectionVisible('hr') && <Section title="Human Resources" scopes={['hr:admin', 'payroll:admin']}>
              <NavItem to={`/school/${siteId}/hr`} icon={<BriefcaseIcon className="h-5 w-5" />} text="HR Dashboard" scopes={['hr:admin']} />
              <NavItem to={`/school/${siteId}/hr/payroll`} icon={<CurrencyPoundIcon className="h-5 w-5" />} text="Payroll" scopes={['payroll:admin']} />
            </Section>}
          </div>

          <div className="pt-4 border-t border-gray-700/50 space-y-6">
            {isSectionVisible('cms') && <Section title="Website" scopes={['cms:admin']}>
               <NavItem to={`/school/${siteId}/cms`} icon={<GlobeIcon className="h-5 w-5" />} text="CMS" />
            </Section>}

            {hasAnyScope(['homework:parent', 'alumni:portal:self']) && (
                <Section title="Portals" scopes={['homework:parent', 'alumni:portal:self']}>
                    {user?.studentId && <NavItem to={`/portal/${siteId}/parent/student/${user.studentId}`} icon={<UsersIcon className="h-5 w-5" />} text="Parent Portal" />}
                    {user?.alumniId && <NavItem to={`/portal/${siteId}/alumni/${user.alumniId}`} icon={<UserGroupIcon className="h-5 w-5" />} text="Alumni Portal" />}
                </Section>
            )}

            <Section title="System" scopes={['school:admin']}>
              <NavItem to={`/school/${siteId}/admin/audit`} icon={<ShieldCheckIcon className="h-5 w-5" />} text="Audit Trail" />
              <NavItem to={`/school/${siteId}/admin/settings`} icon={<CogIcon className="h-5 w-5" />} text="System Settings" />
            </Section>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;