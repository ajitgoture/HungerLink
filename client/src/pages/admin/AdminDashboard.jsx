import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, AlertTriangle, CheckCircle, Clock, Search, List, Activity, Settings, Database, BarChart3, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card, CardContent, CardHeader, CardTitle, Badge, Input, Button } from '../../components/ui';
const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  
  
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    showToast
  } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [operations, setOperations] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchOperations = async () => {
    try {
      const res = await api.get('/admin/operations/live');
      setOperations(res.data.operations);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchUsers = async () => {
    try {
      const res = await api.get(`/admin/users?page=${page}&search=${search}`);
      setUsersList(res.data.users);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchReports = async () => {
    try {
      const res = await api.get('/admin/reports');
      setReports(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (activeTab === 'overview') await fetchStats();else if (activeTab === 'operations') await fetchOperations();else if (activeTab === 'users') await fetchUsers();else if (activeTab === 'reports') await fetchReports();else if (activeTab === 'analytics') await fetchAnalytics();
      setLoading(false);
    };
    loadData();
  }, [activeTab, page, search]);
  if (loading && !stats && !operations.length) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">{t("Loading Command Center...")}</div>;
  }
  return <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col p-4 gap-2">
        <div className="flex items-center gap-3 px-2 py-4 mb-4 border-b border-slate-800">
          <ShieldCheck className="w-8 h-8 text-indigo-500" />
          <div>
            <h2 className="font-black text-lg text-white leading-none">{t("ADMIN")}</h2>
            <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{t("Command Center")}</span>
          </div>
        </div>

        {[{
        id: 'overview',
        icon: Activity,
        label: t("System Overview")
      }, {
        id: 'analytics',
        icon: BarChart3,
        label: t("Analytics & Geo Insights")
      }, {
        id: 'operations',
        icon: List,
        label: t("Live Operations")
      }, {
        id: 'users',
        icon: Users,
        label: t("User Management")
      }, {
        id: 'reports',
        icon: AlertTriangle,
        label: t("Reports & Audit")
      }].map(tab => <button key={tab.id} onClick={() => {
        setActiveTab(tab.id);
        setPage(1);
      }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
            <tab.icon className="w-5 h-5" /> {tab.label}
          </button>)}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          
          {activeTab === 'overview' && stats && <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl font-black text-white">{t("System Analytics")}</h1>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <p className="text-sm font-bold text-slate-400 uppercase">{t("Total Users")}</p>
                    <p className="text-4xl font-black text-white mt-2">{stats.overview.totalUsers}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <p className="text-sm font-bold text-slate-400 uppercase">{t("Active Donations")}</p>
                    <p className="text-4xl font-black text-emerald-400 mt-2">{stats.overview.activeDonations}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <p className="text-sm font-bold text-slate-400 uppercase">{t("Active Transfers")}</p>
                    <p className="text-4xl font-black text-blue-400 mt-2">{stats.overview.activeTransfers}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <p className="text-sm font-bold text-slate-400 uppercase">{t("Urgent Items")}</p>
                    <p className="text-4xl font-black text-red-400 mt-2">{stats.overview.urgentDonations}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader><CardTitle className="text-white">{t("Daily Performance")}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-900 rounded-xl">
                      <span className="text-slate-400 font-bold">{t("Completed Today")}</span>
                      <span className="text-2xl font-black text-emerald-400">{stats.overview.completedToday}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-900 rounded-xl">
                      <span className="text-slate-400 font-bold">{t("Expired Today")}</span>
                      <span className="text-2xl font-black text-slate-500">{stats.overview.expiredToday}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader><CardTitle className="text-white">{t("Distribution")}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 text-center p-6 bg-slate-900 rounded-2xl border border-slate-800">
                        <p className="text-4xl font-black text-amber-500 mb-2">{stats.distribution.food}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase">{t("Food Total")}</p>
                      </div>
                      <div className="flex-1 text-center p-6 bg-slate-900 rounded-2xl border border-slate-800">
                        <p className="text-4xl font-black text-indigo-500 mb-2">{stats.distribution.cloth}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase">{t("Clothes Total")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>}

          {activeTab === 'analytics' && analytics && <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl font-black text-white">{t("Platform Analytics & Insights")}</h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <p className="text-sm font-bold text-slate-400 uppercase">{t("Completed Deliveries")}</p>
                    <p className="text-4xl font-black text-emerald-400 mt-2">{analytics.outcomes.completed}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <p className="text-sm font-bold text-slate-400 uppercase">{t("Expired Items")}</p>
                    <p className="text-4xl font-black text-rose-400 mt-2">{analytics.outcomes.expired}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <p className="text-sm font-bold text-slate-400 uppercase">{t("Cancellation Rate")}</p>
                    <p className="text-4xl font-black text-slate-200 mt-2">{analytics.outcomes.cancellationRate}%</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader><CardTitle className="text-white">{t("Daily Donations Trend (Last 7 Days)")}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.dailyTrend.food.slice(-5).map((day, idx) => <div key={idx} className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-400 w-24">{day._id}</span>
                          <div className="flex-1 bg-slate-900 rounded-full h-3 overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{
                        width: `${Math.min(100, day.count * 10)}%`
                      }} />
                          </div>
                          <span className="text-sm font-bold text-slate-300 w-8">{day.count}</span>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader><CardTitle className="text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-400" /> {t("Geographic Supply vs Demand")}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.geoInsights.length === 0 ? <p className="text-slate-500 text-sm">{t("No geographic data available yet.")}</p> : analytics.geoInsights.map((geo, idx) => <div key={idx} className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                            <div>
                              <p className="font-bold text-slate-200">{geo.city}</p>
                              <p className="text-xs text-slate-500">{t("Supply:")} {geo.supply} {t("| Demand:")} {geo.demand}</p>
                            </div>
                            <Badge className={geo.status === 'HIGH DEMAND' ? 'bg-rose-500/20 text-rose-400 border-none' : geo.status === 'HIGH SUPPLY' ? 'bg-indigo-500/20 text-indigo-400 border-none' : 'bg-emerald-500/20 text-emerald-400 border-none'}>
                              {geo.status}
                            </Badge>
                          </div>)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>}

          {activeTab === 'operations' && <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl font-black text-white">{t("Live Operations Tracking")}</h1>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                        <tr>
                          <th className="p-4 rounded-tl-xl">{t("Item")}</th>
                          <th className="p-4">{t("Type")}</th>
                          <th className="p-4">{t("Status")}</th>
                          <th className="p-4">{t("Donor → Receiver")}</th>
                          <th className="p-4 rounded-tr-xl">{t("Location")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {operations.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-500">{t("No active transfers right now.")}</td></tr> : operations.map(op => <tr key={op.id} className="hover:bg-slate-700/20 transition-colors">
                              <td className="p-4 font-medium text-white">{op.item}</td>
                              <td className="p-4"><Badge variant="outline" className="text-slate-300 border-slate-600">{op.type}</Badge></td>
                              <td className="p-4"><Badge className="bg-indigo-500/20 text-indigo-300 border-none">{op.status}</Badge></td>
                              <td className="p-4 text-sm">
                                <span className="text-slate-300">{op.donorName}</span>
                                <span className="mx-2 text-slate-600">&rarr;</span>
                                <span className="text-slate-300">{op.receiverName}</span>
                              </td>
                              <td className="p-4 text-sm text-slate-400">{op.location}</td>
                            </tr>)}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>}

          {activeTab === 'users' && <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-black text-white">{t("User Management")}</h1>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input placeholder={t("Search name or email...")} value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500" />
                </div>
              </div>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                        <tr>
                          <th className="p-4">{t("Name")}</th>
                          <th className="p-4">{t("Email")}</th>
                          <th className="p-4">{t("Role")}</th>
                          <th className="p-4">{t("City")}</th>
                          <th className="p-4">{t("Verified")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {usersList.map(u => <tr key={u._id} className="hover:bg-slate-700/20">
                            <td className="p-4 font-bold text-white">{u.name}</td>
                            <td className="p-4 text-sm text-slate-400">{u.email}</td>
                            <td className="p-4"><Badge className="bg-slate-900 text-slate-300 border-slate-700">{u.role}</Badge></td>
                            <td className="p-4 text-sm text-slate-400">{u.city}</td>
                            <td className="p-4">{u.isVerified ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <span className="text-slate-600">-</span>}</td>
                          </tr>)}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 flex items-center justify-between border-t border-slate-700">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">{t("Previous")}</Button>
                    <span className="text-sm font-bold text-slate-500">{t("Page")} {page}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">{t("Next")}</Button>
                  </div>
                </CardContent>
              </Card>
            </div>}

          {activeTab === 'reports' && <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl font-black text-white">{t("Trust & Safety Reports")}</h1>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                        <tr>
                          <th className="p-4">{t("Date")}</th>
                          <th className="p-4">{t("Reporter")}</th>
                          <th className="p-4">{t("Reported User")}</th>
                          <th className="p-4">{t("Reason")}</th>
                          <th className="p-4">{t("Status")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {reports.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-500">{t("No reports found.")}</td></tr> : reports.map(r => <tr key={r._id} className="hover:bg-slate-700/20">
                              <td className="p-4 text-sm text-slate-400">{new Date(r.createdAt).toLocaleDateString(i18n.language, )}</td>
                              <td className="p-4 font-medium text-slate-200">{r.reporter?.name}</td>
                              <td className="p-4 font-medium text-red-400">{r.reportedUser?.name}</td>
                              <td className="p-4 text-sm text-slate-300">{r.reason}</td>
                              <td className="p-4"><Badge className="bg-amber-500/20 text-amber-500 border-none">{r.status}</Badge></td>
                            </tr>)}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>}

        </div>
      </main>
    </div>;
};
export default AdminDashboard;