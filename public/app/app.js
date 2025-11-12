// app.js - bootstrap, auth, role routing
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, setPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { getMessaging, getToken } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging.js';
import { firebaseConfig, vapidKey } from './firebase-config.js';

let app, auth, db, messaging;
let regApp, regAuth; // secondary app for safe user registration without affecting current session

export function initApp({ onAuthStateKnown, onError } = {}) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    try { messaging = getMessaging(app); } catch { /* ok if not supported */ }

    // Use session persistence: survives redirects in same tab but not full browser restarts
    setPersistence(auth, browserSessionPersistence).then(() => {
      onAuthStateChanged(auth, async (user) => {
        try {
          if (!user) { onAuthStateKnown && onAuthStateKnown(null, null); return; }
          const role = await ensureUserRole(user);
          // attempt to register FCM token for web push (optional)
          try {
            if (messaging && window.isSecureContext) {
              const token = await getToken(messaging, { vapidKey });
              if (token) {
                if (role === 'parent') {
                  await setDoc(doc(db, 'parents', user.uid), { fcmToken: token }, { merge: true });
                } else {
                  await setDoc(doc(db, 'staff', user.uid), { fcmToken: token }, { merge: true });
                }
              }
            }
          } catch (e) { /* ignore token errors (http/notifs permissions/role) */ }
          onAuthStateKnown && onAuthStateKnown(user, role);
        } catch (e) {
          onError && onError(e);
        }
      });
    }).catch(e => { onError && onError(e); });
  } catch (e) {
    onError && onError(e);
  }
}

export async function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerUser(email, password, role = 'parent') {
  // Use a secondary app to avoid signing in the current browser user
  if (!regApp) {
    regApp = initializeApp(firebaseConfig, 'reg');
    regAuth = getAuth(regApp);
    await setPersistence(regAuth, browserSessionPersistence);
  }
  const cred = await createUserWithEmailAndPassword(regAuth, email, password);
  const uid = cred.user.uid;
  if (role === 'parent') {
    // write parent doc using the created user's auth via regAuth context
    await setDoc(doc(getFirestore(regApp), 'parents', uid), { id: uid, email, childrenIds: [] }, { merge: true });
  } else {
    await setDoc(doc(getFirestore(regApp), 'staff', uid), { id: uid, email, role: 'doctor' }, { merge: true });
  }
  try { await signOut(regAuth); } catch {}
  return uid;
}

export async function signOutUser() { return signOut(auth); }
export async function resetPassword(email) { return sendPasswordResetEmail(auth, email); }

export async function getUserRole(uid) {
  const staffSnap = await getDoc(doc(db, 'staff', uid));
  if (staffSnap.exists()) {
    const data = staffSnap.data();
    return data.role === 'admin' ? 'admin' : 'staff';
  }
  const parentSnap = await getDoc(doc(db, 'parents', uid));
  if (parentSnap.exists()) return 'parent';
  return null;
}

async function ensureUserRole(user) {
  const uid = user.uid;
  // Prefer staff/admin role if present; ignore permission-denied
  try {
    const staffSnap = await getDoc(doc(db, 'staff', uid));
    if (staffSnap.exists()) {
      const data = staffSnap.data();
      return data.role === 'admin' ? 'admin' : 'staff';
    }
  } catch (e) {
    if (e && e.code !== 'permission-denied') console.warn('staff read error', e);
    // if permission denied, treat as not staff
  }

  // Parent role; attempt read, else auto-provision
  try {
    const parentSnap = await getDoc(doc(db, 'parents', uid));
    if (parentSnap.exists()) return 'parent';
  } catch (e) {
    if (e && e.code !== 'permission-denied') console.warn('parent read error', e);
    // continue to provision
  }

  // Auto-provision parent profile if missing
  try {
    await setDoc(doc(db, 'parents', uid), { id: uid, email: user.email || '', childrenIds: [] }, { merge: true });
    return 'parent';
  } catch (e) {
    console.warn('Failed to create parent profile', e);
    return null;
  }
}

export { auth, db };
