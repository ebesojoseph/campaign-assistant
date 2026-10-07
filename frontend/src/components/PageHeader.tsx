import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

interface PageHeaderActionsProps {
  children: ReactNode;
  className?: string;
}

/**
 * Container for buttons, inputs, and actions aligned to the right of the title text.
 */
export function PageHeaderActions({
  children,
  className = "",
}: PageHeaderActionsProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 sm:gap-3 ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>

      {/* Renders actions passed as a prop OR child PageHeader.Actions */}
      {actions ? <PageHeaderActions>{actions}</PageHeaderActions> : children}
    </div>
  );
}

// Attach child component for flexible compound usage
PageHeader.Actions = PageHeaderActions;
