// SmartAssigner.jsx
// Includes: full UI + maximum-intelligence algorithm (no paid APIs)

import React, { useState, useEffect, useCallback } from "react";
import { getTables } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

// --- Algorithm Settings ---
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

// --- Normalize Tables ---
function normalizeTables(raw) {
  return raw.map(t => ({
    id: String(t.id ?? t._id ?? t.name),
    name: String(t.name ?? t.id),
    capacity: Number(t.capacity || 0),
    status: t.status ?? "available"
  }));
}

// --- Adjacency Score ---
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

// --- Score Combo ---
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

// --- React Component with UI ---
const SmartAssigner = () => {
  const [tables, setTables] = useState([]);
  const [guests, setGuests] = useState(1);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const navigate = useNavigate();

  // Load tables
  useEffect(() => {
    (async () => {
      try {
        const data = await getTables();
        setTables(data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // RUN AI ALGORITHM
  const calculateAssignment = useCallback(() => {
    setIsCalculating(true);
    setOptions([]);

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
    const primaryId = ids[0];
    const linked = ids.slice(1).join(",");

    let url = `/order?tableId=${primaryId}`;
    if (linked) url += `&linked=${linked}`;

    navigate(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl p-6 md:p-10">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Smart Host AI</h1>
          <p className="text-gray-500">Intelligent seating optimization</p>
        </div>

        {/* Input */}
        <div className="bg-gray-100 p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold mb-2">Guest Count</label>
            <input
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full p-4 text-3xl font-bold text-center bg-white border-2 rounded-xl"
            />
          </div>

          <button
            onClick={calculateAssignment}
            disabled={isCalculating}
            className={`w-full md:w-auto px-8 py-5 rounded-xl text-lg font-bold
              ${isCalculating ? "bg-gray-300" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            {isCalculating ? "Analyzing..." : "Find Best Tables"}
          </button>
        </div>

        {/* RESULTS */}
        <div className="space-y-4">
          {options.map((opt, idx) => (
            <div key={idx} className="animate-fade-in-up">

              {opt.type === "error" ? (
                <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-xl">
                  <p className="font-semibold text-red-700">{opt.message}</p>
                </div>
              ) : (
                <div className={`border-2 rounded-xl p-6 ${idx === 0 ? "border-blue-500 bg-blue-50/50" : "border-gray-200"}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {opt.tables.map(t => (
                          <span key={t.id} className="px-3 py-1 border rounded-md text-sm font-bold">
                            {t.name} ({t.capacity})
                          </span>
                        ))}
                      </div>
                      <div className="text-sm">
                        Capacity: <b>{opt.totalCapacity}</b> — 
                        {opt.waste === 0 ? (
                          <span className="text-green-600 ml-1 font-bold">Perfect Fit</span>
                        ) : (
                          <span className="text-orange-600 ml-1">{opt.waste} Extra</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleConfirm(opt)}
                      disabled={loading}
                      className="px-6 py-3 bg-black text-white rounded-xl font-bold"
                    >
                      Select
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default SmartAssigner;
