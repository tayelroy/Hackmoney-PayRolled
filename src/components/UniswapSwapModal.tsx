import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowRightLeft, AlertCircle, CheckCircle2, ArrowDown, TrendingDown } from 'lucide-react';
import { useUniswapV4Swap } from '@/hooks/useUniswapV4Swap';
import { useAccount, useChainId, useSwitchChain, useReadContract } from 'wagmi';
import { UNISWAP_V4_BASE_SEPOLIA, ERC20_ABI } from '@/lib/uniswap-v4';
import { formatUnits } from 'viem';

interface UniswapSwapModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UniswapSwapModal({ open, onOpenChange }: UniswapSwapModalProps) {
    const { address } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const [amount, setAmount] = useState('');
    const { swap, getQuote, quote, status, error, txHash, reset } = useUniswapV4Swap();
    const [needsChainSwitch, setNeedsChainSwitch] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const [isQuoting, setIsQuoting] = useState(false);

    // Get USDC balance using useReadContract
    const { data: usdcBalanceRaw } = useReadContract({
        address: UNISWAP_V4_BASE_SEPOLIA.USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: UNISWAP_V4_BASE_SEPOLIA.CHAIN_ID,
    });

    const usdcBalance = usdcBalanceRaw ? formatUnits(usdcBalanceRaw as bigint, 6) : '0';

    // Check if on correct chain
    useEffect(() => {
        if (open && chainId !== UNISWAP_V4_BASE_SEPOLIA.CHAIN_ID) {
            setNeedsChainSwitch(true);
        } else {
            setNeedsChainSwitch(false);
        }
    }, [open, chainId]);

    // Fetch quote manually (triggered on blur or button)
    const fetchQuote = useCallback(async (amountValue: string) => {
        if (!amountValue || parseFloat(amountValue) <= 0 || !address) return;

        setIsQuoting(true);
        try {
            await getQuote({
                tokenIn: UNISWAP_V4_BASE_SEPOLIA.USDC,
                tokenOut: UNISWAP_V4_BASE_SEPOLIA.WETH,
                amountIn: amountValue,
                decimalsIn: 6,
                decimalsOut: 18,
            });
        } finally {
            setIsQuoting(false);
        }
    }, [getQuote, address]);

    // Only fetch quote when input loses focus (blur) to prevent repeated calls
    const handleAmountBlur = () => {
        if (amount && parseFloat(amount) > 0 && !needsChainSwitch) {
            fetchQuote(amount);
        }
    };

    const handleSwitchChain = async () => {
        setIsSwitching(true);
        try {
            await switchChain({ chainId: UNISWAP_V4_BASE_SEPOLIA.CHAIN_ID });
            setNeedsChainSwitch(false);
        } catch (err) {
            console.error('Failed to switch chain:', err);
        } finally {
            setIsSwitching(false);
        }
    };

    const handleSwap = async () => {
        if (!amount || !address) return;

        await swap({
            tokenIn: UNISWAP_V4_BASE_SEPOLIA.USDC,
            tokenOut: UNISWAP_V4_BASE_SEPOLIA.WETH,
            amountIn: amount,
            decimalsIn: 6,
        });
    };

    const handleClose = () => {
        reset();
        setAmount('');
        onOpenChange(false);
    };

    // Calculate effective rate from quote
    const effectiveRate = quote && amount && parseFloat(amount) > 0
        ? (parseFloat(quote.amountOutFormatted) / parseFloat(amount)).toFixed(8)
        : null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                        Swap USDC → WETH
                    </DialogTitle>
                    <DialogDescription>
                        Use Uniswap v4 to swap your USDC for WETH on Base Sepolia
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
                                    Uniswap v4 swaps are available on Base Sepolia testnet.
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

                    {/* Balance Display */}
                    {!needsChainSwitch && (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-600">Available USDC:</span>
                            <span className="font-medium">
                                {parseFloat(usdcBalance).toFixed(2)} USDC
                            </span>
                        </div>
                    )}

                    {/* Amount Input */}
                    {!needsChainSwitch && (
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (USDC)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="10.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    onBlur={handleAmountBlur}
                                    disabled={status !== 'idle' && status !== 'quoting'}
                                    className="flex-1"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchQuote(amount)}
                                    disabled={!amount || parseFloat(amount) <= 0 || isQuoting}
                                >
                                    {isQuoting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Quote'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Quote Display */}
                    {!needsChainSwitch && amount && parseFloat(amount) > 0 && (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-center mb-2">
                                <ArrowDown className="w-4 h-4 text-purple-600" />
                            </div>

                            {isQuoting || status === 'quoting' ? (
                                <div className="flex items-center justify-center gap-2 text-purple-600">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Getting quote...</span>
                                </div>
                            ) : quote ? (
                                <div className="space-y-2">
                                    {quote.amountOutFormatted === 'N/A' ? (
                                        <>
                                            <div className="text-center text-amber-600 text-sm font-medium">
                                                Quote unavailable
                                            </div>
                                            <Alert className="border-amber-200 bg-amber-50">
                                                <TrendingDown className="h-3 w-3 text-amber-600" />
                                                <AlertDescription className="text-amber-700 text-xs">
                                                    Quoter doesn't have this pool indexed. Swap may still work—proceed with caution on testnet.
                                                </AlertDescription>
                                            </Alert>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">You will receive:</span>
                                                <span className="font-bold text-lg text-purple-700">
                                                    ~{parseFloat(quote.amountOutFormatted).toFixed(8)} WETH
                                                </span>
                                            </div>
                                            {effectiveRate && (
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <span>Rate:</span>
                                                    <span>1 USDC = {effectiveRate} WETH</span>
                                                </div>
                                            )}
                                            <Alert className="border-amber-200 bg-amber-50 mt-2">
                                                <TrendingDown className="h-3 w-3 text-amber-600" />
                                                <AlertDescription className="text-amber-700 text-xs">
                                                    Testnet pool may have low liquidity.
                                                </AlertDescription>
                                            </Alert>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 text-sm">
                                    Enter an amount to see quote
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status Messages */}
                    {status === 'approving' && (
                        <Alert>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertDescription>Approving USDC spend...</AlertDescription>
                        </Alert>
                    )}

                    {status === 'swapping' && (
                        <Alert>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertDescription>Executing swap on Uniswap v4...</AlertDescription>
                        </Alert>
                    )}

                    {status === 'success' && (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Swap successful!
                                {txHash && (
                                    <a
                                        href={`https://sepolia.basescan.org/tx/${txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline ml-1"
                                    >
                                        View on BaseScan
                                    </a>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    {error && status === 'error' && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Info Box */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
                        <div className="font-medium text-purple-900 mb-1">Uniswap v4 🦄</div>
                        <ul className="text-purple-700 space-y-1 text-xs">
                            <li>• Most efficient DEX on Base</li>
                            <li>• Powered by new singleton architecture</li>
                            <li>• Lower gas fees than v3</li>
                            <li>• Aligned with Agentic Finance track</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={status === 'approving' || status === 'swapping'}
                    >
                        {status === 'success' ? 'Close' : 'Cancel'}
                    </Button>
                    {status !== 'success' && (
                        <Button
                            onClick={handleSwap}
                            disabled={!amount || parseFloat(amount) <= 0 || (status !== 'idle' && status !== 'quoting') || needsChainSwitch || !quote}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {status === 'approving' || status === 'swapping' ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Swap to WETH'
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
