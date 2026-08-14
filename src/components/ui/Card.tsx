import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverGlow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glass = true,
  hoverGlow = true,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'rounded-2xl p-5 border shadow-xl transition-all duration-200',
        glass
          ? 'bg-slate-900/60 backdrop-blur-xl border-slate-800/80 text-slate-100'
          : 'bg-slate-900 border-slate-800 text-slate-100',
        hoverGlow && 'hover:border-indigo-500/40 hover:shadow-indigo-500/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={clsx('flex items-center justify-between pb-4 mb-4 border-b border-slate-800/70', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h3 className={clsx('text-lg font-bold text-slate-100 flex items-center gap-2', className)} {...props}>
    {children}
  </h3>
);
