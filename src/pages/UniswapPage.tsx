import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRightLeft, Droplets, Loader2, RefreshCcw, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { ROUTE_PATHS } from '@/lib/index';
import { UNISWAP_V4_BASE_SEPOLIA, ERC20_ABI } from '@/lib/uniswap-v4';
import { useUniswapV4Swap } from '@/hooks/useUniswapV4Swap';
import { useAddLiquidity } from '@/hooks/useAddLiquidity';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatUnits } from 'viem';

export default function UniswapPage() {
    const navigate = useNavigate();
    const { address, isConnected } = useAccount();

    // Swap State
    const [swapAmount, setSwapAmount] = useState('');
    const { swap, status: swapStatus, error: swapError, txHash: swapTx } = useUniswapV4Swap();

    // Liquidity State
    const [usdcAmount, setUsdcAmount] = useState('');
    const [ethAmount, setEthAmount] = useState('');
    const { addLiquidity, status: lpStatus, error: lpError, txHash: lpTx } = useAddLiquidity();

    // Balances
    const { data: usdcBalanceRaw } = useReadContract({
        address: UNISWAP_V4_BASE_SEPOLIA.USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: UNISWAP_V4_BASE_SEPOLIA.CHAIN_ID,
    });

    const { data: ethBalanceData } = useBalance({
        address,
        chainId: UNISWAP_V4_BASE_SEPOLIA.CHAIN_ID,
    });

    const usdcBalanceFormatted = usdcBalanceRaw ? formatUnits(usdcBalanceRaw as bigint, 6) : '0.00';

    // Handlers
    const handleSwap = async () => {
        if (!swapAmount) return;

        await swap({
            tokenIn: UNISWAP_V4_BASE_SEPOLIA.USDC,
            tokenOut: UNISWAP_V4_BASE_SEPOLIA.WETH,
            amountIn: swapAmount,
            decimalsIn: 6,
        });

        setSwapAmount('');
    };

    const handleAddLiquidity = async () => {
        if (!usdcAmount || !ethAmount) return;
        await addLiquidity(usdcAmount, ethAmount);
        setUsdcAmount('');
        setEthAmount('');
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(ROUTE_PATHS.PORTAL)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Uniswap Auto-Invest</h1>
                        <p className="text-muted-foreground">Swap and provide liquidity on Uniswap v4 (Base Sepolia).</p>
                    </div>
                </div>

                <Tabs defaultValue="swap" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                        <TabsTrigger value="swap">Swap USDC → ETH</TabsTrigger>
                        <TabsTrigger value="liquidity">Provide Liquidity</TabsTrigger>
                    </TabsList>

                    {/* SWAP TAB */}
                    <TabsContent value="swap">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="border-[#cc5db3]/20 bg-gradient-to-br from-white to-[#cc5db3]/5">
                                <CardHeader>
                                    <CardTitle className="text-[#cc5db3] flex items-center gap-2">
                                        <ArrowRightLeft className="w-5 h-5" />
                                        Swap Interface
                                    </CardTitle>
                                    <CardDescription>
                                        Instantly swap your USDC payroll to ETH.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Sell (USDC)</span>
                                            <span
                                                className="text-[#cc5db3] cursor-pointer hover:underline"
                                                onClick={() => setSwapAmount(usdcBalanceFormatted)}
                                            >
                                                Max: {usdcBalanceFormatted}
                                            </span>
                                        </div>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={swapAmount}
                                            onChange={(e) => setSwapAmount(e.target.value)}
                                        />
                                    </div>

                                    {swapError && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{swapError}</AlertDescription>
                                        </Alert>
                                    )}

                                    {swapTx && (
                                        <Alert className="bg-green-50 text-green-700 border-green-200">
                                            <AlertDescription>
                                                Swap Successful! <a href={`https://sepolia.basescan.org/tx/${swapTx}`} target="_blank" className="underline">View TX</a>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <Button
                                        onClick={handleSwap}
                                        className="w-full bg-[#cc5db3] hover:bg-[#cc5db3]/90 text-white"
                                        disabled={!swapAmount || swapStatus === 'approving' || swapStatus === 'swapping'}
                                    >
                                        {swapStatus === 'approving' ? 'Approving...' : swapStatus === 'swapping' ? 'Swapping...' : 'Swap USDC to ETH'}
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Market Stats</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                        <span className="text-sm text-muted-foreground">ETH Price</span>
                                        <span className="font-mono font-bold">~3,250 USDC</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                        <span className="text-sm text-muted-foreground">Network Cost</span>
                                        <span className="font-mono font-bold text-green-600">~$0.01</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* LIQUIDITY TAB */}
                    <TabsContent value="liquidity">
                        <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/20">
                            <CardHeader>
                                <CardTitle className="text-blue-600 flex items-center gap-2">
                                    <Droplets className="w-5 h-5" />
                                    Add Liquidity (USDC/ETH)
                                </CardTitle>
                                <CardDescription>
                                    Earn fees by providing liquidity to the USDC/ETH pool.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">USDC Amount</label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={usdcAmount}
                                            onChange={(e) => setUsdcAmount(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">Balance: {usdcBalanceFormatted}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">ETH Amount</label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={ethAmount}
                                            onChange={(e) => setEthAmount(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">Balance: {ethBalanceData?.formatted ?? '0.00'}</p>
                                    </div>
                                </div>

                                {lpError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{lpError}</AlertDescription>
                                    </Alert>
                                )}

                                {lpTx && (
                                    <Alert className="bg-green-50 text-green-700 border-green-200">
                                        <AlertDescription>
                                            Liquidity Added! <a href={`https://sepolia.basescan.org/tx/${lpTx}`} target="_blank" className="underline">View TX</a>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <Button
                                    onClick={handleAddLiquidity}
                                    className="w-full"
                                    disabled={!usdcAmount || !ethAmount || lpStatus === 'approving' || lpStatus === 'adding'}
                                >
                                    {lpStatus === 'approving' ? 'Approving Tokens...' : lpStatus === 'adding' ? 'Adding Liquidity...' : 'Add Liquidity'}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}
