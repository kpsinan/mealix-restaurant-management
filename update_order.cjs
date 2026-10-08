const fs = require('fs');

const path = 'src/pages/Order.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "import PageSkeleton from '../components/PageSkeleton';",
  "import PageSkeleton from '../components/PageSkeleton';\nimport QRScannerModal from '../components/QRScannerModal';"
);

c = c.replace(
  'const [uiState, setUiState] = useState({ isModalOpen: false, addGuestMode: false, currentOrderId: null });',
  'const [uiState, setUiState] = useState({ isModalOpen: false, addGuestMode: false, currentOrderId: null, isScannerOpen: false });'
);

const scannerLogic = `
  const handleQRScanSuccess = (decodedText) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.type === 'mealix_table' && data.tableId) {
         setSession(prev => ({ ...prev, tableId: data.tableId, linkedTableIds: [] }));
         setUiState(prev => ({ ...prev, isScannerOpen: false }));
      } else {
         alert("Invalid QR Code scanned.");
      }
    } catch(e) {
      alert("Failed to parse QR Code data.");
    }
  };
`;

c = c.replace(
  'const toggleSessionModal = () => setUiState(prev => ({ ...prev, isModalOpen: !prev.isModalOpen }));',
  scannerLogic + '\n  const toggleSessionModal = () => setUiState(prev => ({ ...prev, isModalOpen: !prev.isModalOpen }));'
);

const scanBtnAndSelect = `
                {session.linkedTableIds && session.linkedTableIds.length > 0 ? (
                    <div className="w-full p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm font-bold flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                           <Icons.Link />
                           <span>{sessionTableName}</span>
                        </div>
                        <button 
                            onClick={() => setSession(prev => ({ ...prev, tableId: "", linkedTableIds: [] }))}
                            className="text-xs text-blue-600 underline hover:text-blue-800 font-medium"
                        >
                            Change
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                      <select value={session.tableId} onChange={(e) => setSession({ ...session, tableId: e.target.value, linkedTableIds: [] })} 
                        className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium appearance-none">
                        <option value="">Select Table</option>
                        {data.tables.map(t => <option key={t.id ?? t._id} value={t.id ?? t._id}>{t.name} (Cap: {t.capacity || 0})</option>)}
                      </select>
                      <button 
                        onClick={() => setUiState(prev => ({ ...prev, isScannerOpen: true }))}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-3.5 rounded-xl border border-blue-200 flex items-center justify-center transition-colors"
                        title="Scan Table QR Code"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M4 4h4v4H4V4zm6 0h10v2H10V4zm0 4h10v2H10V8zM4 10h4v4H4v-4zm0 6h4v4H4v-4zm6 0h10v2H10v-2zm0 4h10v2H10v-2z" />
                           <path d="M2 2v6h6V2H2zm4 4H4V4h2v2zM2 16v6h6v-6H2zm4 4H4v-2h2v2zM16 2v6h6V2h-6zm4 4h-2V4h2v2z" />
                        </svg>
                      </button>
                    </div>
                )}
`;

// Looking for the exact existing block to replace
c = c.replace(
  /\{session\.linkedTableIds && session\.linkedTableIds\.length > 0 \? \([\s\S]*?<\/select>\n\s*\)}/,
  scanBtnAndSelect.trim()
);

// Add QRScannerModal to render
c = c.replace(
  '</Layout>',
  `
      <QRScannerModal 
        isOpen={uiState.isScannerOpen} 
        onClose={() => setUiState(prev => ({ ...prev, isScannerOpen: false }))} 
        onScanSuccess={handleQRScanSuccess} 
      />
    </Layout>
  `
);

fs.writeFileSync(path, c, 'utf8');
console.log('Updated Order.jsx');
