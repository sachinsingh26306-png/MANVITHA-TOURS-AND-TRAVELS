import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';
import {
  Users,
  Compass,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsData = await api.reports.getDashboardStats();
        const trendsData = await api.reports.getMonthlyTrends();
        setStats(statsData);
        setTrends(trendsData);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
        {error}
      </div>
    );
  }

  // Colors for category pie chart
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

  const statCards = [
    {
      title: 'Total Active Drivers',
      value: stats?.totalDrivers || 0,
      icon: Users,
      color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30'
    },
    {
      title: 'Active Trips',
      value: stats?.activeTrips || 0,
      icon: Compass,
      color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30'
    },
    {
      title: 'Pending Settlements',
      value: stats?.pendingSettlements || 0,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30'
    },
    {
      title: 'Total Verified Expenses',
      value: formatCurrency(stats?.totalExpenses || 0),
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="text-sm font-medium text-slate-400 dark:text-zinc-500">
          Overview of Manivtha Tours & Travels operations and settlements.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium card-interactive dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400 dark:text-zinc-500">{card.title}</span>
                <div className={`rounded-xl p-2.5 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold tracking-tight md:text-3xl">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphs Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Trend Area Chart (Advances vs Expenses) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium card-interactive dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Monthly Financial Trends</h2>
              <p className="text-xs font-medium text-slate-400 dark:text-zinc-500">Comparison of advances given vs. approved settlements.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-blue-500">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span> Advances
              </span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Expenses
              </span>
            </div>
          </div>

          <div className="h-80 w-full">
            {trends.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No trends data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAdvances" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: '11px', fontWeight: '600', fill: '#94a3b8' }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fontWeight: '600', fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: 'var(--card-bg)' }}
                    formatter={(value) => [formatCurrency(value), null]}
                  />
                  <Area type="monotone" dataKey="advances" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorAdvances)" />
                  <Area type="monotone" dataKey="expenses" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense Category Pie Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium card-interactive dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 className="text-lg font-bold">Category Distribution</h2>
            <p className="text-xs font-medium text-slate-400 dark:text-zinc-500">Breakdown of approved trip expenses.</p>
          </div>

          <div className="relative flex h-80 flex-col items-center justify-center">
            {stats?.categoryBreakdown?.length === 0 ? (
              <div className="text-sm text-slate-400">No expenses recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.categoryBreakdown || []}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="total"
                    nameKey="category"
                  >
                    {(stats?.categoryBreakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(value), null]} />
                  <Legend 
                    verticalAlign="bottom" 
                    iconSize={8} 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', fontWeight: '600' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Row - Audits & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Audit Logs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium card-interactive dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Recent Activities</h2>
              <p className="text-xs font-medium text-slate-400 dark:text-zinc-500">Audit trail of critical system operations.</p>
            </div>
            <Info className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {stats?.recentActivity?.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">No recent logs.</div>
            ) : (
              stats?.recentActivity?.map((log) => (
                <div 
                  key={log.id}
                  className="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-zinc-800"
                >
                  <div className="space-y-1">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {log.action.replace('_', ' ')}
                    </span>
                    <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">{log.details}</p>
                    <div className="flex gap-2 text-[10px] text-slate-400 dark:text-zinc-500">
                      <span>By: {log.user?.name || 'System'}</span>
                      <span>•</span>
                      <span>{formatDate(log.createdAt)} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium card-interactive dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold mb-1">Administrative Actions</h2>
            <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 mb-6">Quick shortcuts to critical functions.</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/admin/trips'}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold hover:bg-slate-50 btn-interactive dark:border-zinc-800 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <span>Create & Assign a Trip</span>
                <ArrowRight className="h-4 w-4 text-blue-500" />
              </button>
              <button 
                onClick={() => window.location.href = '/admin/drivers'}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold hover:bg-slate-50 btn-interactive dark:border-zinc-800 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <span>Add Driver Profile</span>
                <ArrowRight className="h-4 w-4 text-blue-500" />
              </button>
              <button 
                onClick={() => window.location.href = '/admin/expenses'}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold hover:bg-slate-50 btn-interactive dark:border-zinc-800 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <span>Verify Pending Receipts</span>
                <ArrowRight className="h-4 w-4 text-blue-500" />
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center dark:border-zinc-800">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
              Manivtha Tours & Travels • 2026
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
