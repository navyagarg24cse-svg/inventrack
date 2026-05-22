/**
 * useInventory — Firestore-backed inventory hook
 *
 * Replaces the previous localStorage implementation.
 * Uses onSnapshot for real-time sync across all devices.
 *
 * Return shape:
 *   { items, loading, addItem, updateItem, deleteItem, importItems, restoreBackup }
 *
 * All write functions are async and return { ok, field?, msg? }.
 * Toasts are fired here so callers stay simple.
 */
import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db, COLLECTION } from '../firebase';

export function useInventory() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Real-time listener ───────────────────────────────────────────────
  // onSnapshot fires immediately with cached data (offline support) and
  // again whenever Firestore data changes on any device.
  useEffect(() => {
    const q = query(
      collection(db, COLLECTION),
      orderBy('createdAt', 'desc')   // newest first
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(docs);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore listener error:', err);
        toast.error('Failed to sync inventory. Check your connection.');
        setLoading(false);
      }
    );

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, []);

  // ── Add ──────────────────────────────────────────────────────────────
  async function addItem(entry) {
    const sn = entry.serialNumber.trim();

    if (!sn) {
      toast.error('Serial number is required.');
      return { ok: false, field: 'serialNumber', msg: 'Serial number is required.' };
    }

    // Duplicate check against current in-memory snapshot (fast, no extra read)
    const duplicate = items.some(
      (i) => i.serialNumber.trim().toLowerCase() === sn.toLowerCase()
    );
    if (duplicate) {
      toast.error(`Serial number "${sn}" already exists.`);
      return { ok: false, field: 'serialNumber', msg: `"${sn}" is already in use.` };
    }

    try {
      // Generate the doc ref first so we can store id in one write
      const ref = doc(collection(db, COLLECTION));
      await setDoc(ref, {
        ...entry,
        id:          ref.id,
        serialNumber: sn,
        lastQuantity: '',
        date:         new Date().toLocaleDateString('en-GB'),
        createdAt:    serverTimestamp(),
      });
      toast.success(`"${entry.itemName}" added to inventory.`);
      return { ok: true };
    } catch (err) {
      console.error('addItem error:', err);
      toast.error('Failed to add item. Please try again.');
      return { ok: false, msg: err.message };
    }
  }

  // ── Update ───────────────────────────────────────────────────────────
  async function updateItem(id, updates, originalQty) {
    try {
      const item     = items.find((i) => i.id === id);
      const baseline = originalQty !== undefined ? originalQty : item?.quantity;
      const quantityChanged =
        updates.quantity !== undefined &&
        String(updates.quantity) !== String(baseline);

      const payload = {
        ...updates,
        lastQuantity: quantityChanged ? baseline : (item?.lastQuantity ?? ''),
        date:         new Date().toLocaleDateString('en-GB'),
      };

      await updateDoc(doc(db, COLLECTION, id), payload);
      toast.success('Item updated successfully.');
    } catch (err) {
      console.error('updateItem error:', err);
      toast.error('Failed to update item. Please try again.');
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────
  async function deleteItem(id) {
    const target = items.find((i) => i.id === id);
    try {
      await deleteDoc(doc(db, COLLECTION, id));
      toast.success(target ? `"${target.itemName}" deleted.` : 'Item deleted.');
    } catch (err) {
      console.error('deleteItem error:', err);
      toast.error('Failed to delete item. Please try again.');
    }
  }

  // ── Bulk import (Excel) ───────────────────────────────────────────────
  // Writes all entries in parallel batches of 500 (Firestore batch limit).
  // Toast is fired by the caller (InventoryTable) after this resolves.
  async function importItems(entries) {
    try {
      const BATCH_SIZE = 500;
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = entries.slice(i, i + BATCH_SIZE);
        chunk.forEach((entry) => {
          const ref = doc(collection(db, COLLECTION));
          batch.set(ref, {
            ...entry,
            id:        ref.id,
            createdAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
    } catch (err) {
      console.error('importItems error:', err);
      throw err; // re-throw so InventoryTable can show the error toast
    }
  }

  // ── Restore backup ────────────────────────────────────────────────────
  // Deletes ALL existing documents then writes the backup entries.
  // Uses batched writes for efficiency.
  async function restoreBackup(entries) {
    try {
      // 1. Delete all existing docs in batches
      const BATCH_SIZE = 500;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        items.slice(i, i + BATCH_SIZE).forEach((item) => {
          batch.delete(doc(db, COLLECTION, item.id));
        });
        await batch.commit();
      }

      // 2. Write backup entries in batches
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        entries.slice(i, i + BATCH_SIZE).forEach((entry) => {
          // Reuse the original id if present so the backup is idempotent
          const ref = entry.id
            ? doc(db, COLLECTION, entry.id)
            : doc(collection(db, COLLECTION));
          batch.set(ref, {
            ...entry,
            id:        ref.id,
            createdAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
    } catch (err) {
      console.error('restoreBackup error:', err);
      throw err; // re-throw so InventoryTable can show the error toast
    }
  }

  return { items, loading, addItem, updateItem, deleteItem, importItems, restoreBackup };
}
