import React, { useState } from 'react';
import type { Debt } from '../../types';
import { getDebtPaidAmount, getDebtRemainingAmount, getDebtStatus } from '../../services/storage';
import { getTodayLocalDateStr } from '../../utils/dateUtils';
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  History,
  CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';

interface DebtCardProps {
  debt: Debt;
  onOpenRepayment: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
  onDeleteRepayment?: (debtId: string, repaymentId: string) => void;
}

const formatINR = (val: number) =>
  val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const DebtCard: React.FC<DebtCardProps> = ({
  debt,
  onOpenRepayment,
  onEdit,
  onDelete,
  onDeleteRepayment,
}) => {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const isToGet = debt.type === 'to_get';
  const paidAmount = getDebtPaidAmount(debt);
  const remainingAmount = getDebtRemainingAmount(debt);
  const status = getDebtStatus(debt);

  const percentPaid = debt.amount > 0 ? Math.min(100, Math.round((paidAmount / debt.amount) * 100)) : 0;
  const isPaid = status === 'paid';
  const isPartiallyPaid = status === 'partially_paid';

  const todayStr = getTodayLocalDateStr();
  const isOverdue = debt.dueDate && debt.dueDate < todayStr && !isPaid;

  const repayments = debt.repayments || [];

  return (
    <div
      className={clsx(
        'group relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 space-y-4 shadow-lg',
        isToGet
          ? 'bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/50 shadow-emerald-500/5'
          : 'bg-slate-900/60 border-rose-500/30 hover:border-rose-500/50 shadow-rose-500/5',
        isPaid && 'opacity-90 border-slate-700/60 bg-slate-950/40'
      )}
    >
      {/* Top Header: Type Badge, Person Name, Total Amount */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Distinctive Type Tag */}
          <span
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider',
              isToGet
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
            )}
          >
            {isToGet ? '💰 To Get' : '💸 To Give'}
          </span>

          <h4 className="text-base sm:text-lg font-black text-white truncate max-w-[200px] sm:max-w-xs">
            {debt.personName}
          </h4>

          {isOverdue && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
              <AlertTriangle className="w-3 h-3 text-amber-400" /> Overdue
            </span>
          )}
        </div>

        {/* Total Principal Amount */}
        <div className="text-left sm:text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            {isToGet ? 'Receivable' : 'Payable'}
          </span>
          <span
            className={clsx(
              'text-lg sm:text-xl font-black font-mono',
              isToGet ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            ₹{formatINR(debt.amount)}
          </span>
        </div>
      </div>

      {/* Description / Reason */}
      {debt.description && (
        <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-2">
          {debt.description}
        </p>
      )}

      {/* Dates Metadata */}
      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>Recorded: {debt.date}</span>
        </span>
        {debt.dueDate && (
          <span
            className={clsx(
              'inline-flex items-center gap-1.5',
              isOverdue ? 'text-amber-400 font-bold' : 'text-slate-400'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Due: {debt.dueDate}</span>
          </span>
        )}
      </div>

      {/* Repayment Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 font-sans font-medium">Repayment Progress</span>
          <span className="font-bold text-slate-300">{percentPaid}%</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className={clsx(
              'h-full transition-all duration-300 rounded-full',
              isPaid
                ? 'bg-emerald-500'
                : isPartiallyPaid
                ? isToGet
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
                  : 'bg-gradient-to-r from-orange-500 to-rose-400'
                : 'bg-slate-800'
            )}
            style={{ width: `${percentPaid}%` }}
          />
        </div>
      </div>

      {/* Financial Breakdown & Status Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Paid</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            ₹{formatINR(paidAmount)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Remaining</span>
          <span
            className={clsx(
              'font-mono font-bold text-sm',
              remainingAmount > 0 ? (isToGet ? 'text-amber-300' : 'text-rose-300') : 'text-slate-500'
            )}
          >
            ₹{formatINR(remainingAmount)}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 flex items-center sm:justify-end">
          {isPaid ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Paid
            </span>
          ) : isPartiallyPaid ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold">
              🟡 Partially Paid
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold">
              🔴 Pending
            </span>
          )}
        </div>
      </div>

      {/* Notes */}
      {debt.notes && (
        <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-900">
          "{debt.notes}"
        </p>
      )}

      {/* Action Row */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/70 flex-wrap">
        <div className="flex items-center gap-2">
          {!isPaid ? (
            <button
              onClick={() => onOpenRepayment(debt)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Repayment</span>
            </button>
          ) : (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Fully Settled
            </span>
          )}

          {repayments.length > 0 && (
            <button
              type="button"
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer min-h-[36px]"
              title="View repayments history"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>History ({repayments.length})</span>
              {isHistoryExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(debt)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Edit Debt"
            aria-label="Edit Debt"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(debt)}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Delete Debt"
            aria-label="Delete Debt"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Repayment History Drawer */}
      {isHistoryExpanded && repayments.length > 0 && (
        <div className="pt-3 border-t border-slate-800/80 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-400" /> Repayments History
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Total Paid: ₹{formatINR(paidAmount)}
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {repayments.map((rep) => (
              <div
                key={rep.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-850 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400">
                      ₹{formatINR(rep.amount)}
                    </span>
                    <span className="text-[11px] text-slate-400">• {rep.date}</span>
                  </div>
                  {rep.note && (
                    <p className="text-[11px] text-slate-400 italic line-clamp-1">"{rep.note}"</p>
                  )}
                </div>

                {onDeleteRepayment && (
                  <button
                    onClick={() => onDeleteRepayment(debt.id, rep.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remove this repayment"
                    aria-label="Remove repayment"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
