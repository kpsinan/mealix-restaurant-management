const fs = require('fs');

const path = 'src/components/TableCard.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  'onEnterSelectionMode, onDelete, isSelectionMode }) => {', 
  'onEnterSelectionMode, onDelete, isSelectionMode, onViewQR }) => {'
);

const oldButton = '{onDelete && (\n                    <button';
const newButton = `{onViewQR && (
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
                  {onDelete && (
                    <button`;

c = c.replace(oldButton, newButton);

fs.writeFileSync(path, c, 'utf8');
console.log('Updated TableCard.jsx');
