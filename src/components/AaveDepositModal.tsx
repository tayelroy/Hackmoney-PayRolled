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
    // Check if on Base Sepolia
    const isBaseSepolia = chainId === AAVE_BASE_SEPOLIA.CHAIN_ID;
    const needsChainSwitch = open && !isBaseSepolia;

    const [isSwitching, setIsSwitching] = useState(false);

    const handleSwitchChain = async () => {
        setIsSwitching(true);
        try {
            await switchChain({ chainId: AAVE_BASE_SEPOLIA.CHAIN_ID });
        } catch (err: any) {
            console.error('[Aave Modal] Failed to switch chain:', err);
        } finally {
            setIsSwitching(false);
        }
    };



    // Removed old extensive logging switchChain logic to keep it clean
    // The implementation above handles it.

    const handleDeposit = async () => {
        if (!amount || !address) return;

        // Determine correct token address based on chain
        // defaulting to the prop if we are on an unknown chain (fallback)
        let targetTokenAddress = usdcTokenAddress;
        if (chainId === AAVE_BASE_SEPOLIA.CHAIN_ID) {
            targetTokenAddress = AAVE_BASE_SEPOLIA.USDC;
        }

        if (!targetTokenAddress) return;

        // Convert amount to USDC smallest units (6 decimals)
        const usdcAmount = (parseFloat(amount) * 1_000_000).toString();

        // Call direct deposit with amount string and token address
        await depositToAave(amount, targetTokenAddress);
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
                            <AlertDescription>Approving tokens...</AlertDescription>
                        </Alert>
                    )}

                    {status === 'error' && error?.includes('allowance') && (
                        <Alert className="border-yellow-200 bg-yellow-50">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-800">
                                <span className="font-bold">Approve Failed:</span> You might not have enough ETH for gas.
                            </AlertDescription>
                        </Alert>
                    )}

                    {status === 'error' && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {error || 'Transaction failed'}
                            </AlertDescription>
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
                            disabled={!amount || parseFloat(amount) <= 0 || status !== 'idle' && status !== 'error' || !isBaseSepolia}
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
