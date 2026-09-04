import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { Debt } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { getDebtRemainingAmount, getDebtPaidAmount } from '../../services/storage';
import { getTodayLocalDateStr } from '../../utils/dateUtils';
import { Calendar, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
}

const formatINR = (val: number) =>
  val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const RepaymentModal: React.FC<RepaymentModalProps> = ({
  isOpen,
  onClose,
  debt,
}) => {
  const { addDebtRepayment } = useApp();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayLocalDateStr());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAmount('');
    setDate(getTodayLocalDateStr());
    setNote('');
    setError('');
  }, [isOpen, debt]);

  if (!debt) return null;

  const paidAmount = getDebtPaidAmount(debt);
  const remainingAmount = getDebtRemainingAmount(debt);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid repayment amount greater than 0.');
      return;
    }

    if (parsedAmount > remainingAmount) {
      setError(
        `Repayment cannot exceed the remaining balance of ₹${formatINR(remainingAmount)}.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await addDebtRepayment(debt.id, {
        amount: parsedAmount,
        date: date || getTodayLocalDateStr(),
        note: note.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillFullAmount = () => {
    setAmount(remainingAmount.toString());
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Repayment">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Debt Overview Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              {debt.type === 'to_get' ? '💰 Debtor (Owes you)' : '💸 Creditor (You owe)'}:
            </span>
            <span className="font-bold text-white text-sm">{debt.personName}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-center">
            <div className="p-1.5 rounded-xl bg-slate-900/60">
              <span className="text-[10px] text-slate-400 block">Total</span>
              <span className="text-xs font-bold text-white font-mono">
                ₹{formatINR(debt.amount)}
              </span>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-900/60">
              <span className="text-[10px] text-emerald-400 block">Paid</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                ₹{formatINR(paidAmount)}
              </span>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-900/60">
              <span className="text-[10px] text-amber-400 block">Remaining</span>
              <span className="text-xs font-bold text-amber-300 font-mono">
                ₹{formatINR(remainingAmount)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Repayment Amount */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Amount Paid (₹) <span className="text-rose-400">*</span>
            </label>
            {remainingAmount > 0 && (
              <button
                type="button"
                onClick={handleFillFullAmount}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Full (₹{formatINR(remainingAmount)})
              </button>
            )}
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-sm font-bold text-slate-400">₹</span>
            <input
              type="number"
              step="any"
              min="0.01"
              max={remainingAmount}
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-8 pr-3 text-sm font-mono font-bold text-white outline-none transition-colors"
            />
          </div>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Payment Date <span className="text-rose-400">*</span>
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

        {/* Note */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Payment Note (Optional)
          </label>
          <div className="relative flex items-center">
            <FileText className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="e.g. Bank transfer, GPay, Cash payment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || remainingAmount <= 0}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
