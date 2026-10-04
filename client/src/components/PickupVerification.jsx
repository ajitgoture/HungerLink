import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, Scan, ShieldCheck, CheckCircle2, KeyRound } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { QRScanner } from './QRScanner';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { Button } from './ui';

const PickupVerification = ({ request, isDonorView, onUpdate }) => {
  const { t } = useTranslation();
  const { showToast } = useNotifications();
  const { donation } = request;
  
  const [tokenInfo, setTokenInfo] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showManualPin, setShowManualPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Eligible only when backend state is HANDOVER_READY
  const isEligibleForHandover = donation.status === 'HANDOVER_READY';
  
  
  const handleStartHandover = async () => {
    try {
      const type = window.location.pathname.includes('cloth') ? 'cloth' : 'food';
      const { data } = await api.patch(`/transfer/${type}/${donation._id || donation.id}/handover`, {});
      if (onUpdate) onUpdate(data);
    } catch (err) {
      showToast('Error', err.response?.data?.message || 'Failed to start handover');
    }
  };

  const generateToken = async () => {
    try {
      const type = window.location.pathname.includes('cloth') ? 'cloth' : 'food';
      const res = await api.get(`/transfer/${type}/${donation._id || donation.id}/handover-token`);
      setTokenInfo(res.data);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to generate QR';
      showToast('Error', message);
    }
  };

  const handleScan = async (data) => {
    try {
      setIsVerifying(true);
      setShowScanner(false);
      let tokenToVerify = data;
      
      // Parse if it is JSON payload
      try {
        const parsed = JSON.parse(data);
        if (parsed.token) tokenToVerify = parsed;
      } catch (e) {
        tokenToVerify = data.replace(/[^0-9]/g, '').slice(0, 6);
      }

      await verifyToken(tokenToVerify);
    } catch (err) {
      const message = err?.response?.data?.message || 'Verification failed';
      showToast('Error', message);
      setIsVerifying(false);
    }
  };

  const handleManualSubmit = async () => {
    if (pinInput.length !== 6) return;
    try {
      setIsVerifying(true);
      await verifyToken(pinInput);
    } catch (err) {
      const message = err?.response?.data?.message || 'Verification failed';
      showToast('Error', message);
      setIsVerifying(false);
    }
  };

  const verifyToken = async (tokenString) => {
    // 1. Backend validates token & receiver
    const res = await api.post(`/transfer/${window.location.pathname.includes('cloth') ? 'cloth' : 'food'}/${donation._id}/verify-handover`, { token: tokenString });
    
    // 2. Success message requested by user
    showToast('Success', 'Handover Verified');
    
    if (onUpdate) onUpdate(res.data.donation);
    setIsVerifying(false);
  };

  const handleConfirmReceived = async () => {
    try {
      const res = await api.patch(`/transfer/${window.location.pathname.includes('cloth') ? 'cloth' : 'food'}/${donation._id}/complete`, {});
      showToast('Success', 'Transfer Completed');
      if (onUpdate) onUpdate(res.data);
    } catch (err) {
      showToast('Error', err.response?.data?.message || 'Failed to complete transfer');
    }
  };

  if (!['ACCEPTED', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'TRACKING', 'ARRIVED', 'HANDOVER_READY', 'QR_VERIFIED'].includes(donation.status)) {
    return null; // Do not show for Available, Pending, Rejected, Cancelled, Expired, Completed
  }

  return (
    <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
        <h4 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase">{t("Pickup Verification")}</h4>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 text-sm">
        <div>
          <p className="text-xs text-slate-500 font-medium">{t("Food Name")}</p>
          <p className="font-bold text-slate-900 truncate">{donation.foodName}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">{t("Quantity")}</p>
          <p className="font-bold text-slate-900">{donation.quantity} {donation.unit}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">{isDonorView ? t("Receiver Name") : t("Donor Name")}</p>
          <p className="font-bold text-slate-900 truncate">{isDonorView ? request.receiver?.name : request.donor?.name}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">{t("Request ID")}</p>
          <p className="font-bold text-slate-900 truncate text-xs mt-0.5">{request._id}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center min-h-[120px]">
        {isDonorView ? (
          <>
            <p className="text-sm font-semibold text-slate-700 mb-3">{t("Pickup Status:")} <span className="text-emerald-600">{t(donation.status)}</span></p>
            {donation.status === 'QR_VERIFIED' ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">{t("QR Verified Successfully!")}</p>
                <p className="text-xs text-slate-500 text-center max-w-[300px]">
                  {t("Waiting for the receiver to confirm they have received the items.")}
                </p>
              </div>
            ) : isEligibleForHandover ? (
              tokenInfo ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-3 bg-white border border-emerald-100 shadow-sm rounded-xl">
                    <QRCodeSVG value={tokenInfo.qrPayload || JSON.stringify({ donationId: donation._id, token: tokenInfo.token, purpose: 'HungerLink_Handover_Verification' })} size={140} level="H" />
                  </div>
                  <p className="text-lg font-black tracking-widest text-slate-900">{tokenInfo.token}</p>
                  <p className="text-xs text-slate-500 max-w-[200px] text-center">{t("Show this QR to the receiver to authorize the pickup.")}</p>
                </div>
              ) : (
                <Button onClick={generateToken} className="bg-emerald-600 hover:bg-emerald-700">
                  <QrCode className="w-4 h-4 mr-2" /> {t("Show QR Code")}
                </Button>
              )
            
            ) : donation.status === 'ARRIVED' ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-slate-500 text-center max-w-[300px]">
                  {t("Both participants have arrived. You can now start the secure handover process.")}
                </p>
                <Button onClick={handleStartHandover} className="bg-indigo-600 hover:bg-indigo-700 w-full max-w-xs">
                  {t("Start Handover")}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center max-w-[300px]">
                {t("QR Code will be available once the request progresses to the handover stage.")}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-700 mb-3 text-center">{t("QR Verification Instructions")}</p>
            {donation.status === 'QR_VERIFIED' ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">{t("QR Verified Successfully!")}</p>
                <p className="text-xs text-slate-500 text-center max-w-[300px] mb-2">
                  {t("Please take the items. Confirm when you have received them.")}
                </p>
                <Button onClick={handleConfirmReceived} className="w-full bg-emerald-600 hover:bg-emerald-700 max-w-xs">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> {t("I Received the Donation")}
                </Button>
              </div>
            ) : isEligibleForHandover ? (
              showScanner ? (
                <QRScanner 
                  onScan={handleScan} 
                  onClose={() => setShowScanner(false)} 
                  onFallback={() => {
                    setShowScanner(false);
                    setShowManualPin(true);
                  }}
                />
              ) : showManualPin ? (
                <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                  <p className="text-xs text-slate-500 text-center mb-2">{t("Enter the 6-digit PIN shown on the donor's screen.")}</p>
                  <input 
                    type="text" 
                    value={pinInput} 
                    onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="------"
                    className="w-full text-center text-3xl font-black tracking-[0.3em] py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                  />
                  <div className="flex gap-2 w-full mt-2">
                    <Button onClick={() => setShowManualPin(false)} variant="outline" className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50">
                      {t("Back")}
                    </Button>
                    <Button onClick={handleManualSubmit} disabled={pinInput.length !== 6 || isVerifying} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> {isVerifying ? t("Verifying...") : t("Verify PIN")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs text-slate-500 text-center max-w-[300px] mb-2">
                    {t("When you meet the donor, scan their QR code to securely verify and complete the pickup.")}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => setShowScanner(true)} disabled={isVerifying} className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5">
                      <Scan className="w-4 h-4 mr-2" /> {isVerifying ? t("Verifying...") : t("Scan QR to Confirm Pickup")}
                    </Button>
                    <Button onClick={() => setShowManualPin(true)} disabled={isVerifying} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-4 py-2.5">
                      <KeyRound className="w-4 h-4 mr-2" /> {t("Enter PIN")}
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <p className="text-xs text-slate-500 text-center max-w-[300px]">
                {t("Scanning will be available once the donor initiates the handover process.")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PickupVerification;
