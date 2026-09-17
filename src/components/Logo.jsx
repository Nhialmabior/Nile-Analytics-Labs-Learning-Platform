import { Link } from 'react-router-dom'
import { Waves } from 'lucide-react'

export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark"><Waves size={22} /></span>
      {!compact && <span><strong>NILE</strong><small>ANALYTICS LABS</small></span>}
    </Link>
  )
}