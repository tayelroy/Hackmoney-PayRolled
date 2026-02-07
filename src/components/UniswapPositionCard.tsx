import { Card } from '@/components/ui/card';
import { ArrowRightLeft, ArrowRight } from 'lucide-react';
// import { useAccount, useReadContract, useBalance } from 'wagmi';
// import { UNISWAP_V4_BASE_SEPOLIA, ERC20_ABI } from '@/lib/uniswap-v4';
// import { Skeleton } from '@/components/ui/skeleton';
// import { formatUnits } from 'viem';

interface UniswapPositionCardProps {
    onSwapClick: () => void;
    onAddLiquidityClick?: () => void;
}

export function UniswapPositionCard({ onSwapClick, onAddLiquidityClick }: UniswapPositionCardProps) {
    return (
        <Card
            className="p-8 h-full shadow-md hover:shadow-xl transition-all duration-300 border-[#cc5db3]/20 bg-gradient-to-br from-white to-[#cc5db3]/5 active:scale-[0.98] group cursor-pointer"
            onClick={onSwapClick}
        >
            <div className="flex flex-col h-full">
                <div className="p-3 bg-[#cc5db3]/10 rounded-xl text-[#cc5db3] w-fit mb-6 group-hover:bg-[#cc5db3] group-hover:text-white transition-colors">
                    <ArrowRightLeft className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Uniswap Auto-Invest</h3>
                <p className="text-sm text-slate-500 mb-6 flex-1">
                    Automatically swap your USDC payroll to ETH using Uniswap v4 pools.
                </p>
                <div className="flex items-center text-[#cc5db3] font-bold text-sm">
                    Start Investing <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Card>
    );
}

