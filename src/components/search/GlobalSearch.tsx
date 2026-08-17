import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { NavigationTab } from '../../types';
import { Search, X, CheckSquare, Target, BookOpen, GraduationCap, Trophy, Flame, Wallet } from 'lucide-react';
import { clsx } from 'clsx';

interface SearchResultItem {
  id: string;
  type: 'Habit' | 'Task' | 'Goal' | 'Reflection' | 'Learning' | 'Milestone' | 'Expense';
  title: string;
  subtitle: string;
  targetTab: NavigationTab;
  date?: string;
  badgeColor: string;
  icon: React.ReactNode;
}

export const GlobalSearch: React.FC = () => {
  const {
    habits,
    tasks,
    goals,
    reflections,
    learningItems,
    expenses,
    setActiveTab,
    setSelectedDate,
  } = useApp();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close search when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsMobileExpanded(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsMobileExpanded(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Compute Search Results
  const results: SearchResultItem[] = [];
  const cleanQuery = query.trim().toLowerCase();

  if (cleanQuery) {
    // 1. Habits
    habits.forEach((h) => {
      if (
        h.name.toLowerCase().includes(cleanQuery) ||
        h.description.toLowerCase().includes(cleanQuery) ||
        h.category.toLowerCase().includes(cleanQuery)
      ) {
        results.push({
          id: `h-${h.id}`,
          type: 'Habit',
          title: `${h.icon} ${h.name}`,
          subtitle: `${h.category} • ${h.description || 'Habit'}`,
          targetTab: 'daily',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: <Flame className="w-4 h-4 text-emerald-400" />,
        });
      }
    });

    // 2. Tasks
    tasks.forEach((t) => {
      if (
        t.title.toLowerCase().includes(cleanQuery) ||
        (t.description && t.description.toLowerCase().includes(cleanQuery)) ||
        t.category.toLowerCase().includes(cleanQuery) ||
        t.priority.toLowerCase().includes(cleanQuery)
      ) {
        results.push({
          id: `t-${t.id}`,
          type: 'Task',
          title: `${t.completed ? '✓ ' : ''}${t.title}`,
          subtitle: `${t.category} • Priority: ${t.priority} • Due: ${t.dueDate}`,
          targetTab: 'dashboard',
          badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          icon: <CheckSquare className="w-4 h-4 text-indigo-400" />,
        });
      }
    });

    // 3. Goals
    goals.forEach((g) => {
      if (
        g.title.toLowerCase().includes(cleanQuery) ||
        g.description.toLowerCase().includes(cleanQuery) ||
        g.category.toLowerCase().includes(cleanQuery)
      ) {
        results.push({
          id: `g-${g.id}`,
          type: 'Goal',
          title: g.title,
          subtitle: `${g.category} • Progress: ${g.progress}%`,
          targetTab: 'goals',
          badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          icon: <Target className="w-4 h-4 text-purple-400" />,
        });
      }
    });

    // 4. Reflections
    reflections.forEach((r) => {
      if (
        r.accomplished.toLowerCase().includes(cleanQuery) ||
        r.learned.toLowerCase().includes(cleanQuery) ||
        r.wentWell.toLowerCase().includes(cleanQuery) ||
        r.shouldImprove.toLowerCase().includes(cleanQuery) ||
        r.date.includes(cleanQuery)
      ) {
        results.push({
          id: `r-${r.id}`,
          type: 'Reflection',
          title: `Reflection (Day ${r.challengeDay})`,
          subtitle: `${r.date} • ${r.mood}`,
          targetTab: 'reflections',
          date: r.date,
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: <BookOpen className="w-4 h-4 text-amber-400" />,
        });
      }
    });

    // 5. Learning
    learningItems.forEach((l) => {
      if (
        l.topic.toLowerCase().includes(cleanQuery) ||
        l.description.toLowerCase().includes(cleanQuery) ||
        l.category.toLowerCase().includes(cleanQuery) ||
        l.notes.toLowerCase().includes(cleanQuery)
      ) {
        results.push({
          id: `l-${l.id}`,
          type: 'Learning',
          title: l.topic,
          subtitle: `${l.category} • Status: ${l.status} (${l.progressPercentage}%)`,
          targetTab: 'learning',
          badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          icon: <GraduationCap className="w-4 h-4 text-sky-400" />,
        });
      }
    });

    // 6. Milestones
    [30, 60, 90].forEach((mDay) => {
      const mText = `day ${mDay} milestone`;
      if (mText.includes(cleanQuery) || 'milestone'.includes(cleanQuery)) {
        results.push({
          id: `m-${mDay}`,
          type: 'Milestone',
          title: `Milestone Checkpoint Day ${mDay}`,
          subtitle: `Evaluations for Day ${mDay}`,
          targetTab: 'milestones',
          badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
          icon: <Trophy className="w-4 h-4 text-yellow-400" />,
        });
      }
    });

    // 7. Expenses
    expenses.forEach((e) => {
      if (
        e.title.toLowerCase().includes(cleanQuery) ||
        e.category.toLowerCase().includes(cleanQuery) ||
        (e.note && e.note.toLowerCase().includes(cleanQuery)) ||
        e.amount.toString().includes(cleanQuery)
      ) {
        results.push({
          id: `e-${e.id}`,
          type: 'Expense',
          title: `${e.type === 'income' ? '+' : '-'}₹${e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - ${e.title}`,
          subtitle: `${e.category} • ${e.date}${e.note ? ` • ${e.note}` : ''}`,
          targetTab: 'expenses',
          badgeColor: e.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: <Wallet className="w-4 h-4 text-emerald-400" />,
        });
      }
    });
  }

  const handleSelectResult = (item: SearchResultItem) => {
    if (item.date) setSelectedDate(item.date);
    setActiveTab(item.targetTab);
    setIsOpen(false);
    setIsMobileExpanded(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Mobile Toggle Search Icon */}
      <button
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
        className="sm:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        aria-label="Open Search"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Desktop Search Input & Expandable Mobile Input */}
      <div
        className={clsx(
          'items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 transition-all duration-200',
          isMobileExpanded
            ? 'flex fixed top-3 left-4 right-4 z-50 bg-slate-950 shadow-2xl border-indigo-500'
            : 'hidden sm:flex w-48 md:w-64 focus-within:w-72 focus-within:border-indigo-500'
        )}
      >
        <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Global search (habits, tasks, goals...)"
          className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="p-0.5 rounded text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown Panel */}
      {isOpen && cleanQuery && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-96 top-full mt-2 z-50 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 space-y-1 max-h-80 overflow-y-auto animate-fadeIn">
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching habits, tasks, or entries found.
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectResult(item)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-100 truncate group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                  </div>
                </div>

                <span
                  className={clsx(
                    'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ml-2',
                    item.badgeColor
                  )}
                >
                  {item.type}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
