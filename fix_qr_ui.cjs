const fs = require('fs');

const tableCardPath = 'src/components/TableCard.jsx';
let tc = fs.readFileSync(tableCardPath, 'utf8');

tc = tc.replace(
  '<div className="py-1">\n                {!isSelectionMode && onEnterSelectionMode && (',
  `<div className="py-1">
                {onViewQR && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onViewQR(); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    View QR Code
                  </button>
                )}
                {!isSelectionMode && onEnterSelectionMode && (`
);

fs.writeFileSync(tableCardPath, tc, 'utf8');
console.log('Fixed TableCard.jsx');

const homePath = 'src/pages/Home.jsx';
let hc = fs.readFileSync(homePath, 'utf8');

// Remove the wrongly placed button
const wrongButtonRegex = /<button\s+onClick=\{handleBulkExportQR\}[\s\S]*?<\/button>/;
hc = hc.replace(wrongButtonRegex, '');

// Insert it in the Selection Banner
hc = hc.replace(
  '<button \n                  onClick={clearSelection}',
  `<button 
                  onClick={handleBulkExportQR}
                  disabled={isExportingZip}
                  className="bg-white text-[#065F46] font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm shadow hover:bg-emerald-50 active:scale-95 flex items-center gap-2"
                >
                  {isExportingZip ? (
                    <span className="animate-pulse">Zipping...</span>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <span className="hidden sm:inline">Export ZIP</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={clearSelection}`
);

fs.writeFileSync(homePath, hc, 'utf8');
console.log('Fixed Home.jsx');
