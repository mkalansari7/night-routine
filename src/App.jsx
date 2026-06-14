import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const routine = [
  {
    id: 1,
    name: 'Cat-Cow',
    type: 'mobility',
    duration: 60,
    reps: '8-10 slow reps',
    focus: 'Lumbar spine',
    cue: 'Inhale as you arch (cow), exhale as you round (cat). Move slowly with your breath.',
    emoji: '🐄',
  },
  {
    id: 2,
    name: "Child's Pose",
    type: 'stretch',
    duration: 45,
    reps: 'Hold 45s',
    focus: 'Lower back, hips',
    cue: 'Sink your hips back to heels, arms stretched forward. Breathe into your lower back.',
    emoji: '🧘',
  },
  {
    id: 3,
    name: 'Hip Flexor Stretch',
    type: 'stretch',
    duration: 60,
    reps: '30s each side',
    focus: 'Hip flexors',
    cue: 'Low lunge position. Tuck your pelvis slightly forward until you feel a deep front-hip stretch.',
    emoji: '🦵',
  },
  {
    id: 4,
    name: 'Figure-4 Piriformis',
    type: 'stretch',
    duration: 60,
    reps: '30s each side',
    focus: 'Glutes, piriformis',
    cue: 'Lie on your back, cross one ankle over the opposite knee. Pull the legs toward your chest.',
    emoji: '4️⃣',
  },
  {
    id: 5,
    name: 'Dead Bug',
    type: 'core',
    duration: 60,
    reps: '8 reps each side',
    focus: 'Deep core, stability',
    cue: 'Press lower back firmly into floor. Slowly extend opposite arm and leg without letting your back lift.',
    emoji: '🐛',
  },
  {
    id: 6,
    name: 'Glute Bridge',
    type: 'core',
    duration: 60,
    reps: '12-15 reps',
    focus: 'Glutes, lower back',
    cue: "Drive through heels, squeeze glutes at top. Hold 2 seconds before lowering. Don't overarch.",
    emoji: '🌉',
  },
  {
    id: 7,
    name: 'Plank Hold',
    type: 'core',
    duration: 60,
    reps: 'Hold 60s',
    focus: 'Full core',
    cue: "Elbows under shoulders. Squeeze glutes and abs together. Don't let hips sag or rise.",
    emoji: '💪',
  },
  {
    id: 8,
    name: 'Seated Hamstring Stretch',
    type: 'stretch',
    duration: 45,
    reps: 'Hold 45s',
    focus: 'Hamstrings',
    cue: 'Sit on floor, legs straight. Hinge from hips (not waist) and reach toward feet. Keep back flat.',
    emoji: '🙆',
  },
  {
    id: 9,
    name: 'Supine Spinal Twist',
    type: 'stretch',
    duration: 60,
    reps: '30s each side',
    focus: 'Thoracic spine, glutes',
    cue: 'Lie on back, pull one knee across your body. Keep both shoulders flat on the floor.',
    emoji: '🌀',
  },
]

const colors = {
  mobility: { bg: '#1a2a1a', border: '#2d5a2d', text: '#7fcd7f' },
  stretch: { bg: '#1a1a2e', border: '#2d2d5a', text: '#8080ff' },
  core: { bg: '#2a1a1a', border: '#5a2d2d', text: '#ff8080' },
}

const typeLabel = {
  mobility: 'Mobility',
  stretch: 'Stretch',
  core: 'Core',
}

function formatTime(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const remainingSeconds = String(seconds % 60).padStart(2, '0')

  return `${minutes}:${remainingSeconds}`
}

function createAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext

  return AudioContext ? new AudioContext() : null
}

function playDoneBeep(audioContext) {
  if (!audioContext || audioContext.state === 'closed') return

  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }

  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  const now = audioContext.currentTime

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(880, now)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)

  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.5)
}

function needsSideSwitchBeep(exercise) {
  return exercise.duration === 60 && exercise.reps === '30s each side'
}

function TypeBadge({ type }) {
  const color = colors[type]

  return (
    <span
      className="badge"
      style={{
        background: color.bg,
        borderColor: color.border,
        color: color.text,
      }}
    >
      {typeLabel[type]}
    </span>
  )
}

