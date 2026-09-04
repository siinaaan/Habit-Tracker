import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { Debt, DebtType } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { getTodayLocalDateStr } from '../../utils/dateUtils';
import { User, Calendar, FileText, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDebt?: Debt | null;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  initialDebt,
}) => {
  const { saveDebt } = useApp();

  const [type, setType] = useState<DebtType>('to_get');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayLocalDateStr());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialDebt) {
      setType(initialDebt.type);
      setPersonName(initialDebt.personName);
      setAmount(initialDebt.amount.toString());
      setDescription(initialDebt.description || '');
      setDate(initialDebt.date || getTodayLocalDateStr());
      setDueDate(initialDebt.dueDate || '');
      setNotes(initialDebt.notes || '');
    } else {
      setType('to_get');
      setPersonName('');
      setAmount('');
      setDescription('');
      setDate(getTodayLocalDateStr());
      setDueDate('');
      setNotes('');
    }
    setError('');
  }, [initialDebt, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!personName.trim()) {
      setError('Please enter the person name.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    try {
      setIsSaving(true);
      const debtData: Debt = {
        id: initialDebt ? initialDebt.id : `debt-${Date.now()}`,
        type,
        personName: personName.trim(),
        amount: parsedAmount,
        description: description.trim() || undefined,
        date: date || getTodayLocalDateStr(),
        dueDate: dueDate.trim() || undefined,
        notes: notes.trim() || undefined,
        status: initialDebt ? initialDebt.status : 'pending',
        repayments: initialDebt ? initialDebt.repayments : [],
        createdDate: initialDebt ? initialDebt.createdDate : new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      };

      await saveDebt(debtData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialDebt ? 'Edit Debt Record' : 'Record New Debt'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Debt Type Toggle */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Debt Type <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setType('to_get')}
              className={clsx(
                'flex flex-col items-center justify-center py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer',
                type === 'to_get'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span className="text-sm">💰 To Get</span>
              <span className="text-[10px] font-normal opacity-90 mt-0.5">Others owe me</span>
            </button>
            <button
              type="button"
              onClick={() => setType('to_give')}
              className={clsx(
                'flex flex-col items-center justify-center py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer',
                type === 'to_give'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span className="text-sm">💸 To Give</span>
              <span className="text-[10px] font-normal opacity-90 mt-0.5">I owe others</span>
            </button>
          </div>
        </div>

        {/* Person Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Person Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              required
              placeholder="e.g. Ahmed, Mohammed, Sarah"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors"
            />
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Total Amount (₹) <span className="text-rose-400">*</span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-sm font-bold text-slate-400">₹</span>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-8 pr-3 text-sm font-mono font-bold text-white outline-none transition-colors"
            />
          </div>
        </div>

        {/* Description / Reason */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Description / Reason (Optional)
          </label>
          <div className="relative flex items-center">
            <FileText className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="e.g. Lunch, Borrowed for laptop repair, Shopping"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors"
            />
          </div>
        </div>

        {/* Date & Due Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Date <span className="text-rose-400">*</span>
            </label>
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Due Date (Optional)
            </label>
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Notes (Optional)
          </label>
          <div className="relative">
            <textarea
              rows={2}
              placeholder="Additional details, payment terms, or contact info..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-sm text-white outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : initialDebt ? 'Update Debt' : 'Add Debt'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
