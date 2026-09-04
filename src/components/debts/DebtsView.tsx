import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { Debt, DebtType, DebtStatus } from '../../types';
import { DebtCard } from './DebtCard';
import { DebtModal } from './DebtModal';
import { RepaymentModal } from './RepaymentModal';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { getDebtRemainingAmount, getDebtStatus } from '../../services/storage';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { clsx } from 'clsx';

const formatINR = (val: number) =>
  val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type SortOption = 'newest' | 'oldest' | 'highest_amount' | 'due_date' | 'remaining';

export const DebtsView: React.FC = () => {
  const { debts, deleteDebt, deleteDebtRepayment } = useApp();

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [repaymentTarget, setRepaymentTarget] = useState<Debt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);

  // Filter & Search states
  const [typeFilter, setTypeFilter] = useState<'all' | DebtType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DebtStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Summary Metrics calculated directly from remaining amounts
  const { totalToGetRemaining, totalToGiveRemaining, netDebt, totalOutstanding } = useMemo(() => {
    let toGet = 0;
    let toGive = 0;

    debts.forEach((d) => {
      const rem = getDebtRemainingAmount(d);
      if (d.type === 'to_get') {
        toGet += rem;
      } else {
        toGive += rem;
      }
    });

    return {
      totalToGetRemaining: toGet,
      totalToGiveRemaining: toGive,
      netDebt: toGet - toGive,
      totalOutstanding: toGet + toGive,
    };
  }, [debts]);

  // Filtered & Sorted Debts
  const filteredDebts = useMemo(() => {
    return debts
      .filter((d) => {
        // Type filter
        if (typeFilter !== 'all' && d.type !== typeFilter) return false;

        // Status filter
        const currentStatus = getDebtStatus(d);
        if (statusFilter !== 'all' && currentStatus !== statusFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchPerson = d.personName.toLowerCase().includes(q);
          const matchDesc = d.description && d.description.toLowerCase().includes(q);
          const matchNotes = d.notes && d.notes.toLowerCase().includes(q);
          const matchAmount = d.amount.toString().includes(q);
          if (!matchPerson && !matchDesc && !matchNotes && !matchAmount) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'highest_amount') {
          return b.amount - a.amount;
        }
        if (sortBy === 'remaining') {
          return getDebtRemainingAmount(b) - getDebtRemainingAmount(a);
        }
        if (sortBy === 'due_date') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      });
  }, [debts, typeFilter, statusFilter, searchQuery, sortBy]);

  const handleOpenAddDebt = () => {
    setEditingDebt(null);
    setIsDebtModalOpen(true);
  };

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setIsDebtModalOpen(true);
  };

  const handleDelete = (debt: Debt) => {
    setDeleteTarget(debt);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await deleteDebt(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total To Get */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total To Get
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            ₹{formatINR(totalToGetRemaining)}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Money other people owe me</p>
        </div>

        {/* Total To Give */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-slate-900 to-rose-950/40 border border-rose-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total To Give
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
            ₹{formatINR(totalToGiveRemaining)}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Money I owe other people</p>
        </div>

        {/* Net Debt Position */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Net Debt
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div
            className={clsx(
              'text-2xl sm:text-3xl font-black font-mono',
              netDebt > 0
                ? 'text-emerald-400'
                : netDebt < 0
                ? 'text-rose-400'
                : 'text-slate-200'
            )}
          >
            {netDebt < 0 ? `-₹${formatINR(Math.abs(netDebt))}` : `₹${formatINR(netDebt)}`}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {netDebt > 0
              ? 'Net Receivable balance'
              : netDebt < 0
              ? 'Net Payable liability'
              : 'Balanced zero liability'}
          </p>
        </div>

        {/* Total Outstanding Pending */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-slate-900 to-amber-950/40 border border-amber-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Outstanding
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
            ₹{formatINR(totalOutstanding)}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Total unsettled volume</p>
        </div>
      </div>

      {/* 2. Top Action Banner & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Debt Management</h3>
            <p className="text-xs text-slate-400">
              Track receivables (money to get) and payables (money to give)
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddDebt}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer min-h-[40px]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Debt</span>
        </button>
      </div>

      {/* 3. Filter Bar (Type, Status, Search, Sort) */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
        {/* Row 1: Type Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Debt Type Filters */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-850 rounded-2xl shrink-0 overflow-x-auto">
            <button
              onClick={() => setTypeFilter('all')}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                typeFilter === 'all'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('to_get')}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                typeFilter === 'to_get'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span>💰 To Get</span>
            </button>
            <button
              onClick={() => setTypeFilter('to_give')}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                typeFilter === 'to_give'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span>💸 To Give</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by person, reason, note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl py-2 pl-9 pr-3 text-xs text-white outline-none transition-colors"
            />
          </div>
        </div>

        {/* Row 2: Status Filter & Sort Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-850">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status:
            </span>
            {(['all', 'pending', 'partially_paid', 'paid'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={clsx(
                  'px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer capitalize',
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                )}
              >
                {st === 'all'
                  ? 'All'
                  : st === 'pending'
                  ? '⏳ Pending'
                  : st === 'partially_paid'
                  ? '🟡 Partially Paid'
                  : '✅ Paid'}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest_amount">Highest Amount</option>
              <option value="remaining">Remaining Balance</option>
              <option value="due_date">Due Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Debt Cards List or Tailored Empty States */}
      {filteredDebts.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
          {typeFilter === 'to_get' ? (
            <>
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl mx-auto border border-emerald-500/20">
                💰
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-white">No money to collect</h4>
                <p className="text-xs text-slate-400">
                  You currently have no outstanding money to get from others.
                </p>
              </div>
            </>
          ) : typeFilter === 'to_give' ? (
            <>
              <div className="w-14 h-14 rounded-3xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-2xl mx-auto border border-rose-500/20">
                💸
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-white">No money to pay</h4>
                <p className="text-xs text-slate-400">
                  You currently have no outstanding money to give to others.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-2xl mx-auto border border-indigo-500/20">
                🤝
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-white">No debt records found</h4>
                <p className="text-xs text-slate-400">
                  Track money you lent to others or borrowed from friends and colleagues.
                </p>
              </div>
            </>
          )}

          <button
            onClick={handleOpenAddDebt}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Debt</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onOpenRepayment={(d) => setRepaymentTarget(d)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDeleteRepayment={deleteDebtRepayment}
            />
          ))}
        </div>
      )}

      {/* Modals & Dialogs */}
      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setEditingDebt(null);
        }}
        initialDebt={editingDebt}
      />

      <RepaymentModal
        isOpen={Boolean(repaymentTarget)}
        onClose={() => setRepaymentTarget(null)}
        debt={repaymentTarget}
      />

      <ConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Debt Record"
        message={
          deleteTarget
            ? `Are you sure you want to permanently delete the debt record for "${deleteTarget.personName}" (₹${formatINR(deleteTarget.amount)})? This action cannot be undone.`
            : 'Are you sure?'
        }
        confirmText="Delete Debt"
      />
    </div>
  );
};
