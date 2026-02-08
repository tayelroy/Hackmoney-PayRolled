import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Droplets, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAddLiquidity } from '@/hooks/useAddLiquidity';
import { useAccount, useChainId, useSwitchChain, useReadContract } from 'wagmi';
import { UNISWAP_V4_BASE_SEPOLIA, ERC20_ABI } from '@/lib/uniswap-v4';
import { formatUnits } from 'viem';

interface AddLiquidityModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddLiquidityModal({ open, onOpenChange }: AddLiquidityModalProps) {
    const { address } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const [usdcAmount, setUsdcAmount] = useState('');
    const [wethAmount, setWethAmount] = useState('');
    const { addLiquidity, status, error, txHash, reset } = useAddLiquidity();
    const [isSwitching, setIsSwitching] = useState(false);

    // Get balances
    const { data: usdcBalanceRaw } = useReadContract({
        address: UNISWAP_V4_BASE_SEPOLIA.USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: UNISWAP_V4_BASE_SEPOLIA.CHAIN_ID,
    });

    const { data: wethBalanceRaw } = useReadContract({
        address: UNISWAP_V4_BASE_SEPOLIA.WETH as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: UNISWAP_V4_BASE_SEPOLIA.CHAIN_ID,
    });

    const usdcBalance = usdcBalanceRaw ? formatUnits(usdcBalanceRaw as bigint, 6) : '0';
    const wethBalance = wethBalanceRaw ? formatUnits(wethBalanceRaw as bigint, 18) : '0';

    const needsChainSwitch = chainId !== UNISWAP_V4_BASE_SEPOLIA.CHAIN_ID;

    const handleSwitchChain = async () => {
        setIsSwitching(true);
        try {
            await switchChain({ chainId: UNISWAP_V4_BASE_SEPOLIA.CHAIN_ID });
        } catch (err) {
            console.error('Failed to switch chain:', err);
        } finally {
            setIsSwitching(false);
        }
    };

    const handleAddLiquidity = async () => {
        console.log('UNISWAP_V4_BASE_SEPOLIA:', UNISWAP_V4_BASE_SEPOLIA);
        console.log('Addresses:', {
            USDC: UNISWAP_V4_BASE_SEPOLIA?.USDC,
            WETH: UNISWAP_V4_BASE_SEPOLIA?.WETH
        });

        if (!usdcAmount || !wethAmount || !address) return;

        await addLiquidity({
            token0Address: UNISWAP_V4_BASE_SEPOLIA.USDC,
            token1Address: UNISWAP_V4_BASE_SEPOLIA.WETH,
            amount0: usdcAmount,
            amount1: wethAmount,
            decimals0: 6,
            decimals1: 18,
        });
    };

    const handleClose = () => {
        reset();
        setUsdcAmount('');
        setWethAmount('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-blue-600" />
                        Add Liquidity to USDC/WETH Pool
                    </DialogTitle>
                    <DialogDescription>
                        Create a new liquidity position on Uniswap v4 (Base Sepolia)
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Chain Switch Required */}
                    {needsChainSwitch && (
                        <Alert className="border-orange-200 bg-orange-50">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                                <p className="font-medium mb-2">Switch to Base Sepolia</p>
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
                                        'Switch Network'
                                    )}
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Balance Display */}
                    {!needsChainSwitch && (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <div className="text-xs text-slate-500">USDC Balance</div>
                                <div className="font-medium">{parseFloat(usdcBalance).toFixed(2)}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <div className="text-xs text-slate-500">WETH Balance</div>
                                <div className="font-medium">{parseFloat(wethBalance).toFixed(6)}</div>
                            </div>
                        </div>
                    )}

                    {/* Amount Inputs */}
                    {!needsChainSwitch && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="usdc-amount">USDC Amount</Label>
                                <Input
                                    id="usdc-amount"
                                    type="number"
                                    placeholder="100.00"
                                    value={usdcAmount}
                                    onChange={(e) => setUsdcAmount(e.target.value)}
                                    disabled={status !== 'idle'}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="weth-amount">WETH Amount</Label>
                                <Input
                                    id="weth-amount"
                                    type="number"
                                    placeholder="0.05"
                                    value={wethAmount}
                                    onChange={(e) => setWethAmount(e.target.value)}
                                    disabled={status !== 'idle'}
                                />
                            </div>
                        </>
                    )}

                    {/* Status Messages */}
                    {status === 'approving' && (
                        <Alert>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertDescription>Approving tokens...</AlertDescription>
                        </Alert>
                    )}

                    {status === 'adding' && (
                        <Alert>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertDescription>Adding liquidity to pool...</AlertDescription>
                        </Alert>
                    )}

                    {status === 'success' && (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Liquidity added successfully!
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <div className="font-medium text-blue-900 mb-1">Pool Details</div>
                        <ul className="text-blue-700 space-y-1 text-xs">
                            <li>• Fee: 1% (10000 bps)</li>
                            <li>• Tick Spacing: 200</li>
                            <li>• Full Range Position</li>
                            <li>• Creates pool if doesn't exist</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={status === 'approving' || status === 'adding'}
                    >
                        {status === 'success' ? 'Close' : 'Cancel'}
                    </Button>
                    {status !== 'success' && (
                        <Button
                            onClick={handleAddLiquidity}
                            disabled={
                                !usdcAmount ||
                                !wethAmount ||
                                parseFloat(usdcAmount) <= 0 ||
                                parseFloat(wethAmount) <= 0 ||
                                status !== 'idle' ||
                                needsChainSwitch
                            }
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {status === 'approving' || status === 'adding' ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Add Liquidity'
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
