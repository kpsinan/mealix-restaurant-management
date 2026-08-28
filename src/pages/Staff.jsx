import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // <--- 1. Import useNavigate
import {
  getStaff,
  addStaff,
  addStaffInBulk,
  deleteStaff,
  deleteStaffInBulk,
} from "../firebase/firebase";
import Modal from "../components/Modal";

/* ---------------- ICONS ---------------- */
const CheckIcon = () => <span className="text-indigo-600 font-bold">✓</span>;
const TrashIcon = () => <span className="text-rose-600 font-bold">🗑</span>;
const PlusIcon = () => <span className="font-bold text-xl">+</span>;
const AttendanceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

/* ---------------- COMPONENT ---------------- */
const Staff = () => {
  const navigate = useNavigate(); // <--- 2. Initialize the hook
  
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const [newStaff, setNewStaff] = useState({
    name: "",
    contact: "",
    address: "",
    email: "",
    password: "",
    role: "staff"
  });

  const [bulkRows, setBulkRows] = useState([
    { name: "", contact: "", address: "" },
  ]);

  /* ---------------- LOAD ---------------- */
  const loadStaff = async () => {
    const data = await getStaff();
    setStaff(data);
    setSelected([]);
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleAddStaff = async () => {
    if (!newStaff.name.trim()) return alert("Name required");
    setLoading(true);
    try {
      await addStaff(newStaff);
      setNewStaff({ name: "", contact: "", address: "", email: "", password: "", role: "staff" });
      setIsAddOpen(false);
      await loadStaff();
    } catch (err) {
      alert("Failed to add staff. " + err.message);
    }
    setLoading(false);
  };

  /* ---------------- BULK ADD ---------------- */
  const handleBulkAdd = async () => {
    const valid = bulkRows.filter((r) => r.name.trim());
    if (!valid.length) return alert("No valid rows");
    setLoading(true);
    await addStaffInBulk(valid);
    setBulkRows([{ name: "", contact: "", address: "" }]);
    setIsBulkOpen(false);
    await loadStaff();
    setLoading(false);
  };

  /* ---------------- DELETE ---------------- */
  const handleDeleteOne = async (id) => {
    if (!window.confirm("Delete this staff member?")) return;
    await deleteStaff(id);
    await loadStaff();
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} staff?`)) return;
    await deleteStaffInBulk(selected);
    await loadStaff();
  };

  /* ---------------- SELECT ---------------- */
  const toggleSelect = (id) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  const toggleSelectAll = () =>
    setSelected(
      selected.length === staff.length ? [] : staff.map((s) => s.id)
    );

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">
              Staff Management
            </h1>
            <p className="text-slate-500 text-sm">
              Manage employees, contacts & unique IDs
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* NAVIGATION BUTTON TO ATTENDANCE */}
            <button
              onClick={() => navigate('/attendance')} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <AttendanceIcon />
              Mark Attendance
            </button>

            {selected.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-rose-100 text-rose-600 px-4 py-2 rounded-lg font-semibold hover:bg-rose-200"
              >
                <TrashIcon /> Delete ({selected.length})
              </button>
            )}

            <button
              onClick={() => setIsBulkOpen(true)}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-slate-900 transition"
            >
              Bulk Add
            </button>

            <button
              onClick={() => setIsAddOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-1"
            >
              <PlusIcon /> Add Staff
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.length === staff.length && staff.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-3 text-left">Staff ID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Address</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr
                  key={s.id}
                  className="border-t hover:bg-slate-50 transition"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100">
                      {s.staffId || "Generating..."}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-800">
                    {s.name}
                  </td>
                  <td className="p-3">{s.contact || "—"}</td>
                  <td className="p-3 max-w-xs truncate">
                    {s.address || "—"}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteOne(s.id)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}

              {!staff.length && (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center p-6 text-slate-400"
                  >
                    No staff found. Click "Add Staff" to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD MODAL */}
      <Modal isOpen={isAddOpen} onClose={() => !loading && setIsAddOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Add New Staff</h2>
        <p className="text-sm text-slate-500 mb-4">A unique Staff ID will be assigned automatically upon saving.</p>
        <div className="space-y-4">
          <input
            placeholder="Name *"
            value={newStaff.name}
            onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
            className="w-full p-2.5 border rounded-lg"
          />
          <input
            placeholder="Contact Number"
            value={newStaff.contact}
            onChange={(e) => setNewStaff({ ...newStaff, contact: e.target.value })}
            className="w-full p-2.5 border rounded-lg"
          />
          <textarea
            placeholder="Address"
            value={newStaff.address}
            onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })}
            className="w-full p-2.5 border rounded-lg"
          />
          
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">System Access (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Login Email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                className="w-full p-2.5 border rounded-lg bg-gray-50"
              />
              <input
                type="password"
                placeholder="Login Password"
                value={newStaff.password}
                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                className="w-full p-2.5 border rounded-lg bg-gray-50"
              />
            </div>
            
            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Role</label>
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                className="w-full p-2.5 border rounded-lg bg-white"
              >
                <option value="staff">Staff (Orders & Kitchen)</option>
                <option value="billing">Billing (Orders & Billing)</option>
                <option value="accountant">Accountant (Reports & Finance)</option>
                <option value="manager">Manager (All except Settings)</option>
                <option value="admin">Admin (Full Access)</option>
              </select>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">If provided, this staff member can log in to the system with the specified role.</p>
          </div>
          <button
            onClick={handleAddStaff}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? "Saving..." : "Save Staff Member"}
          </button>
        </div>
      </Modal>

      {/* BULK MODAL */}
      <Modal isOpen={isBulkOpen} onClose={() => !loading && setIsBulkOpen(false)} size="xl">
        <h2 className="text-xl font-bold mb-4">Bulk Add Staff</h2>

        <div className="max-h-80 overflow-y-auto border rounded-lg mb-4 shadow-inner">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Contact</th>
                <th className="p-2 text-left">Address</th>
              </tr>
            </thead>
            <tbody>
              {bulkRows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">
                    <input
                      className="w-full input border-none focus:ring-0"
                      placeholder="Name"
                      value={r.name}
                      onChange={(e) => {
                        const c = [...bulkRows];
                        c[i].name = e.target.value;
                        setBulkRows(c);
                      }}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full input border-none focus:ring-0"
                      placeholder="Contact"
                      value={r.contact}
                      onChange={(e) => {
                        const c = [...bulkRows];
                        c[i].contact = e.target.value;
                        setBulkRows(c);
                      }}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full input border-none focus:ring-0"
                      placeholder="Address"
                      value={r.address}
                      onChange={(e) => {
                        const c = [...bulkRows];
                        c[i].address = e.target.value;
                        setBulkRows(c);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() =>
              setBulkRows([...bulkRows, { name: "", contact: "", address: "" }])
            }
            className="text-indigo-600 font-bold hover:text-indigo-800 transition"
          >
            + Add Another Row
          </button>

          <button
            onClick={handleBulkAdd}
            disabled={loading}
            className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? "Importing..." : "Import All"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Staff;