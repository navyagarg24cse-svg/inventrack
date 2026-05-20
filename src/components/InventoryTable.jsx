import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { QtyBadge } from './Dashboard';
import { exportToExcel, importFromExcel, downloadTemplate } from '../utils/excel';

const COLUMNS = ['S/N', 'Item Name', 'Brand', 'Qty', 'Last Qty', 'Remarks', 'Date', 'Actions'];

// ── Required fields every valid inventory entry must have ────────────
const REQUIRED_FIELDS = ['id', 'serialNumber', 'itemName', 'brand', 'quantity'];

function validateBackup(data) {
  if (!Array.isArray(data)) return 'Backup file must contain an array of items.';
  if (data.length === 0) return 'Backup file is empty.';
  const bad = data.findIndex((item) =>
    REQUIRED_FIELDS.some((f) => item[f] === undefined || item[f] === null)
  );
  if (bad !== -1) return `Row ${bad + 1} is missing required fields (id, serialNumber, itemName, brand, quantity).`;
  return null; // valid
}

export default function InventoryTable({ items, onUpdate, onDelete, onImport, onRestore }) {
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editOriginalQty, setEditOriginalQty] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [importing, setImporting] = useState(false);
  // Restore confirmation modal state
  const [restoreModal, setRestoreModal] = useState(null); // { entries, filename, count }

  const fileInputRef = useRef(null);
  const restoreInputRef = useRef(null);

  // ── Backup ──────────────────────────────────────────────────────────
  function handleBackup() {
    if (items.length === 0) {
      toast.error('Nothing to back up — inventory is empty.');
      return;
    }
    try {
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const filename = `inventory-backup-${datePart}.json`;
      const json = JSON.stringify(items, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Backup saved as ${filename}`);
    } catch {
      toast.error('Backup failed. Please try again.');
    }
  }

  // ── Restore — step 1: read & validate file ───────────────────────────
  function handleRestoreFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Invalid file. Please select a .json backup file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const error = validateBackup(parsed);
        if (error) {
          toast.error(`Invalid backup: ${error}`);
          return;
        }
        // Valid — show confirmation modal before overwriting
        setRestoreModal({ entries: parsed, filename: file.name, count: parsed.length });
      } catch {
        toast.error('Could not read file. Make sure it is a valid JSON backup.');
      }
    };
    reader.onerror = () => toast.error('Failed to read the backup file.');
    reader.readAsText(file);
  }

  // ── Restore — step 2: confirmed ──────────────────────────────────────
  function confirmRestore() {
    if (!restoreModal) return;
    onRestore(restoreModal.entries);
    toast.success(`Backup restored — ${restoreModal.count} item${restoreModal.count !== 1 ? 's' : ''} loaded.`);
    setRestoreModal(null);
  }

  // ── Export ──────────────────────────────────────────────────────────
  function handleExport() {
    if (items.length === 0) { toast.error('Nothing to export — inventory is empty.'); return; }
    try {
      exportToExcel(items);
      toast.success(`Exported ${items.length} item${items.length !== 1 ? 's' : ''} to inventory.xlsx`);
    } catch { toast.error('Export failed. Please try again.'); }
  }

  // ── Template ────────────────────────────────────────────────────────
  async function handleDownloadTemplate() {
    try {
      await downloadTemplate();
      toast.success('Template downloaded as inventory_template.xlsx');
    } catch { toast.error('Failed to generate template. Please try again.'); }
  }

  // ── Excel Import ────────────────────────────────────────────────────
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel', 'text/csv',
    ];
    if (!allowed.includes(file.type) && !/\.(xlsx|xls|csv)$/i.test(file.name)) {
      toast.error('Invalid file type. Please upload an .xlsx, .xls, or .csv file.');
      return;
    }
    setImporting(true);
    const toastId = toast.loading('Importing from Excel…');
    try {
      const entries = await importFromExcel(file);
      if (entries.length === 0) {
        toast.error('No valid rows found in the file.', { id: toastId });
      } else {
        onImport(entries);
        toast.success(`${entries.length} item${entries.length !== 1 ? 's' : ''} imported successfully.`, { id: toastId });
      }
    } catch (err) {
      toast.error(err.message || 'Import failed. Check the file and try again.', { id: toastId });
    } finally { setImporting(false); }
  }

  // ── Filter / Sort ────────────────────────────────────────────────────
  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.serialNumber?.toLowerCase().includes(q) ||
      item.itemName?.toLowerCase().includes(q) ||
      item.brand?.toLowerCase().includes(q) ||
      item.remarks?.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
    if (sortKey === 'quantity' || sortKey === 'lastQuantity') { av = Number(av); bv = Number(bv); }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  // ── Edit helpers ─────────────────────────────────────────────────────
  function startEdit(item) {
    setEditId(item.id);
    setEditOriginalQty(item.quantity);
    setEditData({ serialNumber: item.serialNumber, itemName: item.itemName, brand: item.brand, quantity: item.quantity, remarks: item.remarks });
  }
  function saveEdit() {
    onUpdate(editId, editData, editOriginalQty);
    setEditId(null); setEditData({}); setEditOriginalQty('');
  }
  function cancelEdit() { setEditId(null); setEditData({}); setEditOriginalQty(''); }

  function SortIcon({ col }) {
    if (sortKey !== col) return <span className="ml-1 text-slate-300">↕</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const sortableMap = {
    'S/N': 'serialNumber', 'Item Name': 'itemName', Brand: 'brand',
    Qty: 'quantity', 'Last Qty': 'lastQuantity', Date: 'date',
  };

  return (
    <div className="space-y-5">

      {/* ── Restore confirmation modal ── */}
      {restoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-base">Restore Backup?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  This will <span className="font-medium text-red-600">replace all {items.length} current item{items.length !== 1 ? 's' : ''}</span> with{' '}
                  <span className="font-medium text-slate-700">{restoreModal.count} item{restoreModal.count !== 1 ? 's' : ''}</span> from{' '}
                  <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{restoreModal.filename}</span>.
                </p>
                <p className="text-xs text-slate-400 mt-2">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => setRestoreModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestore}
                className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
              >
                Yes, Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header + toolbar ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {items.length} item{items.length !== 1 ? 's' : ''} total
            </p>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" />
          </div>
        </div>

        {/* ── Action toolbar — two rows on mobile, one row on desktop ── */}
        <div className="flex flex-wrap gap-2">

          {/* Excel group */}
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => fileInputRef.current?.click()} disabled={importing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {importing
                ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/></svg>}
              {importing ? 'Importing…' : 'Import Excel'}
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" aria-label="Import Excel file" />

            <button onClick={handleExport} disabled={items.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 8l5-5 5 5M12 3v12"/></svg>
              Export Excel
            </button>

            <button onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
              title="Download blank Excel template">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Template
            </button>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px bg-slate-200 self-stretch mx-1" />

          {/* Backup group */}
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={handleBackup} disabled={items.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/></svg>
              Backup Data
            </button>

            <button onClick={() => restoreInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Restore Backup
            </button>
            <input ref={restoreInputRef} type="file" accept=".json" onChange={handleRestoreFileChange} className="hidden" aria-label="Restore backup file" />
          </div>

        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-slate-400 text-sm">
              {search ? 'No items match your search.' : 'No inventory items yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-200">
                <tr>
                  {COLUMNS.map((col) => {
                    const sk = sortableMap[col];
                    return (
                      <th key={col} onClick={sk ? () => toggleSort(sk) : undefined}
                        className={`px-4 py-3 text-left font-semibold whitespace-nowrap ${sk ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}>
                        {col}{sk && <SortIcon col={sk} />}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((item) =>
                  editId === item.id ? (
                    <EditRow key={item.id} data={editData}
                      onChange={(k, v) => setEditData((d) => ({ ...d, [k]: v }))}
                      onSave={saveEdit} onCancel={cancelEdit} originalQty={editOriginalQty} />
                  ) : (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{item.serialNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{item.itemName}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.brand}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><QtyBadge qty={item.quantity} /></td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.lastQuantity || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate" title={item.remarks}>{item.remarks || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            Edit
                          </button>
                          {deleteConfirm === item.id ? (
                            <span className="flex items-center gap-1">
                              <button onClick={() => { onDelete(item.id); setDeleteConfirm(null); }}
                                className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors">Confirm</button>
                              <button onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">Cancel</button>
                            </span>
                          ) : (
                            <button onClick={() => setDeleteConfirm(item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline edit row ──────────────────────────────────────────────────
function EditRow({ data, onChange, onSave, onCancel, originalQty }) {
  const qtyChanged = String(data.quantity) !== String(originalQty);
  return (
    <tr className="bg-blue-50">
      <td className="px-4 py-2">
        <input value={data.serialNumber} onChange={(e) => onChange('serialNumber', e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      </td>
      <td className="px-4 py-2">
        <input value={data.itemName} onChange={(e) => onChange('itemName', e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      </td>
      <td className="px-4 py-2">
        <input value={data.brand} onChange={(e) => onChange('brand', e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      </td>
      <td className="px-4 py-2">
        <input type="number" min="0" value={data.quantity} onChange={(e) => onChange('quantity', e.target.value)}
          className={`w-20 px-2 py-1.5 text-sm border rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white ${qtyChanged ? 'border-amber-400' : 'border-slate-300'}`} />
        {qtyChanged && <p className="text-xs text-amber-600 mt-0.5 whitespace-nowrap">Last qty → {originalQty}</p>}
      </td>
      <td className="px-4 py-2 text-slate-400 text-sm italic">auto</td>
      <td className="px-4 py-2">
        <input value={data.remarks} onChange={(e) => onChange('remarks', e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      </td>
      <td className="px-4 py-2 text-slate-400 text-sm italic">today</td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <button onClick={onSave} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">Save</button>
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">Cancel</button>
        </div>
      </td>
    </tr>
  );
}
