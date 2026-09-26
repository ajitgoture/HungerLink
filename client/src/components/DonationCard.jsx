import { useTranslation } from "react-i18next";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, Badge, StatusBadge, Button } from './ui';
import { MapPin, Clock, Users, ArrowRight, ShieldCheck, Box, Info, Utensils } from 'lucide-react';

export function DonationCard({ item, type = 'food', currentUserId, onRequest, onManage }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isFood = type === 'food';
  const isOwner = currentUserId === item.donor?._id || currentUserId === item.donor;
  const isRequestedByMe = item.requests?.some(r => (r.receiver?._id || r.receiver) === currentUserId);

  const totalPieces = !isFood && item.items ? item.items.reduce((acc, it) => acc + (parseInt(it.quantity)||1), 0) : item.quantity;
  const theme = isFood ? {
    color: 'amber',
    icon: <Users className="w-4 h-4 mr-1.5" />,
    metric: `${item.peopleServed} Served`,
    typeLabel: item.foodType,
    bgImgFallback: 'bg-amber-100'
  } : {
    color: 'indigo',
    icon: <Box className="w-4 h-4 mr-1.5" />,
    metric: `Total Pieces: ${totalPieces}`,
    typeLabel: item.clothingType || 'Clothes',
    bgImgFallback: 'bg-indigo-100'
  };

  const isAvailable = item.status === 'AVAILABLE';

  return (
    <Card className="group hover:border-slate-300 transition-all flex flex-col h-full">
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {(item.imageUrl || (item.imageUrls && item.imageUrls[0])) ? (
          <img src={item.imageUrl || item.imageUrls[0]} alt={isFood ? item.foodName : item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${theme.bgImgFallback} text-${theme.color}-400`}>
            {theme.icon}
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <StatusBadge status={item.status} />
          {isFood && item.foodType && <Badge variant="food" className="bg-white/90 backdrop-blur shadow-sm">{item.foodType}</Badge>}
          {!isFood && item.condition && <Badge variant="cloth" className="bg-white/90 backdrop-blur shadow-sm">{item.condition}</Badge>}
        </div>
      </div>
      
      <CardContent className="flex-grow pt-4">
        <h3 className="font-extrabold text-slate-900 text-lg mb-1 truncate">
          {isFood ? item.foodName : t("Clothing Donation")}
        </h3>
        
        <div className="flex items-center text-sm text-slate-500 mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="truncate">{item.approximateLocation?.area || item.approximateLocation?.city || 'Location hidden'}</span>
          {item.distance && <span className="ml-2 font-medium text-slate-700">• {item.distance.toFixed(1)} {t("km")}</span>}
        </div>
        
        {!isFood && item.items && item.items.length > 0 && (
          <div className="mb-4 text-xs text-slate-600 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
            <p className="font-semibold text-indigo-900 mb-1">{t("Available Items:")}</p>
            <ul className="space-y-1">
              {item.items.slice(0, 3).map((it, idx) => (
                <li key={idx} className="truncate">• {t(it.recipientCategory)} - {it.type} - {it.size} - {it.quantity} {t("pieces")}</li>
              ))}
              {item.items.length > 3 && (
                <li className="text-indigo-500 font-medium pl-2">+{item.items.length - 3} {t("more items...")}</li>
              )}
            </ul>
          </div>
        )}

        {isFood && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center text-[11px] sm:text-xs font-semibold text-slate-700">
              {theme.icon}
              {theme.metric}
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center text-[11px] sm:text-xs font-semibold text-slate-700">
              <Box className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <span className="truncate">{t("Qty:")} {item.quantity} {item.unit || 'units'}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center text-[11px] sm:text-xs font-semibold text-slate-700">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <span className="truncate">{t('Exp:')} {new Date(item.expiryTime || item.createdAt).toLocaleDateString(i18n.language)}</span>
            </div>
            {item.preparationTime && (
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center text-[11px] sm:text-xs font-semibold text-slate-700">
                <Utensils className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <span className="truncate">{t("Prep:")} {new Date(item.preparationTime).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            {item.availableFrom && (
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center text-[11px] sm:text-xs font-semibold text-slate-700">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <span className="truncate">{t("Pickup:")} {new Date(item.availableFrom).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
        )}

        {!isFood && (
          <div className="grid grid-cols-2 gap-3 mb-4">
             <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center text-[11px] sm:text-xs font-semibold text-slate-700">
              {theme.icon}
              {theme.metric}
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center text-[11px] sm:text-xs font-semibold text-slate-700">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <span className="truncate">{t('Listed:')} {new Date(item.createdAt).toLocaleDateString(i18n.language)}</span>
            </div>
          </div>
        )}

        {item.donor?.name && (
          <div className="flex items-center gap-2 mt-auto cursor-pointer hover:bg-slate-50 p-1.5 -ml-1.5 rounded-lg transition-colors" onClick={e => {
            e.stopPropagation();
            navigate(`/profile/${item.donor._id || item.donor}`);
          }}>
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs text-slate-600 font-semibold hover:text-emerald-700 transition-colors">
              {t("Verified Donor:")} {item.donor.name}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 bg-transparent border-none pb-5 flex flex-col gap-2">
        <Button variant="outline" className="w-full gap-2" onClick={() => navigate(`/${type}/donations/${item._id}`)}>
          <Info className="w-4 h-4" /> {t("View Details")}
        </Button>
        {isOwner ? (
          <Button variant="secondary" className="w-full" onClick={e => {
            e.stopPropagation();
            onManage(item);
          }}>
            {t("Manage Donation")}
          </Button>
        ) : isRequestedByMe ? (
          <Button variant="outline" className="w-full" disabled>
            {t("Request Sent")}
          </Button>
        ) : isAvailable ? (
          <Button variant="primary" className="w-full gap-2" onClick={e => {
            e.stopPropagation();
            onRequest(item);
          }}>
            {t("Request")} {isFood ? t('Food') : t('Clothes')} <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="ghost" className="w-full" disabled>
            {t("No Longer Available")}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}