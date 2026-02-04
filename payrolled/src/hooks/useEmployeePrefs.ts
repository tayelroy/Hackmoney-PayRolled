import { useEnsName, useEnsText } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useEffect, useState } from 'react';

export interface EmployeePrefs {
    ensName: string | null;
    preferredChain: number; // Chain ID (e.g., 8453 for Base)
    preferredToken: string; // Token Symbol or Address
    isLoading: boolean;
}

import { normalize } from 'viem/ens';
import { getAddress } from 'viem';

export function useEmployeePrefs(address: string | undefined) {
    // Ensure address is checksummed for ENS reverse lookup
    const formattedAddress = address ? address.startsWith('0x') ? getAddress(address) : undefined : undefined;

    // 1. Reverse Resolve: Get ENS Name from Address (Always on Sepolia)
    const { data: ensName, isLoading: nameLoading, error: nameError } = useEnsName({
        address: formattedAddress as `0x${string}`,
        chainId: sepolia.id,
        query: {
            enabled: !!formattedAddress,
        }
    });

    // Normalize name for text record lookup
    const normalizedName = ensName ? normalize(ensName) : undefined;

    // 2. Fetch "payroll.chain" Text Record
    const { data: chainRecord, isLoading: chainLoading, error: chainError } = useEnsText({
        name: normalizedName,
        key: 'payroll.chain',
        chainId: sepolia.id,
        query: {
            enabled: !!normalizedName,
        }
    });

    // 3. Fetch "payroll.token" Text Record
    const { data: tokenRecord, isLoading: tokenLoading, error: tokenError } = useEnsText({
        name: normalizedName,
        key: 'payroll.token',
        chainId: sepolia.id,
        query: {
            enabled: !!normalizedName,
        }
    });

    useEffect(() => {
        console.log('[useEmployeePrefs] Input Address:', address);
        console.log('[useEmployeePrefs] Formatted Address:', formattedAddress);
    }, [address, formattedAddress]);

    useEffect(() => {
        if (ensName) console.log('[useEmployeePrefs] Resolved ENS Name:', ensName);
        if (nameError) console.error('[useEmployeePrefs] Name Resolve Error:', nameError);
        if (nameLoading) console.log('[useEmployeePrefs] Name Loading...');
    }, [ensName, nameError, nameLoading]);

    useEffect(() => {
        if (normalizedName) console.log('[useEmployeePrefs] Normalized Name for lookup:', normalizedName);
    }, [normalizedName]);

    useEffect(() => {
        if (chainRecord) console.log('[useEmployeePrefs] Chain Record found:', chainRecord);
        if (chainError) console.error('[useEmployeePrefs] Chain Record Error:', chainError);
    }, [chainRecord, chainError]);

    useEffect(() => {
        if (tokenRecord) console.log('[useEmployeePrefs] Token Record found:', tokenRecord);
        if (tokenError) console.error('[useEmployeePrefs] Token Record Error:', tokenError);
    }, [tokenRecord, tokenError]);

    // 4. Parse & Fallback Logic
    // Use raw ENS record if available ('11155111' -> Sepolia), otherwise default to Arc
    const preferredChain = chainRecord ? parseInt(chainRecord) : 5042002;

    // Use raw ENS record if available ('ETH'), otherwise default to USDC
    const preferredToken = tokenRecord || 'USDC';

    useEffect(() => {
        console.log('[useEmployeePrefs] Final Preferences:', { ensName, preferredChain, preferredToken });
    }, [ensName, preferredChain, preferredToken]);

    return {
        ensName,
        preferredChain, // Raw Chain ID
        preferredToken, // Raw Token Symbol
        isLoading: nameLoading || (!!ensName && (chainLoading || tokenLoading)),
    };
}
