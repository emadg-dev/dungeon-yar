import React from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Shared layout primitives for editor sheets.
 * One radius (rounded-lg for controls, rounded-xl for cards), one control height (44px),
 * 16px text on mobile inputs (prevents iOS zoom), 14px from sm up.
 */

export const inputCls =
  'w-full min-h-[44px] px-3 rounded-lg bg-surface-2 border border-border text-base sm:text-sm text-text-primary ' +
  'placeholder:text-text-disabled focus:outline-none focus:border-accent';

export const textareaCls =
  'w-full min-h-[96px] px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-base sm:text-sm text-text-primary ' +
  'leading-relaxed placeholder:text-text-disabled focus:outline-none focus:border-accent resize-y';

export const primaryBtnCls =
  'btn-primary min-h-[44px] px-5 rounded-lg font-bold text-sm inline-flex items-center justify-center gap-2';

export const secondaryBtnCls =
  'min-h-[44px] px-4 rounded-lg border border-border bg-surface-2 text-text-primary text-sm font-medium ' +
  'inline-flex items-center justify-center gap-2 hover:border-border-strong';

export const cardCls = 'rounded-xl border border-border p-3 sm:p-4 space-y-3';

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  /** Use for groups of buttons (chips) where a <label> wrapper is wrong */
  group?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, hint, required, group, className = '', children }) => {
  const Wrapper: any = group ? 'div' : 'label';
  return (
    <Wrapper className={`block ${className}`} {...(group ? { role: 'group', 'aria-label': label } : {})}>
      <span className="block text-sm font-medium text-text-primary mb-1.5">
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </span>
      {children}
      {hint && <span className="block mt-1.5 text-xs text-text-muted leading-relaxed">{hint}</span>}
    </Wrapper>
  );
};

interface SectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** Flat section (no card-in-card): title + optional action, separated from siblings by a divider. */
export const Section: React.FC<SectionProps> = ({ title, description, icon: Icon, action, children }) => (
  <section className="py-5 first:pt-0 last:pb-0 space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-accent shrink-0" aria-hidden />}
          <span>{title}</span>
        </h4>
        {description && <p className="mt-1 text-xs text-text-muted leading-relaxed">{description}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

export const SectionStack: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="divide-y divide-border">{children}</div>
);

export const StickyFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="sticky bottom-0 z-10 mt-6 py-3 bg-surface border-t border-border flex flex-col gap-2">{children}</div>
);

export const ToggleChip: React.FC<{
  active: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}> = ({ active, onClick, className = '', children }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`min-h-[44px] px-3 rounded-lg border text-sm font-medium transition inline-flex items-center justify-center gap-1.5 ${
      active
        ? 'bg-accent/15 text-accent-hover border-accent'
        : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
    } ${className}`}
  >
    {children}
  </button>
);

/** The one "add something" button style. */
export const AddButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string }> = ({
  onClick,
  children,
  className = ''
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`min-h-[44px] px-3 rounded-lg border border-dashed border-border-strong text-sm font-medium text-accent-hover ` +
      `inline-flex items-center justify-center gap-1.5 shrink-0 hover:border-accent ${className}`}
  >
    {children}
  </button>
);

export const IconButton: React.FC<{
  label: string;
  onClick?: () => void;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ label, onClick, danger, children }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-text-muted shrink-0 ${
      danger ? 'hover:text-danger hover:bg-danger/10' : 'hover:text-text-primary hover:bg-surface-2'
    }`}
  >
    {children}
  </button>
);

/** Filter / tab pill used in horizontal scroll rows. */
export const pillCls = (active: boolean) =>
  `px-4 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 snap-start transition border min-h-[44px] ${
    active
      ? 'bg-accent/15 text-accent-hover border-accent'
      : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
  }`;

export type Tone = 'success' | 'danger' | 'warning' | 'info' | 'accent' | 'neutral';

const toneCls: Record<Tone, string> = {
  success: 'bg-success/15 text-success border-success/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  info: 'bg-info/15 text-info border-info/30',
  accent: 'bg-accent/15 text-accent-hover border-accent/30',
  neutral: 'bg-surface-2 text-text-muted border-border'
};

/** Status badge: one shape, one size, tone carries the meaning (always paired with text). */
export const Badge: React.FC<{ tone?: Tone; icon?: LucideIcon; children: React.ReactNode }> = ({
  tone = 'neutral',
  icon: Icon,
  children
}) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap ${toneCls[tone]}`}>
    {Icon && <Icon className="w-3 h-3 shrink-0" aria-hidden />}
    {children}
  </span>
);