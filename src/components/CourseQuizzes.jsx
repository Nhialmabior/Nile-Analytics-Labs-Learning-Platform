import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CircleHelp, ClipboardCheck, LoaderCircle, RotateCcw } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function CourseQuizzes({ courseId, userId }) {
  const [quizzes, setQuizzes] = useState([])
  const [questions, setQuestions] = useState({})
  const [attempts, setAttempts] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      if (!courseId || !userId) return
      setLoading(true)
      const [quizRes, attemptRes] = await Promise.all([
        supabase.from('quizzes').select('id,title,description,pass_mark,sort_order').eq('course_id', courseId).eq('is_published', true).order('sort_order'),
        supabase.from('quiz_attempts').select('id,quiz_id,score,total_questions,correct_answers,passed,submitted_at').eq('learner_id', userId).order('submitted_at', { ascending: false })
      ])
      if (!active) return
      if (quizRes.error || attemptRes.error) {
        setError((quizRes.error || attemptRes.error).message)
        setLoading(false)
        return
      }
      const quizRows = quizRes.data || []
      setQuizzes(quizRows)
      setAttempts(attemptRes.data || [])
      setSelectedId(current => current || quizRows[0]?.id || '')
      if (quizRows.length) {
        const { data, error: questionError } = await supabase.from('quiz_questions')
          .select('id,quiz_id,question_text,options,explanation,sort_order')
          .in('quiz_id', quizRows.map(item => item.id)).order('sort_order')
        if (!active) return
        if (questionError) setError(questionError.message)
        else {
          const grouped = (data || []).reduce((all, question) => {
            all[question.quiz_id] ||= []
            all[question.quiz_id].push(question)
            return all
          }, {})
          setQuestions(grouped)
        }
      }
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [courseId, userId])

  const selectedQuiz = quizzes.find(quiz => quiz.id === selectedId)
  const selectedQuestions = useMemo(() => questions[selectedId] || [], [questions, selectedId])
  const latestAttempt = attempts.find(attempt => attempt.quiz_id === selectedId)

  function chooseQuiz(id) {
    setSelectedId(id)
    setAnswers({})
    setResult(null)
    setError('')
  }

  async function submitQuiz() {
    if (!selectedQuiz || selectedQuestions.length === 0) return
    if (selectedQuestions.some(question => answers[question.id] === undefined)) {
      setError('Please answer every question before submitting.')
      return
    }
    setSubmitting(true)
    setError('')
    const payload = selectedQuestions.map(question => ({
      question_id: question.id,
      selected_option: Number(answers[question.id])
    }))
    const { data, error: submitError } = await supabase.rpc('submit_quiz_attempt', {
      p_quiz_id: selectedQuiz.id,
      p_answers: payload
    })
    if (submitError) setError(submitError.message)
    else {
      const attempt = Array.isArray(data) ? data[0] : data
      setResult(attempt)
      setAttempts(previous => [attempt, ...previous])
    }
    setSubmitting(false)
  }

  if (loading) return <section className="course-quiz-panel"><LoaderCircle className="learning-spinner"/><span>Loading course quizzes…</span></section>
  if (error && quizzes.length === 0) return <section className="course-quiz-panel"><strong>Quizzes are not ready</strong><p>{error}</p></section>
  if (!quizzes.length) return null

  return (
    <section className="course-quiz-panel">
      <div className="course-quiz-heading">
        <span className="section-kicker">KNOWLEDGE CHECKS</span>
        <h2>Test what you have learned</h2>
        <p>Complete short quizzes and receive your score immediately. Correct answers remain protected on the server.</p>
      </div>
      <div className="course-quiz-tabs">
        {quizzes.map((quiz, index) => (
          <button type="button" key={quiz.id} className={selectedId === quiz.id ? 'course-quiz-tab active' : 'course-quiz-tab'} onClick={() => chooseQuiz(quiz.id)}>
            <span>0{index + 1}</span>{quiz.title}
            {attempts.some(attempt => attempt.quiz_id === quiz.id) && <CheckCircle2 size={15}/>}
          </button>
        ))}
      </div>
      {selectedQuiz && <div className="course-quiz-body">
        <div className="course-quiz-meta"><div><h3>{selectedQuiz.title}</h3><p>{selectedQuiz.description}</p></div><span>Pass mark: {selectedQuiz.pass_mark}%</span></div>
        {result && <div className={result.passed ? 'quiz-result passed' : 'quiz-result'}>
          <div><strong>{result.passed ? 'Well done — you passed!' : 'Keep practising and try again.'}</strong><span>{result.correct_answers} correct out of {result.total_questions}</span></div>
          <b>{Number(result.score).toFixed(0)}%</b>
          <button type="button" onClick={() => { setAnswers({}); setResult(null) }}><RotateCcw size={15}/> Retake quiz</button>
        </div>}
        {!result && selectedQuestions.map((question, index) => (
          <fieldset className="course-quiz-question" key={question.id}>
            <legend><span>Question {index + 1}</span>{question.question_text}</legend>
            <div className="course-quiz-options">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className={Number(answers[question.id]) === optionIndex ? 'selected' : ''}>
                  <input type="radio" name={question.id} value={optionIndex} checked={Number(answers[question.id]) === optionIndex} onChange={() => setAnswers(current => ({ ...current, [question.id]: optionIndex }))}/>
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        {!result && selectedQuestions.length > 0 && <button type="button" className="btn btn-primary" disabled={submitting} onClick={submitQuiz}>{submitting ? 'Marking your answers…' : 'Submit answers and view score'} <ClipboardCheck size={17}/></button>}
        {latestAttempt && !result && <p className="quiz-last-attempt">Previous attempt: {Number(latestAttempt.score).toFixed(0)}% · {latestAttempt.passed ? 'Passed' : 'Not passed'} · {new Date(latestAttempt.submitted_at).toLocaleDateString()}</p>}
        {error && <p className="lesson-inline-error">{error}</p>}
      </div>}
    </section>
  )
}
