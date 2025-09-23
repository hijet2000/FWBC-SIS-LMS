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
import LiveClassesPage from './pages/academics/LiveClassesPage';
import IntegrationsPage from './pages/academics/IntegrationsPage';

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
import SuppliersPage from './pages/inventory/SuppliersPage';
import RequestsPage from './pages/inventory/RequestsPage';
import AssetsPage from './pages/inventory/AssetsPage';

// Finance Pages
import FinanceDashboardPage from './pages/finance/FinanceDashboardPage';
import LedgerPage from './pages/finance/LedgerPage';
import CategoriesAndPayeesPage from './pages/finance/CategoriesAndPayeesPage';
import FinanceReportsPage from './pages/finance/FinanceReportsPage';

// HR Pages
import HrDashboardPage from './pages/hr/HrDashboardPage';
import EmployeesPage from './pages/hr/EmployeesPage';
import LeavePage from './pages/hr/LeavePage';
import PayrollPage from './pages/hr/PayrollPage';

// CMS Pages
import PagesListPage from './pages/cms/PagesListPage';
import PageEditorPage from './pages/cms/PageEditorPage';
import MenuManagerPage from './pages/cms/MenuManagerPage';
import PostsListPage from './pages/cms/PostsListPage';
import PostEditorPage from './pages/cms/PostEditorPage';
import MediaLibraryPage from './pages/cms/MediaLibraryPage';
import CmsSettingsPage from './pages/cms/CmsSettingsPage';

// Certificates Pages
import ManageIssuesPage from './pages/certificates/ManageIssuesPage';

// Admin Pages
import AuditTrailPage from './pages/admin/AuditTrailPage';
import UserActivityPage from './pages/admin/UserActivityPage';
import SettingsLayout from './pages/admin/settings/SettingsLayout';
import ModulesPage from './pages/admin/settings/ModulesPage';
import LocalePage from './pages/admin/settings/LocalePage';
import CalendarPage from './pages/admin/settings/CalendarPage';


// Student Pages
import StudentLiveClassesPage from './pages/student/StudentLiveClassesPage';

// Parent Portal Pages
import ParentLayout from './components/portal/ParentLayout';
import ParentHomeworkPage from './pages/portal/ParentHomeworkPage';
import ParentLibraryPage from './pages/portal/ParentLibraryPage';
import ParentLiveClassesPage from './pages/portal/ParentLiveClassesPage';

// Alumni Pages
import AlumniLayout from './components/portal/AlumniLayout';
import AlumniDirectoryPage from './pages/alumni/AlumniDirectoryPage';
import AlumniEventsPage from './pages/alumni/AlumniEventsPage';
import AlumniDonationsPage from './pages/alumni/AlumniDonationsPage';
import AlumniProfilePage from './pages/alumni/AlumniProfilePage';
import AlumniPortalDirectoryPage from './pages/alumni/AlumniPortalDirectoryPage';
import AlumniPortalEventsPage from './pages/alumni/AlumniPortalEventsPage';
import AlumniDonatePage from './pages/alumni/AlumniDonatePage';

