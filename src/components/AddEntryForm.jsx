import { useState } from 'react';

const EMPTY = {
  serialNumber: '',
  itemName: '',
  brand: '',
  quantity: '',
  remarks: '',
};

export default function AddEntryForm({ onAdd, onNavigate, existingSerialNumbers = new Set() }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const snTrimmed = form.serialNumber.trim().toLowerCase();
  const isDuplicateLive = snTrimmed.length > 0 && existingSerialNumbers.has(snTrimmed);

  function validate() {
    const e = {};
    if (!form.serialNumber.trim()) {
      e.serialNumber = 'Serial number is required.';
    } else if (isDuplicateLive) {
      e.serialNumber = `"${form.serialNumber.trim()}" is already in use.`;
    }
    if (!form.itemName.trim()) e.itemName = 'Item name is required.';
    if (!form.brand.trim()) e.brand = 'Brand is required.';
    if (form.quantity === '' || isNaN(Number(form.quantity)))
      e.quantity = 'Enter a valid number.';
    else if (Number(form.quantity) < 0)
      e.quantity = 'Quantity cannot be negative.';
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const result = onAdd({ ...form, quantity: String(form.quantity) });
    if (result?.ok === false) {
      if (result.field) setErrors((prev) => ({ ...prev, [result.field]: result.msg }));
      return;
    }
    setForm(EMPTY);
    setErrors({});
  }

  return (
    /* max-w-2xl keeps form readable on wide screens; w-full fills mobile */
    <div className="space-y-4 sm:space-y-6 w-full max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Add Entry</h1>
        <p className="text-sm text-slate-500 mt-0.5">Fill in the details to add a new inventory item</p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5"
      >
        {/* 1 col on mobile, 2 cols on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">

          {/* Serial Number with live duplicate check */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Serial Number
            </label>
            <div className="relative">
              <input
                type="text"
                name="serialNumber"
                value={form.serialNumber}
                onChange={handleChange}
                placeholder="e.g. SN-001"
                autoComplete="off"
                className={`w-full rounded-lg border px-3 py-3 sm:py-2.5 pr-9 text-sm text-slate-800
                  placeholder-slate-400 outline-none transition-colors
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.serialNumber || isDuplicateLive
                    ? 'border-red-400 bg-red-50'
                    : form.serialNumber.trim()
                    ? 'border-emerald-400 bg-white'
                    : 'border-slate-300 bg-white'}`}
              />
              {form.serialNumber.trim() && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {isDuplicateLive || errors.serialNumber ? (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              )}
            </div>
            {(errors.serialNumber || isDuplicateLive) && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {errors.serialNumber || `"${form.serialNumber.trim()}" is already in use.`}
              </p>
            )}
          </div>

          <Field label="Item Name" name="itemName" value={form.itemName} onChange={handleChange}
            error={errors.itemName} placeholder="e.g. Wireless Mouse" />
          <Field label="Brand" name="brand" value={form.brand} onChange={handleChange}
            error={errors.brand} placeholder="e.g. Logitech" />
          <Field label="Quantity" name="quantity" type="number" min="0"
            value={form.quantity} onChange={handleChange}
            error={errors.quantity} placeholder="e.g. 50" />
        </div>

        {/* Last Quantity info */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 sm:px-4 py-3 text-sm text-slate-500">
          <span className="font-medium text-slate-600">Last Quantity:</span>{' '}
          <span className="italic">Will be set automatically when you edit quantity later.</span>
        </div>

        <Field label="Remarks" name="remarks" value={form.remarks} onChange={handleChange}
          placeholder="Optional notes about this item" textarea />

        {/* Action buttons — stack on very small screens */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isDuplicateLive}
            className="flex-1 sm:flex-none px-5 py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-700
              disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-semibold
              rounded-lg transition-colors shadow-sm touch-manipulation min-h-[44px]"
          >
            Add Item
          </button>
          <button
            type="button"
            onClick={() => { setForm(EMPTY); setErrors({}); }}
            className="flex-1 sm:flex-none px-5 py-3 sm:py-2.5 bg-slate-100 hover:bg-slate-200
              text-slate-700 text-sm font-medium rounded-lg transition-colors touch-manipulation min-h-[44px]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="w-full sm:w-auto sm:ml-auto text-sm text-blue-600 hover:text-blue-700
              font-medium py-2 touch-manipulation text-center"
          >
            View Inventory →
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, error, placeholder, type = 'text', min, textarea }) {
  const base = `w-full rounded-lg border px-3 py-3 sm:py-2.5 text-sm text-slate-800
    placeholder-slate-400 outline-none transition-colors
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500`;
  const cls = error
    ? `${base} border-red-400 bg-red-50`
    : `${base} border-slate-300 bg-white hover:border-slate-400`;

  return (
    <div className={textarea ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {textarea ? (
        <textarea name={name} value={value} onChange={onChange}
          placeholder={placeholder} rows={3} className={cls} />
      ) : (
        <input type={type} name={name} value={value} onChange={onChange}
          placeholder={placeholder} min={min} className={cls} />
      )}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
