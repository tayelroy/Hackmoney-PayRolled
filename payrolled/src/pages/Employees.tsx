/**
 * Employees Page
 * 
 * Part of the PayRolled web3 payroll application (2026).
 * Provides a professional interface for managing personnel compensation on the Arc network.
 */
import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Users, Search, Filter, FlaskConical, Loader2, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { usePayroll } from '@/hooks/usePayroll';
import { formatAddress, formatCurrency } from '@/lib/index';
import { supabase, type Employee } from '@/lib/supabase';
import { AddEmployeeDialog } from '@/components/AddEmployeeDialog';
import { useEmployeePrefs } from '@/hooks/useEmployeePrefs';
import { Badge } from '@/components/ui/badge';

const EmployeeRow = ({ employee }: { employee: Employee }) => {
  const { ensName, preferredChain, preferredToken, isLoading } = useEmployeePrefs(employee.wallet_address);

  // Helper to map chain ID to name
  const getChainName = (chainId: number) => {
    if (chainId === 8453) return 'Base';
    if (chainId === 11155111) return 'Sepolia';
    if (chainId === 5042002) return 'Arc Testnet';
    return `Chain ${chainId}`;
  };

  return (
    <Card className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 hover:bg-card/80 transition-colors border-border/50">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          {employee.name.charAt(0)}
        </div>
        <div>
          <h4 className="font-medium text-foreground">{employee.name}</h4>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Wallet className="h-3 w-3" />
            {isLoading ? (
              <span className="animate-pulse">Loading ENS...</span>
            ) : (
              <span className={ensName ? "text-primary font-semibold" : ""}>
                {ensName || formatAddress(employee.wallet_address)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
        {/* Preference Badge */}
        <div className="flex flex-col items-end gap-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Preferences</p>
          {isLoading ? (
            <div className="h-5 w-20 bg-muted/50 rounded animate-pulse" />
          ) : (
            <Badge variant="outline" className="text-xs font-normal gap-1">
              {getChainName(preferredChain)} • {preferredToken}
            </Badge>
          )}
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Salary</p>
          <p className="font-semibold">{formatCurrency(Number(employee.salary))}</p>
        </div>
        <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
          {employee.status}
        </div>
      </div>
    </Card>
  );
};

const Employees = () => {
  const { isConnected } = useWallet();
  const { batchPay, isWritePending, isConfirming, isConfirmed, hash, error } = usePayroll();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch employees from Supabase
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const totalPayroll = employees.reduce((sum, emp) => sum + Number(emp.salary), 0);

  const handlePayAll = () => {
    if (employees.length === 0) return;

    // Unzip logic: Create parallel arrays for targets and values
    const targets = employees.map(e => e.wallet_address);
    const values = employees.map(e => e.salary.toString());
    // datas defaults to empty "0x" in the hook for direct transfers

    batchPay(targets, values);
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Employees
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your global team members and their automated on-chain compensation schedules.
            </p>
          </div>
          <AddEmployeeDialog onSuccess={fetchEmployees} />
        </div>

        {/* Toolbar Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, wallet address, or ENS..."
              className="pl-10 bg-card/50 border-border focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 border-border hover:bg-accent">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="border-border hidden sm:flex">
              Export CSV
            </Button>
          </div>
        </div>

        {/* Transaction Feedback */}
        {hash && (
          <div className="p-4 bg-background/50 rounded-lg border border-border animate-in fade-in">
            <div className="text-xs font-mono break-all flex items-start gap-2 mb-2">
              <span className="text-muted-foreground">Tx Hash:</span>
              <span className="text-foreground">{hash}</span>
            </div>
            {isConfirmed ? (
              <div className="text-sm text-emerald-500 flex items-center gap-2 font-medium">
                <CheckCircle className="h-4 w-4" />
                Batch Payroll Executed Successfully!
              </div>
            ) : (
              <div className="text-sm text-amber-500 flex items-center gap-2 font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing On-Chain...
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 text-sm text-destructive flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            Error: {error.message}
          </div>
        )}


        {/* Employee List or Empty State */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : employees.length === 0 ? (
          <Card className="border-border bg-card/30 backdrop-blur-sm overflow-hidden">
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="mb-6 p-5 rounded-2xl bg-muted/40 border border-border/50 shadow-inner group">
                <Users className="h-12 w-12 text-muted-foreground/40 group-hover:text-primary/40 transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No employees registered</h3>
              <p className="text-muted-foreground max-w-md mb-8">
                Your treasury is currently standalone. Add team members to begin automating monthly liquidity streams.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4">
              {employees.map((employee) => (
                <EmployeeRow key={employee.id} employee={employee} />
              ))}
            </div>

            {/* Payroll Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 p-4 border-t border-border bg-background/80 backdrop-blur-lg flex items-center justify-between z-40">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Payroll</span>
                <span className="text-xl font-bold font-mono">{formatCurrency(totalPayroll)}</span>
              </div>
              <Button
                size="lg"
                onClick={handlePayAll}
                disabled={!isConnected || isWritePending || isConfirming || employees.length === 0}
                className="shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[200px]"
              >
                {isWritePending || isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${employees.length} Employees`
                )}
              </Button>
            </div>
            {/* Spacer for fixed footer */}
            <div className="h-20" />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Employees;