import { db, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where, serverTimestamp } from './firebase';

export async function getUnits() {
  const snap = await getDocs(query(collection(db, 'units'), orderBy('order')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUnit(id) {
  const snap = await getDoc(doc(db, 'units', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUnit(id, data) {
  await updateDoc(doc(db, 'units', id), { ...data, updatedAt: serverTimestamp() });
}

export async function addUnit(data) {
  return addDoc(collection(db, 'units'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function deleteUnit(id) {
  await deleteDoc(doc(db, 'units', id));
}

export async function getInquiries() {
  const snap = await getDocs(query(collection(db, 'inquiries'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addInquiry(data) {
  return addDoc(collection(db, 'inquiries'), { ...data, status: 'pending', adminNotes: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function updateInquiry(id, data) {
  await updateDoc(doc(db, 'inquiries', id), { ...data, updatedAt: serverTimestamp() });
}

export async function getReviews() {
  const snap = await getDocs(query(collection(db, 'reviews'), orderBy('date', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addReview(data) {
  return addDoc(collection(db, 'reviews'), { ...data, createdAt: serverTimestamp() });
}

export async function updateReview(id, data) {
  await updateDoc(doc(db, 'reviews', id), data);
}

export async function deleteReview(id) {
  await deleteDoc(doc(db, 'reviews', id));
}

export async function getTasks() {
  const snap = await getDocs(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addTask(data) {
  return addDoc(collection(db, 'tasks'), { ...data, createdAt: serverTimestamp() });
}

export async function updateTask(id, data) {
  await updateDoc(doc(db, 'tasks', id), data);
}

export async function deleteTask(id) {
  await deleteDoc(doc(db, 'tasks', id));
}

export async function getCalls() {
  const snap = await getDocs(query(collection(db, 'calls'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addCall(data) {
  return addDoc(collection(db, 'calls'), { ...data, createdAt: serverTimestamp() });
}

export async function updateCall(id, data) {
  await updateDoc(doc(db, 'calls', id), data);
}

export async function deleteCall(id) {
  await deleteDoc(doc(db, 'calls', id));
}

export async function getSettings() {
  const snap = await getDoc(doc(db, 'settings', 'main'));
  return snap.exists() ? snap.data() : null;
}

export async function updateSettings(data) {
  await updateDoc(doc(db, 'settings', 'main'), data);
}

export async function getAttractions() {
  const snap = await getDocs(collection(db, 'attractions'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addAttraction(data) {
  return addDoc(collection(db, 'attractions'), { ...data, createdAt: serverTimestamp() });
}

export async function updateAttraction(id, data) {
  await updateDoc(doc(db, 'attractions', id), data);
}

export async function deleteAttraction(id) {
  await deleteDoc(doc(db, 'attractions', id));
}

export async function logPageView(page, unitId = null) {
  await addDoc(collection(db, 'analytics'), {
    page, unitId, timestamp: serverTimestamp(),
    referrer: typeof window !== 'undefined' ? document.referrer : '',
  });
}
