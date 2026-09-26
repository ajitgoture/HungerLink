import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Shirt, Users, CheckCircle, Target, Loader2, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';

// Simple custom hook for counting animation
const useCountUp = (end, duration = 1500) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp = null;
    const step = timestamp => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // ease-out quartic
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  return count;
};
const AnimatedNumber = ({
  value
}) => {
  const { t, i18n } = useTranslation();
  
  const count = useCountUp(value);
  return <span>{count.toLocaleString(i18n.language, )}</span>;
};
const ImpactDashboard = () => {
  
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('all');
  const [personalStats, setPersonalStats] = useState(null);
  const [communityStats, setCommunityStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchImpact = async () => {
      setLoading(true);
      try {
        const [commRes, persRes] = await Promise.all([api.get(`/impact/community?timeframe=${timeframe}`), user ? api.get(`/impact/personal?timeframe=${timeframe}`) : Promise.resolve({
          data: null
        })]);
        setCommunityStats(commRes.data);
        setPersonalStats(persRes.data);
      } catch (err) {
        console.error('Failed to fetch impact stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchImpact();
  }, [timeframe, user]);
  return <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition mb-4">
              <ArrowLeft className="w-4 h-4" /> {"Back"}
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{"Your Impact"}</h1>
            <p className="text-slate-500 mt-2">{"See the real-world difference you are making on HungerLink."}</p>
          </div>
          
          <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
            {['today', 'week', 'month', 'all'].map(tf => <button key={tf} onClick={() => setTimeframe(tf)} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${timeframe === tf ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}>
                {tf === 'all' ? 'All Time' : tf === 'today' ? 'Today' : `This ${tf.charAt(0).toUpperCase() + tf.slice(1)}`}
              </button>)}
          </div>
        </div>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div> : <div className="space-y-12">
            
            {/* Personal Impact */}
            {user && personalStats && <section>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-indigo-600" /> {"My Contributions"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {user.role.includes('Donor') && <>
                      <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="p-6">
                          <Utensils className="w-8 h-8 text-amber-500 mb-4" />
                          <p className="text-4xl font-black text-amber-700 mb-1"><AnimatedNumber value={personalStats.mealsShared} /></p>
                          <p className="text-sm font-bold text-amber-900/60 uppercase tracking-widest">{"Meals Shared"}</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-indigo-50 border-indigo-200">
                        <CardContent className="p-6">
                          <Shirt className="w-8 h-8 text-indigo-500 mb-4" />
                          <p className="text-4xl font-black text-indigo-700 mb-1"><AnimatedNumber value={personalStats.clothesDonated} /></p>
                          <p className="text-sm font-bold text-indigo-900/60 uppercase tracking-widest">{"Clothing Items"}</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-emerald-50 border-emerald-200">
                        <CardContent className="p-6">
                          <Users className="w-8 h-8 text-emerald-500 mb-4" />
                          <p className="text-4xl font-black text-emerald-700 mb-1"><AnimatedNumber value={personalStats.peopleHelped} /></p>
                          <p className="text-sm font-bold text-emerald-900/60 uppercase tracking-widest">{"People Helped"}</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-6">
                          <CheckCircle className="w-8 h-8 text-blue-500 mb-4" />
                          <p className="text-4xl font-black text-blue-700 mb-1"><AnimatedNumber value={personalStats.successfulTransfers} /></p>
                          <p className="text-sm font-bold text-blue-900/60 uppercase tracking-widest">{"Transfers ("} {personalStats.completionRate}{"% Rate )"}</p>
                        </CardContent>
                      </Card>
                    </>}
                  
                  {user.role.includes('Receiver') && <>
                      <Card className="bg-emerald-50 border-emerald-200">
                        <CardContent className="p-6">
                          <CheckCircle className="w-8 h-8 text-emerald-500 mb-4" />
                          <p className="text-4xl font-black text-emerald-700 mb-1"><AnimatedNumber value={personalStats.successfulRequests} /></p>
                          <p className="text-sm font-bold text-emerald-900/60 uppercase tracking-widest">{"Successful Requests"}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-teal-50 border-teal-200">
                        <CardContent className="p-6">
                          <Shirt className="w-8 h-8 text-teal-500 mb-4" />
                          <p className="text-4xl font-black text-teal-700 mb-1"><AnimatedNumber value={personalStats.itemsReceived} /></p>
                          <p className="text-sm font-bold text-teal-900/60 uppercase tracking-widest">{"Items Received"}</p>
                        </CardContent>
                      </Card>
                    </>}
                </div>
              </section>}

            {/* Community Impact */}
            {communityStats && <section className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-indigo-50 rounded-full blur-3xl -z-10 pointer-events-none" />
                <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                  <Users className="w-8 h-8 text-indigo-600" /> {"Community Impact"}
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
                  <div className="px-4 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{"Total Meals"}</p>
                    <p className="text-3xl font-black text-amber-500"><AnimatedNumber value={communityStats.totalFoodMeals} /></p>
                  </div>
                  <div className="px-4 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{"Total Clothes"}</p>
                    <p className="text-3xl font-black text-indigo-500"><AnimatedNumber value={communityStats.totalClothes} /></p>
                  </div>
                  <div className="px-4 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{"Transfers"}</p>
                    <p className="text-3xl font-black text-blue-500"><AnimatedNumber value={communityStats.completedTransfers} /></p>
                  </div>
                  <div className="px-4 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{"Est. People Helped"}</p>
                    <p className="text-3xl font-black text-emerald-500"><AnimatedNumber value={communityStats.estimatedPeopleHelped} /></p>
                  </div>
                </div>

                <div className="mt-10 p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-slate-500">{"Every donation makes an incredible difference. The HungerLink community continues to provide real, localized support directly to those in need. Transparency and efficiency are at our core."}</p>
                  </div>
                </div>
              </section>}

          </div>}
      </div>
    </div>;
};
export default ImpactDashboard;