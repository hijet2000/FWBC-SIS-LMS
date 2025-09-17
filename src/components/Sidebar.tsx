
import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface NavItemProps {
  to: string;
  children: React.ReactNode;
  end?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, children, end = false }) => {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ${
          isActive ? 'bg-gray-100 text-gray-900' : ''
        }`
      }
    >
      {children}
    </NavLink>
  );
};

const Sidebar: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const { user } = useAuth();
  const hasScope = (scope: string) => user?.scopes.includes(scope);

  const isAdmin = hasScope('school:admin');
  const isAdmissions = hasScope('admissions:admin');
  const isFrontOffice = hasScope('frontoffice:admin');
  const isTeacher = hasScope('homework:teacher');
  const isStudent = hasScope('student');

  return (
    <aside className="hidden md:block w-64 bg-white border-r border-gray-200 p-4">
      <nav className="grid items-start text-sm font-medium space-y-2">
        <NavItem to={`/school/${siteId}/dashboard`} end>Dashboard</NavItem>
        
        {(isAdmin || isAdmissions || isFrontOffice) && (
          <div>
            <h3 className="px-3 text-xs font-semibold uppercase text-gray-400">Admissions</h3>
            <div className="mt-1 space-y-1">
              {isAdmissions && <NavItem to={`/school/${siteId}/admissions`}>Dashboard</NavItem>}
              {isFrontOffice && <NavItem to={`/school/${siteId}/frontoffice/enquiries`}>Enquiries</NavItem>}
              {isAdmissions && <NavItem to={`/school/${siteId}/admissions/applications`}>Applications</NavItem>}
              {isAdmissions && <NavItem to={`/school/${siteId}/admissions/seats`}>Seat Allocation</NavItem>}
            </div>
          </div>
        )}
        
        {(isAdmin || isFrontOffice) && (
           <div>
            <h3 className="px-3 text-xs font-semibold uppercase text-gray-400">Front Office</h3>
            <div className="mt-1 space-y-1">
              <NavItem to={`/school/${siteId}/frontoffice/visitors`}>Visitors</NavItem>
              <NavItem to={`/school/${siteId}/frontoffice/calls`}>Call Log</NavItem>
              <NavItem to={`/school/${siteId}/frontoffice/postal`}>Postal</NavItem>
            </div>
          </div>
        )}

        {isAdmin && (
          <div>
            <h3 className="px-3 text-xs font-semibold uppercase text-gray-400">Academics</h3>
             <div className="mt-1 space-y-1">
                <NavItem to={`/school/${siteId}/academics`}>Mappings</NavItem>
                <NavItem to={`/school/${siteId}/academics/planner`}>Planner</NavItem>
             </div>
          </div>
        )}

        {(isAdmin || isTeacher) && (
            <div>
                 <h3 className="px-3 text-xs font-semibold uppercase text-gray-400">SIS</h3>
                 <div className="mt-1 space-y-1">
                    <NavItem to={`/school/${siteId}/students`}>Students</NavItem>
                    <NavItem to={`/school/${siteId}/attendance`}>Attendance</NavItem>
                    <NavItem to={`/school/${siteId}/fees`}>Fees</NavItem>
                 </div>
            </div>
        )}
        
        {(isAdmin || isTeacher) && (
             <div>
                 <h3 className="px-3 text-xs font-semibold uppercase text-gray-400">Homework</h3>
                 <div className="mt-1 space-y-1">
                    <NavItem to={`/school/${siteId}/homework`}>Assignments</NavItem>
                    <NavItem to={`/school/${siteId}/homework/reports`}>Reports</NavItem>
                 </div>
            </div>
        )}
        
         {isStudent && (
             <div>
                 <h3 className="px-3 text-xs font-semibold uppercase text-gray-400">My Portal</h3>
                 <div className="mt-1 space-y-1">
                    <NavItem to={`/school/${siteId}/student/homework`}>Homework</NavItem>
                 </div>
            </div>
        )}
        
        {isAdmin && (
             <div>
                 <h3 className="px-3 text-xs font-semibold uppercase text-gray-400">Admin</h3>
                 <div className="mt-1 space-y-1">
                    <NavItem to={`/school/${siteId}/admin/audit-trail`}>Audit Trail</NavItem>
                    <NavItem to={`/school/${siteId}/admin/user-activity`}>User Activity</NavItem>
                    <NavItem to={`/school/${siteId}/admin/roles`}>Roles & Permissions</NavItem>
                 </div>
            </div>
        )}

      </nav>
    </aside>
  );
};

export default Sidebar;
