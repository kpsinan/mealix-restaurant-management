import React, { useRef, useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

const TableQRCode = ({ table, restaurantName = "MealiX" }) => {
  const qrRef = useRef(null);
  const [downloadFormat, setDownloadFormat] = useState('svg');
  
  // Format the data payload - we use JSON so the scanner can easily parse it
  const qrData = JSON.stringify({
    type: 'mealix_table',
    tableId: table.id || table.name,
    tableName: table.name,
    capacity: table.capacity || 0
  });

  const handleDownload = () => {
    const fileName = `${restaurantName}_Table_${table.name}_QR`.replace(/\s+/g, '_');
    
    if (downloadFormat === 'svg') {
      const svg = document.getElementById(`qr-svg-${table.id || table.name}`);
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (downloadFormat === 'png') {
      const canvas = document.getElementById(`qr-canvas-${table.id || table.name}`);
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold text-gray-800">{table.name}</h3>
        <p className="text-sm text-gray-500">Capacity: {table.capacity}</p>
      </div>
      
      <div className="p-4 bg-white border-4 border-emerald-500 rounded-xl shadow-inner relative" ref={qrRef}>
        <div className={downloadFormat === 'svg' ? 'block' : 'hidden'}>
           <QRCodeSVG 
              id={`qr-svg-${table.id || table.name}`} 
              value={qrData} 
              size={200} 
              level="H"
              includeMargin={true}
           />
        </div>
        <div className={downloadFormat === 'png' ? 'block' : 'hidden'}>
           <QRCodeCanvas 
              id={`qr-canvas-${table.id || table.name}`} 
              value={qrData} 
              size={200} 
              level="H"
              includeMargin={true}
           />
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-md shadow-sm">
           <span className="text-emerald-500 font-bold text-xl leading-none block">M</span>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col gap-3 w-full">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${downloadFormat === 'svg' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setDownloadFormat('svg')}
          >
            SVG
          </button>
          <button 
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${downloadFormat === 'png' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setDownloadFormat('png')}
          >
            PNG
          </button>
        </div>
        
        <button 
          onClick={handleDownload}
          className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download {downloadFormat.toUpperCase()}
        </button>
      </div>
    </div>
  );
};

export default TableQRCode;
