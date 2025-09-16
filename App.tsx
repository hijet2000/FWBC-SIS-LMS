// FIX: Removed invalid CDATA wrapper.
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import Spinner from './components/ui/Spinner';
import Layout from './components/Layout';
import SisDashboard from './pages/SisDashboard';
import PlaceholderPage from './pages/PlaceholderPage';
import StudentsPage from './pages/StudentsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import AttendancePage from './pages/AttendancePage';
import AcademicsPage from './pages/AcademicsPage';
import LibraryPage from './pages/LibraryPage';
import LibraryViewerPage from './pages/LibraryViewerPage';
import AttendanceRecordsPage from './pages/AttendanceRecordsPage';
import AttendanceExportsPage from './pages/AttendanceExportsPage';
import FeesPage from './pages/FeesPage';
import FeesPaymentsPage from './pages/FeesPaymentsPage';

// Academics Pages
import ClassTimetablePage from './pages/academics/ClassTimetablePage';
import TeacherTimetablePage from './pages/academics/TeacherTimetablePage';
import PlannerPage from './pages/academics/PlannerPage';

// Homework Pages
import HomeworkListPage from './pages/homework/HomeworkListPage';
import HomeworkSubmissionsPage from './pages/homework/HomeworkSubmissionsPage';
import StudentHomeworkListPage from './pages/student/HomeworkListPage';
import StudentHomeworkDetailPage from './pages/student/HomeworkDetailPage';


// Admissions Pages
import AdmissionsDashboard from './pages/admissions/AdmissionsDashboard';
import ApplicationsPage from './pages/admissions/ApplicationsPage';
import ApplicationDetailPage from './pages/admissions/ApplicationDetailPage';
import SeatAllocationPage from './pages/admissions/SeatAllocationPage';
import BulkImportPage from './pages/admissions/BulkImportPage';
import AdmissionsReportsPage from './pages/admissions/AdmissionsReportsPage';
import OnlineAdmissionsPage from './pages/admissions/OnlineAdmissionsPage';
import OffersPage from './pages/admissions/OffersPage';
import CommsPage from './pages/admissions/CommsPage';

// Front Office Page
import VisitorsPage from './pages/frontoffice/VisitorsPage';
import EnquiriesPage from './pages/frontoffice/EnquiriesPage';
import EnquiryDetailPage from './pages/frontoffice/EnquiryDetailPage';
import CallLogPage from './pages/frontoffice/CallLogPage';
import PostalPage from './pages/frontoffice/PostalPage';
import PostalDetailPage from './pages/frontoffice/PostalDetailPage';


// Transport Pages
import VehiclesPage from './pages/transport/VehiclesPage';
import TripsPage from './pages/transport/TripsPage';
import BoardingPage from './pages/transport/BoardingPage';

// Catch-up Pages
import CatchUpListPage from './pages/library/CatchUpListPage';
import CatchUpViewerPage from './pages/library/CatchUpViewerPage';

// Admin Pages
import AuditTrailPage from './pages/admin/AuditTrailPage';
import UserActivityPage from './pages/admin/UserActivityPage';

// Public Pages
import ApplyPage from './pages/public/ApplyPage';
import StatusPage from './pages/public/StatusPage';

import RequireScope from './components/auth/RequireScope';


