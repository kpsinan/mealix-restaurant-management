// src/pages/SmartAssigner.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  collection, 
  onSnapshot, 
  query,
  where 
} from "firebase/firestore";
import db from "../firebase/firebase"; // Use shared instance for Auth consistency

// --- ALGORITHM SETTINGS ---
const CONFIG = {
  maxTablesPerCombo: 4,
  maxOptions: 3,
  fullComboThreshold: 18,
  comboSearchLimit: 200000,
  weights: {
    waste: 8,
    count: 5,
    adjacency: 1.5
  }
};

// --- INTELLIGENCE ALGORITHM ---

// Normalize Tables
function normalizeTables(raw) {
  return raw.map(t => ({
    id: String(t.id ?? t._id ?? t.name),
    name: String(t.name ?? t.id),
    capacity: Number(t.capacity || 0),
    status: t.status ?? "available"
  }));
}

// Adjacency Score
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

// Score Combo
function scoreCombo(combo, guests, weights) {
  const totalCapacity = combo.reduce((s, t) => s + t.capacity, 0);
  const waste = totalCapacity - guests;
  const count = combo.length;

  const adj = adjacencyPenalty(combo);
  const score =
    waste * weights.waste +
    count * weights.count +
    adj * weights.adjacency;

  return {
    tables: combo,
    totalCapacity,
    waste,
    count,
    score: Number(score.toFixed(4))
  };
}

// Greedy fill from smallest → largest
function greedyFill(available, guests) {
  let cap = 0;
  const combo = [];
  for (const t of available) {
    combo.push(t);
    cap += t.capacity;
    if (cap >= guests) return combo;
  }
  return null;
}

// Full AI Assignment Logic
function assignTables(rawTables, guests, cfg = CONFIG) {
  const tables = normalizeTables(rawTables);

  // Filter for available tables (Double check, though Query handles this now)
  const available = tables
    .filter(t => t.status === "available" && t.capacity > 0)
    .sort((a, b) => a.capacity - b.capacity);

  const results = [];
  const sigSet = new Set();

  const pushUnique = (opt) => {
    const sig = opt.tables.map(t => t.id).sort().join("|");
    if (!sigSet.has(sig)) {
      sigSet.add(sig);
      results.push(opt);
    }
  };
  
  if (guests <= 0) {
      return [];
  }

  // Exact match
  const exact = available.find(t => t.capacity === guests);
  if (exact) {
    const r = scoreCombo([exact], guests, cfg.weights);
    return [r];
  }

  // Best single
  const bestSingle = available.find(t => t.capacity >= guests);
  if (bestSingle) {
    pushUnique(scoreCombo([bestSingle], guests, cfg.weights));
  }

  // Greedy
  const greedy = greedyFill(available, guests);
  if (greedy) {
    pushUnique(scoreCombo(greedy, guests, cfg.weights));
  }

  // Combination search (limited)
  const n = available.length;
  if (n <= cfg.fullComboThreshold) {
    const maxMask = 1 << n;
    let checks = 0;

    for (let mask = 1; mask < maxMask; mask++) {
      if (++checks > cfg.comboSearchLimit) break;

      const combo = [];
      let cap = 0;
      let count = 0;

      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) {
          combo.push(available[i]);
          cap += available[i].capacity;
          count++;
          if (count > cfg.maxTablesPerCombo) break;
        }
      }
      if (count > cfg.maxTablesPerCombo) continue;
      if (cap >= guests) {
        pushUnique(scoreCombo(combo, guests, cfg.weights));
      }
    }
  }

  if (results.length === 0) {
    return [{
      type: "error",
      message: `Not enough space. Max capacity is ${available.reduce((a, b) => a + b.capacity, 0)}.`
    }];
  }

  // Sort by quality
  results.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    if (a.waste !== b.waste) return a.waste - b.waste;
    return a.count - b.count;
  });

  return results.slice(0, cfg.maxOptions);
}

