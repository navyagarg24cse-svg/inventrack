import { useState, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AddEntryForm from './components/AddEntryForm';
import InventoryTable from './components/InventoryTable';
import { useInventory } from './hooks/useInventory';

export default function App() {
  const [view, setView] = useState('dashboard');
  const { items, addItem, updateItem, deleteItem, importItems, restoreBackup } = useInventory();

  // Pre-compute a lowercase Set of existing serial numbers for O(1) duplicate checks
  const existingSerialNumbers = useMemo(
    () => new Set(items.map((i) => i.serialNumber.trim().toLowerCase())),
    [items]
  );

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* ── Global toast container ── */}
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#1e293b',
            fontSize: '13.5px',
            fontWeight: '500',
            borderRadius: '10px',
            boxShadow:
              '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.05)',
            padding: '12px 16px',
            maxWidth: '360px',
            border: '1px solid #e2e8f0',
          },
          success: {
            duration: 3000,
            iconTheme: { primary: '#16a34a', secondary: '#ffffff' },
            style: {
              borderLeft: '4px solid #16a34a',
            },
          },
          error: {
            duration: 4500,
            iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
            style: {
              borderLeft: '4px solid #dc2626',
            },
          },
        }}
      />

      <Sidebar active={view} onNavigate={setView} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="text-slate-400">InvenTrack</span>
            <span>/</span>
            <span className="text-slate-700 font-medium capitalize">{view}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            <span className="text-sm text-slate-700 font-medium">Admin</span>
          </div>
        </header>

        {/* Page content — stable JSX elements so React reconciles instead of remounting */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {view === 'dashboard' && (
            <Dashboard items={items} onNavigate={setView} />
          )}
          {view === 'add' && (
            <AddEntryForm
              onAdd={addItem}
              onNavigate={setView}
              existingSerialNumbers={existingSerialNumbers}
            />
          )}
          {view === 'inventory' && (
            <InventoryTable
              items={items}
              onUpdate={updateItem}
              onDelete={deleteItem}
              onImport={importItems}
              onRestore={restoreBackup}
            />
          )}
        </main>
      </div>
    </div>
  );
}
