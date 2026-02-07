import { Card } from '@/components/ui/card';
import { TrendingUp, ArrowRight } from 'lucide-react';
// import { useAaveBalance } from '@/hooks/useAaveBalance'; // Balance check moved to modal or unused for now

interface AavePositionCardProps {
    address: string | undefined;
    onDeposit: () => void;
}

export function AavePositionCard({ address, onDeposit }: AavePositionCardProps) {
    // We don't need to fetch balance for the card cover anymore, keep it lightweight
    return (
        <Card
            className="p-8 h-full shadow-md hover:shadow-xl transition-all duration-300 border-[#be95be]/20 bg-gradient-to-br from-white to-[#be95be]/5 active:scale-[0.98] group cursor-pointer"
            onClick={onDeposit}
        >
            <div className="flex flex-col h-full">
                <div className="p-3 bg-[#be95be]/10 rounded-xl text-[#be95be] w-fit mb-6 group-hover:bg-[#be95be] group-hover:text-white transition-colors">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Aave Savings</h3>
                <p className="text-sm text-slate-500 mb-6 flex-1">
                    Deposit USDC directly to Aave to earn passive yield on your stablecoins.
                </p>
                <div className="flex items-center text-[#be95be] font-bold text-sm">
                    Start Saving <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Card>
    );
}
