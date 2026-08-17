import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { ExpenseTransaction, ExpenseType } from '../types';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { clsx } from 'clsx';

export const ExpensesView: React.FC = () => {
  const { expenses, deleteExpense } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseTransaction | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<'all' | ExpenseType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // YYYY-MM or 'all'

  // Extract unique categories and available months for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => set.add(e.category));
    return Array.from(set).sort();
  }, [expenses]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.date) {
        set.add(e.date.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(set).sort().reverse();
  }, [expenses]);

  // Overall Totals
  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    expenses.forEach((e) => {
      if (e.type === 'income') {
        inc += e.amount;
      } else {
        exp += e.amount;
      }
    });
    return {
      totalIncome: inc,
      totalExpenses: exp,
      balance: inc - exp,
    };
  }, [expenses]);

  // Filtered Transactions
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // Type Filter
      if (filterType !== 'all' && item.type !== filterType) return false;

      // Category Filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // Month Filter
      if (selectedMonth !== 'all' && !item.date.startsWith(selectedMonth)) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        const matchNote = item.note && item.note.toLowerCase().includes(q);
        const matchAmount = item.amount.toString().includes(q);
        if (!matchTitle && !matchCategory && !matchNote && !matchAmount) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filterType, selectedCategory, selectedMonth, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense: ExpenseTransaction) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (expense: ExpenseTransaction) => {
    setDeleteTarget(expense);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Title & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                Expenses & Financial Tracker
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your transactions, analyze cash flow, and maintain financial discipline.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-emerald-500/20 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Total Income
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 inline" /> Total credited earnings
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-rose-500/20 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400 inline" /> Total spent outlays
            </p>
          </div>
        </div>

        {/* Net Balance */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-indigo-500/20 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Net Balance
            </span>
            <div className={`p-2 rounded-xl ${balance >= 0 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-2xl sm:text-3xl font-black tracking-tight ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {balance < 0 ? '-' : ''}${Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Income minus total expenses
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              )}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                filterType === 'income'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Income
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                filterType === 'expense'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Expenses
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 md:max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, category, note..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Dropdown Filters (Category & Month) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Months</option>
              {availableMonths.map((m) => {
                const [year, month] = m.split('-');
                const monthName = new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long' });
                return (
                  <option key={m} value={m}>
                    {monthName} {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Transaction Logs</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 font-medium">
              {filteredExpenses.length}
            </span>
          </h2>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto text-slate-500">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No transactions found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {expenses.length === 0
                ? 'Start tracking your financial health by recording your first income or expense transaction.'
                : 'No transactions match your current search and filter criteria.'}
            </p>
            {expenses.length === 0 && (
              <button
                onClick={handleOpenAddModal}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Transaction
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredExpenses.map((expense) => {
              const isIncome = expense.type === 'income';
              return (
                <div
                  key={expense.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors group"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Icon Indicator */}
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}
                    >
                      {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>

                    {/* Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-100 truncate">
                          {expense.title}
                        </h3>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {expense.type}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                          {expense.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {expense.date}
                        </span>
                        {expense.note && (
                          <span className="truncate italic text-slate-400 max-w-xs">
                            "{expense.note}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    <span
                      className={`text-base sm:text-lg font-black tracking-tight ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}${expense.amount.toFixed(2)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(expense)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit transaction"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(expense)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        initialExpense={editingExpense}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteExpense(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Delete Transaction"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.title}" ($${deleteTarget.amount.toFixed(2)})?`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
};
