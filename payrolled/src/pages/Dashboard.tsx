import React from 'react';
import { Layout } from '@/components/Layout';
import { StatsCard } from '@/components/Cards';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/index';
import { 
  Users, 
  Wallet, 
  Calendar, 
  ArrowUpRight, 
  Briefcase, 
  Clock,
  AlertCircle
} from 'lucide-react';

/**
 * PayRolled Dashboard Overview
 * © 2026 PayRolled Treasury Solutions
 */
export default function Dashboard() {
  // Mock data for the dashboard overview
  const stats = {
    totalTreasury: 1250480.25,
    nextPayrollDate: '2026-02-15',
    activeEmployees: 42,
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of your Arc treasury and upcoming payroll disbursements.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatsCard
            title="Total Treasury (USDC)"
            value={formatCurrency(stats.totalTreasury)}
            subtitle="Liquidity on Arc Mainnet"
            trend="up"
          />
          <StatsCard
            title="Next Payroll Date"
            value={formatDate(stats.nextPayrollDate)}
            subtitle="Automated smart contract execution"
          />
          <StatsCard
            title="Active Employees"
            value={stats.activeEmployees.toString()}
            subtitle="Verified ENS identities"
            trend="up"
          />
        </div>

        {/* Main Action Area: Payroll Table Placeholder */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold tracking-tight">Payroll Queue</h2>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated: Feb 1, 2026</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
            {/* Skeleton Loader Table Structure */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-4 gap-4 pb-4 border-b border-border/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div>Employee</div>
                <div>Network</div>
                <div>Amount</div>
                <div className="text-right">Status</div>
              </div>

              {/* Skeleton Rows */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="grid grid-cols-4 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-end">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ))}

              {/* Empty State Overlay / Content */}
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                  <div className="relative h-16 w-16 bg-muted rounded-2xl flex items-center justify-center border border-border">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold">No employees found</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                  Your payroll queue is currently empty. Connect your HR software or add team members manually to start paying in USDC.
                </p>
                <button className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity">
                  Add First Employee
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Footer Alert */}
            <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">
                Treasury balance is sufficient for the next 3 payroll cycles. No immediate action required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
