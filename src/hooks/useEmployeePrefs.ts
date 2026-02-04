import { useEnsName, useEnsText, useEnsAvatar } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useEffect, useState } from 'react';

export interface EmployeePrefs {
    ensName: string | null;
    ensAvatar: string | null;
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

    // 2a. Fetch ENS Avatar
    const { data: ensAvatar } = useEnsAvatar({
        name: normalizedName,
        chainId: sepolia.id,
        query: {
            enabled: !!normalizedName,
        }
    });

    // 2b. Fetch "payroll.chain" Text Record
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

    // ... logging effects ...

    // 4. Parse & Fallback Logic
    // Use raw ENS record if available ('11155111' -> Sepolia), otherwise default to Arc
    const preferredChain = chainRecord ? parseInt(chainRecord) : 5042002;

    // Use raw ENS record if available ('ETH'), otherwise default to USDC
    const preferredToken = tokenRecord || 'USDC';

    return {
        ensName,
        ensAvatar,
        preferredChain, // Raw Chain ID
        preferredToken, // Raw Token Symbol
        isLoading: nameLoading || (!!ensName && (chainLoading || tokenLoading)),
    };
}
