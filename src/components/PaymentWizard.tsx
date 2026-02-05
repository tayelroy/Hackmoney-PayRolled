import { useState, useMemo, useEffect } from 'react';
import { useAccount, usePublicClient, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { normalize } from 'viem/ens';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Loader2, ArrowRight, Wallet, Globe, AlertCircle } from 'lucide-react';
import { usePayroll } from '@/hooks/usePayroll';
import { useBridgeKit } from '@/hooks/useBridgeKit';
import { Employee, supabase } from '@/lib/supabase';

interface PaymentWizardProps {
    employees: Employee[];
    totalAmount: number;
}

type WizardStep = 'REVIEW' | 'PAYING_ARC' | 'PAYING_BRIDGE' | 'COMPLETE';

export function PaymentWizard({ employees, totalAmount }: PaymentWizardProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<WizardStep>('REVIEW');
    const [processedSteps, setProcessedSteps] = useState<string[]>([]);

    const { isConnected, chainId } = useAccount();
    const { switchChain } = useSwitchChain();
    const publicClient = usePublicClient({ chainId: 11155111 }); // Sepolia lookup

    // Hooks
    const { batchPay, isWritePending: isArcPending, isConfirming: isArcConfirming, isConfirmed: isArcConfirmed, hash: arcHash } = usePayroll();
    const { transfer: bridgeTransfer, status: bridgeStatus } = useBridgeKit();

    // Internal State for Classification
    const [classified, setClassified] = useState<{
        arc: Employee[];
        crossChain: { emp: Employee; chainId: number }[];
    } | null>(null);

    const [isClassifying, setIsClassifying] = useState(false);

    // CLASSIFY EMPLOYEES ON OPEN
    const classifyEmployees = async () => {
        setIsClassifying(true);
        const arc: Employee[] = [];
        const crossChain: { emp: Employee; chainId: number }[] = [];

        for (const emp of employees) {
            let chainId = 5042002; // Default Arc
            try {
                if (publicClient && emp.wallet_address) {
                    // Mock ENS lookup logic or verify strict address pattern
                    // For now assuming existing logic:
                    const ensName = await publicClient.getEnsName({ address: emp.wallet_address as `0x${string}` });
                    if (ensName) {
                        const record = await publicClient.getEnsText({ name: normalize(ensName), key: 'payroll.chain' });
                        if (record && record !== '5042002') {
                            chainId = parseInt(record);
                        }
                    }
                }
            } catch (e) {
                console.warn("Classification failed for", emp.name);
            }

            if (chainId === 5042002) {
                arc.push(emp);
            } else {
                crossChain.push({ emp, chainId });
            }
        }

        setClassified({ arc, crossChain });
        setIsClassifying(false);
    };

    const startProcess = async () => {
        if (!classified) return;

        // STEP 1: PAY ARC
        if (classified.arc.length > 0) {
            setStep('PAYING_ARC');
            try {
                const targets = classified.arc.map(e => e.wallet_address);
                const values = classified.arc.map(e => e.salary.toString());
                const datas = classified.arc.map(() => "0x");
                const total = classified.arc.reduce((sum, e) => sum + parseEther(e.salary.toString()), 0n);

                await batchPay(targets, values, datas, total);
                // We now handle the transition in a useEffect watching isArcConfirmed
            } catch (e) {
                console.error("Arc Payment Failed", e);
                return;
            }
        } else {
            // Skip to Step 2
            handleArcComplete();
        }
    };

    // Called manually or by effect when Arc is done
    const handleArcComplete = async () => {
        // Record Arc payments in history
        if (classified?.arc && classified.arc.length > 0 && arcHash) {
            const historyRecords = classified.arc.map(emp => ({
                employee_id: emp.id,
                amount: emp.salary,
                tx_hash: arcHash,
                chain: 'Arc Testnet',
                status: 'Paid',
                recipient_address: emp.wallet_address
            }));

            const { error } = await supabase.from('payment_history').insert(historyRecords);
            if (error) console.error("Failed to record Arc history", error);
        }

        setProcessedSteps(prev => [...prev, 'ARC']);
        if (classified?.crossChain && classified.crossChain.length > 0) {
            setStep('PAYING_BRIDGE');
            processBridgeQueue();
        } else {
            setStep('COMPLETE');
        }
    };

    // Process Bridge Queue
    const processBridgeQueue = async () => {
        if (!classified) return;

        // We execute them one by one? Or parallel?
        // Parallel might trigger same nonce issues or rate limits.
        // Safe sequential.
        for (const item of classified.crossChain) {
            // 1. Insert initial "Processing" record
            const { data: historyItem, error: insertError } = await supabase
                .from('payment_history')
                .insert({
                    employee_id: item.emp.id,
                    amount: item.emp.salary,
                    tx_hash: 'pending',
                    chain: item.chainId === 84532 ? 'Base Sepolia' : 'Ethereum Sepolia',
                    status: 'Processing (CCTP)',
                    recipient_address: item.emp.wallet_address
                })
                .select()
                .single();

            if (insertError) console.error("Failed to insert initial bridge history", insertError);

            try {
                console.log(`Bridging to ${item.emp.name} on ${item.chainId}`);
                const result = await bridgeTransfer(item.emp.salary.toString(), item.emp.wallet_address, item.chainId);

                // 2. Update record to "Paid"
                if (result && historyItem) {
                    console.log("[PaymentWizard] Bridge Result:", result);
                    // Extract source hash from the 'burn' step
                    const burnStep = (result as any).steps?.find((s: any) => s.name === 'burn');
                    const finalHash = burnStep?.txHash ||
                        (result as any).srcTxHash ||
                        'pending';

                    const { error: updateError } = await supabase
                        .from('payment_history')
                        .update({
                            status: 'Paid',
                            tx_hash: finalHash
                        })
                        .eq('id', historyItem.id);

                    if (updateError) console.error("Failed to update bridge history", updateError);
                } else if (result) {
                    const burnStep = (result as any).steps?.find((s: any) => s.name === 'burn');
                    const finalHash = burnStep?.txHash ||
                        (result as any).srcTxHash ||
                        'pending';

                    // Fallback if initial insert failed or result came back but historyItem is null
                    await supabase.from('payment_history').insert({
                        employee_id: item.emp.id,
                        amount: item.emp.salary,
                        tx_hash: finalHash,
                        chain: item.chainId === 84532 ? 'Base Sepolia' : 'Ethereum Sepolia',
                        status: 'Paid',
                        recipient_address: item.emp.wallet_address
                    });
                }
            } catch (e) {
                console.error("Bridge Failed for", item.emp.name, e);
                if (historyItem) {
                    await supabase
                        .from('payment_history')
                        .update({ status: 'Failed' })
                        .eq('id', historyItem.id);
                }
            }
        }
        setStep('COMPLETE');
    };

    // Auto-advance if Arc payment is confirmed
    useEffect(() => {
        if (step === 'PAYING_ARC' && isArcConfirmed && !processedSteps.includes('ARC')) {
            handleArcComplete();
        }
    }, [step, isArcConfirmed, processedSteps, handleArcComplete]);

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v);
            if (v) classifyEmployees();
            else setStep('REVIEW'); // Reset on close
        }}>
            <DialogTrigger asChild>
                <Button
                    size="lg"
                    className="shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[200px]"
                    disabled={!isConnected || employees.length === 0}
                >
                    Pay {employees.length} Employees
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Processing Payroll</DialogTitle>
                    <DialogDescription>
                        Sequential Payment Flow to ensure safety.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* CLASSIFYING SPINNER */}
                    {isClassifying && (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    )}

                    {/* REVIEW STEP */}
                    {!isClassifying && step === 'REVIEW' && classified && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="p-4 bg-slate-50 border-slate-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Wallet className="w-4 h-4 text-emerald-600" />
                                        <span className="font-semibold text-sm">Same-Chain (Arc)</span>
                                    </div>
                                    <div className="text-2xl font-bold">{classified.arc.length}</div>
                                    <div className="text-xs text-muted-foreground">Batch Transaction</div>
                                </Card>
                                <Card className="p-4 bg-slate-50 border-slate-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Globe className="w-4 h-4 text-blue-600" />
                                        <span className="font-semibold text-sm">Cross-Chain</span>
                                    </div>
                                    <div className="text-2xl font-bold">{classified.crossChain.length}</div>
                                    <div className="text-xs text-muted-foreground">BridgeKit Transfers</div>
                                </Card>
                            </div>
                            {chainId !== 5042002 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <div className="text-sm">
                                            <p className="font-semibold">Wrong Network</p>
                                            <p>Please switch to Arc Testnet to process local payments.</p>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                                        size="lg"
                                        onClick={() => switchChain({ chainId: 5042002 })}
                                    >
                                        Switch to Arc Testnet
                                    </Button>
                                </div>
                            ) : (
                                <Button className="w-full" size="lg" onClick={startProcess}>
                                    Start Payments <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    )}

                    {/* PROGRESS STEPS */}
                    {step !== 'REVIEW' && (
                        <div className="space-y-4">
                            {/* STEP 1: ARC */}
                            {classified?.arc.length ? (
                                <Card className={`p-4 border transition-colors ${step === 'PAYING_ARC' ? 'border-blue-500 bg-blue-50' :
                                    processedSteps.includes('ARC') ? 'border-emerald-500 bg-emerald-50' : 'opacity-50'
                                    }`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="font-semibold">Step 1: Arc Payments</span>
                                            <span className="text-xs text-muted-foreground">Paying {classified.arc.length} local employees</span>
                                        </div>
                                        {processedSteps.includes('ARC') ? (
                                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                        ) : step === 'PAYING_ARC' ? (
                                            isArcConfirming || isArcPending ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                            ) : (
                                                <div className="text-xs text-muted-foreground italic">Awaiting wallet...</div>
                                            )
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                                        )}
                                    </div>
                                    {step === 'PAYING_ARC' && isArcConfirming && (
                                        <p className="text-xs text-blue-600 mt-2">Waiting for transaction confirmation...</p>
                                    )}
                                </Card>
                            ) : null}

                            {/* STEP 2: BRIDGE */}
                            {classified?.crossChain.length ? (
                                <Card className={`p-4 border transition-colors ${step === 'PAYING_BRIDGE' ? 'border-blue-500 bg-blue-50' :
                                    step === 'COMPLETE' ? 'border-emerald-500 bg-emerald-50' : 'opacity-50'
                                    }`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="font-semibold">Step 2: Cross-Chain Bridge</span>
                                            <span className="text-xs text-muted-foreground">Bridging to {classified.crossChain.length} remote employees</span>
                                        </div>
                                        {step === 'COMPLETE' ? (
                                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                        ) : step === 'PAYING_BRIDGE' ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                                        )}
                                    </div>
                                    {step === 'PAYING_BRIDGE' && (
                                        <div className="mt-2 space-y-2">
                                            <p className="text-xs text-blue-600">
                                                Follow wallet prompts to switch chain and bridge.
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Note: Attestation can take ~60s. Do not close.
                                            </p>
                                        </div>
                                    )}
                                    {step === 'COMPLETE' && classified?.crossChain.length > 0 && (
                                        <div className="mt-2 text-center">
                                            <a
                                                href="https://cctp.circle.com/?network=TESTNET"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-500 hover:underline flex items-center justify-center gap-1"
                                            >
                                                Check Transfer Status (Circle CCTP) <Globe className="w-3 h-3" />
                                            </a>
                                        </div>
                                    )}
                                </Card>
                            ) : null}
                        </div>
                    )}

                    {step === 'COMPLETE' && (
                        <div className="text-center p-4">
                            <div className="inline-flex p-3 bg-emerald-100 rounded-full mb-3">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="font-bold text-lg">Payroll Complete!</h3>
                            <p className="text-muted-foreground text-sm">All payments processed successfully.</p>
                            <Button className="mt-4" variant="outline" onClick={() => setOpen(false)}>
                                Close
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
