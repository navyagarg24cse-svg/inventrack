export default function Dashboard({ items, onNavigate }) {
  const totalItems = items.length;
  const totalQty = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
  const lowStock = items.filter((i) => Number(i.quantity) > 0 && Number(i.quantity) <= 5).length;
  const outOfStock = items.filter((i) => Number(i.quantity) === 0).length;

  const recent = [...items]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  const stats = [
    {
      label: 'Total Items',
      value: totalItems,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-700',
      iconBg: 'bg-blue-100',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: 'Total Quantity',
      value: totalQty,
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Low Stock (≤5)',
      value: lowStock,
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-700',
      iconBg: 'bg-amber-100',
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      label: 'Out of Stock',
      value: outOfStock,
      bg: 'bg-red-50',
      border: 'border-red-100',
      text: 'text-red-700',
      iconBg: 'bg-red-100',
      icon: (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Overview of your current inventory</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl border p-5 flex items-center gap-4 ${s.bg} ${s.border}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
              {s.icon}
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              <p className={`text-xs font-medium mt-0.5 ${s.text} opacity-80`}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent entries table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700 text-sm">Recent Entries</h2>
          <button
            onClick={() => onNavigate('inventory')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            View all →
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-slate-400 text-sm">No entries yet.</p>
            <button
              onClick={() => onNavigate('add')}
              className="mt-2 text-sm text-blue-600 hover:underline font-medium"
            >
              Add your first item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  {['S/N', 'Item Name', 'Brand', 'Qty', 'Last Qty', 'Date'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{item.serialNumber}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{item.itemName}</td>
                    <td className="px-5 py-3 text-slate-600">{item.brand}</td>
                    <td className="px-5 py-3">
                      <QtyBadge qty={item.quantity} />
                    </td>
                    <td className="px-5 py-3 text-slate-500">{item.lastQuantity || '—'}</td>
                    <td className="px-5 py-3 text-slate-500">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function QtyBadge({ qty }) {
  const n = Number(qty);
  const cls =
    n === 0
      ? 'bg-red-100 text-red-700'
      : n <= 5
      ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {qty}
    </span>
  );
}
