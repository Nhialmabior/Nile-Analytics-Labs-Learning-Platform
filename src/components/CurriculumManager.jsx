import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, X, Save, Layers3, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'

const blankModule = { title: '', description: '' }
const blankLesson = { title: '', content: '', video_url: '', resource_url: '', duration_minutes: 0, is_published: false }

export default function CurriculumManager({ courses = [] }) {
  const [courseId, setCourseId] = useState('')
  const [modules, setModules] = useState([])
  const [lessons, setLessons] = useState([])
  const [moduleForm, setModuleForm] = useState(blankModule)
  const [lessonForm, setLessonForm] = useState(blankLesson)
  const [editingModule, setEditingModule] = useState(null)
  const [editingLesson, setEditingLesson] = useState(null)
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const selectedCourse = courses.find(course => course.id === courseId)
  const selectedModule = modules.find(module => module.id === selectedModuleId)
  const visibleLessons = lessons.filter(lesson => lesson.module_id === selectedModuleId)

  useEffect(() => {
    if (!courseId && courses.length) setCourseId(courses[0].id)
    if (courseId && !courses.some(course => course.id === courseId)) setCourseId(courses[0]?.id || '')
  }, [courses, courseId])

  const loadCurriculum = useCallback(async () => {
    if (!courseId) {
      setModules([])
      setLessons([])
      setSelectedModuleId('')
      return
    }
    setLoading(true)
    setError('')
    const { data: moduleRows, error: moduleError } = await supabase
      .from('course_modules')
      .select('id, course_id, title, description, sort_order, created_at')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true })
    if (moduleError) {
      setError(moduleError.message)
      setLoading(false)
      return
    }
    const rows = moduleRows || []
    setModules(rows)
    const moduleIds = rows.map(module => module.id)
    if (!moduleIds.length) {
      setLessons([])
      setSelectedModuleId('')
      setLoading(false)
      return
    }
    const { data: lessonRows, error: lessonError } = await supabase
      .from('lessons')
      .select('id, module_id, title, content, video_url, resource_url, duration_minutes, sort_order, is_published, created_at')
      .in('module_id', moduleIds)
      .order('sort_order', { ascending: true })
    if (lessonError) {
      setError(lessonError.message)
      setLoading(false)
      return
    }
    setLessons(lessonRows || [])
    setSelectedModuleId(current => moduleIds.includes(current) ? current : moduleIds[0])
    setLoading(false)
  }, [courseId])

  useEffect(() => { loadCurriculum() }, [loadCurriculum])

  function beginModule(module = null) {
    setEditingModule(module?.id || null)
    setModuleForm(module ? { title: module.title, description: module.description || '' } : blankModule)
    setShowModuleForm(true)
    setShowLessonForm(false)
    setError('')
    setNotice('')
  }

  async function saveModule(event) {
    event.preventDefault()
    if (!courseId || !moduleForm.title.trim()) return
    setSaving(true)
    setError('')
    setNotice('')
    const payload = { title: moduleForm.title.trim(), description: moduleForm.description.trim() }
    const result = editingModule
      ? await supabase.from('course_modules').update(payload).eq('id', editingModule)
      : await supabase.from('course_modules').insert({ ...payload, course_id: courseId, sort_order: modules.length })
    if (result.error) setError(result.error.message)
    else {
      setNotice(editingModule ? 'Module updated.' : 'Module created.')
      setShowModuleForm(false)
      setEditingModule(null)
      setModuleForm(blankModule)
      await loadCurriculum()
    }
    setSaving(false)
  }

  async function deleteModule(module) {
    const count = lessons.filter(lesson => lesson.module_id === module.id).length
    if (!window.confirm('Delete "' + module.title + '" and its ' + count + ' lesson(s)? This cannot be undone.')) return
    const { error: deleteError } = await supabase.from('course_modules').delete().eq('id', module.id)
    if (deleteError) setError(deleteError.message)
    else {
      setNotice('Module and its lessons deleted.')
      await loadCurriculum()
    }
  }

  function beginLesson(lesson = null) {
    if (!selectedModuleId) return
    setEditingLesson(lesson?.id || null)
    setLessonForm(lesson ? {
      title: lesson.title,
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      resource_url: lesson.resource_url || '',
      duration_minutes: lesson.duration_minutes || 0,
      is_published: Boolean(lesson.is_published)
    } : blankLesson)
    setShowLessonForm(true)
    setShowModuleForm(false)
    setError('')
    setNotice('')
  }

  async function saveLesson(event) {
    event.preventDefault()
    if (!selectedModuleId || !lessonForm.title.trim()) return
    setSaving(true)
    setError('')
    setNotice('')
    const payload = {
      title: lessonForm.title.trim(),
      content: lessonForm.content.trim(),
      video_url: lessonForm.video_url.trim() || null,
      resource_url: lessonForm.resource_url.trim() || null,
      duration_minutes: Math.max(0, Number(lessonForm.duration_minutes) || 0),
      is_published: Boolean(lessonForm.is_published)
    }
    const result = editingLesson
      ? await supabase.from('lessons').update(payload).eq('id', editingLesson)
      : await supabase.from('lessons').insert({ ...payload, module_id: selectedModuleId, sort_order: visibleLessons.length })
    if (result.error) setError(result.error.message)
    else {
      setNotice(editingLesson ? 'Lesson updated.' : 'Lesson created.')
      setShowLessonForm(false)
      setEditingLesson(null)
      setLessonForm(blankLesson)
      await loadCurriculum()
    }
    setSaving(false)
  }

  async function toggleLesson(lesson) {
    setError('')
    setNotice('')
    const { error: updateError } = await supabase.from('lessons')
      .update({ is_published: !lesson.is_published }).eq('id', lesson.id)
    if (updateError) setError(updateError.message)
    else {
      setNotice(lesson.is_published ? 'Lesson moved to drafts.' : 'Lesson published.')
      await loadCurriculum()
    }
  }

  async function deleteLesson(lesson) {
    if (!window.confirm('Delete "' + lesson.title + '"? Learner progress for this lesson will also be removed.')) return
    const { error: deleteError } = await supabase.from('lessons').delete().eq('id', lesson.id)
    if (deleteError) setError(deleteError.message)
    else {
      setNotice('Lesson deleted.')
      await loadCurriculum()
    }
  }

  async function moveLesson(lesson, direction) {
    const ordered = [...visibleLessons].sort((a, b) => a.sort_order - b.sort_order)
    const index = ordered.findIndex(item => item.id === lesson.id)
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= ordered.length) return
    const next = [...ordered]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    setSaving(true)
    setError('')
    const results = await Promise.all(next.map((item, position) =>
      supabase.from('lessons').update({ sort_order: position }).eq('id', item.id)
    ))
    const failed = results.find(result => result.error)
    if (failed) setError(failed.error.message)
    else {
      setNotice('Lesson order updated.')
      await loadCurriculum()
    }
    setSaving(false)
  }

  return (
    <div className="curriculum-manager">
      <div className="admin-panel">
        <div className="admin-panel-heading">
          <div><h2><Layers3 size={19}/> Curriculum manager</h2><p>Build and organise course modules, lessons, videos and learning resources.</p></div>
          <div className="curriculum-course-picker"><label htmlFor="curriculum-course">Select course</label><select id="curriculum-course" value={courseId} onChange={event => { setCourseId(event.target.value); setShowModuleForm(false); setShowLessonForm(false); setNotice('') }}><option value="">Choose a course</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></div>
        </div>
        {error && <div className="admin-alert error" role="alert">{error}</div>}
        {notice && <div className="admin-alert success" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss"><X size={16}/></button></div>}
        {!courses.length ? <div className="admin-empty"><BookOpen size={28}/><strong>No courses available</strong><span>Create a course first, then return here to build its curriculum.</span></div> : !selectedCourse ? <p className="admin-muted">Choose a course to manage its curriculum.</p> : (
          <>
            <div className="curriculum-summary"><strong>{selectedCourse.title}</strong><span>{modules.length} module(s) · {lessons.length} lesson(s) · {lessons.filter(lesson => lesson.is_published).length} published</span></div>
            <div className="curriculum-layout">
              <section className="curriculum-modules">
                <div className="curriculum-section-head"><h3><Layers3 size={17}/> Modules</h3><button type="button" className="btn btn-primary btn-sm" onClick={() => beginModule()}><Plus size={15}/> Add module</button></div>
                {loading ? <p className="admin-muted">Loading curriculum…</p> : modules.length === 0 ? <div className="admin-empty"><Layers3 size={25}/><strong>No modules yet</strong><span>Add the first module for this course.</span></div> : modules.map((module, index) => (
                  <article key={module.id} className={selectedModuleId === module.id ? 'curriculum-module active' : 'curriculum-module'}>
                    <button type="button" className="curriculum-module-select" onClick={() => { setSelectedModuleId(module.id); setShowLessonForm(false); setShowModuleForm(false) }}><span className="curriculum-module-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{module.title}</strong><small>{lessons.filter(lesson => lesson.module_id === module.id).length} lesson(s)</small></span></button>
                    <div className="curriculum-module-actions"><button type="button" title="Edit module" onClick={() => beginModule(module)}><Pencil size={14}/></button><button type="button" title="Delete module" onClick={() => deleteModule(module)}><Trash2 size={14}/></button></div>
                  </article>
                ))}
                {showModuleForm && <form className="curriculum-editor" onSubmit={saveModule}><div className="curriculum-editor-head"><strong>{editingModule ? 'Edit module' : 'New module'}</strong><button type="button" onClick={() => setShowModuleForm(false)} aria-label="Close"><X size={16}/></button></div><label>Module title<input required maxLength={140} value={moduleForm.title} onChange={event => setModuleForm(current => ({ ...current, title: event.target.value }))}/></label><label>Description<textarea rows="3" value={moduleForm.description} onChange={event => setModuleForm(current => ({ ...current, description: event.target.value }))}/></label><button className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save module'} <Save size={14}/></button></form>}
              </section>
              <section className="curriculum-lessons">
                <div className="curriculum-section-head"><div><h3><FileText size={17}/> Lessons</h3><p>{selectedModule?.title || 'Select a module to view its lessons'}</p></div><button type="button" className="btn btn-primary btn-sm" disabled={!selectedModuleId} onClick={() => beginLesson()}><Plus size={15}/> Add lesson</button></div>
                {loading ? <p className="admin-muted">Loading lessons…</p> : !selectedModuleId ? <div className="admin-empty"><FileText size={25}/><strong>Select a module</strong><span>Choose a module to add or manage lessons.</span></div> : visibleLessons.length === 0 ? <div className="admin-empty"><FileText size={25}/><strong>No lessons in this module</strong><span>Add a lesson with written content, a video or downloadable resource.</span></div> : visibleLessons.map((lesson, index) => (
                  <article key={lesson.id} className="curriculum-lesson">
                    <div className="curriculum-lesson-main"><span className="curriculum-module-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{lesson.title}</strong><small>{lesson.duration_minutes ? lesson.duration_minutes + ' min · ' : ''}{lesson.video_url ? 'Video · ' : ''}{lesson.resource_url ? 'Resource · ' : ''}<span className={lesson.is_published ? 'curriculum-published' : 'curriculum-draft'}>{lesson.is_published ? 'Published' : 'Draft'}</span></small></div></div>
                    <div className="curriculum-lesson-actions"><button type="button" title="Move up" disabled={saving || index === 0} onClick={() => moveLesson(lesson, -1)}><ChevronUp size={15}/></button><button type="button" title="Move down" disabled={saving || index === visibleLessons.length - 1} onClick={() => moveLesson(lesson, 1)}><ChevronDown size={15}/></button><button type="button" title="Edit lesson" onClick={() => beginLesson(lesson)}><Pencil size={14}/></button><button type="button" title={lesson.is_published ? 'Unpublish lesson' : 'Publish lesson'} onClick={() => toggleLesson(lesson)}>{lesson.is_published ? <EyeOff size={14}/> : <Eye size={14}/>}</button><button type="button" title="Delete lesson" className="danger" onClick={() => deleteLesson(lesson)}><Trash2 size={14}/></button></div>
                  </article>
                ))}
                {showLessonForm && <form className="curriculum-editor curriculum-lesson-editor" onSubmit={saveLesson}><div className="curriculum-editor-head"><strong>{editingLesson ? 'Edit lesson' : 'New lesson'}</strong><button type="button" onClick={() => setShowLessonForm(false)} aria-label="Close"><X size={16}/></button></div><label>Lesson title<input required maxLength={160} value={lessonForm.title} onChange={event => setLessonForm(current => ({ ...current, title: event.target.value }))}/></label><label>Lesson content<textarea rows="8" value={lessonForm.content} onChange={event => setLessonForm(current => ({ ...current, content: event.target.value }))} placeholder="Write the lesson notes and instructions here. Plain text and line breaks are supported."/></label><div className="curriculum-editor-grid"><label>Video URL<input type="url" value={lessonForm.video_url} onChange={event => setLessonForm(current => ({ ...current, video_url: event.target.value }))} placeholder="https://www.youtube.com/watch?v=..."/></label><label>Resource URL<input type="url" value={lessonForm.resource_url} onChange={event => setLessonForm(current => ({ ...current, resource_url: event.target.value }))} placeholder="https://..."/></label><label>Duration (minutes)<input type="number" min="0" step="1" value={lessonForm.duration_minutes} onChange={event => setLessonForm(current => ({ ...current, duration_minutes: event.target.value }))}/></label><label className="curriculum-publish-toggle"><input type="checkbox" checked={lessonForm.is_published} onChange={event => setLessonForm(current => ({ ...current, is_published: event.target.checked }))}/> Publish this lesson</label></div><div className="admin-form-actions"><button type="button" className="btn btn-ghost" onClick={() => setShowLessonForm(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save lesson'} <Save size={15}/></button></div></form>}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
