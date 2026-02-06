
import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatAddress } from '@/lib/index';
import { Loader2, Wallet, DollarSign, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { injected } from 'wagmi/connectors';

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
                        <Card className="p-6 md:col-span-1 space-y-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
                                    {employeeData.name.charAt(0)}
                                </div>
                                <h2 className="text-xl font-bold">{employeeData.name}</h2>
                                <p className="text-sm text-muted-foreground break-all font-mono mt-1">
                                    {formatAddress(employeeData.wallet_address)}
                                </p>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <Badge>{employeeData.status}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Base Salary</span>
                                    <span className="font-mono font-medium">{formatCurrency(employeeData.salary)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Joined</span>
                                    <span className="text-sm">{new Date(employeeData.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </Card>

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
                                                <div className="text-right">
                                                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                        {payment.chain}
                                                    </div>
                                                    {payment.tx_hash !== 'pending' && (
                                                        <a
                                                            href={`https://testnet.arcscan.app/tx/${payment.tx_hash}`} // TODO: Dynamic explorer based on chain
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-blue-500 hover:underline"
                                                        >
                                                            View TX
                                                        </a>
                                                    )}
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
