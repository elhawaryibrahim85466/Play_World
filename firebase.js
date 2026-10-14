// =====================================================
//  PlayWorld — Firebase Client (Compat)
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyDPl2B1n_W-da6JsP4PDZXOdN6vN0vNA58",
  authDomain: "play-world-60c68.firebaseapp.com",
  projectId: "play-world-60c68",
  storageBucket: "play-world-60c68.firebasestorage.app",
  messagingSenderId: "593065976781",
  appId: "1:593065976781:web:7f6309b5cd54e4d94f5a84"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function getUserId() {
  const tg = window.Telegram?.WebApp;
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    return String(tg.initDataUnsafe.user.id);
  }
  return null;
}

async function getUserData(userId) {
  try {
    const ref = db.collection('users').doc(userId);
    const snap = await ref.get();
    if (snap.exists) return snap.data();
    return null;
  } catch (e) {
    console.error('getUserData error:', e);
    return null;
  }
}

async function createUser(userId, data) {
  try {
    const ref = db.collection('users').doc(userId);
    await ref.set(data, { merge: true });
    return true;
  } catch (e) {
    console.error('createUser error:', e);
    return false;
  }
}

async function updateBalance(userId, newBalance) {
  try {
    const ref = db.collection('users').doc(userId);
    await ref.update({ balance: newBalance });
    return true;
  } catch (e) {
    console.error('updateBalance error:', e);
    return false;
  }
}

window.PWFirebase = {
  db,
  getUserId,
  getUserData,
  createUser,
  updateBalance
};
