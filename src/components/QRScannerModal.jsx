import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Modal from './Modal'; // Reusing the existing Modal component

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsScanning(true);
      
      // Delay initialization slightly to ensure the modal DOM element is fully rendered
      setTimeout(() => {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;
        
        html5QrCode.start(
          { facingMode: "environment" }, 
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText, decodedResult) => {
            // Stop scanning once we get a successful read
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    setIsScanning(false);
                    scannerRef.current = null;
                    onScanSuccess(decodedText);
                }).catch(err => {
                    console.error("Error stopping QR Code scanner.", err);
                });
            }
          },
          (errorMessage) => {
            // We ignore scan failure messages because it fails constantly until a QR code is clearly in frame
          }
        ).catch((err) => {
          console.error("Error starting scanner", err);
          setError("Failed to start camera. Please ensure you have given camera permissions and are using HTTPS.");
          setIsScanning(false);
        });
      }, 100);
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current = null;
        }).catch(err => console.error("Error stopping scanner on unmount", err));
      }
    };
  }, [isOpen, onScanSuccess]);

  const handleClose = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
            setIsScanning(false);
            scannerRef.current = null;
            onClose();
        }).catch(err => {
            console.error("Error stopping scanner on close", err);
            onClose();
        });
    } else {
        onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Scan Table QR Code</h2>
        <p className="text-gray-500 mb-6 text-center text-sm">
          Point your camera at the QR code on the table to automatically start the order.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 w-full text-sm font-medium border border-red-200">
            {error}
          </div>
        )}

        <div className="w-full max-w-sm rounded-xl overflow-hidden border border-gray-200 shadow-inner bg-black">
          <div id="qr-reader" className="w-full min-h-[300px]"></div>
        </div>
        
        <button 
          onClick={handleClose}
          className="mt-6 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default QRScannerModal;
