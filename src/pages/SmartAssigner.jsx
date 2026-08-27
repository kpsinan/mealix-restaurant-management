// src/pages/SmartAssigner.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import db from "../firebase/firebase";
import { Users, LayoutGrid, CheckCircle, XCircle } from "lucide-react";

// --- DP ALGORITHM FOR TABLE ASSIGNMENT ---

function normalizeTables(raw) {
  return raw.map(t => ({
    id: String(t.id ?? t._id ?? t.name),
    name: String(t.name ?? t.id),
    capacity: Number(t.capacity || 0),
    status: t.status ?? "available"
  }));
}

function adjacencyPenalty(combo) {
  const nums = combo
    .map(t => {
      const m = t.name.match(/\d+/g);
      return m ? Number(m[m.length - 1]) : null;
    })
    .filter(Boolean)
    .sort((a, b) => a - b);

  if (nums.length < 2) return 0;
  let close = 0;
  for (let i = 1; i < nums.length; i++) {
    const d = nums[i] - nums[i - 1];
    if (d === 1) close += 2;
    else if (d === 2) close += 1;
  }
  return -close;
}

function scoreCombo(combo, guests, weights) {
  const totalCapacity = combo.reduce((s, t) => s + t.capacity, 0);
  const waste = totalCapacity - guests;
  const count = combo.length;
  const adj = adjacencyPenalty(combo);
  
  const score = (waste * weights.waste) + (count * weights.count) + (adj * weights.adjacency);
  
  // Calculate a "Reason" for UI display
  let reason = "Optimal fit";
  if (waste === 0 && count === 1) reason = "Perfect single fit";
  else if (waste === 0) reason = "Zero wasted seats";
  else if (count === 1) reason = "Best single table";
  else if (adj < 0) reason = "Adjacent tables combined";

  return {
    tables: combo,
    totalCapacity,
    waste,
    count,
    score: Number(score.toFixed(4)),
    reason
  };
}

function assignTablesFast(rawTables, guests, allowCombining) {
  const tables = normalizeTables(rawTables)
    .filter(t => t.status === "available" && t.capacity > 0)
    .sort((a, b) => a.capacity - b.capacity);

  const weights = { waste: 8, count: 5, adjacency: 1.5 };
  const results = [];
  const sigSet = new Set();

  const addResult = (combo) => {
    const sig = combo.map(t => t.id).sort().join("|");
    if (!sigSet.has(sig)) {
      sigSet.add(sig);
      results.push(scoreCombo(combo, guests, weights));
    }
  };

  if (guests <= 0 || tables.length === 0) return [];

  // 1. Check for perfect single table
  const exact = tables.find(t => t.capacity === guests);
  if (exact) addResult([exact]);

  // 2. Check for best single table (smallest table that fits all)
  const bestSingle = tables.find(t => t.capacity > guests);
  if (bestSingle) addResult([bestSingle]);

  // 3. DP / Backtracking for combinations (Only if combining is allowed)
  if (allowCombining && !exact) {
    // DFS to find combinations up to 4 tables
    const dfs = (index, currentCombo, currentCap) => {
      if (currentCap >= guests) {
        addResult([...currentCombo]);
        return;
      }
      if (currentCombo.length >= 4) return; // Max 4 tables per combo to prevent massive tables
      if (index >= tables.length) return;

      for (let i = index; i < Math.min(tables.length, index + 15); i++) {
        currentCombo.push(tables[i]);
        dfs(i + 1, currentCombo, currentCap + tables[i].capacity);
        currentCombo.pop();
      }
    };
    dfs(0, [], 0);
  }

  if (results.length === 0) {
    return [{ type: "error", message: `Not enough capacity. Max available is ${tables.reduce((a, b) => a + b.capacity, 0)}.` }];
  }

  // Sort by score
  results.sort((a, b) => a.score - b.score);
  return results.slice(0, 3); // Return top 3 options
}

