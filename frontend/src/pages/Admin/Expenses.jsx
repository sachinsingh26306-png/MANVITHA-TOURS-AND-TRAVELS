import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate, formatCurrency, capitalize } from '../../utils/formatters';
import { supabase } from '../../utils/supabase';
import { Eye, Check, X, FileImage, ClipboardList, RefreshCw } from 'lucide-react';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Image preview state
  const [previewExpense, setPreviewExpense] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [actioningId, setActioningId] = useState(null);

  const fetchPendingExpenses = async () => {
    try {
      const data = await api.expenses.listPending();
      setExpenses(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pending expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingExpenses();
    
    // Set up Realtime subscription if Supabase is configured
    if (supabase) {
      const expenseSubscription = supabase
        .channel('public:Expenses')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Expenses' }, (payload) => {
          // A new expense was added, fetch the latest to get full relations (Driver, Trip)
          // Or just show a toast, but refetching is safest to get joined data
          fetchPendingExpenses();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(expenseSubscription);
      };
    }
  }, []);

  const handleOpenPreview = (expense) => {
    setPreviewExpense(expense);
    setPreviewOpen(true);
  };

  const handleVerifyExpense = async (id, status) => {
    setActioningId(id);
    try {
      await api.expenses.updateStatus(id, status);
      setExpenses(expenses.filter(e => e.id !== id));
      if (previewExpense?.id === id) {
        setPreviewOpen(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to update expense status');
    } finally {
      setActioningId(null);
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
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Expense Verification</h1>
          <p className="text-sm font-medium text-slate-400 dark:text-zinc-500">
            Verify driver claims, inspect receipt images, and approve travel costs.
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchPendingExpenses(); }}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh List
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Main List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-premium dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-500">
                <th className="px-6 py-4">Driver & Destination</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Claim Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Receipt</th>
                <th className="px-6 py-4">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <ClipboardList className="mx-auto h-10 w-10 stroke-1 mb-3 text-slate-300 dark:text-zinc-700" />
                    All driver expenses verified! No pending items.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr 
                    key={expense.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                  >
                    {/* Driver Name & Trip Destination */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-zinc-200">
                          {expense.trip?.driver?.name || 'Unknown Driver'}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          To {expense.trip?.destination || 'N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {capitalize(expense.category)}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 font-medium text-slate-500 dark:text-zinc-400">
                      {formatDate(expense.date)}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-zinc-100">
                      {formatCurrency(expense.amount)}
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4 max-w-xs truncate text-xs font-medium text-slate-500 dark:text-zinc-400">
                      {expense.description || 'No description provided'}
                    </td>

                    {/* Receipt Preview */}
                    <td className="px-6 py-4">
                      {expense.receiptUrl ? (
                        <button
                          onClick={() => handleOpenPreview(expense)}
                          className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/50 px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400 transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Receipt
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <FileImage className="h-3.5 w-3.5 text-slate-300" />
                          No Bill
                        </span>
                      )}
                    </td>

                    {/* Verification Action Buttons */}
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          disabled={actioningId === expense.id}
                          onClick={() => handleVerifyExpense(expense.id, 'approved')}
                          className="rounded-xl bg-emerald-600 p-2 text-white hover:bg-emerald-700 active:scale-[0.95] disabled:opacity-50 transition-all shadow-md shadow-emerald-600/10"
                          title="Approve Expense"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          disabled={actioningId === expense.id}
                          onClick={() => handleVerifyExpense(expense.id, 'rejected')}
                          className="rounded-xl bg-rose-600 p-2 text-white hover:bg-rose-700 active:scale-[0.95] disabled:opacity-50 transition-all shadow-md shadow-rose-600/10"
                          title="Reject Expense"
                        >
                          <X className="h-4 w-4" />
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

      {/* Receipt Image Preview Dialog */}
      {previewOpen && previewExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-fade-in">
            
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Receipt Audit</h3>
                <p className="text-xs text-slate-400">
                  {previewExpense.trip?.driver?.name} • {capitalize(previewExpense.category)} • {formatCurrency(previewExpense.amount)}
                </p>
              </div>
              <button 
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt Image Container */}
            <div className="flex max-h-96 items-center justify-center rounded-xl bg-slate-100 p-4 dark:bg-zinc-950 border border-slate-200/50 dark:border-zinc-800 overflow-hidden">
              <img
                src={previewExpense.receiptUrl}
                alt="Receipt upload"
                className="max-h-80 w-auto max-w-full rounded-lg object-contain shadow-sm"
              />
            </div>

            {/* Description Display */}
            {previewExpense.description && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-500 dark:bg-zinc-950/40 dark:text-zinc-400">
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Driver Description:</span>
                {previewExpense.description}
              </div>
            )}

            {/* Quick Actions Footer inside Modal */}
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-zinc-800">
              <button
                disabled={actioningId === previewExpense.id}
                onClick={() => handleVerifyExpense(previewExpense.id, 'rejected')}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-950/20 dark:text-rose-400 transition-colors"
              >
                Reject Bill
              </button>
              <button
                disabled={actioningId === previewExpense.id}
                onClick={() => handleVerifyExpense(previewExpense.id, 'approved')}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
              >
                Approve Bill
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  );
};

export default Expenses;
