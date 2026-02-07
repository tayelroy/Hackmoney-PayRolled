import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatAddress } from '@/lib/index';
import { Loader2, Wallet, DollarSign, Calendar, CheckCircle2, Clock, XCircle, FileText, Download, Building2, CreditCard, ExternalLink, Globe, Edit2, ShieldCheck, AlertCircle } from 'lucide-react';
import { injected } from 'wagmi/connectors';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePayrollConfig } from '@/hooks/usePayrollConfig';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function EmployeePortal() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();

    // Identity Features
    const { ensName, ensAvatar, preferredChainId, preferredCurrency } = usePayrollConfig(address);
    const { signMessageAsync } = useSignMessage();

    // Internal State
    const [isEditing, setIsEditing] = useState(false);
    const [newAddress, setNewAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [employeeData, setEmployeeData] = useState<any | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

    // Fetch Employee Data when Connected
    useEffect(() => {
        const fetchMyData = async () => {
            if (!address) return;
            setLoading(true);
            try {
                console.log("Fetching data for wallet:", address);

                // 1. Find Employee Record
                const { data: emp, error: empError } = await supabase
                    .from('employees')
                    .select('*')
                    .ilike('wallet_address', address) // Case insensitive match
                    .single();

                if (empError) {
                    console.log("Employee fetch error or not found", empError);
                    setEmployeeData(null);
                } else {
                    console.log("Found Employee:", emp);
                    setEmployeeData(emp);

                    // 2. Fetch Payment History
                    const { data: history, error: histError } = await supabase
                        .from('payment_history')
                        .select('*')
                        .eq('employee_id', emp.id)
                        .order('created_at', { ascending: false });

                    if (histError) console.error("History error", histError);
                    setPaymentHistory(history || []);
                }

            } catch (e) {
                console.error("Portal Error:", e);
            } finally {
                setLoading(false);
            }
        };

        if (isConnected && address) {
            fetchMyData();
        } else {
            setEmployeeData(null);
            setPaymentHistory([]);
        }
    }, [address, isConnected]);


    const downloadPayslip = (payment: any) => {
        const doc = new jsPDF();

        // Brand Header
        doc.setFillColor(16, 185, 129); // Emerald 600
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text("PAYSLIP", 105, 25, { align: 'center' });

        // Reset Text
        doc.setTextColor(0, 0, 0);

        // Employee Info
        doc.setFontSize(12);
        doc.text(`Employee: ${employeeData?.name}`, 14, 55);
        doc.text(`Wallet: ${employeeData?.wallet_address}`, 14, 62);
        doc.text(`Date: ${new Date(payment.created_at).toLocaleDateString()}`, 14, 69);
        doc.text(`Payment ID: #${String(payment.id).slice(0, 8)}`, 14, 76);

        // Financials table
        autoTable(doc, {
            startY: 90,
            head: [['Description', 'Network', 'Reference', 'Amount']],
            body: [[
                'Payroll Disbursement',
                payment.chain,
                payment.tx_hash === 'pending' ? 'Pending' : payment.tx_hash.slice(0, 16) + '...',
                formatCurrency(payment.amount)
            ]],
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] }
        });

        // Summary
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Net Pay: ${formatCurrency(payment.amount)}`, 140, finalY);

        doc.save(`Payslip_${String(payment.id).slice(0, 6)}.pdf`);
    };

    // Handle Login
    const handleConnect = () => {
        connect({ connector: injected() });
    };

    if (!isConnected) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Wallet className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Employee Portal</h1>
                    <p className="text-muted-foreground max-w-md">
                        Connect your wallet to view your payslips, manage your preferences, and track incoming payments.
                    </p>
                    <Button size="lg" onClick={handleConnect} className="gap-2">
                        <Wallet className="w-4 h-4" />
                        Connect Wallet
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-8">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Portal</h1>
                        <p className="text-muted-foreground">Welcome back, {employeeData?.name || formatAddress(address)}</p>
                    </div>
                    {employeeData && (
                        <Badge variant="outline" className="px-3 py-1 text-sm border-emerald-500 text-emerald-600 bg-emerald-50">
                            Verified Employee
                        </Badge>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : !employeeData ? (
                    <Card className="p-8 text-center border-dashed border-2">
                        <div className="flex flex-col items-center gap-4">
                            <XCircle className="w-12 h-12 text-muted-foreground/50" />
                            <h3 className="text-lg font-semibold">Access Denied</h3>
                            <p className="text-muted-foreground max-w-sm">
                                This wallet address ({formatAddress(address)}) is not linked to any active employee record.
                                Please contact your administrator.
                            </p>
                            <Button variant="outline" onClick={() => disconnect()}>Disconnect</Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-3">

                        {/* PROFILE CARD */}
                        <div className="md:col-span-1 space-y-6">
                            {/* DIGITAL ID CARD */}
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl p-6 border border-slate-700">
                                {/* Holographic effect overlay */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-bold mb-4 shadow-inner">
                                        {employeeData.name.charAt(0)}
                                    </div>
                                    <h2 className="text-xl font-bold tracking-wide">{employeeData.name}</h2>
                                    <p className="text-xs text-slate-400 font-mono mt-1 mb-6">
                                        {formatAddress(employeeData.wallet_address)}
                                    </p>

                                    <div className="w-full grid grid-cols-2 gap-2 text-center">
                                        <div className="bg-white/5 rounded-lg p-2">
                                            <p className="text-[10px] uppercase text-slate-400">Role</p>
                                            <p className="font-medium text-sm">{employeeData.role || 'Staff'}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-2">
                                            <p className="text-[10px] uppercase text-slate-400">Status</p>
                                            <div className="flex items-center justify-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="font-medium text-sm capitalize">{employeeData.status}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full mt-6 pt-6 border-t border-white/10 flex justify-between items-end">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-emerald-400" />
                                            <span className="font-bold tracking-widest text-sm">PAYROLLED</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500">ID: {String(employeeData.id).slice(0, 8)}</div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* MAIN CONTENT TABS */}
                        <div className="md:col-span-2">
                            <Tabs defaultValue="history" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1">
                                    <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 font-semibold">
                                        <Clock className="w-4 h-4 mr-2" />
                                        Payment History
                                    </TabsTrigger>
                                    <TabsTrigger value="ens" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 font-semibold">
                                        <Globe className="w-4 h-4 mr-2" />
                                        ENS Configuration
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="history">
                                    <Card className="flex flex-col border-emerald-100">
                                        <div className="p-6 border-b flex items-center gap-2 bg-emerald-50/50">
                                            <DollarSign className="w-5 h-5 text-emerald-600" />
                                            <h3 className="font-semibold text-emerald-900">Payment History</h3>
                                        </div>
                                        <div className="p-0 flex-1">
                                            {paymentHistory.length === 0 ? (
                                                <div className="p-12 text-center text-muted-foreground italic">
                                                    No payments received yet.
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-emerald-50">
                                                    {paymentHistory.map((payment) => (
                                                        <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-emerald-50/30 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-900">{formatCurrency(payment.amount)}</div>
                                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {formatDate(payment.created_at)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right flex flex-col items-end gap-2">
                                                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-white border-emerald-100 text-emerald-700">
                                                                    {payment.chain}
                                                                </Badge>
                                                                <div className="flex items-center gap-2">
                                                                    {payment.tx_hash !== 'pending' && (
                                                                        <a
                                                                            href={payment.chain.includes('Base') ? `https://sepolia.basescan.org/tx/${payment.tx_hash}` : `https://testnet.arcscan.app/tx/${payment.tx_hash}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="text-xs text-blue-500 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                                                                        >
                                                                            Explorer <ExternalLink className="w-3 h-3" />
                                                                        </a>
                                                                    )}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100"
                                                                        title="Download Payslip"
                                                                        onClick={() => downloadPayslip(payment)}
                                                                    >
                                                                        <Download className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="ens">
                                    <Card className="p-8 border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
                                                <Globe className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900">ENS Payroll Configuration</h3>
                                                <p className="text-sm text-slate-500">Self-sovereign settings fetched directly from ENS text records.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6 max-w-lg">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Preferred Chain</p>
                                                    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-emerald-100 shadow-sm">
                                                        <span className="font-mono text-emerald-600 font-bold">
                                                            {preferredChainId === 84532 ? 'Base Sepolia' : preferredChainId?.toString() || 'Default (Arc)'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Payroll Currency</p>
                                                    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-emerald-100 shadow-sm">
                                                        <span className="font-mono text-slate-700 font-bold">{preferredCurrency || 'USDC'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                                <h4 className="text-sm font-bold text-emerald-900 mb-2">How it works</h4>
                                                <p className="text-xs text-emerald-800 leading-relaxed">
                                                    We read <code className="bg-emerald-100 px-1 rounded">payroll.chain</code> and <code className="bg-emerald-100 px-1 rounded">payroll.currency</code> from your ENS text records.
                                                    You are in full control of where your salary is delivered.
                                                </p>
                                            </div>

                                            {ensName ? (
                                                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 py-6 text-lg">
                                                    <a href={`https://app.ens.domains/${ensName}`} target="_blank" rel="noreferrer">
                                                        Edit Records on ENS <ExternalLink className="w-5 h-5 ml-2" />
                                                    </a>
                                                </Button>
                                            ) : (
                                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 text-sm flex gap-3">
                                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                                    <p>Connect a wallet with an ENS name to configure your payroll preferences on-chain.</p>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>

                    </div>
                )}
            </div>
        </Layout>
    );
}
