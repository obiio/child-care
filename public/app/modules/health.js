// health.js - health records and incidents
import { db } from '../app.js';
import { collection, addDoc, doc, setDoc, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { sendParentNotice } from './notifications.js';

export async function saveChildProfile(child) {
  await setDoc(doc(db, 'children', child.id), child, { merge: true });
}

async function fetchParentIds(childId) {
  try {
    const snap = await getDoc(doc(db, 'children', childId));
    if (snap.exists()) {
      const data = snap.data();
      return Array.isArray(data.parentIds) ? data.parentIds : [];
    }
  } catch (e) { /* ignore */ }
  return [];
}

export async function logIncident({ childId, type, temperature, notes }) {
  const recId = crypto.randomUUID();
  await addDoc(collection(db, 'health_incidents'), {
    id: recId,
    childId,
    type,
    temperature: temperature || null,
    notes: notes || '',
    createdAt: serverTimestamp()
  });
  const parentIds = await fetchParentIds(childId);
  await Promise.all(parentIds.map(pid => sendParentNotice(pid, { kind: 'health', childId, type, temperature, notes })));
  return recId;
}
