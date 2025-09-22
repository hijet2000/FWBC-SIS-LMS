import React from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';

const breadcrumbNameMap: { [key: string]: string } = {
  'students': 'Students',
  'academics': 'Academics',
  'homework': 'Homework',
  'admissions': 'Admissions',
  'applications': 'Applications',
  'seats': 'Seat Allocation',
  'import': 'Bulk Import',
  'comms': 'Parent Comms',
  'reports': 'Reports',
  'online': 'Online Admissions',
  'offers': 'Offers',
  'frontoffice': 'Front Office',
  'visitors': 'Visitor Book',
  'enquiries': 'Enquiries',
  'calls': 'Call Log',
  'postal': 'Postal Log',
  'attendance': 'Attendance',
  'records': 'Records',
  'exports': 'Exports',
  'courses': 'Courses',
  'library': 'Library',
  'digital': 'Digital Library',
  'catalog': 'Catalog',
  'catchup': 'Catch-Up Classes',
  'fees': 'Fees',
  'payments': 'Payments',
  'hostel': 'Hostel',
  'structure': 'Structure',
  'transport': 'Transport',
  'vehicles': 'Vehicles',
  'trips': 'Trips',
  'boarding': 'Boarding',
  'admin': 'Admin',
  'audit': 'Audit Trail',
  'activity': 'User Activity',
  'planner': 'Planner',
  'timetable': 'Timetabling',
  'class': 'Class Timetables',
  'teacher': 'Teacher Timetables',
  'view': 'View',
  'student': 'Student View'
};

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
);


const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const { siteId } = useParams();

  // Exclude base path segments
  const pathnames = location.pathname.split('/').filter(x => x && x !== 'school' && x !== siteId);

  // Don't render on the dashboard itself
  if (pathnames.length === 0) {
    return null;
  }
  
  const breadcrumbs = pathnames.map((value, index) => {
    const to = `/school/${siteId}/${pathnames.slice(0, index + 1).join('/')}`;
    const isLast = index === pathnames.length - 1;
    let name = breadcrumbNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);
    
    // Generic name for dynamic IDs. This avoids complex data fetching in the breadcrumb.
    // The page's H1 tag will provide the specific entity name.
    if (value.startsWith('s-') || value.startsWith('app-') || value.startsWith('hw-') || value.startsWith('enq-') || value.startsWith('post-') || value.startsWith('cu-') || value.startsWith('contentId=')) {
        name = "Detail";
    }

    return { name, to, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200 flex-shrink-0">
      <ol className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 flex items-center space-x-2 py-3 text-sm">
        <li>
          <Link to={`/school/${siteId}`} className="text-gray-400 hover:text-gray-600">
            <HomeIcon className="h-4 w-4 flex-shrink-0" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>
        {breadcrumbs.map((crumb) => (
          <li key={crumb.to}>
            <div className="flex items-center">
              <ChevronRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Link
                to={crumb.to}
                className={`ml-2 font-medium ${crumb.isLast ? 'text-gray-700 pointer-events-none' : 'text-gray-500 hover:text-gray-700'}`}
                aria-current={crumb.isLast ? 'page' : undefined}
              >
                {crumb.name}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
