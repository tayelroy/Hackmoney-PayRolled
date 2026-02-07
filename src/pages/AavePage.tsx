import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, Wallet, ArrowLeft, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS, formatCurrency } from '@/lib/index';
import { useAaveDirect } from '@/hooks/useAaveDirect';
import { useAaveBalance } from '@/hooks/useAaveBalance';
import { AAVE_BASE_SEPOLIA } from '@/lib/aave';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ERC20_ABI } from '@/lib/uniswap-v4';
import { formatUnits } from 'viem';

export default function AavePage() {
    const navigate = useNavigate();
    const { address, isConnected, chainId } = useAccount();
    const [amount, setAmount] = useState('');

    // Aave Hooks
    const { depositToAave, status, error: txError } = useAaveDirect();
    const { formattedBalance: aaveBalance, isLoading: aaveLoading, refetch: refetchAave } = useAaveBalance(address);

    // Wallet Balance (USDC)
    const { data: usdcBalanceRaw } = useReadContract({
        address: AAVE_BASE_SEPOLIA.USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: AAVE_BASE_SEPOLIA.CHAIN_ID,
    });

    const usdcBalanceFormatted = usdcBalanceRaw ? formatUnits(usdcBalanceRaw as bigint, 6) : '0.00';

    const handleDeposit = async () => {
        if (!amount || isNaN(Number(amount))) return;
        try {
            await depositToAave(amount, AAVE_BASE_SEPOLIA.USDC);
            setAmount('');
            refetchAave();
        } catch (e) {
            console.error(e);
        }
    };

    const handleMaxClick = () => {
        if (usdcBalanceRaw) {
            setAmount(formatUnits(usdcBalanceRaw as bigint, 6));
        }
    };

    if (!isConnected) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <p>Please connect your wallet to access Aave features.</p>
                </div>
            </Layout>
        );
    }

    const isWrongNetwork = chainId !== AAVE_BASE_SEPOLIA.CHAIN_ID;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(ROUTE_PATHS.PORTAL)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Aave Savings</h1>
                        <p className="text-muted-foreground">Earn passive yield on your stablecoins via Aave V3.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Deposit Form */}
                    <Card className="border-[#be95be]/20 bg-gradient-to-br from-white to-[#be95be]/5">
                        <CardHeader>
                            <CardTitle className="text-[#be95be] flex items-center gap-2">
                                <Wallet className="w-5 h-5" />
                                Deposit USDC
                            </CardTitle>
                            <CardDescription>
                                Supply USDC to the Aave V3 lending pool on Base Sepolia.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isWrongNetwork ? (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Wrong Network</AlertTitle>
                                    <AlertDescription>
                                        Please switch to Base Sepolia to interact with Aave.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Amount to Deposit</span>
                                            <span
                                                className="text-[#be95be] cursor-pointer hover:underline"
                                                onClick={handleMaxClick}
                                            >
                                                Balance: {usdcBalanceFormatted} USDC
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="text-lg"
                                            />
                                            <div className="w-20 font-bold text-slate-500">USDC</div>
                                        </div>
                                    </div>

                                    {txError && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{txError}</AlertDescription>
                                        </Alert>
                                    )}

                                    <Button
                                        onClick={handleDeposit}
                                        className="w-full bg-[#be95be] hover:bg-[#be95be]/90 text-white"
                                        disabled={!amount || status === 'approving' || status === 'depositing'}
                                    >
                                        {status === 'approving' ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Approving USDC...
                                            </>
                                        ) : status === 'depositing' ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Depositing...
                                            </>
                                        ) : (
                                            'Supply to Aave'
                                        )}
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats & Info */}
                    <div className="space-y-6">
                        {/* Current Position */}
                        <Card className="bg-[#be95be] text-white border-none shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white/90">
                                    <TrendingUp className="w-5 h-5" />
                                    Your Position
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    <p className="text-sm text-white/70">Total Supplied</p>
                                    {aaveLoading ? (
                                        <div className="h-10 w-32 bg-white/20 animate-pulse rounded" />
                                    ) : (
                                        <div className="text-4xl font-bold">
                                            {formatCurrency(parseFloat(aaveBalance), false)} <span className="text-lg font-normal opacity-80">aUSDC</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 pt-6 border-t border-white/20 flex justify-between items-center text-sm">
                                    <span className="text-white/80">Current APY</span>
                                    <span className="font-bold text-lg">~4.50%</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">About Aave V3</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <p>
                                    Aave is a decentralized non-custodial liquidity market protocol where users can participate as suppliers or borrowers.
                                </p>
                                <p>
                                    By supplying USDC, you receive aUSDC tokens that represent your deposit plus accrued interest.
                                </p>
                                <Button variant="outline" className="w-full" asChild>
                                    <a
                                        href={`https://staging.aave.com/?marketName=proto_base_v3&account=${address}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View on Aave Interface <ExternalLink className="w-4 h-4 ml-2" />
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