// Public Pages
import PublicLayout from './pages/public/PublicLayout';
import PublicPage from './pages/public/PublicPage';
import PostListPage from './pages/public/PostListPage';
import PostDetailPage from './pages/public/PostDetailPage';
import PublicVerifyPage from './pages/public/PublicVerifyPage';
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
                <Route path="/" element={<Navigate to="/fwbc" replace />} />

                {/* Public Website Routes */}
                <Route path="/:siteSlug" element={<PublicLayout />}>
                  <Route index element={<PublicPage isHomepage />} />
                  <Route path="p/:pageSlug" element={<PublicPage />} />
                  <Route path="news" element={<PostListPage postType="News" />} />
                  <Route path="news/:postSlug" element={<PostDetailPage />} />
                  <Route path="events" element={<PostListPage postType="Event" />} />
                  <Route path="events/:postSlug" element={<PostDetailPage />} />
                </Route>
                <Route path="/verify/:serial" element={<PublicVerifyPage />} />
                <Route path="/apply/:siteId" element={<ApplyPage />} />
                <Route path="/apply/:siteId/status" element={<StatusPage />} />


                {/* Parent Portal Routes */}
                <Route path="/portal/:siteId/parent/student/:studentId" element={<ParentLayout />}>
                  <Route index element={<Navigate to="homework" replace />} />
                  <Route path="homework" element={<RequireScope requiredScopes={['homework:parent']}><ParentHomeworkPage /></RequireScope>} />
                  <Route path="library" element={<RequireScope requiredScopes={['homework:parent']}><ParentLibraryPage /></RequireScope>} />
                  <Route path="hostel" element={<RequireScope requiredScopes={['homework:parent']}><ParentHostelPage /></RequireScope>} />
                  <Route path="live-classes" element={<RequireScope requiredScopes={['homework:parent']}><ParentLiveClassesPage /></RequireScope>} />
                </Route>

                {/* Alumni Portal Routes */}
                <Route path="/portal/:siteId/alumni/:alumniId" element={<AlumniLayout />}>
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="profile" element={<RequireScope requiredScopes={['alumni:portal:self']}><AlumniProfilePage /></RequireScope>} />
                    <Route path="directory" element={<RequireScope requiredScopes={['alumni:portal:self']}><AlumniPortalDirectoryPage /></RequireScope>} />
                    <Route path="events" element={<RequireScope requiredScopes={['alumni:portal:self']}><AlumniPortalEventsPage /></RequireScope>} />
                    <Route path="donate" element={<RequireScope requiredScopes={['alumni:portal:self']}><AlumniDonatePage /></RequireScope>} />
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

                  {/* Live Classes Sub-module */}
                  <Route path="academics/live-classes" element={<RequireScope requiredScopes={['school:admin', 'homework:teacher']}><LiveClassesPage /></RequireScope>} />
                  <Route path="academics/integrations" element={<RequireScope requiredScopes={['school:admin']}><IntegrationsPage /></RequireScope>} />

                  {/* Homework Module Routes (Teacher) */}
                  <Route path="homework" element={<RequireScope requiredScopes={['homework:teacher']}><HomeworkListPage /></RequireScope>} />
                  <Route path="homework/reports" element={<RequireScope requiredScopes={['homework:teacher']}><HomeworkReportsPage /></RequireScope>} />
                  <Route path="homework/:homeworkId" element={<RequireScope requiredScopes={['homework:teacher']}><HomeworkSubmissionsPage /></RequireScope>} />
                  <Route path="homework/notifications" element={<RequireScope requiredScopes={['homework:teacher']}><NotificationsPage /></RequireScope>} />

                  {/* Homework Module Routes (Student) */}
                  <Route path="student/homework" element={<RequireScope requiredScopes={['homework:student']}><StudentHomeworkPage /></RequireScope>} />
                  <Route path="student/homework/:homeworkId" element={<RequireScope requiredScopes={['homework:student']}><StudentSubmissionPage /></RequireScope>} />
                  <Route path="student/hostel" element={<RequireScope requiredScopes={['homework:student']}><StudentHostelPage /></RequireScope>} />
                  <Route path="student/live-classes" element={<RequireScope requiredScopes={['homework:student']}><StudentLiveClassesPage /></RequireScope>} />

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

                  {/* Fees Module Routes */}
                  <Route path="fees" element={<RequireScope requiredScopes={['school:admin']}><FeesPage /></RequireScope>} />
                  <Route path="fees/payments" element={<RequireScope requiredScopes={['school:admin']}><FeesPaymentsPage /></RequireScope>} />

                  {/* Finance Module Routes */}
                  <Route path="finance" element={<RequireScope requiredScopes={['finance:admin']}><Navigate to="dashboard" replace /></RequireScope>} />
                  <Route path="finance/dashboard" element={<RequireScope requiredScopes={['finance:admin']}><FinanceDashboardPage /></RequireScope>} />
                  <Route path="finance/ledger" element={<RequireScope requiredScopes={['finance:admin']}><LedgerPage /></RequireScope>} />
                  <Route path="finance/config" element={<RequireScope requiredScopes={['finance:admin']}><CategoriesAndPayeesPage /></RequireScope>} />
                  <Route path="finance/reports" element={<RequireScope requiredScopes={['finance:admin']}><FinanceReportsPage /></RequireScope>} />

                  {/* HR & Payroll Module Routes */}
                  <Route path="hr" element={<RequireScope requiredScopes={['hr:admin']}><Navigate to="dashboard" replace /></RequireScope>} />
                  <Route path="hr/dashboard" element={<RequireScope requiredScopes={['hr:admin']}><HrDashboardPage /></RequireScope>} />
                  <Route path="hr/employees" element={<RequireScope requiredScopes={['hr:admin']}><EmployeesPage /></RequireScope>} />
                  <Route path="hr/leave" element={<RequireScope requiredScopes={['hr:admin']}><LeavePage /></RequireScope>} />
                  <Route path="hr/timesheets" element={<RequireScope requiredScopes={['hr:admin']}><PlaceholderPage title="Timesheets" /></RequireScope>} />
                  <Route path="hr/payroll" element={<RequireScope requiredScopes={['payroll:admin']}><PayrollPage /></RequireScope>} />
                  <Route path="hr/reports" element={<RequireScope requiredScopes={['hr:admin', 'payroll:admin']}><PlaceholderPage title="HR & Payroll Reports" /></RequireScope>} />

                  {/* Hostel Module Routes */}
                  <Route path="hostel" element={<RequireScope requiredScopes={['sis:hostel:write']}><HostelDashboardPage /></RequireScope>} />
                  <Route path="hostel/structure" element={<RequireScope requiredScopes={['sis:hostel:write']}><StructurePage /></RequireScope>} />
                  <Route path="hostel/allocations" element={<RequireScope requiredScopes={['sis:hostel:write']}><AllocationsPage /></RequireScope>} />
                  <Route path="hostel/visitors" element={<RequireScope requiredScopes={['sis:hostel:write']}><HostelVisitorsPage /></RequireScope>} />
                  <Route path="hostel/curfew" element={<RequireScope requiredScopes={['sis:hostel:write']}><CurfewPage /></RequireScope>} />
                  <Route path="hostel/settings" element={<RequireScope requiredScopes={['sis:hostel:write']}><SettingsPage /></RequireScope>} />
                  
                  {/* Transport Module Routes */}
                  <Route path="transport" element={<RequireScope requiredScopes={['school:admin']}><Navigate to="vehicles" replace /></RequireScope>} />
                  <Route path="transport/vehicles" element={<RequireScope requiredScopes={['school:admin']}><VehiclesPage /></RequireScope>} />
                  <Route path="transport/trips" element={<RequireScope requiredScopes={['school:admin']}><TripsPage /></RequireScope>} />
                  <Route path="transport/boarding" element={<RequireScope requiredScopes={['school:admin']}><BoardingPage /></RequireScope>} />

                  {/* Inventory Module Routes */}
                  <Route path="inventory" element={<RequireScope requiredScopes={['inventory:admin']}><Navigate to="items" replace /></RequireScope>} />
                  <Route path="inventory/items" element={<RequireScope requiredScopes={['inventory:admin']}><ItemsPage /></RequireScope>} />
                  <Route path="inventory/stock" element={<RequireScope requiredScopes={['inventory:admin']}><StockPage /></RequireScope>} />
                  <Route path="inventory/suppliers" element={<RequireScope requiredScopes={['inventory:admin']}><SuppliersPage /></RequireScope>} />
                  <Route path="inventory/requests" element={<RequireScope requiredScopes={['inventory:admin']}><RequestsPage /></RequireScope>} />
                  <Route path="inventory/assets" element={<RequireScope requiredScopes={['inventory:admin']}><AssetsPage /></RequireScope>} />
                  
                  {/* CMS Module Routes */}
                  <Route path="cms" element={<RequireScope requiredScopes={['cms:admin']}><Navigate to="pages" replace /></RequireScope>} />
                  <Route path="cms/pages" element={<RequireScope requiredScopes={['cms:admin']}><PagesListPage /></RequireScope>} />
                  <Route path="cms/pages/new" element={<RequireScope requiredScopes={['cms:admin']}><PageEditorPage /></RequireScope>} />
                  <Route path="cms/pages/edit/:pageId" element={<RequireScope requiredScopes={['cms:admin']}><PageEditorPage /></RequireScope>} />
                  <Route path="cms/posts" element={<RequireScope requiredScopes={['cms:admin']}><PostsListPage /></RequireScope>} />
                  <Route path="cms/posts/new" element={<RequireScope requiredScopes={['cms:admin']}><PostEditorPage /></RequireScope>} />
                  <Route path="cms/posts/edit/:postId" element={<RequireScope requiredScopes={['cms:admin']}><PostEditorPage /></RequireScope>} />
                  <Route path="cms/menus" element={<RequireScope requiredScopes={['cms:admin']}><MenuManagerPage /></RequireScope>} />
                  <Route path="cms/media" element={<RequireScope requiredScopes={['cms:admin']}><MediaLibraryPage /></RequireScope>} />
                  <Route path="cms/settings" element={<RequireScope requiredScopes={['cms:admin']}><CmsSettingsPage /></RequireScope>} />
                  
                  {/* Certificates Module Routes */}
                  <Route path="certificates" element={<RequireScope requiredScopes={['certificates:admin']}><ManageIssuesPage /></RequireScope>} />
                  
                  {/* Alumni Module Routes */}
                  <Route path="alumni" element={<RequireScope requiredScopes={['alumni:admin']}><Navigate to="directory" replace /></RequireScope>} />
                  <Route path="alumni/directory" element={<RequireScope requiredScopes={['alumni:admin']}><AlumniDirectoryPage /></RequireScope>} />
                  <Route path="alumni/events" element={<RequireScope requiredScopes={['alumni:admin']}><AlumniEventsPage /></RequireScope>} />
                  <Route path="alumni/donations" element={<RequireScope requiredScopes={['alumni:admin']}><AlumniDonationsPage /></RequireScope>} />

                  {/* Admin Module Routes */}
                  <Route path="admin/audit" element={<RequireScope requiredScopes={['school:admin']}><AuditTrailPage /></RequireScope>} />
                  <Route path="admin/activity" element={<RequireScope requiredScopes={['school:admin']}><UserActivityPage /></RequireScope>} />
                  
                  {/* Settings Module Routes */}
                  <Route path="admin/settings" element={<RequireScope requiredScopes={['school:admin']}><SettingsLayout /></RequireScope>}>
                      <Route index element={<Navigate to="modules" replace />} />
                      <Route path="modules" element={<ModulesPage />} />
                      <Route path="locale" element={<LocalePage />} />
                      <Route path="calendar" element={<CalendarPage />} />
                      <Route path="branding" element={<PlaceholderPage title="Branding Settings" />} />
                      <Route path="roles" element={<PlaceholderPage title="Roles & Permissions" />} />
                      <Route path="privacy" element={<PlaceholderPage title="Privacy & Data" />} />
                      <Route path="backup" element={<PlaceholderPage title="Backup & Restore" />} />
                      <Route path="diagnostics" element={<PlaceholderPage title="System Health" />} />
                  </Route>

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