"use client"

import { useState } from "react"
import { PlusCircle, Book, Edit, Trash2, ChevronDown, ChevronUp, Search } from "lucide-react"

interface ErrorEntry {
  id: number
  subject: string
  topic: string
  mistake: string
  correction: string
  date: string
  tags: string[]
}

const DigitalErrorNotebook = () => {
  const [errors, setErrors] = useState<ErrorEntry[]>([
    {
      id: 1,
      subject: "Mathematics",
      topic: "Calculus",
      mistake: "Forgot to apply chain rule in differentiation",
      correction: "Always check for composite functions and apply chain rule",
      date: "2023-06-15",
      tags: ["calculus", "differentiation"],
    },
    {
      id: 2,
      subject: "Physics",
      topic: "Mechanics",
      mistake: "Used wrong formula for centripetal force",
      correction: "Centripetal force formula is F = mv²/r",
      date: "2023-06-14",
      tags: ["mechanics", "forces"],
    },
  ])

  const [newError, setNewError] = useState<Omit<ErrorEntry, "id">>({
    subject: "",
    topic: "",
    mistake: "",
    correction: "",
    date: new Date().toISOString().split("T")[0],
    tags: [],
  })

  const [editingErrorId, setEditingErrorId] = useState<number | null>(null)
  const [expandedErrorId, setExpandedErrorId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const addError = () => {
    if (newError.subject && newError.topic && newError.mistake && newError.correction) {
      setErrors([...errors, { ...newError, id: Date.now() }])
      setNewError({
        subject: "",
        topic: "",
        mistake: "",
        correction: "",
        date: new Date().toISOString().split("T")[0],
        tags: [],
      })
    }
  }

  const updateError = (id: number, updatedError: Partial<ErrorEntry>) => {
    setErrors(errors.map((error) => (error.id === id ? { ...error, ...updatedError } : error)))
  }

  const deleteError = (id: number) => {
    setErrors(errors.filter((error) => error.id !== id))
  }

  const toggleExpand = (id: number) => {
    setExpandedErrorId(expandedErrorId === id ? null : id)
  }

  const filteredErrors = errors.filter(
    (error) =>
      error.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.mistake.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Digital Error Notebook</h1>

      {/* Add New Error Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Log New Error</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Subject"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newError.subject}
            onChange={(e) => setNewError({ ...newError, subject: e.target.value })}
          />
          <input
            type="text"
            placeholder="Topic"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newError.topic}
            onChange={(e) => setNewError({ ...newError, topic: e.target.value })}
          />
          <textarea
            placeholder="Mistake"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newError.mistake}
            onChange={(e) => setNewError({ ...newError, mistake: e.target.value })}
          />
          <textarea
            placeholder="Correction"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newError.correction}
            onChange={(e) => setNewError({ ...newError, correction: e.target.value })}
          />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newError.tags.join(", ")}
            onChange={(e) => setNewError({ ...newError, tags: e.target.value.split(",").map((tag) => tag.trim()) })}
          />
          <div className="flex items-center">
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newError.date}
              onChange={(e) => setNewError({ ...newError, date: e.target.value })}
            />
            <button
              onClick={addError}
              className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 transition-colors"
            >
              <PlusCircle size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search errors..."
          className="w-full px-3 py-2 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
      </div>

      {/* Errors List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Error Log</h2>
        <div className="space-y-4">
          {filteredErrors.map((error) => (
            <div key={error.id} className="border-b pb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">
                  {error.subject} - {error.topic}
                </h3>
                <div className="flex space-x-2">
                  <button onClick={() => setEditingErrorId(error.id)} className="text-blue-500 hover:text-blue-700">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => deleteError(error.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                  <button onClick={() => toggleExpand(error.id)} className="text-gray-500 hover:text-gray-700">
                    {expandedErrorId === error.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>
              {editingErrorId === error.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={error.mistake}
                    onChange={(e) => updateError(error.id, { mistake: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={error.correction}
                    onChange={(e) => updateError(error.id, { correction: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setEditingErrorId(null)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-red-500">
                    <Book className="inline mr-2" size={18} /> Mistake: {error.mistake}
                  </p>
                  {expandedErrorId === error.id && (
                    <div className="mt-2">
                      <p className="text-green-500">
                        <Book className="inline mr-2" size={18} /> Correction: {error.correction}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Date: {error.date}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {error.tags.map((tag, index) => (
                          <span key={index} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DigitalErrorNotebook

