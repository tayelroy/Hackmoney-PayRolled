import { Layout } from "@/components/Layout";
import { History as HistoryIcon, Search, Filter, Download, ArrowUpRight } from "lucide-react";

/**
 * Payroll History Page
 * 
 * Displays a log of all past payroll distributions and treasury transactions.
 * Adheres to the PayRolled institutional dark mode aesthetic.
 */
export default function History() {
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Payroll History</h1>
            <p className="mt-1 text-muted-foreground">
              Comprehensive log of all organization disbursements and treasury movements on Arc.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-all hover:bg-accent active:scale-95 cursor-pointer shadow-sm"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* History Log Container */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md">
          {/* Toolbar & Filters */}
          <div className="flex flex-col border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by address, name, or transaction hash..."
                className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent cursor-pointer"
              >
                <Filter className="h-4 w-4" />
                Advanced Filters
              </button>
            </div>
          </div>

          {/* Placeholder Empty State Content Area */}
          <div className="flex flex-col items-center justify-center py-32 text-center px-4">
            <div className="relative mb-6">
              {/* Subtle radial glow effect */}
              <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 border border-border shadow-inner">
                <HistoryIcon className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-foreground">No distribution records found</h3>
            <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
              Your payroll history is currently empty. Once you process your first payroll cycle on the Arc network, all transaction details will be archived here for audit purposes.
            </p>
            <div className="mt-8">
              <button 
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-8 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95 cursor-pointer"
              >
                Process First Payroll
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Audit Trail Footer */}
          <div className="border-t border-border bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Network Audit Trail Active</p>
              </div>
              <div className="flex gap-2">
                <button 
                  disabled 
                  className="h-8 rounded-md border border-border bg-card/50 px-4 text-xs opacity-40 cursor-not-allowed font-medium transition-all hover:bg-accent"
                >
                  Previous
                </button>
                <button 
                  disabled 
                  className="h-8 rounded-md border border-border bg-card/50 px-4 text-xs opacity-40 cursor-not-allowed font-medium transition-all hover:bg-accent"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Integrity Notice */}
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/10 p-4 text-xs text-muted-foreground">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            i
          </div>
          <p>
            All historical data is indexed directly from the <strong>Arc Mainnet</strong> blockchain. Payments made outside of the PayRolled smart contracts may not appear in this specific history log. For full treasury reconciliation, please visit the Arc Explorer.
          </p>
        </div>
      </div>
    </Layout>
  );
}