function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <ErrorBoundary>
            <React.Suspense fallback={<Spinner />}>
              <Routes>
                <Route path="/" element={<Navigate to="/school/site_123" replace />} />
                
                {/* Public Routes */}
                <Route path="/apply/:siteId" element={<ApplyPage />} />
                <Route path="/apply/:siteId/status" element={<StatusPage />} />


                {/* Staff Routes */}
                <Route path="/school/:siteId" element={<Layout />}>
                  <Route index element={<SisDashboard />} />
                  <Route path="students" element={<RequireScope requiredScopes={['school:admin']}><StudentsPage /></RequireScope>} />
                  <Route path="students/:studentId" element={<RequireScope requiredScopes={['school:admin']}><StudentProfilePage /></RequireScope>} />
                  
                  <Route path="academics" element={<RequireScope requiredScopes={['school:admin']}><AcademicsPage /></RequireScope>} />
                  <Route path="academics/subjects" element={<RequireScope requiredScopes={['school:admin']}><PlaceholderPage title="Manage Subjects" /></RequireScope>} />
                  <Route path="academics/gradebooks" element={<RequireScope requiredScopes={['school:admin']}><PlaceholderPage title="Gradebooks" /></RequireScope>} />
                  <Route path="academics/reports" element={<RequireScope requiredScopes={['school:admin']}><PlaceholderPage title="Report Cards" /></RequireScope>} />
                  
                  {/* Timetabling Sub-module */}
                  <Route path="academics/planner" element={<RequireScope requiredScopes={['school:admin']}><PlannerPage /></RequireScope>} />
                  <Route path="academics/timetable/class" element={<RequireScope requiredScopes={['school:admin']}><ClassTimetablePage /></RequireScope>} />
                  <Route path="academics/timetable/teacher" element={<RequireScope requiredScopes={['school:admin']}><TeacherTimetablePage /></RequireScope>} />

                  {/* Homework Module Routes (Teacher) */}
                  <Route path="homework" element={<RequireScope requiredScopes={['homework:teacher']}><HomeworkListPage /></RequireScope>} />
                  <Route path="homework/:homeworkId" element={<RequireScope requiredScopes={['homework:teacher']}><HomeworkSubmissionsPage /></RequireScope>} />
                  
                  {/* Homework Module Routes (Student) */}
                  <Route path="student/homework" element={<RequireScope requiredScopes={['homework:student']}><StudentHomeworkListPage /></RequireScope>} />
                  <Route path="student/homework/:homeworkId" element={<RequireScope requiredScopes={['homework:student']}><StudentHomeworkDetailPage /></RequireScope>} />


                  {/* Admissions Module Routes */}
                  <Route path="admissions" element={<RequireScope requiredScopes={['admissions:admin']}><AdmissionsDashboard /></RequireScope>} />
                  <Route path="admissions/applications" element={<RequireScope requiredScopes={['admissions:admin']}><ApplicationsPage /></RequireScope>} />
                  <Route path="admissions/applications/:applicationId" element={<RequireScope requiredScopes={['admissions:admin']}><ApplicationDetailPage /></RequireScope>} />
                  <Route path="admissions/seats" element={<RequireScope requiredScopes={['admissions:admin']}><SeatAllocationPage /></RequireScope>} />
                  <Route path="admissions/online" element={<RequireScope requiredScopes={['admissions:admin']}><OnlineAdmissionsPage /></RequireScope>} />
                  <Route path="admissions/offers" element={<RequireScope requiredScopes={['admissions:admin']}><OffersPage /></RequireScope>} />
                  <Route path="admissions/import" element={<RequireScope requiredScopes={['admissions:admin']}><BulkImportPage /></RequireScope>} />
                  <Route path="admissions/comms" element={<RequireScope requiredScopes={['admissions:admin']}><CommsPage /></RequireScope>} />
                  <Route path="admissions/reports" element={<RequireScope requiredScopes={['admissions:admin']}><AdmissionsReportsPage /></RequireScope>} />
                  
                  {/* Front Office Module Routes */}
                  <Route path="frontoffice/visitors" element={<RequireScope requiredScopes={['frontoffice:admin']}><VisitorsPage /></RequireScope>} />
                  <Route path="frontoffice/enquiries" element={<RequireScope requiredScopes={['frontoffice:admin']}><EnquiriesPage /></RequireScope>} />
                  <Route path="frontoffice/enquiries/:enquiryId" element={<RequireScope requiredScopes={['frontoffice:admin']}><EnquiryDetailPage /></RequireScope>} />
                  <Route path="frontoffice/calls" element={<RequireScope requiredScopes={['frontoffice:admin']}><CallLogPage /></RequireScope>} />
                  <Route path="frontoffice/postal" element={<RequireScope requiredScopes={['frontoffice:admin']}><PostalPage /></RequireScope>} />
                  <Route path="frontoffice/postal/:postalId" element={<RequireScope requiredScopes={['frontoffice:admin']}><PostalDetailPage /></RequireScope>} />


                  <Route path="attendance" element={<RequireScope requiredScopes={['school:admin']}><AttendancePage /></RequireScope>} />
                  <Route path="attendance/records" element={<RequireScope requiredScopes={['school:admin']}><AttendanceRecordsPage /></RequireScope>} />
                  <Route path="attendance/exports" element={<RequireScope requiredScopes={['school:admin']}><AttendanceExportsPage /></RequireScope>} />
                  
                  <Route path="courses" element={<RequireScope requiredScopes={['lms:admin']}><PlaceholderPage title="Courses" /></RequireScope>} />
                  <Route path="library" element={<RequireScope requiredScopes={['school:admin', 'lms:admin', 'student']}><LibraryPage /></RequireScope>} />
                  <Route path="library/digital/view" element={<RequireScope requiredScopes={['school:admin', 'lms:admin']}><LibraryViewerPage /></RequireScope>} />
                  
                  {/* Catch-Up Module Routes */}
                  <Route path="library/catchup" element={<RequireScope requiredScopes={['school:admin', 'student']}><CatchUpListPage /></RequireScope>} />
                  <Route path="library/catchup/view/:contentId" element={<RequireScope requiredScopes={['school:admin', 'student']}><CatchUpViewerPage /></RequireScope>} />

                  <Route path="fees" element={<RequireScope requiredScopes={['school:admin']}><FeesPage /></RequireScope>} />
                  <Route path="fees/payments" element={<RequireScope requiredScopes={['school:admin']}><FeesPaymentsPage /></RequireScope>} />

                  {/* Transport Module Routes */}
                  <Route path="transport" element={<RequireScope requiredScopes={['school:admin']}><Navigate to="vehicles" replace /></RequireScope>} />
                  <Route path="transport/vehicles" element={<RequireScope requiredScopes={['school:admin']}><VehiclesPage /></RequireScope>} />
                  <Route path="transport/trips" element={<RequireScope requiredScopes={['school:admin']}><TripsPage /></RequireScope>} />
                  <Route path="transport/boarding" element={<RequireScope requiredScopes={['school:admin']}><BoardingPage /></RequireScope>} />

                  {/* Admin Module Routes */}
                  <Route path="admin/audit" element={<RequireScope requiredScopes={['school:admin']}><AuditTrailPage /></RequireScope>} />
                  <Route path="admin/activity" element={<RequireScope requiredScopes={['school:admin']}><UserActivityPage /></RequireScope>} />

                </Route>
                <Route path="*" element={<Navigate to="/school/site_123" replace />} />
              </Routes>
            </React.Suspense>
          </ErrorBoundary>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;