// --- REACT COMPONENT ---
const SmartAssigner = () => {
  const [tables, setTables] = useState([]);
  const [guests, setGuests] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [dbError, setDbError] = useState(null);

  const navigate = useNavigate();

  // Load tables from Firebase Realtime
  useEffect(() => {
    // OPTIMIZATION: Only fetch tables that are currently 'available'.
    // This reduces Firestore reads by ignoring updates to occupied tables.
    const q = query(
        collection(db, "tables"), 
        where("status", "==", "available")
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const tableData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTables(tableData);
        setDbError(null);
      },
      (error) => {
        console.error("Error fetching tables:", error);
        setDbError("Failed to load tables from database.");
      }
    );

    return () => unsubscribe();
  }, []);

  // RUN AI ALGORITHM
  const calculateAssignment = useCallback(() => {
    if (!guests || guests <= 0) {
      setOptions([{
        type: "error",
        message: "Please enter a valid number of guests (1 or more) to find tables."
      }]);
      return;
    }

    setIsCalculating(true);
    setOptions([]);

    // Small timeout to allow UI to show "Analyzing..." state
    setTimeout(() => {
      const res = assignTables(tables, guests);
      setOptions(res);
      setIsCalculating(false);
    }, 150);
  }, [tables, guests]);

  const handleConfirm = (opt) => {
    if (opt.type === "error") return;
    setLoading(true);

    const ids = opt.tables.map(t => t.id);
    const primaryId = encodeURIComponent(ids[0]);
    
    // Construct linked tables parameter for merged combos
    const linked = ids.slice(1).map(id => encodeURIComponent(id)).join(",");

    let url = `/order?tableId=${primaryId}`;
    if (linked) url += `&linked=${linked}`;

    navigate(url);
    
    // Reset loading state safely (component might unmount, but timeout handles cleanup visually)
    setTimeout(() => setLoading(false), 500);
  };
  
  const handleGuestChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setGuests(null);
    } else {
      const parsedValue = parseInt(value, 10);
      setGuests(Math.max(1, isNaN(parsedValue) ? 0 : parsedValue));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">
            Host AI <span className="text-[#10B981]">Optimizer</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 font-medium">
            Find the most efficient table assignment for your guests.
          </p>
        </div>

        {/* Database Status Indicator */}
        {dbError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
            {dbError}
          </div>
        )}
        {!dbError && tables.length === 0 && (
           <div className="mb-4 text-center text-sm text-gray-400">
             Waiting for available tables...
           </div>
        )}

        {/* Input & Action */}
        <div className="flex flex-col md:flex-row items-stretch gap-4 mb-8">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Guest Count</label>
            <input
              type="number"
              min="1"
              value={guests === null ? "" : guests}
              placeholder="Enter 1 or more"
              onChange={handleGuestChange}
              className="w-full p-3 sm:p-4 text-2xl sm:text-3xl font-extrabold text-center bg-white border border-gray-300 rounded-xl focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition duration-150 shadow-inner"
            />
          </div>

          <button
            onClick={calculateAssignment}
            disabled={isCalculating || !guests || guests <= 0 || tables.length === 0}
            className={`
              w-full md:w-auto mt-4 md:mt-0 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold transition duration-200 ease-in-out transform hover:scale-[1.01]
              ${isCalculating || !guests || guests <= 0 || tables.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none" 
                : "bg-[#10B981] text-white shadow-lg shadow-emerald-500/50 hover:bg-[#059669] active:shadow-md"
              }
            `}
          >
            {isCalculating ? "Analyzing..." : "Find Best Tables"}
          </button>
        </div>

        {/* RESULTS */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-b pb-2 mb-4">Top Assignments ({options.length})</h2>
          {options.map((opt, idx) => (
            <div key={idx} className="animate-fade-in-up">

              {opt.type === "error" ? (
                <div className="p-4 sm:p-5 bg-red-50 border-l-4 border-red-500 rounded-xl shadow-sm">
                  <p className="font-semibold text-red-700">Error: {opt.message}</p>
                </div>
              ) : (
                <div 
                  className={`
                    border-2 rounded-xl p-4 sm:p-5 transition duration-200 ease-in-out hover:shadow-lg
                    ${idx === 0 
                      ? "border-[#10B981] bg-[#ECFDF5] shadow-md scale-[1.005]" 
                      : "border-gray-200 bg-white"
                    }
                  `}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    
                    {/* Tables & Capacity Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {opt.tables.map(t => (
                          <span 
                            key={t.id} 
                            className={`
                              px-3 py-1 text-xs sm:text-sm font-semibold rounded-full 
                              ${idx === 0 ? "bg-[#D1FAE5] text-[#065F46]" : "bg-gray-200 text-gray-700"}
                            `}
                          >
                            {t.name} ({t.capacity})
                          </span>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600 font-medium mt-1">
                        Total Capacity: <b className="text-gray-800">{opt.totalCapacity}</b> — 
                        {opt.waste === 0 ? (
                          <span className="text-[#059669] ml-2 font-bold flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Perfect Fit
                          </span>
                        ) : (
                          <span className="text-orange-600 ml-2 font-semibold">
                            {opt.waste} Extra Seats
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Score: {opt.score}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleConfirm(opt)}
                      disabled={loading}
                      className={`
                        w-full sm:w-auto px-6 py-3 bg-[#10B981] text-white rounded-lg font-bold text-base transition duration-200 ease-in-out shadow-md hover:bg-[#059669] active:shadow-none
                        ${loading ? "opacity-75 cursor-wait" : ""}
                      `}
                    >
                      {loading ? "Redirecting..." : "Select"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {options.length === 0 && !isCalculating && guests && guests > 0 && (
             <div className="p-5 text-center text-gray-500 bg-white rounded-xl border border-gray-300">
                No matching assignments found for {guests} guests.
             </div>
          )}
          {options.length === 0 && !isCalculating && (!guests || guests <= 0) && (
             <div className="p-5 text-center text-gray-500 bg-white rounded-xl border border-gray-300">
                Enter the number of guests above to find the optimal table layout.
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SmartAssigner;