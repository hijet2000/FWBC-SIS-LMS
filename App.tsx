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
import StudentHomeworkPage from './pages/student/StudentHomeworkPage';
import StudentSubmissionPage from './pages/student/StudentSubmissionPage';
import NotificationsPage from './pages/homework/NotificationsPage';
import HomeworkReportsPage from './pages/homework/HomeworkReportsPage';


// Admissions Pages
import AdmissionsDashboard from './pages/admissions/AdmissionsDashboard';
import ApplicationsPage from './pages/admissions/ApplicationsPage';
import ApplicationDetailPage from './pages/admissions/ApplicationDetailPage';
import SeatAllocationPage from './pages/admissions/SeatAllocationPage';
import BulkImportPage from './pages/admissions/BulkImportPage';
import AdmissionsReportsPage from './pages/admissions/AdmissionsReportsPage';
import CommunicationsPage from './pages/admissions/CommunicationsPage';
import OffersPage from './pages/admissions/OffersPage';

// Front Office Page
import FrontOfficePage from './pages/frontoffice/FrontOfficePage';
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

// Physical Library Pages
import CatalogPage from './pages/library/CatalogPage';
import MembersPage from './pages/library/MembersPage';
import IssueReturnPage from './pages/library/IssueReturnPage';
import LibrarySettingsPage from './pages/library/LibrarySettingsPage';
import ReportsPage from './pages/library/ReportsPage';

// Hostel Pages
import StructurePage from './pages/hostel/StructurePage';
import HostelDashboardPage from './pages/hostel/HostelDashboardPage';
import AllocationsPage from './pages/hostel/AllocationsPage';
import HostelVisitorsPage from './pages/hostel/VisitorsPage';
import CurfewPage from './pages/hostel/CurfewPage';
import SettingsPage from './pages/hostel/SettingsPage';
import StudentHostelPage from './pages/student/StudentHostelPage';
import ParentHostelPage from './pages/portal/ParentHostelPage';

// Inventory Pages
import ItemsPage from './pages/inventory/ItemsPage';
import StockPage from './pages/inventory/StockPage';
import RequestsPage from './pages/inventory/RequestsPage';
import SuppliersPage from './pages/inventory/SuppliersPage';
import AssetsPage from './pages/inventory/AssetsPage';

// Admin Pages
import AuditTrailPage from './pages/admin/AuditTrailPage';
import UserActivityPage from './pages/admin/UserActivityPage';

// CMS Pages
import PagesListPage from './pages/cms/PagesListPage';
import PageEditorPage from './pages/cms/PageEditorPage';

// Certificates Pages
import ManageIssuesPage from './pages/certificates/ManageIssuesPage';
import PublicVerifyPage from './pages/public/PublicVerifyPage';

// Public Pages
import ApplyPage from './pages/public/ApplyPage';
import StatusPage from './pages/public/StatusPage';
import PublicLayout from './pages/public/PublicLayout';
import PublicPage from './pages/public/PublicPage';


// Parent Portal Pages
import ParentLayout from './components/portal/ParentLayout';
import ParentHomeworkPage from './pages/portal/ParentHomeworkPage';
import ParentLibraryPage from './pages/portal/ParentLibraryPage';

import RequireScope from './components/auth/RequireScope';


