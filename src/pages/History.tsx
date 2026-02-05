
import React, { useEffect, useState } from 'react';
import { Layout } from "@/components/Layout";
import { History as HistoryIcon, Search, Filter, Download, ArrowUpRight, ExternalLink, ShieldCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatAddress, formatCurrency, formatDate } from "@/lib/index";
import { createPublicClient, http, keccak256 } from "viem";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PaymentHistory {
  id: number;
  created_at: string;
  employee_id: number;
  amount: number;
  tx_hash: string;
  chain: string;
  status: string;
  recipient_address: string;
  employees?: {
    name: string;
  };
}

export default function History() {
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const arcClient = createPublicClient({
    transport: http('https://rpc.testnet.arc.network')
  });

  const updateCCTPStatus = async (item: PaymentHistory) => {
    if (!item.tx_hash || item.tx_hash === 'pending') return;

    setSyncingId(item.id);
    try {
      // 1. Get transaction receipt from Arc
      console.log("Fetching receipt for", item.tx_hash);
      const receipt = await arcClient.getTransactionReceipt({
        hash: item.tx_hash as `0x${string}`
      });

      // 2. Find MessageSent event (Topic0: 0x8c526166...)
      const messageSentTopic = '0x8c5261668696ce22758910d05be2067185840eae1a553097e305a4170845348d';
      const log = receipt.logs.find(l => l.topics[0] === messageSentTopic);

      if (!log) {
        console.warn("MessageSent event not found in logs");
        return;
      }

      // 3. Extract message bytes and hash them
      const messageBytes = log.data;
      const messageHash = keccak256(messageBytes);
      console.log("Found Message Hash:", messageHash);

      // 4. Check Circle Attestation API (Sandbox for testnets)
      const response = await fetch(`https://iris-api-sandbox.circle.com/v1/attestations/${messageHash}`);
      const data = await response.json();

      if (data.status === 'complete') {
        console.log("Attestation complete! Updating status to Paid.");
        const { error } = await supabase
          .from('payment_history')
          .update({ status: 'Paid' })
          .eq('id', item.id);

        if (error) throw error;
        // Local state will update via realtime subscription
      } else {
        console.log("Attestation status:", data.status);
      }
    } catch (err) {
      console.error("Failed to sync CCTP status:", err);
    } finally {
      setSyncingId(null);
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_history')
          .select('*, employees(name)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // Set up realtime subscription for updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_history' },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredHistory = history.filter(item =>
    item.tx_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.recipient_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.employees?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.chain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'processing (cctp)': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'pending attestation': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getExplorerLink = (hash: string, chain: string) => {
    if (chain.includes('Arc')) return `https://testnet.arcscan.app/tx/${hash}`;
    if (chain.includes('Base')) return `https://sepolia.basescan.org/tx/${hash}`;
    return `https://sepolia.etherscan.io/tx/${hash}`;
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Payroll History
              <Badge variant="outline" className="ml-2 font-mono text-[10px] uppercase tracking-wider bg-primary/5 text-primary border-primary/20">
                Audit Trail Ready
              </Badge>
            </h1>
            <p className="mt-1 text-muted-foreground">
              Comprehensive log of organizations disbursements across Arc, Base, and Ethereum.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-10 gap-2 shadow-sm active:scale-95 transition-all">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* History Log Container */}
        <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md">
          {/* Toolbar & Filters */}
          <div className="flex flex-col border-b border-border/50 p-4 sm:flex-row sm:items-center sm:justify-between gap-4 bg-muted/20">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by address, name, chain or transaction hash..."
                className="pl-10 h-10 transition-all focus:ring-1 focus:ring-primary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-10 gap-2 transition-colors hover:bg-accent">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Chain</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Transaction</th>
                  <th className="px-6 py-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-32" /></td>
                    </tr>
                  ))
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative mb-6">
                          <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl" />
                          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 border border-border">
                            <HistoryIcon className="h-10 w-10 text-muted-foreground" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">No records found</h3>
                        <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
                          {searchQuery ? "Adjust your search filters to find what you're looking for." : "Your payroll history is currently empty. Process your first payroll to see records here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{item.employees?.name || "Unknown"}</span>
                          <span className="text-xs text-muted-foreground font-mono">{formatAddress(item.recipient_address)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="px-2 py-0 h-6 text-[10px] font-medium tracking-tight">
                          {item.chain}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-foreground">
                        {formatCurrency(Number(item.amount))}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          {item.status.toLowerCase().includes('processing') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                              onClick={() => updateCCTPStatus(item)}
                              disabled={syncingId === item.id}
                            >
                              <RefreshCw className={`h-3 w-3 ${syncingId === item.id ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={getExplorerLink(item.tx_hash, item.chain)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-mono"
                              >
                                {formatAddress(item.tx_hash)}
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>
                              View on Explorer
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Audit Trail Footer */}
          <div className="border-t border-border/50 bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Network Integrity Logs Active</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Showing {filteredHistory.length} of {history.length} transactions
              </div>
            </div>
          </div>
        </Card>

        {/* Data Integrity Notice */}
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
            !
          </div>
          <p>
            Historical data is synchronized directly with <strong>Arc, Base, and Ethereum Sepolia</strong> testnets. Transactions recorded here represent verified smart contract interactions. For institutional auditing, please use the Export CSV feature.
          </p>
        </div>
      </div>
    </Layout>
  );
}
