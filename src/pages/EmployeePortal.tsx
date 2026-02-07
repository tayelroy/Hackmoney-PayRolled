import { useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { NavLink } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Settings, ShieldCheck, Wallet, ArrowRight, Building2 } from 'lucide-react';
import { injected } from 'wagmi/connectors';
import { ROUTE_PATHS, formatAddress } from '@/lib/index';
import { useUserRole } from '@/hooks/useUserRole';
import { UniswapPositionCard } from '@/components/UniswapPositionCard';
import { UniswapSwapModal } from '@/components/UniswapSwapModal';

export default function EmployeePortal() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { role } = useUserRole();
    const [swapModalOpen, setSwapModalOpen] = useState(false);

    if (!isConnected) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Wallet className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Employee Portal</h1>
                    <p className="text-muted-foreground max-w-md">Connect your wallet to access your institutional payroll dashboard.</p>
                    <Button onClick={() => connect({ connector: injected() })} size="lg">Connect Wallet</Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Portal Overview</h1>
                        <p className="text-muted-foreground">Manage your identity and payroll disbursements.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* DIGITAL ID CARD */}
                    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl p-8 border border-slate-700 md:col-span-2">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl font-bold shadow-inner">
                                {address?.charAt(2).toUpperCase()}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-2xl font-bold tracking-tight">{formatAddress(address)}</h2>
                                <p className="text-emerald-400 font-mono text-sm mt-1">Institutional Identity Verified</p>
                                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Role: Employee</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                        <Building2 className="w-4 h-4 text-emerald-400" />
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">PayRolled Network</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* HISTORY CTA */}
                    <NavLink to={ROUTE_PATHS.PORTAL_HISTORY} className="group">
                        <Card className="p-8 h-full hover:shadow-lg transition-all border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20 active:scale-[0.98]">
                            <div className="flex flex-col h-full">
                                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 w-fit mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <History className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Payment History</h3>
                                <p className="text-sm text-slate-500 mb-6 flex-1">
                                    View all past disbursements, download institutional payslips, and verify transaction hashes on-chain.
                                </p>
                                <div className="flex items-center text-emerald-600 font-bold text-sm">
                                    View History <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Card>
                    </NavLink>

                    {/* CONFIG CTA */}
                    <NavLink to={ROUTE_PATHS.PORTAL_CONFIG} className="group">
                        <Card className="p-8 h-full hover:shadow-lg transition-all border-blue-100 bg-gradient-to-br from-white to-blue-50/20 active:scale-[0.98]">
                            <div className="flex flex-col h-full">
                                <div className="p-3 bg-blue-100 rounded-xl text-blue-600 w-fit mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Settings className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Payroll Config</h3>
                                <p className="text-sm text-slate-500 mb-6 flex-1">
                                    Manage your self-sovereign payroll preferences. Set your preferred delivery chain and currency via ENS.
                                </p>
                                <div className="flex items-center text-blue-600 font-bold text-sm">
                                    Manage Settings <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Card>
                    </NavLink>

                    {/* UNISWAP V4 AUTO-INVEST */}
                    <UniswapPositionCard onSwapClick={() => setSwapModalOpen(true)} />
                </div>

                {/* Uniswap Swap Modal */}
                <UniswapSwapModal
                    open={swapModalOpen}
                    onOpenChange={setSwapModalOpen}
                />
            </div>
        </Layout>
    );
}
