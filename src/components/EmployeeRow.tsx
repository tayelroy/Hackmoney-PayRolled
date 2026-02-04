import { type Employee } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Wallet, Trash2, ExternalLink } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEmployeePrefs } from '@/hooks/useEmployeePrefs';

interface EmployeeRowProps {
    employee: Employee;
}

export function EmployeeRow({ employee }: EmployeeRowProps) {
    const {
        preferredChain,
        preferredToken,
        ensName,
        ensAvatar,
        isLoading: isLoadingPrefs
    } = useEmployeePrefs(employee.wallet_address);

    // Format currency
    const formattedSalary = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(employee.salary);

    // Helper for chain/token display
    const getChainName = (chainId: number) => {
        if (chainId === 11155111) return "Sepolia";
        if (chainId === 5042002) return "Arc Testnet";
        if (chainId === 8453) return "Base";
        return `Chain (${chainId})`;
    };

    const chainDisplay = isLoadingPrefs
        ? "Loading..."
        : `${getChainName(preferredChain)} • ${preferredToken || "USDC"}`;

    return (
        <Card className="p-4 flex items-center justify-between transition-all hover:shadow-md border-border/50">
            <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={ensAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.name}`} />
                    <AvatarFallback>{employee.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-medium flex items-center gap-2">
                        {employee.name}
                        {ensName && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-blue-200 text-blue-400">
                                {ensName}
                            </Badge>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        <span className="font-mono text-xs">
                            {employee.wallet_address.slice(0, 6)}...{employee.wallet_address.slice(-4)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Preference Badge */}
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">Preferences</span>
                    <Badge variant="secondary" className="font-normal">
                        {chainDisplay}
                    </Badge>
                </div>

                <div className="text-right">
                    <div className="text-sm text-muted-foreground">Salary</div>
                    <div className="font-bold">{formattedSalary}</div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(employee.wallet_address)}>
                            Copy Address
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <a href={`https://testnet.arcscan.app/address/${employee.wallet_address}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-3 w-3" />
                                View on Explorer
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-3 w-3" />
                            Remove Employee
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </Card>
    );
}

// Export default as named export is used
export default EmployeeRow;
