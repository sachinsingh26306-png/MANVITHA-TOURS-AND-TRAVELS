import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';
import { Clock, Landmark, MessageSquare, ClipboardCheck } from 'lucide-react';

const SettlementHistory = () => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSettlements = async () => {
    try {
      const data = await api.settlements.list();
      setSettlements(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch settlements history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settlement History</h1>
        <p className="text-sm font-medium text-slate-400 dark:text-zinc-500">
          Reconciled statement history for all outstation tour advances and travel expenses.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Settlements History List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-premium dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-500">
                <th className="px-6 py-4">Destination Route</th>
                <th className="px-6 py-4">Advance Received</th>
                <th className="px-6 py-4">Approved Claims</th>
                <th className="px-6 py-4">Difference Balance</th>
                <th className="px-6 py-4">Approval Status</th>
                <th className="px-6 py-4">Auditor Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                    <ClipboardCheck className="mx-auto h-10 w-10 stroke-1 mb-2 text-slate-350" />
                    No settlements history found. You haven't submitted any requests yet.
                  </td>
                </tr>
              ) : (
                settlements.map((s) => {
                  const isPayable = parseFloat(s.balance) >= 0;
                  return (
                    <tr 
                      key={s.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-zinc-200">
                            Bangalore to {s.trip?.destination}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Toured: {formatDate(s.trip?.startDate)} - {formatDate(s.trip?.endDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold">{formatCurrency(s.advanceAmount)}</td>
                      <td className="px-6 py-4 font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(s.totalExpenses)}</td>
                      <td className={`px-6 py-4 font-bold ${isPayable ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {formatCurrency(s.balance)}
                        <span className="block text-[8px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">
                          {isPayable ? 'Reimbursement' : 'Return Cash'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusColor(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {s.remarks ? (
                          <div className="flex items-start gap-1.5 max-w-xs text-xs text-slate-500 dark:text-zinc-400 font-medium">
                            <MessageSquare className="mt-0.5 h-3.5 w-3.5 text-slate-450 shrink-0" />
                            <p>{s.remarks}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No notes</span>
                        )}
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
  );
};

export default SettlementHistory;
