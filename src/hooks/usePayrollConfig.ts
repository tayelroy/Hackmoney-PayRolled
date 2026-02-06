import { usePublicClient, useEnsName, useEnsAvatar } from 'wagmi';
import { normalize } from 'viem/ens';
import { useState, useEffect } from 'react';

export interface PayrollConfig {
    preferredChainId: number | null;
    preferredCurrency: string;
    ensName: string | null;
    ensAvatar: string | null;
    loading: boolean;
}

export function usePayrollConfig(address: string | undefined): PayrollConfig {
    const { data: ensName } = useEnsName({ address: address as `0x${string}` | undefined });
    const { data: ensAvatar } = useEnsAvatar({ name: ensName || undefined });
    const publicClient = usePublicClient({ chainId: 11155111 }); // Sepolia for ENS lookup

    // Default State
    const [config, setConfig] = useState<PayrollConfig>({
        preferredChainId: null,
        preferredCurrency: 'USDC',
        ensName: null,
        ensAvatar: null,
        loading: true,
    });

    useEffect(() => {
        const fetchRecords = async () => {
            if (!publicClient || !ensName) {
                setConfig(prev => ({ ...prev, loading: false, ensName: ensName || null, ensAvatar: ensAvatar || null }));
                return;
            }

            try {
                // Fetch text records in parallel
                const [chainRecord, currencyRecord] = await Promise.all([
                    publicClient.getEnsText({ name: normalize(ensName), key: 'payroll.chain' }),
                    publicClient.getEnsText({ name: normalize(ensName), key: 'payroll.currency' })
                ]);

                setConfig({
                    preferredChainId: chainRecord ? parseInt(chainRecord) : null,
                    preferredCurrency: currencyRecord || 'USDC',
                    ensName,
                    ensAvatar: ensAvatar || null,
                    loading: false
                });

            } catch (e) {
                console.warn("Failed to fetch ENS payroll records", e);
                setConfig(prev => ({ ...prev, loading: false }));
            }
        };

        if (address) {
            fetchRecords();
        }
    }, [address, ensName, ensAvatar, publicClient]);

    return config;
}
