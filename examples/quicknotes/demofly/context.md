# Product Context

**Name:** QuickNotes
**URL:** http://127.0.0.1:4567
**Repository:** examples/quicknotes

## Stack
- Framework: React 19 + Vite 7
- UI Library: Tailwind CSS v4
- State Management: React useState (local)
- Database: None (in-memory)
- Auth: None

## Pages / Routes
- `/` — Single-page app with sidebar note list, create form, and detail view

## Key Features
- Create notes with title and body
- Select note from sidebar to view details
- Edit notes inline (title and body)
- Delete notes
- Search/filter notes by title or body text

## UI Quirks
- All state is in-memory; refreshing loses data
- No loading states or async operations
- Sidebar selection highlights with indigo left border
- Edit mode replaces detail view with form inputs
- aria-labels: "Note title", "Note body", "Search notes", "Edit title", "Edit body"

## Demo Data
- No pre-seeded data; demo creates notes from scratch
