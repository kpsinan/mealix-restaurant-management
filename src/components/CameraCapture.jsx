import React, { useEffect, useRef, useState } from 'react';

const CameraCapture = ({ photo, setPhoto }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setError(null);
      }
    } catch (err) {
      setError("Camera Error: " + err.message);
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
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      setPhoto(canvasRef.current.toDataURL("image/jpeg"));
      stopCamera();
    }
  };

  useEffect(() => {
    if (!photo) {
      startCamera();
    }
    return () => stopCamera();
  }, [photo]);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center border-4 border-slate-100 shadow-inner">
        {!photo ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover mirror" />
            <canvas ref={canvasRef} width="320" height="240" className="hidden" />
            {error && <div className="absolute text-red-500 font-bold bg-white/80 p-2 rounded">{error}</div>}
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
          <button onClick={() => setPhoto(null)} className="text-indigo-600 font-bold px-4 py-2 hover:bg-indigo-50 rounded-lg">
            Retake Photo
          </button>
        )}
      </div>
      <style>{`.mirror { transform: scaleX(-1); }`}</style>
    </div>
  );
};

export default CameraCapture;