function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <ErrorBoundary>
            <React.Suspense fallback={<Spinner />}>
              <Routes>
                <Route path="/" element={<Navigate to="/fwbc" replace />} />
                
                {/* Public Website Routes */}
                <Route path="/:siteSlug" element={<PublicLayout />}>
                  <Route index element={<PublicPage isHomepage />} />
                  <Route path="p/:pageSlug" element={<PublicPage />} />
                  {/* News & Events would go here */}
                </Route>

                {/* Public Application Routes */}
                <Route path="/apply/:siteId" element={<ApplyPage />} />
                <Route path="/apply/:siteId/status" element={<StatusPage />} />
                
                {/* Public Certificate Verification */}
                <Route path="/verify/:serial" element={<PublicVerifyPage />} />

                {/* Parent Portal Routes */}
                <Route path="/portal/:siteId/parent/student/:studentId" element={<ParentLayout />}>
                  <Route index element={<Navigate to="homework" replace />} />
                  <Route path="homework" element={<RequireScope requiredScopes={['homework:parent']}><ParentHomeworkPage /></RequireScope>} />
                  <Route path="library" element={<RequireScope requiredScopes={['homework:parent']}><ParentLibraryPage /></RequireScope>} />
                  <Route path="hostel" element={<RequireScope requiredScopes={['homework:parent']}><ParentHostelPage /></RequireScope>} />
                </Route>

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
                  <Route path="homework/reports" element={<RequireScope requiredScopes={['homework:teacher']}><HomeworkReportsPage /></RequireScope>} />
                  <Route path="homework/:homeworkId" element={<RequireScope requiredScopes={['homework:teacher']}><HomeworkSubmissionsPage /></RequireScope>} />
                  <Route path="homework/notifications" element={<RequireScope requiredScopes={['homework:teacher']}><NotificationsPage /></RequireScope>} />

                  {/* Homework Module Routes (Student) */}
                  <Route path="student/homework" element={<RequireScope requiredScopes={['homework:student']}><StudentHomeworkPage /></RequireScope>} />
                  <Route path="student/homework/:homeworkId" element={<RequireScope requiredScopes={['homework:student']}><StudentSubmissionPage /></RequireScope>} />
                  <Route path="student/hostel" element={<RequireScope requiredScopes={['homework:student']}><StudentHostelPage /></RequireScope>} />

                  {/* Admissions Module Routes */}
                  <Route path="admissions" element={<RequireScope requiredScopes={['admissions:admin']}><AdmissionsDashboard /></RequireScope>} />
                  <Route path="admissions/applications" element={<RequireScope requiredScopes={['admissions:admin']}><ApplicationsPage /></RequireScope>} />
                  <Route path="admissions/applications/:applicationId" element={<RequireScope requiredScopes={['admissions:admin']}><ApplicationDetailPage /></RequireScope>} />
                  <Route path="admissions/seats" element={<RequireScope requiredScopes={['admissions:admin']}><SeatAllocationPage /></RequireScope>} />
                  <Route path="admissions/online" element={<RequireScope requiredScopes={['admissions:admin']}><PlaceholderPage title="Online Admissions Management" /></RequireScope>} />
                  <Route path="admissions/offers" element={<RequireScope requiredScopes={['admissions:admin']}><OffersPage /></RequireScope>} />
                  <Route path="admissions/import" element={<RequireScope requiredScopes={['admissions:admin']}><BulkImportPage /></RequireScope>} />
                  <Route path="admissions/comms" element={<RequireScope requiredScopes={['admissions:admin']}><CommunicationsPage /></RequireScope>} />
                  <Route path="admissions/reports" element={<RequireScope requiredScopes={['admissions:admin']}><AdmissionsReportsPage /></RequireScope>} />
                  
                  {/* Front Office Module Routes */}
                  <Route path="frontoffice" element={<RequireScope requiredScopes={['frontoffice:admin']}><FrontOfficePage /></RequireScope>} />
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
                  <Route path="library/catalog" element={<RequireScope requiredScopes={['sis:library:write']}><CatalogPage /></RequireScope>} />
                  <Route path="library/members" element={<RequireScope requiredScopes={['sis:library:write']}><MembersPage /></RequireScope>} />
                  <Route path="library/issue-return" element={<RequireScope requiredScopes={['sis:library:write']}><IssueReturnPage /></RequireScope>} />
                  <Route path="library/settings" element={<RequireScope requiredScopes={['sis:library:write']}><LibrarySettingsPage /></RequireScope>} />
                  <Route path="library/reports" element={<RequireScope requiredScopes={['sis:library:write']}><ReportsPage /></RequireScope>} />
                  
                  {/* Catch-Up Module Routes */}
                  <Route path="library/catchup" element={<RequireScope requiredScopes={['school:admin', 'student']}><CatchUpListPage /></RequireScope>} />
                  <Route path="library/catchup/view/:contentId" element={<RequireScope requiredScopes={['school:admin', 'student']}><CatchUpViewerPage /></RequireScope>} />

                  <Route path="fees" element={<RequireScope requiredScopes={['school:admin']}><FeesPage /></RequireScope>} />
                  <Route path="fees/payments" element={<RequireScope requiredScopes={['school:admin']}><FeesPaymentsPage /></RequireScope>} />

                  {/* Hostel Module Routes */}
                  <Route path="hostel" element={<RequireScope requiredScopes={['sis:hostel:write']}><HostelDashboardPage /></RequireScope>} />
                  <Route path="hostel/structure" element={<RequireScope requiredScopes={['sis:hostel:write']}><StructurePage /></RequireScope>} />
                  <Route path="hostel/allocations" element={<RequireScope requiredScopes={['sis:hostel:write']}><AllocationsPage /></RequireScope>} />
                  <Route path="hostel/visitors" element={<RequireScope requiredScopes={['sis:hostel:write']}><HostelVisitorsPage /></RequireScope>} />
                  <Route path="hostel/curfew" element={<RequireScope requiredScopes={['sis:hostel:write']}><CurfewPage /></RequireScope>} />
                  <Route path="hostel/settings" element={<RequireScope requiredScopes={['sis:hostel:write']}><SettingsPage /></RequireScope>} />
                  
                  {/* Inventory Module Routes */}
                  <Route path="inventory/items" element={<RequireScope requiredScopes={['school:admin']}><ItemsPage /></RequireScope>} />
                  <Route path="inventory/stock" element={<RequireScope requiredScopes={['school:admin']}><StockPage /></RequireScope>} />
                  <Route path="inventory/requests" element={<RequireScope requiredScopes={['school:admin']}><RequestsPage /></RequireScope>} />
                  <Route path="inventory/suppliers" element={<RequireScope requiredScopes={['school:admin']}><SuppliersPage /></RequireScope>} />
                  <Route path="inventory/assets" element={<RequireScope requiredScopes={['school:admin']}><AssetsPage /></RequireScope>} />


                  {/* Transport Module Routes */}
                  <Route path="transport" element={<RequireScope requiredScopes={['school:admin']}><Navigate to="vehicles" replace /></RequireScope>} />
                  <Route path="transport/vehicles" element={<RequireScope requiredScopes={['school:admin']}><VehiclesPage /></RequireScope>} />
                  <Route path="transport/trips" element={<RequireScope requiredScopes={['school:admin']}><TripsPage /></RequireScope>} />
                  <Route path="transport/boarding" element={<RequireScope requiredScopes={['school:admin']}><BoardingPage /></RequireScope>} />
                  
                  {/* Website CMS Module Routes */}
                  <Route path="cms/pages" element={<RequireScope requiredScopes={['cms:admin', 'cms:edit']}><PagesListPage /></RequireScope>} />
                  <Route path="cms/pages/edit/:pageId" element={<RequireScope requiredScopes={['cms:admin', 'cms:edit']}><PageEditorPage /></RequireScope>} />
                  <Route path="cms/pages/new" element={<RequireScope requiredScopes={['cms:admin', 'cms:edit']}><PageEditorPage /></RequireScope>} />
                  <Route path="cms/menus" element={<RequireScope requiredScopes={['cms:admin', 'cms:edit']}><PlaceholderPage title="Menu Manager" /></RequireScope>} />
                  <Route path="cms/news" element={<RequireScope requiredScopes={['cms:admin', 'cms:edit']}><PlaceholderPage title="News & Announcements" /></RequireScope>} />
                  <Route path="cms/events" element={<RequireScope requiredScopes={['cms:admin', 'cms:edit']}><PlaceholderPage title="Events Calendar" /></RequireScope>} />
                  <Route path="cms/media" element={<RequireScope requiredScopes={['cms:admin', 'cms:edit']}><PlaceholderPage title="Media Library" /></RequireScope>} />
                  <Route path="cms/settings" element={<RequireScope requiredScopes={['cms:admin']}><PlaceholderPage title="Website Settings" /></RequireScope>} />
                  
                  {/* Certificates Module Routes */}
                  <Route path="certificates/issues" element={<RequireScope requiredScopes={['certificates:admin']}><ManageIssuesPage /></RequireScope>} />
                  <Route path="certificates/issue" element={<RequireScope requiredScopes={['certificates:issue']}><PlaceholderPage title="Batch Issuance" /></RequireScope>} />
                  <Route path="certificates/templates" element={<RequireScope requiredScopes={['certificates:admin']}><PlaceholderPage title="Template Designer" /></RequireScope>} />

                  {/* Admin Module Routes */}
                  <Route path="admin/audit" element={<RequireScope requiredScopes={['school:admin']}><AuditTrailPage /></RequireScope>} />
                  <Route path="admin/activity" element={<RequireScope requiredScopes={['school:admin']}><UserActivityPage /></RequireScope>} />

                </Route>
                <Route path="*" element={<Navigate to="/fwbc" replace />} />
              </Routes>
            </React.Suspense>
          </ErrorBoundary>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;