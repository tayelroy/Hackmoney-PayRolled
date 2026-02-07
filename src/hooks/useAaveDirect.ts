import { useState, useCallback } from 'react';
import { usePublicClient, useWalletClient, useAccount } from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';
import { AAVE_BASE_SEPOLIA, AAVE_POOL_ABI } from '@/lib/aave';
import { ERC20_ABI } from '@/lib/uniswap-v4'; // Reusing ERC20 ABI

export type AaveDepositStatus = 'idle' | 'approving' | 'depositing' | 'success' | 'error';

export function useAaveDirect() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();

    const [status, setStatus] = useState<AaveDepositStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const reset = useCallback(() => {
        setStatus('idle');
        setError(null);
        setTxHash(null);
    }, []);

    const depositToAave = useCallback(async (amount: string) => {
        if (!address || !walletClient || !publicClient) {
            setError('Wallet not connected');
            return;
        }

        setStatus('approving');
        setError(null);
        setTxHash(null);

        try {
            // 1. Check Allowance
            // Use the Aave-compatible USDC address
            const usdcAddress = AAVE_BASE_SEPOLIA.USDC as `0x${string}`;
            const poolAddress = AAVE_BASE_SEPOLIA.POOL as `0x${string}`;

            // Amount is already in human readable string, convert to bigint (6 decimals for USDC)
            // Wait, standard USDC is 6 decimals.
            // Let's assume input amount is like "10.5"
            const amountBigInt = parseUnits(amount, 6);

            const allowance = await publicClient.readContract({
                address: usdcAddress,
                abi: ERC20_ABI,
                functionName: 'allowance',
                args: [address, poolAddress],
            });

            if (allowance < amountBigInt) {
                console.log('[Aave] Approving USDC...');
                const hash = await walletClient.writeContract({
                    address: usdcAddress,
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [poolAddress, maxUint256],
                });
                await publicClient.waitForTransactionReceipt({ hash });
                console.log('[Aave] Approved.');
            }

            // 2. Supply to Aave Pool
            setStatus('depositing');
            console.log('[Aave] Supplying USDC...', { amount: amountBigInt.toString() });

            // supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)
            const hash = await walletClient.writeContract({
                address: poolAddress,
                abi: AAVE_POOL_ABI,
                functionName: 'supply',
                args: [usdcAddress, amountBigInt, address, 0],
            });

            console.log('[Aave] Supply Tx sent:', hash);
            setTxHash(hash);

            await publicClient.waitForTransactionReceipt({ hash });
            console.log('[Aave] Supply confirmed.');
            setStatus('success');

        } catch (err: any) {
            console.error('[Aave] Deposit failed:', err);
            setStatus('error');
            setError(err.message || 'Failed to deposit to Aave');
        }
    }, [address, walletClient, publicClient]);

    return {
        depositToAave,
        status,
        error,
        txHash,
        reset
    };
}
