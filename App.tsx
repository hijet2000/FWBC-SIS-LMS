import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';

import Layout from './components/Layout';
import RequireScope from './components/auth/RequireScope';

// Pages
import SisDashboard from './pages/SisDashboard';
import StudentsPage from './pages/StudentsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import AttendancePage from './pages/AttendancePage';
import AttendanceRecordsPage from './pages/AttendanceRecordsPage';
import AttendanceExportsPage from './pages/AttendanceExportsPage';
import AcademicsPage from './pages/AcademicsPage';
import ClassTimetablePage from './pages/academics/ClassTimetablePage';
import TeacherTimetablePage from './pages/academics/TeacherTimetablePage';
import PlannerPage from './pages/academics/PlannerPage';
import LibraryPage from './pages/LibraryPage';
import LibraryViewerPage from './pages/LibraryViewerPage';
import CatchUpListPage from './pages/library/CatchUpListPage';
import CatchUpViewerPage from './pages/library/CatchUpViewerPage';
import CatalogPage from './pages/library/CatalogPage';
import MembersPage from './pages/library/MembersPage';
import MemberDetailPage from './pages/library/MemberDetailPage';
import CirculationPage from './pages/library/CirculationPage';
import LibraryReportsPage from './pages/library/ReportsPage';
import LibrarySettingsPage from './pages/library/SettingsPage';
import FeesPage from './pages/FeesPage';
import FeesPaymentsPage from './pages/FeesPaymentsPage';
import AdmissionsDashboard from './pages/admissions/AdmissionsDashboard';
import ApplicationsPage from './pages/admissions/ApplicationsPage';
import ApplicationDetailPage from './pages/admissions/ApplicationDetailPage';
import SeatAllocationPage from './pages/admissions/SeatAllocationPage';
import OffersPage from './pages/admissions/OffersPage';
import CommsPage from './pages/admissions/CommsPage';
import BulkImportPage from './pages/admissions/BulkImportPage';
import OnlineAdmissionsPage from './pages/admissions/OnlineAdmissionsPage';
import AdmissionsReportsPage from './pages/admissions/AdmissionsReportsPage';
import EnquiriesPage from './pages/frontoffice/EnquiriesPage';
import EnquiryDetailPage from './pages/frontoffice/EnquiryDetailPage';
import VisitorsPage from './pages/frontoffice/VisitorsPage';
import CallLogPage from './pages/frontoffice/CallLogPage';
import PostalPage from './pages/frontoffice/PostalPage';
import PostalDetailPage from './pages/frontoffice/PostalDetailPage';
import VehiclesPage from './pages/transport/VehiclesPage';
import TripsPage from './pages/transport/TripsPage';
import BoardingPage from './pages/transport/BoardingPage';
import HomeworkListPage from './pages/homework/HomeworkListPage';
import HomeworkSubmissionsPage from './pages/homework/HomeworkSubmissionsPage';
import HomeworkReportsPage from './pages/homework/HomeworkReportsPage';
import StudentHomeworkListPage from './pages/student/HomeworkListPage';
import StudentHomeworkDetailPage from './pages/student/HomeworkDetailPage';
import ParentPortalPage from './pages/parent/ParentPortalPage';
import AuditTrailPage from './pages/admin/AuditTrailPage';
import UserActivityPage from './pages/admin/UserActivityPage';
import RolesPage from './pages/admin/RolesPage';
import ApplyPage from './pages/public/ApplyPage';
import StatusPage from './pages/public/StatusPage';
import NoAccessPage from './pages/NoAccessPage';
import PlaceholderPage from './pages/PlaceholderPage';

// Hostel pages
import HostelDashboardPage from './pages/hostel/HostelDashboardPage';
import HostelStructurePage from './pages/hostel/HostelStructurePage';
import HostelAllocationsPage from './pages/hostel/HostelAllocationsPage';
import HostelVisitorsPage from './pages/hostel/HostelVisitorsPage';
import HostelCurfewPage from './pages/hostel/HostelCurfewPage';
import HostelReportsPage from './pages/hostel/HostelReportsPage';


