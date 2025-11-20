import React, { useState, useEffect } from 'react';

const NetworkHandler = () => {
  // States: 'online' | 'offline' | 'retrying' | 'manual_checking'
  const [networkState, setNetworkState] = useState(navigator.onLine ? 'online' : 'offline');
  const [retryCount, setRetryCount] = useState(0);
  
  const MAX_AUTO_RETRIES = 3;
  const RETRY_INTERVAL_MS = 2500;

  useEffect(() => {
    // Handler for when browser detects internet
    const handleOnline = () => {
      // Even if browser says online, we wait a brief moment to be sure
      setTimeout(() => {
        setNetworkState('online');
        setRetryCount(0);
      }, 1000);
    };

    // Handler for when browser loses internet
    const handleOffline = () => {
      setNetworkState('offline');
      initiateAutoRetry();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount (for the PWA load case)
    if (!navigator.onLine) {
      initiateAutoRetry();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Logic to try auto-reconnecting a few times before showing the button
  const initiateAutoRetry = () => {
    let currentAttempt = 0;
    setNetworkState('retrying');

    const retryInterval = setInterval(() => {
      currentAttempt++;
      setRetryCount(currentAttempt);

      if (navigator.onLine) {
        setNetworkState('online');
        setRetryCount(0);
        clearInterval(retryInterval);
      } else if (currentAttempt >= MAX_AUTO_RETRIES) {
        setNetworkState('offline'); // Give up and show manual button
        clearInterval(retryInterval);
      }
    }, RETRY_INTERVAL_MS);
  };

  // Handler for the "Tap to Reconnect" button
  const handleManualReconnect = () => {
    setNetworkState('manual_checking');
    
    // Simulate a check delay for better UX (so the spinner is visible)
    setTimeout(() => {
      if (navigator.onLine) {
        // If online, force a reload to refresh data sockets
        window.location.reload();
      } else {
        // If still offline, go back to offline state to allow retry
        setNetworkState('offline');
        setRetryCount(0);
      }
    }, 1500);
  };

  // Don't render anything if we are online
  if (networkState === 'online') return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top decorative bar */}
        <div className={`h-2 w-full ${networkState === 'retrying' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`} />

        <div className="p-8 flex flex-col items-center text-center">
          
          {/* Status Icon Wrapper */}
          <div className="relative mb-6">
            {/* pulsing circle background */}
            <div className={`absolute inset-0 rounded-full opacity-20 ${networkState === 'retrying' ? 'bg-blue-500 animate-ping' : 'bg-red-500'}`}></div>
            
            <div className={`relative p-4 rounded-full ${networkState === 'retrying' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
              {networkState === 'retrying' || networkState === 'manual_checking' ? (
                // Spinner Icon
                <svg className="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                // Wifi Off Icon
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M12 18h.01M8.217 14.217a5.002 5.002 0 016.224 0M6.8 11.29a8.004 8.004 0 0110.386 0M5.39 8.373a10.004 10.004 0 0113.2 0" />
                </svg>
              )}
            </div>
          </div>

          {/* Text Content */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {networkState === 'retrying' ? 'Trying to Connect...' : 'No Internet Connection'}
          </h2>
          
          <p className="text-gray-500 mb-8 leading-relaxed">
            {networkState === 'retrying' 
              ? `We are attempting to restore your connection automatically. (Attempt ${retryCount}/${MAX_AUTO_RETRIES})`
              : "Please check your Wi-Fi or mobile data settings and try again."}
          </p>

          {/* Action Area */}
          <div className="w-full space-y-3">
            {/* Primary Button */}
            {networkState !== 'retrying' && (
              <button
                onClick={handleManualReconnect}
                disabled={networkState === 'manual_checking'}
                className={`
                  w-full py-3.5 px-6 rounded-xl font-semibold text-white shadow-lg 
                  flex items-center justify-center space-x-2 transition-all duration-200
                  ${networkState === 'manual_checking' 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 active:scale-[0.98] shadow-red-200'
                  }
                `}
              >
                {networkState === 'manual_checking' ? (
                  <>
                    <span>Checking Connection</span>
                    <span className="flex space-x-1 ml-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-0"></span>
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-200"></span>
                    </span>
                  </>
                ) : (
                  <span>Tap to Reconnect</span>
                )}
              </button>
            )}

            {/* Progress Bar for Auto Retry */}
            {networkState === 'retrying' && (
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(retryCount / MAX_AUTO_RETRIES) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default NetworkHandler;