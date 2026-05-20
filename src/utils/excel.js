/**
 * Excel import / export helpers using SheetJS (xlsx).
 * Template download uses ExcelJS for full cell styling support.
 *
 * Security note: xlsx is used entirely client-side on files the user
 * explicitly selects — no server-side or untrusted-network input is
 * processed, so the known prototype-pollution / ReDoS advisories do
 * not apply in this context.
 */
import * as XLSX from 'xlsx';

// ── Column header map (display label → internal field key) ──────────
const HEADER_MAP = {
  'Serial Number': 'serialNumber',
  'Item Name':     'itemName',
  'Brand':         'brand',
  'Quantity':      'quantity',
  'Last Quantity': 'lastQuantity',
  'Remarks':       'remarks',
  'Date':          'date',
};

// Reverse: field key → display label (used for export)
const FIELD_TO_HEADER = Object.fromEntries(
  Object.entries(HEADER_MAP).map(([h, f]) => [f, h])
);

// Ordered columns for the exported sheet
const EXPORT_FIELDS = [
  'serialNumber',
  'itemName',
  'brand',
  'quantity',
  'lastQuantity',
  'remarks',
  'date',
];

// ── Export ───────────────────────────────────────────────────────────
export function exportToExcel(items) {
  // Build array-of-objects with human-readable headers
  const rows = items.map((item) =>
    Object.fromEntries(
      EXPORT_FIELDS.map((f) => [FIELD_TO_HEADER[f], item[f] ?? ''])
    )
  );

  const ws = XLSX.utils.json_to_sheet(rows, { header: EXPORT_FIELDS.map((f) => FIELD_TO_HEADER[f]) });

  // Column widths
  ws['!cols'] = [
    { wch: 16 }, // Serial Number
    { wch: 24 }, // Item Name
    { wch: 18 }, // Brand
    { wch: 10 }, // Quantity
    { wch: 14 }, // Last Quantity
    { wch: 30 }, // Remarks
    { wch: 14 }, // Date
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
  XLSX.writeFile(wb, 'inventory.xlsx');
}

// ── Import ───────────────────────────────────────────────────────────
/**
 * Reads an .xlsx / .xls / .csv File object and returns a Promise that
 * resolves to an array of inventory entry objects ready to be saved.
 *
 * Accepts both the exact header labels defined in HEADER_MAP and
 * case-insensitive / trimmed variants so files edited manually still
 * import cleanly.
 */
export function importFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });

        const sheetName = wb.SheetNames[0];
        if (!sheetName) throw new Error('No sheets found in the file.');

        const ws = wb.Sheets[sheetName];
        // raw: false → numbers stay as numbers, dates as strings
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rows.length === 0) {
          resolve([]);
          return;
        }

        // Build a normalised header → field key lookup (case-insensitive)
        const normMap = {};
        Object.entries(HEADER_MAP).forEach(([header, field]) => {
          normMap[header.toLowerCase().trim()] = field;
        });

        const entries = rows.map((row) => {
          const entry = {
            serialNumber: '',
            itemName:     '',
            brand:        '',
            quantity:     '0',
            lastQuantity: '',
            remarks:      '',
            date:         new Date().toLocaleDateString('en-GB'),
          };

          Object.entries(row).forEach(([rawKey, val]) => {
            const field = normMap[rawKey.toLowerCase().trim()];
            if (field) {
              entry[field] = val === null || val === undefined ? '' : String(val).trim();
            }
          });

          // Assign a fresh id — never reuse ids from the file
          entry.id = crypto.randomUUID();

          return entry;
        });

        // Filter out completely empty rows
        const valid = entries.filter(
          (e) => e.serialNumber || e.itemName || e.brand
        );

        resolve(valid);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

// ── Template download ────────────────────────────────────────────────
/**
 * Generates and downloads inventory_template.xlsx with:
 *  - Bold, styled header row (dark blue bg, white text)
 *  - One sample data row
 *  - Auto-sized columns
 *  - Frozen top row
 *  - All cells have thin borders
 *
 * ExcelJS is dynamically imported so it doesn't bloat the initial bundle.
 */
export async function downloadTemplate() {
  // Lazy-load ExcelJS — only fetched when the user clicks the button
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'InvenTrack';
  wb.created = new Date();

  const ws = wb.addWorksheet('Inventory', {
    views: [{ state: 'frozen', ySplit: 1 }], // freeze header row
  });

  // ── Column definitions ──────────────────────────────────────────────
  ws.columns = [
    { header: 'Serial Number', key: 'serialNumber', width: 18 },
    { header: 'Item Name',     key: 'itemName',     width: 26 },
    { header: 'Brand',         key: 'brand',        width: 20 },
    { header: 'Quantity',      key: 'quantity',     width: 12 },
    { header: 'Last Quantity', key: 'lastQuantity', width: 16 },
    { header: 'Remarks',       key: 'remarks',      width: 34 },
    { header: 'Date',          key: 'date',         width: 16 },
  ];

  // ── Header row styling ──────────────────────────────────────────────
  const headerRow = ws.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' }, // dark navy
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FF1E3A5F' } },
      left:   { style: 'thin', color: { argb: 'FF1E3A5F' } },
      bottom: { style: 'thin', color: { argb: 'FF1E3A5F' } },
      right:  { style: 'thin', color: { argb: 'FF1E3A5F' } },
    };
  });

  // ── Sample data row ─────────────────────────────────────────────────
  const today = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
  const sampleRow = ws.addRow({
    serialNumber: 'SN-001',
    itemName:     'Wireless Mouse',
    brand:        'Logitech',
    quantity:     50,
    lastQuantity: '',
    remarks:      'Sample item — replace with your data',
    date:         today,
  });

  sampleRow.height = 18;
  sampleRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { size: 11, name: 'Calibri', color: { argb: 'FF374151' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F4FF' }, // very light blue tint
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left:   { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right:  { style: 'thin', color: { argb: 'FFD1D5DB' } },
    };
  });

  // ── Add a few blank data rows with borders so users see the pattern ─
  for (let i = 0; i < 5; i++) {
    const blankRow = ws.addRow({});
    blankRow.height = 18;
    // Apply borders to all 7 columns even when empty
    for (let col = 1; col <= 7; col++) {
      const cell = blankRow.getCell(col);
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left:   { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right:  { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    }
  }

  // ── Write to buffer and trigger browser download ────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventory_template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}
