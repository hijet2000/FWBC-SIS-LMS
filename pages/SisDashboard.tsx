import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../contexts/ToastContext';
import KpiCard from '../components/dashboard/KpiCard';

// Services
import { getStudentsCount } from '../lib/schoolService';
import { getTodaysAttendanceSummary } from '../lib/attendanceService';
import { listCourses } from '../lib/lmsService';
import { getUpcomingExamsCount } from '../lib/academicsService';

// Icons
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m9 5.197a6 6 0 006-5.197M15 21a6 6 0 00-9-5.197" /></svg>
);
const CheckBadgeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);
const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" />
    </svg>
);


const SisDashboard: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  
  const [kpiData, setKpiData] = useState({
      students: 0,
      attendance: 0,
      courses: 0,
      exams: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        setLoading(true);
        const [studentCount, attendanceSummary, coursesData, examsCount] = await Promise.all([
          getStudentsCount(),
          getTodaysAttendanceSummary(),
          listCourses(),
          getUpcomingExamsCount(),
        ]);

        setKpiData({
            students: studentCount,
            attendance: attendanceSummary.presentRate,
            courses: coursesData.filter(c => c.status === 'Open').length,
            exams: examsCount,
        });

      } catch (e) {
        console.error("Failed to load dashboard KPIs", e);
        addToast("Could not load dashboard data.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchKpis();
  }, [addToast]);


  if (authLoading) {
    return <div className="text-center p-8 text-gray-500">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Administrator Dashboard</h1>
        {user && <p className="mt-1 text-sm text-gray-500">Welcome back, {user.name}.</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Total Students"
            value={kpiData.students}
            icon={<UsersIcon className="h-6 w-6" />}
            linkTo={`/school/${siteId}/students`}
            loading={loading}
            className="text-gray-800"
          />
          <KpiCard
            title="Today's Attendance"
            value={`${kpiData.attendance.toFixed(1)}%`}
            icon={<CheckBadgeIcon className="h-6 w-6" />}
            linkTo={`/school/${siteId}/attendance/exports`}
            loading={loading}
            className="text-green-600"
          />
          <KpiCard
            title="Active Courses"
            value={kpiData.courses}
            icon={<BookOpenIcon className="h-6 w-6" />}
            linkTo={`/school/${siteId}/courses`}
            loading={loading}
            className="text-gray-800"
          />
          <KpiCard
            title="Upcoming Exams (14d)"
            value={kpiData.exams}
            icon={<CalendarDaysIcon className="h-6 w-6" />}
            linkTo={`/school/${siteId}/academics/reports`} // No exams page yet, link to reports
            loading={loading}
            className="text-amber-600"
          />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Your Details</h2>
        {user ? (
          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-gray-500 w-32 inline-block">Signed-in as:</span> {user.name}</p>
            <p><span className="font-medium text-gray-500 w-32 inline-block">Role:</span> {user.role}</p>
            <div>
              <p className="font-medium text-gray-500 w-32">Assigned Scopes:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.scopes.map(scope => (
                  <span key={scope} className="px-3 py-1 text-xs font-mono bg-blue-100 text-blue-800 rounded-full">
                    {scope}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No user information available.</p>
        )}
      </div>
    </div>
  );
};

export default SisDashboard;
