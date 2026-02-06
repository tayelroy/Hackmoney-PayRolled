import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatAddress } from '@/lib/index';
import { Loader2, Wallet, DollarSign, Calendar, CheckCircle2, Clock, XCircle, Download, ExternalLink } from 'lucide-react';
import { injected } from 'wagmi/connectors';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function EmployeeHistory() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();

    const [loading, setLoading] = useState(false);
    const [employeeData, setEmployeeData] = useState<any | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetchMyData = async () => {
            if (!address) return;
            setLoading(true);
            try {
                const { data: emp, error: empError } = await supabase
                    .from('employees')
                    .select('*')
                    .ilike('wallet_address', address)
                    .single();

                if (!empError && emp) {
                    setEmployeeData(emp);
                    const { data: history, error: histError } = await supabase
                        .from('payment_history')
                        .select('*')
                        .eq('employee_id', emp.id)
                        .order('created_at', { ascending: false });

                    setPaymentHistory(history || []);
                }
            } catch (e) {
                console.error("History Page Error:", e);
            } finally {
                setLoading(false);
            }
        };

        if (isConnected && address) {
            fetchMyData();
        }
    }, [address, isConnected]);

    const downloadPayslip = (payment: any) => {
        const doc = new jsPDF();
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text("PAYSLIP", 105, 25, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`Employee: ${employeeData?.name}`, 14, 55);
        doc.text(`Wallet: ${employeeData?.wallet_address}`, 14, 62);
        doc.text(`Date: ${new Date(payment.created_at).toLocaleDateString()}`, 14, 69);
        doc.text(`Payment ID: #${String(payment.id).slice(0, 8)}`, 14, 76);

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

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Net Pay: ${formatCurrency(payment.amount)}`, 140, finalY);
        doc.save(`Payslip_${String(payment.id).slice(0, 6)}.pdf`);
    };

    if (!isConnected) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Wallet className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Access Required</h1>
                    <p className="text-muted-foreground max-w-md">Connect your wallet to view your payment history.</p>
                    <Button onClick={() => connect({ connector: injected() })}>Connect Wallet</Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payment History</h1>
                    <p className="text-muted-foreground">View and download your institutional payslips.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Card className="flex flex-col border-emerald-100 shadow-sm">
                        <div className="p-6 border-b flex items-center gap-2 bg-emerald-50/50">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-semibold text-emerald-900">My Disbursements</h3>
                        </div>
                        <div className="p-0">
                            {paymentHistory.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground italic">
                                    No payments found for this account.
                                </div>
                            ) : (
                                <div className="divide-y divide-emerald-50">
                                    {paymentHistory.map((payment) => (
                                        <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-emerald-50/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-emerald-100 rounded-full text-emerald-600 shadow-sm border border-emerald-200">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-lg">{formatCurrency(payment.amount)}</div>
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
                                                            className="text-xs text-blue-500 hover:text-blue-700 font-semibold flex items-center gap-1"
                                                        >
                                                            Explorer <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100"
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
                )}
            </div>
        </Layout>
    );
}
