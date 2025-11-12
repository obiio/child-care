// billing.js - invoice generator and payment tracker
import { db } from '../app.js';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

export function calcLineAmount(li) { return Number((li.quantity * li.unitPrice).toFixed(2)); }
export function calcInvoiceTotal(lineItems) {
  return Number((lineItems.reduce((s, li) => s + calcLineAmount(li), 0)).toFixed(2));
}

export async function createInvoice({ parentId, childId, lineItems }) {
  const total = calcInvoiceTotal(lineItems);
  return addDoc(collection(db, 'invoices'), {
    parentId, childId, status: 'draft', lineItems, total,
    issuedAt: serverTimestamp()
  });
}

export async function updateInvoiceStatus(invoiceId, status) {
  await updateDoc(doc(db, 'invoices', invoiceId), { status });
}
