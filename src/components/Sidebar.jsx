import { useState } from 'react';

const NAV = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'add',
    label: 'Add Entry',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
];

export default function Sidebar({ active, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function navigate(v) {
    onNavigate(v);
    setMobileOpen(false);
  }

  return (
    <>
      {/* ── Mobile top bar (visible below md) ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-slate-900 text-white px-4 py-3 shadow-lg">
        <Brand />
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="p-2 rounded-lg hover:bg-slate-700 active:bg-slate-600 transition-colors touch-manipulation"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* ── Spacer so content doesn't hide under fixed mobile bar ── */}
      <div className="md:hidden h-[52px] shrink-0" />

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile slide-in drawer ── */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-slate-900 z-50 shadow-2xl
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Navigation menu"
      >
        <NavContent active={active} onNavigate={navigate} showClose onClose={() => setMobileOpen(false)} />
      </aside>

      {/* ── Desktop sidebar (visible from md up) ── */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-900 min-h-screen shrink-0">
        <NavContent active={active} onNavigate={onNavigate} />
      </aside>
    </>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <div className="leading-tight min-w-0">
        <p className="text-white font-semibold text-sm tracking-wide truncate">InvenTrack</p>
        <p className="text-slate-400 text-xs truncate">Management System</p>
      </div>
    </div>
  );
}

function NavContent({ active, onNavigate, showClose, onClose }) {
  return (
    <div className="flex flex-col h-full text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700 shrink-0">
        <Brand />
        {showClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors ml-2 shrink-0"
            aria-label="Close menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium
              transition-colors touch-manipulation
              ${active === item.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white active:bg-slate-600'
              }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700 shrink-0">
        <p className="text-xs text-slate-500">© 2025 InvenTrack</p>
      </div>
    </div>
  );
}
