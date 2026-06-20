import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';
import { Compass, Landmark, Receipt, HelpCircle, FileText, ChevronRight, MapPin } from 'lucide-react';

const DriverDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDriverDashboard = async () => {
    try {
      const data = await api.trips.list();
      setTrips(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch assigned tours');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Filter trips
  const activeTrip = trips.find(t => t.status === 'active');
  const pendingTrips = trips.filter(t => t.status === 'pending');
  const pastTrips = trips.filter(t => ['completed', 'settled'].includes(t.status));

  // Compute metrics for driver cards
  const totalAdvances = trips.reduce((sum, t) => sum + parseFloat(t.advanceAmount), 0);
  const totalSettlementsCount = trips.filter(t => t.status === 'settled').length;

  const summaryCards = [
    {
      title: 'Total Tours Assigned',
      value: trips.length,
      icon: Compass,
      color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30'
    },
    {
      title: 'Total Cash Advance Given',
      value: formatCurrency(totalAdvances),
      icon: Landmark,
      color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30'
    },
    {
      title: 'Settled Tours',
      value: totalSettlementsCount,
      icon: Receipt,
      color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Driver Portal</h1>
        <p className="text-sm font-medium text-slate-400 dark:text-zinc-500">
          Track cash advances, upload receipts, and check settlement statuses.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {summaryCards.map((card) => {
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
                <span className="text-xl font-bold tracking-tight md:text-2xl">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 1: Ongoing Trip */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Current Ongoing Trip</h2>
        
        {activeTrip ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/20 p-6 dark:border-blue-900/40 dark:bg-blue-950/5 shadow-premium card-interactive">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-lg">
                  <MapPin className="h-5 w-5" />
                  Route: Bangalore to {activeTrip.destination}
                </div>
                <div className="grid gap-x-6 gap-y-1 text-xs font-semibold text-slate-500 dark:text-zinc-400 sm:grid-cols-2">
                  <div>Vehicle Number: <span className="font-mono text-slate-700 dark:text-zinc-200">{activeTrip.vehicleNumber}</span></div>
                  <div>Cash Advance: <span className="text-slate-700 dark:text-zinc-200">{formatCurrency(activeTrip.advanceAmount)}</span></div>
                  <div>Departure Date: <span className="text-slate-700 dark:text-zinc-200">{formatDate(activeTrip.startDate)}</span></div>
                  <div>Planned Return: <span className="text-slate-700 dark:text-zinc-200">{formatDate(activeTrip.endDate)}</span></div>
                </div>
              </div>

              <Link
                to={`/driver/trips/${activeTrip.id}`}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 btn-interactive transition-all"
              >
                Log Expenses & Settle
                <ChevronRight className="h-4.5 w-4.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm font-medium text-slate-400 dark:border-zinc-800 dark:bg-zinc-900">
            No active trip right now. You are currently off-duty.
          </div>
        )}
      </div>

      {/* Grid: Pending Trips & Trip History */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Pending/Upcoming Trips */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium card-interactive dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-bold mb-4">Upcoming Trips ({pendingTrips.length})</h2>
          
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {pendingTrips.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">No upcoming assigned trips.</div>
            ) : (
              pendingTrips.map(trip => (
                <div 
                  key={trip.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-zinc-800"
                >
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Destination: {trip.destination}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Starts: {formatDate(trip.startDate)} • Vehicle: {trip.vehicleNumber}
                    </p>
                  </div>
                  <Link
                    to={`/driver/trips/${trip.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-650 hover:bg-blue-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-blue-500 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Past Trips / Settlements History */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium card-interactive dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-bold mb-4">Recent Past Trips ({pastTrips.length})</h2>

          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {pastTrips.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">No past trip records.</div>
            ) : (
              pastTrips.map(trip => (
                <div 
                  key={trip.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-zinc-800"
                >
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">To {trip.destination}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Ended: {formatDate(trip.endDate)} • Advance: {formatCurrency(trip.advanceAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                    <Link
                      to={`/driver/trips/${trip.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-650 hover:bg-blue-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-blue-500 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default DriverDashboard;
