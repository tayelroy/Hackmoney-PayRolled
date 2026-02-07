import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, TrendingUp, Coins, Droplets } from 'lucide-react';
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { UNISWAP_V4_BASE_SEPOLIA, ERC20_ABI } from '@/lib/uniswap-v4';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUnits } from 'viem';

interface UniswapPositionCardProps {
    onSwapClick: () => void;
    onAddLiquidityClick?: () => void;
}

export function UniswapPositionCard({ onSwapClick, onAddLiquidityClick }: UniswapPositionCardProps) {
    const { address } = useAccount();

    // Get USDC balance (ERC20)
    const { data: usdcBalanceRaw, isLoading: usdcLoading, error: usdcError } = useReadContract({
        address: UNISWAP_V4_BASE_SEPOLIA.USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address!],
        chainId: UNISWAP_V4_BASE_SEPOLIA.CHAIN_ID,
        query: {
            enabled: !!address,
        },
    });

    // Get native ETH balance
    const { data: ethBalance, isLoading: ethLoading } = useBalance({
        address,
        chainId: UNISWAP_V4_BASE_SEPOLIA.CHAIN_ID,
    });

    // Debug logging
    useEffect(() => {
        console.log('[UniswapCard] Balance check:', {
            address,
            usdcBalanceRaw,
            ethBalance: ethBalance?.value.toString(),
            usdcError: usdcError?.message,
            chainId: UNISWAP_V4_BASE_SEPOLIA.CHAIN_ID,
        });
    }, [address, usdcBalanceRaw, ethBalance, usdcError]);

    const isLoading = usdcLoading || ethLoading;
    const usdcBalance = usdcBalanceRaw ? formatUnits(usdcBalanceRaw as bigint, 6) : '0';
    const ethBalanceFormatted = ethBalance ? formatUnits(ethBalance.value, 18) : '0';

    return (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                    </div>
                    Uniswap v4 Auto-Invest
                </CardTitle>
                <CardDescription>
                    Automatically swap your USDC to ETH using Uniswap v4 pools
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Balances */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                            <Coins className="w-4 h-4" />
                            USDC Balance
                        </div>
                        {isLoading ? (
                            <Skeleton className="h-6 w-20" />
                        ) : (
                            <div className="text-xl font-bold text-slate-900">
                                {parseFloat(usdcBalance).toFixed(2)}
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            ETH Balance
                        </div>
                        {isLoading ? (
                            <Skeleton className="h-6 w-20" />
                        ) : (
                            <div className="text-xl font-bold text-slate-900">
                                {parseFloat(ethBalanceFormatted).toFixed(6)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Features */}
                <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                        Agent-driven DCA into ETH
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                        Lowest fees on Base with v4
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={onSwapClick}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Swap USDC → WETH
                    </Button>
                    {onAddLiquidityClick && (
                        <Button
                            onClick={onAddLiquidityClick}
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                            <Droplets className="mr-2 h-4 w-4" />
                            Add Liquidity
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

