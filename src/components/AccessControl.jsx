import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserAccess, DEFAULT_PERMISSIONS } from '../firebase/firebase';
import { FaUserShield, FaBan, FaCheck, FaEdit, FaTimes } from 'react-icons/fa';

const ALL_AVAILABLE_PERMISSIONS = [
  { key: 'view_dashboard', label: 'View Dashboard' },
  { key: 'manage_orders', label: 'Manage Orders' },
  { key: 'manage_kitchen', label: 'Manage Kitchen' },
  { key: 'manage_billing', label: 'Manage Billing' },
  { key: 'manage_menu', label: 'Manage Menu' },
  { key: 'manage_staff', label: 'Manage Staff' },
  { key: 'manage_settings', label: 'Manage Settings' },
  { key: 'view_reports', label: 'View Basic Reports' },
  { key: 'view_financials', label: 'View Financial Reports' },
  { key: 'manage_access', label: 'Manage Access Control' }
];

const AccessControl = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [tempPermissions, setTempPermissions] = useState([]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleBlockStatus = async (user) => {
    try {
      const newStatus = !user.blocked;
      await updateUserAccess(user.uid, { blocked: newStatus });
      setUsers(users.map(u => u.uid === user.uid ? { ...u, blocked: newStatus } : u));
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setTempPermissions(user.permissions || DEFAULT_PERMISSIONS[user.role] || []);
  };

  const togglePermission = (key) => {
    if (tempPermissions.includes(key)) {
      setTempPermissions(tempPermissions.filter(p => p !== key));
    } else {
      setTempPermissions([...tempPermissions, key]);
    }
  };

  const savePermissions = async () => {
    try {
      await updateUserAccess(editingUser.uid, { permissions: tempPermissions });
      setUsers(users.map(u => u.uid === editingUser.uid ? { ...u, permissions: tempPermissions } : u));
      setEditingUser(null);
    } catch (error) {
      alert("Failed to save permissions");
    }
  };

  if (loading) return <div className="text-gray-500 p-4">Loading access records...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">System Access Control</h2>
          <p className="text-sm text-gray-500 mt-1">Manage logins, roles, and granular permissions.</p>
        </div>
        <FaUserShield className="text-indigo-100 w-12 h-12" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs border-b">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800">{user.name || "Unknown"}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize border border-blue-100">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.blocked ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                      <FaBan /> Blocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <FaCheck /> Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 flex gap-3">
                  <button onClick={() => openEditModal(user)} className="text-indigo-600 hover:text-indigo-800 p-2 bg-indigo-50 rounded-lg transition-colors" title="Edit Permissions">
                    <FaEdit />
                  </button>
                  <button onClick={() => toggleBlockStatus(user)} className={`${user.blocked ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-red-600 bg-red-50 hover:bg-red-100'} p-2 rounded-lg transition-colors`} title={user.blocked ? "Unblock" : "Block"}>
                    {user.blocked ? <FaCheck /> : <FaBan />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Edit Permissions</h3>
                <p className="text-sm text-gray-500">Modifying access for <span className="font-semibold text-indigo-600">{editingUser.email}</span></p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="p-6 bg-gray-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ALL_AVAILABLE_PERMISSIONS.map(perm => (
                  <label key={perm.key} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${tempPermissions.includes(perm.key) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:border-indigo-300'}`}>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 mr-3"
                      checked={tempPermissions.includes(perm.key)}
                      onChange={() => togglePermission(perm.key)}
                    />
                    <span className={`text-sm font-medium ${tempPermissions.includes(perm.key) ? 'text-indigo-800' : 'text-gray-700'}`}>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <button onClick={() => setEditingUser(null)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button onClick={savePermissions} className="px-5 py-2.5 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-200">Save Permissions</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessControl;