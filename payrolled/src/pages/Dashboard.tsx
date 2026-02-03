import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { StatsCard } from '@/components/Cards';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, formatAddress } from '@/lib/index';
import { supabase, type Employee } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '@/lib/index';
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTreasury: 1250480.25, // Mocked treasury balance for now
    nextPayrollDate: '',
    previousPayrollDate: '',
    activeEmployees: 0,
    totalPayrollVolume: 0,
  });

  // Calculate payroll dates (Semi-monthly: 15th and Last Day)
  const calculatePayrollDates = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed
    const current15th = new Date(year, month, 15);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let nextDate: Date;
    let prevDate: Date;

    if (today < current15th) {
      // Before 15th: Next is 15th, Prev is last day of prev month
      nextDate = current15th;
      prevDate = new Date(year, month, 0);
    } else if (today < lastDayOfMonth) {
      // Between 15th and End: Next is End, Prev is 15th
      nextDate = lastDayOfMonth;
      prevDate = current15th;
    } else {
      // On/After last day (edge case): Next is 15th of next month, Prev is End of this month
      nextDate = new Date(year, month + 1, 15);
      prevDate = lastDayOfMonth;
    }

    return {
      next: nextDate.toISOString(),
      prev: prevDate.toISOString()
    };
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('status', 'Active');

        if (error) throw error;

        const activeEmps = data || [];
        const totalVol = activeEmps.reduce((sum, emp) => sum + Number(emp.salary), 0);
        const dates = calculatePayrollDates();

        setEmployees(activeEmps);
        setStats(prev => ({
          ...prev,
          activeEmployees: activeEmps.length,
          totalPayrollVolume: totalVol,
          nextPayrollDate: dates.next,
          previousPayrollDate: dates.prev
        }));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
        <div className="grid gap-6 md:grid-cols-4">
          <StatsCard
            title="Total Monthly Payroll"
            value={formatCurrency(stats.totalPayrollVolume)}
            subtitle={`${stats.activeEmployees} Active Recipients`}
            trend="up"
          />
          <StatsCard
            title="Next Payroll Date"
            value={stats.nextPayrollDate ? formatDate(stats.nextPayrollDate) : '...'}
            subtitle="Scheduled Execution"
          />
          <StatsCard
            title="Previous Payroll"
            value={stats.previousPayrollDate ? formatDate(stats.previousPayrollDate) : '...'}
            subtitle="Last Disbursed"
          />
          <StatsCard
            title="Total Treasury (USDC)"
            value={formatCurrency(stats.totalTreasury)}
            subtitle="Liquidity on Arc Testnet"
          />
        </div>

        {/* Main Action Area: Payroll Table */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold tracking-tight">Payroll Queue</h2>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
            {/* Table Header */}
            <div className="p-6 pb-0">
              <div className="grid grid-cols-4 gap-4 pb-4 border-b border-border/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div>Employee</div>
                <div>Network</div>
                <div>Amount</div>
                <div className="text-right">Status</div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-4 space-y-4">
              {loading ? (
                // Loading Skeletons
                [1, 2, 3].map((i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 items-center">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="flex items-center"><Skeleton className="h-4 w-24" /></div>
                    <div><Skeleton className="h-4 w-20" /></div>
                    <div className="flex justify-end"><Skeleton className="h-6 w-20 rounded-full" /></div>
                  </div>
                ))
              ) : employees.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                    <div className="relative h-16 w-16 bg-muted rounded-2xl flex items-center justify-center border border-border">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">No employees found</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">
                    Your payroll queue is currently empty. Add team members to start paying in USDC.
                  </p>
                  <Link to={ROUTE_PATHS.EMPLOYEES}>
                    <button className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity">
                      Manage Employees
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              ) : (
                // Real Data
                employees.map((emp) => (
                  <div key={emp.id} className="grid grid-cols-4 gap-4 items-center hover:bg-muted/30 p-2 rounded-lg -mx-2 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                          <Wallet className="h-3 w-3" />
                          {formatAddress(emp.wallet_address)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      Arc Testnet
                    </div>
                    <div className="font-mono font-medium">
                      {formatCurrency(Number(emp.salary))}
                    </div>
                    <div className="flex justify-end">
                      <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Pending
                      </div>
                    </div>
                  </div>
                ))
              )}
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
