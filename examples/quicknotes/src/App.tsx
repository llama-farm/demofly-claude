import { useState } from 'react'

interface Note {
  id: number
  title: string
  body: string
  createdAt: string
}

let nextId = 1

export default function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [search, setSearch] = useState('')

  const addNote = () => {
    if (!title.trim()) return
    const note: Note = {
      id: nextId++,
      title: title.trim(),
      body: body.trim(),
      createdAt: new Date().toLocaleString(),
    }
    setNotes([note, ...notes])
    setTitle('')
    setBody('')
    setSelectedId(note.id)
  }

  const deleteNote = (id: number) => {
    setNotes(notes.filter(n => n.id !== id))
    if (selectedId === id) setSelectedId(null)
    if (editingId === id) setEditingId(null)
  }

  const startEdit = (note: Note) => {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditBody(note.body)
  }

  const saveEdit = () => {
    if (editingId === null) return
    setNotes(notes.map(n =>
      n.id === editingId ? { ...n, title: editTitle.trim(), body: editBody.trim() } : n
    ))
    setEditingId(null)
  }

  const cancelEdit = () => setEditingId(null)

  const filtered = notes.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase())
  )

  const selected = notes.find(n => n.id === selectedId)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-600 text-white px-6 py-4 shadow-md">
        <h1 className="text-2xl font-bold">QuickNotes</h1>
        <p className="text-indigo-200 text-sm">A simple note-taking app</p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search notes..."
              aria-label="Search notes"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Note list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-8">No notes yet</p>
            ) : (
              filtered.map(note => (
                <div
                  key={note.id}
                  onClick={() => setSelectedId(note.id)}
                  className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedId === note.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
                >
                  <h3 className="font-medium text-gray-800 truncate">{note.title}</h3>
                  <p className="text-gray-500 text-xs mt-1 truncate">{note.body || 'No content'}</p>
                  <p className="text-gray-400 text-xs mt-1">{note.createdAt}</p>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* New note form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Create New Note</h2>
            <input
              type="text"
              placeholder="Note title"
              aria-label="Note title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <textarea
              placeholder="Write your note here..."
              aria-label="Note body"
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
            <button
              onClick={addNote}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Add Note
            </button>
          </div>

          {/* Selected note detail */}
          {selected && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {editingId === selected.id ? (
                <>
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">Edit Note</h2>
                  <input
                    type="text"
                    aria-label="Edit title"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <textarea
                    aria-label="Edit body"
                    value={editBody}
                    onChange={e => setEditBody(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                  <div className="flex gap-3">
                    <button onClick={saveEdit} className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition font-medium">Save</button>
                    <button onClick={cancelEdit} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 transition font-medium">Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{selected.title}</h2>
                      <p className="text-gray-400 text-sm">{selected.createdAt}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(selected)} className="bg-amber-500 text-white px-4 py-1.5 rounded-lg hover:bg-amber-600 transition text-sm font-medium">Edit</button>
                      <button onClick={() => deleteNote(selected.id)} className="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 transition text-sm font-medium">Delete</button>
                    </div>
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap">{selected.body || 'No content'}</p>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
