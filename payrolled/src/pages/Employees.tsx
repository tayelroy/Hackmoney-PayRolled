import React from 'react';
import { Layout } from '@/components/Layout';
import { Users, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

/**
 * Employees Page
 * 
 * Part of the PayRolled web3 payroll application (2026).
 * Provides a professional interface for managing personnel compensation on the Arc network.
 */
const Employees = () => {
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
          <Button className="w-full md:w-auto gap-2 bg-primary hover:bg-primary/90 transition-all active:scale-95">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
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

        {/* Content Area - Placeholder State */}
        <Card className="border-border bg-card/30 backdrop-blur-sm overflow-hidden">
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="mb-6 p-5 rounded-2xl bg-muted/40 border border-border/50 shadow-inner group">
              <Users className="h-12 w-12 text-muted-foreground/40 group-hover:text-primary/40 transition-colors" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No employees registered</h3>
            <p className="text-muted-foreground max-w-md mb-8">
              Your treasury is currently standalone. Connect your workforce to the Arc ecosystem to begin automating monthly liquidity streams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="secondary" className="border border-border">
                Onboard via Bulk Upload
              </Button>
              <Button className="shadow-lg shadow-primary/10">
                Add Manually
              </Button>
            </div>
          </div>
          
          {/* Footer Stats Placeholder */}
          <div className="border-t border-border bg-muted/5 px-6 py-4 flex items-center justify-between text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                TOTAL: 0
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/50" />
                ACTIVE: 0
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500/50" />
                PENDING: 0
              </div>
            </div>
            <div className="hidden sm:block">
              LAST UPDATED: 2026-02-01 14:18:48
            </div>
          </div>
        </Card>

        {/* Table Head Skeleton */}
        <div className="hidden lg:grid grid-cols-6 gap-4 px-6 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
          <span>Employee / ENS</span>
          <span>Designation</span>
          <span>Allocation (USDC)</span>
          <span>Frequency</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Subtle decorative background element */}
        <div className="fixed bottom-0 right-0 -z-10 opacity-5 pointer-events-none">
          <Users size={400} />
        </div>
      </div>
    </Layout>
  );
};

export default Employees;