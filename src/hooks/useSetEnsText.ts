import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { namehash, normalize } from 'viem/ens';
import { sepolia } from 'wagmi/chains';
import { ENS_RESOLVER_ABI, ENS_PUBLIC_RESOLVER_ADDRESS, ENS_REGISTRY_ABI, ENS_REGISTRY_ADDRESS } from '@/contracts/ensContracts';
import { useToast } from './use-toast';

export interface UseSetEnsTextResult {
    setTextRecord: (ensName: string, key: string, value: string) => Promise<`0x${string}` | null>;
    loading: boolean;
    error: string | null;
}

/**
 * Hook to update ENS text records
 * The user must own the ENS name to update its records
 */
export function useSetEnsText(): UseSetEnsTextResult {
    const { address } = useAccount();
    const publicClient = usePublicClient({ chainId: sepolia.id });
    const { data: walletClient } = useWalletClient({ chainId: sepolia.id });
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const setTextRecord = useCallback(async (
        ensName: string,
        key: string,
        value: string
    ): Promise<`0x${string}` | null> => {
        if (!address || !walletClient || !publicClient) {
            setError('Wallet not connected');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const normalizedName = normalize(ensName);
            const node = namehash(normalizedName);

            // First, get the resolver for this name
            const resolverAddress = await publicClient.readContract({
                address: ENS_REGISTRY_ADDRESS,
                abi: ENS_REGISTRY_ABI,
                functionName: 'resolver',
                args: [node]
            });

            // Use the name's resolver if set, otherwise use public resolver
            const targetResolver = resolverAddress !== '0x0000000000000000000000000000000000000000'
                ? resolverAddress
                : ENS_PUBLIC_RESOLVER_ADDRESS;

            // Send the setText transaction
            const hash = await walletClient.writeContract({
                address: targetResolver,
                abi: ENS_RESOLVER_ABI,
                functionName: 'setText',
                args: [node, key, value],
                chain: sepolia
            });

            toast({
                title: 'Transaction Sent',
                description: `Updating ${key} on ENS...`,
            });

            // Wait for confirmation
            await publicClient.waitForTransactionReceipt({ hash });

            toast({
                title: 'Success!',
                description: `ENS record "${key}" updated successfully.`,
            });

            return hash;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to update ENS record';
            setError(message);
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [address, walletClient, publicClient, toast]);

    return { setTextRecord, loading, error };
}
