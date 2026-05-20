import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'inventory_items';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useInventory() {
  const [items, setItems] = useState(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // ── Add ─────────────────────────────────────────────────────────────
  function addItem(entry) {
    const sn = entry.serialNumber.trim();

    // Empty serial number (belt-and-suspenders — form also validates this)
    if (!sn) {
      toast.error('Serial number is required.');
      return { ok: false, field: 'serialNumber', msg: 'Serial number is required.' };
    }

    // Duplicate check — case-insensitive, trimmed
    const duplicate = items.some(
      (i) => i.serialNumber.trim().toLowerCase() === sn.toLowerCase()
    );
    if (duplicate) {
      toast.error(`Serial number "${sn}" already exists.`);
      return { ok: false, field: 'serialNumber', msg: `"${sn}" is already in use.` };
    }

    const newItem = {
      ...entry,
      serialNumber: sn,          // store trimmed value
      id: crypto.randomUUID(),
      lastQuantity: '',
      date: new Date().toLocaleDateString('en-GB'),
    };
    setItems((prev) => [newItem, ...prev]);
    toast.success(`"${entry.itemName}" added to inventory.`);
    return { ok: true };
  }

  // ── Update ──────────────────────────────────────────────────────────
  function updateItem(id, updates, originalQty) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const baseline =
          originalQty !== undefined ? originalQty : item.quantity;
        const quantityChanged =
          updates.quantity !== undefined &&
          String(updates.quantity) !== String(baseline);
        return {
          ...item,
          ...updates,
          lastQuantity: quantityChanged ? baseline : item.lastQuantity,
          date: new Date().toLocaleDateString('en-GB'),
        };
      })
    );
    toast.success('Item updated successfully.');
  }

  // ── Delete ──────────────────────────────────────────────────────────
  function deleteItem(id) {
    const target = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success(
      target ? `"${target.itemName}" deleted.` : 'Item deleted.'
    );
  }

  // ── Bulk import ─────────────────────────────────────────────────────
  function importItems(entries) {
    setItems((prev) => [...entries, ...prev]);
    // Toast is fired by the caller (InventoryTable) so it can include
    // the count and handle error cases too.
  }

  // ── Restore backup ───────────────────────────────────────────────────
  // Fully replaces current inventory with the backup entries.
  // Toast is fired by the caller after confirmation.
  function restoreBackup(entries) {
    setItems(entries);
  }

  return { items, addItem, updateItem, deleteItem, importItems, restoreBackup };
}
