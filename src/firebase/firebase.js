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
  Timestamp,
  getCountFromServer, // Added for Dashboard optimization
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXKdnkxtgKARc0fWiA1BD5ok3qc8AqCVc",
  authDomain: "syncserve-dev.firebaseapp.com",
  databaseURL: "https://syncserve-dev-default-rtdb.firebaseio.com",
  projectId: "syncserve-dev",
  storageBucket: "syncserve-dev.firebasestorage.app",
  messagingSenderId: "1029186931798",
  appId: "1:1029186931798:web:ec31db4513af2edc057ff7",
  measurementId: "G-LX9Z2Y6SN9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection references
const tablesCollection = collection(db, "tables");
const menuItemsCollection = collection(db, "menuItems");
const staffCollection = collection(db, "staff");
const ordersCollection = collection(db, "orders");
const settingsCollection = collection(db, "settings");
const salesCollection = collection(db, "salesRecords");

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
      console.warn("Settings document 'appSettings' not found. Using defaults.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw error;
  }
};

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
   Tables
   ---------------------- */
// UPDATED: Added capacity parameter (defaulting to 4 for backward compatibility)
export const addTable = async (name, capacity = 4) => {
  try {
    const docRef = await addDoc(tablesCollection, { name, capacity: Number(capacity), status: "available" });
    return { id: docRef.id, name, capacity: Number(capacity), status: "available" };
  } catch (error) {
    console.error("Error adding table:", error);
    throw error;
  }
};

export const addTablesInBulk = async (tableNames) => {
  if (!tableNames || tableNames.length === 0) {
    throw new Error("addTablesInBulk: tableNames array is required and cannot be empty.");
  }
  try {
    const batch = writeBatch(db);
    tableNames.forEach((name) => {
      const tableRef = doc(collection(db, "tables"));
      // Default bulk add to capacity 4 if not specified
      batch.set(tableRef, { name, capacity: 4, status: "available" });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error adding tables in bulk:", error);
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

// NEW: Helper to update multiple tables at once (Atomically)
export const updateMultipleTablesStatus = async (tableIds, status) => {
  if (!tableIds || tableIds.length === 0) return;
  try {
    const batch = writeBatch(db);
    tableIds.forEach(id => {
      const ref = doc(db, "tables", id);
      batch.update(ref, { status });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error bulk updating table status:", error);
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

export const deleteTablesInBulk = async (tableIds) => {
  if (!tableIds || tableIds.length === 0) {
    throw new Error("deleteTablesInBulk: tableIds array is required and cannot be empty.");
  }
  try {
    const batch = writeBatch(db);
    tableIds.forEach((id) => {
      const tableRef = doc(db, "tables", id);
      batch.delete(tableRef);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error deleting tables in bulk:", error);
    throw error;
  }
};


/* ----------------------
   Menu Items
   ---------------------- */
export const addMenuItem = async (item) => {
  try {
    if (!item || !item.name || item.fullPrice == null) {
      throw new Error("addMenuItem: item must have a name and a fullPrice.");
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

export const deleteMenuItemsInBulk = async (itemIds) => {
  if (!itemIds || itemIds.length === 0) {
    throw new Error("deleteMenuItemsInBulk: itemIds array is required and cannot be empty.");
  }
  try {
    const batch = writeBatch(db);
    itemIds.forEach((id) => {
      const itemRef = doc(db, "menuItems", id);
      batch.delete(itemRef);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error deleting menu items in bulk:", error);
    throw error;
  }
};

export const updateMenuItemsInBulk = async (itemsToUpdate) => {
  if (!itemsToUpdate || itemsToUpdate.length === 0) {
    console.warn("updateMenuItemsInBulk: No items to update.");
    return;
  }
  try {
    const batch = writeBatch(db);
    itemsToUpdate.forEach(item => {
      const { id, ...data } = item;
      if (!id) return;
      const itemRef = doc(db, "menuItems", id);
      batch.update(itemRef, data);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error updating menu items in bulk:", error);
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


/* ----------------------
   Staff
   ---------------------- */
export const addStaff = async (staffData) => {
  try {
    if (!staffData || !staffData.name) {
      throw new Error("addStaff: Staff data must include a name.");
    }
    const docRef = await addDoc(staffCollection, staffData);
    return { id: docRef.id, ...staffData };
  } catch (error) {
    console.error("Error adding staff:", error);
    throw error;
  }
};

export const addStaffInBulk = async (staffArray) => {
  if (!staffArray || staffArray.length === 0) {
    throw new Error("addStaffInBulk: staffArray is required and cannot be empty.");
  }
  try {
    const batch = writeBatch(db);
    staffArray.forEach((staffMember) => {
      if (staffMember.name && staffMember.name.trim() !== "") {
        const staffRef = doc(collection(db, "staff"));
        batch.set(staffRef, {
          name: staffMember.name || "",
          contact: staffMember.contact || "",
          address: staffMember.address || "",
        });
      }
    });
    await batch.commit();
  } catch (error) {
    console.error("Error adding staff in bulk:", error);
    throw error;
  }
};

export const getStaff = async () => {
  try {
    const snapshot = await getDocs(staffCollection);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching staff:", error);
    throw error;
  }
};


/* ----------------------
   Orders
   ---------------------- */
export const addOrder = async (order) => {
  try {
    // FIX: Explicitly set status to 'Pending' so Dashboard queries work
    const newOrder = {
      ...order,
      status: "Pending", 
    };
    const docRef = await addDoc(ordersCollection, newOrder);
    return { id: docRef.id, ...newOrder };
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

export const updateOrderStatus = async (orderId, newStatus) => {
  if (!orderId || !newStatus) {
    throw new Error("updateOrderStatus: orderId and newStatus are required.");
  }
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: newStatus,
    });
  } catch (error) {
    console.error(`Error updating order status for order ${orderId}:`, error);
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

export const clearAllOrders = async () => {
  try {
    const ordersSnapshot = await getDocs(ordersCollection);
    if (ordersSnapshot.empty) {
      console.log("No orders to delete.");
      return; 
    }
    const batch = writeBatch(db);
    ordersSnapshot.docs.forEach((document) => {
      batch.delete(document.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error clearing all orders:", error);
    throw error;
  }
};

/* ----------------------
   Sales Records
   ---------------------- */
export const addSaleRecord = async (saleData) => {
  try {
    const record = {
      ...saleData,
      finalizedAt: Timestamp.now(), 
    };
    await addDoc(salesCollection, record);
  } catch (error) {
    console.error("Error adding sale record:", error);
    throw error;
  }
};

export const getSalesByDateRange = async (startDate, endDate) => {
  try {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      salesCollection,
      where("finalizedAt", ">=", Timestamp.fromDate(startDate)),
      where("finalizedAt", "<=", Timestamp.fromDate(endOfDay))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        finalizedAt: data.finalizedAt.toDate(),
      };
    });
  } catch (error) {
    console.error("Error fetching sales by date range:", error);
    throw error;
  }
};

export default db;