import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  getCountFromServer,
} from "firebase/firestore";

/* =====================================================
   FIREBASE CONFIG
===================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyDXKdnkxtgKARc0fWiA1BD5ok3qc8AqCVc",
  authDomain: "syncserve-dev.firebaseapp.com",
  databaseURL: "https://syncserve-dev-default-rtdb.firebaseio.com",
  projectId: "syncserve-dev",
  storageBucket: "syncserve-dev.firebasestorage.app",
  messagingSenderId: "1029186931798",
  appId: "1:1029186931798:web:ec31db4513af2edc057ff7",
  measurementId: "G-LX9Z2Y6SN9",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =====================================================
   COLLECTIONS
===================================================== */
const tablesCollection = collection(db, "tables");
const menuItemsCollection = collection(db, "menuItems");
const categoriesCollection = collection(db, "categories");
const staffCollection = collection(db, "staff");
const attendanceCollection = collection(db, "attendance");
const ordersCollection = collection(db, "orders");
const settingsCollection = collection(db, "settings");
const salesCollection = collection(db, "salesRecords");

/* =====================================================
   SETTINGS
===================================================== */
export const getSettings = async () => {
  const ref = doc(db, "settings", "appSettings");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

export const updateSettings = async (data) =>
  setDoc(doc(db, "settings", "appSettings"), data, { merge: true });

/* =====================================================
   CATEGORIES
===================================================== */
export const addCategory = async (data) => {
  const ref = await addDoc(categoriesCollection, data);
  return { id: ref.id, ...data };
};

export const onCategoriesRealtime = (cb, err) =>
  onSnapshot(categoriesCollection, s =>
    cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), err);

/* =====================================================
   TABLES
===================================================== */
export const addTable = async (name, capacity = 4) =>
  addDoc(tablesCollection, {
    name,
    capacity: Number(capacity),
    status: "available",
    createdAt: Timestamp.now(),
  });

export const addTablesInBulk = async (names) => {
  const batch = writeBatch(db);
  names.forEach((name) => {
    const ref = doc(collection(db, "tables"));
    batch.set(ref, { name, capacity: 4, status: "available" });
  });
  await batch.commit();
};

export const getTables = async () =>
  (await getDocs(tablesCollection)).docs.map(d => ({ id: d.id, ...d.data() }));

export const onTablesRealtime = (cb, err) =>
  onSnapshot(tablesCollection, s =>
    cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), err);

export const updateTableStatus = async (id, status) =>
  updateDoc(doc(db, "tables", id), { status });

export const updateMultipleTablesStatus = async (ids, status) => {
  const batch = writeBatch(db);
  ids.forEach(id => batch.update(doc(db, "tables", id), { status }));
  await batch.commit();
};

export const deleteTable = async (id) =>
  deleteDoc(doc(db, "tables", id));

export const deleteTablesInBulk = async (ids) => {
  const batch = writeBatch(db);
  ids.forEach(id => batch.delete(doc(db, "tables", id)));
  await batch.commit();
};

/* =====================================================
   MENU ITEMS
===================================================== */
export const addMenuItem = async (item) =>
  addDoc(menuItemsCollection, item);

export const getMenuItems = async () =>
  (await getDocs(menuItemsCollection)).docs.map(d => ({ id: d.id, ...d.data() }));

export const getMenuItemById = async (id) => {
  const d = await getDoc(doc(db, "menuItems", id));
  return d.exists() ? { id: d.id, ...d.data() } : null;
};

export const updateMenuItem = async (id, data) =>
  updateDoc(doc(db, "menuItems", id), data);

export const deleteMenuItem = async (id) =>
  deleteDoc(doc(db, "menuItems", id));

export const deleteMenuItemsInBulk = async (ids) => {
  const batch = writeBatch(db);
  ids.forEach(id => batch.delete(doc(db, "menuItems", id)));
  await batch.commit();
};

export const updateMenuItemsInBulk = async (items) => {
  const batch = writeBatch(db);
  items.forEach(({ id, ...data }) =>
    batch.update(doc(db, "menuItems", id), data)
  );
  await batch.commit();
};

export const onMenuItemsRealtime = (cb, err) =>
  onSnapshot(menuItemsCollection, s =>
    cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), err);

/* =====================================================
   STAFF
===================================================== */
export const getNextStaffId = async () => {
  const snap = await getDocs(staffCollection);
  let max = 1000;
  snap.docs.forEach(d => {
    const id = d.data().staffId;
    if (id && id.startsWith("STF-")) {
      const num = parseInt(id.split("-")[1]);
      if (!isNaN(num)) max = Math.max(max, num);
    }
  });
  return `STF-${max + 1}`;
};

