import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';
import { Compass, Calendar, ChevronRight, HelpCircle, MapPin } from 'lucide-react';

const TripsList = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchDriverTrips = async () => {
    try {
      const data = await api.trips.list(statusFilter);
      setTrips(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch assigned trips.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverTrips();
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Assigned Trips</h1>
          <p className="text-sm font-medium text-slate-400 dark:text-zinc-500">
            View details, log expenses, and submit settlement logs for outstation tours.
          </p>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <option value="">All Statuses</option>
          <option value="pending">Upcoming Trips</option>
          <option value="active">Active (On Trip)</option>
          <option value="completed">Completed Tours</option>
          <option value="settled">Reconciled & Settled</option>
        </select>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Trips Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {trips.length === 0 ? (
          <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm font-medium text-slate-400 dark:border-zinc-800">
            No assigned trips found in this category.
          </div>
        ) : (
          trips.map(trip => (
            <div 
              key={trip.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-premium hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-850">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-zinc-100">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span>To {trip.destination}</span>
                  </div>
                  <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Vehicle Number</span>
                    <span className="font-mono text-slate-850 dark:text-zinc-200">{trip.vehicleNumber}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Advance Received</span>
                    <span className="text-slate-850 dark:text-zinc-200">{formatCurrency(trip.advanceAmount)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Itinerary Dates</span>
                    <span className="flex items-center gap-1 text-slate-850 dark:text-zinc-200">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(trip.startDate)} to {formatDate(trip.endDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Link
                  to={`/driver/trips/${trip.id}`}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-blue-500 transition-all"
                >
                  Manage Trip console
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default TripsList;
