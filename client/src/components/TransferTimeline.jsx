import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QRScanner } from './QRScanner';
import { Check, Clock, Truck, PackageCheck, MapPin, Handshake, Info, ShieldCheck, Camera, QrCode } from 'lucide-react';
import { Button, Badge } from './ui';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
export const TransferTimeline = ({
  donation,
  isDonor,
  onUpdate
}) => {
  const { t, i18n } = useTranslation();
  
  
  const {
    showToast
  } = useNotifications();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenPayload, setTokenPayload] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const status = donation.status;
  const moduleType = donation.moduleType || (donation.foodName ? 'food' : 'cloth');
  const isReceiver = !isDonor; // isDonor is passed as prop; receiver is the other party

  // Define steps
  const steps = [{
    id: 'ACCEPTED',
    label: t("Accepted"),
    icon: Check
  }, {
    id: 'ACCEPTED',
    label: t("Method Selected"),
    icon: Info
  }, {
    id: 'READY',
    label: t("Ready"),
    icon: PackageCheck,
    mappedStatus: ['READY_FOR_PICKUP', 'READY_FOR_DELIVERY']
  }, {
    id: 'TRACKING',
    label: t("On The Way"),
    icon: Truck,
    mappedStatus: ['TRACKING', 'APPROACHING']
  }, {
    id: 'ARRIVED',
    label: t("Arrived"),
    icon: MapPin
  }, {
    id: 'HANDOVER_READY',
    label: t("Handover"),
    icon: Handshake
  }, {
    id: 'COMPLETED',
    label: t("Completed"),
    icon: Check
  }];
  const getStepStatus = (stepId, mappedStatus) => {
    const statusOrder = ['AVAILABLE', 'REQUESTED', 'ACCEPTED', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'TRACKING', 'APPROACHING', 'ARRIVED', 'HANDOVER_READY', 'QR_VERIFIED', 'COMPLETED', 'EXPIRED', 'CANCELLED'];
    const currentIdx = statusOrder.indexOf(status);
    let stepIdx = statusOrder.indexOf(stepId);
    if (mappedStatus && mappedStatus.length > 0) {
      // If the current status is one of the mapped ones, it's the active one
      if (mappedStatus.includes(status)) stepIdx = currentIdx;
      // Otherwise, find the lowest mapped status index
      else stepIdx = Math.min(...mappedStatus.map(s => statusOrder.indexOf(s)));
    }
    if (currentIdx === -1) return 'pending'; // Unknown
    if (status === 'CANCELLED') return 'cancelled';
    if (currentIdx > stepIdx) return 'completed';
    if (currentIdx === stepIdx) return 'current';
    return 'pending';
  };
  const handleAction = async (endpoint, data = {}) => {
    try {
      const res = await api.post(`/transfer/${moduleType}/${donation._id}/${endpoint}`, data);
      showToast('toastTitle_success', 'toastMsg_transferStatusUpdatedSuccessfully');
      if (onUpdate) onUpdate(res.data);
    } catch (error) {
      showToast('toastTitle_error', error.response?.data?.message || t('toastMsg_errorUpdatingStatus'));
    }
  };
  const handlePatchAction = async endpoint => {
    try {
      const res = await api.patch(`/transfer/${moduleType}/${donation._id}/${endpoint}`);
      showToast('toastTitle_success', 'toastMsg_transferStatusUpdatedSuccessfully');
      if (onUpdate) onUpdate(res.data);
    } catch (err) {
      const message = err?.response?.data?.message || t('toastMsg_error');
      showToast('toastTitle_error', message);
    }
  };
  const handleGenerateToken = async () => {
    try {
      const res = await api.get(`/transfer/${moduleType}/${donation._id}/handover-token`);
      setTokenInfo(res.data);
    } catch (err) {
      const message = err?.response?.data?.message || t('toastMsg_error');
      showToast('toastTitle_error', message);
    }
  };
  const handleVerifyToken = async () => {
    try {
      const { data } = await api.post(`/transfer/${moduleType}/${donation._id}/verify-handover`, {
        token: tokenPayload || tokenInput
      });
      showToast('toastTitle_success', 'toastMsg_handoverVerifiedSecurely');
      if (onUpdate) onUpdate(data.donation);
    } catch (err) {
      showToast('toastTitle_error', err.response?.data?.message ? t(err.response.data.message) : t('toastMsg_error'));
    }
  };
  if (status === 'COMPLETED') {
    return <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-8 text-center shadow-sm">
        <div className="w-20 h-20 mx-auto bg-emerald-500 rounded-full flex items-center justify-center shadow-emerald-200 shadow-xl mb-6">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-black text-emerald-900 mb-2">{t("Donation Successfully Completed")}</h2>
        <p className="text-emerald-700 font-medium max-w-md mx-auto">
          {t("The handover was verified and the items have been transferred. Thank you for making a real impact in your community!")}
        </p>
      </div>;
  }
  return <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mt-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">{t("Transfer Progress")}</h3>
      
      {status === 'CANCELLED' && <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-bold border border-rose-200 mb-6">
          {t("This transfer was cancelled.")}
        </div>}

      {/* Timeline Visuals */}
      <div className="relative flex justify-between items-center mb-8">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
        
        {steps.map((step, index) => {
        const stepStatus = getStepStatus(step.id, step.mappedStatus);
        const IconComponent = step.icon;
        let bgColor = 'bg-slate-100';
        let textColor = 'text-slate-400';
        let iconColor = 'text-slate-400';
        if (stepStatus === 'completed') {
          bgColor = 'bg-emerald-500';
          textColor = 'text-emerald-700 font-bold';
          iconColor = 'text-white';
        } else if (stepStatus === 'current') {
          bgColor = 'bg-teal-500 ring-4 ring-teal-100';
          textColor = 'text-teal-700 font-bold';
          iconColor = 'text-white';
        }
        return <div key={index} className="relative z-10 flex flex-col items-center gap-2 group">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${bgColor}`}>
                <IconComponent className={`w-5 h-5 ${iconColor}`} />
              </div>
              <span className={`text-[10px] md:text-xs text-center w-16 absolute -bottom-6 ${textColor}`}>
                {step.label}
              </span>
            </div>;
      })}
      </div>

      {/* Actions */}
      <div className="mt-12 flex flex-col gap-3">
        {status === 'ACCEPTED' && isDonor && <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-600 font-medium">{t("Select a transfer method:")}</p>
            <div className="flex gap-3">
              <Button onClick={() => handleAction('method', {
            method: 'PICKUP'
          })} className="flex-1">
                <PackageCheck className="w-4 h-4 mr-2" /> {t("Mark Ready for Pickup")}
              </Button>
              <Button onClick={() => handleAction('method', {
            method: 'DELIVERY'
          })} variant="secondary" className="flex-1">
                <Truck className="w-4 h-4 mr-2" /> {t("Mark Out for Delivery")}
              </Button>
            </div>
          </div>}

        {(status === 'READY_FOR_PICKUP' || status === 'READY_FOR_DELIVERY') && (
          (status === 'READY_FOR_PICKUP' && isReceiver) || (status === 'READY_FOR_DELIVERY' && isDonor)
        ) && <div className="flex gap-3">
            <Button onClick={() => handlePatchAction('on-the-way')} className="w-full">
              <MapPin className="w-4 h-4 mr-2" /> {t("I'm On The Way")}
            </Button>
          </div>}

        {['READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'TRACKING', 'APPROACHING', 'ARRIVED', 'HANDOVER_READY'].includes(status) && isDonor && <div className="flex gap-3">
            <Button onClick={() => handlePatchAction('handover')} className="w-full">
              <Handshake className="w-4 h-4 mr-2" /> {t("Start Handover")}
            </Button>
          </div>}
        {['READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'TRACKING', 'APPROACHING', 'ARRIVED'].includes(status) && isReceiver && <p className="text-sm text-slate-600 text-center">{t("Waiting for donor to start handover.")}</p>}

        {status === 'HANDOVER_READY' && isDonor && <div className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-800 font-bold mb-2">
                <ShieldCheck className="w-5 h-5" /> {t("Secure Handover Code")}
              </div>
              
              {!tokenInfo ? <Button onClick={handleGenerateToken} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <QrCode className="w-4 h-4 mr-2" /> {t("Generate Verification Code")}
                </Button> : <div className="flex flex-col items-center space-y-4 pt-2">
                  <p className="text-sm text-emerald-700 font-medium text-center">{t("Show this QR code to the receiver")}</p>
                  <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm inline-block">
                    <QRCodeSVG value={tokenInfo.qrPayload || JSON.stringify({ donationId: donation._id, token: tokenInfo.token, purpose: 'HungerLink_Handover_Verification' })} size={180} level="H" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 tracking-widest text-center bg-white px-8 py-2 rounded-xl border border-emerald-100 shadow-inner">
                    {tokenInfo.token}
                  </div>
                  <p className="text-xs text-emerald-600 text-center font-medium">
                    {t("Expires in 15 minutes. DO NOT share this online.")}
                  </p>
                </div>}
            </div>
            <p className="text-xs text-slate-500 text-center px-4">
              {t("The receiver must scan this QR code or enter the 6-digit PIN to complete the donation.")}
            </p>
          </div>}

        {status === 'HANDOVER_READY' && isReceiver && <div className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center justify-between gap-2 text-emerald-800 font-bold mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> {t("Verify Handover")}
                </div>
              </div>
              
              {showScanner ? (
                <QRScanner 
                  onScan={(data) => {
                    try {
                      const parsed = JSON.parse(data);
                      if (parsed.token) {
                        setTokenInput(parsed.token);
                        setTokenPayload(parsed);
                        setShowScanner(false);
                      }
                    } catch(e) {
                      setTokenInput(data.replace(/[^0-9]/g, '').slice(0, 6)); 
                      setTokenPayload(null);
                      setShowScanner(false);
                    }
                  }} 
                  onClose={() => setShowScanner(false)} 
                />
              ) : <div className="space-y-3">
                  <Button onClick={() => setShowScanner(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 mb-2 py-6 text-base shadow-md">
                    <QrCode className="w-5 h-5 mr-2" /> {t("Scan QR Code")}
                  </Button>
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-emerald-200"></div>
                    <span className="flex-shrink-0 mx-4 text-emerald-600 text-xs font-semibold uppercase">{t("Or Enter Code Manually")}</span>
                    <div className="flex-grow border-t border-emerald-200"></div>
                  </div>
                  <input type="text" value={tokenInput} onChange={e => { setTokenInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 6)); setTokenPayload(null); }} placeholder={t("Enter 6-digit PIN from Donor")} className="w-full p-3 text-center text-xl font-bold tracking-widest bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow" />
                  <Button onClick={handleVerifyToken} disabled={tokenInput.length !== 6} className="w-full bg-slate-800 hover:bg-slate-900 text-white">
                    <Check className="w-4 h-4 mr-2" /> {t("Verify Handover")}
                  </Button>
                </div>}
            </div>
          </div>}

        {status === 'QR_VERIFIED' && isReceiver && <div className="flex gap-3 mt-4">
            <Button onClick={() => handlePatchAction('complete')} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Check className="w-4 h-4 mr-2" /> {t("Finalize Transfer")}
            </Button>
          </div>}
        {status === 'QR_VERIFIED' && isDonor && <p className="text-sm text-slate-600 text-center">{t("QR verified. Waiting for the receiver to confirm receipt.")}</p>}

        {/* Generic Cancel Button (Only if not completed or cancelled) */}
        {!['COMPLETED', 'CANCELLED', 'EXPIRED', 'QR_VERIFIED'].includes(status) && <div className="pt-4 mt-4 border-t border-slate-100 text-right">
            <Button variant="outline" className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => handlePatchAction('cancel')}>
              {t("Cancel Transfer")}
            </Button>
          </div>}
      </div>
    </div>;
};