// --- REACT COMPONENT ---
const SmartAssigner = () => {
  const [tables, setTables] = useState([]);
  const [guests, setGuests] = useState(null);
  const [allowCombining, setAllowCombining] = useState(true);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [dbError, setDbError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "tables"), where("status", "==", "available"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setDbError(null);
      },
      (error) => {
        console.error("Error fetching tables:", error);
        setDbError("Failed to load tables.");
      }
    );
    return () => unsubscribe();
  }, []);

  const calculateAssignment = useCallback(() => {
    if (!guests || guests <= 0) return;
    setIsCalculating(true);
    
    // Simulate slight delay for UI feedback
    setTimeout(() => {
      const res = assignTablesFast(tables, guests, allowCombining);
      setOptions(res);
      setIsCalculating(false);
    }, 50);
  }, [tables, guests, allowCombining]);

  // Auto-recalculate if guests or toggles change (only if there is already an input)
  useEffect(() => {
    if (guests && guests > 0) calculateAssignment();
    else setOptions([]);
  }, [guests, allowCombining, calculateAssignment]);

  const handleConfirm = (opt) => {
    if (opt.type === "error") return;
    setLoading(true);
    const ids = opt.tables.map(t => t.id);
    const primaryId = encodeURIComponent(ids[0]);
    const linked = ids.slice(1).map(id => encodeURIComponent(id)).join(",");
    
    let url = `/order?tableId=${primaryId}`;
    if (linked) url += `&linked=${linked}`;
    
    navigate(url);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-white max-w-3xl w-full rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-emerald-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-[-50%] left-[-10%] w-64 h-64 bg-emerald-500 rounded-full mix-blend-screen opacity-50 blur-3xl"></div>
          <div className="absolute bottom-[-50%] right-[-10%] w-64 h-64 bg-teal-400 rounded-full mix-blend-screen opacity-50 blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight flex items-center justify-center gap-3">
              <Users className="w-8 h-8" /> Smart Host AI
            </h1>
            <p className="text-emerald-100 font-medium">Optimal table assignments in milliseconds.</p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {dbError && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">{dbError}</div>}

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Number of Guests</label>
              <input
                type="number"
                min="1"
                value={guests || ""}
                placeholder="E.g., 4"
                onChange={(e) => setGuests(parseInt(e.target.value) || null)}
                className="w-full p-4 text-3xl font-black text-center text-emerald-900 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-colors"
              />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Preferences</label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${allowCombining ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${allowCombining ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-gray-700 font-medium group-hover:text-emerald-600 transition-colors">Allow Combining Tables</span>
              </label>
            </div>
          </div>

          {/* Results Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Top Recommendations</h2>
              <span className="text-sm text-gray-500 font-medium">{tables.length} tables available</span>
            </div>

            {isCalculating ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
              </div>
            ) : options.length > 0 ? (
              options.map((opt, idx) => (
                <div key={idx} className="animate-fade-in-up">
                  {opt.type === "error" ? (
                    <div className="p-5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-red-500" />
                      <p className="font-semibold text-red-700">{opt.message}</p>
                    </div>
                  ) : (
                    <div className={`relative border-2 rounded-xl p-5 transition-all hover:shadow-lg ${idx === 0 ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200 bg-white'}`}>
                      {idx === 0 && <div className="absolute -top-3 -right-2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">Best Fit</div>}
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className={`w-5 h-5 ${idx === 0 ? 'text-emerald-500' : 'text-gray-400'}`} />
                            <span className="font-bold text-gray-800 text-lg">{opt.reason}</span>
                          </div>
                          
                          {/* Visual Table Representation */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {opt.tables.map(t => (
                              <div key={t.id} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <LayoutGrid className="w-4 h-4 text-gray-400" />
                                <span className="font-bold text-gray-700">{t.name}</span>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">{t.capacity} seats</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex gap-4 text-sm font-medium">
                            <span className="text-gray-600">Total Seats: <span className="text-gray-900 font-bold">{opt.totalCapacity}</span></span>
                            {opt.waste === 0 ? (
                              <span className="text-emerald-600 bg-emerald-100 px-2 rounded">0 Wasted</span>
                            ) : (
                              <span className="text-orange-600 bg-orange-100 px-2 rounded">{opt.waste} Extra</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleConfirm(opt)}
                          disabled={loading}
                          className="w-full md:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl font-bold text-base hover:bg-gray-800 transition-colors focus:ring-4 focus:ring-gray-200 disabled:opacity-50 whitespace-nowrap"
                        >
                          {loading ? "Assigning..." : "Assign Tables"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Enter guest count to view smart assignments.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartAssigner;