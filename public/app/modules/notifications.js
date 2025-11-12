// notifications.js - Cloud Messaging integration (placeholder hooks)
import { db } from '../app.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

// For a production app, use Cloud Functions to send notifications.
// For prototype, we record an event in Firestore that the parent portal can listen to.
export async function sendParentNotice(parentId, payload) {
  const msgId = crypto.randomUUID();
  await setDoc(doc(db, 'messages', msgId), {
    id: msgId,
    parentId,
    payload,
    createdAt: serverTimestamp()
  });
}
