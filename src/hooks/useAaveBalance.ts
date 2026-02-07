import { useReadContract } from 'wagmi';
import { AAVE_BASE_SEPOLIA, AAVE_ATOKEN_ABI } from '@/lib/aave';
import { formatUnits } from 'viem';

export function useAaveBalance(address: string | undefined) {
    const { data: balance, isLoading, refetch } = useReadContract({
        address: AAVE_BASE_SEPOLIA.aUSDC as `0x${string}`,
        abi: AAVE_ATOKEN_ABI,
        functionName: 'balanceOf',
        args: address ? [address as `0x${string}`] : undefined,
        chainId: AAVE_BASE_SEPOLIA.CHAIN_ID,
        query: {
            enabled: !!address,
            refetchInterval: 10000, // Refetch every 10 seconds
        },
    });

    // Format balance (USDC has 6 decimals)
    const formattedBalance = balance ? formatUnits(balance as bigint, 6) : '0';

    return {
        balance: balance as bigint | undefined,
        formattedBalance,
        isLoading,
        refetch,
    };
}
