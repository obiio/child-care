// scheduling.js - schedules
import { db } from '../app.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

export async function addScheduleEntry(entry) {
  return addDoc(collection(db, 'schedules'), { ...entry, createdAt: serverTimestamp() });
}