function App() {
  const audioContextRef = useRef(null)
  const [screen, setScreen] = useState('overview')
  const [current, setCurrent] = useState(0)
  const [timeLeft, setTimeLeft] = useState(routine[0].duration)
  const [running, setRunning] = useState(false)

  const exercise = routine[current]
  const color = colors[exercise.type]
  const typeCounts = useMemo(
    () =>
      Object.keys(typeLabel).map((type) => ({
        type,
        count: routine.filter((item) => item.type === type).length,
      })),
    [],
  )

  useEffect(() => {
    if (!running) return undefined

    const intervalId = window.setInterval(() => {
      setTimeLeft((seconds) => {
        if (seconds <= 1) {
          playDoneBeep(audioContextRef.current)
          setRunning(false)
          return 0
        }

        if (needsSideSwitchBeep(exercise) && seconds === 31) {
          playDoneBeep(audioContextRef.current)
        }

        return seconds - 1
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [exercise, running])

  function primeAudio() {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = createAudioContext()
    }

    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume()
    }
  }

  function toggleTimer() {
    primeAudio()
    setRunning((isRunning) => !isRunning)
  }

  function startRoutine() {
    setScreen('active')
    setCurrent(0)
    setTimeLeft(routine[0].duration)
    setRunning(false)
  }

  function resetTimer() {
    setTimeLeft(exercise.duration)
    setRunning(false)
  }

  function goNext() {
    setRunning(false)

    if (current === routine.length - 1) {
      setScreen('done')
      return
    }

    const next = current + 1
    setCurrent(next)
    setTimeLeft(routine[next].duration)
  }

  function goBack() {
    if (current === 0) return

    const previous = current - 1
    setCurrent(previous)
    setTimeLeft(routine[previous].duration)
    setRunning(false)
  }

  if (screen === 'done') {
    return (
      <main className="done-screen">
        <div className="done-emoji" aria-hidden="true">
          🌙
        </div>
        <h1 className="done-title">Routine Complete</h1>
        <p className="done-sub">
          Great work. Do this consistently every night and you&apos;ll feel a
          real difference in 2-3 weeks.
        </p>

        <section className="done-list" aria-label="Tonight's session">
          <div className="done-list-label">Tonight&apos;s session</div>
          {routine.map((item) => (
            <div className="done-item" key={item.id}>
              <span className="done-check" aria-hidden="true">
                ✓
              </span>
              <span className="done-name">{item.name}</span>
              <span className="done-reps">{item.reps}</span>
            </div>
          ))}
        </section>

        <button
          className="btn-primary"
          type="button"
          onClick={() => setScreen('overview')}
        >
          Back to Overview
        </button>
      </main>
    )
  }

  if (screen === 'active') {
    const circumference = 2 * Math.PI * 54
    const progress = (exercise.duration - timeLeft) / exercise.duration
    const offset = circumference - progress * circumference
    const timerLabel =
      running ? 'Pause' : timeLeft === exercise.duration ? 'Start Timer' : 'Resume'

    return (
      <main className="screen screen-active">
        <div className="progress-bar" aria-hidden="true">
          {routine.map((item, index) => (
            <div
              className="progress-seg"
              key={item.id}
              style={{
                background:
                  index < current
                    ? '#e8e8e8'
                    : index === current
                      ? color.text
                      : '#2a2a2a',
              }}
            />
          ))}
        </div>

        <header className="active-header">
          <span className="ex-counter">
            {current + 1} / {routine.length}
          </span>
          <TypeBadge type={exercise.type} />
        </header>

        <section className="ex-hero">
          <div className="ex-emoji" aria-hidden="true">
            {exercise.emoji}
          </div>
          <h1 className="ex-title">{exercise.name}</h1>
          <p className="ex-focus">{exercise.focus}</p>
        </section>

        <div className="timer-wrap">
          <div className="timer-inner">
            <svg width="130" height="130" aria-hidden="true">
              <circle
                cx="65"
                cy="65"
                r="54"
                fill="none"
                stroke="#1e1e1e"
                strokeWidth="8"
              />
              <circle
                cx="65"
                cy="65"
                r="54"
                fill="none"
                stroke={color.text}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                strokeWidth="8"
              />
            </svg>
            <div className="timer-text">
              <span className="timer-digits">{formatTime(timeLeft)}</span>
              <span className="timer-reps">{exercise.reps}</span>
            </div>
          </div>
        </div>

        <section className="cue-box">
          <div className="cue-label">Coaching cue</div>
          <p className="cue-text">{exercise.cue}</p>
        </section>

        <div className="controls-row">
          <button className="btn-reset" type="button" onClick={resetTimer}>
            Reset
          </button>
          <button
            className="btn-timer"
            type="button"
            onClick={toggleTimer}
            style={{
              background: running ? '#2a2a2a' : color.text,
              color: running ? '#e8e8e8' : '#0d0d0d',
            }}
          >
            {timerLabel}
          </button>
        </div>

        <div className="btn-nav-row">
          <button
            className="btn-back"
            disabled={current === 0}
            type="button"
            onClick={goBack}
          >
            Back
          </button>
          <button className="btn-next" type="button" onClick={goNext}>
            {current === routine.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="screen">
      <p className="eyebrow">Night Routine</p>
      <h1>Flexibility &amp; Core</h1>
      <p className="subtitle">9 exercises · ~13 minutes</p>

      <section className="type-cards" aria-label="Routine categories">
        {typeCounts.map(({ type, count }) => {
          const typeColor = colors[type]

          return (
            <div
              className="type-card"
              key={type}
              style={{
                background: typeColor.bg,
                borderColor: typeColor.border,
              }}
            >
              <div className="type-label" style={{ color: typeColor.text }}>
                {typeLabel[type]}
              </div>
              <div className="type-count">{count} moves</div>
            </div>
          )
        })}
      </section>

      <section className="exercise-list" aria-label="Exercises">
        {routine.map((item) => {
          const itemColor = colors[item.type]

          return (
            <article className="exercise-row" key={item.id}>
              <div
                className="ex-icon"
                aria-hidden="true"
                style={{
                  background: itemColor.bg,
                  borderColor: itemColor.border,
                }}
              >
                {item.emoji}
              </div>
              <div className="exercise-copy">
                <h2 className="ex-name">{item.name}</h2>
                <p className="ex-meta">
                  {item.focus} · {item.reps}
                </p>
              </div>
              <TypeBadge type={item.type} />
            </article>
          )
        })}
      </section>

      <button className="btn-primary" type="button" onClick={startRoutine}>
        Start Routine
      </button>
    </main>
  )
}

export default App