const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/apply/:siteId" element={<ApplyPage />} />
              <Route path="/status" element={<StatusPage />} />

              {/* Parent Portal Route */}
              <Route path="/parent-portal/:studentId" element={<ParentPortalPage />} />
              
              {/* Main App Routes */}
              <Route path="/school/:siteId" element={<Layout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<SisDashboard />} />
                
                {/* SIS */}
                <Route path="students" element={<StudentsPage />} />
                <Route path="students/:studentId" element={<StudentProfilePage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="attendance/records" element={<AttendanceRecordsPage />} />
                <Route path="attendance/exports" element={<AttendanceExportsPage />} />

                {/* Academics */}
                <Route path="academics" element={<AcademicsPage />} />
                <Route path="academics/planner" element={<PlannerPage />} />
                <Route path="academics/class-timetables" element={<ClassTimetablePage />} />
                <Route path="academics/teacher-timetables" element={<TeacherTimetablePage />} />
                <Route path="academics/reports" element={<PlaceholderPage title="Academic Reports" />} />

                {/* Library */}
                <Route path="library" element={<Navigate to="digital" replace />} />
                <Route path="library/digital" element={<LibraryPage />} />
                <Route path="library/digital/view" element={<LibraryViewerPage />} />
                <Route path="library/catchup" element={<CatchUpListPage />} />
                <Route path="library/catchup/view/:contentId" element={<CatchUpViewerPage />} />
                <Route path="library/physical/catalog" element={<CatalogPage />} />
                <Route path="library/physical/members" element={<MembersPage />} />
                <Route path="library/physical/members/:memberId" element={<MemberDetailPage />} />
                <Route path="library/physical/circulation" element={<CirculationPage />} />
                <Route path="library/physical/reports" element={<LibraryReportsPage />} />
                <Route path="library/physical/settings" element={<LibrarySettingsPage />} />

                {/* Fees */}
                <Route path="fees" element={<FeesPage />} />
                <Route path="fees/payments" element={<FeesPaymentsPage />} />
                
                {/* Admissions */}
                <Route path="admissions" element={<AdmissionsDashboard />} />
                <Route path="admissions/applications" element={<ApplicationsPage />} />
                <Route path="admissions/applications/:applicationId" element={<ApplicationDetailPage />} />
                <Route path="admissions/seats" element={<SeatAllocationPage />} />
                <Route path="admissions/offers" element={<OffersPage />} />
                <Route path="admissions/comms" element={<CommsPage />} />
                <Route path="admissions/import" element={<BulkImportPage />} />
                <Route path="admissions/online-settings" element={<OnlineAdmissionsPage />} />
                <Route path="admissions/reports" element={<AdmissionsReportsPage />} />

                {/* Front Office */}
                <Route path="frontoffice/enquiries" element={<EnquiriesPage />} />
                <Route path="frontoffice/enquiries/:enquiryId" element={<EnquiryDetailPage />} />
                <Route path="frontoffice/visitors" element={<VisitorsPage />} />
                <Route path="frontoffice/calls" element={<CallLogPage />} />
                <Route path="frontoffice/postal" element={<PostalPage />} />
                <Route path="frontoffice/postal/:postalId" element={<PostalDetailPage />} />
                
                {/* Transport */}
                <Route path="transport/vehicles" element={<VehiclesPage />} />
                <Route path="transport/trips" element={<TripsPage />} />
                <Route path="transport/boarding" element={<BoardingPage />} />

                {/* Homework (Teacher view) */}
                <Route path="homework" element={<HomeworkListPage />} />
                <Route path="homework/:homeworkId" element={<HomeworkSubmissionsPage />} />
                <Route path="homework/reports" element={<HomeworkReportsPage />} />

                {/* Hostel */}
                <Route path="hostel/dashboard" element={<HostelDashboardPage />} />
                <Route path="hostel/structure" element={<HostelStructurePage />} />
                <Route path="hostel/allocations" element={<HostelAllocationsPage />} />
                <Route path="hostel/visitors" element={<HostelVisitorsPage />} />
                <Route path="hostel/curfew" element={<HostelCurfewPage />} />
                <Route path="hostel/reports" element={<HostelReportsPage />} />
                
                {/* Student Portal (nested inside for layout) */}
                <Route path="student/homework" element={<StudentHomeworkListPage />} />
                <Route path="student/homework/:homeworkId" element={<StudentHomeworkDetailPage />} />

                {/* Admin */}
                <Route path="admin" element={<RequireScope requiredScopes={['school:admin']} />}>
                    <Route index element={<Navigate to="audit-trail" replace />} />
                    <Route path="audit-trail" element={<AuditTrailPage />} />
                    <Route path="user-activity" element={<UserActivityPage />} />
                    <Route path="roles" element={<RolesPage />} />
                </Route>
                
                <Route path="*" element={<PlaceholderPage title="Not Found" />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
