import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { getStatusColor, formatDate } from '../../utils/formatters';
import { Plus, Edit2, Trash2, X, Phone, Shield, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('active');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail view state
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchDrivers = async () => {
    try {
      const data = await api.drivers.list();
      setDrivers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch drivers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingDriver(null);
    setName('');
    setPhone('');
    setLicenseNumber('');
    setEmail('');
    setPassword('');
    setStatus('active');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setPhone(driver.phone);
    setLicenseNumber(driver.licenseNumber);
    setEmail(driver.user?.email || '');
    setPassword(''); // blank means don't change
    setStatus(driver.status);
    setFormError('');
    setModalOpen(true);
  };

  const handleViewDetails = async (driverId) => {
    try {
      const driverData = await api.drivers.get(driverId);
      setSelectedDriver(driverData);
      setDetailModalOpen(true);
    } catch (err) {
      alert('Failed to load driver profile details.');
    }
  };

  const handleDeleteDriver = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete driver "${name}"? This will also delete their login account.`)) {
      try {
        await api.drivers.delete(id);
        setDrivers(drivers.filter(d => d.id !== id));
      } catch (err) {
        alert(err.message || 'Failed to delete driver');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const payload = {
      name,
      phone,
      licenseNumber,
      email,
      password: password || undefined,
      status,
    };

    try {
      if (editingDriver) {
        const updated = await api.drivers.update(editingDriver.id, payload);
        setDrivers(drivers.map(d => (d.id === editingDriver.id ? updated : d)));
      } else {
        const created = await api.drivers.create(payload);
        setDrivers([created, ...drivers]);
      }
      setModalOpen(false);
      fetchDrivers(); // refresh list to ensure associated users load properly
    } catch (err) {
      setFormError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
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
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Driver Management</h1>
          <p className="text-sm font-medium text-slate-400 dark:text-zinc-500">
            Maintain tour driver rosters and their system access credentials.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Driver
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Drivers List Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-premium dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-500">
                <th className="px-6 py-4">Driver Details</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">License Number</th>
                <th className="px-6 py-4">Portal Login</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                    No drivers found. Add a driver to start.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr 
                    key={driver.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleViewDetails(driver.id)}
                        className="text-left font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 hover:underline"
                      >
                        {driver.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-medium">{driver.phone}</td>
                    <td className="px-6 py-4 font-mono font-medium text-xs tracking-wider">{driver.licenseNumber}</td>
                    <td className="px-6 py-4">
                      {driver.user ? (
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-slate-600 dark:text-zinc-400">{driver.user.email}</span>
                          <span className="text-[10px] text-slate-400">Role: {driver.user.role}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">No Portal Login</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wider ${getStatusColor(driver.status)}`}>
                        {driver.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEditModal(driver)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-400 transition-colors"
                          title="Edit Driver"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDriver(driver.id, driver.name)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-rose-400 transition-colors"
                          title="Delete Driver"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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

      {/* Add / Edit Driver Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingDriver ? 'Edit Driver Profile' : 'Add New Driver'}
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
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Driver Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">License Number</label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40"
                  placeholder="Enter DL Number"
                />
              </div>

              {/* Portal login details */}
              <div className="rounded-xl border border-dashed border-slate-200 p-4 dark:border-zinc-800">
                <span className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Portal Access Credentials
                </span>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40"
                      placeholder="driver@manivtha.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      {editingDriver ? 'New Password (Leave blank to keep current)' : 'Password'}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Roster Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <option value="active">Active (On Roster)</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

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
                  {submitting ? 'Submitting...' : editingDriver ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Driver Detail & Profile View Modal */}
      {detailModalOpen && selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Driver Profile Profile
              </h2>
              <button 
                onClick={() => setDetailModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Overview Card */}
            <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-slate-50 p-4 mb-6 dark:bg-zinc-950/40">
              <div className="space-y-2 text-sm">
                <div><span className="font-semibold text-slate-400">Name:</span> <span className="font-bold">{selectedDriver.name}</span></div>
                <div><span className="font-semibold text-slate-400">Phone:</span> <span className="font-semibold">{selectedDriver.phone}</span></div>
                <div><span className="font-semibold text-slate-400">License:</span> <span className="font-mono font-semibold">{selectedDriver.licenseNumber}</span></div>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-semibold text-slate-400">Portal Email:</span> <span className="font-semibold">{selectedDriver.user?.email || 'N/A'}</span></div>
                <div><span className="font-semibold text-slate-400">Status:</span> <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusColor(selectedDriver.status)}`}>{selectedDriver.status}</span></div>
              </div>
            </div>

            {/* Trip List */}
            <div>
              <h3 className="text-md font-bold mb-3 flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-indigo-500" />
                Assigned Trips History
              </h3>

              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-950/50">
                        <th className="px-4 py-3">Destination</th>
                        <th className="px-4 py-3">Vehicle</th>
                        <th className="px-4 py-3">Dates</th>
                        <th className="px-4 py-3">Advance</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {(!selectedDriver.trips || selectedDriver.trips.length === 0) ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-6 text-center text-slate-400">
                            No trips assigned to this driver yet.
                          </td>
                        </tr>
                      ) : (
                        selectedDriver.trips.map((trip) => (
                          <tr key={trip.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-800/10">
                            <td className="px-4 py-3 font-semibold">{trip.destination}</td>
                            <td className="px-4 py-3 font-mono">{trip.vehicleNumber}</td>
                            <td className="px-4 py-3 font-medium">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</td>
                            <td className="px-4 py-3 font-bold">₹{parseFloat(trip.advanceAmount).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3">
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
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-bold hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  );
};

export default Drivers;
