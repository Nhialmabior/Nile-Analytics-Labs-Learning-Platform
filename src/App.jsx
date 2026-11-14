import { Routes, Route, Link } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import NileBot from './components/NileBot'
import AdminDashboard from './pages/AdminDashboard'
import Home from './pages/Home'
import About from './pages/About'
import Courses from './pages/Courses'
import CourseDetails from './pages/CourseDetails'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MyCourses from './pages/MyCourses'
import Learning from './pages/Learning'
import Profile from './pages/Profile'
import Certificates from './pages/Certificates'

function NotFound() {
  return <div className="section container"><span className="section-kicker">PAGE NOT FOUND</span><h1>We couldn't find that page.</h1><p>The link may be outdated or the page may have moved.</p><Link className="btn btn-primary" to="/">Return to homepage</Link></div>
}

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetails />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/learning/:slug" element={<Learning />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/certificates" element={<Certificates />} />
        </Route>
      </Routes>
      <NileBot />
    </>
  )
}
