import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { getStatusColor, formatDate, formatCurrency } from '../../utils/formatters';
import { Plus, Edit2, Compass, Calendar, Truck, Landmark, User, X, Search, Filter } from 'lucide-react';

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);

  // Form Fields
  const [driverId, setDriverId] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [status, setStatus] = useState('pending');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTrips = async () => {
    try {
      const data = await api.trips.list(statusFilter, searchTerm);
      setTrips(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch trips list');
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await api.drivers.list();
      // Only assignable active drivers (or the driver currently assigned to editing trip)
      setDrivers(data.filter(d => d.status === 'active'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchTrips(), fetchDrivers()]);
      setLoading(false);
    };
    initData();
  }, [statusFilter]); // Re-fetch on status change

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTrips();
  };

  const handleOpenAddModal = () => {
    setEditingTrip(null);
    setDriverId(drivers[0]?.id || '');
    setOrigin('');
    setDestination('');
    setStartDate('');
    setEndDate('');
    setVehicleNumber('');
    setAdvanceAmount('');
    setStatus('pending');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (trip) => {
    setEditingTrip(trip);
    setDriverId(trip.driverId);
    setOrigin(trip.origin || '');
    setDestination(trip.destination);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setVehicleNumber(trip.vehicleNumber);
    setAdvanceAmount(trip.advanceAmount);
    setStatus(trip.status);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const payload = {
      driverId,
      origin,
      destination,
      startDate,
      endDate,
      vehicleNumber,
      advanceAmount: parseFloat(advanceAmount) || 0,
      status
    };

    try {
      if (editingTrip) {
        await api.trips.update(editingTrip.id, payload);
      } else {
        await api.trips.create(payload);
      }
      setModalOpen(false);
      fetchTrips();
    } catch (err) {
      setFormError(err.message || 'Failed to submit trip configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChangeDirect = async (tripId, newStatus) => {
    try {
      await api.trips.updateStatus(tripId, newStatus);
      fetchTrips();
    } catch (err) {
      alert(err.message || 'Failed to update trip status');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Trip Management</h1>
          <p className="text-sm font-medium text-slate-400 dark:text-zinc-500">
            Dispatch vehicles, assign drivers, and manage outstation advances.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          Assign New Trip
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-premium dark:border-zinc-800 dark:bg-zinc-900">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search destination or vehicle number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:bg-zinc-800"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
              <Filter className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Status:</span>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending/Upcoming</option>
              <option value="active">Active (On Trip)</option>
              <option value="completed">Completed</option>
              <option value="settled">Settled</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Trips Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-premium dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-500">
                <th className="px-6 py-4">Origin</th>
                <th className="px-6 py-4">Destination</th>
                <th className="px-6 py-4">Assigned Driver</th>
                <th className="px-6 py-4">Vehicle No</th>
                <th className="px-6 py-4">Trip Dates</th>
                <th className="px-6 py-4">Advance Given</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {trips.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                    No trips found matching criteria.
                  </td>
                </tr>
              ) : (
                trips.map((trip) => (
                  <tr 
                    key={trip.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-zinc-200">{trip.origin || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-zinc-200">{trip.destination}</td>
                    <td className="px-6 py-4 font-medium">{trip.driver?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold tracking-wider text-slate-600 dark:text-zinc-400">{trip.vehicleNumber}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-zinc-200">{formatCurrency(trip.advanceAmount)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wider ${getStatusColor(trip.status)}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {trip.status !== 'settled' && (
                          <button
                            onClick={() => handleOpenEditModal(trip)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-400 transition-colors"
                            title="Edit Trip Settings"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {/* Direct status transitions for Admin convenience */}
                        {trip.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChangeDirect(trip.id, 'active')}
                            className="rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 transition-colors"
                          >
                            Start Trip
                          </button>
                        )}
                        {trip.status === 'active' && (
                          <button
                            onClick={() => handleStatusChangeDirect(trip.id, 'completed')}
                            className="rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* End of animate-fade-in wrapper */}
      </div>

      {/* Add / Edit Trip Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-fade-in">
            
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Compass className="h-5.5 w-5.5 text-blue-500" />
                {editingTrip ? 'Modify Trip Details' : 'Dispatch / Assign New Trip'}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Driver Dropdown */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Select Driver
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <select
                    required
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800"
                  >
                    {drivers.length === 0 ? (
                      <option value="">No Active Drivers Available</option>
                    ) : (
                      drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Origin & Destination */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">From Place (Origin)</label>
                  <input
                    type="text"
                    required
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:bg-zinc-800"
                    placeholder="e.g. Mumbai, Delhi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">To Place (Destination)</label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:bg-zinc-800"
                    placeholder="e.g. Goa, Hyderabad"
                  />
                </div>
              </div>

              {/* Vehicle & Advance */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Vehicle Number</label>
                  <div className="relative">
                    <Truck className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-mono outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:bg-zinc-800"
                      placeholder="KA-01-XX-9999"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Advance Payment (INR)</label>
                  <div className="relative">
                    <Landmark className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      required
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:bg-zinc-800"
                      placeholder="e.g. 15000"
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800"
                    />
                  </div>
                </div>
              </div>

              {editingTrip && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Trip Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active (On Trip)</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : editingTrip ? 'Save Changes' : 'Assign Advance'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </>
  );
};

export default Trips;
