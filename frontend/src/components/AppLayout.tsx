import { LayoutDashboard, Layers, LogOut, Menu, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import type { User } from '@/types';
import { cn } from '@/utils';
import { Button } from './Button';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/segments', label: 'Segments', icon: Layers },
  { to: '/campaigns', label: 'Campaigns', icon: Sparkles },
];

/** Presentational shell. The user + logout handler are injected so this stays feature-agnostic. */
interface AppLayoutProps {
  user: User | null;
  onLogout: () => void;
}

export function AppLayout({ user, onLogout }: AppLayoutProps) {
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100')
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold">Campaign Assistant</p>
        <p className="text-xs text-slate-500">DME Systems</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        {brand}
        {nav}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-white shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 rounded p-1 text-slate-500">
              <X className="h-4 w-4" />
            </button>
            {brand}
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs capitalize text-slate-500">{user?.role}</p>
            </div>
            <Button variant="secondary" size="sm" icon={LogOut} onClick={onLogout}>
              Sign out
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
