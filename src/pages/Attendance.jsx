import React, { useEffect, useState, useRef } from "react";
import { getStaff, getTodayAttendance, addAttendance, getAttendanceRecords } from "../firebase/firebase";
import Modal from "../components/Modal";

/* ---------------- ICONS ---------------- */
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Attendance = () => {
  const [staffList, setStaffList] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});
  const [loading, setLoading] = useState(true);

  // History & Reporting State
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("punch"); // 'punch' or 'summary'
  const [filterStaff, setFilterStaff] = useState("all");

  // Modal & Processing State
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [punchOutReason, setPunchOutReason] = useState("End of Day");

  // Camera Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  /* ---------------- LOAD DATA ---------------- */
  const loadData = async () => {
    setLoading(true);
    const staff = await getStaff();
    setStaffList(staff);

    // Fetch today's status for the cards
    const statusMap = {};
    for (const s of staff) {
      const records = await getTodayAttendance(s.id);
      if (records.length === 0) {
        statusMap[s.id] = { status: "none" };
      } else {
        const lastRecord = records[0];
        statusMap[s.id] = { 
          status: lastRecord.type === "in" ? "in" : "out",
          lastRecord 
        };
      }
    }
    setAttendanceState(statusMap);
    
    // Load History for reports
    const records = await getAttendanceRecords(filterStaff);
    setHistory(records);
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filterStaff]);

  /* ---------------- LOGIC: CALCULATE SUMMARY ---------------- */
  const getSummaryData = () => {
    const summary = {};

    // Group records by Date + Staff
    history.forEach(rec => {
      const dateKey = rec.dateStr;
      const staffKey = rec.staffId;
      const combinedKey = `${dateKey}_${staffKey}`;

      if (!summary[combinedKey]) {
        summary[combinedKey] = {
          date: dateKey,
          staffName: rec.staffName,
          staffId: rec.staffId,
          firstIn: null,
          lastOut: null,
          records: []
        };
      }
      summary[combinedKey].records.push(rec);
    });

    return Object.values(summary).map(day => {
      // Sort records for this day ascending to calculate duration
      const sorted = day.records.sort((a, b) => a.timestamp - b.timestamp);
      let totalMs = 0;
      let lastInTime = null;

      sorted.forEach(r => {
        if (r.type === "in") {
          if (!day.firstIn) day.firstIn = r.timestamp;
          lastInTime = r.timestamp;
        } else if (r.type === "out" && lastInTime) {
          totalMs += (r.timestamp - lastInTime);
          day.lastOut = r.timestamp;
          lastInTime = null;
        }
      });

      const hours = (totalMs / (1000 * 60 * 60)).toFixed(2);
      return { ...day, activeHours: hours };
    });
  };

  /* ---------------- CAMERA LOGIC ---------------- */
  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera Error: " + err.message);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const context = canvasRef.current.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, 320, 240);
    setPhoto(canvasRef.current.toDataURL("image/jpeg"));
    stopCamera();
  };

  /* ---------------- ACTION HANDLERS ---------------- */
  const uploadToImgBB = async (base64) => {
    const formData = new FormData();
    formData.append("image", base64.split(",")[1]);
    const res = await fetch(`https://api.imgbb.com/1/upload?expiration=2592000&key=723964ef487c0899ac1278689c9bbb80`, {
      method: "POST", body: formData
    });
    const data = await res.json();
    return data.data.url;
  };

  const handleSubmit = async () => {
    if (!photo) return;
    setProcessing(true);
    try {
      const url = await uploadToImgBB(photo);
      const currentStatus = attendanceState[selectedStaff.id]?.status || "none";
      const actionType = currentStatus === "in" ? "out" : "in";

      await addAttendance({
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        type: actionType,
        photoUrl: url,
        reason: actionType === "out" ? punchOutReason : "Check In",
      });

      await loadData();
      setModalOpen(false);
      stopCamera();
    } catch (e) { alert(e.message); }
    setProcessing(false);
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* TOP SECTION: PUNCH CARDS */}
        <div className="flex justify-between items-end mb-6">
          <h1 className="text-2xl font-black text-slate-800">Staff Attendance</h1>
          <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {staffList.map((staff) => {
            const state = attendanceState[staff.id] || { status: 'none' };
            const isIn = state.status === "in";
            return (
              <div key={staff.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-800 truncate mr-2">{staff.name}</h3>
                    <div className={`h-2 w-2 rounded-full ${isIn ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                  </div>
                  <p className="text-xs text-slate-400 font-mono mb-3">{staff.staffId}</p>
                  
                  <div className={`text-[10px] uppercase font-bold px-2 py-1 rounded inline-block mb-4 ${isIn ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                    {isIn ? 'Currently In' : 'Currently Out'}
                  </div>
                </div>

                <button
                  onClick={() => { setSelectedStaff(staff); setPhoto(null); setModalOpen(true); startCamera(); }}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95
                    ${isIn ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  <CameraIcon /> {isIn ? 'Punch Out' : 'Punch In'}
                </button>
              </div>
            );
          })}
        </div>

        {/* BOTTOM SECTION: RECORDS & REPORTS */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Attendance Records</h2>
              <p className="text-sm text-slate-500">View logs and active work hours</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* STAFF FILTER */}
              <select 
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="bg-slate-50 border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 ring-indigo-500/20"
              >
                <option value="all">All Staff</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              {/* TAB SWITCHER */}
              <div className="bg-slate-100 p-1 rounded-lg flex">
                <button 
                  onClick={() => setActiveTab("punch")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'punch' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Punch Log
                </button>
                <button 
                  onClick={() => setActiveTab("summary")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'summary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Daily Summary
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {activeTab === "punch" ? (
              /* --- REPORT 1: PUNCH IN/OUT LOG --- */
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3">Photo</th>
                    <th className="px-6 py-3">Staff</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Reason / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition text-sm">
                      <td className="px-6 py-3">
                        <img src={rec.photoUrl} alt="cap" className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-slate-100" />
                      </td>
                      <td className="px-6 py-3 font-bold text-slate-700">{rec.staffName}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${rec.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                          {rec.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {rec.timestamp?.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-3 text-slate-400 italic">{rec.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* --- REPORT 2: DAILY SUMMARY (ACTIVE HOURS) --- */
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Staff</th>
                    <th className="px-6 py-3">First In</th>
                    <th className="px-6 py-3">Last Out</th>
                    <th className="px-6 py-3">Active Hours</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getSummaryData().map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition text-sm">
                      <td className="px-6 py-3 font-medium">{row.date}</td>
                      <td className="px-6 py-3 font-bold text-slate-700">{row.staffName}</td>
                      <td className="px-6 py-3 text-slate-500">{row.firstIn?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-3 text-slate-500">{row.lastOut ? row.lastOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                      <td className="px-6 py-3 font-mono text-indigo-600 font-bold">{row.activeHours} hrs</td>
                      <td className="px-6 py-3">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Present</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {history.length === 0 && <div className="p-12 text-center text-slate-400 italic">No attendance records found.</div>}
          </div>
        </div>

        {/* ATTENDANCE MODAL */}
        <Modal isOpen={modalOpen} onClose={() => { stopCamera(); setModalOpen(false); }} size="md">
          {selectedStaff && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold border-b pb-2">
                {attendanceState[selectedStaff.id]?.status === "in" ? "Punch Out" : "Punch In"}: {selectedStaff.name}
              </h2>

              <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center border-4 border-slate-100 shadow-inner">
                {!photo ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover mirror" />
                    <canvas ref={canvasRef} width="320" height="240" className="hidden" />
                  </>
                ) : (
                  <img src={photo} alt="Captured" className="w-full h-full object-contain" />
                )}
              </div>

              <div className="flex justify-center">
                {!photo ? (
                  <button onClick={capturePhoto} className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-indigo-200">
                    Capture Photo
                  </button>
                ) : (
                  <button onClick={() => { setPhoto(null); startCamera(); }} className="text-indigo-600 font-bold px-4 py-2 hover:bg-indigo-50 rounded-lg">
                    Retake Photo
                  </button>
                )}
              </div>

              {attendanceState[selectedStaff.id]?.status === "in" && (
                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Reason for Punch Out</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20"
                    value={punchOutReason}
                    onChange={(e) => setPunchOutReason(e.target.value)}
                  >
                    <option value="End of Day">End of Shift</option>
                    <option value="Lunch Break">Lunch Break</option>
                    <option value="Personal / Medical">Personal Reason</option>
                  </select>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={processing || !photo}
                className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl mt-4 transition-all
                  ${processing || !photo ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700 active:scale-95"}`}
              >
                {processing ? "Saving..." : "Confirm Attendance"}
              </button>
            </div>
          )}
        </Modal>
      </div>
      <style>{`.mirror { transform: scaleX(-1); }`}</style>
    </div>
  );
};

export default Attendance;