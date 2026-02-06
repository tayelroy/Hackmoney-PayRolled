import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Wallet,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTE_PATHS, formatAddress } from '@/lib/index';
import { useWallet } from '@/hooks/useWallet';
import { springPresets } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { address, disconnect, networkName } = useWallet();
  const location = useLocation();
  const { role } = useUserRole();

  const allNavigation = [
    { name: 'Overview', href: ROUTE_PATHS.DASHBOARD, icon: LayoutDashboard, roles: ['admin'] },
    { name: 'Employees', href: ROUTE_PATHS.EMPLOYEES, icon: Users, roles: ['admin'] },
    { name: 'History', href: ROUTE_PATHS.HISTORY, icon: History, roles: ['admin', 'employee'] },
    { name: 'My Portal', href: ROUTE_PATHS.PORTAL, icon: Wallet, roles: ['employee'] },
    { name: 'Settings', href: ROUTE_PATHS.SETTINGS, icon: Settings, roles: ['admin'] },
  ];

  // Logic: 
  // If role is 'employee', they use Portal. They don't need general History page (which is all payrolls).
  // But strictly speaking, standard History page shows ALL payments. Maybe employee wants to see that?
  // Let's assume Employee only sees Portal for now to keep it clean, as per user request ("vice versa").
  // If I am an employee, I should NOT see 'History' page meant for Admins.
  // So 'History' should be 'admin' only?
  // Portal has its own history. 
  // Let's refine the roles in the list above.

  const navigation = allNavigation.filter(item => {
    if (role === 'loading' || role === 'disconnected') return false;

    // Override History to be Admin only if we want strict separation
    if (item.name === 'History' && role === 'employee') return false;

    return item.roles.includes(role);
  });

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === ROUTE_PATHS.DASHBOARD) return ['Dashboard', 'Overview'];
    if (path === ROUTE_PATHS.EMPLOYEES) return ['Dashboard', 'Employees'];
    if (path === ROUTE_PATHS.HISTORY) return ['Dashboard', 'History'];
    if (path === ROUTE_PATHS.SETTINGS) return ['Dashboard', 'Settings'];
    if (path === ROUTE_PATHS.PORTAL) return ['My Portal'];
    return ['Dashboard'];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 border-r border-sidebar-border bg-sidebar">
        <div className="p-6 flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center p-1 rounded-2xl border border-white/10 shadow-lg overflow-hidden backdrop-blur-sm">
            <img src="/favicon.ico" alt="PayRolled Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight">PayRolled</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === ROUTE_PATHS.DASHBOARD}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={() => disconnect()}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Disconnect
          </button>
          <div className="mt-4 px-4 py-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Account</p>
            <p className="text-sm font-mono font-medium truncate">{formatAddress(address)}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
          <div className="h-full px-4 lg:px-8 flex items-center justify-between">
            {/* Breadcrumbs & Mobile Trigger */}
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 text-muted-foreground"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>

              <nav className="flex items-center gap-2 text-sm text-muted-foreground hidden sm:flex">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb}>
                    <span className={idx === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
                      {crumb}
                    </span>
                    {idx < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4" />}
                  </React.Fragment>
                ))}
              </nav>
            </div>

            {/* Status & Wallet */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-500">{networkName}</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg border border-border">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-mono font-medium">{formatAddress(address)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springPresets.gentle}
          >
            {children}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="p-8 border-t border-border mt-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2026 PayRolled Treasury Solutions. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors">Security</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">API Docs</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={springPresets.smooth}
              className="fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border z-50 lg:hidden"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center p-1 bg-white/5 rounded-2xl border border-white/10 shadow-lg overflow-hidden backdrop-blur-sm">
                    <img src="/logo.png" alt="PayRolled Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">PayRolled</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground"
                      )
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
