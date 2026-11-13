import { Award, Download, CheckCircle2 } from 'lucide-react'

export default function Certificates() {
  return (
    <div>
      <div className="dash-heading">
        <div><span className="section-kicker">ACHIEVEMENTS</span><h1>Certificates</h1><p>Certificate interface preview — no certificates have been issued by this demo.</p></div>
      </div>
      <div className="certificate-card">
        <div className="certificate-icon"><Award size={40} /></div>
        <div className="certificate-content">
          <span>DESIGN PREVIEW</span>
          <h2>Course completion certificate</h2>
          <p><CheckCircle2 size={16} /> Sample layout · Not an issued credential</p>
        </div>
        <button className="btn btn-outline" type="button" disabled><Download size={17} /> Downloads coming soon</button>
      </div>
      <div className="empty-certificate"><Award size={32} /><h3>Certificate generation is not connected yet</h3><p>Verified certificates will be available after course completion tracking and certificate services are implemented.</p></div>
    </div>
  )
}
