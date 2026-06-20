import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency, formatDate, getStatusColor, capitalize } from '../../utils/formatters';
import { 
  ArrowLeft, 
  MapPin, 
  Plus, 
  Upload, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  DollarSign, 
  X, 
  Compass,
  ArrowRightLeft
} from 'lucide-react';

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Expense Form State
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [category, setCategory] = useState('fuel');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  
  const [formError, setFormError] = useState('');
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [submittingSettlement, setSubmittingSettlement] = useState(false);

  // Settlement Preview Statuses
  const [settlementObj, setSettlementObj] = useState(null);

  const fetchTripDetails = async () => {
    try {
      const data = await api.trips.get(id);
      setTrip(data);
      if (data.settlement) {
        setSettlementObj(data.settlement);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch trip details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  // Handler for Start Trip
  const handleStartTrip = async () => {
    try {
      await api.trips.updateStatus(id, 'active');
      fetchTripDetails();
    } catch (err) {
      alert(err.message || 'Failed to start trip');
    }
  };

  // Image Selection Handler (for local preview)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  // Handler to submit Expense claim
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmittingExpense(true);

    if (!amount || parseFloat(amount) <= 0) {
      setFormError('Please enter a valid amount');
      setSubmittingExpense(false);
      return;
    }

    const formData = new FormData();
    formData.append('tripId', id);
    formData.append('category', category);
    formData.append('amount', amount);
    formData.append('date', date || new Date().toISOString().split('T')[0]);
    formData.append('description', description);
    if (receiptFile) {
      formData.append('receipt', receiptFile);
    }

    try {
      await api.expenses.create(formData);
      setAddExpenseOpen(false);
      
      // Reset Form fields
      setCategory('fuel');
      setAmount('');
      setDate('');
      setDescription('');
      setReceiptFile(null);
      setReceiptPreview('');

      // Refresh Trip details
      fetchTripDetails();
    } catch (err) {
      setFormError(err.message || 'Failed to register expense claim');
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Handler to Delete expense if pending
  const handleDeleteExpense = async (expId) => {
    if (window.confirm('Delete this expense claim?')) {
      try {
        await api.expenses.delete(expId);
        fetchTripDetails();
      } catch (err) {
        alert(err.message || 'Failed to delete expense claim');
      }
    }
  };

  // Handler to Submit Settlement request
  const handleSubmitSettlement = async () => {
    if (window.confirm('Are you sure you want to submit the settlement request? This will lock all current approved expenses and await Admin review.')) {
      setSubmittingSettlement(true);
      try {
        const data = await api.settlements.submit(id);
        setSettlementObj(data);
        fetchTripDetails();
      } catch (err) {
        alert(err.message || 'Failed to submit settlement request');
      } finally {
        setSubmittingSettlement(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Link to="/driver" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
          {error || 'Trip not found.'}
        </div>
      </div>
    );
  }

  // Calculate local expense totals
  const allExpenses = trip.expenses || [];
  const approvedExpenses = allExpenses.filter(e => e.status === 'approved');
  const pendingExpenses = allExpenses.filter(e => e.status === 'pending');
  const rejectedExpenses = allExpenses.filter(e => e.status === 'rejected');

  const approvedTotal = approvedExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const pendingTotal = pendingExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const advanceAmount = parseFloat(trip.advanceAmount);
  
  // balance = Approved Expenses - Advance Given
  const balance = approvedTotal - advanceAmount;
  const isPayable = balance >= 0;
  const absBalance = Math.abs(balance);

  return (
    <>
      <div className="space-y-8 animate-fade-in">
      
      {/* Back Button & Trip Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link to="/driver" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 hover:text-slate-650">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <Compass className="h-7 w-7 text-blue-500" />
            Trip to {trip.destination}
          </h1>
        </div>

        {/* Start Trip Action (Pending -> Active) */}
        {trip.status === 'pending' && (
          <button
            onClick={handleStartTrip}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            Start Outstation Trip
          </button>
        )}

        {/* Submit Settlement Action (Active/Completed & not settled yet) */}
        {['active', 'completed'].includes(trip.status) && (!settlementObj || settlementObj.status !== 'approved') && (
          <button
            disabled={submittingSettlement}
            onClick={handleSubmitSettlement}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-605 bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 transition-all active:scale-[0.98]"
          >
            <ArrowRightLeft className="h-4.5 w-4.5" />
            Submit Settlement Request
          </button>
        )}
      </div>

      {/* Main Details and Financial Summary Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Info Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-premium dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <h2 className="text-md font-bold mb-4 border-b border-slate-100 pb-2 dark:border-zinc-800">Trip Details</h2>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <span className="block text-xs font-semibold text-slate-400">Assigned Vehicle Number</span>
              <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">{trip.vehicleNumber}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400">Trip Status</span>
              <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-bold uppercase tracking-wider mt-1 ${getStatusColor(trip.status)}`}>
                {trip.status}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400">Start Date</span>
              <span className="font-semibold text-slate-700 dark:text-zinc-300">{formatDate(trip.startDate)}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400">Return Date</span>
              <span className="font-semibold text-slate-700 dark:text-zinc-300">{formatDate(trip.endDate)}</span>
            </div>
          </div>
        </div>

        {/* Live Reconciled Financials Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-premium dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-md font-bold mb-4 border-b border-slate-100 pb-2 dark:border-zinc-800">Financial Ledger</h2>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-400">Advance Given:</span>
              <span className="text-slate-700 dark:text-zinc-200">{formatCurrency(advanceAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-slate-400">Approved Expenses:</span>
              <span className="text-emerald-600">{formatCurrency(approvedTotal)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-slate-400">Pending Approvals:</span>
              <span className="text-amber-500">{formatCurrency(pendingTotal)}</span>
            </div>

            <div className="border-t border-slate-100 pt-3 dark:border-zinc-800">
              {isPayable ? (
                <div className="rounded-xl bg-emerald-50/50 border border-emerald-200 p-3 text-center dark:bg-emerald-950/10 dark:border-emerald-900/40">
                  <span className="block text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                    Company Pays Driver (Payable)
                  </span>
                  <span className="text-lg font-bold text-emerald-800 dark:text-emerald-400">{formatCurrency(absBalance)}</span>
                </div>
              ) : (
                <div className="rounded-xl bg-rose-50/50 border border-rose-200 p-3 text-center dark:bg-rose-950/10 dark:border-rose-900/40">
                  <span className="block text-[9px] uppercase font-bold text-rose-700 dark:text-rose-400 mb-0.5">
                    Driver Returns Difference (Recoverable)
                  </span>
                  <span className="text-lg font-bold text-rose-800 dark:text-rose-400">{formatCurrency(absBalance)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Settlements Status Block if submitted */}
      {settlementObj && (
        <div className={`rounded-2xl border p-5 shadow-premium ${
          settlementObj.status === 'approved'
            ? 'border-purple-200 bg-purple-50/20 dark:border-purple-900/40 dark:bg-purple-950/5'
            : settlementObj.status === 'rejected'
            ? 'border-rose-200 bg-rose-50/20 dark:border-rose-900/40 dark:bg-rose-950/5'
            : 'border-amber-200 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/5'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5">
              {settlementObj.status === 'approved' ? (
                <CheckCircle className="h-5 w-5 text-purple-500" />
              ) : settlementObj.status === 'rejected' ? (
                <AlertCircle className="h-5 w-5 text-rose-500" />
              ) : (
                <Clock className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold capitalize">
                Settlement Status: {settlementObj.status}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {settlementObj.status === 'approved'
                  ? 'Your settlement was approved and this trip account is now closed.'
                  : settlementObj.status === 'rejected'
                  ? `Your settlement request was rejected. Notes: "${settlementObj.remarks || 'Please check and revise claims.'}"`
                  : 'Your settlement request is currently undergoing audit by administrative staff.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Log Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-zinc-800">
          <h2 className="text-lg font-bold">Trip Expenses Claims Log</h2>
          
          {/* Add Expense Trigger */}
          {['active', 'pending'].includes(trip.status) && (
            <button
              onClick={() => { setFormError(''); setAddExpenseOpen(true); }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          )}
        </div>

        {/* Expenses List Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-premium dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-500">
                  <th className="px-6 py-4">Expense Category</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Receipt Bill</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {allExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                      No expenses logged yet. Add your first expense above.
                    </td>
                  </tr>
                ) : (
                  allExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-zinc-200">
                        {capitalize(expense.category)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400">{formatDate(expense.date)}</td>
                      <td className="px-6 py-4 font-bold text-slate-850 dark:text-zinc-100">{formatCurrency(expense.amount)}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-zinc-400">{expense.description || '-'}</td>
                      <td className="px-6 py-4">
                        {expense.receiptUrl ? (
                          <a
                            href={expense.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            View Receipt
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">No Image</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusColor(expense.status)}`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {expense.status === 'pending' && trip.status !== 'settled' ? (
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-zinc-800 transition-colors"
                            title="Delete Expense Claim"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* End of animate-fade-in wrapper */}
      </div>

      {/* Add Expense Modal Drawer */}
      {addExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-fade-in">
            
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <DollarSign className="h-5.5 w-5.5 text-blue-500" />
                Log Trip Expense
              </h2>
              <button 
                onClick={() => setAddExpenseOpen(false)}
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

            <form onSubmit={handleAddExpense} className="space-y-4">
              
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <option value="fuel">Fuel (Diesel/Petrol)</option>
                    <option value="toll">Toll Charges</option>
                    <option value="food">Food / Meals</option>
                    <option value="parking">Parking Fees</option>
                    <option value="accommodation">Accommodation</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </select>
                </div>
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Expense Amount (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40"
                  placeholder="e.g. 1200.50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40"
                  placeholder="e.g. Toll taxes paid on NH48"
                />
              </div>

              {/* File Upload with Preview */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">Upload Receipt Bill</label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 dark:border-zinc-800">
                  
                  {receiptPreview ? (
                    <div className="relative w-full max-h-40 flex justify-center overflow-hidden rounded-lg bg-slate-50 p-2 dark:bg-zinc-950">
                      <img 
                        src={receiptPreview} 
                        alt="Local Preview" 
                        className="max-h-36 w-auto object-contain rounded-md" 
                      />
                      <button
                        type="button"
                        onClick={() => { setReceiptFile(null); setReceiptPreview(''); }}
                        className="absolute top-1 right-1 rounded-full bg-slate-800/80 p-1 text-white hover:bg-slate-900"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer text-slate-400 dark:text-zinc-500 hover:text-blue-500 transition-colors">
                      <Upload className="h-8 w-8 stroke-1 mb-2" />
                      <span className="text-xs font-bold">Choose Receipt Image</span>
                      <span className="text-[10px] text-slate-400 mt-1">JPG, PNG, WEBP up to 5MB</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </label>
                  )}

                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAddExpenseOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submittingExpense ? 'Logging Claim...' : 'Add Expense'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </>
  );
};

export default TripDetails;
