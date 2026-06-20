import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatCurrency, formatDate, getStatusColor } from '../utils/formatters';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Award, 
  Compass, 
  Landmark, 
  FileText, 
  Activity, 
  MapPin, 
  Truck, 
  Clock 
} from 'lucide-react';

const Profile = () => {
  const { user, isAdmin } = useAuth();
  const [driverData, setDriverData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError('');
      try {
        if (isAdmin) {
          // Fetch Admin Audit Logs
          const logs = await api.reports.getAuditLogs();
          // Filter logs to show only those matching this admin's ID
          setAuditLogs(logs.filter(l => l.userId === user.id).slice(0, 10));
        } else if (user?.driverProfile) {
          // Fetch Driver Details (with trips and settlements)
          const data = await api.drivers.get(user.driverProfile.id);
          setDriverData(data);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Calculations for Driver Stats
  const trips = driverData?.trips || [];
  const totalTrips = trips.length;
  const totalAdvances = trips.reduce((sum, t) => sum + parseFloat(t.advanceAmount), 0);
  
  let totalApprovedExpenses = 0;
  trips.forEach(t => {
    if (t.status === 'settled' && t.settlement) {
      totalApprovedExpenses += parseFloat(t.settlement.totalExpenses);
    }
  });

  const netBalance = totalApprovedExpenses - totalAdvances;
  const isReimbursable = netBalance >= 0;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Profile</h1>
        <p className="text-sm font-medium text-slate-400 dark:text-zinc-500">
          Personal contact details, roles, and tour statistics.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Profile Info Row */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium card-interactive dark:border-zinc-800 dark:bg-zinc-900 md:col-span-1 flex flex-col items-center text-center">
          
          {/* Avatar Picture */}
          <div className="relative mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-blue-100 bg-slate-100 dark:border-blue-950 dark:bg-zinc-950 flex items-center justify-center shadow-md">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile Avatar" 
                className="h-full w-full object-cover" 
              />
            ) : (
              <User className="h-14 w-14 stroke-1 text-slate-400" />
            )}
          </div>

          <h2 className="text-lg font-bold">{user?.name}</h2>
          <span className="mt-1 inline-flex rounded-lg bg-blue-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/30 dark:border-blue-900/30">
            {user?.role === 'admin' ? 'Administrator' : 'Tour Driver'}
          </span>

          <div className="mt-6 w-full space-y-4 text-left text-xs font-semibold text-slate-500 dark:text-zinc-400 border-t border-slate-100 pt-5 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4.5 w-4.5 text-slate-400" />
              <span className="truncate">{user?.email}</span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <Phone className="h-4.5 w-4.5 text-slate-400" />
              <span>{user?.phone || driverData?.phone || 'No phone added'}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Shield className="h-4.5 w-4.5 text-slate-400" />
              <span>Joined: {formatDate(user?.createdAt)}</span>
            </div>
          </div>

        </div>

        {/* Dynamic Detail Card Block (Admin vs Driver) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium card-interactive dark:border-zinc-800 dark:bg-zinc-900 md:col-span-2">
          
          {/* ADMIN PROFILE INFO */}
          {isAdmin && (
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-bold mb-1">Administrative Privileges</h3>
                <p className="text-xs text-slate-450 dark:text-zinc-500">Overview of your administrative system clearance.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-slate-150 p-4 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20">
                  <span className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Permissions Group</span>
                  <span className="font-bold text-sm">Full System Operations</span>
                </div>
                <div className="rounded-xl border border-slate-150 p-4 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20">
                  <span className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Scope Access</span>
                  <span className="font-bold text-sm">Trips, Advances, Driver CRUD, Reconciliations</span>
                </div>
              </div>

              {/* Recent Actions Audit Logs */}
              <div>
                <h4 className="text-sm font-bold mb-3 flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                  <Activity className="h-4.5 w-4.5 text-blue-500" />
                  My Recent Activity Audit Logs
                </h4>
                
                <div className="space-y-3.5 max-h-48 overflow-y-auto pr-2">
                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No recent actions logged.</p>
                  ) : (
                    auditLogs.map(log => (
                      <div key={log.id} className="flex justify-between items-start border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-zinc-800">
                        <div>
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 uppercase tracking-wide mb-1">
                            {log.action.replace('_', ' ')}
                          </span>
                          <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">{log.details}</p>
                        </div>
                        <span className="text-[10px] text-slate-400">{formatDate(log.createdAt)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DRIVER PROFILE INFO */}
          {!isAdmin && driverData && (
            <div className="space-y-6">
              
              {/* Header metadata */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4 dark:border-zinc-800">
                <div>
                  <h3 className="text-md font-bold mb-0.5">License & Tour Status</h3>
                  <p className="text-xs text-slate-400">Professional details stored in the driver roster.</p>
                </div>
                
                <div className="flex gap-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-center dark:border-zinc-800 dark:bg-zinc-950/20">
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Roster Status</span>
                    <span className={`inline-block font-bold text-xs uppercase tracking-wide ${
                      driverData.status === 'active' ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {driverData.status}
                    </span>
                  </div>
                  
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-center dark:border-zinc-800 dark:bg-zinc-950/20">
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">License Number</span>
                    <span className="font-mono font-bold text-xs text-slate-700 dark:text-zinc-300">{driverData.licenseNumber}</span>
                  </div>
                </div>
              </div>

              {/* Financial Reconciliations Summary */}
              <div>
                <h4 className="text-sm font-bold mb-3 flex items-center gap-1.5">
                  <Award className="h-4.5 w-4.5 text-indigo-500" />
                  Financial Summary (Settled Tours)
                </h4>

                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 text-xs">
                  <div className="rounded-xl border border-slate-150 p-4 dark:border-zinc-800">
                    <span className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[8px]">Tours Dispatched</span>
                    <span className="font-bold text-lg">{totalTrips} Tours</span>
                  </div>
                  <div className="rounded-xl border border-slate-150 p-4 dark:border-zinc-800">
                    <span className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[8px]">Total Cash Advances</span>
                    <span className="font-bold text-lg text-amber-600">{formatCurrency(totalAdvances)}</span>
                  </div>
                  
                  <div className={`col-span-2 sm:col-span-1 rounded-xl border p-4 ${
                    isReimbursable 
                      ? 'border-emerald-200 bg-emerald-50/30 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/10 dark:text-emerald-400' 
                      : 'border-rose-200 bg-rose-50/30 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/10 dark:text-rose-400'
                  }`}>
                    <span className="block font-bold mb-1 uppercase tracking-wider text-[8px]">
                      {isReimbursable ? 'Total Reimbursed' : 'Returns Outstanding'}
                    </span>
                    <span className="font-bold text-lg">{formatCurrency(Math.abs(netBalance))}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Driver Tour Log (Bottom Row for Drivers) */}
      {!isAdmin && driverData && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-md font-bold mb-4 flex items-center gap-1.5">
            <Compass className="h-5 w-5 text-blue-500" />
            Trip Roster History
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Advance Cash</th>
                  <th className="px-5 py-3">Approved Bills</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-slate-450">No assigned trips history found.</td>
                  </tr>
                ) : (
                  trips.map(trip => (
                    <tr key={trip.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/20">
                      <td className="px-5 py-3 font-bold text-slate-800 dark:text-zinc-200">{trip.destination}</td>
                      <td className="px-5 py-3 font-mono text-xs">{trip.vehicleNumber}</td>
                      <td className="px-5 py-3 text-xs">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</td>
                      <td className="px-5 py-3">{formatCurrency(trip.advanceAmount)}</td>
                      <td className="px-5 py-3 text-blue-600 dark:text-blue-400">
                        {trip.settlement ? formatCurrency(trip.settlement.totalExpenses) : '-'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(trip.status)}`}>
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
