import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import SitePage from './pages/SitePage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import MyLearning from './pages/MyLearning';
import StudentDashboard from './pages/StudentDashboard';
import CoursePlayer from './pages/CoursePlayer';
import Checkout from './pages/Checkout';
import QuizPage from './pages/QuizPage';
import BecomeInstructor from './pages/BecomeInstructor';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorCourses from './pages/instructor/InstructorCourses';
import CourseForm from './pages/instructor/CourseForm';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminInstructors from './pages/admin/AdminInstructors';
import AdminCourses from './pages/admin/AdminCourses';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReviews from './pages/admin/AdminReviews';
import StudentOrders from './pages/StudentOrders';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import InstructorStudents from './pages/instructor/InstructorStudents';
import InstructorEarnings from './pages/instructor/InstructorEarnings';
import InstructorQuiz from './pages/instructor/InstructorQuiz';
import InstructorAnnouncements from './pages/instructor/InstructorAnnouncements';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSitePages from './pages/admin/AdminSitePages';
import CertificatePreview from './pages/CertificatePreview';
import VerifyCertificate from './pages/VerifyCertificate';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="help-center" element={<SitePage />} />
        <Route path="terms-of-service" element={<SitePage />} />
        <Route path="privacy-policy" element={<SitePage />} />
        <Route path="login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:slug" element={<CourseDetail />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="become-instructor" element={<BecomeInstructor />} />
        <Route path="certificate-preview" element={<CertificatePreview />} />
        <Route path="verify-certificate" element={<VerifyCertificate />} />
      </Route>

      <Route
        path="learn/:courseId/:lessonId"
        element={
          <ProtectedRoute>
            <CoursePlayer />
          </ProtectedRoute>
        }
      />
      <Route
        path="quiz/course/:courseId"
        element={
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="dashboard"
        element={
          <ProtectedRoute roles={['student', 'instructor', 'admin']}>
            <DashboardLayout type="student" />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="learning" element={<MyLearning />} />
        <Route path="wishlist" element={<MyLearning defaultTab={1} />} />
        <Route path="orders" element={<StudentOrders />} />
        <Route path="messages" element={<Messages />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Navigate to="/dashboard/profile" replace />} />
      </Route>

      <Route
        path="instructor"
        element={
          <ProtectedRoute roles={['instructor', 'admin']}>
            <DashboardLayout type="instructor" />
          </ProtectedRoute>
        }
      >
        <Route index element={<InstructorDashboard />} />
        <Route path="courses" element={<InstructorCourses />} />
        <Route path="courses/new" element={<CourseForm />} />
        <Route path="courses/edit/:id" element={<CourseForm />} />
        <Route path="courses/:id/quiz" element={<InstructorQuiz />} />
        <Route path="announcements" element={<InstructorAnnouncements />} />
        <Route path="students" element={<InstructorStudents />} />
        <Route path="messages" element={<Messages basePath="/instructor/messages" />} />
        <Route path="earnings" element={<InstructorEarnings />} />
      </Route>

      <Route
        path="admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <DashboardLayout type="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="instructors" element={<AdminInstructors />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="pages" element={<AdminSitePages />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
