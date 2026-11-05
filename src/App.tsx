// CampusSprint — Mobile-First Kanban Board
// Architecture: Client-Side SPA, mobile container max-w-md centered on desktop
// See PRD §4 for technical spec

function App() {
  return (
    // Mobile-first container: full-width on mobile, max-w-md centered on desktop
    <div className="app-container">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-indigo-600 tracking-tight">
            🚀 CampusSprint
          </span>
        </div>
      </header>

      <main className="p-4">
        <p className="text-slate-500 text-sm text-center mt-8">
          Project initialized. Components coming soon.
        </p>
      </main>
    </div>
  )
}

export default App
