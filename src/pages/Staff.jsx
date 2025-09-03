import React, { useState, useEffect } from 'react';
import { getStaff, addStaff } from '../firebase/firebase';
import Modal from '../components/Modal';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');

  // Fetch staff from Firebase
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

  // Handle adding a new staff member
  const handleAddStaff = async () => {
    if (staffName.trim()) {
      try {
        const newStaff = await addStaff(staffName);
        setStaff([...staff, newStaff]);
        setStaffName('');
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error adding staff:', error);
        alert('Failed to add staff member.');
      }
    } else {
      alert('Staff name is required.');
    }
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Staff</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Add Staff Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="card border-2 border-dashed border-gray-400 flex items-center justify-center h-40"
        >
          <span className="text-gray-500 font-medium">+ Add Staff</span>
        </button>
        {/* Staff Cards */}
        {staff.map((member) => (
          <div key={member.id} className="card flex items-center justify-center h-40">
            <span className="text-xl font-semibold text-gray-800">{member.name}</span>
          </div>
        ))}
      </div>
      {/* Add Staff Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Staff</h2>
        <input
          type="text"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          placeholder="Enter staff name"
          className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end">
          <button
            onClick={handleAddStaff}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Staff;