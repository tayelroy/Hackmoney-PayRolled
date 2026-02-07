import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, ExternalLink } from 'lucide-react';
import { useAaveBalance } from '@/hooks/useAaveBalance';
import { Skeleton } from '@/components/ui/skeleton';

interface AavePositionCardProps {
    address: string | undefined;
    onDeposit: () => void;
}

export function AavePositionCard({ address, onDeposit }: AavePositionCardProps) {
    const { formattedBalance, isLoading } = useAaveBalance(address);

    const hasPosition = parseFloat(formattedBalance) > 0;

    return (
        <Card className="p-8 h-full hover:shadow-lg transition-all border-purple-100 bg-gradient-to-br from-white to-purple-50/20">
            <div className="flex flex-col h-full">
                <div className="p-3 bg-purple-100 rounded-xl text-purple-600 w-fit mb-6">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Aave Investments</h3>

                {isLoading ? (
                    <div className="space-y-2 mb-6">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                ) : hasPosition ? (
                    <div className="mb-6">
                        <p className="text-sm text-slate-500 mb-1">Your aUSDC Balance</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{parseFloat(formattedBalance).toFixed(2)}</span>
                            <span className="text-sm text-purple-600 font-medium">aUSDC</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">✓ Earning yield on Base Sepolia</p>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 mb-6 flex-1">
                        Deposit USDC directly to Aave and earn yield on your stablecoins.
                    </p>
                )}

                <div className="space-y-2 mt-auto">
                    <Button
                        onClick={onDeposit}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                        <Wallet className="mr-2 h-4 w-4" />
                        Deposit to Aave
                    </Button>

                    {hasPosition && (
                        <Button
                            variant="outline"
                            className="w-full"
                            asChild
                        >
                            <a
                                href={`https://staging.aave.com/?marketName=proto_base_v3&account=${address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View on Aave
                                <ExternalLink className="ml-2 h-3 w-3" />
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
