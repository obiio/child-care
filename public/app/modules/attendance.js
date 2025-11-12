// attendance.js - QR + manual attendance
import { db } from '../app.js';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { sendParentNotice } from './notifications.js';

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

// Minimal QR placeholder: parse JSON from input text (for demo)
export async function recordAttendance({ childId, staffId, type = 'checkin', method = 'manual' }) {
  const docRef = await addDoc(collection(db, 'attendance'), {
    childId,
    staffId,
    type,
    method,
    timestamp: serverTimestamp()
  });
  // Notify actual linked parents
  const parentIds = await fetchParentIds(childId);
  await Promise.all(parentIds.map(pid => sendParentNotice(pid, { kind: 'attendance', childId, type })));
  return docRef.id;
}

export function initManualForm(formEl, alertCb) {
  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const childId = formEl.childId.value.trim();
    const staffId = formEl.staffId.value.trim();
    const type = formEl.type.value;
    if (!childId || !staffId) { alertCb('Child ID and Staff ID are required', 'error'); return; }
    alertCb('Saving attendance...');
    try {
      await recordAttendance({ childId, staffId, type, method: 'manual' });
      alertCb('Attendance recorded', 'success');
      formEl.reset();
    } catch (err) { alertCb(err.message || String(err), 'error'); }
  });
}