export const addStaff = async (data) => {
  const staffId = await getNextStaffId();
  return addDoc(staffCollection, { ...data, staffId, createdAt: Timestamp.now() });
};

export const addStaffInBulk = async (list) => {
  const batch = writeBatch(db);
  let startId = 1000;
  
  const snap = await getDocs(staffCollection);
  snap.docs.forEach(d => {
    const id = d.data().staffId;
    if (id && id.startsWith("STF-")) {
      const num = parseInt(id.split("-")[1]);
      if (!isNaN(num)) startId = Math.max(startId, num);
    }
  });

  list.forEach((s, index) => {
    const ref = doc(collection(db, "staff"));
    batch.set(ref, { 
      ...s, 
      staffId: `STF-${startId + index + 1}`,
      createdAt: Timestamp.now() 
    });
  });
  await batch.commit();
};

export const getStaff = async () =>
  (await getDocs(staffCollection)).docs.map(d => ({ id: d.id, ...d.data() }));

export const deleteStaff = async (id) =>
  deleteDoc(doc(db, "staff", id));

export const deleteStaffInBulk = async (ids) => {
  const batch = writeBatch(db);
  ids.forEach(id => batch.delete(doc(db, "staff", id)));
  await batch.commit();
};

/* =====================================================
   ATTENDANCE & REPORTING
===================================================== */
export const addAttendance = async (data) => {
  return addDoc(attendanceCollection, {
    ...data,
    timestamp: Timestamp.now(), 
    dateStr: new Date().toISOString().split('T')[0] 
  });
};

export const getTodayAttendance = async (staffId) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const q = query(
    attendanceCollection, 
    where("staffId", "==", staffId),
    where("dateStr", "==", todayStr)
  );
  
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => b.timestamp - a.timestamp);
};

// New Reporting Helper: Fetches historical records for all or specific staff
export const getAttendanceRecords = async (staffId = null) => {
  try {
    let q = query(attendanceCollection, orderBy("timestamp", "desc"));
    
    if (staffId && staffId !== "all") {
      q = query(attendanceCollection, where("staffId", "==", staffId), orderBy("timestamp", "desc"));
    }
    
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      let ts = data.timestamp;

      // Robust check: Convert Firestore Timestamp to Date, or handle existing Date/String
      if (ts && typeof ts.toDate === 'function') {
        ts = ts.toDate();
      } else if (ts && ts.seconds) {
        ts = new Date(ts.seconds * 1000);
      } else {
        ts = new Date(ts); // Fallback for strings or native dates
      }

      return { 
        id: d.id, 
        ...data,
        timestamp: ts 
      };
    });
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return [];
  }
};
/* =====================================================
   ORDERS
===================================================== */
export const addOrder = async (order) =>
  addDoc(ordersCollection, { ...order, status: "Pending" });

export const getOrders = async () =>
  (await getDocs(ordersCollection)).docs.map(d => ({ id: d.id, ...d.data() }));

export const deleteOrder = async (id) =>
  deleteDoc(doc(db, "orders", id));

export const updateOrderStatus = async (id, status) =>
  updateDoc(doc(db, "orders", id), { status });

export const onOrdersRealtime = (cb, err) =>
  onSnapshot(ordersCollection, s =>
    cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), err);

export const clearAllOrders = async () => {
  const snap = await getDocs(ordersCollection);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
};

/* =====================================================
   SALES
===================================================== */
export const addSaleRecord = async (data) =>
  addDoc(salesCollection, { ...data, finalizedAt: Timestamp.now() });

export const getAllSales = async () =>
  (await getDocs(salesCollection)).docs.map(d => ({ id: d.id, ...d.data() }));

export const getSalesByDateRange = async (start, end) => {
  const endDay = new Date(end);
  endDay.setHours(23, 59, 59, 999);
  const q = query(
    salesCollection,
    where("finalizedAt", ">=", Timestamp.fromDate(start)),
    where("finalizedAt", "<=", Timestamp.fromDate(endDay))
  );
  return (await getDocs(q)).docs.map(d => ({
    id: d.id,
    ...d.data(),
    finalizedAt: d.data().finalizedAt.toDate(),
  }));
};

/* =====================================================
   DASHBOARD
===================================================== */
export const getCollectionCount = async (name) => {
  try {
    const snap = await getCountFromServer(collection(db, name));
    return snap.data().count;
  } catch {
    return 0;
  }
};

export default db;