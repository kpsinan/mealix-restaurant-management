import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStaff } from '../../firebase/firebase'; 
import { 
  UserGroupIcon, 
  IdentificationIcon, 
  PhoneIcon, 
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

const StaffDirectory = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const data = await getStaff(); // Fetches from 'staff' collection
        setStaff(data);
      } catch (error) {
        console.error("Error fetching staff master:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStaffData();
  }, []);

  const filteredStaff = staff.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.staffId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Navigation & Header */}
      <div className="mb-8">
        <Link 
          to="/staff-and-hr" 
          className="flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-4 group"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to HR Management
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Staff Master & Directory</h1>
            <p className="text-gray-500 mt-1">Foundational database of all registered employees.</p>
          </div>
          
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name, ID, or role..."
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl w-full md:w-80 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <UserGroupIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Headcount</p>
            <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
          </div>
        </div>
        {/* Additional metrics can be added here (e.g., Active vs Inactive) */}
      </div>

      {/* Master Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Onboarding Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                        {member.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{member.name}</div>
                        <div className="text-xs text-gray-500 flex items-center mt-0.5">
                          <IdentificationIcon className="h-3 w-3 mr-1" /> {member.staffId || 'No ID'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {member.role || 'General Staff'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="h-3.5 w-3.5 mr-2 text-gray-400" />
                        {member.phone || 'N/A'}
                      </div>
                      {member.email && (
                        <div className="flex items-center text-xs text-gray-500">
                          <EnvelopeIcon className="h-3.5 w-3.5 mr-2 text-gray-400" />
                          {member.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {member.createdAt?.toDate 
                        ? member.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) 
                        : 'Pre-System'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStaff.length === 0 && (
            <div className="p-12 text-center">
              <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No staff members match your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDirectory;