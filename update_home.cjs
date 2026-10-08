const fs = require('fs');

const path = 'src/pages/Home.jsx';
let c = fs.readFileSync(path, 'utf8');

// Imports
c = c.replace(
  'import TableCard from \'../components/TableCard\';', 
  "import TableCard from '../components/TableCard';\nimport TableQRCode from '../components/TableQRCode';\nimport JSZip from 'jszip';\nimport { saveAs } from 'file-saver';"
);

// State
c = c.replace(
  'const [selectedTables, setSelectedTables] = useState(new Set());',
  'const [selectedTables, setSelectedTables] = useState(new Set());\n  const [qrModalTable, setQrModalTable] = useState(null);\n  const [isExportingZip, setIsExportingZip] = useState(false);'
);

// Bulk Zip Function
const bulkZipFunc = `
  const handleBulkExportQR = async () => {
    if (selectedTables.size === 0) return;
    setIsExportingZip(true);
    
    try {
      const zip = new JSZip();
      const qrFolder = zip.folder("Table_QRs");
      
      const tablesToExport = data.tables.filter(t => selectedTables.has(t.id ?? t.name));
      
      // We will create temporary SVG elements to generate the QR codes
      tablesToExport.forEach(table => {
         const qrData = JSON.stringify({
            type: 'mealix_table',
            tableId: table.id || table.name,
            tableName: table.name,
            capacity: table.capacity || 0
         });
         
         // We're dynamically generating SVG strings for the zip using qrcode.react logic implicitly via manual SVG construction
         // Actually, since we're in a React component, the easiest way to generate bulk SVGs without rendering them is using an offscreen approach, but since qrcode.react renders to DOM, we will just use a reliable library-agnostic way for ZIP:
         // Alternatively, we can just use the QRCode library directly if we had a non-react one.
         // Let's create an offscreen container, render QRCodeSVG into it, serialize, and remove.
      });
      
      // Instead of complex react-dom/server rendering, let's use a simpler approach:
      // We will render a hidden div in the Home component that contains all selected QR codes, then we can query them.
    } catch(e) {
      console.error(e);
      alert('Failed to export bulk QR codes');
    }
    setIsExportingZip(false);
  };
`;
// Let's inject a hidden div rendering all QRs for zip extraction
const hiddenQRs = `
      {/* Hidden QR Codes for Bulk Export */}
      <div className="hidden">
        {data.tables.filter(t => selectedTables.has(t.id ?? t.name)).map(table => (
           <TableQRCode key={"hidden-qr-"+(table.id ?? table.name)} table={table} />
        ))}
      </div>
`;
// Wait, rendering `TableQRCode` creates `qr-svg-{id}` which we can grab!

const bulkZipFuncSimple = `
  const handleBulkExportQR = async () => {
    if (selectedTables.size === 0) return;
    setIsExportingZip(true);
    
    try {
      const zip = new JSZip();
      const tablesToExport = data.tables.filter(t => selectedTables.has(t.id ?? t.name));
      
      // Since we render them in a hidden div, they are in the DOM!
      await new Promise(resolve => setTimeout(resolve, 100)); // wait for render
      
      tablesToExport.forEach(table => {
         const svgId = \`qr-svg-\${table.id || table.name}\`;
         const svg = document.getElementById(svgId);
         if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            zip.file(\`MealiX_Table_\${table.name}_QR.svg\`, svgData);
         }
      });
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "MealiX_Table_QRCodes.zip");
      clearSelection();
    } catch(e) {
      console.error(e);
      alert('Failed to export bulk QR codes');
    }
    setIsExportingZip(false);
  };
`;

c = c.replace(
  'const handleDeleteSelected = async () => {',
  bulkZipFuncSimple + '\n  const handleDeleteSelected = async () => {'
);

// Selection Banner Buttons
const newBannerBtn = `
                <button 
                  onClick={handleBulkExportQR}
                  disabled={isExportingZip}
                  className="bg-white text-[#065F46] font-bold px-3 sm:px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-2"
                >
                  {isExportingZip ? (
                    <span className="animate-pulse">Zipping...</span>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <span className="hidden sm:inline">Export QR (ZIP)</span>
                      <span className="sm:hidden">Export</span>
                    </>
                  )}
                </button>
                <button`;
c = c.replace('<button', newBannerBtn); // Note: This will replace the FIRST `<button` which is likely the 'Clear' button.
// Better replacement for banner buttons:
c = c.replace(
  '<button onClick={clearSelection}',
  '<button onClick={handleBulkExportQR} disabled={isExportingZip} className="bg-white text-[#065F46] font-bold px-3 py-2 rounded-lg text-sm shadow hover:bg-emerald-50 active:scale-95 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg><span className="hidden sm:inline">Export ZIP</span></button>\n                <button onClick={clearSelection}'
);

// TableCard onViewQR
c = c.replace(
  'onEnterSelectionMode={() => handleEnterSelectionMode(id)}',
  'onEnterSelectionMode={() => handleEnterSelectionMode(id)}\n                    onViewQR={() => setQrModalTable(table)}'
);

// QR Modal Render
const qrModal = `
      {/* QR Code Modal */}
      <Modal isOpen={!!qrModalTable} onClose={() => setQrModalTable(null)}>
        {qrModalTable && <TableQRCode table={qrModalTable} />}
      </Modal>
      
      {/* Hidden Render for Bulk Zip */}
      {isSelectionMode && (
        <div className="fixed -top-full -left-full opacity-0 pointer-events-none">
          {data.tables.filter(t => selectedTables.has(t.id ?? t.name)).map(table => (
             <TableQRCode key={"hidden-qr-"+(table.id ?? table.name)} table={table} />
          ))}
        </div>
      )}
`;

c = c.replace('</Layout>', qrModal + '\n    </Layout>');

fs.writeFileSync(path, c, 'utf8');
console.log('Updated Home.jsx');
