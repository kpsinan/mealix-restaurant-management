// firebase.js
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
  setDoc, // <-- IMPORT setDoc
} from "firebase/firestore";

// Firebase configuration... (rest of the config is the same)
const firebaseConfig = {
  apiKey: "AIzaSyDqxaUutYqyGsYfny_PUdrArV1VcJ432MI",
  authDomain: "syncserve-7a27b.firebaseapp.com",
  projectId: "syncserve-7a27b",
  storageBucket: "syncserve-7a27b.firebasestorage.app",
  messagingSenderId: "961632456350",
  appId: "1:961632456350:web:372b3e4deec94dd740358f",
  measurementId: "G-TNYB3MM0ZV"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections... (rest of the collections are the same)
const tablesCollection = collection(db, "tables");
const menuItemsCollection = collection(db, "menuItems");
const staffCollection = collection(db, "staff");
const ordersCollection = collection(db, "orders");
const settingsCollection = collection(db, "settings");

/* ----------------------
   Settings
   ---------------------- */
export const getSettings = async () => {
  try {
    const settingsDocRef = doc(db, "settings", "appSettings");
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.warn("Settings document 'appSettings' not found.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw error;
  }
};

/**
 * Creates or updates the application settings document.
 * @param {object} settingsData - The settings object to save.
 * @returns {Promise<void>}
 */
export const updateSettings = async (settingsData) => {
  try {
    const settingsDocRef = doc(db, "settings", "appSettings");
    await setDoc(settingsDocRef, settingsData, { merge: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
};


/* ----------------------
   Tables, Menu Items, Staff, Orders...
   (The rest of your firebase.js functions remain the same)
   ---------------------- */
// ... (all other functions like addTable, getTables, etc.)
export const addTable = async (name) => {
  try {
    const docRef = await addDoc(tablesCollection, { name, status: "available" });
    return { id: docRef.id, name, status: "available" };
  } catch (error) {
    console.error("Error adding table:", error);
    throw error;
  }
};

export const getTables = async () => {
  try {
    const snapshot = await getDocs(tablesCollection);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching tables:", error);
    throw error;
  }
};

export const onTablesRealtime = (callback, onError) => {
  return onSnapshot(
    tablesCollection,
    (snapshot) => {
      const tables = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(tables);
    },
    (err) => {
      console.error("onTablesRealtime error:", err);
      if (onError) onError(err);
    }
  );
};

export const updateTableStatus = async (tableId, status) => {
  if (!tableId) throw new Error("updateTableStatus: tableId is required");
  try {
    const tableRef = doc(db, "tables", tableId);
    await updateDoc(tableRef, { status });
    return true;
  } catch (error) {
    console.error("Error updating table status:", error);
    throw error;
  }
};

export const deleteTable = async (tableId) => {
  if (!tableId) throw new Error("deleteTable: tableId is required");
  try {
    await deleteDoc(doc(db, "tables", tableId));
    return true;
  } catch (error) {
    console.error("Error deleting table:", error);
    throw error;
  }
};

export const addMenuItem = async (item) => {
  try {
    if (!item || !item.name || item.price == null) {
      throw new Error("addMenuItem: item must have name and price");
    }
    const docRef = await addDoc(menuItemsCollection, item);
    return { id: docRef.id, ...item };
  } catch (error) {
    console.error("Error adding menu item:", error);
    throw error;
  }
};

export const getMenuItems = async () => {
  try {
    const snapshot = await getDocs(menuItemsCollection);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching menu items:", error);
    throw error;
  }
};

export const getMenuItemById = async (id) => {
  if (!id) throw new Error("getMenuItemById: id is required");
  try {
    const d = await getDoc(doc(db, "menuItems", id));
    if (!d.exists()) return null;
    return { id: d.id, ...d.data() };
  } catch (error) {
    console.error("Error fetching menu item by id:", error);
    throw error;
  }
};

export const updateMenuItem = async (id, updates) => {
  if (!id) throw new Error("updateMenuItem: id is required");
  try {
    const ref = doc(db, "menuItems", id);
    await updateDoc(ref, updates);
    return true;
  } catch (error) {
    console.error("Error updating menu item:", error);
    throw error;
  }
};

export const deleteMenuItem = async (id) => {
  if (!id) throw new Error("deleteMenuItem: id is required");
  try {
    await deleteDoc(doc(db, "menuItems", id));
    return true;
  } catch (error) {
    console.error("Error deleting menu item:", error);
    throw error;
  }
};

export const onMenuItemsRealtime = (callback, onError) => {
  return onSnapshot(
    menuItemsCollection,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    (err) => {
      console.error("onMenuItemsRealtime error:", err);
      if (onError) onError(err);
    }
  );
};

export const addStaff = async (name) => {
  try {
    const docRef = await addDoc(staffCollection, { name });
    return { id: docRef.id, name };
  } catch (error) {
    console.error("Error adding staff:", error);
    throw error;
  }
};

export const getStaff = async () => {
  try {
    const snapshot = await getDocs(staffCollection);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error)
    {
    console.error("Error fetching staff:", error);
    throw error;
  }
};

export const addOrder = async (order) => {
  try {
    const docRef = await addDoc(ordersCollection, order);
    return { id: docRef.id, ...order };
  } catch (error) {
    console.error("Error adding order:", error);
    throw error;
  }
};

export const getOrders = async () => {
  try {
    const snapshot = await getDocs(ordersCollection);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

export const deleteOrder = async (orderId) => {
  if (!orderId) throw new Error("deleteOrder: orderId is required");
  try {
    await deleteDoc(doc(db, "orders", orderId));
    return true;
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};

export const onOrdersRealtime = (callback, onError) => {
  return onSnapshot(
    ordersCollection,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(orders);
    },
    (err) => {
      console.error("onOrdersRealtime error:", err);
      if (onError) onError(err);
    }
  );
};

export default db;