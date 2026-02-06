
import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatAddress } from '@/lib/index';
import { Loader2, Wallet, DollarSign, Calendar, CheckCircle2, Clock, XCircle, FileText, Download, Building2, CreditCard, ExternalLink } from 'lucide-react';
import { injected } from 'wagmi/connectors';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function EmployeePortal() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();

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

    const totalEarnings = paymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);

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

                            {/* TOTAL EARNINGS CARD */}
                            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-emerald-600 font-medium">Lifetime Earnings</p>
                                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalEarnings)}</p>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[70%]" />
                                </div>
                                <p className="text-xs text-emerald-600 mt-2 text-right">Top 10% of Earners</p>
                            </Card>
                        </div>

                        {/* PAYMENT HISTORY */}
                        <Card className="md:col-span-2 flex flex-col">
                            <div className="p-6 border-b flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-semibold">Payment History</h3>
                            </div>
                            <div className="p-0 flex-1">
                                {paymentHistory.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No payments received yet.
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {paymentHistory.map((payment) => (
                                            <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{formatCurrency(payment.amount)}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDate(payment.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                        {payment.chain}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {payment.tx_hash !== 'pending' && (
                                                            <a
                                                                href={payment.chain.includes('Base') ? `https://sepolia.basescan.org/tx/${payment.tx_hash}` : `https://testnet.arcscan.app/tx/${payment.tx_hash}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                                                            >
                                                                Explorer <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-slate-400 hover:text-emerald-600"
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

                    </div>
                )}
            </div>
        </Layout>
    );
}
