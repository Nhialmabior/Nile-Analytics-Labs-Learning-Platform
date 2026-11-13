import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="auth-page"><div className="auth-card"><p>Checking your account…</p></div></div>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />
  }
  return children
}
