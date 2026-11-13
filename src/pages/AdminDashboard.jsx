import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Users, ClipboardList, BarChart3, LogOut,
  Plus, RefreshCw, Search, GraduationCap, FileCheck2, Eye, EyeOff,
  Pencil, Trash2, X, AlertCircle, CheckCircle2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const sections = [
  ['overview', 'Overview', LayoutDashboard],
  ['courses', 'Courses', BookOpen],
  ['learners', 'Learners', Users],
  ['assessments', 'Assessments', ClipboardList],
  ['reports', 'Reports', BarChart3]
]

const blankCourse = { title: '', slug: '', category: 'Excel', description: '', level: 'Beginner', duration: '6 weeks', is_published: false }
const blankAssessment = { course_id: '', title: '', instructions: '', total_marks: 100, is_published: false }

function StatCard({ icon: Icon, label, value, note }) {
  return <article className="admin-stat"><span className="admin-stat-icon"><Icon size={19} /></span><div><small>{label}</small><strong>{value ?? '—'}</strong><span>{note}</span></div></article>
}

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [section, setSection] = useState('overview')
  const [stats, setStats] = useState({ learners: 0, courses: 0, published: 0, enrollments: 0, assessments: 0, submissions: 0 })
  const [courses, setCourses] = useState([])
  const [learners, setLearners] = useState([])
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(blankCourse)
  const [saving, setSaving] = useState(false)
  const [showAssessmentForm, setShowAssessmentForm] = useState(false)
  const [assessmentForm, setAssessmentForm] = useState(blankAssessment)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    const [profileRes, courseRes, enrollmentRes, assessmentRes, submissionRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, role, created_at').order('created_at', { ascending: false }),
      supabase.from('courses').select('*').order('created_at', { ascending: false }),
      supabase.from('enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('assessments').select('id, title, total_marks, is_published, created_at, courses(title)').order('created_at', { ascending: false }),
      supabase.from('assessment_submissions').select('id', { count: 'exact', head: true })
    ])
    const firstError = profileRes.error || courseRes.error || enrollmentRes.error || assessmentRes.error || submissionRes.error
    if (firstError) {
      setError(firstError.message.includes('does not exist') || firstError.message.includes('schema cache')
        ? 'The LMS database has not been installed yet. Run supabase/lms_schema.sql in your Supabase SQL Editor, then refresh this page.'
        : firstError.message)
    } else {
      const people = profileRes.data || []
      const courseRows = courseRes.data || []
      const assessmentRows = assessmentRes.data || []
      setLearners(people.filter(person => person.role !== 'admin'))
      setCourses(courseRows)
      setAssessments(assessmentRows)
      setStats({
        learners: people.filter(person => person.role !== 'admin').length,
        courses: courseRows.length,
        published: courseRows.filter(course => course.is_published).length,
        enrollments: enrollmentRes.count || 0,
        assessments: assessmentRows.length,
        submissions: submissionRes.count || 0
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  function startCreate() {
    setEditingId(null)
    setForm(blankCourse)
    setShowForm(true)
    setNotice('')
  }

  function startEdit(course) {
    setEditingId(course.id)
    setForm({ title: course.title, slug: course.slug, category: course.category, description: course.description || '', level: course.level || 'Beginner', duration: course.duration || '', is_published: course.is_published })
    setShowForm(true)
    setNotice('')
  }

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  async function saveCourse(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    const payload = {
      ...form,
      slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      title: form.title.trim(),
      description: form.description.trim(),
      created_by: user.id
    }
    const result = editingId
      ? await supabase.from('courses').update(payload).eq('id', editingId)
      : await supabase.from('courses').insert(payload)
    if (result.error) setError(result.error.message)
    else {
      setNotice(editingId ? 'Course updated successfully.' : 'Course created successfully.')
      setShowForm(false)
      setForm(blankCourse)
      setEditingId(null)
      await loadData()
    }
    setSaving(false)
  }

  async function togglePublish(course) {
    setError('')
    setNotice('')
    const { error: updateError } = await supabase.from('courses').update({ is_published: !course.is_published }).eq('id', course.id)
    if (updateError) setError(updateError.message)
    else {
      setNotice(course.is_published ? 'Course moved to drafts.' : 'Course published and available to learners.')
      await loadData()
    }
  }

  async function deleteCourse(course) {
    if (!window.confirm('Delete "' + course.title + '" and its modules, lessons and related course records? This cannot be undone.')) return
    const { error: deleteError } = await supabase.from('courses').delete().eq('id', course.id)
    if (deleteError) setError(deleteError.message)
    else {
      setNotice('Course deleted.')
      await loadData()
    }
  }

  function startAssessment() {
    setAssessmentForm({ ...blankAssessment, course_id: courses.find(item => item.is_published)?.id || courses[0]?.id || '' })
    setShowAssessmentForm(true)
    setNotice('')
    setError('')
  }

  async function saveAssessment(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    const { error: saveError } = await supabase.from('assessments').insert({
      ...assessmentForm,
      title: assessmentForm.title.trim(),
      instructions: assessmentForm.instructions.trim(),
      total_marks: Number(assessmentForm.total_marks),
      is_published: false
    })
    if (saveError) setError(saveError.message)
    else {
      setNotice('Assessment saved as a draft. Publish it when the instructions and resources are ready.')
      setShowAssessmentForm(false)
      setAssessmentForm(blankAssessment)
      await loadData()
    }
    setSaving(false)
  }

  async function toggleAssessment(item) {
    const { error: updateError } = await supabase.from('assessments')
      .update({ is_published: !item.is_published }).eq('id', item.id)
    if (updateError) setError(updateError.message)
    else {
      setNotice(item.is_published ? 'Assessment unpublished.' : 'Assessment published for learners.')
      await loadData()
    }
  }

  const filteredCourses = courses.filter(course => (course.title + ' ' + course.category).toLowerCase().includes(search.toLowerCase()))
  const filteredLearners = learners.filter(person => (person.full_name || '').toLowerCase().includes(search.toLowerCase()) || person.id.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span className="admin-brand-mark">N</span><span><strong>NILE ANALYTICS</strong><small>ADMINISTRATION</small></span></div>
        <div className="admin-side-label">WORKSPACE</div>
        <nav className="admin-nav">
          {sections.map(([id, label, Icon]) => (
            <button key={id} type="button" className={section === id ? 'admin-nav-link active' : 'admin-nav-link'} onClick={() => { setSection(id); setSearch(''); setShowForm(false) }}>
              <Icon size={18} />{label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-user-mini"><span>{(profile?.full_name || user?.email || 'A').slice(0, 1).toUpperCase()}</span><div><strong>{profile?.full_name || 'Administrator'}</strong><small>{user?.email}</small></div></div>
          <button className="admin-logout" type="button" onClick={handleSignOut}><LogOut size={17} /> Sign out</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar"><div><span>UNIVERSITY OF JUBA · LEARNING MANAGEMENT SYSTEM</span><strong>Administrator workspace</strong></div><button type="button" className="admin-refresh" onClick={loadData} disabled={loading}><RefreshCw size={16} className={loading ? 'admin-spin' : ''} /> Refresh data</button></header>
        <div className="admin-content">
          <div className="admin-page-heading"><div><span className="section-kicker">NILE ANALYTICS LABS</span><h1>{sections.find(item => item[0] === section)?.[1]}</h1><p>Manage your learning platform and monitor activity.</p></div>{section === 'courses' && <button className="btn btn-primary" onClick={startCreate}><Plus size={17} /> Add course</button>}</div>

          {error && <div className="admin-alert error"><AlertCircle size={18} /><span>{error}</span></div>}
          {notice && <div className="admin-alert success"><CheckCircle2 size={18} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16} /></button></div>}

          {section === 'overview' && <>
            <div className="admin-stats-grid">
              <StatCard icon={Users} label="Registered learners" value={loading ? '…' : stats.learners} note="Learner accounts" />
              <StatCard icon={BookOpen} label="Total courses" value={loading ? '…' : stats.courses} note={stats.published + ' published'} />
              <StatCard icon={GraduationCap} label="Enrollments" value={loading ? '…' : stats.enrollments} note="Course registrations" />
              <StatCard icon={FileCheck2} label="Assessments" value={loading ? '…' : stats.assessments} note={stats.submissions + ' submissions'} />
            </div>
            <div className="admin-panel">
              <div className="admin-panel-heading"><div><h2>Course catalogue</h2><p>Your courses and publication status</p></div><button className="admin-text-btn" onClick={() => setSection('courses')}>Manage courses →</button></div>
              {loading ? <p className="admin-muted">Loading platform data…</p> : courses.length === 0 ? <div className="admin-empty"><BookOpen size={28} /><strong>No courses found</strong><span>Run the LMS database setup to add the initial course records.</span></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>COURSE</th><th>CATEGORY</th><th>LEVEL</th><th>STATUS</th></tr></thead><tbody>{courses.slice(0, 6).map(course => <tr key={course.id}><td><strong>{course.title}</strong><small>{course.duration || 'Duration not set'}</small></td><td>{course.category}</td><td>{course.level}</td><td><span className={course.is_published ? 'admin-status published' : 'admin-status draft'}>{course.is_published ? 'Published' : 'Draft'}</span></td></tr>)}</tbody></table></div>}
            </div>
          </>}

          {section === 'courses' && <div className="admin-panel">
            {showForm ? <form className="admin-course-form" onSubmit={saveCourse}>
              <div className="admin-panel-heading"><div><h2>{editingId ? 'Edit course' : 'Create a course'}</h2><p>Course details are stored in your Supabase database.</p></div><button type="button" className="admin-close" onClick={() => setShowForm(false)}><X size={19} /></button></div>
              <div className="admin-form-grid">
                <label>Course title<input required value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="e.g. Excel for Data Analysis" /></label>
                <label>URL slug<input required value={form.slug} onChange={e => updateField('slug', e.target.value)} placeholder="excel-for-data-analysis" /></label>
                <label>Category<select value={form.category} onChange={e => updateField('category', e.target.value)}>{['Excel', 'Stata', 'R Programming', 'SPSS', 'Other'].map(value => <option key={value}>{value}</option>)}</select></label>
                <label>Level<input value={form.level} onChange={e => updateField('level', e.target.value)} placeholder="Beginner / Intermediate" /></label>
                <label>Duration<input value={form.duration} onChange={e => updateField('duration', e.target.value)} placeholder="6 weeks" /></label>
                <label className="admin-checkbox-label"><input type="checkbox" checked={form.is_published} onChange={e => updateField('is_published', e.target.checked)} /> Publish immediately</label>
                <label className="admin-full-field">Description<textarea rows="4" value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="What will learners gain from this course?" /></label>
              </div>
              <div className="admin-form-actions"><button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create course'}</button></div>
            </form> : <>
              <div className="admin-panel-heading"><div><h2>All courses <span className="admin-count">{courses.length}</span></h2><p>Create, update and publish learning programmes.</p></div><div className="admin-search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses" /></div></div>
              {loading ? <p className="admin-muted">Loading courses…</p> : filteredCourses.length === 0 ? <div className="admin-empty"><BookOpen size={28} /><strong>No matching courses</strong><span>Create a course or change your search.</span></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>COURSE</th><th>CATEGORY</th><th>LEVEL</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{filteredCourses.map(course => <tr key={course.id}><td><strong>{course.title}</strong><small>{course.slug}</small></td><td>{course.category}</td><td>{course.level}</td><td><span className={course.is_published ? 'admin-status published' : 'admin-status draft'}>{course.is_published ? 'Published' : 'Draft'}</span></td><td><div className="admin-row-actions"><button title={course.is_published ? 'Unpublish' : 'Publish'} onClick={() => togglePublish(course)}>{course.is_published ? <EyeOff size={16} /> : <Eye size={16} />}</button><button title="Edit course" onClick={() => startEdit(course)}><Pencil size={16} /></button><button title="Delete course" className="danger" onClick={() => deleteCourse(course)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>}
            </>}
          </div>}

          {section === 'learners' && <div className="admin-panel"><div className="admin-panel-heading"><div><h2>Registered learners <span className="admin-count">{learners.length}</span></h2><p>Learner profiles registered on the platform.</p></div><div className="admin-search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search learners" /></div></div>{loading ? <p className="admin-muted">Loading learners…</p> : filteredLearners.length === 0 ? <div className="admin-empty"><Users size={28} /><strong>No learner accounts yet</strong><span>New learner registrations will appear here.</span></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>LEARNER</th><th>PROFILE ID</th><th>REGISTERED</th><th>ROLE</th></tr></thead><tbody>{filteredLearners.map(person => <tr key={person.id}><td><strong>{person.full_name || 'Name not provided'}</strong><small>Profile record</small></td><td><code>{person.id.slice(0, 8)}…</code></td><td>{new Date(person.created_at).toLocaleDateString()}</td><td><span className="admin-status learner">Learner</span></td></tr>)}</tbody></table></div>}</div>}

          {section === 'assessments' && <div className="admin-panel">
            <div className="admin-panel-heading"><div><h2>Assessments <span className="admin-count">{assessments.length}</span></h2><p>Create assignments, publish instructions and review learner submissions.</p></div><button className="btn btn-primary" type="button" onClick={startAssessment}><Plus size={16}/> Create assessment</button></div>
            {showAssessmentForm && <form className="admin-course-form" onSubmit={saveAssessment}>
              <label>Course<select required value={assessmentForm.course_id} onChange={event => setAssessmentForm(current => ({...current, course_id:event.target.value}))}><option value="">Select a course</option>{courses.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
              <label>Assessment title<input required value={assessmentForm.title} onChange={event => setAssessmentForm(current => ({...current, title:event.target.value}))} placeholder="Excel data analysis project"/></label>
              <label>Instructions<textarea required rows="5" value={assessmentForm.instructions} onChange={event => setAssessmentForm(current => ({...current, instructions:event.target.value}))} placeholder="Describe the task, expected deliverables and submission requirements."/></label>
              <label>Total marks<input type="number" min="1" step="1" required value={assessmentForm.total_marks} onChange={event => setAssessmentForm(current => ({...current, total_marks:event.target.value}))}/></label>
              <div className="admin-form-actions"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save as draft'}</button><button className="btn btn-ghost" type="button" onClick={() => setShowAssessmentForm(false)}>Cancel</button></div>
            </form>}
            {loading ? <p className="admin-muted">Loading assessments…</p> : assessments.length === 0 ? <div className="admin-empty"><ClipboardList size={28}/><strong>No assessments created</strong><span>Create a practical assignment for one of your courses.</span></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ASSESSMENT</th><th>COURSE</th><th>STATUS</th><th>CREATED</th><th>ACTION</th></tr></thead><tbody>{assessments.map(item => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.total_marks{'}'} marks</small></td><td>{item.courses?.title || 'Course'}</td><td><span className={item.is_published ? 'admin-status published' : 'admin-status draft'}>{item.is_published ? 'Published' : 'Draft'}</span></td><td>{new Date(item.created_at).toLocaleDateString()}</td><td><button className="btn btn-ghost" type="button" onClick={() => toggleAssessment(item)}>{item.is_published ? <><EyeOff size={14}/> Unpublish</> : <><Eye size={14}/> Publish</>}</button></td></tr>)}</tbody></table></div>}
          </div>}

          {section === 'reports' && <div className="admin-stats-grid"><StatCard icon={Users} label="Learners" value={stats.learners} note="Registered learner profiles" /><StatCard icon={BookOpen} label="Published courses" value={stats.published} note="Visible to learners" /><StatCard icon={GraduationCap} label="Enrollments" value={stats.enrollments} note="All course registrations" /><StatCard icon={FileCheck2} label="Submissions" value={stats.submissions} note="Assessment work submitted" /><div className="admin-panel admin-report-note"><BarChart3 size={23} /><strong>Performance reports are being prepared</strong><span>Course completion rates, learner performance and assessment trends will be calculated once learning activity data is available.</span></div></div>}
          <footer className="admin-footer">Nile Analytics Labs · Analyze today, solve tomorrow.</footer>
        </div>
      </main>
    </div>
  )
}
