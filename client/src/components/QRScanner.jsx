import { Html5Qrcode } from "html5-qrcode";
import React, { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export const QRScanner = ({ onScan, onClose, onFallback }) => {
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    let isCleanedUp = false;
    
    html5QrCode.start(
      { facingMode: "environment" }, 
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText) => {
        if (!isCleanedUp) {
          html5QrCode.stop().then(() => {
            onScan(decodedText);
          }).catch(err => console.error("Error stopping scanner", err));
        }
      },
      (errorMessage) => {
        // Ignore parsing errors while scanning
      }
    ).then(() => {
      setIsInitializing(false);
    }).catch((err) => {
      setIsInitializing(false);
      // Handle camera permissions or unsupported browsers
      if (err.name === 'NotAllowedError' || (err.message && err.message.includes('Permission'))) {
        setError("Camera access denied. Please grant permissions in your browser or use the manual PIN.");
      } else if (err.name === 'NotFoundError' || (err.message && err.message.includes('Not Found'))) {
        setError("No camera found on this device. Please use the manual PIN entry.");
      } else {
        setError("Camera not supported or an error occurred. Please use the manual PIN fallback.");
      }
      console.error(err);
    });

    return () => {
      isCleanedUp = true;
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Error cleaning up scanner", err));
      }
    };
  }, [onScan, t]);

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <div id="qr-reader" className="w-full max-w-sm rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md bg-black min-h-[250px] relative">
        {isInitializing && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-emerald-500 font-bold bg-slate-900/50">
            {t("Initializing Camera...")}
          </div>
        )}
      </div>
      
      {error && (
        <div className="flex items-start gap-2 text-rose-600 text-sm font-medium bg-rose-50 p-3 rounded-xl border border-rose-200 max-w-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error ? t(error) : ""}</p>
        </div>
      )}
      
      <div className="flex gap-2">
        <button 
          onClick={onClose}
          className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold text-sm flex items-center gap-2 shadow-sm border border-slate-200"
        >
          <X className="w-4 h-4" /> {t("Cancel")}
        </button>
        {onFallback && (
          <button 
            onClick={onFallback}
            className="px-5 py-2.5 bg-emerald-100 text-emerald-800 rounded-xl hover:bg-emerald-200 transition font-semibold text-sm flex items-center shadow-sm border border-emerald-200"
          >
            {t("Enter PIN Manually")}
          </button>
        )}
      </div>
    </div>
  );
};
