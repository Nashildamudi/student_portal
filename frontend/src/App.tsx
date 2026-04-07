import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './hooks/useToast';
import { DashboardLayout } from './components/Layout';
import { LoadingScreen } from './components/ui/spinner';

// Pages
import LoginPage from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import DepartmentsPage from './pages/admin/Departments';
import CoursesPage from './pages/admin/Courses';
import SubjectsPage from './pages/admin/Subjects';
import StudentsPage from './pages/admin/Students';
import FacultyPage from './pages/admin/Faculty';
import AssignmentsPage from './pages/admin/Assignments';
import UsersPage from './pages/admin/Users';

// Faculty Pages
import FacultyDashboard from './pages/faculty/Dashboard';
import AttendancePage from './pages/faculty/Attendance';
import MarksPage from './pages/faculty/Marks';
import FacultyMaterialsPage from './pages/faculty/Materials';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentMarks from './pages/student/Marks';
import StudentMaterials from './pages/student/Materials';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    const redirectPath = user.role === 'admin' ? '/admin' : user.role === 'faculty' ? '/faculty' : '/student';
    return <Navigate to={redirectPath} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

// Public Route - redirects to dashboard if logged in
function PublicRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    const redirectPath = user.role === 'admin' ? '/admin' : user.role === 'faculty' ? '/faculty' : '/student';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={['admin']}><DepartmentsPage /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={['admin']}><CoursesPage /></ProtectedRoute>} />
      <Route path="/admin/subjects" element={<ProtectedRoute allowedRoles={['admin']}><SubjectsPage /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><StudentsPage /></ProtectedRoute>} />
      <Route path="/admin/faculty" element={<ProtectedRoute allowedRoles={['admin']}><FacultyPage /></ProtectedRoute>} />
      <Route path="/admin/assignments" element={<ProtectedRoute allowedRoles={['admin']}><AssignmentsPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>} />

      {/* Faculty Routes */}
      <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
      <Route path="/faculty/classes" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
      <Route path="/faculty/attendance" element={<ProtectedRoute allowedRoles={['faculty']}><AttendancePage /></ProtectedRoute>} />
      <Route path="/faculty/marks" element={<ProtectedRoute allowedRoles={['faculty']}><MarksPage /></ProtectedRoute>} />
      <Route path="/faculty/materials" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyMaterialsPage /></ProtectedRoute>} />

      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} />
      <Route path="/student/marks" element={<ProtectedRoute allowedRoles={['student']}><StudentMarks /></ProtectedRoute>} />
      <Route path="/student/materials" element={<ProtectedRoute allowedRoles={['student']}><StudentMaterials /></ProtectedRoute>} />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
