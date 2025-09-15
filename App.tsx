import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
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

import RequireScope from './components/auth/RequireScope';
import ScopeSwitcher from './components/dev/ScopeSwitcher';


function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/school/site_123" replace />} />
          <Route path="/school/:siteId" element={<Layout />}>
            <Route index element={<SisDashboard />} />
            <Route path="students" element={<RequireScope requiredScopes={['school:admin']}><StudentsPage /></RequireScope>} />
            <Route path="students/:studentId" element={<RequireScope requiredScopes={['school:admin']}><StudentProfilePage /></RequireScope>} />
            <Route path="academics" element={<RequireScope requiredScopes={['school:admin']}><AcademicsPage /></RequireScope>} />
            <Route path="academics/subjects" element={<RequireScope requiredScopes={['school:admin']}><PlaceholderPage title="Manage Subjects" /></RequireScope>} />
            <Route path="academics/gradebooks" element={<RequireScope requiredScopes={['school:admin']}><PlaceholderPage title="Gradebooks" /></RequireScope>} />
            <Route path="academics/reports" element={<RequireScope requiredScopes={['school:admin']}><PlaceholderPage title="Report Cards" /></RequireScope>} />
            <Route path="attendance" element={<RequireScope requiredScopes={['school:admin']}><AttendancePage /></RequireScope>} />
            <Route path="attendance/records" element={<RequireScope requiredScopes={['school:admin']}><AttendanceRecordsPage /></RequireScope>} />
            <Route path="attendance/exports" element={<RequireScope requiredScopes={['school:admin']}><AttendanceExportsPage /></RequireScope>} />
            <Route path="courses" element={<RequireScope requiredScopes={['lms:admin']}><PlaceholderPage title="Courses" /></RequireScope>} />
            <Route path="library" element={<RequireScope requiredScopes={['school:admin', 'lms:admin']}><LibraryPage /></RequireScope>} />
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
      </HashRouter>
      <ScopeSwitcher />
    </AuthProvider>
  );
}

export default App;