import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAaveDirect } from '@/hooks/useAaveDirect';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { AAVE_BASE_SEPOLIA } from '@/lib/aave';

interface AaveDepositModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    usdcTokenAddress?: string;
}

const BASE_SEPOLIA_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

export function AaveDepositModal({ open, onOpenChange, usdcTokenAddress = BASE_SEPOLIA_USDC }: AaveDepositModalProps) {
    const { address } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const [amount, setAmount] = useState('');
    const { depositToAave, status, error, txHash, reset } = useAaveDirect();
    const [needsChainSwitch, setNeedsChainSwitch] = useState(false);

    // Check if on correct chain when modal opens
    useEffect(() => {
        console.log('[Aave Modal] Chain check:', {
            open,
            currentChainId: chainId,
            expectedChainId: AAVE_BASE_SEPOLIA.CHAIN_ID,
            needsSwitch: chainId !== AAVE_BASE_SEPOLIA.CHAIN_ID
        });

        if (open && chainId !== AAVE_BASE_SEPOLIA.CHAIN_ID) {
            setNeedsChainSwitch(true);
        } else {
            setNeedsChainSwitch(false);
        }
    }, [open, chainId]);

    const [isSwitching, setIsSwitching] = useState(false);

    const handleSwitchChain = async () => {
        setIsSwitching(true);
        try {
            console.log('[Aave Modal] Attempting to switch to Base Sepolia:', AAVE_BASE_SEPOLIA.CHAIN_ID);
            if (!switchChain) {
                console.error('[Aave Modal] switchChain is undefined');
                alert('Chain switching not available. Please manually switch to Base Sepolia in your wallet.');
                setIsSwitching(false);
                return;
            }

            console.log('[Aave Modal] Calling switchChain...');
            await switchChain({ chainId: AAVE_BASE_SEPOLIA.CHAIN_ID });
            console.log('[Aave Modal] Successfully switched to Base Sepolia');
            setNeedsChainSwitch(false);
        } catch (err: any) {
            console.error('[Aave Modal] Failed to switch chain:', err);
            // User rejected the request
            if (err.code === 4001) {
                console.log('[Aave Modal] User rejected chain switch');
            } else {
                alert(`Failed to switch chain: ${err.message || 'Unknown error'}`);
            }
        } finally {
            setIsSwitching(false);
        }
    };

    const handleDeposit = async () => {
        if (!amount || !address || !usdcTokenAddress) return;

        // Convert amount to USDC smallest units (6 decimals)
        const usdcAmount = (parseFloat(amount) * 1_000_000).toString();

        // Call direct deposit with amount string
        await depositToAave(amount);
    };

    const handleClose = () => {
        reset();
        setAmount('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Deposit to Aave
                    </DialogTitle>
                    <DialogDescription>
                        Convert your USDC to WETH and automatically supply it to Aave for yield
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Chain Switch Required */}
                    {needsChainSwitch && (
                        <Alert className="border-orange-200 bg-orange-50">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                                <p className="font-medium mb-2">Switch to Base Sepolia Required</p>
                                <p className="text-sm mb-3">
                                    Aave deposits are only available on Base Sepolia testnet. Please switch your network to continue.
                                </p>
                                <Button
                                    onClick={handleSwitchChain}
                                    className="bg-orange-600 hover:bg-orange-700"
                                    size="sm"
                                    disabled={isSwitching}
                                >
                                    {isSwitching ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Switching...
                                        </>
                                    ) : (
                                        'Switch to Base Sepolia'
                                    )}
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Amount Input - only show if on correct chain */}
                    {!needsChainSwitch && (
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (USDC)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="10.00"
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={status !== 'idle' && status !== 'error'}
                            />
                            <p className="text-xs text-muted-foreground">
                                Directly supply USDC to Aave V3 on Base Sepolia
                            </p>
                        </div>
                    )}

                    {/* Status Messages */}
                    {status === 'approving' && (
                        <Alert>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertDescription>Approving USDC for Aave...</AlertDescription>
                        </Alert>
                    )}

                    {status === 'depositing' && (
                        <Alert>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertDescription>Supplying USDC to Aave Pool...</AlertDescription>
                        </Alert>
                    )}

                    {status === 'success' && (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Successfully deposited to Aave!
                                {txHash && (
                                    <a
                                        href={`https://sepolia.basescan.org/tx/${txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline ml-1"
                                    >
                                        View transaction
                                    </a>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <div className="font-medium text-blue-900 mb-1">How it works:</div>
                        <ul className="text-blue-700 space-y-1 text-xs">
                            <li>• Approve USDC for Aave Pool</li>
                            <li>• Supply USDC directly to Aave V3</li>
                            <li>• Receive aUSDC (interest-bearing)</li>
                            <li>• Earn yield on Base Sepolia</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={status === 'approving' || status === 'depositing'}
                    >
                        {status === 'success' ? 'Close' : 'Cancel'}
                    </Button>
                    {status !== 'success' && (
                        <Button
                            onClick={handleDeposit}
                            disabled={!amount || parseFloat(amount) <= 0 || status !== 'idle' && status !== 'error' || needsChainSwitch}
                        >
                            {status === 'approving' ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Approving...
                                </>
                            ) : status === 'depositing' ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Depositing...
                                </>
                            ) : (
                                'Deposit to Aave'
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
