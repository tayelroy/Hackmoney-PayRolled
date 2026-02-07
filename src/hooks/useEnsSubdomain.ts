import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
import { PARENT_DOMAIN } from '@/contracts/ensContracts';

export interface UseEnsSubdomainResult {
    mintSubdomain: (label: string) => Promise<string | null>;
    loading: boolean;
    error: string | null;
}

/**
 * Hook to mint a subdomain under payrolled.eth
 * Uses backend signer (Supabase Edge Function) to sign the transaction
 */
export function useEnsSubdomain(): UseEnsSubdomainResult {
    const { address } = useAccount();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mintSubdomain = useCallback(async (label: string): Promise<string | null> => {
        if (!address) {
            setError('Wallet not connected');
            return null;
        }

        // Validate label
        const sanitizedLabel = label.toLowerCase().trim();
        if (!/^[a-z0-9-]+$/.test(sanitizedLabel)) {
            setError('Label can only contain lowercase letters, numbers, and hyphens');
            toast({
                title: 'Invalid Label',
                description: 'Label can only contain lowercase letters, numbers, and hyphens',
                variant: 'destructive',
            });
            return null;
        }

        if (sanitizedLabel.length < 3 || sanitizedLabel.length > 32) {
            setError('Label must be between 3 and 32 characters');
            toast({
                title: 'Invalid Label',
                description: 'Label must be between 3 and 32 characters',
                variant: 'destructive',
            });
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            toast({
                title: 'Minting Subdomain',
                description: `Creating ${sanitizedLabel}.${PARENT_DOMAIN}...`,
            });

            // Call the Supabase Edge Function
            const { data, error: fnError } = await supabase.functions.invoke('mint-subdomain', {
                body: {
                    label: sanitizedLabel,
                    ownerAddress: address,
                },
            });

            if (fnError) {
                throw new Error(fnError.message || 'Failed to mint subdomain');
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            const fullName = `${sanitizedLabel}.${PARENT_DOMAIN}`;

            // Save to localStorage so we can show "Set Primary Name" prompt
            if (address) {
                localStorage.setItem(`payrolled_pending_primary_${address}`, fullName);
            }

            toast({
                title: 'Success!',
                description: `Your subdomain ${fullName} has been created!`,
            });

            return fullName;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to mint subdomain';
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
    }, [address, toast]);

    return { mintSubdomain, loading, error };
}
