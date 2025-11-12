// parent.js - parent portal helpers (demo feed)
import { db } from '../app.js';
import { collection, query, where, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

export function subscribeToParentMessages(parentId, cb) {
  const q = query(collection(db, 'messages'), where('parentId', '==', parentId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(items);
  });
}
