"use client"

import { Book, Coffee, Pause, Play, RotateCcw, Settings } from "lucide-react"
import { useCallback, useEffect, useState, useRef } from "react"

type TimerMode = "work" | "shortBreak" | "longBreak"

const PomodoroTimer = () => {
  const [time, setTime] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<TimerMode>("work")
  const [cycles, setCycles] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
  })

  const audioContextRef = useRef<AudioContext | null>(null)
  const tickIntervalRef = useRef<number | null>(null)

  const playTick = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }

    const audioContext = audioContextRef.current
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime) // Higher frequency for a crisp tick
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.03, audioContext.currentTime + 0.01) // Very low volume
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05) // Short duration

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.05)
  }, [])

  const startTickingSound = useCallback(() => {
    if (tickIntervalRef.current) return // Already ticking

    tickIntervalRef.current = window.setInterval(() => {
      playTick()
    }, 1000) // Play tick every second
  }, [playTick])

  const stopTickingSound = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current)
      tickIntervalRef.current = null
    }
  }, [])

  const handleTimerComplete = useCallback(() => {
    let nextMode: TimerMode
    let nextTime: number

    if (mode === "work") {
      setCycles((prevCycles) => prevCycles + 1)
      if (cycles + 1 >= settings.longBreakInterval) {
        nextMode = "longBreak"
        nextTime = settings.longBreak * 60
        setCycles(0)
      } else {
        nextMode = "shortBreak"
        nextTime = settings.shortBreak * 60
      }
    } else {
      nextMode = "work"
      nextTime = settings.work * 60
    }

    setMode(nextMode)
    setTime(nextTime)
    new Audio("/notification.mp3").play()
  }, [mode, cycles, settings])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1)
      }, 1000)
      startTickingSound()
    } else if (time === 0) {
      handleTimerComplete()
      stopTickingSound()
    } else {
      stopTickingSound()
    }

    return () => {
      if (interval) clearInterval(interval)
      stopTickingSound()
    }
  }, [isActive, time, handleTimerComplete, startTickingSound, stopTickingSound])

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setTime(settings.work * 60)
    setMode("work")
    setCycles(0)
    stopTickingSound()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSettingChange = (setting: keyof typeof settings, value: number) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      [setting]: value,
    }))
  }

  const progressPercentage = () => {
    const totalTime = settings[mode] * 60
    return ((totalTime - time) / totalTime) * 100
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-3xl font-bold mb-6 text-center">Pomodoro Timer</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="relative w-64 h-64 mx-auto mb-6">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-gray-200 stroke-current"
              strokeWidth="5"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
            ></circle>
            <circle
              className="text-blue-500 stroke-current"
              strokeWidth="5"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progressPercentage()) / 100}
              transform="rotate(-90 50 50)"
            ></circle>
          </svg>
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold">{formatTime(time)}</span>
          </div>
        </div>

        <div className="flex justify-center space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded ${mode === "work" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => {
              setMode("work")
              setTime(settings.work * 60)
            }}
          >
            <Book size={20} className="inline-block mr-2" />
            Work
          </button>
          <button
            className={`px-4 py-2 rounded ${mode === "shortBreak" ? "bg-green-500 text-white" : "bg-gray-200"}`}
            onClick={() => {
              setMode("shortBreak")
              setTime(settings.shortBreak * 60)
            }}
          >
            <Coffee size={20} className="inline-block mr-2" />
            Short Break
          </button>
          <button
            className={`px-4 py-2 rounded ${mode === "longBreak" ? "bg-indigo-500 text-white" : "bg-gray-200"}`}
            onClick={() => {
              setMode("longBreak")
              setTime(settings.longBreak * 60)
            }}
          >
            <Coffee size={20} className="inline-block mr-2" />
            Long Break
          </button>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            className={`p-2 rounded-full ${
              isActive ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
            } text-white`}
            onClick={toggleTimer}
          >
            {isActive ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300" onClick={resetTimer}>
            <RotateCcw size={24} />
          </button>
          <button
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={24} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Work Duration (minutes)</label>
              <input
                type="number"
                value={settings.work}
                onChange={(e) => handleSettingChange("work", Number.parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Short Break Duration (minutes)</label>
              <input
                type="number"
                value={settings.shortBreak}
                onChange={(e) => handleSettingChange("shortBreak", Number.parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Long Break Duration (minutes)</label>
              <input
                type="number"
                value={settings.longBreak}
                onChange={(e) => handleSettingChange("longBreak", Number.parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Long Break Interval (cycles)</label>
              <input
                type="number"
                value={settings.longBreakInterval}
                onChange={(e) => handleSettingChange("longBreakInterval", Number.parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PomodoroTimer

