import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate, formatCurrency, getStatusColor } from '../../utils/formatters';
import { Check, X, ShieldAlert, Award, FileText, ArrowRightLeft, XCircle, Landmark, RefreshCw } from 'lucide-react';

const Settlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected Settlement for Detail View & Processing
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchSettlements = async () => {
    try {
      const data = await api.settlements.list();
      setSettlements(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleOpenProcessModal = (settlement) => {
    setSelectedSettlement(settlement);
    setRemarks(settlement.remarks || '');
    setDetailModalOpen(true);
  };

  const handleProcessSettlement = async (status) => {
    setProcessing(true);
    try {
      await api.settlements.updateStatus(selectedSettlement.id, status, remarks);
      setDetailModalOpen(false);
      fetchSettlements();
    } catch (err) {
      alert(err.message || 'Failed to process settlement');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Filter list to separate pending and completed settlements
  const pendingRequests = settlements.filter(s => s.status === 'pending');
  const settledHistory = settlements.filter(s => s.status !== 'pending');

  return (
    <>
      <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settlement Management</h1>
          <p className="text-sm font-medium text-slate-400 dark:text-zinc-500">
            Audit trip expense ledger balances, reconcile outstation cash advances, and close trip accounts.
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchSettlements(); }}
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

      {/* Grid: Pending Actions and Reconciled History */}
      <div className="space-y-8">
        
        {/* SECTION 1: Pending Settlement Requests */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-5 w-5" />
            Pending Settlement Requests ({pendingRequests.length})
          </h2>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-medium text-slate-400 dark:border-zinc-800">
                No pending settlement requests awaiting review.
              </div>
            ) : (
              pendingRequests.map((settlement) => {
                const isPayable = parseFloat(settlement.balance) >= 0;
                const balanceAmt = Math.abs(parseFloat(settlement.balance));
                return (
                  <div 
                    key={settlement.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-premium hover:shadow-lg transition-all dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div>
                      {/* Driver & Route Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800/60">
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-zinc-100">{settlement.trip?.driver?.name}</h3>
                          <span className="text-xs font-medium text-slate-400">Route: To {settlement.trip?.destination}</span>
                        </div>
                        <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-200/50 uppercase dark:bg-amber-950/20 dark:text-amber-400">
                          Awaiting Audit
                        </span>
                      </div>

                      {/* Ledger Summary */}
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="block text-slate-400 font-semibold mb-0.5">Advance Given:</span>
                          <span className="font-bold">{formatCurrency(settlement.advanceAmount)}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-semibold mb-0.5">Approved Bills:</span>
                          <span className="font-bold">{formatCurrency(settlement.totalExpenses)}</span>
                        </div>
                      </div>

                      {/* Net Reconciliation Balance Display */}
                      <div className={`mt-4 rounded-xl p-3 border text-center ${
                        isPayable 
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/10 dark:border-emerald-900/40 dark:text-emerald-400' 
                          : 'bg-rose-50/50 border-rose-200 text-rose-800 dark:bg-rose-950/10 dark:border-rose-900/40 dark:text-rose-400'
                      }`}>
                        <span className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                          {isPayable ? 'Company Pays Driver (Payable)' : 'Driver Returns Cash (Recoverable)'}
                        </span>
                        <span className="text-lg font-bold tracking-tight">{formatCurrency(balanceAmt)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenProcessModal(settlement)}
                      className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700 active:scale-[0.98] transition-all dark:bg-zinc-800 dark:hover:bg-zinc-750"
                    >
                      <FileText className="h-4 w-4" />
                      Review & Reconcile
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION 2: Settled History */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-500" />
            Settled Trips History ({settledHistory.length})
          </h2>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-premium dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-500">
                    <th className="px-6 py-4">Driver & Destination</th>
                    <th className="px-6 py-4">Advance</th>
                    <th className="px-6 py-4">Approved Bills</th>
                    <th className="px-6 py-4">Difference Balance</th>
                    <th className="px-6 py-4">Reconciled Status</th>
                    <th className="px-6 py-4">Verification Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {settledHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                        No settled trips history found.
                      </td>
                    </tr>
                  ) : (
                    settledHistory.map((s) => {
                      const isPayable = parseFloat(s.balance) >= 0;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                          <td className="px-6 py-4 font-bold">
                            <div className="flex flex-col">
                              <span>{s.trip?.driver?.name}</span>
                              <span className="text-xs font-medium text-slate-400">To {s.trip?.destination}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium">{formatCurrency(s.advanceAmount)}</td>
                          <td className="px-6 py-4 font-medium">{formatCurrency(s.totalExpenses)}</td>
                          <td className={`px-6 py-4 font-bold ${isPayable ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {formatCurrency(s.balance)}
                            <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">
                              {isPayable ? 'Company Pays' : 'Driver Returns'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wider ${getStatusColor(s.status)}`}>
                              {s.status === 'approved' ? 'Settled & Closed' : 'Rejected'}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate text-xs font-medium text-slate-500 dark:text-zinc-400">
                            {s.remarks || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
      {/* End of animate-fade-in wrapper */}
      </div>

      {/* Review Details & Processing Modal */}
      {detailModalOpen && selectedSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-fade-in max-h-[90vh] overflow-y-auto">
            
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-zinc-800">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ArrowRightLeft className="h-5.5 w-5.5 text-blue-500" />
                  Trip Settlement Audit
                </h2>
                <p className="text-xs text-slate-400">
                  Driver: {selectedSettlement.trip?.driver?.name} • Destination: {selectedSettlement.trip?.destination}
                </p>
              </div>
              <button 
                onClick={() => setDetailModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Financial Ledger Panel */}
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/20">
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Advance Disbursed</span>
                <span className="text-lg font-bold">{formatCurrency(selectedSettlement.advanceAmount)}</span>
              </div>
              
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/20">
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Approved Claims</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(selectedSettlement.totalExpenses)}</span>
              </div>

              {/* Net Balance */}
              <div className={`rounded-xl border p-4 ${
                parseFloat(selectedSettlement.balance) >= 0
                  ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/10 dark:text-emerald-400'
                  : 'border-rose-200 bg-rose-50/50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/10 dark:text-rose-400'
              }`}>
                <span className="block text-[10px] uppercase font-bold mb-1">
                  {parseFloat(selectedSettlement.balance) >= 0 ? 'Payable to Driver' : 'Recoverable (Return)'}
                </span>
                <span className="text-lg font-bold">{formatCurrency(Math.abs(parseFloat(selectedSettlement.balance)))}</span>
              </div>
            </div>

            {/* Remarks Input */}
            <div className="space-y-2 mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Auditor Remarks / Reconcile Notes
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 min-h-[100px] resize-none"
                placeholder="Add audit notes, details about bank payouts or return collections, or reason for rejection..."
              />
            </div>

            {/* Verification Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end border-t border-slate-100 pt-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-850"
              >
                Close Audit
              </button>
              
              <button
                disabled={processing}
                onClick={() => handleProcessSettlement('rejected')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject Settlement
              </button>

              <button
                disabled={processing}
                onClick={() => handleProcessSettlement('approved')}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-600/10 transition-colors disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Approve & Close Trip
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  );
};

export default Settlements;
