import React, { useState, useEffect } from 'react';
import { setNetworkOffline, setNetworkOnline } from '../firebase/firebase'; // Import network controls

const NetworkHandler = () => {
  // States: 'online' | 'offline' | 'retrying' | 'manual_checking'
  const [networkState, setNetworkState] = useState(navigator.onLine ? 'online' : 'offline');
  const [retryCount, setRetryCount] = useState(0);
  // Track if Firebase network has been manually disabled
  const [isFirebaseDisabled, setIsFirebaseDisabled] = useState(false);
  // Track if the modal is minimized (to allow app access while offline)
  const [isMinimized, setIsMinimized] = useState(false);
  
  // OPTIMIZED SETTINGS: Faster detection (total ~3 seconds)
  const MAX_AUTO_RETRIES = 2; 
  const RETRY_INTERVAL_MS = 1500;

  useEffect(() => {
    // Handler for when device detects internet
    const handleOnline = () => {
      // Only set to online if Firebase hasn't been manually disabled
      if (!isFirebaseDisabled) {
         setTimeout(() => {
          setNetworkState('online');
          setRetryCount(0);
          setNetworkOnline(); // Re-enable Firebase network
        }, 1000);
      }
    };

    // Handler for when device loses internet
    const handleOffline = () => {
      setNetworkState('offline');
      initiateAutoRetry();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount (for the PWA load case)
    if (!navigator.onLine) {
      handleOffline();
    }

    // Check if Firebase was left disabled across sessions
    if (isFirebaseDisabled) {
        setNetworkOffline(); 
        setNetworkState('offline');
        setIsMinimized(true); // Auto-minimize on load if manually disabled
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isFirebaseDisabled]);

  // Logic to try auto-reconnecting a few times
  const initiateAutoRetry = () => {
    let currentAttempt = 0;
    setNetworkState('retrying');

    const retryInterval = setInterval(() => {
      currentAttempt++;
      setRetryCount(currentAttempt);

      if (navigator.onLine && !isFirebaseDisabled) {
        // Recovered!
        setNetworkState('online');
        setNetworkOnline(); // Ensure Firebase is back online
        setRetryCount(0);
        clearInterval(retryInterval);
      } else if (currentAttempt >= MAX_AUTO_RETRIES) {
        // Failed after retries: Force Offline Mode
        setNetworkState('offline'); 
        
        // CRITICAL FIX: Tell Firebase to stop trying to connect. 
        // This makes database writes instant (saving to local cache).
        setNetworkOffline(); 
        
        clearInterval(retryInterval);
      }
    }, RETRY_INTERVAL_MS);
  };

  // Handler for the "Tap to Reconnect" button
  const handleManualReconnect = () => {
    // Always try to enable network first when user clicks reconnect
    setNetworkOnline();

    if (isFirebaseDisabled) {
        // If manually disabled, re-enable logic
        setIsFirebaseDisabled(false);
        setIsMinimized(false); 
        window.location.reload(); 
        return;
    }

    setNetworkState('manual_checking');
    
    // Simulate a check delay for better UX
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload(); 
      } else {
        setNetworkState('offline');
        setNetworkOffline(); // Ensure we stay in offline mode if check fails
        setRetryCount(0);
      }
    }, 1500);
  };

  // Handler for the "Go Offline" button
  const handleGoOffline = () => {
    setIsFirebaseDisabled(true);
    setNetworkOffline();
    setNetworkState('offline');
    setIsMinimized(true); // Minimize immediately
  };

  // Don't render anything if we are online AND Firebase is not manually disabled
  if (networkState === 'online' && !isFirebaseDisabled) return null;

  // --- MINIMIZED STATE (FLOATING BADGE) ---
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 left-6 z-[9999] animate-in slide-in-from-bottom-5 duration-300">
        <button 
          onClick={() => setIsMinimized(false)}
          className={`
            group flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 border-2
            ${isFirebaseDisabled ? 'bg-gray-800 border-gray-700 text-white' : 'bg-red-600 border-red-500 text-white'}
          `}
        >
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isFirebaseDisabled ? 'bg-green-400' : 'bg-red-200'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isFirebaseDisabled ? 'bg-green-500' : 'bg-white'}`}></span>
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="font-bold text-sm">
              {isFirebaseDisabled ? 'Local Mode' : 'No Internet'}
            </span>
            <span className="text-[10px] opacity-80 group-hover:underline">
              Tap to Sync
            </span>
          </div>
        </button>
      </div>
    );
  }

  // --- FULL SCREEN MODAL ---
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm transition-all duration-300">
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-300">
        
        {/* Close/Minimize Button (Top Right) */}
        <button 
            onClick={() => setIsMinimized(true)}
            className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Minimize and work offline"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </button>

        {/* Top decorative bar */}
        <div className={`h-2 w-full ${networkState === 'retrying' ? 'bg-blue-500 animate-pulse' : (isFirebaseDisabled ? 'bg-green-500' : 'bg-red-500')}`} />

        <div className="p-8 flex flex-col items-center text-center">
          
          {/* Status Icon Wrapper */}
          <div className="relative mb-6">
            <div className={`absolute inset-0 rounded-full opacity-20 ${networkState === 'retrying' ? 'bg-blue-500 animate-ping' : (isFirebaseDisabled ? 'bg-green-500' : 'bg-red-500')}`}></div>
            
            <div className={`relative p-4 rounded-full ${networkState === 'retrying' ? 'bg-blue-50 text-blue-600' : (isFirebaseDisabled ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}`}>
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
             {isFirebaseDisabled ? 'Local Mode Active' : 
              (networkState === 'retrying' ? 'Trying to Connect...' : 'No Internet Connection')}
          </h2>
          
          <p className="text-gray-500 mb-8 leading-relaxed">
            {isFirebaseDisabled 
                ? "Actions are saving locally. Tap RECONNECT to sync."
                : (networkState === 'retrying' 
                    ? `Attempting to restore connection... (Attempt ${retryCount}/${MAX_AUTO_RETRIES})`
                    : "Firebase has been switched to offline mode for instant performance. Minimize this to continue working.")}
          </p>

          {/* Action Area */}
          <div className="w-full space-y-3">
            {/* Primary Button: Reconnect */}
            <button
              onClick={handleManualReconnect}
              disabled={networkState === 'manual_checking'}
              className={`
                w-full py-3.5 px-6 rounded-xl font-semibold text-white shadow-lg 
                flex items-center justify-center space-x-2 transition-all duration-200
                ${networkState === 'manual_checking' 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : (isFirebaseDisabled ? 'bg-green-600 hover:bg-green-700 active:scale-[0.98] shadow-green-200' : 'bg-red-600 hover:bg-red-700 active:scale-[0.98] shadow-red-200')
                }
              `}
            >
              {(networkState === 'manual_checking' || networkState === 'retrying') ? (
                <>
                  <span>Checking Connection</span>
                  <span className="flex space-x-1 ml-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-0"></span>
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-200"></span>
                  </span>
                </>
              ) : (
                <span>{isFirebaseDisabled ? 'Reconnect & Sync Data' : 'Check Internet & Reconnect'}</span>
              )}
            </button>

            {/* Secondary Button: Go Offline */}
            {networkState !== 'retrying' && networkState !== 'manual_checking' && !isFirebaseDisabled && (
                <button
                    onClick={handleGoOffline}
                    className="w-full py-3.5 px-6 rounded-xl font-semibold text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 active:scale-[0.99] transition-all duration-200"
                >
                    Go to Local Mode (Disable Sync)
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