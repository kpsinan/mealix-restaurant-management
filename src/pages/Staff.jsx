// Staff.jsx
import React, { useState, useEffect } from 'react';
import { getStaff, addStaff, addStaffInBulk } from '../firebase/firebase';
import Modal from '../components/Modal'; // Assuming Modal component exists and is styled

// --- SVG Icons ---
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);
const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657l-4.243 4.243a2 2 0 01-2.828 0l-4.242-4.242a8 8 0 1111.313 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
// NEW: Spinner Icon for loading state
const SpinnerIcon = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
// NEW: More appropriate icon for "Bulk Add"
const BulkAddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-5m-1.37-4.25L13.5 13.5m0 0L9.75 9.75M13.5 13.5L17.25 17.25M9 20H4v-5m1.37-4.25L9.5 13.5m0 0l3.75-3.75M9.5 13.5l-3.75 3.75M4 4h5v5m11 0h-5V4" />
    </svg>
);


const initialNewStaffState = { name: '', contact: '', address: '' };
const initialBulkRow = { name: '', contact: '', address: '' };

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState(initialNewStaffState);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkStaff, setBulkStaff] = useState([initialBulkRow]);
  
  // NEW: State to handle loading feedback
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const staffData = await getStaff();
        setStaff(staffData);
      } catch (error) {
        console.error('Error loading staff:', error);
      }
    };
    fetchStaff();
  }, []);

  const handleNewStaffChange = (e) => {
    const { name, value } = e.target;
    setNewStaff(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStaff = async () => {
    if (!newStaff.name.trim()) {
      alert('Staff name is required.');
      return;
    }

    setIsLoading(true); // Start loading
    try {
      const addedStaff = await addStaff(newStaff);
      setStaff([...staff, addedStaff]);
      setNewStaff(initialNewStaffState); // Clear form
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Failed to add staff member.');
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleBulkStaffChange = (index, e) => {
    const { name, value } = e.target;
    const list = [...bulkStaff];
    list[index][name] = value;
    setBulkStaff(list);
  };

  const addBulkRow = () => {
    setBulkStaff([...bulkStaff, { ...initialBulkRow }]);
  };

  const handleBulkSubmit = async () => {
    const validStaff = bulkStaff.filter(member => member.name.trim() !== '');
    if (validStaff.length === 0) {
      alert("Please enter a name for at least one staff member.");
      return;
    }
    
    setIsLoading(true); // Start loading
    try {
      await addStaffInBulk(validStaff);
      const staffData = await getStaff(); // Refetch all staff
      setStaff(staffData);
      setBulkStaff([initialBulkRow]); // Clear form
      setIsBulkModalOpen(false);
    } catch (error) {
      console.error('Error adding staff in bulk:', error);
      alert('Failed to add staff members in bulk.');
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // ... (handleKeyDown function remains the same)
  const handleKeyDown = (e, rowIndex, colIndex) => {
    const { key, shiftKey } = e;
    const keyMap = { ArrowDown: { r: 1, c: 0 }, Enter: { r: 1, c: 0, cond: !shiftKey }, ArrowUp: { r: -1, c: 0 }, ArrowRight: { r: 0, c: 1 }, Tab: { r: 0, c: 1, cond: !shiftKey }, ArrowLeft: { r: 0, c: -1 }, };
    let move = null;
    if (key === 'Tab' && shiftKey) move = { r: 0, c: -1 };
    else if (keyMap[key] && (keyMap[key].cond !== false)) move = keyMap[key];
    if (!move) return;
    e.preventDefault();
    let nextRow = rowIndex + move.r, nextCol = colIndex + move.c;
    if (nextCol > 2) { nextCol = 0; nextRow++; }
    if (nextCol < 0) { nextCol = 2; nextRow--; }
    if ((key === 'ArrowDown' || (key === 'Enter' && !shiftKey)) && rowIndex === bulkStaff.length - 1) {
      addBulkRow();
      setTimeout(() => { document.querySelector(`[data-row='${nextRow}'][data-col='${colIndex}']`)?.focus(); }, 0);
      return;
    }
    const nextInput = document.querySelector(`[data-row='${nextRow}'][data-col='${nextCol}']`);
    if (nextInput) { nextInput.focus(); nextInput.select(); }
  };

  return (
    <div className="bg-slate-50 min-h-full p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto">
        {/* --- Header --- */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800">Staff Management</h1>
          <p className="text-slate-500 mt-1">Add, view, and manage your team members.</p>
        </div>

        {/* --- Main Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* ... (Add Staff and Staff Member Cards remain the same) ... */}
            <button onClick={() => setIsModalOpen(true)} className="group bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center h-64 text-center hover:border-indigo-500 hover:text-indigo-600 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-semibold mt-2">Add New Staff</span>
            </button>
            {staff.map((member) => (
            <div key={member.id} className="bg-white rounded-xl shadow-md h-64 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                   <UserIcon />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-slate-800 truncate">{member.name}</h3>
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                {member.contact && (
                  <p className="flex items-center break-all"><PhoneIcon />{member.contact}</p>
                )}
                {member.address && (
                  <p className="flex items-start break-all"><LocationIcon />{member.address}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* --- Single Add Modal --- */}
        <Modal isOpen={isModalOpen} onClose={() => !isLoading && setIsModalOpen(false)}>
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800">Add New Staff</h2>
            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 disabled:opacity-50" disabled={isLoading}>&times;</button>
          </div>
          <div className="mt-6 space-y-4">
            <input type="text" name="name" value={newStaff.name} onChange={handleNewStaffChange} placeholder="Enter staff name *" className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100" disabled={isLoading}/>
            <input type="text" name="contact" value={newStaff.contact} onChange={handleNewStaffChange} placeholder="Contact Details (e.g., phone)" className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100" disabled={isLoading}/>
            <input type="text" name="address" value={newStaff.address} onChange={handleNewStaffChange} placeholder="Address" className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100" disabled={isLoading}/>
          </div>
          <div className="flex justify-end mt-6 space-x-4">
             <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50" disabled={isLoading}>Cancel</button>
             <button onClick={handleAddStaff} className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center disabled:bg-indigo-400" disabled={isLoading}>
                {isLoading ? <><SpinnerIcon /> Saving...</> : 'Save Staff'}
             </button>
          </div>
        </Modal>

        {/* --- Bulk Add Modal --- */}
        <Modal isOpen={isBulkModalOpen} onClose={() => !isLoading && setIsBulkModalOpen(false)} size="xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800">Bulk Add Staff</h2>
                <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600 disabled:opacity-50" disabled={isLoading}>&times;</button>
            </div>
            <p className="text-sm text-slate-500 my-4">Use Arrow Keys, Tab, or Enter to navigate. A new row is added automatically.</p>
            <div className="w-full max-h-[60vh] overflow-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-100 z-10">
                    <tr>
                    <th className="p-3 font-semibold text-left text-slate-600">Name *</th>
                    <th className="p-3 font-semibold text-left text-slate-600">Contact Details</th>
                    <th className="p-3 font-semibold text-left text-slate-600">Address</th>
                    </tr>
                </thead>
                <tbody>
                    {bulkStaff.map((member, index) => (
                    <tr key={index} className="even:bg-slate-50">
                        <td><input type="text" name="name" value={member.name} onChange={(e) => handleBulkStaffChange(index, e)} onKeyDown={(e) => handleKeyDown(e, index, 0)} data-row={index} data-col={0} placeholder={`Staff ${index + 1}`} className="w-full p-3 bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100" disabled={isLoading}/></td>
                        <td><input type="text" name="contact" value={member.contact} onChange={(e) => handleBulkStaffChange(index, e)} onKeyDown={(e) => handleKeyDown(e, index, 1)} data-row={index} data-col={1} placeholder="Contact" className="w-full p-3 bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100" disabled={isLoading}/></td>
                        <td><input type="text" name="address" value={member.address} onChange={(e) => handleBulkStaffChange(index, e)} onKeyDown={(e) => handleKeyDown(e, index, 2)} data-row={index} data-col={2} placeholder="Address" className="w-full p-3 bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100" disabled={isLoading}/></td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center mt-6">
                <button onClick={addBulkRow} className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors disabled:opacity-50" disabled={isLoading}>+ Add Row</button>
                <div className="flex space-x-4">
                    <button onClick={() => setIsBulkModalOpen(false)} className="px-6 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50" disabled={isLoading}>Cancel</button>
                    <button onClick={handleBulkSubmit} className="bg-indigo-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center disabled:bg-indigo-400" disabled={isLoading}>
                        {isLoading ? <><SpinnerIcon /> Saving...</> : 'Save All'}
                    </button>
                </div>
            </div>
        </Modal>

        {/* --- Floating Action Button for Bulk Add with CORRECTED icon --- */}
        <button onClick={() => setIsBulkModalOpen(true)} className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-110">
          <BulkAddIcon />
        </button>
      </div>
    </div>
  );
};

export default Staff;