// ── Firebase configuration ────────────────────────────────────────────
// SDK: firebase@12 (modular)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyBjegXjxYOwyf3JicAXG84AVTwV7qSS9zg',
  authDomain:        'inventrack-ec420.firebaseapp.com',
  projectId:         'inventrack-ec420',
  storageBucket:     'inventrack-ec420.firebasestorage.app',
  messagingSenderId: '451890429458',
  appId:             '1:451890429458:web:f7c7ee841a991bed5922cb',
  measurementId:     'G-YFXSM5Z0ML',
};

// Initialize once — Vite's module cache ensures this runs only once
const app = initializeApp(firebaseConfig);

// Firestore database instance — exported for use in hooks
export const db = getFirestore(app);

// ── Collection name ───────────────────────────────────────────────────
// All inventory documents live in:  inventory/{auto-id}
// Each document shape:
// {
//   id:           string   (Firestore doc id, also stored as field for convenience)
//   serialNumber: string
//   itemName:     string
//   brand:        string
//   quantity:     string
//   lastQuantity: string
//   remarks:      string
//   date:         string   (DD/MM/YYYY)
//   createdAt:    Timestamp  (server timestamp, used for ordering)
// }
export const COLLECTION = 'inventory';
