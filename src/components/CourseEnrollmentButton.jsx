import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function CourseEnrollmentButton({ course, className = 'btn btn-primary full', autoEnroll = false }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [courseId, setCourseId] = useState('')
  const [status, setStatus] = useState(user ? 'checking' : 'guest')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const autoAttempted = useRef(false)

  useEffect(() => {
    let active = true

    async function loadEnrollment() {
      if (!user?.id) {
        setStatus('guest')
        setCourseId('')
        return
      }

      setStatus('checking')
      setError('')

      const { data: courseRow, error: courseError } = await supabase
        .from('courses')
        .select('id, is_published')
        .eq('slug', course.slug)
        .maybeSingle()

      if (!active) return
      if (courseError || !courseRow || !courseRow.is_published) {
        setStatus('unavailable')
        setError(courseError?.message || 'This course is not available for enrolment yet.')
        return
      }

      setCourseId(courseRow.id)
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('course_id', courseRow.id)
        .eq('learner_id', user.id)
        .maybeSingle()

      if (!active) return
      if (enrollmentError) {
        setStatus('unavailable')
        setError(enrollmentError.message)
      } else {
        setStatus(enrollment?.status || 'not-enrolled')
      }
    }

    loadEnrollment()
    return () => { active = false }
  }, [course.slug, user?.id])

  const enrol = useCallback(async () => {
    if (!user?.id) {
      navigate('/login', {
        state: {
          from: {
            pathname: location.pathname.startsWith('/courses/') ? location.pathname : `/courses/${course.slug}`,
            state: { autoEnrollSlug: course.slug }
          }
        }
      })
      return
    }

    if (status === 'active' || status === 'completed') {
      navigate(`/learning/${course.slug}`)
      return
    }
    if (status === 'cancelled' || !courseId || busy) return

    setBusy(true)
    setError('')
    const { error: insertError } = await supabase.from('enrollments').insert({
      course_id: courseId,
      learner_id: user.id
    })

    if (insertError) {
      // A second click or an existing row should never create a duplicate enrolment.
      const { data: existing, error: lookupError } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('course_id', courseId)
        .eq('learner_id', user.id)
        .maybeSingle()

      if (!lookupError && existing && ['active', 'completed'].includes(existing.status)) {
        setStatus(existing.status)
        setBusy(false)
        navigate(`/learning/${course.slug}`)
        return
      }

      setError(lookupError?.message || insertError.message)
      setBusy(false)
      return
    }

    setStatus('active')
    setBusy(false)
    navigate(`/learning/${course.slug}`)
  }, [busy, course.slug, courseId, location.pathname, navigate, status, user?.id])

  useEffect(() => {
    if (autoEnroll && status === 'not-enrolled' && !autoAttempted.current) {
      autoAttempted.current = true
      enrol()
    }
  }, [autoEnroll, enrol, status])

  const enrolled = status === 'active' || status === 'completed'
  const disabled = busy || status === 'checking' || status === 'unavailable' || status === 'cancelled'

  let label = 'Enrol now'
  if (status === 'guest') label = 'Sign in to enrol'
  if (status === 'checking') label = 'Checking enrolment…'
  if (busy) label = 'Enrolling…'
  if (enrolled) label = 'Open course dashboard'
  if (status === 'cancelled') label = 'Enrolment cancelled'
  if (status === 'unavailable') label = 'Currently unavailable'

  return (
    <div className="course-enrol-action">
      <button type="button" className={className} onClick={enrol} disabled={disabled}>
        {status === 'checking' || busy
          ? <LoaderCircle className="learning-spinner" size={16}/>
          : enrolled ? <CheckCircle2 size={16}/> : <ArrowRight size={16}/>}
        {label}
      </button>
      {error && <small className="course-enrol-error" role="alert">{error}</small>}
    </div>
  )
}
