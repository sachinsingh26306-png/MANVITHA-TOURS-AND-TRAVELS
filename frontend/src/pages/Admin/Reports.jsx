import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { FileSpreadsheet, Printer, Users, Compass, Calendar, Search, RefreshCw } from 'lucide-react';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('driver'); // 'driver', 'trip', 'monthly'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Report Data States
  const [driverSummary, setDriverSummary] = useState([]);
  const [tripSettlements, setTripSettlements] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);

  // Search Filter State
  const [searchTerm, setSearchTerm] = useState('');

  const loadReportData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'driver') {
        const data = await api.reports.getDriverSummary();
        setDriverSummary(data);
      } else if (activeTab === 'trip') {
        const data = await api.reports.getTripSettlements();
        setTripSettlements(data);
      } else if (activeTab === 'monthly') {
        const data = await api.reports.getMonthlyTrends();
        setMonthlyTrends(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch report records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeTab]);

  // Client-Side CSV Export (Excel)
  const exportToCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `Manivtha_Tours_Travels_${activeTab}_report.csv`;

    if (activeTab === 'driver') {
      headers = ['Driver Name', 'Phone', 'DL Number', 'Status', 'Total Trips', 'Total Advances Given (INR)', 'Total Expenses Claimed (INR)', 'Outstanding Balance (INR)'];
      rows = filteredDriverSummary().map(d => [
        d.name,
        d.phone,
        d.licenseNumber,
        d.status.toUpperCase(),
        d.totalTrips,
        d.totalAdvances,
        d.totalApprovedExpenses,
        d.balance
      ]);
    } else if (activeTab === 'trip') {
      headers = ['Destination', 'Vehicle Number', 'Driver Name', 'Start Date', 'End Date', 'Advance Paid (INR)', 'Approved Claims (INR)', 'Balance Reconciled (INR)', 'Trip Status', 'Settlement Status'];
      rows = filteredTripSettlements().map(t => [
        t.destination,
        t.vehicleNumber,
        t.driverName,
        t.startDate,
        t.endDate,
        t.advanceAmount,
        t.totalApprovedExpenses,
        t.balance,
        t.status.toUpperCase(),
        t.settlementStatus.toUpperCase()
      ]);
    } else if (activeTab === 'monthly') {
      headers = ['Month-Year Period', 'Total Advances Given (INR)', 'Total Approved Expenses (INR)', 'Net Difference Balance (INR)'];
      rows = monthlyTrends.map(m => [
        m.month,
        m.advances,
        m.expenses,
        m.expenses - m.advances
      ]);
    }

    // Convert array to CSV format
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Browser Print Trigger (PDF)
  const handlePrint = () => {
    window.print();
  };

  // Search Logic
  const filteredDriverSummary = () => {
    return driverSummary.filter(d => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredTripSettlements = () => {
    return tripSettlements.filter(t => 
      t.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="space-y-8 animate-fade-in print:p-0 print:space-y-4">
      
      {/* Title block */}
      <div className="print:hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reports & Analytics</h1>
          <p className="text-sm font-medium text-slate-400 dark:text-zinc-500">
            Export monthly ledgers, driver claims, and settlement audit sheets.
          </p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 transition-colors"
          >
            <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600" />
            Export Excel (CSV)
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-slate-700 active:scale-[0.98] transition-colors dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <Printer className="h-4.5 w-4.5" />
            Print Report (PDF)
          </button>
        </div>
      </div>

      {/* Print-Only Branding Header */}
      <div className="hidden print:block border-b-2 border-slate-350 pb-4 mb-4">
        <h1 className="text-2xl font-bold">MANIVTHA TOURS & TRAVELS</h1>
        <p className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Outstation Trip Advance Expense Settlement Report
        </p>
        <div className="mt-2 text-xs font-medium text-slate-400 flex justify-between">
          <span>Date Generated: {new Date().toLocaleDateString('en-IN')}</span>
          <span className="capitalize">Report Scope: {activeTab} Summary</span>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="print:hidden flex border-b border-slate-200 dark:border-zinc-800">
        <button
          onClick={() => { setActiveTab('driver'); setSearchTerm(''); }}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
            activeTab === 'driver'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="h-4.5 w-4.5" />
          Driver Expense Summary
        </button>
        <button
          onClick={() => { setActiveTab('trip'); setSearchTerm(''); }}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
            activeTab === 'trip'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Compass className="h-4.5 w-4.5" />
          Trip Settlements Sheet
        </button>
        <button
          onClick={() => { setActiveTab('monthly'); setSearchTerm(''); }}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
            activeTab === 'monthly'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="h-4.5 w-4.5" />
          Monthly Expense Ledger
        </button>
      </div>

      {/* Filter Options */}
      {activeTab !== 'monthly' && (
        <div className="print:hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-premium dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'driver' ? "Search by driver name or DL..." : "Search destination, driver, or vehicle..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.value || e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/40"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-premium dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden print:border-0 print:shadow-none">
        
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            
            {/* TAB 1: Driver Summary Table */}
            {activeTab === 'driver' && (
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <th className="px-6 py-4">Driver Profile</th>
                    <th className="px-6 py-4">Total Tours</th>
                    <th className="px-6 py-4">Advances Given</th>
                    <th className="px-6 py-4">Approved Claims</th>
                    <th className="px-6 py-4">Difference Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                  {filteredDriverSummary().length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-400">No records found.</td>
                    </tr>
                  ) : (
                    filteredDriverSummary().map(d => {
                      const owesCompany = d.balance < 0;
                      return (
                        <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/20">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-zinc-200">{d.name}</span>
                              <span className="text-[10px] text-slate-400">{d.phone} • {d.licenseNumber}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{d.totalTrips} Trips</td>
                          <td className="px-6 py-4">{formatCurrency(d.totalAdvances)}</td>
                          <td className="px-6 py-4 text-blue-600 dark:text-blue-400">{formatCurrency(d.totalApprovedExpenses)}</td>
                          <td className={`px-6 py-4 font-bold ${owesCompany ? 'text-rose-500' : 'text-emerald-600'}`}>
                            {formatCurrency(d.balance)}
                            <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
                              {owesCompany ? 'Driver Returns' : 'Company Reimburses'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* TAB 2: Trip Settlements Sheet */}
            {activeTab === 'trip' && (
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <th className="px-6 py-4">Route & Vehicle</th>
                    <th className="px-6 py-4">Driver</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4">Advance Paid</th>
                    <th className="px-6 py-4">Approved Claims</th>
                    <th className="px-6 py-4">Balance Diff</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                  {filteredTripSettlements().length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-slate-400">No records found.</td>
                    </tr>
                  ) : (
                    filteredTripSettlements().map(t => {
                      const owesCompany = t.balance < 0;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/20">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-zinc-200">{t.destination}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{t.vehicleNumber}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{t.driverName}</td>
                          <td className="px-6 py-4 text-xs">{formatDate(t.startDate)} - {formatDate(t.endDate)}</td>
                          <td className="px-6 py-4">{formatCurrency(t.advanceAmount)}</td>
                          <td className="px-6 py-4 text-blue-600 dark:text-blue-400">{formatCurrency(t.totalApprovedExpenses)}</td>
                          <td className={`px-6 py-4 font-bold ${owesCompany ? 'text-rose-500' : 'text-emerald-600'}`}>
                            {formatCurrency(t.balance)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* TAB 3: Monthly Expense Ledger */}
            {activeTab === 'monthly' && (
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <th className="px-6 py-4">Billing Period</th>
                    <th className="px-6 py-4">Total Cash Advances</th>
                    <th className="px-6 py-4">Total Reconciled Claims</th>
                    <th className="px-6 py-4">Net Budget Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
                  {monthlyTrends.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-400">No monthly records found.</td>
                    </tr>
                  ) : (
                    monthlyTrends.map(m => {
                      const netDiff = m.expenses - m.advances;
                      return (
                        <tr key={m.month} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/20">
                          <td className="px-6 py-4 font-bold">{m.month}</td>
                          <td className="px-6 py-4">{formatCurrency(m.advances)}</td>
                          <td className="px-6 py-4 text-blue-600 dark:text-blue-400">{formatCurrency(m.expenses)}</td>
                          <td className={`px-6 py-4 font-bold ${netDiff < 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {formatCurrency(netDiff)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

          </div>
        )}
      </div>

    </div>
  );
};

export default Reports;
