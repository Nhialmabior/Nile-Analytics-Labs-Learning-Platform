import { Mail, MapPin, Send } from 'lucide-react'

const CONTACT_EMAIL = 'info@nileanalyticslabs.org'

export default function Contact() {
  function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const email = String(form.get('email') || '').trim()
    const message = String(form.get('message') || '').trim()
    const subject = encodeURIComponent(`Website enquiry from ${name}`)
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
  }

  return (
    <div className="page">
      <section className="inner-hero">
        <div className="container">
          <span className="section-kicker">CONTACT</span>
          <h1>Let's talk about learning.</h1>
          <p>Have a question about our courses or learning platform? Get in touch with Nile Analytics Labs.</p>
        </div>
      </section>
      <section className="section">
        <div className="container contact-grid">
          <div className="contact-info">
            <span className="section-kicker">FIND US</span>
            <h2>Nile Analytics Labs</h2>
            <p>University of Juba, Juba, South Sudan</p>
            <div className="contact-item"><MapPin /><span>University of Juba<br />Juba, South Sudan</span></div>
            <div className="contact-item"><Mail /><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></div>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            <label>Full name<input name="name" autoComplete="name" placeholder="Your name" required /></label>
            <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <label>Message<textarea name="message" rows="6" placeholder="How can we help?" required /></label>
            <button className="btn btn-primary" type="submit">Open email to send <Send size={17} /></button>
            <p className="form-hint">This opens your default email application with your message prepared. Nothing is stored on this website.</p>
          </form>
        </div>
      </section>
    </div>
  )
}
