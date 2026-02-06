import { useAccount, useConnect } from 'wagmi';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, ExternalLink, ShieldCheck, AlertCircle, Building2, Wallet } from 'lucide-react';
import { injected } from 'wagmi/connectors';
import { usePayrollConfig } from '@/hooks/usePayrollConfig';
import { formatAddress, getChainName } from '@/lib/index';

export default function EmployeeConfig() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { ensName, preferredChainId, preferredCurrency, loading } = usePayrollConfig(address);

    if (!isConnected) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Wallet className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Access Required</h1>
                    <p className="text-muted-foreground max-w-md">Connect your wallet to configure your payroll settings.</p>
                    <Button onClick={() => connect({ connector: injected() })}>Connect Wallet</Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payroll Configuration</h1>
                    <p className="text-muted-foreground">Manage your self-sovereign payroll preferences via ENS.</p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {/* DIGITAL ID CARD (Simplified for Sidebar inclusion later) */}
                    <div className="md:col-span-1">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl p-6 border border-slate-700">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full -mr-12 -mt-12 pointer-events-none" />
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-bold mb-4">
                                    {ensName ? ensName.charAt(0).toUpperCase() : '?'}
                                </div>
                                <h2 className="text-lg font-bold tracking-wide truncate w-full px-2">
                                    {ensName || formatAddress(address)}
                                </h2>
                                <p className="text-[10px] text-slate-400 font-mono mt-1">
                                    {formatAddress(address)}
                                </p>

                                <div className="w-full mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-emerald-400">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Verified Identity</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONFIG CARD */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="p-8 border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 shadow-md">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900">ENS Payroll Config</h3>
                                    <p className="text-sm text-slate-500">Settings fetched live from Ethereum.</p>
                                </div>
                                {loading && <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent animate-spin rounded-full" />}
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivery Chain</p>
                                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-emerald-100 shadow-sm">
                                            <span className="font-mono text-emerald-600 font-bold">
                                                {getChainName(preferredChainId)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Currency</p>
                                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-emerald-100 shadow-sm">
                                            <span className="font-mono text-slate-700 font-bold">{preferredCurrency || 'USDC'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <h4 className="text-sm font-bold text-emerald-900 mb-2">Self-Sovereign Rule</h4>
                                    <p className="text-xs text-emerald-800 leading-relaxed">
                                        We read <code className="bg-emerald-100 px-1 rounded">payroll.chain</code> and <code className="bg-emerald-100 px-1 rounded">payroll.currency</code> from your ENS text records.
                                        You own your payroll data.
                                    </p>
                                </div>

                                {ensName ? (
                                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 py-6 text-lg">
                                        <a href={`https://app.ens.domains/${ensName}`} target="_blank" rel="noreferrer">
                                            Edit Records on ENS <ExternalLink className="w-5 h-5 ml-2" />
                                        </a>
                                    </Button>
                                ) : (
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 text-sm flex gap-3 shadow-inner">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <p>No ENS name found. Set up an ENS name and add text records to enable custom payroll routing.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
